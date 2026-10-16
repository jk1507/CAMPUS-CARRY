import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import logger from '../logger.js';

const router = express.Router();

// Hardcoded Master Admin Credentials
const ADMIN_USERNAME = 'adminstrator';
const ADMIN_PASSWORD = 'marcos51sag';

// Middleware to authenticate admin requests
export const authenticateAdmin = (req, res, next) => {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Admin token missing' });
    }
    const decoded = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'admin' || decoded.username !== ADMIN_USERNAME) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin access only' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired admin token' });
  }
};

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }

  // Exact credentials check requested by user
  if (username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { username: ADMIN_USERNAME, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({
      success: true,
      data: {
        token,
        username: ADMIN_USERNAME,
        role: 'admin'
      }
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid Administrator credentials' });
});

// GET /api/admin/stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const [[{ total_users }]] = await pool.query('SELECT COUNT(*) as total_users FROM users');
    const [[{ total_requests }]] = await pool.query('SELECT COUNT(*) as total_requests FROM requests');
    const [[{ active_errands }]] = await pool.query(
      "SELECT COUNT(*) as active_errands FROM requests WHERE status IN ('open', 'accepted', 'in_progress')"
    );
    const [[{ completed_errands }]] = await pool.query(
      "SELECT COUNT(*) as completed_errands FROM requests WHERE status = 'delivered'"
    );
    const [[{ pending_reports }]] = await pool.query(
      "SELECT COUNT(*) as pending_reports FROM reports WHERE status = 'pending'"
    );
    const [[{ pending_withdrawals }]] = await pool.query(
      "SELECT COUNT(*) as pending_withdrawals FROM withdrawals WHERE status = 'pending'"
    );

    return res.json({
      success: true,
      data: {
        total_users,
        total_requests,
        active_errands,
        completed_errands,
        pending_reports,
        pending_withdrawals
      }
    });
  } catch (err) {
    logger.error('Admin stats error', { err: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { search, campus, role } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.campus, u.role, u.phone, u.rating, u.is_banned, u.created_at,
             (SELECT COUNT(*) FROM requests r WHERE r.requester_id = u.id) as request_count,
             (SELECT COUNT(*) FROM requests r WHERE r.carrier_id = u.id AND r.status = 'delivered') as deliveries_count
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }
    if (campus) {
      query += ' AND u.campus = ?';
      params.push(campus);
    }
    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }

    query += ' ORDER BY u.created_at DESC LIMIT 100';
    const [rows] = await pool.query(query, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Admin users error', { err: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users/:id/ban
router.patch('/users/:id/ban', authenticateAdmin, async (req, res) => {
  try {
    const { is_banned } = req.body;
    await pool.query('UPDATE users SET is_banned = ? WHERE id = ?', [is_banned ? 1 : 0, req.params.id]);
    return res.json({ success: true, data: { message: `User ${is_banned ? 'banned' : 'unbanned'} successfully` } });
  } catch (err) {
    logger.error('Admin ban error', { err: err.message });
    return res.status(500).json({ success: false, error: 'Failed to update user ban status' });
  }
});

// DELETE /api/admin/users/:id (Remove inactive / offending user)
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const [user] = await pool.query('SELECT id, name FROM users WHERE id = ?', [req.params.id]);
    if (!user.length) return res.status(404).json({ success: false, error: 'User not found' });

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    logger.info('Admin deleted user', { userId: req.params.id, name: user[0].name });
    return res.json({ success: true, data: { message: `User ${user[0].name} deleted successfully` } });
  } catch (err) {
    logger.error('Admin delete user error', { err: err.message });
    return res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// POST /api/admin/notify (Notify specific user or broadcast to all users / campus)
router.post('/notify', authenticateAdmin, async (req, res) => {
  try {
    const { user_id, campus, title, body, type } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'Notification title and body required' });
    }

    const io = req.app.get('io');

    // Case 1: Specific User
    if (user_id) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)',
        [user_id, title, body, type || 'admin_alert']
      );
      if (io) {
        io.to(`user:${user_id}`).emit('notification:new', { title, body, type: type || 'admin_alert' });
        io.to(`user:${user_id}`).emit('chat:notify', { fromName: 'Campus Admin', message: `${title}: ${body}` });
      }
      return res.json({ success: true, data: { message: 'Notification sent to user' } });
    }

    // Case 2: Campus or All users
    let query = 'SELECT id FROM users';
    const params = [];
    if (campus && campus !== 'all') {
      query += ' WHERE campus = ?';
      params.push(campus);
    }
    const [users] = await pool.query(query, params);

    for (const u of users) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)',
        [u.id, title, body, type || 'admin_announcement']
      );
    }

    if (io) {
      if (campus && campus !== 'all') {
        io.to(`campus:${campus}`).emit('notification:new', { title, body, type: 'admin_announcement' });
      } else {
        io.emit('notification:new', { title, body, type: 'admin_announcement' });
      }
    }

    return res.json({ success: true, data: { message: `Notification sent to ${users.length} users` } });
  } catch (err) {
    logger.error('Admin notify error', { err: err.message });
    return res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

// GET /api/admin/reports (Complaints & Reports)
router.get('/reports', authenticateAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT rep.*,
             r.title as request_title, r.status as request_status,
             u1.name as reporter_name, u1.email as reporter_email,
             u2.name as reported_name, u2.email as reported_email, u2.is_banned as reported_is_banned
      FROM reports rep
      JOIN users u1 ON rep.reporter_id = u1.id
      JOIN users u2 ON rep.reported_user_id = u2.id
      LEFT JOIN requests r ON rep.request_id = r.id
      ORDER BY rep.created_at DESC
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Admin reports error', { err: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

// PATCH /api/admin/reports/:id
router.patch('/reports/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    await pool.query('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
    return res.json({ success: true, data: { message: `Report marked as ${status}` } });
  } catch (err) {
    logger.error('Admin update report error', { err: err.message });
    return res.status(500).json({ success: false, error: 'Failed to update report' });
  }
});

