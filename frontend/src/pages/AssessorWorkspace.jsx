import React, { useState, useEffect } from 'react';
import SkillWorthLogo from '../components/SkillWorthLogo';

export default function AssessorWorkspace({ user, onNavigate, onLogout }) {
  const [activeTab, setActiveTab] = useState('eval'); // 'eval' | 'candidates'
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [stats, setStats] = useState({
    assignedDossiers: 18,
    inProgress: 6,
    completedAudits: 42,
    awaitingReview: 4
  });

  // Scoring rubric state
  const [scoreObs, setScoreObs] = useState(38); // max 40
  const [scoreInterview, setScoreInterview] = useState(28); // max 30
  const [scorePortfolio, setScorePortfolio] = useState(19); // max 20
  const [scoreSafety, setScoreSafety] = useState(10); // max 10
  const [assessorNotes, setAssessorNotes] = useState(
    'Candidate demonstrates exemplary field safety, complete lockout-tagout protocol rigor, and accurate schematic tracing under direct observation.'
  );
  const [evalStatus, setEvalStatus] = useState('VERIFIED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

  const totalScore = (Number(scoreObs) + Number(scoreInterview) + Number(scorePortfolio) + Number(scoreSafety));

  const fetchCandidatesAndStats = async () => {
    try {
      // 1. Fetch stats
      const statsRes = await fetch('/api/assessments/rpl/stats');
      const statsJson = await statsRes.json();
      if (statsJson.success && statsJson.data) {
        setStats(statsJson.data);
      }

      // 2. Fetch candidates roster
      const candRes = await fetch('/api/assessments/rpl/candidates');
      const candJson = await candRes.json();
      if (candJson.success && Array.isArray(candJson.data)) {
        setCandidates(candJson.data);
        if (candJson.data.length > 0 && !selectedCandidate) {
          loadCandidateDossier(candJson.data[0]);
        }
      }
    } catch (err) {
      console.warn('Error loading assessor workspace data:', err);
    }
  };

  const loadCandidateDossier = async (candidate) => {
    setSelectedCandidate(candidate);
    try {
      const res = await fetch(`/api/assessments/rpl/candidate/${candidate.id || candidate.candidateId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setEvidenceList(data.data.evidence || []);
        if (data.data.assessment?.scores) {
          setScoreObs(data.data.assessment.scores.directObservation || 38);
          setScoreInterview(data.data.assessment.scores.technicalInterview || 28);
          setScorePortfolio(data.data.assessment.scores.evidencePortfolio || 19);
          setScoreSafety(data.data.assessment.scores.safetyStandards || 10);
        }
        if (data.data.assessment?.assessorNotes) {
          setAssessorNotes(data.data.assessment.assessorNotes);
        }
        if (data.data.assessment?.status) {
          setEvalStatus(data.data.assessment.status);
        }
      }
    } catch (err) {
      console.warn('Error loading candidate dossier:', err);
    }
  };

  useEffect(() => {
    fetchCandidatesAndStats();
  }, []);

  const handleVerifyCandidate = async (newStatus = 'VERIFIED') => {
    setIsSubmitting(true);
    try {
      const payload = {
        assessmentId: selectedCandidate?.id || 'asmt_rpl_8842',
        candidateId: selectedCandidate?.candidateId || 'demo-student-user-canonical',
        candidateName: selectedCandidate?.candidateName || 'Rajesh Kumar',
        directObservation: scoreObs,
        technicalInterview: scoreInterview,
        evidencePortfolio: scorePortfolio,
        safetyStandards: scoreSafety,
        assessorNotes,
        status: newStatus
      };

      const res = await fetch('/api/assessments/rpl/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setEvalStatus(newStatus);
        showToast(
          newStatus === 'VERIFIED'
            ? '✓ Candidate successfully certified! Tamper-evident credential sealed into National RPL Registry.'
            : 'Evaluation recorded and candidate flagged for review.'
        );
        fetchCandidatesAndStats();
      } else {
        showToast(data.message || 'Verification update failed.');
      }
    } catch (err) {
      showToast('Network error updating candidate calibration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const assessorName = user?.name || 'Dr. Meenakshi Sundaram';

  const filteredCandidates = candidates.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.candidateName || '').toLowerCase().includes(q) ||
      (c.trade || '').toLowerCase().includes(q) ||
      (c.qualification || '').toLowerCase().includes(q) ||
      (c.recordKey || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-surface flex flex-col w-full text-on-surface">
      {/* ── TOAST NOTIFICATION ── */}
      <div
        className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 pointer-events-none flex items-center gap-3 px-4 py-3 bg-[#17212b] text-[#f3f1eb] rounded-lg shadow-xl border border-[#2d3a47] ${
          toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}
      >
        <span className="material-symbols-outlined text-primary-fixed text-[20px]">check_circle</span>
        <span className="text-[13px] font-medium">{toastMessage}</span>
      </div>

      {/* ── TOP HEADER ── */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#17212b] z-40 border-b border-[#2d3a47] shadow-sm">
        <div className="h-full max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <SkillWorthLogo height={34} inverted={true} showSubtitle={true} />
            <div className="hidden md:flex items-center gap-2 text-[12px] text-[#bec9c7]">
              <span className="px-2 py-0.5 rounded bg-white/10 uppercase tracking-wider text-[#a5f0eb] font-semibold">
                Assessor Calibration Cockpit
              </span>
              <span>•</span>
              <span>ISO/IEC 17024 Accredited</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-2 mr-4">
              <button
                onClick={() => onNavigate && onNavigate('worker-portal')}
                className="px-3 py-1.5 rounded text-[13px] font-medium text-[#bec9c7] hover:text-white transition-colors"
              >
                Worker Portal
              </button>
              <button
                onClick={() => onNavigate && onNavigate('assessor-workspace')}
                className="px-3 py-1.5 rounded text-[13px] font-semibold bg-white/10 text-white"
              >
                Assessor Workspace
              </button>
              <button
                onClick={() => onNavigate && onNavigate('institution-portal')}
                className="px-3 py-1.5 rounded text-[13px] font-medium text-[#bec9c7] hover:text-white transition-colors"
              >
                Institution Management
              </button>
            </nav>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded text-[#bec9c7] hover:text-white hover:bg-white/10 transition-colors"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── ASSESSOR MAIN WORKSPACE ── */}
      <main className="w-full pt-20 pb-16 flex-1">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col gap-6">
          {/* Assessor Identity & Search Strip */}
          <div className="stitch-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXnM6ws1vEPaOUOPV3UdPfZWW6vbUB72G_1j5l-K5Lz7-lHhL289gCshgEUzt3HJhD2Et171kJxvQiaCGR189TiRL36MvzkIL4bcv_H0pcUJzzU8DVyi_-ZCe0rcnlf0KNnHXoR5iGEypu_5YKDqAZdWU7fheUeiz7H7tx2V1UVqDqU1_qRDv_Q-YsebQvmqzjigLsMBX3zdZ3ay__x-PwfJVe4o3YDAJkxZUNmPA238_BhuVVJRPE1w"
                  alt={assessorName}
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center ring-2 ring-white">
                  <span className="material-symbols-outlined text-[10px] text-white">verified</span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-headline-lg text-on-surface text-[22px]">{assessorName}</h1>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
                    Lead Technical Assessor
                  </span>
                  <span className="text-[11px] font-mono text-secondary px-1.5 py-0.5 rounded bg-surface-container">
                    SEC-AUDIT-409
                  </span>
                </div>
                <p className="text-[13px] text-on-surface-variant flex items-center gap-2 mt-0.5">
                  <span>Specialization: Electrical &amp; Mechanical Systems</span>
                  <span>•</span>
                  <span className="font-mono text-primary font-medium">ISO/IEC 17024 Accredited</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate, trade..."
                  className="stitch-input pl-9 text-[13px] h-10"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-surface-container text-[13px]">
                <span className="material-symbols-outlined text-primary text-[18px]">fact_check</span>
                <span className="text-secondary font-medium">Active Session:</span>
                <span className="font-bold text-primary">{stats.assignedDossiers} Assigned</span>
              </div>
            </div>
          </div>

          {/* 4 Metrics Stat Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stitch-card p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold block">
                  Assigned Dossiers
                </span>
                <span className="font-headline-xl text-[28px] text-on-surface mt-1 block">
                  {stats.assignedDossiers}
                </span>
                <span className="text-[12px] text-primary flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span> 4 due this week
                </span>
              </div>
              <div className="w-11 h-11 rounded bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">assignment</span>
              </div>
            </div>

            <div className="stitch-card p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold block">
                  In Progress
                </span>
                <span className="font-headline-xl text-[28px] text-primary mt-1 block">
                  {stats.inProgress}
                </span>
                <span className="text-[12px] text-secondary flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">timelapse</span> 2 under active rubric
                </span>
              </div>
              <div className="w-11 h-11 rounded bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">pending_actions</span>
              </div>
            </div>

            <div className="stitch-card p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold block">
                  Completed Audits
                </span>
                <span className="font-headline-xl text-[28px] text-on-surface mt-1 block">
                  {stats.completedAudits}
                </span>
                <span className="text-[12px] text-primary flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span> 98.2% compliance
                </span>
              </div>
              <div className="w-11 h-11 rounded bg-surface-container text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">task_alt</span>
              </div>
            </div>

            <div className="stitch-card p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-tertiary font-semibold block">
                  Awaiting Review
                </span>
                <span className="font-headline-xl text-[28px] text-tertiary mt-1 block">
                  {stats.awaitingReview}
                </span>
                <span className="text-[12px] text-tertiary flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">priority_high</span> Calibration flags
                </span>
              </div>
              <div className="w-11 h-11 rounded bg-tertiary/15 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">flag</span>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center gap-2 p-1 bg-surface-container rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('eval')}
              className={`px-4 py-2 rounded text-[13px] font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'eval'
                  ? 'bg-white text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-primary">rate_review</span>
              <span>Active Calibration: {selectedCandidate?.candidateName || 'Rajesh Kumar'}</span>
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-4 py-2 rounded text-[13px] font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'candidates'
                  ? 'bg-white text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span>Candidates Roster ({candidates.length})</span>
            </button>
          </div>

          {/* ── TAB 1: ACTIVE CALIBRATION ── */}
          {activeTab === 'eval' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Candidate Dossier & Submitted Evidence (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* Candidate Overview Card */}
                <div className="stitch-card p-6">
                  <div className="flex items-center justify-between pb-3 border-b border-[#DDDCD4] mb-4">
                    <span className="text-[11px] uppercase font-bold text-primary tracking-wider">
                      Candidate Dossier
                    </span>
                    <span className={`status-chip ${evalStatus === 'VERIFIED' ? 'verified' : 'review'}`}>
                      {evalStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <img
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgBAL3eJ_VcA0vM3L85ctin0fiMXZ9gnqJewqqeY5W8Dh-52PxXi6saOuGigSwguADXi9IOnK8nroNUNfKgn6if9MZH9JxAGM9MGV3-0EdM0r1xSlyeXJO45adsFLYpuwnYdHSAu9dTy-JxMWIMSWulcB9Bxq9UI05ocJNhqN7gUlXfqCwRIc5sbgLp_F2MPgf_2uqXA7PKs80WBENZqHx-gob0S2ihMPMHV1913YdAOHmI3MLa4uQ8g"
                      alt="Candidate"
                    />
                    <div>
                      <h3 className="font-headline-sm text-on-surface text-[18px]">
                        {selectedCandidate?.candidateName || 'Rajesh Kumar'}
                      </h3>
                      <span className="text-[13px] text-on-surface-variant font-medium block">
                        {selectedCandidate?.trade || 'Electrical Maintenance Specialist'}
                      </span>
                      <span className="text-[12px] font-mono text-secondary">
                        ID: {selectedCandidate?.candidateId || 'RPL-8842-IN'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-surface-container rounded border border-[#DDDCD4]/60 text-[13px] text-on-surface-variant">
                    <span className="font-semibold text-on-surface block mb-1">Target Qualification:</span>
                    <span>Certificate IV in Electrical Maintenance (ANZSCO / NSQF Level 5)</span>
                  </div>
                </div>

                {/* Submitted Evidence Artifacts for Inspection */}
                <div className="stitch-card p-6">
                  <div className="flex items-center justify-between pb-3 border-b border-[#DDDCD4] mb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">folder_special</span>
                      <h3 className="font-headline-sm text-on-surface">Candidate Evidence Dossier</h3>
                    </div>
                    <span className="text-[12px] font-mono text-secondary font-semibold">
                      {evidenceList.length} ARTIFACTS
                    </span>
                  </div>

                  <div className="flex flex-col divide-y divide-[#DDDCD4]/60">
                    {evidenceList.map((item) => (
                      <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary mt-0.5">
                            <span className="material-symbols-outlined text-[18px]">
                              {item.category?.includes('Photo') ? 'photo_camera' : item.category?.includes('Audio') ? 'mic' : item.category?.includes('Blueprint') ? 'architecture' : 'description'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-headline-sm text-[13px] text-on-surface">{item.title}</h4>
                            <div className="flex items-center gap-2 text-[11px] text-secondary mt-0.5">
                              <span>{item.category || 'Vocational Artifact'}</span>
                              <span>•</span>
                              <span>{item.issuer || 'Verified Site'}</span>
                            </div>
                          </div>
                        </div>

                        <span className={`status-chip ${item.status === 'Verified' ? 'verified' : 'review'}`}>
                          {item.status || 'Verified'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Assessor Calibration Rubrics & Actions (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="stitch-card p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#DDDCD4] mb-4">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-primary tracking-wider">
                        Assessor Calibration Matrix
                      </span>
                      <h3 className="font-headline-sm text-on-surface">
                        ISO/IEC 17024 Weighted Rubric Scoring
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] uppercase text-secondary font-semibold block">Total Calibration</span>
                      <span className="text-[22px] font-bold text-primary font-mono">{totalScore}%</span>
                    </div>
                  </div>

                  {/* Rubric Input 1: Direct Observation (40%) */}
                  <div className="p-4 rounded bg-surface-container-low border border-[#DDDCD4] mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-headline-sm text-[14px] text-on-surface">
                          1. Direct Observation: Isolation &amp; Lockout/Tagout (Weight: 40%)
                        </h4>
                        <p className="text-[12px] text-on-surface-variant">
                          Execution of circuit isolation, zero energy testing, and statutory tag placement.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="40"
                          value={scoreObs}
                          onChange={(e) => setScoreObs(Number(e.target.value))}
                          className="stitch-input w-20 text-center font-bold text-[15px]"
                        />
                        <span className="text-[13px] text-secondary">/ 40</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={scoreObs}
                      onChange={(e) => setScoreObs(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>

                  {/* Rubric Input 2: Technical Interview (30%) */}
                  <div className="p-4 rounded bg-surface-container-low border border-[#DDDCD4] mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-headline-sm text-[14px] text-on-surface">
                          2. Technical Interview: Motor Diagnostics &amp; Fault Tracing (Weight: 30%)
                        </h4>
                        <p className="text-[12px] text-on-surface-variant">
                          Acoustic resonance diagnosis, insulation resistance reading interpretation.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={scoreInterview}
                          onChange={(e) => setScoreInterview(Number(e.target.value))}
                          className="stitch-input w-20 text-center font-bold text-[15px]"
                        />
                        <span className="text-[13px] text-secondary">/ 30</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={scoreInterview}
                      onChange={(e) => setScoreInterview(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>

                  {/* Rubric Input 3: Evidence Portfolio (20%) */}
                  <div className="p-4 rounded bg-surface-container-low border border-[#DDDCD4] mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-headline-sm text-[14px] text-on-surface">
                          3. Evidence Portfolio: Documented Field History (Weight: 20%)
                        </h4>
                        <p className="text-[12px] text-on-surface-variant">
                          Inspection of 5 independent work logs, site photos, blueprints, and supervisor sign-offs.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={scorePortfolio}
                          onChange={(e) => setScorePortfolio(Number(e.target.value))}
                          className="stitch-input w-20 text-center font-bold text-[15px]"
                        />
                        <span className="text-[13px] text-secondary">/ 20</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={scorePortfolio}
                      onChange={(e) => setScorePortfolio(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>

                  {/* Rubric Input 4: Safety & Standards (10%) */}
                  <div className="p-4 rounded bg-surface-container-low border border-[#DDDCD4] mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-headline-sm text-[14px] text-on-surface">
                          4. Workplace Safety &amp; ISO 17024 Compliance Standards (Weight: 10%)
                        </h4>
                        <p className="text-[12px] text-on-surface-variant">
                          Continuous adherence to statutory electrical safety rules, PPE usage, and reporting.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={scoreSafety}
                          onChange={(e) => setScoreSafety(Number(e.target.value))}
                          className="stitch-input w-20 text-center font-bold text-[15px]"
                        />
                        <span className="text-[13px] text-secondary">/ 10</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={scoreSafety}
                      onChange={(e) => setScoreSafety(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>

                  {/* Assessor Notes Textarea */}
                  <div className="mb-4">
                    <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                      Lead Assessor Calibration Remarks &amp; Certification Justification
                    </label>
                    <textarea
                      rows={3}
                      value={assessorNotes}
                      onChange={(e) => setAssessorNotes(e.target.value)}
                      className="stitch-textarea text-[13px]"
                    />
                  </div>

                  {/* Assessor Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#DDDCD4]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerifyCandidate('UNDER_REVIEW')}
                        disabled={isSubmitting}
                        className="btn-neutral text-[13px]"
                      >
                        Request Supplementary Evidence
                      </button>
                    </div>

                    <button
                      onClick={() => handleVerifyCandidate('VERIFIED')}
                      disabled={isSubmitting}
                      className="btn-primary px-6 py-2.5 text-[14px]"
                    >
                      {isSubmitting ? (
                        <span>Processing Registry Attestation...</span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          <span>Sign-off &amp; Certify Candidate ({totalScore}%)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: CANDIDATES ROSTER ── */}
          {activeTab === 'candidates' && (
            <div className="stitch-card p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#DDDCD4] mb-4">
                <div>
                  <h3 className="font-headline-sm text-on-surface">Accreditation Candidates Roster</h3>
                  <p className="text-[13px] text-on-surface-variant">
                    Assigned RPL candidates queued for practical observation and evidence verification.
                  </p>
                </div>
                <span className="text-[12px] font-mono text-secondary">
                  SHOWING {filteredCandidates.length} CANDIDATES
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#DDDCD4] text-[11px] uppercase tracking-wider text-secondary">
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Vocational Domain / Trade</th>
                      <th className="py-3 px-4">Evidence Artifacts</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDDCD4]/60">
                    {filteredCandidates.map((cand) => (
                      <tr key={cand.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-on-surface block">{cand.candidateName}</span>
                          <span className="text-[11px] font-mono text-secondary">{cand.recordKey || cand.candidateId}</span>
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant font-medium">
                          {cand.trade || 'Electrical Maintenance Specialist'}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-primary">
                          {cand.evidenceCount || 5} Documents
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-on-surface">
                          {cand.score ? `${cand.score}%` : 'Pending'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`status-chip ${cand.status === 'VERIFIED' ? 'verified' : 'review'}`}>
                            {cand.status || 'Under Review'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              loadCandidateDossier(cand);
                              setActiveTab('eval');
                            }}
                            className="btn-neutral text-[12px] py-1 px-3"
                          >
                            Open for Calibration
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
