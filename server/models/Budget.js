import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true },
    monthlyLimit: { type: Number, required: true, min: 0.01 },
    period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    // month is null for yearly budgets
    month: { type: Number, min: 1, max: 12, default: null },
    year: { type: Number, required: true },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, category: 1, period: 1, month: 1, year: 1 }, { unique: true });

export const Budget = mongoose.model('Budget', budgetSchema);
