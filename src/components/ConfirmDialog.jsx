import React from 'react';
import Modal from './Modal.jsx';

export default function ConfirmDialog({ open, title, message, onConfirm, onClose, confirmLabel = 'DELETE', cancelLabel = 'Cancel' }) {
  return (
    <Modal open={open} title={title} onClose={onClose} wide={false}>
      <div style={{ padding: '8px 0' }}>
        <p style={{ color: 'var(--color-text-dim)', marginTop: 0 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>{cancelLabel}</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
