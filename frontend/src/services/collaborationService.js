/**
 * SKILL NEXUS AI — Three-Portal Unified Collaboration Service
 * Bridges React Frontend with PostgreSQL Relational Engine for:
 * 1. Institution Assessment Tests (Logical, Aptitude, Programming + Languages)
 * 2. Institution -> Company Student Access Requests
 * 3. Company Student Access Verification & Development Timeline
 * 4. Student Institution Assessment Execution
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const collaborationService = {
  // ── INSTITUTION: ASSESSMENT TESTS ──
  async getInstitutionAssessments() {
    const res = await fetch(`${API_BASE}/academic/assessments`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async createAssessment(assessmentData) {
    const res = await fetch(`${API_BASE}/academic/assessments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(assessmentData)
    });
    return await res.json();
  },

  async addAssessmentQuestion(assessmentId, questionData) {
    const res = await fetch(`${API_BASE}/academic/assessments/${encodeURIComponent(assessmentId)}/questions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(questionData)
    });
    return await res.json();
  },

  async publishAssessment(assessmentId) {
    const res = await fetch(`${API_BASE}/academic/assessments/${encodeURIComponent(assessmentId)}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getProgrammingLanguages() {
    const res = await fetch(`${API_BASE}/academic/programming-languages`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── INSTITUTION: INDUSTRY COLLABORATION / ACCESS REQUESTS ──
  async getInstitutionIndustryRequests() {
    const res = await fetch(`${API_BASE}/academic/industry-requests`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async sendIndustryAccessRequest({ companyId, studentIds, notes }) {
    const res = await fetch(`${API_BASE}/academic/industry-requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ companyId, studentIds, notes })
    });
    return await res.json();
  },

  // ── COMPANY: ACCESS REQUESTS ──
  async getCompanyAccessRequests() {
    const res = await fetch(`${API_BASE}/company/student-access-requests`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async respondToAccessRequest(requestId, action, notes = '') {
    const res = await fetch(`${API_BASE}/company/student-access-requests/${encodeURIComponent(requestId)}/respond`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ action, notes })
    });
    return await res.json();
  },

  // ── COMPANY: AUTHORIZED STUDENTS & TIMELINE ──
  async getAuthorizedStudents() {
    const res = await fetch(`${API_BASE}/company/authorized-students`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getAuthorizedStudentProfile(studentId) {
    const res = await fetch(`${API_BASE}/company/students/${encodeURIComponent(studentId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getStudentDevelopmentTimeline(studentId) {
    const res = await fetch(`${API_BASE}/company/students/${encodeURIComponent(studentId)}/development`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── STUDENT: INSTITUTION ASSESSMENTS ──
  async getStudentInstitutionAssessments() {
    const res = await fetch(`${API_BASE}/assessments/institution`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getInstitutionAssessmentDetails(assessmentId) {
    const res = await fetch(`${API_BASE}/assessments/institution/${encodeURIComponent(assessmentId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async submitInstitutionAssessmentAttempt(assessmentId, answers, timeSpentSeconds = 0) {
    const res = await fetch(`${API_BASE}/assessments/institution/${encodeURIComponent(assessmentId)}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ answers, timeSpentSeconds })
    });
    return await res.json();
  }
};
