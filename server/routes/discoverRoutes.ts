import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, AuthRequest, requireVerifiedEmail } from '../auth.ts';

const router = Router();

// GET /api/discover - Browse profiles
router.get('/', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const {
      state,
      city,
      gender,
      minAge,
      maxAge,
      intention,
      search,
      page,
      limit
    } = req.query;

    const result = db.getDiscoverProfiles(userId, {
      state: state as string,
      city: city as string,
      gender: gender as string,
      minAge: minAge ? parseInt(minAge as string, 10) : undefined,
      maxAge: maxAge ? parseInt(maxAge as string, 10) : undefined,
      intention: intention as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 12
    });

    res.json(result);
  } catch (err: any) {
    console.error('Discover error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch profiles.' });
  }
});

// POST /api/discover/like
router.post('/like', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const fromUserId = req.userId!;
    const { toUserId } = req.body;

    if (!toUserId) {
      res.status(400).json({ error: 'Target user ID is required.' });
      return;
    }

    const result = db.likeProfile(fromUserId, toUserId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/discover/unlike
router.post('/unlike', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const fromUserId = req.userId!;
    const { toUserId } = req.body;

    if (!toUserId) {
      res.status(400).json({ error: 'Target user ID is required.' });
      return;
    }

    db.unlikeProfile(fromUserId, toUserId);
    res.json({ message: 'Unliked successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/discover/likes-received
router.get('/likes-received', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const activeSub = db.getActiveSubscription(userId);
    const likesData = db.getLikesReceived(userId);

    if (activeSub || req.user?.role === 'admin') {
      // Paid user sees full profiles of who liked them
      res.json({
        hasAccess: true,
        count: likesData.count,
        profiles: likesData.profiles
      });
    } else {
      // Free user sees count and blurred previews
      res.json({
        hasAccess: false,
        count: likesData.count,
        profiles: likesData.profiles.map(p => ({
          userId: p.userId,
          displayName: p.displayName.charAt(0) + '***',
          age: p.age,
          state: p.state,
          photos: p.photos.length > 0 ? [{ id: p.photos[0].id, url: p.photos[0].url, isPrimary: true, order: 0 }] : []
        })),
        message: 'Upgrade to a NaijaMatch subscription to reveal who liked your profile and chat instantly.'
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/discover/matches
router.get('/matches', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const matches = db.getMatches(userId);
    res.json({ matches });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
