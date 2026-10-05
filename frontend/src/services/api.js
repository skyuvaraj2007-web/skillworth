const BASE_URL = '';

function getAuthHeader() {
  const token = localStorage.getItem('skillworth_token');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

export const api = {
  // Auth
  async register(userData) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Connection error during registration: ' + err.message };
    }
  },

  async login(email, password, role) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Connection error during login: ' + err.message };
    }
  },

  async getMe() {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { ...getAuthHeader() }
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Session validation error: ' + err.message };
    }
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
  },

  // Phase 3: Dynamic Competency Evidence Matrix & Worker Skill Passport
  async getAssessmentMatrix(assessmentId) {
    const res = await fetch('/api/rpl/assessment/' + encodeURIComponent(assessmentId) + '/matrix', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async updateMatrixCompetency(assessmentId, competencyId, data) {
    const res = await fetch('/api/rpl/assessment/' + encodeURIComponent(assessmentId) + '/matrix/' + encodeURIComponent(competencyId), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getEvidenceCoverage(assessmentId) {
    const res = await fetch('/api/rpl/assessment/' + encodeURIComponent(assessmentId) + '/evidence-coverage', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async linkEvidenceToCompetency(assessmentId, data) {
    const res = await fetch('/api/rpl/assessment/' + encodeURIComponent(assessmentId) + '/evidence-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async requestEvidence(assessmentId, data) {
    const res = await fetch('/api/rpl/assessment/' + encodeURIComponent(assessmentId) + '/evidence-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getEvidenceRequests(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch('/api/rpl/evidence-requests?' + params, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async respondToEvidenceRequest(requestId, evidenceData) {
    const res = await fetch('/api/rpl/evidence-requests/' + encodeURIComponent(requestId) + '/respond', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(evidenceData)
    });
    return res.json();
  },

  async getSkillGaps(assessmentId) {
    const res = await fetch('/api/rpl/assessment/' + encodeURIComponent(assessmentId) + '/skill-gaps', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getWorkerSkillPassport(workerId = null) {
    const url = workerId ? `/api/rpl/worker/passport/${encodeURIComponent(workerId)}` : '/api/rpl/worker/passport';
    const res = await fetch(url, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async setPassportVisibility(isPublic) {
    const res = await fetch('/api/rpl/worker/passport/visibility', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ isPublic })
    });
    return res.json();
  },

  async verifyAssessmentRecord(recordId) {
    const res = await fetch('/api/rpl/verify/' + encodeURIComponent(recordId));
    return res.json();
  },

  // ================= Phase 4: Operations & Assessment Management =================

  async createRplApplication(data) {
    const res = await fetch('/api/rpl/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getMyRplApplications() {
    const res = await fetch('/api/rpl/applications/my', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getRplApplication(id) {
    const res = await fetch('/api/rpl/applications/' + encodeURIComponent(id), {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getAllRplApplications(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch('/api/rpl/applications?' + params, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async updateRplApplicationStatus(id, data) {
    const res = await fetch('/api/rpl/applications/' + encodeURIComponent(id) + '/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async assignRplAssessor(id, data) {
    const res = await fetch('/api/rpl/applications/' + encodeURIComponent(id) + '/assign-assessor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async scheduleRplAssessment(id, data) {
    const res = await fetch('/api/rpl/applications/' + encodeURIComponent(id) + '/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async rescheduleRplAssessment(id, data) {
    const res = await fetch('/api/rpl/applications/' + encodeURIComponent(id) + '/reschedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async cancelRplAssessment(id, data) {
    const res = await fetch('/api/rpl/applications/' + encodeURIComponent(id) + '/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getAssessorWorkQueue() {
    const res = await fetch('/api/rpl/assessor/work-queue', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getInstitutionRplOverview() {
    const res = await fetch('/api/rpl/institution/overview', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getAssessmentCentres(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch('/api/rpl/assessment-centres?' + params, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async createAssessmentCentre(data) {
    const res = await fetch('/api/rpl/assessment-centres', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getNotifications() {
    const res = await fetch('/api/notifications', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await fetch('/api/notifications/' + encodeURIComponent(id) + '/read', {
      method: 'PATCH',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async markAllNotificationsRead() {
    const res = await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Phase 5: AI Intelligence methods
  async aiProviderInfo() {
    const res = await fetch('/api/rpl/ai/provider-info', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async aiExtractExperience(text) {
    const res = await fetch('/api/rpl/ai/experience/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ text })
    });
    return res.json();
  },

  async aiMatchQPs(extractedData) {
    const res = await fetch('/api/rpl/ai/experience/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ extractedData })
    });
    return res.json();
  },

  async aiAnalyzeAndMatch(text) {
    const res = await fetch('/api/rpl/ai/experience/analyze-and-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ text })
    });
    return res.json();
  },

  async aiAnalyzeEvidence(evidenceItem, competencyCode, qpId) {
    const res = await fetch('/api/rpl/ai/evidence/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ evidenceItem, competencyCode, qpId })
    });
    return res.json();
  },

  async aiAnalyzeEvidenceSet(evidenceList, competencyCode, qpId) {
    const res = await fetch('/api/rpl/ai/evidence/analyze-set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ evidenceList, competencyCode, qpId })
    });
    return res.json();
  },

  async aiSkillGap(applicationId) {
    const res = await fetch('/api/rpl/ai/skill-gap/' + encodeURIComponent(applicationId), {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async aiAssessorAdvisory(data) {
    const res = await fetch('/api/rpl/ai/assessor-advisory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async aiConsistencyAnalytics() {
    const res = await fetch('/api/rpl/ai/consistency-analytics', {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  }
};


