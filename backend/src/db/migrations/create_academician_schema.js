/**
 * Migration: create_academician_schema.js
 * Creates tables and constraints for Academician / Faculty module in PostgreSQL idempotently.
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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
    console.log('🔄 Beginning Academician schema migration...');
    await client.query('BEGIN');

    // 1. Ensure FACULTY and ACADEMICIAN roles exist
    await client.query(`
      INSERT INTO roles (code, name, description)
      VALUES 
        ('FACULTY', 'Academician / Faculty', 'Faculty member, professor, or course instructor'),
        ('ACADEMICIAN', 'Academician', 'Academic staff and mentor')
      ON CONFLICT (code) DO NOTHING;
    `);

    // 2. Add columns to courses if missing
    await client.query(`
      ALTER TABLE courses 
        ADD COLUMN IF NOT EXISTS academician_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS skill_category VARCHAR(100),
        ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
        ADD COLUMN IF NOT EXISTS learning_objectives JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS duration_text VARCHAR(64) DEFAULT '8 Weeks';
    `);

    // 3. Add columns to assessments if missing
    await client.query(`
      ALTER TABLE assessments
        ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS academician_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS assessment_type VARCHAR(64) DEFAULT 'Technical',
        ADD COLUMN IF NOT EXISTS total_marks INT DEFAULT 100,
        ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '{}'::jsonb;
    `);

    // 4. Create academician_profiles
    await client.query(`
      CREATE TABLE IF NOT EXISTS academician_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        faculty_id VARCHAR(64) UNIQUE,
        full_name VARCHAR(150) NOT NULL,
        designation VARCHAR(150) DEFAULT 'Associate Professor',
        official_email VARCHAR(255) NOT NULL,
        phone VARCHAR(32),
        cabin_location VARCHAR(150),
        bio TEXT,
        qualifications JSONB DEFAULT '[]'::jsonb,
        specializations JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT uq_academician_user UNIQUE (user_id)
      );
    `);

    // 5. Create mentorships
    await client.query(`
      CREATE TABLE IF NOT EXISTS mentorships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        academician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED', 'REJECTED')),
        goals TEXT,
        faculty_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT uq_academician_student_mentorship UNIQUE (academician_id, student_id)
      );
    `);

    // 6. Create mentorship_sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS mentorship_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mentorship_id UUID REFERENCES mentorships(id) ON DELETE CASCADE,
        academician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        topic VARCHAR(255),
        scheduled_at TIMESTAMPTZ NOT NULL,
        duration_minutes INT DEFAULT 30 NOT NULL,
        meeting_link VARCHAR(255),
        status VARCHAR(32) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
        notes TEXT,
        action_items JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // 7. Create student_faculty_remarks
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_faculty_remarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        academician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        remarks TEXT NOT NULL,
        category VARCHAR(64) DEFAULT 'Academic Progress',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // 8. Create course_assignments (Faculty assigning courses to students with skill gaps)
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        due_date TIMESTAMPTZ,
        notes TEXT,
        status VARCHAR(32) DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED')),
        CONSTRAINT uq_student_course_assignment UNIQUE (course_id, student_id)
      );
    `);

    // 9. Create skill_gap_records
    await client.query(`
      CREATE TABLE IF NOT EXISTS skill_gap_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        skill_name VARCHAR(100) NOT NULL,
        skill_category VARCHAR(100) DEFAULT 'Technical',
        current_score INT DEFAULT 0,
        required_score INT DEFAULT 75,
        severity VARCHAR(32) DEFAULT 'MODERATE',
        recommended_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
        recommended_assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
        status VARCHAR(32) DEFAULT 'OPEN',
        detected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT uq_student_skill_gap UNIQUE (student_id, skill_name)
      );
    `);

    // 10. Seed default Faculty Demo Account if not present
    // Pick an existing institution
    const instRes = await client.query('SELECT id, code, name FROM institutions LIMIT 1');
    if (instRes.rows.length > 0) {
      const inst = instRes.rows[0];
      const facultyEmail = 'faculty@skillnexus.edu.in';
      const facultyPassHash = bcrypt.hashSync('Faculty@123', 10);

      let facultyUser = await client.query('SELECT id FROM users WHERE lower(email) = lower($1)', [facultyEmail]);
      let userId;
      if (facultyUser.rows.length === 0) {
        const uInsert = await client.query(`
          INSERT INTO users (email, password_hash, is_active, created_at, updated_at)
          VALUES ($1, $2, true, NOW(), NOW())
          RETURNING id;
        `, [facultyEmail, facultyPassHash]);
        userId = uInsert.rows[0].id;
        console.log('✅ Created faculty demo user:', facultyEmail);
      } else {
        userId = facultyUser.rows[0].id;
      }

      // Assign FACULTY role
      const roleRes = await client.query("SELECT id FROM roles WHERE code = 'FACULTY' LIMIT 1");
      if (roleRes.rows.length > 0) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, role_id) DO NOTHING;
        `, [userId, roleRes.rows[0].id]);
      }

      // Link in institution_members
      await client.query(`
        INSERT INTO institution_members (institution_id, user_id, member_role, designation, is_active)
        VALUES ($1, $2, 'FACULTY', 'Senior Professor & Skill Mentor', true)
        ON CONFLICT (institution_id, user_id) DO UPDATE 
        SET member_role = 'FACULTY', designation = 'Senior Professor & Skill Mentor';
      `, [inst.id, userId]);

      // Create academician profile
      await client.query(`
        INSERT INTO academician_profiles (
          user_id, institution_id, faculty_id, full_name, designation,
          official_email, phone, cabin_location, bio, qualifications, specializations
        )
        VALUES (
          $1, $2, 'FAC-VTI-001', 'Dr. Rajesh Sharma', 'Professor & Dean of Academic Excellence',
          $3, '+91 98765 43210', 'Block C, Room 402',
          'Senior faculty with 15+ years experience in computer science education, curriculum design, and industry-aligned skill mentorship.',
          '["Ph.D. in Computer Science", "M.Tech in Software Engineering", "B.Tech in CSE"]'::jsonb,
          '["Distributed Systems", "Cloud Computing", "Data Structures & Algorithms", "Full Stack Development"]'::jsonb
        )
        ON CONFLICT (user_id) DO UPDATE 
        SET full_name = 'Dr. Rajesh Sharma', designation = 'Professor & Dean of Academic Excellence';
      `, [userId, inst.id, facultyEmail]);

      // Also ensure some sample courses and assessments are linked to this institution
      await client.query(`
        UPDATE courses 
        SET institution_id = $1, academician_id = $2
        WHERE institution_id IS NULL AND id IN (SELECT id FROM courses LIMIT 3);
      `, [inst.id, userId]);

      await client.query(`
        UPDATE assessments
        SET institution_id = $1, academician_id = $2
        WHERE institution_id IS NULL AND id IN (SELECT id FROM assessments LIMIT 2);
      `, [inst.id, userId]);

      // Link a couple of students from the institution as mentees
      const stuRes = await client.query('SELECT id FROM students WHERE institution_id = $1 LIMIT 3', [inst.id]);
      for (const stu of stuRes.rows) {
        await client.query(`
          INSERT INTO mentorships (academician_id, student_id, status, goals, faculty_notes)
          VALUES ($1, $2, 'ACTIVE', 'Achieve 85%+ readiness in Cloud and Full Stack domains', 'Regular weekly progress reviews. Strong technical aptitude.')
          ON CONFLICT (academician_id, student_id) DO NOTHING;
        `, [userId, stu.id]);

        // Add a sample scheduled session
        await client.query(`
          INSERT INTO mentorship_sessions (
            academician_id, student_id, title, topic, scheduled_at, duration_minutes, meeting_link, status, notes
          )
          VALUES (
            $1, $2, 'System Architecture & Skill Gap Consultation', 'Reviewing Distributed Systems progress and aptitude benchmark',
            NOW() + INTERVAL '2 days', 45, 'https://meet.skillnexus.edu.in/fac-vti-001', 'SCHEDULED', 'Discuss progress on modular projects.'
          )
          ON CONFLICT DO NOTHING;
        `, [userId, stu.id]);

        // Add faculty remark
        await client.query(`
          INSERT INTO student_faculty_remarks (student_id, academician_id, remarks, category)
          VALUES ($1, $2, 'Consistently proactive in course assignments. Needs slight boost in Quantitative Aptitude.', 'Academic Review')
          ON CONFLICT DO NOTHING;
        `, [stu.id, userId]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Academician schema migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(() => process.exit(1));
