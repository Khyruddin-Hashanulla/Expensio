import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { auditContext } from './middleware/auditLog.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { buildRouter } from './routes/index.js';

export function createApp({ controllers }) {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginOpenerPolicy: false }));
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(auditContext);

  // Render health check (also served at /api/v1/health via buildRouter)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/v1', buildRouter({ controllers }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
