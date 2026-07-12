import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['household', 'trip', 'team', 'other'], default: 'other' },
    members: { type: [memberSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currency: { type: String, default: 'INR' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

groupSchema.index({ 'members.userId': 1 });

groupSchema.methods.isMember = function (userId) {
  return this.members.some((m) => String(m.userId) === String(userId));
};

groupSchema.methods.isAdmin = function (userId) {
  return this.members.some((m) => String(m.userId) === String(userId) && m.role === 'admin');
};

groupSchema.methods.isCreator = function (userId) {
  return String(this.createdBy) === String(userId);
};

export const Group = mongoose.model('Group', groupSchema);
