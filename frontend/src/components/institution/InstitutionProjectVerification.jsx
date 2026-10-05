import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderGit2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  RotateCcw,
  GitBranch,
  ExternalLink,
  Code,
  Users,
  Check,
  Send,
  Building,
  Calendar,
  Sparkles,
  BarChart2
} from 'lucide-react';
import ProjectDetailModal from '../student/ProjectDetailModal';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('nexus_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export default function InstitutionProjectVerification({ onShowToast }) {
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState({
    total: 0,
    pending: 0,
    underReview: 0,
    verified: 0,
    rejected: 0,
    needsCorrection: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reason Modal State (for Rejection / Correction)
  const [activeActionModal, setActiveActionModal] = useState(null); // { type: 'reject' | 'correction', project: obj }
  const [actionReason, setActionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Detail Modal State
  const [viewingProjectId, setViewingProjectId] = useState(null);

  const fetchQueueAndAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'ALL') q.append('status', statusFilter);
      if (searchQuery.trim()) q.append('search', searchQuery.trim());

      const [queueRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/academic/projects/queue?${q.toString()}`, {
          headers: getAuthHeaders(),
          credentials: 'include'
        }),
        fetch(`${API_BASE}/academic/projects/analytics`, {
          headers: getAuthHeaders(),
          credentials: 'include'
        })
      ]);

      if (queueRes.ok) {
        const qData = await queueRes.json();
        setProjects(qData.data || []);
      }
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setAnalytics(sData.data || {});
      }
    } catch (err) {
      console.error('Failed to load institution projects queue:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchQueueAndAnalytics();
  }, [fetchQueueAndAnalytics]);

  const handleVerify = async (project) => {
    try {
      const res = await fetch(`${API_BASE}/academic/projects/${encodeURIComponent(project.id)}/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ notes: 'Verified and approved by Academic Review Board.' })
      });
      if (res.ok) {
        if (onShowToast) {
          onShowToast({
            title: 'Project Verified',
            message: `"${project.title}" by ${project.studentName} authenticated and linked to student skill evidence.`,
            type: 'success'
          });
        }
        fetchQueueAndAnalytics();
      } else {
        const err = await res.json();
        if (onShowToast) onShowToast({ title: 'Verification Failed', message: err.message, type: 'error' });
      }
    } catch (e) {
      if (onShowToast) onShowToast({ title: 'Error', message: e.message, type: 'error' });
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionReason.trim() || !activeActionModal) return;

    setIsProcessing(true);
    const { type, project } = activeActionModal;
    const endpoint = type === 'reject' ? 'reject' : 'request-correction';

    try {
      const res = await fetch(`${API_BASE}/academic/projects/${encodeURIComponent(project.id)}/${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reason: actionReason.trim() })
      });

      if (res.ok) {
        if (onShowToast) {
          onShowToast({
            title: type === 'reject' ? 'Project Declined' : 'Correction Requested',
            message: `Review feedback dispatched to ${project.studentName}.`,
            type: type === 'reject' ? 'warning' : 'info'
          });
        }
        setActiveActionModal(null);
        setActionReason('');
        fetchQueueAndAnalytics();
      } else {
        const err = await res.json();
        if (onShowToast) onShowToast({ title: 'Action Failed', message: err.message, type: 'error' });
      }
    } catch (e) {
      if (onShowToast) onShowToast({ title: 'Error', message: e.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: 'rgba(16, 185, 129, 0.15)', color: 'var(--cyber-emerald, #10b981)',
            padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700
          }}>
            <CheckCircle2 size={12} /> VERIFIED
          </span>
        );
      case 'PENDING':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: 'rgba(234, 179, 8, 0.15)', color: 'var(--cyber-amber, #f59e0b)',
            padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700
          }}>
            <Clock size={12} /> PENDING REVIEW
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
            padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700
          }}>
            <XCircle size={12} /> REJECTED
          </span>
        );
      case 'NEEDS_CORRECTION':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: 'rgba(249, 115, 22, 0.15)', color: '#f97316',
            padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700
          }}>
            <AlertTriangle size={12} /> CORRECTION REQUESTED
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted, #94a3b8)',
            padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700
          }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Header */}
      <div style={{
        background: 'var(--bg-card, #0f172a)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
        borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyber-cyan)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <FolderGit2 size={16} />
            <span>Academic Validation Portal • Strict Multi-Tenant Isolation</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 2px' }}>
            Student Project Verification Queue
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Authenticate capstones, code repositories, and system architecture to convert student builds into trusted industry credentials.
          </p>
        </div>

        <button
          onClick={fetchQueueAndAnalytics}
          className="btn-cyber-ghost"
          style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RotateCcw size={14} /> Refresh Queue
        </button>
      </div>

      {/* Real Database Analytics Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px'
      }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL PROJECTS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{analytics.total}</div>
        </div>
        <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyber-amber)' }}>PENDING REVIEW</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-amber)', marginTop: '4px' }}>{analytics.pending}</div>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyber-emerald)' }}>VERIFIED</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-emerald)', marginTop: '4px' }}>{analytics.verified}</div>
        </div>
        <div style={{ background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#f97316' }}>NEEDS CORRECTION</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f97316', marginTop: '4px' }}>{analytics.needsCorrection}</div>
        </div>
        <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>REJECTED</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>{analytics.rejected}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
        background: 'var(--bg-card)', padding: '14px 18px', borderRadius: '12px',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by student name, roll number, project title, or technologies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px',
              background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
              color: '#fff', fontSize: '13px', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'PENDING', 'VERIFIED', 'NEEDS_CORRECTION', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '7px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                border: statusFilter === st ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                background: statusFilter === st ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                color: statusFilter === st ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List / Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          Loading review queue...
        </div>
      ) : projects.length === 0 ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center', background: 'var(--bg-card)',
          borderRadius: '16px', border: '1px solid var(--border-subtle)'
        }}>
          <FolderGit2 size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No projects in verification queue
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            When students from your mapped institution submit project experiences, they will appear here for academic validation.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {projects.map((proj) => (
            <div
              key={proj.id}
              style={{
                background: 'var(--bg-card, #0f172a)', border: '1px solid var(--border-subtle)',
                borderRadius: '14px', padding: '18px 22px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {getStatusBadge(proj.verificationStatus)}
                  <span style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontWeight: 700 }}>
                    {proj.category || 'SOFTWARE ENGINEERING'}
                  </span>
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 4px' }}>
                  {proj.title}
                </h3>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>
                    Student: {proj.studentName || 'Student'} ({proj.studentId})
                  </span>
                  <span>•</span>
                  <span>{proj.role || 'Developer'}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Activities: {proj.activities?.length || 0} recorded
                  </span>
                </div>

                {/* Tech Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {(proj.technologies || []).slice(0, 5).map((t, idx) => (
                    <span key={idx} style={{
                      padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)',
                      fontSize: '11px', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      {t}
                    </span>
                  ))}
                  {(proj.skills || []).slice(0, 3).map((sk, idx) => (
                    <span key={idx} style={{
                      padding: '2px 8px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.08)',
                      fontSize: '11px', color: 'var(--cyber-purple, #a855f7)', border: '1px solid rgba(168, 85, 247, 0.2)'
                    }}>
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setViewingProjectId(proj.id)}
                  className="btn-cyber-ghost"
                  style={{ padding: '7px 12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Eye size={14} /> Review Details
                </button>

                {proj.repoUrl && (
                  <a
                    href={proj.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-cyber-ghost"
                    style={{ padding: '7px 10px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <GitBranch size={13} /> Repo
                  </a>
                )}

                {proj.verificationStatus !== 'VERIFIED' && (
                  <button
                    onClick={() => handleVerify(proj)}
                    className="btn-cyber-primary"
                    style={{ padding: '7px 14px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ShieldCheck size={14} /> Verify Project
                  </button>
                )}

                {proj.verificationStatus !== 'VERIFIED' && (
                  <>
                    <button
                      onClick={() => setActiveActionModal({ type: 'correction', project: proj })}
                      style={{
                        padding: '7px 12px', fontSize: '12.5px', borderRadius: '6px',
                        background: 'rgba(249, 115, 22, 0.12)', border: '1px solid rgba(249, 115, 22, 0.25)',
                        color: '#f97316', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <RotateCcw size={13} /> Correction
                    </button>

                    <button
                      onClick={() => setActiveActionModal({ type: 'reject', project: proj })}
                      style={{
                        padding: '7px 12px', fontSize: '12.5px', borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mandatory Reason Modal for Rejection / Correction */}
      {activeActionModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '520px', background: 'var(--bg-card, #0f172a)',
            border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              {activeActionModal.type === 'reject' ? 'Decline Project Verification' : 'Request Project Correction'}
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Please provide clear, structured feedback so the student knows what needs improvement.
            </p>

            <form onSubmit={handleActionSubmit}>
              <textarea
                required
                rows={4}
                placeholder={activeActionModal.type === 'reject' ? 'Explain why this project cannot be accredited...' : 'Specify what additional proof or benchmark is required...'}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                style={{
                  width: '100%', padding: '12px', borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                  color: '#fff', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '16px'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setActiveActionModal(null); setActionReason(''); }}
                  className="btn-cyber-ghost"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-cyber-primary"
                  style={{
                    padding: '8px 18px', fontSize: '13px',
                    background: activeActionModal.type === 'reject' ? '#ef4444' : '#f97316',
                    borderColor: activeActionModal.type === 'reject' ? '#ef4444' : '#f97316'
                  }}
                >
                  {isProcessing ? 'Submitting...' : 'Confirm Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {viewingProjectId && (
        <ProjectDetailModal
          projectId={viewingProjectId}
          isOpen={Boolean(viewingProjectId)}
          onClose={() => setViewingProjectId(null)}
          onShowToast={onShowToast}
          onProjectUpdated={fetchQueueAndAnalytics}
        />
      )}
    </div>
  );
}
