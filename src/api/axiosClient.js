import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

// Access token lives only in memory (Zustand store), never localStorage — this is the
// deliberate XSS mitigation called for in the requirements. The refresh token never
// touches JS at all; it's an HttpOnly cookie the browser attaches automatically to
// requests under /api/auth (withCredentials below).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

// Single-flight refresh. The refresh token is single-use and is ROTATED on every
// refresh (old one revoked), so two concurrent calls with the same cookie would race:
// the loser gets 401 against an already-revoked token and the user is wrongly bounced
// to /login. Sharing one in-flight call means a page reload — including React
// StrictMode's dev double-mount — issues exactly ONE /auth/refresh request.
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh', null, { skipAuthRefresh: true })
      .then(({ data }) => {
        useAuthStore.getState().setSession(data.data.accessToken, data.data.user);
        return data.data.accessToken;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;

    // The refresh call itself must never trigger the recovery path (that would recurse
    // into itself and hang or force a logout loop).
    if (config?.skipAuthRefresh) return Promise.reject(error);

    if (response?.status === 401 && config && !config._retried) {
      config._retried = true;
      try {
        const accessToken = await refreshSession();
        config.headers.Authorization = `Bearer ${accessToken}`;
        return api(config);
      } catch (refreshErr) {
        useAuthStore.getState().clearSession();
        if (window.location.pathname !== '/login') window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

// Proactive session keep-alive. The access token is short-lived (2h) and kept only in
// memory, so a user who idles past the expiry relies on the interceptor's single 401
// retry — which is exactly the "logs me out after a while" race. Re-issuing the access
// token every few minutes (and whenever the tab regains focus) keeps the session warm
// so an idle tab never hits that window. Failures here are ignored; a genuinely expired
// refresh cookie (7d) is still handled by the interceptor's normal 401 → /login path.
export function startSessionKeepAlive() {
  const refresh = () => {
    const { accessToken, user } = useAuthStore.getState();
    if (!accessToken || !user) return;
    if (window.location.pathname === '/login') return;
    refreshSession().catch(() => {});
  };
  window.setInterval(refresh, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh();
  });
}
