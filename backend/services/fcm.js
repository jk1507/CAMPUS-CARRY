import admin from 'firebase-admin';
import pool from '../db.js';
import logger from '../logger.js';

let fcmApp = null;

/**
 * Initialize Firebase Admin SDK for FCM push notifications
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var (path to service account JSON)
 * or direct credential config via FCM_SERVICE_ACCOUNT env var (JSON string)
 */
export function initFCM() {
  if (fcmApp) return fcmApp;

  try {
    // Try to load credentials from env or default application credentials
    const serviceAccountPath = process.env.FCM_SERVICE_ACCOUNT_PATH;
    const serviceAccountJson = process.env.FCM_SERVICE_ACCOUNT; // JSON string

    if (serviceAccountPath) {
      fcmApp = admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath)),
      }, 'fcm');
    } else if (serviceAccountJson) {
      const parsed = JSON.parse(serviceAccountJson);
      fcmApp = admin.initializeApp({
        credential: admin.credential.cert(parsed),
      }, 'fcm');
    } else {
      // Use default application credentials (works in GCP environments)
      fcmApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      }, 'fcm');
    }

    logger.info('FCM initialized successfully');
    return fcmApp;
  } catch (err) {
    logger.warn('FCM initialization failed — push notifications disabled', { err });
    return null;
  }
}

/**
 * Get FCM app instance (auto-initializes)
 */
export function getFCMApp() {
  if (!fcmApp) initFCM();
  return fcmApp;
}

/**
 * Send a push notification to a specific user
 * Requires the user to have a FCM token stored (add fcm_token column to users table)
 *
 * @param userId - Database user ID (used to look up FCM token)
 * @param title - Notification title
 * @param body - Notification body text
 * @param data - Optional custom data payload
 */
export async function sendPushNotification(userId, title, body, data = {}) {
  try {
    // Fetch user's FCM token from DB
    const [rows] = await pool.query(
      'SELECT fcm_token FROM users WHERE id = ?',
      [userId]
    );

    if (!rows.length || !rows[0].fcm_token) {
      logger.debug('No FCM token for user', { userId });
      return { success: false, error: 'No FCM token registered for user' };
    }

    const token = rows[0].fcm_token;
    const app = getFCMApp();

    if (!app) {
      return { success: false, error: 'FCM not initialized' };
    }

    const message = {
      token,
      notification: {
        title,
        body,
        android: { clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
      },
      data: {
        ...data,
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'campuscarry_notifications',
          icon: 'ic_notification',
        },
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().send(message);

    logger.info('Push notification sent', { userId, token: token.slice(0, 20) + '...', messageId: response });

    // Also persist to notifications table for in-app viewing
    await pool.query(
      'INSERT INTO notifications (user_id, title, body, type, is_read, created_at) VALUES (?, ?, ?, ?, 0, NOW())',
      [userId, title, body, 'push']
    );

    return { success: true, messageId: response };
  } catch (err) {
    logger.error('FCM send error', { userId, err });
    return { success: false, error: err.message };
  }
}

/**
 * Broadcast a notification to all users on a specific campus
 */
export async function broadcastToCampus(campus, title, body, data = {}) {
  try {
    const [rows] = await pool.query(
      'SELECT id, fcm_token FROM users WHERE campus = ? AND fcm_token IS NOT NULL',
      [campus]
    );

    if (!rows.length) return { success: false, error: 'No users with FCM tokens on this campus' };

    const tokens = rows.map(r => r.fcm_token);
    const app = getFCMApp();

    if (!app) return { success: false, error: 'FCM not initialized' };

    // FCM allows multicast up to 500 tokens per send
    const chunks = [];
    for (let i = 0; i < tokens.length; i += 500) {
      chunks.push(tokens.slice(i, i + 500));
    }

    const results = [];
    for (const chunk of chunks) {
      const message = {
        tokens: chunk,
        notification: { title, body },
        data: { ...data, clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
        android: {
          priority: 'high',
          notification: { channelId: 'campuscarry_notifications', icon: 'ic_notification' },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      results.push(response);

      // Log any failed tokens
      response.failureCount && response.responses.forEach((res, idx) => {
        if (!res.success) {
          const userId = rows[i + idx]?.id;
          logger.debug('FCM send failed for user', { userId, error: res.error?.message });
        }
      });
    }

    logger.info('Campus broadcast sent', { campus, recipients: tokens.length });
    return { success: true, totalSent: tokens.length };
  } catch (err) {
    logger.error('FCM broadcast error', { campus, err });
    return { success: false, error: err.message };
  }
}

/**
 * Subscribe a user to a topic (e.g., campus:X)
 */
export async function subscribeToTopic(userId, topic) {
  try {
    const [rows] = await pool.query('SELECT fcm_token FROM users WHERE id = ?', [userId]);
    if (!rows.length || !rows[0].fcm_token) return { success: false, error: 'No FCM token' };

    const app = getFCMApp();
    if (!app) return { success: false, error: 'FCM not initialized' };

    await admin.messaging().subscribeToTopic(rows[0].fcm_token, topic);
    logger.info('User subscribed to topic', { userId, topic });
    return { success: true };
  } catch (err) {
    logger.error('Topic subscription failed', { userId, topic, err });
    return { success: false, error: err.message };
  }
}

/**
 * Unsubscribe a user from a topic
 */
export async function unsubscribeFromTopic(userId, topic) {
  try {
    const [rows] = await pool.query('SELECT fcm_token FROM users WHERE id = ?', [userId]);
    if (!rows.length || !rows[0].fcm_token) return { success: false, error: 'No FCM token' };

    const app = getFCMApp();
    if (!app) return { success: false, error: 'FCM not initialized' };

    await admin.messaging().unsubscribeFromTopic(rows[0].fcm_token, topic);
    logger.info('User unsubscribed from topic', { userId, topic });
    return { success: true };
  } catch (err) {
    logger.error('Topic unsubscription failed', { userId, topic, err });
    return { success: false, error: err.message };
  }
}
