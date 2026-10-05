import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import NexusAIModal from './components/NexusAIModal';
import SkillNexusFAB from './components/SkillNexusFAB';
import Toast from './components/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import LandingPage from './pages/LandingPage';
import RoleGateway from './pages/RoleGateway';
import StudentLogin from './pages/StudentLogin';
import IndustryLogin from './pages/IndustryLogin';
import InstitutionLogin from './pages/InstitutionLogin';
import MySkills from './pages/MySkills';
import SkillGraph from './pages/SkillGraph';
import SkillGapAnalysis from './pages/SkillGapAnalysis';
import SkillAssessment from './pages/SkillAssessment';
import MyLearning from './pages/MyLearning';
import LearningProgressAnalytics from './pages/LearningProgressAnalytics';
import AdvancedTech from './pages/AdvancedTech';
import TechDeepDive from './pages/TechDeepDive';
import CourseEnrollment from './pages/CourseEnrollment';
import MyProjects from './pages/MyProjects';
import StudentDashboard from './pages/StudentDashboard';
import Opportunities from './pages/Opportunities';
import DigitalPassport from './pages/DigitalPassport';
import PublicPassportView from './pages/PublicPassportView';
import MyProfile from './pages/MyProfile';
import Settings from './pages/Settings';
import HelpCenter from './pages/HelpCenter';
import Notifications from './pages/Notifications';
import SearchResults from './pages/SearchResults';
import InstitutionConsole from './pages/InstitutionConsole';
import IndustryPortal from './pages/IndustryPortal';
import StudentActivation from './pages/StudentActivation';
import StudentCollegePage from './pages/StudentCollegePage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CommunicationLearning from './pages/CommunicationLearning';
import AcademicianLogin from './pages/AcademicianLogin';
import AcademicianPortal from './pages/AcademicianPortal';
import CareerJourney from './pages/CareerJourney';
import CareerCopilot from './pages/CareerCopilot';
import CareerReadiness from './pages/CareerReadiness';
import WorkerPortal from './pages/WorkerPortal';
import AssessorWorkspace from './pages/AssessorWorkspace';
import InstitutionPortal from './pages/InstitutionPortal';
// ════════════════════════════════════════════════════════════════
// URL SYNCHRONIZATION & ROLE NORMALIZATION UTILITIES
// ════════════════════════════════════════════════════════════════
export const normalizeRole = (role) => {
  if (!role) return 'student';
  const r = String(role).toLowerCase();
  if (r === 'industry' || r === 'company') return 'company';
  if (r === 'institution') return 'institution';
  if (r === 'faculty' || r === 'academician') return 'academician';
  return 'student';
};

export const pageToPath = (page, role, tab = 'dashboard') => {
  const normRole = normalizeRole(role);
  if (page === 'landing') return '/';
  if (page === 'worker-portal' || page === 'worker') return '/worker';
  if (page === 'assessor-workspace' || page === 'assessor') return '/assessor';
  if (page === 'institution-portal' || page === 'institution') return '/institution';
  if (page === 'role-select') return '/auth/select-role';
  if (page === 'student-login') return '/auth/student-login';
  if (page === 'institution-login') return '/auth/institution-login';
  if (page === 'industry-login') return '/auth/company-login';
  if (page === 'academician-login' || page === 'faculty-login') return '/academician/login';
  if (page === 'activate') return '/activate';
  if (page === 'verify-otp') return '/auth/verify-otp';
  if (page === 'forgot-password') return '/auth/forgot-password';
  if (page === 'public-passport') return tab ? `/passport/${tab}` : '/passport';

  if (normRole === 'academician') {
    if (page === 'academician-dashboard' || page === 'home' || page === 'dashboard') return '/academician/dashboard';
    if (page === 'academician-students' || page === 'academician-my-students') return '/academician/students';
    if (page === 'academician-student-performance') return '/academician/student-performance';
    if (page === 'academician-student-performance-detail' || page === 'academician-student-detail') return tab ? `/academician/students/${tab}/performance` : '/academician/student-performance';
    if (page === 'academician-skill-analytics') return '/academician/skill-analytics';
    if (page === 'academician-skill-assessments' || page === 'academician-assessments') return '/academician/skill-assessments';
    if (page === 'academician-create-assessment' || page === 'academician-skill-assessments-create') return '/academician/skill-assessments/create';
    if (page === 'academician-assessment-detail') return tab ? `/academician/skill-assessments/${tab}` : '/academician/skill-assessments';
    if (page === 'academician-assessment-results') return '/academician/assessment-results';
    if (page === 'academician-courses') return '/academician/courses';
    if (page === 'academician-create-course') return '/academician/courses/create';
    if (page === 'academician-skill-gaps') return '/academician/skill-gaps';
    if (page === 'academician-industry-requirements') return '/academician/industry-requirements';
    if (page === 'academician-recommendations') return '/academician/recommendations';
    if (page === 'academician-mentorship') return '/academician/mentorship';
    if (page === 'academician-opportunities') return '/academician/opportunities';
    if (page === 'academician-analytics') return '/academician/skill-analytics';
    if (page === 'academician-notifications' || page === 'notifications') return '/academician/notifications';
    if (page === 'settings') return '/academician/settings';
    if (page === 'profile') return '/academician/profile';
    return '/academician/dashboard';
  }

  if (normRole === 'student') {
    if (page === 'home') return '/student/home';
    if (page === 'college') return '/student/college';
    if (page === 'skills') return '/student/skills';
    if (page === 'skill-graph') return '/student/skill-graph';
    if (page === 'skill-gap') return '/student/skill-gap';
    if (page === 'assessment') return '/student/assessment';
    if (page === 'learning') return '/student/learning';
    if (page === 'learning-progress') return '/student/learning-progress';
    if (page === 'projects') return '/student/projects';
    if (page === 'opportunities') return '/student/opportunities';
    if (page === 'passport') return '/student/passport';
    if (page === 'profile') return '/student/profile';
    if (page === 'settings') return '/student/settings';
    if (page === 'notifications') return '/student/notifications';
    if (page === 'help') return '/student/help';
    if (page === 'search') return '/student/search';
    if (page === 'enroll') return '/student/enroll';
    if (page === 'advanced-tech') return '/student/advanced-tech';
    if (page === 'advanced-tech-deepdive') return '/student/advanced-tech-deepdive';
    if (page === 'communication') return '/student/communication';
    if (page === 'career-readiness') return '/student/career-readiness';
    if (page === 'career-journey') return '/student/career-journey';
    if (page === 'career-copilot') return '/student/career-copilot';
    return '/student/home';
  }

  if (normRole === 'institution') {
    if (page === 'institution-console' || page === 'institution-dashboard') return '/institution/dashboard';
    if (page === 'institution-staff' || page === 'institution-staff-management') return '/institution/staff';
    if (page === 'institution-students') return '/institution/students';
    if (page === 'institution-student-performance') return '/institution/student-performance';
    if (page === 'institution-skill-growth') return '/institution/skill-growth';
    if (page === 'institution-campus-directory') return '/institution/campus-directory';
    if (page === 'institution-management') return '/institution/management';
    if (page === 'institution-placement' || page === 'institution-opportunities-pipeline') return '/institution/opportunities/pipeline';
    if (page === 'institution-candidates' || page === 'institution-opportunities-candidates') return '/institution/opportunities/candidates';
    if (page === 'institution-company-opportunities') return '/institution/opportunities';
    if (page === 'institution-courses' || page === 'institution-learning') return '/institution/learning';
    if (page === 'institution-messages') return '/institution/messages';
    if (page === 'institution-readiness') return '/institution/readiness';
    if (page === 'institution-assessments') return '/institution/assessments';
    if (page === 'institution-skill-intelligence') return '/institution/skill-intelligence';
    if (page === 'institution-skill-analytics') return '/institution/skill-analytics';
    if (page === 'institution-industry-requests') return '/institution/industry-requests';
    if (page === 'institution-company-directory' || page === 'institution-companies') return '/institution/companies';
    if (page === 'institution-company-intelligence') return '/institution/company-intelligence';
    if (page === 'institution-matching') return '/institution/matching';
    if (page === 'institution-skill-gap') return '/institution/skill-gap';
    if (page === 'institution-course-certificates') return '/institution/course-certificates';
    if (page === 'institution-skill-mapping') return '/institution/skill-mapping';
    if (page === 'institution-certificates' || page === 'institution-proofs') return '/institution/proofs';
    if (page === 'institution-recruitment-drives') return '/institution/recruitment-drives';
    if (page === 'institution-analytics') return '/institution/analytics';
    if (page === 'institution-industry-demand') return '/institution/industry-demand';
    if (page === 'institution-skill-trends') return '/institution/skill-trends';
    if (page === 'profile') return '/institution/profile';
    if (page === 'settings') return '/institution/settings';
    if (page === 'notifications') return '/institution/notifications';
    if (page === 'help') return '/institution/help';
    if (page === 'search') return '/institution/search';
    return '/institution/dashboard';
  }

  if (normRole === 'company') {
    if (page === 'industry-portal') {
      if (tab === 'students' || tab === 'talent-search') return '/company/students';
      if (tab === 'access-requests' || tab === 'requests') return '/company/access-requests';
      if (tab === 'authorized-students') return '/company/authorized-students';
      if (tab === 'internships') return '/company/internships';
      if (tab === 'apprenticeships') return '/company/apprenticeships';
      if (tab === 'jobs') return '/company/jobs';
      if (tab === 'opportunities') return '/company/opportunities';
      if (tab === 'applications') return '/company/applications';
      if (tab === 'shortlisted') return '/company/shortlisted';
      if (tab === 'selected' || tab === 'selected-candidates' || tab === 'selected-students') return '/company/selected';
      if (tab === 'colleges' || tab === 'collaboration' || tab === 'collaborations') return '/company/colleges';
      if (tab === 'courses') return '/company/courses';
      if (tab === 'certificates') return '/company/certificates';
      if (tab === 'ai-matching' || tab === 'talent-matching') return '/company/ai-matching';
      if (tab === 'talent-pools') return '/company/talent-pools';
      if (tab === 'analytics') return '/company/analytics';
      if (tab === 'messages') return '/company/messages';
      if (tab === 'dashboard' || tab === 'overview') return '/company/overview';
      return '/company/overview';
    }
    if (page === 'profile') return '/company/settings';
    if (page === 'settings') return '/company/settings';
    if (page === 'notifications') return '/company/overview';
    if (page === 'help') return '/company/overview';
    if (page === 'search') return '/company/students';
    return '/company/overview';
  }

  return '/student/home';
};

