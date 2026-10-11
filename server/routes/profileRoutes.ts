import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, AuthRequest, requireVerifiedEmail } from '../auth.ts';
import { Profile, ProfilePhoto, NIGERIAN_STATES } from '../../src/types/index.ts';

const router = Router();

// Helper: Calculate age from DOB
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

// GET /api/profiles/me
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const profile = db.getProfileByUserId(req.userId);
  res.json({ profile });
});

// POST /api/profiles/update - Mandatory Onboarding & Profile Editing
router.post('/update', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const {
      displayName,
      dateOfBirth,
      gender,
      datingPreference,
      relationshipIntention,
      state,
      city,
      bio,
      photos,
      interests,
      preferredAgeMin,
      preferredAgeMax,
      preferredState,
      showOnlineStatus,
      showLocation
    } = req.body;

    // Field validations
    if (!displayName || displayName.trim().length < 2) {
      res.status(400).json({ error: 'Display name must be at least 2 characters.' });
      return;
    }

    if (!dateOfBirth) {
      res.status(400).json({ error: 'Date of birth is required.' });
      return;
    }

    const age = calculateAge(dateOfBirth);
    if (isNaN(age) || age < 18) {
      res.status(400).json({ error: 'You must be at least 18 years old.' });
      return;
    }

    if (!gender || !['Man', 'Woman', 'Non-binary'].includes(gender)) {
      res.status(400).json({ error: 'Please select a valid gender.' });
      return;
    }

    if (!datingPreference || !['Women', 'Men', 'Everyone'].includes(datingPreference)) {
      res.status(400).json({ error: 'Please select a dating preference.' });
      return;
    }

    if (
      !relationshipIntention ||
      !['Serious Relationship', 'Casual Dating', 'Friendship'].includes(relationshipIntention)
    ) {
      res.status(400).json({ error: 'Please select a relationship intention.' });
      return;
    }

    if (!state || !NIGERIAN_STATES.includes(state)) {
      res.status(400).json({ error: 'Please select a valid Nigerian state or FCT - Abuja.' });
      return;
    }

    if (!city || city.trim().length < 2) {
      res.status(400).json({ error: 'City is required.' });
      return;
    }

    if (!bio || bio.trim().length < 10) {
      res.status(400).json({ error: 'Bio must be at least 10 characters long to help matches get to know you.' });
      return;
    }

    // Photo count validation: Minimum 1 for draft, ideally 3 to 5
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      res.status(400).json({ error: 'Please add at least 1 clear profile photo (3 to 5 recommended).' });
      return;
    }

    const formattedPhotos: ProfilePhoto[] = photos.map((p: any, idx: number) => ({
      id: p.id || `photo_${Date.now()}_${idx}`,
      url: p.url,
      isPrimary: idx === 0,
      order: idx
    }));

    const updatedProfile = db.upsertProfile(userId, {
      displayName: displayName.trim(),
      dateOfBirth,
      age,
      gender,
      datingPreference,
      relationshipIntention,
      state,
      city: city.trim(),
      bio: bio.trim(),
      photos: formattedPhotos,
      interests: Array.isArray(interests) ? interests : [],
      preferredAgeMin: preferredAgeMin ? Number(preferredAgeMin) : 18,
      preferredAgeMax: preferredAgeMax ? Number(preferredAgeMax) : 70,
      preferredState: preferredState || 'Any',
      showOnlineStatus: showOnlineStatus !== false,
      showLocation: showLocation !== false
    });

    res.json({
      message: 'Profile saved successfully.',
      profile: updatedProfile
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: err.message || 'Failed to update profile.' });
  }
});

// POST /api/profiles/verification/request - Identity Verification
router.post('/verification/request', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const { documentUrl, idType } = req.body;

    if (!documentUrl) {
      res.status(400).json({ error: 'Please provide an ID document (NIN, Driver’s License, Voters Card, or International Passport).' });
      return;
    }

    const profile = db.getProfileByUserId(userId);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found. Please complete profile first.' });
      return;
    }

    profile.verificationStatus = 'pending';
    profile.verificationDocUrl = documentUrl;
    db.saveSync();

    // Create report/admin task for manual verification
    db.reportContent(userId, 'profile', userId, 'ID_VERIFICATION_REQUEST', `Submitted ${idType || 'ID Document'} for verification.`);

    res.json({
      message: 'Verification request submitted! Our moderation team will review your document within 24 hours.',
      status: 'pending'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profiles/:id - View another member's profile
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const targetUserId = req.params.id;
    const profile = db.getProfileByUserId(targetUserId);

    if (!profile) {
      res.status(404).json({ error: 'Profile not found.' });
      return;
    }

    // Check if blocked
    if (req.userId && (db.isBlocked(req.userId, targetUserId) || db.isBlocked(targetUserId, req.userId))) {
      res.status(403).json({ error: 'Profile is not accessible.' });
      return;
    }

    // Filter private fields if user opted out
    const publicProfile: Partial<Profile> = {
      ...profile,
      onlineStatus: profile.showOnlineStatus ? profile.onlineStatus : false,
      lastActiveAt: profile.showOnlineStatus ? profile.lastActiveAt : '',
      city: profile.showLocation ? profile.city : 'Nigeria'
    };

    res.json({ profile: publicProfile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
