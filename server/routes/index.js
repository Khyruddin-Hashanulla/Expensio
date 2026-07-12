import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  readLimiter,
  writeLimiter,
} from '../middleware/rateLimit.js';
import {
  registerSchema,
  sendOtpSchema,
  loginSchema,
  updateProfileSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
} from '../validators/transaction.js';
import { createGroupSchema, updateGroupSchema, addMemberSchema } from '../validators/group.js';
import { createSettlementSchema } from '../validators/settlement.js';
import { createBudgetSchema, updateBudgetSchema } from '../validators/budget.js';
import { isDbConnected } from '../config/db.js';

export function buildRouter({ controllers }) {
  const router = Router();

  // ---- System ----
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      dbConnected: isDbConnected(),
    });
  });

  // ---- Auth ----
  router.post('/auth/send-otp', registerLimiter, validate(sendOtpSchema), controllers.auth.sendOtp);
  router.post('/auth/register', registerLimiter, validate(registerSchema), controllers.auth.register);
  router.post('/auth/login', loginLimiter, validate(loginSchema), controllers.auth.login);
  router.post('/auth/refresh', refreshLimiter, controllers.auth.refresh);
  router.post('/auth/logout', controllers.auth.logout);
  router.get('/auth/me', requireAuth, controllers.auth.me);
  router.post('/auth/google', loginLimiter, validate(googleAuthSchema), controllers.auth.google);
  router.get('/auth/google/config', controllers.auth.googleConfig);
  router.post(
    '/auth/forgot-password',
    loginLimiter,
    validate(forgotPasswordSchema),
    controllers.auth.forgotPassword
  );
  router.get('/auth/verify-reset-token/:token', controllers.auth.verifyResetToken);
  router.post('/auth/reset-password/:token', validate(resetPasswordSchema), controllers.auth.resetPassword);
  router.put(
    '/users/me/password',
    requireAuth,
    validate(changePasswordSchema),
    controllers.auth.changePassword
  );

  // ---- Users ----
  router.get('/users/me', requireAuth, controllers.auth.me);
  router.put('/users/me', requireAuth, validate(updateProfileSchema), controllers.auth.updateMe);
  router.delete('/users/me', requireAuth, controllers.auth.deleteMe);

  // ---- Transactions ----
  router.get(
    '/transactions',
    requireAuth,
    readLimiter,
    validate(listTransactionsQuerySchema, 'query'),
    controllers.transactions.list
  );
  router.get('/transactions/summary', requireAuth, readLimiter, controllers.transactions.summary);
  router.post(
    '/transactions',
    requireAuth,
    writeLimiter,
    validate(createTransactionSchema),
    controllers.transactions.create
  );
  router.get('/transactions/:id', requireAuth, readLimiter, controllers.transactions.getById);
  router.put(
    '/transactions/:id',
    requireAuth,
    writeLimiter,
    validate(updateTransactionSchema),
    controllers.transactions.update
  );
  router.delete('/transactions/:id', requireAuth, writeLimiter, controllers.transactions.remove);

  // ---- Groups ----
  router.post('/groups', requireAuth, writeLimiter, validate(createGroupSchema), controllers.groups.create);
  router.get('/groups', requireAuth, readLimiter, controllers.groups.list);
  router.get('/groups/:id', requireAuth, readLimiter, controllers.groups.detail);
  router.put('/groups/:id', requireAuth, writeLimiter, validate(updateGroupSchema), controllers.groups.update);
  router.post(
    '/groups/:id/members',
    requireAuth,
    writeLimiter,
    validate(addMemberSchema),
    controllers.groups.addMember
  );
  router.delete('/groups/:id/members/:userId', requireAuth, writeLimiter, controllers.groups.removeMember);
  router.get('/groups/:id/balances', requireAuth, readLimiter, controllers.groups.balances);
  router.get('/groups/:id/simplify', requireAuth, readLimiter, controllers.groups.simplify);
  router.get('/groups/:id/settlements', requireAuth, readLimiter, controllers.settlements.listForGroup);
  router.delete('/groups/:id', requireAuth, writeLimiter, controllers.groups.remove);

  // ---- Settlements ----
  router.post(
    '/settlements',
    requireAuth,
    writeLimiter,
    validate(createSettlementSchema),
    controllers.settlements.create
  );
  router.put('/settlements/:id', requireAuth, writeLimiter, controllers.settlements.markCompleted);

  // ---- Budgets ----
  router.get('/budgets', requireAuth, readLimiter, controllers.budgets.list);
  router.get('/budgets/status', requireAuth, readLimiter, controllers.budgets.status);
  router.post('/budgets', requireAuth, writeLimiter, validate(createBudgetSchema), controllers.budgets.create);
  router.put('/budgets/:id', requireAuth, writeLimiter, validate(updateBudgetSchema), controllers.budgets.update);
  router.delete('/budgets/:id', requireAuth, writeLimiter, controllers.budgets.remove);

  return router;
}
