import mysql from 'mysql2/promise';
import logger from './logger.js';
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campuscarry',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  timezone: '+00:00',
});
pool.getConnection().then(c => { logger.info('MySQL connected'); c.release(); }).catch(err => { logger.error('MySQL failed', { err }); process.exit(1); });
export default pool;
