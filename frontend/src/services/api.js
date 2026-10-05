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
  },

  // RPL (Recognition of Prior Learning)
  async getQualificationPacks() {
    const res = await fetch('/api/rpl/qualification-packs');
    return res.json();
  },

  async getQualificationPack(id) {
    const res = await fetch('/api/rpl/qualification-packs/' + encodeURIComponent(id));
    return res.json();
  },

  async analyzeExperience(declarationText, voiceTranscript, structuredFields) {
    const res = await fetch('/api/rpl/experience/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ declarationText, voiceTranscript, structuredFields })
    });
    return res.json();
  },

  async submitExperience(declarationData) {
    const res = await fetch('/api/rpl/experience', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(declarationData)
    });
    return res.json();
  },

  async getMyRplAssessment() {
    const res = await fetch('/api/rpl/my-assessment', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async startRplAssessment(qpId, declarationId) {
    const res = await fetch('/api/rpl/assessment/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ qpId, declarationId })
    });
    return res.json();
  },

  async getAssessorRplAssessments(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch('/api/rpl/assessor/assessments?' + params, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getRplAssessmentDetails(assessmentId) {
    const res = await fetch('/api/rpl/assessment/' + encodeURIComponent(assessmentId), {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async submitChecklistScore(assessmentId, data) {
    const res = await fetch('/api/rpl/assessment/' + encodeURIComponent(assessmentId) + '/checklist-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async submitRplDecision(assessmentId, decision, remarks) {
    const res = await fetch('/api/rpl/assessment/' + encodeURIComponent(assessmentId) + '/decision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ decision, remarks })
    });
    return res.json();
  },

  async getRplReport(assessmentId) {
    const res = await fetch('/api/rpl/assessment/' + encodeURIComponent(assessmentId) + '/report');
    return res.json();
  },

  async checkEvidenceQuality(evidenceItem, competencyCode) {
    const res = await fetch('/api/rpl/evidence/quality-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidenceItem, competencyCode })
    });
    return res.json();
  },

  async getAssessorConsistencyAnalytics() {
    const res = await fetch('/api/rpl/analytics/assessor-consistency');
    return res.json();
  },

  async createQualificationPack(qpData) {
    const res = await fetch('/api/rpl/qualification-packs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(qpData)
    });
    return res.json();
  },

  async scheduleRplAssessment(assessmentId, scheduleData) {
    const res = await fetch('/api/rpl/assessment/' + encodeURIComponent(assessmentId) + '/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(scheduleData)
    });
    return res.json();
  },

  async assignRplAssessor(assessmentId, assessorData) {
    const res = await fetch('/api/rpl/assessment/' + encodeURIComponent(assessmentId) + '/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(assessorData)
    });
    return res.json();
  },

  async syncOfflineData(offlineRecords, clientTimestamp) {
    const res = await fetch('/api/rpl/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ offlineRecords, clientTimestamp })
    });
    return res.json();
  }
};