export const resolvePath = (pathname, currentUser) => {
  const path = (pathname || '/').toLowerCase().replace(/\/$/, '') || '/';
  const role = currentUser ? normalizeRole(currentUser.role) : null;

  // Unauthenticated / Auth routes
  if (path === '') {
    return { page: 'landing', isAuth: true };
  }
  if (path === '/') {
    return { page: 'landing', isAuth: true };
  }
  if (path === '/role-select' || path === '/auth/select-role' || path === '/login' || path === '/auth' || path === '/auth/login' || path === '/signin' || path === '/auth/signin') {
    return { page: 'role-select', isAuth: true };
  }
  if (path === '/student-login' || path === '/auth/student-login') {
    return { page: 'student-login', isAuth: true };
  }
  if (path === '/institution-login' || path === '/auth/institution-login') {
    return { page: 'institution-login', isAuth: true };
  }
  if (path === '/industry-login' || path === '/company-login' || path === '/auth/company-login') {
    return { page: 'industry-login', isAuth: true };
  }
  if (path === '/academician-login' || path === '/faculty-login' || path === '/auth/academician-login' || path === '/auth/faculty-login' || path === '/academician/login') {
    return { page: 'academician-login', isAuth: true };
  }
  if (path === '/activate') {
    return { page: 'activate', isAuth: true };
  }
  if (path === '/verify-otp' || path === '/auth/verify-otp') {
    return { page: 'verify-otp', isAuth: true };
  }
  if (path === '/forgot-password' || path === '/auth/forgot-password') {
    return { page: 'forgot-password', isAuth: true };
  }
  if (path === '/worker' || path === '/worker-portal') {
    return { page: 'worker-portal' };
  }
  if (path === '/assessor' || path === '/assessor-workspace') {
    return { page: 'assessor-workspace' };
  }
  if (path === '/institution' || path === '/institution-portal') {
    return { page: 'institution-portal' };
  }

  // Public Verification Passport Route (Accessible without auth or with auth)
  if (path.startsWith('/passport/') || path.startsWith('/verify/passport/') || path.startsWith('/public/passport/')) {
    const rawParts = (pathname || '').split('/');
    const pubId = rawParts[rawParts.length - 1];
    return { page: 'public-passport', isAuth: true, publicId: pubId };
  }

  // If user is NOT logged in and attempting to visit any protected route
  if (!currentUser) {
    if (path.startsWith('/academician') || path.startsWith('/faculty')) {
      return { page: 'academician-login', isAuth: true };
    }
    return { page: 'role-select', redirectReason: 'unauthenticated' };
  }

  // Student URL route handling
  if (path.startsWith('/student')) {
    if (role !== 'student') {
      return { page: role === 'academician' ? 'academician-dashboard' : role === 'institution' ? 'institution-console' : 'industry-portal', redirectReason: 'cross-role' };
    }
    if (path === '/student/college' || path === '/my-college') return { page: 'college' };
    if (path === '/student/skills') return { page: 'skills' };
    if (path === '/student/assessment') return { page: 'assessment' };
    if (path === '/student/learning') return { page: 'learning' };
    if (path === '/student/learning-progress') return { page: 'learning-progress' };
    if (path === '/student/projects') return { page: 'projects' };
    if (path === '/student/opportunities') return { page: 'opportunities' };
    if (path === '/student/passport') return { page: 'passport' };
    if (path === '/student/profile') return { page: 'profile' };
    if (path === '/student/settings') return { page: 'settings' };
    if (path === '/student/notifications') return { page: 'notifications' };
    if (path === '/student/help') return { page: 'help' };
    if (path === '/student/search') return { page: 'search' };
    if (path === '/student/enroll') return { page: 'enroll' };
    if (path === '/student/advanced-tech') return { page: 'advanced-tech' };
    if (path === '/student/advanced-tech-deepdive') return { page: 'advanced-tech-deepdive' };
    if (path === '/student/communication' || path === '/communication') return { page: 'communication' };
    if (path === '/student/career-readiness' || path === '/career-readiness') return { page: 'career-readiness' };
    if (path === '/student/career-journey' || path === '/career-journey') return { page: 'career-journey' };
    if (path === '/student/career-copilot' || path === '/career-copilot') return { page: 'career-copilot' };
    return { page: 'home' };
  }

  // Institution URL route handling
  if (path.startsWith('/institution')) {
    if (role !== 'institution') {
      return { page: role === 'academician' ? 'academician-dashboard' : role === 'company' ? 'industry-portal' : 'home', redirectReason: 'cross-role' };
    }
    if (path === '/institution' || path === '/institution/dashboard' || path === '/institution/telemetry') return { page: 'institution-console' };
    if (path === '/institution/staff' || path === '/institution/staff-management') return { page: 'institution-staff' };
    if (path === '/institution/students') return { page: 'institution-students' };
    if (path === '/institution/student-performance') return { page: 'institution-student-performance' };
    if (path === '/institution/skill-growth') return { page: 'institution-skill-growth' };
    if (path === '/institution/campus-directory') return { page: 'institution-campus-directory' };
    if (path === '/institution/management') return { page: 'institution-management' };
    if (path === '/institution/opportunities/pipeline' || path === '/institution/opportunities/application-pipeline' || path === '/institution/pipeline' || path === '/institution/placement') return { page: 'institution-placement' };
    if (path === '/institution/opportunities/candidates' || path === '/institution/opportunities/candidate-list' || path === '/institution/candidates' || path === '/institution/candidate-list') return { page: 'institution-candidates' };
    if (path === '/institution/opportunities/selected-students' || path === '/institution/selected-students' || path === '/institution/selected') return { page: 'institution-selected-students' };
    if (path === '/institution/opportunities') return { page: 'institution-placement' };
    if (path === '/institution/learning' || path === '/institution/courses' || path === '/institution/curriculum' || path === '/institution/enterprise-curriculum' || path === '/institution/course-telemetry') return { page: 'institution-courses' };
    if (path === '/institution/messages') return { page: 'institution-messages' };
    if (path === '/institution/readiness') return { page: 'institution-readiness' };
    if (path === '/institution/skill-intelligence' || path === '/institution/intelligence') return { page: 'institution-skill-intelligence' };
    if (path === '/institution/skill-analytics') return { page: 'institution-skill-analytics' };
    if (path === '/institution/assessments') return { page: 'institution-assessments' };
    if (path === '/institution/industry-requests' || path === '/institution/requests') return { page: 'institution-industry-requests' };
    if (path === '/institution/companies') return { page: 'institution-company-directory' };
    if (path === '/institution/company-intelligence') return { page: 'institution-company-intelligence' };
    if (path === '/institution/company-opportunities') return { page: 'institution-company-opportunities' };
    if (path === '/institution/matching') return { page: 'institution-matching' };
    if (path === '/institution/skill-gap') return { page: 'institution-skill-gap' };
    if (path === '/institution/course-certificates') return { page: 'institution-course-certificates' };
    if (path === '/institution/skill-mapping') return { page: 'institution-skill-mapping' };
    if (path === '/institution/projects' || path === '/institution/project-verification') return { page: 'institution-projects' };
    if (path === '/institution/project-details' || path === '/institution/project-explorer') return { page: 'institution-project-explorer' };
    if (path === '/institution/proofs' || path === '/institution/certificates') return { page: 'institution-proofs' };
    if (path === '/institution/recruitment-drives') return { page: 'institution-recruitment-drives' };
    if (path === '/institution/analytics') return { page: 'institution-analytics' };
    if (path === '/institution/industry-demand') return { page: 'institution-industry-demand' };
    if (path === '/institution/skill-trends') return { page: 'institution-skill-trends' };
    if (path === '/institution/profile') return { page: 'profile' };
    if (path === '/institution/settings') return { page: 'settings' };
    if (path === '/institution/notifications') return { page: 'notifications' };
    if (path === '/institution/help') return { page: 'help' };
    return { page: 'institution-console' };
  }

  // Company URL route handling
  if (path.startsWith('/company')) {
    if (role !== 'company') {
      return { page: role === 'academician' ? 'academician-dashboard' : role === 'institution' ? 'institution-console' : 'home', redirectReason: 'cross-role' };
    }
    if (path.startsWith('/company/students/')) {
      const studentId = path.split('/company/students/')[1];
      return { page: 'industry-portal', companyTab: 'student-profile', studentId, isCompanyRoute: true };
    }
    if (path === '/company/students' || path === '/company/talent-search') return { page: 'industry-portal', companyTab: 'students', isCompanyRoute: true };
    if (path === '/company/access-requests' || path === '/company/requests') return { page: 'industry-portal', companyTab: 'access-requests', isCompanyRoute: true };
    if (path === '/company/authorized-students') return { page: 'industry-portal', companyTab: 'authorized-students', isCompanyRoute: true };
    if (path === '/company/internships') return { page: 'industry-portal', companyTab: 'internships', isCompanyRoute: true };
    if (path === '/company/apprenticeships') return { page: 'industry-portal', companyTab: 'apprenticeships', isCompanyRoute: true };
    if (path === '/company/jobs') return { page: 'industry-portal', companyTab: 'jobs', isCompanyRoute: true };
    if (path === '/company/opportunities') return { page: 'industry-portal', companyTab: 'opportunities', isCompanyRoute: true };
    if (path === '/company/applications') return { page: 'industry-portal', companyTab: 'applications', isCompanyRoute: true };
    if (path === '/company/shortlisted') return { page: 'industry-portal', companyTab: 'shortlisted', isCompanyRoute: true };
    if (path === '/company/selected' || path === '/company/selected-students' || path === '/company/selected-candidates') return { page: 'industry-portal', companyTab: 'selected', isCompanyRoute: true };
    if (path === '/company/colleges' || path === '/company/collaboration' || path === '/company/collaborations' || path === '/company/college-collaboration') return { page: 'industry-portal', companyTab: 'colleges', isCompanyRoute: true };
    if (path === '/company/courses') return { page: 'industry-portal', companyTab: 'courses', isCompanyRoute: true };
    if (path === '/company/certificates') return { page: 'industry-portal', companyTab: 'certificates', isCompanyRoute: true };
    if (path === '/company/assessments') return { page: 'industry-portal', companyTab: 'assessments', isCompanyRoute: true };
    if (path === '/company/projects' || path === '/company/project-explorer') return { page: 'industry-portal', companyTab: 'projects', isCompanyRoute: true };
    if (path === '/company/ai-matching' || path === '/company/talent-matching') return { page: 'industry-portal', companyTab: 'ai-matching', isCompanyRoute: true };
    if (path === '/company/talent-pools') return { page: 'industry-portal', companyTab: 'talent-pools', isCompanyRoute: true };
    if (path === '/company/analytics') return { page: 'industry-portal', companyTab: 'analytics', isCompanyRoute: true };
    if (path === '/company/messages') return { page: 'industry-portal', companyTab: 'messages', isCompanyRoute: true };
    if (path === '/company/overview' || path === '/company/dashboard') return { page: 'industry-portal', companyTab: 'dashboard', isCompanyRoute: true };
    if (path === '/company/settings') return { page: 'settings' };
    if (path === '/company/profile') return { page: 'profile' };
    return { page: 'industry-portal', companyTab: 'dashboard', isCompanyRoute: true };
  }

  // Academician URL route handling
  if (path.startsWith('/academician') || path.startsWith('/faculty')) {
    if (role !== 'academician') {
      return { page: role === 'institution' ? 'institution-console' : role === 'company' ? 'industry-portal' : 'home', redirectReason: 'cross-role' };
    }
    if (path === '/academician' || path === '/academician/dashboard') return { page: 'academician-dashboard' };
    if (path === '/academician/students') return { page: 'academician-students' };
    if (path === '/academician/student-performance') return { page: 'academician-student-performance' };
    if (path.startsWith('/academician/students/') && path.endsWith('/performance')) {
      const parts = path.split('/');
      const studentId = parts[3];
      return { page: 'academician-student-performance-detail', studentId };
    }
    if (path.startsWith('/academician/students/')) {
      const studentId = path.split('/academician/students/')[1];
      return { page: 'academician-student-performance-detail', studentId };
    }
    if (path === '/academician/skill-analytics' || path === '/academician/analytics') return { page: 'academician-skill-analytics' };
    if (path === '/academician/skill-assessments' || path === '/academician/assessments') return { page: 'academician-skill-assessments' };
    if (path === '/academician/skill-assessments/create' || path === '/academician/assessments/create') return { page: 'academician-create-assessment' };
    if (path.startsWith('/academician/skill-assessments/')) {
      const asmtId = path.split('/academician/skill-assessments/')[1];
      return { page: 'academician-assessment-detail', asmtId };
    }
    if (path === '/academician/assessment-results') return { page: 'academician-assessment-results' };
    if (path === '/academician/courses') return { page: 'academician-courses' };
    if (path === '/academician/courses/create') return { page: 'academician-create-course' };
    if (path === '/academician/assigned-courses') return { page: 'academician-assigned-courses' };
    if (path === '/academician/course-progress' || path === '/academician/overall-progress') return { page: 'academician-overall-progress' };
    if (path === '/academician/achievements') return { page: 'academician-achievements' };
    if (path === '/academician/trash') return { page: 'academician-trash' };
    if (path === '/academician/skill-gaps') return { page: 'academician-skill-gaps' };
    if (path === '/academician/industry-requirements') return { page: 'academician-industry-requirements' };
    if (path === '/academician/recommendations') return { page: 'academician-recommendations' };
    if (path === '/academician/mentorship') return { page: 'academician-mentorship' };
    if (path === '/academician/opportunities') return { page: 'academician-opportunities' };
    if (path === '/academician/notifications') return { page: 'academician-notifications' };
    if (path === '/academician/profile') return { page: 'profile' };
    return { page: 'academician-dashboard' };
  }

  // Direct top-level routes (accessible directly via URL bar)
  if (path === '/learning' || path === '/my-learning' || path === '/courses') {
    if (role === 'academician') return { page: 'academician-courses' };
    if (role === 'institution') return { page: 'institution-courses' };
    if (role === 'company') return { page: 'industry-portal', companyTab: 'courses', isCompanyRoute: true };
    return { page: 'learning' };
  }
  if (path === '/skills' || path === '/my-skills') {
    return { page: role === 'academician' ? 'academician-skill-gaps' : role === 'institution' ? 'institution-skill-intelligence' : role === 'company' ? 'industry-portal' : 'skills' };
  }
  if (path === '/skill-graph' || path === '/student/skill-graph') {
    return { page: 'skill-graph' };
  }
  if (path === '/skill-gap' || path === '/student/skill-gap') {
    return { page: 'skill-gap' };
  }
  if (path === '/assessment' || path === '/assessments') {
    return { page: role === 'academician' ? 'academician-assessments' : role === 'institution' ? 'institution-assessments' : role === 'company' ? 'industry-portal' : 'assessment' };
  }
  if (path === '/projects' || path === '/my-projects') {
    return { page: role === 'institution' ? 'institution-projects' : role === 'company' ? 'industry-portal' : 'projects' };
  }
  if (path === '/opportunities') {
    return { page: role === 'academician' ? 'academician-opportunities' : role === 'institution' ? 'institution-placement' : role === 'company' ? 'industry-portal' : 'opportunities' };
  }
  if (path === '/messages') {
    if (role === 'institution') return { page: 'institution-messages' };
    if (role === 'company') return { page: 'industry-portal', companyTab: 'messages', isCompanyRoute: true };
    return { page: 'communication' };
  }
  if (path === '/passport' || path === '/digital-passport') {
    return { page: role === 'institution' ? 'institution-proofs' : role === 'company' ? 'industry-portal' : 'passport' };
  }

  // Direct shared routes (e.g. /profile, /settings, /notifications, /help)
  if (path === '/profile') return { page: role === 'academician' ? 'academician-dashboard' : 'profile' };
  if (path === '/settings') return { page: 'settings' };
  if (path === '/notifications') return { page: role === 'academician' ? 'academician-notifications' : 'notifications' };
  if (path === '/help') return { page: 'help' };
  if (path === '/search') return { page: role === 'academician' ? 'academician-students' : 'search' };

  // Fallback to role-specific dashboard
  return {
    page: role === 'academician' ? 'academician-dashboard' : role === 'institution' ? 'institution-console' : role === 'company' ? 'industry-portal' : 'home'
  };
};

