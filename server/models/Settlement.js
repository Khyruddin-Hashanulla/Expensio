import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    idempotencyKey: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'completed' },
    settledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

settlementSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const Settlement = mongoose.model('Settlement', settlementSchema);
