import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import CompetencyEvidenceMatrix from './CompetencyEvidenceMatrix';
import RplAssessorWorkQueue from './RplAssessorWorkQueue';
import AIAssistanceDisclosure from './AIAssistanceDisclosure';

export default function RplAssessorWorkspace({ user }) {
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('evaluations'); // 'evaluations', 'analytics'
  const [workspaceView, setWorkspaceView] = useState('matrix'); // 'matrix', 'checklist'
  const [assessments, setAssessments] = useState([]);
  const [selectedAsm, setSelectedAsm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterTrade, setFilterTrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Workspace evaluation state
  const [scores, setScores] = useState({});
  const [overrideReasons, setOverrideReasons] = useState({});
  const [acceptedAi, setAcceptedAi] = useState({});
  const [showAiReasoning, setShowAiReasoning] = useState(false);
  const [assessorRemarks, setAssessorRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Analytics state
  const [analytics, setAnalytics] = useState(null);

  // Offline detection & sync state (Section 25)
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('IDLE'); // 'IDLE', 'OFFLINE', 'SYNCING', 'SYNCED', 'CONFLICT'
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Monitor network online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('ONLINE');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('OFFLINE');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const cached = JSON.parse(localStorage.getItem('skillworth_rpl_offline_pending') || '[]');
    setPendingSyncCount(cached.length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch assessments and consistency analytics
  const loadAssessments = async () => {
    setLoading(true);
    try {
      const res = await api.getAssessorRplAssessments({ trade: filterTrade, status: filterStatus });
      if (res && res.assessments) {
        setAssessments(res.assessments);
        if (res.assessments.length > 0 && !selectedAsm) {
          loadAssessmentDetails(res.assessments[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading assessor assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssessmentDetails = async (id) => {
    try {
      const res = await api.getRplAssessmentDetails(id);
      if (res && res.assessment) {
        setSelectedAsm(res);
        // Pre-fill existing scores
        const initialScores = {};
        const initialOverrides = {};
        const initialAccepted = {};
        (res.assessment.checklists || []).forEach(chk => {
          initialScores[chk.id] = chk.score !== null ? chk.score : 3;
          if (chk.overrideReason) initialOverrides[chk.id] = chk.overrideReason;
          initialAccepted[chk.id] = chk.acceptedAi !== null ? chk.acceptedAi : true;
        });
        setScores(initialScores);
        setOverrideReasons(initialOverrides);
        setAcceptedAi(initialAccepted);
        setAssessorRemarks(res.assessment.assessorFinalRemarks || '');
        setActionMessage('');
      }
    } catch (err) {
      console.error('Error loading assessment details:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await api.getAssessorConsistencyAnalytics();
      if (res && res.success) {
        setAnalytics(res);
      }
    } catch (err) {
      console.error('Error loading consistency analytics:', err);
    }
  };

  useEffect(() => {
    loadAssessments();
    loadAnalytics();
  }, [filterTrade, filterStatus]);

  // Handle Score change for a checklist item (0-4 Rubric)
  const handleScoreChange = (checklistId, val) => {
    const scoreVal = Number(val);
    setScores(prev => ({ ...prev, [checklistId]: scoreVal }));
  };

  // Handle Override AI recommendation (Section 16 Human Override)
  const handleToggleOverride = (checklistId) => {
    setAcceptedAi(prev => {
      const current = prev[checklistId] !== false;
      return { ...prev, [checklistId]: !current };
    });
  };

  // Save Checklist Evaluations (Online / Offline)
  const handleSaveChecklist = async () => {
    if (!selectedAsm) return;
    setSaving(true);
    setActionMessage('');

    // Check if any overridden item is missing an override reason
    const overriddenIds = Object.keys(acceptedAi).filter(id => acceptedAi[id] === false);
    const missingReasons = overriddenIds.filter(id => !overrideReasons[id] || !overrideReasons[id].trim());
    if (missingReasons.length > 0) {
      alert('Mandatory override reason required for each criterion where AI recommendation was overridden.');
      setSaving(false);
      return;
    }

    // If offline, save locally (Section 25)
    if (!isOnline) {
      const offlineQueue = JSON.parse(localStorage.getItem('skillworth_rpl_offline_pending') || '[]');
      offlineQueue.push({
        assessmentId: selectedAsm.assessment.id,
        timestamp: new Date().toISOString(),
        data: {
          scores,
          overrideReason: overrideReasons,
          acceptedAi
        }
      });
      localStorage.setItem('skillworth_rpl_offline_pending', JSON.stringify(offlineQueue));
      setPendingSyncCount(offlineQueue.length);
      setSyncStatus('OFFLINE_SAVED');
      setActionMessage('OFFLINE MODE: Saved in secure local storage. Will synchronize when reconnected.');
      setSaving(false);
      return;
    }

    try {
      const res = await api.submitChecklistScore(selectedAsm.assessment.id, {
        scores,
        overrideReason: overrideReasons,
        acceptedAi
      });

      if (res && res.success) {
        setActionMessage('Checklist evaluations and scores saved successfully to persistent database.');
        loadAssessmentDetails(selectedAsm.assessment.id);
        loadAnalytics(); // Refresh real analytics
      } else {
        setActionMessage(res.message || 'Error saving checklist.');
      }
    } catch (err) {
      setActionMessage('Network error saving checklist.');
    } finally {
      setSaving(false);
    }
  };

  // Submit Official Assessor Decision (Section 16 & 20)
  const handleDecision = async (decision) => {
    if (!selectedAsm) return;
    if (!assessorRemarks || !assessorRemarks.trim()) {
      alert('Assessor justification and competency remarks are required before submitting final decision.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.submitRplDecision(selectedAsm.assessment.id, decision, assessorRemarks);
      if (res && res.success) {
        setActionMessage(`Official assessor decision recorded: ${decision}. Assessment Record ID: ${res.credential?.credentialId || 'N/A'}`);
        loadAssessmentDetails(selectedAsm.assessment.id);
        loadAssessments();
        loadAnalytics();
      } else {
        setActionMessage(res.message || 'Error recording decision.');
      }
    } catch (err) {
      setActionMessage('Failed to submit decision.');
    } finally {
      setSaving(false);
    }
  };

  // Synchronize Offline Records with Conflict Handling (Section 25)
  const handleSyncOffline = async () => {
    const offlineQueue = JSON.parse(localStorage.getItem('skillworth_rpl_offline_pending') || '[]');
    if (offlineQueue.length === 0) {
      alert('No pending offline records to synchronize.');
      return;
    }

    setSyncStatus('SYNCING');
    try {
      const res = await api.syncOfflineData(offlineQueue, new Date().toISOString());
      if (res && res.success) {
        localStorage.removeItem('skillworth_rpl_offline_pending');
        setPendingSyncCount(0);
        if (res.conflicts && res.conflicts.length > 0) {
          setSyncStatus('CONFLICT');
          setActionMessage(`Synchronized with ${res.conflicts.length} conflict(s) detected. Server version preserved.`);
        } else {
          setSyncStatus('SYNCED');
          setActionMessage(`Successfully synchronized ${res.syncedCount} offline evaluation record(s).`);
        }
        loadAssessments();
        loadAnalytics();
      } else {
        setSyncStatus('CONFLICT');
        alert('Synchronization conflict or error: ' + (res.message || ''));
      }
    } catch (err) {
      setSyncStatus('OFFLINE');
      alert('Network error during synchronization.');
    }
  };

  return (
    <div className="sw-rpl-assessor-container">
      {/* Top Banner & Offline Alert */}
      <div className="sw-card" style={{ marginBottom: '20px', backgroundColor: '#ffffff' }}>
        <div className="sw-card-header-flex">
          <div>
            <div className="sw-hero-badge" style={{ backgroundColor: '#e6f4f3', color: '#176B68', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>gavel</span>
              <span>Universal Practical Assessment Engine &bull; SkillWorth RPL Standards</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1b1c18' }}>
              Standardized RPL Assessment Suite
            </h2>
            <p className="sw-card-sub">
              Trade-agnostic assessment engine dynamically loaded from Qualification Pack criteria. AI provides advisory evidence telemetry; authorized human assessors retain final evaluation authority.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Online / Offline status badge (Section 25) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: isOnline ? '#e6f4ea' : '#fce8e6',
                color: isOnline ? '#137333' : '#d93025',
                border: '1px solid ' + (isOnline ? '#34a853' : '#d93025')
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{isOnline ? 'wifi' : 'wifi_off'}</span>
              <span>{isOnline ? (syncStatus === 'SYNCED' ? 'SYNCED' : 'ONLINE MODE') : 'OFFLINE MODE'}</span>
            </div>

            {pendingSyncCount > 0 && (
              <button
                className="sw-btn-warning"
                onClick={handleSyncOffline}
                style={{ fontSize: '12px', padding: '6px 14px', minHeight: '36px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>sync</span>
                {syncStatus === 'SYNCING' ? 'SYNCING...' : `Sync Offline (${pendingSyncCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', borderTop: '1px solid #eae8e2', paddingTop: '14px' }}>
          <button
            className={`sw-btn-outline ${activeTab === 'queue' ? 'active' : ''}`}
            style={{ borderColor: activeTab === 'queue' ? '#176B68' : '#dddcd4', backgroundColor: activeTab === 'queue' ? '#e6f4f3' : 'transparent', minHeight: '40px' }}
            onClick={() => setActiveTab('queue')}
          >
            <span className="material-symbols-outlined">assignment_ind</span>
            Priority Work Queue
          </button>
          <button
            className={`sw-btn-outline ${activeTab === 'evaluations' ? 'active' : ''}`}
            style={{ borderColor: activeTab === 'evaluations' ? '#176B68' : '#dddcd4', backgroundColor: activeTab === 'evaluations' ? '#e6f4f3' : 'transparent', minHeight: '40px' }}
            onClick={() => setActiveTab('evaluations')}
          >
            <span className="material-symbols-outlined">rate_review</span>
            Assigned Practical Evaluations ({assessments.length})
          </button>
          <button
            className={`sw-btn-outline ${activeTab === 'analytics' ? 'active' : ''}`}
            style={{ borderColor: activeTab === 'analytics' ? '#176B68' : '#dddcd4', backgroundColor: activeTab === 'analytics' ? '#e6f4f3' : 'transparent', minHeight: '40px' }}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="material-symbols-outlined">analytics</span>
            Assessor Consistency Analytics
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`sw-alert ${actionMessage.includes('Official') || actionMessage.includes('success') || actionMessage.includes('Synchronized') ? 'sw-alert-success' : 'sw-alert-warning'}`} style={{ marginBottom: '16px' }}>
          {actionMessage}
        </div>
      )}

      {/* ================= TAB 0: ASSESSOR PRIORITY WORK QUEUE (PHASE 4) ================= */}
      {activeTab === 'queue' && (
        <RplAssessorWorkQueue
          onSelectAssessment={(asmId) => {
            loadAssessmentDetails(asmId);
            setActiveTab('evaluations');
          }}
        />
      )}

      {/* ================= TAB 1: 3-COLUMN UNIVERSAL ASSESSMENT ENGINE ================= */}
      {activeTab === 'evaluations' && (
        <div>
          {/* Filter Bar */}
          <div className="sw-card" style={{ padding: '12px 20px', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#444' }}>Filter Candidates:</span>
            <input
              type="text"
              placeholder="Filter by trade (Electrician, Carpenter...)"
              value={filterTrade}
              onChange={(e) => setFilterTrade(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px', width: '220px' }}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
            >
              <option value="">All Statuses</option>
              <option value="EVIDENCE_COLLECTION">Evidence Collection</option>
              <option value="ASSESSMENT_SCHEDULED">Assessment Scheduled</option>
              <option value="UNDER_ASSESSMENT">Under Assessment</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Candidate Selection & View Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#555f6b' }}>Select Candidate:</span>
              <select
                value={selectedAsm?.assessment?.id || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) loadAssessmentDetails(id);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #DDDCD4',
                  background: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                {assessments.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.learnerName} — {a.trade} ({a.status})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '6px', background: '#eae8e2', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setWorkspaceView('matrix')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: workspaceView === 'matrix' ? '#176B68' : 'transparent',
                  color: workspaceView === 'matrix' ? '#ffffff' : '#555f6b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>grid_view</span>
                Competency Evidence Matrix
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceView('checklist')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: workspaceView === 'checklist' ? '#176B68' : 'transparent',
                  color: workspaceView === 'checklist' ? '#ffffff' : '#555f6b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>checklist</span>
                Checklist Workspace
              </button>
            </div>
          </div>

          {selectedAsm ? (
            workspaceView === 'matrix' ? (
              <CompetencyEvidenceMatrix
                assessment={selectedAsm.assessment}
                qualificationPack={selectedAsm.assessment?.qualificationPack || {}}
                evidence={selectedAsm.assessment?.evidenceList || []}
                onUpdate={() => {
                  loadAssessmentDetails(selectedAsm.assessment.id);
                  loadAssessments();
                  loadAnalytics();
                }}
              />
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1.2fr', gap: '16px', alignItems: 'start' }}>
              {/* COLUMN 1: CANDIDATE & DOSSIER PROFILE */}
              <div className="sw-card">
                <div className="sw-card-header-icon" style={{ marginBottom: '12px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#176B68' }}>person</span>
                  <div>
                    <h3 className="sw-card-title">{selectedAsm.assessment.learnerName}</h3>
                    <span style={{ fontSize: '12px', color: '#5f6368' }}>ID: {selectedAsm.assessment.learnerId}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <strong style={{ color: '#666' }}>Target Trade / Occupation:</strong>
                    <div style={{ fontWeight: 600, color: '#1b1c18' }}>{selectedAsm.assessment.trade}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#666' }}>Qualification Pack:</strong>
                    <div>{selectedAsm.assessment.qpCode} (NSQF Level {selectedAsm.assessment.nsqfLevel})</div>
                  </div>
                  <div>
                    <strong style={{ color: '#666' }}>Assessment State:</strong>
                    <div style={{ marginTop: '2px' }}>
                      <span className="sw-status-badge status-pending">{selectedAsm.assessment.status}</span>
                    </div>
                  </div>

                  {/* Scheduled Session Details (Section 23) */}
                  <div style={{ marginTop: '8px', padding: '10px', borderRadius: '6px', backgroundColor: '#f5f8f7', border: '1px solid #dbe6e4', fontSize: '12px' }}>
                    <strong style={{ color: '#176B68', display: 'block', marginBottom: '4px' }}>Assessment Session:</strong>
                    <div><strong>Date:</strong> {selectedAsm.assessment.scheduledDate || 'Standard Session'}</div>
                    <div><strong>Time:</strong> {selectedAsm.assessment.scheduledTime || '09:30 AM'}</div>
                    <div><strong>Centre:</strong> {selectedAsm.assessment.assessmentCentre || 'SkillWorth Regional Practical Centre'}</div>
                  </div>
                </div>

                {/* Candidate List selector */}
                <div style={{ marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                  <strong style={{ fontSize: '12px', color: '#444' }}>Other Assigned Candidates:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {assessments.map(asm => (
                      <div
                        key={asm.id}
                        onClick={() => loadAssessmentDetails(asm.id)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: selectedAsm.assessment.id === asm.id ? '#e6f4f3' : '#f9f9f9',
                          border: '1px solid ' + (selectedAsm.assessment.id === asm.id ? '#176B68' : '#eee'),
                          fontSize: '12px'
                        }}
                      >
                        <strong>{asm.learnerName}</strong> &bull; {asm.trade}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLUMN 2: GENERIC DYNAMIC CHECKLIST & RUBRIC SCORING (Section 13 & 14) */}
              <div className="sw-card">
                <div className="sw-card-header-icon" style={{ marginBottom: '12px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#176B68' }}>rule</span>
                  <div>
                    <h3 className="sw-card-title">{selectedAsm.assessment.trade} Assessment Checklist</h3>
                    <p className="sw-card-sub">Universal Rubric: 0=Not demonstrated, 1=Partial, 2=Supported, 3=Competent, 4=Strong</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                  {(selectedAsm.assessment.checklists || []).map((chk) => (
                    <div
                      key={chk.id}
                      style={{
                        padding: '14px',
                        borderRadius: '6px',
                        border: '1px solid #eae8e2',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, marginRight: '12px' }}>
                          <span style={{ fontSize: '11px', color: '#176B68', fontWeight: 700 }}>{chk.competencyCode}</span>
                          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#222', margin: '2px 0' }}>{chk.task}</h4>
                          <p style={{ fontSize: '12px', color: '#555', margin: '2px 0 6px', lineHeight: 1.4 }}>
                            <strong>Criteria:</strong> {chk.criteria}
                          </p>
                        </div>

                        {/* Standardized Rubric Selector (Section 14) */}
                        <div style={{ textAlign: 'right', minWidth: '150px' }}>
                          <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '2px' }}>Score (0-4):</label>
                          <select
                            value={scores[chk.id] !== undefined ? scores[chk.id] : 3}
                            onChange={(e) => handleScoreChange(chk.id, e.target.value)}
                            style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #176B68', fontWeight: 700, width: '100%' }}
                          >
                            <option value={0}>0 - Not Demonstrated</option>
                            <option value={1}>1 - Partially Demonstrated</option>
                            <option value={2}>2 - With Support</option>
                            <option value={3}>3 - Competent</option>
                            <option value={4}>4 - Strongly Demonstrated</option>
                          </select>
                        </div>
                      </div>

                      {/* Human-in-the-Loop Override (Section 16) */}
                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <input
                            type="checkbox"
                            id={'ovr-' + chk.id}
                            checked={acceptedAi[chk.id] === false}
                            onChange={() => handleToggleOverride(chk.id)}
                          />
                          <label htmlFor={'ovr-' + chk.id} style={{ color: acceptedAi[chk.id] === false ? '#d93025' : '#666', cursor: 'pointer', fontWeight: acceptedAi[chk.id] === false ? 600 : 400 }}>
                            {acceptedAi[chk.id] === false ? 'Overriding AI Recommendation' : 'AI Recommendation Accepted'}
                          </label>
                        </div>

                        {acceptedAi[chk.id] === false && (
                          <input
                            type="text"
                            required
                            placeholder="Mandatory override reason (recorded in audit log)..."
                            value={overrideReasons[chk.id] || ''}
                            onChange={(e) => setOverrideReasons({ ...overrideReasons, [chk.id]: e.target.value })}
                            style={{ fontSize: '11px', padding: '6px 10px', borderRadius: '4px', border: '1px solid #d93025', flex: 1, minWidth: '220px' }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="sw-btn-primary"
                    disabled={saving}
                    onClick={handleSaveChecklist}
                    style={{ minHeight: '44px', padding: '10px 20px' }}
                  >
                    <span className="material-symbols-outlined">save</span>
                    {saving ? 'Saving Scores...' : 'Save Checklist Scores & Audit Trail'}
                  </button>
                </div>
              </div>

              {/* COLUMN 3: EVIDENCE & EXPLAINABLE AI ADVISOR (Section 15) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Explainable AI Telemetry Card */}
                {selectedAsm.aiAssistance && (
                  <div className="sw-card" style={{ border: '1px solid #176B68', backgroundColor: '#f9fcfb' }}>
                    <AIAssistanceDisclosure
                      provider={selectedAsm.aiAssistance.provider || 'deterministic-fallback'}
                      model={selectedAsm.aiAssistance.model || 'SkillWorth Evidence Engine v1.0'}
                      isLiveAI={selectedAsm.aiAssistance.isLiveAI || false}
                      compact={true}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#176B68', fontSize: '20px' }}>psychology</span>
                        <strong style={{ fontSize: '14px', color: '#176B68' }}>AI Assessment Advisor</strong>
                      </div>
                      <span className="sw-role-badge sw-badge-green">Relevance: {selectedAsm.aiAssistance.aiAssessmentSummary.evidenceRelevance}</span>
                    </div>

                    <div style={{ fontSize: '13px', margin: '8px 0', padding: '10px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #e0eae7' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Criteria Matched:</span>
                        <strong>{selectedAsm.aiAssistance.aiAssessmentSummary.criteriaMatched}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>AI Advisory Recommendation:</span>
                        <strong style={{ color: '#176B68' }}>{selectedAsm.aiAssistance.aiAssessmentSummary.aiSuggestedScore} / 4 ({selectedAsm.aiAssistance.aiAssessmentSummary.aiSuggestedRating})</strong>
                      </div>
                    </div>

                    {/* Observed Indicators */}
                    <div style={{ marginBottom: '10px' }}>
                      <strong style={{ fontSize: '12px', color: '#137333' }}>Observed Indicators:</strong>
                      <ul style={{ margin: '4px 0 0 16px', fontSize: '12px', color: '#333', lineHeight: 1.4 }}>
                        {selectedAsm.aiAssistance.aiAssessmentSummary.observedIndicators.map((ind, i) => (
                          <li key={i}>{ind}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Missing / Unclear Observations */}
                    {selectedAsm.aiAssistance.aiAssessmentSummary.missingOrUnclear.length > 0 && (
                      <div style={{ marginBottom: '10px' }}>
                        <strong style={{ fontSize: '12px', color: '#b06000' }}>Observations for Assessor Verification:</strong>
                        <ul style={{ margin: '4px 0 0 16px', fontSize: '12px', color: '#555', lineHeight: 1.4 }}>
                          {selectedAsm.aiAssistance.aiAssessmentSummary.missingOrUnclear.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Explainable AI Reasoning Toggle */}
                    <div style={{ marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setShowAiReasoning(!showAiReasoning)}
                        style={{ background: 'none', border: 'none', color: '#176B68', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                      >
                        {showAiReasoning ? 'Hide AI Reasoning' : 'Why? View Explainable AI Reasoning'}
                      </button>

                      {showAiReasoning && (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: '#555', backgroundColor: '#f0f3f2', padding: '8px', borderRadius: '4px' }}>
                          {selectedAsm.aiAssistance.aiAssessmentSummary.viewReasoning.map((r, i) => (
                            <div key={i} style={{ marginBottom: '3px' }}>&bull; {r}</div>
                          ))}
                        </div>
                      )}
                    </div>

                    <small style={{ display: 'block', marginTop: '10px', fontSize: '11px', color: '#777', fontStyle: 'italic' }}>
                      {selectedAsm.aiAssistance.disclaimer}
                    </small>
                  </div>
                )}

                {/* Evidence Artifacts */}
                <div className="sw-card">
                  <h3 className="sw-card-title" style={{ fontSize: '16px' }}>
                    Candidate Practical Evidence ({selectedAsm.evidenceList?.length || 0})
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                    {(selectedAsm.evidenceList || []).map((ev) => (
                      <div key={ev.id} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #eae8e2', backgroundColor: '#faf9f5' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: ev.isVideo ? '#176B68' : '#555' }}>
                            {ev.isVideo ? 'videocam' : 'description'}
                          </span>
                          <strong style={{ fontSize: '12px' }}>{ev.title}</strong>
                        </div>
                        {ev.fileUrl && ev.isVideo && (
                          <video src={ev.fileUrl} controls style={{ width: '100%', marginTop: '6px', borderRadius: '4px', maxHeight: '140px' }} />
                        )}
                        <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{ev.description}</p>
                      </div>
                    ))}

                    {(!selectedAsm.evidenceList || selectedAsm.evidenceList.length === 0) && (
                      <p style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                        No direct files uploaded. Assessor will conduct live hands-on practical observation in assessment centre.
                      </p>
                    )}
                  </div>
                </div>

                {/* FINAL DECISION & ACTIONS (Section 16 & 20) */}
                <div className="sw-card" style={{ border: '2px solid #176B68' }}>
                  <h3 className="sw-card-title" style={{ fontSize: '16px' }}>Official Assessor Decision</h3>

                  <div className="sw-form-group" style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '12px' }}>Assessor Justification &amp; Standards Remarks *</label>
                    <textarea
                      rows="3"
                      required
                      placeholder="Candidate demonstrated tradecraft competence per NSQF standards..."
                      value={assessorRemarks}
                      onChange={(e) => setAssessorRemarks(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <button
                      className="sw-btn-success"
                      style={{ width: '100%', fontSize: '13px', minHeight: '40px' }}
                      disabled={saving}
                      onClick={() => handleDecision('RECOMMENDED_FOR_CERTIFICATION')}
                    >
                      <span className="material-symbols-outlined">workspace_premium</span>
                      Recommend for Certification
                    </button>

                    <button
                      className="sw-btn-warning"
                      style={{ width: '100%', fontSize: '13px', minHeight: '40px' }}
                      disabled={saving}
                      onClick={() => handleDecision('FURTHER_EVIDENCE_REQUIRED')}
                    >
                      <span className="material-symbols-outlined">help</span>
                      Further Evidence Required
                    </button>

                    <button
                      className="sw-btn-danger"
                      style={{ width: '100%', fontSize: '13px', minHeight: '40px' }}
                      disabled={saving}
                      onClick={() => handleDecision('NOT_YET_COMPETENT')}
                    >
                      <span className="material-symbols-outlined">cancel</span>
                      Not Yet Competent
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )
          ) : (
            <div className="sw-card" style={{ textAlign: 'center', padding: '36px' }}>
              <p>No assessment records matching filter criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: HONEST ASSESSOR CONSISTENCY ANALYTICS (Section 17 & 18) ================= */}
      {activeTab === 'analytics' && analytics && (
        <div className="sw-card">
          <div className="sw-card-header-flex">
            <div>
              <div className="sw-hero-badge" style={{ backgroundColor: analytics.isSimulated ? '#fef7e0' : '#e6f4ea', color: analytics.isSimulated ? '#b06000' : '#137333' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {analytics.isSimulated ? 'science' : 'analytics'}
                </span>
                <span>{analytics.isSimulated ? 'PROTOTYPE SIMULATION BASELINE' : 'EMPIRICAL LIVE DATABASE DATASET'}</span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '6px 0 2px' }}>
                Assessor Consistency &amp; Inter-Rater Reliability
              </h3>
              <p className="sw-card-sub">{analytics.datasetLabel}</p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#176B68' }}>{analytics.overallAgreementRate}%</div>
              <span style={{ fontSize: '12px', color: '#5f6368' }}>Inter-Rater Agreement Rate</span>
            </div>
          </div>

          {/* Dataset Disclosure Notice (Section 17) */}
          {analytics.datasetNotice && (
            <div style={{ margin: '16px 0', padding: '12px 16px', borderRadius: '6px', backgroundColor: analytics.isSimulated ? '#fffbee' : '#f0f7f6', border: '1px solid ' + (analytics.isSimulated ? '#f9ab00' : '#176B68'), fontSize: '13px', color: '#333' }}>
              <strong>Dataset Transparency Notice:</strong> {analytics.datasetNotice}
            </div>
          )}

          {/* Variance & Impact Metric */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', margin: '20px 0' }}>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#faf9f5', border: '1px solid #eee' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Assessments Evaluated</span>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1b1c18' }}>{analytics.totalAssessmentsEvaluated}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#faf9f5', border: '1px solid #eee' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Active Lead Assessors</span>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1b1c18' }}>{analytics.assessorsParticipating}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#e6f4ea', border: '1px solid #34a853' }}>
              <span style={{ fontSize: '12px', color: '#137333' }}>Variance Reduction</span>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#137333' }}>+{analytics.aiAssistedImpact?.varianceReductionPercent}%</div>
            </div>
          </div>

          {/* Competency Level Consistency Table (Section 18) */}
          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Competency-Level Agreement Breakdown:</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f4ef', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px' }}>Competency Code</th>
                <th style={{ padding: '10px' }}>Unit Title</th>
                <th style={{ padding: '10px' }}>Agreement Rate</th>
                <th style={{ padding: '10px' }}>Average Score</th>
                <th style={{ padding: '10px' }}>Variance (s²)</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {analytics.competencies?.map((c) => (
                <tr key={c.competencyCode} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 600, color: '#176B68' }}>{c.competencyCode}</td>
                  <td style={{ padding: '10px' }}>{c.name}</td>
                  <td style={{ padding: '10px', fontWeight: 700 }}>{c.agreementRate}%</td>
                  <td style={{ padding: '10px' }}>{c.averageScore} / 4.0</td>
                  <td style={{ padding: '10px' }}>{c.variance !== undefined ? c.variance : 'N/A'}</td>
                  <td style={{ padding: '10px' }}>
                    <span className={`sw-role-badge ${c.status?.includes('EXCELLENT') || c.status?.includes('HIGH') ? 'sw-badge-green' : c.status?.includes('FLAGGED') ? 'sw-badge-red' : 'sw-badge-blue'}`}>
                      {c.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '20px', padding: '14px', borderRadius: '6px', backgroundColor: '#f0f5f4', fontSize: '12px', color: '#333' }}>
            <strong>Methodology &amp; Standards Note (Section 19):</strong>
            <p style={{ marginTop: '4px', lineHeight: 1.5 }}>
              {analytics.aiAssistedImpact?.methodology}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
