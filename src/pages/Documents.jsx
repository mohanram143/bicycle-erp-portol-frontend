import React, { useEffect, useState } from 'react';
import { api } from '../api/axiosClient.js';
import DataTable from '../components/DataTable.jsx';
import StatCard from '../components/StatCard.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import UploadDocumentModal from '../components/forms/UploadDocumentModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { downloadResource } from '../api/download.js';
import { useAuthStore } from '../store/authStore.js';

const CAN_UPLOAD = ['super_admin', 'admin', 'factory_user', 'quality_inspector', 'government', 'state_officer'];
const fmtBytes = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n >= 1024 ? `${(n / 1024).toFixed(0)} KB` : `${n || 0} B`);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

export default function Documents() {
  const { user } = useAuthStore();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [open, setOpen] = useState(false);
  const { toast, show } = useToast();

  const canUpload = CAN_UPLOAD.includes(user?.role);
  const canDelete = user?.role === 'super_admin' || user?.role === 'admin';

  const load = () => {
    setLoading(true);
    api.get(`/documents${category ? `?category=${category}` : ''}`).then((r) => setDocs(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(load, [category]);

  const [confirmDoc, setConfirmDoc] = useState(null);
  const remove = (doc) => setConfirmDoc(doc);
  const confirmRemove = () => {
    if (!confirmDoc) return;
    api.delete(`/documents/${confirmDoc._id}`).then(() => { show('Document deleted'); setConfirmDoc(null); load(); }).catch((err) => { show(err.response?.data?.message || 'Delete failed', 'danger'); setConfirmDoc(null); });
  };
  const cancelRemove = () => setConfirmDoc(null);

  const totalBytes = docs.reduce((s, d) => s + (d.sizeBytes || 0), 0);

  const columns = [
    { key: 'fileName', header: 'File' },
    { key: 'category', header: 'Category', render: (r) => r.category.replace(/_/g, ' ') },
    { key: 'relatedEntityType', header: 'Linked To' },
    { key: 'sizeBytes', header: 'Size', render: (r) => fmtBytes(r.sizeBytes) },
    { key: 'createdAt', header: 'Uploaded', render: (r) => fmtDate(r.createdAt) },
    {
      key: 'actions', header: '',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => downloadResource(`/documents/${r._id}/download`, r.fileName).catch(() => show('Download failed', 'danger'))}>
            Download
          </button>
          {canDelete && (
            <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => remove(r)}>Delete</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Document Repository</h1>
          <p className="page-sub">Tenders, purchase orders, inspection reports, signed challans & field photos</p>
        </div>
        {canUpload && <button className="btn" onClick={() => setOpen(true)}>+ Upload Document</button>}
      </div>
      <div className="grid-stats">
        <StatCard label="Documents" value={docs.length} />
        <StatCard label="Total Size" value={fmtBytes(totalBytes)} />
        <StatCard label="Filter" value={category ? category.replace(/_/g, ' ') : 'All'} />
      </div>
      <div className="card" style={{ padding: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['', 'tender_document', 'purchase_order', 'inspection_report', 'lab_certificate', 'signed_challan', 'service_camp_photo', 'other'].map((c) => (
            <button key={c} className={`filter-chip${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>
              {c ? c.replace(/_/g, ' ') : 'All'}
            </button>
          ))}
        </div>
      </div>
      {loading ? <div style={{ color: 'var(--color-text-dim)' }}>Loading…</div> : <DataTable columns={columns} rows={docs} emptyLabel="No documents uploaded yet" />}
      <UploadDocumentModal open={open} onClose={() => setOpen(false)} onCreated={() => { show('Document uploaded'); load(); }} />
      <ConfirmDialog open={!!confirmDoc} title={`Delete "${confirmDoc?.fileName || ''}"?`} message="Delete permanently? This cannot be undone." onConfirm={confirmRemove} onClose={cancelRemove} confirmLabel="DELETE" cancelLabel="Cancel" />
      <Toast toast={toast} />
    </>
  );
}
