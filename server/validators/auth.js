import { z } from 'zod';

const currencyEnum = z.enum(['INR', 'USD']);

export const sendOtpSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  otp: z.string().length(6, 'Enter the 6-digit verification code'),
  defaultCurrency: currencyEnum.optional(),
  timezone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  defaultCurrency: currencyEnum.optional(),
  timezone: z.string().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const deleteAccountSchema = z.object({
  password: z.string().max(128).optional(),
});
