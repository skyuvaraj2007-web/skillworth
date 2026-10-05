import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  XCircle,
  Eye,
  Star,
  ChevronRight,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function CompanyApplications({
  applications = [],
  onStageChange,
  onSelectCandidate,
  onShowToast,
  defaultTab = 'All'
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || 'All');
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  // Available Stages
  const stages = ['All', 'New', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];

  // Dynamic Pipeline summary counts calculated from actual applications
  const stageMetrics = useMemo(() => {
    const total = applications.length;
    const countByStage = (stageName) => applications.filter(a => {
      const s = (a.stage || a.status || '').toUpperCase();
      return s === stageName.toUpperCase() || s.includes(stageName.toUpperCase());
    }).length;

    return [
      { label: 'APPLIED', count: total, color: '#3B82F6' },
      { label: 'SCREENED', count: countByStage('REVIEW') + countByStage('SCREEN'), color: '#00D4FF' },
      { label: 'SHORTLISTED', count: countByStage('SHORTLIST'), color: '#8B5CF6' },
      { label: 'INTERVIEW', count: countByStage('INTERVIEW'), color: '#F59E0B' },
      { label: 'SELECTED', count: countByStage('SELECT') + countByStage('HIRE'), color: '#10B981' }
    ];
  }, [applications]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      // Stage Tab
      if (activeTab !== 'All') {
        const appStageNorm = (app.stage || 'New').toLowerCase();
        const tabNorm = activeTab.toLowerCase();
        if (appStageNorm !== tabNorm) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const candMatch = (app.candidateName || app.studentName || app.candidate || '').toLowerCase().includes(q);
        const oppMatch = (app.opportunityTitle || app.role || app.roleTitle || '').toLowerCase().includes(q);
        const colMatch = (app.studentCollegeName || app.college || '').toLowerCase().includes(q);
        if (!candMatch && !oppMatch && !colMatch) return false;
      }

      return true;
    });
  }, [applications, activeTab, searchQuery]);

  const handleAdvanceStage = (app, currentStage) => {
    const sequence = ['New', 'Under Review', 'Shortlisted', 'Interview', 'Selected'];
    const currentIdx = sequence.indexOf(currentStage);
    const nextStage = currentIdx >= 0 && currentIdx < sequence.length - 1 ? sequence[currentIdx + 1] : 'Selected';

    onStageChange(app.applicationId || app.id, nextStage);
    if (onShowToast) {
      onShowToast({
        title: 'Stage Advanced',
        message: `${app.candidateName || app.candidate || 'Candidate'} advanced to "${nextStage}".`,
        type: 'success'
      });
    }
  };

  const handleRejectStage = (app) => {
    onStageChange(app.applicationId || app.id, 'Rejected');
    if (onShowToast) {
      onShowToast({
        title: 'Application Rejected',
        message: `${app.candidateName || app.candidate || 'Candidate'} moved to Rejected.`,
        type: 'info'
      });
    }
  };

  return (
    <div className="comp-stack">
      {/* ── TOP TELEMETRY TAG ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div className="comp-telemetry-tag">
          <span>SKILLNEXUS ENTERPRISE</span>
          <span>//</span>
          <span>CANDIDATE APPLICATIONS PIPELINE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="comp-badge comp-badge-emerald">
            {filteredApps.length} CANDIDATES IN CURRENT VIEW
          </span>
        </div>
      </div>

      {/* Screen Header */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
          Application Pipeline &amp; Funnel Tracking
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94A3B8)', marginTop: '4px', margin: 0 }}>
          Manage applicants through all 6 hiring funnel stages with continuous evidence verification.
        </p>
      </div>

      {/* Pipeline Stages Tracker Banner */}
      <div className="comp-card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '14px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hiring Pipeline Progression
          </span>
          <span style={{ fontSize: '11px', color: '#00D4FF', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{applications.length} Total Inflow</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {stageMetrics.map((sm, index) => (
            <div
              key={sm.label}
              style={{
                padding: '12px 14px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted, #94A3B8)', textTransform: 'uppercase' }}>
                  {sm.label}
                </span>
                {index < stageMetrics.length - 1 && (
                  <ArrowRight size={12} style={{ color: 'var(--text-muted, #64748B)' }} />
                )}
              </div>
              <div style={{ marginTop: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: sm.color }}>
                  {sm.count.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
                  backgroundColor: sm.color
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '14px', paddingBottom: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{
          display: 'flex', padding: '3px', borderRadius: '10px',
          background: 'rgba(10, 18, 36, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)',
          overflowX: 'auto', maxWidth: '100%'
        }}>
          {stages.map(stage => (
            <button
              key={stage}
              type="button"
              onClick={() => setActiveTab(stage)}
              style={{
                padding: '6px 13px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                background: activeTab === stage ? 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(59,130,246,0.2) 100%)' : 'transparent',
                color: activeTab === stage ? '#00D4FF' : 'var(--text-muted, #94A3B8)'
              }}
            >
              {stage}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #94A3B8)' }} />
          <input
            type="text"
            placeholder="Search candidate, role or college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="company-input"
            style={{ width: '100%', paddingLeft: '32px' }}
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="comp-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="company-table-container">
          <table className="company-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Opportunity</th>
                <th>College</th>
                <th>AI Match</th>
                <th>Applied On</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted, #94A3B8)' }}>
                    {activeTab === 'Shortlisted'
                      ? 'No candidates have been shortlisted yet.'
                      : applications.length === 0 ? 'No applications yet.' : 'No candidates available yet in this stage.'}
                  </td>
                </tr>
              ) : (
                filteredApps.map(app => {
                  const candidateName = app.candidateName || app.studentName || app.candidate || 'Candidate';
                  const role = app.opportunityTitle || app.roleTitle || app.role || 'Opportunity';
                  const college = app.studentCollegeName ? (app.studentCollegeName.length > 18 ? app.studentCollegeName.split(' ').map(w => w[0]).join('').slice(0, 8) : app.studentCollegeName) : 'Campus';
                  const match = app.matchScore != null ? app.matchScore : (app.match != null ? app.match : 0);
                  const stage = app.stage || 'New';
                  const date = app.appliedAt
                    ? new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : (app.date || 'Recent');

                  return (
                    <tr key={app.applicationId || app.id} style={{ transition: 'background 0.2s ease' }}>
                      {/* Candidate */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'rgba(10, 18, 36, 0.9)', border: '1px solid rgba(0, 212, 255, 0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '12px', fontWeight: 800
                          }}>
                            {candidateName.slice(0, 1)}
                          </div>
                          <div>
                            <span style={{ fontWeight: 700, color: '#fff', display: 'block', lineHeight: 1.2 }}>{candidateName}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)' }}>{app.department || 'CSE'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Opportunity */}
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary, #F8FAFC)' }}>{role}</span>
                      </td>

                      {/* College */}
                      <td>
                        <span style={{ color: 'var(--text-secondary, #94A3B8)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{college}</span>
                      </td>

                      {/* AI Match */}
                      <td>
                        <span className="comp-badge comp-badge-cyan">
                          <Sparkles size={11} />
                          {match}%
                        </span>
                      </td>

                      {/* Applied On */}
                      <td>
                        <span style={{ color: 'var(--text-muted, #94A3B8)', fontSize: '12px' }}>{date}</span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`comp-badge ${
                          stage === 'Selected' ? 'comp-badge-emerald' :
                          stage === 'Interview' ? 'comp-badge-cyan' :
                          stage === 'Shortlisted' ? 'comp-badge-purple' :
                          stage === 'Rejected' ? 'comp-badge-rose' : 'comp-badge-amber'
                        }`}>
                          {stage}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          {onSelectCandidate && (
                            <button
                              type="button"
                              onClick={() => onSelectCandidate(app)}
                              className="btn-cyber-outline"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Review Candidate Profile"
                            >
                              <Eye size={12} />
                              <span>Review</span>
                            </button>
                          )}

                          {stage !== 'Shortlisted' && stage !== 'Selected' && (
                            <button
                              type="button"
                              onClick={() => onStageChange(app.applicationId || app.id, 'Shortlisted')}
                              className="btn-cyber-outline"
                              style={{ padding: '4px 6px', color: '#F59E0B', borderColor: 'rgba(245,158,11,0.3)' }}
                              title="Shortlist Candidate"
                            >
                              <Star size={12} />
                            </button>
                          )}

                          {stage !== 'Selected' && stage !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceStage(app, stage)}
                              className="btn-cyber-outline"
                              style={{ padding: '4px 8px', fontSize: '11px', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)' }}
                              title="Advance to Next Stage"
                            >
                              Advance
                            </button>
                          )}

                          {stage !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() => handleRejectStage(app)}
                              className="btn-cyber-outline"
                              style={{ padding: '4px 8px', fontSize: '11px', color: '#F43F5E', borderColor: 'rgba(244,63,94,0.3)' }}
                              title="Reject Application"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
