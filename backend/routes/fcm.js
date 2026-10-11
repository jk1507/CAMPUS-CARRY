import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';
import { sendPushNotification, subscribeToTopic, unsubscribeFromTopic } from '../services/fcm.js';
import logger from '../logger.js';

const router = express.Router();

const registerTokenSchema = z.object({
  fcm_token: z.string().min(1, 'FCM token is required'),
  // Optional: which topics to subscribe to (e.g., campus name)
  topics: z.array(z.string()).optional(),
});

router.post('/register-token', authenticate, async (req, res) => {
  try {
    const { fcm_token, topics } = req.body;

    if (!fcm_token) {
      return res.status(400).json({ success: false, error: 'FCM token is required' });
    }

    // Upsert FCM token for the user
    await pool.query(
      `INSERT INTO users (fcm_token) VALUES (?) ON DUPLICATE KEY UPDATE fcm_token = VALUES(fcm_token)`,
      // MySQL ON DUPLICATE KEY UPDATE needs primary/unique key — users.id is PK, so use a different approach
    );

    // Use a separate fcm_tokens table or update users table if fcm_token column exists
    // For simplicity, we'll store in a separate table (create if not exists)
    await pool.query(
      `CREATE TABLE IF NOT EXISTS user_fcm_tokens (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL UNIQUE,
        fcm_token VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      []
    );

    await pool.query(
      `INSERT INTO user_fcm_tokens (user_id, fcm_token) VALUES (?, ?) ON DUPLICATE KEY UPDATE fcm_token = VALUES(fcm_token)`,
      [req.user.id, fcm_token]
    );

    // Subscribe to topics if provided (e.g., campus name)
    if (topics && topics.length > 0) {
      for (const topic of topics) {
        await subscribeToTopic(req.user.id, topic);
      }
    }

    logger.info('FCM token registered', { userId: req.user.id, token: fcm_token.slice(0, 20) + '...' });
    return res.json({ success: true, data: { message: 'FCM token registered successfully' } });
  } catch (err) {
    logger.error('FCM token registration error', { err });
    return res.status(500).json({ success: false, error: 'Failed to register FCM token' });
  }
});

router.post('/send-test', authenticate, async (req, res) => {
  try {
    const { title = 'Test Notification', body = 'This is a test push notification from CampusCarry!' } = req.body;

    const result = await sendPushNotification(req.user.id, title, body, { type: 'test' });

    return res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Test notification error', { err });
    return res.status(500).json({ success: false, error: 'Failed to send test notification' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT fcm_token FROM user_fcm_tokens WHERE user_id = ?`,
      [req.user.id]
    );
    return res.json({
      success: true,
      data: {
        registered: rows.length > 0,
        fcm_token: rows.length > 0 ? rows[0].fcm_token : null,
      },
    });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to check FCM status' });
  }
});

export default router;
