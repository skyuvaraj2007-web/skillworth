import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Briefcase,
  FileText,
  TrendingUp,
  Plus,
  Search,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Layers,
  Award,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

/* =========================================================================
   CIRCULAR PROGRESS COMPONENT (Matching Student Dashboard)
   ========================================================================= */
function CircularProgress({ size, strokeWidth, progress, color, bgColor }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={bgColor || 'rgba(255,255,255,0.06)'} strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color || '#00D4FF'} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
    </svg>
  );
}

export default function CompanyDashboard({
  onTabSelect,
  onOpenCreateOpp,
  students = [],
  opportunities = [],
  applications = [],
  onApplyFiltersToSearch,
  user
}) {
  const recruiterName = user?.name?.split(' ')[0] || 'Recruiter';

  // Filters state for "Find Students" Card
  const [selectedCollege, setSelectedCollege] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [selectedProgress, setSelectedProgress] = useState('All');
  const [selectedMatch, setSelectedMatch] = useState('All');

  // Talent Overview Tab
  const [overviewTab, setOverviewTab] = useState('colleges'); // 'colleges' | 'departments'

  // Dynamic filter matching against real candidates
  const matchingStudents = useMemo(() => {
    return students.filter(s => {
      // College
      if (selectedCollege !== 'All') {
        const colMatch = (s.collegeName || '').toLowerCase().includes(selectedCollege.toLowerCase()) ||
          (s.collegeId || '').toLowerCase() === selectedCollege.toLowerCase();
        if (!colMatch) return false;
      }
      // Department
      if (selectedDept !== 'All') {
        const deptNorm = (s.department || '').toLowerCase();
        const targetNorm = selectedDept.toLowerCase();
        if (!deptNorm.includes(targetNorm) && !targetNorm.includes(deptNorm)) return false;
      }
      // Year
      if (selectedYear !== 'All') {
        const yearNorm = (s.year || '').toLowerCase();
        if (!yearNorm.includes(selectedYear.toLowerCase().replace('year', '').trim())) return false;
      }
      // Skill
      if (selectedSkill !== 'All') {
        const hasSkill = (s.skills || []).some(sk => 
          (sk.name || '').toLowerCase().includes(selectedSkill.toLowerCase())
        );
        if (!hasSkill) return false;
      }
      // Progress
      if (selectedProgress !== 'All') {
        const minProg = parseInt(selectedProgress);
        if ((s.courseProgress ?? 0) < minProg) return false;
      }
      // AI Match
      if (selectedMatch !== 'All') {
        const minM = parseInt(selectedMatch);
        if ((s.aiMatchScore ?? s.readinessScore ?? 0) < minM) return false;
      }
      return true;
    });
  }, [students, selectedCollege, selectedDept, selectedYear, selectedSkill, selectedProgress, selectedMatch]);

  const handleResetFilters = () => {
    setSelectedCollege('All');
    setSelectedDept('All');
    setSelectedYear('All');
    setSelectedSkill('All');
    setSelectedProgress('All');
    setSelectedMatch('All');
  };

  const handleSearchStudents = () => {
    if (onApplyFiltersToSearch) {
      onApplyFiltersToSearch({
        college: selectedCollege,
        department: selectedDept,
        year: selectedYear,
        skill: selectedSkill,
        progress: selectedProgress,
        match: selectedMatch
      });
    }
    onTabSelect('students');
  };

  // KPI Sparklines
  const renderSparkline = (color) => (
    <svg width="80" height="25" viewBox="0 0 80 25" style={{ overflow: 'visible' }}>
      <path
        d="M 0,18 Q 15,22 30,12 T 60,8 T 80,3"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 0,18 Q 15,22 30,12 T 60,8 T 80,3 L 80,25 L 0,25 Z"
        fill={color}
        fillOpacity="0.12"
      />
      <circle cx="80" cy="3" r="3" fill={color} />
    </svg>
  );

  // College-wise breakdown
  // Derived metrics from authorized ecosystem data
  const totalStudentsCount = students.length;
  const jobReadyCount = useMemo(() => {
    return students.filter(s => {
      const score = Number(s.readinessScore ?? s.careerReadinessScore ?? s.aiMatchScore ?? 0);
      return score >= 75 || (s.placementStatus && s.placementStatus.toLowerCase().includes('ready'));
    }).length;
  }, [students]);
  const postedOppsCount = opportunities.length;
  const totalAppsCount = applications.length;
  const pipelineVelocity = useMemo(() => {
    if (!totalAppsCount) return 0;
    const progressed = applications.filter(a =>
      ['Under Review', 'Shortlisted', 'Interview', 'Selected'].includes(a.stage || a.status)
    ).length;
    return Math.round((progressed / totalAppsCount) * 100);
  }, [applications, totalAppsCount]);

  // Dynamic College-wise breakdown derived from authorized partner students
  const collegeStats = useMemo(() => {
    if (!students.length) return [];
    const counts = {};
    students.forEach(s => {
      const col = s.collegeName || s.institutionName || s.collegeId || 'Partner Institution';
      counts[col] = (counts[col] || 0) + 1;
    });
    const colors = ['#00D4FF', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E'];
    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      pct: Math.round((count / students.length) * 100),
      color: colors[idx % colors.length]
    }));
  }, [students]);

  // Dynamic Department-wise breakdown derived from authorized partner students
  const deptStats = useMemo(() => {
    if (!students.length) return [];
    const counts = {};
    students.forEach(s => {
      const dept = s.department || s.departmentName || 'Engineering & Computing';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    const colors = ['#00D4FF', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E', '#94A3B8'];
    return Object.entries(counts).map(([dept, count], idx) => ({
      dept,
      count,
      pct: Math.round((count / students.length) * 100),
      color: colors[idx % colors.length]
    }));
  }, [students]);

  return (
    <div className="comp-stack">
      {/* ── TOP TELEMETRY TAG (Matching Institution Portal) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div className="comp-telemetry-tag">
          <span>SKILLNEXUS ENTERPRISE</span>
          <span>//</span>
          <span>CORPORATE LICENSE: {user?.companyId || user?.code || user?.id || 'UNASSIGNED'} — {user?.companyName || user?.company || user?.name || 'ENTERPRISE ECOSYSTEM'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="comp-badge comp-badge-emerald">
            <CheckCircle2 size={11} />
            SOVEREIGN TALENT NETWORK ONLINE
          </span>
        </div>
      </div>

      {/* ── SECTION 1: ENTERPRISE HERO BANNER (Matching Student Hero) ── */}
      <div className="comp-hero-banner">
        <div className="comp-hero-bg" />
        <div className="comp-hero-overlay" />

        {/* Hero Left - Greeting & Value Prop */}
        <div className="comp-hero-left">
          <div style={{ fontSize: '14px', color: 'var(--text-secondary, #94A3B8)', marginBottom: '6px', fontWeight: 500 }}>
            Good Morning, {recruiterName}! 👋
          </div>
          <h1 className="comp-hero-title">
            Discover skilled students and build your future talent pipeline.
          </h1>
          <p className="comp-hero-sub">
            Evaluate verified student competencies, inspect explainable AI matching, and engage top collegiate talent across partnered institutions.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '18px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-cyber-primary"
              onClick={onOpenCreateOpp}
              style={{ padding: '9px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>+ Create Opportunity</span>
            </button>
            <button
              type="button"
              className="btn-cyber-outline"
              onClick={() => onTabSelect('students')}
              style={{ padding: '9px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Search size={15} />
              <span>Find Talent</span>
            </button>
          </div>
        </div>

        {/* Hero Right - Pipeline Velocity + Quick Stats Grid */}
        <div className="comp-hero-right">
          {/* Circular Velocity Progress */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '110px', height: '110px', margin: '0 auto' }}>
              <CircularProgress size={110} strokeWidth={8} progress={pipelineVelocity} color="#00D4FF" />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>{pipelineVelocity}%</span>
                <span style={{ fontSize: '9.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Pipeline Velocity</span>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#10B981', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <TrendingUp size={12} />
              Live Stage Inflow
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { value: totalStudentsCount.toLocaleString(), label: 'Total Students', icon: Users, color: '#00D4FF' },
              { value: jobReadyCount.toLocaleString(), label: 'Job Ready', icon: UserCheck, color: '#10B981' },
              { value: String(postedOppsCount), label: 'Active Openings', icon: Briefcase, color: '#8B5CF6' },
              { value: totalAppsCount.toLocaleString(), label: 'Applications', icon: FileText, color: '#F59E0B' }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <Icon size={16} color={stat.color} />
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted, #94A3B8)', fontWeight: 500, whiteSpace: 'nowrap' }}>{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: 4 CORE METRIC CARDS (Exact match with Student & Institution metrics-row) ── */}
      <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Total Students */}
        <div className="metric-stat-card accent-cyan">
          <div className="metric-stat-header">
            <span>TOTAL POOL STUDENTS</span>
            <Users size={15} color="var(--cyber-cyan)" />
          </div>
          <div className="metric-stat-value">{totalStudentsCount.toLocaleString()}</div>
          <div className="metric-stat-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ color: 'var(--cyber-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '11px' }}>
              <TrendingUp size={12} /> Active Partnerships
            </span>
            {renderSparkline('#00D4FF')}
          </div>
        </div>

        {/* Job Ready Students */}
        <div className="metric-stat-card accent-emerald">
          <div className="metric-stat-header">
            <span>JOB READY TALENT</span>
            <UserCheck size={15} color="var(--cyber-emerald)" />
          </div>
          <div className="metric-stat-value">{jobReadyCount.toLocaleString()}</div>
          <div className="metric-stat-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ color: 'var(--cyber-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '11px' }}>
              <TrendingUp size={12} /> Competency Score ≥75%
            </span>
            {renderSparkline('#10B981')}
          </div>
        </div>

        {/* Active Opportunities */}
        <div className="metric-stat-card accent-purple">
          <div className="metric-stat-header">
            <span>POSTED OPPORTUNITIES</span>
            <Briefcase size={15} color="var(--cyber-purple)" />
          </div>
          <div className="metric-stat-value">{postedOppsCount}</div>
          <div className="metric-stat-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ color: 'var(--cyber-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '11px' }}>
              <TrendingUp size={12} /> Live Postings
            </span>
            {renderSparkline('#8B5CF6')}
          </div>
        </div>

        {/* Applications */}
        <div className="metric-stat-card accent-amber">
          <div className="metric-stat-header">
            <span>APPLICATIONS RECEIVED</span>
            <FileText size={15} color="var(--cyber-amber)" />
          </div>
          <div className="metric-stat-value">{totalAppsCount.toLocaleString()}</div>
          <div className="metric-stat-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ color: 'var(--cyber-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '11px' }}>
              <TrendingUp size={12} /> +15.7%
            </span>
            {renderSparkline('#F59E0B')}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: FIND STUDENTS CARD (Pure Responsive 3x2 Grid) ── */}
      <div className="comp-card">
        <div className="comp-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00D4FF'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="comp-card-title">Find Students</h2>
                <span className="comp-badge comp-badge-cyan">AI FILTER ENGINE</span>
              </div>
              <p className="comp-card-subtitle">
                Use multidimensional AI filters to instantly pinpoint candidates across partner institutions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn-cyber-outline"
            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            title="Reset all filter options"
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* 6 Cyber Select Controls: Responsive 3x2 Grid */}
        <div className="comp-filter-grid">
          {/* Row 1, Col 1: College Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Partner Institution
            </label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="company-select"
              style={{ width: '100%' }}
            >
              <option value="All">All Partnered Institutions ({collegeStats.length || '0'})</option>
              {collegeStats.map(c => (
                <option key={c.name} value={c.name}>{c.name} ({c.count} talent)</option>
              ))}
            </select>
          </div>

          {/* Row 1, Col 2: Department Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Department / Discipline
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="company-select"
              style={{ width: '100%' }}
            >
              <option value="All">All Departments</option>
              <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
              <option value="IT">Information Technology (IT)</option>
              <option value="AI & DS">AI & Data Science (AI & DS)</option>
              <option value="ECE">Electronics & Communication (ECE)</option>
              <option value="EEE">Electrical & Electronics (EEE)</option>
              <option value="Mechanical">Mechanical Engineering</option>
              <option value="Civil">Civil Engineering</option>
            </select>
          </div>

          {/* Row 1, Col 3: Year Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Academic Cohort Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="company-select"
              style={{ width: '100%' }}
            >
              <option value="All">All Academic Years</option>
              <option value="1st Year">1st Year (Junior)</option>
              <option value="2nd Year">2nd Year (Intermediate)</option>
              <option value="3rd Year">3rd Year (Pre-Final)</option>
              <option value="4th Year">4th Year (Graduating 2026)</option>
            </select>
          </div>

          {/* Row 2, Col 1: Skill Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Verified Competency
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="company-select"
              style={{ width: '100%' }}
            >
              <option value="All">All Verified Skills</option>
              <option value="React">React & Modern UI</option>
              <option value="Python">Python Development</option>
              <option value="SQL">SQL & Database Architecture</option>
              <option value="Java">Java Enterprise</option>
              <option value="Next.js">Next.js & Full Stack</option>
              <option value="Docker">Docker & Containerization</option>
              <option value="AWS">AWS Cloud Infrastructure</option>
              <option value="Machine Learning">Machine Learning / NLP</option>
              <option value="PyTorch">PyTorch Deep Learning</option>
              <option value="FastAPI">FastAPI Microservices</option>
            </select>
          </div>

          {/* Row 2, Col 2: Course Progress */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Curriculum Milestone Completion
            </label>
            <select
              value={selectedProgress}
              onChange={(e) => setSelectedProgress(e.target.value)}
              className="company-select"
              style={{ width: '100%' }}
            >
              <option value="All">Any Progress Percentage</option>
              <option value="50">50% and above</option>
              <option value="70">70% and above</option>
              <option value="80">80% and above (High Readiness)</option>
              <option value="90">90% and above (Top 5% Cohort)</option>
            </select>
          </div>

          {/* Row 2, Col 3: AI Match Score */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Nexus AI Match Threshold
            </label>
            <select
              value={selectedMatch}
              onChange={(e) => setSelectedMatch(e.target.value)}
              className="company-select"
              style={{ width: '100%' }}
            >
              <option value="All">Any Match Score</option>
              <option value="70">70% and above</option>
              <option value="80">80% and above (Recommended)</option>
              <option value="85">85% and above (High Affinity)</option>
              <option value="90">90% and above (Exceptional Fit)</option>
            </select>
          </div>
        </div>

        {/* Card Bottom Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px', paddingTop: '16px', marginTop: '18px',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="comp-badge comp-badge-cyan" style={{ fontSize: '13px', padding: '6px 14px', fontWeight: 700 }}>
              <Users size={14} style={{ marginRight: '6px' }} />
              {selectedCollege === 'All' && selectedDept === 'All' && selectedSkill === 'All' && selectedYear === 'All' && selectedProgress === 'All' && selectedMatch === 'All'
                ? `${totalStudentsCount.toLocaleString()} Candidates in Talent Pool`
                : `${matchingStudents.length} Candidates Matching Criteria`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-cyber-outline"
              style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
            <button
              type="button"
              className="btn-cyber-primary"
              onClick={handleSearchStudents}
              style={{ padding: '8px 20px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Search size={14} />
              <span>Search Students</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: TALENT OVERVIEW CARD (Campus & Department Distribution) ── */}
      <div className="comp-card">
        <div className="comp-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6'
            }}>
              <Layers size={18} />
            </div>
            <div>
              <h2 className="comp-card-title">Talent Distribution Intelligence</h2>
              <p className="comp-card-subtitle">
                Real-time candidate density and readiness across partnered Tamil Nadu institutions
              </p>
            </div>
          </div>

          {/* View Switcher Tabs */}
          <div style={{
            display: 'flex', padding: '3px', borderRadius: '10px',
            background: 'rgba(10, 18, 36, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)'
          }}>
            <button
              type="button"
              onClick={() => setOverviewTab('colleges')}
              style={{
                padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                background: overviewTab === 'colleges' ? 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(59,130,246,0.2) 100%)' : 'transparent',
                color: overviewTab === 'colleges' ? '#00D4FF' : 'var(--text-muted, #94A3B8)'
              }}
            >
              College-wise
            </button>
            <button
              type="button"
              onClick={() => setOverviewTab('departments')}
              style={{
                padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                background: overviewTab === 'departments' ? 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(59,130,246,0.2) 100%)' : 'transparent',
                color: overviewTab === 'departments' ? '#00D4FF' : 'var(--text-muted, #94A3B8)'
              }}
            >
              Department-wise
            </button>
          </div>
        </div>

        {/* Tab 1: College-wise Progress Rows */}
        {overviewTab === 'colleges' ? (
          <div className="comp-grid-2">
            {collegeStats.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '36px', textAlign: 'center', color: 'var(--text-muted, #94A3B8)', fontSize: '13px' }}>
                No partner colleges yet
              </div>
            ) : (
              collegeStats.map((col) => (
              <div 
                key={col.name} 
                style={{
                  padding: '16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', flexDirection: 'column', gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff' }}>{col.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {col.count.toLocaleString()} registered candidates
                    </div>
                  </div>
                  <span 
                    style={{ 
                      fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-mono)',
                      padding: '2px 8px', borderRadius: '6px',
                      color: col.color, backgroundColor: `${col.color}15`,
                      border: `1px solid ${col.color}35`
                    }}
                  >
                    {col.pct}% Match
                  </span>
                </div>

                {/* Glowing Horizontal Progress Bar */}
                <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%', borderRadius: '4px', width: `${col.pct}%`,
                      backgroundColor: col.color,
                      boxShadow: `0 0 10px ${col.color}`,
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                </div>
              </div>
            )))}
          </div>
        ) : (
          /* Tab 2: Department-wise Category Grid */
          <div className="comp-grid-4">
            {deptStats.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '36px', textAlign: 'center', color: 'var(--text-muted, #94A3B8)', fontSize: '13px' }}>
                No department records available yet
              </div>
            ) : (
              deptStats.map(d => (
              <div 
                key={d.dept} 
                style={{
                  padding: '14px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', flexDirection: 'column', gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}` }} />
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{d.dept}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-muted, #94A3B8)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {d.count.toLocaleString()} students
                  </span>
                  <span style={{ color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '13px' }}>
                    {d.pct}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${d.pct * 2.5}%`, height: '100%', backgroundColor: d.color, borderRadius: '3px' }} />
                </div>
              </div>
            ))
          )}
        </div>
        )}

        {/* Footer info link */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '14px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '12px', color: 'var(--text-muted, #94A3B8)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
            <span>Verified Sovereign Ledger Pipeline • Real-time Sync Active</span>
          </span>
          <button 
            type="button" 
            onClick={() => onTabSelect('analytics')}
            style={{
              background: 'none', border: 'none', color: '#00D4FF',
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <span>Full Analytics Report</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
