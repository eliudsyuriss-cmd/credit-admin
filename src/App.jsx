import React, { useState } from 'react';
import { LayoutDashboard, Users, CreditCard, Box, Bell, Search, AlertCircle, CheckCircle, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react';

// --- MOCK DATA PARA LA DEMOSTRACIÓN ---
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
  },
];

// Generar 45 clientes de prueba para mostrar la paginación
const initialDebtors = Array.from({ length: 45 }, (_, i) => ({
  ...baseDebtors[i % 4],
  id: i + 1,
  name: `${baseDebtors[i % 4].name.split(' ')[0]} ${i + 1}`
}));

export default function App() {
  const [debtors, setDebtors] = useState(initialDebtors);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showCashflowModal, setShowCashflowModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleApprove = (id) => {
    // Simular que un gerente aprobó un pago subido
    alert(`Aprobando comprobante para el crédito #${id}. El cliente pasará a "Al Día" y se actualizará el saldo.`);
    setDebtors(debtors.map(d => d.id === id ? { ...d, status: 'Al Día', paid: d.paid + 50, pending: d.pending - 50 } : d));
  };

  const handleWhatsapp = (name) => {
    alert(`Enviando recordatorio automático por WhatsApp a ${name}.`);
  };

  const totalCobrar = debtors.reduce((acc, curr) => acc + curr.pending, 0);

  // Totales dinámicos tarjetas superiores
  const moraSeveraDebtors = debtors.filter(d => d.status === 'En Mora' && d.daysLate > 7);
  const moraSeveraAmount = moraSeveraDebtors.reduce((acc, curr) => acc + curr.pending, 0);

  const pendingApprovalDebtors = debtors.filter(d => d.status === 'Verificando');
  let pendingApprovalAmount = 0;
  pendingApprovalDebtors.forEach(d => {
    d.installments.forEach(inst => {
      if (inst.status === 'Verificando') {
        pendingApprovalAmount += inst.amount;
      }
    });
  });

  const handleJumpToDebtor = (debtorId) => {
    setSearchTerm('');
    setFilterStatus('Todos');
    setExpandedRow(debtorId);
    setShowApprovalModal(false);

    setTimeout(() => {
      const index = debtors.findIndex(d => d.id === debtorId);
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

  // Proyección de Flujo de Caja
  const calculateCashflow = () => {
    // Usamos una fecha dummy acorde a nuestra data en base
    const today = new Date(2026, 2, 27); 
    let weekly = 0;
    let biweekly = 0;
    let monthly = 0;
    let bimonthly = 0;
    let trimonthly = 0;

    debtors.forEach(d => {
      d.installments.forEach(inst => {
        if (inst.status === 'Pendiente') {
          const parts = inst.dueDate.split('/'); // DD/MM/YYYY
          if(parts.length === 3) {
            const dueDate = new Date(parts[2], parseInt(parts[1]) - 1, parts[0]);
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= 7) weekly += inst.amount;
            else if (diffDays > 7 && diffDays <= 15) biweekly += inst.amount;
            else if (diffDays > 15 && diffDays <= 30) monthly += inst.amount;
            else if (diffDays > 30 && diffDays <= 60) bimonthly += inst.amount;
            else if (diffDays > 60 && diffDays <= 90) trimonthly += inst.amount;
          }
        }
      });
    });

    return { weekly, biweekly, monthly, bimonthly, trimonthly };
  };

  const cashflow = calculateCashflow();

  // Lógica de Filtros
  const filteredDebtors = debtors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.product.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'Mora Severa') {
      matchesStatus = d.status === 'En Mora' && d.daysLate > 7;
    } else if (filterStatus !== 'Todos') {
      matchesStatus = d.status === filterStatus;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Cálculos de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDebtors = filteredDebtors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDebtors.length / itemsPerPage);

  // Resetear paginación al cambiar filtros
  React.useEffect(() => {
    setCurrentPage(1);
    setExpandedRow(null);
  }, [searchTerm, filterStatus]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setExpandedRow(null);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
    setExpandedRow(null);
  };

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <Zap className="logo-icon" size={24} />
          <h2>VELOCITY ELITE</h2>
        </div>
        <nav className="nav-menu">
          <a href="#" className="nav-item active"><LayoutDashboard size={20}/> Dashboard</a>
          <a href="#" className="nav-item"><Users size={20}/> Clientes</a>
          <a href="#" className="nav-item"><CreditCard size={20}/> Créditos</a>
          <a href="#" className="nav-item"><Box size={20}/> Inventario</a>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
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
              <h3>En Mora Severa ( &gt; 7 días)</h3>
              <h2>${moraSeveraAmount.toFixed(2)}</h2>
              <span className="trend negative">Crítico</span>
            </div>
            <div className="stat-card glass box-verificacion cursor-pointer-box" onClick={() => setShowApprovalModal(true)}>
              <h3>Pendiente de Aprobar (Hoy)</h3>
              <h2>${pendingApprovalAmount.toFixed(2)}</h2>
              <span className="trend neutral">Acción Requerida - Ver Detalles</span>
            </div>
            <div className="stat-card glass box-total cursor-pointer-box" onClick={() => setShowCashflowModal(true)}>
              <h3>Total en la Calle (Por Cobrar)</h3>
              <h2>${totalCobrar.toFixed(2)}</h2>
              <span className="trend positive">Flujo de Caja - Ver Resumen</span>
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
                {currentDebtors.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No se encontraron clientes que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                )}
                {currentDebtors.map(debtor => (
                  <React.Fragment key={debtor.id}>
                    <tr className="cursor-pointer hover-bg" onClick={() => toggleRow(debtor.id)}>
                      <td className="font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {expandedRow === debtor.id ? <ChevronUp size={16} className="text-gray" /> : <ChevronDown size={16} className="text-gray" />}
                        {debtor.name}
                      </td>
                      <td className="text-gray">{debtor.product}</td>
                      <td className="font-mono font-medium">${debtor.pending.toFixed(2)}</td>
                      <td>
                        {debtor.status === 'En Mora' && <span className="badge badge-mora"><AlertCircle size={14}/> Mora ({debtor.daysLate}d)</span>}
                        {debtor.status === 'Verificando' && <span className="badge badge-verificacion"><Clock size={14}/> Validar</span>}
                        {debtor.status === 'Al Día' && <span className="badge badge-aldia"><CheckCircle size={14}/> Al Día</span>}
                      </td>
                      <td>{debtor.nextDate}</td>
                      <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                        {debtor.status === 'Verificando' && (
                          <button className="btn-action btn-approve" onClick={() => handleApprove(debtor.id)}>Aprobar Recibo</button>
                        )}
                        {debtor.status === 'En Mora' && (
                          <button className="btn-action btn-whatsapp" onClick={() => handleWhatsapp(debtor.name)}>Notificar WhatsApp</button>
                        )}
                      </td>
                    </tr>
                    {expandedRow === debtor.id && (
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
                                {debtor.installments.map((inst, idx) => (
                                  <tr key={inst.id}>
                                    <td>Cuota {idx + 1}</td>
                                    <td className="font-mono">${inst.amount.toFixed(2)}</td>
                                    <td>{inst.dueDate}</td>
                                    <td>{inst.paymentDate}</td>
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
                ))}
              </tbody>
            </table>
            
            {/* Controles de Paginación */}
            <div className="pagination-container">
              <div className="pagination-info">
                Mostrando {filteredDebtors.length > 0 ? indexOfFirstItem + 1 : 0} a {Math.min(indexOfLastItem, filteredDebtors.length)} de {filteredDebtors.length} clientes
              </div>
              <div className="pagination-controls">
                <button 
                  className="btn-pagination" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>
                <span className="pagination-page">Página {currentPage} de {totalPages}</span>
                <button 
                  className="btn-pagination" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Siguiente
                </button>
              </div>
              <div className="pagination-size">
                <label>Mostrar: </label>
                <select value={itemsPerPage} onChange={handleItemsPerPageChange} className="select-pagination">
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </section>
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
                <span className="cashflow-label">Próximos 7 días (Semanal)</span>
                <span className="cashflow-amount">${cashflow.weekly.toFixed(2)}</span>
              </div>
              <div className="cashflow-item">
                <span className="cashflow-label">Próximos 15 días (Quincenal)</span>
                <span className="cashflow-amount">${cashflow.biweekly.toFixed(2)}</span>
              </div>
              <div className="cashflow-item">
                <span className="cashflow-label">Próximos 30 días (Mensual)</span>
                <span className="cashflow-amount">${cashflow.monthly.toFixed(2)}</span>
              </div>
              <div className="cashflow-item">
                <span className="cashflow-label">Próximos 60 días (Bimestral)</span>
                <span className="cashflow-amount">${cashflow.bimonthly.toFixed(2)}</span>
              </div>
              <div className="cashflow-item">
                <span className="cashflow-label">Próximos 90 días (Trimestral)</span>
                <span className="cashflow-amount">${cashflow.trimonthly.toFixed(2)}</span>
              </div>
              <div className="cashflow-total-info">
                * Cálculo basado en cuotas pendientes y sus fechas de vencimiento.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENDIENTE APROBAR */}
      {showApprovalModal && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--neon-orange)' }}>Pendientes de Aprobar</h3>
              <button className="btn-close" onClick={() => setShowApprovalModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {pendingApprovalDebtors.length > 0 ? pendingApprovalDebtors.map(d => (
                <div 
                  key={d.id} 
                  className="cashflow-item cursor-pointer-box" 
                  onClick={() => handleJumpToDebtor(d.id)} 
                  style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span className="cashflow-label" style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>{d.name}</span>
                    <span className="cashflow-amount" style={{ fontSize: '1.15rem', color: 'var(--neon-orange)' }}>${d.pending.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{d.product}</span>
                    <span style={{ color: 'var(--neon-orange)', fontStyle: 'italic' }}>Haz clic para revisar</span>
                  </div>
                </div>
              )) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No hay recibos pendientes por aprobar.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
