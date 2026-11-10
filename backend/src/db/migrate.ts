import { pool } from '../config/db';

export async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Running PostGIS and schema migrations...');
    await client.query('BEGIN');

    // 1. Extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');

    // 2. Types/Enums
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('builder', 'vendor');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('pending_verification', 'active', 'suspended');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE project_status AS ENUM ('open', 'closed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE bid_status AS ENUM ('submitted', 'accepted', 'rejected', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        role user_role NOT NULL,
        phone_number VARCHAR(20) NOT NULL UNIQUE,
        phone_verified BOOLEAN DEFAULT FALSE,
        email VARCHAR(255) UNIQUE,
        email_verified BOOLEAN DEFAULT FALSE,
        status user_status DEFAULT 'pending_verification',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Builder Profiles
    await client.query(`
      CREATE TABLE IF NOT EXISTS builder_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        address_text TEXT NOT NULL,
        location GEOGRAPHY(Point, 4326) NOT NULL,
        id_proof_url TEXT,
        id_proof_type VARCHAR(50) DEFAULT 'aadhaar',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_builder_profiles_location ON builder_profiles USING GIST (location);
    `);

    // 5. Vendor Profiles
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(200) NOT NULL,
        year_established INT NOT NULL,
        pan_number VARCHAR(10) NOT NULL,
        gst_number VARCHAR(15) NOT NULL,
        address_text TEXT NOT NULL,
        location GEOGRAPHY(Point, 4326) NOT NULL,
        catalog_categories TEXT[] DEFAULT '{}',
        rating NUMERIC(3, 2) DEFAULT 4.70,
        rating_count INT DEFAULT 12,
        id_proof_url TEXT,
        gst_cert_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_vendor_profiles_location ON vendor_profiles USING GIST (location);
    `);

    // 6. Projects Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        builder_id UUID NOT NULL REFERENCES builder_profiles(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        sub_item VARCHAR(100) NOT NULL,
        brand_preference VARCHAR(100),
        quantity NUMERIC(12, 2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        requirement_date DATE NOT NULL,
        transport_needed BOOLEAN DEFAULT FALSE,
        gst_number VARCHAR(15),
        notes TEXT,
        status project_status DEFAULT 'open',
        address_text TEXT NOT NULL,
        location GEOGRAPHY(Point, 4326) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_projects_location ON projects USING GIST (location);
      CREATE INDEX IF NOT EXISTS idx_projects_category_status ON projects (category, status);
    `);

    // 7. Bids Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bids (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
        base_unit_price NUMERIC(12, 2) NOT NULL,
        transport_fee NUMERIC(12, 2) DEFAULT 0,
        tax_rate_percent NUMERIC(5, 2) DEFAULT 18.00,
        total_amount NUMERIC(14, 2) NOT NULL,
        delivery_timeline_days INT DEFAULT 3,
        remarks TEXT,
        status bid_status DEFAULT 'submitted',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_vendor_project_bid UNIQUE (project_id, vendor_id)
      );
      CREATE INDEX IF NOT EXISTS idx_bids_project_status ON bids (project_id, status);
      CREATE INDEX IF NOT EXISTS idx_bids_vendor_status ON bids (vendor_id, status);
    `);

    // 8. Add 'completed' to bid_status enum
    await client.query(`
      DO $$ BEGIN
        ALTER TYPE bid_status ADD VALUE IF NOT EXISTS 'completed';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 9. Add rating columns to builder_profiles (vendors already have them)
    await client.query(`
      ALTER TABLE builder_profiles
        ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0;
    `);

    // 10. Bid Ratings Table (mutual ratings per completed bid)
    await client.query(`
      CREATE TABLE IF NOT EXISTS bid_ratings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
        reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
        review TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_rating_per_bid_per_reviewer UNIQUE (bid_id, reviewer_user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_bid_ratings_target_user ON bid_ratings (target_user_id);
      CREATE INDEX IF NOT EXISTS idx_bid_ratings_bid ON bid_ratings (bid_id);
    `);

    await client.query('COMMIT');
    console.log('✅ PostGIS migrations completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
