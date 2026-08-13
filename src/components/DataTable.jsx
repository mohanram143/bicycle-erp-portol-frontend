import React from 'react';

// Generic, reusable table used across every list page (Supply Orders, Shipments,
// Deliveries, Invoices, Users) — columns are declarative so each page stays a thin
// data-fetch + column-definition file instead of re-implementing table markup.
export default function DataTable({ columns, rows, emptyLabel = 'No records found' }) {
  if (!rows?.length) {
    return <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-dim)' }}>{emptyLabel}</div>;
  }
  return (
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row._id || row.id || i}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
