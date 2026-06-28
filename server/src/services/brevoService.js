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

module.exports = { sendEmail, sendOtpEmail };
