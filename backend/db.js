import mysql from 'mysql2/promise';
import logger from './logger.js';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campuscarry',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  timezone: '+00:00',
  ...(process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('tidbcloud.com') || process.env.DB_HOST?.includes('aivencloud.com')
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
};

const pool = mysql.createPool(process.env.DATABASE_URL ? {
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
} : dbConfig);

pool.getConnection()
  .then(c => {
    logger.info('MySQL connected successfully');
    c.release();
  })
  .catch(err => {
    logger.error('MySQL connection failed', { error: err.message });
    process.exit(1);
  });

export default pool;

