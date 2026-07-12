export function createGroupController({ groupService, balanceService }) {
  return {
    async create(req, res, next) {
      try {
        const group = await groupService.create(req.user._id, req.body, req.auditMeta);
        res.status(201).json({ success: true, data: { group } });
      } catch (err) {
        next(err);
      }
    },

    async list(req, res, next) {
      try {
        const groups = await groupService.listForUser(req.user._id);
        res.json({ success: true, data: { groups } });
      } catch (err) {
        next(err);
      }
    },

    async detail(req, res, next) {
      try {
        const group = await groupService.getDetail(req.params.id, req.user._id);
        res.json({ success: true, data: { group } });
      } catch (err) {
        next(err);
      }
    },

    async update(req, res, next) {
      try {
        const group = await groupService.update(req.params.id, req.user._id, req.body, req.auditMeta);
        res.json({ success: true, data: { group } });
      } catch (err) {
        next(err);
      }
    },

    async addMember(req, res, next) {
      try {
        const group = await groupService.addMember(req.params.id, req.user._id, req.body.email, req.auditMeta);
        res.json({ success: true, data: { group } });
      } catch (err) {
        next(err);
      }
    },

    async removeMember(req, res, next) {
      try {
        await groupService.removeMember(req.params.id, req.user._id, req.params.userId, req.auditMeta);
        res.json({ success: true, message: 'Member removed' });
      } catch (err) {
        next(err);
      }
    },

    async balances(req, res, next) {
      try {
        await groupService.assertMembership(req.params.id, req.user._id);
        const balances = await balanceService.getGroupBalances(req.params.id);
        res.json({ success: true, data: { groupId: req.params.id, balances } });
      } catch (err) {
        next(err);
      }
    },

    async simplify(req, res, next) {
      try {
        await groupService.assertMembership(req.params.id, req.user._id);
        const suggestions = await balanceService.getSimplifiedSettlements(req.params.id);
        res.json({ success: true, data: { groupId: req.params.id, suggestions } });
      } catch (err) {
        next(err);
      }
    },

    async remove(req, res, next) {
      try {
        await groupService.softDelete(req.params.id, req.user._id, req.auditMeta);
        res.json({ success: true, message: 'Group deleted' });
      } catch (err) {
        next(err);
      }
    },
  };
}
