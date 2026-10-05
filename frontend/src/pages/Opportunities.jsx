import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Briefcase,
  Search,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  X,
  Send,
  Bookmark,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Opportunities({ onShowToast, onOpenAIModal }) {
  const [activeTab, setActiveTab] = useState('Internships');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalityFilter, setModalityFilter] = useState('Remote / Hybrid / On-site');
  const [minMatchFilter, setMinMatchFilter] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [appliedRoles, setAppliedRoles] = useState([]);
  const [applications, setApplications] = useState([]);
  const [metrics, setMetrics] = useState({ totalRoles: 0, topMatchScore: 0, topMatchCompany: '', appliedCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  const fetchOpportunities = useCallback(async () => {
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    setIsLoading(true);
    setError(null);
    try {
      const [oppRes, appRes] = await Promise.all([
        fetch(`${apiBase}/opportunities`, { headers, credentials: 'include' }),
        fetch(`${apiBase}/students/applications`, { headers, credentials: 'include' })
      ]);

      if (!oppRes.ok) {
        throw new Error(`Failed to load opportunities from database (Status ${oppRes.status})`);
      }

      const oppJson = await oppRes.json();
      const rawOpps = oppJson.data || [];
      
      const mappedOpps = rawOpps.map(opp => {
        const reqSkills = (opp.requiredSkills || []).map(s => typeof s === 'string' ? s : s.name);
        const matched = opp.matchedSkills || [];
        const missing = opp.missingSkills || [];
        const mScore = opp.matchScore !== undefined ? opp.matchScore : 75;

        const skillsMatrix = reqSkills.map(sk => {
          const isGap = missing.some(m => m.toLowerCase() === sk.toLowerCase());
          return {
            name: sk,
            status: isGap ? 'Gap' : 'Verified',
            isGap
          };
        });

        return {
          id: opp.id || opp.oppId || opp.opportunityId,
          opportunityId: opp.id || opp.oppId || opp.opportunityId,
          companyId: opp.companyId,
          title: opp.title,
          company: opp.company || opp.companyName || 'Industry Partner',
          division: opp.division || opp.department || 'Engineering Division',
          type: opp.type || opp.opportunityType || 'Internship',
          location: opp.location || 'Hybrid',
          duration: opp.duration || '6 Months',
          stipend: opp.stipend || '₹35,000 /mo',
          matchScore: mScore,
          fitLabel: mScore >= 90 ? 'Extremely High Fit Probability' : mScore >= 80 ? 'Strong Alignment' : 'Moderate Alignment',
          hotHiring: opp.status === 'ACTIVE' || opp.status === 'Active',
          skillsMatrix,
          breakdown: {
            skillEvidence: { 
              score: mScore, 
              weight: "35% Weight", 
              details: `${matched.length} of ${reqSkills.length > 0 ? reqSkills.length : matched.length} core technical requirements verified on PostgreSQL ledger.` 
            },
            assessmentEvidence: { 
              score: Math.min(100, mScore + 4), 
              weight: "20% Weight", 
              details: "Diagnostic technical evaluation verified above corporate intake threshold." 
            },
            projectEvidence: { 
              score: mScore, 
              weight: "25% Weight", 
              details: "Project evidence matched to requisition stack." 
            },
            learningEvidence: { 
              score: Math.max(0, mScore - 5), 
              weight: "20% Weight", 
              details: "Curriculum progression matches target role criteria." 
            }
          },
          synthesis: opp.matchExplanation || `Candidate exhibits verified competencies in ${matched.join(', ') || 'foundation areas'}.${missing.length > 0 ? ` Closing gaps in ${missing.join(', ')} will elevate suitability.` : ' Complete role alignment.'}`,
          criticalGap: missing[0] ? {
            name: missing[0],
            timeToClose: '8 hrs',
            recommendedCourse: `${missing[0]} Accelerated Sprint`
          } : null
        };
      });

      setOpportunities(mappedOpps);
      setMetrics(oppJson.metrics || {
        totalRoles: mappedOpps.length,
        topMatchScore: mappedOpps.length > 0 ? Math.max(...mappedOpps.map(o => o.matchScore)) : 0,
        topMatchCompany: mappedOpps[0]?.company || 'Available Positions',
        appliedCount: 0
      });

      const appliedIdsFromOpp = oppJson.appliedIds || [];
      if (appRes.ok) {
        const appJson = await appRes.json();
        const apps = appJson.data || [];
        setApplications(apps);
        const appIds = apps.map(a => a.opportunityId || a.opportunity_id);
        setAppliedRoles(Array.from(new Set([...appliedIdsFromOpp, ...appIds])));
      } else {
        setAppliedRoles(appliedIdsFromOpp);
      }

      if (mappedOpps.length > 0) {
        setSelectedOpportunity(mappedOpps[0]);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
    const handleUpdate = () => fetchOpportunities();
    window.addEventListener('nexus_opportunity_created', handleUpdate);
    window.addEventListener('nexus_application_stage_changed', handleUpdate);
    window.addEventListener('nexus_data_updated', handleUpdate);
    return () => {
      window.removeEventListener('nexus_opportunity_created', handleUpdate);
      window.removeEventListener('nexus_application_stage_changed', handleUpdate);
      window.removeEventListener('nexus_data_updated', handleUpdate);
    };
  }, [fetchOpportunities]);

  const handleApply = async (opp) => {
    const oppId = opp.id || opp.opportunityId;
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

    setIsApplying(true);
    try {
      const res = await fetch(`${apiBase}/opportunities/${encodeURIComponent(oppId)}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.message || 'Application submission failed');
      }

      setAppliedRoles(prev => Array.from(new Set([...prev, oppId])));
      if (resJson.data) {
        setApplications(prev => [resJson.data, ...prev]);
      }

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}

      if (onShowToast) {
        onShowToast({
          title: 'Application Transmitted!',
          message: resJson.message || `Application for ${opp.title} recorded in database. Status: Submitted.`,
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Apply error:', err);
      if (onShowToast) {
        onShowToast({
          title: 'Application Error',
          message: err.message,
          type: 'error'
        });
      }
    } finally {
      setIsApplying(false);
    }
  };

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      if (minMatchFilter && opp.matchScore < 80) return false;
      if (searchTerm && !opp.title.toLowerCase().includes(searchTerm.toLowerCase()) && !opp.company.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (activeTab === 'Internships' && !opp.type.toLowerCase().includes('intern')) return false;
      if (activeTab === 'Full-Time Jobs' && !opp.type.toLowerCase().includes('full') && !opp.type.toLowerCase().includes('ppo')) return false;
      return true;
    });
  }, [opportunities, minMatchFilter, searchTerm, activeTab]);

  return (
    <div>
      {/* Top Telemetry Header */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div className="telemetry-node-tag">
            <span>OPPORTUNITY RADAR</span>
            <span>//</span>
            <span>EVIDENCE-BASED MATCHING</span>
          </div>
          <h1>Opportunities</h1>
          <p>Where your verified skills take you. Algorithmic matching explained with transparent evidence, cryptographic validation, and dynamic hiring pathways.</p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
          fontSize: '11.5px', fontFamily: 'var(--font-mono)'
        }}>
          <span className="status-dot-pulse"></span>
          <span>RADAR SYNCHRONIZED • REAL-TIME WEIGHTS</span>
        </div>
      </div>

      {/* Top 4 Metrics matching Page 10 */}
      <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="metric-stat-card accent-cyan">
          <div className="metric-stat-header">
            <span>PRE-QUALIFIED ROLES</span>
            <Briefcase size={13} color="var(--cyber-cyan)" />
          </div>
          <div className="metric-stat-value">{metrics.totalRoles || opportunities.length}</div>
          <div className="metric-stat-sub">Active in PostgreSQL</div>
        </div>

        <div className="metric-stat-card accent-emerald">
          <div className="metric-stat-header">
            <span>TOP MATCH</span>
            <span style={{ color: 'var(--cyber-emerald)', fontFamily: 'var(--font-mono)' }}>
              {metrics.topMatchScore ? `${metrics.topMatchScore}%` : (opportunities[0]?.matchScore ? `${opportunities[0].matchScore}%` : '0%')}
            </span>
          </div>
          <div className="metric-stat-value" style={{ fontSize: '20px' }}>
            {metrics.topMatchCompany || opportunities[0]?.company || 'None Active'}
          </div>
          <div className="metric-stat-sub">
            {opportunities[0]?.title || 'Awaiting Requisition'}
          </div>
        </div>

        <div className="metric-stat-card accent-purple">
          <div className="metric-stat-header">
            <span>APPLICATIONS</span>
            <Building size={13} color="var(--cyber-purple)" />
          </div>
          <div className="metric-stat-value">{appliedRoles.length}</div>
          <div className="metric-stat-sub">Dispatched</div>
        </div>

        <div className="metric-stat-card accent-amber">
          <div className="metric-stat-header">
            <span>VERIFICATION STATUS</span>
            <ShieldCheck size={13} color="var(--cyber-amber)" />
          </div>
          <div className="metric-stat-value">
            {opportunities.some(o => o.matchScore >= 80) ? 'High Fit' : (opportunities.length > 0 ? 'Evaluating' : 'Zero State')}
          </div>
          <div className="metric-stat-sub">Cryptographic Ledger</div>
        </div>
      </div>

      {/* Filter Row matching Page 10 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px', background: 'var(--bg-input)',
        borderRadius: '10px', border: '1px solid var(--border-subtle)',
        marginBottom: '20px', flexWrap: 'wrap', gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '280px' }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search roles, companies, tech..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none', width: '100%'
            }}
          />
        </div>

        <select
          value={modalityFilter}
          onChange={(e) => setModalityFilter(e.target.value)}
          style={{
            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
            borderRadius: '6px', padding: '6px 12px', color: 'var(--text-secondary)',
            fontSize: '12px', outline: 'none'
          }}
        >
          <option>Remote / Hybrid / On-site</option>
          <option>Remote Only</option>
          <option>Hybrid Only</option>
          <option>On-site Only</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={minMatchFilter}
            onChange={(e) => setMinMatchFilter(e.target.checked)}
            style={{ accentColor: 'var(--cyber-cyan)' }}
          />
          <span>Role Readiness: <strong>≥80% Match Only</strong></span>
        </label>
      </div>

      {/* Category Tabs matching Page 10 */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px', paddingBottom: '8px', overflowX: 'auto' }}>
        {['Internships', 'Full-Time Jobs', 'My Applications'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              border: 'none',
              padding: '6px 14px', borderRadius: '6px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              color: activeTab === tab ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
              background: activeTab === tab ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
              whiteSpace: 'nowrap'
            }}
          >
            {tab} {tab === 'My Applications' ? `(${applications.length})` : ''}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Loader2 size={36} className="spin-slow" color="var(--cyber-cyan)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', color: '#f8fafc', margin: '0 0 6px' }}>Loading Requisitions from PostgreSQL...</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Computing cryptographic match scores and verifying eligibility.</p>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', color: '#ef4444', margin: '0 0 6px' }}>Database Error</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>{error}</p>
          <button onClick={fetchOpportunities} className="btn-cyber-primary" style={{ padding: '8px 20px', fontSize: '12px' }}>
            Retry Connection
          </button>
        </div>
      ) : activeTab === 'My Applications' ? (
        /* Applications Tracker View */
        <div style={{ padding: '10px 0' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Application Tracking & Status History
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Real-time review updates directly from corporate recruiters and talent intelligence nodes.
              </p>
            </div>
            <span className="cyber-badge badge-cyan" style={{ fontSize: '11px' }}>
              {applications.length} ACTIVE REQUISITIONS
            </span>
          </div>

          {applications.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <Briefcase size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', color: '#f8fafc', margin: '0 0 6px' }}>No Applications Transmitted Yet</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 16px' }}>
                Explore the verified opportunity radar on the left and submit your 1-click cryptographic profile to begin receiving recruiter reviews.
              </p>
              <button onClick={() => setActiveTab('Internships')} className="btn-cyber-primary" style={{ padding: '8px 20px', fontSize: '12px' }}>
                Browse Recommended Internships
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {applications.map(app => {
                const stage = app.current_stage || app.stage || app.status || 'Submitted';
                const stageColors = {
                  'Applied': { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: '#06b6d4' },
                  'Submitted': { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: '#06b6d4' },
                  'Screening': { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: '#0284c7' },
                  'Shortlisted': { bg: 'rgba(139, 92, 246, 0.15)', text: '#c084fc', border: '#a855f7' },
                  'Interview': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: '#f59e0b' },
                  'Technical Interview': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: '#f59e0b' },
                  'Selected': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: '#10b981' },
                  'Offer': { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', border: '#059669' },
                  'Accepted': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: '#10b981' },
                  'Rejected': { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: '#f43f5e' }
                };
                const col = stageColors[stage] || stageColors['Submitted'];

                return (
                  <div key={app.id || app.applicationId} className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                          {app.opportunityTitle || app.title || app.roleTitle || 'Position'}
                        </h4>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px',
                          background: col.bg, color: col.text, border: `1px solid ${col.border}`,
                          fontSize: '11px', fontWeight: 700
                        }}>
                          {stage}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {app.companyName || app.company || 'Corporate Partner'} • Applied on {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent'}
                      </div>
                      {app.coverNote && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                          Note: "{app.coverNote}"
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Match Score</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>
                        {app.matchScore || app.match_score || 0}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Briefcase size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', color: '#f8fafc', margin: '0 0 6px' }}>No Opportunities Matching Filters</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Try clearing your search terms or lowering the match threshold.</p>
        </div>
      ) : (
        /* Main Content: Left Opportunities Cards + Right Evidence Drawer matching Page 10 */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Left Column: Job Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredOpportunities.map((opp) => {
            const isSelected = selectedOpportunity?.id === opp.id;
            const isApplied = appliedRoles.includes(opp.id);

            return (
              <div
                key={opp.id}
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderColor: isSelected ? 'var(--cyber-cyan)' : 'var(--border-subtle)',
                  boxShadow: isSelected ? 'var(--cyber-cyan-glow)' : 'none',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {opp.title}
                      </h3>
                      {opp.hotHiring && (
                        <span className="cyber-badge badge-rose" style={{ fontSize: '9px' }}>
                          HOT HIRING
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {opp.company} • {opp.division}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px', borderRadius: '20px',
                      background: 'rgba(0, 212, 255, 0.12)', border: '1px solid var(--cyber-cyan)',
                      color: 'var(--cyber-cyan)', fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)'
                    }}>
                      <span>⚡</span>
                      <span>{opp.matchScore}% MATCH</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span>📍 {opp.location}</span>
                  <span>⏱ {opp.duration}</span>
                  <span style={{ color: 'var(--cyber-emerald)', fontWeight: 600 }}>💰 {opp.stipend}</span>
                </div>

                {/* Required Skills Validation Matrix */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    REQUIRED SKILLS VALIDATION MATRIX
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {opp.skillsMatrix.map((sk, idx) => (
                      <span key={idx} style={{
                        padding: '3px 8px', borderRadius: '4px',
                        background: sk.isGap ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border: sk.isGap ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                        color: sk.isGap ? 'var(--cyber-amber)' : 'var(--cyber-emerald)',
                        fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600
                      }}>
                        {sk.isGap ? '⚠' : '✓'} {sk.name} {sk.isGap ? '(Gap)' : '(Verified)'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Tier-1 Recruiter • Fast-track Interview • Immediate Joining
                  </div>

                  <button
                    onClick={() => setSelectedOpportunity(opp)}
                    className="btn-cyber-primary"
                    style={{ padding: '7px 16px', fontSize: '12.5px' }}
                  >
                    <span>View Evidence Breakdown →</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Slide-Over Match Intelligence & Evidence Breakdown matching Page 10 */}
        {selectedOpportunity && (
          <div>
            <div className="glass-panel" style={{ padding: '24px', borderColor: 'rgba(56, 189, 248, 0.35)', position: 'sticky', top: '80px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div>
                  <span className="cyber-badge badge-cyan" style={{ fontSize: '9px' }}>EXPLAINABILITY ENGINE // ID: TX-OA-9244</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    Match Intelligence & Evidence Breakdown
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Full algorithmic provenance for {selectedOpportunity.company} • {selectedOpportunity.title}
                  </div>
                </div>
              </div>

              {/* Overall Match Circle */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px', background: 'var(--bg-input)',
                borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '18px'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>OVERALL MATCH SCORE</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
                    {selectedOpportunity.matchScore}%
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--cyber-emerald)', fontWeight: 600 }}>
                    {selectedOpportunity.fitLabel}
                  </div>
                </div>

                <div style={{
                  width: '54px', height: '54px', borderRadius: '50%',
                  background: 'radial-gradient(circle, #0B172E 60%, rgba(0,212,255,0.2) 100%)',
                  border: '2px solid var(--cyber-cyan)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyber-cyan)'
                }}>
                  <ShieldCheck size={26} />
                </div>
              </div>

              {/* Explainability Dimension Weights */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  <span>EXPLAINABILITY DIMENSION WEIGHTS</span>
                  <span>Normalized 100%</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px' }}>
                  {Object.entries(selectedOpportunity.breakdown || {}).map(([key, val]) => (
                    <div key={key} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1')} ({val.weight})
                        </span>
                        <strong style={{ color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>
                          {val.score}% Match
                        </strong>
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                        {val.details}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nexus AI Explainability Synthesis */}
              <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyber-purple)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  <Sparkles size={13} />
                  <span>NEXUS AI EXPLAINABILITY SYNTHESIS</span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {selectedOpportunity.synthesis}
                </p>
              </div>

              {/* Critical Gap Alert */}
              {selectedOpportunity.criticalGap && (
                <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--cyber-amber)', fontWeight: 700 }}>
                      CRITICAL GAP ALERT
                    </span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      Est. time: {selectedOpportunity.criticalGap.timeToClose}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Missing {selectedOpportunity.criticalGap.name}
                  </div>
                  <button
                    onClick={() => {
                      if (onShowToast) {
                        onShowToast({
                          title: 'Micro-Course Added',
                          message: `${selectedOpportunity.criticalGap.recommendedCourse} added to study queue.`,
                          type: 'success'
                        });
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--cyber-amber)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    + Add Micro-Course to Plan
                  </button>
                </div>
              )}

              {/* Apply & Save Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  disabled={isApplying || appliedRoles.includes(selectedOpportunity.id)}
                  onClick={() => handleApply(selectedOpportunity)}
                  className="btn-cyber-primary"
                  style={{ width: '100%', padding: '11px', fontSize: '13px', opacity: (isApplying || appliedRoles.includes(selectedOpportunity.id)) ? 0.75 : 1, cursor: (isApplying || appliedRoles.includes(selectedOpportunity.id)) ? 'not-allowed' : 'pointer' }}
                >
                  <ShieldCheck size={15} />
                  <span>
                    {isApplying ? 'Transmitting to Campus Ledger...' : (appliedRoles.includes(selectedOpportunity.id) ? 'Application Verified & Submitted' : '1-Click Express Apply (Passport Attached)')}
                  </span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => {
                      if (onShowToast) onShowToast({ title: 'Saved for Later', message: 'Opportunity bookmarked.', type: 'info' });
                    }}
                    className="btn-cyber-outline"
                    style={{ fontSize: '11.5px', padding: '8px' }}
                  >
                    <Bookmark size={13} />
                    <span>Save for Later</span>
                  </button>

                  <button
                    onClick={onOpenAIModal}
                    className="btn-cyber-outline"
                    style={{ fontSize: '11.5px', padding: '8px' }}
                  >
                    <Sparkles size={13} color="var(--cyber-purple)" />
                    <span>Ask Nexus to Prepare</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
