import React, { useEffect, useState } from 'react';
import Modal, { Field } from './Modal.jsx';
import StatusBadge from './StatusBadge.jsx';
import { api } from '../api/axiosClient.js';
import { downloadResource } from '../api/download.js';

const INR = (n) => `₹${(n ?? 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

// Full invoice document: printable view (window.print prints only .print-area), PDF
// download, payment history and a record-payment form. This is the "get my invoice"
// entry point from the Invoicing page.
export default function InvoiceModal({ invoice, open, onClose, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [payments, setPayments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ amount: '', utrNumber: '', paymentDate: '', remarks: '' });

  useEffect(() => {
    if (!open || !invoice) return;
    setError('');
    setForm({ amount: '', utrNumber: '', paymentDate: '', remarks: '' });
    api.get(`/invoices/${invoice._id}`).then((r) => setDetail(r.data.data)).catch(() => setDetail(null));
    api.get(`/payments?invoice=${invoice._id}`).then((r) => setPayments(r.data.data)).catch(() => setPayments([]));
  }, [open, invoice]);

  if (!open) return null;

  const inv = detail || invoice;
  const paidTotal = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const balance = Math.max(0, inv.amount - paidTotal);

  const recordPayment = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/payments', {
        invoice: inv._id,
        amount: Number(form.amount),
        utrNumber: form.utrNumber,
        paymentDate: form.paymentDate || undefined,
        remarks: form.remarks,
      });
      onChanged();
      api.get(`/payments?invoice=${inv._id}`).then((r) => setPayments(r.data.data)).catch(() => {});
      setForm({ amount: '', utrNumber: '', paymentDate: '', remarks: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    try {
      await downloadResource(`/invoices/${inv._id}/pdf`, `${inv.invoiceNumber}.pdf`);
    } catch {
      setError('Could not generate PDF');
    }
  };

  return (
    <Modal open={open} title={`Invoice ${inv.invoiceNumber}`} onClose={onClose} wide>
      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className="btn" onClick={() => window.print()}>Print</button>
        <button className="btn btn-secondary" onClick={downloadPdf}>Download PDF</button>
        <button className="btn btn-secondary" style={{ marginLeft: 'auto' }} onClick={onClose}>Close</button>
      </div>

      <div className="print-area invoice-sheet">
        <div className="invoice-head">
          <div>
            <div className="invoice-brand">HERO<span>ERP</span></div>
            <div className="invoice-tag">Government Bicycle Distribution Programme</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="invoice-title">TAX INVOICE</div>
            <div className="invoice-no">{inv.invoiceNumber}</div>
          </div>
        </div>

        <div className="invoice-meta">
          <div><span>State</span>{inv.state || '—'}</div>
          <div><span>District</span>{inv.district || '—'}</div>
          <div><span>Supply Order</span>{inv.supplyOrder?.orderNumber || '—'}</div>
          <div><span>Issued</span>{fmtDate(inv.createdAt)}</div>
          <div><span>Due Date</span>{fmtDate(inv.dueDate)}</div>
          <div><span>Status</span><StatusBadge status={inv.status} /></div>
        </div>

        <div className="invoice-amounts">
          {inv.gstRate > 0 && <div><span>Taxable Value</span><strong>{INR(inv.taxableAmount)}</strong></div>}
          {inv.gstRate > 0 && <div><span>GST @ {inv.gstRate}%</span><strong>{INR(inv.gstAmount)}</strong></div>}
          <div><span>Invoice Amount</span><strong>{INR(inv.amount)}</strong></div>
          <div><span>Paid Till Date</span><strong>{INR(paidTotal)}</strong></div>
          <div className="due"><span>Balance Due</span><strong>{INR(balance)}</strong></div>
        </div>

        {payments.length > 0 && (
          <table className="invoice-payments">
            <thead><tr><th>Date</th><th>UTR / Ref</th><th>Amount</th><th>Reconciled</th><th>Recorded By</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{fmtDate(p.paymentDate)}</td>
                  <td>{p.utrNumber || '—'}</td>
                  <td>{INR(p.amount)}</td>
                  <td>{p.reconciled ? 'Yes' : 'No'}</td>
                  <td>{p.recordedBy?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="invoice-foot">System-generated by HERO ERP · valid without physical signature</div>
      </div>

      <div className="no-print" style={{ marginTop: 20 }}>
        <h4 style={{ margin: '0 0 12px' }}>Record payment</h4>
        <form onSubmit={recordPayment}>
          <div className="form-grid">
            <Field label="Amount (₹)" required>
              <input className="input" type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </Field>
            <Field label="UTR number">
              <input className="input" value={form.utrNumber} onChange={(e) => setForm({ ...form, utrNumber: e.target.value })} />
            </Field>
            <Field label="Payment date">
              <input className="input" type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
            </Field>
            <Field label="Remarks">
              <input className="input" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </Field>
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="modal-actions">
            <button type="submit" className="btn" disabled={saving}>{saving ? 'Recording…' : 'Record payment'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}