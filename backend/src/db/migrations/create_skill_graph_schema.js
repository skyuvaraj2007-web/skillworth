/**
 * Migration: create_skill_graph_schema.js
 * Creates schema tables, columns, indexes, and relationships for Skill Graph 2.0.
 * Idempotent migration for PostgreSQL.
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
    console.log('🔄 Beginning Skill Graph 2.0 schema migration...');
    await client.query('BEGIN');

    // 1. Upgrade student_skills table with Skill Graph 2.0 fields
    await client.query(`
      ALTER TABLE student_skills
        ADD COLUMN IF NOT EXISTS proficiency_score INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS proficiency_level VARCHAR(50) DEFAULT 'Beginner',
        ADD COLUMN IF NOT EXISTS evidence_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS assessment_score INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS project_evidence JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS certification_evidence JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS industry_evidence JSONB DEFAULT '[]'::jsonb;
    `);

    // 2. Upgrade skill_evidence table with standardized Skill Graph 2.0 columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS skill_evidence (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
        evidence_type VARCHAR(100) NOT NULL,
        evidence_id VARCHAR(255),
        title VARCHAR(255),
        score NUMERIC(5,2) DEFAULT 0,
        verification_status VARCHAR(50) DEFAULT 'VERIFIED',
        confidence NUMERIC(5,2) DEFAULT 80.0,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Add any missing columns to existing skill_evidence if it was already created
    await client.query(`
      ALTER TABLE skill_evidence
        ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS evidence_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS title VARCHAR(255),
        ADD COLUMN IF NOT EXISTS score NUMERIC(5,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,2) DEFAULT 80.0,
        ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
    `);

    // Indexes for skill_evidence
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_skill_evidence_student ON skill_evidence (student_id);
      CREATE INDEX IF NOT EXISTS idx_skill_evidence_skill ON skill_evidence (skill_id);
      CREATE INDEX IF NOT EXISTS idx_skill_evidence_type ON skill_evidence (evidence_type);
      CREATE INDEX IF NOT EXISTS idx_student_skills_student_proficiency ON student_skills (student_id, proficiency_score);
    `);

    // 3. Create skill_relationships table for Skill Graph Network
    await client.query(`
      CREATE TABLE IF NOT EXISTS skill_relationships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        target_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        relationship_type VARCHAR(50) NOT NULL DEFAULT 'RELATED',
        strength NUMERIC(3,2) NOT NULL DEFAULT 0.85,
        description VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_skill_relationship UNIQUE (source_skill_id, target_skill_id)
      );
      CREATE INDEX IF NOT EXISTS idx_skill_rel_source ON skill_relationships (source_skill_id);
      CREATE INDEX IF NOT EXISTS idx_skill_rel_target ON skill_relationships (target_skill_id);
    `);

    // 4. Seed Canonical Skill Relationships between real database skills
    const skillsRes = await client.query(`SELECT id, name FROM skills`);
    const skillMap = {};
    skillsRes.rows.forEach(s => {
      skillMap[s.name.toLowerCase().trim()] = s.id;
    });

    const canonicalEdges = [
      { from: 'python', to: 'sql', type: 'COMPLEMENTARY', strength: 0.90 },
      { from: 'python', to: 'machine learning', type: 'ADVANCEMENT', strength: 0.95 },
      { from: 'machine learning', to: 'deep learning', type: 'ADVANCEMENT', strength: 0.92 },
      { from: 'python', to: 'data science', type: 'ADVANCEMENT', strength: 0.94 },
      { from: 'javascript', to: 'typescript', type: 'ADVANCEMENT', strength: 0.88 },
      { from: 'javascript', to: 'react', type: 'ADVANCEMENT', strength: 0.92 },
      { from: 'react', to: 'web development', type: 'RELATED', strength: 0.90 },
      { from: 'sql', to: 'database management', type: 'RELATED', strength: 0.95 },
      { from: 'aws', to: 'cloud computing', type: 'RELATED', strength: 0.95 },
      { from: 'aws', to: 'devops', type: 'COMPLEMENTARY', strength: 0.88 },
      { from: 'docker', to: 'kubernetes', type: 'ADVANCEMENT', strength: 0.92 },
      { from: 'c++', to: 'data structures', type: 'PREREQUISITE', strength: 0.90 },
      { from: 'java', to: 'data structures', type: 'PREREQUISITE', strength: 0.90 },
      { from: 'cybersecurity', to: 'network security', type: 'ADVANCEMENT', strength: 0.91 }
    ];

    for (const edge of canonicalEdges) {
      const srcId = skillMap[edge.from];
      const tgtId = skillMap[edge.to];
      if (srcId && tgtId && srcId !== tgtId) {
        await client.query(`
          INSERT INTO skill_relationships (source_skill_id, target_skill_id, relationship_type, strength, description)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (source_skill_id, target_skill_id) DO UPDATE
          SET relationship_type = EXCLUDED.relationship_type, strength = EXCLUDED.strength
        `, [srcId, tgtId, edge.type, edge.strength, `${edge.from} -> ${edge.to}`]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Skill Graph 2.0 schema migration successfully executed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Skill Graph 2.0 schema migration failed:', err.message);
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
