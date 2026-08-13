import React, { useEffect, useState } from 'react';
import Modal, { Field } from '../Modal.jsx';
import { api } from '../../api/axiosClient.js';

export default function AddFittingModal({ open, onClose, onCreated }) {
  const [frames, setFrames] = useState([]);
  const [fitters, setFitters] = useState([]);
  const [form, setForm] = useState({ frame: '', fitter: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setForm({ frame: '', fitter: '' });
      api.get('/reference/frames?readiness=pending,verified').then((r) => setFrames(r.data.data)).catch(() => {});
      api.get('/reference/fitters').then((r) => setFitters(r.data.data)).catch(() => {});
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/fitting', { frame: form.frame, fitter: form.fitter });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create fitting task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Assign fitting task" onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Frame" required>
          <select className="input" value={form.frame} onChange={(e) => setForm({ ...form, frame: e.target.value })} required>
            <option value="">Select frame</option>
            {frames.map((f) => <option key={f._id} value={f._id}>{f.frameCode}</option>)}
          </select>
        </Field>
        <Field label="Fitter" required>
          <select className="input" value={form.fitter} onChange={(e) => setForm({ ...form, fitter: e.target.value })} required>
            <option value="">Select fitter</option>
            {fitters.map((f) => <option key={f._id} value={f._id}>{f.name} — {f.phone}</option>)}
          </select>
        </Field>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : 'Assign'}</button>
        </div>
      </form>
    </Modal>
  );
}
