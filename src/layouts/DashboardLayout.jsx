import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useThemeStore } from '../store/themeStore.js';
import { api } from '../api/axiosClient.js';
import { pagesForRole } from '../config/rbac.js';

export default function DashboardLayout() {
  const { user, clearSession } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const onDashboard = location.pathname === '/dashboard';

  const navItems = pagesForRole(user?.role);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    clearSession();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand"><span className="logo-mark">H</span><span>HERO</span><span style={{ color: 'var(--color-primary)' }}>ERP</span></div>
        </div>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {item.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {/* Keep sidebar minimal: theme toggle + small user info. Header holds full actions */}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            )}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <div style={{ fontSize: 13, color: 'var(--color-text-dim)', padding: '0 10px', textAlign: 'center' }}>
            {user?.name} · {user?.role}
          </div>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
