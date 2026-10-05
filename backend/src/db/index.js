const fs = require('fs');
const path = require('path');
const seedData = require('./seedData');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[DB] Notice: cannot create data directory on read-only filesystem:', e.message);
}

// Initialize database file if not present
try {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
  }
} catch (e) {
  console.warn('[DB] Notice: cannot initialize db.json on read-only filesystem:', e.message);
}

class Database {
  constructor() {
    this.filePath = DB_FILE;
  }

  _ensurePgRuntime(action = 'access') {
    if (String(process.env.POSTGRESQL_REQUIRED || '').toLowerCase() === 'true') {
      const err = new Error(`DATABASE ERROR: PostgreSQL is mandatory (POSTGRESQL_REQUIRED=true). Legacy db.json ${action} is strictly disabled.`);
      err.code = 'POSTGRESQL_REQUIRED';
      throw err;
    }
    return true;
  }

  _read() {
    this._ensurePgRuntime('read');
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(content);
      }
      return JSON.parse(JSON.stringify(seedData));
    } catch (err) {
      console.warn('Error reading DB, using default seed data:', err.message);
      return JSON.parse(JSON.stringify(seedData));
    }
  }

  _write(data) {
    this._ensurePgRuntime('write');
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      if (err.code === 'EROFS' || process.env.VERCEL) {
        console.warn('[DB] Filesystem is read-only; skipping local JSON write in serverless environment.');
      } else {
        throw err;
      }
    }
  }

  // Users
  getUserByEmail(email) {
    const data = this._read();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id) {
    const data = this._read();
    return data.users.find(u => u.id === id);
  }

  updateUser(id, updates) {
    const data = this._read();
    const index = data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    data.users[index] = { ...data.users[index], ...updates };
    this._write(data);
    return data.users[index];
  }

  // Skills
  getSkills(userId) {
    const data = this._read();
    return data.skills.filter(s => !userId || s.userId === userId);
  }

  getSkillById(id) {
    const data = this._read();
    return data.skills.find(s => s.id === id);
  }

  addSkill(skill) {
    const data = this._read();
    const newSkill = {
      id: 'sk_' + Date.now(),
      status: 'enrolled',
      masteryScore: 40,
      projectsCount: 0,
      examsPassed: 'In Progress',
      verified: false,
      credentialHash: null,
      ...skill
    };
    data.skills.unshift(newSkill);
    this._write(data);
    return newSkill;
  }

  updateSkill(id, updates) {
    const data = this._read();
    const index = data.skills.findIndex(s => s.id === id);
    if (index === -1) return null;
    data.skills[index] = { ...data.skills[index], ...updates };
    this._write(data);
    return data.skills[index];
  }

  deleteSkill(id) {
    const data = this._read();
    const filtered = data.skills.filter(s => s.id !== id);
    data.skills = filtered;
    this._write(data);
    return true;
  }

  // Assessments
  getAssessments(userId) {
    const data = this._read();
    return data.assessments.filter(a => !userId || a.userId === userId);
  }

  saveAssessmentResult(userId, trackCode, score, answers) {
    const data = this._read();
    const existingIndex = data.assessments.findIndex(a => a.trackCode === trackCode && a.userId === userId);
    const updatedRecord = {
      id: 'as_' + Date.now(),
      userId,
      track: trackCode === 'LR-4416' ? 'Logical Reasoning' : (trackCode === 'AP-2011' ? 'Aptitude' : 'Programming'),
      trackCode,
      status: 'Completed',
      score,
      maxScore: 100,
      percentile: (score >= 80 ? 92.4 : (score >= 60 ? 78.5 : 55.0)),
      accuracy: Math.min(100, Math.round(score * 1.05)),
      speedIndex: 1.2,
      duration: '35 mins',
      completedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      strongAreas: ['Data Wrangling', 'Conditional Logic', 'Analytical Modeling'],
      weakAreas: ['Graph Algorithms', 'Memory Optimization'],
      marketImpact: '+8% boost to Data Analyst match readiness',
      marketImpactDetails: 'Completing remediation closes the threshold gap for top Tier-1 analytics pipelines.',
      recommendedLearning: {
        title: 'Graph Algorithms Sprint',
        duration: '3 days',
        impact: 'High'
      }
    };

    if (existingIndex >= 0) {
      data.assessments[existingIndex] = { ...data.assessments[existingIndex], ...updatedRecord };
    } else {
      data.assessments.push(updatedRecord);
    }
    this._write(data);
    return updatedRecord;
  }

  // Learning & Courses
  getLearning(userId) {
    const data = this._read();
    return {
      courses: data.learningCourses.filter(c => !userId || c.userId === userId),
      telemetry: data.weeklyTelemetry
    };
  }

  enrollCourse(userId, courseData) {
    const data = this._read();
    const newCourse = {
      id: 'crs_' + Date.now(),
      userId,
      title: courseData.title || 'Generative AI Fundamentals',
      category: courseData.category || 'BY NEXUS AI',
      progress: 0,
      completedModules: 0,
      totalModules: courseData.totalModules || 12,
      hoursRemaining: courseData.hours || 18,
      currentModule: 'Module 1: Foundations & Architecture',
      completedLessons: [],
      rating: 5.0,
      enrolledAt: new Date().toISOString()
    };
    data.learningCourses.push(newCourse);
    this._write(data);
    return newCourse;
  }

  updateCourseProgress(id, progressIncrement) {
    const data = this._read();
    const index = data.learningCourses.findIndex(c => c.id === id);
    if (index === -1) return null;
    const course = data.learningCourses[index];
    course.progress = Math.min(100, course.progress + (progressIncrement || 10));
    course.completedModules = Math.min(course.totalModules, course.completedModules + 1);
    course.hoursRemaining = Math.max(0, course.hoursRemaining - 2);
    this._write(data);
    return course;
  }

  // Emerging Tech Radar
  getEmergingTechnologies() {
    const data = this._read();
    return data.emergingTechnologies;
  }

  // Projects
  getProjects(userId) {
    const data = this._read();
    return data.projects.filter(p => !userId || p.userId === userId);
  }

  addProject(project) {
    const data = this._read();
    const newProject = {
      id: 'prj_' + Date.now(),
      progress: 10,
      benchmarkMatch: null,
      status: 'In Progress (Active Sandbox)',
      statusNote: 'Initial commits indexed & verified',
      sandboxAvailable: true,
      milestone: 'M1 Active',
      ...project
    };
    data.projects.unshift(newProject);
    this._write(data);
    return newProject;
  }

  // Opportunities
  getOpportunities() {
    const data = this._read();
    return data.opportunities;
  }

  getOpportunityById(id) {
    const data = this._read();
    return data.opportunities.find(o => o.id === id);
  }

  applyOpportunity(userId, opportunityId, applicationDetails) {
    const data = this._read();
    const newApp = {
      id: 'app_' + Date.now(),
      userId,
      opportunityId,
      appliedAt: new Date().toISOString(),
      status: 'Passport Verified & Under Review',
      passportHash: 'did:nexus:0x89419f8721cba3402ef94819d429c',
      recruiterAction: 'Fast-Track Queue Assigned • 1-Click Passport Transmitted',
      ...applicationDetails
    };
    data.applications.unshift(newApp);
    this._write(data);
    return newApp;
  }

  getApplications(userId) {
    const data = this._read();
    return data.applications.filter(a => !userId || a.userId === userId);
  }

  // Digital Passport
  getDigitalPassport(userId) {
    const data = this._read();
    const user = data.users.find(u => u.id === userId) || data.users[0];
    return {
      user,
      credentials: data.digitalCredentials,
      accreditedSeals: data.accreditedSeals,
      recruiterStats: {
        instantVerificationToken: 'VALID',
        zkProofEnabled: true,
        directRecruiterPings: 12,
        activeMonitors: data.industryPings
      }
    };
  }

  // Reset to seed data
  resetDatabase() {
    this._write(seedData);
    return true;
  }
}

module.exports = new Database();
