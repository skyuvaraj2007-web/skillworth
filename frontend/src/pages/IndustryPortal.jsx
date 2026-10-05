import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '../components/company/CompanyPortal.css';
import {
  Users,
  Brain,
  UserCheck,
  Layers,
  User,
  Building,
  ShieldCheck,
  Briefcase,
  Building2,
  Target,
  FileText,
  Award,
  BookOpen,
  FolderGit2
} from 'lucide-react';
import HorizontalPageTabs from '../components/navigation/HorizontalPageTabs';
import ProjectDetailsExplorer from '../components/common/ProjectDetailsExplorer';

// Subcomponents
import CompanySidebar from '../components/company/CompanySidebar';
import CompanyNavbar from '../components/company/CompanyNavbar';
import CompanyDashboard from '../components/company/CompanyDashboard';
import CompanyTalentSearch from '../components/company/CompanyTalentSearch';
import CompanyStudentProfile from '../components/company/CompanyStudentProfile';
import CompanyOpportunities from '../components/company/CompanyOpportunities';
import CompanyApplications from '../components/company/CompanyApplications';
import CompanyAIMatching from '../components/company/CompanyAIMatching';
import CompanyTalentPools from '../components/company/CompanyTalentPools';
import CompanyAnalytics from '../components/company/CompanyAnalytics';
import CompanyMessages from '../components/company/CompanyMessages';
import CompanyColleges from '../components/company/CompanyColleges';
import CompanyCollegeCollaboration from '../components/company/CompanyCollegeCollaboration';
import CompanySelectedCandidates from '../components/company/CompanySelectedCandidates';
import CompanyCourses from '../components/company/CompanyCourses';
import CompanyCertificates from '../components/company/CompanyCertificates';
import CompanySettings from '../components/company/CompanySettings';
import CompanyCompareModal from '../components/company/CompanyCompareModal';
import CompanyInviteModal from '../components/company/CompanyInviteModal';
import CompanyStudentAccessRequests from '../components/company/CompanyStudentAccessRequests';
import CompanyAuthorizedStudents from '../components/company/CompanyAuthorizedStudents';
import CompanyTargetedAssessments from '../components/company/CompanyTargetedAssessments';
import CompanyLearningAssessments from '../components/company/CompanyLearningAssessments';

// Relational Services & Data Store
import {
  getAllCompanyOpportunities,
  getAllApplications,
  createCompanyOpportunity,
  updateCompanyOpportunity,
  closeCompanyOpportunity,
  deleteCompanyOpportunity,
  advanceApplicationStage,
  calculateNexusExplainableMatch,
  syncWithBackendDatabase
} from '../services/nexusDataStore';
import { nexusApiClient } from '../services/nexusApiClient';

