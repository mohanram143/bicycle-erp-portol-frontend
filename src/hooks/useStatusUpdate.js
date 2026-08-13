import { useState } from 'react';
import { api } from '../api/axiosClient.js';
import { statusLabel } from '../config/statusConfig.js';

// Optimistic status updater. The row flips to the chosen value instantly and the
// PATCH runs in the background — the select never freezes "black" and there is no
// blanking/1-second wait. On failure the previous value is restored and a danger
// toast is shown. Derived stat cards recompute automatically from the row array.
export function useStatusUpdate(show) {
  const [busyId, setBusyId] = useState(null);

  const commit = ({ endpoint, id, field = 'status', next, rows, setRows, itemLabel }) => {
    const prev = rows.find((r) => r._id === id)?.[field];
    if (prev === next) return;

    setRows(rows.map((r) => (r._id === id ? { ...r, [field]: next } : r)));
    setBusyId(id);

    api.patch(endpoint, { [field]: next })
      .then(() => show(`${itemLabel} → ${statusLabel(next)}`))
      .catch((err) => {
        setRows(rows.map((r) => (r._id === id ? { ...r, [field]: prev || r[field] } : r)));
        show(err.response?.data?.message || 'Update failed', 'danger');
      })
      .finally(() => setBusyId(null));
  };

  return { busyId, commit };
}