import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  type: z.enum(['household', 'trip', 'team', 'other']).optional(),
  currency: z.string().length(3).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['household', 'trip', 'team', 'other']).optional(),
  currency: z.string().length(3).optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email('A valid member email is required'),
});
