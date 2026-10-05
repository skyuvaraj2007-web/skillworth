/**
 * SKILL NEXUS AI — Academic & Institutional Roster API Service
 * Handles Institution Onboarding Setup, Department Configuration,
 * CSV Template Download, Tabular Previews, Transactional Imports,
 * Manual Student Additions, and Account Lifecycle Management.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const academicService = {
  // ── ONBOARDING SETUP ──
  async getSetupStatus() {
    const res = await fetch(`${API_BASE}/academic/setup/status`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async updateInstitutionSetup(setupData) {
    const res = await fetch(`${API_BASE}/academic/setup/institution`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(setupData)
    });
    return await res.json();
  },

  // ── DEPARTMENTS ──
  async getDepartments() {
    const res = await fetch(`${API_BASE}/academic/departments`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async createDepartment(code, name) {
    const res = await fetch(`${API_BASE}/academic/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ code, name })
    });
    return await res.json();
  },

  // ── CSV TEMPLATE & PREVIEW ──
  async downloadTemplate() {
    const res = await fetch(`${API_BASE}/academic/template/download`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to download template');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SkillNexus_Student_Roster_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async previewRoster(csvContent, fileName = 'roster.csv') {
    const res = await fetch(`${API_BASE}/academic/roster/preview`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ csvContent, fileName })
    });
    return await res.json();
  },

  async confirmRosterImport(validRows, fileName = 'roster.csv') {
    const res = await fetch(`${API_BASE}/academic/roster/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ validRows, fileName })
    });
    return await res.json();
  },

  // ── MANUAL STUDENT CREATION ──
  async createManualStudent(studentData) {
    const res = await fetch(`${API_BASE}/academic/students/manual`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(studentData)
    });
    return await res.json();
  },

  // ── LIFECYCLE & INVITATIONS ──
  async resendStudentInvite(studentId) {
    const res = await fetch(`${API_BASE}/academic/students/${encodeURIComponent(studentId)}/resend-invite`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async updateStudentStatus(studentId, status) {
    const res = await fetch(`${API_BASE}/academic/students/${encodeURIComponent(studentId)}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    return await res.json();
  },

  async getRosterImports() {
    const res = await fetch(`${API_BASE}/academic/roster/imports`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── STUDENT ROSTER & DASHBOARD METRICS ──
  async getStudents() {
    const res = await fetch(`${API_BASE}/academic/students`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getStudentById(id) {
    const res = await fetch(`${API_BASE}/academic/students/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getDashboard() {
    const res = await fetch(`${API_BASE}/academic/dashboard`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getAnalytics() {
    const res = await fetch(`${API_BASE}/academic/analytics`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getReadiness() {
    const res = await fetch(`${API_BASE}/academic/readiness`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getSkillAnalytics() {
    const res = await fetch(`${API_BASE}/academic/skill-analytics`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── COMPANY ACCESS REQUESTS & SHARING ──
  async getIndustryRequests() {
    const res = await fetch(`${API_BASE}/academic/industry-requests`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async requestCompanyAccess(companyData) {
    const res = await fetch(`${API_BASE}/academic/industry-requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(companyData)
    });
    return await res.json();
  },

  async revokeCompanyAccess(requestId) {
    const res = await fetch(`${API_BASE}/academic/industry-requests/${encodeURIComponent(requestId)}/revoke`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── PUBLIC STUDENT ACTIVATION ──
  async verifyInvitation(token) {
    const res = await fetch(`${API_BASE}/auth/invitation/${encodeURIComponent(token)}`);
    return await res.json();
  },

  async activateAccount(token, password) {
    const res = await fetch(`${API_BASE}/auth/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token, password })
    });
    return await res.json();
  },

  // ── COURSE CERTIFICATES VERIFICATION ──
  async getCourseCertificates() {
    const res = await fetch(`${API_BASE}/academic/course-certificates`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async verifyCourseCertificate(id, notes) {
    const res = await fetch(`${API_BASE}/academic/course-certificates/${encodeURIComponent(id)}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ notes })
    });
    return await res.json();
  },

  async rejectCourseCertificate(id, notes) {
    const res = await fetch(`${API_BASE}/academic/course-certificates/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ notes })
    });
    return await res.json();
  },

  // ── INSTITUTION SKILLS & COURSES ──
  async getSkills(filterStatus = '') {
    const url = filterStatus 
      ? `${API_BASE}/academic/skills?status=${encodeURIComponent(filterStatus)}`
      : `${API_BASE}/academic/skills`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getSkill(skillId) {
    const res = await fetch(`${API_BASE}/academic/skills/${encodeURIComponent(skillId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async saveSkill(skillData, isPublish = false) {
    const res = await fetch(`${API_BASE}/academic/skills`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ ...skillData, isPublish })
    });
    return await res.json();
  },

  async archiveSkill(skillId) {
    const res = await fetch(`${API_BASE}/academic/skills/${encodeURIComponent(skillId)}/archive`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── ENROLLMENT REQUESTS APPROVAL ──
  async getPendingEnrollmentRequests() {
    const res = await fetch(`${API_BASE}/academic/enrollment-requests`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async approveEnrollment(enrollmentId, reason = '') {
    const res = await fetch(`${API_BASE}/academic/enrollments/${encodeURIComponent(enrollmentId)}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ reason })
    });
    return await res.json();
  },

  async rejectEnrollment(enrollmentId, reason = '') {
    const res = await fetch(`${API_BASE}/academic/enrollments/${encodeURIComponent(enrollmentId)}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ reason })
    });
    return await res.json();
  },

  // ── INSTITUTION CERTIFICATE VERIFICATION PIPELINE ──
  async getInstitutionCertificates(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.student) query.append('student', params.student);
    if (params.skill) query.append('skill', params.skill);
    if (params.category) query.append('category', params.category);
    if (params.issuer) query.append('issuer', params.issuer);
    if (params.fileType) query.append('fileType', params.fileType);
    if (params.search) query.append('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/academic/certificates${qs}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getInstitutionCertificateAnalytics() {
    const res = await fetch(`${API_BASE}/academic/certificates/analytics`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getInstitutionCertificateById(certificateId) {
    const res = await fetch(`${API_BASE}/academic/certificates/${encodeURIComponent(certificateId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async verifyCertificate(certificateId, notes = '') {
    const res = await fetch(`${API_BASE}/academic/certificates/${encodeURIComponent(certificateId)}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ notes })
    });
    return await res.json();
  },

  async rejectCertificate(certificateId, reason) {
    const res = await fetch(`${API_BASE}/academic/certificates/${encodeURIComponent(certificateId)}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ reason })
    });
    return await res.json();
  },

  async requestCertificateCorrection(certificateId, reason) {
    const res = await fetch(`${API_BASE}/academic/certificates/${encodeURIComponent(certificateId)}/request-correction`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ reason })
    });
    return await res.json();
  },

  async reviewCertificate(certificateId) {
    const res = await fetch(`${API_BASE}/academic/certificates/${encodeURIComponent(certificateId)}/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getInstitutionSkillGaps() {
    const res = await fetch(`${API_BASE}/academic/skill-gaps`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── APPLICATIONS & STUDENT SELECTION ──
  async getApplications() {
    const res = await fetch(`${API_BASE}/academic/applications`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async selectStudentForTest(applicationId) {
    const res = await fetch(`${API_BASE}/academic/applications/${encodeURIComponent(applicationId)}/select`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── COLLABORATIONS & CAMPUS DIRECTORY ──
  async getCollaborations() {
    const res = await fetch(`${API_BASE}/academic/collaborations`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async requestCollaboration(targetInstitutionId, message = '') {
    const res = await fetch(`${API_BASE}/academic/collaborations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ targetInstitutionId, message })
    });
    return await res.json();
  },

  async respondToCollaboration(id, action) {
    const res = await fetch(`${API_BASE}/academic/collaborations/${encodeURIComponent(id)}/respond`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ action })
    });
    return await res.json();
  },

  // ── PARTNER COMPANIES & OPPORTUNITIES ──
  async getCompanies() {
    const res = await fetch(`${API_BASE}/academic/companies`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getOpportunities() {
    const res = await fetch(`${API_BASE}/academic/opportunities`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getProjects(params = {}) {
    const query = new URLSearchParams(params).toString();
    const qs = query ? `?${query}` : '';
    const res = await fetch(`${API_BASE}/academic/projects${qs}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  // ── COURSES & LEARNING ──
  async getCourses() {
    const res = await fetch(`${API_BASE}/academic/courses`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getCourseById(courseId) {
    const res = await fetch(`${API_BASE}/academic/courses/${encodeURIComponent(courseId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async createCourse(courseData) {
    const res = await fetch(`${API_BASE}/academic/courses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(courseData)
    });
    return await res.json();
  },

  // ── OPPORTUNITIES & PLACEMENT PIPELINE ──
  async getApplications() {
    const res = await fetch(`${API_BASE}/academic/applications`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async updateApplicationStage(applicationId, stage) {
    const res = await fetch(`${API_BASE}/academic/applications/${encodeURIComponent(applicationId)}/stage`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ stage })
    });
    return await res.json();
  },

  async selectApplicationForTesting(appId) {
    const res = await fetch(`${API_BASE}/academic/applications/${encodeURIComponent(appId)}/select`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async selectStudentForTest(appId) {
    return this.selectApplicationForTesting(appId);
  },

  // ── COLLABORATIONS & CAMPUS DIRECTORY ──
  async getCollaborations() {
    const res = await fetch(`${API_BASE}/academic/collaborations`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async requestCollaboration(targetInstitutionId, message) {
    const res = await fetch(`${API_BASE}/academic/collaborations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ targetInstitutionId, message })
    });
    return await res.json();
  },

  async respondToCollaboration(id, action, type = 'institution') {
    const res = await fetch(`${API_BASE}/academic/collaborations/${encodeURIComponent(id)}/respond`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ action, type })
    });
    return await res.json();
  },

  async getCombinedAnalytics() {
    const res = await fetch(`${API_BASE}/academic/analytics`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getSkillGrowthAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/skill-growth${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  },

  async getStudentPerformanceList(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/student-performance${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await res.json();
  }
};

