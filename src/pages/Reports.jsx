import React, { useState } from 'react';
import { api } from '../api/axiosClient.js';
import { downloadResource } from '../api/download.js';
import Modal from '../components/Modal.jsx';
import { statusLabel } from '../config/statusConfig.js';

const INR = (n) => `₹${(n ?? 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

// Each report config knows how to fetch its JSON, how to shape it into printable rows,
// and the CSV filename. The generic <ReportModal> renders rows in a printable table.
const SUPPLY_GROUPS = [
  { key: 'state', label: 'By State' },
  { key: 'district', label: 'By District' },
  { key: 'school', label: 'By School' },
];

function financialRows(d) {
  return [
    ...(d.invoicesByStatus || []).map((s) => ({ label: `Invoices — ${statusLabel(s.status)}`, value: `${s.count} · ${INR(s.amount)}` })),
    { label: 'Revenue collected', value: INR(d.revenueCollected) },
    { label: 'Outstanding receivables', value: INR(d.outstanding) },
    { label: 'Overdue invoices', value: d.overdueInvoices },
    ...Object.entries(d.ageing || {}).map(([b, amt]) => ({ label: `Ageing ${b} days`, value: INR(amt) })),
  ];
}

export default function Reports() {
  const [report, setReport] = useState(null); // { title, columns, rows }
  const [busy, setBusy] = useState(null);
  const [groupBy, setGroupBy] = useState('state');
  const [error, setError] = useState('');

  const openReport = async (config) => {
    setError(''); setBusy(config.key);
    try {
      const res = await api.get(config.url());
      const built = config.build(res.data.data);
      setReport({ title: config.title, ...built });
    } catch {
      setError('Could not load this report');
    } finally {
      setBusy(null);
    }
  };

  const reports = [
    {
      key: 'financial', title: 'Financial Summary', sub: 'Invoice value, collections & receivables ageing',
      url: () => '/reports/financial',
      csv: () => '/reports/financial?format=csv',
      build: (d) => ({ columns: [{ key: 'label', label: 'Metric' }, { key: 'value', label: 'Value' }], rows: financialRows(d) }),
    },
    {
      key: 'supply', title: 'Supply Report', sub: 'Allocations by state / district / school',
      url: () => `/reports/supply?groupBy=${groupBy}`,
      csv: () => `/reports/supply?groupBy=${groupBy}&format=csv`,
      build: (rows) => ({
        columns: [{ key: 'group', label: groupBy === 'school' ? 'School' : groupBy === 'district' ? 'District' : 'State' }, { key: 'quantity', label: 'Quantity' }],
        rows,
      }),
    },
    {
      key: 'dispatch', title: 'Production vs Dispatch', sub: 'Ordered quantity vs dispatch progress',
      url: () => '/reports/production-vs-dispatch',
      csv: () => '/reports/production-vs-dispatch?format=csv',
      build: (d) => ({
        columns: [{ key: 'state', label: 'State' }, { key: 'ordered', label: 'Ordered (units)' }],
        rows: d.production,
        foot: [{ label: 'Dispatched shipments', value: d.dispatchedShipments }],
      }),
    },
    {
      key: 'pending', title: 'Pending Deliveries', sub: 'Deliveries not yet completed',
      url: () => '/reports/pending-deliveries',
      csv: () => '/reports/pending-deliveries?format=csv',
      build: (rows) => ({
        columns: [
          { key: 'school', label: 'School' }, { key: 'state', label: 'State' }, { key: 'district', label: 'District' },
          { key: 'deliveredQuantity', label: 'Qty', render: (r) => r.deliveredQuantity ?? 0 },
          { key: 'createdAt', label: 'Registered', render: (r) => fmtDate(r.createdAt) },
        ],
        rows,
      }),
    },
    {
      key: 'shortages', title: 'Shortage Report', sub: 'Shipments with unloading shortages',
      url: () => '/reports/shortages',
      csv: () => '/reports/shortages?format=csv',
      build: (rows) => ({
        columns: [
          { key: 'shipmentCode', label: 'Shipment' }, { key: 'state', label: 'State' }, { key: 'district', label: 'District' },
          { key: 'shortageQuantity', label: 'Shortage' }, { key: 'unloadedAt', label: 'Unloaded', render: (r) => fmtDate(r.unloadedAt) },
        ],
        rows,
      }),
    },
    {
      key: 'damaged', title: 'Damaged Components', sub: 'Damage recorded at site unloading',
      url: () => '/reports/damaged',
      csv: () => '/reports/damaged?format=csv',
      build: (rows) => ({
        columns: [
          { key: 'shipmentCode', label: 'Shipment' }, { key: 'state', label: 'State' }, { key: 'district', label: 'District' },
          { key: 'damagedQuantity', label: 'Damaged' }, { key: 'unloadedAt', label: 'Unloaded', render: (r) => fmtDate(r.unloadedAt) },
        ],
        rows,
      }),
    },
    {
      key: 'fitter', title: 'Fitter Productivity', sub: 'Fitting tasks completed & approved per fitter',
      url: () => '/reports/fitter-productivity',
      csv: () => '/reports/fitter-productivity?format=csv',
      build: (rows) => ({
        columns: [
          { key: 'fitter', label: 'Fitter' }, { key: 'phone', label: 'Phone' },
          { key: 'total', label: 'Total Tasks' }, { key: 'completed', label: 'Completed' }, { key: 'approved', label: 'Approved' },
        ],
        rows,
      }),
    },
    {
      key: 'qr', title: 'QR Scan History', sub: 'Component verification scans by stage',
      url: () => '/reports/qr-scan-history',
      csv: () => '/reports/qr-scan-history?format=csv',
      build: (rows) => ({
        columns: [{ key: 'stage', label: 'Stage' }, { key: 'scanCount', label: 'Scans' }],
        rows,
      }),
    },
    {
      key: 'vehicles', title: 'Vehicle Movement', sub: 'Live fleet location & GPS ping summary',
      url: () => '/reports/vehicle-movement',
      csv: () => '/reports/vehicle-movement?format=csv',
      build: (rows) => ({
        columns: [
          { key: 'shipmentCode', label: 'Shipment' }, { key: 'vehicle', label: 'Vehicle' }, { key: 'driver', label: 'Driver' },
          { key: 'state', label: 'State' }, { key: 'status', label: 'Status' },
          { key: 'lastLocation', label: 'Last GPS' }, { key: 'lastPing', label: 'Last Ping', render: (r) => fmtDate(r.lastPing) },
        ],
        rows,
      }),
    },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Reports & MIS</h1>
          <p className="page-sub">View on screen & print, or export to CSV for government MIS submissions</p>
        </div>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className="grid-stats reports-grid">
        {reports.map((r) => (
          <div key={r.key} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <h3 className="chart-title">{r.title}</h3>
              <p className="chart-sub">{r.sub}</p>
            </div>
            {r.key === 'supply' && (
              <select className="input" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                {SUPPLY_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
              </select>
            )}
            <div className="report-actions">
              <button className="btn report-btn" disabled={busy === r.key} onClick={() => openReport(r)}>
                {busy === r.key ? 'Loading…' : 'View & Print'}
              </button>
              <button className="btn btn-secondary report-btn" onClick={() => downloadResource(r.csv(), `${r.key}_report.csv`).catch(() => setError('Export failed'))}>
                Export CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      <ReportModal report={report} onClose={() => setReport(null)} />
    </>
  );
}

function ReportModal({ report, onClose }) {
  if (!report) return null;
  return (
    <Modal open title={report.title} onClose={onClose} wide>
      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className="btn" onClick={() => window.print()}>Print</button>
        <button className="btn btn-secondary" style={{ marginLeft: 'auto' }} onClick={onClose}>Close</button>
      </div>
      <div className="print-area report-sheet">
        <div className="report-head">
          <div>
            <div className="invoice-brand">HERO<span>ERP</span></div>
            <div className="invoice-tag">MIS Report</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="invoice-title">{report.title}</div>
            <div className="invoice-no">{new Date().toLocaleDateString('en-IN')}</div>
          </div>
        </div>
        <div className="table-scroll">
          <table className="report-table">
            <thead>
              <tr>{report.columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {report.rows.length === 0 && (
                <tr><td colSpan={report.columns.length} style={{ textAlign: 'center', color: 'var(--color-text-dim)' }}>No data</td></tr>
              )}
              {report.rows.map((row, i) => (
                <tr key={i}>
                  {report.columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {report.foot?.length > 0 && (
          <div className="report-foot">
            {report.foot.map((f, i) => (
              <div key={i}><span>{f.label}</span><strong>{f.value}</strong></div>
            ))}
          </div>
        )}
        <div className="invoice-foot">System-generated by HERO ERP · {new Date().toLocaleString('en-IN')}</div>
      </div>
    </Modal>
  );
}