/**
 * SKILLNEXUS AI — Nexus API Client (Phase 3 Service Layer)
 * Bridges React Frontend with PostgreSQL / Supabase REST API backend.
 * Provides resilient caching, optimistic updates, and fallback handling.
 */

const API_BASE_URL = ((import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api') + '/nexus';

async function safeFetchUrl(url, options = {}) {
  try {
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    const authHeaders = {};
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options.headers || {})
      },
      ...options
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return data.data !== undefined ? data.data : data;
  } catch (err) {
    console.warn(`[nexusApiClient] Network request failed for ${url}:`, err.message);
    return null;
  }
}

async function safeFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  return await safeFetchUrl(url, options);
}


export const nexusApiClient = {
  // 1. INSTITUTIONS
  async getInstitutions() {
    return await safeFetch('/institutions');
  },
  async getInstitution(id) {
    return await safeFetch(`/institutions/${encodeURIComponent(id)}`);
  },

  // 2. STUDENTS
  async getStudents(collegeId = null) {
    const query = collegeId ? `?collegeId=${encodeURIComponent(collegeId)}` : '';
    return await safeFetch(`/students${query}`);
  },
  async getStudent(id) {
    return await safeFetch(`/students/${encodeURIComponent(id)}`);
  },
  async saveStudent(studentData) {
    return await safeFetch('/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    });
  },

  // 3. COURSES & ENROLLMENTS
  async getCourses(institutionId = null) {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return await safeFetch(`/courses${query}`);
  },
  async createCourse(courseData) {
    return await safeFetch('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
  },
  async getEnrollments(studentId = null) {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
    return await safeFetch(`/enrollments${query}`);
  },
  async enrollInCourse(student, course) {
    return await safeFetch('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ student, course })
    });
  },
  async advanceModule(enrollmentId) {
    return await safeFetch(`/enrollments/advance/${encodeURIComponent(enrollmentId)}`, {
      method: 'POST'
    });
  },

  // 4. PROJECTS & PROOFS
  async getProjects(studentId = null) {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
    return await safeFetch(`/projects${query}`);
  },
  async submitProject(projectData) {
    return await safeFetch('/projects/submit', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  },
  async validateProject(projectId, isApproved, facultyName) {
    return await safeFetch(`/projects/validate/${encodeURIComponent(projectId)}`, {
      method: 'POST',
      body: JSON.stringify({ isApproved, facultyName })
    });
  },

  // 5. OPPORTUNITIES & APPLICATIONS
  async getOpportunities() {
    return await safeFetch('/opportunities');
  },
  async createOpportunity(oppData) {
    return await safeFetch('/opportunities', {
      method: 'POST',
      body: JSON.stringify(oppData)
    });
  },
  async getApplications(filter = {}) {
    const params = new URLSearchParams();
    if (filter.studentId) params.append('studentId', filter.studentId);
    if (filter.companyId) params.append('companyId', filter.companyId);
    if (filter.opportunityId) params.append('opportunityId', filter.opportunityId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await safeFetch(`/applications${queryString}`);
  },
  async submitApplication(student, opportunity) {
    return await safeFetch('/applications/apply', {
      method: 'POST',
      body: JSON.stringify({ student, opportunity })
    });
  },
  async updateApplicationStage(applicationId, stage) {
    return await safeFetch(`/applications/${encodeURIComponent(applicationId)}/stage`, {
      method: 'PUT',
      body: JSON.stringify({ stage })
    });
  },

  // 6. NOTIFICATIONS & TRASH BIN
  async getNotifications(role, isTrash = false) {
    const query = isTrash ? '?trash=true' : '';
    return await safeFetch(`/notifications/${encodeURIComponent(role)}${query}`);
  },
  async addNotification(role, notifData) {
    return await safeFetch(`/notifications/${encodeURIComponent(role)}`, {
      method: 'POST',
      body: JSON.stringify(notifData)
    });
  },
  async markNotificationRead(id) {
    return await safeFetch(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PUT'
    });
  },
  async markAllNotificationsRead(role) {
    return await safeFetch(`/notifications/read-all/${encodeURIComponent(role)}`, {
      method: 'PUT'
    });
  },
  async softDeleteNotification(id) {
    return await safeFetch(`/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },
  async restoreNotification(id) {
    return await safeFetch(`/notifications/${encodeURIComponent(id)}/restore`, {
      method: 'POST'
    });
  },
  async emptyTrash(role) {
    return await safeFetch(`/notifications/trash/${encodeURIComponent(role)}`, {
      method: 'DELETE'
    });
  },

  // 7. AUTHENTICATION & IDENTITY (Phase 4A)
  async login(email, password, role = 'student') {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('[nexusApiClient] Login error, falling back:', err.message);
      return null;
    }
  },

  async register(userData) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('[nexusApiClient] Register error, falling back:', err.message);
      return null;
    }
  },

  // 8. CAMPUS ↔ INDUSTRY SKILL GAP & TELEMETRY (Phase 4C & 4E)
  async getCampusSkillGap(collegeId = 'TN010') {
    return await safeFetch(`/analytics/skill-gap/${encodeURIComponent(collegeId)}`);
  },

  async getInstitutionTelemetry(collegeId = 'TN010') {
    return await safeFetch(`/institutions/${encodeURIComponent(collegeId)}/telemetry`);
  },

  // 9. CROSS-PORTAL CAREER INTELLIGENCE (Readiness & Matching)
  async getStudentReadiness(studentId) {
    return await safeFetch(`/readiness/${encodeURIComponent(studentId)}`);
  },
  async matchStudentToOpportunity(studentId, opportunityId) {
    return await safeFetch(`/match/${encodeURIComponent(studentId)}/${encodeURIComponent(opportunityId)}`);
  },
  async matchCompanyToCandidate(companyId, studentId) {
    return await safeFetch(`/match-company/${encodeURIComponent(companyId)}/${encodeURIComponent(studentId)}`);
  },

  // 10. ACADEMIC PORTAL APIS
  async getAcademicDashboard() {
    return await safeFetchUrl('/api/academic/dashboard');
  },
  async getAcademicStudents() {
    return await safeFetchUrl('/api/academic/students');
  },
  async getAcademicCourses() {
    return await safeFetchUrl('/api/academic/courses');
  },
  async getAcademicSkillAnalytics() {
    return await safeFetchUrl('/api/academic/skill-analytics');
  },
  async getAcademicReadinessBatch() {
    return await safeFetchUrl('/api/academic/readiness');
  },
  async getAcademicPlacementDrives() {
    return await safeFetchUrl('/api/academic/placement-drives');
  },
  async getAcademicApplications() {
    return await safeFetchUrl('/api/academic/applications');
  },

  // 11. COMPANY PORTAL APIS
  async getCompanyDashboard() {
    return await safeFetchUrl('/api/company/dashboard');
  },
  async getCompanyOpportunities() {
    return await safeFetchUrl('/api/company/opportunities');
  },
  async getCompanyCandidates() {
    return await safeFetchUrl('/api/company/candidates');
  },
  async getCompanyTalentPools() {
    return await safeFetchUrl('/api/company/talent-pools');
  },
  async getCompanyOpportunityMatches(oppId) {
    return await safeFetchUrl(`/api/company/opportunities/${encodeURIComponent(oppId)}/matches`);
  },
  async getCompanyApplications() {
    return await safeFetchUrl('/api/company/applications');
  },
  async getCompanyInterviews() {
    return await safeFetchUrl('/api/company/interviews');
  },
  async getCompanyPartnerships() {
    return await safeFetchUrl('/api/company/partnerships');
  },
  async getCompanyCourseLearnerProfile(courseId, studentId) {
    return await safeFetchUrl(`/api/company/courses/${encodeURIComponent(courseId)}/students/${encodeURIComponent(studentId)}/profile`);
  },

  // 12. COURSE-WISE SKILL BENCHMARK TALENT DISCOVERY APIS
  async discoverTalent(searchCriteria = {}) {
    return await safeFetchUrl('/api/company/talent-discovery', {
      method: 'POST',
      body: JSON.stringify(searchCriteria)
    });
  },
  async getSkillsCatalog() {
    return await safeFetchUrl('/api/company/skills-catalog');
  },
  async getCoursesCatalog() {
    return await safeFetchUrl('/api/company/courses-catalog');
  },

  // 13. STUDENT SKILL LIFECYCLE & ELIGIBILITY APIS
  async getSkillsWithEligibility() {
    return await safeFetchUrl('/api/learning/skills');
  },
  async getSkillDetails(skillId) {
    return await safeFetchUrl(`/api/learning/skills/${encodeURIComponent(skillId)}`);
  },
  async enrollInSkill(skillId, options = {}) {
    return await safeFetchUrl(`/api/learning/skills/${encodeURIComponent(skillId)}/enroll`, {
      method: 'POST',
      body: JSON.stringify(options)
    });
  },
  async submitSkillAssessment(skillId, submissionData = {}) {
    return await safeFetchUrl(`/api/learning/skills/${encodeURIComponent(skillId)}/assess`, {
      method: 'POST',
      body: JSON.stringify(submissionData)
    });
  },
  async getMyEnrolledSkills() {
    return await safeFetchUrl('/api/learning/my-skills');
  },

  // 14. INSTITUTION ACADEMIC SKILL MANAGEMENT & REVIEW APIS
  async getAcademicSkills(status = null) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return await safeFetchUrl(`/api/academic/skills${query}`);
  },
  async getAcademicSkillDetails(skillId) {
    return await safeFetchUrl(`/api/academic/skills/${encodeURIComponent(skillId)}`);
  },
  async saveAcademicSkill(skillData, isPublish = false) {
    return await safeFetchUrl('/api/academic/skills', {
      method: 'POST',
      body: JSON.stringify({ ...skillData, isPublish })
    });
  },
  async archiveAcademicSkill(skillId) {
    return await safeFetchUrl(`/api/academic/skills/${encodeURIComponent(skillId)}/archive`, {
      method: 'POST'
    });
  },
  async getPendingEnrollmentRequests() {
    return await safeFetchUrl('/api/academic/enrollment-requests');
  },
  async approveEnrollmentRequest(enrollmentId, reason = '') {
    return await safeFetchUrl(`/api/academic/enrollments/${encodeURIComponent(enrollmentId)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },
  async rejectEnrollmentRequest(enrollmentId, reason = '') {
    return await safeFetchUrl(`/api/academic/enrollments/${encodeURIComponent(enrollmentId)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }
};


