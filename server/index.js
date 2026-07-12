import http from 'http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDb, closeDb } from './config/db.js';
import { createSocketServer } from './socket/index.js';
import { buildContainer } from './container.js';
import { createApp } from './app.js';

async function main() {
  await connectDb();

  // HTTP server created first so Socket.io can attach to it
  const httpServer = http.createServer();
  const { io, events } = createSocketServer(httpServer);

  const container = buildContainer({ events });
  const app = createApp({ controllers: container.controllers });
  httpServer.on('request', app);

  httpServer.listen(env.port, () => {
    logger.info(`Expensio API listening on port ${env.port} (${env.nodeEnv})`);
  });

  // ---- Graceful shutdown ----
  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — shutting down gracefully`);

    const force = setTimeout(() => {
      logger.error('Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10000);
    force.unref();

    try {
      await new Promise((resolve) => httpServer.close(resolve));
      io.close();
      await closeDb();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { error: err.message });
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason: String(reason) });
    // Only bring the process down in production; in dev, log and keep serving
    if (env.isProduction) shutdown('unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    shutdown('uncaughtException');
  });
}

main().catch((err) => {
  logger.error('Failed to start server', { error: err.message, stack: err.stack });
  console.error('[FATAL] Failed to start server:', err.message, '\n', err.stack);
  process.exit(1);
});
