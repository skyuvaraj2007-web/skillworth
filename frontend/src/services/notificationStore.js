/**
 * SKILLNEXUS AI - Central Notification Store
 * Single source of truth for all role-specific notifications.
 * Supports Student, Institution, Academician, and Company roles with cross-role matching.
 */

import { nexusApiClient } from './nexusApiClient';

const STORAGE_KEY = 'nexus_notifications_data';

export function normalizeRole(role) {
  if (!role) return 'student';
  const r = String(role).toLowerCase().trim();
  if (r === 'industry' || r === 'company' || r === 'recruiter' || r === 'corporate') return 'company';
  if (r === 'institution') return 'institution';
  if (r === 'academician' || r === 'faculty' || r === 'mentor' || r === 'academia' || r === 'professor') return 'academician';
  return 'student';
}

export const SEED_NOTIFICATIONS = [
  // ── 1. CANDIDATE SELECTION & OFFER RELEASE: MULTI-ROLE MATCH ──
  // A. Student View
  {
    id: 'notif_sel_student_01',
    role: 'student',
    type: 'candidate_selected',
    title: '🎉 Offer Extended: Selected by Google Cloud!',
    preview: 'Congratulations! Google Cloud has selected you for the Cloud Infrastructure Engineer role (CTC: ₹14.5 LPA). Official offer letter released.',
    time: '10 mins ago',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    unread: true,
    deleted: false,
    color: '#00D4FF',
    categoryLabel: 'OFFER EXTENDED',
    details: {
      candidateName: 'Alex Johnson',
      studentId: 'STU-PSG-2026-042',
      companyName: 'Google Cloud India',
      roleTitle: 'Cloud Infrastructure Solutions Engineer',
      ctcOrStipend: '₹14.50 LPA',
      institutionName: 'PSG College of Technology',
      academicianName: 'Dr. K. Ramanathan (Professor & Faculty Mentor)',
      onboardingDate: '2026-07-15',
      offerStatus: 'OFFER RELEASED',
      action: 'view-offer',
      whyReceived: 'Your sovereign skill ledger and proctored technical benchmarks met Google Cloud recruitment threshold.'
    }
  },
  // B. Institution (College Placement Office) View
  {
    id: 'notif_sel_inst_01',
    role: 'institution',
    type: 'student_placement_success',
    title: '🎓 Campus Placement Success: Alex Johnson Selected by Google Cloud',
    preview: 'Alex Johnson (CSE Department) has accepted an offer for Cloud Infrastructure Engineer at Google Cloud (Package: ₹14.5 LPA).',
    time: '10 mins ago',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    unread: true,
    deleted: false,
    color: '#10B981',
    categoryLabel: 'PLACEMENT SUCCESS',
    details: {
      candidateName: 'Alex Johnson',
      studentId: 'STU-PSG-2026-042',
      department: 'Computer Science & Engineering',
      companyName: 'Google Cloud India',
      roleTitle: 'Cloud Infrastructure Solutions Engineer',
      ctcOrStipend: '₹14.50 LPA',
      institutionName: 'PSG College of Technology',
      academicianName: 'Dr. K. Ramanathan',
      action: 'view-placements',
      whyReceived: 'Institutional placement records auto-updated via SkillNexus AI verified smart contract.'
    }
  },
  // C. Academician (Faculty Mentor) View
  {
    id: 'notif_sel_acad_01',
    role: 'academician',
    type: 'mentee_placed',
    title: '⭐ Mentee Achievement: Alex Johnson Placed at Google Cloud!',
    preview: 'Your department mentee Alex Johnson has been hired as Cloud Infrastructure Engineer at Google Cloud (CTC: ₹14.5 LPA).',
    time: '10 mins ago',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    unread: true,
    deleted: false,
    color: '#F59E0B',
    categoryLabel: 'MENTEE SUCCESS',
    details: {
      candidateName: 'Alex Johnson',
      studentId: 'STU-PSG-2026-042',
      department: 'Computer Science & Engineering',
      companyName: 'Google Cloud India',
      roleTitle: 'Cloud Infrastructure Solutions Engineer',
      ctcOrStipend: '₹14.50 LPA',
      institutionName: 'PSG College of Technology',
      academicianName: 'Dr. K. Ramanathan',
      action: 'view-mentee',
      whyReceived: 'Recognizing faculty mentorship impact on student career readiness and industry placement.'
    }
  },
  // D. Company (Corporate Recruiter) View
  {
    id: 'notif_sel_comp_01',
    role: 'company',
    type: 'candidate_selection_recorded',
    title: '✅ Candidate Added to Selected Roster: Alex Johnson',
    preview: 'Alex Johnson from PSG College of Technology is officially logged in your Selected Candidates roster for Cloud Infrastructure Engineer (₹14.5 LPA).',
    time: '10 mins ago',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    unread: true,
    deleted: false,
    color: '#00D4FF',
    categoryLabel: 'TALENT HIRED',
    details: {
      candidateName: 'Alex Johnson',
      studentId: 'STU-PSG-2026-042',
      companyName: 'Google Cloud India',
      roleTitle: 'Cloud Infrastructure Solutions Engineer',
      ctcOrStipend: '₹14.50 LPA',
      institutionName: 'PSG College of Technology',
      academicianName: 'Dr. K. Ramanathan',
      onboardingDate: '2026-07-15',
      action: 'view-selected',
      whyReceived: 'Candidate offer generation and onboarding workflow initiated.'
    }
  },

  // ── 2. COLLEGE COLLABORATION & TALENT ACCESS: MULTI-ROLE MATCH ──
  // A. Company View
  {
    id: 'notif_collab_comp_01',
    role: 'company',
    type: 'college_collaboration_request',
    title: '🏛️ Collaboration Request Dispatched: PSG College of Technology',
    preview: 'Talent cohort access and 2026 campus recruitment drive request transmitted to PSG College of Technology placement office.',
    time: '25 mins ago',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    unread: false,
    deleted: false,
    color: '#8B5CF6',
    categoryLabel: 'COLLABORATION SENT',
    details: {
      institutionName: 'PSG College of Technology',
      collegeCode: 'PSG-TECH-TN',
      departments: ['Computer Science', 'Information Technology', 'AI & Data Science'],
      batchYear: '2026 Batch',
      partnershipType: 'Campus Recruitment Drive & MoU',
      action: 'view-colleges',
      whyReceived: 'Collaboration dispatched through SkillNexus Sovereign Institutional Gateway.'
    }
  },
  // B. Institution View
  {
    id: 'notif_collab_inst_01',
    role: 'institution',
    type: 'college_collaboration_request',
    title: '🤝 New Industry Partnership & Talent Request: Google Cloud India',
    preview: 'Google Cloud India has requested institutional collaboration and pre-screened cohort access for 2026 Engineering graduates.',
    time: '25 mins ago',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    unread: true,
    deleted: false,
    color: '#00D4FF',
    categoryLabel: 'INDUSTRY REQUEST',
    details: {
      companyName: 'Google Cloud India',
      institutionName: 'PSG College of Technology',
      departments: ['Computer Science', 'Information Technology', 'AI & Data Science'],
      batchYear: '2026 Batch',
      partnershipType: 'Campus Recruitment Drive & MoU',
      minCgpa: '7.5 CGPA',
      action: 'view-collaboration',
      whyReceived: 'Corporate recruiter requested secure student talent pipeline verification.'
    }
  },
  // C. Academician View
  {
    id: 'notif_collab_acad_01',
    role: 'academician',
    type: 'industry_collaboration_alert',
    title: '🏢 Department Industry Connect: Google Cloud India',
    preview: 'Google Cloud India initiated a talent cohort partnership with your department (Computer Science). 42 department students eligible.',
    time: '25 mins ago',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    unread: true,
    deleted: false,
    color: '#F59E0B',
    categoryLabel: 'INDUSTRY PARTNER',
    details: {
      companyName: 'Google Cloud India',
      department: 'Computer Science & Engineering',
      institutionName: 'PSG College of Technology',
      batchYear: '2026 Batch',
      action: 'view-requirements',
      whyReceived: 'Cross-portal departmental alignment with corporate demand trends.'
    }
  },
  // D. Student View
  {
    id: 'notif_collab_stu_01',
    role: 'student',
    type: 'campus_drive_announced',
    title: '💼 Campus Partnership Announced: Google Cloud India',
    preview: 'PSG College of Technology authorized Google Cloud campus recruitment drive for 2026 Batch. Check your eligibility benchmark.',
    time: '25 mins ago',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    unread: false,
    deleted: false,
    color: '#00D4FF',
    categoryLabel: 'CAMPUS DRIVE',
    details: {
      companyName: 'Google Cloud India',
      institutionName: 'PSG College of Technology',
      targetRoles: ['Cloud Infrastructure Engineer', 'Solutions Associate'],
      minCgpa: '7.5 CGPA',
      action: 'view-opportunities',
      whyReceived: 'Matching your department and verified skill profile credentials.'
    }
  }
];

