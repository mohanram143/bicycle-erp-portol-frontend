import React, { useEffect, useState } from 'react';
import { api } from '../api/axiosClient.js';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusSelect from '../components/StatusSelect.jsx';
import StatCard from '../components/StatCard.jsx';
import AddShipmentModal from '../components/forms/AddShipmentModal.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useStatusUpdate } from '../hooks/useStatusUpdate.js';
import { SHIPMENT_STATUSES } from '../config/statusConfig.js';

const CAN_EDIT_STATUS = ['super_admin', 'admin', 'transport_user', 'site_supervisor'];

export default function Shipments() {
  const { user } = useAuthStore();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const { toast, show } = useToast();
  const { busyId, commit } = useStatusUpdate(show);

  const canEditStatus = CAN_EDIT_STATUS.includes(user?.role);

  const load = () => {
    setLoading(true);
    api.get('/transportation/shipments?limit=200').then((res) => setShipments(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateStatus = (row, status) => commit({
    endpoint: `/transportation/shipments/${row._id}/status`,
    id: row._id,
    next: status,
    rows: shipments,
    setRows: setShipments,
    itemLabel: `Shipment ${row.shipmentCode}`,
  });

  const [confirmRow, setConfirmRow] = useState(null);

  const handleDelete = (row) => setConfirmRow(row);
  const confirmDelete = () => {
    if (!confirmRow) return;
    api.delete(`/transportation/shipments/${confirmRow._id}`).then(() => { show('Shipment deleted'); setConfirmRow(null); load(); }).catch((err) => { show(err.response?.data?.message || 'Delete failed', 'danger'); setConfirmRow(null); });
  };
  const cancelDelete = () => setConfirmRow(null);

  const columns = [
    { key: 'shipmentCode', header: 'Shipment' },
    { key: 'destination', header: 'Destination', render: (r) => `${r.destination?.district || ''}, ${r.destination?.state || ''}` },
    { key: 'vehicle', header: 'Vehicle', render: (r) => r.vehicle?.registrationNumber || '—' },
    { key: 'driver', header: 'Driver', render: (r) => r.driver?.name || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    ...(canEditStatus ? [{
      key: 'updateStatus', header: 'Update Status',
      render: (r) => <StatusSelect value={r.status} options={SHIPMENT_STATUSES} busy={busyId === r._id} onChange={(s) => updateStatus(r, s)} />,
    }] : []),
    {
      key: 'actions', header: '',
      render: (r) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {canEditStatus && (
            <>
              <button className="icon-btn" title="EDIT" aria-label="Edit shipment" onClick={() => setEditingShipment(r)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
              </button>
              <button className="icon-btn danger" title="DELETE" aria-label="Delete shipment" onClick={() => handleDelete(r)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const inTransit = shipments.filter((s) => ['in_transit', 'loading', 'loaded', 'unloading'].includes(s.status)).length;
  const delivered = shipments.filter((s) => s.status === 'delivered').length;
  const exceptions = shipments.filter((s) => s.status === 'exception').length;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Transportation & Shipments</h1>
          <p className="page-sub">Vehicles, routes and live shipment movement</p>
        </div>
        <button className="btn" onClick={() => setEditingShipment({})}>+ Add New</button>
      </div>
      <div className="grid-stats">
        <StatCard label="Total Shipments" value={shipments.length} />
        <StatCard label="In Transit / Active" value={inTransit} tone={inTransit > 0 ? 'warning' : 'success'} />
        <StatCard label="Delivered" value={delivered} tone="success" />
        <StatCard label="Exceptions" value={exceptions} tone={exceptions > 0 ? 'danger' : 'success'} />
      </div>
      {loading ? <div style={{ color: 'var(--color-text-dim)' }}>Loading…</div> : <DataTable columns={columns} rows={shipments} />}
      <AddShipmentModal open={!!editingShipment} initial={editingShipment} onClose={() => setEditingShipment(null)} onCreated={() => { show('Shipment saved'); load(); }} />
      <ConfirmDialog open={!!confirmRow} title="Delete this shipment?" message="This cannot be undone." onConfirm={confirmDelete} onClose={cancelDelete} confirmLabel="DELETE" cancelLabel="Cancel" />
      <Toast toast={toast} />
    </>
  );
}