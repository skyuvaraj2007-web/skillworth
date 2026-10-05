/**
 * SKILLNEXUS AI - Central Student Profile Store
 * Single source of truth for the student's professional identity,
 * personal info, academic credentials, and career targets.
 */

const PROFILE_STORAGE_KEY = 'nexus_student_profile';

const EMPTY_PROFILE = {
  id: '',
  candidateId: '',
  institutionalId: '',
  name: '',
  email: '',
  phone: '',
  location: '',
  dob: '',
  gender: '',
  college: '',
  degree: '',
  department: '',
  gradYear: '',
  desiredRole: '',
  targetIndustry: '',
  compensation: '',
  modalities: {
    hybrid: false,
    remote: false,
    onsite: false
  },
  bio: '',
  skills: [],
  avatar: '',
  trashBin: [],
  verified: false,
  integrityIndex: '0%',
  achievements: {
    projectsCompleted: 0,
    verifiedSkills: 0,
    coursesCompleted: 0,
    opportunitiesMatched: 0
  }
};

export function calculateProfileCompletion(profile, documents = [], projects = [], courses = []) {
  if (!profile) return { percentage: 0, items: [] };

  const checks = [
    { id: 'photo', label: 'Profile photo', done: Boolean(profile.avatar && profile.avatar.trim().length > 0), weight: 15 },
    { id: 'personal', label: 'Personal details', done: Boolean(profile.name && profile.email && profile.phone), weight: 20 },
    { id: 'academic', label: 'Academic details', done: Boolean(profile.college && profile.degree && profile.department), weight: 20 },
    { id: 'skills', label: 'Skills', done: Boolean(Array.isArray(profile.skills) && profile.skills.length > 0), weight: 15 },
    { id: 'projects', label: 'Projects', done: Boolean((Array.isArray(projects) && projects.length > 0) || (profile.achievements && profile.achievements.projectsCompleted > 0) || (Array.isArray(profile.projects) && profile.projects.length > 0)), weight: 15 },
    { id: 'resume', label: 'Resume', done: Boolean(Array.isArray(documents) && documents.some(d => (d.type || '').toLowerCase() === 'resume') || profile.resume || profile.resumeUrl), weight: 15 }
  ];

  const totalScore = checks.reduce((acc, c) => acc + (c.done ? c.weight : 0), 0);
  return {
    percentage: Math.min(100, Math.round(totalScore)),
    items: checks
  };
}

export function loadStudentProfile() {
  try {
    const authRaw = localStorage.getItem('nexus_auth_user') || localStorage.getItem('nexus_user');
    const authUser = authRaw ? JSON.parse(authRaw) : null;
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (authUser && parsed.email && parsed.email.toLowerCase() === authUser.email?.toLowerCase()) {
        return {
          ...EMPTY_PROFILE,
          ...parsed,
          modalities: { ...EMPTY_PROFILE.modalities, ...(parsed.modalities || {}) }
        };
      }
      if (!authUser && parsed.email) {
        return {
          ...EMPTY_PROFILE,
          ...parsed,
          modalities: { ...EMPTY_PROFILE.modalities, ...(parsed.modalities || {}) }
        };
      }
    }
    if (authUser && authUser.role === 'student') {
      const userProfile = {
        ...EMPTY_PROFILE,
        id: authUser.id || authUser.studentId || '',
        candidateId: authUser.studentId || '',
        institutionalId: authUser.regNo || authUser.registerNumber || authUser.studentId || '',
        name: authUser.name || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        location: authUser.location || '',
        dob: authUser.dob || '',
        gender: authUser.gender || '',
        college: authUser.collegeName || authUser.college || '',
        collegeId: authUser.collegeId || '',
        degree: authUser.degree || '',
        department: authUser.department || '',
        year: authUser.year || '',
        semester: authUser.semester || '',
        gradYear: authUser.batch || authUser.gradYear || '',
        desiredRole: authUser.careerGoal || authUser.targetRole || '',
        cgpa: authUser.cgpa || '0.00',
        creditsCompleted: Number(authUser.creditsCompleted) || 0,
        totalCredits: Number(authUser.totalCredits) || 160,
        courseCompletionPercentage: authUser.courseCompletionPercentage || 0,
        courseCompletionStatus: authUser.courseCompletionStatus || 'In Progress',
        activeBacklogs: authUser.activeBacklogs || 0,
        skills: Array.isArray(authUser.skills) ? authUser.skills.map(s => typeof s === 'string' ? s : s.name) : [],
        certifications: Array.isArray(authUser.certifications) ? authUser.certifications : [],
        avatar: authUser.avatar || '',
        bio: authUser.bio || '',
        trashBin: Array.isArray(authUser.trashBin) ? authUser.trashBin : [],
        modalities: authUser.modalities || {
          hybrid: false,
          remote: false,
          onsite: false
        },
        verified: false,
        achievements: {
          projectsCompleted: 0,
          verifiedSkills: 0,
          coursesCompleted: 0,
          opportunitiesMatched: 0
        }
      };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(userProfile));
      return userProfile;
    }
    return { ...EMPTY_PROFILE };
  } catch (e) {
    console.error('Error loading student profile:', e);
    return { ...EMPTY_PROFILE };
  }
}

export function saveStudentProfile(updatedProfile) {
  try {
    const current = loadStudentProfile();
    const merged = {
      ...EMPTY_PROFILE,
      ...current,
      ...updatedProfile,
      modalities: {
        ...EMPTY_PROFILE.modalities,
        ...(current.modalities || {}),
        ...(updatedProfile?.modalities || {})
      }
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));

    // Also update logged-in session user if name or avatar changed
    try {
      const authRaw = localStorage.getItem('nexus_auth_user');
      if (authRaw) {
        const authUser = JSON.parse(authRaw);
        const updatedAuth = {
          ...authUser,
          name: merged.name,
          email: merged.email,
          avatar: merged.avatar,
          headline: merged.desiredRole
        };
        localStorage.setItem('nexus_auth_user', JSON.stringify(updatedAuth));
      }
    } catch {}

    // Dispatch global event for instant UI synchronization
    window.dispatchEvent(new CustomEvent('nexus_profile_updated', { detail: merged }));

    // Async sync with backend if available
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
    fetch(`${apiBase}/students/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      credentials: 'include',
      body: JSON.stringify({
        name: merged.name,
        phone: merged.phone,
        location: merged.location,
        dob: merged.dob,
        gender: merged.gender,
        avatar: merged.avatar,
        college: merged.college,
        degree: merged.degree,
        department: merged.department,
        gradYear: merged.gradYear,
        bio: merged.bio,
        skills: merged.skills,
        desiredRole: merged.desiredRole,
        trashBin: merged.trashBin
      })
    }).catch(err => {
      console.warn('Backend sync postponed:', err.message);
    });

    return merged;
  } catch (e) {
    console.error('Error saving student profile:', e);
    return updatedProfile;
  }
}
