import React from "react";
import { Client } from './models/Client';
import { Installment } from './models/Installment';

export default function ClientModal({ client, onClose, onApprovePayment, onSendWhatsApp }) {
  if (!client) return null;

  // Convertir datos a modelo Client si no lo es ya
  const clientModel = client instanceof Client ? client : new Client(client);

  const handleApprovePayment = async (installmentId) => {
    if (onApprovePayment) {
      await onApprovePayment(clientModel.id, installmentId);
    }
  };

  const handleWhatsApp = () => {
    if (onSendWhatsApp) {
      onSendWhatsApp(clientModel.name);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" style={{ borderTop: '3px solid var(--neon-cyan)', minWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: 'rgba(0,240,255,0.05)', borderRadius: '12px 12px 0 0' }}>
          <h3 style={{ color: 'var(--neon-cyan)', letterSpacing: 1 }}>Ficha del Cliente</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <div style={{ padding: '32px 32px 16px 32px' }}>
            <h2 style={{ color: 'var(--neon-cyan)', fontWeight: 700, marginBottom: 4 }}>{clientModel.name}</h2>
            <div style={{ color: 'var(--text-muted)', marginBottom: 18, fontSize: '1rem' }}>{clientModel.product}</div>
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 18 }}>
              {[ 
                { label: 'Teléfono:', value: <span style={{ color: 'var(--text-main)' }}>{clientModel.phone}</span> },
                { label: 'Estado:', value: <span className={`badge badge-${clientModel.status.toLowerCase().replace(' ', '')}`}>{clientModel.status}</span> },
                { label: 'Deuda Total:', value: <span style={{ color: 'var(--neon-cyan)' }}>{clientModel.getTotalFormatted()}</span> },
                { label: 'Pagado:', value: <span style={{ color: 'var(--neon-green)' }}>{clientModel.getPaidFormatted()}</span> },
                { label: 'Pendiente:', value: <span style={{ color: 'var(--neon-red)' }}>{clientModel.getPendingFormatted()}</span> },
                { label: 'Próxima Fecha de Pago:', value: <span style={{ color: 'var(--text-main)' }}>{clientModel.nextDate}</span> },
                { label: 'Días de Mora:', value: <span style={{ color: clientModel.daysLate > 0 ? 'var(--neon-red)' : 'var(--text-main)' }}>{clientModel.daysLate}</span> }
              ].map((item, idx, arr) => (
                <React.Fragment key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    {item.value}
                  </div>
                  {idx < arr.length - 1 && (
                    <div style={{ borderBottom: '1.5px solid var(--neon-cyan)', margin: '0 0 0 0', width: '100%', opacity: 0.5 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button 
                className="btn btn-primary" 
                onClick={handleWhatsApp}
                style={{ 
                  background: 'var(--neon-green)', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Enviar WhatsApp
              </button>
              {clientModel.isPendingApproval() && (
                <button 
                  className="btn btn-warning" 
                  onClick={() => {
                    const pendingInstallments = clientModel.installments.filter(i => {
                      const installment = i instanceof Installment ? i : new Installment(i);
                      return installment.isPendingApproval();
                    });
                    if (pendingInstallments.length > 0) {
                      handleApprovePayment(pendingInstallments[0].id);
                    }
                  }}
                  style={{ 
                    background: 'var(--neon-yellow)', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: '6px',
                    color: 'black',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  Aprobar Pago
                </button>
              )}
            </div>
          </div>
          <div style={{ background: 'rgba(0,240,255,0.03)', borderTop: '1px solid var(--glass-border)', padding: 24, borderRadius: '0 0 12px 12px' }}>
            <h4 style={{ color: 'var(--neon-cyan)', marginBottom: 12, textTransform: 'uppercase', fontSize: '1rem', letterSpacing: 1 }}>Historial de Cuotas</h4>
            <table className="installments-table">
              <thead>
                <tr>
                  <th>Nº Cuota</th>
                  <th>Monto</th>
                  <th>Vencimiento</th>
                  <th>Fecha Pago</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientModel.installments.map((inst, idx) => {
                  const installment = inst instanceof Installment ? inst : new Installment(inst);
                  return (
                    <tr key={installment.id}>
                      <td>Cuota {idx + 1}</td>
                      <td className="font-mono">{installment.getAmountFormatted()}</td>
                      <td>{installment.dueDate}</td>
                      <td>{installment.paymentDate || '-'}</td>
                      <td>
                        <span className={`badge badge-${installment.status.toLowerCase().replace(' ', '')}`}>
                          {installment.status}
                        </span>
                      </td>
                      <td>
                        {installment.isPendingApproval() && (
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => handleApprovePayment(installment.id)}
                            style={{
                              background: 'var(--neon-green)',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            Aprobar
                          </button>
                        )}
                        {installment.isOverdue() && (
                          <button 
                            className="btn btn-sm btn-warning"
                            onClick={handleWhatsApp}
                            style={{
                              background: 'var(--neon-yellow)',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              color: 'black',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            Recordar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
