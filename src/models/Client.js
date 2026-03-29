export function Client(data = {}) {
  const client = {
    id: data.id || null,
    name: data.name || '',
    product: data.product || '',
    total: data.total || 0,
    paid: data.paid || 0,
    pending: data.pending || 0,
    status: data.status || 'Pendiente',
    daysLate: data.daysLate || 0,
    nextDate: data.nextDate || '',
    phone: data.phone || '',
    installments: data.installments || []
  };

  // Métodos usando function normal
  client.getDebtPercentage = function() {
    return client.total > 0 ? (client.pending / client.total) * 100 : 0;
  };

  client.isOverdue = function() {
    return client.status === 'En Mora' && client.daysLate > 0;
  };

  client.isSevereOverdue = function() {
    return client.isOverdue() && client.daysLate > 7;
  };

  client.isPendingApproval = function() {
    return client.status === 'Verificando';
  };

  client.validate = function() {
    const errors = [];
    
    if (!client.name.trim()) errors.push('El nombre es requerido');
    if (!client.product.trim()) errors.push('El producto es requerido');
    if (!client.phone.trim()) {
      errors.push('El teléfono es requerido');
    } else if (!/^\+?\d{7,15}$/.test(client.phone.replace(/\s/g, ''))) {
      errors.push('El teléfono debe tener un formato válido (ej: +1234567890)');
    }
    if (client.total < 0) errors.push('El total no puede ser negativo');
    if (client.paid < 0) errors.push('El pagado no puede ser negativo');
    if (client.pending < 0) errors.push('El pendiente no puede ser negativo');
    
    return errors;
  };

  client.updateStatus = function() {
    if (client.pending === 0) {
      client.status = 'Al Día';
      client.daysLate = 0;
    } else if (client.isSevereOverdue()) {
      client.status = 'En Mora';
    }
    
    return client.status;
  };

  client.formatCurrency = function(amount) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  client.getTotalFormatted = function() {
    return client.formatCurrency(client.total);
  };

  client.getPaidFormatted = function() {
    return client.formatCurrency(client.paid);
  };

  client.getPendingFormatted = function() {
    return client.formatCurrency(client.pending);
  };

  client.toJSON = function() {
    return {
      id: client.id,
      name: client.name,
      product: client.product,
      total: client.total,
      paid: client.paid,
      pending: client.pending,
      status: client.status,
      daysLate: client.daysLate,
      nextDate: client.nextDate,
      phone: client.phone,
      installments: client.installments
    };
  };

  return client;
}
