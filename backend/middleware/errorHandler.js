import logger from '../logger.js';
export const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.originalUrl });
  return res.status(err.status || 500).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
};
