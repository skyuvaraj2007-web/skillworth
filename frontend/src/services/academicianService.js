/**
 * SKILLNEXUS AI — Academician API Service
 * Handles client-side API requests for the Academician/Faculty Module.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
const ACADEMICIAN_BASE = `${API_BASE}/api/academician`;
const LEARNING_BASE = `${API_BASE}/api/learning`;

async function request(endpoint, options = {}, base = ACADEMICIAN_BASE) {
  const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${base}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export const academicianService = {
  // 1. Dashboard
  async getDashboard() { return await request('/dashboard'); },

  // 2. Students
  async getStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await request(`/students${query ? `?${query}` : ''}`);
  },
  async getStudent(studentId) { return await request(`/students/${encodeURIComponent(studentId)}`); },
  async addStudentRemark(studentId, remarkData) {
    return await request(`/students/${encodeURIComponent(studentId)}/remarks`, {
      method: 'POST', body: JSON.stringify(remarkData)
    });
  },

  // 3. Courses — CRUD
  async getCourses() { return await request('/courses'); },
  async createCourse(courseData) {
    return await request('/courses', { method: 'POST', body: JSON.stringify(courseData) });
  },
  async updateCourse(courseId, courseData) {
    return await request(`/courses/${encodeURIComponent(courseId)}`, {
      method: 'PUT', body: JSON.stringify(courseData)
    });
  },
  async deleteCourse(courseId) {
    return await request(`/courses/${encodeURIComponent(courseId)}`, { method: 'DELETE' });
  },

  // 3b. Soft-delete Course (to trash)
  async softDeleteCourse(courseId) {
    return await request(`/courses/${encodeURIComponent(courseId)}/soft`, { method: 'DELETE' });
  },

  // 3c. Assign Course to mapped students
  async assignCourseToStudents(courseId, assignData) {
    return await request(`/courses/${encodeURIComponent(courseId)}/assign`, {
      method: 'POST', body: JSON.stringify(assignData)
    });
  },

  // 3d. Courses with assignment statistics
  async getAssignedCourses() { return await request('/courses/assigned'); },

  // 3e. Course progress detail (per-student for a specific course)
  async getCourseProgress(courseId) {
    return await request(`/courses/${encodeURIComponent(courseId)}/progress`);
  },

  // 3f. Overall progress summary across all students
  async getOverallProgress() { return await request('/overall-progress'); },

  // 4. Assessments — CRUD
  async getAssessments() { return await request('/assessments'); },
  async createAssessment(assessmentData) {
    return await request('/assessments', { method: 'POST', body: JSON.stringify(assessmentData) });
  },
  async updateAssessment(assessmentId, assessmentData) {
    return await request(`/assessments/${encodeURIComponent(assessmentId)}`, {
      method: 'PUT', body: JSON.stringify(assessmentData)
    });
  },
  async deleteAssessment(assessmentId) {
    return await request(`/assessments/${encodeURIComponent(assessmentId)}`, { method: 'DELETE' });
  },

  // 4b. Soft-delete Assessment (to trash)
  async softDeleteAssessment(assessmentId) {
    return await request(`/assessments/${encodeURIComponent(assessmentId)}/soft`, { method: 'DELETE' });
  },

  async getAssessmentResults(assessmentId) {
    return await request(`/assessments/${encodeURIComponent(assessmentId)}/results`);
  },

  // 5. Skill Gaps & Remediation
  async getSkillGaps() { return await request('/skill-gaps'); },
  async assignCourse(assignmentData) {
    return await request('/assign-course', { method: 'POST', body: JSON.stringify(assignmentData) });
  },

  // 6. Industry Requirements
  async getIndustryRequirements() { return await request('/industry-requirements'); },

  // 7. Recommendations
  async getRecommendations() { return await request('/recommendations'); },

  // 8. Mentorship
  async getMentorship() { return await request('/mentorship'); },
  async addMentee(data) {
    return await request('/mentorship', { method: 'POST', body: JSON.stringify(data) });
  },
  async scheduleSession(sessionData) {
    return await request('/mentorship/sessions', { method: 'POST', body: JSON.stringify(sessionData) });
  },

  // 9. Industry Opportunities & Candidate Matching
  async getOpportunities() { return await request('/opportunities'); },

  // 10. Analytics & Skill Intelligence
  async getAnalytics() { return await request('/analytics'); },
  async getSkillAnalytics() { return await request('/skill-analytics'); },
  async getStudentsNeedingAttention() { return await request('/students-needing-attention'); },
  async getStudentPerformance(studentId) {
    return await request(`/students/${encodeURIComponent(studentId)}/performance`);
  },
  async getStudentsPerformanceList(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await request(`/student-performance${query ? `?${query}` : ''}`);
  },
  async getSkillAssessment(assessmentId) {
    return await request(`/skill-assessments/${encodeURIComponent(assessmentId)}`);
  },

  // 11. Notifications
  async getNotifications() { return await request('/notifications'); },

  // 12. My Classes (authorized classes for this academician)
  async getMyClasses() { return await request('/my-classes'); },

  // 13. Trash / Soft-Delete Management
  async getTrash() { return await request('/trash'); },
  async restoreItem(id, itemType) {
    return await request('/trash/restore', { method: 'POST', body: JSON.stringify({ id, itemType }) });
  },
  async permanentDeleteItem(id, itemType) {
    return await request('/trash/permanent', { method: 'DELETE', body: JSON.stringify({ id, itemType }) });
  },

  // 14. Achievement Verification
  async getPendingAchievements() { return await request('/achievements/pending'); },
  async verifyAchievement(id, achievementType, comment = '') {
    return await request(`/achievements/${encodeURIComponent(id)}/verify`, {
      method: 'POST', body: JSON.stringify({ achievementType, comment })
    });
  },
  async rejectAchievement(id, achievementType, comment = '') {
    return await request(`/achievements/${encodeURIComponent(id)}/reject`, {
      method: 'POST', body: JSON.stringify({ achievementType, comment })
    });
  },

  // 15. Skill Assignment
  async assignSkillToStudents(skillId, assignData) {
    return await request(`/skills/${encodeURIComponent(skillId)}/assign`, {
      method: 'POST', body: JSON.stringify(assignData)
    });
  },

  // 16. Academician Settings
  async getAcademicianSettings() { return await request('/settings'); },

  // 17. Learning routes (student-facing, proxied via learning API)
  async getStudentCourses() { return await request('/my-courses', {}, LEARNING_BASE); },
  async getStudentCourseDetail(courseId) {
    return await request(`/my-courses/${encodeURIComponent(courseId)}`, {}, LEARNING_BASE);
  },
  async completeLessonForStudent(courseId, lessonId, data = {}) {
    return await request(`/my-courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/complete`, {
      method: 'POST', body: JSON.stringify(data)
    }, LEARNING_BASE);
  },

  // 18. Student assigned skill tests
  async getAssignedSkillTests() {
    return await request('/assigned-skill-tests', {}, LEARNING_BASE);
  }
};
