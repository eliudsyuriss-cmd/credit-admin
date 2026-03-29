import React, { useState, useEffect } from 'react';
import ClientModal from './ClientModal';
import ClientRegister from './ClientRegister';
import { LayoutDashboard, Users, CreditCard, Box, Bell, Search, AlertCircle, CheckCircle, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { ClientController } from './controllers/ClientController';
import { DebtController } from './controllers/DebtController';
import { DataService } from './services/DataService';
import { Client } from './models/Client';

export default function App() {
  // Estados de UI
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [clients, setClients] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showCashflowModal, setShowCashflowModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Inicialización de controllers
  const dataService = new DataService();
  const clientController = new ClientController(dataService);
  const debtController = new DebtController(dataService);

  // Observer pattern - manejo de cambios
  const appObserver = {
    onClientsLoaded: (clients) => {
      setClients(clients);
      debtController.setClients(clients);
      setLoading(false);
    },
    onClientUpdated: (client) => {
      setClients(prev => prev.map(c => c.id === client.id ? client : c));
      debtController.setClients(clients);
    },
    onClientCreated: (client) => {
      setClients(prev => [...prev, client]);
      debtController.setClients(clients);
    },
    onClientDeleted: (client) => {
      setClients(prev => prev.filter(c => c.id !== client.id));
      debtController.setClients(clients);
    },
    onPaymentApproved: ({ clientId }) => {
      const client = clientController.getClientById(clientId);
      if (client) {
        setSelectedClient(client);
      }
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const initializeApp = async () => {
      try {
        clientController.subscribe(appObserver);
        await clientController.loadClients();
      } catch (error) {
        console.error('Error initializing app:', error);
        setLoading(false);
      }
    };

    initializeApp();

    return () => {
      clientController.unsubscribe(appObserver);
    };
  }, []);

  // Resetear paginación al cambiar filtros
  React.useEffect(() => {
    setCurrentPage(1);
    setExpandedRow(null);
  }, [searchTerm, filterStatus]);

  // Métodos de negocio (delegados a controllers)
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleApprovePayment = async (clientId, installmentId) => {
    try {
      await clientController.approvePayment(clientId, installmentId);
      alert('Pago aprobado exitosamente');
    } catch (error) {
      alert(`Error al aprobar pago: ${error.message}`);
    }
  };

  const handleApprove = async (clientId) => {
    try {
      const client = clientController.getClientById(clientId);
      if (client && client.isPendingApproval()) {
        const pendingInstallments = client.installments.filter(i => i.isPendingApproval());
        if (pendingInstallments.length > 0) {
          await handleApprovePayment(clientId, pendingInstallments[0].id);
        }
      }
    } catch (error) {
      alert(`Error al aprobar: ${error.message}`);
    }
  };

  const handleWhatsapp = (name) => {
    alert(`Enviando recordatorio automático por WhatsApp a ${name}.`);
  };

  const handleJumpToDebtor = (debtorId) => {
    setSearchTerm('');
    setFilterStatus('Todos');
    setExpandedRow(debtorId);
    setShowApprovalModal(false);

    setTimeout(() => {
      const index = clients.findIndex(d => d.id === debtorId);
      if (index !== -1) {
        const page = Math.floor(index / itemsPerPage) + 1;
        setCurrentPage(page);
        
        const table = document.querySelector('.table-container');
        if (table) {
          table.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  };

  // Obtener datos filtrados y paginados
  const getFilteredClients = () => {
    let filtered = clients;

    if (searchTerm) {
      filtered = clientController.searchClients(searchTerm);
    }

    if (filterStatus !== 'Todos') {
      filtered = filtered.filter(client => client.status === filterStatus);
    }

    return filtered;
  };

  const getPaginatedData = () => {
    const filtered = getFilteredClients();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      clients: filtered.slice(startIndex, endIndex),
      totalItems: filtered.length,
      currentPage,
      itemsPerPage,
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    };
  };

  // Estadísticas (delegadas a controllers)
  const statistics = clientController.getStatistics();
  const cashflow = debtController.calculateCashflow();
  const alerts = debtController.getAlerts();

  const paginatedData = getPaginatedData();

  // Formateo de moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--bg-main)',
        color: 'var(--text-main)'
      }}>
        <div>Cargando sistema...</div>
      </div>
    );
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= paginatedData.totalPages) {
      setCurrentPage(newPage);
      setExpandedRow(null);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
    setExpandedRow(null);
  };

  const handleRegisterClient = async (newClient) => {
    try {
      const clientData = {
        name: `${newClient.nombres} ${newClient.apellidos}`,
        phone: newClient.telefono,
        product: '-',
        total: 0,
        paid: 0,
        pending: 0,
        status: 'Nuevo',
        daysLate: 0,
        nextDate: '-',
        installments: [],
        extra: {
          identificacion: newClient.identificacion,
          direccion: newClient.direccion,
          genero: newClient.genero
        }
      };

      await clientController.createClient(clientData);
      alert('Cliente registrado exitosamente');
    } catch (error) {
      alert(`Error al registrar cliente: ${error.message}`);
    }
  };

  const handleSearchClient = (term) => {
    const found = clientController.searchClients(term);
    if (found.length > 0) {
      setSelectedClient(found[0]);
    } else {
      alert('Cliente no encontrado');
    }
  };

  return (
    <div className="layout">
      {/* El formulario y el modal de clientes solo deben mostrarse en la sección de clientes */}
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <Zap className="logo-icon" size={24} />
          <h2>VELOCITY ELITE</h2>
        </div>
        <nav className="nav-menu">
          <a href="#" className={`nav-item${activeScreen === 'dashboard' ? ' active' : ''}`} onClick={() => setActiveScreen('dashboard')}><LayoutDashboard size={20}/> Dashboard</a>
          <a href="#" className={`nav-item${activeScreen === 'clientes' ? ' active' : ''}`} onClick={() => setActiveScreen('clientes')}><Users size={20}/> Clientes</a>
          <a href="#" className="nav-item"><CreditCard size={20}/> Créditos</a>
          <a href="#" className="nav-item"><Box size={20}/> Inventario</a>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {activeScreen === 'dashboard' && (
          <>
            <header className="top-bar">
              <div className="search-box">
                <Search size={18} className="search-icon"/>
                <input 
                  type="text" 
                  placeholder="Buscar cliente o producto..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="user-profile">
                <Bell size={20} className="icon-bell"/>
                <div className="avatar">A</div>
                <span>Gerencia</span>
              </div>
            </header>
            <section className="dashboard-content">
              <div className="header-title">
                <h1>Control de Créditos y Cobranzas</h1>
                <p>Monitoreo en tiempo real de cuentas por cobrar para Fase 1.</p>
              </div>
              {/* STATS CARDS */}
              <div className="stats-grid">
                <div className="stat-card glass box-mora">
                  <h3>En Mora Severa (&gt; 7 días)</h3>
                  <h2>{formatCurrency(statistics.severeOverdueAmount)}</h2>
                  <span className="trend negative">Crítico</span>
                </div>
                <div className="stat-card glass box-verificacion cursor-pointer-box" onClick={() => setShowApprovalModal(true)}>
                  <h3>Pendiente de Aprobar (Hoy)</h3>
                  <h2>{formatCurrency(statistics.totalDebt * 0.1)}</h2>
                  <span className="trend neutral">Acción Requerida - Ver Detalles</span>
                </div>
                <div className="stat-card glass box-total cursor-pointer-box" onClick={() => setShowCashflowModal(true)}>
                  <h3>Total por Cobrar</h3>
                  <h2>{formatCurrency(statistics.totalDebt)}</h2>
                  <span className="trend positive">Proyección</span>
                </div>
                <div className="stat-card glass box-pendientes">
                  <h3>Clientes Totales</h3>
                  <h2>{statistics.total}</h2>
                  <span className="trend neutral">Activos</span>
                </div>
              </div>
              {/* MAIN DATA TABLE */}
              <div className="table-container glass">
                <div className="table-header-row">
                  <h3>Listado de Clientes y Cuotas</h3>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <select 
                      className="filter-select select-pagination"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="Todos">Todos los Estados</option>
                      <option value="Al Día">Al Día</option>
                      <option value="Verificando">Verificando</option>
                      <option value="En Mora">En Mora</option>
                      <option value="Mora Severa">Mora Severa (&gt; 7 días)</option>
                    </select>
                    <button className="btn-primary">Exportar Reporte</button>
                  </div>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Modelo</th>
                      <th>Deuda Restante</th>
                      <th>Estado</th>
                      <th>Vencimiento</th>
                      <th>Acciones Administrativas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.clients.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No se encontraron clientes que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    )}
                    {paginatedData.clients.map(client => {
                      const clientModel = client;
                      return (
                        <React.Fragment key={clientModel.id}>
                          <tr className="cursor-pointer hover-bg" onClick={() => toggleRow(clientModel.id)}>
                            <td className="font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {expandedRow === clientModel.id ? <ChevronUp size={16} className="text-gray" /> : <ChevronDown size={16} className="text-gray" />}
                              <span style={{ textDecoration: 'underline', color: '#007bff', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setSelectedClient(clientModel); }}>
                                {clientModel.name}
                              </span>
                            </td>
                            <td className="text-gray">{clientModel.product}</td>
                            <td className="font-mono font-medium">{formatCurrency(clientModel.pending)}</td>
                            <td>
                              {clientModel.status === 'En Mora' && <span className="badge badge-mora"><AlertCircle size={14}/> Mora ({clientModel.daysLate}d)</span>}
                              {clientModel.status === 'Verificando' && <span className="badge badge-verificacion"><Clock size={14}/> Validar</span>}
                              {clientModel.status === 'Al Día' && <span className="badge badge-aldia"><CheckCircle size={14}/> Al Día</span>}
                            </td>
                            <td>{clientModel.nextDate}</td>
                            <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                              {clientModel.isPendingApproval() && (
                                <button className="btn-action btn-approve" onClick={() => handleApprove(clientModel.id)}>Aprobar Recibo</button>
                              )}
                              {clientModel.isOverdue() && (
                                <button className="btn-action btn-whatsapp" onClick={() => handleWhatsapp(clientModel.name)}>Notificar WhatsApp</button>
                              )}
                            </td>
                          </tr>
                          {expandedRow === clientModel.id && (
                            <tr className="expanded-row-content">
                              <td colSpan="6">
                                <div className="installments-container">
                                  <h4>Desglose de Cuotas</h4>
                                  <table className="installments-table">
                                    <thead>
                                      <tr>
                                        <th>Nº Cuota</th>
                                        <th>Monto</th>
                                        <th>Vencimiento</th>
                                        <th>Fecha Pago</th>
                                        <th>Estado</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {clientModel.installments.map((inst, idx) => (
                                        <tr key={inst.id}>
                                          <td>Cuota {idx + 1}</td>
                                          <td className="font-mono">{formatCurrency(inst.amount)}</td>
                                          <td>{inst.dueDate}</td>
                                          <td>{inst.paymentDate || '-'}</td>
                                          <td>
                                            <span className={`badge badge-${inst.status.toLowerCase().replace(' ', '')}`}>
                                              {inst.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                {/* Controles de Paginación */}
                <div className="pagination-container">
                  <div className="pagination-info">
                    Mostrando {paginatedData.totalItems > 0 ? ((paginatedData.currentPage - 1) * paginatedData.itemsPerPage) + 1 : 0} a {Math.min(paginatedData.currentPage * paginatedData.itemsPerPage, paginatedData.totalItems)} de {paginatedData.totalItems} clientes
                  </div>
                  <div className="pagination-controls">
                    <button 
                      className="btn-pagination" 
                      onClick={() => handlePageChange(paginatedData.currentPage - 1)}
                      disabled={paginatedData.currentPage === 1}
                    >
                      Anterior
                    </button>
                    <span className="pagination-current">
                      Página {paginatedData.currentPage} de {paginatedData.totalPages}
                    </span>
                    <button 
                      className="btn-pagination" 
                      onClick={() => handlePageChange(paginatedData.currentPage + 1)}
                      disabled={paginatedData.currentPage === paginatedData.totalPages}
                    >
                      Siguiente
                    </button>
                  </div>
                  <div className="items-per-page">
                    <select 
                      value={itemsPerPage} 
                      onChange={handleItemsPerPageChange}
                      className="select-pagination"
                    >
                      <option value={5}>5 por página</option>
                      <option value={10}>10 por página</option>
                      <option value={20}>20 por página</option>
                      <option value={50}>50 por página</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
        {activeScreen === 'clientes' && (
          <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
            <ClientRegister onRegister={handleRegisterClient} onSearch={handleSearchClient} />
            <ClientModal 
              client={selectedClient} 
              onClose={() => setSelectedClient(null)} 
              onApprovePayment={handleApprovePayment}
              onSendWhatsApp={handleWhatsapp}
            />
          </div>
        )}
      </main>

      {/* MODAL FLUJO DE CAJA */}
      {showCashflowModal && (
        <div className="modal-overlay" onClick={() => setShowCashflowModal(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Proyección de Flujo de Caja</h3>
              <button className="btn-close" onClick={() => setShowCashflowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="cashflow-item">
                <h4>Semanal (0-7 días)</h4>
                <p className="cashflow-amount">{formatCurrency(cashflow.weekly)}</p>
              </div>
              <div className="cashflow-item">
                <h4>Quincenal (8-15 días)</h4>
                <p className="cashflow-amount">{formatCurrency(cashflow.biweekly)}</p>
              </div>
              <div className="cashflow-item">
                <h4>Mensual (16-30 días)</h4>
                <p className="cashflow-amount">{formatCurrency(cashflow.monthly)}</p>
              </div>
              <div className="cashflow-item">
                <h4>Bimestral (31-60 días)</h4>
                <p className="cashflow-amount">{formatCurrency(cashflow.bimonthly)}</p>
              </div>
              <div className="cashflow-item">
                <h4>Trimestral (61-90 días)</h4>
                <p className="cashflow-amount">{formatCurrency(cashflow.trimonthly)}</p>
              </div>
              <div className="cashflow-total">
                <h4>Total Proyectado</h4>
                <p className="cashflow-amount total">{formatCurrency(cashflow.total)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APROBACIONES */}
      {showApprovalModal && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pagos Pendientes de Aprobación</h3>
              <button className="btn-close" onClick={() => setShowApprovalModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {alerts.filter(a => a.type === 'pending_approval').length > 0 ? (
                <div>
                  <p>Hay {alerts.filter(a => a.type === 'pending_approval')[0].count} pagos pendientes de aprobación.</p>
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      setShowApprovalModal(false);
                      // Navegar al primer cliente pendiente
                      const pendingClients = clients.filter(c => c.isPendingApproval());
                      if (pendingClients.length > 0) {
                        setSelectedClient(pendingClients[0]);
                        setActiveScreen('dashboard');
                      }
                    }}
                  >
                    Revisar Pagos
                  </button>
                </div>
              ) : (
                <p>No hay pagos pendientes de aprobación en este momento.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CLIENT MODAL */}
      <ClientModal 
        client={selectedClient} 
        onClose={() => setSelectedClient(null)} 
        onApprovePayment={handleApprovePayment}
        onSendWhatsApp={handleWhatsapp}
      />
    </div>
  );
}
