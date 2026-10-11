import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.ts';
import { generateToken, authenticate, AuthRequest, createRateLimiter } from '../auth.ts';
import { sendEmailOTP } from '../otp.ts';

const router = Router();

// Rate limiters for security
const registerLimiter = createRateLimiter(60 * 1000, 5, 'Too many registration attempts.');
const loginLimiter = createRateLimiter(60 * 1000, 5, 'Too many login attempts.');
const otpLimiter = createRateLimiter(60 * 1000, 3, 'Too many OTP requests.');

// Helper: Calculate age from DOB (YYYY-MM-DD)
function calculateAge(dobStr: string): number {
  const birth = new Date(dobStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// POST /api/auth/register
router.post('/register', registerLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      gender,
      dateOfBirth,
      country,
      photoUrl,
      is18OrOlder,
      acceptTerms
    } = req.body;

    if (!email || !password || !dateOfBirth) {
      res.status(400).json({ error: 'Email, password, and date of birth are required.' });
      return;
    }

    if (!fullName || fullName.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your full name (minimum 2 characters).' });
      return;
    }

    if (!gender || !['Man', 'Woman', 'Non-binary'].includes(gender)) {
      res.status(400).json({ error: 'Please select your gender.' });
      return;
    }

    if (acceptTerms === false) {
      res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy to register.' });
      return;
    }

    if (is18OrOlder === false) {
      res.status(400).json({ error: 'NaijaMatch is strictly an adult platform (18+).' });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    // Password strength
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    // Age validation
    const age = calculateAge(dateOfBirth);
    if (isNaN(age) || age < 18) {
      res.status(400).json({ error: 'You must be at least 18 years old to join NaijaMatch.' });
      return;
    }

    // Check duplicate email
    const existing = db.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = db.createUser(email, passwordHash);

    // Initial profile with full name, gender, age, and photo
    db.upsertProfile(user.id, {
      displayName: fullName.trim(),
      gender: gender as any,
      datingPreference: gender === 'Man' ? 'Women' : 'Men',
      dateOfBirth,
      age,
      state: 'Lagos',
      city: 'Lagos',
      photos: photoUrl
        ? [{ id: 'photo_' + Date.now(), url: photoUrl, isPrimary: true, order: 0 }]
        : []
    });

    // Send email OTP
    const otpRes = await sendEmailOTP(email);

    res.status(201).json({
      message: 'Account registered successfully. Please verify your email with the OTP sent to your inbox.',
      email: user.email,
      requiresOtp: true,
      devOtp: otpRes.devCode // Available for quick development / test demo
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'An error occurred during registration.' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', otpLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ error: 'Email and verification code are required.' });
      return;
    }

    const verification = db.verifyOTP(email, code);
    if (!verification.valid) {
      res.status(400).json({ error: verification.reason || 'Invalid verification code.' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Mark email as verified
    db.updateUser(user.id, { isEmailVerified: true });
    user.isEmailVerified = true;

    const safeUser = db.sanitizeUser(user);
    const token = generateToken(safeUser);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const profile = db.getProfileByUserId(user.id);
    const subscription = db.getActiveSubscription(user.id);

    res.json({
      message: 'Email verified successfully!',
      token,
      user: safeUser,
      profile,
      subscription
    });
  } catch (err: any) {
    console.error('OTP verification error:', err);
    res.status(500).json({ error: err.message || 'Verification failed.' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', otpLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      // Generic response to prevent enumeration
      res.json({ message: 'If this email is registered, a new verification code has been dispatched.' });
      return;
    }

    const otpRes = await sendEmailOTP(email);
    res.json({
      message: 'Verification code resent successfully.',
      devOtp: otpRes.devCode
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email address or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email address or password.' });
      return;
    }

    if (user.status === 'banned') {
      res.status(403).json({ error: `Your account has been banned: ${user.suspensionReason || 'Terms violation'}` });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: `Your account is temporarily suspended: ${user.suspensionReason || 'Under review'}` });
      return;
    }

    const safeUser = db.sanitizeUser(user);
    const token = generateToken(safeUser);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const profile = db.getProfileByUserId(user.id);
    const subscription = db.getActiveSubscription(user.id);

    res.json({
      message: 'Logged in successfully.',
      token,
      user: safeUser,
      profile,
      subscription
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  const profile = req.userId ? db.getProfileByUserId(req.userId) : null;
  const subscription = req.userId ? db.getActiveSubscription(req.userId) : null;

  res.json({
    user: req.user,
    profile,
    subscription
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', otpLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email address is required.' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (user) {
      const otpRes = await sendEmailOTP(email);
      res.json({
        message: 'Password reset code dispatched.',
        devOtp: otpRes.devCode
      });
      return;
    }

    res.json({ message: 'If this email is registered, a password reset code has been sent.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, code, and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    const verification = db.verifyOTP(email, code);
    if (!verification.valid) {
      res.status(400).json({ error: verification.reason });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordHash = passwordHash;
    db.saveSync();

    res.json({ message: 'Password has been reset successfully. You may now log in.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/admin-bootstrap - Secure setup for first administrator
router.post('/admin-bootstrap', authenticate, (req: AuthRequest, res: Response): void => {
  const { adminSetupKey } = req.body;
  const configuredKey = process.env.ADMIN_SETUP_KEY || 'naijamatch-admin-super-key-2026';

  if (!adminSetupKey || adminSetupKey !== configuredKey) {
    res.status(403).json({ error: 'Invalid administrative bootstrap key.' });
    return;
  }

  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  db.updateUser(req.userId, { role: 'admin' });
  res.json({ message: 'User upgraded to Administrator successfully.' });
});

export default router;
