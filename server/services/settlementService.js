import mongoose from 'mongoose';
import { badRequest, notFound, forbidden } from '../utils/AppError.js';

export function createSettlementService({
  settlementModel,
  groupModel,
  auditLogService,
  balanceService,
  events,
}) {
  return {
    /**
     * Idempotent settlement creation. If the idempotencyKey has been seen,
     * the ORIGINAL settlement is returned — no duplicate is created.
     * Partial settlements are allowed.
     */
    async create(userId, { groupId, fromUser, toUser, amount, idempotencyKey }, auditMeta = {}) {
      if (!idempotencyKey) throw badRequest('idempotencyKey is required');

      // Idempotency: return the original result for a duplicate key
      const existing = await settlementModel.findOne({ idempotencyKey });
      if (existing) return { settlement: existing, deduplicated: true };

      const group = await groupModel.findOne({ _id: groupId, deletedAt: null });
      if (!group) throw notFound('Group not found');
      if (!group.isMember(userId)) throw forbidden('You are not a member of this group');
      if (!group.isMember(fromUser) || !group.isMember(toUser)) {
        throw badRequest('Both parties must be members of the group');
      }
      if (String(fromUser) === String(toUser)) throw badRequest('Cannot settle with yourself');
      if (String(userId) !== String(fromUser) && !group.isAdmin(userId)) {
        throw forbidden('Only the payer or a group admin can record this settlement');
      }

      const session = await mongoose.startSession();
      try {
        let settlement;
        await session.withTransaction(async () => {
          try {
            const docs = await settlementModel.create(
              [
                {
                  groupId,
                  fromUser,
                  toUser,
                  amount,
                  idempotencyKey,
                  status: 'completed',
                  settledAt: new Date(),
                },
              ],
              { session }
            );
            settlement = docs[0];
          } catch (err) {
            // Unique index race: another request with the same key won
            if (err.code === 11000) {
              settlement = await settlementModel.findOne({ idempotencyKey }).session(session);
              return;
            }
            throw err;
          }

          await auditLogService.record({
            actorId: userId,
            action: 'settlement.completed',
            targetType: 'Settlement',
            targetId: settlement._id,
            before: null,
            after: settlement.toObject(),
            metadata: auditMeta,
            session,
          });
        });

        balanceService.invalidateGroup(groupId);
        const balances = await balanceService.getGroupBalances(groupId, { skipCache: true });
        events?.emitToGroup(groupId, 'settlement:completed', { groupId, settlement });
        events?.emitToGroup(groupId, 'balance:updated', { groupId, balances });

        return { settlement, deduplicated: false };
      } finally {
        await session.endSession();
      }
    },

    async listForGroup(groupId, userId) {
      const group = await groupModel.findOne({ _id: groupId, deletedAt: null });
      if (!group) throw notFound('Group not found');
      if (!group.isMember(userId)) throw forbidden('You are not a member of this group');

      return settlementModel
        .find({ groupId })
        .sort({ settledAt: -1 })
        .populate('fromUser', 'name email avatarUrl')
        .populate('toUser', 'name email avatarUrl')
        .lean();
    },

    async markCompleted(settlementId, userId, auditMeta = {}) {
      const settlement = await settlementModel.findById(settlementId);
      if (!settlement) throw notFound('Settlement not found');

      const group = await groupModel.findOne({ _id: settlement.groupId, deletedAt: null });
      if (!group || !group.isMember(userId)) throw forbidden('Not a member of this group');
      if (settlement.status === 'completed') return settlement;

      const before = settlement.toObject();
      settlement.status = 'completed';
      settlement.settledAt = new Date();
      await settlement.save();

      await auditLogService.record({
        actorId: userId,
        action: 'settlement.completed',
        targetType: 'Settlement',
        targetId: settlement._id,
        before,
        after: settlement.toObject(),
        metadata: auditMeta,
      });

      balanceService.invalidateGroup(settlement.groupId);
      return settlement;
    },
  };
}
