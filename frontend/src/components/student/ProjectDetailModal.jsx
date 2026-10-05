import React, { useState, useEffect } from 'react';
import {
  X,
  FolderGit2,
  ExternalLink,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Users,
  Code,
  Layers,
  Terminal,
  FileText,
  AlertTriangle,
  Plus,
  Trash2,
  Send,
  Building,
  Calendar,
  Tag,
  Check,
  RotateCcw
} from 'lucide-react';
import { projectService } from '../../services/projectService';

export default function ProjectDetailModal({
  projectId,
  isOpen,
  onClose,
  onShowToast,
  onProjectUpdated
}) {
  const [project, setProject] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about'); // about, activities, evidence, team, ai
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityCategory, setNewActivityCategory] = useState('Development');
  const [newActivityTech, setNewActivityTech] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [projRes, aiRes] = await Promise.all([
          projectService.getProjectById(projectId).catch(() => ({ data: null })),
          projectService.getProjectAiInsights(projectId).catch(() => ({ data: null }))
        ]);
        if (isMounted) {
          if (projRes?.data) setProject(projRes.data);
          if (aiRes?.data) setAiInsights(aiRes.data);
        }
      } catch (err) {
        console.error('Failed to load project details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleStatusToggle = async (activity) => {
    if (!project) return;
    const newStatus = activity.status === 'COMPLETED' ? 'IN PROGRESS' : 'COMPLETED';
    try {
      const res = await projectService.updateProjectActivity(project.id, activity.id, {
        status: newStatus
      });
      if (res.success && res.data) {
        setProject(res.data.project);
        if (onProjectUpdated) onProjectUpdated();
        if (onShowToast) {
          onShowToast({
            title: 'Activity Updated',
            message: `"${activity.title}" marked as ${newStatus}.`,
            type: 'success'
          });
        }
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newActivityTitle.trim() || !project) return;
    try {
      const res = await projectService.addProjectActivity(project.id, {
        title: newActivityTitle.trim(),
        category: newActivityCategory,
        technologies: newActivityTech ? newActivityTech.split(',').map(s => s.trim()) : [],
        status: 'COMPLETED'
      });
      if (res.success && res.data) {
        setProject(res.data.project);
        setNewActivityTitle('');
        setNewActivityTech('');
        setShowAddActivity(false);
        if (onProjectUpdated) onProjectUpdated();
        if (onShowToast) {
          onShowToast({
            title: 'Activity Recorded',
            message: 'Milestone activity appended to project experience.',
            type: 'success'
          });
        }
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleSubmitForVerification = async () => {
    if (!project) return;
    setSubmittingAction(true);
    try {
      const res = await projectService.submitProjectForVerification(project.id);
      if (res.success && res.data) {
        setProject(res.data);
        if (onProjectUpdated) onProjectUpdated();
        if (onShowToast) {
          onShowToast({
            title: 'Submitted to Institution',
            message: `"${project.title}" dispatched to faculty review authority.`,
            type: 'success'
          });
        }
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Verification Error', message: err.message, type: 'error' });
    } finally {
      setSubmittingAction(false);
    }
  };

  const getVerificationBadge = () => {
    const status = project?.verificationStatus || 'NOT_SUBMITTED';
    if (status === 'VERIFIED') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(16, 185, 129, 0.15)', color: 'var(--cyber-emerald, #10b981)',
          border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 12px',
          borderRadius: '20px', fontSize: '12px', fontWeight: 700
        }}>
          <ShieldCheck size={14} /> College Verified • {project.verifiedBy || 'Institution'}
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(234, 179, 8, 0.15)', color: 'var(--cyber-amber, #f59e0b)',
          border: '1px solid rgba(234, 179, 8, 0.3)', padding: '4px 12px',
          borderRadius: '20px', fontSize: '12px', fontWeight: 700
        }}>
          <Clock size={14} /> Submitted for Academic Review
        </span>
      );
    }
    if (status === 'NEEDS_CORRECTION') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 12px',
          borderRadius: '20px', fontSize: '12px', fontWeight: 700
        }}>
          <AlertTriangle size={14} /> Action Required: Correction Requested
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted, #94a3b8)',
        border: '1px solid rgba(255, 255, 255, 0.12)', padding: '4px 12px',
        borderRadius: '20px', fontSize: '12px', fontWeight: 700
      }}>
        <Clock size={14} /> Unverified Project
      </span>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(5, 7, 15, 0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        width: '100%', maxWidth: '900px', maxHeight: '90vh',
        background: 'var(--bg-card, #0f172a)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
        borderRadius: '20px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7)', overflow: 'hidden'
      }}>
        {/* Modal Top Bar */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(0,242,254,0.06), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(0,242,254,0.12)', color: 'var(--cyber-cyan, #00f2fe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FolderGit2 size={18} />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                LinkedIn-Style Project Experience
              </span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {project?.title || 'Project Details'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', padding: '6px', borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              Loading project telemetry...
            </div>
          ) : !project ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Project details not found.
            </div>
          ) : (
            <>
              {/* Project Hero Header */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '22px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                        padding: '3px 10px', borderRadius: '6px',
                        background: 'rgba(0,242,254,0.12)', color: 'var(--cyber-cyan, #00f2fe)'
                      }}>
                        {project.category || 'FULL STACK'}
                      </span>
                      {getVerificationBadge()}
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                      {project.title}
                    </h2>
                    <div style={{ fontSize: '14px', color: 'var(--cyber-cyan, #00f2fe)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{project.role || 'Lead Software Developer'}</span>
                      <span style={{ opacity: 0.4 }}>•</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
                        {project.startDate || '2026-01'} — {project.isCurrentProject ? 'Present' : (project.endDate || 'Completed')}
                      </span>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {project.verificationStatus !== 'VERIFIED' && project.verificationStatus !== 'PENDING' && (
                      <button
                        onClick={handleSubmitForVerification}
                        disabled={submittingAction}
                        className="btn-cyber-primary"
                        style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <ShieldCheck size={15} />
                        <span>{submittingAction ? 'Submitting...' : 'Submit to College'}</span>
                      </button>
                    )}
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-cyber-ghost"
                        style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        <GitBranch size={15} /> Repo
                      </a>
                    )}
                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-cyber-ghost"
                        style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        <ExternalLink size={15} /> Live Demo
                      </a>
                    )}
                  </div>
                </div>

                {/* Correction Alert if needed */}
                {project.verificationStatus === 'NEEDS_CORRECTION' && project.correctionReason && (
                  <div style={{
                    marginTop: '16px', padding: '14px 18px', borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)',
                    display: 'flex', alignItems: 'flex-start', gap: '12px'
                  }}>
                    <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ef4444' }}>
                        Faculty Reviewer Feedback:
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {project.correctionReason}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Tabs */}
              <div style={{
                display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '2px'
              }}>
                {[
                  { id: 'about', label: 'About Project', icon: FileText },
                  { id: 'activities', label: `Activities (${project.activities?.length || 0})`, icon: GitBranch },
                  { id: 'skills', label: `Technologies & Skills (${project.skills?.length || 0})`, icon: Code },
                  { id: 'ai', label: 'NEXUS AI Insights', icon: Sparkles }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '10px 18px', background: isActive ? 'rgba(0,242,254,0.1)' : 'transparent',
                        color: isActive ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                        border: 'none', borderBottom: isActive ? '2px solid var(--cyber-cyan)' : '2px solid transparent',
                        fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: About */}
              {activeTab === 'about' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>
                      Overview
                    </h4>
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {project.detailedDescription?.overview || project.shortDescription || 'No overview provided.'}
                    </p>
                  </div>

                  {project.detailedDescription?.problemStatement && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: 'var(--cyber-amber, #f59e0b)' }}>
                        Problem Statement
                      </h4>
                      <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {project.detailedDescription.problemStatement}
                      </p>
                    </div>
                  )}

                  {project.detailedDescription?.solution && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: 'var(--cyber-emerald, #10b981)' }}>
                        Solution Architecture
                      </h4>
                      <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {project.detailedDescription.solution}
                      </p>
                    </div>
                  )}

                  {project.myContribution && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: 'var(--cyber-purple, #a855f7)' }}>
                        My Contribution & Responsibilities
                      </h4>
                      <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {project.myContribution}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Activities & Milestones */}
              {activeTab === 'activities' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>
                        Project Activity Timeline
                      </h4>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Every completed activity demonstrates verified engineering rigor.
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAddActivity(!showAddActivity)}
                      className="btn-cyber-primary"
                      style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={14} /> Add Activity
                    </button>
                  </div>

                  {/* Add Activity Form */}
                  {showAddActivity && (
                    <form onSubmit={handleAddActivity} style={{
                      padding: '16px', borderRadius: '12px', background: 'rgba(0,242,254,0.04)',
                      border: '1px solid rgba(0,242,254,0.2)', display: 'flex', flexDirection: 'column', gap: '12px'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-cyan)' }}>
                        Record New Project Milestone / Activity
                      </div>
                      <input
                        type="text"
                        placeholder="Activity title (e.g., Constructed REST API endpoints for user auth)"
                        value={newActivityTitle}
                        onChange={(e) => setNewActivityTitle(e.target.value)}
                        style={{
                          background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                          borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px'
                        }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <select
                          value={newActivityCategory}
                          onChange={(e) => setNewActivityCategory(e.target.value)}
                          style={{
                            background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                            borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px'
                          }}
                        >
                          <option value="Architecture">Architecture</option>
                          <option value="Development">Development</option>
                          <option value="Testing">Testing & QA</option>
                          <option value="DevOps">DevOps & Cloud</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Technologies used (e.g. Go, Docker)"
                          value={newActivityTech}
                          onChange={(e) => setNewActivityTech(e.target.value)}
                          style={{
                            background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                            borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setShowAddActivity(false)}
                          className="btn-cyber-ghost"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-cyber-primary"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                        >
                          Save Activity
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Activity Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(project.activities || []).map((act, idx) => {
                      const isCompleted = act.status === 'COMPLETED';
                      return (
                        <div
                          key={act.id || idx}
                          style={{
                            padding: '14px 18px', borderRadius: '12px',
                            background: isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-subtle)'}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                              onClick={() => handleStatusToggle(act)}
                              style={{
                                width: '24px', height: '24px', borderRadius: '6px',
                                border: `1px solid ${isCompleted ? 'var(--cyber-emerald)' : 'var(--border-subtle)'}`,
                                background: isCompleted ? 'var(--cyber-emerald)' : 'transparent',
                                color: '#05070f', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', flexShrink: 0
                              }}
                            >
                              {isCompleted && <Check size={14} strokeWidth={3} />}
                            </button>
                            <div>
                              <div style={{
                                fontSize: '14px', fontWeight: 600,
                                color: isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)',
                                textDecoration: isCompleted ? 'none' : 'none'
                              }}>
                                {act.title}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                                <span>{act.category}</span>
                                {act.completedAt && (
                                  <>
                                    <span>•</span>
                                    <span>Completed {new Date(act.completedAt).toLocaleDateString()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <span style={{
                            fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                            background: isCompleted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                            color: isCompleted ? 'var(--cyber-emerald)' : 'var(--cyber-amber)'
                          }}>
                            {act.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 3: Technologies & Skills */}
              {activeTab === 'skills' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--cyber-cyan)' }}>
                      Technologies Integrated
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(project.technologies || []).map((tech, idx) => (
                        <span key={idx} style={{
                          padding: '6px 12px', borderRadius: '8px',
                          background: 'rgba(0, 242, 254, 0.08)', border: '1px solid rgba(0, 242, 254, 0.25)',
                          color: 'var(--cyber-cyan)', fontSize: '12.5px', fontWeight: 600
                        }}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--cyber-purple, #a855f7)' }}>
                      Demonstrated Competencies (Elevates Verified Skills)
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(project.skills || []).map((skill, idx) => (
                        <span key={idx} style={{
                          padding: '6px 12px', borderRadius: '8px',
                          background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)',
                          color: 'var(--cyber-purple, #a855f7)', fontSize: '12.5px', fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: '6px'
                        }}>
                          <ShieldCheck size={13} /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: NEXUS AI Project Insights */}
              {activeTab === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {aiInsights ? (
                    <>
                      <div style={{
                        padding: '16px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(0,242,254,0.06), rgba(168,85,247,0.06))',
                        border: '1px solid rgba(0,242,254,0.2)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyber-cyan)', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                          <Sparkles size={16} />
                          <span>AI Evaluated Strengths</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {aiInsights.projectStrengths.map((str, i) => (
                            <li key={i}>{str}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{
                        padding: '16px', borderRadius: '12px',
                        background: 'rgba(234, 179, 8, 0.05)',
                        border: '1px solid rgba(234, 179, 8, 0.2)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyber-amber)', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                          <AlertTriangle size={16} />
                          <span>Recommended Engineering Improvements</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {aiInsights.recommendedProjectImprovements.map((imp, i) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{
                        padding: '16px', borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.05)',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyber-emerald)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                          <Award size={16} />
                          <span>Recommended Next Project</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {aiInsights.recommendedNextProject}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      Generating project intelligence telemetry...
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
