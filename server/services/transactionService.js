import mongoose from 'mongoose';
import { calculateSplit } from '../utils/splitAlgorithm.js';
import { badRequest, notFound, forbidden, conflict } from '../utils/AppError.js';
import { withOptionalSession, docOptions } from '../utils/transaction.js';

export function createTransactionService({
  transactionModel,
  groupModel,
  settlementModel,
  auditLogService,
  balanceService,
  budgetService,
  events, // { emitToGroup(groupId, event, payload) } — socket emitter, optional
}) {
  async function assertGroupMembership(groupId, userId) {
    const group = await groupModel.findOne({ _id: groupId, deletedAt: null });
    if (!group) throw notFound('Group not found');
    if (!group.isMember(userId)) throw forbidden('You are not a member of this group');
    return group;
  }

  async function hasSettlements(groupId) {
    if (!groupId) return false;
    const count = await settlementModel.countDocuments({ groupId });
    return count > 0;
  }

  return {
    async list(userId, filters = {}) {
      const { dateFrom, dateTo, category, groupId, type, page = 1, limit = 20 } = filters;

      const query = { deletedAt: null };
      if (groupId === 'personal' || groupId === null) {
        query.userId = userId;
        query.groupId = null;
      } else if (groupId) {
        await assertGroupMembership(groupId, userId);
        query.groupId = groupId;
      } else {
        // All transactions visible to this user
        query.$or = [{ userId }, { 'splitBetween.userId': userId }, { paidBy: userId }];
      }
      if (type) query.type = type;
      if (category) query.category = category;
      if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) query.date.$gte = new Date(dateFrom);
        if (dateTo) query.date.$lte = new Date(dateTo);
      }

      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        transactionModel
          .find(query)
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit)
          .populate('paidBy', 'name email avatarUrl')
          .populate('splitBetween.userId', 'name email avatarUrl')
          .lean(),
        transactionModel.countDocuments(query),
      ]);

      return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
    },

    async getById(id, userId) {
      const txn = await transactionModel
        .findOne({ _id: id, deletedAt: null })
        .populate('paidBy', 'name email avatarUrl')
        .populate('splitBetween.userId', 'name email avatarUrl');
      if (!txn) throw notFound('Transaction not found');

      const isOwner = String(txn.userId) === String(userId);
      const isParticipant = txn.splitBetween.some(
        (s) => String(s.userId?._id ?? s.userId) === String(userId)
      );
      if (!isOwner && !isParticipant) {
        if (txn.groupId) await assertGroupMembership(txn.groupId, userId);
        else throw forbidden('Not your transaction');
      }
      return txn;
    },

    /**
     * Create a transaction. Group expenses compute the authoritative split
     * server-side and persist atomically inside a Mongoose session.
     */
    async create(userId, input, auditMeta = {}) {
      const isGroupExpense = Boolean(input.groupId);
      let group = null;
      let splitBetween = [];
      let paidBy = null;

      if (isGroupExpense) {
        group = await assertGroupMembership(input.groupId, userId);
        paidBy = input.paidBy || userId;
        if (!group.isMember(paidBy)) throw badRequest('paidBy must be a group member');

        const participantIds = (input.participants || []).map((p) => String(p.userId));
        for (const pid of participantIds) {
          if (!group.isMember(pid)) throw badRequest(`User ${pid} is not a group member`);
        }

        splitBetween = calculateSplit({
          amount: input.amount,
          splitType: input.splitType,
          paidBy,
          participants: input.participants,
        });
      }

      let created;
      await withOptionalSession(async (session) => {
        const opts = docOptions(session);
        const docs = await transactionModel.create([{
          userId,
          groupId: isGroupExpense ? input.groupId : null,
          type: input.type,
          amount: input.amount,
          currency: input.currency || group?.currency || 'INR',
          description: input.description,
          category: input.category,
          period: input.period || 'monthly',
          date: input.date ? new Date(input.date) : new Date(),
          paidBy: isGroupExpense ? paidBy : null,
          splitBetween,
          splitType: isGroupExpense ? input.splitType : null,
        }], opts);
        created = docs[0];

        try {
          await auditLogService.record({
            actorId: userId,
            action: 'expense.created',
            targetType: 'Transaction',
            targetId: created._id,
            before: null,
            after: created.toObject(),
            metadata: auditMeta,
            ...(session ? { session } : {}),
          });
        } catch {}
      });

      if (isGroupExpense) {
        balanceService.invalidateGroup(input.groupId);
        const balances = await balanceService.getGroupBalances(input.groupId, { skipCache: true });
        events?.emitToGroup(input.groupId, 'expense:created', { groupId: input.groupId, transaction: created });
        events?.emitToGroup(input.groupId, 'balance:updated', { groupId: input.groupId, balances });
      }

      if (input.type === 'expense') {
        await budgetService.checkBudgetAlerts(userId, input.category).catch(() => {});
      }

      return created;
    },

    async update(id, userId, input, auditMeta = {}) {
      const txn = await transactionModel.findOne({ _id: id, deletedAt: null });
      if (!txn) throw notFound('Transaction not found');
      if (String(txn.userId) !== String(userId)) throw forbidden('Only the creator can edit this transaction');

      if (txn.groupId && (await hasSettlements(txn.groupId))) {
        throw conflict(
          'This expense belongs to a group with existing settlements. Edits are recorded but balances only change going forward.'
        );
      }

      const before = txn.toObject();

      if (txn.groupId && (input.amount || input.splitType || input.participants)) {
        const group = await assertGroupMembership(txn.groupId, userId);
        const paidBy = input.paidBy || txn.paidBy;
        const participants =
          input.participants ||
          txn.splitBetween.map((s) => ({ userId: s.userId, percentage: s.percentage, share: s.share }));

        txn.splitBetween = calculateSplit({
          amount: input.amount ?? txn.amount,
          splitType: input.splitType ?? txn.splitType,
          paidBy,
          participants,
        });
        txn.paidBy = paidBy;
        if (!group.isMember(paidBy)) throw badRequest('paidBy must be a group member');
      }

      const editable = ['amount', 'description', 'category', 'period', 'date', 'type', 'splitType'];
      for (const field of editable) {
        if (input[field] !== undefined) txn[field] = field === 'date' ? new Date(input[field]) : input[field];
      }
      txn.version += 1;
      txn.editedAt = new Date();
      await txn.save();

      await auditLogService.record({
        actorId: userId,
        action: 'expense.edited',
        targetType: 'Transaction',
        targetId: txn._id,
        before,
        after: txn.toObject(),
        metadata: auditMeta,
      });

      if (txn.groupId) {
        balanceService.invalidateGroup(txn.groupId);
        const balances = await balanceService.getGroupBalances(txn.groupId, { skipCache: true });
        events?.emitToGroup(txn.groupId, 'expense:edited', { groupId: txn.groupId, transaction: txn });
        events?.emitToGroup(txn.groupId, 'balance:updated', { groupId: txn.groupId, balances });
      }

      return txn;
    },

    async remove(id, userId, auditMeta = {}) {
      const txn = await transactionModel.findOne({ _id: id, deletedAt: null });
      if (!txn) throw notFound('Transaction not found');
      if (String(txn.userId) !== String(userId)) throw forbidden('Only the creator can delete this transaction');

      if (txn.groupId && (await hasSettlements(txn.groupId))) {
        throw conflict(
          'This expense has settlements. To remove it, settle with the group first or contact support.'
        );
      }

      const before = txn.toObject();
      txn.deletedAt = new Date();
      await txn.save();

      await auditLogService.record({
        actorId: userId,
        action: 'expense.deleted',
        targetType: 'Transaction',
        targetId: txn._id,
        before,
        after: null,
        metadata: auditMeta,
      });

      if (txn.groupId) {
        balanceService.invalidateGroup(txn.groupId);
        const balances = await balanceService.getGroupBalances(txn.groupId, { skipCache: true });
        events?.emitToGroup(txn.groupId, 'expense:deleted', { groupId: txn.groupId, transaction: txn });
        events?.emitToGroup(txn.groupId, 'balance:updated', { groupId: txn.groupId, balances });
      }
    },

    /**
     * Category summary — powers dashboard charts.
     * period: 'monthly' (default) → current month, trend by day.
     * period: 'yearly' → whole year, trend by month, plus annual totals.
     */
    async summary(userId, { month, year, period = 'monthly' } = {}) {
      const now = new Date();
      const m = month ?? now.getUTCMonth() + 1;
      const y = year ?? now.getUTCFullYear();

      const isYearly = period === 'yearly';
      const start = isYearly ? new Date(Date.UTC(y, 0, 1)) : new Date(Date.UTC(y, m - 1, 1));
      const end = isYearly ? new Date(Date.UTC(y + 1, 0, 1)) : new Date(Date.UTC(y, m, 1));

      const uid = new mongoose.Types.ObjectId(String(userId));
      const bucketExpr = isYearly ? { $month: '$date' } : { $dayOfMonth: '$date' };

      const [personalCategory, personalBucket, groupCategory, groupBucket] = await Promise.all([
        // Personal expense categories (full amount)
        transactionModel.aggregate([
          { $match: { userId: uid, groupId: null, deletedAt: null, type: 'expense', date: { $gte: start, $lt: end } } },
          { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ]),
        // Personal transactions by day/month (income + expense)
        transactionModel.aggregate([
          { $match: { userId: uid, groupId: null, deletedAt: null, date: { $gte: start, $lt: end } } },
          {
            $group: {
              _id: { bucket: bucketExpr, type: '$type' },
              total: { $sum: '$amount' },
            },
          },
          { $sort: { '_id.bucket': 1 } },
        ]),
        // Group expense categories — user's share only
        transactionModel.aggregate([
          { $match: { groupId: { $ne: null }, deletedAt: null, type: 'expense', date: { $gte: start, $lt: end } } },
          { $unwind: '$splitBetween' },
          { $match: { 'splitBetween.userId': uid } },
          { $group: { _id: '$category', total: { $sum: '$splitBetween.amountOwed' }, count: { $sum: 1 } } },
        ]),
        // Group expense shares by day/month
        transactionModel.aggregate([
          { $match: { groupId: { $ne: null }, deletedAt: null, type: 'expense', date: { $gte: start, $lt: end } } },
          { $unwind: '$splitBetween' },
          { $match: { 'splitBetween.userId': uid } },
          {
            $group: {
              _id: { bucket: bucketExpr, type: 'expense' },
              total: { $sum: '$splitBetween.amountOwed' },
            },
          },
          { $sort: { '_id.bucket': 1 } },
        ]),
      ]);

      // Merge personal + group category totals
      const categoryMap = new Map();
      for (const row of personalCategory) {
        categoryMap.set(row._id, { total: row.total, count: row.count });
      }
      for (const row of groupCategory) {
        const existing = categoryMap.get(row._id);
        if (existing) {
          existing.total += row.total;
          existing.count += row.count;
        } else {
          categoryMap.set(row._id, { total: row.total, count: row.count });
        }
      }
      const byCategory = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ _id: category, ...data }))
        .sort((a, b) => b.total - a.total);

      // Merge personal + group bucket totals
      const bucketMap = new Map();
      for (const row of personalBucket) {
        const key = `${row._id.bucket}-${row._id.type}`;
        bucketMap.set(key, row.total);
      }
      for (const row of groupBucket) {
        const key = `${row._id.bucket}-${row._id.type}`;
        const existing = bucketMap.get(key);
        bucketMap.set(key, (existing || 0) + row.total);
      }
      const byBucket = Array.from(bucketMap.entries()).map(([key, total]) => {
        const [bucket, type] = key.split('-');
        return { _id: { bucket: Number(bucket), type }, total };
      }).sort((a, b) => a._id.bucket - b._id.bucket);

      const totals = byBucket.reduce(
        (acc, b) => {
          if (b._id.type === 'expense') acc.totalExpense += b.total;
          else acc.totalIncome += b.total;
          return acc;
        },
        { totalExpense: 0, totalIncome: 0 }
      );

      return {
        period: isYearly ? 'yearly' : 'monthly',
        month: isYearly ? null : m,
        year: y,
        totalExpense: Math.round(totals.totalExpense * 100) / 100,
        totalIncome: Math.round(totals.totalIncome * 100) / 100,
        byCategory: byCategory.map((c) => ({ category: c._id, total: c.total, count: c.count })),
        // 'day' key kept for backwards compat: contains day-of-month (monthly) or month number (yearly)
        byDay: byBucket.map((d) => ({ day: d._id.bucket, type: d._id.type, total: d.total })),
      };
    },
  };
}
