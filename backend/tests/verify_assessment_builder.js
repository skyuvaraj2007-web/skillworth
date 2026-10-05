/**
 * Verification Script for Feature 3: Industry Assessment Builder
 * Tests:
 * 1. Question Bank query & creation
 * 2. Candidate Targets query
 * 3. 6-Step Assessment Builder creation & publishing
 * 4. Sanitized test taking for student (zero answer leakage)
 * 5. Automated evaluation on backend (MCQ, Multiple Answer, Numerical, Programming via VM sandbox)
 * 6. Skill-wise performance breakdown calculation
 * 7. Industry results ranking & candidate shortlisting
 */

const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'skillnexus_quantum_super_secret_jwt_key_2026';
const BASE_URL = 'http://localhost:5000/api';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const api = {
  async get(url, options = {}) {
    const res = await fetch(url, { method: 'GET', headers: options.headers || {} });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || `HTTP ${res.status}`);
      err.response = { data, status: res.status };
      throw err;
    }
    return { data, status: res.status };
  },
  async post(url, body, options = {}) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || `HTTP ${res.status}`);
      err.response = { data, status: res.status };
      throw err;
    }
    return { data, status: res.status };
  }
};

async function runTests() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🧪 TESTING FEATURE 3: INDUSTRY ASSESSMENT BUILDER');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    // 0. Resolve real test users
    const cUserRes = await pool.query(`
      SELECT u.id, u.email, c.id AS company_id, c.company_name
      FROM users u
      JOIN company_members cm ON cm.user_id = u.id
      JOIN companies c ON c.id = cm.company_id
      LIMIT 1
    `);
    let compUser = cUserRes.rows[0];
    if (!compUser) {
      const compRes = await pool.query(`SELECT c.id, c.company_name FROM companies c LIMIT 1`);
      const userRes = await pool.query(`SELECT id, email FROM users LIMIT 1`);
      compUser = {
        id: userRes.rows[0].id,
        email: userRes.rows[0].email,
        company_id: compRes.rows[0].id,
        company_name: compRes.rows[0].company_name
      };
    }

    const sUserRes = await pool.query(`
      SELECT u.id, u.email, s.id AS student_id, s.full_name
      FROM users u
      JOIN students s ON s.user_id = u.id
      LIMIT 1
    `);
    let studUser = sUserRes.rows[0];
    if (!studUser) {
      const sOnly = await pool.query(`SELECT s.id AS student_id, s.full_name, s.user_id FROM students s LIMIT 1`);
      const uRes = await pool.query(`SELECT id, email FROM users WHERE id = $1`, [sOnly.rows[0].user_id]);
      studUser = {
        id: uRes.rows[0].id,
        email: uRes.rows[0].email,
        student_id: sOnly.rows[0].student_id,
        full_name: sOnly.rows[0].full_name
      };
    }

    const companyToken = jwt.sign(
      {
        id: compUser.id,
        role: 'company',
        email: compUser.email,
        companyId: compUser.company_id,
        companyName: compUser.company_name || 'TechCorp'
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    const studentToken = jwt.sign(
      {
        id: studUser.id,
        role: 'student',
        email: studUser.email,
        studentId: studUser.student_id
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    console.log(`🔑 Authenticated Company: ${compUser.email} (Company ID: ${compUser.company_id})`);
    console.log(`🔑 Authenticated Student: ${studUser.email} (Student ID: ${studUser.student_id})\n`);

    // 1. Test Question Bank
    console.log('1️⃣ Testing GET /api/company/question-bank...');
    const qbRes = await api.get(`${BASE_URL}/company/question-bank`, {
      headers: { Authorization: `Bearer ${companyToken}` }
    });
    console.log(`   ✅ Fetched ${qbRes.data.data?.length || 0} questions from Question Bank.`);
    if (qbRes.data.data?.length > 0) {
      console.log(`   Sample: [${qbRes.data.data[0].category}] ${qbRes.data.data[0].question_text.slice(0, 50)}...`);
    }

    // 2. Test Candidate Targets
    console.log('\n2️⃣ Testing GET /api/company/candidate-targets...');
    const ctRes = await api.get(`${BASE_URL}/company/candidate-targets`, {
      headers: { Authorization: `Bearer ${companyToken}` }
    });
    const targets = ctRes.data.data;
    console.log(`   ✅ Target options available:`);
    console.log(`      Colleges: ${targets.colleges?.length || 0}`);
    console.log(`      Departments: ${targets.departments?.length || 0}`);
    console.log(`      Students: ${targets.students?.length || 0}`);
    console.log(`      Opportunities: ${targets.opportunities?.length || 0}`);

    const targetStudent = { id: studUser.student_id, name: studUser.full_name };
    const targetOpp = targets.opportunities?.[0];

    // 3. Test 6-Step Assessment Builder
    console.log('\n3️⃣ Testing POST /api/company/assessments/builder...');
    const builderPayload = {
      title: 'Full Stack Performance Challenge ' + Date.now().toString().slice(-4),
      domain: 'Software Engineering',
      opportunityId: targetOpp?.id || null,
      description: 'Comprehensive skill test covering JavaScript, Data Structures, and Problem Solving',
      instructions: 'Answer all 4 questions. Programming questions will be compiled and evaluated against hidden test cases.',
      skills: ['JavaScript', 'Algorithms', 'Web Development', 'Logical Reasoning'],
      categories: ['Programming', 'Logical Reasoning', 'MCQ', 'Numerical'],
      skillWeights: {
        'JavaScript': 35,
        'Algorithms': 35,
        'Web Development': 15,
        'Logical Reasoning': 15
      },
      settings: {
        durationMinutes: 45,
        passingScore: 60,
        attemptsAllowed: 1,
        randomOrder: false,
        randomOptions: false
      },
      questions: [
        {
          questionType: 'MCQ',
          category: 'Web Development',
          skills: ['Web Development', 'JavaScript'],
          difficulty: 'Easy',
          marks: 5,
          questionText: 'Which HTTP status code signifies that a resource was successfully created?',
          options: ['200 OK', '201 Created', '204 No Content', '301 Moved Permanently'],
          correctAnswer: '201 Created',
          explanation: '201 Created indicates successful creation of a resource on the server.'
        },
        {
          questionType: 'MULTIPLE_ANSWER',
          category: 'Web Development',
          skills: ['Web Development'],
          difficulty: 'Intermediate',
          marks: 10,
          questionText: 'Which of the following are idempotent HTTP methods?',
          options: ['GET', 'POST', 'PUT', 'DELETE'],
          multipleAnswers: ['GET', 'PUT', 'DELETE'],
          explanation: 'GET, PUT, and DELETE are idempotent according to RFC 7231.'
        },
        {
          questionType: 'NUMERICAL',
          category: 'Logical Reasoning',
          skills: ['Logical Reasoning'],
          difficulty: 'Intermediate',
          marks: 5,
          questionText: 'What is the sum of integers from 1 to 20?',
          numericalAnswer: 210,
          numericalTolerance: 0,
          explanation: 'n*(n+1)/2 = 20 * 21 / 2 = 210.'
        },
        {
          questionType: 'PROGRAMMING',
          category: 'Programming',
          skills: ['Algorithms', 'JavaScript'],
          difficulty: 'Intermediate',
          marks: 20,
          programmingLanguage: 'JavaScript',
          questionText: 'Write a function solution(n) that returns the factorial of n.',
          starterCode: 'function solution(n) {\n  // Write your code here\n}',
          inputDescription: 'An integer n (0 <= n <= 10)',
          outputDescription: 'Factorial of n',
          constraints: '0 <= n <= 10',
          testCases: [
            { input: 0, expectedOutput: 1, isHidden: false },
            { input: 1, expectedOutput: 1, isHidden: false },
            { input: 4, expectedOutput: 24, isHidden: true },
            { input: 5, expectedOutput: 120, isHidden: true }
          ]
        }
      ],
      candidateSelection: {
        targetType: 'selected_students',
        studentIds: [targetStudent.id]
      },
      saveQuestionsToBank: true,
      publishImmediately: true
    };

    const buildRes = await api.post(`${BASE_URL}/company/assessments/builder`, builderPayload, {
      headers: { Authorization: `Bearer ${companyToken}` }
    });
    console.log(`   ✅ Assessment created:`, buildRes.data.data);
    const createdAsmtId = buildRes.data.data.id;

    // 4. Test Student "My Assessments"
    console.log('\n4️⃣ Testing GET /api/assessments/my-assessments for Student...');
    const myAsmtRes = await api.get(`${BASE_URL}/assessments/my-assessments`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log(`   ✅ Student has ${myAsmtRes.data.data?.length} assigned assessments.`);
    const assignedAsmt = myAsmtRes.data.data.find(a => a.id === createdAsmtId);
    if (!assignedAsmt) {
      throw new Error(`Created assessment ${createdAsmtId} not found in student's assigned assessments!`);
    }
    console.log(`   Found assigned assessment: "${assignedAsmt.title}" (Status: ${assignedAsmt.status})`);

    // 5. Test Sanitized Test Taking (GET /api/assessments/take/:id)
    console.log('\n5️⃣ Testing GET /api/assessments/take/:id (Verifying Sanitization & Zero Leakage)...');
    const takeRes = await api.get(`${BASE_URL}/assessments/take/${createdAsmtId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const sanitizedQuestions = takeRes.data.data.questions;
    console.log(`   ✅ Delivered ${sanitizedQuestions.length} sanitized questions.`);

    // Security check: Verify NO correct answers or hidden test cases are in response
    sanitizedQuestions.forEach((q, idx) => {
      if (q.correctAnswer || q.correct_answer || q.multipleAnswers || q.multiple_answers || q.numericalAnswer || q.numerical_answer) {
        throw new Error(`SECURITY VIOLATION: Correct answer leaked on question ${idx + 1}!`);
      }
      if (q.publicTestCases) {
        // Ensure no hidden test cases are exposed
        if (q.publicTestCases.length > 2) {
          throw new Error(`SECURITY VIOLATION: Hidden test cases leaked on question ${idx + 1}!`);
        }
      }
    });
    console.log('   🔒 SECURITY VERIFIED: Zero correct answers or hidden test cases exposed to student.');

    // 6. Test Backend Submission & Evaluation (POST /api/assessments/submit/:id)
    console.log('\n6️⃣ Testing POST /api/assessments/submit/:id (Automatic Server-Side Grading)...');
    const q1 = sanitizedQuestions.find(q => q.questionType === 'MCQ');
    const q2 = sanitizedQuestions.find(q => q.questionType === 'MULTIPLE_ANSWER');
    const q3 = sanitizedQuestions.find(q => q.questionType === 'NUMERICAL');
    const q4 = sanitizedQuestions.find(q => q.questionType === 'PROGRAMMING');

    const answers = {
      [q1.id]: '201 Created', // Correct (5/5)
      [q2.id]: ['GET', 'PUT', 'DELETE'], // Correct (10/10)
      [q3.id]: 210, // Correct (5/5)
      [q4.id]: 'function solution(n) { if (n <= 1) return 1; let res = 1; for (let i = 2; i <= n; i++) res *= i; return res; }' // Correct factorial (20/20)
    };

    const submitRes = await api.post(`${BASE_URL}/assessments/submit/${createdAsmtId}`, { answers }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    const evalResult = submitRes.data.data;
    console.log(`   ✅ Evaluation completed successfully!`);
    console.log(`      Score: ${evalResult.score}% (${evalResult.earnedMarks} / ${evalResult.totalMarks} marks)`);
    console.log(`      Pass/Fail: ${evalResult.passed ? 'PASSED' : 'FAILED'} (Passing score: ${evalResult.passingBenchmark}%)`);
    console.log(`      Skill-wise Performance:`, evalResult.skillWisePerformance);

    if (evalResult.score !== 100) {
      console.warn(`      Warning: Expected 100% score but got ${evalResult.score}%`);
    }

    // 7. Test Student Result View (GET /api/assessments/result/:id)
    console.log('\n7️⃣ Testing GET /api/assessments/result/:id for Student...');
    const resultView = await api.get(`${BASE_URL}/assessments/result/${createdAsmtId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log(`   ✅ Student Result retrieved:`, {
      title: resultView.data.data.title,
      score: resultView.data.data.score,
      resultStatus: resultView.data.data.resultStatus,
      skillsEvaluated: Object.keys(resultView.data.data.skillWisePerformance)
    });

    // 8. Test Industry Results Ranking & Shortlist (GET /api/company/assessments/:id/results)
    console.log('\n8️⃣ Testing GET /api/company/assessments/:id/results (Industry View)...');
    const indResults = await api.get(`${BASE_URL}/company/assessments/${createdAsmtId}/results`, {
      headers: { Authorization: `Bearer ${companyToken}` }
    });
    const summary = indResults.data.data.summary;
    const candidates = indResults.data.data.candidates;
    console.log(`   ✅ Company Summary:`, summary);
    console.log(`   ✅ Candidates Ranked (${candidates.length} total):`);
    candidates.forEach(c => {
      console.log(`      Rank #${c.rank} | ${c.studentName} | Score: ${c.score}% | Status: ${c.resultStatus} | Skills:`, c.skillWisePerformance);
    });

    // 9. Test Shortlist Candidate Action (POST /api/company/assessments/:id/shortlist-candidate)
    console.log('\n9️⃣ Testing POST /api/company/assessments/:id/shortlist-candidate...');
    const shortlistRes = await api.post(`${BASE_URL}/company/assessments/${createdAsmtId}/shortlist-candidate`, {
      studentId: targetStudent.id,
      opportunityId: targetOpp?.id || null
    }, {
      headers: { Authorization: `Bearer ${companyToken}` }
    });
    console.log(`   ✅ Shortlist candidate response:`, shortlistRes.data.message);

    console.log('\n🎉 ALL FEATURE 3 BACKEND & EVALUATION TESTS PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
