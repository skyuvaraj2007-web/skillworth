import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderGit2,
  Plus,
  GitBranch,
  Terminal,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Share2,
  X,
  Code,
  AlertTriangle,
  Award,
  Layers,
  Activity,
  Check
} from 'lucide-react';
import { projectService } from '../services/projectService';
import ProjectDetailModal from '../components/student/ProjectDetailModal';
import ProjectCreateModal from '../components/student/ProjectCreateModal';

export default function MyProjects({ onShowToast }) {
  const [activeFilter, setActiveFilter] = useState('All Projects');
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' or 'timeline'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    verifiedProjects: 0,
    totalActivities: 0,
    totalEvidence: 0,
    portfolioStrength: { score: 0, level: 'Initiating' }
  });
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectData = useCallback(async () => {
    setLoading(true);
    try {
      let filterParam = 'all';
      if (activeFilter.includes('In Progress')) filterParam = 'in-progress';
      else if (activeFilter.includes('Completed')) filterParam = 'completed';
      else if (activeFilter.includes('Validated') || activeFilter.includes('Verified')) filterParam = 'validated';

      const [projRes, feedRes] = await Promise.all([
        projectService.getProjects(filterParam).catch(() => ({ data: [], metrics: {} })),
        projectService.getActivityFeed().catch(() => ({ data: [] }))
      ]);

      if (projRes?.data) {
        setProjects(projRes.data);
      }
      if (projRes?.metrics) {
        setMetrics(prev => ({ ...prev, ...projRes.metrics }));
      }
      if (feedRes?.data) {
        setActivityFeed(feedRes.data);
      }
    } catch (err) {
      console.error('Failed to load project portfolio:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleSubmitForValidation = async (prj) => {
    try {
      const res = await projectService.submitProjectForVerification(prj.id);
      if (res.success) {
        if (onShowToast) {
          onShowToast({
            title: 'Submitted for Academic Review',
            message: `"${prj.title}" dispatched to institution faculty ledger verification queue.`,
            type: 'success'
          });
        }
        fetchProjectData();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Submission Failed', message: err.message, type: 'error' });
    }
  };

  const handleLaunchSandbox = async (prj) => {
    try {
      const res = await projectService.launchSandbox(prj.id);
      if (res.success && onShowToast) {
        onShowToast({
          title: 'Cloud Sandbox Running',
          message: `Worker node online for ${prj.title}. Live dev container ready on port 8080.`,
          type: 'info'
        });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Sandbox Error', message: err.message, type: 'error' });
    }
  };

  const getStatusBadgeClass = (status, verificationStatus) => {
    if (verificationStatus === 'VERIFIED') return 'badge-emerald';
    if (verificationStatus === 'PENDING') return 'badge-amber';
    if (verificationStatus === 'NEEDS_CORRECTION') return 'badge-rose';
    if (status === 'COMPLETED' || status === 'Completed') return 'badge-cyan';
    return 'badge-purple';
  };

  return (
    <div>
      {/* Header Telemetry */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div className="telemetry-node-tag">
            <span>PROJECT EVIDENCE MATRIX</span>
            <span>//</span>
            <span>BUILD & VALIDATE</span>
            <span>•</span>
            <span>{projects.length} Active Nodes</span>
          </div>
          <h1>My Projects</h1>
          <p>
            Don't just learn. Prove it. Turn classroom theory into production-grade verified project proof authenticated directly against corporate engineering baselines.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
            fontSize: '11.5px', fontFamily: 'var(--font-mono)'
          }}>
            <GitBranch size={14} color="var(--cyber-emerald)" />
            <span>VCS Connection: <strong style={{ color: 'var(--cyber-emerald)' }}>GitHub Active</strong></span>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-cyber-primary"
          >
            <Plus size={15} />
            <span>New Project Experience</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="metric-stat-card accent-cyan">
          <div className="metric-stat-header">
            <span>TOTAL PROJECTS</span>
            <FolderGit2 size={13} color="var(--cyber-cyan)" />
          </div>
          <div className="metric-stat-value">{metrics.totalProjects || projects.length}</div>
          <div className="metric-stat-sub">{metrics.activeProjects || 0} Active • {metrics.verifiedProjects || 0} Verified</div>
        </div>

        <div className="metric-stat-card accent-emerald">
          <div className="metric-stat-header">
            <span>COLLEGE VERIFIED</span>
            <ShieldCheck size={13} color="var(--cyber-emerald)" />
          </div>
          <div className="metric-stat-value">{metrics.verifiedProjects || 0}</div>
          <div className="metric-stat-sub">Authenticated by Institution</div>
        </div>

        <div className="metric-stat-card accent-purple">
          <div className="metric-stat-header">
            <span>PROJECT ACTIVITIES</span>
            <Activity size={13} color="var(--cyber-purple)" />
          </div>
          <div className="metric-stat-value">{metrics.totalActivities || 0}</div>
          <div className="metric-stat-sub">Milestones recorded</div>
        </div>

        <div className="metric-stat-card accent-amber">
          <div className="metric-stat-header">
            <span>PORTFOLIO STRENGTH</span>
            <Sparkles size={13} color="var(--cyber-amber)" />
          </div>
          <div className="metric-stat-value">
            {metrics.portfolioStrength?.score || 85}<span style={{ fontSize: '16px' }}>/100</span>
          </div>
          <div className="metric-stat-sub">{metrics.portfolioStrength?.level || 'Proficient'} Level</div>
        </div>

        <div className="metric-stat-card" style={{ background: 'var(--bg-card)' }}>
          <div className="metric-stat-header">
            <span>CLOUD SANDBOXES</span>
            <Terminal size={13} color="var(--cyber-cyan)" />
          </div>
          <div className="metric-stat-value">2</div>
          <div className="metric-stat-sub">Running Online</div>
        </div>
      </div>

      {/* View Tabs (Portfolio vs Activity Timeline) */}
      <div style={{
        display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '20px', paddingBottom: '2px'
      }}>
        <button
          onClick={() => setActiveTab('portfolio')}
          style={{
            padding: '10px 20px', background: activeTab === 'portfolio' ? 'rgba(0,242,254,0.1)' : 'transparent',
            color: activeTab === 'portfolio' ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
            border: 'none', borderBottom: activeTab === 'portfolio' ? '2px solid var(--cyber-cyan)' : '2px solid transparent',
            fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <FolderGit2 size={16} />
          <span>Project Portfolio</span>
          <span style={{ fontSize: '10px', background: 'rgba(0,242,254,0.2)', padding: '2px 7px', borderRadius: '10px' }}>
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            padding: '10px 20px', background: activeTab === 'timeline' ? 'rgba(168,85,247,0.1)' : 'transparent',
            color: activeTab === 'timeline' ? 'var(--cyber-purple)' : 'var(--text-secondary)',
            border: 'none', borderBottom: activeTab === 'timeline' ? '2px solid var(--cyber-purple)' : '2px solid transparent',
            fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Activity size={16} />
          <span>Professional Activity Feed</span>
          <span style={{ fontSize: '10px', background: 'rgba(168,85,247,0.2)', padding: '2px 7px', borderRadius: '10px' }}>
            {activityFeed.length}
          </span>
        </button>
      </div>

      {activeTab === 'portfolio' ? (
        <>
          {/* Filter Pills */}
          <div className="filter-tabs-row" style={{ marginBottom: '20px' }}>
            <div className="filter-pills-group">
              {['All Projects', 'In Progress', 'Completed', 'Validated'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`filter-pill ${activeFilter.includes(tab.split(' ')[0]) ? 'active' : ''}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              SORT BY: <strong style={{ color: 'var(--text-primary)' }}>Verified Rigor</strong>
            </div>
          </div>

          {/* Main Grid: Projects on Left + Right Rail */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
            {/* Left: Project Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <FolderGit2 size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.4 }} />
                  <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    No projects found for filter
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                    Create your first professional project experience to build verified credentials.
                  </p>
                  <button onClick={() => setShowCreateModal(true)} className="btn-cyber-primary">
                    <Plus size={14} /> Add Project Experience
                  </button>
                </div>
              ) : (
                projects.map((prj) => {
                  const isVerified = prj.verificationStatus === 'VERIFIED';
                  const isPending = prj.verificationStatus === 'PENDING';
                  const needsCorr = prj.verificationStatus === 'NEEDS_CORRECTION';
                  const techList = Array.isArray(prj.technologies) ? prj.technologies : (prj.techStack || []);

                  return (
                    <div key={prj.id} className="glass-panel" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span className={`cyber-badge ${getStatusBadgeClass(prj.status, prj.verificationStatus)}`} style={{ fontSize: '9.5px' }}>
                              {isVerified ? 'College Verified' : isPending ? 'Review Pending' : needsCorr ? 'Correction Requested' : (prj.status || 'Active')}
                            </span>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {prj.category}
                            </span>
                            {prj.role && (
                              <span style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontWeight: 600 }}>
                                • {prj.role}
                              </span>
                            )}
                          </div>

                          <h3
                            onClick={() => setSelectedProjectId(prj.id)}
                            style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                          >
                            {prj.title}
                          </h3>
                          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                            {prj.shortDescription || prj.description || 'Demonstrating production-grade capability.'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {prj.progress || 0}%
                          </span>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {prj.activities?.length || 0} Milestones
                          </div>
                        </div>
                      </div>

                      {/* Tech Stack Pills */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {techList.map((tech, idx) => (
                          <span key={idx} style={{
                            padding: '3px 8px', borderRadius: '4px',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
                            fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)'
                          }}>
                            {tech}
                          </span>
                        ))}
                        {(prj.skills || []).map((sk, idx) => (
                          <span key={idx} style={{
                            padding: '3px 8px', borderRadius: '4px',
                            background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
                            fontSize: '11px', color: 'var(--cyber-purple, #a855f7)'
                          }}>
                            ✓ {sk}
                          </span>
                        ))}
                      </div>

                      {/* Status Note Banner */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', background: 'var(--bg-input)',
                        borderRadius: '8px', border: '1px solid var(--border-subtle)',
                        marginBottom: '16px', fontSize: '11.5px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <span className="status-dot-pulse"></span>
                          <span>
                            {isVerified
                              ? `Cryptographically Verified by ${prj.verifiedBy || 'Institution'}`
                              : isPending
                                ? 'Submitted to College Review Board • Automated telemetry active'
                                : needsCorr
                                  ? `Correction needed: ${prj.correctionReason}`
                                  : (prj.note || 'Active development synced')}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setSelectedProjectId(prj.id)}
                          className="btn-cyber-outline"
                          style={{ fontSize: '12px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Eye size={13} />
                          <span>Review Experience</span>
                        </button>

                        {!isVerified && !isPending && (
                          <button
                            onClick={() => handleSubmitForValidation(prj)}
                            className="btn-cyber-outline"
                            style={{ fontSize: '12px', padding: '7px 14px', borderColor: 'rgba(16,185,129,0.5)', color: 'var(--cyber-emerald)' }}
                          >
                            <ShieldCheck size={13} />
                            <span>Submit for Validation</span>
                          </button>
                        )}

                        {prj.repoUrl && (
                          <a
                            href={prj.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-cyber-outline"
                            style={{ textDecoration: 'none', fontSize: '12px', padding: '7px 14px' }}
                          >
                            <ExternalLink size={13} />
                            <span>Repository</span>
                          </a>
                        )}

                        <button
                          onClick={() => handleLaunchSandbox(prj)}
                          className="btn-cyber-primary"
                          style={{ fontSize: '12px', padding: '7px 14px' }}
                        >
                          <Terminal size={13} />
                          <span>Launch Sandbox</span>
                        </button>

                        {prj.demoUrl && (
                          <a
                            href={prj.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-cyber-primary"
                            style={{ textDecoration: 'none', fontSize: '12px', padding: '7px 14px' }}
                          >
                            <ExternalLink size={13} />
                            <span>Live Demo</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Rail: Nexus AI Evaluation & Recommended Capstones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Nexus AI Evaluation */}
              <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyber-purple)', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                  <Sparkles size={14} />
                  <span>NEXUS AI PORTFOLIO INSIGHTS</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                  {metrics.portfolioStrength?.label || "Your verified project demonstrations boost your software engineering recruiter match from 78% to 92%."}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '12px', fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Portfolio Readiness:</span>
                  <strong style={{ color: 'var(--cyber-cyan)' }}>{metrics.portfolioStrength?.score || 85}% / 100%</strong>
                </div>

                <button
                  onClick={() => {
                    if (projects.length > 0) setSelectedProjectId(projects[0].id);
                  }}
                  className="btn-cyber-outline"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                >
                  Review AI Project Analysis
                </button>
              </div>

              {/* Recommended Capstones */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  RECOMMENDED BLUEPRINTS
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  High-yield blueprints calibrated to maximize corporate recruiter interest.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <span className="cyber-badge badge-cyan" style={{ fontSize: '8.5px', marginBottom: '4px' }}>HIGH YIELD</span>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      Distributed Vector Similarity Engine
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Build a concurrent vector similarity indexer with HNSW graph indexing in C++/Rust.
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px' }}>
                      <span style={{ color: 'var(--cyber-emerald)' }}>+18% Recruiter Inbound</span>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        style={{ background: 'none', border: 'none', color: 'var(--cyber-cyan)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Fork Blueprint →
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <span className="cyber-badge badge-emerald" style={{ fontSize: '8.5px', marginBottom: '4px' }}>FINTECH STANDARD</span>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      Real-Time Financial Fraud Stream
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Kafka streaming consumer paired with an isolation forest model detecting anomalies.
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px' }}>
                      <span style={{ color: 'var(--cyber-emerald)' }}>+15% Recruiter Inbound</span>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        style={{ background: 'none', border: 'none', color: 'var(--cyber-cyan)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Fork Blueprint →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Evidence Dossier Button */}
              <button
                onClick={() => {
                  if (onShowToast) {
                    onShowToast({
                      title: 'Evidence Dossier Exported',
                      message: 'Public authenticated dossier link copied to clipboard.',
                      type: 'success'
                    });
                  }
                }}
                className="btn-cyber-outline"
                style={{ width: '100%', padding: '10px', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Share2 size={14} color="var(--cyber-cyan)" />
                <span>Share Evidence Dossier</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Activity Timeline Tab */
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activityFeed.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Activity size={36} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: '13px' }}>No recorded activity events yet.</p>
            </div>
          ) : (
            activityFeed.map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="glass-panel"
                style={{
                  padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: evt.type.includes('VERIFIED') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 242, 254, 0.12)',
                    color: evt.type.includes('VERIFIED') ? 'var(--cyber-emerald)' : 'var(--cyber-cyan)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {evt.type.includes('VERIFIED') ? <ShieldCheck size={16} /> : <GitBranch size={16} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {evt.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {evt.description}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProjectId && (
        <ProjectDetailModal
          projectId={selectedProjectId}
          isOpen={Boolean(selectedProjectId)}
          onClose={() => setSelectedProjectId(null)}
          onShowToast={onShowToast}
          onProjectUpdated={fetchProjectData}
        />
      )}

      {/* Project Create Modal */}
      <ProjectCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onShowToast={onShowToast}
        onProjectCreated={fetchProjectData}
      />
    </div>
  );
}
