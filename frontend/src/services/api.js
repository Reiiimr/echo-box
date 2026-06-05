import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Users ─────────────────────────────────────────────────────
export const setupProfile   = (data) => api.post('/api/users/setup', data);
export const getMyProfile   = ()     => api.get('/api/users/me');
export const updateProfile  = (data) => api.put('/api/users/profile', data);
export const getUserByName  = (username) => api.get(`/api/users/${username}`);
export const searchUsers    = (q)    => api.get('/api/users/search', { params: { q } });
export const deleteAccount  = ()     => api.delete('/api/users/account');

// ── Box / Items ───────────────────────────────────────────────
export const getInbox    = ()      => api.get('/api/box/inbox');
export const getSent     = ()      => api.get('/api/box/sent');
export const sendItem    = (data)  => api.post('/api/box/send', data);
export const deleteItem  = (id)    => api.delete(`/api/box/item/${id}`);
export const markRead    = (id)    => api.patch(`/api/box/item/${id}/read`);
export const reactToItem = (id, reaction) => api.patch(`/api/box/item/${id}/react`, { reaction });

// ── Blocks ────────────────────────────────────────────────────
export const blockUser   = (target_id) => api.post('/api/blocks', { target_id });
export const unblockUser = (target_id) => api.delete(`/api/blocks/${target_id}`);
export const getBlocked  = ()          => api.get('/api/blocks');
export const checkBlock  = (target_id) => api.get(`/api/blocks/check/${target_id}`);

// ── Reports ───────────────────────────────────────────────────
export const reportUser = (reported_id, reason) =>
  api.post('/api/reports', { reported_id, reason });

export default api;
