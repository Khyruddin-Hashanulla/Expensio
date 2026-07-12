import { badRequest, notFound, forbidden } from '../utils/AppError.js';

export function createGroupService({ groupModel, userModel, auditLogService, balanceService }) {
  async function getGroupOrThrow(groupId) {
    const group = await groupModel.findOne({ _id: groupId, deletedAt: null });
    if (!group) throw notFound('Group not found');
    return group;
  }

  return {
    async create(userId, { name, type, currency }, auditMeta = {}) {
      const group = await groupModel.create({
        name,
        type: type || 'other',
        currency: currency || 'INR',
        createdBy: userId,
        members: [{ userId, role: 'admin', joinedAt: new Date() }],
      });

      await auditLogService.record({
        actorId: userId,
        action: 'group.created',
        targetType: 'Group',
        targetId: group._id,
        after: group.toObject(),
        metadata: auditMeta,
      });

      return group;
    },

    async listForUser(userId) {
      return groupModel
        .find({ 'members.userId': userId, deletedAt: null })
        .sort({ updatedAt: -1 })
        .populate('members.userId', 'name email avatarUrl')
        .lean();
    },

    async getDetail(groupId, userId) {
      const group = await groupModel
        .findOne({ _id: groupId, deletedAt: null })
        .populate('members.userId', 'name email avatarUrl');
      if (!group) throw notFound('Group not found');
      if (!group.members.some((m) => String(m.userId?._id ?? m.userId) === String(userId))) {
        throw forbidden('You are not a member of this group');
      }
      return group;
    },

    async update(groupId, userId, updates, auditMeta = {}) {
      const group = await getGroupOrThrow(groupId);
      if (!group.isAdmin(userId)) throw forbidden('Only group admins can edit the group');

      const before = group.toObject();
      for (const field of ['name', 'type', 'currency']) {
        if (updates[field] !== undefined) group[field] = updates[field];
      }
      await group.save();

      await auditLogService.record({
        actorId: userId,
        action: 'group.updated',
        targetType: 'Group',
        targetId: group._id,
        before,
        after: group.toObject(),
        metadata: auditMeta,
      });

      return group;
    },

    async addMember(groupId, actorId, memberEmail, auditMeta = {}) {
      const group = await getGroupOrThrow(groupId);
      if (!group.isMember(actorId)) throw forbidden('Only group members can add members');

      const user = await userModel.findOne({ email: memberEmail.toLowerCase(), deletedAt: null });
      if (!user) throw notFound('No user found with that email');
      if (group.isMember(user._id)) throw badRequest('User is already a member of this group');

      const before = group.toObject();
      group.members.push({ userId: user._id, role: 'member', joinedAt: new Date() });
      await group.save();

      await auditLogService.record({
        actorId,
        action: 'group.member.added',
        targetType: 'Group',
        targetId: group._id,
        before,
        after: group.toObject(),
        metadata: { ...auditMeta, addedUserId: String(user._id) },
      });

      return group.populate('members.userId', 'name email avatarUrl');
    },

    /**
     * Remove a member — BLOCKED if they have an outstanding balance.
     */
    async removeMember(groupId, actorId, memberUserId, auditMeta = {}) {
      const group = await getGroupOrThrow(groupId);
      const isSelf = String(actorId) === String(memberUserId);
      if (!isSelf && !group.isAdmin(actorId)) {
        throw forbidden('Only group admins can remove other members');
      }
      if (!group.isMember(memberUserId)) throw notFound('User is not a member of this group');

      const balance = await balanceService.getMemberBalance(groupId, memberUserId);
      if (Math.abs(balance) >= 0.01) {
        throw badRequest('Please settle outstanding balances before leaving.');
      }

      const before = group.toObject();
      group.members = group.members.filter((m) => String(m.userId) !== String(memberUserId));
      await group.save();

      await auditLogService.record({
        actorId,
        action: 'group.member.removed',
        targetType: 'Group',
        targetId: group._id,
        before,
        after: group.toObject(),
        metadata: { ...auditMeta, removedUserId: String(memberUserId) },
      });

      return group;
    },

    async softDelete(groupId, userId, auditMeta = {}) {
      const group = await getGroupOrThrow(groupId);
      if (!group.isCreator(userId)) throw forbidden('Only the group creator can delete the group');

      const before = group.toObject();
      group.deletedAt = new Date();
      await group.save();

      await auditLogService.record({
        actorId: userId,
        action: 'group.deleted',
        targetType: 'Group',
        targetId: group._id,
        before,
        after: null,
        metadata: auditMeta,
      });
    },

    async assertMembership(groupId, userId) {
      const group = await getGroupOrThrow(groupId);
      if (!group.isMember(userId)) throw forbidden('You are not a member of this group');
      return group;
    },
  };
}
