import { pool } from '../../config/db';

export interface SubmitRatingParams {
  bidId: string;
  reviewerUserId: string;
  score: number;       // 1-5
  review?: string;     // max 500 chars
}

export class RatingsService {

  /**
   * Submit a rating for a completed bid.
   * Validates: bid is completed, reviewer is a party to the bid,
   * rating hasn't already been submitted by this user.
   * After insert, recalculates the target user's aggregate rating.
   */
  async submitRating(params: SubmitRatingParams) {
    const { bidId, reviewerUserId, score, review } = params;

    // Validate score
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new Error('Rating score must be an integer between 1 and 5.');
    }
    // Validate review length
    if (review && review.length > 500) {
      throw new Error('Review must be 500 characters or fewer.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch bid with related project + user IDs
      const bidRes = await client.query(`
        SELECT
          b.id, b.status, b.vendor_id, b.project_id,
          p.builder_id,
          vp.user_id AS vendor_user_id,
          bp.user_id AS builder_user_id
        FROM bids b
        JOIN projects p ON p.id = b.project_id
        JOIN vendor_profiles vp ON vp.id = b.vendor_id
        JOIN builder_profiles bp ON bp.id = p.builder_id
        WHERE b.id = $1
      `, [bidId]);

      if (bidRes.rows.length === 0) {
        throw new Error('Bid not found.');
      }

      const bid = bidRes.rows[0];

      // 2. Check bid is completed
      if (bid.status !== 'completed') {
        throw new Error('Ratings can only be submitted for completed transactions.');
      }

      // 3. Determine target user based on reviewer identity
      let targetUserId: string;
      if (reviewerUserId === bid.builder_user_id) {
        // Builder is rating the Vendor
        targetUserId = bid.vendor_user_id;
      } else if (reviewerUserId === bid.vendor_user_id) {
        // Vendor is rating the Builder
        targetUserId = bid.builder_user_id;
      } else {
        throw new Error('You are not a party to this transaction.');
      }

      // 4. Insert rating (UNIQUE constraint prevents duplicates)
      const insertRes = await client.query(`
        INSERT INTO bid_ratings (bid_id, reviewer_user_id, target_user_id, score, review)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [bidId, reviewerUserId, targetUserId, score, review || null]);

      // 5. Recalculate target user's aggregate rating
      const aggRes = await client.query(`
        SELECT
          ROUND(AVG(score)::numeric, 2) AS avg_rating,
          COUNT(*)::int AS total_ratings
        FROM bid_ratings
        WHERE target_user_id = $1
      `, [targetUserId]);

      const { avg_rating, total_ratings } = aggRes.rows[0];

      // 6. Update the appropriate profile table
      const targetRoleRes = await client.query(
        'SELECT role FROM users WHERE id = $1', [targetUserId]
      );
      const targetRole = targetRoleRes.rows[0].role;

      if (targetRole === 'vendor') {
        await client.query(`
          UPDATE vendor_profiles
          SET rating = $1, rating_count = $2, updated_at = NOW()
          WHERE user_id = $3
        `, [avg_rating, total_ratings, targetUserId]);
      } else {
        await client.query(`
          UPDATE builder_profiles
          SET rating = $1, rating_count = $2, updated_at = NOW()
          WHERE user_id = $3
        `, [avg_rating, total_ratings, targetUserId]);
      }

      await client.query('COMMIT');
      return insertRes.rows[0];

    } catch (err: any) {
      await client.query('ROLLBACK');
      // Handle unique constraint violation gracefully
      if (err.code === '23505' && err.constraint === 'unique_rating_per_bid_per_reviewer') {
        throw new Error('You have already submitted a rating for this transaction.');
      }
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get both ratings for a specific bid transaction.
   */
  async getRatingsForBid(bidId: string) {
    const res = await pool.query(`
      SELECT
        br.*,
        u.role AS reviewer_role,
        CASE
          WHEN u.role = 'builder' THEN CONCAT(bp.first_name, ' ', bp.last_name)
          WHEN u.role = 'vendor' THEN vp.business_name
        END AS reviewer_name
      FROM bid_ratings br
      JOIN users u ON u.id = br.reviewer_user_id
      LEFT JOIN builder_profiles bp ON bp.user_id = u.id AND u.role = 'builder'
      LEFT JOIN vendor_profiles vp ON vp.user_id = u.id AND u.role = 'vendor'
      WHERE br.bid_id = $1
      ORDER BY br.created_at ASC;
    `, [bidId]);
    return res.rows;
  }

  /**
   * Get all ratings received by a user (for profile display).
   */
  async getRatingsForUser(targetUserId: string) {
    const res = await pool.query(`
      SELECT
        br.*,
        u.role AS reviewer_role,
        CASE
          WHEN u.role = 'builder' THEN CONCAT(bp.first_name, ' ', bp.last_name)
          WHEN u.role = 'vendor' THEN vp.business_name
        END AS reviewer_name
      FROM bid_ratings br
      JOIN users u ON u.id = br.reviewer_user_id
      LEFT JOIN builder_profiles bp ON bp.user_id = u.id AND u.role = 'builder'
      LEFT JOIN vendor_profiles vp ON vp.user_id = u.id AND u.role = 'vendor'
      WHERE br.target_user_id = $1
      ORDER BY br.created_at DESC;
    `, [targetUserId]);
    return res.rows;
  }

  /**
   * Check if a user has already rated a specific bid.
   */
  async hasUserRatedBid(bidId: string, userId: string): Promise<boolean> {
    const res = await pool.query(
      'SELECT 1 FROM bid_ratings WHERE bid_id = $1 AND reviewer_user_id = $2 LIMIT 1',
      [bidId, userId]
    );
    return res.rows.length > 0;
  }
}

export const ratingsService = new RatingsService();
