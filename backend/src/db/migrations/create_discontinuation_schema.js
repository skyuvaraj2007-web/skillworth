/**
 * Migration: Create Course Discontinuation Schema
 * Extends enrollments table with discontinued_at, discontinuation_reason,
 * and updates status check constraint.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { Pool } = require('pg');

async function migrate() {
  console.log('🔄 Running Course Discontinuation Database Migration...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // 1. Add columns to enrollments
    await pool.query(`
      ALTER TABLE enrollments
      ADD COLUMN IF NOT EXISTS discontinued_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS discontinuation_reason TEXT;
    `);
    console.log('✔ Added discontinued_at and discontinuation_reason columns to enrollments.');

    // 2. Safely update status check constraint on enrollments if present
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'enrollments_status_check' 
          AND conrelid = 'enrollments'::regclass
        ) THEN
          ALTER TABLE enrollments DROP CONSTRAINT enrollments_status_check;
        END IF;

        ALTER TABLE enrollments 
        ADD CONSTRAINT enrollments_status_check 
        CHECK (status IN ('Enrolled', 'In Progress', 'Completed', 'Dropped', 'Discontinued'));
      END $$;
    `);
    console.log('✔ Updated enrollments status check constraint to include Discontinued.');

    console.log('✔ Course discontinuation migration complete.');
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
