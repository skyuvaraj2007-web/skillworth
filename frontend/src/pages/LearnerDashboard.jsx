import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import RplWorkerModule from '../components/RplWorkerModule';
import SkillPassport from '../components/SkillPassport';
import RplWorkerApplicationSection from '../components/RplWorkerApplicationSection';

export default function LearnerDashboard({ setActivePage }) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('skills'); // 'skills', 'evidence', 'assessment', 'credentials'
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);

  // Evidence state
  const [evidenceList, setEvidenceList] = useState([]);
  const [evidenceType, setEvidenceType] = useState('Video Demonstration');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [selectedCompetency, setSelectedCompetency] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Assessment state
  const [assessments, setAssessments] = useState([]);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [practicalCode, setPracticalCode] = useState('');
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);

  // Credentials state
  const [credentials, setCredentials] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [skillsRes, evRes, asmRes, credRes] = await Promise.all([
        api.getSkills(),
        api.getMyEvidence(),
        api.getAssessments(),
        api.getMyCredentials()
      ]);

      if (skillsRes.success && skillsRes.skills) {
        setSkills(skillsRes.skills);
        if (skillsRes.skills.length > 0) {
          setSelectedSkill(skillsRes.skills[0]);
          if (skillsRes.skills[0].competencies?.length > 0) {
            setSelectedCompetency(skillsRes.skills[0].competencies[0].name);
          }
        }
      }

      if (evRes.success && evRes.evidence) {
        setEvidenceList(evRes.evidence);
      }

      if (asmRes.success && asmRes.assessments) {
        setAssessments(asmRes.assessments);
      }

      if (credRes.success && credRes.credentials) {
        setCredentials(credRes.credentials);
      }
    } catch (err) {
      console.error('Error loading learner dashboard data:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEvidenceFile(file);
      if (file.type.startsWith('video/')) {
        setVideoPreviewUrl(URL.createObjectURL(file));
      } else {
        setVideoPreviewUrl('');
      }
    }
  };

  const handleEvidenceSubmit = async (e) => {
    e.preventDefault();
    if (!evidenceFile) {
      setUploadMessage('Please select a video demonstration or document file to upload.');
      return;
    }

    setUploadLoading(true);
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('file', evidenceFile);
      formData.append('title', evidenceTitle || 'Practical Video Demonstration');
      formData.append('description', evidenceDesc);
      formData.append('evidenceType', evidenceType);
      formData.append('skillId', selectedSkill?.id || 'skill_general');
      formData.append('skillName', selectedSkill?.name || 'Practical Skill');
      formData.append('competency', selectedCompetency || 'Practical Skill Execution');

      const res = await api.uploadEvidence(formData);
      if (res.success) {
        setUploadMessage('Evidence successfully uploaded with AI preliminary analysis!');
        setEvidenceFile(null);
        setVideoPreviewUrl('');
        setEvidenceTitle('');
        setEvidenceDesc('');
        // Refresh evidence list
        const evRes = await api.getMyEvidence();
        if (evRes.success) setEvidenceList(evRes.evidence);
      } else {
        setUploadMessage(res.message || 'Upload failed.');
      }
    } catch (err) {
      setUploadMessage('Error uploading evidence file.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAssessmentSubmit = async () => {
    if (!activeAssessment) return;
    setAssessmentSubmitting(true);

    try {
      const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
        questionId: qId,
        answer: val
      }));

      const res = await api.submitAssessment({
        assessmentId: activeAssessment.id,
        skillName: activeAssessment.skillName,
        answers: formattedAnswers,
        practicalTaskSnippet: practicalCode
      });

      if (res.success) {
        setAssessmentResult(res.result);
        if (res.credential) {
          setCredentials(prev => [res.credential, ...prev]);
        }
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
    } finally {
      setAssessmentSubmitting(false);
    }
  };

  return (
    <div className="sw-page-container">
      {/* Learner Profile Header */}
      <div className="sw-dashboard-header">
        <div className="sw-profile-card">
          <div className="sw-profile-avatar">
            {(user?.fullName || 'L')[0].toUpperCase()}
          </div>
          <div className="sw-profile-info">
            <div className="sw-profile-title-row">
              <h2>{user?.fullName || 'Candidate'}</h2>
              <span className="sw-role-badge sw-badge-blue">Verified Candidate</span>
            </div>
            <p className="sw-profile-sub">
              {user?.degree} &bull; {user?.department} &bull; {user?.collegeName || 'Autonomous Institution'}
            </p>
            <div className="sw-profile-meta-tags">
              <span className="sw-meta-tag"><span className="material-symbols-outlined">badge</span> ID: {user?.studentId || '22CS104'}</span>
              <span className="sw-meta-tag"><span className="material-symbols-outlined">location_on</span> {user?.city}, {user?.state}</span>
              <span className="sw-meta-tag"><span className="material-symbols-outlined">psychology</span> {user?.primarySkill || 'Python Software Engineering'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sw-tabs-bar">
        <button
          className={`sw-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <span className="material-symbols-outlined">psychology</span>
          <span>1. Select Skill & Competencies</span>
        </button>
        <button
          className={`sw-tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          <span className="material-symbols-outlined">videocam</span>
          <span>2. Submit Video & Evidence</span>
        </button>
        <button
          className={`sw-tab-btn ${activeTab === 'assessment' ? 'active' : ''}`}
          onClick={() => setActiveTab('assessment')}
        >
          <span className="material-symbols-outlined">assignment</span>
          <span>3. Take Assessment</span>
        </button>
        <button
          className={`sw-tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
          onClick={() => setActiveTab('credentials')}
        >
          <span className="material-symbols-outlined">verified</span>
          <span>4. My Credentials ({credentials.length})</span>
        </button>
        <button
          className={`sw-tab-btn ${activeTab === 'rpl_application' ? 'active' : ''}`}
          onClick={() => setActiveTab('rpl_application')}
        >
          <span className="material-symbols-outlined">assignment</span>
          <span>5. RPL Application</span>
        </button>
        <button
          className={`sw-tab-btn ${activeTab === 'rpl' ? 'active' : ''}`}
          onClick={() => setActiveTab('rpl')}
        >
          <span className="material-symbols-outlined">handyman</span>
          <span>6. {t('rpl.tabLabel')}</span>
        </button>
        <button
          className={`sw-tab-btn ${activeTab === 'passport' ? 'active' : ''}`}
          onClick={() => setActiveTab('passport')}
        >
          <span className="material-symbols-outlined">badge</span>
          <span>7. Skill Passport</span>
        </button>
      </div>

      {/* ================= TAB 1: SKILLS & COMPETENCIES ================= */}
      {activeTab === 'skills' && (
        <div className="sw-tab-content">
          <div className="sw-grid-2col">
            <div className="sw-card">
              <h3 className="sw-card-title">Available Skill Domains</h3>
              <p className="sw-card-sub">Select the technical specialization for your Recognition of Prior Learning evaluation.</p>
              
              <div className="sw-skill-list">
                {skills.map(s => (
                  <div
                    key={s.id}
                    className={`sw-skill-item ${selectedSkill?.id === s.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedSkill(s);
                      if (s.competencies?.length > 0) setSelectedCompetency(s.competencies[0].name);
                    }}
                  >
                    <div className="sw-skill-item-header">
                      <span className="sw-skill-name">{s.name}</span>
                      <span className="sw-badge-gray">{s.level}</span>
                    </div>
                    <p className="sw-skill-desc">{s.description}</p>
                    <div className="sw-skill-badge-row">
                      <span className="sw-badge-pill">{s.competencies?.length || 0} Competencies</span>
                      <span className="sw-badge-pill">{s.domain}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sw-card">
              <h3 className="sw-card-title">
                Competencies: {selectedSkill?.name || 'Selected Skill'}
              </h3>
              <p className="sw-card-sub">Benchmarks required for SkillWorth prior learning assessment.</p>

              <div className="sw-competency-list">
                {selectedSkill?.competencies?.map((c, i) => (
                  <div key={c.id || i} className="sw-competency-card">
                    <div className="sw-comp-code">{c.code}</div>
                    <div className="sw-comp-details">
                      <h4>{c.name}</h4>
                      <p>Requires demonstrable practical implementation artifacts and assessor verification.</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sw-card-footer" style={{ marginTop: '24px' }}>
                <button
                  className="sw-btn-primary"
                  onClick={() => setActiveTab('evidence')}
                >
                  Proceed to Video Evidence Submission ?
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: SUBMIT VIDEO & EVIDENCE ================= */}
      {activeTab === 'evidence' && (
        <div className="sw-tab-content">
          <div className="sw-grid-2col">
            {/* Upload Form matching interface prompt */}
            <div className="sw-card">
              <h3 className="sw-card-title">Submit Practical Evidence</h3>
              <p className="sw-card-sub">Upload video demonstrations or technical project artifacts to prove competency.</p>

              {uploadMessage && (
                <div className={`sw-alert ${uploadMessage.includes('success') ? 'sw-alert-success' : 'sw-alert-error'}`}>
                  {uploadMessage}
                </div>
              )}

              <form onSubmit={handleEvidenceSubmit} className="sw-form">
                <div className="sw-form-group">
                  <label>Evidence Category *</label>
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value)}
                  >
                    <option value="Video Demonstration">Video Demonstration (Recommended)</option>
                    <option value="Certificate">Certificate of Prior Completion</option>
                    <option value="Project">Project Repository & Architecture</option>
                    <option value="Document">Technical Document / Whitepaper</option>
                    <option value="Portfolio">Portfolio Showcase</option>
                    <option value="Internship / Work Experience">Internship / Work Experience</option>
                  </select>
                </div>

                <div className="sw-form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AsyncIO Sliding Window Rate Limiter Implementation"
                    value={evidenceTitle}
                    onChange={(e) => setEvidenceTitle(e.target.value)}
                  />
                </div>

                <div className="sw-form-group">
                  <label>Skill Domain</label>
                  <input
                    type="text"
                    disabled
                    value={selectedSkill?.name || 'Python Software Engineering'}
                  />
                </div>

                <div className="sw-form-group">
                  <label>Target Competency *</label>
                  <select
                    value={selectedCompetency}
                    onChange={(e) => setSelectedCompetency(e.target.value)}
                  >
                    {selectedSkill?.competencies?.map((c, i) => (
                      <option key={c.id || i} value={c.name}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                {/* File / Video Upload Input */}
                <div className="sw-form-group">
                  <label>Choose File / Video Demonstration *</label>
                  <input
                    type="file"
                    accept="video/*,.pdf,.zip,.py,.js"
                    onChange={handleFileChange}
                    className="sw-file-input"
                  />
                  <small className="sw-form-hint">Accepted formats: MP4, WebM, MOV, PDF, ZIP (Max 100MB)</small>
                </div>

                {/* Video Preview Box */}
                {videoPreviewUrl && (
                  <div className="sw-video-preview-box">
                    <span className="sw-preview-label">Live Video Preview</span>
                    <video
                      src={videoPreviewUrl}
                      controls
                      className="sw-video-player"
                    />
                  </div>
                )}

                <div className="sw-form-group">
                  <label>Description & Technical Context</label>
                  <textarea
                    rows="3"
                    placeholder="Explain the problem solved, design patterns utilized, and key architecture decisions..."
                    value={evidenceDesc}
                    onChange={(e) => setEvidenceDesc(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="sw-btn-primary sw-btn-lg sw-btn-block"
                  disabled={uploadLoading}
                >
                  <span className="material-symbols-outlined">upload</span>
                  {uploadLoading ? 'Uploading & Computing AI Analysis...' : 'Submit Evidence'}
                </button>
              </form>
            </div>

            {/* Submitted Evidence List */}
            <div className="sw-card">
              <h3 className="sw-card-title">My Submitted Evidence Records ({evidenceList.length})</h3>
              <p className="sw-card-sub">AI preliminary scores and authorized assessor verification tracking.</p>

              <div className="sw-evidence-cards-container">
                {evidenceList.length === 0 ? (
                  <div className="sw-empty-state">
                    <span className="material-symbols-outlined">cloud_off</span>
                    <p>No evidence submitted yet. Upload a video demonstration to begin.</p>
                  </div>
                ) : (
                  evidenceList.map(ev => (
                    <div key={ev.id || ev.evidenceId} className="sw-evidence-card">
                      <div className="sw-ev-header">
                        <div className="sw-ev-title-box">
                          <span className="material-symbols-outlined" style={{ color: ev.isVideo ? '#1a73e8' : '#5f6368' }}>
                            {ev.isVideo ? 'videocam' : 'description'}
                          </span>
                          <div>
                            <h4>{ev.title}</h4>
                            <span className="sw-ev-meta">{ev.skillName} &bull; {ev.evidenceType}</span>
                          </div>
                        </div>
                        <span className={`sw-status-badge ${ev.verificationStatus === 'VERIFIED' ? 'status-verified' : 'status-pending'}`}>
                          {ev.verificationStatus || 'PENDING_REVIEW'}
                        </span>
                      </div>

                      {/* Video Player if fileUrl exists */}
                      {ev.fileUrl && ev.isVideo && (
                        <div className="sw-ev-video-container">
                          <video src={ev.fileUrl} controls className="sw-video-player-sm" />
                        </div>
                      )}

                      {/* AI Analysis telemetry */}
                      {ev.aiAnalysis && (
                        <div className="sw-ai-telemetry-box">
                          <div className="sw-ai-header">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#1a73e8' }}>smart_toy</span>
                            <strong>AI Preliminary Analysis (Confidence: {ev.aiAnalysis.confidenceScore}%)</strong>
                          </div>
                          <p className="sw-ai-summary">{ev.aiAnalysis.summary}</p>
                          <small className="sw-ai-note">AI = Assistant. Authorized Human Assessor = Final Verifier.</small>
                        </div>
                      )}

                      {/* Assessor Feedback */}
                      {ev.assessorFeedback && (
                        <div className="sw-assessor-feedback-box">
                          <div className="sw-assessor-badge">
                            <span className="material-symbols-outlined">verified</span>
                            <span>Assessor Decision: {ev.assessorFeedback.decision}</span>
                          </div>
                          <p className="sw-feedback-text">"{ev.assessorFeedback.feedback}"</p>
                          <small className="sw-feedback-author">&mdash; {ev.assessorFeedback.assessorName}</small>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: TAKE ASSESSMENT ================= */}
      {activeTab === 'assessment' && (
        <div className="sw-tab-content">
          {!activeAssessment ? (
            <div className="sw-card">
              <h3 className="sw-card-title">Standardized Skill Verification Protocols</h3>
              <p className="sw-card-sub">Standardized SkillWorth National RPL Assessment Framework.</p>

              <div className="sw-assessment-list">
                {assessments.map(asm => (
                  <div key={asm.id} className="sw-assessment-item">
                    <div className="sw-asm-header">
                      <div>
                        <h3>{asm.title}</h3>
                        <p className="sw-asm-meta">
                          Domain: <strong>{asm.skillName}</strong> &bull; Passing Score: <strong>{asm.passingScore}%</strong> &bull; Duration: <strong>{asm.durationMinutes} mins</strong>
                        </p>
                      </div>
                      <button
                        className="sw-btn-primary"
                        onClick={() => {
                          setActiveAssessment(asm);
                          setAnswers({});
                          setAssessmentResult(null);
                        }}
                      >
                        Start Assessment Protocol &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="sw-card">
              <div className="sw-card-header-flex">
                <div>
                  <h3 className="sw-card-title">{activeAssessment.title}</h3>
                  <p className="sw-card-sub">Answer all multiple choice and practical implementation questions.</p>
                </div>
                <button
                  className="sw-btn-outline"
                  onClick={() => setActiveAssessment(null)}
                >
                  &larr; Back to Protocols
                </button>
              </div>

              {assessmentResult ? (
                <div className="sw-result-box">
                  <div className={`sw-result-badge ${assessmentResult.passed ? 'passed' : 'review'}`}>
                    <span className="material-symbols-outlined">
                      {assessmentResult.passed ? 'verified' : 'info'}
                    </span>
                    <h3>{assessmentResult.passed ? 'Assessment Passed Successfully!' : 'Needs Assessor Evaluation'}</h3>
                  </div>
                  <div className="sw-result-score">
                    Score: <strong>{assessmentResult.percentage}%</strong> ({assessmentResult.totalScore} / {assessmentResult.maxScore} points)
                  </div>
                  <p className="sw-result-telemetry">{assessmentResult.aiSummary}</p>
                  {assessmentResult.passed && (
                    <div className="sw-credential-success-alert">
                      <span className="material-symbols-outlined">military_tech</span>
                      <div>
                        <strong>Assessment Record Issued:</strong> Official SkillWorth RPL Assessment Record is now available in your credentials tab!
                      </div>
                    </div>
                  )}
                  <button
                    className="sw-btn-primary"
                    style={{ marginTop: '16px' }}
                    onClick={() => setActiveTab('credentials')}
                  >
                    View My Credentials ?
                  </button>
                </div>
              ) : (
                <div className="sw-questions-container">
                  {activeAssessment.questions?.map((q, idx) => (
                    <div key={q.id} className="sw-question-block">
                      <div className="sw-q-header">
                        <span className="sw-q-number">Question {idx + 1} ({q.points} pts)</span>
                        <span className="sw-badge-gray">{q.type}</span>
                      </div>
                      <p className="sw-q-text">{q.questionText}</p>

                      {q.type === 'MCQ' && (
                        <div className="sw-options-grid">
                          {q.options?.map((opt, oIdx) => (
                            <label key={oIdx} className="sw-option-label">
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                value={opt}
                                checked={answers[q.id] === opt}
                                onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {q.type === 'PRACTICAL_TASK' && (
                        <div className="sw-practical-box">
                          <label>Solution Code Snippet / Demonstration Walkthrough Notes:</label>
                          <textarea
                            rows="6"
                            placeholder="class RateLimiter:
    def __init__(self, rate, per):
        self.rate = rate
        ..."
                            value={practicalCode}
                            onChange={(e) => setPracticalCode(e.target.value)}
                            className="sw-code-editor"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="sw-card-footer" style={{ marginTop: '24px' }}>
                    <button
                      className="sw-btn-primary sw-btn-lg"
                      onClick={handleAssessmentSubmit}
                      disabled={assessmentSubmitting}
                    >
                      {assessmentSubmitting ? 'Evaluating Responses...' : 'Submit Assessment for Official Scoring'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: CREDENTIALS ================= */}
      {activeTab === 'credentials' && (
        <div className="sw-tab-content">
          <div className="sw-card">
            <h3 className="sw-card-title">SkillWorth Verified Assessment Records ({credentials.length})</h3>
            <p className="sw-card-sub">SkillWorth verified prior learning assessment records. Shareable with employers.</p>

            <div className="sw-credentials-grid">
              {credentials.length === 0 ? (
                <div className="sw-empty-state">
                  <span className="material-symbols-outlined">workspace_premium</span>
                  <p>No credentials earned yet. Complete an assessment or submit evidence for evaluation.</p>
                </div>
              ) : (
                credentials.map(c => (
                  <div key={c.credentialId || c.id} className="sw-certificate-card">
                    <div className="sw-cert-top">
                      <div className="sw-cert-brand">
                        <span className="material-symbols-outlined" style={{ color: '#1a73e8' }}>verified</span>
                        <span>SkillWorth Credential</span>
                      </div>
                      <span className="sw-cert-id">{c.credentialId}</span>
                    </div>

                    <h3 className="sw-cert-skill">{c.skillName}</h3>
                    <div className="sw-cert-level">Competency Level: <strong>{c.skillLevel || 'Intermediate'}</strong></div>

                    <div className="sw-cert-details">
                      <div><strong>Learner:</strong> {c.learnerName || user?.fullName}</div>
                      <div><strong>Accrediting Institution:</strong> {c.institutionName}</div>
                      <div><strong>Authorized Assessor:</strong> {c.verifiedByAssessor}</div>
                      <div><strong>Standard:</strong> {c.standards}</div>
                      <div><strong>Status:</strong> <span className="sw-badge-green">VALID & VERIFIED</span></div>
                    </div>

                    <div className="sw-cert-footer">
                      <button
                        className="sw-btn-outline sw-btn-sm"
                        onClick={() => {
                          navigator.clipboard?.writeText(c.credentialId);
                          alert('Copied Credential ID: ' + c.credentialId);
                        }}
                      >
                        Copy Credential ID
                      </button>
                      <button
                        className="sw-btn-primary sw-btn-sm"
                        onClick={() => setActivePage('verify')}
                      >
                        Verify in Industry Portal
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: RPL APPLICATION & TIMELINE (PHASE 4) ================= */}
      {activeTab === 'rpl_application' && (
        <div className="sw-tab-content">
          <RplWorkerApplicationSection 
            onOpenAssessment={(asmId) => setActiveTab('rpl')} 
            onStartRpl={() => setActiveTab('rpl')} 
          />
        </div>
      )}

      {/* ================= TAB 6: RPL ASSESSMENT (NSQF) ================= */}
      {activeTab === 'rpl' && (
        <div className="sw-tab-content">
          <RplWorkerApplicationSection 
            onOpenAssessment={() => {}} 
            onStartRpl={() => {}} 
          />
          <RplWorkerModule user={user} />
        </div>
      )}

      {/* ================= TAB 7: WORKER SKILL PASSPORT ================= */}
      {activeTab === 'passport' && (
        <div className="sw-tab-content">
          <SkillPassport />
        </div>
      )}
    </div>
  );
}
