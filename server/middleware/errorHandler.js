import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  // Unexpected / programming error
  logger.error('Unexpected error', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    headersSent: res.headersSent,
  });

  return res.status(500).json({
    success: false,
    message: env.isProduction ? 'Internal server error' : err.message,
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
}
