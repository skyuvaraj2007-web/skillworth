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
  console.log('Running comprehensive migration...');

  // 1. Soft delete for courses
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL`);

  // 2. Soft delete for assessments
  await pool.query(`ALTER TABLE assessments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE assessments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE assessments ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL`);

  // 3. student_certificates table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_certificates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      issuing_organization VARCHAR(255),
      certificate_type VARCHAR(100),
      skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
      course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
      issue_date DATE,
      expiry_date DATE,
      certificate_number VARCHAR(255),
      description TEXT,
      file_url TEXT,
      verification_url TEXT,
      status VARCHAR(50) DEFAULT 'PENDING_ACADEMICIAN',
      academician_verified_at TIMESTAMPTZ,
      academician_verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
      institution_verified_at TIMESTAMPTZ,
      institution_verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
      uploaded_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 4. student_projects table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      project_type VARCHAR(100),
      technology_stack JSONB DEFAULT '[]'::jsonb,
      skills_used JSONB DEFAULT '[]'::jsonb,
      role VARCHAR(255),
      start_date DATE,
      end_date DATE,
      team_members JSONB DEFAULT '[]'::jsonb,
      github_url TEXT,
      live_demo_url TEXT,
      documentation_file_url TEXT,
      image_url TEXT,
      status VARCHAR(50) DEFAULT 'PENDING_ACADEMICIAN',
      academician_verified_at TIMESTAMPTZ,
      academician_verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
      institution_verified_at TIMESTAMPTZ,
      institution_verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
      uploaded_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 5. achievement_verifications table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS achievement_verifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      achievement_type VARCHAR(50) NOT NULL,
      achievement_id UUID NOT NULL,
      reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
      reviewer_role VARCHAR(50),
      action VARCHAR(50) NOT NULL,
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 6. skill_assignments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS skill_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
      assigned_at TIMESTAMPTZ DEFAULT NOW(),
      status VARCHAR(50) DEFAULT 'Active',
      due_date TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT true,
      CONSTRAINT uq_skill_student UNIQUE(skill_id, student_id)
    )
  `);

  // 7. Add assigned_by to enrollments (might already exist)
  await pool.query(`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id) ON DELETE SET NULL`);

  // 8. industry_institution_collaborations table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS industry_institution_collaborations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      industry_id UUID REFERENCES users(id) ON DELETE CASCADE,
      institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'ACTIVE',
      start_date DATE,
      end_date DATE,
      sharing_enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_industry_institution UNIQUE(industry_id, institution_id)
    )
  `);

  console.log('All migrations completed successfully!');
  await pool.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
