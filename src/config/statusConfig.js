// Single source of truth for status colours, labels and editable option lists across
// badges, tables, charts and status dropdowns — guarantees a status is always the same
// colour everywhere in the app.

const STATUS_COLORS = {
  // Shipments
  created: '#3b82f6', // blue — registered, awaiting action
  loading: '#f59e0b', // amber — in progress
  loaded: '#f59e0b',
  in_transit: '#8b5cf6', // violet — on the road
  arrived: '#06b6d4', // cyan — at destination
  unloading: '#f59e0b',
  unloaded: '#06b6d4',
  delivered: '#2fb170', // green — done
  exception: '#e0271b', // red — attention
  // Supply orders
  draft: '#9aa0ac',
  registered: '#3b82f6',
  in_production: '#f59e0b',
  partially_dispatched: '#06b6d4',
  completed: '#2fb170',
  cancelled: '#e0271b',
  // Deliveries
  pending: '#f59e0b',
  acknowledged: '#3b82f6',
  // Invoices
  pending_approval: '#f59e0b',
  approved: '#3b82f6',
  sent: '#06b6d4',
  partially_paid: '#f59e0b',
  paid: '#2fb170',
  overdue: '#e0271b',
  // Frames / component readiness
  verified: '#3b82f6',
  ready: '#2fb170',
  dispatched: '#06b6d4',
  // Fitting
  in_progress: '#f59e0b',
  approved: '#2fb170',
  // Quality inspection
  passed: '#2fb170',
  conditional: '#f59e0b',
  // Generic
  rejected: '#e0271b',
  failed: '#e0271b',
  scheduled: '#3b82f6',
};

const FALLBACK_COLOR = '#9aa0ac';

export function statusColor(status) {
  return STATUS_COLORS[status] || FALLBACK_COLOR;
}

export function statusLabel(status) {
  return String(status).replace(/_/g, ' ');
}

export function withAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const SHIPMENT_STATUSES = ['created', 'loading', 'loaded', 'in_transit', 'arrived', 'unloading', 'unloaded', 'delivered', 'exception'];
export const SUPPLY_ORDER_STATUSES = ['draft', 'registered', 'in_production', 'partially_dispatched', 'completed', 'cancelled'];
export const DELIVERY_STATUSES = ['pending', 'delivered', 'acknowledged'];
export const INVOICE_STATUSES = ['draft', 'pending_approval', 'approved', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'];
export const READINESS_STATUSES = ['pending', 'verified', 'ready', 'dispatched'];

export const SHIPMENT_STATUS_ORDER = SHIPMENT_STATUSES;
