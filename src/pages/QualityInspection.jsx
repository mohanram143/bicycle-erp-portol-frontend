import React, { useEffect, useState } from 'react';
import { api } from '../api/axiosClient.js';
import DataTable from '../components/DataTable.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusSelect from '../components/StatusSelect.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import AddInspectionModal from '../components/forms/AddInspectionModal.jsx';
import { useStatusUpdate } from '../hooks/useStatusUpdate.js';
import { useAuthStore } from '../store/authStore.js';

const RESULT_STATUSES = ['pending', 'passed', 'failed', 'conditional'];
const CAN_EDIT = ['super_admin', 'admin', 'quality_inspector'];

export default function QualityInspection() {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast, show } = useToast();
  const { busyId, commit } = useStatusUpdate(show);

  const canEdit = CAN_EDIT.includes(user?.role);
  const canCreate = ['super_admin', 'admin', 'quality_inspector', 'factory_user'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api.get('/quality-inspection?limit=200').then((r) => setItems(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const updateResult = (row, result) => commit({
    endpoint: `/quality-inspection/${row._id}`,
    id: row._id,
    field: 'result',
    next: result,
    rows: items,
    setRows: setItems,
    itemLabel: 'Inspection',
  });

  const columns = [
    { key: 'order', header: 'Supply Order', render: (r) => r.supplyOrder?.orderNumber || '—' },
    { key: 'state', header: 'State', render: (r) => r.supplyOrder?.state || '—' },
    { key: 'result', header: 'Result', render: (r) => <StatusBadge status={r.result} /> },
    { key: 'remarks', header: 'Remarks' },
    { key: 'createdAt', header: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString('en-IN') },
    ...(canEdit ? [{
      key: 'update', header: 'Update Result',
      render: (r) => <StatusSelect value={r.result} options={RESULT_STATUSES} busy={busyId === r._id} onChange={(s) => updateResult(r, s)} />,
    }] : []),
  ];

  const passed = items.filter((i) => i.result === 'passed').length;
  const failed = items.filter((i) => i.result === 'failed').length;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Quality Inspection</h1>
          <p className="page-sub">Inspection results, lab certificates & third-party checks per supply order</p>
        </div>
        {canCreate && <button className="btn" onClick={() => setOpen(true)}>+ New Inspection</button>}
      </div>
      <div className="grid-stats">
        <StatCard label="Records" value={items.length} />
        <StatCard label="Passed" value={passed} tone="success" />
        <StatCard label="Failed / Conditional" value={failed + items.filter((i) => i.result === 'conditional').length} tone="danger" />
      </div>
      {loading ? <div style={{ color: 'var(--color-text-dim)' }}>Loading…</div> : <DataTable columns={columns} rows={items} emptyLabel="No inspection records yet" />}
      <AddInspectionModal open={open} onClose={() => setOpen(false)} onCreated={() => { show('Inspection record created'); load(); }} />
      <Toast toast={toast} />
    </>
  );
}
