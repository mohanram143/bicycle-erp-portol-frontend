import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { canAccess } from '../config/rbac.js';

// Guards:
// 1. Auth — not logged in → /login (waits for the silent refresh to finish first).
// 2. RBAC — role is not allowed on this page → /dashboard.
//
// Usage: <ProtectedRoute /> for plain auth, or <ProtectedRoute path="/users" />
// (page-level role check) and/or <ProtectedRoute roles={['admin']} />.
export default function ProtectedRoute({ path, roles }) {
  const { user, hydrated } = useAuthStore();

  if (!hydrated) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  if (path && !canAccess(user.role, path)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}