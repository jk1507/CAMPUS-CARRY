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
    if (request_id) req.app.get('io').to(`request:${request_id}`).emit('location:update', { userId: req.user.id, lat, lng, name: req.user.name });
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

router.get('/:userId', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT lat, lng, updated_at FROM locations WHERE user_id = ?', [req.params.userId]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: rows[0] });
  } catch { return res.status(500).json({ success: false, error: 'Failed to fetch location' }); }
});

export default router;
