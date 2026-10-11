import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import { User } from '../src/types/index.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'naijamatch-secure-secret-key-prod-2026';
const TOKEN_EXPIRY = '7d';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): { id: string; email: string; role: string; isEmailVerified: boolean } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; isEmailVerified: boolean };
  } catch (err) {
    return null;
  }
}

// Authentication Middleware
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  let token: string | undefined;

  // Check Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
    return;
  }

  const user = db.getUserById(payload.id);
  if (!user) {
    res.status(401).json({ error: 'User account not found.' });
    return;
  }

  if (user.status === 'banned') {
    res.status(403).json({ error: `Account has been banned: ${user.suspensionReason || 'Terms violation'}` });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ error: `Account is suspended: ${user.suspensionReason || 'Under review'}` });
    return;
  }

  req.user = db.sanitizeUser(user);
  req.userId = user.id;
  next();
}

// Require Verified Email Middleware
export function requireVerifiedEmail(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.isEmailVerified) {
    res.status(403).json({
      error: 'Email verification required. Please verify your email with the OTP sent to your inbox to continue.',
      requiresEmailVerification: true
    });
    return;
  }
  next();
}

// Require Active Subscription Middleware
export function requireSubscription(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  // Admins always have access
  if (req.user.role === 'admin') {
    next();
    return;
  }

  const activeSub = db.getActiveSubscription(req.user.id);
  if (!activeSub) {
    res.status(403).json({
      error: 'An active, approved subscription is required to send and receive messages.',
      requiresSubscription: true
    });
    return;
  }

  next();
}

// Require Admin Role Middleware
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
    return;
  }
  next();
}

// Simple in-memory rate limiter per IP/Key
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function createRateLimiter(windowMs: number, maxRequests: number, message: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.baseUrl}${req.path}_${ip}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);
    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.status(429).json({ error: `${message} Please try again in ${waitSeconds}s.` });
      return;
    }

    record.count += 1;
    next();
  };
}
