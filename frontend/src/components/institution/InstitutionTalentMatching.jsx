import React, { useState, useMemo } from 'react';
import {
  Brain,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Building,
  Target,
  Users,
  ShieldCheck,
  ChevronRight,
  X,
  FileText
} from 'lucide-react';
import {
  getInstitutionStudents,
  getInstitutionOpportunities,
  calculateStudentCompanyMatch
} from '../../services/institutionData';

export default function InstitutionTalentMatching({ onShowToast }) {
  const [opportunities] = useState(getInstitutionOpportunities());
  const [students] = useState(getInstitutionStudents());
  const [selectedOppId, setSelectedOppId] = useState(opportunities[0]?.id || 'opp_abc_01');
  const [selectedStudentMatch, setSelectedStudentMatch] = useState(null);

  const selectedOpportunity = useMemo(() => {
    return opportunities.find(o => o.id === selectedOppId) || opportunities[0];
  }, [opportunities, selectedOppId]);

  // Compute matches for all students against selected opportunity
  const matchedStudents = useMemo(() => {
    if (!selectedOpportunity) return [];
    return students.map(s => {
      const match = calculateStudentCompanyMatch(s, selectedOpportunity);
      return {
        ...s,
        match
      };
    }).sort((a, b) => b.match.score - a.match.score);
  }, [students, selectedOpportunity]);

  return (
    <div>
      {/* ── TOP BANNER & 5-STAGE PIPELINE VISUALIZER ── */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(16,26,48,0.7) 0%, rgba(10,16,30,0.9) 100%)', borderTop: '3px solid var(--cyber-cyan)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={20} color="var(--cyber-cyan)" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                AI Student–Company Compatibility Engine
              </h2>
              <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>
                CORE INTELLIGENCE SYSTEM
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Deep semantic alignment between corporate job requirements and verified student skill graphs.
            </p>
          </div>
        </div>

        {/* 5-Stage Diagram requested by user */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          overflowX: 'auto',
          padding: '12px 16px',
          background: 'rgba(10,16,30,0.6)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          {[
            { step: '1', title: 'Company Requirement', subtitle: 'Job/Role Specs' },
            { step: '2', title: 'AI Skill Analysis', subtitle: 'Semantic Vectorization' },
            { step: '3', title: 'Student Skill Database', subtitle: 'Verified Ledger' },
            { step: '4', title: 'Compatibility Score', subtitle: 'Weighted Algorithm' },
            { step: '5', title: 'Eligible Students', subtitle: 'Tiered Recommendation' }
          ].map((st, i) => (
            <React.Fragment key={st.step}>
              <div style={{ textAlign: 'center', minWidth: '130px', flex: 1 }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0, 242, 254, 0.15)', color: 'var(--cyber-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginBottom: '4px', border: '1px solid var(--cyber-cyan)' }}>
                  {st.step}
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{st.title}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{st.subtitle}</div>
              </div>
              {i < 4 && <div style={{ color: 'var(--cyber-cyan)', fontSize: '16px', fontWeight: 700 }}>→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── SELECT OPPORTUNITY / JOB OPENING ── */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-cyan)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            SELECT TARGET CORPORATE OPPORTUNITY:
          </label>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Matching against {students.length} enrolled campus students
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          {opportunities.map(op => {
            const isSelected = selectedOppId === op.id;
            return (
              <button
                key={op.id}
                onClick={() => setSelectedOppId(op.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(0, 242, 254, 0.1)' : 'rgba(10, 16, 30, 0.6)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '10px', color: isSelected ? 'var(--cyber-cyan)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {op.companyName}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 4px' }}>
                  {op.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Skills: {op.requiredSkills.slice(0, 3).join(', ')}...
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MATCHING RESULTS TABLE ── */}
      {selectedOpportunity && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Compatibility Ranking for {selectedOpportunity.title}
                </h3>
                <span className="cyber-badge badge-purple" style={{ fontSize: '9.5px' }}>
                  {selectedOpportunity.companyName}
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Required: {selectedOpportunity.requiredSkills.join(' • ')}
              </span>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>
              Click any student row to inspect the AI match justification
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Student', 'Department & Year', 'Skill Match %', 'Readiness %', 'Status Tier', 'Matched Skills', 'Action'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '10.5px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matchedStudents.map((item) => (
                  <tr
                    key={item.studentId}
                    style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setSelectedStudentMatch(item)}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={item.avatar}
                          alt={item.name}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${item.match.badgeColor}` }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.regNo}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      <div>{item.department} ({item.batch})</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CGPA {item.cgpa}</div>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: item.match.badgeColor, fontFamily: 'var(--font-mono)' }}>
                          {item.match.score}%
                        </span>
                        <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.match.score}%`, height: '100%', background: item.match.badgeColor }} />
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {item.match.readiness}%
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        background: `${item.match.badgeColor}18`,
                        color: item.match.badgeColor
                      }}>
                        {item.match.status}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                        {item.match.matched.map((m, mIdx) => (
                          <span key={mIdx} style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(16,185,129,0.15)', color: 'var(--cyber-emerald)' }}>
                            ✓ {m}
                          </span>
                        ))}
                        {item.match.missing.map((m, mIdx) => (
                          <span key={mIdx} style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(239,68,68,0.1)', color: 'var(--cyber-rose)' }}>
                            ✗ {m}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudentMatch(item);
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--cyber-cyan)',
                          padding: '4px 10px',
                          borderRadius: '5px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Why {item.match.score}%? →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── "WHY MATCH SCORE?" AI EXPLANATION MODAL ── */}
      {selectedStudentMatch && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '650px', width: '100%', padding: '28px', border: `1px solid ${selectedStudentMatch.match.badgeColor}`, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div>
                <span className="cyber-badge badge-cyan" style={{ fontSize: '9.5px' }}>
                  AI COMPATIBILITY RATIONALE
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', margin: '4px 0' }}>
                  {selectedStudentMatch.name} vs {selectedOpportunity.companyName}
                </h3>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Target Opening: {selectedOpportunity.title}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>COMPATIBILITY</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: selectedStudentMatch.match.badgeColor, fontFamily: 'var(--font-mono)' }}>
                  {selectedStudentMatch.match.score}%
                </div>
              </div>
            </div>

            {/* AI Rationale Synthesis Box */}
            <div style={{ padding: '14px', background: 'rgba(0,242,254,0.06)', borderRadius: '8px', border: '1px solid rgba(0,242,254,0.2)', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--cyber-cyan)', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                <Sparkles size={13} /> Algorithmic Compatibility Breakdown
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
                {selectedStudentMatch.match.rationale}
              </p>
            </div>

            {/* Matched vs Missing Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyber-emerald)', marginBottom: '6px' }}>
                  ✓ VERIFIED MATCHING SKILLS ({selectedStudentMatch.match.matched.length})
                </div>
                <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {selectedStudentMatch.match.matched.map((m, idx) => (
                    <li key={idx} style={{ color: 'var(--text-primary)' }}>{m}</li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: '12px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyber-rose)', marginBottom: '6px' }}>
                  ✗ UNMATCHED PREREQUISITES ({selectedStudentMatch.match.missing.length})
                </div>
                {selectedStudentMatch.match.missing.length > 0 ? (
                  <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedStudentMatch.match.missing.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: '11.5px', color: 'var(--cyber-emerald)' }}>All required skills satisfied!</div>
                )}
              </div>
            </div>

            {/* Weight Breakdown */}
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              * Compatibility calculated via: 60% Skill Coverage Matrix + 40% Verified Readiness Score ({selectedStudentMatch.match.readiness}%).
            </div>

            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  if (onShowToast) onShowToast({ title: 'Candidate Shortlisted', message: `${selectedStudentMatch.name} marked as high priority for ${selectedOpportunity.companyName}.`, type: 'success' });
                  setSelectedStudentMatch(null);
                }}
                className="btn-cyber-primary"
                style={{ padding: '8px 18px', fontSize: '12px' }}
              >
                Endorse Candidate to Recruiter
              </button>
              <button
                onClick={() => setSelectedStudentMatch(null)}
                className="btn-cyber-outline"
                style={{ padding: '8px 14px', fontSize: '12px' }}
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
