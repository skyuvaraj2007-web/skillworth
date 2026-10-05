import React, { useState, useEffect, useCallback } from 'react';
import {
  Network,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Flame,
  BookOpen,
  Code2,
  Award,
  Briefcase,
  Layers,
  Filter,
  Search,
  TrendingUp,
  Cpu,
  Compass,
  X
} from 'lucide-react';
import { skillGraphService } from '../services/skillGraphService';

export default function SkillGraph({ user, onShowToast }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);

  const loadGraph = useCallback(async (isSync = false) => {
    if (isSync) setSyncing(true);
    else setLoading(true);
    setError(null);

    try {
      const fn = isSync ? skillGraphService.syncSkillGraph : skillGraphService.getMySkillGraph;
      const res = await fn();
      if (res.success) {
        setGraphData(res);
        if (isSync && onShowToast) {
          onShowToast({
            title: 'Skill Graph 2.0 Synchronized',
            message: 'Evidence aggregated across courses, assessments, and projects.',
            type: 'success'
          });
        }
      } else {
        setError(res.message || 'Failed to load Skill Graph.');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching Skill Graph.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const nodes = graphData?.nodes || [];
  const metrics = graphData?.metrics || {
    totalSkills: 0,
    verifiedSkills: 0,
    averageProficiency: 0,
    evidenceNodesCount: 0
  };
  const relatedSkills = graphData?.relatedSkills || {};

  // Categories derivation
  const categories = ['ALL', ...new Set(nodes.map(n => n.category || 'Technical'))];

  // Filtering
  const filteredNodes = nodes.filter(node => {
    const matchesCat = selectedCategory === 'ALL' || (node.category || 'Technical') === selectedCategory;
    const matchesLevel = selectedLevel === 'ALL' || node.proficiencyLevel === selectedLevel;
    const matchesSearch = !searchQuery.trim() || node.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesCat && matchesLevel && matchesSearch;
  });

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'Expert': return 'badge-cyber-purple';
      case 'Advanced': return 'badge-cyber-cyan';
      case 'Intermediate': return 'badge-cyber-blue';
      default: return 'badge-cyber-amber';
    }
  };

  const getDemandColor = (demand) => {
    switch (String(demand || '').toUpperCase()) {
      case 'CRITICAL': return '#EF4444';
      case 'VERY HIGH': return '#F59E0B';
      case 'HIGH': return '#10B981';
      default: return 'var(--cyber-cyan)';
    }
  };

  return (
    <div className="space-y-6" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Header Banner */}
      <div style={{
        padding: '24px 28px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(10, 15, 29, 0.98))',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(0, 212, 255, 0.1)', border: '1px solid var(--cyber-cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyber-cyan)'
          }}>
            <Network size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
                Skill Graph 2.0
              </h1>
              <span className="badge-cyber-cyan" style={{ fontSize: '10px', padding: '2px 8px' }}>
                EVIDENCE-BASED INTELLIGENCE
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Continuous multi-source verification connecting Courses • Projects • Assessments • Certifications • Industry Challenges
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => loadGraph(true)}
            disabled={syncing || loading}
            className="btn-cyber-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Synchronizing Graph...' : 'Re-sync Skill Graph'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div className="card-cyber-flat" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Graph Skills
            </span>
            <Layers size={18} color="var(--cyber-cyan)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
            {metrics.totalSkills}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Active nodes in network
          </div>
        </div>

        <div className="card-cyber-flat" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Verified Credentials
            </span>
            <ShieldCheck size={18} color="var(--cyber-emerald)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cyber-emerald)', marginTop: '8px' }}>
            {metrics.verifiedSkills} <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>/ {metrics.totalSkills}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Supported by platform evidence
          </div>
        </div>

        <div className="card-cyber-flat" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Avg Proficiency
            </span>
            <TrendingUp size={18} color="var(--cyber-blue)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cyber-blue)', marginTop: '8px' }}>
            {metrics.averageProficiency}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Weighted across evidence
          </div>
        </div>

        <div className="card-cyber-flat" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Evidence Relational Nodes
            </span>
            <Sparkles size={18} color="var(--cyber-purple)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cyber-purple)', marginTop: '8px' }}>
            {metrics.evidenceNodesCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Courses, projects, assessments
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Category/Level Filters */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(10, 15, 29, 0.8)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '8px 14px',
          minWidth: '240px'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Filter skills in graph..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
              width: '100%'
            }}
          />
        </div>

        {/* Level Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>
            LEVEL:
          </span>
          {['ALL', 'Expert', 'Advanced', 'Intermediate', 'Beginner'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: selectedLevel === lvl ? 'var(--cyber-cyan)' : 'rgba(30, 41, 59, 0.5)',
                color: selectedLevel === lvl ? '#0a0f1d' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px auto', color: 'var(--cyber-cyan)' }} />
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Assembling Skill Graph 2.0 Topology...</div>
          <div style={{ fontSize: '12px', marginTop: '6px' }}>Correlating relational evidence from PostgreSQL</div>
        </div>
      ) : error ? (
        <div style={{
          padding: '24px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#EF4444',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      ) : nodes.length === 0 ? (
        /* Zero-State for Brand-New Students */
        <div style={{
          padding: '60px 40px',
          textAlign: 'center',
          borderRadius: '16px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px dashed var(--border-subtle)'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'rgba(0, 212, 255, 0.1)', border: '1px solid var(--cyber-cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--cyber-cyan)', margin: '0 auto 20px auto'
          }}>
            <Network size={32} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Your Skill Graph is Currently Uncalibrated
          </h2>
          <p style={{ maxWidth: '520px', margin: '10px auto 24px auto', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Skill Nexus does not populate fake skills. To establish your verified Skill Graph, enroll in available courses, complete coding assessments, or publish verified technical projects.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <a href="/courses" className="btn-cyber-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
              Explore Courses
            </a>
            <a href="/student/assessments" className="btn-cyber-outline" style={{ padding: '10px 20px', fontSize: '13px' }}>
              Take Assessment
            </a>
          </div>
        </div>
      ) : (
        /* Skill Graph Node Cards Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {filteredNodes.map(node => {
            const related = relatedSkills[node.name] || [];
            return (
              <div
                key={node.id}
                style={{
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: node.verificationStatus === 'VERIFIED' ? '1px solid rgba(46, 224, 161, 0.35)' : '1px solid var(--border-subtle)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Top Section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {node.name}
                        </h3>
                        {node.verificationStatus === 'VERIFIED' && (
                          <ShieldCheck size={16} color="var(--cyber-emerald)" title="Verified by Relational Evidence" />
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {node.description || `${node.name} competence`}
                      </span>
                    </div>

                    <span className={getLevelBadgeClass(node.proficiencyLevel)} style={{ fontSize: '11px', padding: '3px 10px' }}>
                      {node.proficiencyLevel}
                    </span>
                  </div>

                  {/* Dual Meters: Proficiency & Credibility */}
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Proficiency Score</span>
                        <span style={{ color: 'var(--cyber-cyan)', fontWeight: 800 }}>{node.proficiencyScore}%</span>
                      </div>
                      <div style={{
                        width: '100%', height: '6px', borderRadius: '3px',
                        background: 'rgba(30, 41, 59, 0.8)', overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${node.proficiencyScore}%`, height: '100%',
                          borderRadius: '3px',
                          background: node.proficiencyScore >= 80 ? 'linear-gradient(90deg, var(--cyber-cyan), var(--cyber-emerald))' : 'linear-gradient(90deg, var(--cyber-blue), var(--cyber-cyan))',
                          transition: 'width 0.6s ease'
                        }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Credibility Score</span>
                        <span style={{ color: 'var(--cyber-emerald)', fontWeight: 800 }}>{node.credibilityScore !== undefined ? node.credibilityScore : 50}%</span>
                      </div>
                      <div style={{
                        width: '100%', height: '6px', borderRadius: '3px',
                        background: 'rgba(30, 41, 59, 0.8)', overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${node.credibilityScore !== undefined ? node.credibilityScore : 50}%`, height: '100%',
                          borderRadius: '3px',
                          background: (node.credibilityScore || 50) >= 75 ? 'linear-gradient(90deg, var(--cyber-cyan), var(--cyber-emerald))' : 'linear-gradient(90deg, var(--cyber-purple), var(--cyber-cyan))',
                          transition: 'width 0.6s ease'
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Evidence & Verification Meta */}
                  <div style={{
                    marginTop: '14px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(10, 15, 29, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                  }}>
                    <span>Evidence: <strong style={{ color: 'var(--text-primary)' }}>{node.evidence?.length || 0} sources</strong></span>
                    <span>Verification: <strong style={{ color: (node.evidence?.length || 0) >= 3 ? 'var(--cyber-emerald)' : 'var(--cyber-cyan)' }}>
                      {(node.evidence?.length || 0) >= 3 ? 'Strong' : (node.evidence?.length || 0) >= 1 ? 'Moderate' : 'Self-Declared'}
                    </strong></span>
                  </div>

                  {/* Evidence Checklist Preview */}
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                      Verified Evidence ({node.evidence?.length || 0})
                    </div>
                    {node.evidence && node.evidence.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {node.evidence.slice(0, 2).map((ev, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '12px',
                              padding: '6px 10px',
                              background: 'rgba(10, 15, 29, 0.6)',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <CheckCircle2 size={13} color="var(--cyber-emerald)" style={{ flexShrink: 0 }} />
                              <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {ev.title}
                              </span>
                            </div>
                            {ev.score && (
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyber-cyan)', flexShrink: 0, marginLeft: '8px' }}>
                                {ev.score}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                        No external evidence linked yet. Level capped at Beginner.
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action & Footer: View Evidence & Demand */}
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => setSelectedSkill(node)}
                    className="btn-cyber-outline"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>View Evidence & Credibility</span>
                    <ArrowRight size={13} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                      <span>Industry Demand:</span>
                      <span style={{ fontWeight: 700, color: getDemandColor(node.industryDemand) }}>
                        {node.industryDemand}
                      </span>
                    </div>

                    <span style={{ color: 'var(--text-muted)' }}>
                      Last Verified: {new Date(node.lastVerifiedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Related Skills Flow */}
                  {related.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        RELATED:
                      </span>
                      {related.slice(0, 3).map((r, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '10px',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: 'rgba(30, 41, 59, 0.6)',
                            color: 'var(--cyber-cyan)',
                            border: '1px solid rgba(0, 212, 255, 0.2)'
                          }}
                        >
                          {r.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evidence Modal */}
      {selectedSkill && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: '#0d1322',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
            padding: '28px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedSkill.name} Credibility
                  </h2>
                  <span className="badge-cyber-cyan" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    {selectedSkill.credibilityScore !== undefined ? selectedSkill.credibilityScore : 50}%
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Audit breakdown of independent multi-source verification
                </p>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Score Comparison */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(0, 212, 255, 0.2)'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Proficiency</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-cyan)', marginTop: '4px' }}>
                  {selectedSkill.proficiencyScore}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Demonstrated skill strength</div>
              </div>

              <div style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(46, 224, 161, 0.2)'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Credibility</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-emerald)', marginTop: '4px' }}>
                  {selectedSkill.credibilityScore !== undefined ? selectedSkill.credibilityScore : 50}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Multi-source proof robustness</div>
              </div>
            </div>

            {/* Credibility Audit Details */}
            <div className="space-y-4">
              <div style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(10, 15, 29, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Audit Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sources</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedSkill.evidence?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recency</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-cyan)', marginTop: '2px' }}>
                      High
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verification</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-emerald)', marginTop: '2px' }}>
                      {(selectedSkill.evidence?.length || 0) >= 3 ? 'Strong' : 'Moderate'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Sources List */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Linked Evidence Sources
                </div>
                {selectedSkill.evidence && selectedSkill.evidence.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedSkill.evidence.map((ev, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle2 size={16} color="var(--cyber-emerald)" />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {ev.title}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Type: {ev.type || 'relational_evidence'} • Status: Verified
                            </div>
                          </div>
                        </div>
                        {ev.score && (
                          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--cyber-cyan)' }}>
                            {ev.score}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                    No external evidence sources recorded. Level is currently based on unverified declaration.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedSkill(null)}
                className="btn-cyber-primary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
