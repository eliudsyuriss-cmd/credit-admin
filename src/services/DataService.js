// DataService.js - Simulación de capa de datos
// En producción, esto se conectaría a una API real

export class DataService {
  constructor() {
    this.clients = [];
    this.nextId = 1;
    this.nextInstallmentId = 1;
    this.initializeMockData();
  }

  // Datos mock iniciales (extraídos del App.jsx original)
  initializeMockData() {
    const baseDebtors = [
      { 
        id: 1, name: "Carlos Torres", product: "AXON FLUX", total: 295, paid: 150, pending: 145, status: "En Mora", daysLate: 4, nextDate: "22/03/2026", phone: "+12345678",
        installments: [
          { id: 101, amount: 150, dueDate: "22/02/2026", status: "Pagado", paymentDate: "20/02/2026" },
          { id: 102, amount: 72.5, dueDate: "22/03/2026", status: "En Mora", paymentDate: "-" },
          { id: 103, amount: 72.5, dueDate: "22/04/2026", status: "Pendiente", paymentDate: "-" }
        ]
      },
      { 
        id: 2, name: "Ana María Reyes", product: "PHANTOM CORE 01", total: 380, paid: 100, pending: 280, status: "Verificando", daysLate: 0, nextDate: "Hoy", phone: "+87654321",
        installments: [
          { id: 201, amount: 100, dueDate: "20/02/2026", status: "Pagado", paymentDate: "18/02/2026" },
          { id: 202, amount: 140, dueDate: "22/03/2026", status: "Verificando", paymentDate: "22/03/2026" },
          { id: 203, amount: 140, dueDate: "22/04/2026", status: "Pendiente", paymentDate: "-" }
        ]
      },
      { 
        id: 3, name: "Julio Sánchez", product: "AERO RUNNER X", total: 295, paid: 295, pending: 0, status: "Al Día", daysLate: 0, nextDate: "-", phone: "+33333333",
        installments: [
          { id: 301, amount: 145, dueDate: "10/01/2026", status: "Pagado", paymentDate: "10/01/2026" },
          { id: 302, amount: 150, dueDate: "10/02/2026", status: "Pagado", paymentDate: "09/02/2026" }
        ]
      },
      { 
        id: 4, name: "Elena Gómez", product: "NOVA TRAIL", total: 260, paid: 0, pending: 260, status: "En Mora", daysLate: 15, nextDate: "12/03/2026", phone: "+99999999",
        installments: [
          { id: 401, amount: 130, dueDate: "12/03/2026", status: "En Mora", paymentDate: "-" },
          { id: 402, amount: 130, dueDate: "12/04/2026", status: "Pendiente", paymentDate: "-" }
        ]
      }
    ];

    // Generar 45 clientes de prueba para paginación
    const initialDebtors = Array.from({ length: 45 }, (_, i) => ({
      ...baseDebtors[i % 4],
      id: i + 1,
      name: `${baseDebtors[i % 4].name.split(' ')[0]} ${i + 1}`
    }));

    this.clients = initialDebtors;
    this.nextId = Math.max(...this.clients.map(c => c.id)) + 1;
    this.nextInstallmentId = Math.max(...this.clients.flatMap(c => c.installments.map(i => i.id))) + 1;
  }

  // Simulación de latencia de red
  async delay(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Métodos CRUD para Clientes
  async getClients() {
    await this.delay(50);
    return [...this.clients];
  }

  async getClientById(id) {
    await this.delay(30);
    const client = this.clients.find(c => c.id === id);
    return client ? { ...client } : null;
  }

  async saveClient(clientData) {
    await this.delay(100);
    
    const newClient = {
      ...clientData,
      id: this.nextId++
    };

    this.clients.push(newClient);
    return { ...newClient };
  }

  async updateClient(id, updates) {
    await this.delay(80);
    
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Cliente no encontrado');
    }

    this.clients[index] = { ...this.clients[index], ...updates };
    return { ...this.clients[index] };
  }

  async deleteClient(id) {
    await this.delay(60);
    
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Cliente no encontrado');
    }

