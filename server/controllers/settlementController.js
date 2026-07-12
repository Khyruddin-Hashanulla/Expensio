export function createSettlementController({ settlementService }) {
  return {
    async create(req, res, next) {
      try {
        const { settlement, deduplicated } = await settlementService.create(
          req.user._id,
          req.body,
          req.auditMeta
        );
        res.status(deduplicated ? 200 : 201).json({
          success: true,
          data: { settlement, deduplicated },
        });
      } catch (err) {
        next(err);
      }
    },

    async listForGroup(req, res, next) {
      try {
        const settlements = await settlementService.listForGroup(req.params.id, req.user._id);
        res.json({ success: true, data: { settlements } });
      } catch (err) {
        next(err);
      }
    },

    async markCompleted(req, res, next) {
      try {
        const settlement = await settlementService.markCompleted(req.params.id, req.user._id, req.auditMeta);
        res.json({ success: true, data: { settlement } });
      } catch (err) {
        next(err);
      }
    },
  };
}
