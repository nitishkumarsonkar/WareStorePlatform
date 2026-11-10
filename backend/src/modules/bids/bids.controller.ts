import { Response } from 'express';
import { bidsService } from './bids.service';
import { AuthenticatedRequest } from '../../middleware/auth';

export class BidsController {
  async submitBid(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'vendor') {
        return res.status(403).json({ error: 'Only registered vendors can submit quotes.' });
      }
      if (!req.user.profileId) {
        return res.status(400).json({ error: 'Please complete your Vendor KYC before bidding.' });
      }

      const {
        projectId,
        baseUnitPrice,
        transportFee = 0,
        taxRatePercent = 18,
        deliveryTimelineDays = 3,
        remarks,
      } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required.' });
      }

      const bid = await bidsService.submitBid({
        vendorId: req.user.profileId,
        projectId,
        baseUnitPrice: parseFloat(baseUnitPrice),
        transportFee: parseFloat(transportFee || 0),
        taxRatePercent: parseFloat(taxRatePercent || 18),
        deliveryTimelineDays: parseInt(deliveryTimelineDays || 3, 10),
        remarks,
      });

      return res.status(201).json(bid);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to submit quote.' });
    }
  }

  async completeBid(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'builder' || !req.user.profileId) {
        return res.status(403).json({ error: 'Only builders can mark transactions as completed.' });
      }

      const { id } = req.params;
      const result = await bidsService.completeBid(id, req.user.profileId);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to complete transaction.' });
    }
  }

  async getVendorHistory(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'vendor') {
        return res.status(403).json({ error: 'Access restricted to vendors.' });
      }
      if (!req.user.profileId) {
        return res.status(200).json([]);
      }

      const status = (req.query.status as string) || 'ongoing';
      const history = await bidsService.getVendorHistory(req.user.profileId, status);
      return res.status(200).json(history);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to fetch bid history.' });
    }
  }
}

export const bidsController = new BidsController();
