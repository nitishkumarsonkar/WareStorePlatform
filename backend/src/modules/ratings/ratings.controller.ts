import { Response } from 'express';
import { ratingsService } from './ratings.service';
import { AuthenticatedRequest } from '../../middleware/auth';

export class RatingsController {

  async submitRating(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const { bidId, score, review } = req.body;

      if (!bidId) {
        return res.status(400).json({ error: 'Bid ID is required.' });
      }

      const rating = await ratingsService.submitRating({
        bidId,
        reviewerUserId: req.user.id,
        score: parseInt(score, 10),
        review: review?.trim(),
      });

      return res.status(201).json(rating);
    } catch (err: any) {
      const status = err.message.includes('already submitted') ? 409 : 400;
      return res.status(status).json({ error: err.message || 'Failed to submit rating.' });
    }
  }

  async getRatingsForBid(req: AuthenticatedRequest, res: Response) {
    try {
      const { bidId } = req.params;
      const ratings = await ratingsService.getRatingsForBid(bidId);
      return res.status(200).json(ratings);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to fetch ratings.' });
    }
  }

  async getRatingsForUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const ratings = await ratingsService.getRatingsForUser(userId);
      return res.status(200).json(ratings);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to fetch user ratings.' });
    }
  }

  async checkRatingStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const { bidId } = req.params;
      const hasRated = await ratingsService.hasUserRatedBid(bidId, req.user.id);
      return res.status(200).json({ hasRated });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to check rating status.' });
    }
  }
}

export const ratingsController = new RatingsController();
