import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { feedbackSchema, feedbackCheckSchema, userParamsSchema } from '../validators/index.js';
const router = express.Router();

router.post('/', authenticate, validate(feedbackSchema), async (req, res) => {
  try {
    const { request_id, to_user_id, rating, comment } = req.body;
    const r = Math.round(rating);
    const [existing] = await pool.query('SELECT id FROM feedback WHERE request_id = ? AND from_user_id = ?', [request_id, req.user.id]);
    if (existing.length > 0) return res.status(409).json({ success: false, error: 'Already submitted' });
    await pool.query('INSERT INTO feedback (request_id, from_user_id, to_user_id, rating, comment) VALUES (?, ?, ?, ?, ?)', [request_id, req.user.id, to_user_id, r, comment || null]);
    const [avg] = await pool.query('SELECT AVG(rating) as avg_rating FROM feedback WHERE to_user_id = ?', [to_user_id]);
    await pool.query('UPDATE users SET rating = ? WHERE id = ?', [avg[0].avg_rating, to_user_id]);
    return res.status(201).json({ success: true, data: { message: 'Submitted' } });
  } catch { return res.status(500).json({ success: false, error: 'Failed to submit feedback' }); }
});

router.get('/check/:requestId', authenticate, validate(feedbackCheckSchema), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id FROM feedback WHERE request_id = ? AND from_user_id = ?', [req.params.requestId, req.user.id]);
    return res.json({ success: true, data: { given: rows.length > 0 } });
  } catch { return res.status(500).json({ success: false, error: 'Failed' }); }
});

router.get('/user/:userId', authenticate, validate(userParamsSchema), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.*, u.name as from_name, u.avatar_url FROM feedback f JOIN users u ON f.from_user_id = u.id WHERE f.to_user_id = ? ORDER BY f.created_at DESC`,
      [req.params.userId]
    );
    return res.json({ success: true, data: rows });
  } catch { return res.status(500).json({ success: false, error: 'Failed to fetch feedback' }); }
});

export default router;
