import React, { useEffect, useState } from 'react';
import Modal, { Field } from '../Modal.jsx';
import { api } from '../../api/axiosClient.js';

export default function AddShipmentModal({ open, onClose, onCreated, initial = null }) {
  const [orders, setOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({ supplyOrder: '', vehicle: '', driver: '', state: '', district: '', school: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      Promise.all([
        api.get('/reference/supply-orders'),
        api.get('/reference/vehicles'),
        api.get('/reference/drivers'),
      ]).then(([o, v, d]) => {
        setOrders(o.data.data); setVehicles(v.data.data); setDrivers(d.data.data);
      }).catch(() => {});
      if (initial) {
        setForm({
          supplyOrder: initial.supplyOrder?._id || initial.supplyOrder || '',
          vehicle: initial.vehicle?._id || initial.vehicle || '',
          driver: initial.driver?._id || initial.driver || '',
          state: initial.destination?.state || '',
          district: initial.destination?.district || '',
          school: initial.destination?.school || '',
        });
      } else {
        setForm({ supplyOrder: '', vehicle: '', driver: '', state: '', district: '', school: '' });
      }
    }
  }, [open, initial]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (initial && initial._id) {
        await api.put(`/transportation/shipments/${initial._id}`, {
          supplyOrder: form.supplyOrder,
          vehicle: form.vehicle || undefined,
          driver: form.driver || undefined,
          destination: { state: form.state, district: form.district, school: form.school },
        });
      } else {
        await api.post('/transportation/shipments', {
          supplyOrder: form.supplyOrder,
          vehicle: form.vehicle || undefined,
          driver: form.driver || undefined,
          destination: { state: form.state, district: form.district, school: form.school },
        });
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || (initial && initial._id ? 'Failed to update shipment' : 'Failed to create shipment'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={initial && initial._id ? 'Edit shipment' : 'Create shipment'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Supply order" required>
          <select className="input" value={form.supplyOrder} onChange={(e) => set('supplyOrder', e.target.value)} required>
            <option value="">Select order</option>
            {orders.map((o) => <option key={o._id} value={o._id}>{o.orderNumber} — {o.state} ({o.status})</option>)}
          </select>
        </Field>
        <div className="form-grid">
          <Field label="Vehicle">
            <select className="input" value={form.vehicle} onChange={(e) => set('vehicle', e.target.value)}>
              <option value="">Not assigned</option>
              {vehicles.map((v) => <option key={v._id} value={v._id}>{v.registrationNumber}</option>)}
            </select>
          </Field>
          <Field label="Driver">
            <select className="input" value={form.driver} onChange={(e) => set('driver', e.target.value)}>
              <option value="">Not assigned</option>
              {drivers.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Destination state" required>
          <input className="input" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="Maharashtra" required />
        </Field>
        <Field label="District">
          <input className="input" value={form.district} onChange={(e) => set('district', e.target.value)} placeholder="Pune" />
        </Field>
        <Field label="School">
          <input className="input" value={form.school} onChange={(e) => set('school', e.target.value)} placeholder="Govt. High School" />
        </Field>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : 'Create shipment'}</button>
        </div>
      </form>
    </Modal>
  );
}