import React, { useEffect, useState } from 'react';
import Modal, { Field } from '../Modal.jsx';
import { api } from '../../api/axiosClient.js';

const INR = (n) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function AddInvoiceModal({ open, onClose, onCreated, initial = null }) {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ invoiceNumber: '', supplyOrder: '', state: '', district: '', amount: '', gstRate: '', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      api.get('/reference/supply-orders').then((r) => setOrders(r.data.data)).catch(() => {});
    }
    if (open && initial) {
      setForm({
        invoiceNumber: initial.invoiceNumber || '',
        supplyOrder: initial.supplyOrder?._id || initial.supplyOrder || '',
        state: initial.state || '',
        district: initial.district || '',
        amount: initial.amount || '',
        gstRate: initial.gstRate || '',
        dueDate: initial.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : '',
      });
    }
    if (open && !initial) {
      setForm({ invoiceNumber: '', supplyOrder: '', state: '', district: '', amount: '', gstRate: '', dueDate: '' });
    }
  }, [open, initial]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (initial && initial._id) {
        await api.put(`/invoices/${initial._id}`, {
          invoiceNumber: form.invoiceNumber,
          supplyOrder: form.supplyOrder,
          state: form.state,
          district: form.district,
          amount: Number(form.amount),
          gstRate: form.gstRate ? Number(form.gstRate) : undefined,
          dueDate: form.dueDate,
        });
      } else {
        await api.post('/invoices', {
          invoiceNumber: form.invoiceNumber,
          supplyOrder: form.supplyOrder,
          state: form.state,
          district: form.district,
          amount: Number(form.amount),
          gstRate: form.gstRate ? Number(form.gstRate) : undefined,
          dueDate: form.dueDate,
        });
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || (initial && initial._id ? 'Failed to update invoice' : 'Failed to create invoice'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Create invoice" onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Invoice number" required>
          <input className="input" value={form.invoiceNumber} onChange={(e) => set('invoiceNumber', e.target.value)} placeholder="INV/2026/0013" required />
        </Field>
        <Field label="Supply order" required>
          <select className="input" value={form.supplyOrder} onChange={(e) => set('supplyOrder', e.target.value)} required>
            <option value="">Select order</option>
            {orders.map((o) => <option key={o._id} value={o._id}>{o.orderNumber} — {o.state}</option>)}
          </select>
        </Field>
        <div className="form-grid">
          <Field label="State">
            <input className="input" value={form.state} onChange={(e) => set('state', e.target.value)} />
          </Field>
          <Field label="District">
            <input className="input" value={form.district} onChange={(e) => set('district', e.target.value)} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Amount (₹)" required>
            <input className="input" type="number" min="1" value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
          </Field>
          <Field label="GST rate (%)">
            <input className="input" type="number" min="0" max="100" value={form.gstRate} onChange={(e) => set('gstRate', e.target.value)} placeholder="e.g. 18" />
          </Field>
        </div>
        {Number(form.amount) > 0 && Number(form.gstRate) > 0 && (
          <div className="form-hint">
            Amount includes GST — taxable {INR(Number(form.amount) * 100 / (100 + Number(form.gstRate)))} · GST {INR(Number(form.amount) - Number(form.amount) * 100 / (100 + Number(form.gstRate)))}
          </div>
        )}
        <div className="form-grid">
          <Field label="Due date" required>
            <input className="input" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} required />
          </Field>
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : 'Create invoice'}</button>
        </div>
      </form>
    </Modal>
  );
}