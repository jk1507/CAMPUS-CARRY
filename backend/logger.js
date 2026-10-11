import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { combine, timestamp, printf, colorize, errors } = winston.format;
const fmt = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(meta).length) log += ` | ${JSON.stringify(meta)}`;
  if (stack) log += `\n${stack}`;
  return log;
});
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), fmt),
  transports: [
    new winston.transports.Console({ format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), fmt) }),
    new winston.transports.File({ filename: path.join(__dirname, 'logs', 'error.log'), level: 'error', maxsize: 5242880, maxFiles: 3 }),
    new winston.transports.File({ filename: path.join(__dirname, 'logs', 'combined.log'), maxsize: 10485760, maxFiles: 5 }),
  ],
});
export const requestLogger = (req, res, next) => {
  const t = Date.now();
  res.on('finish', () => logger.info(`${req.method} ${req.originalUrl}`, { status: res.statusCode, ms: Date.now() - t }));
  next();
};
export default logger;
