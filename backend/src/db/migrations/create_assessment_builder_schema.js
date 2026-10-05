/**
 * Migration: create_assessment_builder_schema.js
 * Creates schema and tables for FEATURE 3: INDUSTRY ASSESSMENT BUILDER idempotently.
 * 
 * Modifies/Creates:
 * 1. assessments: adds opportunity_id, skills, skill_weights, attempts_allowed, random_order, random_options, settings
 * 2. question_bank: industry reusable question repository across MCQ, Multiple Answer, Numerical, Programming, Logical, Aptitude
 * 3. assessment_candidates: view / table referencing assessment_targets
 * 4. Seeds question_bank with rich sample questions
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
    console.log('🔄 Beginning Industry Assessment Builder schema migration...');
    await client.query('BEGIN');

    // 1. Extend assessments table with Feature 3 fields
    await client.query(`
      ALTER TABLE assessments
        ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS skill_weights JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS attempts_allowed INT DEFAULT 1,
        ADD COLUMN IF NOT EXISTS random_order BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS random_options BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('  ✅ Extended assessments table with Feature 3 fields.');

    // 2. Extend assessment_questions to ensure support for all question types
    await client.query(`
      ALTER TABLE assessment_questions
        ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS multiple_answers JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS numerical_answer NUMERIC,
        ADD COLUMN IF NOT EXISTS numerical_tolerance NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;
    `);
    console.log('  ✅ Extended assessment_questions with multi-answer and numerical fields.');

    // 3. Create question_bank table
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_bank (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        question_type VARCHAR(50) NOT NULL,
        difficulty VARCHAR(50) NOT NULL DEFAULT 'Intermediate',
        skills JSONB DEFAULT '[]'::jsonb,
        question_text TEXT NOT NULL,
        options JSONB DEFAULT '[]'::jsonb,
        correct_answer TEXT,
        multiple_answers JSONB DEFAULT '[]'::jsonb,
        numerical_answer NUMERIC,
        numerical_tolerance NUMERIC DEFAULT 0,
        explanation TEXT,
        marks INT DEFAULT 1,
        programming_language VARCHAR(50),
        starter_code TEXT,
        input_description TEXT,
        output_description TEXT,
        constraints TEXT,
        test_cases JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_qbank_company ON question_bank(company_id);
      CREATE INDEX IF NOT EXISTS idx_qbank_category ON question_bank(category);
      CREATE INDEX IF NOT EXISTS idx_qbank_difficulty ON question_bank(difficulty);
    `);
    console.log('  ✅ Created question_bank table and indices.');

    // 4. Create or replace view assessment_candidates pointing to assessment_targets
    await client.query(`
      CREATE OR REPLACE VIEW assessment_candidates AS
      SELECT
        at.id,
        at.assessment_id,
        at.student_id,
        at.institution_id,
        s.department_id,
        s.full_name AS student_name,
        s.roll_number,
        s.cgpa,
        s.graduation_year,
        at.assigned_at,
        at.status,
        at.started_at,
        at.submitted_at,
        at.score,
        at.total_marks,
        at.result_status,
        at.feedback
      FROM assessment_targets at
      JOIN students s ON s.id = at.student_id;
    `);
    console.log('  ✅ Created assessment_candidates view.');

    // 5. Seed diverse questions in question_bank
    const seedQuestions = [
      {
        title: 'Two Sum Problem',
        category: 'Programming',
        question_type: 'PROGRAMMING',
        difficulty: 'Easy',
        skills: ['Data Structures', 'Python', 'Algorithms'],
        question_text: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Assume each input has exactly one solution.',
        programming_language: 'Python',
        starter_code: 'def two_sum(nums, target):\n    # Return a list of two indices [i, j]\n    pass',
        input_description: 'Line 1: Comma-separated integers (nums)\nLine 2: Single integer (target)',
        output_description: 'Comma-separated indices [i, j]',
        constraints: '2 <= len(nums) <= 10^4, -10^9 <= nums[i] <= 10^9',
        test_cases: [
          { input: '2, 7, 11, 15\n9', expectedOutput: '0, 1', isHidden: false },
          { input: '3, 2, 4\n6', expectedOutput: '1, 2', isHidden: false },
          { input: '3, 3\n6', expectedOutput: '0, 1', isHidden: true }
        ],
        marks: 20,
        explanation: 'Utilize a hash map to store complements in O(n) linear time complexity.'
      },
      {
        title: 'Reverse Linked List',
        category: 'Programming',
        question_type: 'PROGRAMMING',
        difficulty: 'Intermediate',
        skills: ['Data Structures', 'JavaScript', 'Algorithms'],
        question_text: 'Write an algorithm to reverse a singly linked list given as an array of node values.',
        programming_language: 'JavaScript',
        starter_code: 'function reverseList(arr) {\n  // Return reversed array of node values\n  return arr.reverse();\n}',
        input_description: 'Comma-separated list of numbers',
        output_description: 'Reversed comma-separated list of numbers',
        constraints: '0 <= list length <= 5000',
        test_cases: [
          { input: '1, 2, 3, 4, 5', expectedOutput: '5, 4, 3, 2, 1', isHidden: false },
          { input: '1, 2', expectedOutput: '2, 1', isHidden: false },
          { input: '42', expectedOutput: '42', isHidden: true }
        ],
        marks: 20,
        explanation: 'Iterative pointer reversal in O(n) time and O(1) auxiliary space.'
      },
      {
        title: 'SQL Group By and Having Filter',
        category: 'MCQ',
        question_type: 'MCQ',
        difficulty: 'Intermediate',
        skills: ['SQL', 'Databases'],
        question_text: 'Which SQL clause is used to filter groups created by the GROUP BY clause based on aggregate calculations?',
        options: ['WHERE', 'HAVING', 'FILTER', 'ORDER BY'],
        correct_answer: 'HAVING',
        marks: 5,
        explanation: 'HAVING filters aggregated groups, whereas WHERE filters individual rows prior to aggregation.'
      },
      {
        title: 'RESTful Idempotent Methods',
        category: 'Multiple Answer',
        question_type: 'MULTIPLE_ANSWER',
        difficulty: 'Intermediate',
        skills: ['Web Development', 'System Design'],
        question_text: 'Which of the following HTTP request methods are classified as idempotent under RFC 7231 standards?',
        options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        multiple_answers: ['GET', 'PUT', 'DELETE'],
        correct_answer: 'GET, PUT, DELETE',
        marks: 10,
        explanation: 'GET, PUT, and DELETE are idempotent because executing them repeatedly results in identical state.'
      },
      {
        title: 'Binary Tree Maximum Height Calculation',
        category: 'Numerical',
        question_type: 'NUMERICAL',
        difficulty: 'Intermediate',
        skills: ['Problem Solving', 'Data Structures'],
        question_text: 'What is the maximum number of nodes in a full binary tree of height 5 (where root has height 1)?',
        numerical_answer: 31,
        numerical_tolerance: 0,
        correct_answer: '31',
        marks: 5,
        explanation: 'A full binary tree of height h has 2^h - 1 nodes. 2^5 - 1 = 32 - 1 = 31.'
      },
      {
        title: 'Syllogism and Deductive Deduction',
        category: 'Logical Reasoning',
        question_type: 'LOGICAL_REASONING',
        difficulty: 'Intermediate',
        skills: ['Logical Reasoning', 'Analytical Thinking'],
        question_text: 'Statements: All microservices are decoupled. Some decoupled systems are cloud-native. Conclusion I: Some microservices are cloud-native. Conclusion II: All cloud-native systems are decoupled.',
        options: [
          'Only Conclusion I follows',
          'Only Conclusion II follows',
          'Neither Conclusion I nor II follows necessarily',
          'Both conclusions follow'
        ],
        correct_answer: 'Neither Conclusion I nor II follows necessarily',
        marks: 5,
        explanation: 'From the given premises, no guaranteed overlap between microservices and cloud-native can be definitively inferred.'
      },
      {
        title: 'Network Bandwidth and Latency Calculation',
        category: 'Aptitude',
        question_type: 'APTITUDE',
        difficulty: 'Intermediate',
        skills: ['Aptitude', 'Computer Networks'],
        question_text: 'A data packet of 1500 bytes is transmitted over a 10 Mbps link with a propagation delay of 20 ms. What is the approximate transmission time in milliseconds?',
        options: ['1.2 ms', '12 ms', '0.12 ms', '15 ms'],
        correct_answer: '1.2 ms',
        marks: 5,
        explanation: 'Transmission time = Size / Bandwidth = (1500 * 8 bits) / (10 * 10^6 bps) = 12000 / 10000000 = 0.0012 s = 1.2 ms.'
      }
    ];

    for (const q of seedQuestions) {
      await client.query(`
        INSERT INTO question_bank (
          title, category, question_type, difficulty, skills, question_text, options, correct_answer, multiple_answers,
          numerical_answer, numerical_tolerance, explanation, marks, programming_language, starter_code,
          input_description, output_description, constraints, test_cases
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb, $8, $9::jsonb, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb)
        ON CONFLICT DO NOTHING;
      `, [
        q.title,
        q.category,
        q.question_type,
        q.difficulty,
        JSON.stringify(q.skills),
        q.question_text,
        JSON.stringify(q.options || []),
        q.correct_answer || null,
        JSON.stringify(q.multiple_answers || []),
        q.numerical_answer || null,
        q.numerical_tolerance || 0,
        q.explanation || null,
        q.marks || 5,
        q.programming_language || null,
        q.starter_code || null,
        q.input_description || null,
        q.output_description || null,
        q.constraints || null,
        JSON.stringify(q.test_cases || [])
      ]);
    }
    console.log(`  ✅ Seeded ${seedQuestions.length} canonical questions into question_bank.`);

    await client.query('COMMIT');
    console.log('🎉 Feature 3 Database Migration successfully committed!\n');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigration();
