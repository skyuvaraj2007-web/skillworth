import React, { useState, useEffect } from 'react';
import SkillWorthLogo from '../components/SkillWorthLogo';

export default function InstitutionPortal({ user, onNavigate, onLogout }) {
  const [stats, setStats] = useState({
    totalLearners: 1480,
    activeAssessments: 28,
    assessmentsCompleted: 892,
    credentialsIssued: 814
  });
  const [candidates, setCandidates] = useState([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  // Wizard state for creating assessment protocol
  const [protoTitle, setProtoTitle] = useState('Certificate IV in Electrical Maintenance RPL Protocol');
  const [protoTrade, setProtoTrade] = useState('Electrical & Mechanical Systems');
  const [protoLevel, setProtoLevel] = useState('ANZSCO / NSQF Equivalent Level 5');
  const [protoAssessor, setProtoAssessor] = useState('Dr. Meenakshi Sundaram');
  const [protoWeightObs, setProtoWeightObs] = useState(40);
  const [protoWeightInt, setProtoWeightInt] = useState(30);
  const [protoWeightPort, setProtoWeightPort] = useState(20);
  const [protoWeightSafe, setProtoWeightSafe] = useState(10);
  const [isSubmittingProto, setIsSubmittingProto] = useState(false);

  // Issue Credential state
  const [issueCandidateId, setIssueCandidateId] = useState('demo-student-user-canonical');
  const [issueCandidateName, setIssueCandidateName] = useState('Rajesh Kumar');
  const [issueTitle, setIssueTitle] = useState('Certificate IV in Electrical Maintenance');
  const [isIssuing, setIsIssuing] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

  const fetchInstitutionData = async () => {
    try {
      const statsRes = await fetch('/api/assessments/rpl/stats');
      const statsData = await statsRes.json();
      if (statsData.success && statsData.data) {
        setStats(statsData.data);
      }

      const candRes = await fetch('/api/assessments/rpl/candidates');
      const candData = await candRes.json();
      if (candData.success && Array.isArray(candData.data)) {
        setCandidates(candData.data);
      }
    } catch (err) {
      console.warn('Error fetching institution telemetry:', err);
    }
  };

  useEffect(() => {
    fetchInstitutionData();
  }, []);

  const handleCreateProtocol = async (e) => {
    e.preventDefault();
    setIsSubmittingProto(true);
    try {
      const payload = {
        title: protoTitle,
        qualification: protoLevel,
        trade: protoTrade,
        assessorAllocation: protoAssessor,
        rubrics: [
          { title: 'Direct Practical Observation', weight: protoWeightObs },
          { title: 'Technical Interview', weight: protoWeightInt },
          { title: 'Evidence Portfolio Audit', weight: protoWeightPort },
          { title: 'Workplace Safety Compliance', weight: protoWeightSafe }
        ]
      };

      const res = await fetch('/api/assessments/rpl/create-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Assessment protocol published to National Prior Learning Registry.');
        setWizardOpen(false);
        fetchInstitutionData();
      } else {
        showToast(data.message || 'Failed to publish protocol.');
      }
    } catch (err) {
      showToast('Network error publishing assessment protocol.');
    } finally {
      setIsSubmittingProto(false);
    }
  };

  const handleIssueCredential = async (e) => {
    e.preventDefault();
    setIsIssuing(true);
    try {
      const res = await fetch('/api/assessments/rpl/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: `asmt_${Date.now()}`,
          candidateId: issueCandidateId,
          candidateName: issueCandidateName,
          title: issueTitle,
          status: 'VERIFIED',
          directObservation: 40,
          technicalInterview: 30,
          evidencePortfolio: 20,
          safetyStandards: 10,
          assessorNotes: 'Directly issued by National Accreditation Council authority.'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Official Credential sealed and awarded to ${issueCandidateName}!`);
        setIssueModalOpen(false);
        fetchInstitutionData();
      } else {
        showToast(data.message || 'Error issuing credential.');
      }
    } catch (err) {
      showToast('Network error issuing credential.');
    } finally {
      setIsIssuing(false);
    }
  };

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
              <span className="px-2 py-0.5 rounded bg-white/10 uppercase tracking-wider text-[#ffd68c] font-semibold">
                National Governance Council
              </span>
              <span>•</span>
              <span>Tier-1 Accreditation Body</span>
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
                className="px-3 py-1.5 rounded text-[13px] font-medium text-[#bec9c7] hover:text-white transition-colors"
              >
                Assessor Workspace
              </button>
              <button
                onClick={() => onNavigate && onNavigate('institution-portal')}
                className="px-3 py-1.5 rounded text-[13px] font-semibold bg-white/10 text-white"
              >
                Institution Cockpit
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

      {/* ── INSTITUTION MAIN CONTENT ── */}
      <main className="w-full pt-20 pb-16 flex-1">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col gap-6">
          {/* Cockpit Sub-Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[11px] font-mono text-secondary uppercase tracking-widest font-semibold">
                <span>NSDC ACCREDITATION #892-RPL</span>
                <span>•</span>
                <span>REGULATORY COUNCIL TIER-1</span>
              </div>
              <h1 className="font-headline-xl text-on-surface text-[28px] tracking-tight">
                Institutional Assessment Cockpit
              </h1>
              <p className="text-[14px] text-on-surface-variant max-w-2xl">
                National framework compliance engine for Prior Learning recognition, rubric verification, and cryptographic registry distribution.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIssueModalOpen(true)}
                className="btn-neutral text-[13px] px-4 py-2.5 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">verified</span>
                <span>Issue Credential</span>
              </button>
              <button
                onClick={() => setWizardOpen(!wizardOpen)}
                className="btn-primary text-[13px] px-5 py-2.5 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Create Assessment</span>
              </button>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stitch-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-secondary uppercase tracking-wider">
                  Total Learners
                </span>
                <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">groups</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-xl text-[30px] text-on-surface font-bold">
                  {stats.totalLearners?.toLocaleString()}
                </span>
                <span className="text-[12px] text-primary font-bold flex items-center">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +12.4%
                </span>
              </div>
              <span className="text-[12px] text-on-surface-variant mt-1">
                Registered across 18 vocational domains
              </span>
            </div>

            <div className="stitch-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-secondary uppercase tracking-wider">
                  Active Assessments
                </span>
                <div className="w-8 h-8 rounded bg-secondary-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-xl text-[30px] text-on-surface font-bold">
                  {stats.activeAssessments}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-[#604400] text-[11px] font-semibold font-mono">
                  4 in audit
                </span>
              </div>
              <span className="text-[12px] text-on-surface-variant mt-1">
                Average completion turnaround: 4.2 days
              </span>
            </div>

            <div className="stitch-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-secondary uppercase tracking-wider">
                  Assessments Completed
                </span>
                <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-xl text-[30px] text-on-surface font-bold">
                  {stats.assessmentsCompleted}
                </span>
                <span className="text-[12px] text-primary font-bold flex items-center">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span> 94.8% pass
                </span>
              </div>
              <span className="text-[12px] text-on-surface-variant mt-1">
                Compliant with ISO/IEC 17024 standards
              </span>
            </div>

            <div className="stitch-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-secondary uppercase tracking-wider">
                  Credentials Issued
                </span>
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-xl text-[30px] text-on-surface font-bold">
                  {stats.credentialsIssued}
                </span>
                <span className="text-[12px] text-secondary font-medium">On-chain &amp; PDF</span>
              </div>
              <span className="text-[12px] text-on-surface-variant mt-1">
                Tamper-evident W3C Verifiable Credentials
              </span>
            </div>
          </div>

          {/* Assessment Protocol Designer Wizard (Collapsible) */}
          {wizardOpen && (
            <div className="stitch-card p-6 bg-surface-container-low border-2 border-primary/30 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-[#DDDCD4] mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
                  <h3 className="font-headline-sm text-on-surface">Assessment Protocol Designer Studio</h3>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-secondary text-[11px] font-mono">
                    STUDIO v3.4
                  </span>
                </div>
                <button
                  onClick={() => setWizardOpen(false)}
                  className="text-secondary hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateProtocol} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                    Protocol Title
                  </label>
                  <input
                    type="text"
                    required
                    value={protoTitle}
                    onChange={(e) => setProtoTitle(e.target.value)}
                    className="stitch-input"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                    Trade / Vocational Sector
                  </label>
                  <input
                    type="text"
                    required
                    value={protoTrade}
                    onChange={(e) => setProtoTrade(e.target.value)}
                    className="stitch-input"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                    Qualification Framework Level
                  </label>
                  <input
                    type="text"
                    required
                    value={protoLevel}
                    onChange={(e) => setProtoLevel(e.target.value)}
                    className="stitch-input"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                    Lead Accredited Assessor Allocation
                  </label>
                  <select
                    value={protoAssessor}
                    onChange={(e) => setProtoAssessor(e.target.value)}
                    className="stitch-select"
                  >
                    <option value="Dr. Meenakshi Sundaram">Dr. Meenakshi Sundaram (SEC-AUDIT-409)</option>
                    <option value="Er. Ramesh Kumar">Er. Ramesh Kumar (SEC-AUDIT-102)</option>
                    <option value="Dr. Suresh Swaminathan">Dr. Suresh Swaminathan (SEC-AUDIT-884)</option>
                  </select>
                </div>

                <div className="md:col-span-2 pt-2">
                  <span className="text-[12px] font-bold text-on-surface uppercase block mb-2">
                    Rubric Factor Weights (Must total 100%)
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-white rounded border border-[#DDDCD4]">
                      <span className="text-[11px] text-secondary font-semibold block">Observation</span>
                      <input
                        type="number"
                        value={protoWeightObs}
                        onChange={(e) => setProtoWeightObs(Number(e.target.value))}
                        className="stitch-input mt-1 text-center font-bold"
                      />
                    </div>
                    <div className="p-3 bg-white rounded border border-[#DDDCD4]">
                      <span className="text-[11px] text-secondary font-semibold block">Interview</span>
                      <input
                        type="number"
                        value={protoWeightInt}
                        onChange={(e) => setProtoWeightInt(Number(e.target.value))}
                        className="stitch-input mt-1 text-center font-bold"
                      />
                    </div>
                    <div className="p-3 bg-white rounded border border-[#DDDCD4]">
                      <span className="text-[11px] text-secondary font-semibold block">Evidence</span>
                      <input
                        type="number"
                        value={protoWeightPort}
                        onChange={(e) => setProtoWeightPort(Number(e.target.value))}
                        className="stitch-input mt-1 text-center font-bold"
                      />
                    </div>
                    <div className="p-3 bg-white rounded border border-[#DDDCD4]">
                      <span className="text-[11px] text-secondary font-semibold block">Safety</span>
                      <input
                        type="number"
                        value={protoWeightSafe}
                        onChange={(e) => setProtoWeightSafe(Number(e.target.value))}
                        className="stitch-input mt-1 text-center font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardOpen(false)}
                    className="btn-neutral"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProto}
                    className="btn-primary px-6"
                  >
                    {isSubmittingProto ? 'Publishing...' : 'Publish Assessment Protocol'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* National Candidate Cohort Registry Table */}
          <div className="stitch-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#DDDCD4] mb-4">
              <div>
                <h3 className="font-headline-sm text-on-surface">Candidate Cohort &amp; Verification Registry</h3>
                <p className="text-[13px] text-on-surface-variant">
                  Monitored candidate cohorts across vocational assessment centers and recognition authorities.
                </p>
              </div>
              <span className="text-[12px] font-mono text-secondary">
                {candidates.length} COHORT MEMBERS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#DDDCD4] text-[11px] uppercase tracking-wider text-secondary">
                    <th className="py-3 px-4">Candidate &amp; Key</th>
                    <th className="py-3 px-4">Trade Domain</th>
                    <th className="py-3 px-4">Assigned Qualification</th>
                    <th className="py-3 px-4">Evidence</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDDCD4]/60">
                  {candidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-on-surface block">{cand.candidateName}</span>
                        <span className="text-[11px] font-mono text-primary font-semibold">{cand.recordKey || cand.candidateId}</span>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant font-medium">
                        {cand.trade || 'Electrical Maintenance'}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        {cand.qualification || 'Certificate IV in Electrical Maintenance'}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-primary">
                        {cand.evidenceCount || 5} Artifacts
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-on-surface">
                        {cand.score ? `${cand.score}%` : 'Pending'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`status-chip ${cand.status === 'VERIFIED' ? 'verified' : 'review'}`}>
                          {cand.status || 'Under Review'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ── ISSUE CREDENTIAL MODAL ── */}
      {issueModalOpen && (
        <div className="stitch-modal-backdrop" onClick={() => setIssueModalOpen(false)}>
          <div
            className="stitch-modal p-6 md:p-8 flex flex-col gap-6 max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#DDDCD4]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">workspace_premium</span>
                <h3 className="font-headline-sm text-on-surface">Direct Credential Issuance</h3>
              </div>
              <button onClick={() => setIssueModalOpen(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleIssueCredential} className="flex flex-col gap-4">
              <div>
                <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                  Candidate Awardee
                </label>
                <input
                  type="text"
                  required
                  value={issueCandidateName}
                  onChange={(e) => setIssueCandidateName(e.target.value)}
                  className="stitch-input"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                  Qualification Title
                </label>
                <input
                  type="text"
                  required
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  className="stitch-input"
                />
              </div>

              <div className="p-3 bg-surface-container rounded text-[12px] text-secondary">
                <span>Accreditation Standard: </span>
                <span className="font-bold text-on-surface">ISO/IEC 17024:2012 Certified</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIssueModalOpen(false)}
                  className="btn-neutral"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIssuing}
                  className="btn-primary px-6"
                >
                  {isIssuing ? 'Sealing Credential...' : 'Seal & Issue Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
