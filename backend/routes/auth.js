import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/index.js';
import logger from '../logger.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, campus, role, phone } = req.body;
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ success: false, error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, campus, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hash, campus, role || 'requester', phone || null]
    );
    const token = jwt.sign({ id: result.insertId, email, role: role || 'requester', campus, name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    return res.status(201).json({ 
      success: true, 
      data: { 
        token, 
        id: result.insertId,
        name, 
        email, 
        campus, 
        role: role || 'requester', 
        rating: null,
        avatar_url: null
      } 
    });
  } catch (err) { logger.error('Register error', { err }); return res.status(500).json({ success: false, error: 'Registration failed' }); }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const user = rows[0];
    if (!await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, campus: user.campus, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    return res.json({ 
      success: true, 
      data: { 
        token, 
        id: user.id,
        name: user.name, 
        email: user.email,
        campus: user.campus,
        role: user.role,
        avatar_url: user.avatar_url,
        rating: user.rating
      } 
    });
  } catch (err) { logger.error('Login error', { err }); return res.status(500).json({ success: false, error: 'Login failed' }); }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, campus, role, avatar_url, rating, bio, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, data: rows[0] });
  } catch { return res.status(500).json({ success: false, error: 'Failed to fetch profile' }); }
});

export default router;
