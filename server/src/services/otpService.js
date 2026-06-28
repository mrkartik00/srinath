const crypto = require('crypto');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('./brevoService');
const { BadRequestError, TooManyRequestsError } = require('../utils/apiError');

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const sendOtp = async (email, purpose = 'registration') => {
  // Rate limit: check if OTP was sent recently
  const recent = await Otp.findOne({ email, purpose, verifiedAt: null })
    .sort({ createdAt: -1 });
  if (recent) {
    const elapsed = (Date.now() - recent.createdAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      throw new TooManyRequestsError(`Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed)}s before requesting a new code`);
    }
  }

  // Invalidate old OTPs
  await Otp.deleteMany({ email, purpose, verifiedAt: null });

  const otp = generateOtp();
  await Otp.create({
    email,
    otp,
    purpose,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
  });

  // Send via Brevo; log to console in dev as fallback
  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    console.log(`\n📧 OTP for ${email}: ${otp} (email delivery failed: ${err.message})\n`);
  }

  return { message: 'OTP sent successfully' };
};

const verifyOtp = async (email, code, purpose = 'registration') => {
  const otpDoc = await Otp.findOne({ email, purpose, verifiedAt: null }).sort({ createdAt: -1 });

  if (!otpDoc) throw new BadRequestError('No OTP found. Please request a new code.');
  if (otpDoc.expiresAt < new Date()) throw new BadRequestError('OTP has expired. Please request a new code.');
  if (otpDoc.attempts >= MAX_ATTEMPTS) throw new BadRequestError('Too many failed attempts. Please request a new code.');

  if (otpDoc.otp !== code) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    throw new BadRequestError(`Invalid OTP. ${MAX_ATTEMPTS - otpDoc.attempts} attempts remaining.`);
  }

  otpDoc.verifiedAt = new Date();
  await otpDoc.save();
  return { verified: true };
};

module.exports = { sendOtp, verifyOtp };
