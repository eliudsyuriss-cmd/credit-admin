import { Installment } from '../models/Installment';

export class DebtController {
  constructor(dataService) {
    this.dataService = dataService;
    this.clients = [];
    this.observers = [];
  }

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

  setClients(clients) {
    this.clients = clients;
  }

  // Cálculo de flujo de caja
  calculateCashflow(period = 'all', customDate = null) {
    const today = customDate || new Date(2026, 2, 27); // Fecha base del proyecto
    
    const periods = {
      weekly: { start: 0, end: 7 },
      biweekly: { start: 7, end: 15 },
      monthly: { start: 15, end: 30 },
      bimonthly: { start: 30, end: 60 },
      trimonthly: { start: 60, end: 90 }
    };

    const cashflow = {
      weekly: 0,
      biweekly: 0,
      monthly: 0,
      bimonthly: 0,
      trimonthly: 0,
      total: 0
    };

    this.clients.forEach(client => {
      client.installments.forEach(installment => {
        if (installment.status === Installment().STATUSES.PENDIENTE) {
          const dueDate = this.parseDate(installment.dueDate);
          if (!dueDate) return;

          const diffTime = dueDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= 0) {
            if (diffDays <= periods.weekly.end) {
              cashflow.weekly += installment.amount;
            } else if (diffDays <= periods.biweekly.end) {
              cashflow.biweekly += installment.amount;
            } else if (diffDays <= periods.monthly.end) {
              cashflow.monthly += installment.amount;
            } else if (diffDays <= periods.bimonthly.end) {
              cashflow.bimonthly += installment.amount;
            } else if (diffDays <= periods.trimonthly.end) {
              cashflow.trimonthly += installment.amount;
            }
          }
        }
      });
    });

    cashflow.total = cashflow.weekly + cashflow.biweekly + cashflow.monthly + 
                    cashflow.bimonthly + cashflow.trimonthly;

