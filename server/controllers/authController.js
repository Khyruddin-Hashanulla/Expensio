import { env } from '../config/env.js';

const REFRESH_COOKIE = 'expensio_refresh';

// In production the frontend (Vercel) and API (Render) live on different
// domains, so the refresh cookie must be SameSite=None + Secure to be sent
// on cross-site requests. In development, Strict is safer and works since
// the Vite proxy makes requests same-origin.
const refreshCookieOptions = {
  httpOnly: true,
  sameSite: env.isProduction ? 'none' : 'strict',
  secure: env.isProduction,
  path: '/api/v1/auth',
  maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
};

export function createAuthController({ authService }) {
  return {
    async sendOtp(req, res, next) {
      try {
        const { devOtp, ttlMinutes } = await authService.sendSignupOtp(req.body.email);
        res.json({
          success: true,
          message: `Verification code sent. It expires in ${ttlMinutes} minutes.`,
          data: devOtp ? { devOtp } : {},
        });
      } catch (err) {
        next(err);
      }
    },

    async register(req, res, next) {
      try {
        const { user, accessToken, refreshToken } = await authService.register(req.body);
        res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
        res.status(201).json({ success: true, data: { user: user.toSafeJSON(), accessToken } });
      } catch (err) {
        next(err);
      }
    },

    async login(req, res, next) {
      try {
        const { user, accessToken, refreshToken } = await authService.login(req.body);
        res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
        res.json({ success: true, data: { user: user.toSafeJSON(), accessToken } });
      } catch (err) {
        next(err);
      }
    },

    async refresh(req, res, next) {
      try {
        const presented = req.cookies?.[REFRESH_COOKIE];
        const { user, accessToken, refreshToken } = await authService.refresh(presented);
        res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
        res.json({ success: true, data: { user: user.toSafeJSON(), accessToken } });
      } catch (err) {
        next(err);
      }
    },

    async logout(req, res, next) {
      try {
        await authService.logout(req.cookies?.[REFRESH_COOKIE]);
        res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
        res.json({ success: true, message: 'Logged out' });
      } catch (err) {
        next(err);
      }
    },

    async google(req, res, next) {
      try {
        const { user, accessToken, refreshToken } = await authService.googleAuth(req.body);
        res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
        res.json({ success: true, data: { user: user.toSafeJSON(), accessToken } });
      } catch (err) {
        next(err);
      }
    },

    googleConfig(req, res) {
      res.json({ success: true, data: { clientId: env.googleClientId || null } });
    },

    async forgotPassword(req, res, next) {
      try {
        const { resetUrl } = await authService.forgotPassword(req.body.email);
        res.json({
          success: true,
          message: 'If an account exists for that email, a reset link has been sent.',
          data: resetUrl ? { resetUrl } : {},
        });
      } catch (err) {
        next(err);
      }
    },

    async verifyResetToken(req, res, next) {
      try {
        const { valid } = await authService.verifyResetToken(req.params.token);
        res.json({ success: true, data: { valid } });
      } catch (err) {
        next(err);
      }
    },

    async resetPassword(req, res, next) {
      try {
        await authService.resetPassword(req.params.token, req.body.password);
        res.json({ success: true, message: 'Password has been reset. Please sign in.' });
      } catch (err) {
        next(err);
      }
    },

    async changePassword(req, res, next) {
      try {
        await authService.changePassword(req.user._id, req.body);
        res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
        res.json({ success: true, message: 'Password changed. Please sign in again.' });
      } catch (err) {
        next(err);
      }
    },

    async me(req, res) {
      res.json({ success: true, data: { user: req.user.toSafeJSON() } });
    },

    async updateMe(req, res, next) {
      try {
        const user = await authService.updateProfile(req.user._id, req.body);
        res.json({ success: true, data: { user: user.toSafeJSON() } });
      } catch (err) {
        next(err);
      }
    },

    async deleteMe(req, res, next) {
      try {
        await authService.softDeleteUser(req.user._id);
        res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
        res.json({ success: true, message: 'Account deleted' });
      } catch (err) {
        next(err);
      }
    },
  };
}
