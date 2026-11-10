import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

export interface AuthUser {
  id: string;
  role: 'builder' | 'vendor';
  phone_number: string;
  email?: string;
  phone_verified: boolean;
  email_verified: boolean;
  status: string;
  profileId?: string;
  businessName?: string;
  fullName?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'warestore_super_secret_jwt_key_2026_trust_builds';

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    
    // Fetch latest user details along with profile ID if exists
    const userRes = await pool.query(`
      SELECT 
        u.id, u.role, u.phone_number, u.email, u.phone_verified, u.email_verified, u.status,
        CASE 
          WHEN u.role = 'builder' THEN bp.id 
          WHEN u.role = 'vendor' THEN vp.id 
          ELSE NULL 
        END AS profile_id,
        CASE 
          WHEN u.role = 'builder' THEN CONCAT(bp.first_name, ' ', bp.last_name)
          WHEN u.role = 'vendor' THEN vp.business_name
          ELSE NULL 
        END AS profile_display_name
      FROM users u
      LEFT JOIN builder_profiles bp ON bp.user_id = u.id AND u.role = 'builder'
      LEFT JOIN vendor_profiles vp ON vp.user_id = u.id AND u.role = 'vendor'
      WHERE u.id = $1
    `, [payload.sub || payload.id]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists or session is invalid.' });
    }

    const row = userRes.rows[0];
    req.user = {
      id: row.id,
      role: row.role,
      phone_number: row.phone_number,
      email: row.email,
      phone_verified: row.phone_verified,
      email_verified: row.email_verified,
      status: row.status,
      profileId: row.profile_id,
      businessName: row.role === 'vendor' ? row.profile_display_name : undefined,
      fullName: row.role === 'builder' ? row.profile_display_name : undefined,
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

export function requireRole(role: 'builder' | 'vendor') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access restricted to ${role}s only.` });
    }
    next();
  };
}
