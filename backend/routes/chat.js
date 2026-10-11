import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { chatMessageSchema } from '../validators/index.js';
const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { request_id, message, image_url } = req.body;
    const msg = (message || '').trim() || (image_url ? '📷 [Photo Attached]' : '');
    if (!msg && !image_url) return res.status(400).json({ success: false, error: 'Message or image required' });

    const [rows] = await pool.query('SELECT * FROM requests WHERE id = ?', [request_id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Request not found' });
    const r = rows[0];
    if (r.requester_id !== req.user.id && r.carrier_id !== req.user.id) return res.status(403).json({ success: false, error: 'Not part of this request' });
    await pool.query('INSERT INTO chat_messages (request_id, from_user_id, message, image_url) VALUES (?, ?, ?, ?)', [request_id, req.user.id, msg, image_url || null]);
    return res.status(201).json({ success: true, data: { message: msg, image_url } });
  } catch { return res.status(500).json({ success: false, error: 'Failed to save message' }); }
});

router.get('/:requestId', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cm.*, u.name as from_name, u.avatar_url FROM chat_messages cm JOIN users u ON cm.from_user_id = u.id WHERE cm.request_id = ? ORDER BY cm.created_at ASC`,
      [req.params.requestId]
    );
    return res.json({ success: true, data: rows });
  } catch { return res.status(500).json({ success: false, error: 'Failed to fetch messages' }); }
});

export default router;
