import React, { useState } from 'react';
import Modal, { Field } from '../Modal.jsx';
import { api } from '../../api/axiosClient.js';

const ROLES = [
  'super_admin', 'admin', 'factory_user', 'transport_user', 'government',
  'state_officer', 'site_supervisor', 'fitter', 'quality_inspector', 'finance_officer',
];

export default function AddUserModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '', state: '', district: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/users', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        state: form.state,
        district: form.district,
        password: form.password || undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Create user" onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Full name" required>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </Field>
        <div className="form-grid">
          <Field label="Email" required>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </Field>
          <Field label="Phone" required>
            <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
          </Field>
        </div>
        <Field label="Role" required>
          <select className="input" value={form.role} onChange={(e) => set('role', e.target.value)} required>
            <option value="">Select role</option>
            {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
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
        <Field label="Password (optional, for email login)">
          <input className="input" type="password" minLength="8" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min 8 characters" />
        </Field>
        {error && <div className="error-text">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : 'Create user'}</button>
        </div>
      </form>
    </Modal>
  );
}