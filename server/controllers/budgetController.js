export function createBudgetController({ budgetService }) {
  return {
    async list(req, res, next) {
      try {
        const budgets = await budgetService.list(req.user._id);
        res.json({ success: true, data: { budgets } });
      } catch (err) {
        next(err);
      }
    },

    async create(req, res, next) {
      try {
        const budget = await budgetService.create(req.user._id, req.body);
        res.status(201).json({ success: true, data: { budget } });
      } catch (err) {
        next(err);
      }
    },

    async update(req, res, next) {
      try {
        const budget = await budgetService.update(req.params.id, req.user._id, req.body);
        res.json({ success: true, data: { budget } });
      } catch (err) {
        next(err);
      }
    },

    async remove(req, res, next) {
      try {
        await budgetService.remove(req.params.id, req.user._id);
        res.json({ success: true, message: 'Budget deleted' });
      } catch (err) {
        next(err);
      }
    },

    async status(req, res, next) {
      try {
        const statuses = await budgetService.status(req.user._id, {
          period: req.query.period === 'yearly' ? 'yearly' : 'monthly',
        });
        res.json({ success: true, data: { budgets: statuses } });
      } catch (err) {
        next(err);
      }
    },
  };
}
