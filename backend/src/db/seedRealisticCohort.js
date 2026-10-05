/**
 * SKILLNEXUS AI — Realistic Cohort Seeder for CSE III-A
 * Populates 45 realistic student records surrounding Arun Kumar in ABC Engineering College,
 * Class III CSE A under Dr. Ramesh Sundaram.
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config({ path: 'backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const COHORT_STUDENTS = [
  { name: 'Priya S', roll: '23CSE001', cgpa: 9.12, target: 'Full Stack AI Engineer', skills: { 'Python': 90, 'React.js': 88, 'SQL': 82, 'Data Structures': 85, 'Cloud Computing': 78 } },
  { name: 'Karthik R', roll: '23CSE002', cgpa: 8.65, target: 'Cloud DevOps Engineer', skills: { 'Python': 82, 'Cloud Computing': 88, 'Docker': 80, 'SQL': 75, 'Data Structures': 72 } },
  { name: 'Nithya M', roll: '23CSE003', cgpa: 8.94, target: 'Data Scientist & ML Engineer', skills: { 'Python': 94, 'SQL': 86, 'Machine Learning': 88, 'Data Structures': 79, 'React.js': 60 } },
  { name: 'Sanjay P', roll: '23CSE004', cgpa: 8.78, target: 'Full Stack AI Engineer', skills: { 'Python': 86, 'React.js': 84, 'SQL': 78, 'Data Structures': 82, 'C++': 80 } },
  { name: 'Harish K', roll: '23CSE005', cgpa: 7.82, target: 'Frontend Specialist', skills: { 'React.js': 86, 'JavaScript': 88, 'TypeScript': 78, 'Python': 65, 'Data Structures': 62 } },
  { name: 'Divya R', roll: '23CSE006', cgpa: 9.05, target: 'AI Research & Engineering', skills: { 'Python': 92, 'C++': 86, 'Data Structures': 88, 'SQL': 76, 'Machine Learning': 85 } },
  { name: 'Vignesh S', roll: '23CSE007', cgpa: 7.45, target: 'Backend Specialist', skills: { 'Java': 85, 'SQL': 84, 'Python': 76, 'Data Structures': 70, 'React.js': 55 } }, // CGPA below 7.5
  { name: 'Keerthana P', roll: '23CSE008', cgpa: 8.90, target: 'Full Stack AI Engineer', skills: { 'React.js': 87, 'Python': 85, 'SQL': 82, 'Data Structures': 84, 'Cloud Computing': 75 } },
  { name: 'Rahul M', roll: '23CSE009', cgpa: 8.10, target: 'Systems Architect', skills: { 'C++': 90, 'Data Structures': 86, 'Python': 74, 'SQL': 68, 'Linux': 82 } },
  { name: 'Ananya S', roll: '23CSE010', cgpa: 8.52, target: 'Full Stack Engineer', skills: { 'React.js': 82, 'Python': 78, 'SQL': 75, 'Data Structures': 74, 'Java': 70 } },
  { name: 'Gokulnath T', roll: '23CSE011', cgpa: 7.30, target: 'Full Stack Developer', skills: { 'React.js': 82, 'Python': 78, 'SQL': 72, 'Data Structures': 68 } }, // CGPA 7.3
  { name: 'Deepika K', roll: '23CSE012', cgpa: 8.40, target: 'Database & Backend Engineer', skills: { 'SQL': 92, 'Python': 80, 'Java': 82, 'Data Structures': 76, 'React.js': 58 } },
  { name: 'Aravind B', roll: '23CSE013', cgpa: 7.95, target: 'Web Technologies Engineer', skills: { 'React.js': 85, 'JavaScript': 84, 'Python': 70, 'SQL': 65, 'Data Structures': 58 } }, // DSA gap 58
  { name: 'Swathi N', roll: '23CSE014', cgpa: 8.70, target: 'Machine Learning Specialist', skills: { 'Python': 90, 'Machine Learning': 84, 'SQL': 80, 'Data Structures': 75, 'React.js': 62 } },
  { name: 'Manoj Kumar V', roll: '23CSE015', cgpa: 8.25, target: 'Full Stack AI Developer', skills: { 'React.js': 81, 'Python': 79, 'SQL': 74, 'Data Structures': 77, 'Cloud Computing': 70 } },
  { name: 'Pavithra D', roll: '23CSE016', cgpa: 8.60, target: 'UI/UX & Frontend Developer', skills: { 'React.js': 90, 'TypeScript': 82, 'Python': 68, 'SQL': 62, 'Data Structures': 60 } },
  { name: 'Siddharth G', roll: '23CSE017', cgpa: 9.20, target: 'Algorithms & Core Systems', skills: { 'C++': 94, 'Data Structures': 92, 'Python': 84, 'SQL': 78, 'React.js': 65 } },
  { name: 'Meenakshi R', roll: '23CSE018', cgpa: 8.35, target: 'Cloud Solutions Associate', skills: { 'Cloud Computing': 85, 'Python': 80, 'SQL': 78, 'Data Structures': 70, 'React.js': 72 } },
  { name: 'Naveen Prashanth', roll: '23CSE019', cgpa: 7.65, target: 'Software Engineer', skills: { 'Python': 76, 'Java': 78, 'SQL': 72, 'Data Structures': 74, 'React.js': 75 } },
  { name: 'Sneha L', roll: '23CSE020', cgpa: 8.80, target: 'Full Stack AI Engineer', skills: { 'React.js': 84, 'Python': 82, 'SQL': 76, 'Data Structures': 80, 'Git': 85 } },
  { name: 'Ashwin C', roll: '23CSE021', cgpa: 7.15, target: 'Web Developer', skills: { 'React.js': 78, 'Python': 72, 'SQL': 64, 'Data Structures': 55 } }, // Low CGPA & DSA gap
  { name: 'Kavya B', roll: '23CSE022', cgpa: 8.45, target: 'Data Analytics Engineer', skills: { 'SQL': 88, 'Python': 85, 'Data Analytics': 84, 'Data Structures': 72, 'React.js': 60 } },
  { name: 'Dinesh Kumar S', roll: '23CSE023', cgpa: 8.00, target: 'Backend Engineer', skills: { 'Java': 82, 'SQL': 80, 'Python': 74, 'Data Structures': 76, 'React.js': 68 } },
  { name: 'Abinaya T', roll: '23CSE024', cgpa: 8.92, target: 'Full Stack Engineer', skills: { 'React.js': 86, 'Python': 84, 'SQL': 80, 'Data Structures': 82, 'Cloud Computing': 74 } },
  { name: 'Pradeep J', roll: '23CSE025', cgpa: 7.55, target: 'Cybersecurity Associate', skills: { 'Python': 80, 'Linux': 84, 'Data Structures': 70, 'SQL': 68, 'React.js': 50 } },
  { name: 'Lakshmi Priya M', roll: '23CSE026', cgpa: 8.75, target: 'AI Application Developer', skills: { 'Python': 88, 'React.js': 82, 'SQL': 78, 'Data Structures': 80, 'Machine Learning': 76 } },
  { name: 'Rohit K', roll: '23CSE027', cgpa: 7.40, target: 'Software Engineer', skills: { 'Java': 78, 'Python': 72, 'SQL': 70, 'Data Structures': 66, 'React.js': 65 } }, // Low CGPA
  { name: 'Archana V', roll: '23CSE028', cgpa: 8.50, target: 'Cloud & DevOps Developer', skills: { 'Cloud Computing': 84, 'Python': 80, 'Docker': 78, 'SQL': 74, 'Data Structures': 72 } },
  { name: 'Gautam E', roll: '23CSE029', cgpa: 8.15, target: 'Full Stack Developer', skills: { 'React.js': 80, 'Python': 78, 'SQL': 76, 'Data Structures': 75, 'JavaScript': 82 } },
  { name: 'Srinidhi K', roll: '23CSE030', cgpa: 8.85, target: 'Data Scientist', skills: { 'Python': 90, 'SQL': 85, 'Data Analytics': 86, 'Data Structures': 78, 'React.js': 64 } },
  { name: 'Vijay Anand', roll: '23CSE031', cgpa: 7.20, target: 'Front End Engineer', skills: { 'React.js': 82, 'JavaScript': 80, 'CSS': 85, 'Data Structures': 52 } }, // Low CGPA & DSA gap
  { name: 'Monika Devi S', roll: '23CSE032', cgpa: 8.65, target: 'Full Stack AI Engineer', skills: { 'React.js': 85, 'Python': 84, 'SQL': 80, 'Data Structures': 81, 'Cloud Computing': 72 } },
  { name: 'Subash Chandra', roll: '23CSE033', cgpa: 8.30, target: 'Systems Programmer', skills: { 'C++': 88, 'Data Structures': 84, 'Python': 76, 'Linux': 80, 'SQL': 70 } },
  { name: 'Janani P', roll: '23CSE034', cgpa: 8.95, target: 'Machine Learning Engineer', skills: { 'Python': 92, 'Machine Learning': 88, 'SQL': 82, 'Data Structures': 80, 'React.js': 68 } },
  { name: 'Akash R', roll: '23CSE035', cgpa: 7.85, target: 'Full Stack Engineer', skills: { 'React.js': 82, 'Python': 77, 'SQL': 73, 'Data Structures': 76, 'Git': 80 } },
  { name: 'Tharani K', roll: '23CSE036', cgpa: 8.40, target: 'Quality & Automation Engineer', skills: { 'Python': 82, 'Java': 80, 'SQL': 78, 'Data Structures': 72, 'React.js': 70 } },
  { name: 'Vinoth Kumar M', roll: '23CSE037', cgpa: 7.70, target: 'Cloud Engineer', skills: { 'Cloud Computing': 80, 'Python': 76, 'SQL': 72, 'Data Structures': 68, 'React.js': 65 } },
  { name: 'Karthika D', roll: '23CSE038', cgpa: 8.55, target: 'Full Stack Developer', skills: { 'React.js': 83, 'Python': 80, 'SQL': 75, 'Data Structures': 78, 'Java': 72 } },
  { name: 'Bharathwaj S', roll: '23CSE039', cgpa: 8.05, target: 'Backend Specialist', skills: { 'Java': 84, 'SQL': 82, 'Python': 76, 'Data Structures': 78, 'React.js': 62 } },
  { name: 'Madhumitha N', roll: '23CSE040', cgpa: 8.82, target: 'Full Stack AI Engineer', skills: { 'React.js': 86, 'Python': 85, 'SQL': 81, 'Data Structures': 83, 'Machine Learning': 75 } },
  { name: 'Ajith Kumar T', roll: '23CSE041', cgpa: 7.35, target: 'Web Developer', skills: { 'React.js': 76, 'JavaScript': 78, 'Python': 68, 'Data Structures': 56 } }, // Low CGPA & DSA gap
  // 23CSE042 is Arun Kumar (preserved as main demo student)
  { name: 'Hema Malini R', roll: '23CSE043', cgpa: 8.68, target: 'Data Analyst & Engineer', skills: { 'SQL': 90, 'Python': 86, 'Data Analytics': 85, 'Data Structures': 76, 'React.js': 66 } },
  { name: 'Surya Narayanan', roll: '23CSE044', cgpa: 8.22, target: 'Full Stack Developer', skills: { 'React.js': 81, 'Python': 78, 'SQL': 75, 'Data Structures': 77, 'Docker': 70 } },
  { name: 'Preethi K', roll: '23CSE045', cgpa: 8.76, target: 'Full Stack AI Developer', skills: { 'React.js': 84, 'Python': 83, 'SQL': 80, 'Data Structures': 82, 'Cloud Computing': 74 } }
];

async function seedCohort() {
  console.log('🚀 Seeding realistic CSE III-A student cohort into Supabase PostgreSQL...');
  const client = await pool.connect();
  const passwordHash = bcrypt.hashSync('Demo@2026', 10);

  try {
    // 1. Resolve ABC Engineering College, CSE Dept, Class III CSE A, and Dr. Ramesh Sundaram
    const instRes = await client.query("SELECT id FROM institutions WHERE code = 'ABC-ENG' OR name ILIKE '%ABC Engineering%' LIMIT 1");
    if (instRes.rows.length === 0) throw new Error('ABC Engineering College not found');
    const institutionId = instRes.rows[0].id;

    const deptRes = await client.query("SELECT id FROM departments WHERE institution_id = $1 AND (code = 'CSE' OR name ILIKE '%Computer Science%') LIMIT 1", [institutionId]);
    if (deptRes.rows.length === 0) throw new Error('CSE department not found');
    const departmentId = deptRes.rows[0].id;

    const classRes = await client.query("SELECT id FROM classes WHERE institution_id = $1 AND name ILIKE '%III CSE A%' LIMIT 1", [institutionId]);
    if (classRes.rows.length === 0) throw new Error('Class III CSE A not found');
    const classId = classRes.rows[0].id;

    const mentorRes = await client.query("SELECT user_id, id FROM academician_profiles WHERE full_name ILIKE '%Ramesh%' LIMIT 1");
    const mentorUserId = mentorRes.rows.length > 0 ? mentorRes.rows[0].user_id : null;
    const mentorProfileId = mentorRes.rows.length > 0 ? mentorRes.rows[0].id : null;

    const studentRoleIdRes = await client.query("SELECT id FROM roles WHERE code = 'STUDENT' LIMIT 1");
    const studentRoleId = studentRoleIdRes.rows.length > 0 ? studentRoleIdRes.rows[0].id : null;

    // Cache skills catalog
    const skillsRes = await client.query("SELECT id, name FROM skills");
    const skillCatalog = new Map();
    skillsRes.rows.forEach(s => skillCatalog.set(s.name.toLowerCase().trim(), s.id));

    let createdCount = 0;
    let updatedCount = 0;

    for (const stu of COHORT_STUDENTS) {
      const email = `${stu.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.${stu.roll.toLowerCase()}@abc-eng.edu.in`;

      // A. Create or get user
      let userRes = await client.query("SELECT id FROM users WHERE email = $1", [email]);
      let userId;
      if (userRes.rows.length > 0) {
        userId = userRes.rows[0].id;
      } else {
        const insUser = await client.query(
          "INSERT INTO users (email, password_hash, is_active) VALUES ($1, $2, true) RETURNING id",
          [email, passwordHash]
        );
        userId = insUser.rows[0].id;

        if (studentRoleId) {
          await client.query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [userId, studentRoleId]);
        }
      }

      // Readiness score based on CGPA and average skill
      const skillVals = Object.values(stu.skills);
      const avgSkill = skillVals.length > 0 ? skillVals.reduce((a, b) => a + b, 0) / skillVals.length : 70;
      const readinessScore = Math.min(96, Math.max(50, Math.round(stu.cgpa * 8 + avgSkill * 0.2)));

      // B. Create or update student profile
      let stuRes = await client.query("SELECT id FROM students WHERE roll_number = $1 OR user_id = $2", [stu.roll, userId]);
      let studentId;

      if (stuRes.rows.length > 0) {
        studentId = stuRes.rows[0].id;
        await client.query(
          `UPDATE students SET
             full_name = $1, institution_id = $2, department_id = $3, class_id = $4,
             cgpa = $5, batch = '2023-2027', graduation_year = 2027, year_semester = 'Semester 5',
             readiness_score = $6, target_career_role = $7,
             placement_status = CASE WHEN $5 >= 7.5 THEN 'Placement Ready' ELSE 'Skill Remediation Required' END,
             updated_at = NOW()
           WHERE id = $8`,
          [stu.name, institutionId, departmentId, classId, stu.cgpa, readinessScore, stu.target, studentId]
        );
        updatedCount++;
      } else {
        const insStu = await client.query(
          `INSERT INTO students (
             user_id, full_name, roll_number, institution_id, department_id, class_id,
             cgpa, batch, graduation_year, year_semester, readiness_score, target_career_role,
             placement_status
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, '2023-2027', 2027, 'Semester 5', $8, $9,
             CASE WHEN $7 >= 7.5 THEN 'Placement Ready' ELSE 'Skill Remediation Required' END)
           RETURNING id`,
          [userId, stu.name, stu.roll, institutionId, departmentId, classId, stu.cgpa, readinessScore, stu.target]
        );
        studentId = insStu.rows[0].id;
        createdCount++;
      }

      // C. Map to Dr. Ramesh Sundaram (staff_id references users.id)
      if (mentorUserId) {
        await client.query(
          `INSERT INTO student_staff_mapping (staff_id, student_id, is_active)
           VALUES ($1, $2, true)
           ON CONFLICT DO NOTHING`,
          [mentorUserId, studentId]
        );
      }

      // D. Seed student skills with variation
      for (const [skillName, score] of Object.entries(stu.skills)) {
        let skillId = skillCatalog.get(skillName.toLowerCase().trim());
        if (!skillId) {
          const catId = skillName.toLowerCase().includes('cloud') || skillName.toLowerCase().includes('docker') || skillName.toLowerCase().includes('linux')
            ? 'd4812dbb-16cc-4c11-86c6-28f8b9710db1'
            : (skillName.toLowerCase().includes('react') || skillName.toLowerCase().includes('javascript') || skillName.toLowerCase().includes('css'))
              ? 'be6d61aa-6330-48e7-9f26-afe04076f004'
              : '6e9b92a1-e5d3-40e6-8331-ae38678e5b15';

          const newSkillRes = await client.query(
            "INSERT INTO skills (name, category_id, difficulty, description) VALUES ($1, $2, 'Intermediate', $3) RETURNING id",
            [skillName, catId, `${skillName} practical technical competency`]
          );
          skillId = newSkillRes.rows[0].id;
          skillCatalog.set(skillName.toLowerCase().trim(), skillId);
        }

        const level = score >= 80 ? 'Advanced' : (score >= 65 ? 'Intermediate' : 'Beginner');
        const isVerified = score >= 70;

        await client.query(
          `INSERT INTO student_skills (
             student_id, skill_id, skill_name, category, proficiency_level,
             claimed_level, verified_level, score, proficiency_score,
             confidence_score, assessment_score, verification_status,
             credibility_score, self_rating, source, last_updated
           ) VALUES ($1, $2, $3, 'Technical Core', $4, $4, $4, $5, $5, $5, $5,
             $6, $7, 4, 'Institutional Verified Benchmark', NOW())
           ON CONFLICT (student_id, skill_id) DO UPDATE SET
             score = EXCLUDED.score,
             proficiency_score = EXCLUDED.proficiency_score,
             confidence_score = EXCLUDED.confidence_score,
             verification_status = EXCLUDED.verification_status,
             last_updated = NOW()`,
          [studentId, skillId, skillName, level, score, isVerified ? 'VERIFIED' : 'SELF_ASSESSED', isVerified ? 90 : 60]
        );
      }
    }

    // Verify final student count in class
    const totalInClass = await client.query("SELECT COUNT(*) FROM students WHERE class_id = $1", [classId]);
    console.log(`\n✅ Realistic Cohort Seeding Completed!`);
    console.log(`- Created: ${createdCount}`);
    console.log(`- Updated: ${updatedCount}`);
    console.log(`- Total Students in CSE III-A: ${totalInClass.rows[0].count}`);

  } finally {
    client.release();
    await pool.end();
  }
}

seedCohort().catch(err => {
  console.error('❌ Cohort Seeding Error:', err);
  process.exit(1);
});
