import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, requireAdmin, AuthRequest } from '../auth.ts';

const router = Router();

// Apply auth + admin guard to all admin routes
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/overview - Real database metrics
router.get('/overview', (req: AuthRequest, res: Response): void => {
  try {
    const stats = db.getAdminStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users - User management
router.get('/users', (req: AuthRequest, res: Response): void => {
  try {
    const { search } = req.query;
    const users = db.getAdminUsers(search as string);
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/users/:id/status - Suspend, Ban, or Reinstate
router.post('/users/:id/status', (req: AuthRequest, res: Response): void => {
  try {
    const targetUserId = req.params.id;
    const adminId = req.userId!;
    const { status, reason } = req.body;

    if (!['active', 'suspended', 'banned'].includes(status)) {
      res.status(400).json({ error: 'Invalid user status.' });
      return;
    }

    db.updateAccountStatus(targetUserId, status, reason || 'Administrative decision', adminId);
    res.json({ message: `User account updated to ${status}.` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/admin/payments/all - List all payment submissions
router.get('/payments/all', (req: AuthRequest, res: Response): void => {
  try {
    const payments = db.getAllPayments();
    res.json({ payments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/payments/:id/review - Approve or Reject payment proof
router.post('/payments/:id/review', (req: AuthRequest, res: Response): void => {
  try {
    const paymentId = req.params.id;
    const adminId = req.userId!;
    const { decision, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      res.status(400).json({ error: 'Decision must be approved or rejected.' });
      return;
    }

    const reviewed = db.reviewPayment(paymentId, adminId, decision, rejectionReason);
    res.json({
      message: `Payment has been ${decision}.`,
      payment: reviewed
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/admin/reports - Moderation reports
router.get('/reports', (req: AuthRequest, res: Response): void => {
  try {
    const reports = db.getReports();
    res.json({ reports });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/reports/:id/action - Act on reported content
router.post('/reports/:id/action', (req: AuthRequest, res: Response): void => {
  try {
    const reportId = req.params.id;
    const adminId = req.userId!;
    const { status, adminNotes } = req.body;

    if (!['reviewed', 'action_taken', 'dismissed'].includes(status)) {
      res.status(400).json({ error: 'Invalid report resolution status.' });
      return;
    }

    db.updateReportStatus(reportId, status, adminNotes || 'Resolution recorded', adminId);
    res.json({ message: 'Report status updated successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/admin/audit-logs - Audit trail
router.get('/audit-logs', (req: AuthRequest, res: Response): void => {
  try {
    const logs = db.getAuditLogs();
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
