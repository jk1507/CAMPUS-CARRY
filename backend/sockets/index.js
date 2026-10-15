import jwt from 'jsonwebtoken';
import logger from '../logger.js';

export const initSockets = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try { socket.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
    catch { next(new Error('Invalid token')); }
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { userId: socket.user.id, name: socket.user.name });

    // Automatically join user's own private room for direct notifications
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    socket.on('join:user', (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on('join:campus', (campus) => {
      if (campus) {
        socket.join(`campus:${campus}`);
        socket.join(`campus:${campus.trim().toLowerCase()}`);
      }
    });
    socket.on('join:request', (requestId) => socket.join(`request:${requestId}`));
    socket.on('leave:request', (requestId) => socket.leave(`request:${requestId}`));

    socket.on('location:send', ({ lat, lng, requestId, address, role }) => {
      const payload = {
        userId: socket.user.id,
        name: socket.user.name,
        role: role || socket.user.role || 'peer',
        lat,
        lng,
        address: address || null,
        timestamp: new Date().toISOString(),
      };
      if (requestId) {
        socket.to(`request:${requestId}`).emit('location:update', payload);
      }
      if (socket.user?.campus) {
        socket.to(`campus:${socket.user.campus}`).emit('location:update', payload);
        socket.to(`campus:${socket.user.campus.trim().toLowerCase()}`).emit('location:update', payload);
      }
    });

    socket.on('carrier:broadcastLocation', ({ requestId, requesterId, address, lat, lng }) => {
      const payload = {
        requestId,
        carrierId: socket.user.id,
        carrierName: socket.user.name,
        address,
        lat,
        lng,
        updatedAt: new Date().toISOString(),
      };
      if (requestId) io.to(`request:${requestId}`).emit('carrier:locationBroadcast', payload);
      if (requesterId) io.to(`user:${requesterId}`).emit('carrier:locationBroadcast', payload);
    });

    socket.on('message:send', ({ requestId, message, imageUrl }) => {
      const text = (message || '').trim() || (imageUrl ? '📷 [Photo Attached]' : '');
      if (!text && !imageUrl) return;
      const payload = {
        fromId: socket.user.id,
        fromName: socket.user.name || 'User',
        message: text,
        image_url: imageUrl || null,
        timestamp: new Date().toISOString()
      };
      io.to(`request:${requestId}`).emit('message:receive', payload);
      socket.broadcast.emit('chat:notify', { requestId, fromName: socket.user.name, message: text.slice(0, 60) });
    });

    socket.on('disconnect', () => logger.info('Socket disconnected', { userId: socket.user.id }));
  });
};
