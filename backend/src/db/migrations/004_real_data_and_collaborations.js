const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { Pool } = require('pg');

async function runMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('Running migration: 004_real_data_and_collaborations.js...');

    // 1. Ensure applications check constraint includes 'SELECTED_FOR_TEST'
    await pool.query(`
      ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_current_stage_check;
      ALTER TABLE applications ADD CONSTRAINT applications_current_stage_check 
      CHECK (current_stage IN (
        'Applied', 'Screened', 'Under Review', 'Shortlisted', 
        'SELECTED_FOR_TEST', 'Selected for Test', 'TEST_COMPLETED', 
        'Interview', 'Selected', 'Rejected', 'Joined', 'Accepted'
      ));
    `);
    console.log('✓ Updated applications stage check constraint');

    // 2. Peer Institution Collaborations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS institution_collaborations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        target_institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        status VARCHAR(32) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'ACTIVE', 'REJECTED')),
        message TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT uq_institution_collaboration UNIQUE (requester_institution_id, target_institution_id)
      );
      CREATE INDEX IF NOT EXISTS idx_inst_collab_req ON institution_collaborations(requester_institution_id);
      CREATE INDEX IF NOT EXISTS idx_inst_collab_tar ON institution_collaborations(target_institution_id);
      CREATE INDEX IF NOT EXISTS idx_inst_collab_status ON institution_collaborations(status);
    `);
    console.log('✓ Created/verified institution_collaborations table');

    // 3. Add message column to company_institution_partnerships
    await pool.query(`
      ALTER TABLE company_institution_partnerships 
      ADD COLUMN IF NOT EXISTS message TEXT,
      ADD COLUMN IF NOT EXISTS requested_by VARCHAR(32) DEFAULT 'COMPANY';
    `);
    console.log('✓ Enhanced company_institution_partnerships table');

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
