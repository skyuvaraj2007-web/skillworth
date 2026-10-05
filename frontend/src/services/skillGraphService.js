/**
 * SKILL NEXUS AI — Skill Graph 2.0 Frontend Client Service
 */

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token'))
    : null;

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const skillGraphService = {
  getAuthHeaders,

  /**
   * Fetch authenticated student's full Skill Graph 2.0
   */
  async getMySkillGraph() {
    try {
      const res = await fetch(`${API_BASE}/api/skill-graph/me`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      console.warn('[skillGraphService] getMySkillGraph error:', err);
      return { success: false, message: err.message, nodes: [], edges: [], metrics: {} };
    }
  },

  /**
   * Re-sync student's skill graph from latest database evidence
   */
  async syncSkillGraph() {
    try {
      const res = await fetch(`${API_BASE}/api/skill-graph/sync`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      console.warn('[skillGraphService] syncSkillGraph error:', err);
      return { success: false, message: err.message };
    }
  },

  /**
   * Fetch specific student's skill graph (role-scoped for institution/company)
   */
  async getStudentSkillGraph(studentId) {
    try {
      const res = await fetch(`${API_BASE}/api/skill-graph/student/${studentId}`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      console.warn('[skillGraphService] getStudentSkillGraph error:', err);
      return { success: false, message: err.message, nodes: [], edges: [], metrics: {} };
    }
  }
};
