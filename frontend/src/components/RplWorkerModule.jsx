import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import AIAssistanceDisclosure from './AIAssistanceDisclosure';
import RplAIExperienceInterview from './RplAIExperienceInterview';

export default function RplWorkerModule({ user }) {
  const { t, lang } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState('assessment'); // 'assessment', 'declaration', 'framework'
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qps, setQps] = useState([]);

  // Multi-Occupation Work Experience State (Section 6)
  const [experiences, setExperiences] = useState([
    {
      id: 'exp-1',
      occupation: 'Field Electrician / Wireman',
      jobTitle: 'Senior Wireman & Maintenance Electrician',
      sector: 'Electronics & Electrical',
      years: 6,
      workplaceType: 'Informal Field Work / Residential Sites',
      tasks: 'Surface conduit laying, DB box assembly, 3-phase load wiring, fault rectification',
      tools: 'Multimeter, neon tester, wire stripper, conduit bender, insulation tester',
      machines: 'Hammer drill, wall chaser',
      responsibilities: 'Electrical maintenance, load testing, customer safety advice',
      location: 'Chennai / Rural Tamil Nadu'
    }
  ]);

  // General Narrative / Voice Description (Section 7)
  const [declarationText, setDeclarationText] = useState('');
  
  // Voice Input state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // AI Discovery & Matching State (Section 8 & 9)
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedPathway, setSelectedPathway] = useState(null);
  const [notice, setNotice] = useState('');
  const [filterSector, setFilterSector] = useState('ALL');

  // Evidence Requests State (Phase 3 Sections 9 & 10)
  const [evidenceRequests, setEvidenceRequests] = useState([]);
  const [activeFulfillModal, setActiveFulfillModal] = useState(null);
  const [fulfillForm, setFulfillForm] = useState({ title: '', description: '', fileUrl: '' });
  const [submittingFulfill, setSubmittingFulfill] = useState(false);

  // Check voice recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
    }
  }, []);

  // Load active RPL assessment, QPs and evidence requests
  const loadData = async () => {
    setLoading(true);
    try {
      const [asmRes, qpRes, reqRes] = await Promise.all([
        api.getMyRplAssessment(),
        api.getQualificationPacks(),
        api.getEvidenceRequests()
      ]);

      if (asmRes && asmRes.assessment) {
        setAssessment(asmRes.assessment);
      }
      if (qpRes && qpRes.qualificationPacks) {
        setQps(qpRes.qualificationPacks);
        if (qpRes.qualificationPacks.length > 0 && !selectedPathway) {
          setSelectedPathway(qpRes.qualificationPacks[0]);
        }
      }
      if (reqRes && reqRes.requests) {
        setEvidenceRequests(reqRes.requests);
      }
    } catch (err) {
      console.error('Error loading RPL data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillRequest = async (e) => {
    e.preventDefault();
    if (!activeFulfillModal) return;
    setSubmittingFulfill(true);
    try {
      const res = await api.respondToEvidenceRequest(activeFulfillModal.id, {
        title: fulfillForm.title || `Practical Evidence for ${activeFulfillModal.competencyName}`,
        description: fulfillForm.description,
        fileUrl: fulfillForm.fileUrl || '/uploads/evidence_demo.mp4'
      });
      if (res.success) {
        setActiveFulfillModal(null);
        setNotice(`Evidence submitted successfully for ${activeFulfillModal.competencyName}!`);
        setFulfillForm({ title: '', description: '', fileUrl: '' });
        await loadData();
      } else {
        alert(res.message || 'Error submitting evidence.');
      }
    } catch (err) {
      console.error('Error submitting evidence response:', err);
    } finally {
      setSubmittingFulfill(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Voice Recognition Handler
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your work description.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setDeclarationText(prev => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Add another occupation work experience (Section 6)
  const handleAddExperience = () => {
    setExperiences(prev => [
      ...prev,
      {
        id: 'exp-' + (prev.length + 1),
        occupation: '',
        jobTitle: '',
        sector: 'Construction',
        years: 2,
        workplaceType: 'Workshop / Jobsite',
        tasks: '',
        tools: '',
        machines: '',
        responsibilities: '',
        location: ''
      }
    ]);
  };

  // Update specific experience item
  const handleUpdateExperience = (id, field, value) => {
    setExperiences(prev => prev.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  // Remove specific experience item
  const handleRemoveExperience = (id) => {
    if (experiences.length === 1) {
      alert('At least one work experience record is required.');
      return;
    }
    setExperiences(prev => prev.filter(exp => exp.id !== id));
  };

  // Run AI Experience Discovery & Multi-Pathway Matching (Section 7, 8, 9)
  const handleAnalyzeExperience = async (e) => {
    if (e) e.preventDefault();
    setAnalyzing(true);
    setNotice('');

    try {
      const totalYears = experiences.reduce((a, b) => a + (Number(b.years) || 0), 0);
      const res = await api.analyzeExperience(declarationText, '', {
        experiences,
        yearsOfExperience: totalYears,
        jobRole: experiences[0]?.jobTitle || experiences[0]?.occupation || '',
        tasksPerformed: experiences.map(e => e.tasks).filter(Boolean).join('; '),
        toolsUsed: experiences.map(e => e.tools).filter(Boolean).join('; ')
      });

      if (res && res.success) {
        setAiAnalysis(res);
        if (res.suggestedQualificationPack) {
          const match = qps.find(q => q.id === res.suggestedQualificationPack.id || q.qpCode === res.suggestedQualificationPack.qpCode);
          if (match) setSelectedPathway(match);
        }
      } else {
        setNotice('AI analysis service temporarily offline. You can select any Qualification Pack manually from the NSQF directory below.');
      }
    } catch (err) {
      setNotice('Network error connecting to AI mapping assistant. Manual selection is available.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Confirm Selected Pathway & Start RPL Assessment Framework
  const handleConfirmPathway = async (targetQp) => {
    const qpToStart = targetQp || selectedPathway;
    if (!qpToStart) return;

    setLoading(true);
    setNotice('');
    try {
      // 1. Submit complete multi-occupation experience declaration
      const totalYears = experiences.reduce((a, b) => a + (Number(b.years) || 0), 0);
      const decRes = await api.submitExperience({
        experiences,
        declarationText: declarationText || `${qpToStart.trade} practical experience (${totalYears} years)`,
        yearsOfExperience: totalYears,
        jobRole: qpToStart.jobRole,
        industry: qpToStart.sector,
        tasksPerformed: experiences.map(e => e.tasks).filter(Boolean).join('; '),
        toolsUsed: experiences.map(e => e.tools).filter(Boolean).join('; ')
      });

      // 2. Start RPL Assessment Dossier
      const decId = decRes?.declaration?.id || null;
      const startRes = await api.startRplAssessment(qpToStart.id, decId);

      if (startRes && startRes.assessment) {
        setAssessment(startRes.assessment);
        setActiveSubTab('assessment');
        setNotice(`RPL Pathway confirmed: ${qpToStart.trade} (${qpToStart.qpCode}). Dossier initialized successfully!`);
      }
    } catch (err) {
      setNotice('Failed to initialize assessment framework.');
    } finally {
      setLoading(false);
    }
  };

  // Unique sectors for directory filter
  const sectors = ['ALL', ...new Set(qps.map(q => q.sector).filter(Boolean))];
  const filteredQps = filterSector === 'ALL' ? qps : qps.filter(q => q.sector === filterSector);

  if (loading) {
    return (
      <div className="sw-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#176B68', animation: 'spin 1.5s infinite linear' }}>refresh</span>
        <p style={{ marginTop: '16px', color: '#5f6368', fontWeight: 500 }}>Loading RPL Competency Dossier &amp; NSQF Frameworks...</p>
      </div>
    );
  }

  return (
    <div className="sw-rpl-container">
      {/* Top Banner */}
      <div className="sw-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f7f9f8 100%)', borderLeft: '4px solid #176B68' }}>
        <div className="sw-card-header-flex">
          <div>
            <div className="sw-hero-badge" style={{ marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#176B68' }}>verified</span>
              <span>{t('rpl.title')} &bull; Multi-Occupation NSQF Platform</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1b1c18' }}>
              {assessment ? `${assessment.trade} (${assessment.qpCode})` : 'Recognition of Prior Learning (RPL)'}
            </h2>
            <p className="sw-card-sub" style={{ marginTop: '4px' }}>
              Verify and certify informal skills acquired through years of practical work across multiple trades.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className={`sw-status-badge ${assessment?.status === 'COMPLETED' ? 'status-verified' : 'status-pending'}`}>
              {assessment?.status || 'NO_ACTIVE_DOSSIER'}
            </span>
            {assessment && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#5f6368' }}>
                NSQF Level: <strong style={{ color: '#176B68' }}>Level {assessment.nsqfLevel}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Sub Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', borderTop: '1px solid #eae8e2', paddingTop: '16px', flexWrap: 'wrap' }}>
          <button
            className={`sw-btn-outline ${activeSubTab === 'assessment' ? 'active' : ''}`}
            style={{ borderColor: activeSubTab === 'assessment' ? '#176B68' : '#dddcd4', backgroundColor: activeSubTab === 'assessment' ? '#e6f4f3' : 'transparent', minHeight: '44px' }}
            onClick={() => setActiveSubTab('assessment')}
          >
            <span className="material-symbols-outlined">assignment_turned_in</span>
            1. Active Assessment Dossier
          </button>
          <button
            className={`sw-btn-outline ${activeSubTab === 'declaration' ? 'active' : ''}`}
            style={{ borderColor: activeSubTab === 'declaration' ? '#176B68' : '#dddcd4', backgroundColor: activeSubTab === 'declaration' ? '#e6f4f3' : 'transparent', minHeight: '44px' }}
            onClick={() => setActiveSubTab('declaration')}
          >
            <span className="material-symbols-outlined">work_history</span>
            2. Multi-Occupation Experience &amp; AI Discovery
          </button>
          <button
            className={`sw-btn-outline ${activeSubTab === 'framework' ? 'active' : ''}`}
            style={{ borderColor: activeSubTab === 'framework' ? '#176B68' : '#dddcd4', backgroundColor: activeSubTab === 'framework' ? '#e6f4f3' : 'transparent', minHeight: '44px' }}
            onClick={() => setActiveSubTab('framework')}
          >
            <span className="material-symbols-outlined">dataset</span>
            3. NSQF Qualification Packs Directory ({qps.length})
          </button>
          <button
            className={`sw-btn-outline ${activeSubTab === 'ai-interview' ? 'active' : ''}`}
            style={{ borderColor: activeSubTab === 'ai-interview' ? '#2563eb' : '#dddcd4', backgroundColor: activeSubTab === 'ai-interview' ? '#eff6ff' : 'transparent', color: activeSubTab === 'ai-interview' ? '#1e40af' : 'inherit', minHeight: '44px' }}
            onClick={() => setActiveSubTab('ai-interview')}
          >
            <span className="material-symbols-outlined" style={{ color: '#2563eb' }}>auto_awesome</span>
            4. AI Skill Discovery &amp; Interview
          </button>
        </div>
      </div>

      {notice && (
        <div className="sw-alert sw-alert-success" style={{ marginBottom: '20px' }}>
          {notice}
        </div>
      )}

      {/* ================= SUB-TAB 1: ACTIVE RPL ASSESSMENT DOSSIER ================= */}
      {activeSubTab === 'assessment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section 10: MY RPL EVIDENCE TRACKER */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #DDDCD4',
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(23, 33, 43, 0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#176B68' }}>inventory_2</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1b1c18', margin: 0 }}>
                  MY RPL EVIDENCE TRACKER
                </h3>
              </div>
              <div style={{ fontSize: '12px', color: '#5f6368' }}>
                Target: <strong>{assessment?.trade || 'Skill Candidate'}</strong> ({assessment?.qpCode || 'NOS Standard'})
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              background: '#fbf9f3',
              border: '1px solid #DDDCD4',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#555f6b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Prerequisite Dossier Artifacts
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#137333', fontWeight: 600 }}>
                    <span>✓</span> Work Experience Declared
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#137333', fontWeight: 600 }}>
                    <span>✓</span> Identity &amp; Supporting Documents
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#555f6b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Competency Units Evidence Status
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  {(assessment?.competencies || []).map((comp, idx) => {
                    const req = evidenceRequests.find(r => (r.competencyCode === comp.code || r.competencyId === comp.id) && r.status === 'EVIDENCE_REQUESTED');
                    const isCompetent = comp.status === 'COMPETENT';
                    const icon = isCompetent ? '✓' : req ? '⚠' : '◐';
                    const color = isCompetent ? '#137333' : req ? '#d93025' : '#b06000';

                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{icon}</span> {comp.name}
                        </span>
                        {req && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFulfillModal(req);
                              setFulfillForm({ title: `Demonstration for ${req.competencyName}`, description: '', fileUrl: '' });
                            }}
                            style={{
                              padding: '2px 8px',
                              background: '#d93025',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Upload Requested Evidence
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Evidence Requests Notification for Worker */}
            {evidenceRequests.filter(r => r.status === 'EVIDENCE_REQUESTED').length > 0 && (
              <div style={{
                marginTop: '16px',
                background: '#fef7e0',
                border: '1px solid #f6cea0',
                borderRadius: '8px',
                padding: '12px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#b06000' }}>priority_high</span>
                  <strong style={{ fontSize: '13px', color: '#604400' }}>
                    Assessor Action Required ({evidenceRequests.filter(r => r.status === 'EVIDENCE_REQUESTED').length} Request):
                  </strong>
                </div>
                {evidenceRequests.filter(r => r.status === 'EVIDENCE_REQUESTED').map(req => (
                  <div key={req.id} style={{
                    background: '#ffffff',
                    border: '1px solid #DDDCD4',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginTop: '6px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#1b1c18' }}>
                        {req.competencyName} ({req.competencyCode})
                      </div>
                      <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '2px' }}>
                        Assessor requested: <em>"{req.message}"</em>
                      </div>
                      <div style={{ fontSize: '11px', color: '#80868b', marginTop: '2px' }}>
                        Required type: {req.requiredEvidence} &bull; Requested by: {req.requestedBy}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFulfillModal(req);
                        setFulfillForm({ title: `Practical Demonstration for ${req.competencyName}`, description: '', fileUrl: '' });
                      }}
                      style={{
                        padding: '6px 14px',
                        background: '#176B68',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      [Upload Evidence]
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fulfill Evidence Modal */}
          {activeFulfillModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(23, 33, 43, 0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '20px'
            }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                maxWidth: '500px',
                width: '100%',
                padding: '24px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#176B68' }}>
                    Submit Requested Evidence
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveFulfillModal(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#80868b' }}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <p style={{ fontSize: '12px', color: '#5f6368', marginBottom: '12px' }}>
                  Unit: <strong>{activeFulfillModal.competencyName}</strong> ({activeFulfillModal.competencyCode})
                </p>

                <div style={{ background: '#fbf9f3', border: '1px solid #DDDCD4', borderRadius: '6px', padding: '10px', fontSize: '12px', marginBottom: '14px' }}>
                  <strong>Assessor Instructions:</strong>
                  <p style={{ marginTop: '2px', color: '#1b1c18' }}>"{activeFulfillModal.message}"</p>
                </div>

                <form onSubmit={handleFulfillRequest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1b1c18', marginBottom: '4px' }}>
                      Evidence Artifact Title:
                    </label>
                    <input
                      type="text"
                      required
                      value={fulfillForm.title}
                      onChange={(e) => setFulfillForm({ ...fulfillForm, title: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #DDDCD4' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1b1c18', marginBottom: '4px' }}>
                      Description &amp; Context:
                    </label>
                    <textarea
                      rows={3}
                      value={fulfillForm.description}
                      onChange={(e) => setFulfillForm({ ...fulfillForm, description: e.target.value })}
                      placeholder="Explain what steps or tools are demonstrated in this video/photo..."
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #DDDCD4' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1b1c18', marginBottom: '4px' }}>
                      Demo Video / Artifact Link (or simulated file URL):
                    </label>
                    <input
                      type="text"
                      value={fulfillForm.fileUrl}
                      onChange={(e) => setFulfillForm({ ...fulfillForm, fileUrl: e.target.value })}
                      placeholder="/uploads/practical_task_demo.mp4"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #DDDCD4' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      disabled={submittingFulfill}
                      onClick={() => setActiveFulfillModal(null)}
                      style={{ padding: '8px 16px', background: '#f0f3f6', color: '#555f6b', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingFulfill}
                      style={{ padding: '8px 18px', background: '#176B68', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {submittingFulfill ? 'Submitting...' : 'Upload & Submit Evidence'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {assessment ? (
            <div className="sw-grid-2col" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
              {/* Left Column: Competencies & Performance Criteria */}
              <div className="sw-card">
                <div className="sw-card-header-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#176B68' }}>checklist</span>
                  <div>
                    <h3 className="sw-card-title">National Occupational Standards (NOS) Units</h3>
                    <p className="sw-card-sub">Assessed against standardized NSQF Level {assessment.nsqfLevel} criteria.</p>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(assessment.competencies || []).map((comp, idx) => (
                    <div key={comp.id || idx} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #eae8e2', backgroundColor: '#faf9f5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#176B68', letterSpacing: '0.5px' }}>
                            {comp.code} &bull; WEIGHT: {comp.weight}%
                          </span>
                          <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '2px 0 4px', color: '#1b1c18' }}>{comp.name}</h4>
                        </div>
                        <span className={`sw-status-badge ${comp.status === 'COMPETENT' ? 'status-verified' : 'status-pending'}`}>
                          {comp.status || 'PENDING'}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#5f6368', marginBottom: '10px' }}>{comp.description}</p>
                      
                      {/* Performance Criteria List */}
                      <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #eee' }}>
                        <strong style={{ fontSize: '12px', color: '#333' }}>Performance Criteria (PC):</strong>
                        <ul style={{ margin: '6px 0 0 18px', fontSize: '12px', color: '#555', lineHeight: 1.5 }}>
                          {(comp.performanceCriteria || []).map((pc, pIdx) => (
                            <li key={pIdx}>{pc}</li>
                          ))}
                        </ul>

                        {comp.observableIndicators?.length > 0 && (
                          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #eee' }}>
                            <strong style={{ fontSize: '11px', color: '#176B68' }}>Observable Trade Indicators:</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                              {comp.observableIndicators.map((ind, i) => (
                                <span key={i} style={{ fontSize: '11px', backgroundColor: '#eef5f4', padding: '2px 8px', borderRadius: '4px', color: '#2d5a57' }}>
                                  &bull; {ind}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Assessment Status, Scheduling & Recommendation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Dossier Status Box */}
                <div className="sw-card">
                  <h3 className="sw-card-title">Assessment Progression Status</h3>
                  
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0eee8' }}>
                      <span style={{ color: '#5f6368', fontSize: '13px' }}>Occupation / Trade:</span>
                      <strong>{assessment.trade}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0eee8' }}>
                      <span style={{ color: '#5f6368', fontSize: '13px' }}>Qualification Pack:</span>
                      <strong>{assessment.qpCode} (NSQF Level {assessment.nsqfLevel})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0eee8' }}>
                      <span style={{ color: '#5f6368', fontSize: '13px' }}>Assigned Assessor:</span>
                      <strong>{assessment.assessorName || 'Pending Institution Assignment'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0eee8' }}>
                      <span style={{ color: '#5f6368', fontSize: '13px' }}>Practical Evaluation Score:</span>
                      <strong style={{ color: '#176B68' }}>{assessment.totalScore} / {assessment.maxScore} ({assessment.percentage}%)</strong>
                    </div>
                  </div>

                  {/* Scheduled Assessment Details (Section 23) */}
                  <div style={{ marginTop: '16px', padding: '14px', borderRadius: '8px', backgroundColor: '#f0f7f6', border: '1px solid #cce2df' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#176B68', marginBottom: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>event</span>
                      <strong style={{ fontSize: '13px' }}>Practical Assessment Schedule:</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#444', lineHeight: 1.6 }}>
                      <div><strong>Date:</strong> {assessment.scheduledDate || 'To be scheduled by institution'}</div>
                      <div><strong>Time:</strong> {assessment.scheduledTime || '09:30 AM - 01:30 PM (Session A)'}</div>
                      <div><strong>Assessment Centre:</strong> {assessment.assessmentCentre || 'SkillWorth Regional Practical Centre'}</div>
                      <div><strong>Lead Assessor:</strong> {assessment.assessorName}</div>
                    </div>
                  </div>

                  {/* Final Recommendation Badge (Section 20 Credential Safety) */}
                  <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', backgroundColor: assessment.finalRecommendation === 'RECOMMENDED_FOR_CERTIFICATION' ? '#e6f4ea' : '#fef7e0', border: '1px solid ' + (assessment.finalRecommendation === 'RECOMMENDED_FOR_CERTIFICATION' ? '#34a853' : '#f9ab00') }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ color: assessment.finalRecommendation === 'RECOMMENDED_FOR_CERTIFICATION' ? '#137333' : '#b06000' }}>
                        {assessment.finalRecommendation === 'RECOMMENDED_FOR_CERTIFICATION' ? 'workspace_premium' : 'pending_actions'}
                      </span>
                      <strong style={{ color: assessment.finalRecommendation === 'RECOMMENDED_FOR_CERTIFICATION' ? '#137333' : '#b06000', fontSize: '13px' }}>
                        {assessment.finalRecommendation === 'RECOMMENDED_FOR_CERTIFICATION' 
                          ? 'RECOMMENDED FOR CERTIFICATION'
                          : (assessment.finalRecommendation || 'PENDING ASSESSOR EVALUATION')}
                      </strong>
                    </div>
                    
                    {assessment.credentialId && (
                      <div style={{ marginTop: '8px', fontSize: '13px' }}>
                        Assessment Record ID: <strong style={{ color: '#137333' }}>{assessment.credentialId}</strong>
                        <div style={{ fontSize: '11px', color: '#2d5a57', marginTop: '2px' }}>
                          Status: <em>{assessment.certificationStatus || 'AUTHORIZED_CERTIFICATION_PENDING'}</em>
                        </div>
                      </div>
                    )}

                    {assessment.assessorFinalRemarks && (
                      <p style={{ marginTop: '8px', fontSize: '13px', fontStyle: 'italic', color: '#444' }}>
                        "{assessment.assessorFinalRemarks}"
                      </p>
                    )}

                    <small style={{ display: 'block', marginTop: '10px', fontSize: '11px', color: '#666', lineHeight: 1.4 }}>
                      SkillWorth Assessment Record &amp; Recommendation. Official NCVET/Sector Skill Council certification is issued by accredited awarding bodies upon formal validation.
                    </small>
                  </div>
                </div>

                {/* Competency Gap Analysis */}
                {assessment.competencyProfile && (
                  <div className="sw-card">
                    <h3 className="sw-card-title">Competency Profile &amp; Gap Analysis</h3>
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {assessment.competencyProfile.competent?.length > 0 && (
                        <div>
                          <strong style={{ fontSize: '12px', color: '#137333' }}>&bull; COMPETENT UNITS</strong>
                          <ul style={{ margin: '4px 0 0 16px', fontSize: '12px', color: '#333' }}>
                            {assessment.competencyProfile.competent.map((c, i) => <li key={i}>{c}</li>)}
                          </ul>
                        </div>
                      )}

                      {assessment.competencyProfile.partiallyDemonstrated?.length > 0 && (
                        <div>
                          <strong style={{ fontSize: '12px', color: '#b06000' }}>&bull; PARTIALLY DEMONSTRATED</strong>
                          <ul style={{ margin: '4px 0 0 16px', fontSize: '12px', color: '#555' }}>
                            {assessment.competencyProfile.partiallyDemonstrated.map((c, i) => <li key={i}>{c}</li>)}
                          </ul>
                        </div>
                      )}

                      {assessment.competencyProfile.additionalEvidenceRequired?.length > 0 && (
                        <div>
                          <strong style={{ fontSize: '12px', color: '#d93025' }}>&bull; ADDITIONAL EVIDENCE REQUIRED</strong>
                          <ul style={{ margin: '4px 0 0 16px', fontSize: '12px', color: '#c5221f' }}>
                            {assessment.competencyProfile.additionalEvidenceRequired.map((c, i) => <li key={i}>{c}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="sw-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#176B68' }}>construction</span>
              <h3 style={{ margin: '16px 0 8px', fontSize: '20px' }}>No Active RPL Assessment</h3>
              <p style={{ color: '#5f6368', maxWidth: '540px', margin: '0 auto 24px', lineHeight: 1.5 }}>
                Tell us about the practical work you have performed across your career. SkillWorth AI will assist you in mapping your informal skills to accredited NSQF Qualification Packs.
              </p>
              <button
                className="sw-btn-primary"
                style={{ minHeight: '44px', padding: '10px 24px' }}
                onClick={() => setActiveSubTab('declaration')}
              >
                <span className="material-symbols-outlined">edit_document</span>
                Begin Work Experience Declaration
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= SUB-TAB 2: MULTI-OCCUPATION EXPERIENCE DECLARATION ================= */}
      {activeSubTab === 'declaration' && (
        <div className="sw-card">
          <div className="sw-card-header-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#176B68' }}>record_voice_over</span>
            <div>
              <h3 className="sw-card-title">Tell Us About Your Work Experience</h3>
              <p className="sw-card-sub">
                You can add multiple occupations (e.g. Masonry + Tiling, or Electrician + Solar). You do not need to know official codes or NSQF levels.
              </p>
            </div>
          </div>

          <form onSubmit={handleAnalyzeExperience} className="sw-form" style={{ marginTop: '24px' }}>
            {/* Natural Language Voice or Text Narrative */}
            <div style={{ backgroundColor: '#f5f8f7', padding: '16px', borderRadius: '8px', border: '1px solid #d9e5e3', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#176B68' }}>mic</span>
                  <strong style={{ fontSize: '14px', color: '#1b1c18' }}>Describe What You Do In Your Own Words:</strong>
                </div>
                {voiceSupported && (
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={isListening ? 'sw-btn-danger' : 'sw-btn-outline'}
                    style={{ fontSize: '13px', padding: '6px 14px', minHeight: '40px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{isListening ? 'mic_off' : 'mic'}</span>
                    {isListening ? 'Stop Voice Recording' : 'Speak Your Experience'}
                  </button>
                )}
              </div>

              {isListening && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d93025', fontSize: '13px', marginBottom: '8px' }}>
                  <span className="material-symbols-outlined" style={{ animation: 'pulse 1s infinite' }}>hearing</span>
                  <span>Listening... Speak clearly in Tamil, Hindi, or English.</span>
                </div>
              )}

              <textarea
                rows="3"
                value={declarationText}
                onChange={(e) => setDeclarationText(e.target.value)}
                placeholder="Example: I have repaired motorcycles for seven years. I change engine oil, repair brakes, service engines, and troubleshoot electrical faults."
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Tamil &bull; English &bull; Hindi supported. You can speak or type freely in everyday words.
              </small>
            </div>

            {/* Multiple Work Experience Cards (Section 6) */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1b1c18' }}>
                  Work History Records ({experiences.length})
                </h4>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="sw-btn-outline"
                  style={{ fontSize: '13px', minHeight: '38px', borderColor: '#176B68', color: '#176B68' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                  + Add Another Work Experience
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {experiences.map((exp, idx) => (
                  <div
                    key={exp.id}
                    style={{
                      padding: '18px',
                      borderRadius: '8px',
                      border: '1px solid #dcdad4',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f0eee8', pb: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#176B68' }}>
                        Experience #{idx + 1}: {exp.occupation || 'New Occupation Record'}
                      </strong>
                      {experiences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(exp.id)}
                          style={{ background: 'none', border: 'none', color: '#d93025', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                          Remove
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                      <div className="sw-form-group">
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Occupation / Trade Name *</label>
                        <input
                          type="text"
                          required
                          value={exp.occupation}
                          onChange={(e) => handleUpdateExperience(exp.id, 'occupation', e.target.value)}
                          placeholder="e.g. Carpenter, Plumber, Welder, Two-Wheeler Mechanic..."
                        />
                      </div>

                      <div className="sw-form-group">
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Job Title / Role Description</label>
                        <input
                          type="text"
                          value={exp.jobTitle}
                          onChange={(e) => handleUpdateExperience(exp.id, 'jobTitle', e.target.value)}
                          placeholder="e.g. Master Carpenter, Lead Welder, Self-employed"
                        />
                      </div>

                      <div className="sw-form-group">
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Years of Experience in this Trade *</label>
                        <input
                          type="number"
                          min="1"
                          max="45"
                          required
                          value={exp.years}
                          onChange={(e) => handleUpdateExperience(exp.id, 'years', Number(e.target.value))}
                        />
                      </div>

                      <div className="sw-form-group">
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Sector / Workplace Type</label>
                        <input
                          type="text"
                          value={exp.workplaceType}
                          onChange={(e) => handleUpdateExperience(exp.id, 'workplaceType', e.target.value)}
                          placeholder="e.g. Construction Site, Repair Garage, Informal Shop"
                        />
                      </div>

                      <div className="sw-form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Tasks &amp; Activities Performed *</label>
                        <input
                          type="text"
                          required
                          value={exp.tasks}
                          onChange={(e) => handleUpdateExperience(exp.id, 'tasks', e.target.value)}
                          placeholder="e.g. Mortise and tenon joints, cabinet fitting, timber sizing, roofing..."
                        />
                      </div>

                      <div className="sw-form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Tools &amp; Equipment Used *</label>
                        <input
                          type="text"
                          required
                          value={exp.tools}
                          onChange={(e) => handleUpdateExperience(exp.id, 'tools', e.target.value)}
                          placeholder="e.g. Circular saw, chisels, jack plane, clamps, measuring tape..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="submit"
                disabled={analyzing}
                className="sw-btn-primary"
                style={{ minHeight: '44px', padding: '10px 24px', fontSize: '14px' }}
              >
                <span className="material-symbols-outlined">psychology</span>
                {analyzing ? 'Analyzing Experience & Discovering Pathways...' : 'Discover Matching NSQF Pathways'}
              </button>
            </div>
          </form>

          {/* AI Discovery & Multi-Pathway Matching Results (Section 8 & 9) */}
          {aiAnalysis && (
            <div style={{ marginTop: '36px', padding: '24px', borderRadius: '8px', border: '1px solid #176B68', backgroundColor: '#f9fcfb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div className="sw-hero-badge" style={{ backgroundColor: '#e6f4f3', color: '#176B68', marginBottom: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>psychology</span>
                    <span>AI Occupation Discovery &bull; Transparent Recommendation</span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0' }}>
                    Suggested Primary Trade: {aiAnalysis.suggestedTrade} &bull; NSQF Level {aiAnalysis.suggestedNsqfLevel}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#5f6368' }}>
                    Sector: <strong>{aiAnalysis.suggestedQualificationPack.sector}</strong> &mdash; {aiAnalysis.suggestedQualificationPack.jobRole}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#176B68' }}>{aiAnalysis.aiConfidenceScore}%</div>
                  <span style={{ fontSize: '11px', color: '#5f6368' }}>Match Alignment</span>
                </div>
              </div>

              {/* Explainable "Why It Matches" Breakdown (Section 9) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', margin: '20px 0' }}>
                <div style={{ padding: '14px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #d8e5e2' }}>
                  <strong style={{ fontSize: '13px', color: '#137333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                    Why This Pathway Was Suggested:
                  </strong>
                  <ul style={{ margin: '8px 0 0 18px', fontSize: '12px', color: '#333', lineHeight: 1.5 }}>
                    {(aiAnalysis.whyItMatches || []).map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: '14px', borderRadius: '6px', backgroundColor: '#fef9e8', border: '1px solid #f0e1ad' }}>
                  <strong style={{ fontSize: '13px', color: '#b06000', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
                    Information Gaps / Assessor Notes:
                  </strong>
                  <ul style={{ margin: '8px 0 0 18px', fontSize: '12px', color: '#555', lineHeight: 1.5 }}>
                    {(aiAnalysis.missingInformation || []).map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Multi-Pathway Alternatives (Section 8) */}
              {aiAnalysis.suggestedPathways?.length > 1 && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #dddcd4', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>
                    All Matching Qualification Pathways for Your Experience:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {aiAnalysis.suggestedPathways.map((path, pIdx) => (
                      <div
                        key={pIdx}
                        style={{
                          padding: '12px',
                          borderRadius: '6px',
                          border: selectedPathway?.id === path.qualificationPack.id ? '2px solid #176B68' : '1px solid #dddcd4',
                          backgroundColor: selectedPathway?.id === path.qualificationPack.id ? '#f0f7f6' : '#ffffff',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedPathway(path.qualificationPack)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="sw-role-badge sw-badge-blue">{path.qualificationPack.sector}</span>
                          <strong style={{ color: '#176B68', fontSize: '12px' }}>{path.confidence}% Match</strong>
                        </div>
                        <h5 style={{ fontSize: '14px', fontWeight: 700, margin: '6px 0 2px' }}>
                          {path.qualificationPack.trade}
                        </h5>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          NSQF Level {path.qualificationPack.nsqfLevel} &bull; {path.qualificationPack.qpCode}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirmation CTA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid #dddcd4', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <small style={{ color: '#666', fontSize: '12px', maxWidth: '580px' }}>
                  {aiAnalysis.disclaimer}
                </small>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="sw-btn-primary"
                    style={{ minHeight: '44px', padding: '10px 20px' }}
                    onClick={() => handleConfirmPathway(selectedPathway || aiAnalysis.suggestedQualificationPack)}
                  >
                    <span className="material-symbols-outlined">how_to_reg</span>
                    Select Pathway &amp; Start RPL Dossier &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SUB-TAB 3: QUALIFICATION PACKS DIRECTORY ================= */}
      {activeSubTab === 'framework' && (
        <div className="sw-card">
          <div className="sw-card-header-flex">
            <div>
              <h3 className="sw-card-title">National Skills Qualifications Framework (NSQF) Directory</h3>
              <p className="sw-card-sub">Accredited Qualification Packs across multiple sectors available for RPL.</p>
            </div>

            {/* Sector Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>Sector:</span>
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
              >
                {sectors.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {filteredQps.map(qp => (
              <div
                key={qp.id}
                style={{
                  padding: '20px',
                  borderRadius: '8px',
                  border: selectedPathway?.id === qp.id ? '2px solid #176B68' : '1px solid #eae8e2',
                  backgroundColor: selectedPathway?.id === qp.id ? '#f7faf9' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="sw-role-badge sw-badge-blue">{qp.sector}</span>
                    <strong style={{ color: '#176B68', fontSize: '13px' }}>NSQF Level {qp.nsqfLevel}</strong>
                  </div>
                  <h4 style={{ fontSize: '17px', fontWeight: 700, margin: '4px 0 2px', color: '#1b1c18' }}>{qp.trade}</h4>
                  <span style={{ fontSize: '12px', color: '#5f6368', fontWeight: 500 }}>
                    QP Code: {qp.qpCode} {qp.isDemo && <em style={{ color: '#b06000' }}>({qp.disclaimer || 'DEMO QP'})</em>}
                  </span>
                  <p style={{ fontSize: '13px', color: '#444', margin: '10px 0 16px', lineHeight: 1.5 }}>
                    {qp.description}
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '12px' }}>
                    <strong>Core NOS Competencies ({qp.competencies?.length || 0}):</strong>
                    <div style={{ marginTop: '4px' }}>
                      {(qp.competencies || []).map((c, i) => (
                        <div key={i} style={{ fontSize: '11px', color: '#666', padding: '2px 0' }}>
                          &bull; {c.name || c.title}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    className={selectedPathway?.id === qp.id ? 'sw-btn-primary' : 'sw-btn-outline'}
                    style={{ width: '100%', minHeight: '44px' }}
                    onClick={() => {
                      setSelectedPathway(qp);
                      handleConfirmPathway(qp);
                    }}
                  >
                    Select this Trade &amp; Start Dossier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 4: AI SKILL DISCOVERY & INTERVIEW (PHASE 5) ================= */}
      {activeSubTab === 'ai-interview' && (
        <RplAIExperienceInterview
          user={user}
          selectedPathway={selectedPathway}
          onPathwaySelected={(pathway) => {
            const matchedQp = qps.find(q => q.id === pathway.qpId || q.qpCode === pathway.qpCode);
            if (matchedQp) {
              setSelectedPathway(matchedQp);
            } else {
              setSelectedPathway(pathway);
            }
          }}
          onComplete={(pathway) => {
            const matchedQp = qps.find(q => q.id === pathway.qpId || q.qpCode === pathway.qpCode);
            handleConfirmPathway(matchedQp || pathway);
          }}
        />
      )}
    </div>
  );
}