function notifySubscribers() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus_notifications_updated'));
  }
}

export function loadAllNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS));
      return SEED_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS));
      return SEED_NOTIFICATIONS;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading notifications:', err);
    return SEED_NOTIFICATIONS;
  }
}

export function saveAllNotifications(notifications) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    notifySubscribers();
  } catch (err) {
    console.error('Error saving notifications:', err);
  }
}

export function getActiveNotifications() {
  const all = loadAllNotifications();
  return all.filter(n => !n.deleted);
}

export function getTrashNotifications() {
  const all = loadAllNotifications();
  return all.filter(n => n.deleted);
}

/** Role-isolated getters — guaranteed data isolation between roles */
export function getActiveNotificationsByRole(role, user = null) {
  const normRole = normalizeRole(role);
  const all = loadAllNotifications();
  return all.filter(n => {
    if (n.deleted) return false;
    if (normalizeRole(n.role) !== normRole) return false;
    return true;
  });
}

export function getTrashNotificationsByRole(role, user = null) {
  const normRole = normalizeRole(role);
  const all = loadAllNotifications();
  return all.filter(n => {
    if (!n.deleted) return false;
    if (normalizeRole(n.role) !== normRole) return false;
    return true;
  });
}

export function getUnreadCount(role, user = null) {
  if (role) {
    return getActiveNotificationsByRole(role, user).filter(n => n.unread).length;
  }
  const active = getActiveNotifications();
  return active.filter(n => n.unread).length;
}

