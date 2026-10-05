/**
 * SKILLNEXUS AI — Master SIH Demo Data Seeder
 * Populates real PostgreSQL/Supabase database tables with interconnected,
 * production-grade demo accounts and records across all four roles:
 * 1. STUDENT: Arun Kumar (student.demo@skillnexus.ai)
 * 2. ACADEMICIAN: Dr. Ramesh Sundaram (academician.demo@skillnexus.ai)
 * 3. INSTITUTION: ABC Engineering College (institution.demo@skillnexus.ai)
 * 4. INDUSTRY: SBT TECH Innovations (industry.demo@skillnexus.ai)
 * Password for all 4 demo accounts: Demo@2026
 */

require('dotenv').config({ path: 'backend/.env' });
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in backend/.env');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

async function seedSihDemoData() {
  console.log('🚀 [SIH SEED] Starting master demo data creation in Supabase...');

  const passwordHash = bcrypt.hashSync('Demo@2026', 10);

  // 1. Resolve Roles
  const { data: roles, error: rolesErr } = await client.from('roles').select('id, code');
  if (rolesErr) throw rolesErr;

  const roleMap = {};
  roles.forEach(r => { roleMap[r.code.toUpperCase()] = r.id; });
  console.log('✅ Resolved roles:', Object.keys(roleMap).join(', '));

  // 2. Resolve Canonical Institution: ABC Engineering College
  let { data: insts } = await client
    .from('institutions')
    .select('id, name, code')
    .or('code.eq.ABC-ENG,name.ilike.%ABC Engineering%')
    .limit(1);

  let inst = insts?.[0];
  if (!inst) {
    const { data: newInst, error: instErr } = await client.from('institutions').insert({
      name: 'ABC Engineering College',
      code: 'ABC-ENG',
      district: 'Chennai',
      state: 'Tamil Nadu',
      website_url: 'https://abc-eng.edu.in',
      official_email: 'principal@abc-eng.edu.in'
    }).select().single();
    if (instErr) throw instErr;
    inst = newInst;
  }
  console.log('✅ Institution resolved:', inst.name, `(${inst.id})`);

  // 3. Resolve Department: CSE
  let { data: depts } = await client
    .from('departments')
    .select('id, name, code')
    .eq('institution_id', inst.id)
    .or('code.eq.CSE,name.ilike.%Computer Science%')
    .limit(1);

  let dept = depts?.[0];
  if (!dept) {
    const { data: newDept, error: deptErr } = await client.from('departments').insert({
      institution_id: inst.id,
      name: 'Computer Science and Engineering',
      code: 'CSE'
    }).select().single();
    if (deptErr) throw deptErr;
    dept = newDept;
  }
  console.log('✅ Department resolved:', dept.name, `(${dept.id})`);

  // 4. Resolve Class: III CSE A
  let { data: classes } = await client
    .from('classes')
    .select('id, name, section')
    .eq('institution_id', inst.id)
    .eq('department_id', dept.id)
    .ilike('name', '%III CSE A%')
    .limit(1);

  let cls = classes?.[0];
  if (!cls) {
    const { data: newCls, error: clsErr } = await client.from('classes').insert({
      institution_id: inst.id,
      department_id: dept.id,
      name: 'III CSE A',
      section: 'A',
      batch: '2023-2027'
    }).select().single();
    if (clsErr) throw clsErr;
    cls = newCls;
  }
  console.log('✅ Class resolved:', cls.name, `(${cls.id})`);

  // 5. Resolve Company: SBT TECH
  let { data: companies } = await client
    .from('companies')
    .select('id, company_name, industry')
    .ilike('company_name', '%SBT TECH%')
    .limit(1);

  let company = companies?.[0];
  if (!company) {
    const { data: newComp, error: compErr } = await client.from('companies').insert({
      company_name: 'SBT TECH Innovations',
      registration_number: 'REG-873177',
      industry: 'Enterprise Software & Artificial Intelligence',
      company_type: 'Enterprise Partner',
      company_size: '500-1000',
      headquarters: 'Chennai',
      state: 'Tamil Nadu',
      website_url: 'https://sbt-tech.ai',
      is_verified: true,
      tier: 'Tier 1 Prime Partner'
    }).select().single();
    if (compErr) throw compErr;
    company = newComp;
  }
  console.log('✅ Company resolved:', company.company_name, `(${company.id})`);

  // Helper to upsert a user into users table
  async function upsertUser(email, roleCode) {
    const { data: existing } = await client
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .limit(1);

    let userId;
    if (existing && existing.length > 0) {
      userId = existing[0].id;
      await client.from('users').update({
        password_hash: passwordHash,
        is_active: true,
        updated_at: new Date().toISOString()
      }).eq('id', userId);
      console.log(`Updated user: ${email} (${userId})`);
    } else {
      const { data: newUser, error: uErr } = await client.from('users').insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        is_active: true
      }).select().single();
      if (uErr) throw uErr;
      userId = newUser.id;
      console.log(`Created user: ${email} (${userId})`);
    }

    // Link user_role
    const roleId = roleMap[roleCode.toUpperCase()] || roleMap['STUDENT'];
    const { data: existingRole } = await client
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (existingRole && existingRole.length > 0) {
      await client.from('user_roles').update({ role_id: roleId }).eq('user_id', userId);
    } else {
      await client.from('user_roles').insert({ user_id: userId, role_id: roleId });
    }

    return userId;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ACCOUNT 1: STUDENT — Arun Kumar (student.demo@skillnexus.ai)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Student Demo Account ---');
  const studentUserId = await upsertUser(
    'student.demo@skillnexus.ai',
    'STUDENT',
    'Arun Kumar',
    '+91 98401 23456'
  );

  let { data: studentRecord } = await client
    .from('students')
    .select('id, user_id')
    .eq('user_id', studentUserId)
    .limit(1);

  let studentId;
  const studentPayload = {
    user_id: studentUserId,
    institution_id: inst.id,
    department_id: dept.id,
    class_id: cls.id,
    roll_number: '23CSE042',
    full_name: 'Arun Kumar',
    cgpa: 8.85,
    batch: '2023-2027',
    graduation_year: 2027,
    year_semester: 'Semester 5',
    readiness_score: 88,
    placement_status: 'Placement Ready',
    target_career_role: 'Full Stack AI Engineer',
    bio: 'Passionate computer science undergraduate specialized in full stack web development, algorithmic problem solving, and cloud-native architectures.',
    github_url: 'https://github.com/arunkumar-nexus',
    linkedin_url: 'https://linkedin.com/in/arunkumar-sih2026'
  };

  if (studentRecord && studentRecord.length > 0) {
    studentId = studentRecord[0].id;
    await client.from('students').update(studentPayload).eq('id', studentId);
  } else {
    const { data: newStu, error: sErr } = await client.from('students').insert(studentPayload).select().single();
    if (sErr) throw sErr;
    studentId = newStu.id;
  }
  console.log('✅ Student record linked:', studentId);

  // Preload Student Skills
  const studentSkillsData = [
    { name: 'Python', category: 'Programming', score: 88, level: 'Advanced', confidence: 88, assessment: 88 },
    { name: 'C++', category: 'Systems Programming', score: 82, level: 'Advanced', confidence: 82, assessment: 80 },
    { name: 'Java', category: 'Backend Development', score: 78, level: 'Intermediate', confidence: 78, assessment: 76 },
    { name: 'React.js', category: 'Frontend Development', score: 85, level: 'Advanced', confidence: 85, assessment: 85 },
    { name: 'React', category: 'Frontend Development', score: 85, level: 'Advanced', confidence: 85, assessment: 85 },
    { name: 'SQL', category: 'Database Systems', score: 80, level: 'Intermediate', confidence: 80, assessment: 82 },
    { name: 'Data Structures', category: 'Computer Science Core', score: 84, level: 'Advanced', confidence: 84, assessment: 86 },
    { name: 'Cloud Computing', category: 'DevOps & Cloud', score: 76, level: 'Intermediate', confidence: 76, assessment: 74 }
  ];

  // Resolve skill_ids from skills catalog or fallback
  const { data: dbSkills } = await client.from('skills').select('id, name');
  const skillIdMap = {};
  (dbSkills || []).forEach(s => { skillIdMap[s.name.toLowerCase()] = s.id; });

  for (const sk of studentSkillsData) {
    let skillId = skillIdMap[sk.name.toLowerCase()];
    if (!skillId) {
      const catId = sk.name.toLowerCase().includes('cloud')
        ? 'd4812dbb-16cc-4c11-86c6-28f8b9710db1'
        : '6e9b92a1-e5d3-40e6-8331-ae38678e5b15';

      const { data: newSk, error: nskErr } = await client.from('skills').insert({
        name: sk.name,
        category_id: catId,
        difficulty: sk.level,
        description: `${sk.name} technical competency and applied project capability`
      }).select().single();
      if (newSk) {
        skillId = newSk.id;
        skillIdMap[sk.name.toLowerCase()] = skillId;
      }
    }

    if (skillId) {
      const { data: existingSkill } = await client
        .from('student_skills')
        .select('id')
        .eq('student_id', studentId)
        .eq('skill_id', skillId)
        .limit(1);

      const skillRecord = {
        student_id: studentId,
        skill_id: skillId,
        skill_name: sk.name,
        category: sk.category,
        proficiency_level: sk.level,
        claimed_level: sk.level,
        verified_level: sk.level,
        score: sk.score,
        proficiency_score: sk.score,
        confidence_score: sk.confidence,
        assessment_score: sk.assessment,
        verification_status: 'VERIFIED',
        credibility_score: 92,
        self_rating: 4,
        source: 'Institutional Verified Benchmark',
        last_updated: new Date().toISOString()
      };

      if (existingSkill && existingSkill.length > 0) {
        await client.from('student_skills').update(skillRecord).eq('id', existingSkill[0].id);
      } else {
        await client.from('student_skills').insert(skillRecord);
      }
    }
  }
  console.log(`✅ Preloaded ${studentSkillsData.length} verified skills for Arun Kumar.`);

  // Preload Certificates for Arun Kumar
  const certsData = [
    {
      title: 'Certified Full Stack Web Developer (React.js & Node.js)',
      number: 'SNX-2026-FSD-0842',
      url: 'https://skillnexus.io/verify/SNX-2026-FSD-0842'
    },
    {
      title: 'Advanced Data Structures & Algorithms Mastery',
      number: 'SNX-2026-DSA-0911',
      url: 'https://skillnexus.io/verify/SNX-2026-DSA-0911'
    }
  ];

  for (const cert of certsData) {
    const certHash = crypto.createHash('sha256').update(cert.number + cert.title).digest('hex');
    const { data: existingCert } = await client
      .from('certificates')
      .select('id')
      .eq('student_id', studentId)
      .eq('certificate_number', cert.number)
      .limit(1);

    if (!existingCert || existingCert.length === 0) {
      await client.from('certificates').insert({
        student_id: studentId,
        institution_id: inst.id,
        certificate_number: cert.number,
        title: cert.title,
        certificate_url: cert.url,
        verification_hash: certHash,
        issued_at: new Date(Date.now() - 30 * 86400000).toISOString()
      });
    }
  }
  console.log(`✅ Preloaded verified certificates for Arun Kumar.`);

  // Preload Verified Projects for Arun Kumar
  const demoProjectsData = [
    {
      student_id: studentId,
      institution_id: inst.id,
      title: 'SkillNexus AI — Decentralized Competency Intelligence Platform',
      description: 'End-to-end full stack web application incorporating cryptographic skill validation, dynamic matching engines, and micro-credentialing passports.',
      github_url: 'https://github.com/arunkumar-nexus/skillnexus-core',
      live_url: 'https://skillnexus-demo.vercel.app',
      tech_stack: ['React', 'Node.js', 'PostgreSQL', 'Express', 'TailwindCSS'],
      status: 'Validated',
      submitted_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      validated_at: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      student_id: studentId,
      institution_id: inst.id,
      title: 'Neural Network Career Copilot & Resume Optimizer',
      description: 'AI-assisted career navigation copilot that parses candidate skill graphs and computes deterministic gap analysis across industry benchmarks.',
      github_url: 'https://github.com/arunkumar-nexus/career-copilot-engine',
      live_url: 'https://copilot-nexus.vercel.app',
      tech_stack: ['Python', 'FastAPI', 'PyTorch', 'Docker'],
      status: 'Validated',
      submitted_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      validated_at: new Date(Date.now() - 10 * 86400000).toISOString()
    },
    {
      student_id: studentId,
      institution_id: inst.id,
      title: 'Distributed Microservices Event Pipeline',
      description: 'Scalable data pipeline built with Kafka and Redis for low-latency assessment streaming and telemetry tracking.',
      github_url: 'https://github.com/arunkumar-nexus/distributed-event-mesh',
      live_url: 'https://mesh-demo.vercel.app',
      tech_stack: ['Go', 'Kafka', 'Redis', 'Docker', 'Kubernetes'],
      status: 'In Progress',
      submitted_at: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ];

  for (const prj of demoProjectsData) {
    const { data: existingPrj } = await client
      .from('projects')
      .select('id')
      .eq('student_id', studentId)
      .eq('title', prj.title)
      .limit(1);

    if (!existingPrj || existingPrj.length === 0) {
      await client.from('projects').insert(prj);
    }
  }
  console.log(`✅ Preloaded verified projects for Arun Kumar.`);

  // Preload Initial Course Enrollment for Arun Kumar
  const { data: sampleCourses } = await client
    .from('courses')
    .select('id, title')
    .ilike('title', '%Data Structure%')
    .limit(1);

  if (sampleCourses && sampleCourses.length > 0) {
    const sampleCourse = sampleCourses[0];
    const { data: existingEnr } = await client
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', sampleCourse.id)
      .limit(1);

    if (!existingEnr || existingEnr.length === 0) {
      await client.from('enrollments').insert({
        student_id: studentId,
        course_id: sampleCourse.id,
        status: 'In Progress',
        progress_percentage: 65,
        enrolled_at: new Date(Date.now() - 14 * 86400000).toISOString()
      });
      console.log(`✅ Preloaded ongoing course enrollment (${sampleCourse.title} - 65%) for Arun Kumar.`);
    }
  }

  // Preload Initial Assessment Attempt for Arun Kumar
  const { data: sampleAssessments } = await client
    .from('assessments')
    .select('id, title')
    .limit(1);

  if (sampleAssessments && sampleAssessments.length > 0) {
    const asmt = sampleAssessments[0];
    const { data: existingAttempt } = await client
      .from('assessment_attempts')
      .select('id')
      .eq('student_id', studentId)
      .eq('assessment_id', asmt.id)
      .limit(1);

    if (!existingAttempt || existingAttempt.length === 0) {
      await client.from('assessment_attempts').insert({
        student_id: studentId,
        assessment_id: asmt.id,
        status: 'Completed',
        score: 86,
        accuracy: 92,
        speed_index: 88,
        percentile: '94th Percentile',
        time_taken_seconds: 1420,
        started_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        completed_at: new Date(Date.now() - 7 * 86400000 + 1420000).toISOString(),
        proctor_hash: crypto.randomBytes(16).toString('hex')
      });
      console.log(`✅ Preloaded assessment attempt (Score: 86%) for Arun Kumar.`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ACCOUNT 2: ACADEMICIAN — Dr. Ramesh Sundaram (academician.demo@skillnexus.ai)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Academician Demo Account ---');
  const academicianUserId = await upsertUser(
    'academician.demo@skillnexus.ai',
    'FACULTY',
    'Dr. Ramesh Sundaram',
    '+91 98402 34567'
  );

  // Link secondary role ACADEMICIAN if available
  if (roleMap['ACADEMICIAN']) {
    const { data: hasAcdRole } = await client
      .from('user_roles')
      .select('*')
      .eq('user_id', academicianUserId)
      .eq('role_id', roleMap['ACADEMICIAN'])
      .limit(1);
    if (!hasAcdRole || hasAcdRole.length === 0) {
      await client.from('user_roles').insert({ user_id: academicianUserId, role_id: roleMap['ACADEMICIAN'] });
    }
  }

  const academicianPayload = {
    user_id: academicianUserId,
    institution_id: inst.id,
    department_id: dept.id,
    class_id: cls.id,
    faculty_id: 'FAC-CSE-001',
    full_name: 'Dr. Ramesh Sundaram',
    designation: 'Professor & Head of Department',
    official_email: 'ramesh.sundaram@abc-eng.edu.in',
    qualification: 'Ph.D. in Computer Science & Engineering',
    specialization: 'Cloud Computing, Distributed Algorithms & System Architecture',
    bio: 'Professor and Department Head with 16+ years of research and curriculum excellence. Mentoring students in industry-grade software architectures.'
  };

  const { data: existingAcdProfile } = await client
    .from('academician_profiles')
    .select('id')
    .eq('user_id', academicianUserId)
    .limit(1);

  if (existingAcdProfile && existingAcdProfile.length > 0) {
    await client.from('academician_profiles').update(academicianPayload).eq('id', existingAcdProfile[0].id);
  } else {
    await client.from('academician_profiles').insert(academicianPayload);
  }
  console.log('✅ Academician profile configured: Dr. Ramesh Sundaram');

  // Map Academician to Arun Kumar in student_staff_mapping
  const { data: existingMapping } = await client
    .from('student_staff_mapping')
    .select('id')
    .eq('staff_id', academicianUserId)
    .eq('student_id', studentId)
    .limit(1);

  if (!existingMapping || existingMapping.length === 0) {
    await client.from('student_staff_mapping').insert({
      staff_id: academicianUserId,
      student_id: studentId,
      is_active: true
    });
    console.log('✅ Linked Dr. Ramesh Sundaram to Arun Kumar in student_staff_mapping');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ACCOUNT 3: INSTITUTION — ABC Engineering College (institution.demo@skillnexus.ai)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Institution Demo Account ---');
  const institutionUserId = await upsertUser(
    'institution.demo@skillnexus.ai',
    'INSTITUTION',
    'ABC Engineering College Admin',
    '+91 98403 45678'
  );

  const { data: existingInstMember } = await client
    .from('institution_members')
    .select('id')
    .eq('user_id', institutionUserId)
    .limit(1);

  const instMemberPayload = {
    institution_id: inst.id,
    user_id: institutionUserId,
    department_id: dept.id,
    member_role: 'INSTITUTION_ADMIN',
    designation: 'Dean of Academic Affairs & Placement Director',
    is_active: true
  };

  if (existingInstMember && existingInstMember.length > 0) {
    await client.from('institution_members').update(instMemberPayload).eq('id', existingInstMember[0].id);
  } else {
    await client.from('institution_members').insert(instMemberPayload);
  }
  console.log('✅ Institution administrator member linked to ABC Engineering College');

  // ──────────────────────────────────────────────────────────────────────────
  // ACCOUNT 4: INDUSTRY — SBT TECH Innovations (industry.demo@skillnexus.ai)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Industry Demo Account ---');
  const industryUserId = await upsertUser(
    'industry.demo@skillnexus.ai',
    'COMPANY',
    'Kavitha N',
    '+91 98404 56789'
  );

  const { data: existingCompMember } = await client
    .from('company_members')
    .select('id')
    .eq('user_id', industryUserId)
    .limit(1);

  const compMemberPayload = {
    company_id: company.id,
    user_id: industryUserId,
    designation: 'Head of Technical Recruitment & University Relations',
    permissions: { can_post_jobs: true, can_shortlist: true, can_view_candidates: true },
    is_active: true
  };

  if (existingCompMember && existingCompMember.length > 0) {
    await client.from('company_members').update(compMemberPayload).eq('id', existingCompMember[0].id);
  } else {
    await client.from('company_members').insert(compMemberPayload);
  }
  console.log('✅ Industry talent acquisition lead linked to SBT TECH Innovations');

  // Preload an Industry Opportunity for SBT TECH
  const { data: existingOpps } = await client
    .from('opportunities')
    .select('id')
    .eq('company_id', company.id)
    .ilike('title', '%Full Stack%')
    .limit(1);

  if (!existingOpps || existingOpps.length === 0) {
    await client.from('opportunities').insert({
      company_id: company.id,
      title: 'Associate Full Stack AI Developer',
      opportunity_type: 'Internship',
      work_mode: 'Hybrid',
      location: 'Chennai / Coimbatore',
      stipend_text: '₹35,000 / month',
      salary_min: 600000,
      salary_max: 950000,
      min_cgpa: 7.5,
      min_readiness_score: 75,
      required_skills: ['React.js', 'Python', 'SQL', 'Data Structures'],
      preferred_skills: ['Cloud Computing', 'Git'],
      description: 'Looking for high-potential engineering graduates with strong proficiency in React.js, Python backend services, and structured problem-solving skills.',
      department: 'Computer Science and Engineering',
      graduation_year: 2027,
      deadline: '2026-12-31',
      status: 'ACTIVE',
      applicant_count: 12
    });
    console.log('✅ Preloaded SBT TECH industry opportunity with React.js & Python requirements.');
  }

  // Preload Welcome Notification for Student
  const { data: existingNotifs } = await client
    .from('notifications')
    .select('id')
    .eq('recipient_id', studentUserId)
    .limit(1);

  if (!existingNotifs || existingNotifs.length === 0) {
    await client.from('notifications').insert({
      recipient_type: 'student',
      recipient_id: studentUserId,
      notification_type: 'welcome',
      title: '🌟 Welcome to SkillNexus AI',
      message: 'Your Digital Passport and verified competencies are active for ABC Engineering College.',
      details: { role: 'student', verifiedSkills: 7 },
      is_read: false,
      is_deleted: false
    });
  }

  console.log('\n============================================================');
  console.log('🎉 MASTER SIH DEMO ACCOUNTS SEEDED SUCCESSFULLY');
  console.log('============================================================');
  console.log('1. STUDENT:     student.demo@skillnexus.ai      / Demo@2026');
  console.log('2. ACADEMICIAN: academician.demo@skillnexus.ai  / Demo@2026');
  console.log('3. INSTITUTION: institution.demo@skillnexus.ai  / Demo@2026');
  console.log('4. INDUSTRY:    industry.demo@skillnexus.ai     / Demo@2026');
  console.log('============================================================\n');
}

module.exports = { seedSihDemoData };

if (require.main === module) {
  seedSihDemoData().then(() => process.exit(0)).catch(err => {
    console.error('❌ [SIH SEED ERROR]:', err);
    process.exit(1);
  });
}

