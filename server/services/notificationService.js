import { notFound, forbidden } from '../utils/AppError.js';

export function createNotificationService({ notificationModel }) {
  return {
    async list(userId, { limit = 20, includeRead = false } = {}) {
      const query = { userId };
      if (!includeRead) query.isRead = false;
      const notifications = await notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      const unreadCount = await notificationModel.countDocuments({ userId, isRead: false });
      return { notifications, unreadCount };
    },

    async markRead(notificationId, userId) {
      const notification = await notificationModel.findById(notificationId);
      if (!notification) throw notFound('Notification not found');
      if (String(notification.userId) !== String(userId)) throw forbidden('Not your notification');
      notification.isRead = true;
      await notification.save();
      return notification;
    },

    async markAllRead(userId) {
      await notificationModel.updateMany({ userId, isRead: false }, { isRead: true });
      return { success: true };
    },

    async unreadCount(userId) {
      return notificationModel.countDocuments({ userId, isRead: false });
    },
  };
}
