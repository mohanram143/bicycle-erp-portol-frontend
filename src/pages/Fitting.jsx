import React, { useEffect, useState } from 'react';
import { api } from '../api/axiosClient.js';
import DataTable from '../components/DataTable.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import AddFittingModal from '../components/forms/AddFittingModal.jsx';
import { useAuthStore } from '../store/authStore.js';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');
const FITTER_ROLES = ['fitter'];
const SUPERVISOR_ROLES = ['super_admin', 'admin', 'site_supervisor'];

export default function Fitting() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const { toast, show } = useToast();

  const isFitter = FITTER_ROLES.includes(user?.role);
  const isSupervisor = SUPERVISOR_ROLES.includes(user?.role);

  const load = () => {
    setLoading(true);
    api.get('/fitting?limit=200').then((r) => setRecords(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const act = (label, id, payload) => {
    setBusyId(id);
    api.patch(`/fitting/${id}/status`, payload)
      .then(() => { show(label); load(); })
      .catch((err) => show(err.response?.data?.message || 'Action failed', 'danger'))
      .finally(() => setBusyId(null));
  };

  const verify = (id) => {
    setBusyId(id);
    api.post(`/fitting/${id}/verify`).then(() => { show('Fitting verified'); load(); })
      .catch((err) => show(err.response?.data?.message || 'Verify failed', 'danger'))
      .finally(() => setBusyId(null));
  };

  const approve = (id) => {
    setBusyId(id);
    api.post(`/fitting/${id}/approve`).then(() => { show('Fitting approved — frame ready'); load(); })
      .catch((err) => show(err.response?.data?.message || 'Approve failed', 'danger'))
      .finally(() => setBusyId(null));
  };

  const columns = [
    { key: 'frameCode', header: 'Frame', render: (r) => r.frame?.frameCode || '—' },
    { key: 'fitter', header: 'Fitter', render: (r) => r.fitter?.name || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'completedAt', header: 'Completed', render: (r) => fmtDate(r.completedAt) },
    {
      key: 'actions', header: '',
      render: (r) => {
        const busy = busyId === r._id;
        return (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {isFitter && r.status === 'pending' && <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} disabled={busy} onClick={() => act('Started', r._id, { status: 'in_progress' })}>Start</button>}
            {isFitter && (r.status === 'pending' || r.status === 'in_progress') && <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }} disabled={busy} onClick={() => act('Marked completed', r._id, { status: 'completed' })}>Complete</button>}
            {isSupervisor && r.status === 'completed' && <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }} disabled={busy} onClick={() => verify(r._id)}>Verify</button>}
            {isSupervisor && r.status === 'verified' && <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }} disabled={busy} onClick={() => approve(r._id)}>Approve</button>}
          </div>
        );
      },
    },
  ];

  const inProgress = records.filter((r) => r.status === 'in_progress' || r.status === 'pending').length;
  const approved = records.filter((r) => r.status === 'approved').length;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Bicycle Fitting</h1>
          <p className="page-sub">Fitter workflow with supervisor verification & approval before dispatch</p>
        </div>
        {isSupervisor && <button className="btn" onClick={() => setOpen(true)}>+ Assign Fitting</button>}
      </div>
      <div className="grid-stats">
        <StatCard label="Tasks" value={records.length} />
        <StatCard label="In Progress" value={inProgress} />
        <StatCard label="Approved" value={approved} tone="success" />
      </div>
      {loading ? <div style={{ color: 'var(--color-text-dim)' }}>Loading…</div> : <DataTable columns={columns} rows={records} emptyLabel="No fitting tasks yet" />}
      <AddFittingModal open={open} onClose={() => setOpen(false)} onCreated={() => { show('Fitting task assigned'); load(); }} />
      <Toast toast={toast} />
    </>
  );
}
