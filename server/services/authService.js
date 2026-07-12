import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { sendOtpEmail, sendResetEmail } from './emailService.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshTokenExpiry,
} from '../utils/tokens.js';
import { badRequest, unauthorized, conflict } from '../utils/AppError.js';

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

export function createAuthService({ userModel, refreshTokenModel, passwordResetTokenModel, emailOtpModel }) {
  async function issueTokenPair(user) {
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await refreshTokenModel.create({
      userId: user._id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiry(),
      isRevoked: false,
    });

    return { accessToken, refreshToken };
  }

  return {
    /**
     * Step 1 of signup: send a 6-digit verification code to the email.
     * In development (no email provider) the code is returned so the flow
     * can be completed in-app.
     */
    async sendSignupOtp(email) {
      const normalized = email.toLowerCase();
      const existing = await userModel.findOne({ email: normalized, deletedAt: null });
      if (existing) throw conflict('An account with this email already exists');

      const otp = String(crypto.randomInt(100000, 1000000));
      await emailOtpModel.deleteMany({ email: normalized });
      await emailOtpModel.create({
        email: normalized,
        otpHash: hashToken(otp),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      });

      const sent = await sendOtpEmail(normalized, otp);
      return { devOtp: sent ? null : otp, ttlMinutes: OTP_TTL_MINUTES, sent };
    },

    /** Step 2 of signup: verify the OTP, then create the account. */
    async register({ name, email, password, otp, defaultCurrency, timezone }) {
      const existing = await userModel.findOne({ email: email.toLowerCase() });
      if (existing) throw conflict('An account with this email already exists');

      const record = await emailOtpModel.findOne({ email: email.toLowerCase() });
      if (!record || record.expiresAt < new Date()) {
        throw badRequest('Verification code expired or not requested. Please request a new code.');
      }
      if (record.attempts >= OTP_MAX_ATTEMPTS) {
        await emailOtpModel.deleteOne({ _id: record._id });
        throw badRequest('Too many incorrect attempts. Please request a new code.');
      }
      if (hashToken(String(otp || '')) !== record.otpHash) {
        record.attempts += 1;
        await record.save();
        throw badRequest('Incorrect verification code. Please check your email and try again.');
      }
      await emailOtpModel.deleteOne({ _id: record._id });

      const passwordHash = await bcrypt.hash(password, env.bcryptCost);
      const user = await userModel.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        ...(defaultCurrency ? { defaultCurrency } : {}),
        ...(timezone ? { timezone } : {}),
      });

      const tokens = await issueTokenPair(user);
      return { user, ...tokens };
    },

    async login({ email, password }) {
      const user = await userModel
        .findOne({ email: email.toLowerCase(), deletedAt: null })
        .select('+passwordHash');
      if (!user) throw unauthorized('Invalid email or password');
      if (!user.passwordHash) {
        throw unauthorized('This account uses Google sign-in. Use "Continue with Google" or reset your password.');
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) throw unauthorized('Invalid email or password');

      const tokens = await issueTokenPair(user);
      return { user, ...tokens };
    },

    /**
     * Google OAuth: verify the Google ID token (credential) from the
     * client-side Google Identity Services flow, then find-or-create the user.
     */
    async googleAuth({ credential }) {
      if (!googleClient) throw badRequest('Google sign-in is not configured on this server');
      if (!credential) throw badRequest('Missing Google credential');

      let payload;
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: env.googleClientId,
        });
        payload = ticket.getPayload();
      } catch {
        throw unauthorized('Invalid Google credential');
      }

      const email = payload.email?.toLowerCase();
      if (!email || !payload.email_verified) throw unauthorized('Google account email is not verified');

      let user = await userModel.findOne({ googleId: payload.sub, deletedAt: null });
      if (!user) {
        // Link by email if an account already exists, otherwise create one
        user = await userModel.findOne({ email, deletedAt: null });
        if (user) {
          user.googleId = payload.sub;
          if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture;
          await user.save();
        } else {
          user = await userModel.create({
            name: payload.name || email.split('@')[0],
            email,
            googleId: payload.sub,
            avatarUrl: payload.picture || null,
            passwordHash: null,
          });
        }
      }

      const tokens = await issueTokenPair(user);
      return { user, ...tokens };
    },

    /**
     * Forgot password: always resolves successfully (never reveals whether
     * the email exists). In development (no email provider configured) the
     * reset URL is returned so the flow can be completed in-app.
     */
    async forgotPassword(email) {
      const user = await userModel.findOne({ email: email.toLowerCase(), deletedAt: null });
      if (!user) return { resetUrl: null };

      const rawToken = crypto.randomBytes(32).toString('hex');
      await passwordResetTokenModel.create({
        userId: user._id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + env.resetTokenTtlMinutes * 60 * 1000),
      });

      const resetUrl = `${env.clientOrigin}/reset-password/${rawToken}`;
      const sent = await sendResetEmail(user.email, resetUrl);
      return { resetUrl: sent ? null : resetUrl, sent };
    },

    async verifyResetToken(rawToken) {
      const stored = await passwordResetTokenModel.findOne({ tokenHash: hashToken(rawToken) });
      const valid = Boolean(stored && !stored.usedAt && stored.expiresAt > new Date());
      return { valid };
    },

    async resetPassword(rawToken, newPassword) {
      const stored = await passwordResetTokenModel.findOne({ tokenHash: hashToken(rawToken) });
      if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
        throw badRequest('This reset link is invalid or has expired');
      }

      const passwordHash = await bcrypt.hash(newPassword, env.bcryptCost);
      await userModel.updateOne({ _id: stored.userId }, { $set: { passwordHash } });

      stored.usedAt = new Date();
      await stored.save();

      // Force re-login everywhere
      await refreshTokenModel.updateMany({ userId: stored.userId }, { isRevoked: true });
    },

    async changePassword(userId, { currentPassword, newPassword }) {
      const user = await userModel.findOne({ _id: userId, deletedAt: null }).select('+passwordHash');
      if (!user) throw badRequest('User not found');

      if (user.passwordHash) {
        const match = await bcrypt.compare(currentPassword || '', user.passwordHash);
        if (!match) throw unauthorized('Current password is incorrect');
      }

      user.passwordHash = await bcrypt.hash(newPassword, env.bcryptCost);
      await user.save();

      await refreshTokenModel.updateMany({ userId }, { isRevoked: true });
      return user;
    },

    /**
     * Refresh token ROTATION: the presented token is validated against the
     * store, revoked (denylist), and a brand-new pair is issued.
     * Reuse of a revoked token revokes ALL of the user's tokens (theft signal).
     */
    async refresh(presentedToken) {
      if (!presentedToken) throw unauthorized('Missing refresh token');

      let payload;
      try {
        payload = verifyRefreshToken(presentedToken);
      } catch {
        throw unauthorized('Invalid or expired refresh token');
      }

      const tokenHash = hashToken(presentedToken);
      const stored = await refreshTokenModel.findOne({ tokenHash });

      if (!stored) throw unauthorized('Refresh token not recognized');

      if (stored.isRevoked) {
        // Token reuse detected — revoke everything for this user
        await refreshTokenModel.updateMany({ userId: stored.userId }, { isRevoked: true });
        throw unauthorized('Refresh token reuse detected. All sessions revoked.');
      }

      if (stored.expiresAt < new Date()) throw unauthorized('Refresh token expired');

      const user = await userModel.findOne({ _id: payload.sub, deletedAt: null });
      if (!user) throw unauthorized('User not found');

      // Rotate: revoke old, issue new
      stored.isRevoked = true;
      await stored.save();

      const tokens = await issueTokenPair(user);
      return { user, ...tokens };
    },

    async logout(presentedToken) {
      if (!presentedToken) return;
      const tokenHash = hashToken(presentedToken);
      await refreshTokenModel.updateOne({ tokenHash }, { isRevoked: true });
    },

    async updateProfile(userId, updates) {
      const user = await userModel.findOneAndUpdate(
        { _id: userId, deletedAt: null },
        { $set: updates },
        { new: true, runValidators: true }
      );
      if (!user) throw badRequest('User not found');
      return user;
    },

    /** GDPR soft delete: anonymize but preserve transaction history */
    async softDeleteUser(userId) {
      const anonymizedEmail = `${crypto.randomUUID()}@deleted.local`;
      await userModel.updateOne(
        { _id: userId },
        {
          $set: {
            name: 'Deleted User',
            email: anonymizedEmail,
            avatarUrl: null,
            deletedAt: new Date(),
          },
        }
      );
      await refreshTokenModel.updateMany({ userId }, { isRevoked: true });
    },
  };
}
