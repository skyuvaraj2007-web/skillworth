const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function migratePassportSchema() {
  console.log('🔄 Checking / Migrating digital_passports schema via Direct PG Pool...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create digital_passports table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS digital_passports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        passport_uuid VARCHAR(64) UNIQUE NOT NULL,
        qr_hash VARCHAR(128) NOT NULL,
        is_public BOOLEAN DEFAULT true NOT NULL,
        privacy_settings JSONB DEFAULT '{"showEmail": false, "showRollNumber": false, "showCgpa": false, "showAssessments": true, "showProjects": true, "showCertificates": true, "showCourses": true, "showExperience": true}'::jsonb,
        issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('  ✅ digital_passports table created/verified.');

    // 2. Ensure privacy_settings and updated_at columns exist
    await client.query(`
      ALTER TABLE digital_passports 
        ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"showEmail": false, "showRollNumber": false, "showCgpa": false, "showAssessments": true, "showProjects": true, "showCertificates": true, "showCourses": true, "showExperience": true}'::jsonb,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('  ✅ privacy_settings and updated_at columns added/verified.');

    // 3. Index on passport_uuid
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_digital_passports_uuid ON digital_passports(passport_uuid);
    `);
    console.log('  ✅ idx_digital_passports_uuid index ensured.');

    await client.query('COMMIT');

    // 4. Reload PostgREST schema cache
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('  ✅ Sent NOTIFY pgrst, reload schema.');

    console.log('🎉 Passport schema migration complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migratePassportSchema()
    .then(() => pool.end())
    .catch(err => {
      console.error(err);
      pool.end();
      process.exit(1);
    });
}

module.exports = { migratePassportSchema };
