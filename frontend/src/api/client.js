import axios from 'axios';
import useAuthStore from '../store/authStore.js';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const client = axios.create({ baseURL: API_BASE, timeout: 15000 });

client.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) { useAuthStore.getState().logout(); window.location.href = '/auth'; }
    return Promise.reject(err);
  }
);

export default client;
