import React from 'react';
import { statusColor, statusLabel, withAlpha } from '../config/statusConfig.js';

// Renders any status as a pill tinted with its semantic colour from statusConfig, so
// badges always match the dashboard charts exactly.
export default function StatusBadge({ status }) {
  const color = statusColor(status);
  return (
    <span
      className="badge"
      style={{ background: withAlpha(color, 0.14), color, border: `1px solid ${withAlpha(color, 0.35)}` }}
    >
      {statusLabel(status)}
    </span>
  );
}