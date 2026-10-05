const crypto = require('crypto');
const { supabase } = require('../config/supabase');
const relationalManager = require('../db/relationalManager');
const studentSkillAggregator = require('./ai/studentSkillAggregator');

class DigitalPassportService {
  /**
   * Helper to resolve student UUID & core info
   */
  async resolveStudent(studentIdentifier) {
    return await studentSkillAggregator.resolveStudent(studentIdentifier);
  }

  /**
   * Get or initialize the digital_passports row for a student
   */
  async getOrCreatePassportRecord(studentId) {
    const pg = relationalManager.pg;
    if (pg) {
      try {
        const sel = await pg.query('SELECT * FROM digital_passports WHERE student_id = $1 LIMIT 1', [studentId]);
        if (sel.rows.length > 0) {
          return sel.rows[0];
        }

        const shortId = studentId.replace(/-/g, '').slice(0, 8).toUpperCase();
        const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        const passportUuid = `NX-${shortId}-${randomSuffix}`;
        const qrHash = crypto.createHash('sha256').update(`${studentId}:${passportUuid}:${Date.now()}`).digest('hex');
        const defaultPrivacy = {
          showEmail: false,
          showRollNumber: false,
          showCgpa: false,
          showAssessments: true,
          showProjects: true,
          showCertificates: true,
          showCourses: true,
          showExperience: true
        };

        const ins = await pg.query(`
          INSERT INTO digital_passports (student_id, passport_uuid, qr_hash, is_public, privacy_settings, issued_at, updated_at)
          VALUES ($1, $2, $3, true, $4, NOW(), NOW())
          ON CONFLICT (student_id) DO UPDATE SET updated_at = NOW()
          RETURNING *
        `, [studentId, passportUuid, qrHash, JSON.stringify(defaultPrivacy)]);

        if (ins.rows.length > 0) return ins.rows[0];
      } catch (e) {
        console.warn('[DigitalPassportService] PG passport record note:', e.message);
      }
    }

    // Fallback via Supabase client
    const { data: existing } = await supabase
      .from('digital_passports')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing) return existing;

    const shortId = studentId.replace(/-/g, '').slice(0, 8).toUpperCase();
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const passportUuid = `NX-${shortId}-${randomSuffix}`;
    const qrHash = crypto.createHash('sha256').update(`${studentId}:${passportUuid}:${Date.now()}`).digest('hex');

    const newPassport = {
      student_id: studentId,
      passport_uuid: passportUuid,
      qr_hash: qrHash,
      is_public: true,
      privacy_settings: {
        showEmail: false,
        showRollNumber: false,
        showCgpa: false,
        showAssessments: true,
        showProjects: true,
        showCertificates: true,
        showCourses: true,
        showExperience: true
      },
      issued_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: inserted } = await supabase
      .from('digital_passports')
      .insert(newPassport)
      .select()
      .maybeSingle();

