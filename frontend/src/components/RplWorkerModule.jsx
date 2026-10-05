import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function RplWorkerModule({ user }) {
  const { t, lang } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState('assessment'); // 'assessment', 'declaration', 'framework'
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qps, setQps] = useState([]);

  // Experience Declaration form state
  const [declarationText, setDeclarationText] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(5);
  const [jobRole, setJobRole] = useState('Electrician / Wireman');
  const [workplaceType, setWorkplaceType] = useState('Informal Field Work / Workshops');
  const [tasksPerformed, setTasksPerformed] = useState('Conduit laying, domestic wiring, distribution board assembly, fault troubleshooting');
  const [toolsUsed, setToolsUsed] = useState('Wire stripper, combination pliers, neon tester, multimeter, insulation tester');
  const [safetyUsed, setSafetyUsed] = useState('1000V rated insulated gloves, safety shoes, circuit voltage verification');
  
  // Voice Input state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // AI Mapping & Quality Check state
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedQp, setSelectedQp] = useState(null);
  const [notice, setNotice] = useState('');

  // Check voice recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
    }
  }, []);

  // Load active RPL assessment and QPs
  const loadData = async () => {
    setLoading(true);
    try {
      const [asmRes, qpRes] = await Promise.all([
        api.getMyRplAssessment(),
        api.getQualificationPacks()
      ]);

      if (asmRes && asmRes.assessment) {
        setAssessment(asmRes.assessment);
      }
      if (qpRes && qpRes.qualificationPacks) {
        setQps(qpRes.qualificationPacks);
        if (qpRes.qualificationPacks.length > 0) {
          setSelectedQp(qpRes.qualificationPacks[0]);
        }
      }
    } catch (err) {
      console.error('Error loading RPL data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Voice Recognition Handler
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your experience.');
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
      recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setDeclarationText(prev => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Run AI Experience Analysis & Mapping
  const handleAnalyzeExperience = async (e) => {
    if (e) e.preventDefault();
    setAnalyzing(true);
    setNotice('');

    try {
      const fullText = declarationText || `${jobRole}. Experience: ${yearsOfExperience} years. Tasks: ${tasksPerformed}. Tools: ${toolsUsed}. Safety: ${safetyUsed}`;
      const res = await api.analyzeExperience(fullText, declarationText, {
        yearsOfExperience,
        jobRole,
        workplaceType,
        tasksPerformed,
        toolsUsed,
        safetyUsed
      });

      if (res && res.success) {
        setAiAnalysis(res);
        if (res.suggestedQualificationPack) {
          const match = qps.find(q => q.id === res.suggestedQualificationPack.id || q.qpCode === res.suggestedQualificationPack.qpCode);
          if (match) setSelectedQp(match);
        }
      } else {
        setNotice('AI analysis service temporarily unavailable. Manual trade selection available.');
      }
    } catch (err) {
      setNotice('Network error analyzing experience.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Confirm Trade & Start RPL Framework
  const handleConfirmAndStart = async () => {
    if (!selectedQp) return;
    setLoading(true);
    try {
      // 1. Save declaration
      const decRes = await api.submitExperience({
        declarationText: declarationText || `${jobRole}, ${yearsOfExperience} years experience`,
        yearsOfExperience,
        jobRole,
        workplaceType,
        tasksPerformed,
        toolsUsed,
        safetyUsed,
        inputMethod: declarationText ? 'voice_or_text' : 'structured'
      });

      // 2. Initialize RPL Assessment
      const startRes = await api.startRplAssessment(selectedQp.id, decRes.declaration ? decRes.declaration.id : null);
      if (startRes && startRes.assessment) {
        setAssessment(startRes.assessment);
        setActiveSubTab('assessment');
        setNotice('RPL Assessment Framework initialized successfully!');
      }
    } catch (err) {
      setNotice('Failed to start assessment framework.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="sw-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#176B68', animation: 'spin 1.5s infinite linear' }}>refresh</span>
        <p style={{ marginTop: '16px', color: '#5f6368', fontWeight: 500 }}>Loading NSQF Competency Framework & RPL Dossier...</p>
      </div>
    );
  }

  return (
    <div className="sw-rpl-container">
      {/* RPL Overview Header */}
      <div className="sw-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f7f9f8 100%)', borderLeft: '4px solid #176B68' }}>
        <div className="sw-card-header-flex">
          <div>
            <div className="sw-hero-badge" style={{ marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#176B68' }}>verified</span>
              <span>{t('rpl.title')} &bull; NSQF Standardized</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1b1c18' }}>
              {assessment ? `${assessment.trade} (${assessment.qpCode})` : 'Recognition of Prior Learning (RPL)'}
            </h2>
            <p className="sw-card-sub" style={{ marginTop: '4px' }}>
              {t('rpl.subtitle')}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className={`sw-status-badge ${assessment?.status === 'COMPLETED' ? 'status-verified' : 'status-pending'}`}>
              {assessment?.status || 'NOT_STARTED'}
            </span>
            {assessment && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#5f6368' }}>
                NSQF Level: <strong style={{ color: '#176B68' }}>Level {assessment.nsqfLevel}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Sub Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', borderTop: '1px solid #eae8e2', paddingTop: '16px' }}>
          <button
            className={`sw-btn-outline ${activeSubTab === 'assessment' ? 'active' : ''}`}
            style={{ borderColor: activeSubTab === 'assessment' ? '#176B68' : '#dddcd4', backgroundColor: activeSubTab === 'assessment' ? '#e6f4f3' : 'transparent' }}
            onClick={() => setActiveSubTab('assessment')}
          >
            <span className="material-symbols-outlined">assignment_turned_in</span>
            1. My RPL Assessment
          </button>
          <button
            className={`sw-btn-outline ${activeSubTab === 'declaration' ? 'active' : ''}`}
            style={{ borderColor: activeSubTab === 'declaration' ? '#176B68' : '#dddcd4', backgroundColor: activeSubTab === 'declaration' ? '#e6f4f3' : 'transparent' }}
            onClick={() => setActiveSubTab('declaration')}
          >
            <span className="material-symbols-outlined">record_voice_over</span>
            2. Experience Self-Declaration & AI Mapping
          </button>
          <button
            className={`sw-btn-outline ${activeSubTab === 'framework' ? 'active' : ''}`}
            style={{ borderColor: activeSubTab === 'framework' ? '#176B68' : '#dddcd4', backgroundColor: activeSubTab === 'framework' ? '#e6f4f3' : 'transparent' }}
            onClick={() => setActiveSubTab('framework')}
          >
            <span className="material-symbols-outlined">view_list</span>
            3. NSQF Qualification Packs ({qps.length})
          </button>
        </div>
      </div>

      {notice && (
        <div className="sw-alert sw-alert-success" style={{ marginBottom: '20px' }}>
          {notice}
        </div>
      )}

      {/* ================= SUB-TAB 1: ACTIVE RPL ASSESSMENT ================= */}
      {activeSubTab === 'assessment' && (
        <div>
          {assessment ? (
            <div className="sw-grid-2col" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
              {/* Left: Competencies & Performance Criteria */}
              <div className="sw-card">
                <div className="sw-card-header-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#176B68' }}>checklist</span>
                  <div>
                    <h3 className="sw-card-title">NOS Competency Criteria</h3>
                    <p className="sw-card-sub">Assessed against National Occupational Standards.</p>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(assessment.competencies || []).map((comp, idx) => (
                    <div key={comp.id || idx} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #eae8e2', backgroundColor: '#faf9f5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#176B68', letterSpacing: '0.5px' }}>{comp.code} &bull; WEIGHT: {comp.weight}%</span>
                          <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '2px 0 4px', color: '#1b1c18' }}>{comp.name}</h4>
                        </div>
                        <span className={`sw-status-badge ${comp.status === 'COMPETENT' ? 'status-verified' : 'status-pending'}`}>
                          {comp.status || 'PENDING'}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#5f6368', marginBottom: '10px' }}>{comp.description}</p>
                      
                      {/* Performance Criteria List */}
                      <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #eee' }}>
                        <strong style={{ fontSize: '12px', color: '#333' }}>Performance Criteria (PC):</strong>
                        <ul style={{ margin: '6px 0 0 18px', fontSize: '12px', color: '#555', lineHeight: 1.5 }}>
                          {(comp.performanceCriteria || []).map((pc, pIdx) => (
                            <li key={pIdx}>{pc}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Assessment Progress, Assessor Status & Recommendation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Status Box */}
                <div className="sw-card">
                  <h3 className="sw-card-title">Assessment Dossier Status</h3>
                  
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0eee8' }}>
                      <span style={{ color: '#5f6368', fontSize: '13px' }}>Trade:</span>
                      <strong>{assessment.trade}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0eee8' }}>
                      <span style={{ color: '#5f6368', fontSize: '13px' }}>Qualification Pack:</span>
                      <strong>{assessment.qpCode} (NSQF Level {assessment.nsqfLevel})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0eee8' }}>
                      <span style={{ color: '#5f6368', fontSize: '13px' }}>Assigned Assessor:</span>
                      <strong>{assessment.assessorName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0eee8' }}>
                      <span style={{ color: '#5f6368', fontSize: '13px' }}>Total Practical Score:</span>
                      <strong style={{ color: '#176B68' }}>{assessment.totalScore} / {assessment.maxScore} ({assessment.percentage}%)</strong>
                    </div>
                  </div>

                  {/* Final Recommendation Badge */}
                  <div style={{ marginTop: '20px', padding: '16px', borderRadius: '8px', backgroundColor: assessment.finalRecommendation === 'RECOMMENDED_FOR_CERTIFICATION' ? '#e6f4ea' : '#fef7e0', border: '1px solid ' + (assessment.finalRecommendation === 'RECOMMENDED_FOR_CERTIFICATION' ? '#34a853' : '#f9ab00') }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ color: assessment.finalRecommendation === 'RECOMMENDED_FOR_CERTIFICATION' ? '#137333' : '#b06000' }}>
                        {assessment.finalRecommendation === 'RECOMMENDED_FOR_CERTIFICATION' ? 'workspace_premium' : 'pending_actions'}
                      </span>
                      <strong style={{ color: assessment.finalRecommendation === 'RECOMMENDED_FOR_CERTIFICATION' ? '#137333' : '#b06000' }}>
                        {assessment.finalRecommendation === 'RECOMMENDED_FOR_CERTIFICATION' 
                          ? 'RECOMMENDED FOR CERTIFICATION'
                          : (assessment.finalRecommendation || 'PENDING ASSESSOR EVALUATION')}
                      </strong>
                    </div>
                    
                    {assessment.credentialId && (
                      <div style={{ marginTop: '8px', fontSize: '13px' }}>
                        SkillWorth Credential ID: <strong style={{ color: '#137333' }}>{assessment.credentialId}</strong>
                      </div>
                    )}

                    {assessment.assessorFinalRemarks && (
                      <p style={{ marginTop: '8px', fontSize: '13px', fontStyle: 'italic', color: '#444' }}>
                        "{assessment.assessorFinalRemarks}"
                      </p>
                    )}

                    <small style={{ display: 'block', marginTop: '10px', fontSize: '11px', color: '#666' }}>
                      Final certification decision is subject to authorized assessor / institution approval.
                    </small>
                  </div>
                </div>

                {/* Competency Gap Analysis */}
                {assessment.competencyProfile && (
                  <div className="sw-card">
                    <h3 className="sw-card-title">Competency Profile & Gap Analysis</h3>
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {assessment.competencyProfile.competent?.length > 0 && (
                        <div>
                          <strong style={{ fontSize: '12px', color: '#137333' }}>&bull; COMPETENT</strong>
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
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#176B68' }}>handyman</span>
              <h3 style={{ margin: '16px 0 8px', fontSize: '20px' }}>No Active RPL Assessment</h3>
              <p style={{ color: '#5f6368', maxWidth: '520px', margin: '0 auto 24px' }}>
                Declare your practical work experience to let SkillWorth AI assist you in mapping to an official NSQF Qualification Pack.
              </p>
              <button
                className="sw-btn-primary"
                onClick={() => setActiveSubTab('declaration')}
              >
                <span className="material-symbols-outlined">edit_document</span>
                Begin Experience Declaration
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= SUB-TAB 2: EXPERIENCE SELF-DECLARATION ================= */}
      {activeSubTab === 'declaration' && (
        <div className="sw-card">
          <div className="sw-card-header-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#176B68' }}>record_voice_over</span>
            <div>
              <h3 className="sw-card-title">{t('rpl.declarationTitle')}</h3>
              <p className="sw-card-sub">{t('rpl.declarationSub')}</p>
            </div>
          </div>

          <form onSubmit={handleAnalyzeExperience} className="sw-form" style={{ marginTop: '24px' }}>
            {/* Voice Input Section */}
            <div style={{ backgroundColor: '#f5f8f7', padding: '16px', borderRadius: '8px', border: '1px solid #d9e5e3', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#176B68' }}>mic</span>
                  <strong style={{ fontSize: '14px', color: '#1b1c18' }}>{t('rpl.voicePrompt')}</strong>
                </div>
                {voiceSupported && (
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={isListening ? 'sw-btn-danger' : 'sw-btn-outline'}
                    style={{ fontSize: '13px', padding: '6px 14px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{isListening ? 'mic_off' : 'mic'}</span>
                    {isListening ? t('rpl.stopVoice') : t('rpl.startVoice')}
                  </button>
                )}
              </div>

              {isListening && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d93025', fontSize: '13px', marginBottom: '8px' }}>
                  <span className="material-symbols-outlined" style={{ animation: 'pulse 1s infinite' }}>hearing</span>
                  <span>{t('rpl.listening')}</span>
                </div>
              )}

              <textarea
                rows="3"
                value={declarationText}
                onChange={(e) => setDeclarationText(e.target.value)}
                placeholder="Example: I have worked as an electrician for eight years and mainly handled wiring, installation, switchboard mounting, and fault checking."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Tamil &bull; English &bull; Hindi supported. You can speak or type freely.
              </small>
            </div>

            {/* Structured Fields */}
            <div className="sw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="sw-form-group">
                <label>Job Role / Trade Title *</label>
                <input
                  type="text"
                  required
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                />
              </div>

              <div className="sw-form-group">
                <label>{t('rpl.yearsExp')} *</label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  required
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                />
              </div>

              <div className="sw-form-group" style={{ gridColumn: 'span 2' }}>
                <label>{t('rpl.tasksLabel')} *</label>
                <textarea
                  rows="2"
                  required
                  value={tasksPerformed}
                  onChange={(e) => setTasksPerformed(e.target.value)}
                  placeholder="e.g. Conduit laying, wiring switchboards, MCB connections, polarity testing..."
                />
              </div>

              <div className="sw-form-group" style={{ gridColumn: 'span 2' }}>
                <label>{t('rpl.toolsLabel')} *</label>
                <input
                  type="text"
                  required
                  value={toolsUsed}
                  onChange={(e) => setToolsUsed(e.target.value)}
                  placeholder="e.g. Multimeter, wire strippers, Megger insulation tester, earth clamp..."
                />
              </div>

              <div className="sw-form-group" style={{ gridColumn: 'span 2' }}>
                <label>{t('rpl.safetyLabel')}</label>
                <input
                  type="text"
                  value={safetyUsed}
                  onChange={(e) => setSafetyUsed(e.target.value)}
                  placeholder="e.g. 1000V rated insulated gloves, safety shoes, LOTO padlock..."
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={analyzing}
                className="sw-btn-primary"
              >
                <span className="material-symbols-outlined">psychology</span>
                {analyzing ? t('rpl.analyzing') : t('rpl.analyzeBtn')}
              </button>
            </div>
          </form>

          {/* AI Analysis Modal / Card */}
          {aiAnalysis && (
            <div style={{ marginTop: '32px', padding: '24px', borderRadius: '8px', border: '1px solid #176B68', backgroundColor: '#f9fcfb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div className="sw-hero-badge" style={{ backgroundColor: '#e6f4f3', color: '#176B68' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>smart_toy</span>
                    <span>{t('rpl.aiAnalysisTitle')}</span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '6px 0 2px' }}>
                    Suggested Trade: {aiAnalysis.suggestedTrade} &bull; NSQF Level {aiAnalysis.suggestedNsqfLevel}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#5f6368' }}>
                    Qualification Pack: <strong>{aiAnalysis.suggestedQualificationPack.qpCode}</strong> &mdash; {aiAnalysis.suggestedQualificationPack.jobRole}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#176B68' }}>{aiAnalysis.aiConfidenceScore}%</div>
                  <span style={{ fontSize: '11px', color: '#5f6368' }}>AI Confidence</span>
                </div>
              </div>

              {/* Matched Competencies */}
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '13px', color: '#333' }}>Matching Competency Areas:</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  {(aiAnalysis.matchingCompetencyAreas || []).map((comp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: comp.matched ? '#137333' : '#666' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: comp.matched ? '#137333' : '#ccc' }}>
                        {comp.matched ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>{comp.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Information Alerts */}
              {aiAnalysis.missingInformation?.length > 0 && (
                <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#fef7e0', border: '1px solid #f9ab00', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b06000', fontSize: '13px', fontWeight: 600 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
                    <span>Recommended Additional Information for Assessor:</span>
                  </div>
                  <ul style={{ margin: '6px 0 0 20px', fontSize: '12px', color: '#555' }}>
                    {aiAnalysis.missingInformation.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #ddd', paddingTop: '16px' }}>
                <small style={{ color: '#666', fontSize: '12px' }}>
                  {aiAnalysis.disclaimer}
                </small>
                <button
                  type="button"
                  className="sw-btn-success"
                  onClick={handleConfirmAndStart}
                >
                  <span className="material-symbols-outlined">how_to_reg</span>
                  {t('rpl.confirmTrade')} &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SUB-TAB 3: QUALIFICATION PACKS DIRECTORY ================= */}
      {activeSubTab === 'framework' && (
        <div className="sw-card">
          <h3 className="sw-card-title">National Skills Qualifications Framework (NSQF) Directory</h3>
          <p className="sw-card-sub">Accredited Qualification Packs available for Recognition of Prior Learning.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {qps.map(qp => (
              <div
                key={qp.id}
                style={{
                  padding: '20px',
                  borderRadius: '8px',
                  border: selectedQp?.id === qp.id ? '2px solid #176B68' : '1px solid #eae8e2',
                  backgroundColor: selectedQp?.id === qp.id ? '#f7faf9' : '#ffffff',
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
                  <span style={{ fontSize: '12px', color: '#5f6368', fontWeight: 500 }}>QP Code: {qp.qpCode}</span>
                  <p style={{ fontSize: '13px', color: '#444', margin: '10px 0 16px', lineHeight: 1.5 }}>
                    {qp.description}
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '12px' }}>
                    <strong>Core NOS Competencies ({qp.competencies?.length}):</strong>
                    <div style={{ marginTop: '4px' }}>
                      {(qp.competencies || []).map((c, i) => (
                        <div key={i} style={{ fontSize: '11px', color: '#666', padding: '2px 0' }}>&bull; {c.name}</div>
                      ))}
                    </div>
                  </div>

                  <button
                    className={selectedQp?.id === qp.id ? 'sw-btn-primary' : 'sw-btn-outline'}
                    style={{ width: '100%' }}
                    onClick={() => {
                      setSelectedQp(qp);
                      setActiveSubTab('declaration');
                    }}
                  >
                    Select this Trade &amp; Declare Experience
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
