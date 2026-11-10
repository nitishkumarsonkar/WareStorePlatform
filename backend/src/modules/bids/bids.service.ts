import { pool } from '../../config/db';

export interface SubmitBidParams {
  vendorId: string;
  projectId: string;
  baseUnitPrice: number;
  transportFee?: number;
  taxRatePercent?: number;
  deliveryTimelineDays?: number;
  remarks?: string;
}

export class BidsService {
  async submitBid(params: SubmitBidParams) {
    const {
      vendorId,
      projectId,
      baseUnitPrice,
      transportFee = 0,
      taxRatePercent = 18,
      deliveryTimelineDays = 3,
      remarks,
    } = params;

    if (!baseUnitPrice || baseUnitPrice <= 0) {
      throw new Error('Base unit price must be greater than zero.');
    }

    // Verify project exists and is open
    const pRes = await pool.query('SELECT id, quantity, status FROM projects WHERE id = $1', [projectId]);
    if (pRes.rows.length === 0) {
      throw new Error('Project requisition does not exist.');
    }
    const project = pRes.rows[0];
    if (project.status !== 'open') {
      throw new Error(`Cannot submit bid. Project is currently ${project.status}.`);
    }

    const quantity = parseFloat(project.quantity);
    const subtotal = (quantity * baseUnitPrice) + transportFee;
    const taxAmount = subtotal * (taxRatePercent / 100);
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const query = `
      INSERT INTO bids (
        project_id, vendor_id, base_unit_price, transport_fee, tax_rate_percent,
        total_amount, delivery_timeline_days, remarks, status, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, 'submitted', NOW()
      )
      ON CONFLICT (project_id, vendor_id) DO UPDATE SET
        base_unit_price = EXCLUDED.base_unit_price,
        transport_fee = EXCLUDED.transport_fee,
        tax_rate_percent = EXCLUDED.tax_rate_percent,
        total_amount = EXCLUDED.total_amount,
        delivery_timeline_days = EXCLUDED.delivery_timeline_days,
        remarks = EXCLUDED.remarks,
        status = 'submitted',
        updated_at = NOW()
      RETURNING *;
    `;

    const res = await pool.query(query, [
      projectId,
      vendorId,
      baseUnitPrice,
      transportFee,
      taxRatePercent,
      totalAmount,
      deliveryTimelineDays,
      remarks || null,
    ]);

    const row = res.rows[0];
    return {
      ...row,
      base_unit_price: parseFloat(row.base_unit_price),
      transport_fee: parseFloat(row.transport_fee),
      tax_rate_percent: parseFloat(row.tax_rate_percent),
      total_amount: parseFloat(row.total_amount),
    };
  }

  async completeBid(bidId: string, builderId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify bid is accepted and belongs to builder's project
      const checkRes = await client.query(`
        SELECT b.id, b.status, p.builder_id
        FROM bids b
        JOIN projects p ON p.id = b.project_id
        WHERE b.id = $1 AND p.builder_id = $2
      `, [bidId, builderId]);

      if (checkRes.rows.length === 0) {
        throw new Error('Bid not found or unauthorized.');
      }

      const bid = checkRes.rows[0];
      if (bid.status !== 'accepted') {
        throw new Error(`Cannot complete bid. Current status is '${bid.status}'. Only accepted bids can be marked completed.`);
      }

      await client.query(
        "UPDATE bids SET status = 'completed', updated_at = NOW() WHERE id = $1",
        [bidId]
      );

      await client.query('COMMIT');
      return { success: true, message: 'Transaction marked as completed. Both parties can now submit ratings.' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getVendorHistory(vendorId: string, filterTab: string = 'ongoing') {
    let whereClause = 'WHERE b.vendor_id = $1';

    if (filterTab === 'ongoing') {
      whereClause += " AND b.status = 'submitted' AND p.status = 'open'";
    } else if (filterTab === 'completed') {
      whereClause += " AND b.status IN ('accepted', 'completed')";
    } else if (filterTab === 'closed') {
      whereClause += " AND (b.status = 'rejected' OR (p.status = 'closed' AND b.status != 'accepted' AND b.status != 'completed'))";
    } else if (filterTab === 'cancelled') {
      whereClause += " AND (b.status = 'cancelled' OR p.status = 'cancelled')";
    }

    const query = `
      SELECT 
        b.id AS bid_id,
        b.base_unit_price,
        b.transport_fee,
        b.tax_rate_percent,
        b.total_amount,
        b.delivery_timeline_days,
        b.remarks,
        b.status AS bid_status,
        b.created_at AS bid_created_at,
        p.id AS project_id,
        p.category,
        p.sub_item,
        p.brand_preference,
        p.quantity,
        p.unit,
        p.requirement_date,
        p.transport_needed,
        p.status AS project_status,
        p.address_text AS project_address,
        bp.first_name AS builder_first_name,
        bp.last_name AS builder_last_name,
        bp.user_id AS builder_user_id,
        ROUND((ST_Distance(p.location, vp.location) / 1000)::numeric, 1) AS distance_km,
        CASE WHEN br_self.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_rated
      FROM bids b
      JOIN projects p ON p.id = b.project_id
      JOIN builder_profiles bp ON bp.id = p.builder_id
      JOIN vendor_profiles vp ON vp.id = b.vendor_id
      LEFT JOIN bid_ratings br_self ON br_self.bid_id = b.id AND br_self.reviewer_user_id = vp.user_id
      ${whereClause}
      ORDER BY b.created_at DESC;
    `;

    const res = await pool.query(query, [vendorId]);
    return res.rows.map((row) => ({
      ...row,
      base_unit_price: parseFloat(row.base_unit_price),
      transport_fee: parseFloat(row.transport_fee),
      tax_rate_percent: parseFloat(row.tax_rate_percent),
      total_amount: parseFloat(row.total_amount),
      quantity: parseFloat(row.quantity),
      distance_km: parseFloat(row.distance_km),
    }));
  }
}

export const bidsService = new BidsService();
