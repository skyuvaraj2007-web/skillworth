const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Ensuring tables student_skill_history and student_performance exist...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_skill_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
      skill_name VARCHAR(255),
      previous_score INTEGER,
      new_score INTEGER,
      growth_percentage NUMERIC,
      assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
      source VARCHAR(100) DEFAULT 'Diagnostic Assessment',
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_performance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
      course_progress NUMERIC DEFAULT 0,
      avg_skill_score NUMERIC DEFAULT 0,
      avg_assessment_score NUMERIC DEFAULT 0,
      certificates_count INTEGER DEFAULT 0,
      projects_count INTEGER DEFAULT 0,
      readiness_score NUMERIC DEFAULT 0,
      readiness_status VARCHAR(50) DEFAULT 'Needs Support',
      last_activity TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_student_perf UNIQUE (student_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_lesson_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      module_id UUID,
      lesson_id VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'Completed',
      completed_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_enrollment_lesson UNIQUE (enrollment_id, lesson_id)
    );

    ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS subject VARCHAR(255);
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS target_classes JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE course_assignments ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
    ALTER TABLE course_assignments ADD COLUMN IF NOT EXISTS target_type VARCHAR(50) DEFAULT 'student';
    ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id) ON DELETE SET NULL;
  `);

  console.log('Tables and columns created or already present.');
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
