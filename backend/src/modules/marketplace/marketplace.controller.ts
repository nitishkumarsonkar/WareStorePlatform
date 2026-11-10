import { Response } from 'express';
import { marketplaceService } from './marketplace.service';
import { AuthenticatedRequest } from '../../middleware/auth';

export class MarketplaceController {
  async getFeed(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'vendor') {
        return res.status(403).json({ error: 'Marketplace feed is available to verified vendors only.' });
      }
      if (!req.user.profileId) {
        return res.status(400).json({ error: 'Please complete your Vendor KYC to access the marketplace feed.' });
      }

      const {
        distance_km = '50',
        category,
        sub_item,
        search,
        sort_by = 'relevance',
      } = req.query;

      const feed = await marketplaceService.getFeed({
        vendorId: req.user.profileId,
        distanceKm: parseFloat(distance_km as string),
        category: category as string,
        subItem: sub_item as string,
        search: search as string,
        sortBy: sort_by as any,
      });

      return res.status(200).json(feed);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to fetch marketplace feed.' });
    }
  }
}

export const marketplaceController = new MarketplaceController();
