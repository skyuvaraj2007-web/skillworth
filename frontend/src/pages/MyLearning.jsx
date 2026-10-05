import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Play, CheckCircle2, Clock, Sparkles, ShieldCheck, Award,
  Flame, BarChart3, TrendingUp, Activity, Download, ExternalLink, Search,
  Plus, Edit3, Trash2, AlertCircle, FileText, Check, ArrowRight, ShieldAlert,
  HelpCircle, Target, Compass, UserCheck
} from "lucide-react";
import { learningService } from "../services/learningService";
import { certificateService } from "../services/certificateService";
import SelfAssessmentModal from "../components/student/SelfAssessmentModal";
import SkillLearningPathModal from "../components/student/SkillLearningPathModal";
import SkillDetailsModal from "../components/student/SkillDetailsModal";
import CertificateViewerModal from "../components/common/CertificateViewerModal";
import CertificateUploadModal from "../components/student/CertificateUploadModal";
import CourseViewerModal from "../components/student/CourseViewerModal";

const CAT_COLORS = {
  "DATA & AI": "#28D7FF", "BY NEXUS AI": "#8B5CF6", "DATABASE": "#2FE0A1",
  "ANALYTICS": "#3478FF", "ML": "#F59E0B", "DEEP LEARNING": "#EC4899",
  "WEB DEV": "#06B6D4", "CLOUD": "#6366F1", "SECURITY": "#10B981",
  "APTITUDE": "#F97316", "NLP": "#A78BFA", "IOT": "#34D399",
  "PROGRAMMING": "#00f2fe", "SYSTEMS": "#818CF8", "CORE ENGINEERING": "#38bdf8"
};

const catColor = (cat) => CAT_COLORS[String(cat).toUpperCase()] || "#00f2fe";

