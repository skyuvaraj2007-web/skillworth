/**
 * Migration: Create Targeted Assessments Schema
 * Extends existing PostgreSQL assessment tables and creates assessment_targets.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { Pool } = require('pg');

async function migrate() {
  console.log('🔄 Running Targeted Assessments Database Migration...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // 1. Extend assessments table
    await pool.query(`
      ALTER TABLE assessments 
      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS instructions TEXT,
      ADD COLUMN IF NOT EXISTS assessment_type VARCHAR(64) DEFAULT 'GENERAL',
      ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '["Logical Reasoning", "Aptitude", "Programming"]'::jsonb,
      ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'DRAFT',
      ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS time_limit_minutes INT DEFAULT 45,
      ADD COLUMN IF NOT EXISTS total_marks INT DEFAULT 100,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

      CREATE INDEX IF NOT EXISTS idx_assessments_company ON assessments(company_id);
      CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type);
      CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
    `);
    console.log('✔ assessments table extended successfully.');

    // 2. Extend assessment_questions table
    await pool.query(`
      ALTER TABLE assessment_questions
      ADD COLUMN IF NOT EXISTS category VARCHAR(64),
      ADD COLUMN IF NOT EXISTS question_type VARCHAR(32) DEFAULT 'MCQ',
      ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS correct_answer TEXT,
      ADD COLUMN IF NOT EXISTS marks INT DEFAULT 1,
      ADD COLUMN IF NOT EXISTS programming_language VARCHAR(64),
      ADD COLUMN IF NOT EXISTS starter_code TEXT,
      ADD COLUMN IF NOT EXISTS input_description TEXT,
      ADD COLUMN IF NOT EXISTS output_description TEXT,
      ADD COLUMN IF NOT EXISTS constraints TEXT,
      ADD COLUMN IF NOT EXISTS test_cases JSONB DEFAULT '[]'::jsonb;

      CREATE INDEX IF NOT EXISTS idx_assessment_questions_asmt ON assessment_questions(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_assessment_questions_cat ON assessment_questions(category);
    `);
    console.log('✔ assessment_questions table extended successfully.');

    // 3. Create assessment_targets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessment_targets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
          student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
          assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
          status VARCHAR(32) DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'EXPIRED')) NOT NULL,
          started_at TIMESTAMPTZ,
          submitted_at TIMESTAMPTZ,
          score NUMERIC(5,2),
          total_marks INT DEFAULT 0,
          result_status VARCHAR(32) DEFAULT 'PENDING' CHECK (result_status IN ('PENDING', 'PASSED', 'FAILED')),
          feedback JSONB DEFAULT '{}'::jsonb,
          CONSTRAINT uq_assessment_student_target UNIQUE (assessment_id, student_id)
      );

      CREATE INDEX IF NOT EXISTS idx_asmt_targets_asmt ON assessment_targets(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_asmt_targets_student ON assessment_targets(student_id);
      CREATE INDEX IF NOT EXISTS idx_asmt_targets_inst ON assessment_targets(institution_id);
    `);
    console.log('✔ assessment_targets table created successfully.');

    // 4. Extend assessment_answers table
    await pool.query(`
      ALTER TABLE assessment_answers
      ADD COLUMN IF NOT EXISTS answer_text TEXT,
      ADD COLUMN IF NOT EXISTS marks_awarded NUMERIC(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS execution_result JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('✔ assessment_answers table extended successfully.');

    console.log('✨ ALL TARGETED ASSESSMENTS MIGRATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
