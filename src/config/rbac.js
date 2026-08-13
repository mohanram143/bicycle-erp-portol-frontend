// Role → allowed pages. Used by the sidebar (hide what you can't see) and by the
// route guard (redirect if you land on a page outside your role).
export const ALL_PAGES = [
  { to: '/dashboard', label: 'Operational Dashboard' },
  { to: '/supply-orders', label: 'Supply Orders' },
  { to: '/shipments', label: 'Transportation' },
  { to: '/deliveries', label: 'Deliveries' },
  { to: '/fitting', label: 'Bicycle Fitting' },
  { to: '/quality-inspection', label: 'Quality Inspection' },
  { to: '/service-camps', label: 'Service Camps' },
  { to: '/documents', label: 'Document Repository' },
  { to: '/invoices', label: 'Invoicing & Payments' },
  { to: '/reports', label: 'Reports & MIS' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/users', label: 'User Management' },
];

export const ROLE_PAGES = {
  super_admin: ['/dashboard', '/supply-orders', '/shipments', '/deliveries', '/fitting', '/quality-inspection', '/service-camps', '/documents', '/invoices', '/reports', '/notifications', '/users'],
  admin: ['/dashboard', '/supply-orders', '/shipments', '/deliveries', '/fitting', '/quality-inspection', '/service-camps', '/documents', '/invoices', '/reports', '/notifications', '/users'],
  factory_user: ['/dashboard', '/supply-orders', '/quality-inspection', '/documents', '/notifications'],
  transport_user: ['/dashboard', '/shipments', '/deliveries', '/service-camps', '/notifications'],
  government: ['/dashboard', '/supply-orders', '/shipments', '/deliveries', '/documents', '/reports', '/notifications'],
  state_officer: ['/dashboard', '/supply-orders', '/shipments', '/deliveries', '/documents', '/reports', '/notifications'],
  site_supervisor: ['/dashboard', '/shipments', '/deliveries', '/fitting', '/service-camps', '/notifications'],
  fitter: ['/dashboard', '/deliveries', '/fitting', '/notifications'],
  quality_inspector: ['/dashboard', '/supply-orders', '/quality-inspection', '/documents', '/notifications'],
  finance_officer: ['/dashboard', '/invoices', '/reports', '/notifications'],
};

export function canAccess(role, path) {
  const allowed = ROLE_PAGES[role] || [];
  return allowed.includes(path);
}

export function pagesForRole(role) {
  const allowed = ROLE_PAGES[role] || [];
  return ALL_PAGES.filter((p) => allowed.includes(p.to));
}