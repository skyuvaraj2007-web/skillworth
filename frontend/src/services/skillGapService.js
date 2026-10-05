/**
 * SKILL NEXUS AI — Skill Gap Analysis Frontend Service
 * Handles API calls for target roles, student skill profiles, gap analysis, and recommendations.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const skillGapService = {
  /**
   * Get all selectable target career roles and opportunities
   */
  async getTargetRoles() {
    const res = await fetch(`${API_BASE}/skill-gap/roles`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  /**
   * Get normalized student skills aggregated from all platform sources
   */
  async getStudentSkills() {
    const res = await fetch(`${API_BASE}/skill-gap/student-skills`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  /**
   * Run skill gap analysis for a chosen target
   */
  async analyzeSkillGap(targetType = 'CAREER_ROLE', targetId = null) {
    const res = await fetch(`${API_BASE}/skill-gap/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ targetType, targetId })
    });
    return await res.json();
  },

  /**
   * Get student's latest persisted skill gap report
   */
  async getLatestReport() {
    const res = await fetch(`${API_BASE}/skill-gap/reports/latest`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  /**
   * Get historical report by ID
   */
  async getReportById(reportId) {
    const res = await fetch(`${API_BASE}/skill-gap/reports/${encodeURIComponent(reportId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  /**
   * Get recommendations for student
   */
  async getRecommendations() {
    const res = await fetch(`${API_BASE}/skill-gap/recommendations`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  /**
   * Institutional cohort analytics (Faculty / College view)
   */
  async getCohortAnalytics() {
    const res = await fetch(`${API_BASE}/skill-gap/cohort-analytics`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  }
};
