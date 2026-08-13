import React, { useEffect, useState } from 'react';
import Modal, { Field } from '../Modal.jsx';
import { api } from '../../api/axiosClient.js';

export default function AddDeliveryModal({ open, onClose, onCreated, initial = null }) {
  const [shipments, setShipments] = useState([]);
  const [form, setForm] = useState({ shipment: '', school: '', district: '', state: '', deliveredQuantity: '', lat: '', lng: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      api.get('/reference/shipments').then((r) => setShipments(r.data.data)).catch(() => {});
      if (initial) {
        // Prefill form for editing
        setForm({
          shipment: initial.shipment || '',
          school: initial.school || '',
          district: initial.district || '',
          state: initial.state || '',
          deliveredQuantity: initial.deliveredQuantity || '',
          lat: initial.gpsLocation?.lat || '',
          lng: initial.gpsLocation?.lng || '',
        });
      } else {
        setForm({ shipment: '', school: '', district: '', state: '', deliveredQuantity: '', lat: '', lng: '' });
      }
    }
  }, [open, initial]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (initial && initial._id) {
        // Edit existing delivery
        await api.put(`/deliveries/${initial._id}`, {
          shipment: form.shipment,
          school: form.school,
          district: form.district,
          state: form.state,
          deliveredQuantity: Number(form.deliveredQuantity),
          gpsLocation: { lat: Number(form.lat), lng: Number(form.lng) },
        });
      } else {
        await api.post('/deliveries', {
          shipment: form.shipment,
          school: form.school,
          district: form.district,
          state: form.state,
          deliveredQuantity: Number(form.deliveredQuantity),
          gpsLocation: { lat: Number(form.lat), lng: Number(form.lng) },
        });
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={initial && initial._id ? 'Edit delivery' : 'Confirm delivery'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Shipment" required>
          <select className="input" value={form.shipment} onChange={(e) => set('shipment', e.target.value)} required>
            <option value="">Select shipment</option>
            {shipments.map((s) => <option key={s._id} value={s._id}>{s.shipmentCode} — {s.destination?.district || ''} {s.destination?.state || ''}</option>)}
          </select>
        </Field>
        <Field label="School" required>
          <input className="input" value={form.school} onChange={(e) => set('school', e.target.value)} required />
        </Field>
        <div className="form-grid">
          <Field label="District">
            <input className="input" value={form.district} onChange={(e) => set('district', e.target.value)} />
          </Field>
          <Field label="State">
            <input className="input" value={form.state} onChange={(e) => set('state', e.target.value)} />
          </Field>
        </div>
        <Field label="Delivered quantity" required>
          <input className="input" type="number" min="1" value={form.deliveredQuantity} onChange={(e) => set('deliveredQuantity', e.target.value)} required />
        </Field>
        <div className="form-grid">
          <Field label="GPS lat">
            <input className="input" type="number" step="any" value={form.lat} onChange={(e) => set('lat', e.target.value)} />
          </Field>
          <Field label="GPS lng">
            <input className="input" type="number" step="any" value={form.lng} onChange={(e) => set('lng', e.target.value)} />
          </Field>
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : 'Confirm delivery'}</button>
        </div>
      </form>
    </Modal>
  );
}