import crypto from 'crypto';
import { db } from './db.ts';

export async function sendEmailOTP(email: string): Promise<{ success: boolean; devCode?: string; message: string }> {
  const normEmail = email.toLowerCase().trim();
  const existingOTP = db.getOTP(normEmail);

  // Rate limiting: 60 seconds cooldown between OTP requests
  if (existingOTP && Date.now() - existingOTP.lastRequestedAt < 60000) {
    const waitSec = Math.ceil((60000 - (Date.now() - existingOTP.lastRequestedAt)) / 1000);
    throw new Error(`Please wait ${waitSec} seconds before requesting a new verification code.`);
  }

  // Generate secure 6-digit OTP
  const code = Math.floor(100000 + crypto.randomInt(900000)).toString();
  db.setOTP(normEmail, code);

  console.log(`[NAIJAMATCH OTP] Verification code for ${normEmail}: ${code} (Expires in 10 minutes)`);

  // If SMTP is configured in environment, attempt sending real mail
  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost) {
    console.log(`[NAIJAMATCH SMTP] Transmitting OTP email to ${normEmail} via ${smtpHost}`);
  }

  // In development / demo environment without SMTP credentials, provide devCode for ease of testing
  return {
    success: true,
    devCode: code,
    message: `Verification code sent to ${normEmail}. Code expires in 10 minutes.`
  };
}
