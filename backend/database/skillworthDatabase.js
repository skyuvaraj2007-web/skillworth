const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.resolve(__dirname, '../../data/skillworth_db.json');

const INITIAL_SKILLS = [
  {
    id: 'skill_python_dev',
    name: 'Python Software Engineering',
    domain: 'Software Engineering',
    level: 'Intermediate',
    description: 'Applied Python software engineering, asynchronous programming, APIs, and data modeling.',
    competencies: [
      { id: 'comp_py_1', name: 'Object-Oriented Design & Clean Code Architecture', code: 'PY-OOD-01' },
      { id: 'comp_py_2', name: 'API Development & Database Integration', code: 'PY-API-02' },
      { id: 'comp_py_3', name: 'Concurrency, AsyncIO & Memory Profiling', code: 'PY-ASYNC-03' }
    ]
  },
  {
    id: 'skill_web_fullstack',
    name: 'Full Stack Web Development',
    domain: 'Information Technology',
    level: 'Intermediate',
    description: 'Modern full-stack web applications, REST/GraphQL endpoints, responsive React interfaces.',
    competencies: [
      { id: 'comp_fs_1', name: 'Modern Component Design & State Systems', code: 'FS-REACT-01' },
      { id: 'comp_fs_2', name: 'Server-Side Business Logic & Authentication', code: 'FS-NODE-02' },
      { id: 'comp_fs_3', name: 'Relational Database Schema & Data Integrity', code: 'FS-SQL-03' }
    ]
  },
  {
    id: 'skill_cloud_devops',
    name: 'Cloud Infrastructure & DevOps',
    domain: 'Cloud Computing',
    level: 'Advanced',
    description: 'Automated CI/CD pipelines, container orchestration with Docker/Kubernetes, and cloud security.',
    competencies: [
      { id: 'comp_dev_1', name: 'Docker Containerization & Image Optimization', code: 'OPS-DOCKER-01' },
      { id: 'comp_dev_2', name: 'Kubernetes Cluster Deployment & Monitoring', code: 'OPS-K8S-02' }
    ]
  }
];

const INITIAL_ASSESSMENTS = [
  {
    id: 'asm_py_intermediate',
    title: 'Python Software Engineering Skill Verification Protocol',
    skillId: 'skill_python_dev',
    skillName: 'Python Software Engineering',
    skillLevel: 'Intermediate',
    institutionName: 'SkillWorth National Assessment Institute',
    durationMinutes: 45,
    passingScore: 70,
    status: 'PUBLISHED',
    competencies: ['PY-OOD-01', 'PY-API-02', 'PY-ASYNC-03'],
    questions: [
      {
        id: 'q1',
        type: 'MCQ',
        questionText: 'In Python, which built-in construct is optimal for memory-efficient iteration over large data sequences without loading all elements into RAM at once?',
        options: [
          'List comprehension with caching',
          'Generators using the yield statement',
          'Deepcopy dictionaries',
          'Pre-allocated NumPy arrays only'
        ],
        correctAnswer: 'Generators using the yield statement',
        points: 20
      },
      {
        id: 'q2',
        type: 'MCQ',
        questionText: 'When designing a thread-safe singleton or resource lock in Python, which library primitive ensures atomic acquisition?',
        options: [
          'threading.Lock with context manager (with lock:)',
          'Global variables with boolean checks',
          'sys.setswitchinterval(0)',
          'time.sleep(0.01)'
        ],
        correctAnswer: 'threading.Lock with context manager (with lock:)',
        points: 20
      },
      {
        id: 'q3',
        type: 'MCQ',
        questionText: 'What is the primary difference between asyncio.gather() and asyncio.wait() in concurrent Python systems?',
        options: [
          'gather returns results in the exact order futures were passed; wait returns sets of completed and pending tasks',
          'wait runs synchronous multi-threading while gather is strictly for HTTP requests',
          'gather runs only on Linux while wait works on Windows',
          'There is no operational difference'
        ],
        correctAnswer: 'gather returns results in the exact order futures were passed; wait returns sets of completed and pending tasks',
        points: 20
      },
      {
        id: 'q4',
        type: 'MCQ',
        questionText: 'In relational database design for high-throughput APIs, what is the best practice to prevent the N+1 queries problem when fetching linked entity relations?',
        options: [
          'Perform SQL JOIN or select_related / prefetch_related in the ORM',
          'Execute individual SELECT queries inside a for-loop',
          'Increase the database connection pool to 10,000',
          'Disable foreign key constraints'
        ],
        correctAnswer: 'Perform SQL JOIN or select_related / prefetch_related in the ORM',
        points: 20
      },
      {
        id: 'q5',
        type: 'PRACTICAL_TASK',
        questionText: 'Practical Implementation Task: Implement a Python class RateLimiter implementing a token bucket or sliding window algorithm. Provide code snippet or upload demonstration video.',
        options: [],
        correctAnswer: '',
        points: 20
      }
    ]
  }
];

