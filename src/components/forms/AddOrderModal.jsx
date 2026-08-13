import React, { useEffect, useState } from 'react';
import Modal, { Field } from '../Modal.jsx';
import { api } from '../../api/axiosClient.js';

const DISTRICTS = ['Pune', 'Nashik', 'Aurangabad', 'Nagpur', 'Bhopal', 'Indore', 'Jaipur', 'Jodhpur', 'Lucknow', 'Kanpur', 'Ahmedabad', 'Surat'];

export default function AddOrderModal({ open, onClose, onCreated, initial = null }) {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ orderNumber: '', department: '', state: '', productRate: '', orderedQuantity: '', allocations: [{ district: '', quantity: '' }] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setError(''); api.get('/reference/departments').then((r) => setDepartments(r.data.data)).catch(() => {}); }
    if (open && initial) {
      setForm({
        orderNumber: initial.orderNumber || '',
        department: initial.department?._id || initial.department || '',
        state: initial.state || '',
        productRate: initial.productRate || '',
        orderedQuantity: initial.orderedQuantity || '',
        allocations: (initial.allocations || [{ district: '', quantity: '' }]).map((a) => ({ district: a.district || '', quantity: a.quantity || '' })),
      });
    }
    if (open && !initial) {
      setForm({ orderNumber: '', department: '', state: '', productRate: '', orderedQuantity: '', allocations: [{ district: '', quantity: '' }] });
    }
  }, [open, initial]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setAlloc = (i, k, v) => setForm((f) => ({ ...f, allocations: f.allocations.map((a, idx) => (idx === i ? { ...a, [k]: v } : a)) }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    const allocations = form.allocations
      .filter((a) => a.district && a.quantity)
      .map((a) => ({ district: a.district, quantity: Number(a.quantity) }));
    try {
      if (initial && initial._id) {
        await api.put(`/supply-orders/${initial._id}`, {
          orderNumber: form.orderNumber,
          department: form.department,
          state: form.state,
          productRate: Number(form.productRate),
          orderedQuantity: Number(form.orderedQuantity),
          allocations,
        });
      } else {
        await api.post('/supply-orders', {
          orderNumber: form.orderNumber,
          department: form.department,
          state: form.state,
          productRate: Number(form.productRate),
          orderedQuantity: Number(form.orderedQuantity),
          allocations,
        });
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || (initial && initial._id ? 'Failed to update order' : 'Failed to create order'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={initial && initial._id ? 'Edit supply order' : 'Register supply order'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Order number" required>
          <input className="input" value={form.orderNumber} onChange={(e) => set('orderNumber', e.target.value)} placeholder="SO/2026/0013" required />
        </Field>
        <Field label="Government department" required>
          <select className="input" value={form.department} onChange={(e) => set('department', e.target.value)} required>
            <option value="">Select department</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name} — {d.state}</option>)}
          </select>
        </Field>
        <Field label="State" required>
          <input className="input" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="Maharashtra" required />
        </Field>
        <div className="form-grid">
          <Field label="Product rate (₹)" required>
            <input className="input" type="number" min="0" value={form.productRate} onChange={(e) => set('productRate', e.target.value)} required />
          </Field>
          <Field label="Ordered quantity" required>
            <input className="input" type="number" min="1" value={form.orderedQuantity} onChange={(e) => set('orderedQuantity', e.target.value)} required />
          </Field>
        </div>
        <Field label="Allocations">
          {form.allocations.map((a, i) => (
            <div className="alloc-row" key={i}>
              <select className="input" value={a.district} onChange={(e) => setAlloc(i, 'district', e.target.value)}>
                <option value="">District</option>
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input className="input" type="number" min="0" placeholder="Qty" value={a.quantity} onChange={(e) => setAlloc(i, 'quantity', e.target.value)} />
              <button type="button" className="btn btn-secondary" onClick={() => setForm((f) => ({ ...f, allocations: f.allocations.filter((_, idx) => idx !== i) }))} disabled={form.allocations.length === 1}>−</button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" style={{ marginTop: 6 }} onClick={() => setForm((f) => ({ ...f, allocations: [...f.allocations, { district: '', quantity: '' }] }))}>+ Add allocation</button>
        </Field>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : 'Create order'}</button>
        </div>
      </form>
    </Modal>
  );
}