export function getNotificationById(id) {
  const all = loadAllNotifications();
  return all.find(n => n.id === id) || null;
}

export function markAsRead(id) {
  const all = loadAllNotifications();
  const updated = all.map(n => n.id === id ? { ...n, unread: false } : n);
  saveAllNotifications(updated);
  nexusApiClient.markNotificationRead(id).catch(err => console.debug('API sync deferred:', err));
}

export function markAllAsRead(role) {
  const normRole = role ? normalizeRole(role) : null;
  const all = loadAllNotifications();
  const updated = all.map(n => {
    if (!normRole || normalizeRole(n.role) === normRole) {
      return { ...n, unread: false };
    }
    return n;
  });
  saveAllNotifications(updated);
  nexusApiClient.markAllNotificationsRead(normRole).catch(err => console.debug('API sync deferred:', err));
}

export function softDeleteNotification(id) {
  const all = loadAllNotifications();
  const updated = all.map(n => {
    if (n.id === id) {
      return {
        ...n,
        deleted: true,
        deletedAt: new Date().toISOString()
      };
    }
    return n;
  });
  saveAllNotifications(updated);
  nexusApiClient.softDeleteNotification(id).catch(err => console.debug('API sync deferred:', err));
}

export function restoreNotification(id) {
  const all = loadAllNotifications();
  const updated = all.map(n => {
    if (n.id === id) {
      return {
        ...n,
        deleted: false,
        deletedAt: null
      };
    }
    return n;
  });
  saveAllNotifications(updated);
  nexusApiClient.restoreNotification(id).catch(err => console.debug('API sync deferred:', err));
}

