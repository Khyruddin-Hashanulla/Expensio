import mongoose from 'mongoose';

const splitEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    share: { type: Number, default: null },
    percentage: { type: Number, default: null },
    amountOwed: { type: Number, required: true },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'INR' },
    baseCurrency: { type: String, default: null },
    convertedAmount: { type: Number, default: null },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    date: { type: Date, default: Date.now },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    splitBetween: { type: [splitEntrySchema], default: [] },
    splitType: { type: String, enum: ['equal', 'percentage', 'custom', null], default: null },
    version: { type: Number, default: 1 },
    editedAt: { type: Date, default: null },
    recurring: {
      isRecurring: { type: Boolean, default: false },
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly', null], default: null },
      nextRunAt: { type: Date, default: null },
      lastRunAt: { type: Date, default: null },
    },
    receiptUrl: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ groupId: 1, date: -1 });
transactionSchema.index({ paidBy: 1 });
transactionSchema.index({ 'splitBetween.userId': 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
