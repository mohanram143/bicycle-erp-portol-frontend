import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { api } from '../api/axiosClient.js';
import NotificationBell from '../components/NotificationBell.jsx';
import StatCard from '../components/StatCard.jsx';
import { useAuthStore } from '../store/authStore.js';
import { statusColor } from '../config/statusConfig.js';

const C = {
  grid: 'var(--color-chart-grid)',
  tick: 'var(--color-text-dim)',
  tooltip: 'var(--color-chart-tooltip)',
  tooltipBorder: 'var(--color-chart-tooltip-border)',
};

const STATUS_LABELS = {
  created: 'Created', loading: 'Loading', loaded: 'Loaded', in_transit: 'In transit',
  arrived: 'Arrived', unloading: 'Unloading', unloaded: 'Unloaded', delivered: 'Delivered', exception: 'Exception',
};

function formatINR(value) {
  return `₹${(value ?? 0).toLocaleString('en-IN')}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayStr() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const roleShort = user?.role ? user.role.split('_')[0].replace(/^\w/, (c) => c.toUpperCase()) : null;

  const canReports = ['super_admin', 'admin', 'government', 'state_officer', 'finance_officer'].includes(user?.role);

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data.data)).catch((err) => setError(err.response?.data?.message || 'Failed to load'));
  }, []);

  if (error) return <div className="error-text">{error}</div>;
  if (!data) return <div style={{ color: 'var(--color-text-dim)' }}>Loading dashboard…</div>;

  const shipmentPie = Object.entries(data.shipmentsByStatus || {}).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status.replace(/_/g, ' '),
    value: count,
    status,
  }));

  const inventoryBar = Object.entries(data.inventoryStatus || {}).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    ready: count,
    status,
  }));

  const ageingBar = Object.entries(data.ageing || {}).map(([bucket, amount]) => ({
    name: bucket,
    amount,
  }));

  const invoicePie = (data.invoicesByStatus || []).map((i) => ({
    name: i.status.replace(/_/g, ' '),
    value: i.amount,
    status: i.status,
  }));

  const tooltipStyle = { background: C.tooltip, border: `1px solid ${C.tooltipBorder}`, borderRadius: 8, color: 'var(--color-text)' };

  return (
    <>
      <div className="topbar fade-up" style={{ animationDelay: '0ms' }}>
        <div>
          <h1>{greeting()}, {user?.name?.split(' ')[0] || 'there'} <span style={{ color: 'var(--color-primary)' }}>👋</span></h1>
          <p className="page-sub">{todayStr()} · Live view across orders, logistics, delivery and finance</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {canReports && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NotificationBell />
              <button className="btn btn-secondary" onClick={() => navigate('/reports')}>MIS Reports</button>
            </div>
          </>
        )}
        <span className="live-pill"><i />Live</span>
        <button className="user-pill" onClick={() => navigate('/users')} aria-label="Account" title={user?.name}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{roleShort || (user?.name?.split(' ')[0] || 'Account')}</span>
        </button>
        </div>
      </div>

      <div className="grid-stats">
        <div className="fade-up" style={{ animationDelay: '40ms' }}>
          <StatCard label="Pending Supply Orders" value={data.pendingOrders} hint="Registered + in production" />
        </div>
        <div className="fade-up" style={{ animationDelay: '80ms' }}>
          <StatCard label="Total Orders" value={data.totalOrders} hint="All time registered" />
        </div>
        <div className="fade-up" style={{ animationDelay: '120ms' }}>
          <StatCard label="Frames Ready" value={data.framesReady} hint="Ready for dispatch" />
        </div>
        <div className="fade-up" style={{ animationDelay: '160ms' }}>
          <StatCard label="Exception Alerts" value={data.exceptionAlerts} hint="Shipments flagged" tone={data.exceptionAlerts > 0 ? 'danger' : 'success'} />
        </div>
      </div>

      <div className="dashboard-grid">

            <section className="card chart-card chart-card-wide fade-up" style={{ animationDelay: '320ms' }}>
         <h3 className="chart-title">Allocation pipeline</h3>
         <p className="chart-sub">Orders per stage</p>
         <div style={{ height: 260 }}>
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.ordersStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e0271b" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#e0271b" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={{ fill: C.tick, fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: C.tick, fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" name="Orders" stroke="#e0271b" strokeWidth={2} fill="url(#orderGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card chart-card fade-up" style={{ animationDelay: '240ms' }}>
          <h3 className="chart-title">Shipment status</h3>
          <p className="chart-sub">Distribution by stage</p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={shipmentPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {shipmentPie.map((e, i) => <Cell key={i} fill={statusColor(e.status)} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card chart-card fade-up" style={{ animationDelay: '280ms' }}>
          <h3 className="chart-title">Component readiness</h3>
          <p className="chart-sub">Frames by verification stage</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryBar} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: C.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: C.tick, fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="ready" name="Frames" radius={[6, 6, 0, 0]}>
                  {inventoryBar.map((e, i) => <Cell key={i} fill={statusColor(e.status)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card chart-card fade-up" style={{ animationDelay: '320ms' }}>
          <h3 className="chart-title">Shipment volume</h3>
          <p className="chart-sub">Last months</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyShipments} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: C.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: C.tick, fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="shipments" name="Shipments" fill="#56a9ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card chart-card fade-up" style={{ animationDelay: '360ms' }}>
          <h3 className="chart-title">Receivables ageing</h3>
          <p className="chart-sub">Outstanding by bucket</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageingBar} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: C.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatINR} tick={{ fill: C.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={formatINR} contentStyle={tooltipStyle} />
                <Bar dataKey="amount" name="Outstanding" fill="#d69e2e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card chart-card chart-card-wide fade-up" style={{ animationDelay: '400ms' }}>
          <h3 className="chart-title">Invoice value mix</h3>
          <p className="chart-sub">By invoice status</p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={invoicePie} dataKey="value" nameKey="name" outerRadius={90}>
                  {invoicePie.map((e, i) => <Cell key={i} fill={statusColor(e.status)} />)}
                </Pie>
                <Tooltip formatter={formatINR} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </>
  );
}