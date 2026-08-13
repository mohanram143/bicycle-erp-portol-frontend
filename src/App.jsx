import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { refreshSession, startSessionKeepAlive } from './api/axiosClient.js';
import { useAuthStore } from './store/authStore.js';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SupplyOrders from './pages/SupplyOrders.jsx';
import Shipments from './pages/Shipments.jsx';
import Deliveries from './pages/Deliveries.jsx';
import Fitting from './pages/Fitting.jsx';
import QualityInspection from './pages/QualityInspection.jsx';
import ServiceCamps from './pages/ServiceCamps.jsx';
import Documents from './pages/Documents.jsx';
import Invoices from './pages/Invoices.jsx';
import Reports from './pages/Reports.jsx';
import Notifications from './pages/Notifications.jsx';
import Users from './pages/Users.jsx';

export default function App() {
  const { setHydrated } = useAuthStore();

  // On load, the access token is gone (never persisted). Attempt one silent refresh
  // using the HttpOnly cookie so an already-logged-in user isn't bounced to /login
  // just because they refreshed the page. Single-flight means a double mount still
  // issues exactly one request (see axiosClient.refreshSession).
  useEffect(() => {
    refreshSession()
      .catch(() => {})
      .finally(() => setHydrated(true));
    startSessionKeepAlive();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route element={<ProtectedRoute path="/supply-orders" />}>
            <Route path="/supply-orders" element={<SupplyOrders />} />
          </Route>
          <Route element={<ProtectedRoute path="/shipments" />}>
            <Route path="/shipments" element={<Shipments />} />
          </Route>
          <Route element={<ProtectedRoute path="/deliveries" />}>
            <Route path="/deliveries" element={<Deliveries />} />
          </Route>
          <Route element={<ProtectedRoute path="/fitting" />}>
            <Route path="/fitting" element={<Fitting />} />
          </Route>
          <Route element={<ProtectedRoute path="/quality-inspection" />}>
            <Route path="/quality-inspection" element={<QualityInspection />} />
          </Route>
          <Route element={<ProtectedRoute path="/service-camps" />}>
            <Route path="/service-camps" element={<ServiceCamps />} />
          </Route>
          <Route element={<ProtectedRoute path="/documents" />}>
            <Route path="/documents" element={<Documents />} />
          </Route>
          <Route element={<ProtectedRoute path="/invoices" />}>
            <Route path="/invoices" element={<Invoices />} />
          </Route>
          <Route element={<ProtectedRoute path="/reports" />}>
            <Route path="/reports" element={<Reports />} />
          </Route>
          <Route element={<ProtectedRoute path="/notifications" />}>
            <Route path="/notifications" element={<Notifications />} />
          </Route>
          <Route element={<ProtectedRoute path="/users" roles={['super_admin', 'admin']} />}>
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
