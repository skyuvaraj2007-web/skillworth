const BASE_URL = '';

function getAuthHeader() {
  const token = localStorage.getItem('skillworth_token');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

export const api = {
  // Auth
  async register(userData) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  async login(email, password, role) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch('/api/auth/me', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getDemoUsers() {
    const res = await fetch('/api/auth/demo-users');
    return res.json();
  },

  // Skills
  async getSkills() {
    const res = await fetch('/api/skills');
    return res.json();
  },

  // Evidence & Video Upload
  async uploadEvidence(formData) {
    const res = await fetch('/api/evidence/upload', {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return res.json();
  },

  async getMyEvidence() {
    const res = await fetch('/api/evidence/my', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getAllEvidence() {
    const res = await fetch('/api/evidence/all', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Assessments
  async getAssessments() {
    const res = await fetch('/api/assessments');
    return res.json();
  },

  async getAssessment(id) {
    const res = await fetch('/api/assessments/' + encodeURIComponent(id));
    return res.json();
  },

  async submitAssessment(data) {
    const res = await fetch('/api/assessments/attempt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Assessor Review
  async getPendingReviews() {
    const res = await fetch('/api/assessor/pending', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async evaluateEvidence(evidenceId, decision, feedback) {
    const res = await fetch('/api/assessor/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ evidenceId, decision, feedback })
    });
    return res.json();
  },

  async getAssessorStatus() {
    const res = await fetch('/api/assessor/status', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Credentials
  async verifyCredential(credentialId) {
    const res = await fetch('/api/credentials/verify/' + encodeURIComponent(credentialId));
    return res.json();
  },

  async getMyCredentials() {
    const res = await fetch('/api/credentials/my', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  }
};
