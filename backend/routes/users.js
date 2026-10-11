import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateUserSchema, userParamsSchema } from '../validators/index.js';
const router = express.Router();

router.get('/:id', authenticate, validate(userParamsSchema), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, campus, avatar_url, rating, bio, role, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, data: rows[0] });
  } catch { return res.status(500).json({ success: false, error: 'Failed' }); }
});

router.patch('/me', authenticate, validate(updateUserSchema), async (req, res) => {
  try {
    const { name, campus, bio, avatar_url } = req.body;
    const fields = {};
    if (name !== undefined)   fields.name       = name;
    if (campus !== undefined) fields.campus     = campus;
    if (bio !== undefined)    fields.bio        = bio;
    if (avatar_url !== undefined) fields.avatar_url = avatar_url;
    if (!Object.keys(fields).length) return res.status(400).json({ success: false, error: 'No fields' });
    const setClause = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE users SET ${setClause} WHERE id = ?`, [...Object.values(fields), req.user.id]);
    return res.json({ success: true, data: { message: 'Updated' } });
  } catch { return res.status(500).json({ success: false, error: 'Failed to update' }); }
});

export default router;
