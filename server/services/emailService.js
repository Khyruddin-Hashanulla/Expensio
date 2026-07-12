import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

function logFallback(subject, to, text) {
  logger.info(`[EMAIL] To: ${to} | Subject: ${subject} | Body: ${text}`);
}

export async function sendOtpEmail(email, otp) {
  const subject = 'Your Expensio verification code';
  const text = `Your Expensio verification code is: ${otp}\n\nThis code expires in 10 minutes.`;

  if (env.resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.resendApiKey}`,
        },
        body: JSON.stringify({
          from: env.emailFrom || 'Expensio <noreply@expensio.app>',
          to: email,
          subject,
          text,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        logger.error('Failed to send OTP email via Resend', { error: err });
        return false;
      }
      logger.info('OTP email sent via Resend', { to: email });
      return true;
    } catch (err) {
      logger.error('Resend API error', { error: err.message });
      return false;
    }
  }

  logFallback(subject, email, text);
  return false;
}

export async function sendResetEmail(email, resetUrl) {
  const subject = 'Reset your Expensio password';
  const text = `Reset your password here: ${resetUrl}\n\nThis link expires in ${env.resetTokenTtlMinutes} minutes.`;

  if (env.resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.resendApiKey}`,
        },
        body: JSON.stringify({
          from: env.emailFrom || 'Expensio <noreply@expensio.app>',
          to: email,
          subject,
          text,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        logger.error('Failed to send reset email via Resend', { error: err });
        return false;
      }
      logger.info('Reset email sent via Resend', { to: email });
      return true;
    } catch (err) {
      logger.error('Resend API error', { error: err.message });
      return false;
    }
  }

  logFallback(subject, email, text);
  return false;
}
