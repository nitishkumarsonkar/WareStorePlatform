import { pool } from '../../config/db';
import { validatePan, validateGstin } from '../../utils/validators';
import { isValidCoordinate } from '../../utils/geo';

export interface BuilderKycParams {
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  addressText: string;
  latitude: number;
  longitude: number;
  idProofUrl?: string;
  idProofType?: string;
}

export interface VendorKycParams {
  userId: string;
  businessName: string;
  yearEstablished: number;
  panNumber: string;
  gstNumber: string;
  addressText: string;
  latitude: number;
  longitude: number;
  catalogCategories: string[];
  idProofUrl?: string;
  gstCertUrl?: string;
}

export class KycService {
  async submitBuilderKyc(params: BuilderKycParams) {
    const { userId, firstName, lastName, email, addressText, latitude, longitude, idProofUrl, idProofType = 'aadhaar' } = params;

    if (!firstName?.trim() || !lastName?.trim()) {
      throw new Error('First name and last name are mandatory.');
    }
    if (!addressText?.trim()) {
      throw new Error('Project/site address is required.');
    }
    if (!isValidCoordinate(latitude, longitude)) {
      throw new Error('Valid geographic coordinates (latitude and longitude) are required.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update user email if provided
      if (email && email.trim()) {
        await client.query('UPDATE users SET email = $1 WHERE id = $2', [email.trim().toLowerCase(), userId]);
      }

      // Upsert builder profile with PostGIS geometry
      const query = `
        INSERT INTO builder_profiles (
          user_id, first_name, last_name, address_text, location, id_proof_url, id_proof_type, updated_at
        )
        VALUES (
          $1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8, NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          address_text = EXCLUDED.address_text,
          location = EXCLUDED.location,
          id_proof_url = COALESCE(EXCLUDED.id_proof_url, builder_profiles.id_proof_url),
          id_proof_type = EXCLUDED.id_proof_type,
          updated_at = NOW()
        RETURNING id, user_id, first_name, last_name, address_text, ST_AsGeoJSON(location) as location_geojson;
      `;

      const profileRes = await client.query(query, [
        userId,
        firstName.trim(),
        lastName.trim(),
        addressText.trim(),
        longitude,
        latitude,
        idProofUrl || null,
        idProofType,
      ]);

      // Set user status to active
      await client.query("UPDATE users SET status = 'active' WHERE id = $1", [userId]);

      await client.query('COMMIT');

      const profile = profileRes.rows[0];
      return {
        success: true,
        message: 'Builder profile and KYC successfully registered.',
        profile: {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          addressText: profile.address_text,
          location: JSON.parse(profile.location_geojson),
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async submitVendorKyc(params: VendorKycParams) {
    const {
      userId,
      businessName,
      yearEstablished,
      panNumber,
      gstNumber,
      addressText,
      latitude,
      longitude,
      catalogCategories = [],
      idProofUrl,
      gstCertUrl,
    } = params;

    // 1. Strict Dual-Verification Check
    const userRes = await pool.query('SELECT phone_verified, email_verified, email, phone_number FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      throw new Error('User not found.');
    }
    const user = userRes.rows[0];

    if (!user.phone_verified) {
      throw new Error('Vendor phone verification (SMS OTP) is required before KYC submission.');
    }
    if (!user.email_verified) {
      throw new Error('Vendor business email verification is required before KYC submission.');
    }

    // 2. Format validations
    if (!businessName?.trim()) {
      throw new Error('Registered business or trade name is required.');
    }
    const currentYear = new Date().getFullYear();
    if (!yearEstablished || yearEstablished < 1900 || yearEstablished > currentYear) {
      throw new Error(`Establishment year must be between 1900 and ${currentYear}.`);
    }

    const cleanPan = panNumber?.trim().toUpperCase();
    if (!cleanPan || !validatePan(cleanPan)) {
      throw new Error('Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F).');
    }

    const cleanGst = gstNumber?.trim().toUpperCase();
    if (!cleanGst || !validateGstin(cleanGst)) {
      throw new Error('Invalid GSTIN format. Must be 15 characters (e.g. 29ABCDE1234F1Z5).');
    }

    if (!addressText?.trim()) {
      throw new Error('Warehouse/Depot physical address is required.');
    }
    if (!isValidCoordinate(latitude, longitude)) {
      throw new Error('Valid geographic coordinates (latitude and longitude) are required.');
    }
    if (!Array.isArray(catalogCategories) || catalogCategories.length === 0) {
      throw new Error('Select at least one product category for your inventory catalog.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO vendor_profiles (
          user_id, business_name, year_established, pan_number, gst_number,
          address_text, location, catalog_categories, id_proof_url, gst_cert_url, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, ST_SetSRID(ST_MakePoint($7, $8), 4326), $9, $10, $11, NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          business_name = EXCLUDED.business_name,
          year_established = EXCLUDED.year_established,
          pan_number = EXCLUDED.pan_number,
          gst_number = EXCLUDED.gst_number,
          address_text = EXCLUDED.address_text,
          location = EXCLUDED.location,
          catalog_categories = EXCLUDED.catalog_categories,
          id_proof_url = COALESCE(EXCLUDED.id_proof_url, vendor_profiles.id_proof_url),
          gst_cert_url = COALESCE(EXCLUDED.gst_cert_url, vendor_profiles.gst_cert_url),
          updated_at = NOW()
        RETURNING id, user_id, business_name, year_established, pan_number, gst_number,
                  address_text, catalog_categories, rating, rating_count, ST_AsGeoJSON(location) as location_geojson;
      `;

      const profileRes = await client.query(query, [
        userId,
        businessName.trim(),
        yearEstablished,
        cleanPan,
        cleanGst,
        addressText.trim(),
        longitude,
        latitude,
        catalogCategories,
        idProofUrl || null,
        gstCertUrl || null,
      ]);

      // Set user status to active
      await client.query("UPDATE users SET status = 'active' WHERE id = $1", [userId]);

      await client.query('COMMIT');

      const profile = profileRes.rows[0];
      return {
        success: true,
        message: 'Vendor onboarding and KYC completed successfully.',
        profile: {
          id: profile.id,
          businessName: profile.business_name,
          yearEstablished: profile.year_established,
          panNumber: profile.pan_number,
          gstNumber: profile.gst_number,
          addressText: profile.address_text,
          catalogCategories: profile.catalog_categories,
          rating: parseFloat(profile.rating),
          ratingCount: profile.rating_count,
          location: JSON.parse(profile.location_geojson),
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const kycService = new KycService();
