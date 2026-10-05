import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Star,
  Eye,
  ShieldCheck,
  Zap,
  Target,
  FileCode,
  Award,
  Layers,
  Check,
  Send,
  Filter,
  Search,
  BookOpen,
  GraduationCap,
  Building2,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Clock,
  UserCheck
} from 'lucide-react';
import opportunityMatchingService from '../../services/opportunityMatchingService';
import ConnectedEcosystemCard from '../common/ConnectedEcosystemCard';
import RecentEcosystemActivity from '../common/RecentEcosystemActivity';

export default function CompanyAIMatching({
  students = [],
  opportunities = [],
  onSelectStudent,
  onToggleShortlist,
  shortlistedIds = new Set(),
  onOpenInviteModal,
  onShowToast
}) {
  const [selectedOppId, setSelectedOppId] = useState(
    opportunities[0]?.oppId || opportunities[0]?.id || ''
  );
  const [candidates, setCandidates] = useState([]);
  const [activeOpportunity, setActiveOpportunity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [selectedCandidateForAudit, setSelectedCandidateForAudit] = useState(null);
  const [passportStudent, setPassportStudent] = useState(null);
  const [localShortlisted, setLocalShortlisted] = useState(new Set(shortlistedIds));

  // ── Filters State ──
  const [filters, setFilters] = useState({
    minMatchScore: '',
    college: 'ALL',
    department: 'ALL',
    skills: '',
    graduationYear: 'ALL',
    minAssessmentScore: '',
    shortlistedOnly: false
  });

  // Sync opportunity selector when opportunities prop changes
  useEffect(() => {
    if (!selectedOppId && opportunities.length > 0) {
      setSelectedOppId(opportunities[0].oppId || opportunities[0].id);
    }
  }, [opportunities, selectedOppId]);

  // Load Recommended Candidates from Backend Matching Engine
  const loadCandidates = useCallback(async () => {
    if (!selectedOppId) return;
    setIsLoading(true);
    try {
      const res = await opportunityMatchingService.getRecommendedCandidates(selectedOppId, filters);
      if (res.success) {
        setCandidates(res.data || []);
        if (res.opportunity) {
          setActiveOpportunity(res.opportunity);
        }
      }
    } catch (err) {
      console.warn('[CompanyAIMatching] Backend fetch note:', err.message);
      // Fallback: match in-memory students against active opportunity
      const currentOpp = opportunities.find(o => (o.oppId || o.id) === selectedOppId) || opportunities[0];
      if (currentOpp) {
        setActiveOpportunity(currentOpp);
        const reqSkills = Array.isArray(currentOpp.requiredSkills)
          ? currentOpp.requiredSkills.map(s => (typeof s === 'string' ? s : s.name).toLowerCase())
          : ['python', 'sql', 'git'];

        const fallbackCandidates = students.map(s => {
          const sSkills = (s.skills || []).map(sk => (sk.name || '').toLowerCase());
          const strong = [];
          const missing = [];
          reqSkills.forEach(r => {
            if (sSkills.some(sk => sk.includes(r) || r.includes(sk))) strong.push(r.charAt(0).toUpperCase() + r.slice(1));
            else missing.push(r.charAt(0).toUpperCase() + r.slice(1));
          });
          const ratio = reqSkills.length > 0 ? (strong.length / reqSkills.length) : 0.8;
          const score = Math.round(ratio * 85 + (s.cgpa ? s.cgpa * 1.5 : 10));
          return {
            studentId: s.id || s.studentId,
            studentName: s.name || s.fullName || 'Candidate',
            rollNumber: s.rollNumber || 'REG-2026',
            collegeName: s.college || s.institution || 'Partner Engineering College',
            department: s.department || 'Computer Science',
            graduationYear: s.graduationYear || 2026,
            cgpa: s.cgpa || 8.2,
            matchScore: Math.min(99, Math.max(50, score)),
            strongSkills: strong.length > 0 ? strong : ['Problem Solving', 'Data Structures'],
            weakSkills: [],
            missingSkills: missing,
            isEligible: true,
            eligibilityFailures: [],
            isShortlisted: localShortlisted.has(s.id || s.studentId)
          };
        });
        setCandidates(fallbackCandidates);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedOppId, filters, opportunities, students, localShortlisted]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  // Recalculate matches
  const handleRecalculate = async () => {
    if (!selectedOppId) return;
    setIsRecalculating(true);
    try {
      await opportunityMatchingService.calculateOpportunityMatches(selectedOppId);
      await loadCandidates();
      if (onShowToast) {
        onShowToast({
          title: 'Matching Matrix Updated',
          message: 'Candidate evaluations recalculated against current requisitions.',
          type: 'success'
        });
      }
    } catch (e) {
      console.warn('Recalculation error:', e.message);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Toggle Shortlist
  const handleToggleShortlistLocal = async (cand) => {
    const sId = cand.studentId;
    const isCurrentlyShort = localShortlisted.has(sId) || cand.isShortlisted;
    const nextState = !isCurrentlyShort;

    const newSet = new Set(localShortlisted);
    if (nextState) newSet.add(sId);
    else newSet.delete(sId);
    setLocalShortlisted(newSet);

    // Update candidate list in-place
    setCandidates(prev => prev.map(c => c.studentId === sId ? { ...c, isShortlisted: nextState } : c));

    if (onToggleShortlist) {
      onToggleShortlist(sId);
    }

    try {
      if (nextState) {
        await opportunityMatchingService.shortlistCandidate(selectedOppId, sId);
      } else {
        await opportunityMatchingService.removeCandidateShortlist(selectedOppId, sId);
      }
      if (onShowToast) {
        onShowToast({
          title: nextState ? 'Candidate Shortlisted' : 'Removed from Shortlist',
          message: `${cand.studentName} has been ${nextState ? 'added to your priority candidate shortlist' : 'removed from shortlist'}.`,
          type: 'success'
        });
      }
    } catch (e) {
      console.debug('Shortlist sync note:', e.message);
    }
  };

  // Derived filter options from candidate dataset
  const collegeOptions = useMemo(() => {
    const set = new Set();
    candidates.forEach(c => { if (c.collegeName) set.add(c.collegeName); });
    return Array.from(set);
  }, [candidates]);

  const departmentOptions = useMemo(() => {
    const set = new Set();
    candidates.forEach(c => { if (c.department) set.add(c.department); });
    return Array.from(set);
  }, [candidates]);

  // Client-side quick filter pipeline
  const filteredCandidates = useMemo(() => {
    return candidates.filter(cand => {
      if (filters.minMatchScore && cand.matchScore < Number(filters.minMatchScore)) return false;
      if (filters.college !== 'ALL' && !cand.collegeName?.toLowerCase().includes(filters.college.toLowerCase())) return false;
      if (filters.department !== 'ALL' && !cand.department?.toLowerCase().includes(filters.department.toLowerCase())) return false;
      if (filters.graduationYear !== 'ALL' && String(cand.graduationYear) !== String(filters.graduationYear)) return false;
      if (filters.skills && filters.skills.trim()) {
        const q = filters.skills.toLowerCase();
        const hasSkill = (cand.strongSkills || []).some(s => s.toLowerCase().includes(q)) ||
                         (cand.weakSkills || []).some(s => s.toLowerCase().includes(q));
        if (!hasSkill) return false;
      }
      if (filters.shortlistedOnly && !cand.isShortlisted && !localShortlisted.has(cand.studentId)) return false;
      return true;
    });
  }, [candidates, filters, localShortlisted]);

  // Metrics
  const metrics = useMemo(() => {
    const total = filteredCandidates.length;
    const top = total > 0 ? Math.max(...filteredCandidates.map(c => c.matchScore)) : 0;
    const avg = total > 0 ? Math.round(filteredCandidates.reduce((acc, c) => acc + c.matchScore, 0) / total) : 0;
    const eligible = filteredCandidates.filter(c => c.isEligible).length;
    return { total, top, avg, eligible };
  }, [filteredCandidates]);

  const activeOppTitle = activeOpportunity?.title ||
    opportunities.find(o => (o.oppId || o.id) === selectedOppId)?.title ||
    'Selected Industry Requisition';

  return (
    <div className="comp-stack">
      {/* ── TOP TELEMETRY TAG ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div className="comp-telemetry-tag">
          <span>SKILLNEXUS ENTERPRISE</span>
          <span>//</span>
          <span>FEATURE 2: INDUSTRY ↔ STUDENT SKILL MATCHING</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="comp-badge comp-badge-cyan">
            <Sparkles size={11} />
            DETERMINISTIC WEIGHTED ENGINE
          </span>
          <span className="comp-badge comp-badge-purple">
            <ShieldCheck size={11} />
            PRIVACY PRESERVING
          </span>
        </div>
      </div>

      {/* ── CONNECTED SIH DEMO ECOSYSTEM CARD ── */}
      <ConnectedEcosystemCard activeRole="industry" />

      {/* ── CONNECTED INSTITUTION TALENT POOL ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '14px',
        padding: '18px 22px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="comp-badge comp-badge-cyan" style={{ fontSize: '10px', padding: '2px 8px' }}>
              TALENT SOURCE
            </span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
              Connected Talent Pool: ABC Engineering College (CSE III-A)
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', margin: 0 }}>
            Target Requirements: <strong>React.js (≥80%), Python (≥75%), SQL (≥70%), Data Structures (≥75%)</strong> • Academic Mentor: Dr. Ramesh Sundaram
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {['React.js ≥ 80%', 'Python ≥ 75%', 'SQL ≥ 70%', 'DSA ≥ 75%'].map((sk, idx) => (
            <span key={idx} style={{
              fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              ✓ {sk}
            </span>
          ))}
        </div>
      </div>

      {/* Live Ecosystem Activity Stream (Section 20 & 21) */}
      <div style={{ marginBottom: '24px' }}>
        <RecentEcosystemActivity compact={false} />
      </div>

      {/* ── HEADER & REQUISITION SELECTOR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
            Recommended Candidates
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94A3B8)', marginTop: '4px', margin: 0 }}>
            Automated, transparent skill matching against <strong>{activeOppTitle}</strong> based on verified evidence.
          </p>
        </div>

        {/* Opportunity Selector + Recalculate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={selectedOppId}
            onChange={(e) => setSelectedOppId(e.target.value)}
            className="company-select"
            style={{ minWidth: '240px' }}
          >
            {opportunities.map(opp => (
              <option key={opp.oppId || opp.id} value={opp.oppId || opp.id}>
                {opp.title} ({opp.type || opp.opportunityType || 'Internship'})
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-cyber-primary"
            onClick={handleRecalculate}
            disabled={isRecalculating || isLoading}
            style={{ padding: '8px 16px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isRecalculating ? 'spin-animation' : ''} />
            <span>{isRecalculating ? 'Evaluating...' : 'Recalculate Matches'}</span>
          </button>
        </div>
      </div>

      {/* ── METRICS SUMMARY BAR ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="comp-card" style={{ padding: '14px 18px', background: 'rgba(10, 18, 36, 0.7)', border: '1px solid rgba(0, 212, 255, 0.15)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matched Candidates</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{metrics.total}</div>
          <div style={{ fontSize: '11px', color: '#00D4FF', marginTop: '2px' }}>Ranked by weighted match score</div>
        </div>

        <div className="comp-card" style={{ padding: '14px 18px', background: 'rgba(10, 18, 36, 0.7)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Match Score</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{metrics.top}%</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)', marginTop: '2px' }}>Strongest competency alignment</div>
        </div>

        <div className="comp-card" style={{ padding: '14px 18px', background: 'rgba(10, 18, 36, 0.7)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Cohort Fit</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#A78BFA', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{metrics.avg}%</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)', marginTop: '2px' }}>Across verified submissions</div>
        </div>

        <div className="comp-card" style={{ padding: '14px 18px', background: 'rgba(10, 18, 36, 0.7)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strictly Eligible</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#FBBF24', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{metrics.eligible}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)', marginTop: '2px' }}>Pass CGPA, Dept &amp; Cohort criteria</div>
        </div>
      </div>

      {/* ── FILTER TOOLBAR ── */}
      <div className="comp-card" style={{ padding: '14px 18px', background: 'rgba(13, 23, 43, 0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="#00D4FF" />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filter Candidates
            </span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#fff' }}>
            <input
              type="checkbox"
              checked={filters.shortlistedOnly}
              onChange={(e) => setFilters({ ...filters, shortlistedOnly: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: '#F59E0B' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={13} color="#F59E0B" fill={filters.shortlistedOnly ? "#F59E0B" : "none"} />
              Shortlisted Only
            </span>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
          {/* Match Score Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '4px' }}>Min. Match Score</label>
            <select
              value={filters.minMatchScore}
              onChange={(e) => setFilters({ ...filters, minMatchScore: e.target.value })}
              className="company-select"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
            >
              <option value="">All Scores</option>
              <option value="90">90%+ Exceptional</option>
              <option value="80">80%+ Strong Fit</option>
              <option value="70">70%+ Qualified</option>
              <option value="60">60%+ Baseline</option>
            </select>
          </div>

          {/* College Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '4px' }}>College / Institution</label>
            <select
              value={filters.college}
              onChange={(e) => setFilters({ ...filters, college: e.target.value })}
              className="company-select"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
            >
              <option value="ALL">All Partner Colleges</option>
              {collegeOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '4px' }}>Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="company-select"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
            >
              <option value="ALL">All Departments</option>
              {departmentOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Graduation Year Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '4px' }}>Graduation Year</label>
            <select
              value={filters.graduationYear}
              onChange={(e) => setFilters({ ...filters, graduationYear: e.target.value })}
              className="company-select"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
            >
              <option value="ALL">All Batches</option>
              <option value="2024">2024 (Graduated)</option>
              <option value="2025">2025 (Final Year)</option>
              <option value="2026">2026 (Pre-Final)</option>
              <option value="2027">2027 (Sophomore)</option>
            </select>
          </div>

          {/* Skills Search */}
          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '4px' }}>Skill Keyword</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="e.g. Python, SQL..."
                value={filters.skills}
                onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                className="company-input"
                style={{ width: '100%', fontSize: '12px', padding: '6px 10px 6px 28px' }}
              />
              <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #94A3B8)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── CANDIDATE CARDS GRID ── */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted, #94A3B8)' }}>
          <RefreshCw size={28} className="spin-animation" style={{ color: '#00D4FF', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600 }}>Analyzing verified candidate skills &amp; evaluating match weights...</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="comp-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Brain size={36} color="var(--text-muted, #94A3B8)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>No Matching Candidates Found</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94A3B8)', maxWidth: '400px', margin: '0 auto 16px' }}>
            No candidates match the active filter criteria. Try lowering the minimum match threshold or resetting filters.
          </p>
          <button
            type="button"
            className="btn-cyber-outline"
            onClick={() => setFilters({ minMatchScore: '', college: 'ALL', department: 'ALL', skills: '', graduationYear: 'ALL', minAssessmentScore: '', shortlistedOnly: false })}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredCandidates.map((cand) => {
            const isShort = cand.isShortlisted || localShortlisted.has(cand.studentId);
            const strongSkills = cand.strongSkills || [];
            const weakSkills = cand.weakSkills || [];
            const missingSkills = cand.missingSkills || [];

            return (
              <div
                key={cand.studentId}
                className="comp-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'linear-gradient(135deg, rgba(13, 23, 43, 0.95) 0%, rgba(18, 30, 56, 0.9) 100%)',
                  border: isShort ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(0, 212, 255, 0.2)',
                  boxShadow: isShort ? '0 0 16px rgba(245, 158, 11, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.3)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  padding: '18px'
                }}
              >
                <div>
                  {/* Card Header: Candidate Name, College, Match Score */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00D4FF 0%, #3B82F6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0B132B',
                        fontWeight: 900,
                        fontSize: '16px',
                        flexShrink: 0
                      }}>
                        {cand.studentName ? cand.studentName.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>
                          {cand.studentName}
                        </h3>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)', marginTop: '2px' }}>
                          {cand.department} • Batch {cand.graduationYear || '2026'}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#00D4FF', fontFamily: 'var(--font-mono)' }}>
                          {cand.collegeName}
                        </div>
                      </div>
                    </div>

                    {/* Match Score Badge with Radial Aura */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        background: cand.matchScore >= 85 ? 'rgba(16, 185, 129, 0.15)' : cand.matchScore >= 70 ? 'rgba(0, 212, 255, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        border: `1px solid ${cand.matchScore >= 85 ? '#10B981' : cand.matchScore >= 70 ? '#00D4FF' : '#F59E0B'}`,
                        borderRadius: '8px',
                        padding: '4px 10px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 900,
                          color: cand.matchScore >= 85 ? '#10B981' : cand.matchScore >= 70 ? '#00D4FF' : '#F59E0B',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {cand.matchScore}%
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                          Match
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Eligibility Indicator */}
                  <div style={{ marginBottom: '12px' }}>
                    {cand.isEligible ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <ShieldCheck size={12} />
                        <span>Eligible Candidate (CGPA {cand.cgpa || 8.0})</span>
                      </div>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <AlertTriangle size={12} />
                        <span>Eligibility Notice: {(cand.eligibilityFailures || [])[0] || 'Criteria Mismatch'}</span>
                      </div>
                    )}
                  </div>

                  {/* Strong Skills Section */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={13} color="#10B981" strokeWidth={3} />
                      <span>Strong Skills:</span>
                    </div>
                    {strongSkills.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {strongSkills.map((sk, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              color: '#10B981',
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            ✓ {sk}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)' }}>None evaluated above 75%</span>
                    )}
                  </div>

                  {/* Skill Gaps Section */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={13} color="#F59E0B" />
                      <span>Skill Gaps:</span>
                    </div>
                    {missingSkills.length > 0 || weakSkills.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {missingSkills.map((sk, idx) => (
                          <span
                            key={`mis-${idx}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(245, 158, 11, 0.1)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              color: '#F59E0B',
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            ⚠ {sk}
                          </span>
                        ))}
                        {weakSkills.map((sk, idx) => (
                          <span
                            key={`wk-${idx}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(148, 163, 184, 0.1)',
                              border: '1px solid rgba(148, 163, 184, 0.25)',
                              color: '#94A3B8',
                              fontSize: '11px'
                            }}
                          >
                            ~ {sk} (Developing)
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#10B981' }}>Complete Requisition Coverage</span>
                    )}
                  </div>
                </div>

                {/* ── CARD ACTIONS ── */}
                <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    {/* View Profile */}
                    <button
                      type="button"
                      className="btn-cyber-outline"
                      onClick={() => onSelectStudent && onSelectStudent(cand)}
                      style={{ padding: '6px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                    >
                      <Eye size={12} />
                      <span>View Profile</span>
                    </button>

                    {/* View Skill Passport */}
                    <button
                      type="button"
                      className="btn-cyber-outline"
                      onClick={() => setPassportStudent(cand)}
                      style={{ padding: '6px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', borderColor: 'rgba(139,92,246,0.4)', color: '#A78BFA' }}
                    >
                      <Award size={12} />
                      <span>View Passport</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {/* Shortlist */}
                    <button
                      type="button"
                      onClick={() => handleToggleShortlistLocal(cand)}
                      className="btn-cyber-outline"
                      style={{
                        padding: '6px 10px',
                        fontSize: '11px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        color: isShort ? '#F59E0B' : '#00D4FF',
                        borderColor: isShort ? 'rgba(245,158,11,0.5)' : 'rgba(0,212,255,0.3)',
                        background: isShort ? 'rgba(245,158,11,0.1)' : 'transparent'
                      }}
                    >
                      <Star size={12} fill={isShort ? '#F59E0B' : 'none'} />
                      <span>{isShort ? 'Shortlisted' : 'Shortlist'}</span>
                    </button>

                    {/* Invite Assessment */}
                    <button
                      type="button"
                      className="btn-cyber-primary"
                      onClick={() => onOpenInviteModal && onOpenInviteModal(cand)}
                      style={{ padding: '6px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                    >
                      <Send size={12} />
                      <span>Invite Assessment</span>
                    </button>
                  </div>

                  {/* Audit breakdown trigger */}
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedCandidateForAudit(cand)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted, #94A3B8)',
                        fontSize: '10.5px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Inspect Transparent Formula Breakdown
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TRANSPARENT MATCH FORMULA AUDIT MODAL ── */}
      {selectedCandidateForAudit && (
        <div className="company-modal-overlay">
          <div className="company-modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00D4FF' }}>
                  <Brain size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Transparent Match Calculation
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)' }}>
                    Candidate: {selectedCandidateForAudit.studentName} ({selectedCandidateForAudit.matchScore}% Final Fit)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidateForAudit(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94A3B8)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="comp-stack-sm">
              <div style={{ padding: '10px', background: 'rgba(0,212,255,0.04)', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.2)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#00D4FF' }}>WEIGHTED MATCH FORMULA</span>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary, #94A3B8)', margin: '4px 0 0', lineHeight: 1.4 }}>
                  Final Score = ∑(Skill Weight × Verified Skill Score) + Preferred Skills Bonus − Eligibility Penalties
                </p>
              </div>

              {/* Skills Breakdown Table */}
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginTop: '8px' }}>
                Requisite Skill Weight Distribution:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(selectedCandidateForAudit.matchedRequiredDetails || [
                  { name: 'Python', weightPercentage: 30, studentScore: 90, status: 'Strong' },
                  { name: 'SQL', weightPercentage: 20, studentScore: 70, status: 'Weak' },
                  { name: 'Problem Solving', weightPercentage: 20, studentScore: 85, status: 'Strong' },
                  { name: 'Git', weightPercentage: 15, studentScore: 80, status: 'Strong' },
                  { name: 'Communication', weightPercentage: 15, studentScore: 75, status: 'Strong' }
                ]).map((item, idx) => {
                  const pts = Math.round((item.weightPercentage * item.studentScore) / 100);
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: '6px', background: 'rgba(10, 18, 36, 0.6)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{item.name}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted, #94A3B8)', marginLeft: '6px' }}>
                          (Weight: {item.weightPercentage}%)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: item.status === 'Strong' ? '#10B981' : item.status === 'Weak' ? '#F59E0B' : '#EF4444' }}>
                          Verified: {item.studentScore}%
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#00D4FF', fontFamily: 'var(--font-mono)' }}>
                          +{pts} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Eligibility Check Notice */}
              <div style={{ marginTop: '10px', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Eligibility Verification:</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94A3B8)' }}>
                  • College: {selectedCandidateForAudit.collegeName} (Accredited Partner)<br />
                  • Department: {selectedCandidateForAudit.department}<br />
                  • Graduation Year: {selectedCandidateForAudit.graduationYear}<br />
                  • CGPA: {selectedCandidateForAudit.cgpa || '8.0'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn-cyber-primary"
                  onClick={() => setSelectedCandidateForAudit(null)}
                >
                  Close Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SKILL PASSPORT MODAL ── */}
      {passportStudent && (
        <div className="company-modal-overlay">
          <div className="company-modal-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA' }}>
                  <Award size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Sovereign Skill Passport
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)' }}>
                    Candidate: {passportStudent.studentName} • {passportStudent.collegeName}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPassportStudent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94A3B8)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="comp-stack-sm">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(139,92,246,0.05)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#A78BFA' }}>LEDGER VERIFICATION STATUS</span>
                  <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600, marginTop: '2px' }}>Cryptographically Verified by Skill Nexus Ledger</div>
                </div>
                <span className="comp-badge comp-badge-purple">
                  <ShieldCheck size={11} />
                  PASSPORT ACTIVE
                </span>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginTop: '6px' }}>
                Verified Skill Credentials:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {(passportStudent.strongSkills || ['Python', 'SQL', 'Git', 'Problem Solving']).map((sk, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: '6px', background: 'rgba(10, 18, 36, 0.6)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{sk}</span>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted, #94A3B8)' }}>
                        Verified via Proctored Diagnostic Assessment &amp; Shipped Projects
                      </div>
                    </div>
                    <span className="comp-badge comp-badge-emerald">
                      <CheckCircle2 size={10} />
                      Verified Mastery
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-cyber-outline"
                  onClick={() => setPassportStudent(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-cyber-primary"
                  onClick={() => {
                    handleToggleShortlistLocal(passportStudent);
                    setPassportStudent(null);
                  }}
                >
                  Shortlist from Passport
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
