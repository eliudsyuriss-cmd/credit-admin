export function Installment(data = {}) {
  const installment = {
    id: data.id || null,
    amount: data.amount || 0,
    dueDate: data.dueDate || '',
    status: data.status || 'Pendiente',
    paymentDate: data.paymentDate || '',
    clientId: data.clientId || null,

    // Estados posibles
    STATUSES: {
      PENDIENTE: 'Pendiente',
      PAGADO: 'Pagado',
      EN_MORA: 'En Mora',
      VERIFICANDO: 'Verificando'
    }
  };

  // Métodos de estado
  installment.isPaid = function() {
    return installment.status === installment.STATUSES.PAGADO;
  };

  installment.isPending = function() {
    return installment.status === installment.STATUSES.PENDIENTE;
  };

  installment.isOverdue = function() {
    return installment.status === installment.STATUSES.EN_MORA;
  };

  installment.isPendingApproval = function() {
    return installment.status === installment.STATUSES.VERIFICANDO;
  };

  // Cálculo de días de mora
  installment.getDaysOverdue = function() {
    if (!installment.isOverdue()) return 0;
    
    const today = new Date();
    const dueDate = installment.parseDate(installment.dueDate);
    
    if (!dueDate) return 0;
    
    const diffTime = today - dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Parseo de fechas (formato DD/MM/YYYY)
  installment.parseDate = function(dateString) {
    try {
      if (!dateString || dateString === '-') return null;
      
      const parts = dateString.split('/');
      if (parts.length !== 3) return null;
      
      const [day, month, year] = parts.map(Number);
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      
      // Validar rangos básicos
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null;
      
      return new Date(year, month - 1, day);
    } catch (error) {
      console.warn('Error parsing date:', dateString, error);
      return null;
    }
  };

  // Formato de fecha
  installment.formatDate = function(dateString) {
    const date = installment.parseDate(dateString);
    if (!date) return dateString;
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Validaciones
  installment.validate = function() {
    const errors = [];
    
    if (installment.amount <= 0) errors.push('El monto debe ser mayor a 0');
    if (!installment.dueDate.trim()) errors.push('La fecha de vencimiento es requerida');
    if (!installment.parseDate(installment.dueDate)) errors.push('La fecha de vencimiento no es válida');
    
    // Validar que el estado sea uno de los permitidos
    const validStatuses = Object.values(installment.STATUSES);
    if (!validStatuses.includes(installment.status)) {
      errors.push('El estado no es válido');
    }
    
    return errors;
  };

  // Actualizar estado según fecha
  installment.updateStatus = function() {
    const today = new Date();
    const dueDate = installment.parseDate(installment.dueDate);
    
    if (!dueDate || installment.isPaid() || installment.isPendingApproval()) {
      return installment.status;
    }
    
    if (today > dueDate) {
      installment.status = installment.STATUSES.EN_MORA;
    }
    
    return installment.status;
  };

  // Formateo de moneda
  installment.formatCurrency = function(amount) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  installment.getAmountFormatted = function() {
    return installment.formatCurrency(installment.amount);
  };

  // Obtener clase CSS para el badge
  installment.getStatusBadgeClass = function() {
    const statusClasses = {
      [installment.STATUSES.PENDIENTE]: 'badge-pendiente',
      [installment.STATUSES.PAGADO]: 'badge-pagado',
      [installment.STATUSES.EN_MORA]: 'badge-mora',
      [installment.STATUSES.VERIFICANDO]: 'badge-verificando'
    };
    
    return statusClasses[installment.status] || 'badge-default';
  };

  // Método para convertir a objeto plano
  installment.toJSON = function() {
    return {
      id: installment.id,
      amount: installment.amount,
      dueDate: installment.dueDate,
      status: installment.status,
      paymentDate: installment.paymentDate,
      clientId: installment.clientId
    };
  };

  return installment;
}
