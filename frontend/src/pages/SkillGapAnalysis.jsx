import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  Sparkles,
  Award,
  BookOpen,
  FolderGit2,
  Briefcase,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  ExternalLink,
  Target,
  Zap,
  Cpu,
  Code,
  Database,
  Globe,
  Layers,
  HelpCircle,
  Clock
} from 'lucide-react';
import { skillGapService } from '../services/skillGapService';

export default function SkillGapAnalysis({ setActivePage, onShowToast, user }) {
  // State
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [roles, setRoles] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [selectedTargetType, setSelectedTargetType] = useState('CAREER_ROLE'); // 'CAREER_ROLE' | 'OPPORTUNITY'
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Report & Student Skills
  const [report, setReport] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'breakdown' | 'recommendations' | 'evidence'
  const [skillFilter, setSkillFilter] = useState('ALL'); // 'ALL' | 'Strong' | 'Good' | 'Needs Improvement' | 'Missing'

  // Load target options on mount
  useEffect(() => {
    async function loadData() {
      setLoadingRoles(true);
      try {
        const [rolesRes, profileRes, latestRes] = await Promise.all([
          skillGapService.getTargetRoles().catch(() => ({ success: false })),
          skillGapService.getStudentSkills().catch(() => ({ success: false })),
          skillGapService.getLatestReport().catch(() => ({ success: false }))
        ]);

        if (rolesRes?.success && rolesRes.data) {
          setRoles(rolesRes.data.careerRoles || []);
          setOpportunities(rolesRes.data.opportunities || []);
          
          // Select default role
          if (rolesRes.data.careerRoles?.length > 0) {
            setSelectedTargetId(rolesRes.data.careerRoles[0].id);
          }
        }

        if (profileRes?.success && profileRes.data) {
          setStudentProfile(profileRes.data);
        }

        if (latestRes?.success && latestRes.data) {
          // Format latest report into active report state
          setReport({
            ...latestRes.data,
            skillAnalysis: latestRes.data.skill_analysis || [],
            overallReadiness: latestRes.data.overall_readiness || 0,
            counts: {
              strong: latestRes.data.strong_count || 0,
              good: latestRes.data.good_count || 0,
              needsImprovement: latestRes.data.improve_count || 0,
              missing: latestRes.data.missing_count || 0,
              total: (latestRes.data.skill_analysis || []).length
            },
            recommendations: latestRes.data.learning_recommendations || []
          });
        }
      } catch (err) {
        console.error('Error loading initial skill gap data:', err);
      } finally {
        setLoadingRoles(false);
      }
    }
    loadData();
  }, []);

  // Run Gap Analysis
  const handleAnalyze = async (targetType = selectedTargetType, targetId = selectedTargetId) => {
    if (!targetId) {
      if (onShowToast) onShowToast({ title: 'Select Target', message: 'Please select a target career role or opportunity first.', type: 'info' });
      return;
    }

    setAnalyzing(true);
    try {
      const res = await skillGapService.analyzeSkillGap(targetType, targetId);
      if (res?.success && res.data) {
        setReport(res.data);
        if (onShowToast) {
          onShowToast({
            title: 'Analysis Complete',
            message: `Evaluated ${res.data.skillAnalysis?.length || 0} skills for ${res.data.targetTitle}. Readiness: ${res.data.overallReadiness}%`,
            type: 'success'
          });
        }
      } else {
        throw new Error(res?.message || 'Analysis failed');
      }
    } catch (err) {
      console.error('Skill gap analysis error:', err);
      if (onShowToast) onShowToast({ title: 'Analysis Error', message: err.message, type: 'error' });
    } finally {
      setAnalyzing(false);
    }
  };

  // Filtered target list
  const filteredRoles = useMemo(() => {
    return roles.filter(r => {
      const matchSearch = (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = filterCategory === 'ALL' || r.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [roles, searchTerm, filterCategory]);

  const categories = useMemo(() => {
    const set = new Set(roles.map(r => r.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [roles]);

  // Filtered skills in report
  const filteredSkills = useMemo(() => {
    if (!report || !report.skillAnalysis) return [];
    if (skillFilter === 'ALL') return report.skillAnalysis;
    return report.skillAnalysis.filter(s => s.status === skillFilter);
  }, [report, skillFilter]);

  // Active target object
  const currentTargetObj = useMemo(() => {
    if (selectedTargetType === 'CAREER_ROLE') {
      return roles.find(r => r.id === selectedTargetId) || roles[0];
    }
    return opportunities.find(o => o.id === selectedTargetId);
  }, [roles, opportunities, selectedTargetType, selectedTargetId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Strong':
        return <span className="cyber-badge badge-emerald" style={{ fontWeight: 800, fontSize: '11px' }}>✓ Strong</span>;
      case 'Good':
        return <span className="cyber-badge badge-cyan" style={{ fontWeight: 800, fontSize: '11px' }}>● Good</span>;
      case 'Needs Improvement':
        return <span className="cyber-badge badge-amber" style={{ fontWeight: 800, fontSize: '11px' }}>▲ Needs Improvement</span>;
      case 'Missing':
      default:
        return <span className="cyber-badge badge-rose" style={{ fontWeight: 800, fontSize: '11px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>✕ Missing</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '48px' }}>
      {/* ── Top Telemetry Banner ── */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div className="cyber-badge badge-purple" style={{ marginBottom: '8px', fontSize: '10px' }}>
            <Brain size={12} /> AI COMPETENCY INTELLIGENCE ENGINE
          </div>
          <h1>AI Skill Gap Analysis</h1>
          <p>
            Compare your verified competencies against industry career standards, job opportunities, and internships to accelerate your readiness.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActivePage && setActivePage('skills')}
            className="btn-cyber-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <ShieldCheck size={15} /> My Skill Ledger
          </button>
          <button
            onClick={() => handleAnalyze()}
            disabled={analyzing}
            className="btn-cyber-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', padding: '10px 20px' }}
          >
            <RefreshCw size={15} className={analyzing ? 'spin-slow' : ''} />
            {analyzing ? 'Calculating Gaps...' : 'Analyze Skills'}
          </button>
        </div>
      </div>

      {/* ── SECTION 1: Target Role & Opportunity Selector ── */}
      <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyber-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              STEP 1: SELECT CAREER OR OPPORTUNITY TARGET
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
              Target Role Benchmarks
            </h2>
          </div>

          {/* Toggle Role vs Opportunity */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => {
                setSelectedTargetType('CAREER_ROLE');
                if (roles.length > 0) setSelectedTargetId(roles[0].id);
              }}
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: selectedTargetType === 'CAREER_ROLE' ? 'var(--grad-ai-primary)' : 'transparent',
                color: selectedTargetType === 'CAREER_ROLE' ? '#FFFFFF' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              Career Roles ({roles.length})
            </button>
            <button
              onClick={() => {
                setSelectedTargetType('OPPORTUNITY');
                if (opportunities.length > 0) setSelectedTargetId(opportunities[0].id);
              }}
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: selectedTargetType === 'OPPORTUNITY' ? 'var(--grad-ai-primary)' : 'transparent',
                color: selectedTargetType === 'OPPORTUNITY' ? '#FFFFFF' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              Industry Opportunities ({opportunities.length})
            </button>
          </div>
        </div>

        {/* Target Picker Grid / Select */}
        {selectedTargetType === 'CAREER_ROLE' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {roles.map(r => {
              const isSelected = selectedTargetId === r.id;
              const skillCount = r.role_required_skills?.length || 0;
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedTargetId(r.id);
                    handleAnalyze('CAREER_ROLE', r.id);
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isSelected ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(0, 242, 254, 0.08))' : 'var(--bg-input)',
                    border: isSelected ? '1.5px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                    boxShadow: isSelected ? '0 0 16px rgba(0, 242, 254, 0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="cyber-badge badge-purple" style={{ fontSize: '10px' }}>
                      {r.category}
                    </span>
                    {isSelected && (
                      <span className="cyber-badge badge-cyan" style={{ fontSize: '9.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={11} /> SELECTED
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: isSelected ? 'var(--cyber-cyan)' : 'var(--text-primary)', margin: '0 0 4px 0' }}>
                      {r.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {r.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-secondary)', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span>{skillCount} Required Skills</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyber-amber)' }}>
                      Min: {r.min_readiness_score}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {opportunities.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active opportunities currently listed. Switch to Career Roles above.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {opportunities.map(opp => {
                  const isSelected = selectedTargetId === opp.id;
                  return (
                    <div
                      key={opp.id}
                      onClick={() => {
                        setSelectedTargetId(opp.id);
                        handleAnalyze('OPPORTUNITY', opp.id);
                      }}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(0, 242, 254, 0.12)' : 'var(--bg-input)',
                        border: isSelected ? '1.5px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>
                          {opp.opportunity_type || 'Job'}
                        </span>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {opp.location || 'Remote'}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {opp.title}
                      </h4>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Required Readiness: <strong style={{ color: 'var(--cyber-cyan)' }}>{opp.min_readiness_score || 70}%</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SECTION 2: Overall Readiness Dashboard ── */}
      {report ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Hero Card */}
          <div className="glass-panel" style={{
            padding: '28px',
            background: 'linear-gradient(135deg, rgba(16, 26, 48, 0.85), rgba(11, 15, 25, 0.95))',
            border: '1px solid var(--border-glow)',
            borderRadius: '18px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
              {/* Left Details */}
              <div style={{ flex: '1 1 400px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="cyber-badge badge-cyan" style={{ fontSize: '10.5px' }}>
                    TARGET: {report.targetTitle}
                  </span>
                  <span className={`cyber-badge ${report.overallReadiness >= (report.minReadinessScore || 75) ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '10.5px' }}>
                    {report.overallReadiness >= (report.minReadinessScore || 75) ? '✓ QUALIFIED FOR ROLE' : '● BENCHMARK IN PROGRESS'}
                  </span>
                </div>

                <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
                  {report.overallReadiness}% Role Readiness
                </h2>

                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 18px 0', maxWidth: '580px' }}>
                  Based on verified diagnostic assessments, course enrollments, digital proof certificates, and engineering capstone projects.
                </p>

                {/* Progress bar */}
                <div style={{ width: '100%', maxWidth: '540px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Current Standing</span>
                    <span style={{ color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {report.overallReadiness}% / Target Benchmark: {report.minReadinessScore || 75}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: 'var(--bg-input)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                    <div
                      style={{
                        width: `${report.overallReadiness}%`,
                        height: '100%',
                        background: report.overallReadiness >= 75 ? 'var(--grad-ai-primary)' : 'linear-gradient(90deg, #f59e0b, #00f2fe)',
                        borderRadius: '6px',
                        transition: 'width 0.8s ease'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Breakdown Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', minWidth: '260px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '14px 18px' }}>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>STRONG</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', margin: '2px 0' }}>
                    {report.counts?.strong || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Competencies Met</div>
                </div>

                <div style={{ background: 'rgba(0, 242, 254, 0.08)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: '12px', padding: '14px 18px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>GOOD</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', margin: '2px 0' }}>
                    {report.counts?.good || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Near Target</div>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '14px 18px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--cyber-amber)', fontWeight: 700, textTransform: 'uppercase' }}>IMPROVE</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cyber-amber)', fontFamily: 'var(--font-mono)', margin: '2px 0' }}>
                    {report.counts?.needsImprovement || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Action Needed</div>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '14px 18px' }}>
                  <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>MISSING</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#ef4444', fontFamily: 'var(--font-mono)', margin: '2px 0' }}>
                    {report.counts?.missing || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unverified / Absent</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Grounded AI Explanation Card ── */}
          {report.aiExplanation && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(168, 85, 247, 0.08))',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'var(--grad-ai-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', flexShrink: 0,
                boxShadow: '0 4px 16px rgba(79, 70, 229, 0.4)'
              }}>
                <Sparkles size={22} />
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyber-purple)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  NEXUS AI EXPLANATION & CAREER COACHING
                </div>
                <p style={{ fontSize: '14.5px', color: 'var(--text-primary)', lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
                  "{report.aiExplanation}"
                </p>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  ✓ Grounded strictly in validated student ledger and course catalog benchmarks. Zero synthetic extrapolation.
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION 3: Detailed Skill Analysis ── */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyber-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  COMPETENCY BENCHMARK COMPARISON
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  Skill Analysis Breakdown
                </h3>
              </div>

              {/* Status Filter Badges */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['ALL', 'Strong', 'Good', 'Needs Improvement', 'Missing'].map(st => (
                  <button
                    key={st}
                    onClick={() => setSkillFilter(st)}
                    style={{
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      background: skillFilter === st ? 'rgba(0, 242, 254, 0.15)' : 'var(--bg-input)',
                      color: skillFilter === st ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                      borderColor: skillFilter === st ? 'var(--cyber-cyan)' : 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {st === 'ALL' ? 'All Skills' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Comparison Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px' }}>Competency / Skill</th>
                    <th style={{ padding: '12px 16px' }}>Category</th>
                    <th style={{ padding: '12px 16px' }}>Importance</th>
                    <th style={{ padding: '12px 16px', minWidth: '220px' }}>Student vs Required Score</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Evidence / Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSkills.map((sk, idx) => {
                    const ratio = sk.requiredScore > 0 ? (sk.studentScore / sk.requiredScore) : 0;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '13.5px' }}>
                        {/* Name */}
                        <td style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              background: sk.status === 'Strong' ? '#10b981' : sk.status === 'Good' ? '#00f2fe' : sk.status === 'Needs Improvement' ? '#f59e0b' : '#ef4444'
                            }} />
                            {sk.skillName}
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                          {sk.category}
                        </td>

                        {/* Importance */}
                        <td style={{ padding: '16px' }}>
                          <span className={`cyber-badge ${sk.importance === 'CRITICAL' ? 'badge-purple' : 'badge-cyan'}`} style={{ fontSize: '10px' }}>
                            {sk.importance}
                          </span>
                        </td>

                        {/* Visual Bar Comparison */}
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                            <span style={{ color: sk.studentScore > 0 ? 'var(--cyber-cyan)' : 'var(--text-muted)' }}>
                              Student: {sk.studentScore}%
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              Benchmark: {sk.requiredScore}%
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                            {/* Required threshold marker */}
                            <div style={{
                              position: 'absolute',
                              left: `${sk.requiredScore}%`,
                              top: 0, bottom: 0,
                              width: '2px',
                              background: 'rgba(255, 255, 255, 0.4)',
                              zIndex: 2
                            }} />
                            {/* Student score fill */}
                            <div style={{
                              width: `${Math.min(100, sk.studentScore)}%`,
                              height: '100%',
                              background: sk.status === 'Strong' ? '#10b981' : sk.status === 'Good' ? '#00f2fe' : sk.status === 'Needs Improvement' ? '#f59e0b' : '#ef4444',
                              borderRadius: '4px'
                            }} />
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px' }}>
                          {getStatusBadge(sk.status)}
                        </td>

                        {/* Source */}
                        <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sk.source}>
                            {sk.isVerified ? '✓ ' : ''}{sk.source}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── SECTION 4: Recommended Learning Path ── */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyber-amber)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  STEP 2: TARGETED GAP REMEDIATION
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  Recommended Learning Path ({report.recommendations?.length || 0} Modules)
                </h3>
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Targeted actions to elevate readiness to {report.minReadinessScore || 75}%+
              </div>
            </div>

            {(!report.recommendations || report.recommendations.length === 0) ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0', fontSize: '16px' }}>Zero Skill Gaps Detected</h4>
                <p style={{ fontSize: '13px', margin: 0 }}>You exhibit 100% competency match for all core requirements of {report.targetTitle}.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {report.recommendations.map((rec, idx) => {
                  const isCourse = rec.itemType === 'COURSE';
                  const isAssessment = rec.itemType === 'ASSESSMENT';
                  const isProject = rec.itemType === 'PROJECT';

                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '14px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        position: 'relative'
                      }}
                    >
                      <div>
                        {/* Header Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{
                            fontSize: '10.5px', fontWeight: 800, padding: '3px 10px', borderRadius: '8px',
                            background: isCourse ? 'rgba(0, 242, 254, 0.15)' : isAssessment ? 'rgba(168, 85, 247, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isCourse ? 'var(--cyber-cyan)' : isAssessment ? 'var(--cyber-purple)' : 'var(--cyber-emerald)',
                            border: `1px solid ${isCourse ? 'rgba(0, 242, 254, 0.3)' : isAssessment ? 'rgba(168, 85, 247, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                          }}>
                            {isCourse ? '📚 RECOMMENDED COURSE' : isAssessment ? '🏆 BENCHMARK ASSESSMENT' : '🚀 CAPSTONE PROJECT'}
                          </span>

                          <span className="cyber-badge badge-amber" style={{ fontSize: '10px' }}>
                            {rec.skillName} Gap
                          </span>
                        </div>

                        {/* Title */}
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                          {rec.title}
                        </h4>

                        {/* Description */}
                        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                          {rec.description}
                        </p>

                        {/* Reason Callout */}
                        <div style={{
                          background: 'rgba(0, 0, 0, 0.25)',
                          borderLeft: '3px solid var(--cyber-cyan)',
                          padding: '10px 12px',
                          borderRadius: '0 8px 8px 0',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4
                        }}>
                          <strong style={{ color: 'var(--cyber-cyan)' }}>Why Recommended: </strong>
                          {rec.reason}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          if (isCourse && setActivePage) setActivePage('learning');
                          else if (isAssessment && setActivePage) setActivePage('assessment');
                          else if (isProject && setActivePage) setActivePage('projects');
                        }}
                        className="btn-cyber-primary"
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '12.5px', padding: '9px 14px' }}
                      >
                        <span>{isCourse ? 'Enroll in Course Track' : isAssessment ? 'Take Benchmark Assessment' : 'View Project Blueprint'}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty state before first analysis */
        <div className="glass-panel" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <Brain size={48} color="var(--cyber-cyan)" style={{ margin: '0 auto 16px auto', opacity: 0.8 }} />
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Ready to Analyze Your Skill Alignment
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
            Select your desired target career role or industry opportunity from above, then click <strong>Analyze Skills</strong> to calculate your verified gap breakdown.
          </p>
          <button
            onClick={() => handleAnalyze()}
            disabled={analyzing}
            className="btn-cyber-primary"
            style={{ padding: '12px 28px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Sparkles size={16} />
            <span>Generate Skill Gap Report</span>
          </button>
        </div>
      )}
    </div>
  );
}
