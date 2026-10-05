/**
 * Migration: Create Career Readiness & Skill Credibility Schema
 * Phase 2 — Skill Nexus Intelligence Layer
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/skillnexus'
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('--- Migrating: Career Readiness & Skill Credibility Tables ---');
    await client.query('BEGIN');

    // 1. Add credibility_score to student_skills if not exists
    await client.query(`
      ALTER TABLE student_skills
      ADD COLUMN IF NOT EXISTS credibility_score INT DEFAULT 0 CHECK (credibility_score BETWEEN 0 AND 100);
    `);
    console.log('  ✓ Column student_skills.credibility_score ready');

    // 2. career_readiness_scores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS career_readiness_scores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        overall_score INT NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
        technical_score INT NOT NULL DEFAULT 0 CHECK (technical_score BETWEEN 0 AND 100),
        soft_skills_score INT NOT NULL DEFAULT 0 CHECK (soft_skills_score BETWEEN 0 AND 100),
        projects_score INT NOT NULL DEFAULT 0 CHECK (projects_score BETWEEN 0 AND 100),
        certifications_score INT NOT NULL DEFAULT 0 CHECK (certifications_score BETWEEN 0 AND 100),
        assessments_score INT NOT NULL DEFAULT 0 CHECK (assessments_score BETWEEN 0 AND 100),
        industry_exposure_score INT NOT NULL DEFAULT 0 CHECK (industry_exposure_score BETWEEN 0 AND 100),
        interview_readiness_score INT NOT NULL DEFAULT 0 CHECK (interview_readiness_score BETWEEN 0 AND 100),
        component_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
        improvement_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
        recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
        calculation_version VARCHAR(20) NOT NULL DEFAULT '2.0.0',
        calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_career_readiness_student UNIQUE (student_id)
      );
      CREATE INDEX IF NOT EXISTS idx_career_readiness_student ON career_readiness_scores(student_id);
      CREATE INDEX IF NOT EXISTS idx_career_readiness_overall ON career_readiness_scores(overall_score DESC);
    `);
    console.log('  ✓ Table career_readiness_scores ready');

    // 3. career_readiness_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS career_readiness_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        overall_score INT NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
        technical_score INT NOT NULL DEFAULT 0,
        soft_skills_score INT NOT NULL DEFAULT 0,
        projects_score INT NOT NULL DEFAULT 0,
        certifications_score INT NOT NULL DEFAULT 0,
        assessments_score INT NOT NULL DEFAULT 0,
        industry_exposure_score INT NOT NULL DEFAULT 0,
        interview_readiness_score INT NOT NULL DEFAULT 0,
        calculation_version VARCHAR(20) NOT NULL DEFAULT '2.0.0',
        calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_readiness_history_student ON career_readiness_history(student_id, calculated_at DESC);
    `);
    console.log('  ✓ Table career_readiness_history ready');

    // 4. skill_credibility_scores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS skill_credibility_scores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        credibility_score INT NOT NULL DEFAULT 0 CHECK (credibility_score BETWEEN 0 AND 100),
        evidence_source_count INT NOT NULL DEFAULT 0,
        verification_strength VARCHAR(30) NOT NULL DEFAULT 'LOW',
        recency_score INT NOT NULL DEFAULT 0 CHECK (recency_score BETWEEN 0 AND 100),
        consistency_score INT NOT NULL DEFAULT 100 CHECK (consistency_score BETWEEN 0 AND 100),
        consistency_note TEXT,
        evidence_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
        calculation_version VARCHAR(20) NOT NULL DEFAULT '2.0.0',
        calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_skill_credibility_student_skill UNIQUE (student_id, skill_id)
      );
      CREATE INDEX IF NOT EXISTS idx_skill_credibility_student ON skill_credibility_scores(student_id);
      CREATE INDEX IF NOT EXISTS idx_skill_credibility_skill ON skill_credibility_scores(skill_id);
    `);
    console.log('  ✓ Table skill_credibility_scores ready');

    await client.query('COMMIT');
    console.log('✅ Career Readiness & Skill Credibility Migration complete.');
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
