import mongoose from 'mongoose';
import { badRequest, notFound, forbidden } from '../utils/AppError.js';
import { round2 } from '../utils/rounding.js';

export function createBudgetService({ budgetModel, transactionModel, notificationModel }) {
  function currentPeriod() {
    const now = new Date();
    return { month: now.getUTCMonth() + 1, year: now.getUTCFullYear() };
  }

  /** Spend for a category over a month (period=monthly) or a whole year (period=yearly) */
  async function spendForCategory(userId, category, { period = 'monthly', month, year }) {
    const start =
      period === 'yearly' ? new Date(Date.UTC(year, 0, 1)) : new Date(Date.UTC(year, month - 1, 1));
    const end = period === 'yearly' ? new Date(Date.UTC(year + 1, 0, 1)) : new Date(Date.UTC(year, month, 1));
    const uid = new mongoose.Types.ObjectId(String(userId));

    const result = await transactionModel.aggregate([
      {
        $match: {
          userId: uid,
          deletedAt: null,
          type: 'expense',
          category,
          date: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  return {
    async list(userId) {
      return budgetModel.find({ userId }).sort({ year: -1, month: -1, category: 1 }).lean();
    },

    async create(userId, { category, monthlyLimit, period = 'monthly', month, year }) {
      const now = currentPeriod();
      try {
        return await budgetModel.create({
          userId,
          category,
          monthlyLimit,
          period,
          month: period === 'yearly' ? null : (month ?? now.month),
          year: year ?? now.year,
        });
      } catch (err) {
        if (err.code === 11000) throw badRequest('A budget for this category and period already exists');
        throw err;
      }
    },

    async update(budgetId, userId, { monthlyLimit }) {
      const budget = await budgetModel.findById(budgetId);
      if (!budget) throw notFound('Budget not found');
      if (String(budget.userId) !== String(userId)) throw forbidden('Not your budget');

      budget.monthlyLimit = monthlyLimit;
      await budget.save();
      return budget;
    },

    async remove(budgetId, userId) {
      const budget = await budgetModel.findById(budgetId);
      if (!budget) throw notFound('Budget not found');
      if (String(budget.userId) !== String(userId)) throw forbidden('Not your budget');
      await budgetModel.deleteOne({ _id: budgetId });
    },

    /**
     * Spent vs limit per category for the current month or year.
     * In yearly view, monthly budgets are annualized (limit x 12) so users can
     * compare full-year spend against their limits with the toggle.
     */
    async status(userId, { period = 'monthly' } = {}) {
      const { month, year } = currentPeriod();
      const query =
        period === 'yearly'
          ? { userId, year }
          : { userId, year, month, $or: [{ period: 'monthly' }, { period: { $exists: false } }] };
      const budgets = await budgetModel.find(query).lean();

      return Promise.all(
        budgets.map(async (b) => {
          const spent = await spendForCategory(userId, b.category, { period, month, year });
          const effectiveLimit =
            period === 'yearly' && b.period !== 'yearly' ? b.monthlyLimit * 12 : b.monthlyLimit;
          return {
            ...b,
            effectiveLimit: round2(effectiveLimit),
            currentSpend: round2(spent),
            percentUsed: effectiveLimit > 0 ? round2((spent / effectiveLimit) * 100) : 0,
          };
        })
      );
    },

    /**
     * Called after transaction mutations: creates budget_warning at >= 80%
     * and budget_exceeded at >= 100% of the category limit.
     */
    async checkBudgetAlerts(userId, category) {
      const { month, year } = currentPeriod();
      const budget = await budgetModel.findOne({
        userId,
        category,
        year,
        $or: [{ period: 'yearly' }, { month }],
      });
      if (!budget) return;

      const spent = await spendForCategory(userId, category, {
        period: budget.period === 'yearly' ? 'yearly' : 'monthly',
        month,
        year,
      });
      const ratio = spent / budget.monthlyLimit;
      const label = budget.period === 'yearly' ? 'year' : 'month';

      if (ratio >= 1) {
        await notificationModel.create({
          userId,
          type: 'budget_exceeded',
          message: `You have exceeded your ${category} budget for this ${label} (${round2(spent)} of ${budget.monthlyLimit}).`,
        });
      } else if (ratio >= 0.8) {
        await notificationModel.create({
          userId,
          type: 'budget_warning',
          message: `You have used ${Math.round(ratio * 100)}% of your ${category} budget for this ${label}.`,
        });
      }
    },
  };
}
