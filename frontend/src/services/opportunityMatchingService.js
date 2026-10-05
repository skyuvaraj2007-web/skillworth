/**
 * SKILL NEXUS — Opportunity Matching Frontend Service
 * 
 * Implements API integration for FEATURE 2: INDUSTRY <-> STUDENT SKILL MATCHING:
 * - Opportunity Creation with weighted required skills & preferred skills
 * - Recommended Candidates retrieval with multi-criteria filtering
 * - Real-time candidate shortlisting and unshortlisting
 * - Personalized "Opportunities For You" for Student Dashboard
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function createOpportunity(oppData) {
  const res = await fetch(`${API_BASE}/company/opportunities`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(oppData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create opportunity');
  return data;
}

export async function getRecommendedCandidates(opportunityId, filters = {}) {
  const query = new URLSearchParams();
  if (filters.minMatchScore) query.append('minMatchScore', filters.minMatchScore);
  if (filters.college && filters.college !== 'ALL') query.append('college', filters.college);
  if (filters.department && filters.department !== 'ALL') query.append('department', filters.department);
  if (filters.skills) query.append('skills', filters.skills);
  if (filters.graduationYear && filters.graduationYear !== 'ALL') query.append('graduationYear', filters.graduationYear);
  if (filters.shortlistedOnly) query.append('shortlistedOnly', 'true');

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/company/opportunities/${opportunityId}/recommended-candidates${queryString}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch recommended candidates');
  return data;
}

export async function calculateOpportunityMatches(opportunityId, body = {}) {
  const res = await fetch(`${API_BASE}/company/opportunities/${opportunityId}/calculate-matches`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to calculate matches');
  return data;
}

export async function shortlistCandidate(opportunityId, studentId) {
  const res = await fetch(`${API_BASE}/company/opportunities/${opportunityId}/shortlist`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ studentId, isShortlisted: true })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to shortlist candidate');
  return data;
}

export async function removeCandidateShortlist(opportunityId, studentId) {
  const res = await fetch(`${API_BASE}/company/opportunities/${opportunityId}/shortlist/${studentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to remove candidate from shortlist');
  return data;
}

export async function getStudentRecommendedOpportunities() {
  const res = await fetch(`${API_BASE}/opportunities/for-you`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch recommended opportunities');
  return data;
}

export default {
  createOpportunity,
  getRecommendedCandidates,
  calculateOpportunityMatches,
  shortlistCandidate,
  removeCandidateShortlist,
  getStudentRecommendedOpportunities
};
