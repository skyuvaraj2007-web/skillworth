/**
 * SKILL NEXUS — Frontend College Skill Intelligence API Client
 */

const getAuthHeaders = () => {
  const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const collegeIntelligenceService = {
  /**
   * Fetch executive dashboard KPIs, top/weak/missing skills, and actionable insights
   */
  async getDashboard() {
    try {
      const res = await fetch('/api/academic/intelligence/dashboard', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load dashboard KPIs');
      return data.data;
    } catch (err) {
      console.warn('[collegeIntelligenceService] getDashboard fallback note:', err.message);
      throw err;
    }
  },

  /**
   * Fetch filterable skill analytics (department-wise, year-wise, course completion, assessment performance, opportunity participation)
   */
  async getSkillAnalytics(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.department && filters.department !== 'ALL') params.append('department', filters.department);
      if (filters.academicYear && filters.academicYear !== 'ALL') params.append('academicYear', filters.academicYear);
      if (filters.batch && filters.batch !== 'ALL') params.append('batch', filters.batch);
      if (filters.skill && filters.skill !== 'ALL') params.append('skill', filters.skill);
      if (filters.assessment && filters.assessment !== 'ALL') params.append('assessment', filters.assessment);
      if (filters.course && filters.course !== 'ALL') params.append('course', filters.course);

      const qs = params.toString();
      const url = `/api/academic/intelligence/skill-analytics${qs ? `?${qs}` : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load skill analytics');
      return data.data;
    } catch (err) {
      console.warn('[collegeIntelligenceService] getSkillAnalytics fallback note:', err.message);
      throw err;
    }
  },

  /**
   * Fetch ranked skill gap analysis against corporate benchmarks
   */
  async getSkillGap(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.department && filters.department !== 'ALL') params.append('department', filters.department);
      const qs = params.toString();
      const url = `/api/academic/intelligence/skill-gap${qs ? `?${qs}` : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load skill gap diagnostics');
      return data.data;
    } catch (err) {
      console.warn('[collegeIntelligenceService] getSkillGap fallback note:', err.message);
      throw err;
    }
  },

  /**
   * Provision a targeted campus training initiative
   */
  async createTrainingInitiative(initiativeData) {
    const res = await fetch('/api/academic/intelligence/training-initiative', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(initiativeData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create training initiative');
    return data;
  }
};

export default collegeIntelligenceService;
