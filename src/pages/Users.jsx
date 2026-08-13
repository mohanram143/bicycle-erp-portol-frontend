import React, { useEffect, useState } from 'react';
import { api } from '../api/axiosClient.js';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import AddUserModal from '../components/forms/AddUserModal.jsx';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role', render: (r) => <StatusBadge status={r.role} /> },
  { key: 'state', header: 'State' },
  { key: 'isActive', header: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/users?limit=200').then((res) => setUsers(res.data.data)).catch((err) => setError(err.response?.data?.message || 'Failed to load users')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const active = users.filter((u) => u.isActive).length;
  const roleCount = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="topbar">
        <div>
          <h1>User Management</h1>
          <p className="page-sub">Access, roles and state-level permissions</p>
        </div>
        <button className="btn" onClick={() => setOpen(true)}>+ Add New</button>
      </div>
      <div className="grid-stats">
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="Active" value={active} tone="success" />
        <StatCard label="Roles" value={Object.keys(roleCount).length} />
      </div>
      {error && <div className="error-text">{error}</div>}
      {loading ? <div style={{ color: 'var(--color-text-dim)' }}>Loading…</div> : <DataTable columns={columns} rows={users} />}
      <AddUserModal open={open} onClose={() => setOpen(false)} onCreated={load} />
    </>
  );
}