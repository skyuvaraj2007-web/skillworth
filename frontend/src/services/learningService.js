/**
 * SKILL NEXUS AI — Student Learning & Skill Lifecycle Service
 * Provides student-facing endpoints for:
 * - Skill discovery and eligibility breakdown
 * - Open enrollment & approval requests
 * - Progress tracking & proctored assessment submissions
 * - My Skills & credential retrieval
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

export const learningService = {
  // Discover skills with student eligibility status attached
  async getSkills() {
    const res = await fetch(`${API_BASE}/learning/skills`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // Get single skill details with eligibility breakdown
  async getSkill(skillId) {
    const res = await fetch(`${API_BASE}/learning/skills/${encodeURIComponent(skillId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // Enroll in skill (Open Enrollment or Request Approval)
  async enroll(skillId, options = {}) {
    const res = await fetch(`${API_BASE}/learning/skills/${encodeURIComponent(skillId)}/enroll`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(options)
    });
    return await res.json();
  },

  // Submit proctored assessment
  async submitAssessment(skillId, submissionData) {
    const res = await fetch(`${API_BASE}/learning/skills/${encodeURIComponent(skillId)}/assess`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(submissionData)
    });
    return await res.json();
  },

  // Get enrolled skills and certificates for active student
  async getMySkills() {
    const res = await fetch(`${API_BASE}/learning/my-skills`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── Self-Assessed Skills ──
  async getSelfAssessments() {
    const res = await fetch(`${API_BASE}/learning/self-assessments`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async saveSelfAssessment(data) {
    const isUpdate = Boolean(data.id);
    const url = isUpdate ? `${API_BASE}/learning/self-assessments/${encodeURIComponent(data.id)}` : `${API_BASE}/learning/self-assessments`;
    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteSelfAssessment(id) {
    const res = await fetch(`${API_BASE}/learning/self-assessments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── Learning Overview & Telemetry ──
  async getOverview() {
    const res = await fetch(`${API_BASE}/learning/overview`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── Quizzes & Tests ──
  async getQuizzes() {
    const res = await fetch(`${API_BASE}/learning/quizzes`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async submitQuiz(data) {
    const res = await fetch(`${API_BASE}/learning/quizzes/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // ── Projects ──
  async getProjects() {
    const res = await fetch(`${API_BASE}/learning/projects`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── Certifications ──
  async getCertifications() {
    const res = await fetch(`${API_BASE}/learning/certifications`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── Recent Activity ──
  async getActivity() {
    const res = await fetch(`${API_BASE}/learning/activity`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── Complete Learning Intelligence ──
  async getIntelligence() {
    const res = await fetch(`${API_BASE}/learning/intelligence`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── Courses with Real Progress & Academician Assignment ──
  async getMyCourses() {
    const res = await fetch(`${API_BASE}/learning/my-courses`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getCourseDetails(courseId) {
    const res = await fetch(`${API_BASE}/learning/my-courses/${encodeURIComponent(courseId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async completeLesson(courseId, lessonId, payload = {}) {
    const res = await fetch(`${API_BASE}/learning/my-courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  // ── Assigned Proctored Skill Tests ──
  async getAssignedSkillTests() {
    const res = await fetch(`${API_BASE}/learning/assigned-skill-tests`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  }
};
