import { Response } from 'express';
import { kycService } from './kyc.service';
import { AuthenticatedRequest } from '../../middleware/auth';

export class KycController {
  async submitBuilderKyc(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }
      if (req.user.role !== 'builder') {
        return res.status(403).json({ error: 'Only registered builders can submit builder KYC.' });
      }

      const { firstName, lastName, email, addressText, latitude, longitude, idProofUrl, idProofType } = req.body;
      const result = await kycService.submitBuilderKyc({
        userId: req.user.id,
        firstName,
        lastName,
        email,
        addressText,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        idProofUrl,
        idProofType,
      });

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Builder KYC failed.' });
    }
  }

  async submitVendorKyc(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }
      if (req.user.role !== 'vendor') {
        return res.status(403).json({ error: 'Only registered vendors can submit vendor KYC.' });
      }

      const {
        businessName,
        yearEstablished,
        panNumber,
        gstNumber,
        addressText,
        latitude,
        longitude,
        catalogCategories,
        idProofUrl,
        gstCertUrl,
      } = req.body;

      const result = await kycService.submitVendorKyc({
        userId: req.user.id,
        businessName,
        yearEstablished: parseInt(yearEstablished, 10),
        panNumber,
        gstNumber,
        addressText,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        catalogCategories,
        idProofUrl,
        gstCertUrl,
      });

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Vendor KYC failed.' });
    }
  }
}

export const kycController = new KycController();
