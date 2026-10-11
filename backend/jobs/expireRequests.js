import cron from 'node-cron';
import pool from '../db.js';
import logger from '../logger.js';

export const startExpireJob = () => {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const [r] = await pool.query(`UPDATE requests SET status='cancelled' WHERE status='open' AND deadline IS NOT NULL AND deadline < NOW()`);
      if (r.affectedRows > 0) logger.info(`Expired ${r.affectedRows} requests`);
    } catch (err) { logger.error('Expire job failed', { err }); }
  });
  logger.info('Cron job started');
};
