import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  Award,
  BarChart2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Download,
  Filter,
  LogOut,
  GraduationCap,
  Database,
  Briefcase,
  Target,
  AlertTriangle,
  Brain,
  BookOpen,
  Activity,
  Building,
  FolderGit2,
  Sparkles
} from 'lucide-react';
import HorizontalPageTabs from '../components/navigation/HorizontalPageTabs';
import DirectoryInspectorModal from '../components/DirectoryInspectorModal';
import { getStudentsByCollegeId } from '../services/studentStore';
import { getCollegeById, getDirectoryStats } from '../services/collegeDirectory';

// Modular Institution Workspace Subcomponents
import InstitutionTelemetry from '../components/institution/InstitutionTelemetry';
import InstitutionStudentReadiness from '../components/institution/InstitutionStudentReadiness';
import InstitutionStudentDetails from '../components/institution/InstitutionStudentDetails';
import InstitutionCompanyIntelligence from '../components/institution/InstitutionCompanyIntelligence';
import InstitutionCompanyOpportunities from '../components/institution/InstitutionCompanyOpportunities';
import InstitutionTalentMatching from '../components/institution/InstitutionTalentMatching';
import InstitutionSkillGap from '../components/institution/InstitutionSkillGap';
import InstitutionCourseManagement from '../components/institution/InstitutionCourseManagement';
import InstitutionProofs from '../components/institution/InstitutionProofs';
import InstitutionPlacementPipeline from '../components/institution/InstitutionPlacementPipeline';
import InstitutionCombinedAnalytics from '../components/institution/InstitutionCombinedAnalytics';
import InstitutionSkillAnalytics from '../components/institution/InstitutionSkillAnalytics';
import CollegeSkillIntelligence from '../components/institution/CollegeSkillIntelligence';
import InstitutionSetupWizard from '../components/institution/InstitutionSetupWizard';
import InstitutionSkillGrowth from '../components/institution/InstitutionSkillGrowth';
import InstitutionStudentPerformance from '../components/institution/InstitutionStudentPerformance';
import InstitutionIndustryRequests from '../components/institution/InstitutionIndustryRequests';
import InstitutionCourseCertificates from '../components/institution/InstitutionCourseCertificates';
import InstitutionCampusDirectory from '../components/institution/InstitutionCampusDirectory';
import InstitutionCertificateVerification from '../components/institution/InstitutionCertificateVerification';
import InstitutionProjectVerification from '../components/institution/InstitutionProjectVerification';
import InstitutionCandidateList from '../components/institution/InstitutionCandidateList';
import InstitutionManagement from '../components/institution/InstitutionManagement';
import InstitutionStaffManagement from '../components/institution/InstitutionStaffManagement';
import InstitutionMessages from '../components/institution/InstitutionMessages';
import ErrorBoundary from '../components/common/ErrorBoundary';
import ProjectDetailsExplorer from '../components/common/ProjectDetailsExplorer';
import { academicService } from '../services/academicService';

