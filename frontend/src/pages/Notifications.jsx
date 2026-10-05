import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  BookOpen,
  Award,
  Trash2,
  Check,
  Building2,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
  Layers,
  Archive,
  RotateCcw,
  UserCheck,
  GraduationCap,
  Users
} from 'lucide-react';
import {
  getActiveNotifications,
  getTrashNotifications,
  markAsRead,
  markAllAsRead,
  softDeleteNotification,
  getActiveNotificationsByRole,
  getTrashNotificationsByRole,
  normalizeRole
} from '../services/notificationStore';
import { nexusApiClient } from '../services/nexusApiClient';
import SkillDetailsModal from '../components/student/SkillDetailsModal';

export default function Notifications({ setActivePage, onShowToast, user }) {
  const currentRole = normalizeRole(user?.role);
  const [notifications, setNotifications] = useState(() => getActiveNotificationsByRole(currentRole, user));
  const [trashCount, setTrashCount] = useState(() => getTrashNotificationsByRole(currentRole, user).length);
  const [filter, setFilter] = useState('all');
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [modalSkillId, setModalSkillId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const handleUpdate = () => {
      setNotifications(getActiveNotificationsByRole(currentRole, user));
      setTrashCount(getTrashNotificationsByRole(currentRole, user).length);
    };

    const fetchDbNotifications = async () => {
      try {
        const res = await nexusApiClient.getNotifications(currentRole);
        if (res && res.success && Array.isArray(res.data) && isMounted) {
          const dbNotifs = res.data.map(item => ({
            id: item.id,
            role: currentRole,
            type: item.type || item.notification_type,
            title: item.title,
            preview: item.preview || item.message,
            time: item.time || 'Recently',
            timestamp: item.timestamp || item.created_at,
            unread: item.unread !== undefined ? item.unread : !item.is_read,
            deleted: Boolean(item.deleted || item.is_deleted),
            color: (item.type === 'NEW_SKILL' || item.type === 'new_skill') ? '#00d4ff' : '#2FE0A1',
            categoryLabel: item.type === 'NEW_SKILL' ? 'NEW SKILL' : (item.type || 'SYSTEM').toUpperCase(),
            details: typeof item.details === 'string' ? JSON.parse(item.details) : (item.details || {})
          }));

          setNotifications(prev => {
            const map = new Map();
            dbNotifs.forEach(n => map.set(n.id, n));
            prev.forEach(n => {
              if (!map.has(n.id)) map.set(n.id, n);
            });
            return Array.from(map.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          });
        }
      } catch (err) {
        // keep local notifications
      }
    };

    fetchDbNotifications();
    window.addEventListener('nexus_notifications_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('nexus_notifications_updated', handleUpdate);
    };
  }, [currentRole, user]);

  const selectedNotification = notifications.find(n => n.id === selectedNotificationId) || null;

  const handleOpenDetail = (notif) => {
    markAsRead(notif.id);
    setSelectedNotificationId(notif.id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead(currentRole);
    if (onShowToast) {
      onShowToast({
        title: 'Caught up',
        message: 'All notifications marked as read.',
        type: 'success'
      });
    }
  };

  const handleDelete = (e, notifId) => {
    if (e) e.stopPropagation();
    softDeleteNotification(notifId);
    if (selectedNotificationId === notifId) {
      setSelectedNotificationId(null);
    }
    if (onShowToast) {
      onShowToast({
        title: 'Moved to Trashbin',
        message: 'Notification moved to Trashbin. Recoverable anytime in Settings.',
        type: 'info'
      });
    }
  };

  const getCategoryIcon = (type) => {
    switch (type) {
      case 'candidate_selected':
      case 'candidate_selection_recorded':
      case 'student_placement_success':
      case 'mentee_placed': return UserCheck;
      case 'college_collaboration_request':
      case 'industry_collaboration_alert':
      case 'campus_drive_announced':
      case 'college_access_requested': return Building2;
      case 'high_match':
      case 'high_match_candidate':
      case 'internship_app': return Briefcase;
      case 'project_validated':
      case 'project_evidence':
      case 'student_skill_updated': return ShieldCheck;
      case 'company_internship':
      case 'institution_announcement':
      case 'inst_announcement': return Building2;
      case 'course_reminder':
      case 'enrollment_confirmed':
      case 'ENROLLMENT_APPROVED': return CheckCircle2;
      case 'ENROLLMENT_REJECTED': return AlertTriangle;
      case 'skill_gap':
      case 'ASSESSMENT_ASSIGNED':
      case 'ASSESSMENT_ASSIGNED_INSTITUTION':
      case 'ASSESSMENT_ASSIGNED_ACADEMICIAN':
      case 'assessment_assigned':
      case 'assessment_published':
      case 'assessment_ready':
      case 'assessment_completed':
      case 'certificate_earned':
      case 'CERTIFICATION_EARNED':
      case 'institution_recommendation': return Award;
      case 'badge_earned':
      case 'NEW_SKILL':
      case 'new_skill': return Sparkles;
      case 'course_completion':
      case 'app_status': return CheckCircle2;
      default: return Bell;
    }
  };

  const getFilterTabs = () => {
    if (currentRole === 'academician') {
      return [
        { id: 'all', label: `All (${notifications.length})` },
        { id: 'unread', label: `Unread (${unreadCount})` },
        { id: 'mentees', label: 'Mentee Placements & Offers' },
        { id: 'collaborations', label: 'Industry Collaborations' },
        { id: 'verifications', label: 'Student Proofs & Gaps' }
      ];
    }
    if (currentRole === 'institution') {
      return [
        { id: 'all', label: `All (${notifications.length})` },
        { id: 'unread', label: `Unread (${unreadCount})` },
        { id: 'collaborations', label: 'Industry Partnerships & Access' },
        { id: 'placements', label: 'Student Placements' },
        { id: 'students', label: 'Students & Readiness' },
        { id: 'proofs', label: 'Project Proofs' }
      ];
    }
    if (currentRole === 'company') {
      return [
        { id: 'all', label: `All (${notifications.length})` },
        { id: 'unread', label: `Unread (${unreadCount})` },
        { id: 'selected', label: 'Selected Candidates & Offers' },
        { id: 'collaborations', label: 'College Collaborations' },
        { id: 'candidates', label: 'Candidate Matches' },
        { id: 'applications', label: 'Applications' }
      ];
    }
    return [
      { id: 'all', label: `All (${notifications.length})` },
      { id: 'unread', label: `Unread (${unreadCount})` },
      { id: 'selections', label: 'Offers & Selections' },
      { id: 'opportunities', label: 'Opportunities & Drives' },
      { id: 'proofs_gaps', label: 'Proofs & Gaps' },
      { id: 'courses_exams', label: 'Courses & Exams' }
    ];
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return n.unread;
    if (currentRole === 'academician') {
      if (filter === 'mentees') return ['mentee_placed', 'candidate_selected', 'student_placement_success'].includes(n.type);
      if (filter === 'collaborations') return ['industry_collaboration_alert', 'college_collaboration_request', 'industry_demand'].includes(n.type);
      if (filter === 'verifications') return ['proof_submitted', 'project_validated', 'skill_gap', 'proof_required'].includes(n.type);
    } else if (currentRole === 'institution') {
      if (filter === 'collaborations') return ['college_collaboration_request', 'industry_partnership_request', 'access_requested'].includes(n.type);
      if (filter === 'placements') return ['student_placement_success', 'candidate_selected', 'placement_candidate'].includes(n.type);
      if (filter === 'students') return ['new_student', 'high_readiness', 'student_skill_updated', 'assessment_completed'].includes(n.type);
      if (filter === 'proofs') return ['proof_submitted', 'proof_required'].includes(n.type);
      if (filter === 'academic') return ['course_enrollment', 'placement_candidate', 'course_completion', 'inst_announcement'].includes(n.type);
    } else if (currentRole === 'company') {
      if (filter === 'selected') return ['candidate_selected', 'candidate_selection_recorded', 'offer_letter_released', 'placement_confirmed'].includes(n.type);
      if (filter === 'collaborations') return ['college_collaboration_request', 'college_access_requested', 'college_access_granted'].includes(n.type);
      if (filter === 'candidates') return ['new_candidate', 'high_match_candidate', 'institution_recommendation'].includes(n.type);
      if (filter === 'applications') return ['application_received', 'internship_app', 'app_status'].includes(n.type);
      if (filter === 'interviews') return ['interview_reminder', 'project_evidence', 'skill_updated'].includes(n.type);
    } else {
      if (filter === 'selections') return ['candidate_selected', 'offer_extended', 'campus_drive_announced'].includes(n.type);
      if (filter === 'opportunities') return ['high_match', 'company_internship', 'institution_announcement', 'campus_drive_announced'].includes(n.type);
      if (filter === 'proofs_gaps') return ['project_validated', 'skill_gap', 'badge_earned'].includes(n.type);
      if (filter === 'courses_exams') return ['course_reminder', 'assessment_ready', 'certificate_earned', 'enrollment_confirmed', 'learning_update', 'NEW_SKILL', 'new_skill', 'ENROLLMENT_APPROVED', 'ENROLLMENT_REJECTED', 'CERTIFICATION_EARNED'].includes(n.type);
    }
    return true;
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Telemetry Header */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            {selectedNotification ? (
              <button
                onClick={() => setSelectedNotificationId(null)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)', padding: '5px 12px', borderRadius: '6px',
                  fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cyber-cyan)'; e.currentTarget.style.borderColor = 'var(--cyber-cyan)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
              >
                <ArrowLeft size={13} />
                <span>Back to Notifications</span>
              </button>
            ) : null}
            <div className="telemetry-node-tag" style={{ margin: 0 }}>
              <span>SYSTEM ALERTS</span>
              <span>//</span>
              <span>COMMUNICATIONS STREAM</span>
              <span>//</span>
              <span>{selectedNotification ? `DETAIL VIEW ID: ${selectedNotification.id.toUpperCase()}` : 'ACTIVE FEED'}</span>
            </div>
          </div>
          <h1>{selectedNotification ? selectedNotification.title : 'Notifications'}</h1>
          <p>
            {selectedNotification
              ? 'Comprehensive context, cryptographic evidence, and actionable next steps.'
              : 'Interactive feeds for opportunity matches, verified proofs, course reminders, and skill diagnostics.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!selectedNotification && (
            <>
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className={unreadCount > 0 ? "btn-cyber-primary" : "btn-cyber-outline"}
                style={{ opacity: unreadCount === 0 ? 0.5 : 1, cursor: unreadCount === 0 ? 'default' : 'pointer', fontSize: '12px', padding: '8px 14px' }}
              >
                <Check size={14} />
                <span>Mark All Read</span>
              </button>

              <button
                onClick={() => setActivePage('settings', 'trash')}
                className="btn-cyber-outline"
                style={{ fontSize: '12px', padding: '8px 14px' }}
                title="View deleted notifications in Settings"
              >
                <Archive size={14} color="var(--text-muted)" />
                <span>Trashbin ({trashCount})</span>
              </button>
            </>
          )}

          {selectedNotification && (
            <button
              onClick={(e) => handleDelete(e, selectedNotification.id)}
              className="btn-cyber-outline"
              style={{ fontSize: '12px', padding: '8px 14px', color: 'var(--cyber-rose)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
            >
              <Trash2 size={14} />
              <span>Move to Trashbin</span>
            </button>
          )}
        </div>
      </div>

      {selectedNotification ? (
        /* =====================================================================
           FULL NOTIFICATION DETAIL VIEW
           ===================================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Detail Card */}
          <div className="glass-panel" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: `linear-gradient(90deg, ${selectedNotification.color}, transparent)`
            }} />

            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '12px',
                  background: `${selectedNotification.color}15`, border: `1px solid ${selectedNotification.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {React.createElement(getCategoryIcon(selectedNotification.type), { size: 22, color: selectedNotification.color })}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="cyber-badge" style={{
                      background: `${selectedNotification.color}20`,
                      color: selectedNotification.color,
                      border: `1px solid ${selectedNotification.color}40`,
                      fontSize: '9.5px', padding: '3px 8px'
                    }}>
                      {selectedNotification.categoryLabel}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {selectedNotification.time}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {selectedNotification.title}
                  </h2>
                </div>
              </div>

              {selectedNotification.details?.matchPercentage && (
                <div style={{
                  padding: '8px 16px', borderRadius: '10px',
                  background: 'rgba(0, 212, 255, 0.08)', border: '1px solid var(--cyber-cyan)',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {selectedNotification.details.matchPercentage}%
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Profile Match
                  </div>
                </div>
              )}
            </div>

            {/* Preview Banner */}
            <div style={{
              padding: '14px 18px', borderRadius: '8px',
              background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
              fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px'
            }}>
              {selectedNotification.preview}
            </div>

            {/* TYPE-SPECIFIC DETAIL SECTION */}

            {/* CROSS-ROLE MULTI-ENTITY MATCH SECTION: CANDIDATE SELECTION & OFFER RELEASE */}
            {['candidate_selected', 'candidate_selection_recorded', 'student_placement_success', 'mentee_placed'].includes(selectedNotification.type) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '18px 20px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.06) 0%, rgba(16, 185, 129, 0.06) 100%)',
                  border: '1px solid rgba(0, 212, 255, 0.25)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Sparkles size={16} color="var(--cyber-cyan)" />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>
                      SKILLNEXUS MULTI-ROLE RECRUITMENT MATCH
                    </span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      SOVEREIGN ATTESTED
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6, 11, 20, 0.65)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--cyber-cyan)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        👤 SELECTED CANDIDATE (STUDENT)
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        {selectedNotification.details?.candidateName || 'Alex Johnson'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {selectedNotification.details?.studentId || 'STU-PSG-2026-042'}
                      </div>
                    </div>

                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6, 11, 20, 0.65)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        🏛️ CAMPUS & PLACEMENT OFFICE
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        {selectedNotification.details?.institutionName || 'PSG College of Technology'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Dept: {selectedNotification.details?.department || 'Computer Science & Engineering'}
                      </div>
                    </div>

                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6, 11, 20, 0.65)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        👨‍🏫 ACADEMICIAN / FACULTY MENTOR
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        {selectedNotification.details?.academicianName || 'Dr. K. Ramanathan'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Professor & Department Mentor
                      </div>
                    </div>

                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6, 11, 20, 0.65)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: '#8B5CF6', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        🏢 CORPORATE HIRING PARTNER
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        {selectedNotification.details?.companyName || 'Google Cloud India'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--cyber-emerald)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {selectedNotification.details?.ctcOrStipend || '₹14.50 LPA'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>TARGET ROLE</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                      {selectedNotification.details?.roleTitle || 'Cloud Infrastructure Solutions Engineer'}
                    </div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>OFFER LETTER STATUS</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-cyan)', marginTop: '2px' }}>
                      {selectedNotification.details?.offerStatus || 'OFFER LETTER RELEASED'}
                    </div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ONBOARDING SCHEDULE</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cyber-amber)', marginTop: '2px' }}>
                      {selectedNotification.details?.onboardingDate || 'July 15, 2026'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {currentRole === 'company' && (
                    <button
                      onClick={() => setActivePage('industry-portal', 'selected')}
                      className="btn-cyber-primary"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                      <UserCheck size={15} />
                      <span>Open Selected Candidates Roster</span>
                    </button>
                  )}
                  {currentRole === 'student' && (
                    <button
                      onClick={() => setActivePage('passport')}
                      className="btn-cyber-primary"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                      <ShieldCheck size={15} />
                      <span>View Verified Digital Passport</span>
                    </button>
                  )}
                  {currentRole === 'institution' && (
                    <button
                      onClick={() => setActivePage('institution-placement')}
                      className="btn-cyber-primary"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                      <GraduationCap size={15} />
                      <span>View Campus Placements Pipeline</span>
                    </button>
                  )}
                  {currentRole === 'academician' && (
                    <button
                      onClick={() => setActivePage('academician-students')}
                      className="btn-cyber-primary"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                      <Users size={15} />
                      <span>Inspect Mentee Progress Record</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CROSS-ROLE MULTI-ENTITY MATCH SECTION: COLLEGE COLLABORATION & TALENT ACCESS */}
            {['college_collaboration_request', 'industry_collaboration_alert', 'campus_drive_announced', 'college_access_requested'].includes(selectedNotification.type) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '18px 20px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(0, 212, 255, 0.08) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Building2 size={16} color="var(--cyber-purple)" />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>
                      INSTITUTIONAL COLLABORATION & TALENT ACCESS
                    </span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.2)', color: 'var(--cyber-purple)', fontWeight: 700, border: '1px solid rgba(139, 92, 246, 0.4)' }}>
                      SOVEREIGN MoU ACTIVE
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6, 11, 20, 0.65)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--cyber-purple)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        🏛️ TARGET COLLEGE CAMPUS
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        {selectedNotification.details?.institutionName || 'PSG College of Technology'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Code: {selectedNotification.details?.collegeCode || 'PSG-TECH-TN'}
                      </div>
                    </div>

                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6, 11, 20, 0.65)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--cyber-cyan)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        🏢 INDUSTRY PARTNER
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        {selectedNotification.details?.companyName || 'Google Cloud India'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Lead: {selectedNotification.details?.recruiterName || 'Talent Acquisition Team'}
                      </div>
                    </div>

                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6, 11, 20, 0.65)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        📚 ELIGIBLE DEPARTMENTS & BATCH
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                        {Array.isArray(selectedNotification.details?.departments)
                          ? selectedNotification.details.departments.join(', ')
                          : (selectedNotification.details?.departments || 'Computer Science, IT, ECE')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--cyber-emerald)', fontWeight: 600 }}>
                        {selectedNotification.details?.batchYear || '2026 Batch'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {currentRole === 'company' && (
                    <button
                      onClick={() => setActivePage('industry-portal', 'colleges')}
                      className="btn-cyber-primary"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                      <Building2 size={15} />
                      <span>Manage College Collaboration Hub</span>
                    </button>
                  )}
                  {currentRole === 'institution' && (
                    <button
                      onClick={() => setActivePage('institution-company-directory')}
                      className="btn-cyber-primary"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                      <Building2 size={15} />
                      <span>View Industry Requests & MoUs</span>
                    </button>
                  )}
                  {currentRole === 'academician' && (
                    <button
                      onClick={() => setActivePage('academician-industry-requirements')}
                      className="btn-cyber-primary"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                      <Briefcase size={15} />
                      <span>View Department Industry Demands</span>
                    </button>
                  )}
                  {currentRole === 'student' && (
                    <button
                      onClick={() => setActivePage('opportunities')}
                      className="btn-cyber-primary"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                      <Briefcase size={15} />
                      <span>View Campus Drive Opportunities</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CROSS-ROLE MULTI-ENTITY: INDUSTRY ASSESSMENT POSTED & ASSIGNED */}
            {['ASSESSMENT_ASSIGNED', 'ASSESSMENT_ASSIGNED_INSTITUTION', 'ASSESSMENT_ASSIGNED_ACADEMICIAN', 'assessment_assigned', 'assessment_published'].includes(selectedNotification.type) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '18px 20px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                  border: '1px solid rgba(0, 212, 255, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Award size={18} color="var(--cyber-cyan)" />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>
                      INDUSTRY CODING & PROJECT ASSESSMENT TEST
                    </span>
                    <span style={{
                      fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                      background: 'rgba(0, 212, 255, 0.2)', color: 'var(--cyber-cyan)',
                      fontWeight: 700, border: '1px solid rgba(0, 212, 255, 0.4)'
                    }}>
                      {selectedNotification.details?.programmingLanguage || 'PROGRAMMING CHALLENGE'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6, 11, 20, 0.65)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--cyber-cyan)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        🏢 ASSIGNING COMPANY
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        {selectedNotification.details?.companyName || 'Enterprise Partner'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Target: {selectedNotification.details?.assessmentTitle || selectedNotification.title}
                      </div>
                    </div>

                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6, 11, 20, 0.65)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: '#A855F7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        ⚡ PROGRAMMING LANGUAGE
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#C084FC', fontFamily: 'var(--font-mono)' }}>
                        {selectedNotification.details?.programmingLanguage || 'JavaScript'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Duration: {selectedNotification.details?.durationMinutes || 45} Minutes
                      </div>
                    </div>

                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6, 11, 20, 0.65)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        📁 RELATED PROJECT / CAPSTONE
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff' }}>
                        {selectedNotification.details?.projectTitle || 'Applied Industry Project'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Deadline: {selectedNotification.details?.deadline ? new Date(selectedNotification.details.deadline).toLocaleDateString() : 'Active Evaluation Cycle'}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedNotification.details?.projectDescription && (
                  <div style={{ padding: '14px 18px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      PROJECT SPECIFICATIONS & DELIVERABLES
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#E2E8F0', lineHeight: 1.5, margin: 0 }}>
                      {selectedNotification.details.projectDescription}
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {currentRole === 'student' && (
                    <button
                      onClick={() => {
                        if (setActivePage) setActivePage('assessment');
                        if (onShowToast) {
                          onShowToast({
                            title: 'Launching Assessment',
                            message: `Opening "${selectedNotification.details?.assessmentTitle || 'Industry Assessment'}" in the Assessment Runner...`,
                            type: 'info'
                          });
                        }
                      }}
                      className="btn-cyber-primary"
                      style={{
                        padding: '12px 22px', fontSize: '13.5px', fontWeight: 700,
                        background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)',
                        boxShadow: '0 0 16px rgba(0, 212, 255, 0.4)',
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                    >
                      <Award size={16} />
                      <span>Attend Assessment Test Now →</span>
                    </button>
                  )}

                  {currentRole === 'institution' && (
                    <button
                      onClick={() => {
                        if (setActivePage) setActivePage('institution-readiness');
                      }}
                      className="btn-cyber-primary"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                      <Building2 size={15} />
                      <span>View Student Competency Telemetry</span>
                    </button>
                  )}

                  {currentRole === 'company' && (
                    <button
                      onClick={() => {
                        if (setActivePage) setActivePage('industry-portal', 'learning-assessments');
                      }}
                      className="btn-cyber-primary"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                      <Award size={15} />
                      <span>Open Learning Assessments Engine</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 1. HIGH MATCH INTERNSHIP */}
            {selectedNotification.type === 'high_match' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ROLE & COMPANY</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '3px' }}>
                      {selectedNotification.details.role}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{selectedNotification.details.company}</div>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>LOCATION & MODALITY</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '3px' }}>
                      {selectedNotification.details.location}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>STIPEND / COMPENSATION</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--cyber-emerald)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                      {selectedNotification.details.compensation}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>APPLICATION DEADLINE</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--cyber-amber)', marginTop: '3px' }}>
                      {selectedNotification.details.deadline}
                    </div>
                  </div>
                </div>

                {/* Why You Received This */}
                <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(0, 212, 255, 0.04)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-cyan)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Sparkles size={14} /> Why You Received This Opportunity
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedNotification.details.whyReceived}
                  </div>
                </div>

                {/* Skills match & gap breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(47, 224, 161, 0.04)', border: '1px solid rgba(47, 224, 161, 0.2)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-emerald)', marginBottom: '8px' }}>
                      ✓ Matched Competencies
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {selectedNotification.details.matchedSkills?.map(sk => (
                        <span key={sk} className="cyber-badge badge-emerald" style={{ fontSize: '10px' }}>
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-amber)', marginBottom: '8px' }}>
                      ⚠ Recommended Skill to Bridge
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {selectedNotification.details.criticalGaps?.map(sk => (
                        <span key={sk} className="cyber-badge badge-amber" style={{ fontSize: '10px' }}>
                          + {sk} (Micro-course suggested)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct Action CTAs */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    onClick={() => setActivePage('opportunities')}
                    className="btn-cyber-primary"
                    style={{ padding: '10px 20px', fontSize: '13px' }}
                  >
                    <span>View in Opportunities Radar</span>
                    <ChevronRight size={14} />
                  </button>

                  <button
                    onClick={() => {
                      if (onShowToast) {
                        onShowToast({
                          title: 'Express Application Sent',
                          message: 'Applied to ABC Technologies with Digital Passport attached.',
                          type: 'success'
                        });
                      }
                    }}
                    className="btn-cyber-outline"
                    style={{ padding: '10px 18px', fontSize: '13px' }}
                  >
                    <ShieldCheck size={14} color="var(--cyber-emerald)" />
                    <span>1-Click Express Apply</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. PROJECT VALIDATED */}
            {selectedNotification.type === 'project_validated' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PROJECT ATTESTATION</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '3px' }}>
                      {selectedNotification.details.project}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ZK-SNARK HASH</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cyber-cyan)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                      {selectedNotification.details.proctorHash}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>VALIDATION DATE</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--cyber-emerald)', marginTop: '3px' }}>
                      {selectedNotification.details.validationDate}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(47, 224, 161, 0.05)', border: '1px solid rgba(47, 224, 161, 0.2)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-emerald)', marginBottom: '8px' }}>
                    Validated Competencies Added to Passport
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {selectedNotification.details.validatedSkills?.map(sk => (
                      <span key={sk} className="cyber-badge badge-emerald" style={{ fontSize: '11px', padding: '4px 10px' }}>
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong>Evidence Note:</strong> {selectedNotification.details.evidence}
                  </div>
                </div>

                <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Impact on Profile:</strong> {selectedNotification.details.impact}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button onClick={() => setActivePage('projects')} className="btn-cyber-primary" style={{ padding: '10px 18px', fontSize: '13px' }}>
                    <span>View in Projects</span>
                    <ChevronRight size={14} />
                  </button>
                  <button onClick={() => setActivePage('passport')} className="btn-cyber-outline" style={{ padding: '10px 18px', fontSize: '13px' }}>
                    <ShieldCheck size={14} color="var(--cyber-emerald)" />
                    <span>View Digital Passport</span>
                  </button>
                  <button onClick={() => setActivePage('skills')} className="btn-cyber-outline" style={{ padding: '10px 18px', fontSize: '13px' }}>
                    <span>Inspect Skills Ledger</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. COMPANY / INTERNSHIP DETAILS */}
            {selectedNotification.type === 'company_internship' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    About {selectedNotification.details.company}
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedNotification.details.overview}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TARGET POSITION</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '3px' }}>
                      {selectedNotification.details.role}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ELIGIBILITY</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      {selectedNotification.details.eligibility}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>REQUIRED SKILLS</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {selectedNotification.details.requiredSkills?.map(sk => (
                        <span key={sk} className="cyber-badge badge-purple" style={{ fontSize: '9px' }}>{sk}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'rgba(52, 120, 255, 0.05)', border: '1px solid rgba(52, 120, 255, 0.25)', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: '#3478FF' }}>Why It Matches:</strong> {selectedNotification.details.whyItMatches}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button onClick={() => setActivePage('opportunities')} className="btn-cyber-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
                    <span>Explore Opportunity & Apply</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* 4. COURSE REMINDER */}
            {selectedNotification.type === 'course_reminder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedNotification.details.course}
                    </span>
                    <strong style={{ color: 'var(--cyber-purple)', fontFamily: 'var(--font-mono)' }}>
                      {selectedNotification.details.currentProgress}% Completed
                    </strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
                    <div style={{ width: `${selectedNotification.details.currentProgress}%`, height: '100%', background: 'var(--grad-purple-indigo)', borderRadius: '4px' }} />
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedNotification.details.reminderText}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NEXT ACTIVE MODULE</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {selectedNotification.details.nextModule}
                    </div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>RECOMMENDED COMPLETION</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cyber-purple)', marginTop: '4px' }}>
                      {selectedNotification.details.recommendedCompletion}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button onClick={() => setActivePage('learning')} className="btn-cyber-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
                    <span>Continue Learning Sprint</span>
                    <ChevronRight size={14} />
                  </button>
                  <button onClick={() => setActivePage('learning')} className="btn-cyber-outline" style={{ padding: '10px 18px', fontSize: '13px' }}>
                    <span>View Course Modules</span>
                  </button>
                </div>
              </div>
            )}

            {/* 5. SKILL GAP IDENTIFIED */}
            {selectedNotification.type === 'skill_gap' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ padding: '18px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Identified Gap: {selectedNotification.details.skill}
                    </span>
                    <span className="cyber-badge badge-rose" style={{ fontSize: '10px' }}>
                      {selectedNotification.details.gapPercentage}% Deficit
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '12px 0' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current: <strong style={{ color: '#fff' }}>{selectedNotification.details.currentLevel}%</strong></div>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${selectedNotification.details.currentLevel}%`, height: '100%', background: 'var(--cyber-rose)', borderRadius: '3px' }} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target: <strong style={{ color: 'var(--cyber-emerald)' }}>{selectedNotification.details.targetLevel}%</strong></div>
                  </div>

                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedNotification.details.whyItMatters}
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Nexus AI Recommended Action Plan:
                  </div>
                  <ol style={{ paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {selectedNotification.details.recommendedActions?.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ol>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button onClick={() => setActivePage('learning')} className="btn-cyber-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
                    <span>Start Recommended Course</span>
                    <ChevronRight size={14} />
                  </button>
                  <button onClick={() => setActivePage('skills')} className="btn-cyber-outline" style={{ padding: '10px 18px', fontSize: '13px' }}>
                    <span>Inspect Skill in Ledger</span>
                  </button>
                </div>
              </div>
            )}

            {/* 6. ASSESSMENT RESULTS READY */}
            {selectedNotification.type === 'assessment_ready' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.25)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SCORE EARNED</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {selectedNotification.details.score}%
                    </div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(47, 224, 161, 0.05)', border: '1px solid rgba(47, 224, 161, 0.25)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ACCURACY RATE</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-emerald)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {selectedNotification.details.accuracy}%
                    </div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.25)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NATIONAL BENCHMARK</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyber-purple)', marginTop: '6px' }}>
                      {selectedNotification.details.percentile}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(47, 224, 161, 0.04)', border: '1px solid rgba(47, 224, 161, 0.2)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-emerald)', marginBottom: '8px' }}>
                      ✓ Strong Competencies Proven
                    </div>
                    <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {selectedNotification.details.strongAreas?.map(s => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.04)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-rose)', marginBottom: '8px' }}>
                      ⚠ Focus Topics for Next Sprint
                    </div>
                    <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {selectedNotification.details.weakAreas?.map(w => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Recommended Next Step:</strong> {selectedNotification.details.recommendedNextStep}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button onClick={() => setActivePage('skills')} className="btn-cyber-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
                    <span>Inspect Updated Skills Ledger</span>
                    <ChevronRight size={14} />
                  </button>
                  <button onClick={() => setActivePage('assessment')} className="btn-cyber-outline" style={{ padding: '10px 18px', fontSize: '13px' }}>
                    <Award size={14} color="#3478FF" />
                    <span>Take Follow-up Assessment</span>
                  </button>
                </div>
              </div>
            )}

            {/* 7. NEW SKILL OFFERED BY INSTITUTION */}
            {(selectedNotification.type === 'NEW_SKILL' || selectedNotification.type === 'new_skill') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ padding: '18px', borderRadius: '8px', background: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {selectedNotification.details?.skillName || selectedNotification.title}
                      </span>
                      <div style={{ fontSize: '12px', color: 'var(--cyber-cyan)', fontWeight: 600, marginTop: '2px' }}>
                        Curriculum Skill Offered by Your Campus
                      </div>
                    </div>
                    <span className="cyber-badge badge-emerald" style={{ fontSize: '10px' }}>
                      {selectedNotification.details?.level || 'Intermediate'}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '10px 0 0', lineHeight: 1.5 }}>
                    {selectedNotification.preview || selectedNotification.message}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DURATION & WORKLOAD</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-cyan)', marginTop: '2px' }}>
                      {selectedNotification.details?.duration || '6 Weeks'} {selectedNotification.details?.hours ? `(${selectedNotification.details.hours}h)` : ''}
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CREDENTIAL OUTCOME</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-emerald)', marginTop: '2px' }}>
                      {selectedNotification.details?.certification === 'No' ? 'Institutional Badge' : 'Official Certificate'}
                    </div>
                  </div>
                  {selectedNotification.details?.deadline && (
                    <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ENROLLMENT DEADLINE</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-amber)', marginTop: '2px' }}>
                        {new Date(selectedNotification.details.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                  <button
                    onClick={() => setModalSkillId(selectedNotification.details?.skillId || selectedNotification.skillId || selectedNotification.id)}
                    className="btn-cyber-primary"
                    style={{ padding: '11px 22px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Sparkles size={15} />
                    <span>Check Eligibility & Enroll Now</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* 8. ENROLLMENT STATUS UPDATES */}
            {selectedNotification.type === 'ENROLLMENT_APPROVED' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '18px', borderRadius: '8px', background: 'rgba(47, 224, 161, 0.06)', border: '1px solid rgba(47, 224, 161, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyber-emerald)', fontWeight: 700, fontSize: '15px' }}>
                    <CheckCircle2 size={18} />
                    <span>Application Approved!</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 0', lineHeight: 1.5 }}>
                    {selectedNotification.preview || 'Your institution has approved your enrollment in this course. You can now access modules and begin your learning sprint.'}
                  </p>
                </div>
                <button onClick={() => setActivePage('learning')} className="btn-cyber-primary" style={{ padding: '10px 20px', fontSize: '13px', alignSelf: 'flex-start' }}>
                  <span>Go to My Learning Sprint →</span>
                </button>
              </div>
            )}

            {selectedNotification.type === 'ENROLLMENT_REJECTED' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '18px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyber-rose)', fontWeight: 700, fontSize: '15px' }}>
                    <AlertTriangle size={18} />
                    <span>Application Not Approved</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 0', lineHeight: 1.5 }}>
                    {selectedNotification.preview || 'Your enrollment application could not be approved at this time.'}
                  </p>
                </div>
                <button onClick={() => setActivePage('learning')} className="btn-cyber-outline" style={{ padding: '10px 20px', fontSize: '13px', alignSelf: 'flex-start' }}>
                  <span>Browse Other Courses →</span>
                </button>
              </div>
            )}

            {/* ── INSTITUTION: NEW STUDENT REGISTERED ── */}
            {selectedNotification.type === 'new_student' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  {[['STUDENT', selectedNotification.details.student], ['DEPARTMENT', selectedNotification.details.department], ['YEAR', selectedNotification.details.year]].map(([label, val]) => (
                    <div key={label} style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(40,215,255,0.04)', border: '1px solid rgba(40,215,255,0.25)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-cyan)', marginBottom: '8px' }}>Enrolled Skills</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedNotification.details.skills?.map(sk => <span key={sk} className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>{sk}</span>)}
                  </div>
                </div>
                <button onClick={() => setActivePage('institution-students')} className="btn-cyber-primary" style={{ padding: '10px 20px', fontSize: '13px', alignSelf: 'flex-start' }}>
                  <span>View Student Profile →</span>
                </button>
              </div>
            )}

            {/* ── INSTITUTION: PROJECT PROOF SUBMITTED ── */}
            {selectedNotification.type === 'proof_submitted' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[['STUDENT', selectedNotification.details.student], ['PROJECT', selectedNotification.details.project], ['DEPARTMENT', selectedNotification.details.department], ['STATUS', selectedNotification.details.status]].map(([label, val]) => (
                  <div key={label} style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: label === 'STATUS' ? 'var(--cyber-amber)' : 'var(--text-primary)', marginTop: '4px' }}>{val}</div>
                  </div>
                ))}
                <button onClick={() => setActivePage('institution-proofs')} className="btn-cyber-primary" style={{ padding: '10px 20px', fontSize: '13px', alignSelf: 'flex-start' }}>
                  <span>Review Proof →</span>
                </button>
              </div>
            )}

            {/* ── INSTITUTION: HIGH-READINESS / ASSESSMENT / COURSE / PLACEMENT ── */}
            {['high_readiness','assessment_completed','course_enrollment','placement_candidate'].includes(selectedNotification.type) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                  {Object.entries(selectedNotification.details).filter(([k]) => k !== 'action').map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{Array.isArray(v) ? v.join(', ') : String(v)}</strong>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActivePage(selectedNotification.details.action || 'institution-console')} className="btn-cyber-primary" style={{ padding: '10px 20px', fontSize: '13px', alignSelf: 'flex-start' }}>
                  <span>View Details →</span>
                </button>
              </div>
            )}

            {/* ── INDUSTRY: NEW CANDIDATE ── */}
            {selectedNotification.type === 'new_candidate' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  {[['CANDIDATE', selectedNotification.details.candidate], ['MATCH SCORE', selectedNotification.details.match], ['COLLEGE', selectedNotification.details.college], ['EXPERIENCE', selectedNotification.details.experience]].map(([label, val]) => (
                    <div key={label} style={{ padding: '14px', borderRadius: '8px', background: label === 'MATCH SCORE' ? 'rgba(40,215,255,0.05)' : 'rgba(255,255,255,0.02)', border: label === 'MATCH SCORE' ? '1px solid rgba(40,215,255,0.3)' : '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</div>
                      <div style={{ fontSize: label === 'MATCH SCORE' ? '22px' : '14px', fontWeight: 800, color: label === 'MATCH SCORE' ? 'var(--cyber-cyan)' : 'var(--text-primary)', marginTop: '4px' }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(40,215,255,0.04)', border: '1px solid rgba(40,215,255,0.25)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-cyan)', marginBottom: '8px' }}>Verified Skills</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedNotification.details.skills?.map(sk => <span key={sk} className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>{sk}</span>)}
                  </div>
                </div>
                <button onClick={() => setActivePage('industry-portal')} className="btn-cyber-primary" style={{ padding: '10px 20px', fontSize: '13px', alignSelf: 'flex-start' }}>
                  <span>View Candidate Profile →</span>
                </button>
              </div>
            )}

            {/* ── INDUSTRY: APPLICATION RECEIVED ── */}
            {selectedNotification.type === 'application_received' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {[['CANDIDATE', selectedNotification.details.candidate], ['APPLIED FOR', selectedNotification.details.role], ['MATCH', selectedNotification.details.match]].map(([label, val]) => (
                  <div key={label} style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{val}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {selectedNotification.details.skills?.map(sk => <span key={sk} className="cyber-badge badge-emerald" style={{ fontSize: '10px' }}>{sk}</span>)}
                </div>
                <button onClick={() => setActivePage('industry-portal')} className="btn-cyber-primary" style={{ padding: '10px 20px', fontSize: '13px', alignSelf: 'flex-start' }}>
                  <span>Review Application →</span>
                </button>
              </div>
            )}

            {/* ── INDUSTRY: SKILL UPDATED / INTERVIEW / PROJECT EVIDENCE ── */}
            {['skill_updated','interview_reminder','project_evidence'].includes(selectedNotification.type) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                  {Object.entries(selectedNotification.details).filter(([k]) => k !== 'action').map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{Array.isArray(v) ? v.join(', ') : String(v)}</strong>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActivePage('industry-portal')} className="btn-cyber-primary" style={{ padding: '10px 20px', fontSize: '13px', alignSelf: 'flex-start' }}>
                  <span>View in Talent Portal →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =====================================================================
           NOTIFICATION LIST VIEW
           ===================================================================== */
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          {/* Filters Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-input)', flexWrap: 'wrap', gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {getFilterTabs().map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    background: filter === tab.id ? 'rgba(0, 212, 255, 0.12)' : 'transparent',
                    color: filter === tab.id ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                    border: filter === tab.id ? '1px solid rgba(0, 212, 255, 0.35)' : '1px solid transparent'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Click notification card to inspect full details
              </span>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredNotifications.length === 0 ? (
              <div style={{ padding: '70px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={36} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)' }}>You're all caught up!</div>
                <div style={{ fontSize: '12.5px', marginTop: '6px', color: 'var(--text-muted)' }}>
                  No active notifications in this category.
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif, i) => {
                const Icon = getCategoryIcon(notif.type);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleOpenDetail(notif)}
                    style={{
                      display: 'flex', gap: '16px', padding: '20px 24px',
                      borderBottom: i < filteredNotifications.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      background: notif.unread ? 'rgba(0, 212, 255, 0.03)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.unread ? 'rgba(0, 212, 255, 0.03)' : 'transparent';
                    }}
                  >
                    {/* Left cyan unread indicator bar */}
                    {notif.unread && (
                      <div style={{
                        position: 'absolute', left: '0', top: '0', bottom: '0', width: '3px',
                        background: 'var(--cyber-cyan)', boxShadow: 'var(--cyber-cyan-glow)'
                      }} />
                    )}

                    {/* Category Icon Badge */}
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                      background: `${notif.color}15`, border: `1px solid ${notif.color}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon size={19} color={notif.color} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="cyber-badge" style={{
                            background: `${notif.color}18`,
                            color: notif.color,
                            border: `1px solid ${notif.color}35`,
                            fontSize: '9px', padding: '2px 7px'
                          }}>
                            {notif.categoryLabel}
                          </span>
                          <h3 style={{
                            fontSize: '14px',
                            fontWeight: notif.unread ? 700 : 600,
                            color: notif.unread ? 'var(--text-primary)' : 'var(--text-secondary)'
                          }}>
                            {notif.title}
                          </h3>
                        </div>

                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '12px', fontFamily: 'var(--font-mono)' }}>
                          {notif.time}
                        </span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                        {notif.preview}
                      </p>

                      {/* Card Footer actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11.5px', color: 'var(--cyber-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            Inspect details & actions →
                          </span>

                          {((notif.type === 'NEW_SKILL' || notif.type === 'new_skill') || notif.details?.skillId) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalSkillId(notif.details?.skillId || notif.skillId || notif.id);
                              }}
                              className="btn-cyber-primary"
                              style={{ padding: '3px 10px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Sparkles size={11} />
                              <span>View & Enroll</span>
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                          {notif.unread && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif.id);
                              }}
                              style={{
                                background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '4px',
                                padding: '4px 10px', fontSize: '11px', color: 'var(--text-primary)',
                                cursor: 'pointer', transition: 'background 0.2s ease'
                              }}
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(e, notif.id)}
                            style={{
                              background: 'none', border: 'none', borderRadius: '4px',
                              padding: '4px 10px', fontSize: '11px', color: 'var(--cyber-rose)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                            title="Move to Trashbin"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── SKILL DETAILS & ELIGIBILITY MODAL ── */}
      {modalSkillId && (
        <SkillDetailsModal
          isOpen={Boolean(modalSkillId)}
          skillId={modalSkillId}
          student={user}
          onClose={() => setModalSkillId(null)}
          onEnrolled={(result) => {
            if (onShowToast) {
              onShowToast({
                title: 'Enrollment Confirmed',
                message: 'You have enrolled in this skill course! Access your learning track under My Learning.',
                type: 'success'
              });
            }
          }}
        />
      )}
    </div>
  );
}
