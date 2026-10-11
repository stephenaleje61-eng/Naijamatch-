import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, AuthRequest, requireVerifiedEmail } from '../auth.ts';

const router = Router();

// GET /api/marketplace/listings
router.get('/listings', (req, res): void => {
  try {
    const { category, state, search } = req.query;
    const listings = db.getMarketplaceListings({
      category: category as string,
      state: state as string,
      search: search as string
    });
    res.json({ listings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/marketplace/create - Create listing
router.post('/create', authenticate, requireVerifiedEmail, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const { title, description, category, priceNGN, state, city, images } = req.body;

    if (!title || !description || !category || !priceNGN || !state || !city) {
      res.status(400).json({ error: 'All listing fields are required.' });
      return;
    }

    if (!['Fashion', 'Gifts', 'Date Ideas', 'Other Services'].includes(category)) {
      res.status(400).json({ error: 'Invalid marketplace category.' });
      return;
    }

    if (Number(priceNGN) <= 0) {
      res.status(400).json({ error: 'Price must be greater than zero.' });
      return;
    }

    const listing = db.createMarketplaceListing({
      userId,
      title: title.trim(),
      description: description.trim(),
      category,
      priceNGN: Number(priceNGN),
      state,
      city: city.trim(),
      images: Array.isArray(images) && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80'
      ]
    });

    res.status(201).json({
      message: 'Marketplace item published successfully.',
      listing
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/marketplace/:id
router.delete('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.userId!;
    const listingId = req.params.id;

    const success = db.deleteMarketplaceListing(listingId, userId);
    if (!success) {
      res.status(403).json({ error: 'Failed to delete listing or unauthorized.' });
      return;
    }

    res.json({ message: 'Listing removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
