/**
 * SKILL NEXUS AI — Career Readiness & Skill Credibility Service (Phase 2)
 */

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');

const getAuthHeaders = () => {
  const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const getCareerReadinessMe = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/career-readiness/me`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  } catch (err) {
    console.warn('[careerReadinessService] getCareerReadinessMe error:', err);
    return { success: false, message: err.message };
  }
};

export const getCareerReadinessHistory = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/career-readiness/history`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  } catch (err) {
    console.warn('[careerReadinessService] getCareerReadinessHistory error:', err);
    return { success: false, message: err.message, data: [] };
  }
};

export const recalculateCareerReadiness = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/career-readiness/recalculate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  } catch (err) {
    console.warn('[careerReadinessService] recalculate error:', err);
    return { success: false, message: err.message };
  }
};

export const getSkillCredibilityMe = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/skill-credibility/me`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  } catch (err) {
    console.warn('[careerReadinessService] getSkillCredibilityMe error:', err);
    return { success: false, message: err.message, data: [] };
  }
};

export const getSkillCredibilityDetail = async (skillId) => {
  try {
    const res = await fetch(`${API_BASE}/api/skill-credibility/${skillId}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  } catch (err) {
    console.warn('[careerReadinessService] getSkillCredibilityDetail error:', err);
    return { success: false, message: err.message };
  }
};

export const recalculateSkillCredibility = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/skill-credibility/recalculate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  } catch (err) {
    console.warn('[careerReadinessService] recalculateSkillCredibility error:', err);
    return { success: false, message: err.message };
  }
};

export const careerReadinessService = {
  getMyReadiness: getCareerReadinessMe,
  getCareerReadinessMe,
  getMyReadinessHistory: getCareerReadinessHistory,
  getCareerReadinessHistory,
  recalculate: recalculateCareerReadiness,
  recalculateCareerReadiness,
  getSkillCredibilityMe,
  getSkillCredibilityDetail,
  recalculateSkillCredibility
};

export default careerReadinessService;
