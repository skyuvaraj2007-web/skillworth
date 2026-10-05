import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import RplAssessorWorkspace from '../components/RplAssessorWorkspace';
import RplCommandCentre from '../components/RplCommandCentre';

export default function InstitutionPortal({ setActivePage }) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews', 'protocols', 'profile'
  const [evidenceList, setEvidenceList] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [selectedEv, setSelectedEv] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evalMessage, setEvalMessage] = useState('');
  const [assessorStatus, setAssessorStatus] = useState('APPROVED');

  // RPL Candidate Management & Scheduling State
  const [rplAssessments, setRplAssessments] = useState([]);
  const [allQps, setAllQps] = useState([]);
  const [schedModal, setSchedModal] = useState(null);
  const [schedDate, setSchedDate] = useState('2026-10-15');
  const [schedTime, setSchedTime] = useState('09:30 AM - 01:30 PM');
  const [schedCentre, setSchedCentre] = useState('SkillWorth Regional Practical Centre');
  const [assignAssessorName, setAssignAssessorName] = useState('Dr. S. Meenakshi Sundaram');
  const [assignAssessorId, setAssignAssessorId] = useState('usr_demo_assessor_01');
  const [newQpTrade, setNewQpTrade] = useState('');
  const [newQpCode, setNewQpCode] = useState('');
  const [newQpSector, setNewQpSector] = useState('');
  const [newQpNsqf, setNewQpNsqf] = useState(4);
  const [newQpDesc, setNewQpDesc] = useState('');
  const [mgmtMessage, setMgmtMessage] = useState('');

  useEffect(() => {
    loadData();
    loadRplMgmtData();
  }, []);

  const loadRplMgmtData = async () => {
    try {
      const [rplRes, qpRes] = await Promise.all([
        api.getAssessorRplAssessments(),
        api.getQualificationPacks()
      ]);
      if (rplRes && rplRes.assessments) setRplAssessments(rplRes.assessments);
      if (qpRes && qpRes.qualificationPacks) setAllQps(qpRes.qualificationPacks);
    } catch (err) {
      console.error('Error loading RPL management data:', err);
    }
  };

  const handleScheduleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!schedModal) return;
    try {
      const res = await api.scheduleRplAssessment(schedModal.id, {
        date: schedDate,
        time: schedTime,
        location: schedCentre,
        assessorId: assignAssessorId,
        assessorName: assignAssessorName
      });
      if (res && res.success) {
        setMgmtMessage(`Assessment for ${schedModal.learnerName} scheduled on ${schedDate}. Assessor: ${assignAssessorName}`);
        setSchedModal(null);
        loadRplMgmtData();
      } else {
        setMgmtMessage(res.message || 'Error scheduling assessment.');
      }
    } catch (err) {
      setMgmtMessage('Failed to schedule assessment.');
    }
  };

  const handleCreateQp = async (e) => {
    if (e) e.preventDefault();
    if (!newQpTrade || !newQpCode) {
      alert('Trade title and QP code are required.');
      return;
    }
    try {
      const res = await api.createQualificationPack({
        trade: newQpTrade,
        qpCode: newQpCode,
        sector: newQpSector || 'Industrial Trades',
        nsqfLevel: Number(newQpNsqf) || 4,
        description: newQpDesc,
        keywords: [newQpTrade.toLowerCase(), newQpCode.toLowerCase()],
        toolsRequired: ['Trade Standard Hand Tools', 'Safety Equipment', 'Measuring Gauge'],
        competencies: [
          {
            id: 'comp_' + Date.now(),
            code: newQpCode.replace('/', '-') + '-N01',
            name: `${newQpTrade} Core Practical Operations`,
            title: `${newQpTrade} Core Practical Operations`,
            weight: 50,
            description: `Core operational execution for ${newQpTrade}.`,
            performanceCriteria: ['Follow standard operating procedures', 'Execute trade task safely'],
            observableIndicators: ['Tool selection', 'Safe procedure'],
            requiredEvidence: ['Photo/video proof'],
            assessmentChecklist: [
              { id: 'chk_new_1', task: 'Setup and execution', criteria: 'Work performed to trade standards.' }
            ]
          }
        ]
      });
      if (res && res.success) {
        setMgmtMessage(`New Qualification Pack added: ${newQpTrade} (${newQpCode}). Immediately available in assessment engine!`);
        setNewQpTrade('');
        setNewQpCode('');
        setNewQpSector('');
        setNewQpDesc('');
        loadRplMgmtData();
      } else {
        setMgmtMessage(res.message || 'Error creating Qualification Pack.');
      }
    } catch (err) {
      setMgmtMessage('Network error creating Qualification Pack.');
    }
  };

  const loadData = async () => {
    try {
      const [evRes, asmRes, statusRes] = await Promise.all([
        api.getAllEvidence(),
        api.getAssessments(),
        api.getAssessorStatus()
      ]);

      if (evRes.success && evRes.evidence) {
        setEvidenceList(evRes.evidence);
        if (evRes.evidence.length > 0) {
          setSelectedEv(evRes.evidence[0]);
        }
      }

      if (asmRes.success && asmRes.assessments) {
        setAssessments(asmRes.assessments);
      }

      if (statusRes.success) {
        setAssessorStatus(statusRes.status || 'APPROVED');
      }
    } catch (err) {
      console.error('Error loading institution data:', err);
    }
  };

  const handleEvaluate = async (decision) => {
    if (!selectedEv) return;
    setEvaluating(true);
    setEvalMessage('');

    try {
      const res = await api.evaluateEvidence(selectedEv.id || selectedEv.evidenceId, decision, feedback);
      if (res.success) {
        setEvalMessage(`Evaluation recorded: ${decision}. Credential updated.`);
        setFeedback('');
        // Refresh evidence list
        const evRes = await api.getAllEvidence();
        if (evRes.success && evRes.evidence) {
          setEvidenceList(evRes.evidence);
          const updated = evRes.evidence.find(e => (e.id || e.evidenceId) === (selectedEv.id || selectedEv.evidenceId));
          if (updated) setSelectedEv(updated);
        }
      } else {
        setEvalMessage(res.message || 'Evaluation submission failed.');
      }
    } catch (err) {
      setEvalMessage('Error recording assessor decision.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="sw-page-container">
      {/* Header Banner */}
      <div className="sw-dashboard-header">
        <div className="sw-profile-card">
          <div className="sw-profile-avatar" style={{ backgroundColor: '#fce8e6', color: '#d93025' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>account_balance</span>
          </div>
          <div className="sw-profile-info">
            <div className="sw-profile-title-row">
              <h2>{user?.institutionName || 'SkillWorth National Assessment Institute'}</h2>
              <span className={`sw-role-badge ${user?.verificationStatus === 'VERIFIED' ? 'sw-badge-green' : 'sw-badge-red'}`}>
                {user?.verificationStatus || 'VERIFIED'}
              </span>
            </div>
            <p className="sw-profile-sub">
              {user?.repDesignation || 'Director of Assessor Accreditation'} &bull; {user?.repFullName || 'Dr. S. Meenakshi Sundaram'}
            </p>
            <div className="sw-profile-meta-tags">
              <span className="sw-meta-tag"><span className="material-symbols-outlined">location_on</span> {user?.city || 'Chennai'}, {user?.state || 'Tamil Nadu'}</span>
              <span className="sw-meta-tag"><span className="material-symbols-outlined">badge</span> NIRF: {user?.recognitionId || 'NIRF-ENG-001'}</span>
              <span className="sw-meta-tag"><span className="material-symbols-outlined">gavel</span> Authorized RPL Assessment Center</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assessor Authorization Banner */}
      <div className="sw-notice-box" style={{ borderColor: assessorStatus === 'APPROVED' ? '#34a853' : '#f9ab00', backgroundColor: assessorStatus === 'APPROVED' ? '#e6f4ea' : '#fef7e0' }}>
        <span className="material-symbols-outlined" style={{ color: assessorStatus === 'APPROVED' ? '#137333' : '#b06000' }}>
          {assessorStatus === 'APPROVED' ? 'verified_user' : 'pending_actions'}
        </span>
        <div style={{ flex: 1 }}>
          <strong>Assessor Accreditation Status: {assessorStatus}</strong>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#3c4043' }}>
            {assessorStatus === 'APPROVED' 
              ? 'You are an Approved SkillWorth Lead Assessor authorized to officially verify practical learner competencies and record assessment recommendations.'
              : 'Institutional registration does NOT automatically authorize assessment. Your accreditation application is currently PENDING verification by the National Accreditation Board.'
            }
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sw-tabs-bar">
        <button
          className={`sw-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <span className="material-symbols-outlined">fact_check</span>
          <span>Review Candidate Evidence ({evidenceList.length})</span>
        </button>
        <button
          className={`sw-tab-btn ${activeTab === 'protocols' ? 'active' : ''}`}
          onClick={() => setActiveTab('protocols')}
        >
          <span className="material-symbols-outlined">quiz</span>
          <span>Assessment Protocols ({assessments.length})</span>
        </button>
        <button
          className={`sw-tab-btn ${activeTab === 'rpl_command_centre' ? 'active' : ''}`}
          onClick={() => setActiveTab('rpl_command_centre')}
        >
          <span className="material-symbols-outlined">hub</span>
          <span>RPL Command Centre</span>
        </button>
        <button
          className={`sw-tab-btn ${activeTab === 'rpl_assessor' ? 'active' : ''}`}
          onClick={() => setActiveTab('rpl_assessor')}
        >
          <span className="material-symbols-outlined">gavel</span>
          <span>RPL Assessor Workspace</span>
        </button>
        <button
          className={`sw-tab-btn ${activeTab === 'rpl_management' ? 'active' : ''}`}
          onClick={() => setActiveTab('rpl_management')}
        >
          <span className="material-symbols-outlined">manage_accounts</span>
          <span>RPL Scheduling &amp; QP Management</span>
        </button>
      </div>

      {/* ================= TAB 1: REVIEWS ================= */}
      {activeTab === 'reviews' && (
        <div className="sw-tab-content">
          <div className="sw-grid-2col" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
            {/* Candidate List */}
            <div className="sw-card">
              <h3 className="sw-card-title">Pending Evidence Queue</h3>
              <p className="sw-card-sub">Select a learner submission to evaluate artifacts and video demonstration.</p>

              <div className="sw-review-queue">
                {evidenceList.map(ev => (
                  <div
                    key={ev.id || ev.evidenceId}
                    className={`sw-queue-item ${(selectedEv?.id || selectedEv?.evidenceId) === (ev.id || ev.evidenceId) ? 'selected' : ''}`}
                    onClick={() => { setSelectedEv(ev); setEvalMessage(''); }}
                  >
                    <div className="sw-queue-top">
                      <span className="sw-queue-name">{ev.learnerName || 'Candidate'}</span>
                      <span className={`sw-status-badge ${ev.verificationStatus === 'VERIFIED' ? 'status-verified' : 'status-pending'}`}>
                        {ev.verificationStatus || 'PENDING'}
                      </span>
                    </div>
                    <div className="sw-queue-title">{ev.title}</div>
                    <div className="sw-queue-meta">
                      <span>{ev.skillName}</span> &bull; <span>{ev.evidenceType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluation Workspace */}
            <div className="sw-card">
              {selectedEv ? (
                <div>
                  <div className="sw-eval-header">
                    <div>
                      <h3 className="sw-card-title">{selectedEv.title}</h3>
                      <p className="sw-card-sub">
                        Candidate: <strong>{selectedEv.learnerName}</strong> &bull; Skill: <strong>{selectedEv.skillName}</strong>
                      </p>
                    </div>
                    <span className="sw-badge-pill">{selectedEv.competency}</span>
                  </div>

                  {/* Video Demonstration Player */}
                  {selectedEv.isVideo && (
                    <div className="sw-eval-video-section">
                      <h4 className="sw-section-heading">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#1a73e8' }}>smart_display</span>
                        Practical Video Demonstration
                      </h4>
                      {selectedEv.fileUrl ? (
                        <video src={selectedEv.fileUrl} controls className="sw-eval-video-player" />
                      ) : (
                        <div className="sw-video-placeholder">
                          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#1a73e8' }}>movie</span>
                          <p><strong>{selectedEv.fileName || 'async_rate_limiter_demo.mp4'}</strong> (18.5 MB)</p>
                          <span>Candidate uploaded high-definition screen & code walkthrough demonstration.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Candidate Description */}
                  <div className="sw-eval-desc-box">
                    <strong>Candidate Context:</strong>
                    <p>{selectedEv.description || 'Live code walkthrough demonstrating asyncio rate limiting with sliding window counters and memory profiling analysis.'}</p>
                  </div>

                  {/* AI Assistance Box */}
                  {selectedEv.aiAnalysis && (
                    <div className="sw-ai-telemetry-box" style={{ margin: '16px 0' }}>
                      <div className="sw-ai-header">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#1a73e8' }}>smart_toy</span>
                        <strong>AI Assistant Telemetry (Match: {selectedEv.aiAnalysis.confidenceScore}%)</strong>
                      </div>
                      <p className="sw-ai-summary">{selectedEv.aiAnalysis.summary}</p>
                      <small className="sw-ai-note">AI = Assistant. Authorized Human Assessor = Final Verifier.</small>
                    </div>
                  )}

                  {/* Official Assessor Evaluation Action */}
                  <div className="sw-assessor-action-panel">
                    <h4 className="sw-section-heading">Official Assessor Decision</h4>
                    
                    {evalMessage && (
                      <div className={`sw-alert ${evalMessage.includes('APPROVE') ? 'sw-alert-success' : 'sw-alert-error'}`}>
                        {evalMessage}
                      </div>
                    )}

                    <div className="sw-form-group">
                      <label>Assessor Feedback & Justification Notes *</label>
                      <textarea
                        rows="3"
                        placeholder="Detail the technical reasoning, standards conformance, and criteria evaluated..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                    </div>

                    <div className="sw-action-buttons-row">
                      <button
                        className="sw-btn-success"
                        disabled={evaluating || assessorStatus !== 'APPROVED'}
                        onClick={() => handleEvaluate('APPROVE')}
                      >
                        <span className="material-symbols-outlined">check_circle</span>
                        Approve & Issue Credential
                      </button>

                      <button
                        className="sw-btn-warning"
                        disabled={evaluating}
                        onClick={() => handleEvaluate('REQUEST_MORE_EVIDENCE')}
                      >
                        <span className="material-symbols-outlined">contact_support</span>
                        Request More Evidence
                      </button>

                      <button
                        className="sw-btn-danger"
                        disabled={evaluating}
                        onClick={() => handleEvaluate('REJECT')}
                      >
                        <span className="material-symbols-outlined">cancel</span>
                        Reject
                      </button>
                    </div>

                    {assessorStatus !== 'APPROVED' && (
                      <small style={{ color: '#d93025', display: 'block', marginTop: '8px' }}>
                        * Approval is restricted to APPROVED assessors. Current status: {assessorStatus}.
                      </small>
                    )}
                  </div>
                </div>
              ) : (
                <div className="sw-empty-state">
                  <span className="material-symbols-outlined">inbox</span>
                  <p>Select a candidate evidence artifact from the queue to review.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: PROTOCOLS ================= */}
      {activeTab === 'protocols' && (
        <div className="sw-tab-content">
          <div className="sw-card">
            <h3 className="sw-card-title">Accredited Assessment Protocols ({assessments.length})</h3>
            <p className="sw-card-sub">Standardized technical frameworks mapped to NSQF and SkillWorth competency guidelines.</p>

            <div className="sw-assessment-list">
              {assessments.map(asm => (
                <div key={asm.id} className="sw-assessment-item">
                  <div className="sw-asm-header">
                    <div>
                      <h3>{asm.title}</h3>
                      <p className="sw-asm-meta">
                        Domain: <strong>{asm.skillName}</strong> ? Passing Benchmark: <strong>{asm.passingScore}%</strong> ? Total Questions: <strong>{asm.questions?.length || 0}</strong>
                      </p>
                    </div>
                    <span className="sw-badge-green">PUBLISHED</span>
                  </div>
                  <div className="sw-protocol-q-preview">
                    {asm.questions?.map((q, idx) => (
                      <div key={q.id} className="sw-q-mini-card">
                        <span className="sw-q-mini-type">{q.type}</span>
                        <span>{idx + 1}. {q.questionText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: RPL ASSESSOR WORKSPACE ================= */}
      {activeTab === 'rpl_assessor' && (
        <div className="sw-tab-content">
          <RplAssessorWorkspace user={user} />
        </div>
      )}

      {/* ================= TAB 4: RPL CANDIDATE SCHEDULING & QP MANAGEMENT (Section 23, 24, 32) ================= */}
      {activeTab === 'rpl_management' && (
        <div className="sw-tab-content">
          {mgmtMessage && (
            <div className="sw-alert sw-alert-success" style={{ marginBottom: '16px' }}>
              {mgmtMessage}
            </div>
          )}

          {/* Section A: Pending RPL Assessments & Scheduling (Section 23 & 24) */}
          <div className="sw-card" style={{ marginBottom: '24px' }}>
            <div className="sw-card-header-flex">
              <div>
                <h3 className="sw-card-title">Candidate Practical Assessment Scheduling &amp; Assessor Allocation</h3>
                <p className="sw-card-sub">
                  Assign accredited assessors and schedule session date, time, and physical test centres. Candidates cannot self-assign assessors.
                </p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f4ef', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px' }}>Candidate Name</th>
                  <th style={{ padding: '10px' }}>Trade / Role</th>
                  <th style={{ padding: '10px' }}>Dossier Status</th>
                  <th style={{ padding: '10px' }}>Assigned Assessor</th>
                  <th style={{ padding: '10px' }}>Schedule Details</th>
                  <th style={{ padding: '10px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rplAssessments.map(asm => (
                  <tr key={asm.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{asm.learnerName}</td>
                    <td style={{ padding: '10px' }}>{asm.trade} ({asm.qpCode})</td>
                    <td style={{ padding: '10px' }}>
                      <span className="sw-status-badge status-pending">{asm.status}</span>
                    </td>
                    <td style={{ padding: '10px' }}>{asm.assessorName || 'Not Assigned'}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#555' }}>
                      {asm.scheduledDate ? `${asm.scheduledDate} (${asm.scheduledTime})` : 'Not Scheduled'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button
                        className="sw-btn-outline"
                        style={{ fontSize: '12px', padding: '4px 10px' }}
                        onClick={() => {
                          setSchedModal(asm);
                          if (asm.scheduledDate) setSchedDate(asm.scheduledDate);
                          if (asm.assessorName) setAssignAssessorName(asm.assessorName);
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit_calendar</span>
                        Assign / Schedule
                      </button>
                    </td>
                  </tr>
                ))}
                {rplAssessments.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                      No candidate assessment dossiers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal / Inline Schedule Form */}
          {schedModal && (
            <div className="sw-card" style={{ marginBottom: '24px', border: '2px solid #176B68', backgroundColor: '#fbfdfc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#176B68' }}>
                  Assign Assessor &amp; Schedule Session for: {schedModal.learnerName} ({schedModal.trade})
                </h4>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                  onClick={() => setSchedModal(null)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div className="sw-form-group">
                    <label>Authorized Assessor Name *</label>
                    <input
                      type="text"
                      required
                      value={assignAssessorName}
                      onChange={(e) => setAssignAssessorName(e.target.value)}
                    />
                  </div>

                  <div className="sw-form-group">
                    <label>Assessment Date *</label>
                    <input
                      type="date"
                      required
                      value={schedDate}
                      onChange={(e) => setSchedDate(e.target.value)}
                    />
                  </div>

                  <div className="sw-form-group">
                    <label>Session Timing *</label>
                    <input
                      type="text"
                      required
                      value={schedTime}
                      onChange={(e) => setSchedTime(e.target.value)}
                    />
                  </div>

                  <div className="sw-form-group">
                    <label>Practical Assessment Centre *</label>
                    <input
                      type="text"
                      required
                      value={schedCentre}
                      onChange={(e) => setSchedCentre(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <button type="submit" className="sw-btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
                    <span className="material-symbols-outlined">how_to_reg</span>
                    Save Assessor Assignment &amp; Schedule
                  </button>
                  <button type="button" className="sw-btn-outline" onClick={() => setSchedModal(null)} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Section B: Admin Qualification Pack Management (Section 32) */}
          <div className="sw-card">
            <h3 className="sw-card-title">Add / Register New NSQF Qualification Pack (Data-Driven Architecture)</h3>
            <p className="sw-card-sub">
              Adding a new trade here immediately registers it in the database and makes it available to the universal assessment engine without modifying React components.
            </p>

            <form onSubmit={handleCreateQp} style={{ marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div className="sw-form-group">
                  <label>Trade Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mason / Bricklayer"
                    value={newQpTrade}
                    onChange={(e) => setNewQpTrade(e.target.value)}
                  />
                </div>

                <div className="sw-form-group">
                  <label>QP Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CON/Q0102"
                    value={newQpCode}
                    onChange={(e) => setNewQpCode(e.target.value)}
                  />
                </div>

                <div className="sw-form-group">
                  <label>Industry Sector *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Construction &amp; Infrastructure"
                    value={newQpSector}
                    onChange={(e) => setNewQpSector(e.target.value)}
                  />
                </div>

                <div className="sw-form-group">
                  <label>NSQF Level *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newQpNsqf}
                    onChange={(e) => setNewQpNsqf(Number(e.target.value))}
                  />
                </div>

                <div className="sw-form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Job Role Description &amp; Scope</label>
                  <input
                    type="text"
                    placeholder="Laying bricks, concrete blocks, mortar preparation, and plumb checking..."
                    value={newQpDesc}
                    onChange={(e) => setNewQpDesc(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button type="submit" className="sw-btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
                  <span className="material-symbols-outlined">library_add</span>
                  Register Qualification Pack into Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAB: RPL COMMAND CENTRE (PHASE 4) ================= */}
      {activeTab === 'rpl_command_centre' && (
        <div className="sw-tab-content">
          <RplCommandCentre onOpenAssessment={(asmId) => {
            setActiveTab('rpl_assessor');
          }} />
        </div>
      )}
    </div>
  );
}
