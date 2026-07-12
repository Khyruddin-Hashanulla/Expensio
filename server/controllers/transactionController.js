export function createTransactionController({ transactionService }) {
  return {
    async list(req, res, next) {
      try {
        const result = await transactionService.list(req.user._id, req.query);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },

    async getById(req, res, next) {
      try {
        const txn = await transactionService.getById(req.params.id, req.user._id);
        res.json({ success: true, data: { transaction: txn } });
      } catch (err) {
        next(err);
      }
    },

    async create(req, res, next) {
      try {
        const txn = await transactionService.create(req.user._id, req.body, req.auditMeta);
        res.status(201).json({ success: true, data: { transaction: txn } });
      } catch (err) {
        next(err);
      }
    },

    async update(req, res, next) {
      try {
        const txn = await transactionService.update(req.params.id, req.user._id, req.body, req.auditMeta);
        res.json({ success: true, data: { transaction: txn } });
      } catch (err) {
        next(err);
      }
    },

    async remove(req, res, next) {
      try {
        await transactionService.remove(req.params.id, req.user._id, req.auditMeta);
        res.json({ success: true, message: 'Transaction deleted' });
      } catch (err) {
        next(err);
      }
    },

    async summary(req, res, next) {
      try {
        const data = await transactionService.summary(req.user._id, {
          month: req.query.month ? Number(req.query.month) : undefined,
          year: req.query.year ? Number(req.query.year) : undefined,
          period: req.query.period === 'yearly' ? 'yearly' : 'monthly',
        });
        res.json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },
  };
}
