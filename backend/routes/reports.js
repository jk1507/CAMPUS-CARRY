import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reportSchema } from '../validators/index.js';
const router = express.Router();

router.post('/', authenticate, validate(reportSchema), async (req, res) => {
  try {
    const { reported_user_id, request_id, reason } = req.body;
    await pool.query(
      'INSERT INTO reports (reporter_id, reported_user_id, request_id, reason) VALUES (?, ?, ?, ?)',
      [req.user.id, reported_user_id || req.user.id, request_id || null, reason]
    );
    return res.status(201).json({ success: true, data: { message: 'Report submitted' } });
  } catch { return res.status(500).json({ success: false, error: 'Failed to submit report' }); }
});

export default router;
