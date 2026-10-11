import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, AuthRequest, requireVerifiedEmail, requireSubscription } from '../auth.ts';
import { realtimeHub } from '../websocket.ts';

const router = Router();

// GET /api/messages/conversations - List conversations
router.get('/conversations', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const conversations = db.getUserConversations(userId);
    res.json({ conversations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/conversations/:id - Get conversation messages
router.get('/conversations/:id', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const conversationId = req.params.id;
    const messages = db.getMessages(conversationId, userId);
    res.json({ messages });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// POST /api/messages/start - Get or create conversation with a user
router.post('/start', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      res.status(400).json({ error: 'Target user ID is required.' });
      return;
    }

    if (userId === targetUserId) {
      res.status(400).json({ error: 'Cannot start conversation with yourself.' });
      return;
    }

    if (db.isBlocked(userId, targetUserId) || db.isBlocked(targetUserId, userId)) {
      res.status(403).json({ error: 'Messaging is unavailable with this account.' });
      return;
    }

    const conversation = db.getOrCreateConversation(userId, targetUserId);
    res.json({ conversation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/conversations/:id/send - Send a message (Requires subscription)
router.post('/conversations/:id/send', authenticate, requireVerifiedEmail, requireSubscription, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const conversationId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message content cannot be empty.' });
      return;
    }

    if (content.length > 2000) {
      res.status(400).json({ error: 'Message is too long (maximum 2,000 characters).' });
      return;
    }

    const message = db.saveMessage(conversationId, userId, content);

    // Broadcast in real-time to participants via WebSocket
    const convo = db.getUserConversations(userId).find(c => c.id === conversationId);
    if (convo && convo.otherParticipant) {
      realtimeHub.broadcastMessage(convo.otherParticipant.userId, message);
    }

    res.status(201).json({ message });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Friend / Connection Requests ---
// POST /api/messages/friends/request
router.post('/friends/request', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const senderId = req.userId!;
    const { receiverId } = req.body;

    if (!receiverId) {
      res.status(400).json({ error: 'Receiver user ID required.' });
      return;
    }

    const request = db.sendFriendRequest(senderId, receiverId);
    realtimeHub.broadcastNotification(receiverId, {
      title: 'New Connection Request',
      message: 'Someone sent you a connection request.'
    });

    res.status(201).json({ request });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/messages/friends/respond
router.post('/friends/respond', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const { requestId, action } = req.body;

    if (!requestId || !action || !['accept', 'decline', 'cancel'].includes(action)) {
      res.status(400).json({ error: 'Valid requestId and action (accept, decline, cancel) are required.' });
      return;
    }

    const request = db.respondFriendRequest(requestId, userId, action);
    res.json({ request });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/messages/friends/list
router.get('/friends/list', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const requests = db.getFriendRequests(userId);
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Blocks & Reports ---
// POST /api/messages/block
router.post('/block', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const blockerId = req.userId!;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      res.status(400).json({ error: 'Target user ID is required.' });
      return;
    }

    db.blockUser(blockerId, targetUserId);
    res.json({ message: 'User blocked successfully. They can no longer contact or view your profile.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/messages/report
router.post('/report', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const reporterUserId = req.userId!;
    const { targetType, targetId, reason, details } = req.body;

    if (!targetType || !targetId || !reason) {
      res.status(400).json({ error: 'Target type, target ID, and reason are required.' });
      return;
    }

    const report = db.reportContent(reporterUserId, targetType, targetId, reason, details);
    res.status(201).json({
      message: 'Report submitted. Our moderation safety team will review it promptly.',
      report
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/messages/notifications
router.get('/notifications', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const notifications = db.getUserNotifications(userId);
    res.json({ notifications });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/notifications/mark-read
router.post('/notifications/mark-read', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const { notificationId } = req.body;

    if (notificationId) {
      db.markNotificationRead(notificationId, userId);
    } else {
      db.markAllNotificationsRead(userId);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
