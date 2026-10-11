import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    return res.json({ success: true, data: rows });
  } catch { return res.status(500).json({ success: false, error: 'Failed' }); }
});

router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const nid = parseInt(id, 10);
    if (!Number.isFinite(nid) || nid < 1) return res.status(400).json({ success: false, error: 'Invalid notification ID' });
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [nid, req.user.id]);
    return res.json({ success: true, data: { message: 'Marked read' } });
  } catch { return res.status(500).json({ success: false, error: 'Failed' }); }
});

export default router;
