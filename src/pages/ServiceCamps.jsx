import React, { useEffect, useState } from 'react';
import { api } from '../api/axiosClient.js';
import DataTable from '../components/DataTable.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusSelect from '../components/StatusSelect.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import AddServiceCampModal from '../components/forms/AddServiceCampModal.jsx';
import { useStatusUpdate } from '../hooks/useStatusUpdate.js';
import { useAuthStore } from '../store/authStore.js';

const CAMP_STATUSES = ['scheduled', 'completed', 'cancelled'];
const CAN_EDIT = ['super_admin', 'admin', 'site_supervisor'];
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

export default function ServiceCamps() {
  const { user } = useAuthStore();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast, show } = useToast();
  const { busyId, commit } = useStatusUpdate(show);

  const canEdit = CAN_EDIT.includes(user?.role);
  const canCreate = ['super_admin', 'admin', 'site_supervisor', 'transport_user'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api.get('/service-camps?limit=200').then((r) => setCamps(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const updateStatus = (row, status) => commit({
    endpoint: `/service-camps/${row._id}/status`,
    id: row._id,
    next: status,
    rows: camps,
    setRows: setCamps,
    itemLabel: `Camp ${row.location}`,
  });

  const columns = [
    { key: 'location', header: 'Location' },
    { key: 'school', header: 'School' },
    { key: 'district', header: 'District' },
    { key: 'scheduledDate', header: 'Scheduled', render: (r) => fmtDate(r.scheduledDate) },
    { key: 'attendanceCount', header: 'Attendance' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    ...(canEdit ? [{
      key: 'updateStatus', header: 'Update',
      render: (r) => <StatusSelect value={r.status} options={CAMP_STATUSES} busy={busyId === r._id} onChange={(s) => updateStatus(r, s)} />,
    }] : []),
  ];

  const completed = camps.filter((c) => c.status === 'completed').length;
  const totalAttendance = camps.reduce((s, c) => s + (c.attendanceCount || 0), 0);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Service Camps</h1>
          <p className="page-sub">Post-delivery service, free repair and support camps</p>
        </div>
        {canCreate && <button className="btn" onClick={() => setOpen(true)}>+ Schedule Camp</button>}
      </div>
      <div className="grid-stats">
        <StatCard label="Camps" value={camps.length} />
        <StatCard label="Completed" value={completed} tone="success" />
        <StatCard label="Total Attendance" value={totalAttendance.toLocaleString('en-IN')} />
      </div>
      {loading ? <div style={{ color: 'var(--color-text-dim)' }}>Loading…</div> : <DataTable columns={columns} rows={camps} />}
      <AddServiceCampModal open={open} onClose={() => setOpen(false)} onCreated={() => { show('Camp scheduled'); load(); }} />
      <Toast toast={toast} />
    </>
  );
}
