import { create } from 'zustand';

// Access token + user profile only — intentionally NOT persisted to localStorage/
// sessionStorage (browser storage is readable by any injected script). On a hard
// refresh the token is gone by design; App.jsx silently calls /auth/refresh on mount
// to re-establish a session from the HttpOnly cookie.
export const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,

  setSession: (accessToken, user) => set({ accessToken, user }),
  clearSession: () => set({ accessToken: null, user: null }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
