import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Target,
  BarChart2,
  CheckCircle2,
  ShieldAlert,
  Zap,
  PlusCircle
} from 'lucide-react';
import { SKILL_GAP_MATRIX } from '../../services/institutionData';
import { nexusApiClient } from '../../services/nexusApiClient';
import { getStudentByCollege, getAllCompanyOpportunities, createInstitutionCourse } from '../../services/nexusDataStore';

export default function InstitutionSkillGap({ onShowToast, setActivePage, institution }) {
  const instCollegeId = institution?.collegeId || 'TN010';
  const collegeName = institution?.institutionName || 'Campus';

  const [matrix, setMatrix] = useState(SKILL_GAP_MATRIX);
  const [executiveSummary, setExecutiveSummary] = useState(
    'Launch Cloud (AWS/Azure) & Generative AI training programs for CSE and IT cohorts (+18.4% campus readiness gain).'
  );
  const [loading, setLoading] = useState(false);

  // Compute local relational fallback
  const computeLocalGap = () => {
    const students = getStudentByCollege(instCollegeId);
    const opps = getAllCompanyOpportunities();
    const evaluatedSkills = [
      { name: 'Cloud (AWS / Azure)', key: 'aws', cohorts: 'CSE & IT' },
      { name: 'Generative AI & LLMs', key: 'ai', cohorts: 'CSE & AI-DS' },
      { name: 'Docker & Kubernetes', key: 'docker', cohorts: 'CSE, IT & ECE' },
      { name: 'System Design & Distributed Arch', key: 'system design', cohorts: 'Final Year CSE/IT' },
      { name: 'Full-Stack React & Node', key: 'react', cohorts: 'Pre-final Year' },
      { name: 'Data Engineering (Spark/Kafka)', key: 'data', cohorts: 'AI-DS & IT' }
    ];

    const totalStudents = Math.max(1, students.length);
    const totalOpps = Math.max(1, opps.length);

    return evaluatedSkills.map(item => {
      const demandCount = opps.filter(o => {
        const skills = (o.requiredSkills || []).map(s => String(s).toLowerCase());
        return skills.some(s => s.includes(item.key) || item.key.includes(s));
      }).length;
      const companyDemand = Math.min(95, Math.max(30, Math.round((demandCount / totalOpps) * 100) + 40));

      const supplyCount = students.filter(st => {
        return (st.skills || []).some(sk => {
          const name = (typeof sk === 'string' ? sk : sk.name).toLowerCase();
          const conf = typeof sk === 'string' ? 65 : (sk.confidence || 50);
          return (name.includes(item.key) || item.key.includes(name)) && conf >= 75;
        });
      }).length;

      const studentLevel = Math.max(15, Math.round((supplyCount / totalStudents) * 100));
      const gap = Math.max(0, companyDemand - studentLevel);
      const severity = gap >= 35 ? 'Critical' : gap >= 15 ? 'Medium' : 'Low';
      const affectedStudentsCount = Math.max(12, totalStudents - supplyCount);

      return {
        skill: item.name,
        studentLevel,
        companyDemand,
        gap,
        severity,
        affectedStudents: `${affectedStudentsCount} (${item.cohorts})`,
        recommendation: gap >= 35
          ? `Corporate deficit is critical (-${gap}%). Immediate 4-week credit bootcamp recommended to meet hiring partner criteria.`
          : gap >= 15
            ? `Moderate deficit (-${gap}%). Recommended practical project workshop.`
            : `Campus proficiency aligns comfortably with corporate partner demand.`
      };
    });
  };

  useEffect(() => {
    let isMounted = true;
    const loadSkillGap = async () => {
      setLoading(true);
      try {
        const liveGap = await nexusApiClient.getCampusSkillGap(instCollegeId);
        if (isMounted && liveGap && Array.isArray(liveGap.matrix) && liveGap.matrix.length > 0) {
          const mapped = liveGap.matrix.map(m => ({
            skill: m.skillName,
            studentLevel: m.campusSupplyPct,
            companyDemand: m.industryDemandPct,
            gap: Math.abs(m.netGap),
            severity: m.severity,
            affectedStudents: `${Math.max(1, (m.totalCampusStudents || 10) - (m.campusStudentsCount || 0))} Students`,
            recommendation: m.recommendation
          }));
          setMatrix(mapped);
          if (liveGap.executiveSummary) {
            setExecutiveSummary(liveGap.executiveSummary);
          }
        } else if (isMounted) {
          setMatrix(computeLocalGap());
        }
      } catch (err) {
        if (isMounted) setMatrix(computeLocalGap());
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSkillGap();
    return () => { isMounted = false; };
  }, [instCollegeId]);

  const handleLaunchSprint = (skillName) => {
    try {
      createInstitutionCourse({
        institutionId: instCollegeId,
        courseName: `${skillName} Fast-Track Sprint`,
        courseCode: `SPRINT-${Math.floor(100 + Math.random() * 900)}`,
        category: 'INTERVENTION SPRINT',
        description: `Targeted 4-week intensive curriculum sprint to bridge verified campus deficit in ${skillName}. Direct placement alignment with corporate partner requisitions.`,
        duration: '4 Weeks',
        instructor: `Faculty Chair & Industry Adjunct`,
        skillsDeveloped: [skillName, 'System Integration', 'Applied Project'],
        difficulty: 'Intermediate'
      });
      if (onShowToast) {
        onShowToast({
          title: 'Curriculum Sprint Launched!',
          message: `Created "${skillName} Fast-Track Sprint" under ${collegeName}. Students can now enroll.`,
          type: 'success'
        });
      }
      if (setActivePage) {
        setTimeout(() => setActivePage('institution-courses'), 600);
      }
    } catch (err) {
      if (setActivePage) setActivePage('institution-courses');
    }
  };

  const criticalCount = matrix.filter(m => m.severity === 'Critical').length;

  return (
    <div>
      {/* ── TOP BANNER ── */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(16,26,48,0.7) 0%, rgba(10,16,30,0.9) 100%)', borderLeft: '4px solid var(--cyber-rose)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingDown size={20} color="var(--cyber-rose)" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Skill Gap Intelligence: {collegeName} vs Corporate Demand
              </h2>
              <span className="cyber-badge badge-rose" style={{ fontSize: '10px' }}>
                {criticalCount} CRITICAL GAPS IDENTIFIED
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Strategic diagnostic comparing what corporate partners require vs verified campus student proficiency.
            </p>
          </div>
        </div>

        {/* AI Executive Recommendation Banner */}
        <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={18} color="var(--cyber-rose)" />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-rose)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                HIGH-IMPACT AI CURRICULUM RECOMMENDATION
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                {executiveSummary}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (setActivePage) setActivePage('institution-courses');
            }}
            className="btn-cyber-primary"
            style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          >
            <BookOpen size={13} />
            <span>Open Course & Training Management</span>
          </button>
        </div>
      </div>

      {/* ── SKILL GAP COMPARISON MATRIX TABLE ── */}
      <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {collegeName} vs Corporate Skill Gap Benchmark
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Telemetry synced from 14 Corporate Partner Job Profiles
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Skill Domain', 'Student Campus Level', 'Company Demand', 'Deficit Gap', 'Severity', 'Affected Cohorts', 'AI Strategic Recommendation', 'Action'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '10.5px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, idx) => {
                const isCrit = row.severity === 'Critical';
                const isMed = row.severity === 'Medium';
                const sevColor = isCrit ? 'var(--cyber-rose)' : isMed ? 'var(--cyber-amber)' : 'var(--cyber-emerald)';
                const sevBg = isCrit ? 'rgba(239,68,68,0.15)' : isMed ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)';

                return (
                  <tr
                    key={idx}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {row.skill}
                    </td>

                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', minWidth: '35px' }}>
                          {row.studentLevel}%
                        </span>
                        <div style={{ width: '60px', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${row.studentLevel}%`, height: '100%', background: 'var(--cyber-cyan)' }} />
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-purple)', fontFamily: 'var(--font-mono)', minWidth: '35px' }}>
                          {row.companyDemand}%
                        </span>
                        <div style={{ width: '60px', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${row.companyDemand}%`, height: '100%', background: 'var(--cyber-purple)' }} />
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: sevColor, fontFamily: 'var(--font-mono)' }}>
                        -{row.gap}%
                      </span>
                    </td>

                    <td style={{ padding: '14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        background: sevBg,
                        color: sevColor
                      }}>
                        {row.severity === 'Critical' ? '🔴 Critical' : row.severity === 'Medium' ? '🟡 Medium' : '🟢 Low'}
                      </span>
                    </td>

                    <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                      <strong>{row.affectedStudents}</strong>
                    </td>

                    <td style={{ padding: '14px', color: 'var(--text-secondary)', fontSize: '12px', maxWidth: '300px', lineHeight: 1.4 }}>
                      {row.recommendation}
                    </td>

                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleLaunchSprint(row.skill)}
                        style={{
                          background: isCrit ? 'rgba(239, 68, 68, 0.15)' : 'none',
                          border: `1px solid ${sevColor}77`,
                          color: sevColor,
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = sevColor;
                          e.currentTarget.style.color = '#000';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isCrit ? 'rgba(239, 68, 68, 0.15)' : 'none';
                          e.currentTarget.style.color = sevColor;
                        }}
                      >
                        <PlusCircle size={12} />
                        <span>Launch Sprint →</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
