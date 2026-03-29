import { Client } from '../models/Client';
import { Installment } from '../models/Installment';

export class ClientController {
  constructor(dataService) {
    this.dataService = dataService;
    this.clients = [];
    this.observers = [];
  }

  // Patrón Observer para notificar cambios
  subscribe(observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notify(event, data) {
    this.observers.forEach(observer => {
      if (observer[event]) {
        observer[event](data);
      }
    });
  }

  // Inicialización
  async loadClients() {
    try {
      const clientsData = await this.dataService.getClients();
      this.clients = clientsData.map(data => Client(data));
      this.notify('onClientsLoaded', this.clients);
      return this.clients;
    } catch (error) {
      console.error('Error loading clients:', error);
      throw error;
    }
  }

  // CRUD Operations
  async createClient(clientData) {
    try {
      const client = Client(clientData);
      const errors = client.validate();

      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      const savedClient = await this.dataService.saveClient(client.toJSON());
      this.clients.push(savedClient);
      this.notify('onClientCreated', savedClient);

      return savedClient;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  async updateClient(clientId, updates) {
    try {
      const clientIndex = this.clients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) {
        throw new Error('Cliente no encontrado');
      }

      const currentClient = this.clients[clientIndex];
      const updatedData = { ...currentClient, ...updates };
      const updatedClient = Client(updatedData);

      const errors = updatedClient.validate();
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      updatedClient.updateStatus();
      const savedClient = await this.dataService.updateClient(clientId, updatedClient.toJSON());
      this.clients[clientIndex] = savedClient;

      this.notify('onClientUpdated', savedClient);
      return savedClient;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  async deleteClient(clientId) {
    try {
      const clientIndex = this.clients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) {
        throw new Error('Cliente no encontrado');
      }

      await this.dataService.deleteClient(clientId);
      const deletedClient = this.clients.splice(clientIndex, 1)[0];

      this.notify('onClientDeleted', deletedClient);
      return deletedClient;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  // Búsqueda y filtros
  getClientById(clientId) {
    return this.clients.find(c => c.id === clientId) || null;
  }

  searchClients(query) {
    if (!query.trim()) return this.clients;

    const searchTerm = query.toLowerCase();
    return this.clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm) ||
      client.product.toLowerCase().includes(searchTerm) ||
      client.phone.includes(searchTerm)
    );
  }

  filterByStatus(status) {
    if (status === 'Todos') return this.clients;
    return this.clients.filter(client => client.status === status);
  }

  filterByDateRange(startDate, endDate) {
    return this.clients.filter(client => {
      const nextDate = client.parseDate ? client.parseDate(client.nextDate) : null;
      if (!nextDate) return false;

      return nextDate >= startDate && nextDate <= endDate;
    });
  }

  // Operaciones de negocio
  async approvePayment(clientId, installmentId) {
    try {
      const client = this.getClientById(clientId);
      if (!client) {
        throw new Error('Cliente no encontrado');
      }

      const installment = client.installments.find(i => i.id === installmentId);
      if (!installment) {
        throw new Error('Cuota no encontrada');
      }

      // Actualizar estado de la cuota
      installment.status = Installment().STATUSES.PAGADO;
      installment.paymentDate = new Date().toLocaleDateString('es-ES');

      // Recalcular totales del cliente
      const paidAmount = client.installments
        .filter(i => i.status === Installment().STATUSES.PAGADO)
        .reduce((sum, i) => sum + i.amount, 0);

      const pendingAmount = client.installments
        .filter(i => i.status !== Installment().STATUSES.PAGADO)
        .reduce((sum, i) => sum + i.amount, 0);

      await this.updateClient(clientId, {
        paid: paidAmount,
        pending: pendingAmount,
        installments: client.installments
      });

      this.notify('onPaymentApproved', { clientId, installmentId });
      return true;
    } catch (error) {
      console.error('Error approving payment:', error);
      throw error;
    }
  }

  // Estadísticas y reportes
  getStatistics() {
    const total = this.clients.length;
    const overdue = this.clients.filter(c => c.isOverdue()).length;
    const severeOverdue = this.clients.filter(c => c.isSevereOverdue()).length;
    const pendingApproval = this.clients.filter(c => c.isPendingApproval()).length;
    const upToDate = this.clients.filter(c => c.status === 'Al Día').length;

    const totalDebt = this.clients.reduce((sum, c) => sum + c.pending, 0);
    const severeOverdueAmount = this.clients
      .filter(c => c.isSevereOverdue())
      .reduce((sum, c) => sum + c.pending, 0);

    return {
      total,
      overdue,
      severeOverdue,
      pendingApproval,
      upToDate,
      totalDebt,
      severeOverdueAmount,
      overduePercentage: total > 0 ? (overdue / total) * 100 : 0,
      severeOverduePercentage: total > 0 ? (severeOverdue / total) * 100 : 0
    };
  }

  // Paginación
  getPaginatedClients(page = 1, itemsPerPage = 10, filters = {}) {
    let filteredClients = this.clients;

    // Aplicar filtros
    if (filters.search) {
      filteredClients = this.searchClients(filters.search);
    }
    if (filters.status && filters.status !== 'Todos') {
      filteredClients = filteredClients.filter(c => c.status === filters.status);
    }

    // Paginación
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedClients = filteredClients.slice(startIndex, endIndex);

    return {
      clients: paginatedClients,
      totalItems: filteredClients.length,
      currentPage: page,
      itemsPerPage,
      totalPages: Math.ceil(filteredClients.length / itemsPerPage)
    };
  }
}
