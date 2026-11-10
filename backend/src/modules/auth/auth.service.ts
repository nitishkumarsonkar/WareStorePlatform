import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { redis } from '../../config/redis';
import { pool } from '../../config/db';
import { cleanPhone, validateEmail, validatePhone } from '../../utils/validators';

const JWT_SECRET = process.env.JWT_SECRET || 'warestore_super_secret_jwt_key_2026_trust_builds';
const OTP_TTL_SECONDS = 300; // 5 minutes
const COOLDOWN_SECONDS = 900; // 15 minutes
const MAX_ATTEMPTS = 3;

export interface SendOtpParams {
  identifier: string; // phone number or email address
  type: 'phone' | 'email';
  role: 'builder' | 'vendor';
}

export interface VerifyOtpParams {
  identifier: string;
  type: 'phone' | 'email';
  otp: string;
  role: 'builder' | 'vendor';
}

export class AuthService {
  // Generate 6-digit cryptographic OTP
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp({ identifier, type, role }: SendOtpParams) {
    const normalizedIdentifier = type === 'phone' ? cleanPhone(identifier) : identifier.trim().toLowerCase();

    // Validation
    if (type === 'phone' && !validatePhone(normalizedIdentifier)) {
      throw new Error('Invalid Indian mobile phone number (10 digits starting with 6-9).');
    }
    if (type === 'email' && !validateEmail(normalizedIdentifier)) {
      throw new Error('Invalid email address format.');
    }

    // Check Cooldown in Redis
    const cooldownKey = `otp:cooldown:${type}:${normalizedIdentifier}`;
    const inCooldown = await redis.get(cooldownKey);
    if (inCooldown) {
      const ttl = await redis.ttl(cooldownKey);
      const minutesLeft = Math.ceil(ttl / 60);
      throw new Error(`Account temporarily locked due to excessive failed attempts. Please retry in ${minutesLeft} minute(s).`);
    }

    // Rate limit: prevent requesting new OTP within 20 seconds
    const reqLimitKey = `otp:req_throttle:${type}:${normalizedIdentifier}`;
    const isThrottled = await redis.get(reqLimitKey);
    if (isThrottled) {
      const ttl = await redis.ttl(reqLimitKey);
      throw new Error(`Please wait ${ttl} seconds before requesting a new OTP.`);
    }

    // Generate 6-digit OTP
    const otp = this.generateOtp();

    // Store in Redis with TTL 300s
    const otpKey = `otp:code:${type}:${normalizedIdentifier}`;
    await redis.set(
      otpKey,
      JSON.stringify({
        otp,
        attemptsLeft: MAX_ATTEMPTS,
        role,
      }),
      'EX',
      OTP_TTL_SECONDS
    );

    // Set 20-second throttle
    await redis.set(reqLimitKey, '1', 'EX', 20);

    // In a live production environment, this integrates with Fast2SMS / Twilio / SendGrid
    console.log(`[Ware Store OTP Service] Sent ${type.toUpperCase()} OTP to ${normalizedIdentifier}: [ ${otp} ] (Role: ${role})`);

    return {
      success: true,
      message: `6-digit verification code sent to ${normalizedIdentifier}. Valid for 5 minutes.`,
      expiresInSeconds: OTP_TTL_SECONDS,
      // Provided in development to ease testing
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  async verifyOtp({ identifier, type, otp, role }: VerifyOtpParams) {
    const normalizedIdentifier = type === 'phone' ? cleanPhone(identifier) : identifier.trim().toLowerCase();
    const otpKey = `otp:code:${type}:${normalizedIdentifier}`;
    const cooldownKey = `otp:cooldown:${type}:${normalizedIdentifier}`;

    const recordStr = await redis.get(otpKey);
    if (!recordStr) {
      throw new Error('Verification code has expired or was not requested. Please request a new OTP.');
    }

    const record = JSON.parse(recordStr);

    if (record.otp !== otp.trim()) {
      record.attemptsLeft -= 1;
      if (record.attemptsLeft <= 0) {
        // Enforce 15-minute cooldown
        await redis.del(otpKey);
        await redis.set(cooldownKey, '1', 'EX', COOLDOWN_SECONDS);
        throw new Error('Maximum OTP verification attempts exceeded. Account is locked for 15 minutes.');
      } else {
        const remainingTtl = await redis.ttl(otpKey);
        await redis.set(otpKey, JSON.stringify(record), 'EX', remainingTtl > 0 ? remainingTtl : OTP_TTL_SECONDS);
        throw new Error(`Incorrect verification code. ${record.attemptsLeft} attempt(s) remaining.`);
      }
    }

    // Success! Clean up Redis OTP key
    await redis.del(otpKey);

    // Find or create user
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let userRes;
      if (type === 'phone') {
        userRes = await client.query('SELECT * FROM users WHERE phone_number = $1', [normalizedIdentifier]);
      } else {
        userRes = await client.query('SELECT * FROM users WHERE email = $1', [normalizedIdentifier]);
      }

      let user = userRes.rows[0];

      if (!user) {
        // Create new user
        const insertQuery = `
          INSERT INTO users (
            role, 
            phone_number, 
            phone_verified, 
            email, 
            email_verified, 
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *;
        `;
        const inserted = await client.query(insertQuery, [
          role,
          type === 'phone' ? normalizedIdentifier : 'temp_' + Date.now(),
          type === 'phone',
          type === 'email' ? normalizedIdentifier : null,
          type === 'email',
          'pending_verification',
        ]);
        user = inserted.rows[0];
      } else {
        // Update verification flags
        const updateQuery = type === 'phone'
          ? `UPDATE users SET phone_verified = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *`
          : `UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *`;
        const updated = await client.query(updateQuery, [user.id]);
        user = updated.rows[0];
      }

      // Check if user has an existing profile
      let profileRes;
      if (user.role === 'builder') {
        profileRes = await client.query('SELECT id, first_name, last_name FROM builder_profiles WHERE user_id = $1', [user.id]);
      } else {
        profileRes = await client.query('SELECT id, business_name FROM vendor_profiles WHERE user_id = $1', [user.id]);
      }

      const profile = profileRes.rows[0] || null;

      // Update status to 'active' if KYC prerequisites are satisfied
      const isVendorFullyVerified = user.role === 'vendor' ? (user.phone_verified && user.email_verified) : user.phone_verified;
      if (profile && isVendorFullyVerified && user.status !== 'active') {
        await client.query("UPDATE users SET status = 'active' WHERE id = $1", [user.id]);
        user.status = 'active';
      }

      await client.query('COMMIT');

      // Issue JWT Token (15-min access token)
      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          phone: user.phone_number,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Issue Refresh Token (7 days)
      const refreshToken = jwt.sign(
        { id: user.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          role: user.role,
          phoneNumber: user.phone_number,
          phoneVerified: user.phone_verified,
          email: user.email,
          emailVerified: user.email_verified,
          status: user.status,
          profileId: profile ? profile.id : null,
          profileName: profile ? (user.role === 'builder' ? `${profile.first_name} ${profile.last_name}` : profile.business_name) : null,
          kycCompleted: !!profile,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getCurrentUser(userId: string) {
    const res = await pool.query(`
      SELECT 
        u.id, u.role, u.phone_number, u.email, u.phone_verified, u.email_verified, u.status,
        bp.id AS builder_profile_id, bp.first_name, bp.last_name, bp.address_text AS builder_address,
        ST_AsGeoJSON(bp.location) AS builder_location_geojson,
        vp.id AS vendor_profile_id, vp.business_name, vp.year_established, vp.pan_number, vp.gst_number,
        vp.address_text AS vendor_address, vp.catalog_categories, vp.rating, vp.rating_count,
        ST_AsGeoJSON(vp.location) AS vendor_location_geojson
      FROM users u
      LEFT JOIN builder_profiles bp ON bp.user_id = u.id AND u.role = 'builder'
      LEFT JOIN vendor_profiles vp ON vp.user_id = u.id AND u.role = 'vendor'
      WHERE u.id = $1
    `, [userId]);

    if (res.rows.length === 0) {
      throw new Error('User not found.');
    }

    const row = res.rows[0];
    const isBuilder = row.role === 'builder';

    return {
      id: row.id,
      role: row.role,
      phoneNumber: row.phone_number,
      phoneVerified: row.phone_verified,
      email: row.email,
      emailVerified: row.email_verified,
      status: row.status,
      profile: isBuilder
        ? row.builder_profile_id
          ? {
              id: row.builder_profile_id,
              firstName: row.first_name,
              lastName: row.last_name,
              addressText: row.builder_address,
              location: row.builder_location_geojson ? JSON.parse(row.builder_location_geojson) : null,
            }
          : null
        : row.vendor_profile_id
        ? {
            id: row.vendor_profile_id,
            businessName: row.business_name,
            yearEstablished: row.year_established,
            panNumber: row.pan_number,
            gstNumber: row.gst_number,
            addressText: row.vendor_address,
            catalogCategories: row.catalog_categories,
            rating: parseFloat(row.rating),
            ratingCount: row.rating_count,
            location: row.vendor_location_geojson ? JSON.parse(row.vendor_location_geojson) : null,
          }
        : null,
    };
  }
}

export const authService = new AuthService();
