/**
 * Migration: create_matching_schema.js
 * Creates schema and tables for FEATURE 2: INDUSTRY <-> STUDENT SKILL MATCHING idempotently.
 * Tables / Columns modified:
 *  - opportunities: description, department, graduation_year, minimum_qualification, assessment_requirement, assessment_id, required_skills, preferred_skills, skill_weights
 *  - opportunity_matches: table for deterministic candidate match scoring, breakdown, and shortlists
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
    console.log('🔄 Beginning Industry <-> Student Matching schema migration...');
    await client.query('BEGIN');

    // 1. Extend opportunities table with rich matching criteria
    await client.query(`
      ALTER TABLE opportunities
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS department VARCHAR(100),
        ADD COLUMN IF NOT EXISTS graduation_year INT,
        ADD COLUMN IF NOT EXISTS minimum_qualification VARCHAR(100) DEFAULT 'Bachelor of Engineering (B.E. / B.Tech)',
        ADD COLUMN IF NOT EXISTS assessment_requirement BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS preferred_skills JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS skill_weights JSONB DEFAULT '{}'::jsonb;
    `);

    // 2. Create opportunity_matches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunity_matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        match_score INT NOT NULL,
        matched_skills JSONB DEFAULT '[]'::jsonb,
        missing_skills JSONB DEFAULT '[]'::jsonb,
        weak_skills JSONB DEFAULT '[]'::jsonb,
        strong_skills JSONB DEFAULT '[]'::jsonb,
        eligibility_failures JSONB DEFAULT '[]'::jsonb,
        is_shortlisted BOOLEAN DEFAULT FALSE,
        generated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_opportunity_student UNIQUE (opportunity_id, student_id)
      );
    `);

    // 3. Create indices for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_opportunity_matches_opp ON opportunity_matches(opportunity_id);
      CREATE INDEX IF NOT EXISTS idx_opportunity_matches_student ON opportunity_matches(student_id);
      CREATE INDEX IF NOT EXISTS idx_opportunity_matches_score ON opportunity_matches(match_score DESC);
      CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_id);
    `);

    // 4. Ensure we have seed sample industry opportunities with defined skill weights
    // Find or pick a company ID from companies
    const compRes = await client.query('SELECT id, company_name FROM companies LIMIT 1;');
    if (compRes.rows.length > 0) {
      const compId = compRes.rows[0].id;
      const compName = compRes.rows[0].company_name;

      const seedOpps = [
        {
          title: 'Full Stack Software Engineer Fellow',
          type: 'Full-Time',
          description: 'Build enterprise microservices and modern reactive interfaces for cloud platforms.',
          work_mode: 'Hybrid',
          location: 'Chennai, TN',
          min_cgpa: 7.0,
          min_readiness_score: 75,
          department: 'Computer Science and Engineering',
          graduation_year: 2026,
          minimum_qualification: 'B.E. / B.Tech (CSE, IT, AI & DS)',
          assessment_requirement: true,
          required_skills: [
            { name: 'JavaScript', weight: 0.25, required_score: 80, importance: 'CRITICAL' },
            { name: 'React', weight: 0.25, required_score: 75, importance: 'CRITICAL' },
            { name: 'Node.js', weight: 0.20, required_score: 70, importance: 'HIGH' },
            { name: 'SQL', weight: 0.15, required_score: 70, importance: 'HIGH' },
            { name: 'Git', weight: 0.15, required_score: 75, importance: 'MEDIUM' }
          ],
          preferred_skills: ['Docker', 'Cloud Computing', 'TypeScript'],
          skill_weights: {
            'JavaScript': 0.25,
            'React': 0.25,
            'Node.js': 0.20,
            'SQL': 0.15,
            'Git': 0.15
          }
        },
        {
          title: 'Data Intelligence & Analytics Intern',
          type: 'Internship',
          description: 'Transform complex organizational datasets into predictive dashboards and machine learning pipelines.',
          work_mode: 'Remote',
          location: 'Remote (India)',
          min_cgpa: 6.5,
          min_readiness_score: 70,
          department: 'Computer Science and Engineering',
          graduation_year: 2026,
          minimum_qualification: 'B.E. / B.Tech / MCA',
          assessment_requirement: false,
          required_skills: [
            { name: 'Python', weight: 0.30, required_score: 80, importance: 'CRITICAL' },
            { name: 'SQL', weight: 0.25, required_score: 75, importance: 'CRITICAL' },
            { name: 'Power BI', weight: 0.20, required_score: 70, importance: 'HIGH' },
            { name: 'Data Analytics', weight: 0.15, required_score: 70, importance: 'HIGH' },
            { name: 'Excel', weight: 0.10, required_score: 75, importance: 'MEDIUM' }
          ],
          preferred_skills: ['Machine Learning', 'Statistics', 'Generative AI'],
          skill_weights: {
            'Python': 0.30,
            'SQL': 0.25,
            'Power BI': 0.20,
            'Data Analytics': 0.15,
            'Excel': 0.10
          }
        },
        {
          title: 'Cloud Systems & DevOps Engineer',
          type: 'Full-Time',
          description: 'Maintain containerized Kubernetes infrastructure, automated CI/CD releases, and system reliability.',
          work_mode: 'Hybrid',
          location: 'Bengaluru / Chennai',
          min_cgpa: 7.0,
          min_readiness_score: 75,
          department: 'Computer Science and Engineering',
          graduation_year: 2026,
          minimum_qualification: 'B.E. / B.Tech',
          assessment_requirement: true,
          required_skills: [
            { name: 'Cloud Computing', weight: 0.30, required_score: 80, importance: 'CRITICAL' },
            { name: 'Docker', weight: 0.25, required_score: 75, importance: 'CRITICAL' },
            { name: 'Git', weight: 0.20, required_score: 75, importance: 'HIGH' },
            { name: 'Python', weight: 0.15, required_score: 70, importance: 'HIGH' },
            { name: 'Go', weight: 0.10, required_score: 65, importance: 'MEDIUM' }
          ],
          preferred_skills: ['Kubernetes', 'Linux', 'CI/CD'],
          skill_weights: {
            'Cloud Computing': 0.30,
            'Docker': 0.25,
            'Git': 0.20,
            'Python': 0.15,
            'Go': 0.10
          }
        }
      ];

      for (const opp of seedOpps) {
        await client.query(`
          INSERT INTO opportunities (
            company_id, title, opportunity_type, description, work_mode, location,
            min_cgpa, min_readiness_score, department, graduation_year, minimum_qualification,
            assessment_requirement, required_skills, preferred_skills, skill_weights, status, deadline
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'ACTIVE', NOW() + INTERVAL '60 days')
          ON CONFLICT DO NOTHING;
        `, [
          compId, opp.title, opp.type, opp.description, opp.work_mode, opp.location,
          opp.min_cgpa, opp.min_readiness_score, opp.department, opp.graduation_year, opp.minimum_qualification,
          opp.assessment_requirement, JSON.stringify(opp.required_skills), JSON.stringify(opp.preferred_skills), JSON.stringify(opp.skill_weights)
        ]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Industry <-> Student Matching schema migrated successfully!');
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
