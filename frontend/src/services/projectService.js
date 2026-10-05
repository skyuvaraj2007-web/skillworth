/**
 * SKILLNEXUS AI — Student Project Portfolio & Evidence Service
 * Handles full LinkedIn-style project experience, activity timeline,
 * college verification dispatch, and NEXUS AI project intelligence.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('nexus_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const projectService = {
  // Fetch all projects for student with portfolio metrics
  async getProjects(filter = 'all') {
    const query = filter && filter !== 'all' ? `?filter=${encodeURIComponent(filter)}` : '';
    const res = await fetch(`${API_BASE}/projects${query}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error((await res.json())?.message || 'Failed to fetch projects');
    return res.json();
  },

  // Fetch single project by ID
  async getProjectById(projectId) {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error((await res.json())?.message || 'Failed to fetch project');
    return res.json();
  },

  // Create new LinkedIn-style project
  async createProject(projectData) {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(projectData)
    });
    if (!res.ok) throw new Error((await res.json())?.message || 'Failed to create project');
    return res.json();
  },

  // Update project
  async updateProject(projectId, updateData) {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updateData)
    });
    if (!res.ok) throw new Error((await res.json())?.message || 'Failed to update project');
    return res.json();
  },

  // Delete project
  async deleteProject(projectId) {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error((await res.json())?.message || 'Failed to delete project');
    return res.json();
  },

  // Toggle publish to public profile
  async publishProject(projectId, isPublished = true) {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ isPublished })
    });
    if (!res.ok) throw new Error((await res.json())?.message || 'Failed to update publication status');
    return res.json();
  },

  // Submit project to mapped college for academic validation
  async submitProjectForVerification(projectId) {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/submit-verification`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error((await res.json())?.message || 'Failed to submit project for verification');
    return res.json();
  },

  // Add activity / milestone to project timeline
  async addProjectActivity(projectId, activityData) {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/activities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(activityData)
    });
    if (!res.ok) throw new Error((await res.json())?.message || 'Failed to record project activity');
    return res.json();
  },

  // Update activity status (PLANNED, IN PROGRESS, COMPLETED)
  async updateProjectActivity(projectId, activityId, updateData) {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/activities/${encodeURIComponent(activityId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updateData)
    });
    if (!res.ok) throw new Error((await res.json())?.message || 'Failed to update activity');
    return res.json();
  },

  // Delete activity
  async deleteProjectActivity(projectId, activityId) {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/activities/${encodeURIComponent(activityId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error((await res.json())?.message || 'Failed to delete activity');
    return res.json();
  },

  // Get NEXUS AI Project Insights & Recommendations
  async getProjectAiInsights(projectId) {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/ai-insights`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error((await res.json())?.message || 'Failed to fetch AI project insights');
    return res.json();
  },

  // Get chronological professional activity feed
  async getActivityFeed() {
    const res = await fetch(`${API_BASE}/projects/activity-feed`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error((await res.json())?.message || 'Failed to fetch activity feed');
    return res.json();
  },

  // Launch cloud sandbox
  async launchSandbox(projectId) {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/sandbox`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error((await res.json())?.message || 'Failed to launch sandbox');
    return res.json();
  }
};
