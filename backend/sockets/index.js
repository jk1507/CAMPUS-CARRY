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

    socket.on('join:campus',  (campus)    => socket.join(`campus:${campus}`));
    socket.on('join:request', (requestId) => socket.join(`request:${requestId}`));
    socket.on('leave:request',(requestId) => socket.leave(`request:${requestId}`));

    socket.on('location:send', ({ lat, lng, requestId }) => {
      if (requestId) {
        socket.to(`request:${requestId}`).emit('location:update', {
          userId: socket.user.id, name: socket.user.name, lat, lng, timestamp: new Date().toISOString(),
        });
      }
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
