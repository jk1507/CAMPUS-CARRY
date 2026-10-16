import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { rateLimit } from 'express-rate-limit';
import { initSockets } from './sockets/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './logger.js';
import logger from './logger.js';
import pool from './db.js';
import { startExpireJob } from './jobs/expireRequests.js';

import authRoutes           from './routes/auth.js';
import requestRoutes        from './routes/requests.js';
import locationRoutes       from './routes/location.js';
import feedbackRoutes       from './routes/feedback.js';
import usersRoutes          from './routes/users.js';
import chatRoutes           from './routes/chat.js';
import dashboardRoutes      from './routes/dashboard.js';
import reportsRoutes        from './routes/reports.js';
import notificationsRoutes  from './routes/notifications.js';
import withdrawalsRoutes    from './routes/withdrawals.js';
import fcmRoutes            from './routes/fcm.js';
import adminRoutes          from './routes/admin.js';

const app    = express();
const server = http.createServer(app);
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim().replace(/\/$/, ''))
  : ['http://localhost:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, Postman or health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Also allow any preview deployments on vercel.app if FRONTEND_URL contains vercel.app
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(null, true); // Permissive in cloud deployment to prevent CORS mismatch
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
};

const io = new Server(server, { cors: corsOptions });
app.set('io', io);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(rateLimit({ windowMs: 15*60*1000, max: 500, standardHeaders: true, legacyHeaders: false }));

app.use('/api/auth',           authRoutes);
app.use('/api/requests',       requestRoutes);
app.use('/api/location',       locationRoutes);
app.use('/api/feedback',       feedbackRoutes);
app.use('/api/users',          usersRoutes);
app.use('/api/chat',           chatRoutes);
app.use('/api/dashboard',      dashboardRoutes);
app.use('/api/reports',        reportsRoutes);
app.use('/api/notifications',  notificationsRoutes);
app.use('/api/withdrawals',    withdrawalsRoutes);
app.use('/api/fcm',            fcmRoutes);
app.use('/api/admin',          adminRoutes);

app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); return res.json({ success: true, data: { status: 'ok' } }); }
  catch { return res.status(503).json({ success: false, error: 'DB down' }); }
});

app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));
app.use(errorHandler);

initSockets(io);
startExpireJob();

// Initialize FCM for push notifications (non-blocking — failures are logged, not fatal)
try { require('./services/fcm.js').initFCM(); } catch { logger.warn('FCM initialization skipped'); }

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => logger.info(`CampusCarry running on :${PORT}`));
process.on('unhandledRejection', (r) => logger.error('UnhandledRejection', { r }));
process.on('uncaughtException',  (e) => { logger.error('UncaughtException', { e }); process.exit(1); });
export { io };
