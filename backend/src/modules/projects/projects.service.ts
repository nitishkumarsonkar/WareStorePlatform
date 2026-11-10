import { pool } from '../../config/db';

export interface CreateProjectParams {
  builderId: string; // builder_profiles.id
  category: string;
  subItem: string;
  brandPreference?: string;
  quantity: number;
  unit: string;
  requirementDate: string;
  transportNeeded: boolean;
  gstNumber?: string;
  notes?: string;
  addressText?: string;
  latitude?: number;
  longitude?: number;
}

export class ProjectsService {
  async createProject(params: CreateProjectParams) {
    const {
      builderId,
      category,
      subItem,
      brandPreference,
      quantity,
      unit,
      requirementDate,
      transportNeeded,
      gstNumber,
      notes,
      addressText,
      latitude,
      longitude,
    } = params;

    if (!category || !subItem) {
      throw new Error('Category and Sub-item are required.');
    }
    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }
    if (!unit) {
      throw new Error('Unit of measurement is required.');
    }
    if (!requirementDate) {
      throw new Error('Requirement date is required.');
    }

    // If address/lat/lng not explicitly passed, fallback to builder's default location
    let finalAddress = addressText;
    let finalLng = longitude;
    let finalLat = latitude;

    if (!finalAddress || finalLat === undefined || finalLng === undefined) {
      const bRes = await pool.query(
        'SELECT address_text, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM builder_profiles WHERE id = $1',
        [builderId]
      );
      if (bRes.rows.length === 0) {
        throw new Error('Builder profile not found. Please complete KYC.');
      }
      finalAddress = finalAddress || bRes.rows[0].address_text;
      finalLng = finalLng !== undefined ? finalLng : parseFloat(bRes.rows[0].lng);
      finalLat = finalLat !== undefined ? finalLat : parseFloat(bRes.rows[0].lat);
    }

    const query = `
      INSERT INTO projects (
        builder_id, category, sub_item, brand_preference, quantity, unit,
        requirement_date, transport_needed, gst_number, notes, status,
        address_text, location, created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, 'open',
        $11, ST_SetSRID(ST_MakePoint($12, $13), 4326), NOW(), NOW()
      )
      RETURNING id, builder_id, category, sub_item, brand_preference, quantity, unit,
                requirement_date, transport_needed, gst_number, notes, status, address_text,
                ST_AsGeoJSON(location) as location_geojson, created_at;
    `;

    const res = await pool.query(query, [
      builderId,
      category.trim(),
      subItem.trim(),
      brandPreference ? brandPreference.trim() : null,
      quantity,
      unit.trim(),
      requirementDate,
      !!transportNeeded,
      gstNumber ? gstNumber.trim().toUpperCase() : null,
      notes ? notes.trim() : null,
      finalAddress,
      finalLng,
      finalLat,
    ]);

