import { api } from './axiosClient.js';

// Fetches a binary resource through the authed axios client (blob) and triggers a
// download. Used for invoice PDFs, challans and CSV report exports — the token never
// has to leak into a plain <a href>.
export async function downloadResource(url, filename) {
  const res = await api.get(url, { responseType: 'blob' });
  const href = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}