import { authService } from './services/authService';

export default function App() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // 1. Session state initialization from localStorage with role normalization
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('nexus_auth_user');
      if (!savedUser) return null;
      const parsed = JSON.parse(savedUser);
      return {
        ...parsed,
        role: normalizeRole(parsed.role),
        currentRole: normalizeRole(parsed.role),
        userId: parsed.userId || parsed.id || (normalizeRole(parsed.role) === 'institution' ? 'INS001' : normalizeRole(parsed.role) === 'company' ? 'COM001' : 'STU001'),
        currentUserId: parsed.currentUserId || parsed.userId || parsed.id || (normalizeRole(parsed.role) === 'institution' ? 'INS001' : normalizeRole(parsed.role) === 'company' ? 'COM001' : 'STU001')
      };
    } catch {
      return null;
    }
  });

  // Verify session on mount with backend /api/auth/me
  useEffect(() => {
    let isMounted = true;
    async function verifySession() {
      try {
        const res = await authService.getCurrentUser();
        if (!isMounted) return;

        const storedUser = (() => {
          try {
            const saved = localStorage.getItem('nexus_auth_user');
            if (!saved) return null;
            const parsed = JSON.parse(saved);
            return {
              ...parsed,
              role: normalizeRole(parsed.role),
              currentRole: normalizeRole(parsed.role),
              userId: parsed.userId || parsed.id || parsed.studentId || parsed.institutionId || parsed.companyId || 'STU001',
              currentUserId: parsed.currentUserId || parsed.userId || parsed.id || parsed.studentId || parsed.institutionId || parsed.companyId || 'STU001'
            };
          } catch {
            return null;
          }
        })();

        if (res.success && res.user) {
          const normalized = {
            ...res.user,
            role: normalizeRole(res.user.role),
            currentRole: normalizeRole(res.user.role),
            userId: res.user.userId || res.user.id || res.user.studentId || res.user.institutionId || res.user.companyId,
            currentUserId: res.user.currentUserId || res.user.userId || res.user.id || res.user.studentId || res.user.institutionId || res.user.companyId
          };
          setUser(normalized);

          // If currently on an auth page, redirect to the user's portal
          const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
          const authPaths = [
            '/', '/auth/select-role', '/role-select',
            '/student-login', '/auth/student-login',
            '/institution-login', '/auth/institution-login',
            '/industry-login', '/company-login', '/auth/company-login',
            '/academician-login', '/auth/academician-login', '/faculty-login', '/auth/faculty-login', '/academician/login',
            '/verify-otp', '/auth/verify-otp',
            '/forgot-password', '/auth/forgot-password'
          ];
          if (authPaths.includes(path)) {
            const normRole = normalized.role;
            const targetPage = normRole === 'academician' ? 'academician-dashboard' : normRole === 'institution' ? 'institution-console' : normRole === 'company' ? 'industry-portal' : 'home';
            const targetPath = pageToPath(targetPage, normRole);
            setActivePage(targetPage);
            if (normRole === 'company') setCompanyTab('dashboard');
            try { window.history.replaceState(null, '', targetPath); } catch {}
          }
        } else if (storedUser) {
          setUser(storedUser);
          const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
          const authPaths = [
            '/', '/auth/select-role', '/role-select',
            '/student-login', '/auth/student-login',
            '/institution-login', '/auth/institution-login',
            '/industry-login', '/company-login', '/auth/company-login',
            '/academician-login', '/auth/academician-login', '/faculty-login', '/auth/faculty-login', '/academician/login',
            '/verify-otp', '/auth/verify-otp',
            '/forgot-password', '/auth/forgot-password'
          ];
          if (authPaths.includes(path)) {
            const normRole = storedUser.role;
            const targetPage = normRole === 'academician' ? 'academician-dashboard' : normRole === 'institution' ? 'institution-console' : normRole === 'company' ? 'industry-portal' : 'home';
            const targetPath = pageToPath(targetPage, normRole);
            setActivePage(targetPage);
            if (normRole === 'company') setCompanyTab('dashboard');
            try { window.history.replaceState(null, '', targetPath); } catch {}
          }
        } else {
          // Unauthenticated
          setUser(null);
          const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
          if (path.startsWith('/passport/') || path.startsWith('/verify/passport/') || path.startsWith('/public/passport/')) {
            const rawParts = path.split('/');
            const pubId = rawParts[rawParts.length - 1];
            setActivePage('public-passport');
            setSubViewParam(pubId);
            return;
          }
          const authPaths = [
            '/', '/auth/select-role', '/role-select',
            '/student-login', '/auth/student-login',
            '/institution-login', '/auth/institution-login',
            '/industry-login', '/company-login', '/auth/company-login',
            '/academician-login', '/auth/academician-login', '/faculty-login', '/auth/faculty-login', '/academician/login',
            '/verify-otp', '/auth/verify-otp',
            '/forgot-password', '/auth/forgot-password'
          ];
          if (!authPaths.includes(path)) {
            if (path.startsWith('/academician') || path.startsWith('/faculty')) {
              setActivePage('academician-login');
              try { window.history.replaceState(null, '', '/academician/login'); } catch {}
            } else {
              setActivePage('role-select');
              try { window.history.replaceState(null, '', '/auth/select-role'); } catch {}
            }
          }
        }
      } catch (err) {
        console.warn('Session verification error:', err);
      } finally {
        if (isMounted) setIsCheckingSession(false);
      }
    }

    verifySession();
    return () => { isMounted = false; };
  }, []);

  // Listen for live profile updates
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      if (e.detail) {
        setUser(prev => prev ? ({
          ...prev,
          name: e.detail.name || prev.name,
          email: e.detail.email || prev.email,
          avatar: e.detail.avatar || prev.avatar,
          headline: e.detail.desiredRole || prev.headline
        }) : prev);
      }
    };
    window.addEventListener('nexus_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('nexus_profile_updated', handleProfileUpdate);
  }, []);

  // 2. Initial route determination based on URL path and session state
  const [activePage, setActivePage] = useState(() => {
    try {
      const savedUser = localStorage.getItem('nexus_auth_user');
      const parsed = savedUser ? JSON.parse(savedUser) : null;
      const resolved = resolvePath(window.location.pathname, parsed);

      if (resolved.redirectReason === 'cross-role' && parsed) {
        const fallbackPath = pageToPath(resolved.page, parsed.role);
        try { window.history.replaceState(null, '', fallbackPath); } catch {}
      } else if (resolved.redirectReason === 'unauthenticated') {
        try { window.history.replaceState(null, '', '/auth/select-role'); } catch {}
      } else {
        const targetPath = pageToPath(resolved.page, parsed ? parsed.role : null, resolved.companyTab);
        try { window.history.replaceState(null, '', targetPath); } catch {}
      }
      return resolved.page;
    } catch {
      return 'role-select';
    }
  });

  // Active Company Portal Tab state
  const [companyTab, setCompanyTab] = useState(() => {
    try {
      const savedUser = localStorage.getItem('nexus_auth_user');
      const parsed = savedUser ? JSON.parse(savedUser) : null;
      const resolved = resolvePath(window.location.pathname, parsed);
      return resolved.companyTab || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [subViewParam, setSubViewParam] = useState(() => {
    try {
      const savedUser = localStorage.getItem('nexus_auth_user');
      const parsed = savedUser ? JSON.parse(savedUser) : null;
      const resolved = resolvePath(window.location.pathname, parsed);
      return resolved.publicId || resolved.studentId || resolved.asmtId || null;
    } catch {
      return null;
    }
  });

  const [settingsTab, setSettingsTab] = useState(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState(null);
  const [toast, setToast] = useState(null);

  // Handler: open AI modal, optionally with an initial voice/quick query
  const openAIModal = useCallback((message) => {
    setAiInitialMessage(message || null);
    setIsAIModalOpen(true);
  }, []);

  const showToast = useCallback((toastObj) => {
    setToast(toastObj);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  useEffect(() => {
    const handleToastEvt = (e) => {
      if (e.detail) showToast(e.detail);
    };
    window.addEventListener('nexus_show_toast', handleToastEvt);
    return () => window.removeEventListener('nexus_show_toast', handleToastEvt);
  }, [showToast]);

  // 3. Centralized Logout Handler
  const handleLogout = useCallback(async () => {
    const isAcademician = user?.role === 'academician' || user?.role === 'faculty' || window.location.pathname.startsWith('/academician') || window.location.pathname.startsWith('/faculty');
    await authService.logout();
    setUser(null);
    if (isAcademician) {
      setActivePage('academician-login');
      try {
        window.history.pushState({ page: 'academician-login' }, '', '/academician/login');
      } catch {}
      showToast({
        title: 'Signed Out',
        message: 'You have been safely signed out of the Academician portal.',
        type: 'info'
      });
    } else {
      setActivePage('landing');
      try {
        window.history.pushState({ page: 'landing' }, '', '/');
      } catch {}
      showToast({
        title: 'Signed Out',
        message: 'You have been safely signed out. Please choose your sector to log in.',
        type: 'info'
      });
    }
  }, [user, showToast]);


  // 4. Role-based Route Guarded Navigation & URL Synchronization
  const navigateGuarded = useCallback((targetPage, optionalTab) => {
    const authPages = ['landing', 'role-select', 'student-login', 'industry-login', 'institution-login', 'academician-login', 'faculty-login', 'activate', 'verify-otp', 'forgot-password', 'public-passport'];

    // If not authenticated, restrict strictly to auth routes
    if (!user) {
      if (authPages.includes(targetPage)) {
        setActivePage(targetPage);
        const p = pageToPath(targetPage, null);
        try { window.history.pushState({ page: targetPage }, '', p); } catch {}
      } else {
        if (targetPage.startsWith('academician-') || targetPage.startsWith('faculty-')) {
          setActivePage('academician-login');
          try { window.history.pushState({ page: 'academician-login' }, '', '/academician/login'); } catch {}
          return;
        }
        setActivePage('role-select');
        try { window.history.pushState({ page: 'role-select' }, '', '/auth/select-role'); } catch {}
        showToast({
          title: 'Authentication Required',
          message: 'Please choose your sector and log in to access this page.',
          type: 'warning'
        });
      }
      return;
    }

    const normRole = normalizeRole(user.role);
    let effectiveTarget = targetPage;
    let effectiveTab = optionalTab;

    // Normalize cross-role aliases so that 'learning', 'courses', etc. seamlessly map to the user's role
    if (normRole === 'institution') {
      if (effectiveTarget === 'learning' || effectiveTarget === 'courses' || effectiveTarget === 'my-learning' || effectiveTarget === 'institution-learning') {
        effectiveTarget = 'institution-courses';
      } else if (effectiveTarget === 'opportunities' || effectiveTarget === 'pipeline' || effectiveTarget === 'placement') {
        effectiveTarget = 'institution-placement';
      } else if (effectiveTarget === 'candidates' || effectiveTarget === 'candidate-list') {
        effectiveTarget = 'institution-candidates';
      } else if (effectiveTarget === 'messages' || effectiveTarget === 'communication') {
        effectiveTarget = 'institution-messages';
      } else if (effectiveTarget === 'analytics') {
        effectiveTarget = 'institution-analytics';
      } else if (effectiveTarget === 'campus-directory') {
        effectiveTarget = 'institution-campus-directory';
      } else if (effectiveTarget === 'management') {
        effectiveTarget = 'institution-management';
      } else if (effectiveTarget === 'home' || effectiveTarget === 'dashboard') {
        effectiveTarget = 'institution-console';
      }
    } else if (normRole === 'company') {
      if (effectiveTarget === 'learning' || effectiveTarget === 'courses' || effectiveTarget === 'my-learning') {
        effectiveTarget = 'industry-portal';
        effectiveTab = 'courses';
      } else if (effectiveTarget === 'messages' || effectiveTarget === 'communication') {
        effectiveTarget = 'industry-portal';
        effectiveTab = 'messages';
      } else if (effectiveTarget === 'opportunities' || effectiveTarget === 'jobs' || effectiveTarget === 'internships') {
        effectiveTarget = 'industry-portal';
        effectiveTab = 'opportunities';
      } else if (effectiveTarget === 'students' || effectiveTarget === 'talent') {
        effectiveTarget = 'industry-portal';
        effectiveTab = 'students';
      } else if (effectiveTarget === 'home' || effectiveTarget === 'dashboard') {
        effectiveTarget = 'industry-portal';
        effectiveTab = 'dashboard';
      }
    } else if (normRole === 'student') {
      if (effectiveTarget === 'dashboard') {
        effectiveTarget = 'home';
      }
    } else if (normRole === 'academician') {
      if (effectiveTarget === 'learning' || effectiveTarget === 'courses' || effectiveTarget === 'my-learning') {
        effectiveTarget = 'academician-courses';
      } else if (effectiveTarget === 'assessments' || effectiveTarget === 'assessment') {
        effectiveTarget = 'academician-assessments';
      } else if (effectiveTarget === 'skills' || effectiveTarget === 'skill-gaps') {
        effectiveTarget = 'academician-skill-gaps';
      } else if (effectiveTarget === 'students' || effectiveTarget === 'my-students') {
        effectiveTarget = 'academician-students';
      } else if (effectiveTarget === 'opportunities') {
        effectiveTarget = 'academician-opportunities';
      } else if (effectiveTarget === 'analytics') {
        effectiveTarget = 'academician-analytics';
      } else if (effectiveTarget === 'home' || effectiveTarget === 'dashboard') {
        effectiveTarget = 'academician-dashboard';
      }
    }

    // Role-specific route protection
    if (normRole === 'student') {
      const isForbidden = effectiveTarget === 'institution-console' || effectiveTarget === 'industry-portal' || effectiveTarget.startsWith('institution-') || effectiveTarget.startsWith('academician-');
      if (isForbidden) {
        setActivePage('home');
        try { window.history.pushState({ page: 'home' }, '', '/student/home'); } catch {}
        showToast({
          title: 'Access Restricted',
          message: 'Student accounts cannot access Academician, Institutional, or Industry portals.',
          type: 'warning'
        });
        return;
      }
    } else if (normRole === 'company') {
      const isForbidden = effectiveTarget === 'institution-console' || effectiveTarget.startsWith('academician-') || effectiveTarget.startsWith('institution-');
      if (isForbidden) {
        setActivePage('industry-portal');
        try { window.history.pushState({ page: 'industry-portal' }, '', '/company/dashboard'); } catch {}
        showToast({
          title: 'Access Restricted',
          message: 'Industry accounts cannot access Academician portals.',
          type: 'warning'
        });
        return;
      }
    } else if (normRole === 'institution') {
      const isForbidden = effectiveTarget.startsWith('academician-');
      if (isForbidden) {
        setActivePage('institution-console');
        try { window.history.pushState({ page: 'institution-console' }, '', '/institution/dashboard'); } catch {}
        showToast({
          title: 'Access Restricted',
          message: 'Institution accounts cannot access Academician views.',
          type: 'warning'
        });
        return;
      }
    } else if (normRole === 'academician') {
      const isAllowed = effectiveTarget.startsWith('academician-') || [
        'profile', 'settings', 'notifications', 'help', 'search'
      ].includes(effectiveTarget);
      if (!isAllowed) {
        setActivePage('academician-dashboard');
        try { window.history.pushState({ page: 'academician-dashboard' }, '', '/academician/dashboard'); } catch {}
        showToast({
          title: 'Access Restricted',
          message: 'Academician accounts cannot access Student, Institution, or Industry views.',
          type: 'warning'
        });
        return;
      }
    }

    setActivePage(effectiveTarget);
    if (effectiveTarget === 'industry-portal' && effectiveTab) {
      setCompanyTab(effectiveTab);
    }
    if (effectiveTarget === 'settings') {
      setSettingsTab(effectiveTab || null);
    }
    if (effectiveTarget === 'academician-student-performance-detail' || effectiveTarget === 'academician-student-detail' || effectiveTarget === 'academician-assessment-detail') {
      setSubViewParam(effectiveTab || null);
    }
    if (effectiveTarget === 'public-passport') {
      setSubViewParam(effectiveTab || null);
    }
    const targetPath = pageToPath(effectiveTarget, normRole, effectiveTab);
    try {
      window.history.pushState({ page: effectiveTarget, tab: effectiveTab }, '', targetPath);
    } catch {}
  }, [user, showToast]);

  // Handle Browser Back / Forward Button Navigation
  useEffect(() => {
    const handlePopState = () => {
      const resolved = resolvePath(window.location.pathname, user);
      if (resolved.redirectReason === 'cross-role') {
        const fallbackPath = pageToPath(resolved.page, user?.role);
        try { window.history.replaceState(null, '', fallbackPath); } catch {}
        setActivePage(resolved.page);
        showToast({
          title: 'Access Restricted',
          message: 'You do not have permission to access that area.',
          type: 'warning'
        });
      } else if (resolved.redirectReason === 'unauthenticated') {
        try { window.history.replaceState(null, '', '/auth/select-role'); } catch {}
        setActivePage('role-select');
        showToast({
          title: 'Authentication Required',
          message: 'Please sign in to continue.',
          type: 'warning'
        });
      } else {
        setActivePage(resolved.page);
        if (resolved.companyTab) {
          setCompanyTab(resolved.companyTab);
        }
        if (resolved.publicId) {
          setSubViewParam(resolved.publicId);
        } else if (resolved.studentId) {
          setSubViewParam(resolved.studentId);
        } else if (resolved.asmtId) {
          setSubViewParam(resolved.asmtId);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, showToast]);

  const [demoCredsPrefill, setDemoCredsPrefill] = useState(null);

  // Handle Sector Card Selection
  const handleRoleSelect = (roleId, prefill = null) => {
    setDemoCredsPrefill(prefill);
    if (roleId === 'student') navigateGuarded('student-login');
    else if (roleId === 'institution') navigateGuarded('institution-login');
    else if (roleId === 'industry' || roleId === 'company') navigateGuarded('industry-login');
    else if (roleId === 'faculty' || roleId === 'academician') navigateGuarded('academician-login');
  };

  // Handle Successful Login across all sectors
  const handleLoginSuccess = (loggedInUser) => {
    const normalizedUser = {
      ...loggedInUser,
      role: normalizeRole(loggedInUser.role),
      currentRole: normalizeRole(loggedInUser.role),
      userId: loggedInUser.userId || loggedInUser.id || (normalizeRole(loggedInUser.role) === 'institution' ? 'INS001' : normalizeRole(loggedInUser.role) === 'company' ? 'COM001' : normalizeRole(loggedInUser.role) === 'academician' ? 'FAC001' : 'STU001'),
      currentUserId: loggedInUser.currentUserId || loggedInUser.userId || loggedInUser.id || (normalizeRole(loggedInUser.role) === 'institution' ? 'INS001' : normalizeRole(loggedInUser.role) === 'company' ? 'COM001' : normalizeRole(loggedInUser.role) === 'academician' ? 'FAC001' : 'STU001')
    };

    try {
      localStorage.setItem('nexus_auth_user', JSON.stringify(normalizedUser));
    } catch (err) {
      console.error('Error saving session:', err);
    }
    setUser(normalizedUser);

    const normRole = normalizedUser.role;
    const targetPage = normRole === 'academician' ? 'assessor-workspace' : normRole === 'institution' ? 'institution-portal' : normRole === 'company' ? 'industry-portal' : 'worker-portal';
    const targetPath = pageToPath(targetPage, normRole);

    setActivePage(targetPage);
    if (normRole === 'company') setCompanyTab('dashboard');
    try {
      window.history.pushState({ page: targetPage }, '', targetPath);
    } catch {}

    showToast({
      title: 'Signed in successfully.',
      message: `Welcome back to SkillWorth, ${normalizedUser.name || 'User'}!`,
      type: 'success'
    });
  };

  const handleLandingLogin = async (email, password, role) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    const data = await res.json();
    if (data.success && data.user) {
      if (data.token) {
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('token', data.token);
      }
      handleLoginSuccess(data.user);
    } else {
      throw new Error(data.message || 'Login failed');
    }
  };

  // Dedicated OTP Page & Forgot Password State
  const [otpParams, setOtpParams] = useState(() => {
    try {
      const saved = sessionStorage.getItem('nexus_otp_params');
      return saved ? JSON.parse(saved) : { email: '', role: 'student', purpose: 'ACCOUNT_VERIFICATION', demoOtp: '' };
    } catch {
      return { email: '', role: 'student', purpose: 'ACCOUNT_VERIFICATION', demoOtp: '' };
    }
  });
  const [forgotRole, setForgotRole] = useState('student');

  const handleNavigateToOtp = useCallback((params) => {
    if (params) {
      setOtpParams(params);
      try { sessionStorage.setItem('nexus_otp_params', JSON.stringify(params)); } catch {}
    }
    setActivePage('verify-otp');
    try { window.history.pushState({ page: 'verify-otp' }, '', '/auth/verify-otp'); } catch {}
  }, []);

  const handleNavigateToForgot = useCallback((role = 'student') => {
    setForgotRole(role);
    setActivePage('forgot-password');
    try { window.history.pushState({ page: 'forgot-password' }, '', '/auth/forgot-password'); } catch {}
  }, []);

  // Check if current view is a full-screen unauthenticated/login view or dedicated Stitch portal
  const isAuthPage = ['landing', 'role-select', 'student-login', 'industry-login', 'institution-login', 'academician-login', 'activate', 'verify-otp', 'forgot-password', 'public-passport', 'worker-portal', 'assessor-workspace', 'institution-portal'].includes(activePage);

  if (isCheckingSession) {
    return (
      <div className="bg-surface" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            border: '3px solid rgba(23, 107, 104, 0.2)',
            borderTopColor: '#176B68',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', color: '#65727A', textTransform: 'uppercase' }}>
            Verifying SkillWorth Registry State...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface w-full">
      {isAuthPage ? (
        <main style={{ position: 'relative', zIndex: 10, flex: 1, overflowY: 'auto', height: '100%', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
          {activePage === 'landing' && (
            <LandingPage
              onNavigate={navigateGuarded}
              onLogin={handleLandingLogin}
              onGetStarted={() => navigateGuarded('role-select')}
              onSelectRole={handleRoleSelect}
            />
          )}
          {activePage === 'worker-portal' && (
            <WorkerPortal user={user} onNavigate={navigateGuarded} onLogout={handleLogout} />
          )}
          {activePage === 'assessor-workspace' && (
            <AssessorWorkspace user={user} onNavigate={navigateGuarded} onLogout={handleLogout} />
          )}
          {activePage === 'institution-portal' && (
            <InstitutionPortal user={user} onNavigate={navigateGuarded} onLogout={handleLogout} />
          )}
          {activePage === 'role-select' && (
            <RoleGateway
              onSelectRole={handleRoleSelect}
              onBackToLanding={() => navigateGuarded('landing')}
              onShowToast={showToast}
            />
          )}
          {activePage === 'student-login' && (
            <StudentLogin 
              onLoginSuccess={handleLoginSuccess}
              onBackToRoles={() => navigateGuarded('role-select')} 
              onNavigateToOtp={handleNavigateToOtp}
              onNavigateToForgot={() => handleNavigateToForgot('student')}
              prefillCredentials={demoCredsPrefill}
              onSelectRole={handleRoleSelect}
              onShowToast={showToast}
            />
          )}
          {activePage === 'institution-login' && (
            <InstitutionLogin 
              onLoginSuccess={handleLoginSuccess}
              onBackToRoles={() => navigateGuarded('role-select')} 
              onNavigateToOtp={handleNavigateToOtp}
              onNavigateToForgot={() => handleNavigateToForgot('institution')}
              prefillCredentials={demoCredsPrefill}
              onSelectRole={handleRoleSelect}
              onShowToast={showToast}
            />
          )}
          {activePage === 'industry-login' && (
            <IndustryLogin 
              onLoginSuccess={handleLoginSuccess}
              onBackToRoles={() => navigateGuarded('role-select')} 
              onNavigateToOtp={handleNavigateToOtp}
              onNavigateToForgot={() => handleNavigateToForgot('company')}
              prefillCredentials={demoCredsPrefill}
              onSelectRole={handleRoleSelect}
              onShowToast={showToast}
            />
          )}
          {activePage === 'academician-login' && (
            <AcademicianLogin 
              onLoginSuccess={handleLoginSuccess}
              onBackToRoles={() => navigateGuarded('role-select')} 
              prefillCredentials={demoCredsPrefill}
              onSelectRole={handleRoleSelect}
              onShowToast={showToast}
            />
          )}
          {activePage === 'activate' && (
            <StudentActivation />
          )}
          {activePage === 'verify-otp' && (
            <OtpVerificationPage
              email={otpParams.email}
              role={otpParams.role}
              purpose={otpParams.purpose}
              initialOtp={otpParams.demoOtp}
              onNavigate={(targetPage, params) => {
                if (params) {
                  setOtpParams(params);
                  try { sessionStorage.setItem('nexus_otp_params', JSON.stringify(params)); } catch {}
                }
                navigateGuarded(targetPage);
              }}
            />
          )}
          {activePage === 'forgot-password' && (
            <ForgotPasswordPage
              role={forgotRole}
              onNavigate={navigateGuarded}
              onOtpSent={handleNavigateToOtp}
            />
          )}
          {activePage === 'public-passport' && (
            <PublicPassportView
              publicId={subViewParam || window.location.pathname.split('/').pop()}
              onShowToast={showToast}
            />
          )}
        </main>
      ) : (
        <div className={`app-layout portal-${normalizeRole(user?.role)}`}>
          {/* Left Cyber Sidebar */}
          <Sidebar 
            activePage={activePage} 
            setActivePage={navigateGuarded} 
            user={user} 
            onLogout={handleLogout}
            companyTab={companyTab}
          />

          {/* Main Content Area */}
          <div className="main-content-wrapper">
            {/* Top Navigation Bar */}
            <Navbar 
              onOpenAIModal={() => openAIModal()}
              activePage={activePage}
              setActivePage={navigateGuarded}
              user={user}
              onLogout={handleLogout}
            />

            {/* Viewport Render matching role dashboards */}
            <main className="main-viewport" style={activePage === 'home' || activePage === 'industry-portal' ? { padding: 0, maxWidth: 'none' } : {}}>
              {/* Student Workspace */}
              {activePage === 'home' && normalizeRole(user?.role) === 'student' && (
                <ErrorBoundary title="Student Home">
                <StudentDashboard setActivePage={navigateGuarded} onShowToast={showToast} user={user} onOpenAIModal={() => openAIModal()} />
              </ErrorBoundary>
              )}
              {activePage === 'college' && (
                <StudentCollegePage setActivePage={navigateGuarded} onShowToast={showToast} user={user} />
              )}
              {activePage === 'skills' && normalizeRole(user?.role) === 'student' && (
                <MySkills setActivePage={navigateGuarded} onShowToast={showToast} user={user} />
              )}
              {activePage === 'skill-graph' && (
                <SkillGraph setActivePage={navigateGuarded} onShowToast={showToast} user={user} />
              )}
              {activePage === 'skill-gap' && (
                <SkillGapAnalysis setActivePage={navigateGuarded} onShowToast={showToast} user={user} />
              )}
              {activePage === 'assessment' && (
                <SkillAssessment setActivePage={navigateGuarded} onShowToast={showToast} />
              )}
              {activePage === 'learning' && normalizeRole(user?.role) === 'student' && (
                <MyLearning setActivePage={navigateGuarded} onShowToast={showToast} user={user} />
              )}
              {activePage === 'learning-progress' && (
                <LearningProgressAnalytics setActivePage={navigateGuarded} onShowToast={showToast} user={user} />
              )}
              {activePage === 'advanced-tech' && (
                <AdvancedTech setActivePage={navigateGuarded} />
              )}
              {activePage === 'advanced-tech-deepdive' && (
                <TechDeepDive setActivePage={navigateGuarded} />
              )}
              {activePage === 'enroll' && (
                <CourseEnrollment setActivePage={navigateGuarded} onShowToast={showToast} user={user} />
              )}
              {activePage === 'communication' && (
                <CommunicationLearning setActivePage={navigateGuarded} user={user} onShowToast={showToast} />
              )}
              {activePage === 'projects' && (
                <MyProjects onShowToast={showToast} user={user} />
              )}
              {activePage === 'opportunities' && normalizeRole(user?.role) === 'student' && (
                <Opportunities onShowToast={showToast} onOpenAIModal={() => setIsAIModalOpen(true)} user={user} />
              )}
              {activePage === 'passport' && (
                <DigitalPassport onShowToast={showToast} user={user} />
              )}
              {activePage === 'public-passport' && (
                <PublicPassportView
                  publicId={subViewParam || window.location.pathname.split('/').pop()}
                  onShowToast={showToast}
                />
              )}
              {activePage === 'career-copilot' && (
                <CareerCopilot setActivePage={navigateGuarded} onShowToast={showToast} user={user} />
              )}
              {activePage === 'career-readiness' && (
                <CareerReadiness setActivePage={navigateGuarded} onShowToast={showToast} user={user} />
              )}
              {activePage === 'career-journey' && (
                <CareerJourney setActivePage={navigateGuarded} onShowToast={showToast} user={user} />
              )}
              {activePage === 'profile' && (
                <MyProfile setActivePage={navigateGuarded} onShowToast={showToast} user={user} />
              )}
              {activePage === 'settings' && (
                <Settings setActivePage={navigateGuarded} onShowToast={showToast} user={user} initialTab={settingsTab} />
              )}
              {activePage === 'help' && (
                <HelpCenter onShowToast={showToast} user={user} />
              )}
              {activePage === 'notifications' && (
                <Notifications setActivePage={navigateGuarded} onShowToast={showToast} user={user} />
              )}
              {activePage === 'search' && (
                <SearchResults setActivePage={navigateGuarded} />
              )}

              {/* Institution Workspace */}
              {(activePage.startsWith('institution-') || (normalizeRole(user?.role) === 'institution' && (
                ['learning', 'courses', 'opportunities', 'messages', 'analytics', 'skills', 'skill-intelligence', 'skill-analytics', 'skill-gap', 'skill-growth', 'readiness', 'students', 'candidates', 'projects', 'certificates'].includes(activePage)
              ))) && (
                <ErrorBoundary
                  title="Institution Console"
                  onReset={() => navigateGuarded('institution-console')}
                  onNavigateHome={() => navigateGuarded('institution-console')}
                >
                  <InstitutionConsole 
                    setActivePage={navigateGuarded}
                    activePage={
                      activePage === 'learning' || activePage === 'courses' ? 'institution-courses' :
                      activePage === 'opportunities' ? 'institution-placement' :
                      activePage === 'messages' ? 'institution-messages' :
                      activePage === 'analytics' ? 'institution-analytics' :
                      activePage === 'skills' || activePage === 'skill-intelligence' ? 'institution-skill-intelligence' :
                      activePage === 'skill-analytics' ? 'institution-skill-analytics' :
                      activePage === 'skill-gap' ? 'institution-skill-gap' :
                      activePage === 'skill-growth' ? 'institution-skill-growth' :
                      activePage === 'readiness' ? 'institution-readiness' :
                      activePage === 'students' ? 'institution-students' :
                      activePage === 'candidates' ? 'institution-candidates' :
                      activePage === 'projects' ? 'institution-projects' :
                      activePage === 'certificates' ? 'institution-certificates' :
                      activePage
                    }
                    user={user} 
                    onShowToast={showToast} 
                    onLogout={handleLogout}
                  />
                </ErrorBoundary>
              )}

              {/* Industry / Company Workspace */}
              {(activePage === 'industry-portal' || (normalizeRole(user?.role) === 'company' && (activePage === 'learning' || activePage === 'courses' || activePage === 'opportunities' || activePage === 'messages'))) && (
                <IndustryPortal 
                  setActivePage={navigateGuarded} 
                  onShowToast={showToast} 
                  onLogout={handleLogout}
                  user={user}
                  initialTab={activePage === 'learning' || activePage === 'courses' ? 'courses' : activePage === 'opportunities' ? 'opportunities' : activePage === 'messages' ? 'messages' : companyTab}
                  isEmbedded={true}
                />
              )}

              {/* Academician / Faculty Workspace */}
              {(activePage.startsWith('academician-') || (normalizeRole(user?.role) === 'academician' && (activePage === 'home' || activePage === 'dashboard' || activePage === 'notifications' || activePage === 'profile' || activePage === 'settings'))) && (
                <AcademicianPortal 
                  activePage={activePage}
                  setActivePage={navigateGuarded}
                  user={user}
                  onShowToast={showToast}
                  onLogout={handleLogout}
                  subViewParam={subViewParam}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Global Interactive "Ask Nexus AI" Companion Drawer */}
      <NexusAIModal 
        isOpen={isAIModalOpen}
        onClose={() => { setIsAIModalOpen(false); setAiInitialMessage(null); }}
        setActivePage={navigateGuarded}
        initialMessage={aiInitialMessage}
      />

      {/* Skill Nexus AI — WhatsApp Meta AI-style Floating Button (only when authenticated) */}
      {user && !isAuthPage && (
        <SkillNexusFAB
          onOpenAI={openAIModal}
          onVoiceQuery={(text) => openAIModal(text)}
        />
      )}

      {/* High-Tech Toast Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
