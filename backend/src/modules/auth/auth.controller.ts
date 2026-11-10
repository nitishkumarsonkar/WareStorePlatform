import { Request, Response } from 'express';
import { authService } from './auth.service';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AuthController {
  async sendOtp(req: Request, res: Response) {
    try {
      const { identifier, type = 'phone', role = 'builder' } = req.body;
      if (!identifier) {
        return res.status(400).json({ error: 'Identifier (phone or email) is required.' });
      }
      if (!['phone', 'email'].includes(type)) {
        return res.status(400).json({ error: "Type must be either 'phone' or 'email'." });
      }
      if (!['builder', 'vendor'].includes(role)) {
        return res.status(400).json({ error: "Role must be either 'builder' or 'vendor'." });
      }

      const result = await authService.sendOtp({ identifier, type, role });
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to send OTP.' });
    }
  }

  async verifyOtp(req: Request, res: Response) {
    try {
      const { identifier, otp, type = 'phone', role = 'builder' } = req.body;
      if (!identifier || !otp) {
        return res.status(400).json({ error: 'Identifier and OTP code are required.' });
      }

      const result = await authService.verifyOtp({ identifier, type, otp, role });
      
      // Also set secure httpOnly cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'OTP verification failed.' });
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated.' });
      }
      const user = await authService.getCurrentUser(req.user.id);
      return res.status(200).json(user);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to fetch user profile.' });
    }
  }
}

export const authController = new AuthController();