    return period === 'all' ? cashflow : cashflow[period] || 0;
  }

  // Análisis de morosidad
  getOverdueAnalysis() {
    const overdueClients = this.clients.filter(client => client.isOverdue());
    const severeOverdueClients = this.clients.filter(client => client.isSevereOverdue());

    const overdueByDays = {};
    overdueClients.forEach(client => {
      const daysRange = this.getDaysRange(client.daysLate);
      overdueByDays[daysRange] = (overdueByDays[daysRange] || 0) + 1;
    });

    const overdueAmount = overdueClients.reduce((sum, client) => sum + client.pending, 0);
    const severeOverdueAmount = severeOverdueClients.reduce((sum, client) => sum + client.pending, 0);

    return {
      totalOverdue: overdueClients.length,
      severeOverdue: severeOverdueClients.length,
      overdueAmount,
      severeOverdueAmount,
      overdueByDays,
      averageOverdueDays: overdueClients.length > 0 
        ? overdueClients.reduce((sum, client) => sum + client.daysLate, 0) / overdueClients.length 
        : 0
    };
  }

  getDaysRange(days) {
    if (days <= 7) return '1-7 días';
    if (days <= 15) return '8-15 días';
    if (days <= 30) return '16-30 días';
    if (days <= 60) return '31-60 días';
    return '60+ días';
  }

  // Pagos pendientes de aprobación
  getPendingApprovals() {
    const pendingApprovals = [];

    this.clients.forEach(client => {
      client.installments.forEach(installment => {
        if (installment.isPendingApproval()) {
          pendingApprovals.push({
            clientId: client.id,
            clientName: client.name,
            installmentId: installment.id,
            amount: installment.amount,
            dueDate: installment.dueDate,
            daysOverdue: installment.getDaysOverdue()
          });
        }
      });
    });

    return pendingApprovals.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  // Proyecciones de cobranza
  getCollectionProjections(months = 3) {
    const projections = [];
    const today = new Date();

    for (let i = 0; i < months; i++) {
      const projectionDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = projectionDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      
      const monthProjection = this.calculateMonthlyProjection(projectionDate);
      
      projections.push({
        month: monthName,
        projectedAmount: monthProjection,
        confidence: this.calculateConfidence(monthProjection)
      });
    }

    return projections;
  }

  calculateMonthlyProjection(date) {
    let projectedAmount = 0;
    const year = date.getFullYear();
    const month = date.getMonth();

    this.clients.forEach(client => {
      client.installments.forEach(installment => {
        if (installment.status === Installment().STATUSES.PENDIENTE) {
          const dueDate = this.parseDate(installment.dueDate);
          if (dueDate && dueDate.getFullYear() === year && dueDate.getMonth() === month) {
            projectedAmount += installment.amount;
          }
        }
      });
    });

    return projectedAmount;
  }

  calculateConfidence(amount) {
    if (amount === 0) return 0;
    if (amount < 1000) return 0.9;
    if (amount < 5000) return 0.8;
    return 0.7;
  }

  // Alertas y notificaciones
  getAlerts() {
    const alerts = [];

    // Clientes en mora severa
    const severeOverdueClients = this.clients.filter(client => client.isSevereOverdue());
    if (severeOverdueClients.length > 0) {
      alerts.push({
        type: 'severe_overdue',
        message: `${severeOverdueClients.length} clientes en mora severa (>7 días)`,
        count: severeOverdueClients.length,
        priority: 'high'
      });
    }

    // Pagos por aprobar
    const pendingApprovals = this.getPendingApprovals();
    if (pendingApprovals.length > 0) {
      alerts.push({
        type: 'pending_approval',
        message: `${pendingApprovals.length} pagos pendientes de aprobación`,
        count: pendingApprovals.length,
        priority: 'medium'
      });
    }

    // Próximos vencimientos
    const upcomingDue = this.getUpcomingDueDates(3);
    if (upcomingDue.length > 0) {
      alerts.push({
        type: 'upcoming_due',
        message: `${upcomingDue.length} pagos vencen en los próximos 3 días`,
        count: upcomingDue.length,
        priority: 'low'
      });
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  getUpcomingDueDates(days = 3) {
    const today = new Date();
    const upcoming = [];

    this.clients.forEach(client => {
      client.installments.forEach(installment => {
        if (installment.isPending()) {
          const dueDate = this.parseDate(installment.dueDate);
          if (dueDate) {
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 0 && diffDays <= days) {
              upcoming.push({
                clientId: client.id,
                clientName: client.name,
                installmentId: installment.id,
                amount: installment.amount,
                dueDate: installment.dueDate,
                daysUntilDue: diffDays
              });
            }
          }
        }
      });
    });

    return upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }

  // Utilidades
  parseDate(dateString) {
    if (!dateString || dateString === '-') return null;
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    return new Date(year, month - 1, day);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Reportes
  generateDebtReport() {
    const stats = this.getStatistics();
    const cashflow = this.calculateCashflow();
    const overdueAnalysis = this.getOverdueAnalysis();
    const alerts = this.getAlerts();

    return {
      generatedAt: new Date().toISOString(),
      statistics: stats,
      cashflow,
      overdueAnalysis,
      alerts,
      recommendations: this.generateRecommendations(stats, overdueAnalysis, alerts)
    };
  }

  generateRecommendations(stats, overdueAnalysis, alerts) {
    const recommendations = [];

    if (overdueAnalysis.severeOverdue > 0) {
      recommendations.push({
        type: 'action',
        message: 'Contactar inmediatamente a clientes en mora severa',
        priority: 'high'
      });
    }

    if (alerts.some(a => a.type === 'pending_approval')) {
      recommendations.push({
        type: 'process',
        message: 'Revisar y aprobar pagos pendientes',
        priority: 'medium'
      });
    }

    if (stats.totalDebt > 10000) {
      recommendations.push({
        type: 'strategy',
        message: 'Considerar plan de pagos para deudas grandes',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  getStatistics() {
    const totalClients = this.clients.length;
    const totalDebt = this.clients.reduce((sum, client) => sum + client.pending, 0);
    const overdueClients = this.clients.filter(client => client.isOverdue()).length;
    const severeOverdueClients = this.clients.filter(client => client.isSevereOverdue()).length;

    return {
      totalClients,
      totalDebt,
      overdueClients,
      severeOverdueClients,
      overduePercentage: totalClients > 0 ? (overdueClients / totalClients) * 100 : 0
    };
  }
}
