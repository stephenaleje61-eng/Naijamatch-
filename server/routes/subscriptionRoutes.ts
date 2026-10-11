import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, AuthRequest, requireVerifiedEmail } from '../auth.ts';
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from '../../src/types/index.ts';

const router = Router();

const BANK_DETAILS = {
  accountName: process.env.BANK_ACCOUNT_NAME || 'Stephen',
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || '8167258121',
  bank: process.env.BANK_NAME || 'Opay'
};

// GET /api/subscriptions/plans
router.get('/plans', (req, res): void => {
  res.json({
    plans: SUBSCRIPTION_PLANS,
    bankDetails: BANK_DETAILS,
    paystackConfigured: !!(process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_PUBLIC_KEY)
  });
});

// GET /api/subscriptions/my-status
router.get('/my-status', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const activeSub = db.getActiveSubscription(userId);
    const history = db.getUserSubscriptionHistory(userId);
    const pendingPayments = db.getUserPayments(userId).filter(p => p.status === 'pending');

    res.json({
      hasActiveSubscription: !!activeSub,
      activeSubscription: activeSub,
      pendingPaymentCount: pendingPayments.length,
      pendingPayments,
      history
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions/submit-proof - Upload manual bank transfer proof
router.post('/submit-proof', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const user = req.user!;
    const profile = db.getProfileByUserId(userId);
    const {
      planId,
      amountNGN,
      paymentDate,
      transactionReference,
      proofScreenshotUrl
    } = req.body;

    if (!planId || !amountNGN || !paymentDate || !transactionReference || !proofScreenshotUrl) {
      res.status(400).json({
        error: 'All fields are required: Plan, Amount, Payment Date, Transaction Reference, and Proof Screenshot.'
      });
      return;
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      res.status(400).json({ error: 'Invalid subscription plan selected.' });
      return;
    }

    if (Number(amountNGN) !== plan.priceNGN) {
      res.status(400).json({
        error: `Amount must match plan price of ₦${plan.priceNGN.toLocaleString()}. Submitted: ₦${Number(amountNGN).toLocaleString()}`
      });
      return;
    }

    const submission = db.submitPaymentProof({
      userId,
      userEmail: user.email,
      userName: profile?.displayName || user.email,
      planId: planId as SubscriptionPlanId,
      amountNGN: Number(amountNGN),
      paymentDate,
      transactionReference: transactionReference.trim(),
      proofScreenshotUrl
    });

    res.status(201).json({
      message: 'Payment proof submitted successfully! An administrator will review your transfer against bank records shortly.',
      submission
    });
  } catch (err: any) {
    console.error('Payment proof error:', err);
    res.status(400).json({ error: err.message || 'Failed to submit payment proof.' });
  }
});

// GET /api/subscriptions/my-payments
router.get('/my-payments', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const payments = db.getUserPayments(userId);
    res.json({ payments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions/paystack/initialize - Paystack integration ready abstraction
router.post('/paystack/initialize', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    res.status(503).json({
      configured: false,
      message: 'Paystack automated card gateway is currently awaiting API key configuration by the platform administrator. Please proceed using the verified Opay manual bank transfer option.'
    });
    return;
  }

  // Ready for production Paystack initialization
  res.status(501).json({
    message: 'Paystack transaction initialization endpoint configured and ready for live keys.'
  });
});

export default router;
