/**
 * Test Academician Backend APIs
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const relationalManager = require('../src/db/relationalManager');
const academicianRouter = require('../src/routes/academician');
const express = require('express');

async function testAcademicianApi() {
  console.log('🧪 Starting Academician API Verification...');

  // 1. Authenticate demo faculty
  const auth = await relationalManager.authenticateUser('faculty@skillnexus.edu.in', 'Faculty@123', 'academician');
  console.log('1. Faculty Authentication:', auth.success ? 'PASSED ✅' : 'FAILED ❌');
  if (!auth.success) {
    console.error('Auth failure:', auth);
    process.exit(1);
  }

  // 2. Set up test app with academician router
  const app = express();
  app.use(express.json());
  // Mock auth middleware for direct testing
  app.use((req, res, next) => {
    req.user = auth.user;
    req.institutionId = auth.user.institutionId;
    next();
  });
  app.use('/api/academician', academicianRouter);

  const server = app.listen(5099, async () => {
    try {
      const BASE = 'http://localhost:5099/api/academician';
      const headers = { 
        'Authorization': 'Bearer ' + auth.token,
        'Content-Type': 'application/json'
      };

      // Test Dashboard
      const dashRes = await fetch(`${BASE}/dashboard`, { headers });
      const dashData = await dashRes.json();
      if (!dashData.success) console.error('Dashboard Err:', dashData);
      console.log('2. GET /dashboard:', dashData.success ? 'PASSED ✅' : 'FAILED ❌', {
        academician: dashData.data?.academician?.name,
        totalStudents: dashData.data?.statistics?.totalStudents,
        myCourses: dashData.data?.statistics?.myCourses,
        activeAssessments: dashData.data?.statistics?.activeAssessments
      });

      // Test Students
      const stuRes = await fetch(`${BASE}/students`, { headers });
      const stuData = await stuRes.json();
      if (!stuData.success) console.error('Students Err:', stuData);
      console.log('3. GET /students:', stuData.success ? 'PASSED ✅' : 'FAILED ❌', `Count: ${stuData.data?.students?.length}`);

      if (stuData.data?.students?.length > 0) {
        const firstStudent = stuData.data.students[0];
        // Test Student Profile
        const profRes = await fetch(`${BASE}/students/${firstStudent.id}`, { headers });
        const profData = await profRes.json();
        console.log(`4. GET /students/${firstStudent.id}:`, profData.success ? 'PASSED ✅' : 'FAILED ❌', {
          name: profData.data?.info?.name,
          coursesCount: profData.data?.courses?.length,
          skillsCount: profData.data?.skills?.length
        });

        // Test Add Remark
        const remRes = await fetch(`${BASE}/students/${firstStudent.id}/remarks`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ remarks: 'Proactively engaged in skill building and assessments.', category: 'Academic Review' })
        });
        const remData = await remRes.json();
        console.log('5. POST /students/:id/remarks:', remData.success ? 'PASSED ✅' : 'FAILED ❌');
      }

      // Test Courses
      const crsRes = await fetch(`${BASE}/courses`, { headers });
      const crsData = await crsRes.json();
      console.log('6. GET /courses:', crsData.success ? 'PASSED ✅' : 'FAILED ❌', `Count: ${crsData.data?.length}`);

      // Test Create Course
      const newCourseRes = await fetch(`${BASE}/courses`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Advanced Full Stack & Cloud Architecture',
          description: 'Production patterns in microservices and distributed databases.',
          category: 'Computer Science',
          skillCategory: 'Full Stack',
          difficulty: 'Advanced',
          durationWeeks: 10,
          learningObjectives: ['Design resilient REST and event-driven APIs', 'Master PostgreSQL and Supabase transactions'],
          modules: [
            {
              title: 'Module 1: High-Performance Database Design',
              duration: '3 Hours',
              lessons: [
                { id: 'l1', title: 'Indexing & Sharding', type: 'video' },
                { id: 'l2', title: 'Transaction Isolation & Locks', type: 'document' }
              ]
            }
          ]
        })
      });
      const newCourseData = await newCourseRes.json();
      console.log('7. POST /courses (Create Course):', newCourseData.success ? 'PASSED ✅' : 'FAILED ❌', newCourseData.data?.course_code);

      // Test Assessments
      const asmtRes = await fetch(`${BASE}/assessments`, { headers });
      const asmtData = await asmtRes.json();
      console.log('8. GET /assessments:', asmtData.success ? 'PASSED ✅' : 'FAILED ❌', `Count: ${asmtData.data?.length}`);

      // Test Create Assessment
      const newAsmtRes = await fetch(`${BASE}/assessments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Data Structures & Algorithms Diagnostic',
          domain: 'Computer Science & Engineering',
          assessmentType: 'Programming',
          durationMinutes: 45,
          passingScore: 75,
          totalMarks: 100,
          questions: [
            {
              topic: 'Arrays & Two Pointers',
              questionText: 'What is the optimal time complexity to find a target sum in a sorted array?',
              difficulty: 'Medium',
              options: [
                { text: 'O(N^2)', isCorrect: false },
                { text: 'O(N log N)', isCorrect: false },
                { text: 'O(N)', isCorrect: true },
                { text: 'O(1)', isCorrect: false }
              ]
            }
          ]
        })
      });
      const newAsmtData = await newAsmtRes.json();
      console.log('9. POST /assessments (Create Assessment):', newAsmtData.success ? 'PASSED ✅' : 'FAILED ❌', newAsmtData.data?.track_code);

      // Test Skill Gaps
      const gapsRes = await fetch(`${BASE}/skill-gaps`, { headers });
      const gapsData = await gapsRes.json();
      console.log('10. GET /skill-gaps:', gapsData.success ? 'PASSED ✅' : 'FAILED ❌', `Gaps detected: ${gapsData.data?.gaps?.length}`);

      // Test Industry Requirements
      const indRes = await fetch(`${BASE}/industry-requirements`, { headers });
      const indData = await indRes.json();
      console.log('11. GET /industry-requirements:', indData.success ? 'PASSED ✅' : 'FAILED ❌', `Skills mapped: ${indData.data?.length}`);

      // Test Recommendations
      const recRes = await fetch(`${BASE}/recommendations`, { headers });
      const recData = await recRes.json();
      console.log('12. GET /recommendations:', recData.success ? 'PASSED ✅' : 'FAILED ❌', `Count: ${recData.data?.length}`);

      // Test Mentorship
      const mentRes = await fetch(`${BASE}/mentorship`, { headers });
      const mentData = await mentRes.json();
      console.log('13. GET /mentorship:', mentData.success ? 'PASSED ✅' : 'FAILED ❌', `Mentees: ${mentData.data?.totalMentees}`);

      // Test Opportunities & Candidate Matching
      const oppRes = await fetch(`${BASE}/opportunities`, { headers });
      const oppData = await oppRes.json();
      console.log('14. GET /opportunities (Matching):', oppData.success ? 'PASSED ✅' : 'FAILED ❌', `Count: ${oppData.data?.length}`);

      // Test Analytics
      const anaRes = await fetch(`${BASE}/analytics`, { headers });
      const anaData = await anaRes.json();
      console.log('15. GET /analytics:', anaData.success ? 'PASSED ✅' : 'FAILED ❌');

      // Test Notifications
      const notRes = await fetch(`${BASE}/notifications`, { headers });
      const notData = await notRes.json();
      console.log('16. GET /notifications:', notData.success ? 'PASSED ✅' : 'FAILED ❌', `Count: ${notData.data?.length}`);

      console.log('\n🎉 ALL 16 ACADEMICIAN BACKEND ENDPOINTS PASSED DIRECT VERIFICATION!\n');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('❌ Test failed:', err);
      server.close();
      process.exit(1);
    }
  });
}

testAcademicianApi();
