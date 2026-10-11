import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore.js';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = useAuthStore.getState().token;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';
    socket = io(socketUrl, { auth: { token }, transports: ['websocket', 'polling'] });
  }
  return socket;
};

export const disconnectSocket = () => { if (socket) { socket.disconnect(); socket = null; } };
