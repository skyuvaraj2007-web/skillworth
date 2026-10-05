import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';

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

  useEffect(() => {
    loadData();
  }, []);

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
              <span className="sw-meta-tag"><span className="material-symbols-outlined">gavel</span> ISO 17024 Assessment Center</span>
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
              ? 'You are an Approved ISO/IEC 17024 Lead Assessor authorized to officially verify practical learner competencies and issue tamper-proof SkillWorth Credentials.'
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
            <p className="sw-card-sub">Standardized technical frameworks mapped to ISO/IEC 17024 competency guidelines.</p>

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
    </div>
  );
}
