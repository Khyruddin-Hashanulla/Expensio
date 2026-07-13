export function createNotificationController({ notificationService }) {
  return {
    async list(req, res, next) {
      try {
        const result = await notificationService.list(req.user._id, {
          limit: Math.min(Number(req.query.limit) || 20, 50),
          includeRead: req.query.includeRead === 'true',
        });
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },

    async markRead(req, res, next) {
      try {
        const notification = await notificationService.markRead(req.params.id, req.user._id);
        res.json({ success: true, data: { notification } });
      } catch (err) {
        next(err);
      }
    },

    async markAllRead(req, res, next) {
      try {
        await notificationService.markAllRead(req.user._id);
        res.json({ success: true, message: 'All notifications marked as read' });
      } catch (err) {
        next(err);
      }
    },

    async unreadCount(req, res, next) {
      try {
        const count = await notificationService.unreadCount(req.user._id);
        res.json({ success: true, data: { count } });
      } catch (err) {
        next(err);
      }
    },
  };
}