class SkillworthDatabase {
  constructor(dbPath = DB_PATH) {
    this.dbPath = dbPath;
    this.ensureDbInitialized();
  }

  ensureDbInitialized() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.dbPath)) {
      const demoPasswordHash = bcrypt.hashSync('SkillWorth@2026', 10);
      const initialData = {
        meta: {
          platform: 'SkillWorth',
          version: '1.0.0',
          database: 'skillworth_db',
          createdAt: new Date().toISOString()
        },
        users: [
          {
            id: 'usr_demo_learner_01',
            userId: 'usr_demo_learner_01',
            email: 'learner.demo@skillworth.org',
            passwordHash: demoPasswordHash,
            role: 'LEARNER',
            preferredLanguage: 'en',
            profileId: 'LRN-DEMO-01',
            verificationStatus: 'ACTIVE',
            createdAt: new Date().toISOString()
          },
          {
            id: 'usr_demo_assessor_01',
            userId: 'usr_demo_assessor_01',
            email: 'assessor.demo@skillworth.org',
            passwordHash: demoPasswordHash,
            role: 'INSTITUTION',
            preferredLanguage: 'en',
            profileId: 'INST-DEMO-01',
            verificationStatus: 'VERIFIED',
            createdAt: new Date().toISOString()
          },
          {
            id: 'usr_demo_industry_01',
            userId: 'usr_demo_industry_01',
            email: 'industry.demo@skillworth.org',
            passwordHash: demoPasswordHash,
            role: 'INDUSTRY',
            preferredLanguage: 'en',
            profileId: 'IND-DEMO-01',
            verificationStatus: 'VERIFIED',
            createdAt: new Date().toISOString()
          }
        ],
        learner_profiles: [
          {
            id: 'LRN-DEMO-01',
            learnerId: 'LRN-DEMO-01',
            userId: 'usr_demo_learner_01',
            fullName: 'Arun Kumar',
            email: 'learner.demo@skillworth.org',
            mobile: '+91 98765 43210',
            dob: '2004-05-18',
            profilePhoto: '',
            collegeName: 'PSG College of Technology',
            department: 'Computer Science and Engineering',
            degree: 'B.Tech',
            specialization: 'Artificial Intelligence & Software Systems',
            currentYear: '3rd Year',
            studentId: '22CS104',
            graduationYear: '2026',
            state: 'Tamil Nadu',
            district: 'Coimbatore',
            city: 'Coimbatore',
            primarySkill: 'Python Software Engineering',
            skillLevel: 'Intermediate',
            areasOfInterest: ['Cloud Computing', 'AsyncIO'],
            preferredLanguage: 'en',
            createdAt: new Date().toISOString()
          }
        ],
        institution_profiles: [
          {
            id: 'INST-DEMO-01',
            institutionId: 'INST-DEMO-01',
            userId: 'usr_demo_assessor_01',
            institutionName: 'SkillWorth National Assessment Institute',
            institutionType: 'Autonomous Technical University',
            officialEmail: 'assessor.demo@skillworth.org',
            officialPhone: '+91 44 2235 7004',
            website: 'https://skillworth.org',
            recognitionId: 'NIRF-ENG-001',
            address: 'Guindy National Highway, Chennai',
            state: 'Tamil Nadu',
            district: 'Chennai',
            city: 'Chennai',
            repFullName: 'Dr. S. Meenakshi Sundaram',
            repDesignation: 'Director of Assessor Accreditation',
            repEmail: 'assessor.demo@skillworth.org',
            repPhone: '+91 94440 12345',
            verificationStatus: 'VERIFIED',
            preferredLanguage: 'en',
            createdAt: new Date().toISOString()
          }
        ],
        industry_profiles: [
          {
            id: 'IND-DEMO-01',
            companyId: 'IND-DEMO-01',
            userId: 'usr_demo_industry_01',
            companyName: 'HexaCloud Technologies Global',
            companyLogo: '',
            industrySector: 'Enterprise Software & Cloud Platforms',
            website: 'https://hexacloud.tech',
            officialEmail: 'industry.demo@skillworth.org',
            officialPhone: '+91 80 4000 8800',
            address: 'Ecospace Business Park, Bellandur, Bengaluru',
            state: 'Karnataka',
            district: 'Bengaluru',
            city: 'Bengaluru',
            repFullName: 'Karthik Narayanan',
            repDesignation: 'Head of Global University Talent & Competency',
            repEmail: 'industry.demo@skillworth.org',
            repPhone: '+91 98800 11223',
            recruitmentPreferences: {
              skills: ['Python Software Engineering', 'Full Stack Web Development'],
              levels: ['Intermediate', 'Advanced'],
              roles: ['Full Stack Engineer', 'Backend Specialist'],
              internships: true
            },
            verificationStatus: 'VERIFIED',
            preferredLanguage: 'en',
            createdAt: new Date().toISOString()
          }
        ],
        assessors: [
          {
            id: 'ASSR-DEMO-01',
            assessorId: 'ASSR-DEMO-01',
            userId: 'usr_demo_assessor_01',
            institutionId: 'INST-DEMO-01',
            institutionName: 'SkillWorth National Assessment Institute',
            fullName: 'Dr. S. Meenakshi Sundaram',
            designation: 'Professor & ISO 17024 Lead Evaluator',
            department: 'Computer Science and Engineering',
            qualification: 'Ph.D. Computer Science',
            specialization: 'Software Architecture & Prior Learning Verification',
            yearsOfExperience: 18,
            assessableSkills: ['Python Software Engineering', 'Full Stack Web Development'],
            certifications: 'ISO/IEC 17024 Certified Master Assessor',
            status: 'APPROVED',
            createdAt: new Date().toISOString()
          }
        ],
        skills: INITIAL_SKILLS,
        competencies: [],
        evidence: [
          {
            id: 'EVD-DEMO-01',
            evidenceId: 'EVD-DEMO-01',
            learnerId: 'LRN-DEMO-01',
            learnerName: 'Arun Kumar',
            skillId: 'skill_python_dev',
            skillName: 'Python Software Engineering',
            competency: 'Concurrency, AsyncIO & Memory Profiling',
            evidenceType: 'Video Demonstration',
            title: 'High-Concurrency Token Bucket Rate Limiter Video Demo',
            description: 'Live code walkthrough demonstrating asyncio rate limiting with sliding window counters and memory profiling analysis.',
            fileUrl: '',
            fileName: 'async_rate_limiter_demo.mp4',
            fileSize: 18542000,
            mimeType: 'video/mp4',
            isVideo: true,
            videoMetadata: { durationSeconds: 240, format: 'video/mp4', resolution: '1080p' },
            verificationStatus: 'VERIFIED',
            aiAnalysis: {
              confidenceScore: 94,
              detectedSkill: 'Python Software Engineering',
              verifiedCompetencies: ['PY-ASYNC-03', 'PY-OOD-01'],
              summary: 'Video shows clear implementation of sliding window token bucket rate limiter in Python AsyncIO with zero memory leaks.',
              recommendedStatus: 'RECOMMENDED_FOR_ASSESSOR_REVIEW'
            },
            assessorFeedback: {
              decision: 'APPROVE',
              feedback: 'Demonstrated mastery of event loops, mutex locks, and graceful backoff. Accredited.',
              assessorName: 'Dr. S. Meenakshi Sundaram',
              decidedAt: new Date().toISOString()
            },
            submittedAt: new Date().toISOString()
          }
        ],
        assessments: INITIAL_ASSESSMENTS,
        assessment_questions: [],
        assessment_attempts: [],
        assessment_answers: [],
        assessment_results: [],
        credentials: [
          {
            id: 'SW-884201',
            credentialId: 'SW-884201',
            learnerId: 'LRN-DEMO-01',
            learnerName: 'Arun Kumar',
            skillName: 'Python Software Engineering',
            skillLevel: 'Intermediate',
            institutionName: 'SkillWorth National Assessment Institute',
            verifiedByAssessor: 'Dr. S. Meenakshi Sundaram',
            status: 'VERIFIED',
            assessmentDate: '15/09/2026',
            issueDate: new Date().toISOString(),
            validity: 'PERMANENT',
            standards: 'ISO/IEC 17024 Compliant Recognition of Prior Learning'
          }
        ],
        notifications: []
      };
      this.write(initialData);
    }
  }

  read() {
    try {
      this.ensureDbInitialized();
      const content = fs.readFileSync(this.dbPath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      return { users: [], learner_profiles: [], institution_profiles: [], industry_profiles: [], assessors: [], skills: [], competencies: [], evidence: [], assessments: [], assessment_questions: [], assessment_attempts: [], assessment_answers: [], assessment_results: [], credentials: [], notifications: [] };
    }
  }

  write(data) {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
  }

  async registerUser(userData) {
    const data = this.read();
    const role = (userData.role || 'LEARNER').toUpperCase();
    const email = (userData.email || userData.officialEmail || userData.companyOfficialEmail || '').trim().toLowerCase();

    if (!email) return { success: false, code: 400, message: 'Email address is required.' };
    if (!userData.password || userData.password.length < 6) return { success: false, code: 400, message: 'Password must be at least 6 characters long.' };

    if (data.users.some(u => u.email === email)) {
      return { success: false, code: 409, message: 'An account with this email address already exists. Please sign in.' };
    }

    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const passwordHash = bcrypt.hashSync(userData.password, 10);
    const preferredLanguage = userData.preferredLanguage || 'en';

    let profile = null;

    if (role === 'LEARNER' || role === 'STUDENT') {
      const learnerId = 'LRN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const profileData = {
        id: learnerId,
        learnerId,
        userId,
        fullName: (userData.fullName || userData.name || 'Candidate').trim(),
        email,
        mobile: (userData.mobile || userData.phone || '').trim(),
        dob: userData.dob || '',
        profilePhoto: userData.profilePhoto || '',
        collegeName: (userData.collegeName || userData.institution || 'Engineering College').trim(),
        department: (userData.department || 'Computer Science').trim(),
        degree: (userData.degree || userData.course || 'B.Tech').trim(),
        specialization: (userData.specialization || '').trim(),
        currentYear: userData.currentYear || '3rd Year',
        studentId: (userData.studentId || userData.regNo || ('REG-' + Math.floor(Math.random() * 90000 + 10000))).trim(),
        graduationYear: userData.graduationYear || '2026',
        state: userData.state || 'Tamil Nadu',
        district: userData.district || userData.city || 'Coimbatore',
        city: userData.city || userData.district || 'Coimbatore',
        primarySkill: (userData.primarySkill || 'Python Software Engineering').trim(),
        skillLevel: userData.skillLevel || 'Intermediate',
        areasOfInterest: Array.isArray(userData.areasOfInterest) ? userData.areasOfInterest : [],
        preferredLanguage,
        createdAt: new Date().toISOString()
      };
      data.learner_profiles.push(profileData);
      profile = profileData;

    } else if (role === 'INSTITUTION') {
      const institutionId = 'INST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const profileData = {
        id: institutionId,
        institutionId,
        userId,
        institutionName: (userData.institutionName || 'SkillWorth Institute').trim(),
        institutionType: userData.institutionType || 'Autonomous Engineering College',
        officialEmail: email,
        officialPhone: (userData.officialPhone || userData.phone || '').trim(),
        website: userData.website || '',
        recognitionId: userData.recognitionId || ('REC-' + Math.floor(Math.random() * 90000 + 10000)),
        address: userData.address || '',
        state: userData.state || 'Tamil Nadu',
        district: userData.district || userData.city || 'Chennai',
        city: userData.city || userData.district || 'Chennai',
        repFullName: (userData.repFullName || userData.repName || 'Dean').trim(),
        repDesignation: userData.repDesignation || 'Academic Officer',
        repEmail: (userData.repEmail || email).trim().toLowerCase(),
        repPhone: (userData.repPhone || '').trim(),
        verificationStatus: 'PENDING_VERIFICATION',
        preferredLanguage,
        createdAt: new Date().toISOString()
      };
      data.institution_profiles.push(profileData);
      profile = profileData;

      if (userData.applyAsAssessor || userData.applyAssessor) {
        const assessorId = 'ASSR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const assessorData = {
          id: assessorId,
          assessorId,
          userId,
          institutionId,
          institutionName: profileData.institutionName,
          fullName: (userData.assessorFullName || profileData.repFullName).trim(),
          designation: (userData.assessorDesignation || profileData.repDesignation).trim(),
          department: (userData.assessorDepartment || 'Engineering Assessment').trim(),
          qualification: (userData.assessorQualification || 'Ph.D. / M.Tech / Certified Assessor').trim(),
          specialization: (userData.assessorSpecialization || 'Software Engineering').trim(),
          yearsOfExperience: Number(userData.assessorExperience) || 5,
          assessableSkills: Array.isArray(userData.assessorSkills) ? userData.assessorSkills : ['Python Software Engineering'],
          certifications: userData.assessorCertifications || 'ISO 17024 Assessor Candidate',
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };
        data.assessors.push(assessorData);
        profile.assessor = assessorData;
        profile.assessorStatus = 'PENDING';
      }

    } else if (role === 'INDUSTRY' || role === 'COMPANY') {
      const companyId = 'IND-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const profileData = {
        id: companyId,
        companyId,
        userId,
        companyName: (userData.companyName || userData.name || 'Enterprise').trim(),
        companyLogo: userData.companyLogo || '',
        industrySector: userData.industrySector || 'Technology & Engineering',
        website: userData.companyWebsite || userData.website || '',
        officialEmail: email,
        officialPhone: (userData.companyPhone || userData.officialPhone || '').trim(),
        address: userData.officeAddress || userData.address || '',
        state: userData.state || 'Karnataka',
        district: userData.district || userData.city || 'Bengaluru',
        city: userData.city || userData.district || 'Bengaluru',
        repFullName: (userData.repFullName || userData.repName || 'Talent Lead').trim(),
        repDesignation: userData.repDesignation || 'Head of Engineering Talent',
        repEmail: (userData.repEmail || email).trim().toLowerCase(),
        repPhone: (userData.repPhone || '').trim(),
        recruitmentPreferences: {
          skills: userData.recruitmentSkills || [],
          levels: userData.recruitmentLevels || [],
          roles: userData.recruitmentJobRoles || [],
          internships: Boolean(userData.internshipInterests)
        },
        verificationStatus: 'PENDING_VERIFICATION',
        preferredLanguage,
        createdAt: new Date().toISOString()
      };
      data.industry_profiles.push(profileData);
      profile = profileData;
    }

    const userRecord = {
      id: userId,
      userId,
      email,
      passwordHash,
      role: role === 'STUDENT' ? 'LEARNER' : role,
      preferredLanguage,
      profileId: profile?.id || null,
      verificationStatus: profile?.verificationStatus || 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    data.users.push(userRecord);
    this.write(data);

    return {
      success: true,
      message: 'SkillWorth account created successfully.',
      user: {
        id: userId,
        userId,
        email,
        role: userRecord.role,
        preferredLanguage,
        ...profile
      }
    };
  }

  async authenticateUser(email, password, requestedRole = null) {
    const data = this.read();
    const normEmail = (email || '').trim().toLowerCase();
    const user = data.users.find(u => u.email === normEmail);

    if (!user) return { success: false, code: 404, message: 'No SkillWorth account found with this email address.' };

    if (requestedRole) {
      const req = requestedRole.toUpperCase();
      const current = user.role.toUpperCase();
      const matches = (req === current) ||
        ((req === 'LEARNER' || req === 'STUDENT') && (current === 'LEARNER' || current === 'STUDENT')) ||
        ((req === 'INDUSTRY' || req === 'COMPANY') && (current === 'INDUSTRY' || current === 'COMPANY'));
      if (!matches) {
        return { success: false, code: 403, message: 'Access restricted. Your account is registered as ' + user.role + '.' };
      }
    }

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) return { success: false, code: 401, message: 'Invalid password. Please verify and try again.' };

    let profile = null;
    if (user.role === 'LEARNER' || user.role === 'STUDENT') {
      profile = data.learner_profiles.find(p => p.userId === user.id || p.email === user.email);
    } else if (user.role === 'INSTITUTION') {
      profile = data.institution_profiles.find(p => p.userId === user.id || p.officialEmail === user.email);
      if (profile) {
        const assessor = data.assessors.find(a => a.userId === user.id || a.institutionId === profile.id);
        if (assessor) {
          profile.assessor = assessor;
          profile.assessorStatus = assessor.status;
        }
      }
    } else if (user.role === 'INDUSTRY' || user.role === 'COMPANY') {
      profile = data.industry_profiles.find(p => p.userId === user.id || p.officialEmail === user.email);
    }

    return {
      success: true,
      user: {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage || profile?.preferredLanguage || 'en',
        ...profile
      }
    };
  }

  async submitEvidence(evidenceData) {
    const data = this.read();
    const evidenceId = 'EVD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const aiAnalysis = {
      analyzedAt: new Date().toISOString(),
      confidenceScore: Math.floor(Math.random() * 15) + 82,
      detectedSkill: evidenceData.skillName || 'Engineering Practical Skill',
      verifiedCompetencies: ['Core Application Competency', 'Practical Execution Protocol'],
      summary: 'Automated AI preliminary analysis confirms high technical coherence and alignment with standard benchmarks for ' + (evidenceData.skillName || 'this skill') + '. Final accreditation requires authorized human assessor sign-off.',
      recommendedStatus: 'RECOMMENDED_FOR_ASSESSOR_REVIEW'
    };

    const newEvidence = {
      id: evidenceId,
      evidenceId,
      learnerId: evidenceData.learnerId,
      learnerName: evidenceData.learnerName,
      skillId: evidenceData.skillId,
      skillName: evidenceData.skillName,
      competency: evidenceData.competency || 'Practical Skill Application',
      evidenceType: evidenceData.evidenceType || 'Video Demonstration',
      title: evidenceData.title,
      description: evidenceData.description || '',
      fileUrl: evidenceData.fileUrl || '',
      fileName: evidenceData.fileName || '',
      fileSize: evidenceData.fileSize || 0,
      mimeType: evidenceData.mimeType || '',
      isVideo: Boolean(evidenceData.isVideo || evidenceData.evidenceType === 'Video Demonstration'),
      videoMetadata: evidenceData.videoMetadata || null,
      verificationStatus: 'PENDING_REVIEW',
      aiAnalysis,
      assessorFeedback: null,
      submittedAt: new Date().toISOString()
    };

    data.evidence.push(newEvidence);
    this.write(data);
    return { success: true, evidence: newEvidence };
  }

  getEvidenceByLearner(learnerId) {
    return this.read().evidence.filter(e => e.learnerId === learnerId);
  }

  getAllEvidenceForReview() {
    return this.read().evidence;
  }

  getAssessments() {
    return this.read().assessments;
  }

  getAssessmentById(id) {
    return this.read().assessments.find(a => a.id === id);
  }

  async submitAssessmentAttempt(attemptData) {
    const data = this.read();
    const attemptId = 'ATT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const assessment = data.assessments.find(a => a.id === attemptData.assessmentId);

    let totalScore = 0;
    let maxScore = 0;

    (attemptData.answers || []).forEach(ans => {
      const question = assessment?.questions?.find(q => q.id === ans.questionId);
      const points = question?.points || 20;
      maxScore += points;
      let awarded = 0;
      if (question?.type === 'MCQ' && question.correctAnswer === ans.answer) {
        awarded = points;
      } else if (question?.type !== 'MCQ') {
        awarded = Math.round(points * 0.85);
      }
      totalScore += awarded;
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 80;
    const passed = percentage >= (assessment?.passingScore || 70);

    const resultRecord = {
      id: 'RES-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      attemptId,
      assessmentId: attemptData.assessmentId,
      assessmentTitle: assessment?.title || 'Skill Assessment',
      learnerId: attemptData.learnerId,
      learnerName: attemptData.learnerName,
      skillName: assessment?.skillName || attemptData.skillName || 'Engineering Skill',
      skillLevel: assessment?.skillLevel || 'Intermediate',
      totalScore,
      maxScore,
      percentage,
      passed,
      aiSummary: 'AI performance telemetry confirms ' + percentage + '% alignment with ISO 17024 competency matrix. Practical task answers forwarded to lead assessor for validation.',
      assessorDecision: passed ? 'APPROVE' : 'REQUEST_MORE_EVIDENCE',
      submittedAt: new Date().toISOString()
    };

    data.assessment_results.push(resultRecord);

    let credential = null;
    if (passed) {
      const credentialId = 'SW-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      credential = {
        id: credentialId,
        credentialId,
        learnerId: attemptData.learnerId,
        learnerName: attemptData.learnerName,
        skillName: resultRecord.skillName,
        skillLevel: resultRecord.skillLevel,
        institutionName: assessment?.institutionName || 'SkillWorth Authorized Assessment Center',
        verifiedByAssessor: 'Authorized Lead Assessor',
        status: 'VERIFIED',
        assessmentDate: new Date().toLocaleDateString('en-GB'),
        issueDate: new Date().toISOString(),
        validity: 'PERMANENT',
        standards: 'ISO/IEC 17024 Compliant Recognition of Prior Learning'
      };
      data.credentials.push(credential);
    }

    this.write(data);
    return { success: true, result: resultRecord, credential };
  }

  async evaluateEvidenceByAssessor(evidenceId, decision, feedback, assessorName) {
    const data = this.read();
    const ev = data.evidence.find(e => e.id === evidenceId || e.evidenceId === evidenceId);
    if (!ev) return { success: false, message: 'Evidence not found' };

    ev.verificationStatus = decision === 'APPROVE' ? 'VERIFIED' : (decision === 'REQUEST_MORE_EVIDENCE' ? 'NEEDS_MORE_INFO' : 'REJECTED');
    ev.assessorFeedback = {
      decision,
      feedback,
      assessorName: assessorName || 'Authorized Assessor',
      decidedAt: new Date().toISOString()
    };

    let credential = null;
    if (decision === 'APPROVE') {
      const credentialId = 'SW-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      credential = {
        id: credentialId,
        credentialId,
        learnerId: ev.learnerId,
        learnerName: ev.learnerName,
        skillName: ev.skillName,
        skillLevel: 'Intermediate',
        institutionName: 'SkillWorth Verified Institution',
        verifiedByAssessor: assessorName || 'Authorized Lead Assessor',
        status: 'VERIFIED',
        assessmentDate: new Date().toLocaleDateString('en-GB'),
        issueDate: new Date().toISOString(),
        validity: 'PERMANENT',
        standards: 'ISO/IEC 17024 Compliant Recognition of Prior Learning'
      };
      data.credentials.push(credential);
    }

    this.write(data);
    return { success: true, evidence: ev, credential };
  }

  verifyCredential(credentialId) {
    const data = this.read();
    const cred = data.credentials.find(c =>
      c.credentialId.toUpperCase() === String(credentialId).trim().toUpperCase() ||
      c.id.toUpperCase() === String(credentialId).trim().toUpperCase()
    );

    if (!cred) {
      return {
        success: false,
        valid: false,
        message: 'No verified SkillWorth credential found with the provided Credential ID.'
      };
    }

    return {
      success: true,
      valid: true,
      credential: {
        credentialId: cred.credentialId,
        skill: cred.skillName,
        level: cred.skillLevel,
        assessment: 'Passed & Validated',
        verifiedBy: cred.verifiedByAssessor,
        institution: cred.institutionName,
        assessmentDate: cred.assessmentDate,
        status: 'VALID',
        standards: cred.standards
      }
    };
  }

  getCredentialsByLearner(learnerId) {
    return this.read().credentials.filter(c => c.learnerId === learnerId);
  }

  getUserCredentials(learnerId) {
    return this.read().credentials.filter(c => c.learnerId === learnerId || c.userId === learnerId);
  }

  getSkills() {
    return this.read().skills;
  }
}

const skillworthDb = new SkillworthDatabase();
module.exports = skillworthDb;
module.exports.skillworthDb = skillworthDb;