function getStudentAuth() {
  try {
    const raw = localStorage.getItem("nexus_auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const TABS = [
  "Overview",
  "Self-Assessed Skills",
  "My Courses",
  "Assigned Courses",
  "Quizzes & Tests",
  "Projects",
  "Certifications",
  "Learning Intelligence & AI"
];

export default function MyLearning({ setActivePage, onShowToast, user }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [overview, setOverview] = useState({
    coursesEnrolled: 0,
    coursesInProgress: 0,
    coursesCompleted: 0,
    lessonsCompleted: 0,
    quizzesCompleted: 0,
    projectsCompleted: 0,
    certificationsEarned: 0,
    learningHours: 0,
    currentStreak: 0
  });
  const [enrollments, setEnrollments] = useState([]);
  const [selfAssessments, setSelfAssessments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [uploadedCertificates, setUploadedCertificates] = useState([]);
  const [activities, setActivities] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isSelfModalOpen, setIsSelfModalOpen] = useState(false);
  const [editingSelfAssessment, setEditingSelfAssessment] = useState(null);
  const [activeLearningSkillId, setActiveLearningSkillId] = useState(null);
  const [activeCourseViewerId, setActiveCourseViewerId] = useState(null);
  const [modalSkillId, setModalSkillId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingCertId, setViewingCertId] = useState(null);
  const [assignedCourses, setAssignedCourses] = useState([]);

  // Discontinue Course state
  const [discontinueTarget, setDiscontinueTarget] = useState(null);
  const [discontinueReason, setDiscontinueReason] = useState("Academic workload");
  const [discontinueNotes, setDiscontinueNotes] = useState("");
  const [isDiscontinuing, setIsDiscontinuing] = useState(false);

  // Search & Filters
  const [courseSearch, setCourseSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [skillSearch, setSkillSearch] = useState("");

  const auth = user || getStudentAuth();
  const studentId = auth?.studentId || auth?.id || auth?.email || "";

  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ovRes, enrRes, mcRes] = await Promise.all([
        learningService.getOverview().catch(() => ({ success: false, data: null })),
        learningService.getMySkills().catch(() => ({ success: false, data: [] })),
        learningService.getMyCourses().catch(() => ({ success: false, data: [] }))
      ]);

      if (ovRes.success && ovRes.data) setOverview(ovRes.data);

      const realCourses = (mcRes.success && Array.isArray(mcRes.data)) ? mcRes.data : [];
      setAssignedCourses(realCourses.filter(c => c.isAssigned || c.assignedBy));

      const skillsList = (enrRes.success && Array.isArray(enrRes.data)) ? enrRes.data : [];
      const existingIds = new Set(skillsList.map(s => s.courseId || s.skillId || s.id));
      const combinedCourses = [
        ...skillsList,
        ...realCourses.filter(c => !existingIds.has(c.courseId))
      ];
      setEnrollments(combinedCourses);

      void Promise.allSettled([
        learningService.getSelfAssessments().catch(() => ({ success: false, data: [] })),
        learningService.getQuizzes().catch(() => ({ success: false, data: [] })),
        learningService.getProjects().catch(() => ({ success: false, data: [] })),
        learningService.getCertifications().catch(() => ({ success: false, data: [] })),
        learningService.getActivity().catch(() => ({ success: false, data: [] })),
        learningService.getIntelligence().catch(() => ({ success: false, data: null })),
        certificateService.getMyCertificates().catch(() => ({ success: false, data: [] }))
      ]).then(([saRes, qzRes, prRes, crRes, actRes, intRes, ucRes]) => {
        if (saRes.status === 'fulfilled' && saRes.value?.success && Array.isArray(saRes.value.data)) setSelfAssessments(saRes.value.data);
        if (qzRes.status === 'fulfilled' && qzRes.value?.success && Array.isArray(qzRes.value.data)) setQuizzes(qzRes.value.data);
        if (prRes.status === 'fulfilled' && prRes.value?.success && Array.isArray(prRes.value.data)) setProjects(prRes.value.data);
        if (crRes.status === 'fulfilled' && crRes.value?.success && Array.isArray(crRes.value.data)) setCertifications(crRes.value.data);
        if (actRes.status === 'fulfilled' && actRes.value?.success && Array.isArray(actRes.value.data)) setActivities(actRes.value.data);
        if (intRes.status === 'fulfilled' && intRes.value?.success && intRes.value.data) setIntelligence(intRes.value.data);
        if (ucRes.status === 'fulfilled' && ucRes.value?.success && Array.isArray(ucRes.value.data)) setUploadedCertificates(ucRes.value.data);
      });
    } catch (err) {
      console.error("Error refreshing learning workspace:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handle Self-Assessment Save
  const handleSaveSelfAssessment = async (payload) => {
    try {
      const res = await learningService.saveSelfAssessment(payload);
      if (res.success) {
        if (onShowToast) {
          onShowToast({
            title: payload.id ? "Self-Assessment Updated" : "Skill Self-Assessed",
            message: `Recorded ${payload.skillName} as ${payload.level}. Verified proficiency remains based on real activity.`,
            type: "success"
          });
        }
        await refreshAllData();
      } else {
        throw new Error(res.message || "Failed to save");
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: "Error", message: err.message, type: "error" });
      throw err;
    }
  };

  // Handle Self-Assessment Delete
  const handleDeleteSelfAssessment = async (id, skillName) => {
    if (!window.confirm(`Are you sure you want to remove your self-assessment for "${skillName}"?`)) return;
    try {
      const res = await learningService.deleteSelfAssessment(id);
      if (res.success) {
        if (onShowToast) onShowToast({ title: "Deleted", message: `Removed self-assessment for "${skillName}".`, type: "info" });
        await refreshAllData();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: "Error", message: err.message, type: "error" });
    }
  };

  const handleConfirmDiscontinue = async () => {
    if (!discontinueTarget) return;
    setIsDiscontinuing(true);
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
      const enrId = discontinueTarget.id || discontinueTarget.enrollmentId || discontinueTarget.courseId;
      const res = await fetch(`${apiBase}/learning/${enrId}/discontinue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reason: `${discontinueReason}${discontinueNotes ? ' - ' + discontinueNotes : ''}`
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to discontinue course');
      }

      setEnrollments(prev => prev.map(e => {
        if (e.id === enrId || e.courseId === discontinueTarget.courseId || e.enrollmentId === enrId) {
          return { ...e, status: 'Discontinued' };
        }
        return e;
      }));

      if (onShowToast) {
        onShowToast({
          title: 'Course Discontinued',
          message: 'Course discontinued successfully. Institution and partner notifications dispatched.',
          type: 'info'
        });
      }
      setDiscontinueTarget(null);
      setDiscontinueNotes('');
    } catch (err) {
      if (onShowToast) {
        onShowToast({
          title: 'Discontinuation Failed',
          message: err.message,
          type: 'error'
        });
      }
    } finally {
      setIsDiscontinuing(false);
    }
  };

  const filteredCourses = enrollments.filter(e => {
    const title = (e.courseTitle || e.skillName || e.title || "").toLowerCase();
    const matchesSearch = title.includes(courseSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (courseFilter === "IN_PROGRESS") return (e.progress > 0 && e.progress < 100 && e.status !== "Discontinued") || (e.learningProgress > 0 && e.learningProgress < 100 && e.status !== "Discontinued");
    if (courseFilter === "COMPLETED") return (e.progress >= 100 || e.learningProgress >= 100 || e.status === "COMPLETED" || e.status === "CERTIFIED");
    if (courseFilter === "DISCONTINUED") return e.status === "Discontinued" || e.status === "Dropped";
    return true;
  });

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 10px 40px" }}>
      {/* ── TOP TELEMETRY & COMMAND CENTER HEADER ── */}
      <div className="page-top-telemetry" style={{ marginBottom: "24px" }}>
        <div className="page-title-group">
          <div className="telemetry-node-tag">
            <Activity size={12} color="var(--cyber-cyan, #00f2fe)" />
            <span>REAL-TIME LEARNING TELEMETRY</span>
            <span>//</span>
            <span>SOVEREIGN LEARNING WORKSPACE</span>
          </div>
          <h1 style={{ margin: "6px 0 4px", fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px" }}>
            My Learning & Intelligence
          </h1>
          <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-secondary, #94a3b8)" }}>
            A complete, evidence-based learning command center distinguishing subjective self-assessments from verified telemetry proof.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => {
              setEditingSelfAssessment(null);
              setIsSelfModalOpen(true);
            }}
            className="btn-cyber-primary"
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", fontSize: "12.5px" }}
          >
            <Plus size={15} />
            <span>Self-Assess Skill</span>
          </button>
        </div>
      </div>

      {/* ── 9 REAL METRICS GRID (ALL 0 FOR NEW STUDENTS) ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "12px",
        marginBottom: "28px"
      }}>
        {[
          { label: "COURSES ENROLLED", value: overview.coursesEnrolled, icon: BookOpen, color: "#00f2fe" },
          { label: "IN PROGRESS", value: overview.coursesInProgress, icon: Clock, color: "#38bdf8" },
          { label: "COMPLETED", value: overview.coursesCompleted, icon: CheckCircle2, color: "#10b981" },
          { label: "LESSONS COMPLETED", value: overview.lessonsCompleted, icon: FileText, color: "#818cf8" },
          { label: "QUIZZES COMPLETED", value: overview.quizzesCompleted, icon: HelpCircle, color: "#a78bfa" },
          { label: "PROJECTS BUILT", value: overview.projectsCompleted, icon: Target, color: "#f59e0b" },
          { label: "CERTIFICATIONS", value: overview.certificationsEarned, icon: Award, color: "#ec4899" },
          { label: "LEARNING HOURS", value: `${overview.learningHours}h`, icon: TrendingUp, color: "#06b6d4" },
          { label: "CURRENT STREAK", value: `${overview.currentStreak}d`, icon: Flame, color: "#f97316" }
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="glass-panel"
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted, #64748b)", letterSpacing: "0.5px" }}>
                  {m.label}
                </span>
                <Icon size={14} color={m.color} />
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary, #ffffff)", fontFamily: "var(--font-mono, monospace)" }}>
                {m.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div style={{
        display: "flex",
        gap: "4px",
        borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
        marginBottom: "24px",
        overflowX: "auto",
        scrollbarWidth: "none"
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none",
              border: "none",
              padding: "10px 18px",
              borderBottom: activeTab === tab ? "2px solid var(--cyber-cyan, #00f2fe)" : "2px solid transparent",
              marginBottom: "-1px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              color: activeTab === tab ? "var(--cyber-cyan, #00f2fe)" : "var(--text-secondary, #94a3b8)",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === "Overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* NEXUS AI Best Next Action Banner */}
          {intelligence?.recommendations && intelligence.recommendations.length > 0 && (
            <div className="glass-panel" style={{
              padding: "20px 24px",
              borderRadius: "14px",
              border: "1px solid rgba(0, 242, 254, 0.25)",
              background: "linear-gradient(90deg, rgba(0, 242, 254, 0.06) 0%, rgba(139, 92, 246, 0.06) 100%)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px"
            }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "rgba(0, 242, 254, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Sparkles size={22} color="var(--cyber-cyan, #00f2fe)" />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--cyber-cyan, #00f2fe)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    NEXUS AI • Best Next Learning Action
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", marginTop: "2px" }}>
                    {intelligence.recommendations[0].title}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary, #94a3b8)", marginTop: "2px" }}>
                    {intelligence.recommendations[0].reason}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const targetEnr = enrollments.find(e => (e.skillName || e.courseTitle) === intelligence.recommendations[0].skillName);
                  if (targetEnr) setActiveLearningSkillId(targetEnr.courseId || targetEnr.skillId);
                  else setActiveTab("My Courses");
                }}
                className="btn-cyber-primary"
                style={{ padding: "8px 18px", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span>Take Action</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Core Grid: Active Courses + Recent Learning Activity */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
            {/* Active Enrolled Courses */}
            <div className="glass-panel" style={{ padding: "24px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <BookOpen size={16} color="var(--cyber-cyan, #00f2fe)" />
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>Active Enrolled Tracks</h3>
                </div>
                <button
                  onClick={() => setActiveTab("My Courses")}
                  style={{ background: "transparent", border: "none", color: "var(--cyber-cyan, #00f2fe)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                >
                  View All ({enrollments.length}) →
                </button>
              </div>

              {enrollments.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
                  <BookOpen size={32} style={{ opacity: 0.3, margin: "0 auto 8px" }} />
                  <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 600 }}>No courses enrolled yet</p>
                  <p style={{ margin: 0, fontSize: "11.5px" }}>Browse published institutional skills to begin your learning trajectory.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {enrollments.slice(0, 3).map((course, idx) => {
                    const prog = course.learningProgress !== undefined ? course.learningProgress : (course.progress || 0);
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: "14px 16px",
                          borderRadius: "10px",
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#ffffff" }}>
                            {course.courseTitle || course.skillName || course.title}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", marginTop: "3px" }}>
                            Progress: {prog}% • Lessons: {course.completedLessons || 0}/{course.totalLessons || 4}
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveLearningSkillId(course.courseId || course.skillId || course.id)}
                          className="btn-cyber-outline"
                          style={{ padding: "6px 12px", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "5px" }}
                        >
                          <Play size={12} />
                          <span>Learn</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Learning Activity Telemetry */}
            <div className="glass-panel" style={{ padding: "24px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Activity size={16} color="#f59e0b" />
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>Recent Learning Activity</h3>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", fontFamily: "monospace" }}>
                  TELEMETRY VERIFIED
                </span>
              </div>

              {activities.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
                  <Activity size={32} style={{ opacity: 0.3, margin: "0 auto 8px" }} />
                  <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 600 }}>No activity events recorded yet</p>
                  <p style={{ margin: 0, fontSize: "11.5px" }}>Self-assess a skill, complete lessons, or submit practice drills to record activity.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {activities.slice(0, 4).map((act, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderLeft: `3px solid ${act.type.includes("COMPLETED") || act.type.includes("EARNED") ? "#10b981" : "#00f2fe"}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#ffffff" }}>{act.title}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>{act.description}</div>
                      </div>
                      <span style={{ fontSize: "10.5px", color: "var(--text-muted, #64748b)", whiteSpace: "nowrap" }}>
                        {new Date(act.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SELF-ASSESSED SKILLS ── */}
      {activeTab === "Self-Assessed Skills" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Section Banner Explaining Self-Assessment vs Verified Proficiency */}
          <div className="glass-panel" style={{
            padding: "20px 24px",
            borderRadius: "14px",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            background: "rgba(245, 158, 11, 0.04)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", maxWidth: "800px" }}>
              <ShieldAlert size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h4 style={{ margin: 0, fontSize: "14.5px", fontWeight: 700, color: "#fcd34d" }}>
                  Self-Assessment vs. Verified Skill Proficiency
                </h4>
                <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--text-secondary, #94a3b8)", lineHeight: 1.5 }}>
                  Self-assessments capture your subjective appraisal of your current technical capability. <strong>Verified proficiency (0–100%)</strong> is calculated strictly from completed lessons, practice accuracy, assessments, and capstone project proofs.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingSelfAssessment(null);
                setIsSelfModalOpen(true);
              }}
              className="btn-cyber-primary"
              style={{ padding: "8px 18px", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={15} />
              <span>Add Skill Assessment</span>
            </button>
          </div>

          {/* Self-Assessed Skills Cards */}
          {selfAssessments.length === 0 ? (
            <div className="glass-panel" style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
              <Target size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
              <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                No Self-Assessed Skills Yet
              </h3>
              <p style={{ margin: "0 0 16px", fontSize: "13px", maxWidth: "450px", marginInline: "auto" }}>
                Start building your learning intelligence by adding the skills you believe you know. SkillNexus will contrast your self-ratings against objective verified evidence.
              </p>
              <button
                onClick={() => {
                  setEditingSelfAssessment(null);
                  setIsSelfModalOpen(true);
                }}
                className="btn-cyber-primary"
                style={{ padding: "9px 20px", fontSize: "12.5px" }}
              >
                + Self-Assess Your First Skill
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {selfAssessments.map((sa, idx) => {
                // Find matching verified skill if exists
                const verifiedSkill = enrollments.find(e => (e.skillName || e.courseTitle || "").toLowerCase() === sa.skillName.toLowerCase());
                const verifiedProf = verifiedSkill ? (verifiedSkill.proficiency !== undefined ? verifiedSkill.proficiency : 0) : 0;
                const prog = verifiedSkill ? (verifiedSkill.learningProgress !== undefined ? verifiedSkill.learningProgress : 0) : 0;

                return (
                  <div
                    key={idx}
                    className="glass-panel"
                    style={{
                      padding: "20px",
                      borderRadius: "14px",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "16px"
                    }}
                  >
                    <div>
                      {/* Top Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: "rgba(255, 255, 255, 0.06)",
                            color: catColor(sa.category)
                          }}>
                            {sa.category}
                          </span>
                          <h3 style={{ margin: "8px 0 0", fontSize: "17px", fontWeight: 700, color: "#ffffff" }}>
                            {sa.skillName}
                          </h3>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => {
                              setEditingSelfAssessment(sa);
                              setIsSelfModalOpen(true);
                            }}
                            title="Edit Self-Assessment"
                            style={{ background: "transparent", border: "none", color: "var(--text-muted, #64748b)", cursor: "pointer", padding: "4px" }}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteSelfAssessment(sa.id, sa.skillName)}
                            title="Delete Self-Assessment"
                            style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: "4px" }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Side-by-Side: Self-Assessed Level vs Verified Proficiency */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        margin: "14px 0",
                        padding: "12px",
                        borderRadius: "10px",
                        background: "rgba(0, 0, 0, 0.25)",
                        border: "1px solid rgba(255, 255, 255, 0.05)"
                      }}>
                        <div>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
                            Self-Assessed
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#f59e0b", marginTop: "2px" }}>
                            {sa.level}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted, #64748b)" }}>
                            {sa.confidence} Confidence
                          </div>
                        </div>
                        <div style={{ borderLeft: "1px solid rgba(255, 255, 255, 0.08)", paddingLeft: "10px" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
                            Verified Proof
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: verifiedProf > 0 ? "#10b981" : "var(--text-muted, #64748b)", marginTop: "2px" }}>
                            {verifiedProf}%
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted, #64748b)" }}>
                            Curriculum: {prog}%
                          </div>
                        </div>
                      </div>

                      {/* Details & Experience */}
                      {sa.experience && (
                        <div style={{ fontSize: "11.5px", color: "var(--text-secondary, #94a3b8)", marginBottom: "6px" }}>
                          <strong>Experience:</strong> {sa.experience}
                        </div>
                      )}
                      {sa.description && (
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted, #64748b)", fontStyle: "italic", marginBottom: "8px" }}>
                          "{sa.description}"
                        </div>
                      )}
                    </div>

                    {/* Footer / Action */}
                    <div style={{ paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-muted, #64748b)" }}>
                        Updated: {new Date(sa.updatedAt).toLocaleDateString()}
                      </span>
                      {verifiedSkill ? (
                        <button
                          onClick={() => setActiveLearningSkillId(verifiedSkill.courseId || verifiedSkill.skillId)}
                          className="btn-cyber-outline"
                          style={{ padding: "5px 10px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <span>Resume Learning</span>
                          <ArrowRight size={12} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab("My Courses")}
                          className="btn-cyber-outline"
                          style={{ padding: "5px 10px", fontSize: "11px" }}
                        >
                          Find Course →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: MY COURSES ── */}
      {activeTab === "My Courses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Search and Filters */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ position: "relative", minWidth: "260px" }}>
              <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted, #64748b)" }} />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search enrolled courses..."
                style={{
                  padding: "8px 12px 8px 36px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  fontSize: "13px"
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["ALL", "IN_PROGRESS", "COMPLETED", "DISCONTINUED"].map(f => (
                <button
                  key={f}
                  onClick={() => setCourseFilter(f)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: courseFilter === f ? "rgba(0, 242, 254, 0.15)" : "transparent",
                    color: courseFilter === f ? "var(--cyber-cyan, #00f2fe)" : "var(--text-secondary, #94a3b8)",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="glass-panel" style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
              <BookOpen size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
              <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                No Enrolled Courses Found
              </h3>
              <p style={{ margin: 0, fontSize: "13px" }}>
                Explore the course offerings from your mapped institution to begin learning.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
              {filteredCourses.map((course, idx) => {
                const prog = course.learningProgress !== undefined ? course.learningProgress : (course.progress || 0);
                const prof = course.proficiency !== undefined ? course.proficiency : 0;
                const completedMod = course.completedModules || 0;
                const totalMod = course.totalModules || 4;
                const completedLes = course.completedLessons || 0;
                const totalLes = course.totalLessons || 4;
                const hasProject = Boolean(course.projectSubmission?.submitted);
                const hasQuiz = Boolean(course.assessmentResult?.score !== undefined);
                const isDiscontinued = course.status === "Discontinued" || course.status === "Dropped";

                return (
                  <div
                    key={idx}
                    className="glass-panel"
                    style={{
                      padding: "20px",
                      borderRadius: "14px",
                      border: isDiscontinued ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "16px",
                      background: isDiscontinued ? "rgba(239, 68, 68, 0.03)" : undefined
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.06)",
                          color: catColor(course.category)
                        }}>
                          {course.category || "Programming"}
                        </span>
                        <span style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: isDiscontinued
                            ? "#ef4444"
                            : (prog >= 100 ? "#10b981" : (prog > 0 ? "var(--cyber-cyan, #00f2fe)" : "var(--text-muted, #64748b)"))
                        }}>
                          {isDiscontinued
                            ? "DISCONTINUED"
                            : (prog >= 100 ? "COMPLETED" : (prog > 0 ? "IN PROGRESS" : "ENROLLED"))}
                        </span>
                      </div>

                      <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: "#ffffff" }}>
                        {course.courseTitle || course.skillName || course.title}
                      </h3>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted, #64748b)" }}>
                        Provider: {course.institutionName || "Institution Partner"}
                      </div>
                      {course.assignedBy && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#818cf8',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          marginTop: '6px'
                        }}>
                          <UserCheck size={12} />
                          Assigned by Prof. {course.assignedBy.name} ({course.assignedBy.designation || 'Faculty'})
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div style={{ margin: "16px 0 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "6px" }}>
                          <span style={{ color: "var(--text-secondary, #94a3b8)" }}>Curriculum Progress</span>
                          <span style={{ fontWeight: 700, color: "#ffffff" }}>{prog}%</span>
                        </div>
                        <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${prog}%`,
                            background: isDiscontinued
                              ? "linear-gradient(90deg, #ef4444 0%, #f97316 100%)"
                              : "linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)",
                            borderRadius: "3px",
                            transition: "width 0.3s ease"
                          }} />
                        </div>
                      </div>

                      {/* Evidence Stats Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px", color: "var(--text-secondary, #94a3b8)" }}>
                        <div>Modules: <strong>{completedMod} / {totalMod}</strong></div>
                        <div>Lessons: <strong>{completedLes} / {totalLes}</strong></div>
                        <div>Quiz: <strong>{hasQuiz ? "Completed" : "Pending"}</strong></div>
                        <div>Project: <strong>{hasProject ? "Submitted" : "Pending"}</strong></div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => {
                          if (course.courseId) {
                            setActiveCourseViewerId(course.courseId);
                          } else {
                            setActiveLearningSkillId(course.courseId || course.skillId || course.id);
                          }
                        }}
                        disabled={isDiscontinued}
                        className="btn-cyber-primary"
                        style={{
                          flex: 1, padding: "8px 12px", fontSize: "12px",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                          opacity: isDiscontinued ? 0.4 : 1,
                          cursor: isDiscontinued ? "not-allowed" : "pointer"
                        }}
                      >
                        <Play size={13} />
                        <span>{isDiscontinued ? "Discontinued" : "Continue"}</span>
                      </button>
                      <button
                        onClick={() => setModalSkillId(course.courseId || course.skillId || course.id)}
                        className="btn-cyber-outline"
                        style={{ padding: "8px 12px", fontSize: "12px" }}
                        title="View Course Syllabus"
                      >
                        Details
                      </button>
                      {!isDiscontinued && (
                        <button
                          onClick={() => setDiscontinueTarget(course)}
                          className="btn-cyber-outline"
                          style={{
                            padding: "8px 12px", fontSize: "12px",
                            borderColor: "rgba(239, 68, 68, 0.35)",
                            color: "#f87171"
                          }}
                          title="Discontinue this course"
                        >
                          Discontinue
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ASSIGNED COURSES ── */}
      {activeTab === "Assigned Courses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Information Card */}
          <div className="glass-panel" style={{
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}>
                <UserCheck size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                  Faculty-Assigned Learning Tracks
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary, #94a3b8)' }}>
                  Mandatory and recommended coursework assigned directly by your academic professors and institution mentors.
                </p>
              </div>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#818cf8',
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '4px 12px',
              borderRadius: '999px'
            }}>
              {assignedCourses.length} Assigned {assignedCourses.length === 1 ? 'Course' : 'Courses'}
            </span>
          </div>

          {assignedCourses.length === 0 ? (
            <div className="glass-panel" style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
              <BookOpen size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
              <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                No Assigned Courses Pending
              </h3>
              <p style={{ margin: 0, fontSize: "13px" }}>
                You currently have no direct faculty assignments. Explore open enrollments in "My Courses" or your college directory.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
              {assignedCourses.map((course, idx) => {
                const prog = course.progress !== undefined ? course.progress : (course.learningProgress || 0);
                const completedLes = course.completedLessons || 0;
                const totalLes = course.totalLessons || 4;

                return (
                  <div
                    key={course.courseId || course.id || idx}
                    className="glass-panel"
                    style={{
                      padding: "20px",
                      borderRadius: "14px",
                      border: "1px solid rgba(99, 102, 241, 0.25)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "16px",
                      background: "rgba(99, 102, 241, 0.03)"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.06)",
                          color: catColor(course.category)
                        }}>
                          {course.category || "Programming"}
                        </span>
                        <span style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: prog >= 100 ? "#10b981" : (prog > 0 ? "var(--cyber-cyan, #00f2fe)" : "var(--text-muted, #64748b)")
                        }}>
                          {prog >= 100 ? "COMPLETED" : (prog > 0 ? "IN PROGRESS" : "NOT STARTED")}
                        </span>
                      </div>

                      <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: "#ffffff" }}>
                        {course.title || course.courseTitle || course.skillName}
                      </h3>

                      {course.description && (
                        <p style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", margin: "0 0 10px", lineHeight: "1.4" }}>
                          {course.description}
                        </p>
                      )}

                      {course.assignedBy && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#818cf8',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          marginBottom: '12px'
                        }}>
                          <UserCheck size={13} />
                          Assigned by Prof. {course.assignedBy.name} ({course.assignedBy.designation || 'Faculty'})
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div style={{ margin: "10px 0 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "6px" }}>
                          <span style={{ color: "var(--text-secondary, #94a3b8)" }}>Curriculum Progress</span>
                          <span style={{ fontWeight: 700, color: "#ffffff" }}>{prog}%</span>
                        </div>
                        <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${prog}%`,
                            background: "linear-gradient(90deg, #6366f1 0%, #00f2fe 100%)",
                            borderRadius: "3px",
                            transition: "width 0.3s ease"
                          }} />
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary, #94a3b8)" }}>
                        <span>Completed Lessons: <strong>{completedLes} / {totalLes}</strong></span>
                        <span>Level: <strong>{course.difficulty || 'Intermediate'}</strong></span>
                      </div>
                    </div>

                    {/* Action */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                      <button
                        onClick={() => {
                          if (course.courseId) {
                            setActiveCourseViewerId(course.courseId);
                          } else {
                            setActiveLearningSkillId(course.courseId || course.skillId || course.id);
                          }
                        }}
                        className="btn-cyber-primary"
                        style={{
                          width: "100%",
                          padding: "9px 14px",
                          fontSize: "12.5px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                          cursor: "pointer"
                        }}
                      >
                        <Play size={14} />
                        <span>{prog > 0 ? "Continue Course" : "Start Course"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: QUIZZES & TESTS ── */}
      {activeTab === "Quizzes & Tests" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {quizzes.length === 0 ? (
            <div className="glass-panel" style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
              <HelpCircle size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
              <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                No Quizzes or Tests Completed
              </h3>
              <p style={{ margin: 0, fontSize: "13px" }}>
                Complete module lessons in your enrolled courses to unlock quizzes, checkpoint drills, and benchmark exams.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {quizzes.map((q, idx) => (
                <div
                  key={idx}
                  className="glass-panel"
                  style={{
                    padding: "18px 22px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase" }}>
                        QUIZ CHECKPOINT
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>•</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>Attempt #{q.attempt || 1}</span>
                    </div>
                    <h4 style={{ margin: "4px 0 2px", fontSize: "15.5px", fontWeight: 700, color: "#ffffff" }}>
                      {q.quizTitle || "Technical Assessment"}
                    </h4>
                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary, #94a3b8)" }}>
                      Completed on {new Date(q.completedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: q.percentage >= 75 ? "#10b981" : "#f59e0b", fontFamily: "monospace" }}>
                        {q.score} / {q.maxScore}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>
                        Accuracy: {q.percentage}%
                      </div>
                    </div>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: q.percentage >= 70 ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                      color: q.percentage >= 70 ? "#10b981" : "#f59e0b"
                    }}>
                      {q.status || "COMPLETED"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: PROJECTS ── */}
      {activeTab === "Projects" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {projects.length === 0 ? (
            <div className="glass-panel" style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
              <Target size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
              <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                No Capstone Projects Started Yet
              </h3>
              <p style={{ margin: 0, fontSize: "13px" }}>
                Enroll in a skill offering with a capstone project to demonstrate verified hands-on capability.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
              {projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="glass-panel"
                  style={{
                    padding: "20px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "14px"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#f59e0b" }}>
                        PRACTICAL CAPSTONE
                      </span>
                      <span style={{
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: proj.status === "Submitted" ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.06)",
                        color: proj.status === "Submitted" ? "#10b981" : "var(--text-muted, #64748b)"
                      }}>
                        {proj.status}
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 6px", fontSize: "16.5px", fontWeight: 700, color: "#ffffff" }}>
                      {proj.projectName}
                    </h3>
                    <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--text-secondary, #94a3b8)", lineHeight: 1.5 }}>
                      {proj.description || "Capstone implementation validating practical industry competency."}
                    </p>

                    {proj.repoUrl && (
                      <div style={{ fontSize: "11.5px", color: "var(--cyber-cyan, #00f2fe)", marginBottom: "8px", wordBreak: "break-all" }}>
                        <ExternalLink size={12} style={{ display: "inline", marginRight: "4px" }} />
                        <a href={proj.repoUrl} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                          {proj.repoUrl}
                        </a>
                      </div>
                    )}

                    <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>
                      Evidence: {proj.evidence}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveLearningSkillId(proj.skillId)}
                    className="btn-cyber-primary"
                    style={{ padding: "8px 14px", fontSize: "12px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <span>{proj.status === "Submitted" ? "Review Submission" : "Open Project Workspace"}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 6: CERTIFICATIONS ── */}
      {activeTab === "Certifications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header Action Bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: "12px", background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
            borderRadius: "14px", padding: "16px 20px"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--cyber-cyan, #00f2fe)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                <Award size={15} />
                <span>CREDENTIAL & EVIDENCE LEDGER</span>
              </div>
              <h3 style={{ margin: "2px 0 0", fontSize: "17px", fontWeight: 800, color: "#ffffff" }}>
                Certifications & External Credentials
              </h3>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-cyber-primary"
              style={{ padding: "8px 16px", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={14} /> Upload External Certificate
            </button>
          </div>

          {certifications.length === 0 && uploadedCertificates.length === 0 ? (
            <div className="glass-panel" style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
              <Award size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
              <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                No Certifications Recorded Yet
              </h3>
              <p style={{ margin: "0 0 16px", fontSize: "13px" }}>
                Complete accredited course benchmarks or upload certificates from external authorities for college verification.
              </p>
              <button onClick={() => setShowUploadModal(true)} className="btn-cyber-primary" style={{ padding: "8px 16px", fontSize: "12px" }}>
                <Plus size={13} /> Upload First Certificate
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {/* Institutional Course Certificates */}
              {certifications.map((cert, idx) => (
                <div
                  key={`inst_${idx}`}
                  className="glass-panel"
                  style={{
                    padding: "20px",
                    borderRadius: "14px",
                    border: "1px solid rgba(236, 72, 153, 0.2)",
                    background: "linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, transparent 100%)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ec4899" }}>
                      <Award size={18} />
                      <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                        INSTITUTIONAL CERTIFICATE
                      </span>
                    </div>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981"
                    }}>
                      VERIFIED
                    </span>
                  </div>

                  <h3 style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                    {cert.title || cert.name}
                  </h3>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted, #64748b)" }}>
                    Issuer: {cert.issuer || cert.institutionName || "Accredited Partner"}
                  </div>
                  {cert.credentialId && (
                    <div style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--cyber-cyan, #00f2fe)" }}>
                      ID: {cert.credentialId}
                    </div>
                  )}
                  <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", marginTop: "4px" }}>
                    Issued: {cert.date || cert.issuedAt || "Recently"}
                  </div>
                </div>
              ))}

              {/* Student Uploaded Certificates */}
              {uploadedCertificates.map((cert) => {
                const isVerified = cert.status === "VERIFIED";
                const isPending = cert.status === "PENDING";
                return (
                  <div
                    key={cert.id}
                    onClick={() => setViewingCertId(cert.id)}
                    className="glass-panel"
                    style={{
                      padding: "20px",
                      borderRadius: "14px",
                      border: `1px solid ${isVerified ? "rgba(16, 185, 129, 0.3)" : isPending ? "rgba(234, 179, 8, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                      background: isVerified ? "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)" : "rgba(255, 255, 255, 0.02)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--cyber-cyan, #00f2fe)" }}>
                        <Award size={18} />
                        <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                          {cert.category || "EXTERNAL CREDENTIAL"}
                        </span>
                      </div>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: isVerified ? "rgba(16, 185, 129, 0.15)" : "rgba(234, 179, 8, 0.15)",
                        color: isVerified ? "#10b981" : "var(--cyber-amber, #f59e0b)"
                      }}>
                        {cert.status}
                      </span>
                    </div>

                    <h3 style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                      {cert.title}
                    </h3>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted, #64748b)" }}>
                      Issuer: {cert.issuer || "External Organization"}
                    </div>
                    {cert.verifiedBy && (
                      <div style={{ fontSize: "11px", color: "var(--cyber-emerald, #10b981)", fontWeight: 600 }}>
                        ✓ Verified by {cert.verifiedBy}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", fontSize: "11px", color: "var(--text-muted, #64748b)" }}>
                      <span>Submitted: {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : "Recently"}</span>
                      <span style={{ color: "var(--cyber-cyan, #00f2fe)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Eye size={12} /> View Document
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 7: LEARNING INTELLIGENCE & AI ── */}
      {activeTab === "Learning Intelligence & AI" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 1: Comparative Matrix — What You Think vs What You Have Proven */}
          <div className="glass-panel" style={{ padding: "24px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                  Skill Intelligence Matrix: Self-Assessed vs. Verified
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary, #94a3b8)" }}>
                  Contrasting personal self-assessment against deterministic, activity-backed verified proficiency.
                </p>
              </div>
            </div>

            {(!intelligence?.skillComparisons || intelligence.skillComparisons.length === 0) ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
                <Compass size={32} style={{ opacity: 0.3, margin: "0 auto 8px" }} />
                <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 600 }}>No skill comparative data yet</p>
                <p style={{ margin: 0, fontSize: "11.5px" }}>Self-assess your skills or enroll in an institutional course to activate intelligence.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "left", color: "var(--text-muted, #64748b)" }}>
                      <th style={{ padding: "10px 12px" }}>Skill</th>
                      <th style={{ padding: "10px 12px" }}>Self-Assessed Level</th>
                      <th style={{ padding: "10px 12px" }}>Verified Proficiency</th>
                      <th style={{ padding: "10px 12px" }}>Curriculum Progress</th>
                      <th style={{ padding: "10px 12px" }}>NEXUS AI Intelligence Insight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intelligence.skillComparisons.map((c, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "12px", fontWeight: 600, color: "#ffffff" }}>{c.skillName}</td>
                        <td style={{ padding: "12px" }}>
                          {c.selfAssessment ? (
                            <span style={{ padding: "3px 8px", borderRadius: "4px", background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", fontWeight: 600 }}>
                              {c.selfAssessment.level}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted, #64748b)" }}>Not self-assessed</span>
                          )}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: (c.verifiedSkill?.proficiency || 0) >= 70 ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.05)",
                            color: (c.verifiedSkill?.proficiency || 0) >= 70 ? "#10b981" : "var(--text-secondary, #94a3b8)",
                            fontWeight: 700,
                            fontFamily: "monospace"
                          }}>
                            {c.verifiedSkill?.proficiency || 0}%
                          </span>
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary, #94a3b8)" }}>
                          {c.verifiedSkill?.learningProgress || 0}%
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary, #94a3b8)", fontSize: "11.5px" }}>
                          {c.comparisonInsight}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Strengths & Skill Gaps Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* Strengths */}
            <div className="glass-panel" style={{ padding: "24px", borderRadius: "14px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <CheckCircle2 size={18} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#10b981" }}>Verified Strengths</h3>
              </div>
              {(!intelligence?.strengths || intelligence.strengths.length === 0) ? (
                <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-muted, #64748b)" }}>
                  No verified strengths identified yet. Achieve 70%+ proficiency in an institutional curriculum or score 80%+ on assessments to validate strengths.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {intelligence.strengths.map((s, idx) => (
                    <div key={idx} style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>{s.skill}</span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", fontFamily: "monospace" }}>{s.proficiency}%</span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-secondary, #94a3b8)" }}>{s.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skill Gaps */}
            <div className="glass-panel" style={{ padding: "24px", borderRadius: "14px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <AlertCircle size={18} color="#f87171" />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f87171" }}>Identified Skill Gaps</h3>
              </div>
              {(!intelligence?.skillGaps || intelligence.skillGaps.length === 0) ? (
                <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-muted, #64748b)" }}>
                  No active skill gaps identified. All enrolled skills are on pace or no active courses are lagging.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {intelligence.skillGaps.map((g, idx) => (
                    <div key={idx} style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>{g.skill}</span>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#f87171", padding: "2px 6px", borderRadius: "4px", background: "rgba(239,68,68,0.12)" }}>
                          {g.severity} GAP
                        </span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-secondary, #94a3b8)" }}>
                        {g.gap} • Action: <strong>{g.nextAction}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      {/* 1. Self-Assessment Modal */}
      <SelfAssessmentModal
        isOpen={isSelfModalOpen}
        initialData={editingSelfAssessment}
        onClose={() => {
          setIsSelfModalOpen(false);
          setEditingSelfAssessment(null);
        }}
        onSaved={handleSaveSelfAssessment}
      />

      {/* 2. Interactive Skill Learning Path Modal */}
      {activeLearningSkillId && (
        <SkillLearningPathModal
          isOpen={Boolean(activeLearningSkillId)}
          skillId={activeLearningSkillId}
          student={auth}
          onClose={() => setActiveLearningSkillId(null)}
          onProgressUpdated={() => refreshAllData()}
        />
      )}

      {/* 2b. Course Viewer & Real Lesson Completion Modal */}
      {activeCourseViewerId && (
        <CourseViewerModal
          isOpen={Boolean(activeCourseViewerId)}
          courseId={activeCourseViewerId}
          onClose={() => setActiveCourseViewerId(null)}
          onProgressUpdated={() => refreshAllData()}
          onShowToast={onShowToast}
        />
      )}

      {/* 3. Skill Details Modal */}
      {modalSkillId && (
        <SkillDetailsModal
          isOpen={Boolean(modalSkillId)}
          skillId={modalSkillId}
          student={auth}
          onClose={() => setModalSkillId(null)}
          onEnrolled={() => {
            refreshAllData();
            if (onShowToast) {
              onShowToast({
                title: "Enrollment Updated",
                message: "Enrolled in skill course. Progress tracking active.",
                type: "success"
              });
            }
          }}
        />
      )}

      {/* 4. Student Certificate Upload Modal */}
      <CertificateUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onShowToast={onShowToast}
        onCertificateUploaded={() => refreshAllData()}
      />

      {/* 5. In-App Document Streaming & Viewer Modal */}
      {viewingCertId && (
        <CertificateViewerModal
          isOpen={Boolean(viewingCertId)}
          certificateId={viewingCertId}
          onClose={() => setViewingCertId(null)}
          onShowToast={onShowToast}
        />
      )}

      {/* 6. Discontinue Course Confirmation Modal */}
      {discontinueTarget && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(6, 26, 51, 0.85)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div className="glass-card" style={{
            maxWidth: "480px",
            width: "100%",
            padding: "28px",
            borderRadius: "16px",
            background: "rgba(10, 37, 64, 0.95)",
            border: "1px solid rgba(255, 100, 100, 0.3)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(239, 68, 68, 0.15)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width: "42px", height: "42px", borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <AlertCircle size={22} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#ffffff" }}>
                  Discontinue Course?
                </h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                  Enrollment state change advisory
                </p>
              </div>
            </div>

            <p style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: "1.5", margin: "0 0 16px" }}>
              You are about to discontinue:
            </p>

            <div style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "14px 16px",
              marginBottom: "18px"
            }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", marginBottom: "6px" }}>
                {discontinueTarget.courseTitle || discontinueTarget.skillName || discontinueTarget.title}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94a3b8" }}>
                <span>Your Current Progress:</span>
                <span style={{ fontWeight: 700, color: "var(--cyber-cyan, #00f2fe)" }}>
                  {discontinueTarget.learningProgress !== undefined ? discontinueTarget.learningProgress : (discontinueTarget.progress || 0)}%
                </span>
              </div>
            </div>

            <div style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "12px",
              color: "#fca5a5",
              lineHeight: "1.4",
              marginBottom: "18px"
            }}>
              ⚠️ If you discontinue this course, your enrollment status will be updated to <strong>Discontinued</strong> and the relevant institution and collaborating industry may be notified. Historical progress is safely preserved.
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
                Reason for Discontinuation (Optional):
              </label>
              <select
                value={discontinueReason}
                onChange={(e) => setDiscontinueReason(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: "8px",
                  background: "rgba(6, 26, 51, 0.8)", border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#ffffff", fontSize: "13px", marginBottom: "10px"
                }}
              >
                <option value="Academic workload">Academic workload</option>
                <option value="Personal reason">Personal reason</option>
                <option value="Course no longer relevant">Course no longer relevant</option>
                <option value="Schedule conflict">Schedule conflict</option>
                <option value="Difficulty">Difficulty</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Additional notes (optional)..."
                value={discontinueNotes}
                onChange={(e) => setDiscontinueNotes(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: "8px",
                  background: "rgba(6, 26, 51, 0.8)", border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#ffffff", fontSize: "13px"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                disabled={isDiscontinuing}
                onClick={() => setDiscontinueTarget(null)}
                className="btn-cyber-outline"
                style={{ padding: "9px 18px", fontSize: "13px", borderRadius: "8px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDiscontinuing}
                onClick={handleConfirmDiscontinue}
                style={{
                  padding: "9px 20px", fontSize: "13px", fontWeight: 700, borderRadius: "8px",
                  background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                  border: "none", color: "#ffffff", cursor: isDiscontinuing ? "not-allowed" : "pointer",
                  opacity: isDiscontinuing ? 0.7 : 1, display: "flex", alignItems: "center", gap: "8px"
                }}
              >
                {isDiscontinuing ? (
                  <>
                    <Clock size={14} className="animate-spin" />
                    <span>Discontinuing...</span>
                  </>
                ) : (
                  <span>Confirm Discontinuation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