export default function IndustryPortal({
  setActivePage,
  onShowToast,
  onLogout,
  user,
  initialTab = 'dashboard',
  isEmbedded = false
}) {
  // Normalize company identification for Data Isolation
  const currentCompanyId = user?.companyId || user?.userId || user?.id || '';
  const companyName = user?.companyName || user?.company || user?.name || 'Enterprise Portal';

  // Active Tab state
  const [activeTab, setActiveTab] = useState(() => {
    // Check current pathname for deep linking
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/company/students/')) return 'student-profile';
    if (path.includes('/company/students') || path.includes('/company/talent-search')) return 'students';
    if (path.includes('/company/internships')) return 'internships';
    if (path.includes('/company/apprenticeships')) return 'apprenticeships';
    if (path.includes('/company/jobs')) return 'jobs';
    if (path.includes('/company/opportunities')) return 'opportunities';
    if (path.includes('/company/applications')) return 'applications';
    if (path.includes('/company/shortlisted')) return 'shortlisted';
    if (path.includes('/company/selected') || path.includes('/company/selected-students') || path.includes('/company/selected-candidates')) return 'selected';
    if (path.includes('/company/colleges') || path.includes('/company/collaboration') || path.includes('/company/collaborations') || path.includes('/company/college-collaboration')) return 'colleges';
    if (path.includes('/company/assessments')) return 'assessments';
    if (path.includes('/company/learning-assessments') || path.includes('/company/learning/assessments') || path.includes('/company/student-assessments')) return 'learning-assessments';
    if (path.includes('/company/courses')) return 'courses';
    if (path.includes('/company/projects') || path.includes('/company/project-explorer')) return 'projects';
    if (path.includes('/company/certificates')) return 'certificates';
    if (path.includes('/company/ai-matching') || path.includes('/company/talent-matching')) return 'ai-matching';
    if (path.includes('/company/talent-pools')) return 'talent-pools';
    if (path.includes('/company/analytics')) return 'analytics';
    if (path.includes('/company/messages')) return 'messages';
    if (path.includes('/company/settings') || path.includes('/company/profile')) return 'settings';
    return initialTab || 'dashboard';
  });

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Student Profile State (for /company/students/:studentId)
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Search Filter propagation from Dashboard -> Talent Search
  const [searchFilterPreset, setSearchFilterPreset] = useState({});

  // Shortlisted Student IDs (persisted)
  const [shortlistedIds, setShortlistedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`nexus_shortlisted_${currentCompanyId}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Modals state
  const [compareList, setCompareList] = useState([]);
  const [inviteCandidate, setInviteCandidate] = useState(null);
  const [dataVersion, setDataVersion] = useState(0);

  // ════════════════════════════════════════════════════════════════
  // DATA ISOLATION & LIVE RELATIONAL QUERIES (POSTGRESQL-BACKED)
  // ════════════════════════════════════════════════════════════════
  const [candidates, setCandidates] = useState([]);
  const [companyOpportunities, setCompanyOpportunities] = useState([]);
  const [companyApplications, setCompanyApplications] = useState([]);
  const [companyPartnerships, setCompanyPartnerships] = useState([]);

  // Reactive Event Listeners for Relational Sync
  useEffect(() => {
    const handleUpdate = () => setDataVersion(v => v + 1);
    window.addEventListener('nexus_opportunity_created', handleUpdate);
    window.addEventListener('nexus_application_created', handleUpdate);
    window.addEventListener('nexus_application_stage_changed', handleUpdate);
    window.addEventListener('nexus_students_updated', handleUpdate);
    window.addEventListener('nexus_data_updated', handleUpdate);
    return () => {
      window.removeEventListener('nexus_opportunity_created', handleUpdate);
      window.removeEventListener('nexus_application_created', handleUpdate);
      window.removeEventListener('nexus_application_stage_changed', handleUpdate);
      window.removeEventListener('nexus_students_updated', handleUpdate);
      window.removeEventListener('nexus_data_updated', handleUpdate);
    };
  }, []);

  // Browser History & URL Synchronization
  const handleTabChange = useCallback((tabId, studentId = null) => {
    setActiveTab(tabId);
    let targetPath = `/company/${tabId}`;

    if (tabId === 'dashboard' || tabId === 'overview') targetPath = '/company/overview';
    if (tabId === 'student-profile' && studentId) targetPath = `/company/students/${studentId}`;

    try {
      window.history.pushState({ tab: tabId, studentId }, '', targetPath);
    } catch {}

    if (setActivePage) {
      setActivePage('industry-portal', tabId);
    }
  }, [setActivePage]);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = (e) => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/company/students/')) {
        const id = path.split('/company/students/')[1];
        const found = candidates.find(s => s.studentId === id || s.id === id || (s.name && s.name.toLowerCase().replace(/\s+/g, '-') === id));
        if (found) {
          setSelectedStudent(found);
          setActiveTab('student-profile');
        }
      } else if (path.includes('/company/students')) {
        setActiveTab('students');
      } else if (path.includes('/company/internships')) {
        setActiveTab('internships');
      } else if (path.includes('/company/apprenticeships')) {
        setActiveTab('apprenticeships');
      } else if (path.includes('/company/jobs')) {
        setActiveTab('jobs');
      } else if (path.includes('/company/opportunities')) {
        setActiveTab('opportunities');
      } else if (path.includes('/company/applications')) {
        setActiveTab('applications');
      } else if (path.includes('/company/shortlisted')) {
        setActiveTab('shortlisted');
      } else if (path.includes('/company/selected') || path.includes('/company/selected-candidates') || path.includes('/company/selected-students')) {
        setActiveTab('selected');
      } else if (path.includes('/company/colleges') || path.includes('/company/collaboration') || path.includes('/company/collaborations')) {
        setActiveTab('colleges');
      } else if (path.includes('/company/access-requests') || path.includes('/company/requests')) {
        setActiveTab('access-requests');
      } else if (path.includes('/company/authorized-students')) {
        setActiveTab('authorized-students');
      } else if (path.includes('/company/assessments')) {
        setActiveTab('assessments');
      } else if (path.includes('/company/learning-assessments') || path.includes('/company/student-assessments')) {
        setActiveTab('learning-assessments');
      } else if (path.includes('/company/courses')) {
        setActiveTab('courses');
      } else if (path.includes('/company/certificates')) {
        setActiveTab('certificates');
      } else if (path.includes('/company/ai-matching') || path.includes('/company/talent-matching')) {
        setActiveTab('ai-matching');
      } else if (path.includes('/company/talent-pools')) {
        setActiveTab('talent-pools');
      } else if (path.includes('/company/analytics')) {
        setActiveTab('analytics');
      } else if (path.includes('/company/messages')) {
        setActiveTab('messages');
      } else if (path.includes('/company/settings')) {
        setActiveTab('settings');
      } else {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [candidates]);

  useEffect(() => {
    let isMounted = true;
    const fetchCompanyData = async () => {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      try {
        const [candRes, oppRes, appRes, partRes] = await Promise.all([
          fetch(`${apiBase}/company/candidates`, { headers, credentials: 'include' }).catch(() => null),
          fetch(`${apiBase}/company/opportunities`, { headers, credentials: 'include' }).catch(() => null),
          fetch(`${apiBase}/company/applications`, { headers, credentials: 'include' }).catch(() => null),
          fetch(`${apiBase}/company/partnerships`, { headers, credentials: 'include' }).catch(() => null)
        ]);

        if (isMounted) {
          if (candRes && candRes.ok) {
            const json = await candRes.json();
            if (Array.isArray(json.data)) setCandidates(json.data);
          }
          if (oppRes && oppRes.ok) {
            const json = await oppRes.json();
            if (Array.isArray(json.data)) setCompanyOpportunities(json.data);
          }
          if (appRes && appRes.ok) {
            const json = await appRes.json();
            if (Array.isArray(json.data)) setCompanyApplications(json.data);
          }
          if (partRes && partRes.ok) {
            const json = await partRes.json();
            if (Array.isArray(json.data)) setCompanyPartnerships(json.data);
          }
        }
      } catch (err) {
        console.warn('[IndustryPortal] fetch error:', err);
      }
    };

    fetchCompanyData();
    return () => { isMounted = false; };
  }, [dataVersion, currentCompanyId]);

  // 1. Authorized Candidates (Applied or Shared)
  const students = useMemo(() => {
    return candidates;
  }, [candidates]);

  // 2. Company-Scoped Opportunities
  const opportunities = useMemo(() => {
    return companyOpportunities;
  }, [companyOpportunities]);

  // 3. Company-Scoped Applications
  const applications = useMemo(() => {
    return companyApplications;
  }, [companyApplications]);

  // Handle Shortlist toggle
  const handleToggleShortlist = useCallback((studentId) => {
    setShortlistedIds(prev => {
      const next = new Set(prev);
      const student = students.find(s => s.studentId === studentId);
      const studentName = student ? student.name : 'Candidate';

      if (next.has(studentId)) {
        next.delete(studentId);
        if (onShowToast) {
          onShowToast({
            title: 'Removed from Shortlist',
            message: `${studentName} was removed from your shortlisted queue.`,
            type: 'info'
          });
        }
      } else {
        next.add(studentId);
        if (onShowToast) {
          onShowToast({
            title: 'Candidate Shortlisted',
            message: `${studentName} has been added to your priority talent pipeline.`,
            type: 'success'
          });
        }
      }

      try {
        localStorage.setItem(`nexus_shortlisted_${currentCompanyId}`, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, [students, currentCompanyId, onShowToast]);

  // Handle Opportunity Creation
  const handleCreateOpportunity = useCallback((newOpp) => {
    createCompanyOpportunity({
      ...newOpp,
      companyId: currentCompanyId,
      companyName: companyName
    });
  }, [currentCompanyId, companyName]);

  // Handle Application Stage Progression
  const handleStageChange = useCallback((appId, nextStage) => {
    advanceApplicationStage(appId, nextStage);
    setCompanyApplications(prev => prev.map(a => 
      (a.applicationId === appId || a.id === appId) ? { ...a, stage: nextStage, current_stage: nextStage, status: nextStage } : a
    ));
  }, []);

  // Student Profile click
  const handleSelectStudent = useCallback((student) => {
    setSelectedStudent(student);
    handleTabChange('student-profile', student.studentId);
  }, [handleTabChange]);

  // Candidate Contact -> Messages
  const handleContactStudent = useCallback((student) => {
    setSelectedStudent(student);
    handleTabChange('messages');
  }, [handleTabChange]);

  // Direct Fast-Track Invite Dispatch
  const handleSendInvite = useCallback((student, opp, note) => {
    if (onShowToast) {
      onShowToast({
        title: 'Invitation Dispatched',
        message: `Fast-track invitation for "${opp?.title || 'Engineering Role'}" transmitted to ${student.name}.`,
        type: 'success'
      });
    }
  }, [onShowToast]);

  const talentTabs = useMemo(() => {
    const base = [
      { id: 'students', label: 'Candidate Pool', icon: Users },
      { id: 'ai-matching', label: 'AI Talent Match', icon: Brain, badge: 'AI' },
      { id: 'authorized-students', label: 'Authorized Candidates', icon: UserCheck },
      { id: 'talent-pools', label: 'Saved Pipelines', icon: Layers },
      { id: 'project-explorer', label: 'Student Projects', icon: FolderGit2 }
    ];
    if (activeTab === 'student-profile') {
      base.push({ id: 'student-profile', label: 'Candidate Profile', icon: User });
    }
    return base;
  }, [activeTab]);

  const institutionTabs = useMemo(() => [
    { id: 'colleges', label: 'College Collaboration Hub', icon: Building2, badge: 'Partners' },
    { id: 'access-requests', label: 'Student Access Requests', icon: ShieldCheck },
    { id: 'authorized-students', label: 'Authorized Cohorts', icon: UserCheck }
  ], []);

  const opportunityTabs = useMemo(() => [
    { id: 'opportunities', label: 'All Postings', icon: Briefcase },
    { id: 'jobs', label: 'Job Positions', icon: Building2 },
    { id: 'internships', label: 'Internships & Trainees', icon: Target },
    { id: 'applications', label: 'Application Pipeline', icon: FileText, badge: companyApplications.length > 0 ? String(companyApplications.length) : undefined },
    { id: 'shortlisted', label: 'Shortlisted Candidates', icon: Award },
    { id: 'selected', label: 'Selected Candidates', icon: UserCheck, badge: 'Offers' }
  ], [companyApplications.length]);

  const learningTabs = useMemo(() => [
    { id: 'courses', label: 'Sponsored Courses', icon: BookOpen },
    { id: 'learning-assessments', label: 'Selected Students & Assessments', icon: Award, badge: 'Tests' },
    { id: 'certificates', label: 'Verified Certificates', icon: Award }
  ], []);

  const isTalentGroup = ['students', 'talent-search', 'student-profile', 'ai-matching', 'talent-pools', 'project-explorer'].includes(activeTab);
  const isInstitutionGroup = ['colleges', 'collaboration', 'collaborations', 'access-requests', 'requests', 'authorized-students'].includes(activeTab);
  const isOpportunityGroup = ['opportunities', 'jobs', 'internships', 'apprenticeships', 'applications', 'shortlisted', 'selected', 'selected-candidates', 'selected-students'].includes(activeTab);
  const isLearningGroup = ['courses', 'certificates', 'learning-assessments'].includes(activeTab);

  const renderScreenContent = () => (
    <>
      {/* ── WORKSPACE HORIZONTAL NAVIGATION BARS ── */}
      {isTalentGroup && (
        <HorizontalPageTabs
          tabs={talentTabs}
          activeTab={activeTab === 'talent-search' ? 'students' : activeTab}
          onTabChange={(tabId) => {
            if (tabId === 'student-profile' && !selectedStudent && students.length > 0) {
              setSelectedStudent(students[0]);
            }
            handleTabChange(tabId);
          }}
          ariaLabel="Talent Sub-Navigation"
        />
      )}

      {isInstitutionGroup && (
        <HorizontalPageTabs
          tabs={institutionTabs}
          activeTab={activeTab === 'requests' ? 'access-requests' : activeTab}
          onTabChange={(tabId) => handleTabChange(tabId)}
          ariaLabel="Institutions Sub-Navigation"
        />
      )}

      {isOpportunityGroup && (
        <HorizontalPageTabs
          tabs={opportunityTabs}
          activeTab={activeTab === 'apprenticeships' ? 'internships' : activeTab}
          onTabChange={(tabId) => handleTabChange(tabId)}
          ariaLabel="Opportunities Sub-Navigation"
        />
      )}

      {isLearningGroup && (
        <HorizontalPageTabs
          tabs={learningTabs}
          activeTab={activeTab}
          onTabChange={(tabId) => handleTabChange(tabId)}
          ariaLabel="Learning Sub-Navigation"
        />
      )}
      {/* SCREEN 1: OVERVIEW / DASHBOARD */}
      {activeTab === 'dashboard' && (
        <CompanyDashboard
          onTabSelect={(tab) => handleTabChange(tab)}
          onOpenCreateOpp={() => handleTabChange('opportunities')}
          students={students}
          opportunities={opportunities}
          applications={applications}
          onApplyFiltersToSearch={(filters) => {
            setSearchFilterPreset(filters);
            handleTabChange('students');
          }}
        />
      )}

      {/* SCREEN: STUDENT ACCESS REQUESTS */}
      {activeTab === 'access-requests' && (
        <CompanyStudentAccessRequests
          onShowToast={onShowToast}
          onNavigateToAuthorized={() => handleTabChange('authorized-students')}
        />
      )}

      {/* SCREEN: AUTHORIZED STUDENTS */}
      {activeTab === 'authorized-students' && (
        <CompanyAuthorizedStudents
          onShowToast={onShowToast}
        />
      )}

      {/* SCREEN 2: STUDENT SEARCH */}
      {activeTab === 'students' && (
        <CompanyTalentSearch
          students={students}
          onSelectStudent={handleSelectStudent}
          onToggleShortlist={handleToggleShortlist}
          shortlistedIds={shortlistedIds}
          initialFilters={searchFilterPreset}
          onOpenCompare={(list) => setCompareList(list)}
        />
      )}

      {/* SCREEN 3: STUDENT PROFILE */}
      {activeTab === 'student-profile' && (
        <CompanyStudentProfile
          student={selectedStudent || students[0]}
          onBack={() => handleTabChange('students')}
          onToggleShortlist={handleToggleShortlist}
          isShortlisted={selectedStudent ? shortlistedIds.has(selectedStudent.studentId) : false}
          onContactStudent={handleContactStudent}
          onOpenInviteModal={(cand) => setInviteCandidate(cand)}
          onShowToast={onShowToast}
        />
      )}

      {/* SCREEN 4: OPPORTUNITIES (All, Internships, Jobs) */}
      {(activeTab === 'opportunities' || activeTab === 'internships' || activeTab === 'apprenticeships' || activeTab === 'jobs') && (
        <CompanyOpportunities
          key={activeTab}
          currentTab={activeTab}
          opportunities={opportunities}
          filterType={
            activeTab === 'internships' ? 'Internships' :
            activeTab === 'apprenticeships' ? 'Apprenticeships' :
            activeTab === 'jobs' ? 'Full-Time' : 'All'
          }
          onCreateOpportunity={handleCreateOpportunity}
          onUpdateOpportunity={(opp) => updateCompanyOpportunity(opp.opportunityId || opp.oppId || opp.id, opp)}
          onDeleteOpportunity={(id) => {
            deleteCompanyOpportunity(id);
            if (onShowToast) onShowToast({ title: 'Opportunity Removed', message: 'Opportunity record archived.', type: 'info' });
          }}
          onCloseOpportunity={(id) => {
            closeCompanyOpportunity(id);
            if (onShowToast) onShowToast({ title: 'Opportunity Closed', message: 'No longer accepting new applicants.', type: 'info' });
          }}
          onFindMatchingStudents={(opp) => {
            const rawSkills = opp.requiredSkills;
            let skillList = ['C', 'C++'];
            if (Array.isArray(rawSkills)) {
              skillList = rawSkills.map(s => typeof s === 'object' ? s.name : String(s)).filter(Boolean);
            } else if (typeof rawSkills === 'string' && rawSkills.trim()) {
              skillList = rawSkills.split(',').map(s => s.trim()).filter(Boolean);
            }
            setSearchFilterPreset({
              skills: skillList,
              benchmark: opp.minMatch || 80
            });
            handleTabChange('students');
          }}
          onShowToast={onShowToast}
          user={user}
        />
      )}

      {/* SCREEN: DEDICATED SELECTED CANDIDATES */}
      {(activeTab === 'selected' || activeTab === 'selected-candidates' || activeTab === 'selected-students') && (
        <CompanySelectedCandidates
          user={user}
          onShowToast={onShowToast}
          onSelectStudent={handleSelectStudent}
        />
      )}

      {/* SCREEN 5: APPLICATION PIPELINE & SHORTLISTED */}
      {(activeTab === 'applications' || activeTab === 'shortlisted') && (
        <CompanyApplications
          applications={applications}
          defaultTab={activeTab === 'shortlisted' ? 'Shortlisted' : 'All'}
          onStageChange={handleStageChange}
          onSelectCandidate={(app) => {
            const cand = students.find(s => s.studentId === app.studentId || s.name === app.candidateName || s.name === app.candidate);
            if (cand) handleSelectStudent(cand);
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* SCREEN 6: AI MATCHING */}
      {activeTab === 'ai-matching' && (
        <CompanyAIMatching
          students={students}
          opportunities={opportunities}
          onSelectStudent={handleSelectStudent}
          onToggleShortlist={handleToggleShortlist}
          shortlistedIds={shortlistedIds}
          onOpenInviteModal={(cand) => setInviteCandidate(cand)}
          onShowToast={onShowToast}
        />
      )}

      {/* SCREEN 7: TALENT POOLS */}
      {activeTab === 'talent-pools' && (
        <CompanyTalentPools
          onTabSelect={(tab) => handleTabChange(tab)}
          onShowToast={onShowToast}
        />
      )}

      {/* SCREEN 7B: STUDENT PROJECT DETAILS EXPLORER */}
      {(activeTab === 'project-explorer' || activeTab === 'projects') && (
        <ProjectDetailsExplorer portal="industry" onShowToast={onShowToast} />
      )}

      {/* SCREEN 8: ANALYTICS */}
      {activeTab === 'analytics' && (
        <CompanyAnalytics
          applications={applications}
          opportunities={opportunities}
          candidates={candidates}
          partnerships={companyPartnerships}
        />
      )}

      {/* SCREEN 9: MESSAGES */}
      {activeTab === 'messages' && (
        <CompanyMessages
          user={user}
          initialStudent={selectedStudent}
          onShowToast={onShowToast}
        />
      )}

      {/* SCREEN: COLLEGE COLLABORATION & TALENT ACCESS HUB */}
      {(activeTab === 'colleges' || activeTab === 'collaboration' || activeTab === 'collaborations') && (
        <CompanyCollegeCollaboration
          user={user}
          onShowToast={onShowToast}
          onTabSelect={(tab) => handleTabChange(tab)}
          onFilterCollege={(colName) => {
            setSearchFilterPreset({ college: colName });
            handleTabChange('students');
          }}
          onSelectStudent={handleSelectStudent}
        />
      )}

      {/* SUPPORTING SCREEN: COURSES */}
      {activeTab === 'courses' && (
        <CompanyCourses
          onTabSelect={(tab) => handleTabChange(tab)}
          onShowToast={onShowToast}
          user={user}
        />
      )}

      {/* SUPPORTING SCREEN: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <CompanyCertificates />
      )}

      {/* SCREEN: LEARNING ASSESSMENTS FOR SELECTED STUDENTS */}
      {activeTab === 'learning-assessments' && (
        <CompanyLearningAssessments
          user={user}
          onShowToast={onShowToast}
          onNavigateToStudents={() => handleTabChange('students')}
        />
      )}

      {/* SCREEN: TARGETED ASSESSMENTS */}
      {activeTab === 'assessments' && (
        <CompanyTargetedAssessments
          user={user}
          onShowToast={onShowToast}
        />
      )}

      {/* SUPPORTING SCREEN: SETTINGS */}
      {activeTab === 'settings' && (
        <CompanySettings
          user={user}
          onShowToast={onShowToast}
          setActivePage={setActivePage}
        />
      )}
    </>
  );

  if (isEmbedded) {
    return (
      <div className="company-portal-root company-embedded-root" style={{ padding: '24px 32px 48px', maxWidth: '1440px', margin: '0 auto', width: '100%', background: 'transparent', minHeight: '100vh' }}>
        {renderScreenContent()}

        {/* Multi-Student Compare Modal */}
        {compareList.length > 0 && (
          <CompanyCompareModal
            students={compareList}
            onClose={() => setCompareList([])}
            onSelectStudent={(s) => {
              setCompareList([]);
              handleSelectStudent(s);
            }}
          />
        )}

        {/* Direct Opportunity Invite Modal */}
        {inviteCandidate && (
          <CompanyInviteModal
            student={inviteCandidate}
            opportunities={opportunities}
            onClose={() => setInviteCandidate(null)}
            onSendInvite={handleSendInvite}
          />
        )}
      </div>
    );
  }

  return (
    <div className="company-portal-root">
      {/* 4. Left Sidebar (Fixed, 240px, 17 items, independent scrolling) */}
      <CompanySidebar
        activeTab={activeTab === 'student-profile' ? 'students' : activeTab}
        onTabSelect={(tab) => {
          setSelectedStudent(null);
          handleTabChange(tab);
        }}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Content Wrapper */}
      <div className="company-main-wrapper">
        {/* 5. Top Navbar (60px, translucent dark glass, search, alerts, recruiter avatar) */}
        <CompanyNavbar
          activeTab={activeTab}
          onTabSelect={(tab) => {
            setSelectedStudent(null);
            handleTabChange(tab);
          }}
          user={user}
          onLogout={onLogout}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* 2. Main Content Area (Scrolls independently) */}
        <main className="company-viewport">
          {renderScreenContent()}
        </main>
      </div>

      {/* Multi-Student Compare Modal */}
      {compareList.length > 0 && (
        <CompanyCompareModal
          students={compareList}
          onClose={() => setCompareList([])}
          onSelectStudent={(s) => {
            setCompareList([]);
            handleSelectStudent(s);
          }}
        />
      )}

      {/* Direct Opportunity Invite Modal */}
      {inviteCandidate && (
        <CompanyInviteModal
          student={inviteCandidate}
          opportunities={opportunities}
          onClose={() => setInviteCandidate(null)}
          onSendInvite={handleSendInvite}
        />
      )}
    </div>
  );
}
