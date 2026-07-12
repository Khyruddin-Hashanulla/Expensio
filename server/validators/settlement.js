import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createSettlementSchema = z.object({
  groupId: objectId,
  fromUser: objectId,
  toUser: objectId,
  amount: z.number().positive('Amount must be positive'),
  idempotencyKey: z.string().uuid('idempotencyKey must be a UUID'),
});
