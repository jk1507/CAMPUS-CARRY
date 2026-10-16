import jwt from 'jsonwebtoken';
import pool from '../db.js';
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
    socket.on('join:request', async (requestId) => {
      try {
        const [rows] = await pool.query('SELECT requester_id, carrier_id FROM requests WHERE id = ?', [requestId]);
        if (!rows.length) return;
        const r = rows[0];
        // Only allow requester or carrier to join this request's room
        if (socket.user?.id && (socket.user.id === r.requester_id || socket.user.id === r.carrier_id)) {
          socket.join(`request:${requestId}`);
        }
      } catch (err) {
        logger.error('Error joining request room', { err: err.message, requestId });
      }
    });
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

    socket.on('message:send', async ({ requestId, message, imageUrl }) => {
      const text = (message || '').trim() || (imageUrl ? '📷 [Photo Attached]' : '');
      if (!text && !imageUrl) return;

      try {
        const [rows] = await pool.query('SELECT requester_id, carrier_id FROM requests WHERE id = ?', [requestId]);
        if (!rows.length) return;
        const reqRow = rows[0];

        // Ensure sender is actually part of this request
        if (socket.user.id !== reqRow.requester_id && socket.user.id !== reqRow.carrier_id) {
          return;
        }

        const payload = {
          fromId: socket.user.id,
          fromName: socket.user.name || 'User',
          message: text,
          image_url: imageUrl || null,
          timestamp: new Date().toISOString()
        };

        // Deliver message to anyone in the request room (requester/carrier)
        io.to(`request:${requestId}`).emit('message:receive', payload);

        // Notify ONLY the other participant (requester or carrier), never broadcast to all users
        const recipientId = socket.user.id === reqRow.requester_id ? reqRow.carrier_id : reqRow.requester_id;
        if (recipientId) {
          io.to(`user:${recipientId}`).emit('chat:notify', {
            requestId,
            fromName: socket.user.name || 'User',
            message: text.slice(0, 60)
          });
        }
      } catch (err) {
        logger.error('Error sending message socket event', { err: err.message, requestId });
      }
    });

    socket.on('disconnect', () => logger.info('Socket disconnected', { userId: socket.user.id }));
  });
};
