import { pool } from '../../config/db';

export interface FeedQueryParams {
  vendorId: string;
  distanceKm?: number;
  category?: string;
  subItem?: string;
  search?: string;
  sortBy?: 'relevance' | 'distance' | 'quantity' | 'date';
}

export class MarketplaceService {
  async getFeed(params: FeedQueryParams) {
    const {
      vendorId,
      distanceKm = 50,
      category,
      subItem,
      search,
      sortBy = 'relevance',
    } = params;

    // Radius in meters
    const radiusMeters = Math.max(1, distanceKm) * 1000;

    let query = `
      SELECT 
        p.id,
        p.category,
        p.sub_item,
        p.brand_preference,
        p.quantity,
        p.unit,
        p.requirement_date,
        p.transport_needed,
        p.gst_number,
        p.notes,
        p.status,
        p.address_text,
        p.created_at,
        ST_AsGeoJSON(p.location) AS location_geojson,
        ROUND((ST_Distance(p.location, vp.location) / 1000)::numeric, 1) AS distance_km,
        COUNT(b.id) AS total_bids,
        MIN(b.base_unit_price) AS lowest_unit_bid,
        EXISTS(SELECT 1 FROM bids my_b WHERE my_b.project_id = p.id AND my_b.vendor_id = vp.id) AS has_submitted_bid,
        (SELECT my_b.total_amount FROM bids my_b WHERE my_b.project_id = p.id AND my_b.vendor_id = vp.id LIMIT 1) AS my_bid_amount,
        (SELECT my_b.status FROM bids my_b WHERE my_b.project_id = p.id AND my_b.vendor_id = vp.id LIMIT 1) AS my_bid_status,
        bp.first_name AS builder_first_name,
        bp.last_name AS builder_last_name
      FROM projects p
      CROSS JOIN vendor_profiles vp
      JOIN builder_profiles bp ON bp.id = p.builder_id
      LEFT JOIN bids b ON b.project_id = p.id
      WHERE vp.id = $1
        AND p.status = 'open'
        AND ST_DWithin(p.location, vp.location, $2)
    `;

    const queryParams: any[] = [vendorId, radiusMeters];

    if (category && category !== 'All') {
      queryParams.push(category);
      query += ` AND p.category = $${queryParams.length}`;
    }

    if (subItem && subItem !== 'All') {
      queryParams.push(subItem);
      query += ` AND p.sub_item ILIKE '%' || $${queryParams.length} || '%'`;
    }

    if (search && search.trim()) {
      queryParams.push(`%${search.trim()}%`);
      query += ` AND (p.category ILIKE $${queryParams.length} OR p.sub_item ILIKE $${queryParams.length} OR p.brand_preference ILIKE $${queryParams.length} OR p.address_text ILIKE $${queryParams.length})`;
    }

    query += `
      GROUP BY p.id, vp.id, bp.first_name, bp.last_name
    `;

    // Order by
    if (sortBy === 'distance') {
      query += ` ORDER BY ST_Distance(p.location, vp.location) ASC, p.created_at DESC`;
    } else if (sortBy === 'quantity') {
      query += ` ORDER BY p.quantity DESC, p.created_at DESC`;
    } else if (sortBy === 'date') {
      query += ` ORDER BY p.created_at DESC`;
    } else {
      // Relevance: un-bid projects first, then distance and recency
      query += ` ORDER BY has_submitted_bid ASC, ST_Distance(p.location, vp.location) ASC, p.created_at DESC`;
    }

    const res = await pool.query(query, queryParams);
    return res.rows.map((row) => ({
      ...row,
      quantity: parseFloat(row.quantity),
      distance_km: parseFloat(row.distance_km),
      total_bids: parseInt(row.total_bids, 10),
      lowest_unit_bid: row.lowest_unit_bid ? parseFloat(row.lowest_unit_bid) : null,
      my_bid_amount: row.my_bid_amount ? parseFloat(row.my_bid_amount) : null,
      location: JSON.parse(row.location_geojson),
    }));
  }
}

export const marketplaceService = new MarketplaceService();
