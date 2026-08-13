import React, { useEffect, useState } from 'react';
import Modal, { Field } from '../Modal.jsx';
import { api } from '../../api/axiosClient.js';

export default function AddServiceCampModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ location: '', school: '', state: '', district: '', scheduledDate: '', attendanceCount: '', activities: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) setError('');
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/service-camps', {
        location: form.location,
        school: form.school || undefined,
        state: form.state || undefined,
        district: form.district || undefined,
        scheduledDate: form.scheduledDate,
        attendanceCount: form.attendanceCount ? Number(form.attendanceCount) : undefined,
        activities: form.activities ? form.activities.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule camp');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Schedule service camp" onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Location / venue" required>
          <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
        </Field>
        <div className="form-grid">
          <Field label="School">
            <input className="input" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
          </Field>
          <Field label="Scheduled date" required>
            <input className="input" type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} required />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="State">
            <input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </Field>
          <Field label="District">
            <input className="input" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Attendance count">
            <input className="input" type="number" min="0" value={form.attendanceCount} onChange={(e) => setForm({ ...form, attendanceCount: e.target.value })} />
          </Field>
          <Field label="Activities (comma separated)">
            <input className="input" value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} placeholder="free repair, spare fitting" />
          </Field>
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : 'Schedule camp'}</button>
        </div>
      </form>
    </Modal>
  );
}