export function restoreAllNotifications(role) {
  const normRole = role ? normalizeRole(role) : null;
  const all = loadAllNotifications();
  const updated = all.map(n => {
    if (n.deleted && (!normRole || normalizeRole(n.role) === normRole)) {
      return {
        ...n,
        deleted: false,
        deletedAt: null
      };
    }
    return n;
  });
  saveAllNotifications(updated);
}

export function permanentlyDeleteNotification(id) {
  const all = loadAllNotifications();
  const updated = all.filter(n => n.id !== id);
  saveAllNotifications(updated);
}

export function emptyTrash(role) {
  const normRole = role ? normalizeRole(role) : null;
  const all = loadAllNotifications();
  const updated = all.filter(n => !(n.deleted && (!normRole || normalizeRole(n.role) === normRole)));
  saveAllNotifications(updated);
  nexusApiClient.emptyTrash(normRole).catch(err => console.debug('API sync deferred:', err));
}

export function addRoleNotification(role, notifData) {
  const normRole = normalizeRole(role);
  const all = loadAllNotifications();
  const newNotif = {
    id: `notif_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`,
    role: normRole,
    type: notifData.type || 'system',
    title: notifData.title || 'System Notification',
    preview: notifData.message || notifData.preview || 'New activity recorded on the sovereign ledger.',
    time: 'Just now',
    timestamp: new Date().toISOString(),
    unread: true,
    deleted: false,
    color: notifData.urgency === 'high' ? '#28D7FF' : notifData.urgency === 'medium' ? '#2FE0A1' : '#8B5CF6',
    categoryLabel: notifData.type ? notifData.type.toUpperCase() : 'PLATFORM',
    details: notifData.details || {
      whyReceived: notifData.message || 'Activity synced across the SkillNexus network.',
      action: notifData.action || 'view'
    }
  };

  const updated = [newNotif, ...all];
  saveAllNotifications(updated);
  nexusApiClient.addNotification(normRole, notifData).catch(err => console.debug('API sync deferred:', err));
  return newNotif;
}

// ══════════════════════════════════════════════════════════════════════
// CROSS-ROLE MULTI-ENTITY EVENT DISPATCHERS
// ══════════════════════════════════════════════════════════════════════

/**
 * Dispatches matching notifications across Company, Institution, Academician, and Student
 * when an Industry partner initiates a College Collaboration or Talent Access Request.
 */
export function dispatchCrossRoleCollaborationNotification({
  companyName = 'Enterprise Partner',
  institutionName = 'PSG College of Technology',
  collegeCode = 'INST-001',
  departments = ['Computer Science', 'Information Technology'],
  batchYear = '2026 Batch',
  partnershipType = 'Campus Placement & Talent Cohort Access',
  recruiterName = 'Corporate Talent Lead',
  notes = ''
}) {
  const deptList = Array.isArray(departments) ? departments.join(', ') : departments;

  // 1. Institution Placement Office
  addRoleNotification('institution', {
    type: 'college_collaboration_request',
    title: `🤝 New Industry Partnership & Talent Request: ${companyName}`,
    message: `${companyName} (${recruiterName}) has formally requested ${partnershipType} for ${deptList} (${batchYear}).`,
    urgency: 'high',
    details: {
      companyName,
      institutionName,
      collegeCode,
      departments,
      batchYear,
      partnershipType,
      recruiterName,
      notes,
      action: 'view-collaboration',
      whyReceived: 'Institutional partnership request logged to sovereign recruitment registry.'
    }
  });

  // 2. Academician (Faculty Mentor)
  addRoleNotification('academician', {
    type: 'industry_collaboration_alert',
    title: `🏢 Department Industry Connect: ${companyName}`,
    message: `Corporate partner ${companyName} has initiated a talent cohort access partnership for ${deptList} (${batchYear}).`,
    urgency: 'medium',
    details: {
      companyName,
      institutionName,
      departments,
      batchYear,
      partnershipType,
      action: 'view-requirements',
      whyReceived: 'Direct faculty alert for curriculum alignment and student preparation.'
    }
  });

  // 3. Company Recruiter
  addRoleNotification('company', {
    type: 'college_collaboration_request',
    title: `🏛️ Collaboration Request Dispatched: ${institutionName}`,
    message: `Your talent cohort access request for ${deptList} (${batchYear}) was securely transmitted to ${institutionName}.`,
    urgency: 'medium',
    details: {
      companyName,
      institutionName,
      collegeCode,
      departments,
      batchYear,
      partnershipType,
      notes,
      action: 'view-colleges',
      whyReceived: 'Official recruiter dispatch confirmed on the network ledger.'
    }
  });

  // 4. Students in department
  addRoleNotification('student', {
    type: 'campus_drive_announced',
    title: `💼 Campus Partnership Announced: ${companyName}`,
    message: `${companyName} has officially partnered with ${institutionName} for ${batchYear} recruitment drives.`,
    urgency: 'medium',
    details: {
      companyName,
      institutionName,
      departments,
      batchYear,
      action: 'view-opportunities',
      whyReceived: 'Matching your institutional enrollment and verified skill benchmark.'
    }
  });
}

