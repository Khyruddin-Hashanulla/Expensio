import mongoose from 'mongoose';
import { round2 } from '../utils/rounding.js';
import { simplifyDebts } from '../utils/debtSimplification.js';

/**
 * In-memory TTL cache with the same get/set/del interface as a Redis wrapper.
 * Swap for Redis in production (see docker-compose) — interface is identical.
 */
function createTtlCache() {
  const store = new Map();
  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt < Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    set(key, value, ttlMs) {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
    del(key) {
      store.delete(key);
    },
  };
}

const BALANCE_TTL_MS = 30 * 1000;

export function createBalanceService({ transactionModel, settlementModel, cache = createTtlCache() }) {
  /**
   * Net balance per member:
   *   SUM(amount where member is paidBy)
   * - SUM(amountOwed where member is in splitBetween)
   * + settlements paid (fromUser) - settlements received (toUser)
   * Positive = member is owed money. Negative = member owes.
   */
  async function computeGroupBalances(groupId) {
    const gid = new mongoose.Types.ObjectId(String(groupId));

    const [paidAgg, owedAgg, settlements] = await Promise.all([
      transactionModel.aggregate([
        { $match: { groupId: gid, deletedAt: null, type: 'expense' } },
        { $group: { _id: '$paidBy', totalPaid: { $sum: '$amount' } } },
      ]),
      transactionModel.aggregate([
        { $match: { groupId: gid, deletedAt: null, type: 'expense' } },
        { $unwind: '$splitBetween' },
        { $group: { _id: '$splitBetween.userId', totalOwed: { $sum: '$splitBetween.amountOwed' } } },
      ]),
      settlementModel.find({ groupId: gid, status: 'completed' }).lean(),
    ]);

    const net = new Map();
    const add = (userId, delta) => {
      const key = String(userId);
      net.set(key, (net.get(key) || 0) + delta);
    };

    for (const row of paidAgg) if (row._id) add(row._id, row.totalPaid);
    for (const row of owedAgg) add(row._id, -row.totalOwed);
    // A settlement payment reduces the payer's debt and the receiver's credit
    for (const s of settlements) {
      add(s.fromUser, s.amount);
      add(s.toUser, -s.amount);
    }

    return Array.from(net.entries()).map(([userId, netBalance]) => ({
      userId,
      netBalance: round2(netBalance),
    }));
  }

  return {
    async getGroupBalances(groupId, { skipCache = false } = {}) {
      const cacheKey = `balances:${groupId}`;
      if (!skipCache) {
        const cached = cache.get(cacheKey);
        if (cached) return cached;
      }
      const balances = await computeGroupBalances(groupId);
      cache.set(cacheKey, balances, BALANCE_TTL_MS);
      return balances;
    },

    invalidateGroup(groupId) {
      cache.del(`balances:${groupId}`);
    },

    async getSimplifiedSettlements(groupId) {
      const balances = await computeGroupBalances(groupId);
      return simplifyDebts(balances);
    },

    /** Net balance for a single member (0 = settled) — runs a targeted query instead of computing all balances */
    async getMemberBalance(groupId, userId) {
      const gid = new mongoose.Types.ObjectId(String(groupId));
      const uid = new mongoose.Types.ObjectId(String(userId));

      const [paidAgg, owedAgg] = await Promise.all([
        transactionModel.aggregate([
          { $match: { groupId: gid, deletedAt: null, type: 'expense', paidBy: uid } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        transactionModel.aggregate([
          { $match: { groupId: gid, deletedAt: null, type: 'expense' } },
          { $unwind: '$splitBetween' },
          { $match: { 'splitBetween.userId': uid } },
          { $group: { _id: null, total: { $sum: '$splitBetween.amountOwed' } } },
        ]),
      ]);

      const paid = paidAgg[0]?.total ?? 0;
      const owed = owedAgg[0]?.total ?? 0;
      let balance = paid - owed;

      const settlements = await settlementModel
        .find({ groupId: gid, status: 'completed' })
        .lean();

      for (const s of settlements) {
        if (String(s.fromUser) === String(userId)) balance += s.amount;
        if (String(s.toUser) === String(userId)) balance -= s.amount;
      }

      return round2(balance);
    },
  };
}
