import React, { useEffect, useState } from 'react';
import Modal, { Field } from '../Modal.jsx';
import { api } from '../../api/axiosClient.js';

export default function AddInspectionModal({ open, onClose, onCreated }) {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ supplyOrder: '', result: 'pending', remarks: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      api.get('/reference/supply-orders').then((r) => setOrders(r.data.data)).catch(() => {});
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/quality-inspection', {
        supplyOrder: form.supplyOrder,
        result: form.result,
        remarks: form.remarks || undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create inspection record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="New inspection record" onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Supply order" required>
          <select className="input" value={form.supplyOrder} onChange={(e) => setForm({ ...form, supplyOrder: e.target.value })} required>
            <option value="">Select order</option>
            {orders.map((o) => <option key={o._id} value={o._id}>{o.orderNumber} — {o.state}</option>)}
          </select>
        </Field>
        <Field label="Result" required>
          <select className="input" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}>
            <option value="pending">Pending</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="conditional">Conditional</option>
          </select>
        </Field>
        <Field label="Remarks">
          <textarea className="input" rows="3" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Batch, standards checked, notes…" />
        </Field>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : 'Create record'}</button>
        </div>
      </form>
    </Modal>
  );
}
