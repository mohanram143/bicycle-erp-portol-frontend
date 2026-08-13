import React, { useEffect, useState } from 'react';
import Modal, { Field } from '../Modal.jsx';
import { api } from '../../api/axiosClient.js';

const CATEGORIES = [
  'tender_document', 'purchase_order', 'inspection_report', 'lab_certificate',
  'third_party_inspection', 'unloading_photo', 'delivery_photo', 'delivery_challan',
  'signed_challan', 'service_camp_photo', 'other',
];

// Upload a file (up to 10 MB) into the central document repository (3.18). Multipart
// POST with category + optional entity link + optional GPS tag for photo evidence.
export default function UploadDocumentModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ category: 'other', relatedEntityType: '', relatedEntityId: '', gpsLat: '', gpsLng: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setFile(null);
      setForm({ category: 'other', relatedEntityType: '', relatedEntityId: '', gpsLat: '', gpsLng: '' });
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Choose a file first'); return; }
    setSaving(true); setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', form.category);
    fd.append('relatedEntityType', form.relatedEntityType || 'general');
    if (form.relatedEntityId) fd.append('relatedEntityId', form.relatedEntityId);
    if (form.gpsLat && form.gpsLng) fd.append('gpsLocation', JSON.stringify({ lat: Number(form.gpsLat), lng: Number(form.gpsLng) }));
    try {
      await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Upload document" onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="File" required>
          <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
        </Field>
        <Field label="Category" required>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </select>
        </Field>
        <div className="form-grid">
          <Field label="Linked entity type">
            <input className="input" value={form.relatedEntityType} onChange={(e) => setForm({ ...form, relatedEntityType: e.target.value })} placeholder="e.g. supplyOrder, shipment, camp" />
          </Field>
          <Field label="Linked entity ID">
            <input className="input" value={form.relatedEntityId} onChange={(e) => setForm({ ...form, relatedEntityId: e.target.value })} placeholder="24-char ObjectId" />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="GPS lat (photo evidence)">
            <input className="input" type="number" step="any" value={form.gpsLat} onChange={(e) => setForm({ ...form, gpsLat: e.target.value })} />
          </Field>
          <Field label="GPS lng">
            <input className="input" type="number" step="any" value={form.gpsLng} onChange={(e) => setForm({ ...form, gpsLng: e.target.value })} />
          </Field>
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Uploading…' : 'Upload'}</button>
        </div>
      </form>
    </Modal>
  );
}