/**
 * Dispatches matching notifications across Student, Institution, Academician, and Company
 * when an Industry partner selects a candidate and releases an offer package.
 */
export function dispatchCrossRoleSelectionNotification({
  candidateName = 'Alex Johnson',
  studentId = 'STU-001',
  studentEmail = 'alex.j@campus.edu',
  companyName = 'Google Cloud',
  roleTitle = 'Cloud Infrastructure Engineer',
  ctcOrStipend = '₹14.50 LPA',
  institutionName = 'PSG College of Technology',
  department = 'Computer Science & Engineering',
  academicianName = 'Dr. K. Ramanathan',
  onboardingDate = '2026-07-15'
}) {
  // 1. Student (Hired / Offer Received)
  addRoleNotification('student', {
    type: 'candidate_selected',
    title: `🎉 Offer Extended: Selected by ${companyName}!`,
    message: `Congratulations! ${companyName} has selected you for "${roleTitle}" with a compensation package of ${ctcOrStipend}.`,
    urgency: 'high',
    details: {
      candidateName,
      studentId,
      companyName,
      roleTitle,
      ctcOrStipend,
      institutionName,
      department,
      academicianName,
      onboardingDate,
      offerStatus: 'OFFER RELEASED',
      action: 'view-offer',
      whyReceived: 'Your verified skill passport and assessment performance passed company hiring threshold.'
    }
  });

  // 2. Institution Placement Office
  addRoleNotification('institution', {
    type: 'student_placement_success',
    title: `🎓 Campus Placement Success: ${candidateName} Selected by ${companyName}`,
    message: `${candidateName} (${department}) was selected by ${companyName} for ${roleTitle} (${ctcOrStipend}).`,
    urgency: 'high',
    details: {
      candidateName,
      studentId,
      companyName,
      roleTitle,
      ctcOrStipend,
      institutionName,
      department,
      academicianName,
      onboardingDate,
      action: 'view-placements',
      whyReceived: 'Campus placement registry automatically synchronized with corporate hiring ledger.'
    }
  });

  // 3. Academician (Faculty Mentor)
  addRoleNotification('academician', {
    type: 'mentee_placed',
    title: `⭐ Mentee Achievement: ${candidateName} Placed at ${companyName}!`,
    message: `Your department mentee ${candidateName} was hired as ${roleTitle} at ${companyName} (${ctcOrStipend}).`,
    urgency: 'high',
    details: {
      candidateName,
      studentId,
      companyName,
      roleTitle,
      ctcOrStipend,
      institutionName,
      department,
      academicianName,
      onboardingDate,
      action: 'view-mentee',
      whyReceived: 'Acknowledging mentorship milestone for department outcome tracking.'
    }
  });

  // 4. Company (Recruiter)
  addRoleNotification('company', {
    type: 'candidate_selection_recorded',
    title: `✅ Candidate Added to Selected Roster: ${candidateName}`,
    message: `${candidateName} from ${institutionName} has been officially recorded in your Selected Candidates roster for ${roleTitle} (${ctcOrStipend}).`,
    urgency: 'high',
    details: {
      candidateName,
      studentId,
      companyName,
      roleTitle,
      ctcOrStipend,
      institutionName,
      department,
      academicianName,
      onboardingDate,
      action: 'view-selected',
      whyReceived: 'Candidate hiring record finalized and candidate onboarding workflow prepared.'
    }
  });
}

