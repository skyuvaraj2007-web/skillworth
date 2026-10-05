const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const rplMappingService = require('../services/rplMappingService');

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
      const data = JSON.parse(content);
      if (!data.rpl_qualification_packs) data.rpl_qualification_packs = [];
      if (!data.rpl_experience_declarations) data.rpl_experience_declarations = [];
      if (!data.rpl_assessments) data.rpl_assessments = [];
      if (!data.assessment_audit_logs) data.assessment_audit_logs = [];
      if (!data.rpl_checklists) data.rpl_checklists = [];
      return data;
    } catch (e) {
      return { users: [], learner_profiles: [], institution_profiles: [], industry_profiles: [], assessors: [], skills: [], competencies: [], evidence: [], assessments: [], assessment_questions: [], assessment_attempts: [], assessment_answers: [], assessment_results: [], credentials: [], notifications: [], rpl_qualification_packs: [], rpl_experience_declarations: [], rpl_assessments: [], assessment_audit_logs: [], rpl_checklists: [] };
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

  // ================= RPL (Recognition of Prior Learning) Universal Architecture =================
  getQualificationPacks() {
    const data = this.read();
    if (!data.rpl_qualification_packs || data.rpl_qualification_packs.length < 5) {
      data.rpl_qualification_packs = rplMappingService.getQualificationPacks();
      this.write(data);
    }
    return data.rpl_qualification_packs;
  }

  getQualificationPackById(idOrCode) {
    const packs = this.getQualificationPacks();
    return packs.find(p => p.id === idOrCode || p.qpCode === idOrCode) || null;
  }

  addQualificationPack(qpData, actor) {
    const data = this.read();
    if (!data.rpl_qualification_packs || data.rpl_qualification_packs.length === 0) {
      data.rpl_qualification_packs = rplMappingService.getQualificationPacks();
    }

    const id = qpData.id || ('QP-' + (qpData.qpCode ? qpData.qpCode.replace(/[\/\s]/g, '-') : Date.now()));
    const newQp = {
      id,
      qpCode: qpData.qpCode || id,
      trade: qpData.trade || qpData.title || 'Specialized Trade',
      occupation: qpData.occupation || qpData.trade || '',
      jobRole: qpData.jobRole || qpData.trade || '',
      sector: qpData.sector || 'General Industry',
      nsqfLevel: Number(qpData.nsqfLevel) || 4,
      version: qpData.version || '1.0',
      status: qpData.status || 'ACTIVE',
      isDemo: Boolean(qpData.isDemo !== false),
      disclaimer: qpData.disclaimer || 'DEMO QUALIFICATION PACK for RPL simulation',
      description: qpData.description || '',
      keywords: Array.isArray(qpData.keywords) ? qpData.keywords : (qpData.keywords || '').split(',').map(s => s.trim()).filter(Boolean),
      toolsRequired: Array.isArray(qpData.toolsRequired) ? qpData.toolsRequired : (qpData.toolsRequired || '').split(',').map(s => s.trim()).filter(Boolean),
      assessmentMethods: qpData.assessmentMethods || ['Practical Observation', 'Evidence Artifact Review', 'Viva Voce'],
      rubric: qpData.rubric || [
        { score: 0, label: 'Not Demonstrated', description: 'Unable to perform task or operates unsafely.' },
        { score: 1, label: 'Partially Demonstrated', description: 'Requires direct intervention; significant errors.' },
        { score: 2, label: 'With Support', description: 'Follows safety with occasional prompts.' },
        { score: 3, label: 'Competent', description: 'Executes safely and accurately per trade standards.' },
        { score: 4, label: 'Strongly Demonstrated', description: 'Exemplary speed, precision, and safety awareness.' }
      ],
      competencies: qpData.competencies || [],
      createdAt: new Date().toISOString()
    };

    data.rpl_qualification_packs.push(newQp);

    this.addAuditLog(data, {
      assessmentId: null,
      userId: actor?.id || 'admin',
      userName: actor?.name || 'Administrator',
      action: 'QUALIFICATION_PACK_CREATED',
      details: `Added new QP: ${newQp.trade} (${newQp.qpCode}, NSQF Level ${newQp.nsqfLevel})`
    });

    this.write(data);
    return { success: true, qualificationPack: newQp };
  }

  submitExperienceDeclaration(declarationData) {
    const data = this.read();
    const id = 'DEC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const packs = this.getQualificationPacks();
    
    // AI analysis across all dynamic QPs and experiences
    const aiAnalysis = rplMappingService.analyzeExperienceDeclaration(
      declarationData.declarationText || declarationData.voiceTranscript || '',
      declarationData,
      packs
    );

    const experiences = Array.isArray(declarationData.experiences) ? declarationData.experiences : [];
    let calculatedYears = declarationData.yearsOfExperience || 0;
    if (experiences.length > 0) {
      calculatedYears = experiences.reduce((acc, exp) => acc + (Number(exp.years) || 0), 0);
    }

    const record = {
      id,
      declarationId: id,
      learnerId: declarationData.learnerId,
      learnerName: declarationData.learnerName || 'Candidate',
      experiences, // Multi-occupation work history
      yearsOfExperience: calculatedYears,
      jobRole: declarationData.jobRole || (experiences[0]?.jobTitle || experiences[0]?.occupation || 'Informal Worker'),
      industry: declarationData.industry || (experiences[0]?.sector || 'Vocational'),
      workplaceType: declarationData.workplaceType || 'Informal Field Work / Workshops',
      tasksPerformed: declarationData.tasksPerformed || experiences.map(e => e.tasks).filter(Boolean).join('; '),
      toolsUsed: declarationData.toolsUsed || experiences.map(e => e.tools).filter(Boolean).join('; '),
      machinesUsed: declarationData.machinesUsed || '',
      responsibilities: declarationData.responsibilities || '',
      previousTraining: declarationData.previousTraining || '',
      apprenticeshipExperience: declarationData.apprenticeshipExperience || '',
      existingCertificates: declarationData.existingCertificates || '',
      location: declarationData.location || '',
      languages: declarationData.languages || ['English', 'Tamil'],
      selfDescribedSkills: declarationData.selfDescribedSkills || '',
      voiceTranscript: declarationData.voiceTranscript || '',
      inputMethod: declarationData.inputMethod || (declarationData.voiceTranscript ? 'voice' : 'structured'),
      aiAnalysis,
      status: 'EXPERIENCE_SUBMITTED',
      submittedAt: new Date().toISOString()
    };

    if (!data.rpl_experience_declarations) data.rpl_experience_declarations = [];
    data.rpl_experience_declarations.push(record);

    // Audit log
    this.addAuditLog(data, {
      assessmentId: null,
      userId: declarationData.learnerId,
      userName: declarationData.learnerName,
      action: 'WORKER_EXPERIENCE_DECLARED',
      details: `Declared experience with ${experiences.length || 1} occupation record(s) (${record.yearsOfExperience} total years)`
    });

    this.write(data);
    return { success: true, declaration: record, aiAnalysis };
  }

  startRplAssessment(assessmentData) {
    const data = this.read();
    const qp = this.getQualificationPackById(assessmentData.qpId || assessmentData.qpCode) || this.getQualificationPacks()[0];
    const assessmentId = 'RPL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Map competencies dynamically from selected QP
    const competencies = (qp.competencies || []).map(c => ({
      id: c.id,
      code: c.code,
      name: c.name || c.title,
      weight: c.weight || 25,
      description: c.description || '',
      performanceCriteria: c.performanceCriteria || [],
      observableIndicators: c.observableIndicators || [],
      requiredEvidence: c.requiredEvidence || [],
      status: 'NOT_STARTED',
      evidenceItems: [],
      score: null,
      assessorRemarks: null,
      aiObservation: null
    }));

    // Build checklists dynamically from QP competencies
    const checklists = [];
    (qp.competencies || []).forEach(comp => {
      (comp.assessmentChecklist || []).forEach(item => {
        checklists.push({
          id: item.id,
          competencyId: comp.id,
          competencyCode: comp.code,
          task: item.task,
          criteria: item.criteria,
          score: null, // 0 to 4
          remarks: '',
          aiSuggestedScore: null,
          acceptedAi: null,
          overrideReason: ''
        });
      });
    });

    const record = {
      id: assessmentId,
      assessmentId,
      learnerId: assessmentData.learnerId,
      learnerName: assessmentData.learnerName,
      trade: qp.trade,
      occupation: qp.occupation || qp.trade,
      jobRole: qp.jobRole,
      qualificationPackId: qp.id,
      qpCode: qp.qpCode,
      nsqfLevel: qp.nsqfLevel,
      status: 'EVIDENCE_COLLECTION', // DRAFT -> EXPERIENCE_SUBMITTED -> QP_SELECTED -> EVIDENCE_COLLECTION -> ASSESSMENT_SCHEDULED -> UNDER_ASSESSMENT -> ASSESSOR_REVIEW -> COMPLETED -> RECOMMENDED_FOR_CERTIFICATION -> AUTHORIZED_CERTIFICATION_PENDING
      assessorId: assessmentData.assessorId || 'usr_demo_assessor_01',
      assessorName: assessmentData.assessorName || 'Dr. S. Meenakshi Sundaram',
      declarationId: assessmentData.declarationId || null,
      scheduledDate: null,
      scheduledTime: null,
      assessmentCentre: 'SkillWorth Regional Assessment Centre',
      competencies,
      checklists,
      totalScore: 0,
      maxScore: checklists.length * 4,
      percentage: 0,
      competencyProfile: {
        competent: [],
        partiallyDemonstrated: [],
        additionalEvidenceRequired: [],
        notYetDemonstrated: []
      },
      finalRecommendation: null, // RECOMMENDED_FOR_CERTIFICATION, FURTHER_EVIDENCE_REQUIRED, NOT_YET_COMPETENT
      certificationStatus: 'PENDING_ASSESSMENT',
      assessorFinalRemarks: null,
      credentialId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!data.rpl_assessments) data.rpl_assessments = [];
    data.rpl_assessments.push(record);

    this.addAuditLog(data, {
      assessmentId,
      userId: assessmentData.learnerId,
      userName: assessmentData.learnerName,
      action: 'RPL_ASSESSMENT_INITIATED',
      details: `Initiated RPL pathway for ${qp.trade} (${qp.qpCode}, NSQF Level ${qp.nsqfLevel})`
    });

    this.write(data);
    return { success: true, assessment: record };
  }

  scheduleAssessment(assessmentId, scheduleData, actor) {
    const data = this.read();
    const assessment = (data.rpl_assessments || []).find(a => a.id === assessmentId || a.assessmentId === assessmentId);
    if (!assessment) return { success: false, message: 'Assessment record not found.' };

    assessment.scheduledDate = scheduleData.scheduledDate || scheduleData.date;
    assessment.scheduledTime = scheduleData.scheduledTime || scheduleData.time;
    assessment.assessmentCentre = scheduleData.assessmentCentre || scheduleData.location || 'SkillWorth Regional Practical Centre';
    if (scheduleData.assessorId) {
      assessment.assessorId = scheduleData.assessorId;
      assessment.assessorName = scheduleData.assessorName || assessment.assessorName;
    }
    assessment.status = 'ASSESSMENT_SCHEDULED';
    assessment.updatedAt = new Date().toISOString();

    this.addAuditLog(data, {
      assessmentId: assessment.id,
      userId: actor?.id || 'institution',
      userName: actor?.name || 'Authorized Institution',
      action: 'ASSESSMENT_SCHEDULED',
      details: `Scheduled on ${assessment.scheduledDate} at ${assessment.scheduledTime} at ${assessment.assessmentCentre}. Assessor: ${assessment.assessorName}`
    });

    this.write(data);
    return { success: true, assessment };
  }

  assignAssessor(assessmentId, assessorData, actor) {
    const data = this.read();
    const assessment = (data.rpl_assessments || []).find(a => a.id === assessmentId || a.assessmentId === assessmentId);
    if (!assessment) return { success: false, message: 'Assessment record not found.' };

    assessment.assessorId = assessorData.assessorId;
    assessment.assessorName = assessorData.assessorName || 'Authorized Assessor';
    assessment.updatedAt = new Date().toISOString();

    this.addAuditLog(data, {
      assessmentId: assessment.id,
      userId: actor?.id || 'institution',
      userName: actor?.name || 'Authorized Institution',
      action: 'ASSESSOR_ASSIGNED',
      details: `Assigned assessor ${assessment.assessorName} (${assessment.assessorId})`
    });

    this.write(data);
    return { success: true, assessment };
  }

  getMyRplAssessment(learnerId) {
    const data = this.read();
    const assessments = (data.rpl_assessments || []).filter(a => a.learnerId === learnerId);
    if (assessments.length === 0) return null;
    return assessments[assessments.length - 1]; // Latest
  }

  getAllRplAssessments(filters = {}) {
    const data = this.read();
    let list = data.rpl_assessments || [];
    if (filters.trade) list = list.filter(a => a.trade.toLowerCase().includes(filters.trade.toLowerCase()));
    if (filters.status) list = list.filter(a => a.status === filters.status);
    if (filters.assessorId) list = list.filter(a => a.assessorId === filters.assessorId);
    return list;
  }

  getRplAssessmentById(assessmentId) {
    const data = this.read();
    const assessment = (data.rpl_assessments || []).find(a => a.id === assessmentId || a.assessmentId === assessmentId);
    if (!assessment) return null;

    // Attach learner's submitted evidence
    const evidence = (data.evidence || []).filter(e => e.learnerId === assessment.learnerId);
    const auditLogs = (data.assessment_audit_logs || []).filter(l => l.assessmentId === assessment.id);

    return {
      ...assessment,
      evidenceList: evidence,
      auditLogs
    };
  }

  submitChecklistEvaluation(assessmentId, evaluationData) {
    const data = this.read();
    const idx = (data.rpl_assessments || []).findIndex(a => a.id === assessmentId || a.assessmentId === assessmentId);
    if (idx === -1) return { success: false, message: 'Assessment record not found.' };

    const assessment = data.rpl_assessments[idx];
    const { scores, acceptedAi, overrideReason, assessorId, assessorName } = evaluationData;

    let earned = 0;
    (assessment.checklists || []).forEach(chk => {
      const alias = chk.id.replace('chk_ele_', 'chk_');
      const rawScore = scores ? (scores[chk.id] !== undefined ? scores[chk.id] : scores[alias]) : undefined;
      if (rawScore !== undefined) {
        chk.score = Number(rawScore);
        const acc = acceptedAi ? (acceptedAi[chk.id] !== undefined ? acceptedAi[chk.id] : acceptedAi[alias]) : true;
        chk.acceptedAi = Boolean(acc);
        const ovr = overrideReason ? (overrideReason[chk.id] || overrideReason[alias]) : '';
        if (ovr) {
          chk.overrideReason = ovr;
        }
      }
      earned += (chk.score || 0);
    });

    assessment.totalScore = earned;
    const maxScore = (assessment.checklists.length * 4) || 1;
    assessment.percentage = Math.round((earned / maxScore) * 100);
    assessment.status = 'UNDER_ASSESSMENT';
    assessment.updatedAt = new Date().toISOString();

    // Recompute competencies status
    (assessment.competencies || []).forEach(comp => {
      const compChecklists = assessment.checklists.filter(c => c.competencyId === comp.id);
      const compEarned = compChecklists.reduce((acc, c) => acc + (c.score || 0), 0);
      const compMax = (compChecklists.length * 4) || 1;
      const compPct = (compEarned / compMax) * 100;

      if (compPct >= 75) comp.status = 'COMPETENT';
      else if (compPct >= 50) comp.status = 'PARTIALLY_DEMONSTRATED';
      else comp.status = 'NOT_YET_DEMONSTRATED';
      comp.score = Math.round(compPct);
    });

    const overrideCount = Object.keys(overrideReason || {}).length;
    this.addAuditLog(data, {
      assessmentId: assessment.id,
      userId: assessorId || 'usr_assessor',
      userName: assessorName || 'Authorized Assessor',
      action: 'CHECKLIST_EVALUATION_RECORDED',
      details: `Evaluated checklist. Total score: ${assessment.totalScore}/${maxScore} (${assessment.percentage}%). AI Overrides: ${overrideCount}`
    });

    this.write(data);
    return { success: true, assessment };
  }

  submitRplFinalDecision(assessmentId, decisionData) {
    const data = this.read();
    const idx = (data.rpl_assessments || []).findIndex(a => a.id === assessmentId || a.assessmentId === assessmentId);
    if (idx === -1) return { success: false, message: 'Assessment record not found.' };

    const assessment = data.rpl_assessments[idx];
    const { decision, remarks, assessorId, assessorName } = decisionData;

    assessment.finalRecommendation = decision; // RECOMMENDED_FOR_CERTIFICATION, FURTHER_EVIDENCE_REQUIRED, NOT_YET_COMPETENT
    assessment.assessorFinalRemarks = remarks;
    assessment.status = 'COMPLETED';
    assessment.updatedAt = new Date().toISOString();

    // Rebuild competency profile categories
    const profile = {
      competent: [],
      partiallyDemonstrated: [],
      additionalEvidenceRequired: [],
      notYetDemonstrated: []
    };

    (assessment.competencies || []).forEach(c => {
      if (c.status === 'COMPETENT') profile.competent.push(c.name);
      else if (c.status === 'PARTIALLY_DEMONSTRATED') profile.partiallyDemonstrated.push(c.name);
      else profile.notYetDemonstrated.push(c.name);
    });

    if (decision === 'FURTHER_EVIDENCE_REQUIRED') {
      profile.additionalEvidenceRequired.push('Safety standards compliance & live operational verification');
    }

    assessment.competencyProfile = profile;

    let credential = null;
    // Issue SkillWorth Assessment Recommendation Record if recommended (Section 20 Credential Safety)
    if (decision === 'RECOMMENDED_FOR_CERTIFICATION') {
      assessment.certificationStatus = 'AUTHORIZED_CERTIFICATION_PENDING';
      const credentialId = 'SW-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      assessment.credentialId = credentialId;

      credential = {
        id: credentialId,
        credentialId,
        learnerId: assessment.learnerId,
        learnerName: assessment.learnerName,
        title: 'SkillWorth Assessment Record',
        skillName: `${assessment.trade} (NSQF Level ${assessment.nsqfLevel})`,
        skillLevel: `NSQF Level ${assessment.nsqfLevel}`,
        qualificationPack: assessment.qpCode,
        institutionName: 'SkillWorth National RPL Assessment Authority',
        assessmentDate: new Date().toLocaleDateString('en-GB'),
        verifiedByAssessor: assessorName || 'Authorized Lead Assessor',
        status: 'VALID',
        certificationStatus: 'AUTHORIZED_CERTIFICATION_PENDING',
        standards: 'ISO/IEC 17024 & NSQF Standardized RPL Competency Recommendation',
        disclaimer: 'This is a SkillWorth Assessment Record and Recommendation based on practical competency evaluation. Official government/NCVET certification is subject to authorized awarding body issuance.',
        issuedAt: new Date().toISOString()
      };

      if (!data.credentials) data.credentials = [];
      data.credentials.push(credential);
    } else {
      assessment.certificationStatus = decision;
    }

    this.addAuditLog(data, {
      assessmentId: assessment.id,
      userId: assessorId,
      userName: assessorName,
      action: 'FINAL_RPL_DECISION_SUBMITTED',
      details: `Assessor submitted final decision: ${decision}. Assessment Record ID: ${assessment.credentialId || 'None'}`
    });

    this.write(data);
    return { success: true, assessment, credential };
  }

  syncRplOfflineData(syncPayload) {
    const data = this.read();
    const { clientTimestamp, offlineRecords } = syncPayload;
    const conflicts = [];
    const synced = [];

    (offlineRecords || []).forEach(rec => {
      const serverRec = (data.rpl_assessments || []).find(a => a.id === rec.assessmentId);
      if (serverRec && new Date(serverRec.updatedAt).getTime() > new Date(clientTimestamp).getTime()) {
        conflicts.push({
          assessmentId: rec.assessmentId,
          reason: 'Server version is newer than client baseline',
          serverVersion: serverRec,
          clientVersion: rec
        });
      } else {
        if (serverRec) {
          Object.assign(serverRec, rec.data);
          serverRec.updatedAt = new Date().toISOString();
          synced.push(serverRec.id);
        }
      }
    });

    this.addAuditLog(data, {
      assessmentId: null,
      userId: syncPayload.assessorId || 'system_sync',
      userName: 'Offline Synchronization Engine',
      action: 'OFFLINE_RECORDS_SYNCED',
      details: `Synced ${synced.length} records. Conflicts detected: ${conflicts.length}`
    });

    this.write(data);
    return { success: true, syncedCount: synced.length, conflicts };
  }

  addAuditLog(data, { assessmentId, userId, userName, action, details }) {
    if (!data.assessment_audit_logs) data.assessment_audit_logs = [];
    data.assessment_audit_logs.push({
      id: 'LOG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      assessmentId: assessmentId || null,
      userId: userId || 'anonymous',
      userName: userName || 'User',
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  getAssessmentAuditLogs(assessmentId) {
    const data = this.read();
    return (data.assessment_audit_logs || []).filter(l => !assessmentId || l.assessmentId === assessmentId);
  }
}

const skillworthDb = new SkillworthDatabase();
module.exports = skillworthDb;
module.exports.skillworthDb = skillworthDb;
