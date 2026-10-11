import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import client from '../api/client.js';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null, user: null, activeRole: null, isLoading: false,

      login: async (email, password, chosenRole) => {
        set({ isLoading: true });
        try {
          const res = await client.post('/auth/login', { email, password });
          const { token, name } = res.data.data;
          set({ token, user: { ...res.data.data, name }, activeRole: chosenRole || res.data.data.role, isLoading: false });
          return { success: true };
        } catch (err) { set({ isLoading: false }); return { success: false, error: err.response?.data?.error || 'Login failed' }; }
      },

      register: async (payload) => {
        set({ isLoading: true });
        try {
          const res = await client.post('/auth/register', payload);
          const { token, role, name } = res.data.data;
          set({ token, user: { ...res.data.data, name }, activeRole: role, isLoading: false });
          return { success: true };
        } catch (err) { set({ isLoading: false }); return { success: false, error: err.response?.data?.error || 'Registration failed' }; }
      },

      fetchMe: async () => {
        try { const res = await client.get('/auth/me'); set(s => ({ user: { ...res.data.data } })); } catch {}
      },

      switchRole: (role) => set({ activeRole: role }),
      logout: () => set({ token: null, user: null, activeRole: null }),
    }),
    { name: 'cc-auth', partialize: s => ({ token: s.token, user: s.user, activeRole: s.activeRole }) }
  )
);

export default useAuthStore;
