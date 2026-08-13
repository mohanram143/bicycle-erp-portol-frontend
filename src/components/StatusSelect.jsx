import React from 'react';
import { statusColor, statusLabel } from '../config/statusConfig.js';

// Inline status updater used in list tables. Coloured to match the current status so
// the dropdown reads like the badge; wraps itself in a .tip so hovering shows the
// current status in a readable white-on-dark tooltip instead of an invisible native one.
// While a change is in flight the select is left fully styled (no disabled black flash):
// it stays interactive but onChange is guarded and a small spinner appears instead.
export default function StatusSelect({ value, options, onChange, disabled, busy }) {
  const color = statusColor(value);
  const handleChange = (e) => {
    if (busy || disabled) return;
    onChange(e.target.value);
  };

  return (
    <span className={`tip status-select-wrap${busy ? ' busy' : ''}`} data-tip={`Current: ${statusLabel(value)}`}>
      <select
        className="status-select"
        value={value}
        style={{ color, borderColor: color }}
        onChange={handleChange}
      >
        {options.map((s) => (
          <option key={s} value={s}>{statusLabel(s)}</option>
        ))}
      </select>
      {/* Spinner overlay is always present in DOM; visibility toggled via .busy to avoid layout shifts */}
      <span className="status-overlay" aria-hidden="true"><span className="status-spinner" /></span>
    </span>
  );
}