/**
 * SKILL NEXUS — Industry Assessment Service
 * Frontend API client for Feature 3: Industry Assessment Builder & Student Test Runner
 */

const getApiBase = () => {
  return (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
};

const getHeaders = () => {
  const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const industryAssessmentService = {
  // ── Company / Industry Endpoints ─────────────────────────

  /**
   * Fetch company's assessments list
   */
  async getCompanyAssessments() {
    const res = await fetch(`${getApiBase()}/company/assessments`, {
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch company assessments');
    return json.data || [];
  },

  /**
   * Fetch Question Bank questions with optional filters
   */
  async getQuestionBank(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.skill) params.append('skill', filters.skill);
    if (filters.questionType) params.append('questionType', filters.questionType);
    if (filters.search) params.append('q', filters.search);

    const res = await fetch(`${getApiBase()}/company/question-bank?${params.toString()}`, {
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to load question bank');
    return json.data || [];
  },

  /**
   * Save a single question into the company's reusable Question Bank
   */
  async saveToQuestionBank(questionData) {
    const res = await fetch(`${getApiBase()}/company/question-bank`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(questionData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to save question to bank');
    return json.data;
  },

  /**
   * Fetch metadata for Candidate Targeting (Colleges, Departments, Students, Opportunities)
   */
  async getCandidateTargets() {
    const res = await fetch(`${getApiBase()}/company/candidate-targets`, {
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to load candidate target options');
    return json.data || { colleges: [], departments: [], students: [], opportunities: [] };
  },

  /**
   * Create an assessment via the 6-Step Assessment Builder
   */
  async createAssessmentFromBuilder(payload) {
    const res = await fetch(`${getApiBase()}/company/assessments/builder`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create assessment');
    return json;
  },

  /**
   * Fetch ranked candidate results for an assessment
   */
  async getAssessmentResults(assessmentId) {
    const res = await fetch(`${getApiBase()}/company/assessments/${assessmentId}/results`, {
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch assessment results');
    return json.data || { assessment: {}, summary: {}, candidates: [] };
  },

  /**
   * Shortlist a candidate directly from assessment results
   */
  async shortlistCandidate(assessmentId, studentId, opportunityId) {
    const res = await fetch(`${getApiBase()}/company/assessments/${assessmentId}/shortlist-candidate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ studentId, opportunityId })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to shortlist candidate');
    return json;
  },

  /**
   * Generate questions using NEXUS AI
   */
  async generateAiDrafts(params) {
    const res = await fetch(`${getApiBase()}/company/assessments/ai-drafts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to generate AI questions');
    return json.data || [];
  },

  // ── Student Endpoints ─────────────────────────────────────

  /**
   * Fetch all assessments assigned to the logged-in student
   */
  async getMyAssessments() {
    const res = await fetch(`${getApiBase()}/assessments/my-assessments`, {
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to load your assessments');
    return json.data || [];
  },

  /**
   * Retrieve sanitized assessment questions for a student to attempt
   * Guaranteed: NO correct answers or hidden test cases in response!
   */
  async getSanitizedAssessment(assessmentId) {
    const res = await fetch(`${getApiBase()}/assessments/take/${assessmentId}`, {
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to start assessment');
    return json.data;
  },

  /**
   * Submit student answers for 100% server-side automatic evaluation
   */
  async submitAssessmentAttempt(assessmentId, answers) {
    const res = await fetch(`${getApiBase()}/assessments/submit/${assessmentId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ answers })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Submission evaluation failed');
    return json.data;
  },

  /**
   * Fetch student's submitted assessment result with skill-wise performance
   */
  async getStudentAssessmentResult(assessmentId) {
    const res = await fetch(`${getApiBase()}/assessments/result/${assessmentId}`, {
      headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to load assessment result');
    return json.data;
  }
};

export default industryAssessmentService;