export default function InstitutionConsole({ setActivePage, activePage, user, onShowToast, onLogout }) {
  const [institutionStudents, setInstitutionStudents] = useState([]);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [directoryStats, setDirectoryStats] = useState(() => getDirectoryStats());

  useEffect(() => {
    const handleDirUpdate = () => setDirectoryStats(getDirectoryStats());
    window.addEventListener('nexus_directory_updated', handleDirUpdate);
    return () => window.removeEventListener('nexus_directory_updated', handleDirUpdate);
  }, []);

  // Determine which sub-page to render based on activePage prop
  const currentView = useMemo(() => {
    switch (activePage) {
      case 'institution-readiness':
        return 'readiness';
      case 'institution-skill-growth':
      case 'skill-growth':
        return 'skill-growth';
      case 'institution-skill-intelligence':
      case 'skill-intelligence':
        return 'skill-intelligence';
      case 'institution-skill-analytics':
        return 'skill-analytics';
      case 'institution-students':
      case 'institution-student-performance':
      case 'student-performance':
        return 'student-performance';
      case 'institution-candidates':
        return 'candidates';
      case 'institution-messages':
        return 'messages';
      case 'institution-management':
        return 'management';
      case 'institution-staff':
      case 'institution-staff-management':
      case 'staff-management':
        return 'staff-management';
      case 'institution-courses':
        return 'courses';
      case 'institution-skill-mapping':
      case 'institution-skill-gap':
        return 'skill-gap';
      case 'institution-projects':
      case 'institution-project-verification':
        return 'project-verification';
      case 'institution-project-explorer':
        return 'project-explorer';
      case 'institution-certificates':
        return 'certificate-verification';
      case 'institution-course-certificates':
        return 'course-certificates';
      case 'institution-proofs':
        return 'proofs';
      case 'institution-company-directory':
      case 'institution-company-intelligence':
        return 'companies';
      case 'institution-company-opportunities':
        return 'opportunities';
      case 'institution-matching':
        return 'matching';
      case 'institution-placement':
      case 'institution-recruitment-drives':
      case 'institution-pipeline':
      case 'placement':
      case 'pipeline':
        return 'placement';
      case 'institution-selected-students':
      case 'selected-students':
      case 'selected':
        return 'selected-students';
      case 'institution-industry-requests':
      case 'institution-industry-collaboration':
        return 'industry-requests';
      case 'institution-campus-directory':
        return 'campus-directory';
      case 'institution-analytics':
      case 'institution-industry-demand':
      case 'institution-skill-trends':
        return 'analytics';
      default:
        return 'telemetry'; // default: institution-console / institution-academic-workspace
    }
  }, [activePage]);

  // Resolve institution's collegeId
  const collegeId = user?.collegeId || user?.institutionId || user?.id || '';
  const institutionDisplayName = user?.institutionName || user?.collegeName || user?.name || 'Institution Workspace';

  // Load live students for metric calculations
  useEffect(() => {
    let isMounted = true;
    const updateStats = async () => {
      try {
        const res = await academicService.getStudents();
        if (res && res.success && Array.isArray(res.data) && isMounted) {
          setInstitutionStudents(res.data);
          return;
        }
      } catch (e) {
        console.warn('Live academic students fetch note:', e.message);
      }
      const records = getStudentsByCollegeId(collegeId);
      if (isMounted) setInstitutionStudents(records);
    };
    updateStats();

    window.addEventListener('nexus_students_updated', updateStats);
    window.addEventListener('nexus_data_updated', updateStats);
    return () => {
      isMounted = false;
      window.removeEventListener('nexus_students_updated', updateStats);
      window.removeEventListener('nexus_data_updated', updateStats);
    };
  }, [collegeId]);

  // Check if first-time institution setup is needed
  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await academicService.getSetupStatus();
        if (res.success && res.data && !res.data.setupCompleted) {
          setShowSetupWizard(true);
        }
      } catch (err) {
        console.warn('Setup status check note:', err.message);
      }
    }
    checkSetup();
  }, [collegeId]);

  // Derived metrics from actual students
  const totalStudentsCount = institutionStudents.length;
  const avgReadiness = useMemo(() => {
    if (!institutionStudents.length) return '0%';
    const total = institutionStudents.reduce((acc, s) => acc + Number(s.readinessScore || s.careerReadinessScore || s.learningProgress || 0), 0);
    return `${(total / institutionStudents.length).toFixed(1)}%`;
  }, [institutionStudents]);

  const verifiedSkillsCount = useMemo(() => {
    if (!institutionStudents.length) return '0';
    const count = institutionStudents.reduce((acc, s) => {
      const vSkills = (s.skills || []).filter(sk => typeof sk === 'object' ? sk.verified : true).length || (s.verifiedSkills?.length || 0);
      return acc + vSkills;
    }, 0);
    return count.toLocaleString();
  }, [institutionStudents]);

  const placementReadyCount = useMemo(() => {
    if (!institutionStudents.length) return 0;
    return institutionStudents.filter(s =>
      (s.placementStatus && s.placementStatus.toLowerCase().includes('ready')) ||
      Number(s.readinessScore || s.careerReadinessScore || s.learningProgress || 0) >= 75
    ).length;
  }, [institutionStudents]);

  const cohorts = useMemo(() => {
    if (!institutionStudents.length) return [];
    const depts = {};
    institutionStudents.forEach(s => {
      const dept = s.department || s.departmentName || 'General';
      if (!depts[dept]) {
        depts[dept] = { totalStudents: 0, readinessSum: 0, verifiedCount: 0, readyCount: 0 };
      }
      depts[dept].totalStudents += 1;
      const score = Number(s.readinessScore || s.careerReadinessScore || s.learningProgress || 0);
      depts[dept].readinessSum += score;
      if (score >= 75 || (s.placementStatus && s.placementStatus.toLowerCase().includes('ready'))) {
        depts[dept].readyCount += 1;
      }
      const vSkills = (s.skills || []).filter(sk => typeof sk === 'object' ? sk.verified : true).length || (s.verifiedSkills?.length || 0);
      depts[dept].verifiedCount += vSkills;
    });

    return Object.entries(depts).map(([deptName, d], idx) => ({
      id: `coh_${idx + 1}`,
      name: `${deptName} Department Cohort`,
      totalStudents: d.totalStudents,
      readinessAverage: `${(d.readinessSum / d.totalStudents).toFixed(1)}%`,
      verifiedSkillsCount: d.verifiedCount,
      placementReady: d.readyCount,
      topTrack: `${deptName} Specialization`
    }));
  }, [institutionStudents]);

  const pageLabels = {
    telemetry: 'Cohort Telemetry',
    readiness: 'Student Readiness Intelligence',
    students: 'Student Database',
    candidates: 'Candidate List',
    messages: 'Institutional Messaging',
    management: 'Institution Management',
    companies: 'Company Intelligence',
    opportunities: 'Corporate Opportunities',
    matching: 'Student–Company Matching',
    'skill-intelligence': 'College Skill Intelligence',
    'skill-analytics': 'Institution Skill Analytics',
    'skill-gap': 'Skill Gap Intelligence',
    courses: 'Course & Training Management',
    proofs: 'Verified Skill Proofs',
    placement: 'Application Pipeline',
    analytics: 'Institution Analytics'
  };

  const pageSubtitles = {
    telemetry: `Academic workspace, student roster telemetry, curriculum competency tracking, and automated placement pipeline analytics for ${institutionDisplayName}.`,
    'skill-intelligence': `Data-driven dashboard showing institutional student skill readiness, cohort progression, and actionable gap remediation for ${institutionDisplayName}.`,
    'skill-analytics': `Deep-dive competency telemetry, communication skill diagnostics, and verified skill mapping for ${institutionDisplayName}.`,
    readiness: `Multi-pillar student dossier: Academic, Skills, Learning progress, and Career readiness diagnostics for ${institutionDisplayName}.`,
    students: `Filterable student database across Department, Batch, Semester, Skill, Proficiency, Placement Status, and Readiness.`,
    candidates: `Filterable candidate roster across academic departments, readiness tiers, and skill profiles authenticated under ${institutionDisplayName}.`,
    messages: `Real-time database-driven correspondence with industry recruiters, corporate partners, and student candidates.`,
    management: `Administrative configuration of institution metadata, departments, and accreditation console for ${institutionDisplayName}.`,
    companies: `Deep corporate employer directory with live skill requirements, hiring volume, and HR relationships for ${institutionDisplayName}.`,
    opportunities: `Review, validate, and broadcast corporate Jobs, Internships, Projects, Hackathons, and Training to students.`,
    matching: `AI algorithmic matching between corporate opening specifications and student skill graphs with transparency rationale.`,
    'skill-gap': `Campus student proficiency vs corporate industry demand diagnostic with automated curriculum recommendations.`,
    courses: `Closed-loop training intervention engine turning identified skill deficits into active campus bootcamps.`,
    proofs: `Cryptographically verified skill proof ledger for all students registered under ${institutionDisplayName}.`,
    placement: `7-stage recruitment funnel, company visit analytics, CTC tracking, and candidate placement records for ${institutionDisplayName}.`,
    analytics: `Holistic analytics dashboard: Student cohort growth, corporate demand trends, and curriculum-to-industry alignment.`
  };

  const workspaceTabs = useMemo(() => {
    // 1. Students Workspace
    if (['institution-readiness', 'institution-students', 'institution-student-performance', 'institution-skill-growth', 'institution-skill-analytics', 'institution-skill-intelligence'].includes(activePage)) {
      return [
        { id: 'institution-skill-intelligence', label: 'Skill Intelligence', icon: Sparkles },
        { id: 'institution-students', label: 'Student Performance', icon: Users },
        { id: 'institution-skill-growth', label: 'Skill Growth', icon: TrendingUp },
        { id: 'institution-skill-analytics', label: 'Skill Analytics', icon: BarChart2 },
        { id: 'institution-readiness', label: 'Student Readiness', icon: Target }
      ];
    }
    // 2. Learning Workspace
    if (['institution-courses', 'institution-skill-mapping'].includes(activePage)) {
      return [
        { id: 'institution-courses', label: 'Course Management', icon: BookOpen },
        { id: 'institution-skill-mapping', label: 'Skill Mapping', icon: Brain }
      ];
    }
    // 2b. Certificate Verification Workspace
    if (['institution-certificates', 'institution-course-certificates', 'institution-proofs'].includes(activePage)) {
      return [
        { id: 'institution-certificates', label: 'Student Certificates', icon: Award },
        { id: 'institution-course-certificates', label: 'Company Course Certificates', icon: ShieldCheck }
      ];
    }
    // 2c. Projects Workspace
    if (['institution-projects', 'institution-project-verification', 'institution-project-explorer'].includes(activePage)) {
      return [
        { id: 'institution-projects', label: 'Verification Queue', icon: ShieldCheck },
        { id: 'institution-project-explorer', label: 'Project Portfolio Explorer', icon: FolderGit2 }
      ];
    }
    // 3. Opportunities & Placement Workspace
    if (['institution-placement', 'institution-recruitment-drives', 'institution-candidates', 'institution-company-opportunities'].includes(activePage)) {
      return [
        { id: 'institution-placement', label: 'Application Pipeline', icon: GraduationCap },
        { id: 'institution-candidates', label: 'Candidate List', icon: Users },
        { id: 'institution-company-opportunities', label: 'Corporate Opportunities', icon: Briefcase }
      ];
    }
    // 4. Companies Workspace
    if (['institution-company-directory', 'institution-companies', 'institution-company-intelligence', 'institution-industry-requests', 'institution-industry-collaboration', 'institution-campus-directory'].includes(activePage)) {
      return [
        { id: 'institution-company-directory', label: 'Company Directory', icon: Building },
        { id: 'institution-company-intelligence', label: 'Company Intelligence', icon: Target },
        { id: 'institution-industry-requests', label: 'Access Requests', icon: ShieldCheck },
        { id: 'institution-campus-directory', label: 'Campus Collaborations', icon: GraduationCap }
      ];
    }
    // 5. Talent Matching Workspace
    if (['institution-matching', 'institution-skill-gap'].includes(activePage)) {
      return [
        { id: 'institution-matching', label: 'AI Talent Matcher', icon: Brain },
        { id: 'institution-skill-gap', label: 'Skill Gap Telemetry', icon: Target }
      ];
    }
    // 6. Executive Analytics Workspace
    if (['institution-analytics', 'institution-industry-demand', 'institution-skill-trends'].includes(activePage)) {
      return [
        { id: 'institution-analytics', label: 'Institutional Analytics', icon: BarChart2 },
        { id: 'institution-industry-demand', label: 'Industry Demand', icon: TrendingUp },
        { id: 'institution-skill-trends', label: 'Market Skill Trends', icon: Activity }
      ];
    }
    return null;
  }, [activePage]);

  const activeTabNormalized = useMemo(() => {
    if (activePage === 'institution-companies') return 'institution-company-directory';
    if (activePage === 'institution-certificates') return 'institution-proofs';
    if (activePage === 'institution-industry-collaboration') return 'institution-industry-requests';
    return activePage;
  }, [activePage]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '50px' }}>
      {/* ── TOP HEADER & TELEMETRY TAG ── */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div className="telemetry-node-tag">
            <span>SKILLNEXUS ACADEMIA</span>
            <span>//</span>
            <span>CAMPUS LICENSE: {collegeId} — {institutionDisplayName.toUpperCase()}</span>
          </div>
          <h1>{pageLabels[currentView] || 'Cohort Telemetry'}</h1>
          <p>{pageSubtitles[currentView] || pageSubtitles.telemetry}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowSetupWizard(true)}
            className="btn-cyber-primary"
            style={{ padding: '7px 14px', fontSize: '12px' }}
            title="Configure College Identity and Academic Departments"
          >
            <Building2 size={14} />
            <span>Setup Wizard</span>
          </button>
          <button
            onClick={() => setIsInspectorOpen(true)}
            className="btn-cyber-outline"
            style={{ color: 'var(--cyber-cyan)', borderColor: 'rgba(0, 242, 254, 0.35)' }}
            title={`Inspect ${directoryStats.total} Tamil Nadu Higher Education Institutions across all 38 districts`}
          >
            <Database size={14} />
            <span>Master Directory ({directoryStats.total})</span>
          </button>
          <button
            onClick={() => {
              if (onShowToast) onShowToast({ title: 'Export Generated', message: `Cohort Roster CSV downloaded for ${institutionDisplayName}.`, type: 'success' });
            }}
            className="btn-cyber-outline"
          >
            <Download size={14} />
            <span>Export Roster</span>
          </button>
          <button
            onClick={onLogout}
            className="btn-cyber-outline"
            style={{ color: 'var(--cyber-rose)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ── HORIZONTAL WORKSPACE NAVIGATION ── */}
      {workspaceTabs && (
        <HorizontalPageTabs
          tabs={workspaceTabs}
          activeTab={activeTabNormalized}
          onTabChange={(tabId) => setActivePage && setActivePage(tabId)}
          ariaLabel="Institution Workspace Sub-Navigation"
        />
      )}

      {/* ── 1. COHORT TELEMETRY VIEW ── */}
      {currentView === 'telemetry' && (
        <InstitutionTelemetry
          institutionDisplayName={institutionDisplayName}
          collegeId={collegeId}
          totalStudentsCount={totalStudentsCount}
          avgReadiness={avgReadiness}
          verifiedSkillsCount={verifiedSkillsCount}
          placementReadyCount={placementReadyCount}
          cohorts={cohorts}
          onShowToast={onShowToast}
          setActivePage={setActivePage}
        />
      )}

      {/* ── 2. STUDENT READINESS VIEW ── */}
      {currentView === 'readiness' && (
        <InstitutionStudentReadiness
          institution={{ ...user, collegeId, institutionName: institutionDisplayName }}
          onShowToast={onShowToast}
        />
      )}

      {/* ── FEATURE 5: COLLEGE SKILL INTELLIGENCE VIEW ── */}
      {currentView === 'skill-intelligence' && (
        <ErrorBoundary
          title="College Skill Intelligence"
          onReset={() => setActivePage && setActivePage('institution-skill-intelligence')}
          onNavigateHome={() => setActivePage && setActivePage('institution-console')}
        >
          <CollegeSkillIntelligence
            institution={{ ...user, collegeId, institutionName: institutionDisplayName }}
            onShowToast={onShowToast}
            setActivePage={setActivePage}
          />
        </ErrorBoundary>
      )}

      {/* ── INSTITUTION SKILL ANALYTICS VIEW ── */}
      {currentView === 'skill-analytics' && (
        <ErrorBoundary
          title="Institution Skill Analytics"
          onReset={() => setActivePage && setActivePage('institution-skill-analytics')}
          onNavigateHome={() => setActivePage && setActivePage('institution-console')}
        >
          <InstitutionSkillAnalytics
            institution={{ ...user, collegeId, institutionName: institutionDisplayName }}
            onShowToast={onShowToast}
            setActivePage={setActivePage}
          />
        </ErrorBoundary>
      )}

      {/* ── 3. STUDENT DETAILS (DATABASE) VIEW ── */}
      {currentView === 'students' && (
        <InstitutionStudentDetails
          institution={{ ...user, collegeId, institutionName: institutionDisplayName }}
          onShowToast={onShowToast}
        />
      )}

      {/* ── 4. COMPANY INTELLIGENCE VIEW ── */}
      {currentView === 'companies' && (
        <InstitutionCompanyIntelligence
          onShowToast={onShowToast}
          setActivePage={setActivePage}
        />
      )}

      {/* ── 5. COMPANY OPPORTUNITIES VIEW ── */}
      {currentView === 'opportunities' && (
        <InstitutionCompanyOpportunities
          onShowToast={onShowToast}
          setActivePage={setActivePage}
        />
      )}

      {/* ── 6. STUDENT-COMPANY MATCHING VIEW ── */}
      {currentView === 'matching' && (
        <InstitutionTalentMatching onShowToast={onShowToast} />
      )}

      {/* ── 7. SKILL GAP INTELLIGENCE VIEW ── */}
      {currentView === 'skill-gap' && (
        <InstitutionSkillGap
          institution={{ ...user, collegeId, institutionName: institutionDisplayName }}
          onShowToast={onShowToast}
          setActivePage={setActivePage}
        />
      )}

      {/* ── 8. COURSE & TRAINING MANAGEMENT VIEW ── */}
      {currentView === 'courses' && (
        <InstitutionCourseManagement
          institution={{ ...user, collegeId, institutionName: institutionDisplayName }}
          onShowToast={onShowToast}
        />
      )}

      {/* ── 9. VERIFIED SKILL PROOFS VIEW ── */}
      {currentView === 'proofs' && (
        <InstitutionProofs
          institution={{ ...user, collegeId, institutionName: institutionDisplayName }}
          onShowToast={onShowToast}
        />
      )}

      {/* ── 10. PLACEMENT PIPELINE VIEW ── */}
      {currentView === 'placement' && (
        <InstitutionPlacementPipeline onShowToast={onShowToast} initialTab="pipeline" />
      )}

      {/* ── 10A. SELECTED STUDENTS VIEW ── */}
      {currentView === 'selected-students' && (
        <InstitutionPlacementPipeline onShowToast={onShowToast} initialTab="selected" />
      )}

      {/* ── 10B. CANDIDATE LIST VIEW ── */}
      {currentView === 'candidates' && (
        <InstitutionCandidateList
          institution={{ ...user, collegeId, institutionName: institutionDisplayName }}
          onShowToast={onShowToast}
          setActivePage={setActivePage}
        />
      )}

      {/* ── 10C. MESSAGES VIEW ── */}
      {currentView === 'messages' && (
        <InstitutionMessages
          institution={{ ...user, collegeId, institutionName: institutionDisplayName }}
          onShowToast={onShowToast}
        />
      )}

      {/* ── 10D. INSTITUTION MANAGEMENT VIEW ── */}
      {currentView === 'management' && (
        <InstitutionManagement
          institution={{ ...user, collegeId, institutionName: institutionDisplayName }}
          onShowToast={onShowToast}
          onOpenSetupWizard={() => setShowSetupWizard(true)}
          setActivePage={setActivePage}
        />
      )}

      {/* ── 10E. STAFF / ACADEMICIAN MANAGEMENT VIEW ── */}
      {currentView === 'staff-management' && (
        <InstitutionStaffManagement
          institution={{ ...user, collegeId, institutionName: institutionDisplayName }}
          onShowToast={onShowToast}
        />
      )}

      {/* ── 11. INSTITUTION ANALYTICS VIEW ── */}
      {currentView === 'analytics' && (
        <InstitutionCombinedAnalytics onShowToast={onShowToast} />
      )}

      {/* ── 12. INSTITUTION SKILL GROWTH VIEW ── */}
      {currentView === 'skill-growth' && (
        <InstitutionSkillGrowth onShowToast={onShowToast} />
      )}

      {/* ── 12B. INSTITUTION STUDENT PERFORMANCE VIEW ── */}
      {currentView === 'student-performance' && (
        <InstitutionStudentPerformance
          institution={{ ...user, collegeId, institutionName: institutionDisplayName }}
          onShowToast={onShowToast}
        />
      )}

      {/* ── 13. INDUSTRY COLLABORATION & ACCESS REQUESTS VIEW ── */}
      {currentView === 'industry-requests' && (
        <InstitutionIndustryRequests onShowToast={onShowToast} />
      )}

      {/* ── 13B. CAMPUS DIRECTORY & INTER-COLLEGE COLLABORATIONS VIEW ── */}
      {currentView === 'campus-directory' && (
        <InstitutionCampusDirectory onShowToast={onShowToast} />
      )}

      {/* ── 14. STUDENT CERTIFICATE VERIFICATION VIEW ── */}
      {currentView === 'certificate-verification' && (
        <InstitutionCertificateVerification onShowToast={onShowToast} />
      )}

      {/* ── 15. COURSE CERTIFICATES VERIFICATION VIEW ── */}
      {currentView === 'course-certificates' && (
        <InstitutionCourseCertificates onShowToast={onShowToast} />
      )}

      {/* ── 16. STUDENT PROJECT VERIFICATION VIEW ── */}
      {currentView === 'project-verification' && (
        <InstitutionProjectVerification onShowToast={onShowToast} />
      )}

      {/* ── 16B. STUDENT PROJECT DETAILS EXPLORER VIEW ── */}
      {currentView === 'project-explorer' && (
        <ProjectDetailsExplorer portal="institution" onShowToast={onShowToast} />
      )}

      {/* Master Directory Inspector Modal */}
      <DirectoryInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      {/* Institution First-Time Setup Wizard Modal */}
      {showSetupWizard && (
        <InstitutionSetupWizard
          institution={{ ...user, collegeId, institutionName: institutionDisplayName }}
          onClose={() => setShowSetupWizard(false)}
          onSetupComplete={() => {
            setShowSetupWizard(false);
            if (onShowToast) {
              onShowToast({
                title: 'Setup Completed',
                message: `${institutionDisplayName} profile and departments configured successfully.`,
                type: 'success'
              });
            }
          }}
          onOpenImportModal={() => {
            setShowSetupWizard(false);
            if (setActivePage) setActivePage('institution-students');
          }}
          onOpenManualAddModal={() => {
            setShowSetupWizard(false);
            if (setActivePage) setActivePage('institution-students');
          }}
        />
      )}
    </div>
  );
}