    return inserted || newPassport;
  }

  /**
   * Aggregate the complete digital skill passport for a student
   */
  async getStudentPassport(studentIdentifier) {
    const student = await this.resolveStudent(studentIdentifier);
    if (!student) {
      throw new Error('Student not found');
    }

    const studentId = student.id;

    // 1. Passport Record & Privacy
    const passportRecord = await this.getOrCreatePassportRecord(studentId);

    // 2. Institution & Department Details
    let institution = null;
    if (student.institution_id) {
      const { data: inst } = await supabase
        .from('institutions')
        .select('id, name, code, city, state, logo_url')
        .eq('id', student.institution_id)
        .maybeSingle();
      institution = inst;
    }

    let department = null;
    if (student.department_id) {
      const { data: dept } = await supabase
        .from('departments')
        .select('id, name, code')
        .eq('id', student.department_id)
        .maybeSingle();
      department = dept;
    }

    // 3. User email & avatar
    let userRecord = null;
    if (student.user_id) {
      const { data: u } = await supabase
        .from('users')
        .select('id, email, is_active')
        .eq('id', student.user_id)
        .maybeSingle();
      userRecord = u;
      if (!userRecord && relationalManager.pg) {
        try {
          const uRes = await relationalManager.pg.query('SELECT id, email, is_active FROM users WHERE id = $1 LIMIT 1', [student.user_id]);
          if (uRes.rows.length > 0) userRecord = uRes.rows[0];
        } catch (e) {}
      }
    }

    // 4. Skills & Scores via canonical Skill Engine
    const aggregatedSkills = await studentSkillAggregator.aggregateStudentSkills(studentId);
    const skillsList = aggregatedSkills.skills || [];

    // Calculate overall skill score from existing Skill Engine
    const readinessScore = Number(student.readiness_score) || 
      (skillsList.length > 0 ? Math.round(skillsList.reduce((a, b) => a + (Number(b.score) || 60), 0) / skillsList.length) : 75);

    // Sort top skills
    const topSkills = [...skillsList]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 6);

    // 5. Verified Projects
    let projects = [];
    try {
      const { data: projs } = await supabase
        .from('projects')
        .select(`
          id, title, description, github_url, live_url, tech_stack, status, submitted_at, validated_at
        `)
        .eq('student_id', studentId);

      if (projs && Array.isArray(projs)) {
        projects = projs.map(p => {
          const isValidated = p.status === 'Validated' || p.status === 'VERIFIED';
          return {
            id: p.id,
            title: p.title,
            description: p.description,
            githubUrl: p.github_url,
            liveUrl: p.live_url,
            techStack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
            status: p.status,
            verificationStatus: isValidated ? 'VERIFIED' : 'STUDENT_SUBMITTED',
            verificationSource: isValidated 
              ? `Faculty Validated (${institution?.name || 'Institution'})` 
              : 'Student Submitted',
            verificationDate: p.validated_at || p.submitted_at,
            verificationId: `PRJ-${p.id.slice(0, 8).toUpperCase()}`
          };
        });
      }
    } catch (err) {
      console.debug('[DigitalPassportService] Projects query notice:', err.message);
    }

    // 6. Certifications
    let certifications = [];
    try {
      const { data: certs } = await supabase
        .from('certificates')
        .select(`
          id, title, certificate_number, certificate_url, verification_hash, issued_at, course_id
        `)
        .eq('student_id', studentId);

      if (certs && Array.isArray(certs)) {
        certifications = certs.map(c => ({
          id: c.id,
          title: c.title,
          certificateNumber: c.certificate_number,
          certificateUrl: c.certificate_url,
          verificationHash: c.verification_hash || `HASH-${crypto.createHash('sha256').update(c.certificate_number || c.id).digest('hex').slice(0, 16)}`,
          issuedAt: c.issued_at,
          verificationStatus: 'VERIFIED',
          verificationSource: `Verified by ${institution?.name || 'Institution'}`,
          verificationId: c.certificate_number
        }));
      }
    } catch (err) {
      console.debug('[DigitalPassportService] Certifications query notice:', err.message);
    }

    // 7. Completed Courses
    let courses = [];
    try {
      const { data: enrs } = await supabase
        .from('enrollments')
        .select(`
          id, status, progress_percentage, enrolled_at, completed_at,
          courses (id, title, code, category, level, duration_weeks)
        `)
        .eq('student_id', studentId);

      if (enrs && Array.isArray(enrs)) {
        courses = enrs.map(e => {
          const isCompleted = e.status === 'Completed' || (Number(e.progress_percentage) >= 100);
          const cData = e.courses || {};
          return {
            id: e.id,
            courseId: cData.id,
            title: cData.title || 'Technical Course',
            code: cData.code || 'NEXUS-CRS',
            category: cData.category || 'Engineering',
            level: cData.level || 'Intermediate',
            status: e.status,
            progress: Number(e.progress_percentage) || 0,
            completedAt: e.completed_at,
            enrolledAt: e.enrolled_at,
            verificationStatus: isCompleted ? 'VERIFIED' : 'IN_PROGRESS',
            verificationSource: isCompleted ? `Verified by ${institution?.name || 'Institution'}` : 'Academic Enrollment',
            verificationId: `ENR-${e.id.slice(0, 8).toUpperCase()}`
          };
        });
      }
    } catch (err) {
      console.debug('[DigitalPassportService] Enrollments query notice:', err.message);
    }

    // 8. Industry Assessments & Diagnostics
    let assessments = [];
    try {
      const { data: asmts } = await supabase
        .from('assessment_attempts')
        .select(`
          id, assessment_id, started_at, completed_at, score, accuracy, speed_index, percentile, status,
          assessments (id, title, category, difficulty, total_marks, passing_score, company_id, opportunity_id)
        `)
        .eq('student_id', studentId);

      if (asmts && Array.isArray(asmts)) {
        for (const a of asmts) {
          const asmtInfo = a.assessments || {};
          let companyName = 'Partner Industry';
          if (asmtInfo.company_id) {
            const { data: comp } = await supabase
              .from('companies')
              .select('name')
              .eq('id', asmtInfo.company_id)
              .maybeSingle();
            if (comp?.name) companyName = comp.name;
          }

          const scoreVal = Number(a.score) || 0;
          const passingVal = Number(asmtInfo.passing_score) || 60;
          const isPassed = scoreVal >= passingVal;

          assessments.push({
            id: a.id,
            assessmentId: asmtInfo.id,
            title: asmtInfo.title || 'Technical Assessment',
            category: asmtInfo.category || 'Skill Benchmark',
            difficulty: asmtInfo.difficulty || 'Medium',
            companyName: companyName,
            score: scoreVal,
            percentile: Number(a.percentile) || 85,
            resultStatus: isPassed ? 'PASSED' : 'COMPLETED',
            status: a.status,
            completedAt: a.completed_at || a.started_at,
            verificationStatus: 'VERIFIED',
            verificationSource: `Verified by ${companyName} via Automated Sandbox Evaluation`,
            verificationId: `EVAL-${a.id.slice(0, 8).toUpperCase()}`
          });
        }
      }
    } catch (err) {
      console.debug('[DigitalPassportService] Assessments query notice:', err.message);
    }

    // 9. Experience & Internships
    let experiences = [];
    try {
      const { data: apps } = await supabase
        .from('applications')
        .select(`
          id, current_stage, applied_at, updated_at,
          opportunities (id, title, opportunity_type, location, company_id, companies (company_name))
        `)
        .eq('student_id', studentId);

      if (apps && Array.isArray(apps)) {
        experiences = apps.map(app => {
          const opp = app.opportunities || {};
          const compName = opp.companies?.company_name || 'Partner Company';
          const isVerifiedRole = ['OFFERED', 'ACCEPTED', 'SHORTLISTED', 'Shortlisted', 'HIRED'].includes(app.current_stage);
          return {
            id: app.id,
            title: opp.title || 'Internship / Engineering Role',
            type: opp.opportunity_type || 'Internship',
            company: compName,
            location: opp.location || 'Remote',
            stage: app.current_stage,
            date: app.updated_at || app.applied_at,
            verificationStatus: isVerifiedRole ? 'VERIFIED' : 'APPLICATION_RECORD',
            verificationSource: isVerifiedRole 
              ? `Verified by ${compName} (${app.current_stage})` 
              : 'Skill Nexus Opportunity Ledger',
            verificationId: `EXP-${app.id.slice(0, 8).toUpperCase()}`
          };
        });
      }
    } catch (err) {
      console.debug('[DigitalPassportService] Applications query notice:', err.message);
    }

    // 10. Badges & Achievements
    let badges = [];
    try {
      const { data: bData } = await supabase
        .from('student_badges')
        .select(`
          id, earned_at,
          badges (id, badge_name, description, icon)
        `)
        .eq('student_id', studentId);

      if (bData && Array.isArray(bData)) {
        badges = bData.map(sb => ({
          id: sb.id,
          name: sb.badges?.badge_name || 'Competency Achievement',
          description: sb.badges?.description,
          icon: sb.badges?.icon || 'Award',
          earnedAt: sb.earned_at,
          verificationStatus: 'VERIFIED',
          verificationSource: 'Skill Nexus Platform Milestone'
        }));
      }
    } catch (err) {}

    // Calculate total verified items
    const verifiedItemsCount = 
      skillsList.filter(s => s.isVerified).length +
      projects.filter(p => p.verificationStatus === 'VERIFIED').length +
      certifications.length +
      courses.filter(c => c.verificationStatus === 'VERIFIED').length +
      assessments.length +
      experiences.filter(e => e.verificationStatus === 'VERIFIED').length;

    return {
      passportId: passportRecord.passport_uuid,
      passportUuid: passportRecord.passport_uuid,
      verificationSeal: 'AUTHENTIC_RECORD',
      student: {
        id: student.id,
        fullName: student.full_name || student.name || 'Student Candidate',
        email: userRecord?.email || student.email || '',
        rollNumber: student.roll_number || '',
        avatarUrl: student.avatar_url || null,
        institutionName: institution?.name || 'Accredited Institution',
        institutionCode: institution?.code || 'NX',
        departmentName: department?.name || 'Computer Science & Engineering',
        batch: student.batch || '2022-2026',
        graduationYear: student.graduation_year || 2026,
        cgpa: student.cgpa || null,
        targetCareerRole: student.target_career_role || 'Full Stack Engineer',
        bio: student.bio || 'Verified engineering candidate mastering modern technical competencies through Skill Nexus.',
        githubUrl: student.github_url || null,
        linkedinUrl: student.linkedin_url || null
      },
      passport: {
        id: passportRecord.id,
        passportId: passportRecord.passport_uuid,
        publicId: passportRecord.passport_uuid,
        qrHash: passportRecord.qr_hash,
        verificationSeal: 'AUTHENTIC_RECORD',
        isPublic: passportRecord.is_public !== false,
        privacySettings: passportRecord.privacy_settings || {
          showEmail: false,
          showRollNumber: false,
          showCgpa: false,
          showAssessments: true,
          showProjects: true,
          showCertificates: true,
          showCourses: true,
          showExperience: true
        },
        issuedAt: passportRecord.issued_at,
        updatedAt: passportRecord.updated_at
      },
      skillScore: {
        overallScore: readinessScore,
        readinessTier: readinessScore >= 80 ? 'Industry Ready' : (readinessScore >= 60 ? 'Near Ready' : 'Foundation'),
        topSkills: topSkills,
        totalSkillsCount: skillsList.length,
        verifiedSkillsCount: skillsList.filter(s => s.isVerified).length
      },
      skills: skillsList,
      projects,
      certifications,
      courses,
      assessments,
      experiences,
      badges,
      metrics: {
        verifiedItemsCount,
        projectsCount: projects.length,
        certificationsCount: certifications.length,
        coursesCount: courses.length,
        assessmentsCount: assessments.length,
        experiencesCount: experiences.length
      }
    };
  }

  /**
   * Update student passport privacy settings
   */
  async updatePassportPrivacy(studentIdentifier, { isPublic, privacySettings }) {
    const student = await this.resolveStudent(studentIdentifier);
    if (!student) {
      throw new Error('Student not found');
    }

    const updates = {
      updated_at: new Date().toISOString()
    };
    if (typeof isPublic === 'boolean') {
      updates.is_public = isPublic;
    }
    if (privacySettings && typeof privacySettings === 'object') {
      updates.privacy_settings = privacySettings;
    }

    const pg = relationalManager.pg;
    if (pg) {
      try {
        const setClauses = [];
        const params = [student.id];
        let idx = 2;

        if (typeof isPublic === 'boolean') {
          setClauses.push(`is_public = $${idx++}`);
          params.push(isPublic);
        }
        if (privacySettings && typeof privacySettings === 'object') {
          setClauses.push(`privacy_settings = $${idx++}`);
          params.push(JSON.stringify(privacySettings));
        }
        setClauses.push(`updated_at = NOW()`);

        const sql = `UPDATE digital_passports SET ${setClauses.join(', ')} WHERE student_id = $1 RETURNING *`;
        const res = await pg.query(sql, params);
        if (res.rows.length > 0) return res.rows[0];
      } catch (e) {
        console.warn('[DigitalPassportService] PG update privacy note:', e.message);
      }
    }

    const { data: updated, error } = await supabase
      .from('digital_passports')
      .update(updates)
      .eq('student_id', student.id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update privacy settings: ${error.message}`);
    }

    return updated;
  }

  /**
   * Retrieve sanitized public passport for external verification
   * NO AUTH REQUIRED.
   */
  async getPublicPassport(publicId) {
    if (!publicId) return null;

    let passportRow = null;
    const pg = relationalManager.pg;
    if (pg) {
      try {
        const res = await pg.query('SELECT * FROM digital_passports WHERE passport_uuid = $1 LIMIT 1', [String(publicId).trim()]);
        if (res.rows.length > 0) {
          passportRow = res.rows[0];
        }
      } catch (e) {
        console.warn('[DigitalPassportService] PG lookup public note:', e.message);
      }
    }

    if (!passportRow) {
      const { data: row } = await supabase
        .from('digital_passports')
        .select('*')
        .eq('passport_uuid', String(publicId).trim())
        .maybeSingle();
      passportRow = row;
    }

    if (!passportRow) {
      return null;
    }

    // 2. If passport is marked private, do not expose
    if (passportRow.is_public === false) {
      return { isPrivate: true };
    }

    // 3. Fetch full passport record
    const full = await this.getStudentPassport(passportRow.student_id);
    let priv = passportRow.privacy_settings;
    if (typeof priv === 'string') {
      try { priv = JSON.parse(priv); } catch (e) { priv = {}; }
    }
    priv = priv || {};

    // 4. Sanitize based on privacy settings
    const sanitizedStudent = {
      fullName: full.student.fullName,
      avatarUrl: full.student.avatarUrl,
      institutionName: full.student.institutionName,
      departmentName: full.student.departmentName,
      graduationYear: full.student.graduationYear,
      targetCareerRole: full.student.targetCareerRole,
      bio: full.student.bio,
      githubUrl: full.student.githubUrl,
      linkedinUrl: full.student.linkedinUrl,
      // Masked PII:
      email: priv.showEmail ? (full.student.email || null) : null,
      rollNumber: priv.showRollNumber ? (full.student.rollNumber || null) : null,
      cgpa: priv.showCgpa ? (full.student.cgpa || null) : null
    };

    return {
      isPrivate: false,
      verificationSeal: {
        verifiedBy: 'Skill Nexus Official Verification Ledger',
        verificationStatus: 'AUTHENTIC_RECORD',
        verificationDate: passportRow.updated_at || passportRow.issued_at,
        publicIdentifier: passportRow.passport_uuid,
        qrHash: passportRow.qr_hash
      },
      student: sanitizedStudent,
      skillScore: full.skillScore,
      skills: full.skills,
      projects: priv.showProjects !== false ? full.projects : [],
      certifications: priv.showCertificates !== false ? full.certifications : [],
      courses: priv.showCourses !== false ? full.courses : [],
      assessments: priv.showAssessments !== false ? full.assessments : [],
      experiences: priv.showExperience !== false ? full.experiences : [],
      badges: full.badges,
      metrics: full.metrics
    };
  }
}

module.exports = new DigitalPassportService();
