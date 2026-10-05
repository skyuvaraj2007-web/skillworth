import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Bookmark,
  Download,
  GitCompare,
  Eye,
  Star,
  CheckSquare,
  Square,
  Award,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Plus,
  X,
  Building2,
  BookOpen,
  Code,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
  Briefcase,
  ExternalLink,
  Users
} from 'lucide-react';
import { nexusApiClient } from '../../services/nexusApiClient';

export default function CompanyTalentSearch({
  students = [],
  onSelectStudent,
  onToggleShortlist,
  shortlistedIds = new Set(),
  initialFilters = {},
  onOpenCompare,
  companyId = ''
}) {
  // ── SEARCH MODES ──
  const [searchMode, setSearchMode] = useState('general'); // 'general' or 'company_course'

  // ── DYNAMIC SKILL & COURSE SELECTION ──
  const [selectedSkills, setSelectedSkills] = useState(['C', 'C++', 'Data Structures']);
  const [skillInput, setSkillInput] = useState('');
  const [availableSkillCatalog, setAvailableSkillCatalog] = useState([
    'C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js',
    'SQL', 'PostgreSQL', 'MongoDB', 'AWS', 'Cloud Computing', 'Data Structures',
    'Algorithms', 'Machine Learning', 'AI', 'Generative AI', 'Cybersecurity',
    'Docker', 'Kubernetes', 'FastAPI', 'Django', 'DevOps'
  ]);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseCatalog, setCourseCatalog] = useState([]);

  // ── BENCHMARK REQUIREMENTS ──
  const [skillBenchmark, setSkillBenchmark] = useState(80);
  const [overallBenchmark, setOverallBenchmark] = useState(80);
  const [minAssessmentScore, setMinAssessmentScore] = useState(0);
  const [minCourseCompletion, setMinCourseCompletion] = useState(0);
  const [minProjectsCount, setMinProjectsCount] = useState(0);

  // ── FILTERS & SORTING ──
  const [filterInstitution, setFilterInstitution] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [sortBy, setSortBy] = useState('highest_match');
  const [viewMode, setViewMode] = useState('ranked_list'); // 'ranked_list' or 'institution_grouping'

  const dynamicInstitutions = useMemo(() => {
    const map = new Map();
    (students || []).forEach(s => {
      const code = s.collegeId || s.institutionId || s.collegeCode;
      const name = s.collegeName || s.institutionName || s.college;
      if (code && name) {
        map.set(code, name);
      } else if (name) {
        map.set(name, name);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [students]);

  // ── RESULTS & METRICS STATE ──
  const [discoveryData, setDiscoveryData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── COMPARE TRAY & PROFILE MODAL ──
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [viewingProfileStudent, setViewingProfileStudent] = useState(null);

  // Load Dynamic Catalogs on Mount
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const skillsRes = await nexusApiClient.getSkillsCatalog();
        if (Array.isArray(skillsRes) && skillsRes.length > 0) {
          setAvailableSkillCatalog(skillsRes);
        }
        const coursesRes = await nexusApiClient.getCoursesCatalog();
        if (Array.isArray(coursesRes) && coursesRes.length > 0) {
          setCourseCatalog(coursesRes);
        }
      } catch (e) {
        console.warn('Failed to load dynamic skill/course catalogs:', e.message);
      }
    }
    loadCatalogs();
  }, []);

  // Fetch Talent Discovery Data from Backend Engine
  const fetchTalentDiscovery = async () => {
    setLoading(true);
    try {
      const searchCriteria = {
        skills: selectedSkills,
        courseId: selectedCourseId || null,
        searchMode,
        benchmarks: {
          skillBenchmark,
          overallBenchmark,
          assessmentBenchmark: minAssessmentScore,
          courseCompletionBenchmark: minCourseCompletion
        },
        institutionId: filterInstitution,
        department: filterDepartment,
        minCourseCompletion,
        minAssessment: minAssessmentScore,
        minProjects: minProjectsCount,
        sortBy
      };

      const res = await nexusApiClient.discoverTalent(searchCriteria);
      if (res) {
        setDiscoveryData(res);
      }
    } catch (err) {
      console.warn('Talent Discovery fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalentDiscovery();
  }, [
    selectedSkills,
    selectedCourseId,
    searchMode,
    skillBenchmark,
    overallBenchmark,
    minAssessmentScore,
    minCourseCompletion,
    minProjectsCount,
    filterInstitution,
    filterDepartment,
    sortBy
  ]);

  // Skill Selector Helpers
  const handleAddSkill = (skillName) => {
    const trimmed = skillName.trim();
    if (trimmed && !selectedSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
    setSkillInput('');
    setShowSkillDropdown(false);
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skillToRemove));
  };

  const filteredCatalogOptions = useMemo(() => {
    return availableSkillCatalog.filter(s =>
      !selectedSkills.some(sel => sel.toLowerCase() === s.toLowerCase()) &&
      (skillInput.trim() === '' || s.toLowerCase().includes(skillInput.toLowerCase()))
    );
  }, [availableSkillCatalog, selectedSkills, skillInput]);

  // Reset Filters
  const handleReset = () => {
    setSelectedSkills(['C', 'C++', 'Data Structures']);
    setSelectedCourseId('');
    setSearchMode('general');
    setSkillBenchmark(80);
    setOverallBenchmark(80);
    setMinAssessmentScore(0);
    setMinCourseCompletion(0);
    setMinProjectsCount(0);
    setFilterInstitution('All');
    setFilterDepartment('All');
    setSortBy('highest_match');
    setViewMode('ranked_list');
  };

  // Compare Toggle
  const handleToggleCompare = (student) => {
    setSelectedForCompare(prev => {
      const exists = prev.some(s => s.studentId === student.studentId);
      if (exists) return prev.filter(s => s.studentId !== student.studentId);
      if (prev.length >= 4) return prev;
      return [...prev, student];
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const talentList = discoveryData?.students || [];
    const headers = ['Student ID', 'Name', 'College', 'Department', 'Overall Match %', 'Skill Match %', 'Course Progress %', 'Assessment %', 'Projects Count', 'Verified Certs', 'Benchmark Status'];
    const rows = talentList.map(s => [
      s.studentId,
      s.name,
      s.institutionName,
      s.department,
      `${s.matchScore}%`,
      `${s.matchBreakdown?.skillMatch || 0}%`,
      `${s.matchBreakdown?.coursePerformance || 0}%`,
      `${s.matchBreakdown?.assessment || 0}%`,
      s.relevantProjectsCount || 0,
      s.verifiedCertificatesCount || 0,
      s.benchmarkStatus
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'skillnexus_talent_benchmark_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = discoveryData?.metrics || {
    totalMatchingStudents: 0,
    highBenchmarkStudents: 0,
    totalInstitutions: 0,
    topSkill: 'C++',
    averageSkillMatch: 0,
    activeOpportunities: 0
  };

  const talentResults = discoveryData?.students || [];
  const institutionBreakdown = discoveryData?.institutionBreakdown || [];

  return (
    <div className="comp-stack">
      {/* ── TOP TELEMETRY BANNER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div className="comp-telemetry-tag">
          <span>SKILLNEXUS ENTERPRISE</span>
          <span>//</span>
          <span>COURSE-WISE SKILL BENCHMARK TALENT DISCOVERY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="comp-badge comp-badge-cyan">
            {metrics.totalMatchingStudents} QUALIFIED CANDIDATES FOUND
          </span>
        </div>
      </div>

      {/* Screen Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} color="#00D4FF" />
            Talent Discovery &amp; Benchmark Matching
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94A3B8)', marginTop: '4px', margin: 0 }}>
            Query candidate ledger evidence across registered institutions with transparent, rule-based skill benchmark scoring.
          </p>
        </div>

        {/* Dual Mode Switcher */}
        <div style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            type="button"
            onClick={() => setSearchMode('general')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: searchMode === 'general' ? 'linear-gradient(135deg, #00D4FF 0%, #0072FF 100%)' : 'transparent',
              color: searchMode === 'general' ? '#fff' : 'var(--text-secondary, #94A3B8)'
            }}
          >
            General Ecosystem Talent
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('company_course')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: searchMode === 'company_course' ? 'linear-gradient(135deg, #00D4FF 0%, #0072FF 100%)' : 'transparent',
              color: searchMode === 'company_course' ? '#fff' : 'var(--text-secondary, #94A3B8)'
            }}
          >
            Company Course Learners
          </button>
        </div>
      </div>

      {/* ── DASHBOARD METRICS SUMMARY WIDGETS (Requirement 24) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <div className="comp-card" style={{ padding: '16px', borderLeft: '3px solid #00D4FF' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', fontWeight: 700 }}>
            Matching Students
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            {metrics.totalMatchingStudents}
          </div>
          <div style={{ fontSize: '11px', color: '#00D4FF', marginTop: '2px' }}>Across Ecosystem</div>
        </div>

        <div className="comp-card" style={{ padding: '16px', borderLeft: '3px solid #10B981' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', fontWeight: 700 }}>
            High-Benchmark (80%+)
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
            {metrics.highBenchmarkStudents}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)', marginTop: '2px' }}>Top Tier Candidates</div>
        </div>

        <div className="comp-card" style={{ padding: '16px', borderLeft: '3px solid #8B5CF6' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', fontWeight: 700 }}>
            Institutions
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#8B5CF6', marginTop: '4px' }}>
            {metrics.totalInstitutions}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)', marginTop: '2px' }}>Registered Campuses</div>
        </div>

        <div className="comp-card" style={{ padding: '16px', borderLeft: '3px solid #F59E0B' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', fontWeight: 700 }}>
            Avg Skill Match
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
            {metrics.averageSkillMatch}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)', marginTop: '2px' }}>Skill Alignment</div>
        </div>

        <div className="comp-card" style={{ padding: '16px', borderLeft: '3px solid #EC4899' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', fontWeight: 700 }}>
            Shortlisted
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#EC4899', marginTop: '4px' }}>
            {shortlistedIds.size}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)', marginTop: '2px' }}>Saved to Talent Pool</div>
        </div>
      </div>

      {/* ── SKILL & BENCHMARK CONFIGURATION PANEL (Requirements 3, 4, 5, 17) ── */}
      <div className="comp-card" style={{ background: 'rgba(15, 23, 42, 0.65)' }}>
        <div className="comp-card-header" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#00D4FF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Filter size={15} />
            <span>Skill Matrix &amp; Benchmark Configurator</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleReset}
              className="btn-cyber-outline"
              style={{ padding: '5px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="btn-cyber-outline"
              style={{ padding: '5px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)' }}
            >
              <Download size={12} />
              <span>Export CSV</span>
            </button>

            {selectedForCompare.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenCompare && onOpenCompare(selectedForCompare)}
                className="btn-cyber-primary"
                style={{ padding: '5px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <GitCompare size={13} />
                <span>Compare ({selectedForCompare.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. Required Skills Selector */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '8px' }}>
            REQUIRED SKILLS (MULTI-SELECTION)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', padding: '10px', background: 'rgba(2, 6, 23, 0.6)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', minHeight: '48px' }}>
            {selectedSkills.map(skill => (
              <span
                key={skill}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 114, 255, 0.2) 100%)',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                  color: '#00D4FF'
                }}
              >
                <Code size={13} />
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                >
                  <X size={13} color="#FF4D4D" />
                </button>
              </span>
            ))}

            {/* Add Skill Button & Search Dropdown */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="text"
                  placeholder="+ Add Skill..."
                  value={skillInput}
                  onChange={(e) => {
                    setSkillInput(e.target.value);
                    setShowSkillDropdown(true);
                  }}
                  onFocus={() => setShowSkillDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && skillInput.trim()) {
                      handleAddSkill(skillInput);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    padding: '4px 8px',
                    outline: 'none',
                    width: '120px'
                  }}
                />
              </div>

              {showSkillDropdown && filteredCatalogOptions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '200px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  background: '#0F172A',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '8px',
                  zIndex: 50,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  marginTop: '4px'
                }}>
                  {filteredCatalogOptions.slice(0, 15).map(sk => (
                    <div
                      key={sk}
                      onClick={() => handleAddSkill(sk)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#E2E8F0',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(0, 212, 255, 0.15)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      + {sk}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Course & Benchmark Controls Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Specific Course Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '4px' }}>
              COURSE FILTER
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="company-select"
              style={{ width: '100%' }}
            >
              <option value="">All Relevant Courses</option>
              {courseCatalog.map(c => (
                <option key={c.courseId} value={c.courseId}>
                  {c.title} ({c.companyName})
                </option>
              ))}
            </select>
          </div>

          {/* Skill Benchmark Slider */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '4px' }}>
              MIN SKILL BENCHMARK: <span style={{ color: '#00D4FF' }}>{skillBenchmark}%</span>
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={skillBenchmark}
              onChange={(e) => setSkillBenchmark(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#00D4FF' }}
            />
          </div>

          {/* Min Course Completion */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '4px' }}>
              MIN COURSE COMPLETION: <span style={{ color: '#10B981' }}>{minCourseCompletion}%</span>
            </label>
            <select
              value={minCourseCompletion}
              onChange={(e) => setMinCourseCompletion(Number(e.target.value))}
              className="company-select"
              style={{ width: '100%' }}
            >
              <option value="0">Any Completion</option>
              <option value="50">50%+ Completion</option>
              <option value="75">75%+ Completion</option>
              <option value="100">100% Fully Completed</option>
            </select>
          </div>

          {/* Min Assessment Score */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '4px' }}>
              MIN ASSESSMENT SCORE: <span style={{ color: '#8B5CF6' }}>{minAssessmentScore > 0 ? `${minAssessmentScore}%` : 'Any'}</span>
            </label>
            <select
              value={minAssessmentScore}
              onChange={(e) => setMinAssessmentScore(Number(e.target.value))}
              className="company-select"
              style={{ width: '100%' }}
            >
              <option value="0">Any Assessment Score</option>
              <option value="70">70%+ Score</option>
              <option value="80">80%+ Score</option>
              <option value="90">90%+ Top Score</option>
            </select>
          </div>

          {/* Institution Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '4px' }}>
              INSTITUTION / CAMPUS
            </label>
            <select
              value={filterInstitution}
              onChange={(e) => setFilterInstitution(e.target.value)}
              className="company-select"
              style={{ width: '100%' }}
            >
              <option value="All">All Registered Institutions</option>
              {dynamicInstitutions.map(inst => (
                <option key={inst.code} value={inst.code}>
                  {inst.name} ({inst.code})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '4px' }}>
              DEPARTMENT
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="company-select"
              style={{ width: '100%' }}
            >
              <option value="All">All Departments</option>
              <option value="CSE">Computer Science &amp; Engineering (CSE)</option>
              <option value="IT">Information Technology (IT)</option>
              <option value="AI">AI &amp; Data Science (AI &amp; DS)</option>
              <option value="ECE">Electronics &amp; Communication (ECE)</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '4px' }}>
              SORT RESULTS BY
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="company-select"
              style={{ width: '100%' }}
            >
              <option value="highest_match">Highest Relevant Match First</option>
              <option value="highest_benchmark">Highest Overall Benchmark</option>
              <option value="highest_assessment">Highest Assessment Score</option>
              <option value="highest_course">Highest Course Performance</option>
              <option value="highest_projects">Most Relevant Projects</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── VIEW MODE & GROUPING TOGGLE (Requirement 15) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Ranked Candidates ({talentResults.length})</span>
          {loading && <span style={{ fontSize: '11px', color: '#00D4FF' }}>Updating query...</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setViewMode('ranked_list')}
            className={viewMode === 'ranked_list' ? 'btn-cyber-primary' : 'btn-cyber-outline'}
            style={{ padding: '4px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Users size={13} />
            <span>Ranked List</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('institution_grouping')}
            className={viewMode === 'institution_grouping' ? 'btn-cyber-primary' : 'btn-cyber-outline'}
            style={{ padding: '4px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Building2 size={13} />
            <span>Institution Breakdown ({institutionBreakdown.length})</span>
          </button>
        </div>
      </div>

      {/* ── INSTITUTION BREAKDOWN VIEW (Requirement 15) ── */}
      {viewMode === 'institution_grouping' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {institutionBreakdown.map(inst => (
            <div key={inst.institutionName} className="comp-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="#00D4FF" />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{inst.institutionName}</span>
                </div>
                <span className="comp-badge comp-badge-cyan">{inst.count} Candidates</span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94A3B8)', marginBottom: '12px' }}>
                Top Match Score: <strong style={{ color: '#10B981' }}>{inst.topMatchPct}% Match</strong>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Top Candidates:
                </div>
                {inst.students.map(st => (
                  <div key={st.studentId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                    <span style={{ color: '#E2E8F0' }}>{st.name}</span>
                    <span style={{ color: '#00D4FF', fontWeight: 700 }}>{st.matchScore}% Match</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setFilterInstitution(inst.institutionId || inst.institutionName);
                  setViewMode('ranked_list');
                }}
                className="btn-cyber-outline"
                style={{ width: '100%', marginTop: '12px', fontSize: '12px', padding: '6px' }}
              >
                Filter by {inst.institutionName}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── RANKED TALENT RESULTS GRID (Requirement 9) ── */}
      {viewMode === 'ranked_list' && (
        <>
          {talentResults.length === 0 ? (
            /* EMPTY STATE (Requirement 28) */
            <div className="comp-card" style={{ padding: '40px', textAlign: 'center' }}>
              <AlertCircle size={36} color="#F59E0B" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                No Matching Students Found
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94A3B8)', marginTop: '6px', maxWidth: '480px', margin: '6px auto 16px' }}>
                No student profiles currently satisfy all selected skill benchmarks and filter requirements.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setSkillBenchmark(65)} className="btn-cyber-outline" style={{ fontSize: '12px' }}>
                  Lower Skill Benchmark (65%)
                </button>
                <button type="button" onClick={() => setFilterInstitution('All')} className="btn-cyber-outline" style={{ fontSize: '12px' }}>
                  Search All Institutions
                </button>
                <button type="button" onClick={handleReset} className="btn-cyber-primary" style={{ fontSize: '12px' }}>
                  Reset Filters
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {talentResults.map(student => {
                const isShortlisted = shortlistedIds.has(student.studentId);
                const isCompared = selectedForCompare.some(s => s.studentId === student.studentId);

                return (
                  <div key={student.studentId} className="comp-card" style={{ padding: '18px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Top Card Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>
                            {student.name}
                          </h3>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94A3B8)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={12} color="#00D4FF" />
                            {student.institutionName} • {student.department} ({student.batch})
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 800,
                            background: student.matchScore >= 85 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 212, 255, 0.15)',
                            border: `1px solid ${student.matchScore >= 85 ? '#10B981' : '#00D4FF'}`,
                            color: student.matchScore >= 85 ? '#10B981' : '#00D4FF',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Sparkles size={12} />
                            {student.matchScore}% MATCH
                          </div>
                          <div style={{ fontSize: '10px', color: student.isQualified ? '#10B981' : '#F59E0B', marginTop: '2px' }}>
                            {student.benchmarkBadge}
                          </div>
                        </div>
                      </div>

                      {/* Transparent Score Breakdown Tooltip Bar (Requirement 7) */}
                      <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '9px', color: 'var(--text-secondary, #94A3B8)' }}>SKILL</div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#00D4FF' }}>{student.matchBreakdown?.skillMatch || 0}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9px', color: 'var(--text-secondary, #94A3B8)' }}>COURSE</div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>{student.matchBreakdown?.coursePerformance || 0}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9px', color: 'var(--text-secondary, #94A3B8)' }}>ASSESS</div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#8B5CF6' }}>{student.matchBreakdown?.assessment || 0}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9px', color: 'var(--text-secondary, #94A3B8)' }}>PROJECT</div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B' }}>{student.matchBreakdown?.projectExperience || 0}%</div>
                        </div>
                      </div>

                      {/* Skills Matrix Pills */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Evaluated Skills Performance:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {student.skillScoreBreakdown && student.skillScoreBreakdown.length > 0 ? (
                            student.skillScoreBreakdown.map(sk => (
                              <span
                                key={sk.skillName}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: sk.meetsBenchmark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                  border: `1px solid ${sk.meetsBenchmark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                  color: sk.meetsBenchmark ? '#10B981' : '#F59E0B'
                                }}
                              >
                                {sk.skillName} — {sk.score}% {sk.isVerified && '✓'}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)' }}>General Technical Skills Verified</span>
                          )}
                        </div>
                      </div>

                      {/* Relevant Course & Projects Summary (Requirement 11, 12, 13) */}
                      <div style={{ fontSize: '12px', color: '#E2E8F0', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <BookOpen size={13} color="#10B981" />
                          <span>Course Progress: <strong style={{ color: '#fff' }}>{student.courseProgressPct}%</strong> ({student.completedCoursesCount} completed)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Code size={13} color="#F59E0B" />
                          <span>Relevant Projects: <strong style={{ color: '#fff' }}>{student.relevantProjectsCount} relevant projects</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Award size={13} color="#8B5CF6" />
                          <span>College Verified Credentials: <strong style={{ color: student.verifiedCertificatesCount > 0 ? '#10B981' : 'var(--text-secondary, #94A3B8)' }}>{student.verifiedCertificatesCount} verified</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setViewingProfileStudent(student)}
                        className="btn-cyber-primary"
                        style={{ flex: 1, padding: '7px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <Eye size={13} />
                        <span>View Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleShortlist && onToggleShortlist(student.studentId)}
                        className={isShortlisted ? 'btn-cyber-primary' : 'btn-cyber-outline'}
                        style={{
                          padding: '7px 10px',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderColor: isShortlisted ? '#EC4899' : undefined,
                          background: isShortlisted ? 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)' : undefined
                        }}
                        title={isShortlisted ? 'Shortlisted' : 'Shortlist Candidate'}
                      >
                        <Bookmark size={13} />
                        <span>{isShortlisted ? 'Saved' : 'Shortlist'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleCompare(student)}
                        className={isCompared ? 'btn-cyber-primary' : 'btn-cyber-outline'}
                        style={{ padding: '7px', fontSize: '12px' }}
                        title="Compare candidate"
                      >
                        <GitCompare size={13} color={isCompared ? '#fff' : '#00D4FF'} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── READ-ONLY SCOPED STUDENT TALENT DOSSIER MODAL (Requirements 10 & 21) ── */}
      {viewingProfileStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="comp-card" style={{ width: '700px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setViewingProfileStudent(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            {/* Profile Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <div className="comp-telemetry-tag" style={{ marginBottom: '6px' }}>
                  <span>READ-ONLY TALENT DOSSIER</span>
                  <span>//</span>
                  <span>SCOPED PRIVACY PROTECTED</span>
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {viewingProfileStudent.name}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary, #94A3B8)', marginTop: '4px' }}>
                  {viewingProfileStudent.institutionName} • {viewingProfileStudent.department} ({viewingProfileStudent.batch})
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#00D4FF' }}>
                  {viewingProfileStudent.matchScore}% MATCH
                </div>
                <div style={{ fontSize: '11px', color: viewingProfileStudent.isQualified ? '#10B981' : '#F59E0B' }}>
                  {viewingProfileStudent.benchmarkBadge}
                </div>
              </div>
            </div>

            {/* Match Breakdown Section */}
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#00D4FF', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
                Transparent Match Score Breakdown
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary, #94A3B8)' }}>SKILL MATCH</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#00D4FF' }}>{viewingProfileStudent.matchBreakdown?.skillMatch}%</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary, #94A3B8)' }}>COURSE PERFORMANCE</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>{viewingProfileStudent.matchBreakdown?.coursePerformance}%</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary, #94A3B8)' }}>ASSESSMENT</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#8B5CF6' }}>{viewingProfileStudent.matchBreakdown?.assessment}%</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary, #94A3B8)' }}>PROJECT RELEVANCE</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#F59E0B' }}>{viewingProfileStudent.matchBreakdown?.projectExperience}%</div>
                </div>
              </div>
            </div>

            {/* Evaluated Skills Detail */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                Evaluated Required Skills:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {viewingProfileStudent.skillScoreBreakdown?.map(sk => (
                  <div key={sk.skillName} style={{ padding: '6px 12px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '6px', border: `1px solid ${sk.meetsBenchmark ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, fontSize: '12px' }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{sk.skillName}: </span>
                    <span style={{ color: sk.meetsBenchmark ? '#10B981' : '#F59E0B', fontWeight: 700 }}>{sk.score}%</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary, #94A3B8)', marginLeft: '6px' }}>(Benchmark: {sk.requiredBenchmark}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Relevant Projects Section (Requirement 12) */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                Relevant Verified Projects ({viewingProfileStudent.relevantProjectsCount}):
              </h4>
              {viewingProfileStudent.relevantProjects?.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94A3B8)' }}>No specific project evidence submitted for requested skills.</div>
              ) : (
                viewingProfileStudent.relevantProjects?.map(p => (
                  <div key={p.id} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '6px', marginBottom: '8px', borderLeft: '2px solid #F59E0B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{p.title}</span>
                      {p.githubUrl && (
                        <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#00D4FF', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <ExternalLink size={11} /> GitHub Repo
                        </a>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary, #94A3B8)', margin: '4px 0 0 0' }}>{p.description}</p>
                  </div>
                ))
              )}
            </div>

            {/* Verified Credentials Section (Requirement 22) */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                College Verified Credentials ({viewingProfileStudent.verifiedCertificatesCount}):
              </h4>
              {viewingProfileStudent.verifiedCertificates?.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94A3B8)' }}>
                  No college-verified certificates released yet. (Pending institutional review).
                </div>
              ) : (
                viewingProfileStudent.verifiedCertificates?.map(c => (
                  <div key={c.certificateId} style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 12px', borderRadius: '6px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{c.courseTitle}</div>
                      <div style={{ fontSize: '10px', color: '#10B981' }}>✓ Verified by {c.verifiedBy}</div>
                    </div>
                    <span className="comp-badge comp-badge-emerald">VERIFIED CREDENTIAL</span>
                  </div>
                ))
              )}
            </div>

            {/* Footer Close */}
            <div style={{ textAlign: 'right', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
              <button type="button" onClick={() => setViewingProfileStudent(null)} className="btn-cyber-outline" style={{ fontSize: '12px' }}>
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
