import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  BarChart2,
  Filter,
  Layers,
  Award,
  Calendar,
  Sparkles,
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Users,
  ChevronRight,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { academicService } from '../../services/academicService';

export default function InstitutionSkillGrowth({ onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    department: 'All',
    classId: 'All',
    skill: 'All',
    semester: 'All',
    academicYear: 'All'
  });

  const fetchGrowth = async () => {
    try {
      setLoading(true);
      const res = await academicService.getSkillGrowthAnalytics(filters);
      if (res?.success && res.data) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Failed to load skill growth:', err);
      if (onShowToast) {
        onShowToast({ title: 'Error', message: 'Failed to load skill growth analytics.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrowth();
  }, [filters]);

  const hasData = Boolean(data && (
    (data.departmentGrowth && data.departmentGrowth.length > 0 && data.departmentGrowth.some(d => d.studentCount > 0)) ||
    (data.skillDistribution && data.skillDistribution.some(s => s.score > 0)) ||
    (data.timeSeries && data.timeSeries.length > 0)
  ));

  const deptGrowthList = data?.departmentGrowth || [];
  const skillDist = data?.skillDistribution || [];
  const timeSeries = data?.timeSeries || [];
  const classComparison = data?.classComparison || [];
  const improvement = data?.assessmentImprovement || { initialScore: 0, recentScore: 0, improvement: 0 };
  const departments = data?.departments || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── HEADER & LIVE REFRESH ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={22} color="var(--cyber-cyan)" />
            <span>Student Skill Growth & Mastery Analytics</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Authoritative dynamic metrics aggregated from proctored skill assessments and learning activity across all campus cohorts.
          </p>
        </div>
        <button
          onClick={fetchGrowth}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 600,
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            color: 'var(--cyber-cyan)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* ── FILTERS BAR (Requirement 10) ── */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Filter size={14} color="var(--cyber-cyan)" /> Filters:
        </div>

        {/* Department Filter */}
        <select
          value={filters.department}
          onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            fontSize: '12.5px',
            background: 'rgba(10, 16, 30, 0.8)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <option value="All">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.code || d.name}>{d.name} ({d.code})</option>
          ))}
          {!departments.length && (
            <>
              <option value="CSE">Computer Science (CSE)</option>
              <option value="ECE">Electronics (ECE)</option>
              <option value="EEE">Electrical (EEE)</option>
              <option value="MECH">Mechanical (MECH)</option>
            </>
          )}
        </select>

        {/* Semester Filter */}
        <select
          value={filters.semester}
          onChange={e => setFilters(f => ({ ...f, semester: e.target.value }))}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            fontSize: '12.5px',
            background: 'rgba(10, 16, 30, 0.8)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <option value="All">All Semesters</option>
          <option value="1st">1st Semester</option>
          <option value="2nd">2nd Semester</option>
          <option value="3rd">3rd Semester</option>
          <option value="4th">4th Semester</option>
          <option value="5th">5th Semester</option>
          <option value="6th">6th Semester</option>
          <option value="7th">7th Semester</option>
          <option value="8th">8th Semester</option>
        </select>

        {/* Skill Category Filter */}
        <select
          value={filters.skill}
          onChange={e => setFilters(f => ({ ...f, skill: e.target.value }))}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            fontSize: '12.5px',
            background: 'rgba(10, 16, 30, 0.8)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <option value="All">All Skill Domains</option>
          <option value="Programming">Programming</option>
          <option value="Aptitude">Aptitude</option>
          <option value="Logical Reasoning">Logical Reasoning</option>
          <option value="Technical Skills">Technical Skills</option>
          <option value="Communication">Communication</option>
          <option value="Problem Solving">Problem Solving</option>
        </select>

        {/* Academic Year Filter */}
        <select
          value={filters.academicYear}
          onChange={e => setFilters(f => ({ ...f, academicYear: e.target.value }))}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            fontSize: '12.5px',
            background: 'rgba(10, 16, 30, 0.8)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <option value="All">All Academic Years</option>
          <option value="2023-2027">Batch 2023 - 2027</option>
          <option value="2022-2026">Batch 2022 - 2026</option>
          <option value="2021-2025">Batch 2021 - 2025</option>
          <option value="2020-2024">Batch 2020 - 2024</option>
        </select>
      </div>

      {/* ── EMPTY STATE RULE (Requirement 10 & 28) ── */}
      {!hasData && (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', borderLeft: '4px solid var(--cyber-amber)' }}>
          <AlertCircle size={36} color="var(--cyber-amber)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            No skill growth data available yet.
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 16px auto', lineHeight: '1.6' }}>
            Once academicians publish skill assessments and mapped students complete diagnostic evaluations, dynamic growth rates and benchmark comparisons will automatically populate here.
          </p>
        </div>
      )}

      {/* ── MAIN ANALYTICS SECTION ── */}
      {hasData && (
        <>
          {/* 1. Department-wise Skill Growth Bar Chart (Requirement 10) */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Department-wise Skill Growth %
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Average measurable growth calculated across student assessment attempts in PostgreSQL
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-cyan)', background: 'rgba(0, 242, 254, 0.1)', padding: '4px 10px', borderRadius: '4px' }}>
                Live Database Telemetry
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {deptGrowthList.map((d, idx) => {
                const growthVal = Math.min(100, Math.max(0, d.averageGrowth || d.growthPercentage || 0));
                return (
                  <div key={d.departmentId || idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '130px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {d.departmentCode || d.departmentName}
                    </div>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '6px', height: '22px', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <div
                        style={{
                          width: `${growthVal}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #00F2FE 0%, #4FACFE 100%)',
                          borderRadius: '5px',
                          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                    </div>
                    <div style={{ width: '60px', textAlign: 'right', fontSize: '14px', fontWeight: 800, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {growthVal}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Grid Visualizations: Skill Distribution & Growth Over Time (Requirement 11) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Skill Distribution */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Skill Domain Distribution
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Average student competency across 6 core institutional skill pillars
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {skillDist.map((sk, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{sk.category}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{sk.score}%</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${sk.score}%`,
                          height: '100%',
                          background: sk.score >= 75 ? 'var(--cyber-emerald)' : sk.score >= 55 ? 'var(--cyber-cyan)' : 'var(--cyber-amber)',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Over Time */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Skill Growth Over Time
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Cohort progression across diagnostic test milestones
              </p>

              {timeSeries.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '170px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  {timeSeries.map((t, idx) => (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>{t.score}%</span>
                      <div
                        style={{
                          width: '100%',
                          height: `${Math.max(10, Math.min(130, t.score * 1.3))}px`,
                          background: 'linear-gradient(180deg, rgba(0, 242, 254, 0.8) 0%, rgba(79, 172, 254, 0.2) 100%)',
                          borderRadius: '4px 4px 0 0'
                        }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.month}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No historical trend points recorded yet.
                </div>
              )}

              {/* Assessment Improvement Stat Card */}
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Test Score Improvement</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Initial: {improvement.initialScore}% → Recent: {improvement.recentScore}%
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cyber-emerald)', fontFamily: 'var(--font-mono)' }}>
                  +{improvement.improvement}%
                </div>
              </div>
            </div>
          </div>

          {/* 3. Class Comparison (Inside Selected Department) */}
          {classComparison.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Class & Section Benchmarks
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Comparative mastery across active classes
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {classComparison.map((c, idx) => (
                  <div key={idx} style={{ padding: '14px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.className}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{c.studentCount} Students Enrolled</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyber-cyan)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                      {c.avgScore}% <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 400 }}>avg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
