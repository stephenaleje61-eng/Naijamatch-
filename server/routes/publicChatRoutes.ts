import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db.ts';
import { verifyToken, AuthRequest, createRateLimiter } from '../auth.ts';
import { realtimeHub } from '../websocket.ts';

const router = Router();

// Rate limiter for public chat messages (prevent spam)
const chatMessageLimiter = createRateLimiter(60 * 1000, 45, 'Too many chat messages sent in a short time.');

// GET /api/public-chat/messages - Fetch chronological public chat messages
router.get('/messages', (req, res): void => {
  try {
    const limit = parseInt((req.query.limit as string) || '100', 10);
    const messages = db.getPublicChatMessages(limit);
    res.json({
      messages,
      onlineCount: realtimeHub.getOnlineCount()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch public chat messages' });
  }
});

// GET /api/public-chat/active-users - Fetch active room participants
router.get('/active-users', (req, res): void => {
  try {
    const activeUsers = db.getPublicChatActiveUsers();
    res.json({
      activeUsers,
      onlineCount: realtimeHub.getOnlineCount()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public-chat/messages - Send message to public room (Registered or Guest)
router.post('/messages', chatMessageLimiter, (req: Request, res: Response): void => {
  try {
    const { content, replyToMessageId, guestName, guestState, guestPhoto, guestId } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    if (content.length > 1000) {
      res.status(400).json({ error: 'Message is too long (maximum 1,000 characters).' });
      return;
    }

    // Determine sender identity: JWT token or Guest profile
    let senderId: string;
    let guestProfile: { name: string; state?: any; photo?: string } | undefined = undefined;

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (req.cookies?.token as string | undefined);

    const decoded = token ? verifyToken(token) : null;

    if (decoded) {
      senderId = decoded.id;
    } else if (guestName && guestName.trim()) {
      senderId = guestId || ('guest_' + crypto.randomUUID().slice(0, 8));
      guestProfile = {
        name: guestName.trim().slice(0, 30),
        state: guestState || 'Lagos',
        photo: guestPhoto
      };
    } else {
      res.status(401).json({ error: 'Please choose a chat name or sign in to send messages.' });
      return;
    }

    const message = db.sendPublicChatMessage(senderId, content, replyToMessageId, guestProfile);

    // Broadcast instantly to all connected WebSocket users!
    realtimeHub.broadcastPublicChatMessage(message);

    res.status(201).json({ message, senderId });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to send message.' });
  }
});

// POST /api/public-chat/messages/:id/react - Toggle emoji reaction
router.post('/messages/:id/react', (req: Request, res: Response): void => {
  try {
    const messageId = req.params.id;
    const { emoji, actorId } = req.body;

    if (!emoji) {
      res.status(400).json({ error: 'Emoji is required' });
      return;
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (req.cookies?.token as string | undefined);

    const decoded = token ? verifyToken(token) : null;
    const effectiveActorId = decoded?.id || actorId || 'anonymous_user';

    const updatedMsg = db.reactToPublicChatMessage(messageId, effectiveActorId, emoji);
    if (!updatedMsg) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    // Broadcast reaction update live to all users!
    realtimeHub.broadcastPublicChatReaction(messageId, updatedMsg.reactions);

    res.json({ success: true, reactions: updatedMsg.reactions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/public-chat/messages/:id - Delete message (author or admin)
router.delete('/messages/:id', (req: Request, res: Response): void => {
  try {
    const messageId = req.params.id;
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (req.cookies?.token as string | undefined);

    const decoded = token ? verifyToken(token) : null;
    const actorUserId = decoded?.id || (req.body.actorId as string);

    if (!actorUserId) {
      res.status(401).json({ error: 'Authentication required to delete message.' });
      return;
    }

    const success = db.deletePublicChatMessage(messageId, actorUserId);
    if (!success) {
      res.status(403).json({ error: 'Unauthorized to delete this message or message not found.' });
      return;
    }

    // Broadcast removal in real-time
    realtimeHub.broadcastPublicChatDelete(messageId);

    res.json({ success: true, messageId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public-chat/messages/:id/report - Report abusive public message
router.post('/messages/:id/report', (req: Request, res: Response): void => {
  try {
    const messageId = req.params.id;
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (req.cookies?.token as string | undefined);

    const decoded = token ? verifyToken(token) : null;
    const reporterUserId = decoded?.id || (req.body.reporterId as string) || 'guest_reporter';
    const { reason } = req.body;

    const report = db.reportContent(
      reporterUserId,
      'message',
      messageId,
      reason || 'Inappropriate public chatroom message'
    );

    res.status(201).json({
      message: 'Report submitted. Our moderation team has been notified.',
      report
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
