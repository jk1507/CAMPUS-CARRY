import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();

router.get('/requester', authenticate, async (req, res) => {
  try {
    const id = req.user.id;
    const [[weekly]]  = await pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(reward),0) as spent FROM requests WHERE requester_id=? AND created_at >= DATE_SUB(NOW(),INTERVAL 7 DAY)`, [id]);
    const [[monthly]] = await pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(reward),0) as spent FROM requests WHERE requester_id=? AND created_at >= DATE_SUB(NOW(),INTERVAL 30 DAY)`, [id]);
    const [[yearly]]  = await pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(reward),0) as spent FROM requests WHERE requester_id=? AND created_at >= DATE_SUB(NOW(),INTERVAL 365 DAY)`, [id]);
    const [byStatus]  = await pool.query(`SELECT status, COUNT(*) as count FROM requests WHERE requester_id=? GROUP BY status`, [id]);
    const [monthlyBreakdown] = await pool.query(
      `SELECT DATE_FORMAT(created_at,'%Y-%m') as month, COUNT(*) as requests, COALESCE(SUM(reward),0) as spent FROM requests WHERE requester_id=? AND created_at >= DATE_SUB(NOW(),INTERVAL 12 MONTH) GROUP BY month ORDER BY month ASC`,
      [id]
    );
    return res.json({ success: true, data: { weekly, monthly, yearly, byStatus, monthlyBreakdown } });
  } catch { return res.status(500).json({ success: false, error: 'Failed' }); }
});

router.get('/carrier', authenticate, async (req, res) => {
  try {
    const id = req.user.id;
    const [[daily]]   = await pool.query(`SELECT COUNT(*) as deliveries, COALESCE(SUM(reward),0) as earned FROM requests WHERE carrier_id=? AND status='delivered' AND DATE(updated_at)=CURDATE()`, [id]);
    const [[weekly]]  = await pool.query(`SELECT COUNT(*) as deliveries, COALESCE(SUM(reward),0) as earned FROM requests WHERE carrier_id=? AND status='delivered' AND updated_at >= DATE_SUB(NOW(),INTERVAL 7 DAY)`, [id]);
    const [[monthly]] = await pool.query(`SELECT COUNT(*) as deliveries, COALESCE(SUM(reward),0) as earned FROM requests WHERE carrier_id=? AND status='delivered' AND updated_at >= DATE_SUB(NOW(),INTERVAL 30 DAY)`, [id]);
    const [[yearly]]  = await pool.query(`SELECT COUNT(*) as deliveries, COALESCE(SUM(reward),0) as earned FROM requests WHERE carrier_id=? AND status='delivered' AND updated_at >= DATE_SUB(NOW(),INTERVAL 365 DAY)`, [id]);
    const [monthlyBreakdown] = await pool.query(
      `SELECT DATE_FORMAT(updated_at,'%Y-%m') as month, COUNT(*) as deliveries, COALESCE(SUM(reward),0) as earned FROM requests WHERE carrier_id=? AND status='delivered' AND updated_at >= DATE_SUB(NOW(),INTERVAL 12 MONTH) GROUP BY month ORDER BY month ASC`,
      [id]
    );
    const [[{ avg }]] = await pool.query(`SELECT COALESCE(AVG(rating),0) as avg FROM feedback WHERE to_user_id=?`, [id]);
    return res.json({ success: true, data: { daily, weekly, monthly, yearly, monthlyBreakdown, avgRating: avg } });
  } catch { return res.status(500).json({ success: false, error: 'Failed' }); }
});

export default router;
