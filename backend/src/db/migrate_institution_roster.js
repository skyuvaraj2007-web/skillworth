const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool();

async function runMigration() {
  console.log('================================================================');
  console.log('  SKILL NEXUS AI — INSTITUTION ROSTER & ONBOARDING MIGRATION   ');
  console.log('================================================================\n');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('[1/4] Adding additive columns to users table...');
    await client.query(`
      ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS account_status VARCHAR(32) DEFAULT 'ACTIVE',
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ;
    `);

    // Backfill baseline users
    await client.query(`
      UPDATE users 
      SET account_status = 'ACTIVE', email_verified = true 
      WHERE account_status IS NULL OR email_verified IS NULL;
    `);
    console.log('  ✅ users columns and baseline states ready');

    console.log('[2/4] Adding additive columns to students table...');
    await client.query(`
      ALTER TABLE students 
        ADD COLUMN IF NOT EXISTS phone_number VARCHAR(32);
    `);
    console.log('  ✅ students.phone_number ready');

    console.log('[3/4] Adding additive columns to institutions table...');
    await client.query(`
      ALTER TABLE institutions 
        ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS address TEXT;
    `);
    // Existing baseline institutions (e.g. TN010) are marked setup_completed = true
    await client.query(`
      UPDATE institutions 
      SET setup_completed = true 
      WHERE setup_completed IS NULL OR setup_completed = false;
    `);
    console.log('  ✅ institutions setup columns ready');

    console.log('[4/4] Creating roster_imports audit table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS roster_imports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        file_name VARCHAR(255) NOT NULL,
        total_rows INT DEFAULT 0,
        new_count INT DEFAULT 0,
        updated_count INT DEFAULT 0,
        unchanged_count INT DEFAULT 0,
        error_count INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'COMPLETED',
        error_log JSONB,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_roster_imports_inst ON roster_imports(institution_id);
    `);
    console.log('  ✅ roster_imports table ready');

    await client.query('COMMIT');
    console.log('\n================================================================');
    console.log('       MIGRATION COMPLETED SUCCESSFULLY (ZERO DATA LOSS)        ');
    console.log('================================================================');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

runMigration().catch(err => {
  process.exit(1);
});