    const deletedClient = this.clients.splice(index, 1)[0];
    return { ...deletedClient };
  }

  // Métodos para Cuotas
  async getInstallments(clientId) {
    await this.delay(40);
    
    const client = this.clients.find(c => c.id === clientId);
    return client ? [...client.installments] : [];
  }

  async saveInstallment(clientId, installmentData) {
    await this.delay(70);
    
    const client = this.clients.find(c => c.id === clientId);
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    const newInstallment = {
      ...installmentData,
      id: this.nextInstallmentId++,
      clientId
    };

    client.installments.push(newInstallment);
    return { ...newInstallment };
  }

  async updateInstallment(clientId, installmentId, updates) {
    await this.delay(60);
    
    const client = this.clients.find(c => c.id === clientId);
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    const installmentIndex = client.installments.findIndex(i => i.id === installmentId);
    if (installmentIndex === -1) {
      throw new Error('Cuota no encontrada');
    }

    client.installments[installmentIndex] = { 
      ...client.installments[installmentIndex], 
      ...updates 
    };

    return { ...client.installments[installmentIndex] };
  }

  async deleteInstallment(clientId, installmentId) {
    await this.delay(50);
    
    const client = this.clients.find(c => c.id === clientId);
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    const installmentIndex = client.installments.findIndex(i => i.id === installmentId);
    if (installmentIndex === -1) {
      throw new Error('Cuota no encontrada');
    }

    const deletedInstallment = client.installments.splice(installmentIndex, 1)[0];
    return { ...deletedInstallment };
  }

  // Métodos de búsqueda y filtrado
  async searchClients(query) {
    await this.delay(40);
    
    if (!query.trim()) return [...this.clients];
    
    const searchTerm = query.toLowerCase();
    return this.clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm) ||
      client.product.toLowerCase().includes(searchTerm) ||
      client.phone.includes(searchTerm)
    );
  }

  async filterClientsByStatus(status) {
    await this.delay(30);
    
    if (status === 'Todos') return [...this.clients];
    return this.clients.filter(client => client.status === status);
  }

  // Métodos de reportes y estadísticas
  async getStatistics() {
    await this.delay(20);
    
    const total = this.clients.length;
    const overdue = this.clients.filter(c => c.status === 'En Mora').length;
    const severeOverdue = this.clients.filter(c => c.status === 'En Mora' && c.daysLate > 7).length;
    const pendingApproval = this.clients.filter(c => c.status === 'Verificando').length;
    const upToDate = this.clients.filter(c => c.status === 'Al Día').length;

    const totalDebt = this.clients.reduce((sum, c) => sum + c.pending, 0);
    const severeOverdueAmount = this.clients
      .filter(c => c.status === 'En Mora' && c.daysLate > 7)
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

  // Métodos de exportación
  async exportClients(format = 'json') {
    await this.delay(200);
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(this.clients, null, 2);
      case 'csv':
        return this.convertToCSV(this.clients);
      default:
        throw new Error('Formato no soportado');
    }
  }

  convertToCSV(clients) {
    const headers = ['ID', 'Nombre', 'Producto', 'Total', 'Pagado', 'Pendiente', 'Estado', 'Días Mora', 'Próxima Fecha', 'Teléfono'];
    const rows = clients.map(client => [
      client.id,
      client.name,
      client.product,
      client.total,
      client.paid,
      client.pending,
      client.status,
      client.daysLate,
      client.nextDate,
      client.phone
    ]);

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }

  // Métodos de backup y restauración
  async backup() {
    await this.delay(100);
    return {
      timestamp: new Date().toISOString(),
      clients: [...this.clients],
      metadata: {
        totalClients: this.clients.length,
        nextId: this.nextId,
        nextInstallmentId: this.nextInstallmentId
      }
    };
  }

  async restore(backupData) {
    await this.delay(150);
    
    if (!backupData.clients || !Array.isArray(backupData.clients)) {
      throw new Error('Datos de backup inválidos');
    }

    this.clients = [...backupData.clients];
    this.nextId = backupData.metadata?.nextId || Math.max(...this.clients.map(c => c.id)) + 1;
    this.nextInstallmentId = backupData.metadata?.nextInstallmentId || 
      Math.max(...this.clients.flatMap(c => c.installments.map(i => i.id))) + 1;

    return true;
  }

  // Método para limpiar datos (testing)
  async clearAll() {
    await this.delay(50);
    this.clients = [];
    this.nextId = 1;
    this.nextInstallmentId = 1;
    return true;
  }

  // Método para reiniciar datos mock
  async resetToMock() {
    await this.delay(100);
    this.clients = [];
    this.nextId = 1;
    this.nextInstallmentId = 1;
    this.initializeMockData();
    return [...this.clients];
  }
}
