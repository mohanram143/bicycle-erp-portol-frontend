import React, { useEffect, useState } from 'react';
import { api } from '../api/axiosClient.js';

function fmt(d) {
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function Notifications() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/notifications')
      .then((res) => setItems(res.data.data || []))
      .catch(() => setError('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  // group by module (fallback to 'General')
  const groups = items.reduce((acc, n) => {
    const key = n.module || n.category || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setItems((xs) => xs.map((x) => (x._id === id ? { ...x, status: 'read' } : x)));
    } catch (_) { /* ignore */ }
  };

  const markAll = async () => {
    try {
      await api.post('/notifications/read-all');
      setItems((xs) => xs.map((x) => ({ ...x, status: 'read' })));
    } catch (_) { /* ignore */ }
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Notifications</h1>
          <p className="page-sub">All application notifications, grouped by module for quick scanning</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => window.location.reload()}>Refresh</button>
          <button className="btn btn-secondary" onClick={markAll}>Mark all read</button>
        </div>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {loading && <div className="card">Loading…</div>}
        {!loading && Object.keys(groups).length === 0 && <div className="card">No notifications</div>}

        {Object.entries(groups).map(([module, arr]) => (
          <section key={module} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 160 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <h3 className="chart-title" style={{ marginBottom: 2 }}>{module}</h3>
                <div className="chart-sub">{arr.length} items</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button className="btn btn-secondary" onClick={() => arr.forEach((n) => markRead(n._id))}>Mark read</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {arr.map((n) => (
                <div key={n._id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px', borderRadius: 8, background: n.status === 'sent' ? 'rgba(224,39,27,0.04)' : 'transparent' }}>
                  <div style={{ minWidth: 10, height: 10, borderRadius: 999, background: n.status === 'sent' ? 'var(--color-danger)' : 'transparent', marginTop: 6 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontWeight: 700 }}>{n.title}</div>
                      <div style={{ color: 'var(--color-text-dim)', fontSize: 12 }}>{fmt(n.createdAt)}</div>
                    </div>
                    <div style={{ color: 'var(--color-text-dim)', fontSize: 13, marginTop: 6 }}>{n.body}</div>
                    {n.meta && <div style={{ marginTop: 8, color: 'var(--color-text-dim)', fontSize: 12 }}>{JSON.stringify(n.meta)}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button className="btn" style={{ padding: '6px 10px' }} onClick={() => markRead(n._id)}>Acknowledge</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