    const row = res.rows[0];
    return {
      ...row,
      location: JSON.parse(row.location_geojson),
    };
  }

  async getProjectsByBuilder(builderId: string, status?: string) {
    let query = `
      SELECT 
        p.id, p.category, p.sub_item, p.brand_preference, p.quantity, p.unit,
        p.requirement_date, p.transport_needed, p.gst_number, p.notes, p.status,
        p.address_text, p.created_at,
        ST_AsGeoJSON(p.location) as location_geojson,
        COUNT(b.id) AS total_bids,
        MIN(b.total_amount) AS lowest_quote,
        MIN(b.base_unit_price) AS lowest_unit_price
      FROM projects p
      LEFT JOIN bids b ON b.project_id = p.id
      WHERE p.builder_id = $1
    `;

    const queryParams: any[] = [builderId];

    if (status && status !== 'all') {
      queryParams.push(status);
      query += ` AND p.status = $${queryParams.length}`;
    }

    query += `
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;

    const res = await pool.query(query, queryParams);
    return res.rows.map((row) => ({
      ...row,
      total_bids: parseInt(row.total_bids, 10),
      lowest_quote: row.lowest_quote ? parseFloat(row.lowest_quote) : null,
      lowest_unit_price: row.lowest_unit_price ? parseFloat(row.lowest_unit_price) : null,
      location: JSON.parse(row.location_geojson),
    }));
  }

  async getProjectDetails(projectId: string) {
    const query = `
      SELECT 
        p.*, 
        ST_AsGeoJSON(p.location) as location_geojson,
        bp.first_name, bp.last_name, bp.address_text as builder_default_address,
        u.phone_number as builder_phone, u.email as builder_email
      FROM projects p
      JOIN builder_profiles bp ON bp.id = p.builder_id
      JOIN users u ON u.id = bp.user_id
      WHERE p.id = $1;
    `;
    const res = await pool.query(query, [projectId]);
    if (res.rows.length === 0) {
      throw new Error('Project requisition not found.');
    }
    const row = res.rows[0];
    return {
      ...row,
      location: JSON.parse(row.location_geojson),
    };
  }

  async getProjectLeaderboard(projectId: string) {
    // Calculates distance between project location and vendor location using PostGIS ST_Distance
    const query = `
      SELECT 
        b.id,
        b.project_id,
        b.vendor_id,
        b.base_unit_price,
        b.transport_fee,
        b.tax_rate_percent,
        b.total_amount,
        b.delivery_timeline_days,
        b.remarks,
        b.status AS bid_status,
        b.created_at AS bid_created_at,
        vp.business_name,
        vp.year_established,
        vp.address_text AS vendor_address,
        vp.rating AS vendor_rating,
        vp.rating_count AS vendor_rating_count,
        u.phone_number AS vendor_phone,
        u.email AS vendor_email,
        ROUND((ST_Distance(p.location, vp.location) / 1000)::numeric, 1) AS distance_km,
        DENSE_RANK() OVER (ORDER BY b.total_amount ASC) AS price_rank
      FROM bids b
      JOIN projects p ON p.id = b.project_id
      JOIN vendor_profiles vp ON vp.id = b.vendor_id
      JOIN users u ON u.id = vp.user_id
      WHERE b.project_id = $1
      ORDER BY b.total_amount ASC, distance_km ASC;
    `;

    const res = await pool.query(query, [projectId]);
    return res.rows.map((row) => ({
      ...row,
      base_unit_price: parseFloat(row.base_unit_price),
      transport_fee: parseFloat(row.transport_fee),
      tax_rate_percent: parseFloat(row.tax_rate_percent),
      total_amount: parseFloat(row.total_amount),
      vendor_rating: parseFloat(row.vendor_rating),
      distance_km: parseFloat(row.distance_km),
      price_rank: parseInt(row.price_rank, 10),
    }));
  }

  async updateProjectStatus(projectId: string, builderId: string, status: 'closed' | 'cancelled') {
    const res = await pool.query(
      `UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2 AND builder_id = $3 RETURNING *;`,
      [status, projectId, builderId]
    );
    if (res.rows.length === 0) {
      throw new Error('Project not found or you are not authorized to update it.');
    }
    return res.rows[0];
  }

  async acceptBid(bidId: string, builderId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify bid belongs to a project owned by this builder
      const checkRes = await client.query(`
        SELECT b.id, b.project_id, p.builder_id, p.status as project_status
        FROM bids b
        JOIN projects p ON p.id = b.project_id
        WHERE b.id = $1 AND p.builder_id = $2
      `, [bidId, builderId]);

      if (checkRes.rows.length === 0) {
        throw new Error('Bid not found or unauthorized.');
      }

      const { project_id, project_status } = checkRes.rows[0];
      if (project_status !== 'open') {
        throw new Error(`Cannot accept bid. Project is already ${project_status}.`);
      }

      // 1. Mark accepted bid
      await client.query("UPDATE bids SET status = 'accepted', updated_at = NOW() WHERE id = $1", [bidId]);

      // 2. Reject other bids for this project
      await client.query("UPDATE bids SET status = 'rejected', updated_at = NOW() WHERE project_id = $1 AND id != $2", [project_id, bidId]);

      // 3. Close the project
      await client.query("UPDATE projects SET status = 'closed', updated_at = NOW() WHERE id = $1", [project_id]);

      await client.query('COMMIT');
      return { success: true, message: 'Vendor quote accepted successfully. Requisition is now closed.' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const projectsService = new ProjectsService();
