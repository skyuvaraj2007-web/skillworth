import React, { useState, useEffect } from 'react';
import {
  User,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Code,
  Compass,
  FileText,
  FolderGit2,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';
import { collaborationService } from '../../services/collaborationService';

export default function CompanyStudentDevelopment({ studentId, onClose, onShowToast }) {
  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, skills, assessments, learning, projects, career

  useEffect(() => {
    async function loadStudentData() {
      try {
        setLoading(true);
        const [profRes, timeRes] = await Promise.all([
          collaborationService.getAuthorizedStudentProfile(studentId),
          collaborationService.getStudentDevelopmentTimeline(studentId)
        ]);

        if (profRes.success) {
          setProfile(profRes.data);
        } else {
          if (onShowToast) onShowToast({ title: 'Access Denied', message: profRes.message || 'Unauthorized student access', type: 'error' });
          if (onClose) onClose();
        }

        if (timeRes.success) {
          setTimeline(timeRes.data?.events || (Array.isArray(timeRes.data) ? timeRes.data : []));
        }
      } catch (err) {
        console.error('Failed to load student developmental telemetry:', err);
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, color: '#00d4ff'
      }}>
        Loading authorized student developmental dossier...
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '24px'
    }}>
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden'
      }}>
        {/* Modal Top Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #00d4ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, color: '#fff', fontSize: '18px'
            }}>
              {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'ST'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                  {profile.name}
                </h2>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700,
                  background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  AUTHORIZED TALENT
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
                {profile.department || 'Engineering'} • {profile.collegeName || profile.collegeId || 'Institution'} • Batch {profile.batch || '2026'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X style={{ width: '22px', height: '22px' }} />
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div style={{
          display: 'flex', gap: '6px', padding: '10px 24px',
          background: 'rgba(15, 23, 42, 0.5)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {[
            { id: 'overview', label: 'Development Timeline', icon: Compass },
            { id: 'skills', label: 'Skills & Verification', icon: Award },
            { id: 'assessments', label: 'Assessments', icon: FileText },
            { id: 'learning', label: 'Learning & Courses', icon: BookOpen },
            { id: 'projects', label: 'Projects', icon: FolderGit2 },
            { id: 'career', label: 'Career Applications', icon: Briefcase }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600,
                  background: isActive ? 'rgba(0, 212, 255, 0.12)' : 'transparent',
                  color: isActive ? '#00d4ff' : '#94a3b8',
                  border: isActive ? '1px solid rgba(0, 212, 255, 0.25)' : '1px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <Icon style={{ width: '14px', height: '14px' }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* TAB 1: CONTINUOUS DEVELOPMENT TIMELINE */}
          {activeSubTab === 'overview' && (
            <div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px'
              }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Readiness Score</span>
                  <strong style={{ color: '#00d4ff', fontSize: '22px' }}>{profile.readinessScore || profile.readiness || 0}%</strong>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Verified Skills</span>
                  <strong style={{ color: '#4ade80', fontSize: '22px' }}>{profile.skills ? profile.skills.filter(s => s.verified).length : 0}</strong>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Timeline Events</span>
                  <strong style={{ color: '#f1f5f9', fontSize: '22px' }}>{timeline.length}</strong>
                </div>
              </div>

              <h3 style={{ fontSize: '15px', color: '#f8fafc', fontWeight: 700, marginBottom: '16px' }}>
                Chronological Growth Log (PostgreSQL Sourced)
              </h3>

              {timeline.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '13.5px' }}>
                  No development events recorded yet. As the student undertakes coursework, assessments, and applications, verified milestones will appear here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {timeline.map((event, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '14px',
                        background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'rgba(0, 212, 255, 0.12)', border: '1px solid rgba(0, 212, 255, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Sparkles style={{ width: '16px', height: '16px', color: '#00d4ff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13.5px' }}>
                            {event.title}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '11.5px' }}>
                            {event.date ? new Date(event.date).toLocaleDateString() : 'Active'}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12.5px' }}>
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SKILLS */}
          {activeSubTab === 'skills' && (
            <div>
              <h3 style={{ fontSize: '15px', color: '#f8fafc', fontWeight: 700, marginBottom: '14px' }}>
                Skills Profile & Proof of Competence
              </h3>
              {(!profile.skills || profile.skills.length === 0) ? (
                <div style={{ color: '#64748b', fontSize: '13px', padding: '30px', textAlign: 'center' }}>
                  No verified skills registered for this candidate.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                  {profile.skills.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(30, 41, 59, 0.5)', padding: '12px 14px', borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13.5px' }}>{s.name || s.skill}</div>
                        <div style={{ color: '#94a3b8', fontSize: '11.5px' }}>Level: {s.level || 'Intermediate'}</div>
                      </div>
                      <span style={{
                        padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700,
                        background: s.verified ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                        color: s.verified ? '#4ade80' : '#facc15'
                      }}>
                        {s.verified ? 'Verified' : 'Self-Claimed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSESSMENTS */}
          {activeSubTab === 'assessments' && (
            <div>
              <h3 style={{ fontSize: '15px', color: '#f8fafc', fontWeight: 700, marginBottom: '14px' }}>
                Institutional Assessment History
              </h3>
              {(!profile.assessments || profile.assessments.length === 0) ? (
                <div style={{ color: '#64748b', fontSize: '13px', padding: '30px', textAlign: 'center' }}>
                  Candidate has not yet sat for institutional benchmark examinations.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {profile.assessments.map((a, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>{a.title || a.name || 'Benchmark Test'}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>Track: {a.track || 'General'} • Date: {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : 'Recent'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#00d4ff' }}>{a.score}%</span>
                        <div style={{ color: '#4ade80', fontSize: '11px', fontWeight: 600 }}>PASSED</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LEARNING & COURSES */}
          {activeSubTab === 'learning' && (
            <div>
              <h3 style={{ fontSize: '15px', color: '#f8fafc', fontWeight: 700, marginBottom: '14px' }}>
                Enrolled Academic Courses & Certifications
              </h3>
              {(!profile.courses || profile.courses.length === 0) ? (
                <div style={{ color: '#64748b', fontSize: '13px', padding: '30px', textAlign: 'center' }}>
                  Candidate is not actively enrolled in specialized institutional courses.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {profile.courses.map((c, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ color: '#f8fafc', fontSize: '13.5px' }}>{c.title}</strong>
                        <span style={{ color: '#00d4ff', fontWeight: 700, fontSize: '13px' }}>{c.progress || c.learningProgress || 0}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${c.progress || c.learningProgress || 0}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #00d4ff)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROJECTS */}
          {activeSubTab === 'projects' && (
            <div>
              <h3 style={{ fontSize: '15px', color: '#f8fafc', fontWeight: 700, marginBottom: '14px' }}>
                Validated Technical Projects
              </h3>
              {(!profile.projects || profile.projects.length === 0) ? (
                <div style={{ color: '#64748b', fontSize: '13px', padding: '30px', textAlign: 'center' }}>
                  No published project artifacts found for this candidate.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {profile.projects.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>{p.title}</div>
                      <p style={{ margin: '4px 0 8px 0', color: '#94a3b8', fontSize: '12.5px' }}>{p.description || 'Full-stack engineering implementation.'}</p>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(p.skills || ['Python', 'SQL']).map((sk, skIdx) => (
                          <span key={skIdx} style={{ fontSize: '10.5px', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: '#e2e8f0' }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: CAREER */}
          {activeSubTab === 'career' && (
            <div>
              <h3 style={{ fontSize: '15px', color: '#f8fafc', fontWeight: 700, marginBottom: '14px' }}>
                Recruitment & Application Pipeline
              </h3>
              {(!profile.applications || profile.applications.length === 0) ? (
                <div style={{ color: '#64748b', fontSize: '13px', padding: '30px', textAlign: 'center' }}>
                  No active company recruitment records for this candidate.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {profile.applications.map((app, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong style={{ color: '#f8fafc', fontSize: '14px' }}>{app.opportunityTitle || 'Opportunity'}</strong>
                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent'}</div>
                      </div>
                      <span style={{
                        padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700,
                        background: app.stage === 'Offered' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: app.stage === 'Offered' ? '#4ade80' : '#38bdf8'
                      }}>
                        {app.stage || 'Applied'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
