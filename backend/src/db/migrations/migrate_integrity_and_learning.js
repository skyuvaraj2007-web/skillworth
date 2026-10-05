/**
 * Migration: migrate_integrity_and_learning.js
 * Creates schema tables for Nexus Assessment Guard and Question Analytics idempotently in PostgreSQL.
 */

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

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Beginning Nexus Assessment Guard schema migration...');
    await client.query('BEGIN');

    // 1. assessment_monitoring_sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessment_monitoring_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        consent_given BOOLEAN NOT NULL DEFAULT FALSE,
        camera_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        microphone_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        monitoring_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        status VARCHAR(64) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. assessment_integrity_events
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessment_integrity_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES assessment_monitoring_sessions(id) ON DELETE CASCADE,
        assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        event_type VARCHAR(128) NOT NULL,
        event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        duration_seconds INT NOT NULL DEFAULT 0,
        confidence NUMERIC(5,2) DEFAULT 100.00,
        severity VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
        question_id VARCHAR(128),
        metadata JSONB DEFAULT '{}'::jsonb,
        review_status VARCHAR(64) NOT NULL DEFAULT 'PENDING_REVIEW',
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 3. assessment_question_attempts
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessment_question_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        question_id VARCHAR(128) NOT NULL,
        answer TEXT,
        score NUMERIC(8,2) NOT NULL DEFAULT 0,
        is_correct BOOLEAN NOT NULL DEFAULT FALSE,
        time_spent_seconds INT NOT NULL DEFAULT 0,
        attempt_number INT NOT NULL DEFAULT 1,
        skill_tag VARCHAR(128),
        difficulty VARCHAR(64),
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Indexes for rapid filtering and reporting
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ams_assessment_student ON assessment_monitoring_sessions (assessment_id, student_id);
      CREATE INDEX IF NOT EXISTS idx_ams_status ON assessment_monitoring_sessions (status);
      CREATE INDEX IF NOT EXISTS idx_aie_session ON assessment_integrity_events (session_id);
      CREATE INDEX IF NOT EXISTS idx_aie_assessment_student ON assessment_integrity_events (assessment_id, student_id);
      CREATE INDEX IF NOT EXISTS idx_aie_review_status ON assessment_integrity_events (review_status);
      CREATE INDEX IF NOT EXISTS idx_aie_severity ON assessment_integrity_events (severity);
      CREATE INDEX IF NOT EXISTS idx_aqa_assessment_student ON assessment_question_attempts (assessment_id, student_id);
      CREATE INDEX IF NOT EXISTS idx_aqa_question ON assessment_question_attempts (question_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Nexus Assessment Guard schema migration successfully executed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigration().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runMigration };
