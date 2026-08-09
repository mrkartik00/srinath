const config = require('../config/env');
const logger = require('../config/logger');

const sendEmail = async ({ to, subject, htmlContent }) => {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': config.BREVO.apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: config.BREVO.senderName, email: config.BREVO.senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error('Brevo send failed', { status: res.status, err });
    throw new Error(`Brevo email failed: ${res.status}`);
  }
  return res.json();
};

const sendOtpEmail = async (email, otp) => {
  return sendEmail({
    to: email,
    subject: `${otp} is your Janki Care verification code`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#2563eb;">Janki Care</h2>
        <p>Your verification code is:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:6px;padding:16px;background:#f1f5f9;text-align:center;border-radius:8px;">${otp}</div>
        <p style="color:#64748b;margin-top:16px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
};

const sendPasswordChangedEmail = async (email, { changedByAdmin = false } = {}) => {
  const subject = changedByAdmin
    ? 'Your Janki Care password was reset by an administrator'
    : 'Your Janki Care password was changed';
  const message = changedByAdmin
    ? 'Your password has been reset by an administrator. If you did not expect this, please contact support immediately.'
    : 'Your password was successfully changed. If you did not make this change, please contact support immediately.';

  return sendEmail({
    to: email,
    subject,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#2563eb;">Janki Care</h2>
        <p>${message}</p>
        <p style="color:#64748b;margin-top:16px;">If you did not perform this action, please secure your account immediately.</p>
      </div>
    `,
  });
};

const sendAccountCreatedEmail = async (email, { name, loginUrl }) => {
  return sendEmail({
    to: email,
    subject: 'Your Janki Care account is ready',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#2563eb;">Janki Care</h2>
        <p>Hi ${name},</p>
        <p>Your doctor account has been created by an administrator. You can now sign in to the Janki Care Doctor Portal using your registered email and the password provided by your admin.</p>
        <div style="margin:24px 0;">
          <a href="${loginUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">Sign In to Your Account</a>
        </div>
        <p style="color:#64748b;font-size:13px;">If you did not expect this email, please ignore it or contact support.</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendOtpEmail, sendPasswordChangedEmail, sendAccountCreatedEmail };
