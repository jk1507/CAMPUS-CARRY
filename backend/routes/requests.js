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
    
    // MySQL expects YYYY-MM-DD HH:MM:SS or null for DATETIME
    let formattedDeadline = null;
    if (deadline) {
      const d = new Date(deadline);
      if (!isNaN(d.getTime())) {
        formattedDeadline = d.toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    // Generate 4-digit delivery verification OTP
    const generatedOtp = String(Math.floor(1000 + Math.random() * 9000));

    const [result] = await pool.query(
      `INSERT INTO requests (requester_id, campus, title, description, pickup_location, dropoff_location, reward, weight_kg, deadline, otp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.campus, title, description || null, pickup_location, dropoff_location, Number(reward), weight_kg ? Number(weight_kg) : null, formattedDeadline, generatedOtp]
    );
    const [rows] = await pool.query(
      `SELECT r.*, u.name as requester_name, u.avatar_url, u.rating as requester_rating FROM requests r JOIN users u ON r.requester_id = u.id WHERE r.id = ?`,
      [result.insertId]
    );
    try {
      req.app.get('io')?.to(`campus:${req.user.campus}`).emit('request:new', rows[0]);
    } catch (e) {
      logger.warn('Socket broadcast failed', { err: e.message });
    }
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error('Create request error', { err: err.message, stack: err.stack });
    return res.status(500).json({ success: false, error: err.message || 'Failed to create request' });
  }
});

// Campus Carrier Leaderboard & Badges
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const campus = req.query.campus || req.user.campus;
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.avatar_url, u.rating,
              COUNT(r.id) as completed_deliveries,
              COALESCE(SUM(r.reward), 0) as total_earnings
       FROM users u
       LEFT JOIN requests r ON u.id = r.carrier_id AND r.status = 'delivered'
       WHERE u.campus = ?
       GROUP BY u.id
       ORDER BY completed_deliveries DESC, total_earnings DESC, u.rating DESC
       LIMIT 10`,
      [campus]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Leaderboard error', { err: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
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
    const requestId = Number(req.params.id);
    const [rows] = await pool.query('SELECT * FROM requests WHERE id = ?', [requestId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    const current = rows[0];
    if (current.status !== 'open') {
      return res.status(400).json({ success: false, error: `This request is already ${current.status}` });
    }
    if (current.requester_id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot accept your own request. Please test with another carrier account or request from another student.'
      });
    }

    await pool.query('UPDATE requests SET carrier_id = ?, status = "accepted" WHERE id = ?', [req.user.id, requestId]);
    const [carrier] = await pool.query('SELECT id, name, rating, avatar_url FROM users WHERE id = ?', [req.user.id]);
    
    try {
      const io = req.app.get('io');
      io?.to(`campus:${current.campus}`).emit('request:accepted', {
        requestId,
        carrierId: req.user.id,
        carrierName: carrier[0]?.name || req.user.name,
        carrierRating: carrier[0]?.rating
      });
      io?.to(`campus:${current.campus}`).emit('request:removeFromFeed', { requestId });
    } catch (e) {
      logger.warn('Socket emit on accept failed', { err: e.message });
    }

    return res.json({ success: true, data: { message: 'Accepted successfully', carrier: carrier[0] } });
  } catch (err) {
    logger.error('Accept error', { err: err.message });
    return res.status(500).json({ success: false, error: err.message || 'Failed to accept request' });
  }
});

// Verify 4-Digit Delivery Handover OTP & Photo Proof
router.post('/:id/verify-otp', authenticate, async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const { otp, proof_photo } = req.body;

    const [rows] = await pool.query('SELECT * FROM requests WHERE id = ?', [requestId]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Request not found' });

    const reqData = rows[0];
    if (reqData.carrier_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only the assigned carrier can deliver this order' });
    }

    if (reqData.status === 'delivered') {
      return res.status(400).json({ success: false, error: 'This order is already delivered' });
    }

    // Verify OTP matching (or allow demo bypass if empty)
    if (reqData.otp && String(reqData.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ success: false, error: 'Incorrect 4-digit OTP. Please ask the requester for their code.' });
    }

    await pool.query(
      'UPDATE requests SET status = "delivered", paid_out = 1, proof_photo = ? WHERE id = ?',
      [proof_photo || null, requestId]
    );

    req.app.get('io')?.to(`request:${requestId}`).emit('request:statusUpdate', {
      status: 'delivered',
      requestId,
      proof_photo: proof_photo || null,
    });

    return res.json({
      success: true,
      data: { message: 'OTP verified! Delivery marked complete 🎉' },
    });
  } catch (err) {
    logger.error('Verify OTP error', { err: err.message });
    return res.status(500).json({ success: false, error: err.message || 'Verification failed' });
  }
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
