import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import logger from '../logger.js';
import { validate } from '../middleware/validate.js';
import { createRequestSchema, updateStatusSchema } from '../validators/index.js';

const router = express.Router();

router.get('/feed', authenticate, async (req, res) => {
  try {
    const { campus, limit = 20, offset = 0 } = req.query;
    const [rows] = await pool.query(
      `SELECT r.*, u.name as requester_name, u.avatar_url, u.rating as requester_rating
       FROM requests r JOIN users u ON r.requester_id = u.id
       WHERE r.status = 'open' AND r.campus = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [campus || req.user.campus, Number(limit), Number(offset)]
    );
    return res.json({ success: true, data: rows });
  } catch { return res.status(500).json({ success: false, error: 'Failed to fetch feed' }); }
});

router.post('/', authenticate, validate(createRequestSchema), async (req, res) => {
  try {
    const { title, description, pickup_location, dropoff_location, reward, weight_kg, deadline } = req.body;
    const [result] = await pool.query(
      `INSERT INTO requests (requester_id, campus, title, description, pickup_location, dropoff_location, reward, weight_kg, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.campus, title, description || null, pickup_location, dropoff_location, reward, weight_kg ?? null, deadline || null]
    );
    const [rows] = await pool.query(
      `SELECT r.*, u.name as requester_name, u.avatar_url, u.rating as requester_rating FROM requests r JOIN users u ON r.requester_id = u.id WHERE r.id = ?`,
      [result.insertId]
    );
    req.app.get('io').to(`campus:${req.user.campus}`).emit('request:new', rows[0]);
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { logger.error('Create request error', { err }); return res.status(500).json({ success: false, error: 'Failed to create request' }); }
});

router.get('/mine', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, cu.name as carrier_name, cu.avatar_url as carrier_avatar, cu.rating as carrier_rating
       FROM requests r LEFT JOIN users cu ON r.carrier_id = cu.id
       WHERE r.requester_id = ? ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch { return res.status(500).json({ success: false, error: 'Failed to fetch requests' }); }
});

router.get('/carrying', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.name as requester_name, u.avatar_url, u.rating as requester_rating
       FROM requests r JOIN users u ON r.requester_id = u.id
       WHERE r.carrier_id = ? ORDER BY r.updated_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch { return res.status(500).json({ success: false, error: 'Failed to fetch carrying' }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*,
         ru.name as requester_name, ru.avatar_url as requester_avatar, ru.rating as requester_rating,
         cu.name as carrier_name, cu.avatar_url as carrier_avatar, cu.rating as carrier_rating, cu.id as carrier_user_id
       FROM requests r
       JOIN users ru ON r.requester_id = ru.id
       LEFT JOIN users cu ON r.carrier_id = cu.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Request not found' });
    return res.json({ success: true, data: rows[0] });
  } catch { return res.status(500).json({ success: false, error: 'Failed to fetch request' }); }
});

router.patch('/:id/accept', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM requests WHERE id = ? AND status = "open"', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Request not available' });
    if (rows[0].requester_id === req.user.id) return res.status(400).json({ success: false, error: 'Cannot accept your own request' });
    await pool.query('UPDATE requests SET carrier_id = ?, status = "accepted" WHERE id = ?', [req.user.id, req.params.id]);
    const [carrier] = await pool.query('SELECT id, name, rating, avatar_url FROM users WHERE id = ?', [req.user.id]);
    const io = req.app.get('io');
    io.to(`campus:${rows[0].campus}`).emit('request:accepted', { requestId: Number(req.params.id), carrierId: req.user.id, carrierName: carrier[0].name, carrierRating: carrier[0].rating });
    io.to(`campus:${rows[0].campus}`).emit('request:removeFromFeed', { requestId: Number(req.params.id) });
    return res.json({ success: true, data: { message: 'Accepted', carrier: carrier[0] } });
  } catch (err) { logger.error('Accept error', { err }); return res.status(500).json({ success: false, error: 'Failed to accept' }); }
});

router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM requests WHERE id = ? AND requester_id = ? AND status = "open"', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Cannot cancel' });
    await pool.query('UPDATE requests SET status = "cancelled" WHERE id = ?', [req.params.id]);
    req.app.get('io').to(`campus:${rows[0].campus}`).emit('request:removeFromFeed', { requestId: Number(req.params.id) });
    return res.json({ success: true, data: { message: 'Cancelled' } });
  } catch { return res.status(500).json({ success: false, error: 'Failed to cancel' }); }
});

router.patch('/:id/status', authenticate, validate(updateStatusSchema), async (req, res) => {
  try {
    const { status } = req.body;
    const [rows] = await pool.query('SELECT * FROM requests WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    const r = rows[0];
    if (r.requester_id !== req.user.id && r.carrier_id !== req.user.id) return res.status(403).json({ success: false, error: 'Not authorized' });
    await pool.query('UPDATE requests SET status = ? WHERE id = ?', [status, req.params.id]);
    req.app.get('io').to(`request:${req.params.id}`).emit('request:statusUpdate', { status, requestId: Number(req.params.id) });
    return res.json({ success: true, data: { status } });
  } catch { return res.status(500).json({ success: false, error: 'Failed to update status' }); }
});

export default router;
