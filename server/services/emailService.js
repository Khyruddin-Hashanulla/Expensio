import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const BRAND_COLOR = '#2dd4bf';
const BRAND_COLOR_DARK = '#14b8a6';
const BG = '#f4f6f8';
const CARD_BG = '#ffffff';
const TEXT_PRIMARY = '#1a1a2e';
const TEXT_SECONDARY = '#64748b';

function logFallback(subject, to, text) {
  logger.info(`[EMAIL] To: ${to} | Subject: ${subject} | Body: ${text}`);
}

function shell(htmlBody) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @media only screen and (max-width: 600px) {
      .container { padding: 24px 16px !important; }
      .card { padding: 24px 20px !important; }
      .otp-code { font-size: 32px !important; letter-spacing: 8px !important; }
      .logo-wrap { width: 48px !important; height: 48px !important; }
      .footer { font-size: 11px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table class="container" width="100%" style="max-width:480px;margin:0 auto;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="vertical-align:middle;">
                    <span style="display:inline-block;width:44px;height:44px;line-height:44px;text-align:center;background:${BRAND_COLOR};color:${BRAND_COLOR_DARK};font-size:20px;font-weight:700;border-radius:12px;">E</span>
                    <span style="display:inline-block;margin-left:10px;font-size:20px;font-weight:700;color:${TEXT_PRIMARY};vertical-align:middle;">Expensio</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table class="card" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD_BG};border-radius:16px;padding:32px 28px;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);">
                ${htmlBody}
              </table>
            </td>
          </tr>
          <tr>
            <td class="footer" align="center" style="padding-top:24px;font-size:12px;color:${TEXT_SECONDARY};line-height:1.6;">
              Expensio &mdash; Personal Finance &amp; Bill Splitting<br/>
              If you didn&rsquo;t request this, you can safely ignore this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function templateOtp(otp) {
  const body = `
    <tr><td style="padding-bottom:8px;">
      <h1 style="margin:0;font-size:20px;font-weight:700;color:${TEXT_PRIMARY};">Verify your email</h1>
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      <p style="margin:0;font-size:14px;color:${TEXT_SECONDARY};line-height:1.6;">
        Enter this code to finish creating your Expensio account. It expires in 10 minutes.
      </p>
    </td></tr>
    <tr><td align="center" style="padding-bottom:28px;">
      <table cellpadding="0" cellspacing="0" style="background:${BG};border-radius:12px;padding:20px 28px;border:1px solid #e2e8f0;">
        <tr>
          <td style="font-size:36px;font-weight:800;letter-spacing:10px;color:${TEXT_PRIMARY};font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">
            ${otp}
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td>
      <p style="margin:0;font-size:13px;color:${TEXT_SECONDARY};line-height:1.5;">
        If you didn&rsquo;t request this code, someone else may be trying to access your email. Please ignore this message.
      </p>
    </td></tr>`;
  return shell(body);
}

function templateReset(resetUrl, ttlMinutes) {
  const body = `
    <tr><td style="padding-bottom:8px;">
      <h1 style="margin:0;font-size:20px;font-weight:700;color:${TEXT_PRIMARY};">Reset your password</h1>
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      <p style="margin:0;font-size:14px;color:${TEXT_SECONDARY};line-height:1.6;">
        Click the button below to reset your Expensio password. This link expires in ${ttlMinutes} minutes.
      </p>
    </td></tr>
    <tr><td align="center" style="padding-bottom:28px;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="background:${BRAND_COLOR};border-radius:12px;padding:14px 32px;">
            <a href="${resetUrl}" style="color:#042f2e;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">
              Reset Password
            </a>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td>
      <p style="margin:0;font-size:13px;color:${TEXT_SECONDARY};line-height:1.5;">
        If the button doesn&rsquo;t work, copy and paste this URL into your browser:<br/>
        <span style="font-size:12px;word-break:break-all;color:${BRAND_COLOR_DARK};">${resetUrl}</span>
      </p>
    </td></tr>`;
  return shell(body);
}

function buildBrevoPayload(to, subject, htmlContent, textContent) {
  return {
    sender: { name: env.brevoSenderName, email: env.brevoSenderEmail },
    to: [{ email: to }],
    subject,
    htmlContent,
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
  const subject = 'Verify your Expensio account';
  const text = `Your Expensio verification code is: ${otp}\n\nThis code expires in 10 minutes.`;

  if (env.brevoApiKey) {
    return sendViaBrevo(buildBrevoPayload(email, subject, templateOtp(otp), text), 'OTP');
  }

  logFallback(subject, email, text);
  return false;
}

export async function sendResetEmail(email, resetUrl) {
  const subject = 'Reset your Expensio password';
  const text = `Reset your password here: ${resetUrl}\n\nThis link expires in ${env.resetTokenTtlMinutes} minutes.`;

  if (env.brevoApiKey) {
    return sendViaBrevo(buildBrevoPayload(email, subject, templateReset(resetUrl, env.resetTokenTtlMinutes), text), 'password reset');
  }

  logFallback(subject, email, text);
  return false;
}
