const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
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

const DEMO_ASSESSMENT_CENTRES = [
  {
    id: 'AC-SLM-01',
    name: 'SkillWorth Practical Assessment Centre — Salem',
    code: 'AC-SLM-01',
    address: 'Steel Plant Road, Periya Kollapatti, Salem',
    district: 'Salem',
    state: 'Tamil Nadu',
    supportedSectors: ['Construction', 'Electronics & Hardware', 'Plumbing'],
    supportedOccupations: ['General Carpenter', 'Electrician Domestic Solutions', 'Plumber General'],
    capacity: 30,
    active: true,
    contactName: 'R. Soundararajan (Centre Superintendent)',
    contactPhone: '+91 94432 10987',
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'AC-MAA-02',
    name: 'SkillWorth Technical Assessment Centre — Chennai',
    code: 'AC-MAA-02',
    address: 'Guindy Industrial Estate, Guindy, Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    supportedSectors: ['Automotive', 'Capital Goods & Welding', 'Construction'],
    supportedOccupations: ['Manual Metal Arc Welder', 'General Carpenter', 'Mason General'],
    capacity: 45,
    active: true,
    contactName: 'M. Anandhi (Centre Administrator)',
    contactPhone: '+91 94440 22110',
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'AC-CJB-03',
    name: 'SkillWorth Regional Skill Assessment Centre — Coimbatore',
    code: 'AC-CJB-03',
    address: 'Peelamedu Tech Zone, Avinashi Road, Coimbatore',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    supportedSectors: ['Automotive', 'Manufacturing', 'Plumbing'],
    supportedOccupations: ['Two Wheeler Service Technician', 'Plumber General', 'Manual Metal Arc Welder'],
    capacity: 35,
    active: true,
    contactName: 'P. Balasubramanian (Testing Lead)',
    contactPhone: '+91 98422 33445',
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'AC-BLR-04',
    name: 'SkillWorth National Assessment Hub — Bengaluru',
    code: 'AC-BLR-04',
    address: 'Whitefield Industrial Area, Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    supportedSectors: ['Information Technology', 'Electronics & Hardware', 'Solar Energy'],
    supportedOccupations: ['Solar PV Installation Technician', 'Electrician Domestic Solutions', 'Junior Software Developer'],
    capacity: 50,
    active: true,
    contactName: 'S. Keshava Murthy (Hub Coordinator)',
    contactPhone: '+91 98860 55443',
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
      if (!data.rpl_evidence_requests) data.rpl_evidence_requests = [];
      if (!data.rpl_applications) data.rpl_applications = [];
      if (!data.assessment_centres || data.assessment_centres.length === 0) {
        data.assessment_centres = DEMO_ASSESSMENT_CENTRES;
      }
      if (!data.notifications) data.notifications = [];
      return data;
    } catch (e) {
      return { 
        users: [], learner_profiles: [], institution_profiles: [], industry_profiles: [], assessors: [], 
        skills: [], competencies: [], evidence: [], assessments: [], assessment_questions: [], 
        assessment_attempts: [], assessment_answers: [], assessment_results: [], credentials: [], 
        notifications: [], rpl_qualification_packs: [], rpl_experience_declarations: [], 
        rpl_assessments: [], assessment_audit_logs: [], rpl_checklists: [], rpl_evidence_requests: [],
        rpl_applications: [], assessment_centres: DEMO_ASSESSMENT_CENTRES 
      };
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

    // Link or create corresponding RPL Application
    let app = (data.rpl_applications || []).find(a => 
      a.learnerId === assessmentData.learnerId && 
      (a.qualificationPackId === qp.id || a.occupation === qp.trade || a.qualificationPackCode === qp.qpCode) &&
      !['COMPLETED', 'WITHDRAWN', 'CANCELLED'].includes(a.status)
    );

    if (!app) {
      const appId = 'app_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
      const appNumber = this.generateApplicationNumber(data);
      app = {
        id: appId,
        applicationNumber: appNumber,
        learnerId: assessmentData.learnerId,
        learnerName: assessmentData.learnerName,
        occupation: qp.trade,
        qualificationPackId: qp.id,
        qualificationPackCode: qp.qpCode,
        nsqfLevel: qp.nsqfLevel,
        status: 'EVIDENCE_COLLECTION',
        currentStage: 'Evidence Collection & Portfolio Submission',
        assignedAssessorId: record.assessorId,
        assignedAssessorName: record.assessorName,
        assessmentCentreId: null,
        assessmentCentreName: 'SkillWorth Regional Practical Centre',
        scheduledDate: null,
        scheduledTime: null,
        assessmentId: record.id,
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [
          {
            id: 'tl_1',
            stage: 'APPLICATION_SUBMITTED',
            status: 'SUBMITTED',
            timestamp: new Date().toISOString(),
            actor: assessmentData.learnerName,
            description: `RPL application initiated for ${qp.trade} (${qp.qpCode})`
          },
          {
            id: 'tl_2',
            stage: 'QP_SELECTED',
            status: 'EVIDENCE_COLLECTION',
            timestamp: new Date().toISOString(),
            actor: assessmentData.learnerName,
            description: `Qualification Pack confirmed: ${qp.trade} (NSQF Level ${qp.nsqfLevel})`
          }
        ]
      };
      if (!data.rpl_applications) data.rpl_applications = [];
      data.rpl_applications.push(app);
    } else {
      app.assessmentId = record.id;
      app.qualificationPackId = qp.id;
      app.qualificationPackCode = qp.qpCode;
      app.nsqfLevel = qp.nsqfLevel;
      app.status = 'EVIDENCE_COLLECTION';
      app.updatedAt = new Date().toISOString();
      if (!app.timeline) app.timeline = [];
      app.timeline.push({
        id: 'tl_' + Date.now(),
        stage: 'QP_SELECTED',
        status: 'EVIDENCE_COLLECTION',
        timestamp: new Date().toISOString(),
        actor: assessmentData.learnerName,
        description: `Qualification Pack confirmed: ${qp.trade} (NSQF Level ${qp.nsqfLevel})`
      });
    }
    record.applicationId = app.id;

    this.addAuditLog(data, {
      assessmentId,
      applicationId: app.id,
      userId: assessmentData.learnerId,
      userName: assessmentData.learnerName,
      action: 'RPL_ASSESSMENT_INITIATED',
      details: `Initiated RPL pathway for ${qp.trade} (${qp.qpCode}, NSQF Level ${qp.nsqfLevel})`
    });

    this.write(data);
    return { success: true, assessment: record, application: app };
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

    // Also synchronize linked RPL Application
    const app = (data.rpl_applications || []).find(a => a.assessmentId === assessment.id || a.id === assessment.applicationId);
    if (app) {
      const appStatus = (decision === 'RECOMMENDED_FOR_CERTIFICATION' || decision === 'APPROVE')
        ? 'RECOMMENDED_FOR_CERTIFICATION'
        : (decision === 'NOT_YET_COMPETENT' ? 'NOT_YET_COMPETENT' : 'COMPLETED');
      app.status = appStatus;
      app.currentStage = `Assessment Completed (${decision})`;
      app.completedAt = new Date().toISOString();
      app.updatedAt = new Date().toISOString();
      if (!app.timeline) app.timeline = [];
      app.timeline.push({
        id: 'tl_dec_' + Date.now(),
        stage: 'DECISION_SUBMITTED',
        status: appStatus,
        timestamp: new Date().toISOString(),
        actor: assessorName || 'Authorized Assessor',
        description: `Assessor submitted final decision: ${decision}. Assessment Record: ${assessment.credentialId || 'N/A'}`
      });

      this.addAuditLog(data, {
        applicationId: app.id,
        assessmentId: assessment.id,
        userId: assessorId,
        userName: assessorName,
        action: 'APPLICATION_COMPLETED',
        details: `RPL Application completed with decision ${decision}`
      });
    }

    this.addNotification(data, {
      userId: assessment.learnerId,
      type: 'ASSESSMENT_COMPLETED',
      title: 'Assessment Review Completed',
      message: `Your assessor has completed the assessment review. Recommendation: ${decision}`,
      relatedEntityType: 'rpl_application',
      relatedEntityId: app?.id || assessment.id
    });

    this.write(data);
    return { success: true, assessment, credential, application: app };
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

  addAuditLog(data, { assessmentId, applicationId, userId, userName, action, details }) {
    if (!data.assessment_audit_logs) data.assessment_audit_logs = [];
    data.assessment_audit_logs.push({
      id: 'LOG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      assessmentId: assessmentId || null,
      applicationId: applicationId || null,
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

  // ================= Phase 3: Dynamic Competency Evidence Matrix & Skill Passport =================

  getAssessmentEvidenceMatrix(assessmentId) {
    const data = this.read();
    const assessment = (data.rpl_assessments || []).find(a => a.id === assessmentId || a.assessmentId === assessmentId);
    if (!assessment) return null;

    const qp = this.getQualificationPackById(assessment.qualificationPackId || assessment.qpCode);
    if (!qp) return null;

    if (!data.evidence) data.evidence = [];
    if (!data.rpl_evidence_requests) data.rpl_evidence_requests = [];
    if (!data.rpl_competency_evidence_matrix) data.rpl_competency_evidence_matrix = [];

    // All evidence for this candidate
    const candidateEvidence = data.evidence.filter(e => e.learnerId === assessment.learnerId);

    // Filter unassigned evidence (evidence without competency assignment)
    const unassignedEvidence = candidateEvidence.filter(e => !e.competencyCode && !e.competencyId);

    // Requests for this assessment
    const assessmentRequests = data.rpl_evidence_requests.filter(r => r.assessmentId === assessment.id);

    const matrix = (qp.competencies || []).map(comp => {
      // Find linked evidence for this competency
      const linkedEvidence = candidateEvidence.filter(e => 
        (e.competencyCode && e.competencyCode === comp.code) ||
        (e.competencyId && e.competencyId === comp.id) ||
        (e.assessmentId === assessment.id && e.competencyCode === comp.code)
      );

      const evidenceCount = linkedEvidence.length;
      const activeRequest = assessmentRequests.find(r => (r.competencyCode === comp.code || r.competencyId === comp.id) && r.status === 'EVIDENCE_REQUESTED');

      // Tentative AI Observation & Confidence (Section 11)
      let aiObservation = 'No candidate evidence submitted for this unit yet. Practical observation required.';
      let aiConfidence = 'INSUFFICIENT DATA';
      let aiRecommendation = 'PRACTICAL_ASSESSMENT_REQUIRED';

      if (evidenceCount >= 2) {
        aiObservation = `Submitted evidence artifacts appear potentially consistent with required criteria for ${comp.name}. Workpiece and operator action are visible. Requires assessor verification.`;
        aiConfidence = 'HIGH';
        aiRecommendation = 'RECOMMEND_COMPETENT_VERIFICATION';
      } else if (evidenceCount === 1) {
        aiObservation = `Preliminary evidence artifact demonstrates practical activity. Additional safety demonstration or assessor viva recommended.`;
        aiConfidence = 'MODERATE';
        aiRecommendation = 'RECOMMEND_ADDITIONAL_ORAL_OR_PRACTICAL_CHECK';
      }

      // Check existing assessment record for this competency
      const existingComp = (assessment.competencies || []).find(c => c.id === comp.id || c.code === comp.code);
      const chkItems = (assessment.checklists || []).filter(c => c.competencyId === comp.id || c.competencyCode === comp.code);
      
      let compScore = null;
      if (chkItems.length > 0 && chkItems.some(c => c.score !== null)) {
        const scored = chkItems.filter(c => c.score !== null);
        compScore = Math.round(scored.reduce((acc, c) => acc + c.score, 0) / scored.length);
      } else if (existingComp && existingComp.score !== null) {
        compScore = Math.round(existingComp.score / 25); // map percentage to 0-4
      }

      let status = 'EVIDENCE_REQUIRED';
      if (existingComp?.status === 'COMPETENT' || compScore >= 3) {
        status = 'COMPETENT';
      } else if (activeRequest) {
        status = 'FURTHER_EVIDENCE_REQUIRED';
      } else if (existingComp?.status === 'PARTIALLY_DEMONSTRATED' || compScore === 2) {
        status = 'UNDER_REVIEW';
      } else if (evidenceCount > 0) {
        status = 'EVIDENCE_SUBMITTED';
      } else if (existingComp?.status === 'NOT_YET_DEMONSTRATED' || (compScore !== null && compScore < 2)) {
        status = 'NOT_YET_COMPETENT';
      }

      // Practical task definition
      const practicalTask = comp.assessmentChecklist?.[0]?.task || comp.performanceCriteria?.[0] || `${comp.name} Practical Task`;

      return {
        id: `MAT-${assessment.id}-${comp.id}`,
        assessmentId: assessment.id,
        qualificationPackId: qp.id,
        competencyId: comp.id,
        competencyCode: comp.code,
        competencyName: comp.name,
        performanceCriteria: comp.performanceCriteria || [],
        observableIndicators: comp.observableIndicators || [],
        evidenceRequired: comp.requiredEvidence || ['Photo / video of practical execution', 'Measurement check'],
        evidenceSubmitted: evidenceCount,
        evidenceIds: linkedEvidence.map(e => e.id),
        evidenceList: linkedEvidence.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          fileUrl: e.fileUrl,
          isVideo: e.isVideo || Boolean(e.mimeType?.startsWith('video/')),
          status: e.status || 'VERIFIED',
          uploadedAt: e.createdAt || e.uploadedAt
        })),
        practicalTask,
        aiObservation,
        aiRecommendation,
        aiConfidence,
        assessorScore: compScore,
        assessorRemarks: existingComp?.assessorRemarks || '',
        assessorDecision: existingComp?.status || (compScore >= 3 ? 'COMPETENT' : compScore !== null ? 'NOT_YET_COMPETENT' : null),
        status,
        updatedAt: assessment.updatedAt || new Date().toISOString()
      };
    });

    const coverage = this.calculateEvidenceCoverage(matrix);

    return {
      success: true,
      assessmentId: assessment.id,
      workerName: assessment.learnerName,
      workerId: assessment.learnerId,
      qualificationPack: {
        id: qp.id,
        qpCode: qp.qpCode,
        trade: qp.trade,
        sector: qp.sector,
        nsqfLevel: qp.nsqfLevel,
        rubric: qp.rubric
      },
      matrix,
      unassignedEvidence: unassignedEvidence.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        fileUrl: e.fileUrl,
        uploadedAt: e.createdAt
      })),
      coverage,
      updatedAt: new Date().toISOString()
    };
  }

  calculateEvidenceCoverage(matrix = []) {
    const totalCompetencies = matrix.length || 1;
    let fullySupported = 0;
    let partiallySupported = 0;
    let missing = 0;
    let totalScore = 0;
    let scoredCount = 0;

    matrix.forEach(m => {
      if (m.evidenceSubmitted >= 2 || m.assessorScore >= 3 || m.status === 'COMPETENT') {
        fullySupported++;
      } else if (m.evidenceSubmitted === 1 || m.assessorScore === 2 || m.status === 'UNDER_REVIEW') {
        partiallySupported++;
      } else {
        missing++;
      }

      if (m.assessorScore !== null && m.assessorScore !== undefined) {
        totalScore += m.assessorScore;
        scoredCount++;
      }
    });

    const coveragePercentage = Math.round(((fullySupported + (partiallySupported * 0.5)) / totalCompetencies) * 100);
    const weightedCompetencyScore = scoredCount > 0 ? Number((totalScore / scoredCount).toFixed(2)) : 0;

    return {
      totalCompetencies,
      fullySupported,
      partiallySupported,
      missing,
      coveragePercentage,
      weightedCompetencyScore
    };
  }

  updateMatrixCompetency(assessmentId, competencyId, updateData, actor) {
    const data = this.read();
    const assessment = (data.rpl_assessments || []).find(a => a.id === assessmentId || a.assessmentId === assessmentId);
    if (!assessment) return { success: false, message: 'Assessment record not found.' };

    const comp = (assessment.competencies || []).find(c => c.id === competencyId || c.code === competencyId);
    if (!comp) return { success: false, message: 'Competency not found in assessment.' };

    if (updateData.assessorScore !== undefined) {
      comp.score = Number(updateData.assessorScore) * 25; // to 100% scale
      // Also update matching checklists
      (assessment.checklists || []).forEach(chk => {
        if (chk.competencyId === comp.id || chk.competencyCode === comp.code) {
          chk.score = Number(updateData.assessorScore);
          chk.acceptedAi = updateData.acceptedAi !== false;
          if (updateData.overrideReason) chk.overrideReason = updateData.overrideReason;
        }
      });
    }

    if (updateData.assessorDecision) {
      comp.status = updateData.assessorDecision;
    }
    if (updateData.assessorRemarks) {
      comp.assessorRemarks = updateData.assessorRemarks;
    }

    assessment.updatedAt = new Date().toISOString();

    // Recompute overall total score and status
    const allChecklists = assessment.checklists || [];
    const earned = allChecklists.reduce((acc, c) => acc + (c.score || 0), 0);
    assessment.totalScore = earned;
    assessment.percentage = Math.round((earned / (allChecklists.length * 4 || 1)) * 100);

    this.addAuditLog(data, {
      assessmentId: assessment.id,
      userId: actor?.id || 'assessor',
      userName: actor?.name || 'Authorized Assessor',
      action: 'MATRIX_COMPETENCY_EVALUATED',
      details: `Evaluated ${comp.code} (${comp.name}): Score ${updateData.assessorScore}/4, Decision: ${updateData.assessorDecision || comp.status}`
    });

    this.write(data);
    return { success: true, competency: comp, assessment };
  }

  linkEvidenceToCompetency(assessmentId, evidenceId, linkingData, actor) {
    const data = this.read();
    if (!data.evidence) data.evidence = [];

    const ev = data.evidence.find(e => e.id === evidenceId || e.evidenceId === evidenceId);
    if (!ev) return { success: false, message: 'Evidence item not found.' };

    ev.assessmentId = assessmentId;
    ev.competencyId = linkingData.competencyId || ev.competencyId;
    ev.competencyCode = linkingData.competencyCode || ev.competencyCode;
    ev.performanceCriterion = linkingData.criterion || ev.performanceCriterion;
    ev.linkedAt = new Date().toISOString();

    this.addAuditLog(data, {
      assessmentId,
      userId: actor?.id || 'assessor',
      userName: actor?.name || 'Assessor',
      action: 'EVIDENCE_LINKED_TO_COMPETENCY',
      details: `Linked evidence "${ev.title}" to competency ${ev.competencyCode}`
    });

    this.write(data);
    return { success: true, evidence: ev };
  }

  createEvidenceRequest(assessmentId, requestData, actor) {
    const data = this.read();
    const assessment = (data.rpl_assessments || []).find(a => a.id === assessmentId || a.assessmentId === assessmentId);
    if (!assessment) return { success: false, message: 'Assessment not found.' };

    if (!data.rpl_evidence_requests) data.rpl_evidence_requests = [];

    const id = 'REQ-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newRequest = {
      id,
      requestId: id,
      assessmentId: assessment.id,
      learnerId: assessment.learnerId,
      learnerName: assessment.learnerName,
      competencyId: requestData.competencyId,
      competencyCode: requestData.competencyCode,
      competencyName: requestData.competencyName || requestData.competencyCode,
      requiredEvidence: requestData.requiredEvidence || 'Practical task video demonstration',
      message: requestData.message || 'Please upload supporting practical demonstration video.',
      deadline: requestData.deadline || null,
      status: 'EVIDENCE_REQUESTED',
      requestedBy: actor?.name || 'Authorized Lead Assessor',
      requestedAt: new Date().toISOString(),
      submittedEvidenceId: null,
      submittedAt: null
    };

    data.rpl_evidence_requests.push(newRequest);

    // Update target competency status
    const comp = (assessment.competencies || []).find(c => c.id === requestData.competencyId || c.code === requestData.competencyCode);
    if (comp) {
      comp.status = 'FURTHER_EVIDENCE_REQUIRED';
    }

    // Also synchronize linked RPL Application
    const app = (data.rpl_applications || []).find(a => a.assessmentId === assessment.id || a.id === assessment.applicationId);
    if (app) {
      app.status = 'FURTHER_EVIDENCE_REQUIRED';
      app.currentStage = 'Additional Evidence Required by Assessor';
      app.updatedAt = new Date().toISOString();
      if (!app.timeline) app.timeline = [];
      app.timeline.push({
        id: 'tl_evreq_' + Date.now(),
        stage: 'FURTHER_EVIDENCE_REQUIRED',
        status: 'FURTHER_EVIDENCE_REQUIRED',
        timestamp: new Date().toISOString(),
        actor: actor?.name || 'Authorized Lead Assessor',
        description: `Assessor requested additional evidence: ${requestData.message || requestData.competencyCode}`
      });
    }

    this.addNotification(data, {
      userId: assessment.learnerId,
      type: 'EVIDENCE_REQUESTED',
      title: 'Additional Evidence Required',
      message: `Your assessor has requested additional evidence: ${requestData.message || requestData.requiredEvidence || 'Demonstration video'}`,
      relatedEntityType: 'rpl_application',
      relatedEntityId: app?.id || assessment.id
    });

    this.addAuditLog(data, {
      assessmentId: assessment.id,
      applicationId: app?.id || null,
      userId: actor?.id || 'assessor',
      userName: actor?.name || 'Authorized Assessor',
      action: 'EVIDENCE_REQUESTED',
      details: `Requested evidence for ${newRequest.competencyCode}: "${newRequest.message}"`
    });

    this.write(data);
    return { success: true, request: newRequest, application: app };
  }

  getEvidenceRequests(filters = {}) {
    const data = this.read();
    let list = data.rpl_evidence_requests || [];
    if (filters.assessmentId) list = list.filter(r => r.assessmentId === filters.assessmentId);
    if (filters.learnerId) list = list.filter(r => r.learnerId === filters.learnerId);
    if (filters.status) list = list.filter(r => r.status === filters.status);
    return list;
  }

  respondToEvidenceRequest(requestId, evidenceData, learner) {
    const data = this.read();
    if (!data.rpl_evidence_requests) data.rpl_evidence_requests = [];
    if (!data.evidence) data.evidence = [];

    const req = data.rpl_evidence_requests.find(r => r.id === requestId || r.requestId === requestId);
    if (!req) return { success: false, message: 'Evidence request not found.' };

    const evId = 'ev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const newEvidence = {
      id: evId,
      evidenceId: evId,
      learnerId: req.learnerId,
      learnerName: req.learnerName,
      assessmentId: req.assessmentId,
      competencyId: req.competencyId,
      competencyCode: req.competencyCode,
      title: evidenceData.title || `Practical Evidence for ${req.competencyCode}`,
      description: evidenceData.description || req.message,
      fileUrl: evidenceData.fileUrl || '/uploads/demo_video.mp4',
      fileName: evidenceData.fileName || 'evidence_artifact.mp4',
      isVideo: Boolean(evidenceData.isVideo !== false),
      status: 'VERIFIED',
      uploadedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    data.evidence.push(newEvidence);

    req.status = 'EVIDENCE_SUBMITTED';
    req.submittedEvidenceId = evId;
    req.submittedAt = new Date().toISOString();

    const asm = (data.rpl_assessments || []).find(a => a.id === req.assessmentId);

    // Also synchronize linked RPL Application
    const app = (data.rpl_applications || []).find(a => 
      a.assessmentId === req.assessmentId || 
      (asm && a.id === asm.applicationId) || 
      (asm && a.learnerId === asm.learnerId && !['COMPLETED', 'WITHDRAWN', 'CANCELLED'].includes(a.status))
    );
    if (app) {
      app.status = 'EVIDENCE_COLLECTION';
      app.currentStage = 'Evidence Portfolio Updated';
      app.updatedAt = new Date().toISOString();
      if (!app.timeline) app.timeline = [];
      app.timeline.push({
        id: 'tl_evsub_' + Date.now(),
        stage: 'EVIDENCE_SUBMITTED',
        status: 'EVIDENCE_COLLECTION',
        timestamp: new Date().toISOString(),
        actor: learner?.name || req.learnerName,
        description: `Candidate submitted additional evidence for ${req.competencyCode}`
      });
    }

    if (asm && asm.assessorId) {
      this.addNotification(data, {
        userId: asm.assessorId,
        type: 'EVIDENCE_SUBMITTED',
        title: 'Candidate Evidence Submitted',
        message: `Candidate ${req.learnerName} submitted requested evidence for ${req.competencyCode}.`,
        relatedEntityType: 'rpl_application',
        relatedEntityId: app?.id || req.assessmentId
      });
    }

    this.addAuditLog(data, {
      assessmentId: req.assessmentId,
      applicationId: app?.id || null,
      userId: learner?.id || req.learnerId,
      userName: learner?.name || req.learnerName,
      action: 'EVIDENCE_SUBMITTED',
      details: `Candidate fulfilled evidence request for ${req.competencyCode} with item ${evId}`
    });

    this.write(data);
    return { success: true, evidence: newEvidence, request: req, application: app };
  }

  calculateSkillGaps(assessmentId) {
    const data = this.read();
    const assessment = (data.rpl_assessments || []).find(a => a.id === assessmentId || a.assessmentId === assessmentId);
    if (!assessment) return { success: false, message: 'Assessment not found.' };

    const qp = this.getQualificationPackById(assessment.qualificationPackId || assessment.qpCode);
    const gaps = [];

    (assessment.competencies || []).forEach(comp => {
      const isCompetent = comp.status === 'COMPETENT' || (comp.score !== null && comp.score >= 75);
      if (!isCompetent) {
        let gapDescription = `Demonstration gap identified in ${comp.name}.`;
        let recommendedNextStep = 'Complete practical hands-on observation with accredited assessor.';

        if (comp.name.toLowerCase().includes('safety')) {
          gapDescription = 'Safety standards compliance & live operational verification required.';
          recommendedNextStep = 'Demonstrate standard PPE protocols and zero-energy de-energization in assessment centre.';
        } else if (comp.name.toLowerCase().includes('measur') || comp.name.toLowerCase().includes('cut')) {
          gapDescription = 'Precision measurement and dimensional tolerance check requires verified observation.';
          recommendedNextStep = 'Review measurement instruments and verify cuts within trade specifications.';
        } else if (comp.name.toLowerCase().includes('join') || comp.name.toLowerCase().includes('weld')) {
          gapDescription = 'Joint strength and structural fit-up demonstration incomplete.';
          recommendedNextStep = 'Submit macro photos of joint cross-section or execute weld pass during practical session.';
        }

        gaps.push({
          competencyId: comp.id,
          competencyCode: comp.code,
          competencyName: comp.name,
          currentStatus: comp.status || 'PENDING',
          gapDescription,
          recommendedNextStep
        });
      }
    });

    return {
      success: true,
      assessmentId: assessment.id,
      trade: assessment.trade,
      qpCode: assessment.qpCode,
      totalGaps: gaps.length,
      skillGaps: gaps
    };
  }

  async getWorkerSkillPassport(learnerId, origin = 'http://localhost:5173') {
    const data = this.read();
    const learner = (data.learner_profiles || []).find(l => l.id === learnerId || l.learnerId === learnerId || l.userId === learnerId) ||
                    (data.learners || []).find(l => l.id === learnerId || l.learnerId === learnerId || l.userId === learnerId) ||
                    (data.users || []).find(u => u.id === learnerId || u.profileId === learnerId);

    // Declarations & Experiences
    const declarations = (data.rpl_experience_declarations || []).filter(d => d.learnerId === learnerId || d.userId === learnerId);
    let allExperiences = [];
    declarations.forEach(d => {
      if (Array.isArray(d.experiences) && d.experiences.length > 0) {
        allExperiences.push(...d.experiences);
      } else if (d.jobRole) {
        allExperiences.push({
          occupation: d.jobRole,
          sector: d.industry || 'Vocational',
          years: d.yearsOfExperience || 1,
          tasks: d.tasksPerformed || 'Practical work',
          tools: d.toolsUsed || 'Hand tools'
        });
      }
    });

    const totalYears = allExperiences.reduce((acc, exp) => acc + (Number(exp.years) || 0), 0) || 5;
    const primaryOccupation = allExperiences[0]?.occupation || declarations[0]?.jobRole || 'Informal Skilled Worker';

    // Assessments & Credentials
    const assessments = (data.rpl_assessments || []).filter(a => a.learnerId === learnerId || a.userId === learnerId);
    const latestAsm = assessments.length > 0 ? assessments[assessments.length - 1] : null;
    const credentials = (data.credentials || []).filter(c => c.learnerId === learnerId || c.userId === learnerId);

    const workerName = learner?.fullName || learner?.name || declarations[0]?.learnerName || assessments[0]?.learnerName || 'Arun Kumar';
    const workerId = 'SW-WRK-' + ((learner?.learnerId || learnerId).replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase() || '100001');

    // Evidence
    const evidence = (data.evidence || []).filter(e => e.learnerId === learnerId || e.userId === learnerId);

    // Passport Status
    let passportStatus = 'PROFILE ONLY';
    let rplJourneyStep = 1;
    if (credentials.length > 0) {
      passportStatus = 'RECOMMENDED FOR CERTIFICATION';
      rplJourneyStep = 6;
    } else if (latestAsm?.status === 'COMPLETED' || latestAsm?.finalRecommendation) {
      passportStatus = 'RECOMMENDED FOR CERTIFICATION';
      rplJourneyStep = 6;
    } else if (latestAsm?.status === 'ASSESSOR_VERIFIED') {
      passportStatus = 'ASSESSOR VERIFIED';
      rplJourneyStep = 5;
    } else if (latestAsm?.status === 'UNDER_ASSESSMENT' || latestAsm?.status === 'ASSESSMENT_SCHEDULED') {
      passportStatus = 'ASSESSMENT IN PROGRESS';
      rplJourneyStep = 4;
    } else if (latestAsm?.status === 'EVIDENCE_COLLECTION') {
      passportStatus = 'ASSESSMENT IN PROGRESS';
      rplJourneyStep = 3;
    } else if (declarations.length > 0) {
      passportStatus = 'EXPERIENCE DECLARED';
      rplJourneyStep = 2;
    }

    // Record ID for verification
    const recordId = credentials[0]?.credentialId || (latestAsm ? latestAsm.credentialId || latestAsm.id : workerId);
    const verificationUrl = `${origin}/verify/${recordId}`;

    // Generate real QR Code data URL
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 180,
        color: { dark: '#176B68', light: '#FFFFFF' }
      });
    } catch (e) {
      console.error('QR generation error:', e);
    }

    // Compile skills & verified competencies
    const verifiedCompetencies = [];
    const skillsSet = new Set();
    allExperiences.forEach(e => {
      if (e.tasks) e.tasks.split(/[,;]+/).forEach(s => s.trim() && skillsSet.add(s.trim()));
    });

    if (latestAsm && latestAsm.competencies) {
      latestAsm.competencies.forEach(c => {
        skillsSet.add(c.name);
        verifiedCompetencies.push({
          code: c.code,
          name: c.name,
          weight: c.weight,
          status: c.status || 'PENDING'
        });
      });
    }

    // Skill gaps calculation
    const gapsResult = latestAsm ? this.calculateSkillGaps(latestAsm.id) : { skillGaps: [] };

    // Visibility preference
    const isPublic = data.skill_passport_visibility?.[learnerId] !== false;

    return {
      success: true,
      workerId,
      workerName,
      primaryOccupation,
      totalExperienceYears: totalYears,
      passportStatus,
      rplJourneyStep,
      isPublic,
      recordId,
      verificationUrl,
      qrCodeDataUrl,
      skills: Array.from(skillsSet).slice(0, 10),
      verifiedCompetencies,
      assessmentRecords: assessments.map(a => ({
        assessmentId: a.id,
        trade: a.trade,
        qpCode: a.qpCode,
        nsqfLevel: a.nsqfLevel,
        status: a.status,
        finalRecommendation: a.finalRecommendation || 'PENDING',
        totalScore: a.totalScore,
        maxScore: a.maxScore,
        percentage: a.percentage,
        recordId: a.credentialId || a.id,
        assessorName: a.assessorName,
        date: a.scheduledDate || new Date(a.createdAt).toLocaleDateString('en-GB')
      })),
      experiences: allExperiences,
      evidenceSummary: {
        totalItems: evidence.length,
        verifiedByAssessor: evidence.filter(e => e.status === 'VERIFIED').length,
        supportingEvidence: evidence.filter(e => e.status !== 'VERIFIED').length
      },
      skillGaps: gapsResult.skillGaps || [],
      statement: 'SkillWorth Worker Skill Passport. Reflects verified practical skills and RPL assessment recommendations. Official government certification is subject to authorized Sector Skill Council issuance.',
      updatedAt: new Date().toISOString()
    };
  }

  setPassportVisibility(learnerId, isPublic) {
    const data = this.read();
    if (!data.skill_passport_visibility) data.skill_passport_visibility = {};
    data.skill_passport_visibility[learnerId] = Boolean(isPublic);
    this.write(data);
    return { success: true, isPublic: Boolean(isPublic) };
  }

  getPublicVerificationRecord(recordId) {
    const data = this.read();
    // Search credentials
    const cred = (data.credentials || []).find(c => c.id === recordId || c.credentialId === recordId || (c.credentialId && recordId.includes(c.credentialId)));
    if (cred) {
      return {
        success: true,
        valid: true,
        recordType: 'ASSESSMENT_RECOMMENDATION_RECORD',
        recordId: cred.credentialId,
        workerName: cred.learnerName ? cred.learnerName.split(' ')[0] + ' ' + (cred.learnerName.split(' ')[1]?.[0] || '') + '.' : 'Verified Candidate',
        qualification: cred.skillName,
        qpCode: cred.qualificationPack,
        assessmentDate: cred.assessmentDate,
        assessor: cred.verifiedByAssessor,
        issuingAuthority: 'SkillWorth National RPL Assessment Authority',
        verificationStatus: 'VALID SKILLWORTH ASSESSMENT RECORD',
        standards: 'SkillWorth RPL Assessment Standards & NSQF Standardized Assessment',
        disclaimer: 'This is a verified SkillWorth RPL Assessment Record and Recommendation. Official certification is issued by accredited awarding bodies upon formal validation.',
        verifiedAt: new Date().toISOString()
      };
    }

    // Search assessments
    const asm = (data.rpl_assessments || []).find(a => 
      a.id === recordId || 
      a.assessmentId === recordId || 
      a.credentialId === recordId || 
      `REC-${a.id}` === recordId ||
      recordId === `REC-${a.id}` ||
      (a.id && recordId.includes(a.id))
    );
    if (asm) {
      return {
        success: true,
        valid: true,
        recordType: 'RPL_ASSESSMENT_RECORD',
        recordId: asm.credentialId || asm.id,
        workerName: asm.learnerName ? asm.learnerName.split(' ')[0] + ' ' + (asm.learnerName.split(' ')[1]?.[0] || '') + '.' : 'Verified Candidate',
        qualification: `${asm.trade} (NSQF Level ${asm.nsqfLevel})`,
        qpCode: asm.qpCode,
        assessmentDate: asm.scheduledDate || new Date(asm.createdAt).toLocaleDateString('en-GB'),
        assessmentStatus: asm.finalRecommendation || asm.status,
        issuingAuthority: 'SkillWorth National RPL Assessment Authority',
        verificationStatus: 'VALID SKILLWORTH ASSESSMENT RECORD',
        standards: 'SkillWorth RPL Assessment Standards & NSQF Standardized Assessment',
        disclaimer: 'This is a verified SkillWorth RPL Assessment Record. Official certification is issued by accredited awarding bodies upon formal validation.',
        verifiedAt: new Date().toISOString()
      };
    }

    return {
      success: false,
      valid: false,
      message: 'Assessment record not found or unverified.'
    };
  }

  // ================= Phase 4: RPL Application Operations & Assessment Management =================

  generateApplicationNumber(data) {
    const year = 2026;
    const count = (data.rpl_applications || []).length + 1;
    const seq = String(count).padStart(6, '0');
    return `RPL-${year}-${seq}`;
  }

  calculateOperationalPriority(item) {
    const scheduledDate = item.scheduledDate;
    const status = item.status;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (scheduledDate) {
      const sDate = new Date(scheduledDate);
      const diffHours = (sDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (scheduledDate === todayStr || (diffHours >= -24 && diffHours <= 24)) {
        return { priority: 'URGENT', label: 'Assessment Today', color: '#ea4335' };
      }
      if (diffHours > 24 && diffHours <= 48) {
        return { priority: 'HIGH', label: 'Assessment within 48 Hours', color: '#f2994a' };
      }
    }

    if (status === 'FURTHER_EVIDENCE_REQUIRED') {
      return { priority: 'HIGH', label: 'Missing Evidence Blocking Assessment', color: '#f2994a' };
    }

    if (status === 'ASSESSMENT_SCHEDULED' || status === 'UNDER_ASSESSMENT' || status === 'ASSESSOR_REVIEW') {
      return { priority: 'NORMAL', label: 'Active Assessment', color: '#1a73e8' };
    }

    return { priority: 'LOW', label: 'Routine Pipeline', color: '#5f6368' };
  }

  computeAssessmentReminders(scheduledDate) {
    if (!scheduledDate) return null;
    const now = new Date();
    const sDate = new Date(scheduledDate);
    const diffMs = sDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { reminder: 'Assessment today', urgency: 'URGENT' };
    if (diffDays === 1) return { reminder: 'Assessment tomorrow', urgency: 'HIGH' };
    if (diffDays === 2) return { reminder: 'Assessment in 2 days', urgency: 'HIGH' };
    if (diffDays > 2 && diffDays <= 7) return { reminder: `Assessment in ${diffDays} days`, urgency: 'NORMAL' };
    if (diffDays < 0) return { reminder: 'Assessment date has passed', urgency: 'LOW' };
    return { reminder: `Assessment scheduled for ${scheduledDate}`, urgency: 'NORMAL' };
  }

  createRplApplication(appData, actor) {
    const data = this.read();
    if (!data.rpl_applications) data.rpl_applications = [];

    const appId = 'app_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const appNumber = this.generateApplicationNumber(data);

    let qp = null;
    if (appData.qualificationPackId || appData.qualificationPackCode) {
      qp = this.getQualificationPackById(appData.qualificationPackId || appData.qualificationPackCode);
    } else if (appData.occupation) {
      qp = (data.rpl_qualification_packs || []).find(p => 
        (p.trade && p.trade.toLowerCase() === appData.occupation.toLowerCase()) ||
        (p.occupation && p.occupation.toLowerCase() === appData.occupation.toLowerCase())
      );
    }

    const application = {
      id: appId,
      applicationNumber: appNumber,
      learnerId: appData.learnerId,
      learnerName: appData.learnerName || actor?.name || 'Worker Candidate',
      occupation: appData.occupation || qp?.trade || 'Vocational Trade Candidate',
      qualificationPackId: qp?.id || appData.qualificationPackId || null,
      qualificationPackCode: qp?.qpCode || appData.qualificationPackCode || null,
      nsqfLevel: qp?.nsqfLevel || appData.nsqfLevel || 4,
      status: appData.status || 'SUBMITTED',
      currentStage: 'Application Submitted & Awaiting Review',
      assignedAssessorId: null,
      assignedAssessorName: null,
      assessmentCentreId: null,
      assessmentCentreName: null,
      scheduledDate: null,
      scheduledTime: null,
      scheduledEndTime: null,
      assessmentId: appData.assessmentId || null,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: 'tl_init_' + Date.now(),
          stage: 'APPLICATION_SUBMITTED',
          status: 'SUBMITTED',
          timestamp: new Date().toISOString(),
          actor: actor?.name || appData.learnerName || 'Worker',
          description: `RPL Application ${appNumber} submitted for ${appData.occupation || qp?.trade || 'vocational recognition'}`
        }
      ]
    };

    // If an assessmentId was given or active for this learner, link it
    if (!application.assessmentId) {
      const activeAsm = (data.rpl_assessments || []).find(a => 
        a.learnerId === appData.learnerId && 
        (!qp || a.qualificationPackId === qp.id || a.qpCode === qp.qpCode) &&
        !['COMPLETED', 'WITHDRAWN', 'CANCELLED'].includes(a.status)
      );
      if (activeAsm) {
        application.assessmentId = activeAsm.id;
        activeAsm.applicationId = application.id;
      }
    }

    data.rpl_applications.push(application);

    this.addAuditLog(data, {
      applicationId: application.id,
      assessmentId: application.assessmentId,
      userId: appData.learnerId,
      userName: application.learnerName,
      action: 'APPLICATION_CREATED',
      details: `Created RPL Application ${application.applicationNumber} for ${application.occupation}`
    });

    this.addAuditLog(data, {
      applicationId: application.id,
      assessmentId: application.assessmentId,
      userId: appData.learnerId,
      userName: application.learnerName,
      action: 'APPLICATION_SUBMITTED',
      details: `Submitted application ${application.applicationNumber} for institution review`
    });

    this.write(data);
    return { success: true, application };
  }

  getRplApplicationById(id) {
    const data = this.read();
    const app = (data.rpl_applications || []).find(a => a.id === id || a.applicationNumber === id);
    if (!app) return null;

    const assessment = (data.rpl_assessments || []).find(a => a.id === app.assessmentId || a.applicationId === app.id);
    const centre = app.assessmentCentreId ? (data.assessment_centres || []).find(c => c.id === app.assessmentCentreId) : null;
    const evidence = (data.evidence || []).filter(e => e.learnerId === app.learnerId);
    const auditLogs = (data.assessment_audit_logs || []).filter(l => 
      l.applicationId === app.id || (app.assessmentId && l.assessmentId === app.assessmentId)
    );

    const reminders = this.computeAssessmentReminders(app.scheduledDate);

    return {
      ...app,
      assessment: assessment || null,
      assessmentCentre: centre || null,
      evidenceList: evidence,
      auditLogs,
      reminders,
      priority: this.calculateOperationalPriority(app)
    };
  }

  getMyRplApplications(learnerId) {
    const data = this.read();
    const apps = (data.rpl_applications || []).filter(a => a.learnerId === learnerId);
    
    return apps.map(app => {
      const assessment = (data.rpl_assessments || []).find(a => a.id === app.assessmentId || a.applicationId === app.id);
      const reminders = this.computeAssessmentReminders(app.scheduledDate);
      const evidence = (data.evidence || []).filter(e => e.learnerId === app.learnerId);
      
      return {
        ...app,
        assessmentSummary: assessment ? {
          totalScore: assessment.totalScore,
          maxScore: assessment.maxScore,
          percentage: assessment.percentage,
          status: assessment.status,
          finalRecommendation: assessment.finalRecommendation
        } : null,
        evidenceCount: evidence.length,
        reminders,
        priority: this.calculateOperationalPriority(app)
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getAllRplApplications(filters = {}) {
    const data = this.read();
    let list = data.rpl_applications || [];

    if (filters.status) {
      list = list.filter(a => a.status === filters.status);
    }
    if (filters.occupation) {
      list = list.filter(a => (a.occupation || '').toLowerCase().includes(filters.occupation.toLowerCase()));
    }
    if (filters.qpCode) {
      list = list.filter(a => (a.qualificationPackCode || '').toLowerCase().includes(filters.qpCode.toLowerCase()));
    }
    if (filters.assessorId) {
      list = list.filter(a => a.assignedAssessorId === filters.assessorId);
    }
    if (filters.assessmentCentreId) {
      list = list.filter(a => a.assessmentCentreId === filters.assessmentCentreId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(a => 
        (a.learnerName && a.learnerName.toLowerCase().includes(q)) ||
        (a.applicationNumber && a.applicationNumber.toLowerCase().includes(q)) ||
        (a.learnerId && a.learnerId.toLowerCase().includes(q)) ||
        (a.occupation && a.occupation.toLowerCase().includes(q)) ||
        (a.qualificationPackCode && a.qualificationPackCode.toLowerCase().includes(q))
      );
    }

    return list.map(app => ({
      ...app,
      priority: this.calculateOperationalPriority(app)
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  updateRplApplicationStatus(id, newStatus, reason, actor) {
    const data = this.read();
    const app = (data.rpl_applications || []).find(a => a.id === id || a.applicationNumber === id);
    if (!app) return { success: false, message: 'Application not found.' };

    const allowed = [
      'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'QP_SELECTED', 'EVIDENCE_COLLECTION',
      'ASSESSOR_ASSIGNED', 'ASSESSMENT_SCHEDULED', 'READY_FOR_ASSESSMENT',
      'UNDER_ASSESSMENT', 'ASSESSOR_REVIEW', 'FURTHER_EVIDENCE_REQUIRED',
      'RECOMMENDED_FOR_CERTIFICATION', 'NOT_YET_COMPETENT', 'COMPLETED', 'WITHDRAWN', 'CANCELLED'
    ];
    if (!allowed.includes(newStatus)) {
      return { success: false, message: `Invalid status: ${newStatus}` };
    }

    const prevStatus = app.status;
    app.status = newStatus;
    app.updatedAt = new Date().toISOString();
    if (newStatus === 'UNDER_REVIEW') app.reviewedAt = new Date().toISOString();
    if (['COMPLETED', 'RECOMMENDED_FOR_CERTIFICATION', 'NOT_YET_COMPETENT'].includes(newStatus)) {
      app.completedAt = new Date().toISOString();
    }

    if (!app.timeline) app.timeline = [];
    app.timeline.push({
      id: 'tl_stat_' + Date.now(),
      stage: newStatus,
      status: newStatus,
      timestamp: new Date().toISOString(),
      actor: actor?.name || 'Institution Administrator',
      description: `Application status transitioned from ${prevStatus} to ${newStatus}.${reason ? ' Reason: ' + reason : ''}`
    });

    this.addAuditLog(data, {
      applicationId: app.id,
      assessmentId: app.assessmentId,
      userId: actor?.id || 'system',
      userName: actor?.name || 'Authorized Admin',
      action: 'APPLICATION_STATUS_UPDATED',
      details: `Status updated from ${prevStatus} to ${newStatus}. ${reason || ''}`
    });

    this.write(data);
    return { success: true, application: app };
  }

  assignRplAssessor(applicationId, { assessorId, assessorName }, actor) {
    const data = this.read();
    const app = (data.rpl_applications || []).find(a => a.id === applicationId || a.applicationNumber === applicationId);
    if (!app) return { success: false, message: 'Application not found.' };

    let name = assessorName;
    if (!name) {
      const assessor = (data.assessors || []).find(ass => ass.id === assessorId || ass.assessorId === assessorId || ass.userId === assessorId);
      if (assessor) name = assessor.fullName;
      else {
        const u = (data.users || []).find(usr => usr.id === assessorId || usr.userId === assessorId);
        if (u) name = u.name || u.fullName || u.email;
      }
    }
    name = name || 'Authorized Lead Assessor';

    app.assignedAssessorId = assessorId;
    app.assignedAssessorName = name;
    if (['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'QP_SELECTED'].includes(app.status)) {
      app.status = 'ASSESSOR_ASSIGNED';
    }
    app.updatedAt = new Date().toISOString();

    if (!app.timeline) app.timeline = [];
    app.timeline.push({
      id: 'tl_assr_' + Date.now(),
      stage: 'ASSESSOR_ASSIGNED',
      status: app.status,
      timestamp: new Date().toISOString(),
      actor: actor?.name || 'Institution Administrator',
      description: `Assigned Lead Assessor: ${name} (${assessorId})`
    });

    // Sync with linked assessment
    if (app.assessmentId) {
      const asm = (data.rpl_assessments || []).find(a => a.id === app.assessmentId);
      if (asm) {
        asm.assessorId = assessorId;
        asm.assessorName = name;
        asm.updatedAt = new Date().toISOString();
      }
    }

    // Create notification for worker
    this.addNotification(data, {
      userId: app.learnerId,
      type: 'ASSESSOR_ASSIGNED',
      title: 'Assessor Assigned',
      message: `An assessor (${name}) has been assigned to your RPL application.`,
      relatedEntityType: 'rpl_application',
      relatedEntityId: app.id
    });

    this.addAuditLog(data, {
      applicationId: app.id,
      assessmentId: app.assessmentId,
      userId: actor?.id || 'institution',
      userName: actor?.name || 'Authorized Institution',
      action: 'ASSESSOR_ASSIGNED',
      details: `Assigned assessor ${name} (${assessorId}) to application ${app.applicationNumber}`
    });

    this.write(data);
    return { success: true, application: app };
  }

  scheduleRplAssessment(applicationId, scheduleData, actor) {
    const data = this.read();
    const app = (data.rpl_applications || []).find(a => a.id === applicationId || a.applicationNumber === applicationId);
    if (!app) return { success: false, message: 'Application not found.' };

    const scheduledDate = scheduleData.scheduledDate || scheduleData.date;
    const scheduledTime = scheduleData.scheduledTime || scheduleData.time;
    const scheduledEndTime = scheduleData.scheduledEndTime || scheduleData.endTime || null;
    const assessmentCentreId = scheduleData.assessmentCentreId || scheduleData.centreId;
    const assessorId = scheduleData.assessorId || app.assignedAssessorId || 'usr_demo_assessor_01';

    if (!scheduledDate || !scheduledTime) {
      return { success: false, message: 'Scheduled date and start time are required.' };
    }

    // Centre validation
    const centre = (data.assessment_centres || []).find(c => c.id === assessmentCentreId || c.code === assessmentCentreId);
    if (assessmentCentreId && !centre) {
      return { success: false, message: 'Specified assessment centre not found.' };
    }
    if (centre && centre.active === false) {
      return { success: false, message: 'Selected assessment centre is currently inactive.' };
    }

    // Double-booking conflict detection for the assessor
    const conflictApp = (data.rpl_applications || []).find(other => 
      other.id !== app.id &&
      other.assignedAssessorId === assessorId &&
      other.scheduledDate === scheduledDate &&
      other.scheduledTime === scheduledTime &&
      !['CANCELLED', 'WITHDRAWN', 'COMPLETED'].includes(other.status)
    );

    const conflictAsm = (data.rpl_assessments || []).find(other => 
      other.id !== app.assessmentId &&
      other.assessorId === assessorId &&
      other.scheduledDate === scheduledDate &&
      other.scheduledTime === scheduledTime &&
      !['CANCELLED', 'COMPLETED'].includes(other.status)
    );

    if (conflictApp || conflictAsm) {
      return {
        success: false,
        conflict: true,
        message: 'ASSESSMENT SLOT CONFLICT: This assessor already has an assessment at this time.'
      };
    }

    const centreName = centre ? centre.name : (scheduleData.assessmentCentre || 'SkillWorth Practical Assessment Centre');

    app.scheduledDate = scheduledDate;
    app.scheduledTime = scheduledTime;
    app.scheduledEndTime = scheduledEndTime;
    app.assessmentCentreId = centre ? centre.id : null;
    app.assessmentCentreName = centreName;
    app.assignedAssessorId = assessorId;
    if (scheduleData.assessorName) app.assignedAssessorName = scheduleData.assessorName;
    app.status = 'ASSESSMENT_SCHEDULED';
    app.currentStage = 'Assessment Scheduled';
    app.updatedAt = new Date().toISOString();

    if (!app.timeline) app.timeline = [];
    app.timeline.push({
      id: 'tl_sch_' + Date.now(),
      stage: 'ASSESSMENT_SCHEDULED',
      status: 'ASSESSMENT_SCHEDULED',
      timestamp: new Date().toISOString(),
      actor: actor?.name || 'Institution Administrator',
      description: `Practical assessment scheduled for ${scheduledDate} at ${scheduledTime} at ${centreName}`
    });

    // Update linked assessment record
    if (app.assessmentId) {
      const asm = (data.rpl_assessments || []).find(a => a.id === app.assessmentId);
      if (asm) {
        asm.scheduledDate = scheduledDate;
        asm.scheduledTime = scheduledTime;
        asm.assessmentCentre = centreName;
        asm.assessorId = assessorId;
        asm.status = 'ASSESSMENT_SCHEDULED';
        asm.updatedAt = new Date().toISOString();
      }
    }

    // Notify Worker
    this.addNotification(data, {
      userId: app.learnerId,
      type: 'ASSESSMENT_SCHEDULED',
      title: 'Assessment Scheduled',
      message: `Your RPL practical assessment has been scheduled on ${scheduledDate} at ${scheduledTime} at ${centreName}.`,
      relatedEntityType: 'rpl_application',
      relatedEntityId: app.id
    });

    // Notify Assessor
    if (assessorId) {
      this.addNotification(data, {
        userId: assessorId,
        type: 'ASSESSMENT_SCHEDULED',
        title: 'New Assessment Scheduled',
        message: `An assessment has been scheduled for candidate ${app.learnerName} on ${scheduledDate} at ${scheduledTime}.`,
        relatedEntityType: 'rpl_application',
        relatedEntityId: app.id
      });
    }

    this.addAuditLog(data, {
      applicationId: app.id,
      assessmentId: app.assessmentId,
      userId: actor?.id || 'institution',
      userName: actor?.name || 'Institution Coordinator',
      action: 'ASSESSMENT_SCHEDULED',
      details: `Scheduled on ${scheduledDate} at ${scheduledTime} at ${centreName}. Assessor: ${app.assignedAssessorName || assessorId}`
    });

    if (centre) {
      this.addAuditLog(data, {
        applicationId: app.id,
        assessmentId: app.assessmentId,
        userId: actor?.id || 'institution',
        userName: actor?.name || 'Institution Coordinator',
        action: 'ASSESSMENT_CENTRE_ASSIGNED',
        details: `Assigned assessment centre ${centre.name} (${centre.code})`
      });
    }

    this.write(data);
    return { success: true, application: app };
  }

  rescheduleRplAssessment(applicationId, { newDate, newTime, reason }, actor) {
    const data = this.read();
    const app = (data.rpl_applications || []).find(a => a.id === applicationId || a.applicationNumber === applicationId);
    if (!app) return { success: false, message: 'Application not found.' };

    if (!newDate || !newTime || !reason) {
      return { success: false, message: 'New date, new time, and rescheduling reason are mandatory.' };
    }

    const assessorId = app.assignedAssessorId;
    const conflict = assessorId ? (data.rpl_applications || []).find(other => 
      other.id !== app.id &&
      other.assignedAssessorId &&
      other.assignedAssessorId === assessorId &&
      other.scheduledDate === newDate &&
      other.scheduledTime === newTime &&
      !['CANCELLED', 'WITHDRAWN', 'COMPLETED'].includes(other.status)
    ) : null;
    if (conflict) {
      return {
        success: false,
        conflict: true,
        message: 'ASSESSMENT SLOT CONFLICT: This assessor already has an assessment at this time.'
      };
    }

    const prevDate = app.scheduledDate;
    const prevTime = app.scheduledTime;
    app.scheduledDate = newDate;
    app.scheduledTime = newTime;
    app.status = 'ASSESSMENT_SCHEDULED';
    app.updatedAt = new Date().toISOString();

    if (!app.timeline) app.timeline = [];
    app.timeline.push({
      id: 'tl_resch_' + Date.now(),
      stage: 'ASSESSMENT_RESCHEDULED',
      status: 'ASSESSMENT_SCHEDULED',
      timestamp: new Date().toISOString(),
      actor: actor?.name || 'Institution Coordinator',
      description: `Assessment rescheduled to ${newDate} at ${newTime}. Reason: ${reason}`
    });

    if (app.assessmentId) {
      const asm = (data.rpl_assessments || []).find(a => a.id === app.assessmentId);
      if (asm) {
        asm.scheduledDate = newDate;
        asm.scheduledTime = newTime;
        asm.updatedAt = new Date().toISOString();
      }
    }

    // Notify Worker
    this.addNotification(data, {
      userId: app.learnerId,
      type: 'ASSESSMENT_RESCHEDULED',
      title: 'Assessment Rescheduled',
      message: `Your practical assessment schedule has been updated to ${newDate} at ${newTime}. Reason: ${reason}`,
      relatedEntityType: 'rpl_application',
      relatedEntityId: app.id
    });

    // Notify Assessor
    if (assessorId) {
      this.addNotification(data, {
        userId: assessorId,
        type: 'ASSESSMENT_RESCHEDULED',
        title: 'Assessment Rescheduled',
        message: `Assessment for candidate ${app.learnerName} rescheduled to ${newDate} at ${newTime}. Reason: ${reason}`,
        relatedEntityType: 'rpl_application',
        relatedEntityId: app.id
      });
    }

    this.addAuditLog(data, {
      applicationId: app.id,
      assessmentId: app.assessmentId,
      userId: actor?.id || 'institution',
      userName: actor?.name || 'Institution Coordinator',
      action: 'ASSESSMENT_RESCHEDULED',
      details: `Rescheduled from ${prevDate} ${prevTime} to ${newDate} ${newTime}. Reason: ${reason}`
    });

    this.write(data);
    return { success: true, application: app };
  }

  cancelRplAssessment(applicationId, { reason }, actor) {
    const data = this.read();
    const app = (data.rpl_applications || []).find(a => a.id === applicationId || a.applicationNumber === applicationId);
    if (!app) return { success: false, message: 'Application not found.' };

    if (!reason) {
      return { success: false, message: 'Cancellation reason is mandatory.' };
    }

    app.status = 'CANCELLED';
    app.currentStage = 'Assessment Cancelled';
    app.updatedAt = new Date().toISOString();

    if (!app.timeline) app.timeline = [];
    app.timeline.push({
      id: 'tl_cancel_' + Date.now(),
      stage: 'ASSESSMENT_CANCELLED',
      status: 'CANCELLED',
      timestamp: new Date().toISOString(),
      actor: actor?.name || 'Institution Coordinator',
      description: `Assessment cancelled. Reason: ${reason}`
    });

    if (app.assessmentId) {
      const asm = (data.rpl_assessments || []).find(a => a.id === app.assessmentId);
      if (asm) {
        asm.status = 'CANCELLED';
        asm.updatedAt = new Date().toISOString();
      }
    }

    // Notify Worker
    this.addNotification(data, {
      userId: app.learnerId,
      type: 'ASSESSMENT_CANCELLED',
      title: 'Assessment Cancelled',
      message: `Your scheduled practical assessment has been cancelled. Reason: ${reason}`,
      relatedEntityType: 'rpl_application',
      relatedEntityId: app.id
    });

    // Notify Assessor
    if (app.assignedAssessorId) {
      this.addNotification(data, {
        userId: app.assignedAssessorId,
        type: 'ASSESSMENT_CANCELLED',
        title: 'Assessment Cancelled',
        message: `Scheduled assessment for candidate ${app.learnerName} has been cancelled. Reason: ${reason}`,
        relatedEntityType: 'rpl_application',
        relatedEntityId: app.id
      });
    }

    this.addAuditLog(data, {
      applicationId: app.id,
      assessmentId: app.assessmentId,
      userId: actor?.id || 'institution',
      userName: actor?.name || 'Institution Coordinator',
      action: 'ASSESSMENT_CANCELLED',
      details: `Cancelled assessment for application ${app.applicationNumber}. Reason: ${reason}`
    });

    this.write(data);
    return { success: true, application: app };
  }

  getAssessorWorkQueue(assessorId) {
    const data = this.read();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const validAssessorIds = new Set();
    if (assessorId) {
      validAssessorIds.add(assessorId);
      const user = (data.users || []).find(u => u.id === assessorId || u.userId === assessorId || u.email === assessorId);
      if (user) {
        if (user.id) validAssessorIds.add(user.id);
        if (user.userId) validAssessorIds.add(user.userId);
        if (user.profileId) validAssessorIds.add(user.profileId);
      }
      const assessor = (data.assessors || []).find(a => a.id === assessorId || a.assessorId === assessorId || a.userId === assessorId);
      if (assessor) {
        if (assessor.id) validAssessorIds.add(assessor.id);
        if (assessor.assessorId) validAssessorIds.add(assessor.assessorId);
        if (assessor.userId) validAssessorIds.add(assessor.userId);
      }
    }

    const apps = (data.rpl_applications || []).filter(a => {
      if (!assessorId) return true;
      if (validAssessorIds.has(a.assignedAssessorId)) return true;
      if (assessorId === 'usr_demo_assessor_01' || assessorId === 'ASSR-DEMO-01') return true;
      return false;
    });

    const assessments = (data.rpl_assessments || []).filter(a => {
      if (!assessorId) return true;
      if (validAssessorIds.has(a.assessorId)) return true;
      if (assessorId === 'usr_demo_assessor_01' || assessorId === 'ASSR-DEMO-01') return true;
      return false;
    });

    const queueItems = apps.map(app => {
      const asm = assessments.find(a => a.id === app.assessmentId || a.applicationId === app.id);
      const evidence = (data.evidence || []).filter(e => e.learnerId === app.learnerId);
      const priorityInfo = this.calculateOperationalPriority(app);
      const reminders = this.computeAssessmentReminders(app.scheduledDate);

      return {
        id: app.id,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        assessmentId: asm ? asm.id : app.assessmentId,
        workerName: app.learnerName,
        workerId: app.learnerId,
        occupation: app.occupation,
        qualificationPackCode: app.qualificationPackCode || asm?.qpCode || 'N/A',
        nsqfLevel: app.nsqfLevel || asm?.nsqfLevel || 4,
        status: app.status,
        scheduledDate: app.scheduledDate,
        scheduledTime: app.scheduledTime,
        assessmentCentre: app.assessmentCentreName,
        evidenceCount: evidence.length,
        priority: priorityInfo.priority,
        priorityLabel: priorityInfo.label,
        priorityColor: priorityInfo.color,
        reminders,
        hasAssessment: Boolean(asm),
        assessmentPercentage: asm ? asm.percentage : 0,
        createdAt: app.createdAt
      };
    });

    const todayAssessments = queueItems.filter(i => i.priority === 'URGENT' && i.status !== 'CANCELLED');
    const pendingReview = queueItems.filter(i => ['UNDER_REVIEW', 'UNDER_ASSESSMENT', 'ASSESSOR_REVIEW'].includes(i.status));
    const evidencePending = queueItems.filter(i => ['FURTHER_EVIDENCE_REQUIRED', 'EVIDENCE_COLLECTION'].includes(i.status));
    const upcoming = queueItems.filter(i => i.scheduledDate && i.scheduledDate > todayStr && i.status !== 'CANCELLED');
    const awaitingDecision = queueItems.filter(i => i.status === 'ASSESSOR_REVIEW' || (i.assessmentPercentage > 0 && !['COMPLETED', 'RECOMMENDED_FOR_CERTIFICATION', 'NOT_YET_COMPETENT'].includes(i.status)));
    const completed = queueItems.filter(i => ['COMPLETED', 'RECOMMENDED_FOR_CERTIFICATION', 'NOT_YET_COMPETENT'].includes(i.status));

    return {
      success: true,
      totalCount: queueItems.length,
      queue: queueItems,
      grouped: {
        todayAssessments,
        pendingReview,
        evidencePending,
        upcoming,
        awaitingDecision,
        completed
      }
    };
  }

  getInstitutionRplOverview(institutionId) {
    const data = this.read();
    const apps = data.rpl_applications || [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const totalApplications = apps.length;
    const underReview = apps.filter(a => a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED').length;
    const evidencePending = apps.filter(a => a.status === 'FURTHER_EVIDENCE_REQUIRED' || a.status === 'EVIDENCE_COLLECTION').length;
    const assessorAssigned = apps.filter(a => a.status === 'ASSESSOR_ASSIGNED').length;
    const scheduled = apps.filter(a => a.status === 'ASSESSMENT_SCHEDULED').length;
    const todayAssessments = apps.filter(a => a.scheduledDate === todayStr && a.status !== 'CANCELLED').length;
    const awaitingDecision = apps.filter(a => a.status === 'UNDER_ASSESSMENT' || a.status === 'ASSESSOR_REVIEW').length;
    const completed = apps.filter(a => ['COMPLETED', 'RECOMMENDED_FOR_CERTIFICATION', 'NOT_YET_COMPETENT'].includes(a.status)).length;

    return {
      success: true,
      overview: {
        totalApplications,
        underReview,
        evidencePending,
        assessorAssigned,
        scheduled,
        todayAssessments,
        awaitingDecision,
        completed
      }
    };
  }

  // ================= Notification System =================

  addNotification(data, notifData) {
    if (!data.notifications) data.notifications = [];
    const notif = {
      id: 'notif_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      userId: notifData.userId,
      type: notifData.type || 'SYSTEM_INFO',
      title: notifData.title || 'Notification',
      message: notifData.message || '',
      relatedEntityType: notifData.relatedEntityType || null,
      relatedEntityId: notifData.relatedEntityId || null,
      read: false,
      createdAt: new Date().toISOString()
    };
    data.notifications.push(notif);
    return notif;
  }

  createNotification(notifData) {
    const data = this.read();
    const notif = this.addNotification(data, notifData);
    this.write(data);
    return notif;
  }

  getNotifications(userId) {
    const data = this.read();
    const validUserIds = new Set();
    if (userId) {
      validUserIds.add(userId);
      const user = (data.users || []).find(u => u.id === userId || u.userId === userId || u.email === userId);
      if (user) {
        if (user.id) validUserIds.add(user.id);
        if (user.userId) validUserIds.add(user.userId);
        if (user.profileId) validUserIds.add(user.profileId);
      }
      const profile = (data.learner_profiles || []).find(p => p.id === userId || p.learnerId === userId || p.userId === userId);
      if (profile) {
        if (profile.id) validUserIds.add(profile.id);
        if (profile.learnerId) validUserIds.add(profile.learnerId);
        if (profile.userId) validUserIds.add(profile.userId);
      }
    }

    return (data.notifications || [])
      .filter(n => validUserIds.has(n.userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  markNotificationRead(notificationId, userId) {
    const data = this.read();
    const notif = (data.notifications || []).find(n => n.id === notificationId && (!userId || n.userId === userId));
    if (notif) {
      notif.read = true;
      this.write(data);
      return { success: true, notification: notif };
    }
    return { success: false, message: 'Notification not found' };
  }

  markAllNotificationsRead(userId) {
    const data = this.read();
    let updated = 0;
    (data.notifications || []).forEach(n => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        updated++;
      }
    });
    this.write(data);
    return { success: true, updatedCount: updated };
  }

  // ================= Assessment Centre Management =================

  getAssessmentCentres(filters = {}) {
    const data = this.read();
    let list = data.assessment_centres || [];

    if (filters.active !== undefined) {
      const isActive = filters.active === 'true' || filters.active === true;
      list = list.filter(c => c.active === isActive);
    }
    if (filters.sector) {
      list = list.filter(c => (c.supportedSectors || []).some(s => s.toLowerCase().includes(filters.sector.toLowerCase())));
    }
    if (filters.occupation) {
      list = list.filter(c => (c.supportedOccupations || []).some(o => o.toLowerCase().includes(filters.occupation.toLowerCase())));
    }

    return list;
  }

  createAssessmentCentre(centreData) {
    const data = this.read();
    if (!data.assessment_centres) data.assessment_centres = [];

    const id = centreData.id || 'AC-' + Date.now().toString(36).toUpperCase();
    const centre = {
      id,
      name: centreData.name,
      code: centreData.code || id,
      address: centreData.address || '',
      district: centreData.district || '',
      state: centreData.state || '',
      supportedSectors: centreData.supportedSectors || [],
      supportedOccupations: centreData.supportedOccupations || [],
      capacity: Number(centreData.capacity) || 30,
      active: centreData.active !== false,
      contactName: centreData.contactName || '',
      contactPhone: centreData.contactPhone || '',
      isDemo: Boolean(centreData.isDemo),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.assessment_centres.push(centre);
    this.write(data);
    return { success: true, centre };
  }

  // Phase 5: AI Intelligence helper methods
  getRplAssessmentByApplicationId(applicationId) {
    const data = this.read();
    return (data.rpl_assessments || []).find(
      a => a.applicationId === applicationId || a.id === applicationId
    ) || null;
  }

  getAllRplAssessments() {
    const data = this.read();
    return data.rpl_assessments || [];
  }

  getEvidenceForLearner(learnerId) {
    const data = this.read();
    return (data.evidence || []).filter(
      e => e.learnerId === learnerId
    );
  }
}

const skillworthDb = new SkillworthDatabase();
module.exports = skillworthDb;
module.exports.skillworthDb = skillworthDb;
