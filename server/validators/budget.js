import { z } from 'zod';

export const createBudgetSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100),
  monthlyLimit: z.number().positive('Limit must be positive'),
  period: z.enum(['monthly', 'yearly']).optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
});

export const updateBudgetSchema = z.object({
  monthlyLimit: z.number().positive('Limit must be positive'),
});
