import { pool } from '../config/db';

export async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('Clearing existing data and seeding Ware Store...');
    await client.query('BEGIN');

    await client.query('TRUNCATE bid_ratings, bids, projects, vendor_profiles, builder_profiles, users CASCADE;');

    // 1. Seed Builders
    // Builder 1: Bengaluru Whitefield (12.9698, 77.7500)
    const b1User = await client.query(`
      INSERT INTO users (role, phone_number, phone_verified, email, email_verified, status)
      VALUES ('builder', '9876543210', TRUE, 'rajesh.infra@example.com', TRUE, 'active')
      RETURNING id;
    `);
    const b1Profile = await client.query(`
      INSERT INTO builder_profiles (user_id, first_name, last_name, address_text, location, id_proof_url, id_proof_type)
      VALUES ($1, 'Rajesh', 'Kumar', 'Prestige Tech Cloud Site, Whitefield, Bengaluru', ST_SetSRID(ST_MakePoint(77.7500, 12.9698), 4326), '/uploads/aadhaar_sample.pdf', 'aadhaar')
      RETURNING id;
    `, [b1User.rows[0].id]);

    // Builder 2: Bengaluru Electronic City (12.8452, 77.6602)
    const b2User = await client.query(`
      INSERT INTO users (role, phone_number, phone_verified, email, email_verified, status)
      VALUES ('builder', '9811223344', TRUE, 'ananya.builders@example.com', TRUE, 'active')
      RETURNING id;
    `);
    const b2Profile = await client.query(`
      INSERT INTO builder_profiles (user_id, first_name, last_name, address_text, location, id_proof_url, id_proof_type)
      VALUES ($1, 'Ananya', 'Sharma', 'Sobha Silicon Oasis, Electronic City Phase 1, Bengaluru', ST_SetSRID(ST_MakePoint(77.6602, 12.8452), 4326), '/uploads/pan_sample.pdf', 'pan')
      RETURNING id;
    `, [b2User.rows[0].id]);

    // 2. Seed Vendors
    // Vendor 1: Mahaveer Building Supplies - Marathahalli (~6 km from Whitefield)
    // Lat: 12.9569, Lng: 77.7011
    const v1User = await client.query(`
      INSERT INTO users (role, phone_number, phone_verified, email, email_verified, status)
      VALUES ('vendor', '9900112233', TRUE, 'sales@mahaveersupplies.com', TRUE, 'active')
      RETURNING id;
    `);
    const v1Profile = await client.query(`
      INSERT INTO vendor_profiles (user_id, business_name, year_established, pan_number, gst_number, address_text, location, catalog_categories, rating, rating_count)
      VALUES ($1, 'Mahaveer Building Materials & Infra', 2012, 'AAECM4567K', '29AAECM4567K1Z5', 'Outer Ring Road, Marathahalli, Bengaluru', ST_SetSRID(ST_MakePoint(77.7011, 12.9569), 4326), ARRAY['Bricks', 'Cement', 'Sand', 'Aggregates'], 4.85, 34)
      RETURNING id;
    `, [v1User.rows[0].id]);

    // Vendor 2: Shri Balaji Steel & Cement Hub - KR Puram (~10 km from Whitefield)
    // Lat: 13.0039, Lng: 77.6974
    const v2User = await client.query(`
      INSERT INTO users (role, phone_number, phone_verified, email, email_verified, status)
      VALUES ('vendor', '9911223344', TRUE, 'contact@balajisteel.in', TRUE, 'active')
      RETURNING id;
    `);
    const v2Profile = await client.query(`
      INSERT INTO vendor_profiles (user_id, business_name, year_established, pan_number, gst_number, address_text, location, catalog_categories, rating, rating_count)
      VALUES ($1, 'Shri Balaji Steel & Cement Traders', 2008, 'AAFCB1234F', '29AAFCB1234F1Z8', 'Old Madras Road, KR Puram, Bengaluru', ST_SetSRID(ST_MakePoint(77.6974, 13.0039), 4326), ARRAY['Steel', 'Cement', 'Electrical'], 4.60, 28)
      RETURNING id;
    `, [v2User.rows[0].id]);

    // Vendor 3: Apex Industrial Aggregates - Hoskote (~18 km from Whitefield)
    // Lat: 13.0712, Lng: 77.7981
    const v3User = await client.query(`
      INSERT INTO users (role, phone_number, phone_verified, email, email_verified, status)
      VALUES ('vendor', '9922334455', TRUE, 'orders@apexaggregates.com', TRUE, 'active')
      RETURNING id;
    `);
    const v3Profile = await client.query(`
      INSERT INTO vendor_profiles (user_id, business_name, year_established, pan_number, gst_number, address_text, location, catalog_categories, rating, rating_count)
      VALUES ($1, 'Apex Industrial Aggregates & Blocks', 2017, 'AABCA9876E', '29AABCA9876E1Z2', 'Industrial Area, Hoskote, Bengaluru Rural', ST_SetSRID(ST_MakePoint(77.7981, 13.0712), 4326), ARRAY['Sand', 'Aggregates', 'Bricks'], 4.70, 19)
      RETURNING id;
    `, [v3User.rows[0].id]);

    // Vendor 4: Deccan Prime Materials - Peenya (~35 km from Whitefield)
    // Lat: 13.0285, Lng: 77.5197
    const v4User = await client.query(`
      INSERT INTO users (role, phone_number, phone_verified, email, email_verified, status)
      VALUES ('vendor', '9933445566', TRUE, 'info@deccanprime.com', TRUE, 'active')
      RETURNING id;
    `);
    const v4Profile = await client.query(`
      INSERT INTO vendor_profiles (user_id, business_name, year_established, pan_number, gst_number, address_text, location, catalog_categories, rating, rating_count)
      VALUES ($1, 'Deccan Prime Construction Depot', 2015, 'AAECD8888D', '29AAECD8888D1Z9', 'Peenya Industrial Estate 2nd Stage, Bengaluru', ST_SetSRID(ST_MakePoint(77.5197, 13.0285), 4326), ARRAY['Plumbing', 'Electrical', 'Steel', 'Cement'], 4.40, 15)
      RETURNING id;
    `, [v4User.rows[0].id]);

    // 3. Seed Projects (Requisitions)
    // Project 1: Whitefield AAC Blocks
    const p1 = await client.query(`
      INSERT INTO projects (
        builder_id, category, sub_item, brand_preference, quantity, unit,
        requirement_date, transport_needed, gst_number, notes, status, address_text, location
      )
      VALUES (
        $1, 'Bricks', 'AAC Blocks (600x200x150mm)', 'Siporex / Magicrete', 4500, 'Pieces',
        CURRENT_DATE + INTERVAL '5 days', TRUE, '29ABCDE1234F1Z5',
        'Direct unloading required at Tower B loading dock. Unloading clearance needed before 10 AM.',
        'open', 'Prestige Tech Cloud Site, Whitefield, Bengaluru', ST_SetSRID(ST_MakePoint(77.7500, 12.9698), 4326)
      )
      RETURNING id;
    `, [b1Profile.rows[0].id]);

    // Project 2: Whitefield TMT Steel
    const p2 = await client.query(`
      INSERT INTO projects (
        builder_id, category, sub_item, brand_preference, quantity, unit,
        requirement_date, transport_needed, gst_number, notes, status, address_text, location
      )
      VALUES (
        $1, 'Steel', 'TMT Fe 550D (16mm & 20mm)', 'Tata Tiscon', 25, 'Tons',
        CURRENT_DATE + INTERVAL '7 days', TRUE, '29ABCDE1234F1Z5',
        'Mill test certificates mandatory with every bundle batch.',
        'open', 'Prestige Tech Cloud Site, Whitefield, Bengaluru', ST_SetSRID(ST_MakePoint(77.7500, 12.9698), 4326)
      )
      RETURNING id;
    `, [b1Profile.rows[0].id]);

    // Project 3: Whitefield Cement Requisition
    const p3 = await client.query(`
      INSERT INTO projects (
        builder_id, category, sub_item, brand_preference, quantity, unit,
        requirement_date, transport_needed, gst_number, notes, status, address_text, location
      )
      VALUES (
        $1, 'Cement', 'OPC 53 Grade', 'UltraTech', 600, 'Bags',
        CURRENT_DATE + INTERVAL '3 days', FALSE, '29ABCDE1234F1Z5',
        'Builder will arrange transport from vendor depot if within 15 km.',
        'open', 'Prestige Tech Cloud Site, Whitefield, Bengaluru', ST_SetSRID(ST_MakePoint(77.7500, 12.9698), 4326)
      )
      RETURNING id;
    `, [b1Profile.rows[0].id]);

    // Project 4: Electronic City River Sand (Builder 2)
    const p4 = await client.query(`
      INSERT INTO projects (
        builder_id, category, sub_item, brand_preference, quantity, unit,
        requirement_date, transport_needed, gst_number, notes, status, address_text, location
      )
      VALUES (
        $1, 'Sand', 'M-Sand (Plastering Grade)', 'Certified River Wash', 1200, 'Cubic Feet',
        CURRENT_DATE + INTERVAL '4 days', TRUE, '29AABCS8888P1Z3',
        'Moisture content < 5%. Sieve test certificate required.',
        'open', 'Sobha Silicon Oasis, Electronic City, Bengaluru', ST_SetSRID(ST_MakePoint(77.6602, 12.8452), 4326)
      )
      RETURNING id;
    `, [b2Profile.rows[0].id]);

    // 4. Seed Bids on Project 1 (AAC Blocks)
    // Bid from Mahaveer (Vendor 1): Rs 62 / piece + 4000 transport + 18% tax
    // 4500 * 62 = 279,000 + 4,000 = 283,000. + 18% tax (50,940) = 333,940
    await client.query(`
      INSERT INTO bids (project_id, vendor_id, base_unit_price, transport_fee, tax_rate_percent, total_amount, delivery_timeline_days, remarks, status)
      VALUES ($1, $2, 62.00, 4000.00, 18.00, 333940.00, 2, 'Magicrete certified blocks. Fast dispatched from Marathahalli stockyard.', 'submitted')
    `, [p1.rows[0].id, v1Profile.rows[0].id]);

    // Bid from Apex Aggregates (Vendor 3): Rs 59.50 / piece + 6500 transport + 18% tax
    // 4500 * 59.50 = 267,750 + 6,500 = 274,250. + 18% tax (49,365) = 323,615
    await client.query(`
      INSERT INTO bids (project_id, vendor_id, base_unit_price, transport_fee, tax_rate_percent, total_amount, delivery_timeline_days, remarks, status)
      VALUES ($1, $2, 59.50, 6500.00, 18.00, 323615.00, 3, 'Direct factory dispatch from Hoskote plant. Lowest unit pricing guaranteed.', 'submitted')
    `, [p1.rows[0].id, v3Profile.rows[0].id]);

    // Bid on Project 2 (Steel) from Balaji Steel (Vendor 2):
    // 25 tons * 58,000 / ton = 1,450,000 + 12,000 transport + 18% tax (263,160) = 1,725,160
    await client.query(`
      INSERT INTO bids (project_id, vendor_id, base_unit_price, transport_fee, tax_rate_percent, total_amount, delivery_timeline_days, remarks, status)
      VALUES ($1, $2, 58000.00, 12000.00, 18.00, 1725160.00, 4, 'Original Tata Tiscon 550D with test barcode stickers and test certificates.', 'submitted')
    `, [p2.rows[0].id, v2Profile.rows[0].id]);

    // 5. Seed a completed bid with mutual ratings (for rating system demo)
    // Accept Mahaveer's bid on Project 1, then mark completed, then add bilateral ratings
    await client.query(`
      UPDATE bids SET status = 'completed', updated_at = NOW()
      WHERE project_id = $1 AND vendor_id = $2
    `, [p1.rows[0].id, v1Profile.rows[0].id]);

    // Reject other bids for Project 1
    await client.query(`
      UPDATE bids SET status = 'rejected', updated_at = NOW()
      WHERE project_id = $1 AND vendor_id != $2
    `, [p1.rows[0].id, v1Profile.rows[0].id]);

    // Close Project 1
    await client.query(`
      UPDATE projects SET status = 'closed', updated_at = NOW()
      WHERE id = $1
    `, [p1.rows[0].id]);

    // Get the completed bid ID for ratings
    const completedBidRes = await client.query(`
      SELECT id FROM bids WHERE project_id = $1 AND vendor_id = $2
    `, [p1.rows[0].id, v1Profile.rows[0].id]);
    const completedBidId = completedBidRes.rows[0].id;

    // Builder (Rajesh) rates Vendor (Mahaveer) — 5 stars
    await client.query(`
      INSERT INTO bid_ratings (bid_id, reviewer_user_id, target_user_id, score, review)
      VALUES ($1, $2, $3, 5, 'Excellent quality AAC blocks, delivered on time and well-packaged. Great communication throughout.')
    `, [completedBidId, b1User.rows[0].id, v1User.rows[0].id]);

    // Vendor (Mahaveer) rates Builder (Rajesh) — 4 stars
    await client.query(`
      INSERT INTO bid_ratings (bid_id, reviewer_user_id, target_user_id, score, review)
      VALUES ($1, $2, $3, 4, 'Payment processed promptly. Site was accessible and unloading crew was ready. Minor delay in PO confirmation.')
    `, [completedBidId, v1User.rows[0].id, b1User.rows[0].id]);

    // Update Vendor 1 (Mahaveer) aggregate rating to reflect the new rating
    const v1AggRes = await client.query(`
      SELECT ROUND(AVG(score)::numeric, 2) AS avg_rating, COUNT(*)::int AS total_ratings
      FROM bid_ratings WHERE target_user_id = $1
    `, [v1User.rows[0].id]);
    await client.query(`
      UPDATE vendor_profiles SET rating = $1, rating_count = $2, updated_at = NOW()
      WHERE user_id = $3
    `, [v1AggRes.rows[0].avg_rating, v1AggRes.rows[0].total_ratings, v1User.rows[0].id]);

    // Update Builder 1 (Rajesh) aggregate rating
    const b1AggRes = await client.query(`
      SELECT ROUND(AVG(score)::numeric, 2) AS avg_rating, COUNT(*)::int AS total_ratings
      FROM bid_ratings WHERE target_user_id = $1
    `, [b1User.rows[0].id]);
    await client.query(`
      UPDATE builder_profiles SET rating = $1, rating_count = $2, updated_at = NOW()
      WHERE user_id = $3
    `, [b1AggRes.rows[0].avg_rating, b1AggRes.rows[0].total_ratings, b1User.rows[0].id]);

    await client.query('COMMIT');
    console.log('✅ Ware Store seeded successfully with builders, vendors, requisitions, and competing bids!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
