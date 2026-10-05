import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Award,
  BookOpen,
  FolderGit2,
  Briefcase,
  MessageSquare,
  Users,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Activity
} from 'lucide-react';
import { careerReadinessService } from '../services/careerReadinessService';

export default function CareerReadiness({ setActivePage, onShowToast, user }) {
  const [readinessData, setReadinessData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [readinessRes, historyRes] = await Promise.all([
        careerReadinessService.getMyReadiness(),
        careerReadinessService.getMyReadinessHistory()
      ]);

      if (readinessRes.success) {
        setReadinessData(readinessRes.data);
      } else {
        setError(readinessRes.message || 'Failed to load readiness scores.');
      }

      if (historyRes.success) {
        setHistoryData(historyRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Network error fetching career readiness.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await careerReadinessService.recalculate();
      if (res.success) {
        setReadinessData(res.data);
        if (onShowToast) {
          onShowToast({
            title: 'Readiness Recalculated',
            message: `Current Career Readiness Score: ${res.data.overallScore}/100`,
            type: 'success'
          });
        }
        // Refresh history
        const hRes = await careerReadinessService.getMyReadinessHistory();
        if (hRes.success) setHistoryData(hRes.data || []);
      } else {
        if (onShowToast) {
          onShowToast({
            title: 'Recalculation Error',
            message: res.message || 'Failed to recalculate.',
            type: 'error'
          });
        }
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({
          title: 'Recalculation Failed',
          message: err.message || 'Network error.',
          type: 'error'
        });
      }
    } finally {
      setRecalculating(false);
    }
  };

  const getComponentIcon = (key) => {
    switch (key) {
      case 'technical': return BookOpen;
      case 'softSkills': return MessageSquare;
      case 'projects': return FolderGit2;
      case 'certifications': return Award;
      case 'assessments': return ShieldCheck;
      case 'industryExposure': return Briefcase;
      case 'interviewReadiness': return Users;
      default: return Activity;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'var(--cyber-emerald)';
    if (score >= 50) return 'var(--cyber-cyan)';
    if (score >= 30) return '#F59E0B';
    return '#EF4444';
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px auto', color: 'var(--cyber-cyan)' }} />
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Computing Career Readiness & Evidence Topologies...
        </div>
        <div style={{ fontSize: '13px', marginTop: '6px' }}>
          Aggregating multi-source evidence across Skill Graph, PostgreSQL projects, and assessments.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '24px',
        borderRadius: '12px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#EF4444',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <AlertCircle size={24} />
        <div>
          <div style={{ fontWeight: 700 }}>Error Loading Career Readiness</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>{error}</div>
        </div>
      </div>
    );
  }

  const isZeroState = !readinessData || readinessData.overallScore === 0 || !readinessData.components;
  const componentsList = readinessData?.components ? Object.entries(readinessData.components) : [];
  const improvements = readinessData?.improvements || [];
  const recommendedActions = readinessData?.recommendedActions || [];

  return (
    <div className="space-y-8" style={{ minHeight: 'calc(100vh - 120px)', paddingBottom: '40px' }}>
      {/* Hero Header */}
      <div style={{
        padding: '28px 32px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(10, 15, 29, 0.98))',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'rgba(0, 212, 255, 0.1)', border: '1px solid var(--cyber-cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyber-cyan)'
          }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>
                Career Readiness Engine
              </h1>
              <span className="badge-cyber-cyan" style={{ fontSize: '11px', padding: '3px 10px', fontWeight: 700 }}>
                PHASE 2 • AUDITED
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Deterministic 7-component evidence aggregation • Version {readinessData?.calculationVersion || '2.0.0'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {readinessData?.calculatedAt && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} />
              <span>Calculated: {new Date(readinessData.calculatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="btn-cyber-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 700 }}
          >
            <RefreshCw size={14} className={recalculating ? 'animate-spin' : ''} />
            <span>{recalculating ? 'Aggregating Evidence...' : 'Recalculate Score'}</span>
          </button>
        </div>
      </div>

      {/* Main Readiness Gauge Card */}
      <div style={{
        padding: '32px',
        borderRadius: '16px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '32px',
        alignItems: 'center'
      }}>
        {/* Left: Radial Progress Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '200px', height: '200px' }}>
            <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background track circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="transparent"
                stroke="rgba(30, 41, 59, 0.6)"
                strokeWidth="16"
              />
              {/* Animated Progress circle */}
              {!isZeroState && (
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="transparent"
                  stroke={getScoreColor(readinessData.overallScore)}
                  strokeWidth="16"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={2 * Math.PI * 80 * (1 - readinessData.overallScore / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              )}
            </svg>
            {/* Center Label */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {!isZeroState ? (
                <>
                  <div style={{ fontSize: '42px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                    {readinessData.overallScore}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    OUT OF 100
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#F59E0B', textAlign: 'center', padding: '0 20px' }}>
                  Insufficient Evidence
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Career Readiness Score
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {isZeroState ? 'No verified evidence on record' : 'Transparent weighted aggregate of 7 real evidence vectors'}
            </div>
          </div>
        </div>

        {/* Right: Summary or Zero-State Info */}
        <div>
          {isZeroState ? (
            <div style={{
              padding: '24px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#FCD34D'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 700 }}>
                <AlertCircle size={20} color="#F59E0B" />
                <span>Not enough verified evidence</span>
              </div>
              <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Skill Nexus does not show decorative or fabricated numbers. Complete courses, assessments, projects, and other verified activities to build your readiness profile.
              </p>
              <div style={{ marginTop: '18px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActivePage && setActivePage('enroll')}
                  className="btn-cyber-primary"
                  style={{ fontSize: '12px', padding: '8px 16px' }}
                >
                  Explore Courses
                </button>
                <button
                  onClick={() => setActivePage && setActivePage('assessment')}
                  className="btn-cyber-outline"
                  style={{ fontSize: '12px', padding: '8px 16px' }}
                >
                  Take Skill Assessment
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Transparent Weight Breakdown
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 16px 0' }}>
                Every percentage is deterministically calculated from database records. No synthetic scores are invented.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                {componentsList.map(([key, comp]) => (
                  <div
                    key={key}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(10, 15, 29, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {comp.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: getScoreColor(comp.score) }}>
                        {comp.score}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontWeight: 600 }}>
                        {Math.round(comp.weight * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7 Component Cards Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Readiness Component Vectors
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            7 Evidence Vectors • Real PostgreSQL Data
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {componentsList.map(([key, comp]) => {
            const Icon = getComponentIcon(key);
            const scorePercent = comp.score || 0;
            const weightPercent = Math.round(comp.weight * 100);

            return (
              <div
                key={key}
                className="card-cyber-flat"
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyber-cyan)'
                      }}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {comp.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Weight: {weightPercent}%
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: getScoreColor(comp.score) }}>
                        {comp.score}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        out of 100
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    width: '100%', height: '6px', borderRadius: '3px',
                    background: 'rgba(30, 41, 59, 0.8)', margin: '14px 0 10px 0',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${scorePercent}%`,
                      height: '100%',
                      borderRadius: '3px',
                      background: getScoreColor(comp.score),
                      transition: 'width 0.5s ease'
                    }} />
                  </div>

                  {/* Explanation */}
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '8px 0', lineHeight: 1.5 }}>
                    {comp.explanation}
                  </p>
                </div>

                <div style={{
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} color="var(--cyber-cyan)" />
                    <span>Evidence items: <strong style={{ color: 'var(--text-primary)' }}>{comp.evidenceCount}</strong></span>
                  </div>
                  {comp.lastCalculated && (
                    <span>{new Date(comp.lastCalculated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Improvement & Recommended Actions Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* Biggest Improvement Areas */}
        <div style={{
          padding: '24px',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sparkles size={20} color="var(--cyber-cyan)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Your Biggest Improvement Areas
            </h3>
          </div>

          {improvements.length > 0 ? (
            <div className="space-y-3">
              {improvements.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(10, 15, 29, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444',
                      fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Weight: {Math.round(item.weight * 100)}%
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '15px', fontWeight: 800, color: getScoreColor(item.score) }}>
                    {item.score}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No critical weaknesses identified. Continue regular skills progression.
            </div>
          )}
        </div>

        {/* Grounded Recommended Actions */}
        <div style={{
          padding: '24px',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Layers size={20} color="var(--cyber-emerald)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Grounded Recommended Actions
            </h3>
          </div>

          {recommendedActions.length > 0 ? (
            <div className="space-y-3">
              {recommendedActions.map((action, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    background: 'rgba(10, 15, 29, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      "{action.action}"
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      Target Vector: <span style={{ color: 'var(--cyber-cyan)' }}>{action.vector}</span>
                    </div>
                  </div>

                  {action.link && setActivePage && (
                    <button
                      onClick={() => setActivePage(action.link.replace('/student/', ''))}
                      className="btn-cyber-outline"
                      style={{ fontSize: '11px', padding: '6px 12px', flexShrink: 0 }}
                    >
                      Start
                      <ArrowRight size={12} style={{ marginLeft: '4px' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              All recommendations up to date. Keep maintaining consistent practice.
            </div>
          )}
        </div>
      </div>

      {/* Score History Progression */}
      <div style={{
        padding: '28px',
        borderRadius: '16px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Score History & Progression
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Audit trail of every calculation recorded in PostgreSQL
            </p>
          </div>
          <span className="badge-cyber-blue" style={{ fontSize: '11px', padding: '3px 10px' }}>
            {historyData.length} SNAPSHOTS RECORDED
          </span>
        </div>

        {historyData.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {historyData.map((h, i) => {
              const dt = new Date(h.calculated_at);
              const monthName = dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              const dateExact = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={h.id || i}
                  style={{
                    padding: '14px 20px',
                    borderRadius: '10px',
                    background: 'rgba(10, 15, 29, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '15px', fontWeight: 800, color: getScoreColor(h.overall_score)
                    }}>
                      {h.overall_score}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {monthName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Recorded on {dateExact}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span>Tech: <strong style={{ color: 'var(--text-primary)' }}>{h.technical_score}</strong></span>
                    <span>Projects: <strong style={{ color: 'var(--text-primary)' }}>{h.projects_score}</strong></span>
                    <span>Assessments: <strong style={{ color: 'var(--text-primary)' }}>{h.assessments_score}</strong></span>
                    <span>Industry: <strong style={{ color: 'var(--text-primary)' }}>{h.industry_exposure_score}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
            No historical score snapshots recorded yet. Scores are automatically archived upon recalculation.
          </div>
        )}
      </div>
    </div>
  );
}