// GET /api/admin/errands (All errands & requests)
router.get('/errands', authenticateAdmin, async (req, res) => {
  try {
    const { status, campus } = req.query;
    let query = `
      SELECT r.*,
             ru.name as requester_name, ru.email as requester_email,
             cu.name as carrier_name, cu.email as carrier_email
      FROM requests r
      JOIN users ru ON r.requester_id = ru.id
      LEFT JOIN users cu ON r.carrier_id = cu.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    if (campus) {
      query += ' AND r.campus = ?';
      params.push(campus);
    }
    query += ' ORDER BY r.created_at DESC LIMIT 100';

    const [rows] = await pool.query(query, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Admin errands error', { err: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch errands' });
  }
});

// PATCH /api/admin/errands/:id/status (Force update errand status / cancel)
router.patch('/errands/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'accepted', 'in_progress', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    await pool.query('UPDATE requests SET status = ? WHERE id = ?', [status, req.params.id]);

    const io = req.app.get('io');
    if (io) {
      io.to(`request:${req.params.id}`).emit('request:statusUpdate', { requestId: req.params.id, status });
    }

    return res.json({ success: true, data: { message: `Errand #${req.params.id} updated to ${status}` } });
  } catch (err) {
    logger.error('Admin update errand error', { err: err.message });
    return res.status(500).json({ success: false, error: 'Failed to update errand status' });
  }
});

// GET /api/admin/withdrawals
router.get('/withdrawals', authenticateAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT w.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.campus
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('Admin withdrawals error', { err: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch withdrawals' });
  }
});

// PATCH /api/admin/withdrawals/:id
router.patch('/withdrawals/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'processed', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    await pool.query('UPDATE withdrawals SET status = ? WHERE id = ?', [status, req.params.id]);
    return res.json({ success: true, data: { message: `Withdrawal #${req.params.id} updated to ${status}` } });
  } catch (err) {
    logger.error('Admin update withdrawal error', { err: err.message });
    return res.status(500).json({ success: false, error: 'Failed to update withdrawal' });
  }
});

export default router;
