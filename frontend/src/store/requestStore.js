import { create } from 'zustand';
import client from '../api/client.js';

const useRequestStore = create((set) => ({
  feed: [], myRequests: [], carrying: [], isLoading: false,

  fetchFeed: async (campus) => {
    set({ isLoading: true });
    try { const r = await client.get('/requests/feed', { params: { campus } }); set({ feed: r.data.data, isLoading: false }); }
    catch { set({ isLoading: false }); }
  },

  fetchMine: async () => {
    try { const r = await client.get('/requests/mine'); set({ myRequests: r.data.data }); } catch {}
  },

  fetchCarrying: async () => {
    try { const r = await client.get('/requests/carrying'); set({ carrying: r.data.data }); } catch {}
  },

  createRequest: async (payload) => {
    try {
      const r = await client.post('/requests', payload);
      set(s => ({ myRequests: [r.data.data, ...s.myRequests] }));
      return { success: true, data: r.data.data };
    } catch (err) { return { success: false, error: err.response?.data?.error || 'Failed' }; }
  },

  acceptRequest: async (id) => {
    try { await client.patch(`/requests/${id}/accept`); set(s => ({ feed: s.feed.filter(r => r.id !== id) })); return { success: true }; }
    catch (err) { return { success: false, error: err.response?.data?.error }; }
  },

  cancelRequest: async (id) => {
    try {
      await client.patch(`/requests/${id}/cancel`);
      set(s => ({ myRequests: s.myRequests.map(r => r.id === id ? { ...r, status: 'cancelled' } : r) }));
      return { success: true };
    } catch (err) { return { success: false, error: err.response?.data?.error }; }
  },

  updateStatus: async (id, status) => {
    try { await client.patch(`/requests/${id}/status`, { status }); return { success: true }; }
    catch (err) { return { success: false, error: err.response?.data?.error }; }
  },

  prependToFeed: (req) => set(s => ({ feed: [req, ...s.feed] })),
  removeFromFeed: (id) => set(s => ({ feed: s.feed.filter(r => r.id !== id) })),
  updateMyRequest: (id, patch) => set(s => ({ myRequests: s.myRequests.map(r => r.id === id ? { ...r, ...patch } : r) })),
}));

export default useRequestStore;
