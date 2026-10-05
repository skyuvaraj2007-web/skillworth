/**
 * SKILL NEXUS AI — Certificate & Credential Evidence API Service
 * Handles Student Certificate Submissions, Document Viewing/Streaming,
 * Institutional Routing, and AI Skill Gap Intelligence.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const certificateService = {
  // ── STUDENT CERTIFICATE WORKFLOW ──

  async getMyCertificates() {
    const res = await fetch(`${API_BASE}/certificates/my`, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return await res.json();
  },

  async getCertificateById(certificateId) {
    const res = await fetch(`${API_BASE}/certificates/${encodeURIComponent(certificateId)}`, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return await res.json();
  },

  async uploadCertificate(payload) {
    // If payload is FormData
    const isFormData = payload instanceof FormData;
    const headers = getAuthHeaders();
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}/certificates`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: isFormData ? payload : JSON.stringify(payload)
    });
    return await res.json();
  },

  async updateCertificate(certificateId, payload) {
    const res = await fetch(`${API_BASE}/certificates/${encodeURIComponent(certificateId)}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async deleteCertificate(certificateId) {
    const res = await fetch(`${API_BASE}/certificates/${encodeURIComponent(certificateId)}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return await res.json();
  },

  async sendToInstitution(certificateId) {
    const res = await fetch(`${API_BASE}/certificates/${encodeURIComponent(certificateId)}/send-to-institution`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return await res.json();
  },

  async suggestSkillsForCertificate(payload) {
    const res = await fetch(`${API_BASE}/certificates/ai/suggest-skills`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getSkillGapIntelligence() {
    const res = await fetch(`${API_BASE}/learning/skill-gap`, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return await res.json();
  },

  getStreamUrl(certificateId) {
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    return `${API_BASE}/certificates/${encodeURIComponent(certificateId)}/stream?token=${encodeURIComponent(token || '')}`;
  },

  getDownloadUrl(certificateId) {
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    return `${API_BASE}/certificates/${encodeURIComponent(certificateId)}/download?token=${encodeURIComponent(token || '')}`;
  },

  async fetchStreamBlob(certificateId) {
    const res = await fetch(`${API_BASE}/certificates/${encodeURIComponent(certificateId)}/stream`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to stream certificate document');
    const blob = await res.blob();
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    return { blob, contentType };
  }
};
