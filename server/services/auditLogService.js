import { logger } from '../config/logger.js';

/**
 * Factory-style service: dependencies injected for testability.
 */
export function createAuditLogService({ auditLogModel }) {
  return {
    /**
     * Append an immutable audit entry. Never throws — audit failures are
     * logged but must not break the main operation.
     */
    async record({ actorId, action, targetType, targetId, before = null, after = null, metadata = {}, session = null }) {
      try {
        const doc = new auditLogModel({ actorId, action, targetType, targetId, before, after, metadata });
        await doc.save({ session });
        return doc;
      } catch (err) {
        logger.error('Failed to write audit log', { action, targetType, error: err.message });
        return null;
      }
    },

    async listForTarget(targetType, targetId) {
      return auditLogModel.find({ targetType, targetId }).sort({ createdAt: -1 }).lean();
    },
  };
}
