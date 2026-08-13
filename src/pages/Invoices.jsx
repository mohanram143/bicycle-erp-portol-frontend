import React, { useEffect, useState } from 'react';
import { api } from '../api/axiosClient.js';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusSelect from '../components/StatusSelect.jsx';
import StatCard from '../components/StatCard.jsx';
import AddInvoiceModal from '../components/forms/AddInvoiceModal.jsx';
import InvoiceModal from '../components/InvoiceModal.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useStatusUpdate } from '../hooks/useStatusUpdate.js';
import { INVOICE_STATUSES } from '../config/statusConfig.js';

const CAN_EDIT_STATUS = ['super_admin', 'admin', 'finance_officer'];

const BUCKETS = ['0-30', '31-60', '61-90', '91-120', '120+'];

export default function Invoices() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState([]);
  const [ageing, setAgeing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const { toast, show } = useToast();
  const { busyId, commit } = useStatusUpdate(show);

  const canEditStatus = CAN_EDIT_STATUS.includes(user?.role);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/invoices?limit=200'),
      api.get('/payments/ageing'),
    ]).then(([invRes, ageRes]) => {
      setInvoices(invRes.data.data);
      setAgeing(ageRes.data.data);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateStatus = (row, status) => commit({
    endpoint: `/invoices/${row._id}/status`,
    id: row._id,
    next: status,
    rows: invoices,
    setRows: setInvoices,
    itemLabel: `Invoice ${row.invoiceNumber}`,
  });

  const [confirmRow, setConfirmRow] = useState(null);

  const handleDelete = (row) => setConfirmRow(row);
  const confirmDelete = () => {
    if (!confirmRow) return;
    api.delete(`/invoices/${confirmRow._id}`).then(() => { show('Invoice deleted'); setConfirmRow(null); load(); }).catch((err) => { show(err.response?.data?.message || 'Delete failed', 'danger'); setConfirmRow(null); });
  };
  const cancelDelete = () => setConfirmRow(null);

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice #' },
    { key: 'state', header: 'State' },
    { key: 'amount', header: 'Amount', render: (r) => `₹${r.amount.toLocaleString('en-IN')}` },
    { key: 'dueDate', header: 'Due Date', render: (r) => new Date(r.dueDate).toLocaleDateString('en-IN') },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    ...(canEditStatus ? [{
      key: 'updateStatus', header: 'Update Status',
      render: (r) => <StatusSelect value={r.status} options={INVOICE_STATUSES} busy={busyId === r._id} onChange={(s) => updateStatus(r, s)} />,
    }] : []),
    {
      key: 'actions', header: '',
      render: (r) => (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setViewInvoice(r)}>
            View / Print
          </button>
          {canEditStatus && (
            <>
              <button className="icon-btn" title="EDIT" aria-label="Edit invoice" onClick={() => setEditingInvoice(r)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
              </button>
              <button className="icon-btn danger" title="DELETE" aria-label="Delete invoice" onClick={() => handleDelete(r)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </button>
            </>
          )}
        </div>
      ),
    },

  ];

  const paid = invoices.filter((i) => i.status === 'paid').length;
  const outstanding = invoices.filter((i) => ['sent', 'partially_paid', 'overdue', 'approved'].includes(i.status));
  const outstandingTotal = outstanding.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Invoicing & Payments</h1>
          <p className="page-sub">Invoices, receivables and payment tracking</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setEditingInvoice({})}>+ Add New</button>
        </div>
      </div>
      <div className="grid-stats">
        <StatCard label="Total Invoices" value={invoices.length} />
        <StatCard label="Paid" value={paid} tone="success" />
        <StatCard label="Outstanding" value={outstandingTotal ? `₹${outstandingTotal.toLocaleString('en-IN')}` : '₹0'} tone="warning" />
      </div>
      {ageing && (
        <>
          <h3 className="section-title">Receivables ageing</h3>
          <div className="grid-stats">
            {BUCKETS.map((b) => (
              <StatCard key={b} label={`${b} days`} value={`₹${(ageing[b] || 0).toLocaleString('en-IN')}`} />
            ))}
          </div>
        </>
      )}
      {loading ? <div style={{ color: 'var(--color-text-dim)' }}>Loading…</div> : <DataTable columns={columns} rows={invoices} />}
      <AddInvoiceModal open={!!editingInvoice || open} initial={editingInvoice} onClose={() => { setEditingInvoice(null); setOpen(false); }} onCreated={() => { show('Invoice saved'); load(); }} />
      <InvoiceModal invoice={viewInvoice} open={!!viewInvoice} onClose={() => setViewInvoice(null)} onChanged={() => { show('Payment recorded'); load(); }} />
      <ConfirmDialog open={!!confirmRow} title="Delete this invoice?" message="This cannot be undone." onConfirm={confirmDelete} onClose={cancelDelete} confirmLabel="DELETE" cancelLabel="Cancel" />
      <Toast toast={toast} />
    </>
  );
}