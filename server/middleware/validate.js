import { badRequest } from '../utils/AppError.js';

/**
 * Validates req.body (and optionally query/params) against a Zod schema.
 * Usage: router.post('/', validate(createTransactionSchema), controller.create)
 */
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(badRequest('Validation failed', errors));
    }
    req[source === 'body' ? 'body' : source] = result.data;
    next();
  };
