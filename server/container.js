import { User } from './models/User.js';
import { RefreshToken } from './models/RefreshToken.js';
import { PasswordResetToken } from './models/PasswordResetToken.js';
import { EmailOtp } from './models/EmailOtp.js';
import { Group } from './models/Group.js';
import { Transaction } from './models/Transaction.js';
import { Budget } from './models/Budget.js';
import { Settlement } from './models/Settlement.js';
import { AuditLog } from './models/AuditLog.js';
import { Notification } from './models/Notification.js';

import { createAuthService } from './services/authService.js';
import { createAuditLogService } from './services/auditLogService.js';
import { createBalanceService } from './services/balanceService.js';
import { createTransactionService } from './services/transactionService.js';
import { createGroupService } from './services/groupService.js';
import { createSettlementService } from './services/settlementService.js';
import { createBudgetService } from './services/budgetService.js';

import { createAuthController } from './controllers/authController.js';
import { createTransactionController } from './controllers/transactionController.js';
import { createGroupController } from './controllers/groupController.js';
import { createSettlementController } from './controllers/settlementController.js';
import { createBudgetController } from './controllers/budgetController.js';

/**
 * Composition root: wire models -> services -> controllers.
 * `events` is the Socket.io emitter facade ({ emitToGroup }), injected after
 * the socket server is created.
 */
export function buildContainer({ events }) {
  const auditLogService = createAuditLogService({ auditLogModel: AuditLog });
  const balanceService = createBalanceService({
    transactionModel: Transaction,
    settlementModel: Settlement,
  });
  const budgetService = createBudgetService({
    budgetModel: Budget,
    transactionModel: Transaction,
    notificationModel: Notification,
  });
  const authService = createAuthService({
    userModel: User,
    refreshTokenModel: RefreshToken,
    passwordResetTokenModel: PasswordResetToken,
    emailOtpModel: EmailOtp,
  });
  const groupService = createGroupService({
    groupModel: Group,
    userModel: User,
    auditLogService,
    balanceService,
  });
  const transactionService = createTransactionService({
    transactionModel: Transaction,
    groupModel: Group,
    settlementModel: Settlement,
    auditLogService,
    balanceService,
    budgetService,
    events,
  });
  const settlementService = createSettlementService({
    settlementModel: Settlement,
    groupModel: Group,
    auditLogService,
    balanceService,
    events,
  });

  return {
    services: {
      authService,
      auditLogService,
      balanceService,
      budgetService,
      groupService,
      transactionService,
      settlementService,
    },
    controllers: {
      auth: createAuthController({ authService }),
      transactions: createTransactionController({ transactionService }),
      groups: createGroupController({ groupService, balanceService }),
      settlements: createSettlementController({ settlementService }),
      budgets: createBudgetController({ budgetService }),
    },
  };
}
