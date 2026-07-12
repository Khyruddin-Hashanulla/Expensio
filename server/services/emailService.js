import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

function logFallback(subject, to, text) {
  logger.info(`[EMAIL] To: ${to} | Subject: ${subject} | Body: ${text}`);
}

function buildBrevoPayload(to, subject, textContent) {
  return {
    sender: { name: env.brevoSenderName, email: env.brevoSenderEmail },
    to: [{ email: to }],
    subject,
    textContent,
  };
}

async function sendViaBrevo(payload, logLabel) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': env.brevoApiKey,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    logger.error(`Failed to send ${logLabel} email via Brevo`, { error: err });
    return false;
  }
  logger.info(`${logLabel} email sent via Brevo`, { to: payload.to[0].email });
  return true;
}

export async function sendOtpEmail(email, otp) {
  const subject = 'Your Expensio verification code';
  const text = `Your Expensio verification code is: ${otp}\n\nThis code expires in 10 minutes.`;

  if (env.brevoApiKey) {
    return sendViaBrevo(buildBrevoPayload(email, subject, text), 'OTP');
  }

  logFallback(subject, email, text);
  return false;
}

export async function sendResetEmail(email, resetUrl) {
  const subject = 'Reset your Expensio password';
  const text = `Reset your password here: ${resetUrl}\n\nThis link expires in ${env.resetTokenTtlMinutes} minutes.`;

  if (env.brevoApiKey) {
    return sendViaBrevo(buildBrevoPayload(email, subject, text), 'password reset');
  }

  logFallback(subject, email, text);
  return false;
}
