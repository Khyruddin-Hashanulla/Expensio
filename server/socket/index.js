import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/tokens.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Socket.io setup on the `/groups` namespace.
 * - JWT verified on the connection handshake; invalid tokens rejected.
 * - Clients join `group:{groupId}` rooms; the server emits
 *   balance:updated / expense:* / settlement:completed to those rooms.
 *
 * Returns an emitter facade injected into services.
 */
export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  const groupsNs = io.of('/groups');

  groupsNs.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.data.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  groupsNs.on('connection', (socket) => {
    logger.debug('Socket connected', { userId: socket.data.user?.sub });

    socket.on('group:join', (groupId) => {
      if (typeof groupId === 'string' && /^[a-f\d]{24}$/i.test(groupId)) {
        socket.join(`group:${groupId}`);
      }
    });

    socket.on('group:leave', (groupId) => {
      socket.leave(`group:${groupId}`);
    });
  });

  return {
    io,
    events: {
      emitToGroup(groupId, event, payload) {
        groupsNs.to(`group:${groupId}`).emit(event, payload);
      },
    },
  };
}
