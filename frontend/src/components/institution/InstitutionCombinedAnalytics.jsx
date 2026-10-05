import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  TrendingUp,
  Building,
  Users,
  Target,
  Award,
  CheckCircle2,
  PieChart,
  Sparkles,
  Layers,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { academicService } from '../../services/academicService';
import InstitutionSkillGrowth from './InstitutionSkillGrowth';

export default function InstitutionCombinedAnalytics({ onShowToast }) {
  const [activeTab, setActiveTab] = useState('SKILL_GROWTH'); // 'SKILL_GROWTH' | 'ALIGNMENT' | 'STUDENT' | 'COMPANY'
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await academicService.getCombinedAnalytics();
        if (mounted) {
          if (res?.success && res.data) {
            setAnalyticsData(res.data);
          } else {
            setAnalyticsData(null);
          }
        }
      } catch (err) {
        console.error('Failed to load institution analytics:', err);
        if (mounted) {
          setError(err.message || 'Failed to load analytics');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAnalytics();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', gap: '12px' }}>
        <Loader2 size={32} className="spinning" color="var(--cyber-cyan)" />
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading live institution analytics...</span>
      </div>
    );
  }

  const data = analyticsData || {};
  const hasActivity = Boolean(data.hasActivity);
  const domains = Array.isArray(data.domains) ? data.domains : [];
  const cohorts = Array.isArray(data.cohorts) ? data.cohorts : [];
  const skillsInDemand = Array.isArray(data.skillsInDemand) ? data.skillsInDemand : [];
  const studentMetrics = data.studentMetrics || {};
  const corporateMetrics = data.corporateMetrics || {};

  return (
    <div>
      {/* ── TOP NAV TABS ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'SKILL_GROWTH', label: 'Skill Growth', icon: TrendingUp },
          { id: 'ALIGNMENT', label: 'Institution vs Industry Alignment', icon: Target },
          { id: 'STUDENT', label: 'Student Cohort Analytics', icon: Users },
          { id: 'COMPANY', label: 'Corporate Demand Analytics', icon: Building }
        ].map(t => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                border: isSelected ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                background: isSelected ? 'rgba(0, 242, 254, 0.12)' : 'rgba(10, 16, 30, 0.6)',
                color: isSelected ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} color={isSelected ? 'var(--cyber-cyan)' : 'var(--text-muted)'} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 0: SKILL GROWTH (Requirement 9, 10, 11) ── */}
      {activeTab === 'SKILL_GROWTH' && (
        <InstitutionSkillGrowth onShowToast={onShowToast} />
      )}

      {!hasActivity && (
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '4px solid var(--cyber-amber)' }}>
          <AlertCircle size={18} color="var(--cyber-amber)" />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            No activity data available yet. Metrics will update dynamically as students enroll, take assessments, and corporate partnerships are activated.
          </span>
        </div>
      )}

      {/* ── TAB 1: INSTITUTION VS INDUSTRY ALIGNMENT ── */}
      {activeTab === 'ALIGNMENT' && (
        <div>
          {/* Hero Alignment Score */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(16,26,48,0.7) 0%, rgba(10,16,30,0.9) 100%)', borderLeft: '4px solid var(--cyber-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>
                  CURRICULUM RELEVANCE INDEX
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0 4px' }}>
                  Campus Curriculum to Industry Demand Alignment: {data.alignmentScore ?? 0}%
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '680px' }}>
                  Measured alignment between institution course curriculum and active corporate job requirements.
                </p>
              </div>

              <div style={{ textAlign: 'center', padding: '14px 22px', background: 'rgba(10,16,30,0.7)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ALIGNMENT DELTA</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cyber-emerald)', fontFamily: 'var(--font-mono)' }}>
                  +{data.alignmentDelta ?? 0}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>YoY Delta</div>
              </div>
            </div>
          </div>

          {/* Domain by Domain Comparison */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={16} color="var(--cyber-cyan)" /> Curricular Coverage vs Industry Market Demand
            </h3>

            {domains.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <p style={{ margin: 0 }}>No activity data available yet.</p>
              </div>
            ) : (
              domains.map((d, i) => {
                const isCrit = (d.status || '').includes('Critical');
                const barColor = isCrit ? 'var(--cyber-rose)' : 'var(--cyber-cyan)';

                return (
                  <div key={i} style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12.5px' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.domain}</span>
                      <span style={{ display: 'flex', gap: '14px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                        <span style={{ color: 'var(--cyber-cyan)' }}>Campus: {d.campus}%</span>
                        <span style={{ color: 'var(--cyber-purple)' }}>Industry: {d.industry}%</span>
                        <span style={{ color: isCrit ? 'var(--cyber-rose)' : 'var(--cyber-emerald)', fontWeight: 700 }}>
                          {d.status}
                        </span>
                      </span>
                    </div>

                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: `${d.industry}%`, top: 0, bottom: 0, width: '2px', background: 'var(--cyber-purple)', zIndex: 2 }} />
                      <div style={{ width: `${d.campus}%`, height: '100%', background: barColor, borderRadius: '4px', opacity: 0.85 }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: STUDENT COHORT ANALYTICS ── */}
      {activeTab === 'STUDENT' && (
        <div>
          <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
            <div className="metric-stat-card accent-purple">
              <div className="metric-stat-header">COURSE COMPLETION RATE</div>
              <div className="metric-stat-value">{studentMetrics.courseCompletionRate ?? 0}%</div>
              <div className="metric-stat-sub">Across All Programs</div>
            </div>
            <div className="metric-stat-card accent-cyan">
              <div className="metric-stat-header">CERTIFICATION ATTAINMENT</div>
              <div className="metric-stat-value">{studentMetrics.certificationAttainment ?? 0}%</div>
              <div className="metric-stat-sub">Cryptographically Minted</div>
            </div>
            <div className="metric-stat-card accent-emerald">
              <div className="metric-stat-header">PLACEMENT READY AVG</div>
              <div className="metric-stat-value">{studentMetrics.placementReadyAvg ?? 0}%</div>
              <div className="metric-stat-sub">Career Readiness Index</div>
            </div>
            <div className="metric-stat-card accent-amber">
              <div className="metric-stat-header">PROJECT ARTIFACT RATIO</div>
              <div className="metric-stat-value">{studentMetrics.projectArtifactRatio ?? 0} / student</div>
              <div className="metric-stat-sub">Verified Project Proofs</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Student Skill Growth Distribution Across Cohorts
            </h3>
            {cohorts.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <p style={{ margin: 0 }}>No activity data available yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {cohorts.map((c, i) => (
                  <div key={i} style={{ padding: '16px', background: 'rgba(10,16,30,0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.dept}</span>
                      <span style={{ fontSize: '12px', color: 'var(--cyber-emerald)', fontWeight: 700 }}>{c.growth}</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>{c.count}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Readiness Average: <strong style={{ color: 'var(--cyber-cyan)' }}>{c.readiness}</strong></div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Curriculum Completion: <strong style={{ color: 'var(--cyber-purple)' }}>{c.completion}</strong></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: CORPORATE DEMAND ANALYTICS ── */}
      {activeTab === 'COMPANY' && (
        <div>
          <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
            <div className="metric-stat-card accent-cyan">
              <div className="metric-stat-header">ACTIVE RECRUITERS</div>
              <div className="metric-stat-value">{corporateMetrics.activeRecruiters ?? 0}</div>
              <div className="metric-stat-sub">Partner Companies</div>
            </div>
            <div className="metric-stat-card accent-purple">
              <div className="metric-stat-header">TOTAL CAMPUS OPENINGS</div>
              <div className="metric-stat-value">{corporateMetrics.totalCampusOpenings ?? 0}</div>
              <div className="metric-stat-sub">Jobs & Internships</div>
            </div>
            <div className="metric-stat-card accent-emerald">
              <div className="metric-stat-header">MOST SOUGHT SKILL</div>
              <div className="metric-stat-value" style={{ fontSize: '18px' }}>{corporateMetrics.mostSoughtSkill || 'N/A'}</div>
              <div className="metric-stat-sub">{corporateMetrics.partnerDemandPct ?? 0}% Partner Demand</div>
            </div>
            <div className="metric-stat-card accent-amber">
              <div className="metric-stat-header">PPO CONVERSION RATE</div>
              <div className="metric-stat-value">{corporateMetrics.ppoConversionRate ?? 0}%</div>
              <div className="metric-stat-sub">From Placed Cohorts</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Top Corporate Hiring Skills in Demand (2026 Academic Year)
            </h3>
            {skillsInDemand.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <p style={{ margin: 0 }}>No activity data available yet.</p>
              </div>
            ) : (
              skillsInDemand.map((sk, idx) => (
                <div key={idx} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{sk.skill}</span>
                    <span style={{ color: 'var(--cyber-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{sk.demand}% Demand</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                    <div style={{ width: `${sk.demand}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyber-cyan), var(--cyber-purple))', borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hiring Partners: {sk.companies}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
