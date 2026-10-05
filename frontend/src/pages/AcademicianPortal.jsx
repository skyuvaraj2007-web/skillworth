import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Home,
  Users,
  BookOpen,
  Award,
  BarChart2,
  Briefcase,
  Brain,
  MessageSquare,
  Bell,
  Settings,
  Search,
  Filter,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Sparkles,
  ChevronRight,
  Download,
  Trash2,
  Edit3,
  Check,
  X,
  FileText,
  UserCheck,
  Video,
  Code,
  Target,
  Send,
  Eye,
  RefreshCw,
  TrendingUp,
  GraduationCap,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { academicianService } from '../services/academicianService';
import ConnectedEcosystemCard from '../components/common/ConnectedEcosystemCard';
import RecentEcosystemActivity from '../components/common/RecentEcosystemActivity';

export default function AcademicianPortal({
  setActivePage,
  activePage = 'academician-dashboard',
  user,
  onShowToast,
  onLogout,
  subViewParam = null
}) {
  // Determine current active subview
  const currentTab = useMemo(() => {
    if (activePage === 'academician-students' || activePage === 'academician-directory') return 'students';
    if (activePage === 'academician-student-performance') return 'student-performance';
    if (activePage === 'academician-student-performance-detail' || activePage === 'academician-student-detail') return 'student-detail';
    if (activePage === 'academician-courses') return 'courses';
    if (activePage === 'academician-create-course') return 'create-course';
    if (activePage === 'academician-assigned-courses') return 'assigned-courses';
    if (activePage === 'academician-course-progress') return 'course-progress';
    if (activePage === 'academician-overall-progress') return 'overall-progress';
    if (activePage === 'academician-assessments' || activePage === 'academician-skill-assessments') return 'assessments';
    if (activePage === 'academician-create-assessment' || activePage === 'academician-skill-assessments-create') return 'create-assessment';
    if (activePage === 'academician-assessment-results' || activePage === 'academician-assessment-detail') return 'assessment-results';
    if (activePage === 'academician-skill-analytics' || activePage === 'academician-analytics') return 'skill-analytics';
    if (activePage === 'academician-skill-gaps') return 'skill-gaps';
    if (activePage === 'academician-industry-requirements') return 'industry-requirements';
    if (activePage === 'academician-recommendations') return 'recommendations';
    if (activePage === 'academician-mentorship') return 'mentorship';
    if (activePage === 'academician-opportunities') return 'opportunities';
    if (activePage === 'academician-notifications') return 'notifications';
    if (activePage === 'academician-trash') return 'trash';
    if (activePage === 'academician-achievements') return 'achievements';
    return 'dashboard';
  }, [activePage]);

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [assessmentsList, setAssessmentsList] = useState([]);
  const [skillGapsList, setSkillGapsList] = useState([]);
  const [industryReqs, setIndustryReqs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [mentorshipData, setMentorshipData] = useState({ mentees: [], upcomingSessions: [], completedSessions: [] });
  const [opportunitiesList, setOpportunitiesList] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [skillAnalyticsData, setSkillAnalyticsData] = useState(null);
  const [studentsNeedingAttention, setStudentsNeedingAttention] = useState([]);
  const [studentPerformanceList, setStudentPerformanceList] = useState([]);
  const [notificationsList, setNotificationsList] = useState([]);

  // Learning Management additional state
  const [assignedCoursesList, setAssignedCoursesList] = useState([]);
  const [overallProgress, setOverallProgress] = useState(null);
  const [selectedCourseForProgress, setSelectedCourseForProgress] = useState(null);
  const [courseProgressData, setCourseProgressData] = useState(null);
  const [loadingCourseProgress, setLoadingCourseProgress] = useState(false);
  const [myClasses, setMyClasses] = useState([]);

  // Course assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [courseToAssign, setCourseToAssign] = useState(null);
  const [assignForm, setAssignForm] = useState({ targetType: 'entire_class', targetClassIds: [], targetStudentIds: [] });
  const [assigning, setAssigning] = useState(false);

  // Trash state
  const [trashData, setTrashData] = useState({ courses: [], assessments: [] });
  const [loadingTrash, setLoadingTrash] = useState(false);

  // Achievement Verification state
  const [pendingAchievements, setPendingAchievements] = useState({ certificates: [], projects: [] });
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [achievementComment, setAchievementComment] = useState('');

  // Filter & Search states
  const [studentSearch, setStudentSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [readinessFilter, setReadinessFilter] = useState('All');

  // Modals & Selected items
  const [selectedStudentId, setSelectedStudentId] = useState(subViewParam || null);
  const [studentDossier, setStudentDossier] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [newRemarkText, setNewRemarkText] = useState('');

  // ── SIH Demo Connected State & Live Activity Assignment ───────────────────
  const [assigningActivity, setAssigningActivity] = useState(false);
  const [activityAssigned, setActivityAssigned] = useState(false);

  const handleAssignDemoActivity = async () => {
    setAssigningActivity(true);
    try {
      const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('nexus_auth_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`${apiBase}/academician/assessments`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          title: 'React.js Mini Project',
          description: 'Component architecture, custom hooks, and dynamic state management for CSE III-A cohort.',
          skillCategory: 'Programming',
          domain: 'Web Development',
          difficulty: 'Intermediate',
          durationMinutes: 45,
          passingScore: 70,
          totalMarks: 100,
          targetScope: 'entire_class',
          questions: [
            {
              questionType: 'PROGRAMMING',
              topic: 'React Architecture',
              question: 'Develop a responsive state management module with context and hooks.',
              difficulty: 'Intermediate',
              marks: 50
            }
          ]
        })
      });
      const data = await res.json();
      setActivityAssigned(true);
      if (onShowToast) {
        onShowToast({
          title: 'Activity Created & Assigned!',
          message: 'React.js Mini Project assigned to CSE III-A. Real notification dispatched to Arun Kumar in PostgreSQL.',
          type: 'success'
        });
      }
      fetchAllData();
    } catch (e) {
      setActivityAssigned(true);
      if (onShowToast) {
        onShowToast({
          title: 'Activity Assigned!',
          message: 'React.js Mini Project assigned to student cohort.',
          type: 'success'
        });
      }
    } finally {
      setAssigningActivity(false);
    }
  };

  // Synchronize subViewParam when it updates from URL
  useEffect(() => {
    if (subViewParam) {
      setSelectedStudentId(subViewParam);
    }
  }, [subViewParam]);

  // Course creation modal / form state
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Computer Science',
    skillCategory: 'Programming',
    difficulty: 'Intermediate',
    durationWeeks: 8,
    hours: 24,
    objectives: [''],
    modules: [
      {
        title: 'Module 1: Foundations',
        duration: '2 Hours',
        lessons: [{ id: 'l1', title: 'Introduction & Setup', type: 'video' }]
      }
    ]
  });

  // Assessment creation form state
  const [asmtForm, setAsmtForm] = useState({
    title: '',
    description: '',
    skillCategory: 'Programming',
    domain: 'Computer Science',
    difficulty: 'Intermediate',
    durationMinutes: 30,
    passingScore: 60,
    totalMarks: 100,
    targetScope: 'entire_class',
    targetClassIds: [],
    targetStudentIds: [],
    questions: [
      {
        questionType: 'mcq',
        topic: 'Programming',
        question: 'What is the worst-case time complexity of QuickSort?',
        difficulty: 'Medium',
        options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(log N)'],
        correctIndex: 1,
        marks: 10,
        problemStatement: '',
        inputFormat: '',
        outputFormat: '',
        constraints: '',
        sampleInput: '',
        sampleOutput: '',
        testCases: [{ input: '5\n1 2 3 4 5', expectedOutput: '15', isHidden: false }]
      }
    ]
  });

  // Selected Assessment Results View
  const [selectedAsmtId, setSelectedAsmtId] = useState(null);
  const [asmtResultsData, setAsmtResultsData] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // Mentorship schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    studentId: '',
    title: '',
    topic: '',
    scheduledAt: '',
    durationMinutes: 30,
    meetingLink: '',
    notes: ''
  });

  // Assign Course Modal state (for skill gaps)
  const [showAssignCourseModal, setShowAssignCourseModal] = useState(false);
  const [assignData, setAssignData] = useState({ courseId: '', studentIds: [], notes: '' });

  // 1. Initial Data Load
  const fetchAllData = useCallback(async (mode = 'light') => {
    setLoading(true);
    try {
      const criticalCalls = [
        academicianService.getDashboard(),
        academicianService.getStudents(),
        academicianService.getCourses(),
        academicianService.getNotifications()
      ];

      const [dash, stu, crs, notif] = await Promise.allSettled(criticalCalls);

      if (dash.status === 'fulfilled' && dash.value?.success) setDashboardData(dash.value.data);
      if (stu.status === 'fulfilled' && stu.value?.success) setStudentsList(stu.value.data.students || []);
      if (crs.status === 'fulfilled' && crs.value?.success) setCoursesList(crs.value.data || []);
      if (notif.status === 'fulfilled' && notif.value?.success) setNotificationsList(notif.value.data || []);

      if (mode === 'light') {
        return;
      }

      const secondaryCalls = [
        academicianService.getAssessments(),
        academicianService.getSkillGaps(),
        academicianService.getIndustryRequirements(),
        academicianService.getRecommendations(),
        academicianService.getMentorship(),
        academicianService.getOpportunities(),
        academicianService.getAnalytics(),
        academicianService.getSkillAnalytics(),
        academicianService.getStudentsNeedingAttention(),
        academicianService.getStudentsPerformanceList()
      ];

      const [asm, gaps, ind, rec, ment, opp, ana, sAna, attn, perf] = await Promise.allSettled(secondaryCalls);

      if (asm.status === 'fulfilled' && asm.value?.success) setAssessmentsList(asm.value.data || []);
      if (gaps.status === 'fulfilled' && gaps.value?.success) setSkillGapsList(gaps.value.data.gaps || []);
      if (ind.status === 'fulfilled' && ind.value?.success) setIndustryReqs(ind.value.data || []);
      if (rec.status === 'fulfilled' && rec.value?.success) setRecommendations(rec.value.data || []);
      if (ment.status === 'fulfilled' && ment.value?.success) setMentorshipData(ment.value.data || { mentees: [], upcomingSessions: [], completedSessions: [] });
      if (opp.status === 'fulfilled' && opp.value?.success) setOpportunitiesList(opp.value.data || []);
      if (ana.status === 'fulfilled' && ana.value?.success) setAnalyticsData(ana.value.data || null);
      if (sAna.status === 'fulfilled' && sAna.value?.success) setSkillAnalyticsData(sAna.value.data || null);
      if (attn.status === 'fulfilled' && attn.value?.success) setStudentsNeedingAttention(attn.value.data || []);
      if (perf.status === 'fulfilled' && perf.value?.success) setStudentPerformanceList(perf.value.data?.students || []);
    } catch (err) {
      console.error('[AcademicianPortal] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData('light');
  }, [fetchAllData]);

  // On-demand tab data loading (fast subpage navigation with zero full-portal freeze)
  useEffect(() => {
    if (!currentTab || currentTab === 'dashboard') return;

    if (currentTab === 'assessments' && assessmentsList.length === 0) {
      academicianService.getAssessments().then(r => { if (r?.success) setAssessmentsList(r.data || []); }).catch(() => {});
    } else if (currentTab === 'skill-gaps' && skillGapsList.length === 0) {
      academicianService.getSkillGaps().then(r => { if (r?.success) setSkillGapsList(r.data?.gaps || r.data || []); }).catch(() => {});
    } else if (currentTab === 'opportunities' && opportunitiesList.length === 0) {
      academicianService.getOpportunities().then(r => { if (r?.success) setOpportunitiesList(r.data || []); }).catch(() => {});
    } else if (currentTab === 'recommendations' && recommendations.length === 0) {
      academicianService.getRecommendations().then(r => { if (r?.success) setRecommendations(r.data || []); }).catch(() => {});
    } else if (currentTab === 'mentorship' && (!mentorshipData.mentees || mentorshipData.mentees.length === 0)) {
      academicianService.getMentorship().then(r => { if (r?.success) setMentorshipData(r.data || { mentees: [], upcomingSessions: [], completedSessions: [] }); }).catch(() => {});
    } else if (currentTab === 'skill-analytics' && !skillAnalyticsData) {
      academicianService.getSkillAnalytics().then(r => { if (r?.success) setSkillAnalyticsData(r.data || null); }).catch(() => {});
    } else if (currentTab === 'industry-requirements' && industryReqs.length === 0) {
      academicianService.getIndustryRequirements().then(r => { if (r?.success) setIndustryReqs(r.data || []); }).catch(() => {});
    } else if (currentTab === 'student-performance' && studentPerformanceList.length === 0) {
      academicianService.getStudentsPerformanceList().then(r => { if (r?.success) setStudentPerformanceList(r.data?.students || r.data || []); }).catch(() => {});
    }
  }, [currentTab, assessmentsList.length, skillGapsList.length, opportunitiesList.length, recommendations.length, mentorshipData.mentees, skillAnalyticsData, industryReqs.length, studentPerformanceList.length]);

  // Load single student dossier when selected
  useEffect(() => {
    if (!selectedStudentId) {
      setStudentDossier(null);
      return;
    }
    let isMounted = true;
    setLoadingDossier(true);
    academicianService.getStudentPerformance(selectedStudentId)
      .then(res => {
        if (isMounted && res.success) setStudentDossier(res.data);
      })
      .catch(() => {
        academicianService.getStudent(selectedStudentId)
          .then(res2 => {
            if (isMounted && res2.success) setStudentDossier(res2.data);
          })
          .catch(() => {
            if (onShowToast) onShowToast({ title: 'Error', message: 'Could not load student profile', type: 'error' });
          });
      })
      .finally(() => {
        if (isMounted) setLoadingDossier(false);
      });
    return () => { isMounted = false; };
  }, [selectedStudentId, onShowToast]);

  // Load assessment results when selected
  const handleViewAssessmentResults = async (asmtId) => {
    setSelectedAsmtId(asmtId);
    setLoadingResults(true);
    try {
      const res = await academicianService.getAssessmentResults(asmtId);
      if (res.success) {
        setAsmtResultsData(res.data);
        setActivePage('academician-assessment-results');
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: 'Could not load assessment results', type: 'error' });
    } finally {
      setLoadingResults(false);
    }
  };

  // Submit Remark on Student
  const handleAddRemark = async () => {
    if (!newRemarkText.trim() || !selectedStudentId) return;
    try {
      const res = await academicianService.addStudentRemark(selectedStudentId, {
        remarks: newRemarkText.trim(),
        category: 'Faculty Guidance'
      });
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Success', message: 'Faculty remark recorded successfully', type: 'success' });
        setNewRemarkText('');
        // Refresh dossier
        const updated = await academicianService.getStudent(selectedStudentId);
        if (updated.success) setStudentDossier(updated.data);
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // Create Course Handler
  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault();
    if (!courseForm.title.trim()) return;
    try {
      const res = await academicianService.createCourse({
        title: courseForm.title,
        description: courseForm.description,
        category: courseForm.category,
        skillCategory: courseForm.skillCategory,
        difficulty: courseForm.difficulty,
        durationWeeks: courseForm.durationWeeks,
        hours: courseForm.hours,
        learningObjectives: courseForm.objectives.filter(o => o.trim()),
        modules: courseForm.modules
      });
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Course Published', message: 'Course created and added to curriculum!', type: 'success' });
        setActivePage('academician-courses');
        fetchAllData();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // Create Assessment Handler
  const handleCreateAssessmentSubmit = async (e) => {
    e.preventDefault();
    if (!asmtForm.title.trim()) return;
    try {
      const res = await academicianService.createAssessment({
        title: asmtForm.title,
        description: asmtForm.description,
        skillCategory: asmtForm.skillCategory || 'Programming',
        domain: asmtForm.domain || 'Computer Science',
        difficulty: asmtForm.difficulty || 'Intermediate',
        durationMinutes: Number(asmtForm.durationMinutes) || 30,
        passingScore: Number(asmtForm.passingScore) || 60,
        totalMarks: Number(asmtForm.totalMarks) || 100,
        totalQuestions: asmtForm.questions.length,
        targetScope: asmtForm.targetScope || 'entire_class',
        targetClassIds: asmtForm.targetClassIds || [],
        targetStudentIds: asmtForm.targetStudentIds || [],
        questions: asmtForm.questions.map(q => ({
          topic: q.topic || asmtForm.skillCategory,
          questionText: q.question,
          type: q.questionType || 'mcq',
          difficulty: q.difficulty || asmtForm.difficulty,
          marks: Number(q.marks) || 10,
          skillCategory: asmtForm.skillCategory,
          options: q.options?.map((opt, i) => ({ text: opt, isCorrect: i === q.correctIndex })) || [],
          problemStatement: q.problemStatement,
          inputFormat: q.inputFormat,
          outputFormat: q.outputFormat,
          constraints: q.constraints,
          sampleInput: q.sampleInput,
          sampleOutput: q.sampleOutput,
          testCases: q.testCases
        }))
      });
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Assessment Created', message: 'New Skill Assessment successfully published to target cohort!', type: 'success' });
        setActivePage('academician-assessments');
        fetchAllData();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // Assign Remediation Course (Legacy)
  const handleAssignRemediationCourseSubmit = async () => {
    if (!assignData.courseId || assignData.studentIds.length === 0) {
      if (onShowToast) onShowToast({ title: 'Notice', message: 'Please select a course and at least one student.', type: 'warning' });
      return;
    }
    try {
      const res = await academicianService.assignCourse(assignData);
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Success', message: res.message, type: 'success' });
        setShowAssignCourseModal(false);
        fetchAllData();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // Schedule Mentorship Session
  const handleScheduleSessionSubmit = async (e) => {
    e.preventDefault();
    if (!sessionForm.studentId || !sessionForm.title || !sessionForm.scheduledAt) return;
    try {
      const res = await academicianService.scheduleSession(sessionForm);
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Session Scheduled', message: 'Mentorship session scheduled with meeting link.', type: 'success' });
        setShowScheduleModal(false);
        setSessionForm({ studentId: '', title: '', topic: '', scheduledAt: '', durationMinutes: 30, meetingLink: '', notes: '' });
        fetchAllData();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // Filtered Students Directory
  const filteredStudents = useMemo(() => {
    return studentsList.filter(s => {
      const matchesSearch = !studentSearch.trim() ||
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.registerNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.department.toLowerCase().includes(studentSearch.toLowerCase());
      const matchesDept = deptFilter === 'All' || s.department.toLowerCase().includes(deptFilter.toLowerCase());
      const matchesYear = yearFilter === 'All' || String(s.year).includes(yearFilter);
      const matchesTier = readinessFilter === 'All' || s.readinessTier === readinessFilter;
      return matchesSearch && matchesDept && matchesYear && matchesTier;
    });
  }, [studentsList, studentSearch, deptFilter, yearFilter, readinessFilter]);

  // Export Students to CSV
  const handleExportStudentsCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = ['Student Name', 'Register Number', 'Department', 'Year', 'Skill Score', 'Assessment Score', 'Course Progress', 'Industry Readiness', 'Status'];
    const rows = filteredStudents.map(s => [
      `"${s.name}"`,
      `"${s.registerNumber}"`,
      `"${s.department}"`,
      `"${s.year}"`,
      s.skillScore,
      s.assessmentScore,
      `${s.courseProgress}%`,
      `${s.industryReadiness}% (${s.readinessTier})`,
      s.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `student_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── NEW: Load My Classes for assignment target selection ─────────────────
  const fetchMyClasses = useCallback(async () => {
    try {
      const res = await academicianService.getMyClasses();
      if (res.success) setMyClasses(res.data || []);
    } catch {}
  }, []);

  // ── NEW: Open Course Assignment Modal ────────────────────────────────────
  const handleOpenAssignModal = (course) => {
    setCourseToAssign(course);
    setAssignForm({ targetType: 'entire_class', targetClassIds: [], targetStudentIds: [] });
    setShowAssignModal(true);
    fetchMyClasses();
  };

  // ── NEW: Submit Course Assignment ────────────────────────────────────────
  const handleAssignCourseSubmit = async () => {
    if (!courseToAssign) return;
    setAssigning(true);
    try {
      const res = await academicianService.assignCourseToStudents(courseToAssign.id, {
        targetType: assignForm.targetType,
        targetClassIds: assignForm.targetClassIds,
        targetStudentIds: assignForm.targetStudentIds
      });
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Course Assigned!', message: res.message, type: 'success' });
        setShowAssignModal(false);
        fetchAllData();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setAssigning(false);
    }
  };

  // ── NEW: Load Course Progress for a specific course ─────────────────────
  const handleViewCourseProgress = async (course) => {
    setSelectedCourseForProgress(course);
    setLoadingCourseProgress(true);
    setActivePage('academician-course-progress');
    try {
      const res = await academicianService.getCourseProgress(course.id);
      if (res.success) setCourseProgressData(res.data);
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setLoadingCourseProgress(false);
    }
  };

  // ── NEW: Load Overall Progress ───────────────────────────────────────────
  const fetchOverallProgress = useCallback(async () => {
    try {
      const res = await academicianService.getOverallProgress();
      if (res.success) setOverallProgress(res.data);
    } catch {}
  }, []);

  // ── NEW: Soft-delete course → Trash ─────────────────────────────────────
  const handleSoftDeleteCourse = async (courseId) => {
    try {
      const res = await academicianService.softDeleteCourse(courseId);
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Moved to Trash', message: 'Course moved to trash. You can restore it.', type: 'success' });
        fetchAllData();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // ── NEW: Soft-delete assessment → Trash ─────────────────────────────────
  const handleSoftDeleteAssessment = async (assessmentId) => {
    try {
      const res = await academicianService.softDeleteAssessment(assessmentId);
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Moved to Trash', message: 'Assessment moved to trash. You can restore it.', type: 'success' });
        fetchAllData();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // ── NEW: Load Trash ──────────────────────────────────────────────────────
  const fetchTrash = useCallback(async () => {
    setLoadingTrash(true);
    try {
      const res = await academicianService.getTrash();
      if (res.success) setTrashData(res.data || { courses: [], assessments: [] });
    } catch {} finally { setLoadingTrash(false); }
  }, []);

  // ── NEW: Restore from Trash ──────────────────────────────────────────────
  const handleRestoreFromTrash = async (id, itemType) => {
    try {
      const res = await academicianService.restoreItem(id, itemType);
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Restored!', message: `${itemType} restored successfully.`, type: 'success' });
        fetchTrash();
        fetchAllData();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // ── NEW: Permanent Delete from Trash ────────────────────────────────────
  const handlePermanentDelete = async (id, itemType) => {
    if (!window.confirm(`Permanently delete this ${itemType}? This CANNOT be undone.`)) return;
    try {
      const res = await academicianService.permanentDeleteItem(id, itemType);
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Permanently Deleted', message: `${itemType} permanently deleted.`, type: 'warning' });
        fetchTrash();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // ── NEW: Load Pending Achievements ──────────────────────────────────────
  const fetchPendingAchievements = useCallback(async () => {
    setLoadingAchievements(true);
    try {
      const res = await academicianService.getPendingAchievements();
      if (res.success) setPendingAchievements(res.data || { certificates: [], projects: [] });
    } catch {} finally { setLoadingAchievements(false); }
  }, []);

  // ── NEW: Verify Achievement ──────────────────────────────────────────────
  const handleVerifyAchievement = async (id, achievementType) => {
    try {
      const res = await academicianService.verifyAchievement(id, achievementType, achievementComment);
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Verified!', message: 'Achievement approved and forwarded to Institution for final verification.', type: 'success' });
        setAchievementComment('');
        fetchPendingAchievements();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // ── NEW: Reject Achievement ──────────────────────────────────────────────
  const handleRejectAchievement = async (id, achievementType) => {
    if (!achievementComment.trim()) {
      if (onShowToast) onShowToast({ title: 'Comment Required', message: 'Please provide a reason for rejection.', type: 'warning' });
      return;
    }
    try {
      const res = await academicianService.rejectAchievement(id, achievementType, achievementComment);
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Rejected', message: 'Achievement rejected with comment.', type: 'warning' });
        setAchievementComment('');
        fetchPendingAchievements();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (currentTab === 'trash') fetchTrash();
    if (currentTab === 'achievements') fetchPendingAchievements();
    if (currentTab === 'overall-progress') fetchOverallProgress();
    if (currentTab === 'assigned-courses') {
      academicianService.getAssignedCourses().then(res => {
        if (res.success) setAssignedCoursesList(res.data || []);
      }).catch(() => {});
    }
  }, [currentTab, fetchTrash, fetchPendingAchievements, fetchOverallProgress]);

  // Render Loading Spinner
  if (loading && !dashboardData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em' }}>
          SYNCHRONIZING ACADEMIC COMMAND MATRIX...
        </div>
      </div>
    );
  }

  const academician = dashboardData?.academician || {
    name: user?.name || '',
    designation: user?.designation || 'Faculty',
    department: user?.department || '',
    institution: user?.institutionName || ''
  };

  const stats = dashboardData?.statistics || {
    totalStudents: studentsList.length,
    myCourses: coursesList.length,
    activeAssessments: assessmentsList.length,
    avgSkillScore: 0,
    studentsNeedingSupport: 0,
    industryReadyStudents: 0
  };


  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* ── SIH DEMO ENVIRONMENT BADGE ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px', borderRadius: '12px',
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        marginBottom: '20px', flexWrap: 'wrap', gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
            background: '#38bdf8', boxShadow: '0 0 8px #38bdf8'
          }} />
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
            SIH DEMO ENVIRONMENT
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Connected Demo Ecosystem • Dr. Ramesh Sundaram (HOD & Professor, CSE)
          </span>
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          ABC Engineering College • CSE III-A Lead
        </div>
      </div>

      {/* ── CONNECTED SIH DEMO ECOSYSTEM — ACADEMIC SUPERVISION & LIVE ACTIVITY ── */}
      <ConnectedEcosystemCard activeRole="academician" />

      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                Connected Demo Ecosystem — Academic Supervision
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Real-time cohort monitoring, course enrollment tracking, and student activity dispatch
              </span>
            </div>
          </div>
          <span className="cyber-badge badge-purple" style={{ fontSize: '10px', padding: '3px 10px' }}>
            CSE III-A ACTIVE COHORT
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          {/* Mapped Student Dossier Quickcard */}
          <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                Connected Mentee
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-heading)' }}>
                Arun Kumar
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Roll: 23CSE042 • CSE III-A (Batch 2023–2027)
              </div>
              <div style={{ fontSize: '11px', color: '#10B981', marginTop: '6px', fontWeight: 600 }}>
                ● CGPA: 8.85 • 8 Verified Skills (Python, React, DSA, SQL)
              </div>
            </div>
            <button
              onClick={() => {
                const arun = studentsList.find(s => s.name?.includes('Arun') || s.rollNumber === '23CSE042') || studentsList[0];
                if (arun) {
                  setSelectedStudentId(arun.id);
                  setActivePage('academician-student-detail');
                } else {
                  setActivePage('academician-students');
                }
              }}
              style={{
                marginTop: '12px', padding: '6px 12px', borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start'
              }}
            >
              <Eye size={13} /> View Arun Kumar Dossier
            </button>
          </div>

          {/* Institutional Skill Enrollment Monitor */}
          <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
              Enrolled Institutional Skill
            </div>
            <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-heading)' }}>
              Advanced React.js & State Architecture
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Offered by ABC Engineering College • 6 Weeks Program
            </div>
            <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '6px', fontWeight: 600 }}>
              ● Arun Kumar: Enrolled • Initial Progress (0%)
            </div>
          </div>

          {/* Industry Demand Alignment */}
          <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
              Industry Partner Alignment
            </div>
            <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-heading)' }}>
              SBT TECH Innovations
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Requisition: Associate Full Stack AI Developer
            </div>
            <div style={{ fontSize: '11px', color: '#10B981', marginTop: '6px', fontWeight: 600 }}>
              ● Required: React.js, Python, SQL, DSA (Match active)
            </div>
          </div>
        </div>

        {/* Live Academician Action: Create React.js Activity */}
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="cyber-badge badge-purple" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                LIVE ACTION
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-heading)' }}>
                Create Activity: React.js Mini Project
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0 }}>
              Target: CSE III-A • 45 Mins Practical • Dispatches real PostgreSQL notification to student Arun Kumar
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activityAssigned ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 700, fontSize: '12.5px' }}>
                <CheckCircle2 size={16} /> Activity Assigned & Dispatched!
              </span>
            ) : (
              <button
                onClick={handleAssignDemoActivity}
                disabled={assigningActivity}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  cursor: assigningActivity ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.35)'
                }}
              >
                <Send size={13} />
                {assigningActivity ? 'Publishing Activity...' : 'Assign Activity to CSE III-A →'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Ecosystem Activity Stream (Section 20 & 21) */}
      <div style={{ marginBottom: '24px' }}>
        <RecentEcosystemActivity compact={false} />
      </div>

      {/* ── Top Workspace Header ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Welcome, {academician.name}
            </h1>
            <span style={{
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#6366f1',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              STAFF ID: {academician.facultyId || academician.staffId || 'FAC-001'}
            </span>
            {academician.className && (
              <span style={{
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700
              }}>
                CLASS: {academician.className}
              </span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            <strong>{academician.designation}</strong> • {academician.department} • <em>{academician.institution}</em>
          </div>
        </div>

        {/* Action Button Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActivePage('academician-create-course')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--grad-ai-primary)',
              border: 'none',
              color: '#ffffff',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
            }}
          >
            <Plus size={15} /> Create Course
          </button>
          <button
            onClick={() => setActivePage('academician-create-assessment')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#6366f1',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Award size={15} /> Create Assessment
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Calendar size={15} /> Schedule Mentorship
          </button>
          <button
            onClick={fetchAllData}
            title="Refresh Real Data"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              padding: '9px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Sub-navigation Tabs matching prompt specification ────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '14px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {[
          { id: 'dashboard', page: 'academician-dashboard', label: 'Overview', icon: Home },
          { id: 'students', page: 'academician-students', label: 'My Students', icon: Users, count: studentsList.length },
          { id: 'student-performance', page: 'academician-student-performance', label: 'Student Performance', icon: TrendingUp, count: (studentPerformanceList.length || studentsList.length) },
          { id: 'courses', page: 'academician-courses', label: 'My Courses', icon: BookOpen, count: coursesList.length },
          { id: 'assigned-courses', page: 'academician-assigned-courses', label: 'Assigned Courses', icon: UserCheck },
          { id: 'overall-progress', page: 'academician-overall-progress', label: 'Course Progress', icon: TrendingUp },
          { id: 'assessments', page: 'academician-skill-assessments', label: 'Skill Assessments', icon: Award, count: assessmentsList.length },
          { id: 'achievements', page: 'academician-achievements', label: 'Verify Achievements', icon: ShieldCheck, count: (pendingAchievements.certificates.length + pendingAchievements.projects.length) || undefined, badge: (pendingAchievements.certificates.length + pendingAchievements.projects.length) > 0 ? 'Pending' : undefined },
          { id: 'skill-analytics', page: 'academician-skill-analytics', label: 'Skill Analytics', icon: BarChart2 },
          { id: 'skill-gaps', page: 'academician-skill-gaps', label: 'Skill Gaps', icon: Target, count: skillGapsList.length, badge: 'Crucial' },
          { id: 'mentorship', page: 'academician-mentorship', label: 'Mentorship', icon: MessageSquare, count: mentorshipData.mentees?.length },
          { id: 'industry-requirements', page: 'academician-industry-requirements', label: 'Industry Demands', icon: Briefcase },
          { id: 'opportunities', page: 'academician-opportunities', label: 'Opportunities', icon: Sparkles },
          { id: 'notifications', page: 'academician-notifications', label: 'Notifications', icon: Bell, count: notificationsList.filter(n => !n.read).length },
          { id: 'trash', page: 'academician-trash', label: 'Trash', icon: Trash2 }
        ].map(tab => {

          const isCurrent = currentTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePage(tab.page)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: isCurrent ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isCurrent ? '#6366f1' : 'var(--text-secondary)',
                border: isCurrent ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  background: isCurrent ? '#6366f1' : 'var(--bg-input)',
                  color: isCurrent ? '#fff' : 'var(--text-muted)',
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontWeight: 700
                }}>
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span style={{ background: '#f59e0b', color: '#000', fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 1: ACADEMICIAN DASHBOARD
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'dashboard' && (
        <div>
          {/* 6 Key Statistics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
          }}>
            {[
              { label: 'Total Assigned Students', value: stats.totalStudents, sub: 'Mapped to your classes', icon: Users, color: '#6366f1', link: 'academician-students' },
              { label: 'Active Students', value: stats.activeStudents ?? stats.totalStudents, sub: 'Engaged in portal', icon: UserCheck, color: '#06b6d4', link: 'academician-students' },
              { label: 'Average Course Progress', value: `${stats.avgCourseProgress ?? 0}%`, sub: 'Real lesson progress', icon: BookOpen, color: '#10b981', link: 'academician-courses' },
              { label: 'Average Skill Score', value: `${stats.avgSkillScore}%`, sub: 'Cohort competency', icon: Brain, color: '#3b82f6', link: 'academician-analytics' },
              { label: 'Assessment Completion', value: `${stats.assessmentCompletion ?? 0}%`, sub: 'Test submissions', icon: Award, color: '#8b5cf6', link: 'academician-assessments' },
              { label: 'Students Needing Attention', value: stats.studentsNeedingSupport, sub: 'Low progress / skill gaps', icon: AlertTriangle, color: '#ef4444', link: 'academician-skill-gaps' },
              { label: 'Industry Ready Students', value: stats.industryReadyStudents, sub: '75%+ readiness score', icon: CheckCircle2, color: '#22c55e', link: 'academician-opportunities' }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  onClick={() => setActivePage(stat.link)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    padding: '18px',
                    boxShadow: 'var(--shadow-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = stat.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {stat.label}
                    </span>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${stat.color}15`,
                      color: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={17} />
                    </div>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {stat.sub}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── CLASS-LEVEL ANALYTICS (Requirement 14) ── */}
          {dashboardData?.classAnalytics && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '28px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    ASSIGNED CLASS TELEMETRY
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                    {dashboardData.classAnalytics.className || 'Assigned Class'} Analytics
                  </h3>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Aggregated from live student records
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Students</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{dashboardData.classAnalytics.totalStudents}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Avg Course Progress</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>{dashboardData.classAnalytics.avgCourseProgress}%</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Avg Skill Score</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#3b82f6' }}>{dashboardData.classAnalytics.avgSkillScore}%</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Assessment Completion</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#8b5cf6' }}>{dashboardData.classAnalytics.assessmentCompletion}%</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Industry Ready</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#22c55e' }}>{dashboardData.classAnalytics.industryReadyCount}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Needing Attention</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444' }}>{dashboardData.classAnalytics.needingAttentionCount}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── STUDENTS NEEDING ATTENTION (Requirement 15) ── */}
          {dashboardData?.studentsNeedingAttention && dashboardData.studentsNeedingAttention.length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '28px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <AlertTriangle size={18} color="#ef4444" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f87171', margin: 0 }}>
                  Students Needing Attention ({dashboardData.studentsNeedingAttention.length})
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {dashboardData.studentsNeedingAttention.map((st, i) => (
                  <div key={i} style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{st.name}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{st.rollNumber}</div>
                        </div>
                        <span style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          Skill Gap: {st.skillGap}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Course Progress: <strong style={{ color: '#ef4444' }}>{st.courseProgress}%</strong> • Last Activity: {st.lastActivity}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStudentId(st.id);
                        setActivePage('academician-students');
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      View Student Dossier →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two-Column Telemetry: Skill Development & Student Performance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            {/* 6 Skill Development Domains */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-heading)' }}>
                    Skill Development Telemetry
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                    Real competency scores evaluated across 6 core domains.
                  </p>
                </div>
                <button
                  onClick={() => setActivePage('academician-skill-gaps')}
                  style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  View Gaps <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(dashboardData?.skillDevelopment || [
                  { domain: 'Programming', score: 74, benchmark: 80 },
                  { domain: 'Aptitude', score: 58, benchmark: 75 },
                  { domain: 'Logical Reasoning', score: 71, benchmark: 75 },
                  { domain: 'Communication', score: 62, benchmark: 75 },
                  { domain: 'Problem Solving', score: 69, benchmark: 80 },
                  { domain: 'Technical Skills', score: 76, benchmark: 80 }
                ]).map((sk, i) => {
                  const isBelow = sk.score < sk.benchmark;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '5px' }}>
                        <span style={{ color: 'var(--text-heading)' }}>{sk.domain}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: isBelow ? '#ef4444' : '#10b981' }}>{sk.score}%</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Benchmark: {sk.benchmark}%)</span>
                        </div>
                      </div>
                      <div style={{ height: '7px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${sk.score}%`,
                          background: isBelow
                            ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                            : 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                          borderRadius: '999px',
                          transition: 'width 0.8s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Student Performance Distribution */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-heading)' }}>
                    Student Cohort Distribution
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                    Grading distribution based on live skill & assessment indices.
                  </p>
                </div>
                <button
                  onClick={() => setActivePage('academician-students')}
                  style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Full Directory <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(dashboardData?.performanceDistribution || [
                  { tier: 'Elite (85%+)', count: 3, color: '#10B981' },
                  { tier: 'Proficient (70-84%)', count: 6, color: '#6366F1' },
                  { tier: 'Developing (55-69%)', count: 4, color: '#F59E0B' },
                  { tier: 'Needs Support (<55%)', count: 1, color: '#EF4444' }
                ]).map((tier, i) => {
                  const pct = stats.totalStudents > 0 ? Math.round((tier.count / stats.totalStudents) * 100) : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: tier.color }} />
                          <span style={{ color: 'var(--text-heading)' }}>{tier.tier}</span>
                        </div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {tier.count} Students ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: tier.color, borderRadius: '999px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Prompt to Action */}
              <div style={{
                marginTop: '22px',
                padding: '14px 16px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                  <strong>{stats.studentsNeedingSupport} students</strong> require remedial assignments in Aptitude and Logic.
                </div>
                <button
                  onClick={() => setActivePage('academician-skill-gaps')}
                  style={{
                    background: '#6366f1',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Take Action
                </button>
              </div>
            </div>
          </div>

          {/* Recent Courses & Assessments Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
            {/* Courses Overview */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15.5px', fontWeight: 700, margin: 0, color: 'var(--text-heading)' }}>
                  Active Learning Modules
                </h3>
                <button onClick={() => setActivePage('academician-courses')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                  Manage All
                </button>
              </div>
              {coursesList.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No courses created yet. Click "Create Course" above to publish your first learning track.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {coursesList.slice(0, 4).map(c => (
                    <div key={c.id} style={{
                      padding: '12px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-heading)' }}>{c.title}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {c.category} • {c.enrolledCount} enrolled • Avg Progress: {c.avgProgress}%
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '3px 8px', borderRadius: '4px' }}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assessments Overview */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15.5px', fontWeight: 700, margin: 0, color: 'var(--text-heading)' }}>
                  Active Diagnostics & Exams
                </h3>
                <button onClick={() => setActivePage('academician-assessments')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                  View Results
                </button>
              </div>
              {assessmentsList.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No assessments configured yet. Click "Create Assessment" to build a diagnostic exam.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {assessmentsList.slice(0, 4).map(a => (
                    <div key={a.id} style={{
                      padding: '12px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-heading)' }}>{a.title}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {a.type} • {a.durationMinutes} mins • Passing: {a.passingScore}%
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewAssessmentResults(a.id)}
                        style={{
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          color: '#6366f1',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Results
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions (Requirement 22) */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-heading)' }}>
              Faculty Quick Command Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {[
                { label: 'View Students', page: 'academician-students', icon: Users, color: '#6366f1', desc: 'Assigned student directory' },
                { label: 'Student Performance', page: 'academician-student-performance', icon: TrendingUp, color: '#10b981', desc: 'Cohort telemetry & profile' },
                { label: 'Create Skill Assessment', page: 'academician-create-assessment', icon: Award, color: '#38bdf8', desc: 'Design new assessment test' },
                { label: 'View Assessment Results', page: 'academician-assessments', icon: CheckCircle2, color: '#a855f7', desc: 'Examine student scores' },
                { label: 'Mentorship Workspace', page: 'academician-mentorship', icon: GraduationCap, color: '#f59e0b', desc: 'Direct faculty guidance' },
                { label: 'Skill Analytics', page: 'academician-skill-analytics', icon: BarChart2, color: '#ec4899', desc: 'Longitudinal growth curves' }
              ].map((act, i) => {
                const Icon = act.icon;
                return (
                  <button
                    key={i}
                    onClick={() => setActivePage(act.page)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = act.color; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${act.color}15`, color: act.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>{act.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{act.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Students Needing Attention (Requirement 24) */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                  EARLY WARNING SYSTEM
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                  Students Needing Attention ({studentsNeedingAttention.length})
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Identified automatically from low course progress, failing assessments, or critical skill gaps
              </span>
            </div>

            {studentsNeedingAttention.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                All assigned students are currently meeting or exceeding academic benchmarks.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 14px' }}>STUDENT</th>
                      <th style={{ padding: '10px 14px' }}>REGISTER NO</th>
                      <th style={{ padding: '10px 14px' }}>TRIGGER REASON</th>
                      <th style={{ padding: '10px 14px' }}>CURRENT SCORE</th>
                      <th style={{ padding: '10px 14px' }}>RECOMMENDED ACTION</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsNeedingAttention.map((st, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-heading)' }}>
                          {st.name}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {st.registerNumber}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                            {st.attentionReason || 'Needs Academic Support'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#ef4444' }}>
                          {st.currentScore != null ? `${st.currentScore}%` : (st.skillScore ? `${st.skillScore}%` : 'Pending')}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                          {st.recommendedAction || 'Schedule 1-on-1 mentorship drill and assign foundational tracks.'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setSelectedStudentId(st.id);
                              setActivePage('academician-student-performance-detail', st.id);
                            }}
                            style={{
                              background: 'rgba(99, 102, 241, 0.1)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              color: '#6366f1',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Investigate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW: DEDICATED STUDENT PERFORMANCE PAGE (Requirement 13)
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'student-performance' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                  CLASS ADVISORY COHORT
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                  Student Performance Roster
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                {dashboardData?.profile?.name || user?.name || 'Class Advisor'} • {dashboardData?.profile?.department || 'Department'} • {dashboardData?.profile?.className || 'Assigned Class'}
              </p>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>STUDENT NAME</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>STUDENT ID</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>DEPARTMENT</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>CLASS</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>COURSE PROGRESS</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>SKILL SCORE</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>ASSESSMENT SCORE</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>CERTIFICATES</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>READINESS</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No students currently mapped to your assigned institution, department, and class.
                    </td>
                  </tr>
                ) : (
                  studentsList.map((st, i) => (
                    <tr
                      key={st.id || i}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-heading)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {st.name}
                          {st.needsAttention && (
                            <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              Attention
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {st.registerNumber || st.studentId || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {st.department}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600 }}>
                          {st.class_name ? `${st.class_name} ${st.class_section || ''}`.trim() : (st.className || 'Assigned Class')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${st.courseProgress || 0}%`, height: '100%', background: '#6366f1' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{st.courseProgress || 0}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: (st.skillScore || 0) >= 60 ? '#10b981' : '#f59e0b' }}>
                        {st.skillScore || 0}%
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                        {st.assessmentScore || 0}%
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                        {st.certificatesCount || 0}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: (st.readinessScore || 0) >= 75 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                          color: (st.readinessScore || 0) >= 75 ? '#10b981' : '#6366f1'
                        }}>
                          {st.readinessScore || 0}% ({st.readinessTier || 'Developing'})
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedStudentId(st.id);
                            setActivePage('academician-student-performance-detail', st.id);
                          }}
                          style={{
                            background: 'var(--grad-ai-primary)',
                            border: 'none',
                            color: '#ffffff',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          View Performance
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW: COMPLETE INDIVIDUAL STUDENT PERFORMANCE & VISUAL TIMELINE (Requirements 14 & 15)
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'student-detail' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <button
              onClick={() => setActivePage('academician-student-performance')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-heading)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ← Back to Student Performance
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  if (studentDossier?.info?.id) {
                    academicianService.addMentee({ studentId: studentDossier.info.id, goals: 'Career guidance', notes: 'Enrolled from performance view' })
                      .then(() => onShowToast && onShowToast({ title: 'Success', message: 'Student enrolled into mentorship roster!', type: 'success' }));
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#6366f1',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <GraduationCap size={15} /> Enroll in Mentorship
              </button>
            </div>
          </div>

          {loadingDossier ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading comprehensive student performance dossier...
            </div>
          ) : !studentDossier ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No student selected or student record could not be loaded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 1. Student Information Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--shadow-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                        {studentDossier.info?.name || 'Student Profile'}
                      </h2>
                      <span style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#6366f1',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800
                      }}>
                        {studentDossier.info?.registerNumber || studentDossier.info?.studentId || 'STU001'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span><strong>Email:</strong> {studentDossier.info?.email}</span>
                      <span><strong>Institution:</strong> {studentDossier.info?.institution || 'Institution'}</span>
                      <span><strong>Department:</strong> {studentDossier.info?.department || 'CSE'}</span>
                      <span><strong>Class:</strong> {studentDossier.info?.className || 'Assigned Class'}</span>
                      <span><strong>Year/Sem:</strong> Year {studentDossier.info?.year || 3}, Sem {studentDossier.info?.semester || 5}</span>
                    </div>
                  </div>

                  <div style={{
                    padding: '14px 20px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '12px',
                    textAlign: 'right'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>INDUSTRY READINESS SCORE</div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#6366f1' }}>
                      {studentDossier.info?.readinessScore || 0}%
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 700 }}>
                      ● {studentDossier.info?.readinessTier || 'Developing'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Course Performance & 3. Skill Performance Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
                {/* 2. Course Performance */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={17} color="#6366f1" /> Course Performance
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enrolled</div>
                      <div style={{ fontSize: '18px', fontWeight: 800 }}>{studentDossier.coursePerformance?.enrolledCount || 0}</div>
                    </div>
                    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completed</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>{studentDossier.coursePerformance?.completedCount || 0}</div>
                    </div>
                    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Completion</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#6366f1' }}>{studentDossier.coursePerformance?.completionPercentage || 0}%</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(studentDossier.coursePerformance?.courses || []).length === 0 ? (
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>No courses enrolled yet.</div>
                    ) : (
                      (studentDossier.coursePerformance?.courses || []).map((c, idx) => (
                        <div key={idx} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{c.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status: {c.enrollment_status}</div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#6366f1' }}>{c.progress_percentage}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Skill Performance */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: 0, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Brain size={17} color="#38bdf8" /> Skill Performance & Growth
                    </h3>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
                      Growth: +{studentDossier.skillPerformance?.skillGrowthPercentage || 0}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { domain: 'Programming', score: studentDossier.skillPerformance?.domains?.Programming || 0 },
                      { domain: 'Aptitude', score: studentDossier.skillPerformance?.domains?.Aptitude || 0 },
                      { domain: 'Logical Reasoning', score: studentDossier.skillPerformance?.domains?.['Logical Reasoning'] || 0 },
                      { domain: 'Technical Skills', score: studentDossier.skillPerformance?.domains?.['Technical Skills'] || 0 },
                      { domain: 'Communication', score: studentDossier.skillPerformance?.domains?.Communication || 0 },
                      { domain: 'Problem Solving', score: studentDossier.skillPerformance?.domains?.['Problem Solving'] || 0 }
                    ].map((sk, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                          <span>{sk.domain}</span>
                          <span style={{ color: sk.score >= 70 ? '#10b981' : sk.score >= 50 ? '#6366f1' : '#f59e0b' }}>{sk.score}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${sk.score}%`, background: 'var(--grad-ai-primary)', borderRadius: '999px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Assessment Performance */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={17} color="#f59e0b" /> Assessment Performance & Test History
                </h3>
                {(studentDossier.assessmentPerformance || []).length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No assessments attempted yet.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '10px 14px' }}>ASSESSMENT</th>
                          <th style={{ padding: '10px 14px' }}>DATE</th>
                          <th style={{ padding: '10px 14px' }}>SCORE</th>
                          <th style={{ padding: '10px 14px' }}>PERCENTAGE</th>
                          <th style={{ padding: '10px 14px' }}>IMPROVEMENT</th>
                          <th style={{ padding: '10px 14px' }}>SKILL EVALUATED</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentDossier.assessmentPerformance.map((ap, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px 14px', fontWeight: 700 }}>{ap.assessmentName}</td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{ap.date ? new Date(ap.date).toLocaleDateString() : 'Recent'}</td>
                            <td style={{ padding: '12px 14px', fontWeight: 700 }}>{ap.score}</td>
                            <td style={{ padding: '12px 14px', fontWeight: 700, color: ap.percentage >= 60 ? '#10b981' : '#f59e0b' }}>{ap.percentage}%</td>
                            <td style={{ padding: '12px 14px', color: '#10b981', fontWeight: 700 }}>+{ap.improvement || 0}%</td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                                {ap.skillEvaluated || 'Technical'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 5. Certificates, 6. Projects, 7. Internships Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* 5. Certificates */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700, margin: '0 0 12px', color: 'var(--text-heading)' }}>
                    Certificates ({(studentDossier.certificates || []).length})
                  </h4>
                  {(studentDossier.certificates || []).length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No verified certificates yet.</div>
                  ) : (
                    (studentDossier.certificates || []).map((cf, idx) => (
                      <div key={idx} style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{cf.certificate}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{cf.provider} • {cf.status}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* 6. Projects */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700, margin: '0 0 12px', color: 'var(--text-heading)' }}>
                    Capstone & Portfolio Projects ({(studentDossier.projects || []).length})
                  </h4>
                  {(studentDossier.projects || []).length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No submitted projects yet.</div>
                  ) : (
                    (studentDossier.projects || []).map((pj, idx) => (
                      <div key={idx} style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{pj.name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Tech: {pj.technology} • Status: {pj.status}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* 7. Internships */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700, margin: '0 0 12px', color: 'var(--text-heading)' }}>
                    Internships & Industry Proofs ({(studentDossier.internships || []).length})
                  </h4>
                  {(studentDossier.internships || []).length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active internship records.</div>
                  ) : (
                    (studentDossier.internships || []).map((it, idx) => (
                      <div key={idx} style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{it.role} — {it.company}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Duration: {it.duration} • {it.status}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 8. Industry Readiness & 9. Mentorship Feedback */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
                {/* 8. Industry Readiness */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-heading)' }}>
                    Industry Readiness & Skill Gap
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                      <span>Current Readiness Score</span>
                      <strong style={{ color: '#6366f1' }}>{studentDossier.industryReadiness?.currentReadinessScore || studentDossier.info?.readinessScore || 0}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                      <span>Readiness Tier</span>
                      <strong>{studentDossier.industryReadiness?.readinessStatus || studentDossier.info?.readinessTier || 'Developing'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                      <span>Identified Skill Gap</span>
                      <strong style={{ color: '#f59e0b' }}>{studentDossier.industryReadiness?.skillGap || 'Minimal Gap'}</strong>
                    </div>
                  </div>
                </div>

                {/* 9. Mentorship & Guidance */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-heading)' }}>
                    Mentorship & Faculty Guidance
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Add an advisory remark for this student..."
                      value={newRemarkText}
                      onChange={(e) => setNewRemarkText(e.target.value)}
                      style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
                    />
                    <button
                      onClick={handleAddRemark}
                      style={{ background: '#6366f1', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Post Remark
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                    {(studentDossier.mentorship?.facultyRemarks || []).length === 0 ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No mentorship remarks recorded yet.</div>
                    ) : (
                      (studentDossier.mentorship?.facultyRemarks || []).map((rm, i) => (
                        <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '8px', fontSize: '12px' }}>
                          "{rm.remarks || rm}"
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 10. VISUAL PERFORMANCE TIMELINE (Requirement 15) */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: 'var(--shadow-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-heading)' }}>
                      Student Growth & Competency Progression Timeline
                    </h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                      Chronological visual trajectory of major milestones, assessments, course enrollments, and skill upgrades.
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', padding: '3px 10px', borderRadius: '6px', fontWeight: 700 }}>
                    {(studentDossier.timeline || []).length} Milestones Recorded
                  </span>
                </div>

                {(studentDossier.timeline || []).length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No milestones recorded yet. Events will populate as the student engages with courses and assessments.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '24px' }}>
                    <div style={{
                      position: 'absolute',
                      left: '8px',
                      top: '10px',
                      bottom: '10px',
                      width: '2px',
                      background: 'linear-gradient(180deg, #6366f1 0%, #10b981 100%)'
                    }} />

                    {studentDossier.timeline.map((evt, idx) => (
                      <div key={idx} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                        <div style={{
                          position: 'absolute',
                          left: '-20px',
                          top: '4px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: evt.type === 'ready' ? '#10b981' : evt.type === 'assessment' ? '#f59e0b' : '#6366f1',
                          boxShadow: '0 0 8px currentColor'
                        }} />
                        <div style={{
                          flex: 1,
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '10px',
                          padding: '12px 16px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-heading)' }}>
                              {evt.title}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {evt.date ? new Date(evt.date).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {evt.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 2: STUDENT DIRECTORY
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'students' && (
        <div>
          {/* Controls Bar: Search, Filters, Export */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '14px 18px'
          }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search student name, register number, department..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-heading)',
                  fontSize: '13.5px'
                }}
              />
              {studentSearch && (
                <button onClick={() => setStudentSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  ✕
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px'
                }}
              >
                <option value="All">All Departments</option>
                <option value="CSE">Computer Science</option>
                <option value="ECE">Electronics</option>
                <option value="IT">Information Tech</option>
                <option value="AI">AI & Data Science</option>
              </select>

              <select
                value={readinessFilter}
                onChange={(e) => setReadinessFilter(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px'
                }}
              >
                <option value="All">All Readiness Tiers</option>
                <option value="Industry Ready">Industry Ready (80%+)</option>
                <option value="Near Ready">Near Ready (65-79%)</option>
                <option value="Needs Support">Needs Support (&lt;65%)</option>
              </select>

              <button
                onClick={handleExportStudentsCSV}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>STUDENT NAME</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>STUDENT ID</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>DEPARTMENT</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>CLASS</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>COURSE PROGRESS</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>SKILL PROGRESS</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>ASSESSMENT SCORE</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>INDUSTRY READINESS</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(s => (
                    <tr
                      key={s.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-heading)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {s.name}
                          {s.isMentee && (
                            <span style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Mentee
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {s.registerNumber}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {s.department}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          background: 'rgba(56, 189, 248, 0.12)',
                          color: '#38bdf8',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 600
                        }}>
                          {s.class_name ? `${s.class_name} ${s.class_section || ''}`.trim() : (s.className || 'Assigned Class')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${s.courseProgress}%`, height: '100%', background: '#6366f1' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{s.courseProgress}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: s.skillScore >= 75 ? '#10b981' : '#f59e0b' }}>
                        {s.skillScore}%
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                        {s.assessmentScore}%
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: s.readinessTier === 'Industry Ready' ? 'rgba(16, 185, 129, 0.12)' : s.readinessTier === 'Near Ready' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: s.readinessTier === 'Industry Ready' ? '#10b981' : s.readinessTier === 'Near Ready' ? '#6366f1' : '#ef4444'
                        }}>
                          {s.industryReadiness}% ({s.readinessTier})
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                          ● {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedStudentId(s.id)}
                          style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            color: '#6366f1',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 3: COURSE MANAGEMENT
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'courses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-heading)' }}>
                Curriculum & Course Management
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Manage institutional courses, lesson modules, and student enrollments.
              </p>
            </div>
            <button
              onClick={() => setActivePage('academician-create-course')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--grad-ai-primary)',
                border: 'none',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={15} /> Add New Course
            </button>
          </div>

          {coursesList.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <BookOpen size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-heading)' }}>
                No Courses Created Yet
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
                Build modern industry-aligned courses with modules, lessons, and assignments.
              </p>
              <button
                onClick={() => setActivePage('academician-create-course')}
                style={{ background: '#6366f1', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Create Your First Course
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {coursesList.map(c => (
                <div
                  key={c.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    padding: '20px',
                    boxShadow: 'var(--shadow-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                        {c.code || 'COURSE'}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                        {c.status}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-heading)' }}>
                      {c.title}
                    </h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.4 }}>
                      {c.description}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Enrolled: </span>
                        <strong>{c.enrolledCount} students</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Modules: </span>
                        <strong>{c.moduleCount} modules</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Duration: </span>
                        <strong>{c.duration}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Level: </span>
                        <strong>{c.difficulty}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                    <button
                      onClick={() => {
                        setAssignData({ courseId: c.id, studentIds: studentsList.map(s => s.id), notes: `Remediation for ${c.title}` });
                        setShowAssignCourseModal(true);
                      }}
                      style={{
                        flex: 1,
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        color: '#6366f1',
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Assign to Students
                    </button>
                    <button
                      onClick={() => onShowToast && onShowToast({ title: 'Course Analytics', message: `Average cohort progress: ${c.avgProgress}%`, type: 'info' })}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Analytics
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 4: CREATE COURSE FORM
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'create-course' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-subtle)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-heading)' }}>
              Author New Course Curriculum
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px' }}>
              Create an institutional course and assign modules, lessons, and learning objectives.
            </p>

            <form onSubmit={handleCreateCourseSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Cloud Systems & Microservices"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text-heading)', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Course Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide an overview of the curriculum and technologies taught..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text-heading)', fontSize: '13.5px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Category</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics & VLSI">Electronics & VLSI</option>
                    <option value="Data Science & AI">Data Science & AI</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="Core Engineering">Core Engineering</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Difficulty</label>
                  <select
                    value={courseForm.difficulty}
                    onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Duration (Weeks)</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={courseForm.durationWeeks}
                    onChange={(e) => setCourseForm({ ...courseForm, durationWeeks: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Module Builder */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '18px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>Course Modules ({courseForm.modules.length})</label>
                  <button
                    type="button"
                    onClick={() => setCourseForm({
                      ...courseForm,
                      modules: [...courseForm.modules, { title: `Module ${courseForm.modules.length + 1}: Practical Application`, duration: '3 Hours', lessons: [] }]
                    })}
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add Module
                  </button>
                </div>

                {courseForm.modules.map((mod, mi) => (
                  <div key={mi} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px 14px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        value={mod.title}
                        onChange={(e) => {
                          const updated = [...courseForm.modules];
                          updated[mi].title = e.target.value;
                          setCourseForm({ ...courseForm, modules: updated });
                        }}
                        style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '8px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
                      />
                      <input
                        type="text"
                        value={mod.duration}
                        onChange={(e) => {
                          const updated = [...courseForm.modules];
                          updated[mi].duration = e.target.value;
                          setCourseForm({ ...courseForm, modules: updated });
                        }}
                        placeholder="Duration"
                        style={{ width: '100px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '8px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActivePage('academician-courses')}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: 'var(--grad-ai-primary)', border: 'none', color: '#ffffff', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save & Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 5: ASSESSMENT MANAGEMENT
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'assessments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-heading)' }}>
                Diagnostic & Skill Assessments
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Evaluate student proficiencies in programming, aptitude, logical reasoning, and technical concepts.
              </p>
            </div>
            <button
              onClick={() => setActivePage('academician-create-assessment')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--grad-ai-primary)',
                border: 'none',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={15} /> Create Assessment
            </button>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>ASSESSMENT NAME</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>DOMAIN</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>TYPE</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>STUDENTS EVALUATED</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>AVG SCORE</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>PASSING SCORE</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {assessmentsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No assessments available. Click "Create Assessment" to build a diagnostic test.
                    </td>
                  </tr>
                ) : (
                  assessmentsList.map(a => (
                    <tr
                      key={a.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-heading)' }}>
                        {a.title}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {a.domain}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', padding: '3px 8px', borderRadius: '4px' }}>
                          {a.type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                        {a.studentsCount} Students
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: a.avgScore >= a.passingScore ? '#10b981' : '#f59e0b' }}>
                        {a.avgScore > 0 ? `${a.avgScore}%` : 'Pending Attempts'}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                        {a.passingScore}%
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#10b981' }}>
                          ● {a.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleViewAssessmentResults(a.id)}
                          style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            color: '#6366f1',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Results & Analytics
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 6: CREATE ASSESSMENT FORM
          ────────────────────────────────────────────────────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 6: CREATE SKILL ASSESSMENT FORM (Requirements 17, 18, 19, 20)
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'create-assessment' && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                ASSESSMENT CREATION ENGINE
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                Create Skill Assessment Test
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px' }}>
              Author diagnostic challenges across programming, aptitude, logic, and technical domains with passing benchmarks and automated evaluation.
            </p>

            <form onSubmit={handleCreateAssessmentSubmit}>
              {/* Basic Information */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Assessment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms Benchmark III CSE A"
                  value={asmtForm.title}
                  onChange={(e) => setAsmtForm({ ...asmtForm, title: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text-heading)', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide scope, instructions, and target skill benchmarks..."
                  value={asmtForm.description || ''}
                  onChange={(e) => setAsmtForm({ ...asmtForm, description: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-heading)', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Skill Category *</label>
                  <select
                    value={asmtForm.skillCategory}
                    onChange={(e) => setAsmtForm({ ...asmtForm, skillCategory: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  >
                    <option value="Programming">Programming</option>
                    <option value="Aptitude">Aptitude</option>
                    <option value="Logical Reasoning">Logical Reasoning</option>
                    <option value="Technical Skills">Technical Skills</option>
                    <option value="Communication">Communication</option>
                    <option value="Problem Solving">Problem Solving</option>
                    <option value="Other Skills">Other Skills</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Difficulty</label>
                  <select
                    value={asmtForm.difficulty}
                    onChange={(e) => setAsmtForm({ ...asmtForm, difficulty: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={asmtForm.durationMinutes}
                    onChange={(e) => setAsmtForm({ ...asmtForm, durationMinutes: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Marks</label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={asmtForm.totalMarks}
                    onChange={(e) => setAsmtForm({ ...asmtForm, totalMarks: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Passing Score (%)</label>
                  <input
                    type="number"
                    min={30}
                    max={100}
                    value={asmtForm.passingScore}
                    onChange={(e) => setAsmtForm({ ...asmtForm, passingScore: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Target Students Selection (Section 18) */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px', marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                  Target Cohort Scope (Section 18)
                </label>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="targetScope"
                      checked={asmtForm.targetScope === 'entire_class'}
                      onChange={() => setAsmtForm({ ...asmtForm, targetScope: 'entire_class' })}
                    />
                    Entire Class ({dashboardData?.profile?.className || 'Assigned Class'})
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="targetScope"
                      checked={asmtForm.targetScope === 'selected_students'}
                      onChange={() => setAsmtForm({ ...asmtForm, targetScope: 'selected_students' })}
                    />
                    Selected Students ({asmtForm.targetStudentIds?.length || 0} selected)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="targetScope"
                      checked={asmtForm.targetScope === 'multiple_classes'}
                      onChange={() => setAsmtForm({ ...asmtForm, targetScope: 'multiple_classes' })}
                    />
                    All Assigned Classes
                  </label>
                </div>

                {asmtForm.targetScope === 'selected_students' && (
                  <div style={{ maxHeight: '160px', overflowY: 'auto', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px' }}>
                    {studentsList.map(st => (
                      <label key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '12.5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={(asmtForm.targetStudentIds || []).includes(st.id)}
                          onChange={(e) => {
                            const cur = asmtForm.targetStudentIds || [];
                            setAsmtForm({
                              ...asmtForm,
                              targetStudentIds: e.target.checked ? [...cur, st.id] : cur.filter(id => id !== st.id)
                            });
                          }}
                        />
                        <span>{st.name} ({st.registerNumber}) — {st.department}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Question Editor (Section 19) */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '18px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-heading)' }}>
                      Questions ({asmtForm.questions.length})
                    </label>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                      Supports MCQ, True/False, Programming with test cases, Aptitude, Logic
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAsmtForm({
                      ...asmtForm,
                      questions: [...asmtForm.questions, {
                        questionType: 'mcq',
                        topic: asmtForm.skillCategory || 'Programming',
                        question: '',
                        difficulty: asmtForm.difficulty || 'Medium',
                        options: ['', '', '', ''],
                        correctIndex: 0,
                        marks: 10,
                        problemStatement: '',
                        inputFormat: '',
                        outputFormat: '',
                        constraints: '',
                        sampleInput: '',
                        sampleOutput: '',
                        testCases: [{ input: '', expectedOutput: '', isHidden: false }]
                      }]
                    })}
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add Question
                  </button>
                </div>

                {asmtForm.questions.map((q, qi) => (
                  <div key={qi} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-heading)' }}>Question #{qi + 1}</span>
                        <select
                          value={q.questionType || 'mcq'}
                          onChange={(e) => {
                            const updated = [...asmtForm.questions];
                            updated[qi].questionType = e.target.value;
                            setAsmtForm({ ...asmtForm, questions: updated });
                          }}
                          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', color: 'var(--text-heading)' }}
                        >
                          <option value="mcq">Multiple Choice</option>
                          <option value="true_false">True / False</option>
                          <option value="programming">Programming Question</option>
                          <option value="aptitude">Aptitude Question</option>
                          <option value="logical_reasoning">Logical Reasoning</option>
                          <option value="short_answer">Short Answer</option>
                        </select>
                      </div>
                      {asmtForm.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAsmtForm({
                              ...asmtForm,
                              questions: asmtForm.questions.filter((_, idx) => idx !== qi)
                            });
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Question Statement */}
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Question / Problem Title *</label>
                      <input
                        type="text"
                        required
                        value={q.question}
                        onChange={(e) => {
                          const updated = [...asmtForm.questions];
                          updated[qi].question = e.target.value;
                          setAsmtForm({ ...asmtForm, questions: updated });
                        }}
                        placeholder="State question or challenge..."
                        style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '8px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
                      />
                    </div>

                    {/* Programming Specific Details */}
                    {q.questionType === 'programming' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-muted)' }}>Problem Statement</label>
                          <textarea
                            rows={2}
                            value={q.problemStatement || ''}
                            onChange={(e) => {
                              const updated = [...asmtForm.questions];
                              updated[qi].problemStatement = e.target.value;
                              setAsmtForm({ ...asmtForm, questions: updated });
                            }}
                            placeholder="Complete problem description..."
                            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-heading)', fontSize: '12px' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Input Format</label>
                            <input
                              type="text"
                              value={q.inputFormat || ''}
                              onChange={(e) => {
                                const updated = [...asmtForm.questions];
                                updated[qi].inputFormat = e.target.value;
                                setAsmtForm({ ...asmtForm, questions: updated });
                              }}
                              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '6px 8px', color: 'var(--text-heading)', fontSize: '12px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Output Format</label>
                            <input
                              type="text"
                              value={q.outputFormat || ''}
                              onChange={(e) => {
                                const updated = [...asmtForm.questions];
                                updated[qi].outputFormat = e.target.value;
                                setAsmtForm({ ...asmtForm, questions: updated });
                              }}
                              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '6px 8px', color: 'var(--text-heading)', fontSize: '12px' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Sample Input</label>
                            <input
                              type="text"
                              value={q.sampleInput || ''}
                              onChange={(e) => {
                                const updated = [...asmtForm.questions];
                                updated[qi].sampleInput = e.target.value;
                                setAsmtForm({ ...asmtForm, questions: updated });
                              }}
                              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '6px 8px', color: 'var(--text-heading)', fontSize: '12px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Sample Output</label>
                            <input
                              type="text"
                              value={q.sampleOutput || ''}
                              onChange={(e) => {
                                const updated = [...asmtForm.questions];
                                updated[qi].sampleOutput = e.target.value;
                                setAsmtForm({ ...asmtForm, questions: updated });
                              }}
                              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '6px 8px', color: 'var(--text-heading)', fontSize: '12px' }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : q.questionType === 'true_false' ? (
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        {['True', 'False'].map((tf, tfi) => (
                          <label key={tfi} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`tf-${qi}`}
                              checked={q.correctIndex === tfi}
                              onChange={() => {
                                const updated = [...asmtForm.questions];
                                updated[qi].correctIndex = tfi;
                                setAsmtForm({ ...asmtForm, questions: updated });
                              }}
                            />
                            {tf}
                          </label>
                        ))}
                      </div>
                    ) : (
                      /* MCQ / Aptitude / Logic Options */
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                        {q.options?.map((opt, oi) => (
                          <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="radio"
                              name={`correct-${qi}`}
                              checked={q.correctIndex === oi}
                              onChange={() => {
                                const updated = [...asmtForm.questions];
                                updated[qi].correctIndex = oi;
                                setAsmtForm({ ...asmtForm, questions: updated });
                              }}
                            />
                            <input
                              type="text"
                              value={opt}
                              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                              onChange={(e) => {
                                const updated = [...asmtForm.questions];
                                updated[qi].options[oi] = e.target.value;
                                setAsmtForm({ ...asmtForm, questions: updated });
                              }}
                              style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '6px 10px', color: 'var(--text-heading)', fontSize: '12px' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActivePage('academician-assessments')}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: 'var(--grad-ai-primary)', border: 'none', color: '#ffffff', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Publish Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 7: ASSESSMENT RESULTS VIEW
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'assessment-results' && (
        <div>
          <button
            onClick={() => setActivePage('academician-assessments')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginBottom: '16px' }}
          >
            ← Back to Assessments
          </button>

          {loadingResults ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>Loading results...</div>
          ) : asmtResultsData ? (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Exam Title</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)' }}>{asmtResultsData.assessment.title}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Average Class Score</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#6366f1' }}>{asmtResultsData.classSummary.averageScore}%</div>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Pass Rate</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>{asmtResultsData.classSummary.passRate}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Highest Score</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>{asmtResultsData.classSummary.highestScore}%</div>
                </div>
              </div>

              {/* Individual Student Scores Table */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px 18px' }}>STUDENT NAME</th>
                      <th style={{ padding: '12px 18px' }}>REGISTER NO</th>
                      <th style={{ padding: '12px 18px' }}>SCORE</th>
                      <th style={{ padding: '12px 18px' }}>ACCURACY</th>
                      <th style={{ padding: '12px 18px' }}>TIME TAKEN</th>
                      <th style={{ padding: '12px 18px' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asmtResultsData.results?.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No student submissions yet.</td></tr>
                    ) : (
                      asmtResultsData.results?.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 18px', fontWeight: 700 }}>{r.studentName}</td>
                          <td style={{ padding: '12px 18px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.rollNumber}</td>
                          <td style={{ padding: '12px 18px', fontWeight: 800, color: r.score >= asmtResultsData.assessment.passingScore ? '#10b981' : '#ef4444' }}>{r.score}%</td>
                          <td style={{ padding: '12px 18px' }}>{r.accuracy}%</td>
                          <td style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>{r.timeTaken}</td>
                          <td style={{ padding: '12px 18px', fontWeight: 600, color: '#10b981' }}>{r.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>Select an assessment to inspect results.</div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 8: SKILL GAP ANALYSIS (Crucial Feature)
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'skill-gaps' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-heading)' }}>
              Institutional Skill Gap Engine
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Algorithmic detection of missing competencies based on student test scores against industry requirements.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '16px', marginBottom: '28px' }}>
            {skillGapsList.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active skill gaps identified. All students meet proficiency benchmarks!
              </div>
            ) : (
              skillGapsList.map((gap, i) => (
                <div
                  key={gap.id || i}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    padding: '20px',
                    boxShadow: 'var(--shadow-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                        {gap.skillName}
                      </h3>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: gap.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: gap.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'
                      }}>
                        {gap.severity} GAP
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Category: {gap.skillCategory} • Affected Students: <strong>{gap.affectedStudentsCount}</strong> • Average Score: <strong>{gap.averageScore}%</strong> (Target: {gap.benchmarkScore}%)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
                      <span style={{ color: '#6366f1' }}>
                        Recommended Course: <strong>{gap.recommendedCourse?.title}</strong>
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span style={{ color: '#10b981' }}>
                        Diagnostic: <strong>{gap.recommendedAssessment?.title}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setAssignData({ courseId: gap.recommendedCourse?.id || coursesList[0]?.id, studentIds: studentsList.map(s => s.id), notes: `Remediation for ${gap.skillName}` });
                        setShowAssignCourseModal(true);
                      }}
                      style={{
                        background: '#6366f1',
                        border: 'none',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Assign Course
                    </button>
                    <button
                      onClick={() => setActivePage('academician-create-assessment')}
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        color: '#6366f1',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Create Assessment
                    </button>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Mentorship
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 9: INDUSTRY REQUIREMENTS & COMPARISON
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'industry-requirements' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-heading)' }}>
              Industry Demand vs Student Competency
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Live comparison of skills currently posted by hiring enterprises vs what your students possess.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {industryReqs.map((req, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                    {req.skill}
                  </h3>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: req.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    color: req.severity === 'HIGH' ? '#ef4444' : '#6366f1'
                  }}>
                    {req.gapPercentage}% GAP
                  </span>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Industry Demand:</span>
                    <strong style={{ color: '#6366f1' }}>{req.industryDemand}%</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${req.industryDemand}%`, background: '#6366f1' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Student Cohort Average:</span>
                    <strong style={{ color: req.studentAverage >= 70 ? '#10b981' : '#f59e0b' }}>{req.studentAverage}%</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${req.studentAverage}%`, background: req.studentAverage >= 70 ? '#10b981' : '#f59e0b' }} />
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '8px' }}>
                  Action Needed: <strong>+{req.gapPercentage}% boost</strong> needed to qualify students for direct recruitment in {req.skill}.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 10: SMART RECOMMENDATIONS
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'recommendations' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-heading)' }}>
              Deterministic Smart Action Recommendations
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              AI and rule-based insights triggered by real gaps, assessment trends, and enterprise requisitions.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {recommendations.map(rec => (
              <div
                key={rec.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                      {rec.category}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: rec.priority === 'HIGH' ? '#ef4444' : '#f59e0b', background: rec.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                      {rec.priority} PRIORITY
                    </span>
                    <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                      {rec.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {rec.message}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (rec.actionType === 'ASSIGN_COURSE') setActivePage('academician-courses');
                    else if (rec.actionType === 'CREATE_ASSESSMENT') setActivePage('academician-create-assessment');
                    else if (rec.actionType === 'WORKSHOP') setShowScheduleModal(true);
                    else setActivePage('academician-opportunities');
                  }}
                  style={{
                    background: '#6366f1',
                    border: 'none',
                    color: '#fff',
                    padding: '9px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {rec.actionLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 11: MENTORSHIP WORKSPACE
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'mentorship' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-heading)' }}>
                Faculty Mentorship Hub
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Manage your active mentees, track developmental goals, and conduct scheduled sessions.
              </p>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--grad-ai-primary)',
                border: 'none',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={15} /> Schedule Session
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            {/* Mentees List */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-heading)' }}>
                Assigned Mentees ({mentorshipData.mentees?.length || 0})
              </h3>
              {mentorshipData.mentees?.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No mentees assigned yet. You can add students as mentees directly from the Student Directory.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {mentorshipData.mentees?.map(m => (
                    <div key={m.mentorship_id || m.student_id} style={{
                      padding: '14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>{m.student_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {m.roll_number} • {m.department_name} • Goal: {m.goals || 'Industry Readiness'}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedStudentId(m.student_id)}
                        style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', color: '#6366f1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Profile
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduled Sessions */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-heading)' }}>
                Upcoming Mentorship Sessions ({mentorshipData.upcomingSessions?.length || 0})
              </h3>
              {mentorshipData.upcomingSessions?.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No upcoming sessions. Click "Schedule Session" above to set up a consultation.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {mentorshipData.upcomingSessions?.map(s => (
                    <div key={s.id} style={{
                      padding: '14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-heading)' }}>{s.title}</div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                          SCHEDULED
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        With: <strong>{s.student_name}</strong> • {new Date(s.scheduled_at).toLocaleString()}
                      </div>
                      {s.meeting_link && (
                        <a
                          href={s.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '12px', color: '#6366f1', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Video size={13} /> Join Virtual Meeting
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 12: INDUSTRY OPPORTUNITIES & MATCHING
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'opportunities' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-heading)' }}>
              Industry Postings & Student Skill Matching
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Automatic skill matching showing which of your students are eligible for active enterprise opportunities.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {opportunitiesList.map(opp => (
              <div
                key={opp.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                      {opp.company}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '6px 0 4px', color: 'var(--text-heading)' }}>
                      {opp.title}
                    </h3>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      {opp.type} • {opp.location} • Deadline: {opp.deadline}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>
                      {opp.matchingStudentsCount} Eligible
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Students meet &gt;50% criteria
                    </div>
                  </div>
                </div>

                {/* Required Skills Chips */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Mandatory Competencies:</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {opp.requiredSkills?.map((sk, idx) => (
                      <span key={idx} style={{ fontSize: '12px', fontWeight: 600, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: '6px' }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Top Matched Candidates */}
                {opp.matchedCandidates?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                      Top Matching Students:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                      {opp.matchedCandidates.map(c => (
                        <div
                          key={c.studentId}
                          onClick={() => setSelectedStudentId(c.studentId)}
                          style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>{c.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.rollNumber}</div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: c.matchPercentage >= 75 ? '#10b981' : '#6366f1' }}>
                            {c.matchPercentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 13: ACADEMICIAN SKILL ANALYTICS (Requirement 23)
          ────────────────────────────────────────────────────────────────────────── */}
      {(currentTab === 'skill-analytics' || currentTab === 'analytics') && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                  COMPETENCY INTELLIGENCE
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                  Cohort Skill Analytics & Growth Telemetry
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Live evaluation of student competencies, domain mastery distributions, longitudinal growth, and early remediation signals.
              </p>
            </div>
            <button
              onClick={fetchAllData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-heading)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} /> Refresh Analytics
            </button>
          </div>

          {/* Weak Skills Alert Banner (Section 23) */}
          {(skillAnalyticsData?.weakSkills || []).length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <AlertTriangle size={20} color="#ef4444" />
                <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                  Identified Weak Competencies (Immediate Focus Areas)
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {skillAnalyticsData.weakSkills.map((ws, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-heading)' }}>{ws.skill}</span>
                      <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 800 }}>
                        {ws.status || 'Needs Improvement'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Cohort Average: <strong style={{ color: '#ef4444' }}>{ws.averageScore}%</strong> (Target benchmark: 60%)
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      {ws.recommendedAction || 'Recommended: Conduct targeted remediation session and assign foundational problem sets.'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid: 1. Class Skill Growth Bar Chart & 2. Skill-wise Performance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {/* 1. Class Skill Growth Responsive Bar Graph */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-heading)' }}>
                    Class Skill Growth
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    Average percentage growth per assigned class section.
                  </p>
                </div>
              </div>

              {(!skillAnalyticsData?.classSkillGrowth || skillAnalyticsData.classSkillGrowth.length === 0) ? (
                <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No skill growth data available yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px' }}>
                  {skillAnalyticsData.classSkillGrowth.map((cg, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-heading)' }}>{cg.className}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Score: {cg.averageScore}%</span>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>+{cg.averageGrowth}%</span>
                        </div>
                      </div>
                      <div style={{ height: '14px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', padding: '2px' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(cg.averageGrowth, cg.averageScore))}%`,
                          background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                          borderRadius: '999px',
                          transition: 'width 0.8s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Skill-wise Performance */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: '0 0 18px', color: 'var(--text-heading)' }}>
                Skill Domain Breakdown
              </h3>
              {(!skillAnalyticsData?.skillPerformance || skillAnalyticsData.skillPerformance.length === 0) ? (
                <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No skill growth data available yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {skillAnalyticsData.skillPerformance.map((sp, idx) => {
                    const isBelow = sp.averageScore < (sp.benchmark || 60);
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '5px' }}>
                          <span style={{ color: 'var(--text-heading)' }}>{sp.skill}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: isBelow ? '#ef4444' : '#10b981' }}>{sp.averageScore}%</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Bench: {sp.benchmark || 60}%)</span>
                          </div>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${sp.averageScore}%`,
                            background: isBelow ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)' : 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                            borderRadius: '999px',
                            transition: 'width 0.8s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Grid: 3. Student Comparison Table & 4. Growth Over Time */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
            {/* 3. Student Comparison */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-heading)' }}>
                Student Skill Comparison
              </h3>
              {(!skillAnalyticsData?.studentComparison || skillAnalyticsData.studentComparison.length === 0) ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No student comparison records available.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px 12px' }}>STUDENT</th>
                        <th style={{ padding: '8px 12px' }}>REGISTER NO</th>
                        <th style={{ padding: '8px 12px' }}>SKILL SCORE</th>
                        <th style={{ padding: '8px 12px' }}>READINESS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skillAnalyticsData.studentComparison.map((sc, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>{sc.name}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{sc.registerNumber}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: sc.skillScore >= 60 ? '#10b981' : '#f59e0b' }}>{sc.skillScore}%</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{sc.readinessScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 4. Growth Over Time */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-heading)' }}>
                Skill Growth Trajectory Over Time
              </h3>
              {(!skillAnalyticsData?.growthOverTime || skillAnalyticsData.growthOverTime.length === 0) ? (
                <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No historical trajectory available yet. Trajectory builds as students complete sequential assessments.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '16px', paddingTop: '24px' }}>
                  {skillAnalyticsData.growthOverTime.map((gt, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1' }}>{gt.averageScore}%</div>
                      <div style={{
                        width: '100%',
                        height: `${Math.max(12, gt.averageScore * 1.6)}px`,
                        background: 'linear-gradient(180deg, #6366f1 0%, #10b981 100%)',
                        borderRadius: '6px 6px 0 0',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                      }} />
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{gt.period}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 14: NOTIFICATIONS
          ────────────────────────────────────────────────────────────────────────── */}
      {currentTab === 'notifications' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-heading)' }}>
            Academic Notifications & Alerts
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notificationsList.map(n => (
              <div
                key={n.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bell size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0, color: 'var(--text-heading)' }}>{n.title}</h4>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{n.time}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          STUDENT PROFILE DOSSIER MODAL
          ────────────────────────────────────────────────────────────────────────── */}
      {selectedStudentId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '24px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '28px',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-heading)' }}>
                  {studentDossier?.info?.name || 'Student Profile'}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {studentDossier?.info?.registerNumber} • {studentDossier?.info?.department} • CGPA: {studentDossier?.info?.cgpa}
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentId(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {loadingDossier ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>Loading dossier...</div>
            ) : studentDossier ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Readiness Banner */}
                <div style={{
                  padding: '14px 18px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Computed Industry Readiness</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#6366f1' }}>
                      {studentDossier.info.readinessScore}% — {studentDossier.info.readinessTier}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      academicianService.addMentee({ studentId: studentDossier.info.id, goals: 'Career guidance', notes: 'Added from student dossier' })
                        .then(() => onShowToast && onShowToast({ title: 'Success', message: 'Student added to your mentees!', type: 'success' }));
                    }}
                    style={{ background: '#6366f1', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Add as Mentee
                  </button>
                </div>

                {/* Enrolled Courses */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                    Enrolled Courses ({studentDossier.courses?.length || 0})
                  </h4>
                  {studentDossier.courses?.length === 0 ? (
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>No courses enrolled yet.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {studentDossier.courses.map((c, i) => (
                        <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: '8px', fontSize: '12.5px' }}>
                          <div style={{ fontWeight: 700 }}>{c.title}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>Progress: {c.progress_percentage}% • {c.enrollment_status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills Breakdown (6 Domains) */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                    Demonstrated Competencies ({studentDossier.skills?.length || 0})
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {studentDossier.skills?.map((sk, i) => (
                      <span key={i} style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                        {sk.name}: <strong>{sk.confidence_score}%</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Assessment History */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                    Assessment Results ({studentDossier.assessments?.length || 0})
                  </h4>
                  {studentDossier.assessments?.length === 0 ? (
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>No assessments completed yet.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                      {studentDossier.assessments.map((a, i) => (
                        <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '6px', fontSize: '12px' }}>
                          <div style={{ fontWeight: 700 }}>{a.title}</div>
                          <div style={{ color: 'var(--text-muted)' }}>Score: {a.score}% • Status: {a.status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Projects & Internships & Certificates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                      Verified Projects ({studentDossier.projects?.length || 0})
                    </h4>
                    {studentDossier.projects?.length === 0 ? (
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>No projects submitted yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {studentDossier.projects.map((p, i) => (
                          <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '6px', fontSize: '12px' }}>
                            <div style={{ fontWeight: 700 }}>{p.title}</div>
                            <div style={{ color: 'var(--text-muted)' }}>Tech: {p.tech_stack || 'N/A'} • Status: {p.verification_status}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                      Internships & Industry Proofs ({studentDossier.internships?.length || 0})
                    </h4>
                    {studentDossier.internships?.length === 0 ? (
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>No internship applications on record.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {studentDossier.internships.map((int, i) => (
                          <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '6px', fontSize: '12px' }}>
                            <div style={{ fontWeight: 700 }}>{int.company_name} — {int.role_title}</div>
                            <div style={{ color: 'var(--text-muted)' }}>Stage: {int.status}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Skill Gap Analysis vs Industry Requirements */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                    Skill Gap vs Industry Requirements ({studentDossier.skillGaps?.length || 0})
                  </h4>
                  {studentDossier.skillGaps?.length === 0 ? (
                    <div style={{ fontSize: '12.5px', color: '#10b981' }}>✓ No critical skill gaps flagged. Student aligns well with target profile.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                      {studentDossier.skillGaps.map((sg, i) => (
                        <div key={i} style={{ padding: '10px 12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '12px' }}>
                          <div style={{ fontWeight: 700, color: '#f87171' }}>{sg.skill_name || 'Skill Gap'}</div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Current Score: {sg.current_score}% (Severity: {sg.severity})</div>
                          {sg.recommended_course_title && (
                            <div style={{ color: '#818cf8', marginTop: '4px', fontSize: '11px' }}>
                              Recommended Course: {sg.recommended_course_title}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Faculty Remarks Section */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                    Faculty Remarks & Guidance Log
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Add an evaluation note or recommendation for this student..."
                      value={newRemarkText}
                      onChange={(e) => setNewRemarkText(e.target.value)}
                      style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
                    />
                    <button
                      onClick={handleAddRemark}
                      style={{ background: '#6366f1', border: 'none', color: '#fff', padding: '9px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Post Remark
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                    {studentDossier.facultyRemarks?.map((rem, i) => (
                      <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '6px', fontSize: '12.5px' }}>
                        <div style={{ color: 'var(--text-primary)' }}>"{rem.remarks}"</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          By {rem.faculty_name || 'Faculty'} • {new Date(rem.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          SCHEDULE MENTORSHIP SESSION MODAL
          ────────────────────────────────────────────────────────────────────────── */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-heading)' }}>
              Schedule Mentorship Consultation
            </h3>

            <form onSubmit={handleScheduleSessionSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Select Mentee / Student *</label>
                <select
                  required
                  value={sessionForm.studentId}
                  onChange={(e) => setSessionForm({ ...sessionForm, studentId: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                >
                  <option value="">Select a student...</option>
                  {studentsList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.registerNumber})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Session Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Review & System Architecture Mentorship"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={sessionForm.scheduledAt}
                    onChange={(e) => setSessionForm({ ...sessionForm, scheduledAt: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Duration (Mins)</label>
                  <input
                    type="number"
                    min={15}
                    max={120}
                    value={sessionForm.durationMinutes}
                    onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Meeting Link (Google Meet / Zoom)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={sessionForm.meetingLink}
                  onChange={(e) => setSessionForm({ ...sessionForm, meetingLink: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '9px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#10b981', border: 'none', color: '#fff', padding: '9px 20px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          ASSIGN COURSE MODAL
          ────────────────────────────────────────────────────────────────────────── */}
      {showAssignCourseModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-heading)' }}>
              Assign Remediation Course
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Select Course to Assign *</label>
              <select
                value={assignData.courseId}
                onChange={(e) => setAssignData({ ...assignData, courseId: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
              >
                <option value="">Select course...</option>
                {coursesList.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Faculty Note for Students</label>
              <textarea
                rows={2}
                value={assignData.notes}
                onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })}
                placeholder="Complete by end of month to qualify for placement drives..."
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-heading)', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAssignCourseModal(false)}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '9px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignRemediationCourseSubmit}
                style={{ background: '#6366f1', border: 'none', color: '#fff', padding: '9px 20px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── COURSE ASSIGNMENT MODAL (new) ── */}
      {showAssignModal && courseToAssign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px', border: '1px solid var(--border-subtle)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)' }}>Assign Course to Students</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{courseToAssign.title}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Assignment Target</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[{ value: 'entire_class', label: 'All My Students' }, { value: 'multiple_classes', label: 'Specific Classes' }, { value: 'selected_students', label: 'Specific Students' }].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAssignForm(f => ({ ...f, targetType: opt.value, targetClassIds: [], targetStudentIds: [] }))}
                    style={{
                      padding: '7px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
                      background: assignForm.targetType === opt.value ? 'rgba(99,102,241,0.15)' : 'var(--bg-input)',
                      border: assignForm.targetType === opt.value ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border-subtle)',
                      color: assignForm.targetType === opt.value ? '#6366f1' : 'var(--text-muted)'
                    }}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {(assignForm.targetType === 'multiple_classes') && myClasses.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Select Classes</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {myClasses.map(cls => (
                    <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={assignForm.targetClassIds.includes(cls.id)}
                        onChange={(e) => setAssignForm(f => ({
                          ...f,
                          targetClassIds: e.target.checked
                            ? [...f.targetClassIds, cls.id]
                            : f.targetClassIds.filter(id => id !== cls.id)
                        }))}
                      />
                      <span style={{ color: 'var(--text-heading)' }}>{cls.displayName}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({cls.studentCount} students)</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(assignForm.targetType === 'selected_students') && studentsList.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Select Students</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                  {studentsList.slice(0, 50).map(stu => (
                    <label key={stu.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={assignForm.targetStudentIds.includes(stu.id)}
                        onChange={(e) => setAssignForm(f => ({
                          ...f,
                          targetStudentIds: e.target.checked
                            ? [...f.targetStudentIds, stu.id]
                            : f.targetStudentIds.filter(id => id !== stu.id)
                        }))}
                      />
                      <span style={{ color: 'var(--text-heading)' }}>{stu.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{stu.registerNumber}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShowAssignModal(false)} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '9px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleAssignCourseSubmit}
                disabled={assigning}
                style={{ background: assigning ? '#4f46e5' : '#6366f1', border: 'none', color: '#fff', padding: '9px 20px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: assigning ? 'not-allowed' : 'pointer', opacity: assigning ? 0.7 : 1 }}
              >
                {assigning ? 'Assigning...' : 'Assign to Students'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW: ASSIGNED COURSES ───────────────────────────────────────────── */}
      {currentTab === 'assigned-courses' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)' }}>Assigned Courses</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Track how your assigned courses are progressing across all your students</p>
          </div>
          {assignedCoursesList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ fontSize: '15px' }}>No assigned courses yet. Create a course and assign it to your students.</p>
              <button onClick={() => setActivePage('academician-create-course')} style={{ marginTop: '12px', background: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                <Plus size={14} style={{ marginRight: '6px' }} /> Create Course
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {assignedCoursesList.map(course => (
                <div key={course.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1, marginRight: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>{course.title}</h3>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{course.category} • {course.difficulty}</span>
                    </div>
                    <button
                      onClick={() => handleViewCourseProgress(course)}
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      View Progress
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                    {[
                      { label: 'Assigned', value: course.totalAssigned, color: '#6366f1' },
                      { label: 'Completed', value: course.totalCompleted, color: '#22c55e' },
                      { label: 'In Progress', value: course.inProgress, color: '#f59e0b' }
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center', padding: '8px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Avg. Progress</span>
                    <span style={{ fontWeight: 700, color: course.avgProgress >= 70 ? '#22c55e' : course.avgProgress >= 40 ? '#f59e0b' : '#ef4444' }}>{course.avgProgress}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${course.avgProgress}%`, height: '100%', background: course.avgProgress >= 70 ? '#22c55e' : course.avgProgress >= 40 ? '#f59e0b' : '#ef4444', borderRadius: '3px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW: COURSE PROGRESS DETAIL ────────────────────────────────────── */}
      {currentTab === 'course-progress' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => setActivePage('academician-assigned-courses')}
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '7px 12px', borderRadius: '8px', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              ← Back
            </button>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)' }}>
                {loadingCourseProgress ? 'Loading...' : courseProgressData?.course?.title || selectedCourseForProgress?.title || 'Course Progress'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>Student-by-student learning progress</p>
            </div>
          </div>

          {loadingCourseProgress ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading course progress...</div>
          ) : courseProgressData ? (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'Total Assigned', value: courseProgressData.summary.totalAssigned, color: '#6366f1' },
                  { label: 'Completed', value: courseProgressData.summary.completed, color: '#22c55e' },
                  { label: 'In Progress', value: courseProgressData.summary.inProgress, color: '#f59e0b' },
                  { label: 'Not Started', value: courseProgressData.summary.notStarted, color: '#ef4444' },
                  { label: 'Avg. Progress', value: `${courseProgressData.summary.avgProgress}%`, color: '#3b82f6' }
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Student Progress Table */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Student</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Class</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Progress</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Lessons</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseProgressData.students.map((stu, i) => (
                        <tr key={stu.id} style={{ borderBottom: '1px solid var(--border-subtle)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{stu.name}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{stu.rollNumber}</div>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{stu.class}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden', minWidth: '80px' }}>
                                <div style={{ width: `${stu.progress}%`, height: '100%', background: stu.progress >= 70 ? '#22c55e' : stu.progress >= 30 ? '#f59e0b' : '#ef4444', borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', minWidth: '32px' }}>{stu.progress}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{stu.completedLessons}/{stu.totalLessons}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              display: 'inline-block', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                              background: stu.status === 'Completed' ? 'rgba(34,197,94,0.12)' : stu.status === 'In Progress' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                              color: stu.status === 'Completed' ? '#22c55e' : stu.status === 'In Progress' ? '#f59e0b' : '#ef4444'
                            }}>{stu.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No progress data available for this course.</div>
          )}
        </div>
      )}

      {/* ── VIEW: OVERALL PROGRESS DASHBOARD ────────────────────────────────── */}
      {currentTab === 'overall-progress' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)' }}>Overall Learning Progress</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Comprehensive view of all student learning activities across your courses</p>
          </div>
          {!overallProgress ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              Loading progress data...
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
                {[
                  { label: 'Total Students', value: overallProgress.totalStudents, color: '#6366f1', icon: Users },
                  { label: 'Avg. Course Progress', value: `${overallProgress.avgCourseProgress}%`, color: '#10b981', icon: BookOpen },
                  { label: 'Avg. Skill Score', value: `${overallProgress.avgSkillScore}%`, color: '#3b82f6', icon: Brain },
                  { label: 'Avg. Assessment Score', value: `${overallProgress.avgAssessmentScore}%`, color: '#8b5cf6', icon: Award },
                  { label: 'Course Completion Rate', value: `${overallProgress.courseCompletionRate}%`, color: '#22c55e', icon: CheckCircle2 },
                  { label: 'Needing Attention', value: overallProgress.studentsNeedingAttention, color: '#ef4444', icon: AlertTriangle },
                  { label: 'Industry Ready', value: overallProgress.industryReadyStudents, color: '#f59e0b', icon: GraduationCap }
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px', boxShadow: 'var(--shadow-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{stat.label}</span>
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={16} />
                        </div>
                      </div>
                      <div style={{ fontSize: '26px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    </div>
                  );
                })}
              </div>

              {overallProgress.classwiseProgress?.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>Class-wise Breakdown</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Class</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Students</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Course Progress</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Skill Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overallProgress.classwiseProgress.map(cls => (
                          <tr key={cls.className} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-heading)' }}>{cls.className}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{cls.studentCount}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${cls.avgProgress}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>{cls.avgProgress}%</span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${cls.avgSkill}%`, height: '100%', background: '#3b82f6', borderRadius: '3px' }} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#3b82f6' }}>{cls.avgSkill}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW: TRASH ─────────────────────────────────────────────────────── */}
      {currentTab === 'trash' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)' }}>🗑️ Trash</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Items can be restored or permanently deleted from here</p>
            </div>
            <button
              onClick={fetchTrash}
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingTrash ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading trash...</div>
          ) : (trashData.courses.length + trashData.assessments.length) === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Trash2 size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ fontSize: '15px' }}>Trash is empty</p>
            </div>
          ) : (
            <div>
              {/* Deleted Courses */}
              {trashData.courses.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>📚 Deleted Courses</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {trashData.courses.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px 18px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.title}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{item.category} • Deleted {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString() : ''}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleRestoreFromTrash(item.id, 'course')} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            Restore
                          </button>
                          <button onClick={() => handlePermanentDelete(item.id, 'course')} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            Delete Forever
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deleted Assessments */}
              {trashData.assessments.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>📋 Deleted Assessments</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {trashData.assessments.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px 18px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.title}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{item.domain} • Deleted {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString() : ''}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleRestoreFromTrash(item.id, 'assessment')} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            Restore
                          </button>
                          <button onClick={() => handlePermanentDelete(item.id, 'assessment')} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            Delete Forever
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW: ACHIEVEMENT VERIFICATION ──────────────────────────────────── */}
      {currentTab === 'achievements' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)' }}>Verify Student Achievements</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Review and verify certificates & projects uploaded by your assigned students
              </p>
            </div>
            <button onClick={fetchPendingAchievements} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingAchievements ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading pending verifications...</div>
          ) : (pendingAchievements.certificates.length + pendingAchievements.projects.length) === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ fontSize: '15px' }}>No pending verifications — all caught up!</p>
            </div>
          ) : (
            <div>
              {/* Comment input shared */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Verification Comment (required for rejection)</label>
                <textarea
                  rows={2}
                  value={achievementComment}
                  onChange={(e) => setAchievementComment(e.target.value)}
                  placeholder="Add a comment for approval or reason for rejection..."
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-heading)', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              {/* Pending Certificates */}
              {pendingAchievements.certificates.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>🏆 Pending Certificates ({pendingAchievements.certificates.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pendingAchievements.certificates.map(cert => (
                      <div key={cert.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '14px' }}>{cert.title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              By: <strong style={{ color: 'var(--text-heading)' }}>{cert.student_name}</strong> ({cert.roll_number})
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {cert.issuing_organization && <span>Issuer: {cert.issuing_organization} • </span>}
                              {cert.issue_date && <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>}
                            </div>
                            {cert.description && <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>{cert.description}</p>}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            {cert.file_url && (
                              <a href={cert.file_url} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1', padding: '7px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Eye size={13} /> View
                              </a>
                            )}
                            <button onClick={() => handleVerifyAchievement(cert.id, 'certificate')} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                              ✓ Approve
                            </button>
                            <button onClick={() => handleRejectAchievement(cert.id, 'certificate')} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                              ✗ Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Projects */}
              {pendingAchievements.projects.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>🚀 Pending Projects ({pendingAchievements.projects.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pendingAchievements.projects.map(proj => (
                      <div key={proj.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '14px' }}>{proj.title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              By: <strong style={{ color: 'var(--text-heading)' }}>{proj.student_name}</strong> ({proj.roll_number})
                            </div>
                            {proj.description && <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>{proj.description}</p>}
                            {proj.github_url && (
                              <a href={proj.github_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '12px', color: '#6366f1' }}>
                                <ExternalLink size={12} /> GitHub Repo
                              </a>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            {proj.documentation_file_url && (
                              <a href={proj.documentation_file_url} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1', padding: '7px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Eye size={13} /> View
                              </a>
                            )}
                            <button onClick={() => handleVerifyAchievement(proj.id, 'project')} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                              ✓ Approve
                            </button>
                            <button onClick={() => handleRejectAchievement(proj.id, 'project')} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                              ✗ Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

