import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api/axiosClient.js';

// In-app notification bell (3.16 Alerts and Notifications). Polls the unread count
// every 30s, opens a dropdown inbox, and acknowledges items on click.
export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const refreshCount = () => {
    api.get('/notifications/unread-count').then((r) => setCount(r.data.data.count)).catch(() => {});
  };

  const load = () => {
    setLoading(true);
    api.get('/notifications').then((r) => setItems(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshCount();
    const t = setInterval(refreshCount, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next) load();
      return next;
    });
  };

  const markRead = (id) => {
    api.post(`/notifications/${id}/read`).then(() => {
      setItems((xs) => xs.map((x) => (x._id === id ? { ...x, status: 'read' } : x)));
      refreshCount();
    }).catch(() => {});
  };

  const markAll = () => {
    api.post('/notifications/read-all').then(() => {
      setItems((xs) => xs.map((x) => ({ ...x, status: 'read' })));
      refreshCount();
    }).catch(() => {});
  };

  const fmt = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-bell" onClick={toggle} aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 && <span className="notif-badge">{count > 99 ? '99+' : count}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-head">
            <strong>Notifications</strong>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={markAll}>Mark all read</button>
          </div>
          <div className="notif-list">
            {loading && <div className="notif-empty">Loading…</div>}
            {!loading && items.length === 0 && <div className="notif-empty">No notifications yet</div>}
            {items.map((n) => (
              <button key={n._id} className={`notif-item${n.status === 'sent' ? ' unread' : ''}`} onClick={() => markRead(n._id)}>
                <div className="notif-title">{n.title}</div>
                <div className="notif-body">{n.body}</div>
                <div className="notif-time">{fmt(n.createdAt)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
