import React, { useRef, useState } from 'react';

// Tiny hook + component for transient success/error feedback. Pages call show(text, tone)
// and a pill slides in top-right, auto-dismissing after a few seconds.
export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = (text, tone = 'success') => {
    setToast({ text, tone });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

export default function Toast({ toast }) {
  if (!toast) return null;
  return <div className={`toast${toast.tone === 'danger' ? ' toast-danger' : ''}`}>{toast.text}</div>;
}