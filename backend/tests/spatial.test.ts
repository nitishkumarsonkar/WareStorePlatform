import { pool } from '../src/config/db';

async function testSpatialCapabilities() {
  console.log('\n--- Running PostGIS Spatial & Distance Verification Tests ---');
  const client = await pool.connect();
  try {
    // 1. Verify PostGIS version and extension
    const vRes = await client.query('SELECT PostGIS_Full_Version();');
    console.log('✅ PostGIS Version installed:', vRes.rows[0].postgis_full_version);

    // 2. Test ST_Distance calculation between Whitefield (12.9698, 77.7500) and Marathahalli (12.9569, 77.7011)
    const distRes = await client.query(`
      SELECT 
        ROUND((ST_Distance(
          ST_SetSRID(ST_MakePoint(77.7500, 12.9698), 4326)::geography,
          ST_SetSRID(ST_MakePoint(77.7011, 12.9569), 4326)::geography
        ) / 1000)::numeric, 2) AS distance_km;
    `);
    const distanceKm = parseFloat(distRes.rows[0].distance_km);
    console.log(`✅ Calculated PostGIS distance between Whitefield and Marathahalli: ${distanceKm} km (Expected ~5.5-6.0 km)`);
    if (distanceKm < 5 || distanceKm > 7) {
      throw new Error(`Distance calculation off: expected ~5.5-6km, got ${distanceKm}`);
    }

    // 3. Test ST_DWithin radius filtering (5 km vs 15 km)
    // A point 6 km away should NOT be within 5,000 meters, but SHOULD be within 10,000 meters
    const radiusRes = await client.query(`
      SELECT 
        ST_DWithin(
          ST_SetSRID(ST_MakePoint(77.7500, 12.9698), 4326)::geography,
          ST_SetSRID(ST_MakePoint(77.7011, 12.9569), 4326)::geography,
          5000
        ) AS within_5km,
        ST_DWithin(
          ST_SetSRID(ST_MakePoint(77.7500, 12.9698), 4326)::geography,
          ST_SetSRID(ST_MakePoint(77.7011, 12.9569), 4326)::geography,
          10000
        ) AS within_10km;
    `);
    console.log('✅ ST_DWithin within 5km:', radiusRes.rows[0].within_5km);
    console.log('✅ ST_DWithin within 10km:', radiusRes.rows[0].within_10km);

    if (radiusRes.rows[0].within_5km !== false || radiusRes.rows[0].within_10km !== true) {
      throw new Error('ST_DWithin radius filter failed!');
    }

    console.log('🎉 All PostGIS spatial verification checks passed!\n');
  } finally {
    client.release();
    await pool.end();
  }
}

testSpatialCapabilities()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Spatial test failed:', err);
    process.exit(1);
  });
