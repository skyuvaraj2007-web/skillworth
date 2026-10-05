/**
 * Migration: create_skill_gap_schema.js
 * Creates schema and tables for FEATURE 1: AI SKILL GAP ANALYSIS idempotently.
 * Tables created:
 *  - career_roles
 *  - role_required_skills
 *  - skill_gap_reports
 *  - learning_recommendations
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
    console.log('🔄 Beginning AI Skill Gap schema migration...');
    await client.query('BEGIN');

    // 1. Create career_roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS career_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        min_readiness_score INT DEFAULT 70,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Create role_required_skills table
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_required_skills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL REFERENCES career_roles(id) ON DELETE CASCADE,
        skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
        skill_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        importance VARCHAR(32) DEFAULT 'HIGH', -- 'CRITICAL', 'HIGH', 'MEDIUM', 'PREFERRED'
        required_score INT DEFAULT 75, -- target benchmark out of 100
        min_level VARCHAR(32) DEFAULT 'Intermediate', -- 'Beginner', 'Intermediate', 'Advanced', 'Expert'
        weight NUMERIC(4,2) DEFAULT 1.0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Create skill_gap_reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS skill_gap_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        target_type VARCHAR(32) NOT NULL, -- 'CAREER_ROLE' or 'OPPORTUNITY'
        role_id UUID REFERENCES career_roles(id) ON DELETE SET NULL,
        opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
        target_title VARCHAR(255) NOT NULL,
        overall_readiness INT DEFAULT 0,
        strong_count INT DEFAULT 0,
        good_count INT DEFAULT 0,
        improve_count INT DEFAULT 0,
        missing_count INT DEFAULT 0,
        skill_analysis JSONB DEFAULT '[]'::jsonb,
        ai_explanation TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Create learning_recommendations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS learning_recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL REFERENCES skill_gap_reports(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        skill_name VARCHAR(255) NOT NULL,
        gap_status VARCHAR(32) NOT NULL, -- 'Needs Improvement', 'Missing'
        item_type VARCHAR(32) NOT NULL, -- 'COURSE', 'ASSESSMENT', 'PROJECT'
        item_id UUID,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        reason TEXT NOT NULL,
        action_url VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Ensure student_skills has convenient columns for normalization
    await client.query(`
      ALTER TABLE student_skills
        ADD COLUMN IF NOT EXISTS skill_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS category VARCHAR(100),
        ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'Profile Skill',
        ADD COLUMN IF NOT EXISTS score INT DEFAULT 60;
    `);

    // Create index on student_skills and reports
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_student_skills_student_id ON student_skills(student_id);
      CREATE INDEX IF NOT EXISTS idx_role_required_skills_role_id ON role_required_skills(role_id);
      CREATE INDEX IF NOT EXISTS idx_skill_gap_reports_student ON skill_gap_reports(student_id);
      CREATE INDEX IF NOT EXISTS idx_learning_rec_report ON learning_recommendations(report_id);
    `);

    // 6. Seed Career Roles & Required Skills
    const seedRoles = [
      {
        title: 'Full Stack Developer',
        slug: 'full-stack-developer',
        category: 'Software Engineering',
        description: 'Designs and implements end-to-end web applications with modern frontend and backend architectures.',
        min_readiness_score: 75,
        skills: [
          { name: 'JavaScript', category: 'Programming', importance: 'CRITICAL', required_score: 80, min_level: 'Advanced', weight: 1.5 },
          { name: 'React', category: 'Web Development', importance: 'CRITICAL', required_score: 80, min_level: 'Intermediate', weight: 1.5 },
          { name: 'Node.js', category: 'Programming', importance: 'HIGH', required_score: 75, min_level: 'Intermediate', weight: 1.2 },
          { name: 'SQL', category: 'Database', importance: 'HIGH', required_score: 75, min_level: 'Intermediate', weight: 1.0 },
          { name: 'Git', category: 'DevOps', importance: 'HIGH', required_score: 80, min_level: 'Intermediate', weight: 1.0 },
          { name: 'Docker', category: 'Cloud & Distributed', importance: 'MEDIUM', required_score: 70, min_level: 'Beginner', weight: 0.8 },
          { name: 'Cloud Computing', category: 'Cloud & Distributed', importance: 'MEDIUM', required_score: 65, min_level: 'Beginner', weight: 0.8 }
        ]
      },
      {
        title: 'Data Analyst',
        slug: 'data-analyst',
        category: 'Data & AI',
        description: 'Transforms complex raw datasets into actionable intelligence through SQL, Python, and visualization tools.',
        min_readiness_score: 70,
        skills: [
          { name: 'SQL', category: 'Database', importance: 'CRITICAL', required_score: 85, min_level: 'Advanced', weight: 1.5 },
          { name: 'Python', category: 'Programming', importance: 'CRITICAL', required_score: 80, min_level: 'Intermediate', weight: 1.4 },
          { name: 'Power BI', category: 'Data & AI', importance: 'HIGH', required_score: 75, min_level: 'Intermediate', weight: 1.2 },
          { name: 'Data Analytics', category: 'Data & AI', importance: 'HIGH', required_score: 75, min_level: 'Intermediate', weight: 1.1 },
          { name: 'Excel', category: 'Data & AI', importance: 'HIGH', required_score: 80, min_level: 'Advanced', weight: 1.0 }
        ]
      },
      {
        title: 'AI / Machine Learning Engineer',
        slug: 'ai-ml-engineer',
        category: 'Data & AI',
        description: 'Architects, trains, and operationalizes machine learning, deep learning, and generative AI models.',
        min_readiness_score: 80,
        skills: [
          { name: 'Python', category: 'Programming', importance: 'CRITICAL', required_score: 85, min_level: 'Advanced', weight: 1.5 },
          { name: 'Machine Learning', category: 'Data & AI', importance: 'CRITICAL', required_score: 80, min_level: 'Intermediate', weight: 1.5 },
          { name: 'Generative AI', category: 'Data & AI', importance: 'HIGH', required_score: 75, min_level: 'Intermediate', weight: 1.2 },
          { name: 'SQL', category: 'Database', importance: 'HIGH', required_score: 70, min_level: 'Intermediate', weight: 1.0 },
          { name: 'Data Analytics', category: 'Data & AI', importance: 'HIGH', required_score: 75, min_level: 'Intermediate', weight: 1.0 }
        ]
      },
      {
        title: 'Cloud & DevOps Architect',
        slug: 'cloud-devops-architect',
        category: 'Cloud & Distributed',
        description: 'Designs resilient cloud infrastructure, automates CI/CD deployment pipelines, and manages containerized clusters.',
        min_readiness_score: 75,
        skills: [
          { name: 'Cloud Computing', category: 'Cloud & Distributed', importance: 'CRITICAL', required_score: 85, min_level: 'Advanced', weight: 1.5 },
          { name: 'Docker', category: 'Cloud & Distributed', importance: 'CRITICAL', required_score: 80, min_level: 'Intermediate', weight: 1.4 },
          { name: 'Git', category: 'DevOps', importance: 'HIGH', required_score: 80, min_level: 'Intermediate', weight: 1.1 },
          { name: 'Python', category: 'Programming', importance: 'HIGH', required_score: 70, min_level: 'Intermediate', weight: 1.0 },
          { name: 'Go', category: 'Programming', importance: 'MEDIUM', required_score: 65, min_level: 'Intermediate', weight: 0.8 }
        ]
      },
      {
        title: 'Cybersecurity Analyst',
        slug: 'cybersecurity-analyst',
        category: 'Security & Systems',
        description: 'Defends networked computer systems and applications against security vulnerabilities and cyber threats.',
        min_readiness_score: 75,
        skills: [
          { name: 'Python', category: 'Programming', importance: 'HIGH', required_score: 75, min_level: 'Intermediate', weight: 1.2 },
          { name: 'Cloud Computing', category: 'Cloud & Distributed', importance: 'HIGH', required_score: 75, min_level: 'Intermediate', weight: 1.2 },
          { name: 'SQL', category: 'Database', importance: 'MEDIUM', required_score: 70, min_level: 'Intermediate', weight: 1.0 },
          { name: 'Git', category: 'DevOps', importance: 'MEDIUM', required_score: 70, min_level: 'Beginner', weight: 0.8 }
        ]
      }
    ];

    for (const r of seedRoles) {
      const roleRes = await client.query(`
        INSERT INTO career_roles (title, slug, category, description, min_readiness_score)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (title) DO UPDATE
          SET slug = EXCLUDED.slug,
              category = EXCLUDED.category,
              description = EXCLUDED.description,
              min_readiness_score = EXCLUDED.min_readiness_score
        RETURNING id;
      `, [r.title, r.slug, r.category, r.description, r.min_readiness_score]);

      const roleId = roleRes.rows[0].id;

      for (const sk of r.skills) {
        // Try linking to existing skills table ID
        const skillLookup = await client.query(`
          SELECT id FROM skills WHERE name ILIKE $1 LIMIT 1;
        `, [sk.name]);
        const skillId = skillLookup.rows[0]?.id || null;

        await client.query(`
          DELETE FROM role_required_skills WHERE role_id = $1 AND skill_name = $2;
        `, [roleId, sk.name]);

        await client.query(`
          INSERT INTO role_required_skills (role_id, skill_id, skill_name, category, importance, required_score, min_level, weight)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `, [roleId, skillId, sk.name, sk.category, sk.importance, sk.required_score, sk.min_level, sk.weight]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ AI Skill Gap schema and benchmark roles migrated successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigration().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runMigration };
