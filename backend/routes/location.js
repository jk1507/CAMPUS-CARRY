import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { locationUpdateSchema, locationParamsSchema } from '../validators/index.js';
const router = express.Router();

router.post('/update', authenticate, validate(locationUpdateSchema), async (req, res) => {
  try {
    const { lat, lng, request_id } = req.body;
    await pool.query(
      `INSERT INTO locations (user_id, lat, lng, request_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE lat=VALUES(lat), lng=VALUES(lng), updated_at=NOW()`,
      [req.user.id, lat, lng, request_id ?? null]
    );
    if (request_id) {
      const [rRows] = await pool.query('SELECT requester_id, campus FROM requests WHERE id = ?', [request_id]).catch(() => [[]]);
      const reqInfo = rRows?.[0];

      // Also update request table coords
      await pool.query(
        `UPDATE requests SET carrier_lat = ?, carrier_lng = ?, carrier_updated_at = NOW() WHERE id = ? AND carrier_id = ?`,
        [lat, lng, request_id, req.user.id]
      ).catch(() => {});

      const io = req.app.get('io');
      const locPayload = { userId: req.user.id, lat, lng, name: req.user.name, requestId: request_id, timestamp: new Date().toISOString() };
      if (io) {
        io.to(`request:${request_id}`).emit('location:update', locPayload);
        if (reqInfo?.requester_id) {
          io.to(`user:${reqInfo.requester_id}`).emit('location:update', locPayload);
        }
      }
    }
    return res.json({ success: true, data: { lat, lng } });
  } catch { return res.status(500).json({ success: false, error: 'Failed to update location' }); }
});

router.get('/:userId', authenticate, validate(locationParamsSchema), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT lat, lng, updated_at FROM locations WHERE user_id = ?', [req.params.userId]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: rows[0] });
  } catch { return res.status(500).json({ success: false, error: 'Failed to fetch location' }); }
});

router.get('/request/:requestId', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT carrier_address, carrier_lat, carrier_lng, carrier_updated_at 
       FROM requests WHERE id = ?`,
      [req.params.requestId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Request not found' });
    return res.json({ success: true, data: rows[0] });
  } catch { return res.status(500).json({ success: false, error: 'Failed to fetch request carrier location' }); }
});

export default router;
