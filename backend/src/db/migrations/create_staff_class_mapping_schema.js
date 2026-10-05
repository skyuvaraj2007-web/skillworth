/**
 * Migration: create_staff_class_mapping_schema.js
 * Implements Institution -> Staff/Academician -> Class -> Student mapping tables.
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
    console.log('🔄 Beginning Staff-Class-Student Mapping schema migration...');
    await client.query('BEGIN');

    // 1. Ensure roles exist
    await client.query(`
      INSERT INTO roles (code, name, description)
      VALUES 
        ('FACULTY', 'Academician / Faculty', 'Faculty member or professor'),
        ('ACADEMICIAN', 'Academician', 'Academic staff and mentor'),
        ('STAFF', 'Academic Staff', 'Academician or teaching staff')
      ON CONFLICT (code) DO NOTHING;
    `);

    // 2. Create classes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        section VARCHAR(16),
        year_semester VARCHAR(64) DEFAULT '3rd Year / 5th Sem',
        batch VARCHAR(32) DEFAULT '2023-2027',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(institution_id, department_id, name)
      );
    `);

    // 3. Create staff_assignments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        assignment_type VARCHAR(64) NOT NULL DEFAULT 'Class Advisor',
        is_primary BOOLEAN DEFAULT false,
        status VARCHAR(32) DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Create student_staff_mapping table
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_staff_mapping (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assignment_id UUID REFERENCES staff_assignments(id) ON DELETE SET NULL,
        class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT true,
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ssm_student ON student_staff_mapping(student_id);
      CREATE INDEX IF NOT EXISTS idx_ssm_staff ON student_staff_mapping(staff_id);
      CREATE INDEX IF NOT EXISTS idx_ssm_class ON student_staff_mapping(class_id);
      CREATE INDEX IF NOT EXISTS idx_ssm_active ON student_staff_mapping(is_active);
    `);

    // 5. Enhance students table
    await client.query(`
      ALTER TABLE students
        ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS year_semester VARCHAR(64),
        ADD COLUMN IF NOT EXISTS age INT;
    `);

    // 6. Enhance academician_profiles table
    await client.query(`
      ALTER TABLE academician_profiles
        ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS age INT,
        ADD COLUMN IF NOT EXISTS qualification VARCHAR(255),
        ADD COLUMN IF NOT EXISTS specialization VARCHAR(255),
        ADD COLUMN IF NOT EXISTS experience VARCHAR(64),
        ADD COLUMN IF NOT EXISTS joining_date DATE,
        ADD COLUMN IF NOT EXISTS gender VARCHAR(32);
    `);

    // 7. Seed baseline institution "ABC Engineering College" if not existing
    const abcInstRes = await client.query(`
      INSERT INTO institutions (code, name, district, state, official_email, website_url, created_at, updated_at)
      VALUES 
        ('ABC-ENG', 'ABC Engineering College', 'Chennai', 'Tamil Nadu', 'principal@abceng.edu.in', 'https://abceng.edu.in', NOW(), NOW())
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `);
    const abcInstId = abcInstRes.rows[0]?.id || (await client.query("SELECT id FROM institutions WHERE code = 'ABC-ENG'")).rows[0].id;

    // Seed CSE department for ABC Engineering College
    const abcDeptRes = await client.query(`
      INSERT INTO departments (institution_id, code, name, created_at)
      VALUES ($1, 'CSE', 'Computer Science and Engineering', NOW())
      ON CONFLICT DO NOTHING
      RETURNING id;
    `, [abcInstId]);
    const abcDeptId = abcDeptRes.rows[0]?.id || (await client.query("SELECT id FROM departments WHERE institution_id = $1 AND code = 'CSE'", [abcInstId])).rows[0].id;

    // Seed classes: III CSE A and III CSE B for ABC Engineering College
    await client.query(`
      INSERT INTO classes (institution_id, department_id, name, section, year_semester, batch)
      VALUES 
        ($1, $2, 'III CSE A', 'A', '3rd Year / 5th Sem', '2023-2027'),
        ($1, $2, 'III CSE B', 'B', '3rd Year / 5th Sem', '2023-2027'),
        ($1, $2, 'II CSE A', 'A', '2nd Year / 3rd Sem', '2024-2028')
      ON CONFLICT (institution_id, department_id, name) DO NOTHING;
    `, [abcInstId, abcDeptId]);

    // Also seed classes for default institution VTI-73698
    const vtiRes = await client.query("SELECT id FROM institutions WHERE code = 'VTI-73698' LIMIT 1");
    if (vtiRes.rows.length > 0) {
      const vtiId = vtiRes.rows[0].id;
      const vtiDeptRes = await client.query(`
        INSERT INTO departments (institution_id, code, name, created_at)
        VALUES ($1, 'CSE', 'Computer Science & Engineering', NOW())
        ON CONFLICT DO NOTHING
        RETURNING id;
      `, [vtiId]);
      const vtiDeptId = vtiDeptRes.rows[0]?.id || (await client.query("SELECT id FROM departments WHERE institution_id = $1 AND code = 'CSE' LIMIT 1", [vtiId])).rows[0]?.id;

      if (vtiDeptId) {
        await client.query(`
          INSERT INTO classes (institution_id, department_id, name, section, year_semester, batch)
          VALUES 
            ($1, $2, 'III CSE A', 'A', '3rd Year / 5th Sem', '2023-2027'),
            ($1, $2, 'III CSE B', 'B', '3rd Year / 5th Sem', '2023-2027')
          ON CONFLICT (institution_id, department_id, name) DO NOTHING;
        `, [vtiId, vtiDeptId]);

        // Link existing faculty to III CSE A
        const facUserRes = await client.query("SELECT id FROM users WHERE email = 'faculty@skillnexus.edu.in' LIMIT 1");
        const classARes = await client.query("SELECT id FROM classes WHERE institution_id = $1 AND name = 'III CSE A' LIMIT 1", [vtiId]);
        if (facUserRes.rows.length > 0 && classARes.rows.length > 0) {
          const facId = facUserRes.rows[0].id;
          const classAId = classARes.rows[0].id;

          await client.query(`
            UPDATE academician_profiles 
            SET class_id = $1 
            WHERE user_id = $2 AND class_id IS NULL;
          `, [classAId, facId]);

          await client.query(`
            INSERT INTO staff_assignments (staff_id, institution_id, department_id, class_id, assignment_type, is_primary, status)
            VALUES ($1, $2, $3, $4, 'Class Advisor', true, 'ACTIVE')
            ON CONFLICT DO NOTHING;
          `, [facId, vtiId, vtiDeptId, classAId]);

          // Update existing students in VTI to III CSE A and map to faculty
          await client.query(`
            UPDATE students 
            SET class_id = $1 
            WHERE institution_id = $2 AND class_id IS NULL;
          `, [classAId, vtiId]);

          await client.query(`
            INSERT INTO student_staff_mapping (student_id, staff_id, class_id, is_active, assigned_at)
            SELECT s.id, $1, $2, true, NOW()
            FROM students s
            WHERE s.institution_id = $3 AND s.class_id = $2
            AND NOT EXISTS (
              SELECT 1 FROM student_staff_mapping m
              WHERE m.student_id = s.id AND m.staff_id = $1 AND m.is_active = true
            );
          `, [facId, classAId, vtiId]);
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Staff-Class-Student Mapping schema migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
