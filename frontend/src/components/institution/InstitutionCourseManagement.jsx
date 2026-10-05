import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Users,
  TrendingUp,
  Clock,
  Layers,
  ArrowRight,
  GraduationCap,
  Play,
  Plus,
  X,
  Check,
  XCircle,
  AlertCircle,
  Filter,
  Calendar,
  Award,
  ShieldCheck,
  Eye,
  Edit3,
  Archive,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import {
  getInstitutionCourses,
  enrollCohortInCourse
} from '../../services/institutionData';
import {
  getCoursesByInstitution,
  createInstitutionCourse
} from '../../services/nexusDataStore';
import { academicService } from '../../services/academicService';
import AddSkillWizardModal from './AddSkillWizardModal';
import '../common/CompactDataList.css';

export default function InstitutionCourseManagement({ onShowToast, institution }) {
  const instCollegeId = institution?.collegeId || institution?.id || '';
  const instName = institution?.institutionName || institution?.name || 'Institution';

  // Navigation tab: 'SKILLS' | 'REQUESTS' | 'INTERVENTIONS'
  const [activeTab, setActiveTab] = useState('SKILLS');
  const [skillStatusFilter, setSkillStatusFilter] = useState('ALL'); // ALL, PUBLISHED, DRAFT, ARCHIVED

  // Detail View Modals
  const [selectedDetailSkill, setSelectedDetailSkill] = useState(null);
  const [selectedDetailIntervention, setSelectedDetailIntervention] = useState(null);

  // Live Skills & Requests
  const [skills, setSkills] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Wizard state
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);

  // Reject confirmation modal state
  const [rejectModal, setRejectModal] = useState({ isOpen: false, request: null, reason: '' });

  // Legacy course states
  const [interventionCourses, setInterventionCourses] = useState(getInstitutionCourses());
  const [relationalCourses, setRelationalCourses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for creating legacy new course
  const [newCourse, setNewCourse] = useState({
    courseName: '',
    courseCode: '',
    category: 'TECHNICAL',
    duration: '6 Weeks',
    instructor: 'Faculty Lead, Dept of CSE',
    skillsDeveloped: 'Machine Learning, PyTorch, Model Optimization',
    difficulty: 'Intermediate',
    modules: 'Module 1: Foundations & Architecture\nModule 2: Model Training & Evaluation\nModule 3: Optimization & Benchmarking\nModule 4: Deployment & Proctored Capstone'
  });

  const loadSkillsAndRequests = async () => {
    setLoading(true);
    try {
      const [skillsRes, reqRes] = await Promise.all([
        academicService.getSkills().catch(() => ({ success: false, data: [] })),
        academicService.getPendingEnrollmentRequests().catch(() => ({ success: false, data: [] }))
      ]);

      if (skillsRes && skillsRes.success && Array.isArray(skillsRes.data)) {
        setSkills(skillsRes.data);
      }
      if (reqRes && reqRes.success && Array.isArray(reqRes.data)) {
        setPendingRequests(reqRes.data);
      }
    } catch (err) {
      console.error('Error loading skills/requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLegacyData = async () => {
    try {
      const res = await academicService.getCourses();
      if (res && res.success && Array.isArray(res.data)) {
        setRelationalCourses(res.data);
      } else {
        setRelationalCourses(getCoursesByInstitution(instCollegeId));
      }
    } catch (e) {
      setRelationalCourses(getCoursesByInstitution(instCollegeId));
    }
    setInterventionCourses(getInstitutionCourses());
  };

  useEffect(() => {
    loadLegacyData();
    loadSkillsAndRequests();

    const handleUpdate = () => {
      loadLegacyData();
      loadSkillsAndRequests();
    };

    window.addEventListener('nexus_institution_courses_changed', handleUpdate);
    window.addEventListener('nexus_course_created', handleUpdate);
    window.addEventListener('nexus_course_enrolled', handleUpdate);
    window.addEventListener('nexus_data_updated', handleUpdate);
    window.addEventListener('nexus_skills_updated', handleUpdate);
    return () => {
      window.removeEventListener('nexus_institution_courses_changed', handleUpdate);
      window.removeEventListener('nexus_course_created', handleUpdate);
      window.removeEventListener('nexus_course_enrolled', handleUpdate);
      window.removeEventListener('nexus_data_updated', handleUpdate);
      window.removeEventListener('nexus_skills_updated', handleUpdate);
    };
  }, [instCollegeId]);

  const handleArchiveSkill = async (skillId, skillTitle) => {
    if (!window.confirm(`Are you sure you want to archive "${skillTitle}"? It will no longer be visible for new enrollments.`)) {
      return;
    }
    setProcessingId(skillId);
    try {
      const res = await academicService.archiveSkill(skillId);
      if (res && res.success) {
        if (onShowToast) onShowToast({ title: 'Skill Archived', message: `"${skillTitle}" moved to archives.`, type: 'info' });
        loadSkillsAndRequests();
      } else {
        if (onShowToast) onShowToast({ title: 'Error', message: res?.error || 'Failed to archive skill', type: 'error' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveEnrollment = async (reqItem) => {
    setProcessingId(reqItem.id);
    try {
      const res = await academicService.approveEnrollment(reqItem.id, 'Approved by academic coordinator');
      if (res && res.success) {
        if (onShowToast) {
          onShowToast({
            title: 'Enrollment Approved',
            message: `Approved ${reqItem.studentName || 'Student'} for "${reqItem.skillTitle}". Notification dispatched.`,
            type: 'success'
          });
        }
        loadSkillsAndRequests();
      } else {
        if (onShowToast) onShowToast({ title: 'Approval Failed', message: res?.error || 'Failed to approve', type: 'error' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Approval Error', message: err.message, type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModal.request) return;
    const reqItem = rejectModal.request;
    setProcessingId(reqItem.id);
    try {
      const res = await academicService.rejectEnrollment(reqItem.id, rejectModal.reason || 'Criteria requirement not met');
      if (res && res.success) {
        if (onShowToast) {
          onShowToast({
            title: 'Request Rejected',
            message: `Rejected request for ${reqItem.studentName || 'Student'}. Reason communicated to student.`,
            type: 'info'
          });
        }
        setRejectModal({ isOpen: false, request: null, reason: '' });
        loadSkillsAndRequests();
      } else {
        if (onShowToast) onShowToast({ title: 'Rejection Failed', message: res?.error || 'Failed to reject', type: 'error' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Rejection Error', message: err.message, type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  // Filter skills based on status tab
  const filteredSkills = skills.filter((sk) => {
    if (skillStatusFilter === 'ALL') return true;
    return (sk.status || 'PUBLISHED').toUpperCase() === skillStatusFilter;
  });

  const publishedCount = skills.filter(s => (s.status || 'PUBLISHED').toUpperCase() === 'PUBLISHED').length;
  const draftCount = skills.filter(s => (s.status || '').toUpperCase() === 'DRAFT').length;
  const archivedCount = skills.filter(s => (s.status || '').toUpperCase() === 'ARCHIVED').length;

  const handleEnrollCohort = (courseId, title, count) => {
    const updated = enrollCohortInCourse(courseId);
    setInterventionCourses(updated);
    if (onShowToast) {
      onShowToast({
        title: 'Cohort Enrolled Successfully',
        message: `${count} students enrolled in "${title}". Readiness trajectory updated.`,
        type: 'success'
      });
    }
  };

  const loadData = () => {
    loadLegacyData();
    loadSkillsAndRequests();
  };

  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault();
    if (!newCourse.courseName.trim()) {
      if (onShowToast) onShowToast({ title: 'Validation Error', message: 'Course name is required.', type: 'warning' });
      return;
    }

    try {
      await academicService.createCourse({
        title: newCourse.courseName,
        course_name: newCourse.courseName,
        code: newCourse.courseCode,
        category: newCourse.category,
        duration: newCourse.duration,
        instructor: newCourse.instructor,
        skills: newCourse.skillsDeveloped ? newCourse.skillsDeveloped.split(',').map(s => s.trim()) : [],
        difficulty: newCourse.difficulty,
        modules: newCourse.modules
      });
    } catch (err) {
      console.warn('Backend course creation note:', err.message);
    }

    const created = createInstitutionCourse({
      ...newCourse,
      institutionId: instCollegeId,
      institutionName: instName
    });

    setShowCreateModal(false);
    setNewCourse({
      courseName: '',
      courseCode: '',
      category: 'TECHNICAL',
      duration: '6 Weeks',
      instructor: 'Faculty Lead, Dept of CSE',
      skillsDeveloped: 'Machine Learning, PyTorch, Model Optimization',
      difficulty: 'Intermediate',
      modules: 'Module 1: Foundations & Architecture\nModule 2: Model Training & Evaluation\nModule 3: Optimization & Benchmarking\nModule 4: Deployment & Proctored Capstone'
    });

    loadData();

    if (onShowToast) {
      onShowToast({
        title: 'Course Published to Campus Catalog',
        message: `"${created.courseName}" is now live for all enrolled students in ${instCollegeId}.`,
        type: 'success'
      });
    }
  };

  return (
    <div>
      {/* ── TOP CLOSED-LOOP FLOW BANNER ── */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(16,26,48,0.7) 0%, rgba(10,16,30,0.9) 100%)', borderTop: '3px solid var(--cyber-emerald)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="var(--cyber-emerald)" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Course & Skill Lifecycle Management
              </h2>
              <span className="cyber-badge badge-emerald" style={{ fontSize: '10px' }}>
                CAMPUS: {instCollegeId}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Publish credit-bearing skills, configure eligibility benchmarks, manage student enrollment requests, and track proctored certifications.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setEditingSkill(null);
                setShowWizardModal(true);
              }}
              className="btn-cyber-primary"
              style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              <span>+ Add Skill / Course</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-cyber-outline"
              style={{ padding: '9px 16px', fontSize: '12px' }}
            >
              Quick Legacy Catalog
            </button>
          </div>
        </div>

        {/* Closed-loop Pipeline visual */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          overflowX: 'auto',
          padding: '12px 16px',
          background: 'rgba(10,16,30,0.6)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          {[
            { label: 'Add Skill (10-Step)', icon: '🛠️' },
            { label: 'Student Notification', icon: '🔔' },
            { label: 'Eligibility Check', icon: '🎯' },
            { label: 'Enrollment & Approval', icon: '📝' },
            { label: 'Learning & Modules', icon: '📚' },
            { label: 'Proctored Assessment', icon: '⏱️' },
            { label: 'Benchmark Certificate', icon: '🏆' }
          ].map((item, idx) => (
            <React.Fragment key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {idx < 6 && <div style={{ color: 'var(--cyber-emerald)', fontSize: '14px', fontWeight: 700 }}>→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── TOP LEVEL WORKSPACE NAVIGATION TABS ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('SKILLS')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'SKILLS' ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
            background: activeTab === 'SKILLS' ? 'rgba(0, 212, 255, 0.15)' : 'rgba(10, 16, 30, 0.4)',
            color: activeTab === 'SKILLS' ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <BookOpen size={16} />
          <span>Skills & Courses Catalog</span>
          <span style={{
            fontSize: '11px',
            padding: '2px 7px',
            borderRadius: '10px',
            background: 'rgba(0, 212, 255, 0.2)',
            color: 'var(--cyber-cyan)'
          }}>
            {skills.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'REQUESTS' ? '1px solid var(--cyber-amber)' : '1px solid var(--border-subtle)',
            background: activeTab === 'REQUESTS' ? 'rgba(255, 170, 0, 0.15)' : 'rgba(10, 16, 30, 0.4)',
            color: activeTab === 'REQUESTS' ? 'var(--cyber-amber)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <UserCheck size={16} />
          <span>Enrollment Requests</span>
          {pendingRequests.length > 0 && (
            <span style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '10px',
              background: 'var(--cyber-amber)',
              color: '#050a14',
              fontWeight: 800,
              boxShadow: '0 0 10px rgba(255, 170, 0, 0.4)'
            }}>
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('INTERVENTIONS')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'INTERVENTIONS' ? '1px solid var(--cyber-emerald)' : '1px solid var(--border-subtle)',
            background: activeTab === 'INTERVENTIONS' ? 'rgba(0, 255, 178, 0.15)' : 'rgba(10, 16, 30, 0.4)',
            color: activeTab === 'INTERVENTIONS' ? 'var(--cyber-emerald)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <TrendingUp size={16} />
          <span>Industry Skill Deficits</span>
          <span style={{
            fontSize: '11px',
            padding: '2px 7px',
            borderRadius: '10px',
            background: 'rgba(0, 255, 178, 0.2)',
            color: 'var(--cyber-emerald)'
          }}>
            {interventionCourses.length}
          </span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: SKILLS & COURSES CATALOG (10-Step Wizard Skills)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'SKILLS' && (
        <div>
          {/* Subfilter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {[
                { id: 'ALL', label: 'All', count: skills.length },
                { id: 'PUBLISHED', label: 'Published', count: publishedCount },
                { id: 'DRAFT', label: 'Drafts', count: draftCount },
                { id: 'ARCHIVED', label: 'Archived', count: archivedCount }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSkillStatusFilter(filter.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: skillStatusFilter === filter.id ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                    background: skillStatusFilter === filter.id ? 'rgba(0, 212, 255, 0.15)' : 'rgba(10, 16, 30, 0.5)',
                    color: skillStatusFilter === filter.id ? 'var(--cyber-cyan)' : 'var(--text-secondary)'
                  }}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            <button
              onClick={loadSkillsAndRequests}
              disabled={loading}
              className="btn-cyber-outline"
              style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Skills Grid */}
          {filteredSkills.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
              <BookOpen size={40} color="var(--cyber-cyan)" style={{ margin: '0 auto 14px', opacity: 0.7 }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                {skillStatusFilter === 'ALL' ? 'No courses have been posted yet.' : `No ${skillStatusFilter.toLowerCase()} courses found.`}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px' }}>
                Create structured courses with curriculum modules, instructors, assessment pass benchmarks, and student eligibility criteria using the course wizard.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setEditingSkill(null);
                    setShowWizardModal(true);
                  }}
                  className="btn-cyber-primary"
                  style={{ padding: '10px 24px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={16} />
                  <span>+ Add Course</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="compact-table-container">
              <div className="compact-table-scroll">
                <table className="compact-table">
                  <thead>
                    <tr>
                      <th>Course / Skill</th>
                      <th>Code</th>
                      <th>Duration & Credits</th>
                      <th>Enrolled / Seats</th>
                      <th>Faculty Lead</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSkills.map((sk) => {
                      const isPub = (sk.status || '').toUpperCase() === 'PUBLISHED';
                      const isDrf = (sk.status || '').toUpperCase() === 'DRAFT';

                      return (
                        <tr key={sk.id}>
                          <td>
                            <div className="compact-cell-title">
                              <div className="compact-cell-icon" style={{ background: 'rgba(108, 92, 231, 0.15)', borderColor: 'rgba(108, 92, 231, 0.3)' }}>
                                <BookOpen size={16} color="var(--cyber-cyan)" />
                              </div>
                              <div>
                                <div className="compact-title-text">{sk.title}</div>
                                <div className="compact-subtitle-text">{sk.category || 'TECHNICAL'} • {sk.level || 'Intermediate'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="cyber-badge badge-purple" style={{ fontSize: '10px' }}>
                              {sk.code || 'SKILL'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{sk.duration_weeks ? `${sk.duration_weeks} Wks` : 'Self-Paced'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sk.credit_value ? `${sk.credit_value} Credits` : 'Non-Credit'}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--cyber-emerald)', fontFamily: 'var(--font-mono)' }}>
                              {sk.enrolled_count || 0}
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>/{sk.seat_limit || '∞'}</span>
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {sk.pending_count ? `${sk.pending_count} pending` : `${sk.completed_count || 0} completed`}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {sk.instructor_name || 'Faculty Lead'}
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {sk.industry_visibility ? '🏢 Industry Visible' : '🔒 Campus Internal'}
                            </div>
                          </td>
                          <td>
                            <span className={`cyber-badge ${isPub ? 'badge-emerald' : isDrf ? 'badge-amber' : 'badge-subtle'}`} style={{ fontSize: '9.5px' }}>
                              {sk.status || 'PUBLISHED'}
                            </span>
                          </td>
                          <td>
                            <div className="compact-actions">
                              <button
                                type="button"
                                onClick={() => setSelectedDetailSkill(sk)}
                                className="btn-compact-details"
                              >
                                <span>View Details</span>
                                <ArrowRight size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSkill(sk);
                                  setShowWizardModal(true);
                                }}
                                className="btn-compact-secondary"
                                title="Edit Skill"
                              >
                                <Edit3 size={12} />
                                <span>Edit</span>
                              </button>
                              {isPub && (
                                <button
                                  type="button"
                                  onClick={() => handleArchiveSkill(sk.id, sk.title)}
                                  disabled={processingId === sk.id}
                                  className="btn-compact-secondary"
                                  style={{ color: 'var(--cyber-rose)' }}
                                  title="Archive Skill"
                                >
                                  <Archive size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Legacy Catalog Courses if present */}
          {relationalCourses.length > 0 && (
            <div className="compact-table-container" style={{ marginTop: '20px', marginBottom: '28px' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(10, 16, 30, 0.6)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="var(--cyber-cyan)" />
                  <span>Campus Direct Courses ({relationalCourses.length})</span>
                </h4>
              </div>

              <div className="compact-table-scroll">
                <table className="compact-table">
                  <thead>
                    <tr>
                      <th>Course Title</th>
                      <th>Code</th>
                      <th>Duration</th>
                      <th>Enrolled</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relationalCourses.map((rc) => (
                      <tr key={rc.courseId}>
                        <td>
                          <div className="compact-cell-title">
                            <div className="compact-cell-icon">
                              <BookOpen size={15} color="var(--cyber-cyan)" />
                            </div>
                            <div>
                              <div className="compact-title-text">{rc.courseName}</div>
                              <div className="compact-subtitle-text">{rc.instructor || 'Campus Faculty Lead'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>
                            {rc.courseCode}
                          </span>
                        </td>
                        <td>{rc.duration || `${rc.durationWeeks || 6} Weeks`}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyber-emerald)' }}>
                          {rc.enrolledCount || 0} Students
                        </td>
                        <td>
                          <span className="cyber-badge badge-emerald" style={{ fontSize: '9.5px' }}>
                            {rc.enrollmentStatus || 'Active'}
                          </span>
                        </td>
                        <td>
                          <div className="compact-actions">
                            <button
                              type="button"
                              onClick={() => setSelectedDetailSkill({
                                title: rc.courseName,
                                code: rc.courseCode,
                                category: rc.category || 'Direct Campus Course',
                                duration_weeks: rc.durationWeeks || 6,
                                enrolled_count: rc.enrolledCount || 0,
                                instructor_name: rc.instructor || 'Campus Faculty Lead',
                                description: rc.description || 'Attested course track on the sovereign campus ledger.',
                                learning_objectives: ['Sovereign Verification', 'Competency Attainment', 'Direct Industry Visibility'],
                                status: rc.enrollmentStatus || 'Active'
                              })}
                              className="btn-compact-details"
                            >
                              <span>View Details</span>
                              <ArrowRight size={12} />
                            </button>
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

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: STUDENT ENROLLMENT REQUESTS (Approval Management)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'REQUESTS' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Pending Student Enrollment Applications ({pendingRequests.length})
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Review student qualifications, statements of purpose, and grant or reject enrollment. Real-time notification is sent upon action.
              </p>
            </div>

            <button
              onClick={loadSkillsAndRequests}
              disabled={loading}
              className="btn-cyber-outline"
              style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Refresh Queue</span>
            </button>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '12px' }}>
              <ShieldCheck size={44} color="var(--cyber-emerald)" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                All Enrollment Requests Processed
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                There are no pending student applications awaiting institutional review.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {pendingRequests.map((reqItem) => (
                <div
                  key={reqItem.id}
                  className="glass-panel"
                  style={{
                    padding: '20px 24px',
                    borderRadius: '10px',
                    borderLeft: '4px solid var(--cyber-amber)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {reqItem.studentName || 'Student'}
                      </span>
                      <span className="cyber-badge badge-purple" style={{ fontSize: '10px' }}>
                        {reqItem.studentRollNo || reqItem.studentId}
                      </span>
                      <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>
                        {reqItem.studentDept || 'Dept'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Year {reqItem.studentYear || 3} • CGPA: <strong style={{ color: 'var(--cyber-emerald)' }}>{reqItem.studentCgpa || 'N/A'}</strong>
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--cyber-cyan)', fontWeight: 600, marginBottom: '6px' }}>
                      Requested Skill: <span>{reqItem.skillTitle}</span> ({reqItem.skillCode})
                    </div>

                    {reqItem.requestReason && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(10, 16, 30, 0.5)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontStyle: 'italic', marginBottom: '6px' }}>
                        "{reqItem.requestReason}"
                      </div>
                    )}

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Requested On: {new Date(reqItem.createdAt || reqItem.appliedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleApproveEnrollment(reqItem)}
                      disabled={processingId === reqItem.id}
                      className="btn-cyber-primary"
                      style={{ padding: '8px 18px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--cyber-emerald)', color: '#050a14', fontWeight: 700 }}
                    >
                      <Check size={14} />
                      <span>{processingId === reqItem.id ? 'Processing...' : 'Approve'}</span>
                    </button>

                    <button
                      onClick={() => setRejectModal({ isOpen: true, request: reqItem, reason: 'Criteria requirement not met' })}
                      disabled={processingId === reqItem.id}
                      className="btn-cyber-outline"
                      style={{ padding: '8px 14px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyber-rose)', borderColor: 'rgba(255, 77, 109, 0.4)' }}
                    >
                      <XCircle size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: CLOSED-LOOP CURRICULUM INTERVENTIONS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'INTERVENTIONS' && (
        <div>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="var(--cyber-emerald)" />
              <span>Industry Skill Deficit Interventions ({interventionCourses.length})</span>
            </h3>
          </div>

          <div className="compact-table-container">
            <div className="compact-table-scroll">
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>Intervention</th>
                    <th>Triggering Skill Gap</th>
                    <th>Target Cohort & Batch</th>
                    <th>Duration</th>
                    <th>Students</th>
                    <th>Expected Gain</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interventionCourses.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          No course telemetry available yet.
                        </div>
                        <div style={{ fontSize: '12px' }}>
                          Course telemetry and deficit tracking will appear here as students engage with academic modules.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    interventionCourses.map((c) => {
                      const isActive = c.status.includes('Active');

                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="compact-cell-title">
                            <div className="compact-cell-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                              <TrendingUp size={16} color="var(--cyber-emerald)" />
                            </div>
                            <div>
                              <div className="compact-title-text">{c.title}</div>
                              <span className="cyber-badge badge-purple" style={{ fontSize: '9px', marginTop: '2px' }}>
                                {c.code}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '11.5px', color: 'var(--cyber-rose)', fontWeight: 600 }}>
                            {c.triggerGap}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.targetCohorts.join(', ')}</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--cyber-cyan)' }}>{c.targetBatch}</div>
                        </td>
                        <td>{c.duration}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {c.enrolledStudents > 0 ? `${c.enrolledStudents} Enrolled` : `${c.targetStudentCount} Eligible`}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--cyber-emerald)', fontSize: '13px' }}>
                          {c.expectedReadinessGain}
                        </td>
                        <td>
                          <span className={`cyber-badge ${isActive ? 'badge-emerald' : 'badge-cyan'}`} style={{ fontSize: '9.5px' }}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <div className="compact-actions">
                            <button
                              type="button"
                              onClick={() => setSelectedDetailIntervention(c)}
                              className="btn-compact-details"
                            >
                              <span>View Details</span>
                              <ArrowRight size={12} />
                            </button>
                            {!isActive && (
                              <button
                                type="button"
                                onClick={() => handleEnrollCohort(c.id, c.title, c.targetStudentCount)}
                                className="btn-compact-secondary"
                                style={{ color: 'var(--cyber-cyan)', borderColor: 'rgba(34, 211, 238, 0.3)' }}
                                title="Enroll Cohort"
                              >
                                <Play size={11} />
                                <span>Enroll</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 10-STEP ADD SKILL WIZARD MODAL ── */}
      {showWizardModal && (
        <AddSkillWizardModal
          isOpen={showWizardModal}
          institution={institution}
          onClose={() => {
            setShowWizardModal(false);
            setEditingSkill(null);
          }}
          onSkillSaved={(savedSkill, isPublished) => {
            setShowWizardModal(false);
            setEditingSkill(null);
            loadSkillsAndRequests();
            if (onShowToast) {
              onShowToast({
                title: isPublished ? 'Skill Published Successfully' : 'Draft Saved',
                message: isPublished 
                  ? `"${savedSkill.title || savedSkill.name}" is now published and eligible students have been notified!`
                  : `"${savedSkill.title || savedSkill.name}" saved as draft.`,
                type: 'success'
              });
            }
          }}
          onSuccess={(savedSkill, isPublished) => {
            setShowWizardModal(false);
            setEditingSkill(null);
            loadSkillsAndRequests();
            if (onShowToast) {
              onShowToast({
                title: isPublished ? 'Skill Published Successfully' : 'Draft Saved',
                message: isPublished 
                  ? `"${savedSkill.title || savedSkill.name}" is now published and eligible students have been notified!`
                  : `"${savedSkill.title || savedSkill.name}" saved as draft.`,
                type: 'success'
              });
            }
          }}
          initialSkill={editingSkill}
        />
      )}

      {/* ── REJECTION REASON MODAL ── */}
      {rejectModal.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '24px', border: '1px solid var(--cyber-rose)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <AlertCircle size={22} color="var(--cyber-rose)" />
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Reject Enrollment Request
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              You are rejecting <strong>{rejectModal.request?.studentName}</strong> for <strong>{rejectModal.request?.skillTitle}</strong>. Provide a constructive reason for the student.
            </p>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                placeholder="e.g. Prerequisites not met, minimum CGPA requirement not achieved, or cohort seat capacity reached."
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(10,16,30,0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: false, request: null, reason: '' })}
                className="btn-cyber-outline"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="btn-cyber-primary"
                style={{ padding: '8px 18px', fontSize: '12.5px', background: 'var(--cyber-rose)', borderColor: 'var(--cyber-rose)', color: '#fff' }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE NEW COURSE MODAL ── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '640px', width: '100%', padding: '26px', border: '1px solid var(--cyber-cyan)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen size={20} color="var(--cyber-cyan)" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Publish Campus Credit Course
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCourseSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Course Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCourse.courseName}
                    onChange={(e) => setNewCourse({ ...newCourse, courseName: e.target.value })}
                    placeholder="e.g. Advanced Distributed Systems & Cloud Microservices"
                    style={{ width: '100%', padding: '9px 12px', background: 'rgba(10,16,30,0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={newCourse.courseCode}
                    onChange={(e) => setNewCourse({ ...newCourse, courseCode: e.target.value })}
                    placeholder="e.g. CSE-704"
                    style={{ width: '100%', padding: '9px 12px', background: 'rgba(10,16,30,0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Category
                  </label>
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'rgba(10,16,30,0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', boxSizing: 'border-box' }}
                  >
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="DATA & AI">DATA & AI</option>
                    <option value="CLOUD">CLOUD</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="SYSTEMS">SYSTEMS</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Duration
                  </label>
                  <input
                    type="text"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                    placeholder="e.g. 6 Weeks"
                    style={{ width: '100%', padding: '9px 12px', background: 'rgba(10,16,30,0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Difficulty
                  </label>
                  <select
                    value={newCourse.difficulty}
                    onChange={(e) => setNewCourse({ ...newCourse, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'rgba(10,16,30,0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', boxSizing: 'border-box' }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  Instructor / Faculty Lead
                </label>
                <input
                  type="text"
                  value={newCourse.instructor}
                  onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                  placeholder="e.g. Prof. K. Ramanathan, Dept of CSE"
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(10,16,30,0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  Skills Developed (comma-separated)
                </label>
                <input
                  type="text"
                  value={newCourse.skillsDeveloped}
                  onChange={(e) => setNewCourse({ ...newCourse, skillsDeveloped: e.target.value })}
                  placeholder="e.g. Distributed Systems, Kubernetes, gRPC, Go"
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(10,16,30,0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  Curriculum Modules (1 per line)
                </label>
                <textarea
                  rows={4}
                  value={newCourse.modules}
                  onChange={(e) => setNewCourse({ ...newCourse, modules: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(10,16,30,0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-cyber-outline"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{ padding: '8px 20px', fontSize: '12.5px' }}
                >
                  Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal for Selected Campus Course */}
      {selectedDetailSkill && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1250,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '26px', border: '1px solid var(--cyber-cyan)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-cyan" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                    {selectedDetailSkill.code || 'COURSE'}
                  </span>
                  <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                    {selectedDetailSkill.dept || selectedDetailSkill.department || 'All Departments'}
                  </span>
                  <span className={`badge ${selectedDetailSkill.status === 'Active' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '11px' }}>
                    {selectedDetailSkill.status || 'Active'}
                  </span>
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedDetailSkill.title || selectedDetailSkill.courseName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailSkill(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
              <div style={{ padding: '10px 12px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Enrolled</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedDetailSkill.enrolledCount ?? selectedDetailSkill.studentsEnrolled ?? 0}</span>
              </div>
              <div style={{ padding: '10px 12px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Completion</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cyber-emerald)' }}>{selectedDetailSkill.completionRate || 0}%</span>
              </div>
              <div style={{ padding: '10px 12px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Rating</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cyber-amber)' }}>★ {selectedDetailSkill.rating || '4.8'}</span>
              </div>
              <div style={{ padding: '10px 12px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Level</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cyber-cyan)' }}>{selectedDetailSkill.level || selectedDetailSkill.difficulty || 'Intermediate'}</span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Faculty Lead / Instructor</span>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 500 }}>
                {typeof selectedDetailSkill.instructor === 'object' ? selectedDetailSkill.instructor?.name : (selectedDetailSkill.instructor || selectedDetailSkill.instructor_name || 'Designated Academic Faculty')}
              </p>
            </div>

            {selectedDetailSkill.skillsDeveloped && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Target Skills Developed</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(Array.isArray(selectedDetailSkill.skillsDeveloped)
                    ? selectedDetailSkill.skillsDeveloped
                    : String(selectedDetailSkill.skillsDeveloped).split(',')
                  ).map((sk, idx) => (
                    <span key={idx} className="badge badge-cyan" style={{ fontSize: '11px' }}>
                      {typeof sk === 'string' ? sk.trim() : sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedDetailSkill.modules && (
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Curriculum Modules & Syllabus</span>
                <div style={{ background: 'rgba(10,16,30,0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(Array.isArray(selectedDetailSkill.modules)
                    ? selectedDetailSkill.modules
                    : String(selectedDetailSkill.modules).split('\n')
                  ).filter(Boolean).map((mod, idx) => (
                    <div key={idx} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--cyber-cyan)', fontWeight: 700, fontSize: '11px' }}>0{idx + 1}.</span>
                      <span>{typeof mod === 'string' ? mod : (mod.title || `Module ${mod.moduleNumber || idx + 1}`)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedDetailSkill(null)}
                className="btn-cyber-primary"
                style={{ padding: '8px 20px', fontSize: '12.5px' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal for Selected Deficit Intervention */}
      {selectedDetailIntervention && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1250,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '26px', border: '1px solid var(--cyber-amber)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className={`badge ${selectedDetailIntervention.urgency === 'Critical' ? 'badge-rose' : 'badge-amber'}`} style={{ fontSize: '11px', fontWeight: 700 }}>
                    {selectedDetailIntervention.urgency} Urgency
                  </span>
                  <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                    {selectedDetailIntervention.status || 'Active Intervention'}
                  </span>
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedDetailIntervention.deficitSkill}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailIntervention(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '18px' }}>
              <div style={{ padding: '10px 12px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Demand Surge</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cyber-emerald)' }}>{selectedDetailIntervention.industryDemandGrowth}</span>
              </div>
              <div style={{ padding: '10px 12px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Est. Placement Impact</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cyber-cyan)' }}>{selectedDetailIntervention.estimatedImpact}</span>
              </div>
              <div style={{ padding: '10px 12px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Target Semester</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedDetailIntervention.targetSemester}</span>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Proposed Curriculum Solution</span>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 600 }}>
                {selectedDetailIntervention.proposedCourse}
              </p>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Recommended Academic Action</span>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'rgba(10,16,30,0.5)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                {selectedDetailIntervention.recommendedAction}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Assigned Faculty</span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{selectedDetailIntervention.facultyAssigned}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Affected Programs</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(Array.isArray(selectedDetailIntervention.affectedPrograms)
                    ? selectedDetailIntervention.affectedPrograms
                    : [selectedDetailIntervention.affectedPrograms]
                  ).map((prog, idx) => (
                    <span key={idx} className="badge badge-purple" style={{ fontSize: '10.5px' }}>{prog}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedDetailIntervention(null)}
                className="btn-cyber-outline"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewCourse(prev => ({
                    ...prev,
                    courseName: selectedDetailIntervention.proposedCourse,
                    skillsDeveloped: selectedDetailIntervention.deficitSkill,
                    instructor: selectedDetailIntervention.facultyAssigned
                  }));
                  setSelectedDetailIntervention(null);
                  setShowCreateModal(true);
                }}
                className="btn-cyber-primary"
                style={{ padding: '8px 18px', fontSize: '12.5px' }}
              >
                Approve & Launch Curriculum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
