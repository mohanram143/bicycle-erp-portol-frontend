import React, { useEffect, useState } from 'react';
import { api } from '../api/axiosClient.js';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusSelect from '../components/StatusSelect.jsx';
import StatCard from '../components/StatCard.jsx';
import AddDeliveryModal from '../components/forms/AddDeliveryModal.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { downloadResource } from '../api/download.js';
import { useAuthStore } from '../store/authStore.js';
import { useStatusUpdate } from '../hooks/useStatusUpdate.js';
import { DELIVERY_STATUSES } from '../config/statusConfig.js';

const CAN_EDIT_STATUS = ['super_admin', 'admin', 'transport_user', 'site_supervisor'];

export default function Deliveries() {
  const { user } = useAuthStore();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const { toast, show } = useToast();
  const { busyId, commit } = useStatusUpdate(show);

  const canEditStatus = CAN_EDIT_STATUS.includes(user?.role);

  const load = () => {
    setLoading(true);
    api.get('/deliveries?limit=200').then((res) => setDeliveries(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateStatus = (row, status) => commit({
    endpoint: `/deliveries/${row._id}/status`,
    id: row._id,
    next: status,
    rows: deliveries,
    setRows: setDeliveries,
    itemLabel: `Delivery ${row.challanNumber || row.school}`,
  });

  const [confirmRow, setConfirmRow] = useState(null);

  const handleDelete = (row) => {
    // open confirm modal for row
    setConfirmRow(row);
  };

  const confirmDelete = () => {
    if (!confirmRow) return;
    api.delete(`/deliveries/${confirmRow._id}`).then(() => { show('Delivery deleted'); setConfirmRow(null); load(); }).catch((err) => { show(err.response?.data?.message || 'Delete failed', 'danger'); setConfirmRow(null); });
  };

  const cancelDelete = () => setConfirmRow(null);

  const columns = [
    { key: 'school', header: 'School' },
    { key: 'district', header: 'District' },
    { key: 'deliveredQuantity', header: 'Qty Delivered' },
    { key: 'challanNumber', header: 'Challan #' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    ...(canEditStatus ? [{
      key: 'updateStatus', header: 'Update Status',
      render: (r) => <StatusSelect value={r.status} options={DELIVERY_STATUSES} busy={busyId === r._id} onChange={(s) => updateStatus(r, s)} />,
    }] : []),
    {
      key: 'actions', header: '',
      render: (r) => (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={() => downloadResource(`/deliveries/${r._id}/challan/pdf`, `${r.challanNumber || 'challan'}.pdf`).catch(() => show('Challan export failed', 'danger'))}
          >
            Challan PDF
          </button>
          <button className="icon-btn" title="EDIT" aria-label="Edit delivery" onClick={() => setEditingDelivery(r)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
          <button className="icon-btn danger" title="DELETE" aria-label="Delete delivery" onClick={() => handleDelete(r)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
        </div>
      ),
    },
  ];

  const deliveredQty = deliveries.reduce((s, d) => s + (d.deliveredQuantity || 0), 0);
  const acknowledged = deliveries.filter((d) => d.status === 'acknowledged').length;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Final Delivery</h1>
          <p className="page-sub">School-wise delivery, acknowledgements and challans</p>
        </div>
        <button className="btn" onClick={() => setEditingDelivery({})}>+ Confirm Delivery</button>
      </div>
      <div className="grid-stats">
        <StatCard label="Deliveries" value={deliveries.length} />
        <StatCard label="Units Delivered" value={deliveredQty.toLocaleString('en-IN')} />
        <StatCard label="Acknowledged" value={acknowledged} tone="success" />
      </div>
      {loading ? <div style={{ color: 'var(--color-text-dim)' }}>Loading…</div> : <DataTable columns={columns} rows={deliveries} />}
      <AddDeliveryModal open={!!editingDelivery} initial={editingDelivery} onClose={() => setEditingDelivery(null)} onCreated={() => { show('Delivery saved'); load(); }} />
      <ConfirmDialog open={!!confirmRow} title="Delete this delivery?" message="This cannot be undone." onConfirm={confirmDelete} onClose={cancelDelete} confirmLabel="DELETE" cancelLabel="Cancel" />
      <Toast toast={toast} />
    </>
  );
}