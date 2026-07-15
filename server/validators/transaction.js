import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const participantSchema = z.object({
  userId: objectId,
  percentage: z.number().min(0).max(100).optional(),
  share: z.number().min(0).optional(),
});

export const createTransactionSchema = z
  .object({
    type: z.enum(['income', 'expense']),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3).optional(),
    description: z.string().min(1, 'Description is required').max(500),
    category: z.string().min(1, 'Category is required').max(100),
    period: z.enum(['monthly', 'yearly']).optional(),
    date: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
    groupId: objectId.nullable().optional(),
    paidBy: objectId.optional(),
    splitType: z.enum(['equal', 'percentage', 'custom']).optional(),
    participants: z.array(participantSchema).min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.groupId) {
      if (!data.splitType) {
        ctx.addIssue({ code: 'custom', path: ['splitType'], message: 'splitType is required for group expenses' });
      }
      if (!data.participants || data.participants.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['participants'], message: 'participants are required for group expenses' });
      }
      if (data.splitType === 'percentage' && data.participants?.some((p) => p.percentage === undefined)) {
        ctx.addIssue({ code: 'custom', path: ['participants'], message: 'Each participant needs a percentage' });
      }
      if (data.splitType === 'custom' && data.participants?.some((p) => p.share === undefined)) {
        ctx.addIssue({ code: 'custom', path: ['participants'], message: 'Each participant needs a share amount' });
      }
    }
  });

export const updateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().min(1).max(500).optional(),
  category: z.string().min(1).max(100).optional(),
  period: z.enum(['monthly', 'yearly']).optional(),
  date: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  type: z.enum(['income', 'expense']).optional(),
  splitType: z.enum(['equal', 'percentage', 'custom']).optional(),
  paidBy: objectId.optional(),
  participants: z.array(participantSchema).min(1).optional(),
});

export const listTransactionsQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  category: z.string().optional(),
  groupId: z.union([objectId, z.literal('personal')]).optional(),
  type: z.enum(['income', 'expense']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
