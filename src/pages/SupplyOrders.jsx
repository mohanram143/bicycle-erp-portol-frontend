import React, { useEffect, useState } from 'react';
import { api } from '../api/axiosClient.js';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusSelect from '../components/StatusSelect.jsx';
import StatCard from '../components/StatCard.jsx';
import AddOrderModal from '../components/forms/AddOrderModal.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useStatusUpdate } from '../hooks/useStatusUpdate.js';
import { SUPPLY_ORDER_STATUSES } from '../config/statusConfig.js';

const CAN_EDIT_STATUS = ['super_admin', 'admin', 'factory_user'];

export default function SupplyOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const { toast, show } = useToast();
  const { busyId, commit } = useStatusUpdate(show);

  const canEditStatus = CAN_EDIT_STATUS.includes(user?.role);

  const load = () => {
    setLoading(true);
    api.get('/supply-orders?limit=200').then((res) => setOrders(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateStatus = (row, status) => commit({
    endpoint: `/supply-orders/${row._id}/status`,
    id: row._id,
    next: status,
    rows: orders,
    setRows: setOrders,
    itemLabel: `Order ${row.orderNumber}`,
  });

  const [confirmRow, setConfirmRow] = useState(null);

  const handleDelete = (row) => setConfirmRow(row);
  const confirmDelete = () => {
    if (!confirmRow) return;
    api.delete(`/supply-orders/${confirmRow._id}`).then(() => { show('Supply order deleted'); setConfirmRow(null); load(); }).catch((err) => { show(err.response?.data?.message || 'Delete failed', 'danger'); setConfirmRow(null); });
  };
  const cancelDelete = () => setConfirmRow(null);

  const columns = [
    { key: 'orderNumber', header: 'Order #' },
    { key: 'state', header: 'State' },
    { key: 'orderedQuantity', header: 'Ordered Qty' },
    { key: 'allocatedQuantity', header: 'Allocated Qty' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    ...(canEditStatus ? [{
      key: 'updateStatus', header: 'Update Status',
      render: (r) => <StatusSelect value={r.status} options={SUPPLY_ORDER_STATUSES} busy={busyId === r._id} onChange={(s) => updateStatus(r, s)} />,
    }] : []),
    {
      key: 'actions', header: '',
      render: (r) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {canEditStatus && (
            <>
              <button className="icon-btn" title="EDIT" aria-label="Edit order" onClick={() => setEditingOrder(r)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
              </button>
              <button className="icon-btn danger" title="DELETE" aria-label="Delete order" onClick={() => handleDelete(r)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const totalQty = orders.reduce((s, o) => s + (o.orderedQuantity || 0), 0);
  const active = orders.filter((o) => ['registered', 'in_production'].includes(o.status)).length;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Supply Orders</h1>
          <p className="page-sub">Registered POs, tenders and allocations by state</p>
        </div>
        <button className="btn" onClick={() => setEditingOrder({})}>+ Add New</button>
      </div>
      <div className="grid-stats">
        <StatCard label="Total Orders" value={orders.length} />
        <StatCard label="Active Orders" value={active} />
        <StatCard label="Units Ordered" value={totalQty.toLocaleString('en-IN')} />
      </div>
      {loading ? <div style={{ color: 'var(--color-text-dim)' }}>Loading…</div> : <DataTable columns={columns} rows={orders} />}
      <AddOrderModal open={!!editingOrder} initial={editingOrder} onClose={() => setEditingOrder(null)} onCreated={() => { show('Supply order saved'); load(); }} />
      <ConfirmDialog open={!!confirmRow} title="Delete this supply order?" message="This cannot be undone." onConfirm={confirmDelete} onClose={cancelDelete} confirmLabel="DELETE" cancelLabel="Cancel" />
      <Toast toast={toast} />
    </>
  );
}