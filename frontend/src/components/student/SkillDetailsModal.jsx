import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Layers,
  Award,
  BookOpen,
  User,
  Users,
  ShieldCheck,
  ArrowRight,
  Check,
  AlertTriangle,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SkillDetailsModal({
  skillId,
  isOpen,
  onClose,
  onNavigateToLearning,
  onShowToast
}) {
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [currentEnrollmentStatus, setCurrentEnrollmentStatus] = useState(null);

  useEffect(() => {
    if (!isOpen || !skillId) return;
    setLoading(true);
    setEnrollSuccess(false);

    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    fetch(`/api/learning/skills/${skillId}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setSkill(res.data);
          if (res.data.eligibility?.existingEnrollment) {
            setCurrentEnrollmentStatus(res.data.eligibility.existingEnrollment.status);
          } else {
            setCurrentEnrollmentStatus(null);
          }
        }
      })
      .catch(err => console.warn('Skill details fetch error:', err))
      .finally(() => setLoading(false));
  }, [isOpen, skillId]);

  if (!isOpen) return null;

  const eligibility = skill?.eligibility || {
    isEligible: false,
    status: 'NOT_ELIGIBLE',
    breakdown: [],
    reasons: []
  };

  const isEligible = eligibility.isEligible;
  const isAlreadyEnrolled = currentEnrollmentStatus === 'ENROLLED' || currentEnrollmentStatus === 'In Progress' || currentEnrollmentStatus === 'COMPLETED' || currentEnrollmentStatus === 'CERTIFIED';
  const isPendingApproval = currentEnrollmentStatus === 'PENDING';
  const isWaitlisted = currentEnrollmentStatus === 'WAITLISTED';

  const enrollmentType = (skill?.enrollmentSettings?.type || 'OPEN').toUpperCase();

  const handleEnrollSubmit = async () => {
    setEnrolling(true);
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');

    try {
      const res = await fetch(`/api/learning/skills/${skillId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      setEnrolling(false);
      setShowConfirmModal(false);

      if (!res.ok || !data.success) {
        if (onShowToast) {
          onShowToast({
            title: 'Enrollment Error',
            message: data.message || 'Could not complete enrollment.',
            type: 'error'
          });
        }
        return;
      }

      setCurrentEnrollmentStatus(data.status);
      setEnrollSuccess(true);

      if (data.status === 'ENROLLED') {
        try {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch {}

        if (onShowToast) {
          onShowToast({
            title: 'Enrollment Confirmed!',
            message: `You're now enrolled in "${skill.name}". Ready to start learning.`,
            type: 'success'
          });
        }
      } else if (data.status === 'PENDING') {
        if (onShowToast) {
          onShowToast({
            title: 'Enrollment Request Sent',
            message: `Your request for "${skill.name}" was sent to faculty administrators for approval.`,
            type: 'info'
          });
        }
      }
    } catch (err) {
      setEnrolling(false);
      if (onShowToast) {
        onShowToast({
          title: 'Connection Error',
          message: 'Failed to connect to academic enrollment server.',
          type: 'error'
        });
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(10, 15, 30, 0.8)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div 
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          background: 'var(--bg-card, rgba(255, 255, 255, 0.96))',
          border: '1px solid var(--border-subtle, rgba(124, 58, 237, 0.25))',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.15)', color: '#7C3AED', fontSize: '11px', fontWeight: 800 }}>
              {skill?.category || 'Programming'}
            </span>
            <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', fontSize: '11px', fontWeight: 800 }}>
              {skill?.level || 'Intermediate'}
            </span>
            <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '11px', fontWeight: 800 }}>
              {skill?.mode || 'Hybrid'}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Loading course details and calculating eligibility...
            </div>
          ) : !skill ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#EF4444' }}>
              Skill details not found.
            </div>
          ) : (
            <>
              {/* Title & Organization */}
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-heading)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  {skill.name}
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  Offered by <strong>{skill.institutionName}</strong> • Faculty Lead: <strong>{skill.instructor?.name || 'Faculty'}</strong>
                </p>
              </div>

              {/* AUTOMATIC REAL-TIME ELIGIBILITY CARD (PART 8 & 21) */}
              <div style={{
                padding: '18px 20px',
                borderRadius: '16px',
                background: isAlreadyEnrolled
                  ? 'rgba(16, 185, 129, 0.08)'
                  : isPendingApproval
                  ? 'rgba(245, 158, 11, 0.08)'
                  : isEligible
                  ? 'rgba(124, 58, 237, 0.08)'
                  : 'rgba(239, 68, 68, 0.08)',
                border: isAlreadyEnrolled
                  ? '1.5px solid #10B981'
                  : isPendingApproval
                  ? '1.5px solid #F59E0B'
                  : isEligible
                  ? '1.5px solid #7C3AED'
                  : '1.5px solid #EF4444',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isAlreadyEnrolled ? (
                      <CheckCircle2 size={20} color="#10B981" />
                    ) : isPendingApproval ? (
                      <Clock size={20} color="#F59E0B" />
                    ) : isEligible ? (
                      <CheckCircle2 size={20} color="#7C3AED" />
                    ) : (
                      <AlertCircle size={20} color="#EF4444" />
                    )}
                    <h3 style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      margin: 0,
                      color: isAlreadyEnrolled
                        ? '#059669'
                        : isPendingApproval
                        ? '#D97706'
                        : isEligible
                        ? '#7C3AED'
                        : '#DC2626'
                    }}>
                      {isAlreadyEnrolled
                        ? '✓ Currently Enrolled'
                        : isPendingApproval
                        ? '⏳ Enrollment Request Pending Approval'
                        : isWaitlisted
                        ? '📋 Added to Course Waitlist'
                        : isEligible
                        ? '✓ You Are Eligible to Enroll'
                        : '⚠ Eligibility Requirements Not Met'}
                    </h3>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-secondary)'
                  }}>
                    {skill.maxStudents - (skill.enrolledCount || 0)} of {skill.maxStudents} Seats Open
                  </span>
                </div>

                {/* Eligibility Breakdown Checklist */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  {eligibility.breakdown?.map((b, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {b.pass ? (
                        <Check size={14} color="#10B981" style={{ flexShrink: 0 }} />
                      ) : (
                        <X size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ color: b.pass ? 'var(--text-primary)' : '#DC2626' }}>
                        {b.detail}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Specific Failure Reasons */}
                {!isEligible && eligibility.reasons?.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '12px', color: '#DC2626' }}>
                    {eligibility.reasons.map((r, i) => (
                      <div key={i} style={{ marginBottom: '2px' }}>• {r}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Course Overview */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 6px' }}>
                  About This Skill
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                  {skill.shortDescription}
                </p>
                {skill.detailedDescription && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '6px' }}>
                    {skill.detailedDescription}
                  </p>
                )}
                {skill.whyImportant && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0, 212, 255, 0.06)', border: '1px solid rgba(0, 212, 255, 0.2)', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                    <strong style={{ color: 'var(--cyber-cyan)' }}>Why this skill is important: </strong>
                    {skill.whyImportant}
                  </div>
                )}
              </div>

              {/* Technologies & Related Skills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>CORE TECHNOLOGIES & TOOLS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(skill.technologies || ['Python', 'VS Code', 'Git']).map((t, i) => (
                      <span key={i} className="cyber-badge" style={{ fontSize: '11px' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>RELATED SKILLS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(skill.relatedSkills || ['Data Structures', 'Algorithms']).map((rs, i) => (
                      <span key={i} className="cyber-badge badge-purple" style={{ fontSize: '11px' }}>{rs}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* What You'll Learn */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px' }}>
                  What You'll Learn
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {(skill.learningOutcomes || skill.learningObjectives || []).map((obj, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                      <Check size={14} color="#10B981" style={{ flexShrink: 0 }} />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topics Covered */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px' }}>
                  Curriculum Topics
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(skill.topics || skill.topicsCovered || []).map((topic, i) => (
                    <span key={i} style={{ padding: '4px 10px', borderRadius: '14px', background: 'rgba(124, 58, 237, 0.08)', color: '#7C3AED', fontSize: '12px', fontWeight: 600 }}>
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Structured Modules & Learning Path */}
              {Array.isArray(skill.modules) && skill.modules.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 10px' }}>
                    Structured Learning Path ({skill.modules.length} Modules)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {skill.modules.map((mod, mIdx) => (
                      <div key={mIdx} style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Module {mod.moduleNumber || mIdx + 1}: {mod.title}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{mod.duration}</span>
                        </div>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                          {mod.description}
                        </p>
                        {Array.isArray(mod.lessons) && mod.lessons.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {mod.lessons.map((les, lIdx) => (
                              <span key={lIdx} style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 212, 255, 0.08)', color: 'var(--cyber-cyan)' }}>
                                • {typeof les === 'object' ? les.title : String(les)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practical Capstone Project */}
              {skill.project && (
                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyber-purple)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    PRACTICAL CAPSTONE PROJECT
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 4px' }}>
                    {skill.project.title || `${skill.name} Capstone`}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                    {skill.project.description}
                  </p>
                  {Array.isArray(skill.project.requirements) && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      <strong>Key requirements:</strong> {skill.project.requirements.join(' • ')}
                    </div>
                  )}
                </div>
              )}

              {/* Instructor & Certification */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px' }}>FACULTY INSTRUCTOR</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-heading)' }}>{skill.instructor?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{skill.instructor?.designation}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{skill.instructor?.experience}</div>
                </div>

                <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px' }}>OFFICIAL CERTIFICATION</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>
                    {skill.certification?.available ? '🏆 Institutional Certificate Included' : 'Standard Completion Badge'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {skill.certification?.criteria || 'Granted upon passing proctored benchmark.'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-input, rgba(255,255,255,0.4))'
        }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Application Deadline: <strong>{skill?.eligibility?.applicationDeadline}</strong>
            </span>
          </div>

          <div>
            {isAlreadyEnrolled ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateToLearning) onNavigateToLearning();
                }}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Play size={16} /> Continue Learning →
              </button>
            ) : isPendingApproval ? (
              <button
                disabled
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#D97706',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  border: '1px solid #F59E0B',
                  cursor: 'not-allowed'
                }}
              >
                Request Awaiting Approval
              </button>
            ) : !isEligible ? (
              <button
                disabled
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#DC2626',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  cursor: 'not-allowed'
                }}
              >
                Eligibility Requirements Not Met
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(124, 58, 237, 0.35)'
                }}
              >
                <Sparkles size={16} />
                <span>{enrollmentType === 'APPROVAL_REQUIRED' ? 'Request Enrollment' : 'Enroll Now'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL (PART 22) */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          padding: '20px'
        }}>
          <div 
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '28px',
              borderRadius: '20px',
              background: 'var(--bg-card, #FFFFFF)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
              border: '2px solid #7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#7C3AED'
            }}>
              <BookOpen size={26} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px' }}>
              Confirm Skill Enrollment
            </h3>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED', marginBottom: '12px' }}>
              {skill?.name}
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', fontSize: '12.5px', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: 1.5, marginBottom: '20px' }}>
              <div>• <strong>Institution:</strong> {skill?.institutionName}</div>
              <div>• <strong>Duration:</strong> {skill?.duration} ({skill?.totalHours} Hours)</div>
              <div>• <strong>Start Date:</strong> {skill?.schedule?.startDate}</div>
              <div>• <strong>Mode:</strong> {skill?.mode}</div>
              <div style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                "By enrolling, you agree to participate in the course curriculum and complete the required proctored benchmark assessments."
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '10px',
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={enrolling}
                onClick={handleEnrollSubmit}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  cursor: enrolling ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
                }}
              >
                {enrolling ? 'Confirming...' : 'Confirm Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