/**
 * Dispatches multi-role notifications when an Industry Partner posts an assessment
 * for selected student(s): notifies each Student, each student's Institution, and Academician mentor.
 */
export function dispatchAssessmentAssignedNotification({
  assessmentId,
  title,
  companyName = 'Industry Partner',
  programmingLanguage = 'JavaScript',
  projectTitle = 'Applied Engineering Project',
  projectDescription = '',
  durationMinutes = 45,
  deadline = 'Active Cycle',
  studentId,
  studentName = 'Candidate',
  institutionId,
  institutionName = 'Partner Institution',
  department = 'Engineering'
}) {
  // 1. Student Notification
  addRoleNotification('student', {
    type: 'ASSESSMENT_ASSIGNED',
    title: `🎯 New Assessment Assigned: ${title} (${programmingLanguage})`,
    message: `${companyName} posted an assessment test in ${programmingLanguage} on project "${projectTitle}". Attend before deadline: ${deadline}.`,
    urgency: 'high',
    color: '#00D4FF',
    details: {
      assessmentId,
      assessmentTitle: title,
      companyName,
      programmingLanguage,
      projectTitle,
      projectDescription,
      durationMinutes,
      deadline,
      studentName,
      studentId,
      institutionName,
      action: 'attend-assessment',
      whyReceived: 'Assigned directly by enterprise recruiter following candidate selection.'
    }
  });

  // 2. Institution Notification
  addRoleNotification('institution', {
    type: 'ASSESSMENT_ASSIGNED_INSTITUTION',
    title: `🏛️ Assessment Assigned to Student: ${studentName}`,
    message: `${companyName} posted an assessment test in ${programmingLanguage} on project "${projectTitle}" for your student ${studentName} (${department}).`,
    urgency: 'high',
    color: '#10B981',
    details: {
      assessmentId,
      assessmentTitle: title,
      companyName,
      studentName,
      studentId,
      institutionId,
      institutionName,
      department,
      programmingLanguage,
      projectTitle,
      projectDescription,
      durationMinutes,
      deadline,
      action: 'view-assessment',
      whyReceived: 'Industry partner posted formal competency assessment for your enrolled student.'
    }
  });

  // 3. Academician (Faculty Mentor)
  addRoleNotification('academician', {
    type: 'ASSESSMENT_ASSIGNED_ACADEMICIAN',
    title: `👨‍🏫 Assessment Posted for Mentee: ${studentName}`,
    message: `${companyName} assigned a ${programmingLanguage} test on project "${projectTitle}" for your mentee ${studentName}.`,
    urgency: 'medium',
    color: '#F59E0B',
    details: {
      assessmentId,
      assessmentTitle: title,
      companyName,
      studentName,
      studentId,
      department,
      programmingLanguage,
      projectTitle,
      durationMinutes,
      deadline,
      action: 'view-mentee-assessment'
    }
  });

  // 4. Company (Confirmation of assessment posted)
  addRoleNotification('company', {
    type: 'assessment_published',
    title: `🚀 Assessment Dispatched: ${title}`,
    message: `Assessment test in ${programmingLanguage} for project "${projectTitle}" dispatched to ${studentName} and ${institutionName}.`,
    urgency: 'medium',
    color: '#8B5CF6',
    details: {
      assessmentId,
      assessmentTitle: title,
      companyName,
      studentName,
      studentId,
      institutionName,
      programmingLanguage,
      projectTitle,
      durationMinutes,
      deadline,
      action: 'view-assessment-results'
    }
  });
}
