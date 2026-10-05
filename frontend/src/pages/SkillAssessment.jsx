import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Target,
  Terminal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  Flag,
  Sparkles,
  BookOpen,
  FolderGit2,
  BarChart2,
  Check,
  X,
  Code
} from 'lucide-react';
import {
  QUESTION_BANKS,
  loadAssessmentStore,
  recordAssessmentCompletion
} from '../services/assessmentStore';
import CodeSandboxModal from '../components/CodeSandboxModal';
import StudentInstitutionAssessments from '../components/StudentInstitutionAssessments';
import MyAssessments from '../components/student/MyAssessments';

export default function SkillAssessment({ setActivePage, onShowToast }) {
  // Store state
  const [storeState, setStoreState] = useState(() => loadAssessmentStore());
  const [assessmentCategoryTab, setAssessmentCategoryTab] = useState('INDUSTRY');

  // Assessment Runner state
  const [activeTrack, setActiveTrack] = useState(null); // 'logical' | 'aptitude' | 'programming'
  const [selectedLanguage, setSelectedLanguage] = useState('Python');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qIndex]: optionIndex }
  const [flaggedQuestions, setFlaggedQuestions] = useState({}); // { [qIndex]: true }
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Modals & Views
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [completedResult, setCompletedResult] = useState(null);

  // Latest completed assessment from store
  const latestAssessment = completedResult || storeState.assessments[0] || null;

  // Active question set
  const activeQuestions = activeTrack
    ? (activeTrack === 'programming'
        ? (QUESTION_BANKS.programming.questions[selectedLanguage] || QUESTION_BANKS.programming.questions.Python)
        : QUESTION_BANKS[activeTrack]?.questions || [])
    : [];

  const totalQuestions = activeQuestions.length;

  // Real-time Timer effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining]);

  // Listen for assessment updates across tabs or components
  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) setStoreState(e.detail);
    };
    window.addEventListener('nexus_assessment_updated', handleUpdate);
    return () => window.removeEventListener('nexus_assessment_updated', handleUpdate);
  }, []);

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Assessment
  const handleStartTrack = (trackId) => {
    const trackConfig = QUESTION_BANKS[trackId];
    const durationSecs = (trackConfig?.durationMinutes || 25) * 60;

    setActiveTrack(trackId);
    setCurrentQIndex(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setSecondsRemaining(durationSecs);
    setIsTimerRunning(true);
    setCompletedResult(null);
  };

  // Exit / Abandon Assessment
  const handleConfirmExit = () => {
    setIsTimerRunning(false);
    setActiveTrack(null);
    setShowExitConfirmModal(false);
    setUserAnswers({});
    setFlaggedQuestions({});
  };

  // Select Option
  const handleSelectOption = (optIdx) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQIndex]: optIdx
    }));
  };

  // Toggle Flag
  const handleToggleFlag = () => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQIndex]: !prev[currentQIndex]
    }));
  };

  // Submit Assessment (Manual or Auto on time out)
  const handleFinalSubmit = () => {
    setIsTimerRunning(false);
    setShowSubmitModal(false);

    let correctCount = 0;
    activeQuestions.forEach((q, idx) => {
      if (userAnswers[idx] !== undefined && userAnswers[idx] === q.correct) {
        correctCount++;
      }
    });

    const trackConfig = QUESTION_BANKS[activeTrack];
    const totalDurationSecs = (trackConfig?.durationMinutes || 25) * 60;
    const timeTaken = totalDurationSecs - secondsRemaining;

    const result = recordAssessmentCompletion({
      trackId: activeTrack,
      trackTitle: trackConfig.title,
      language: activeTrack === 'programming' ? selectedLanguage : null,
      totalQuestions: activeQuestions.length,
      correctCount,
      timeTakenSeconds: timeTaken,
      answers: userAnswers
    });

    setCompletedResult(result);
    setActiveTrack(null);

    if (onShowToast) {
      onShowToast({
        title: 'Assessment Attested 🎉',
        message: `${result.trackTitle} completed with ${result.score}% score. Sovereign ledger updated.`,
        type: 'success'
      });
    }
  };

  const handleAutoSubmit = () => {
    handleFinalSubmit();
    if (onShowToast) {
      onShowToast({
        title: 'Time Expired',
        message: 'Assessment time limit reached. Answers submitted automatically.',
        type: 'info'
      });
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: ACTIVE ASSESSMENT TEST RUNNER
  // -------------------------------------------------------------
  if (activeTrack) {
    const currentQ = activeQuestions[currentQIndex] || {};
    const answeredCount = Object.keys(userAnswers).length;
    const progressPercent = Math.round((answeredCount / totalQuestions) * 100);
    const isCurrentFlagged = !!flaggedQuestions[currentQIndex];
    const currentTrackConfig = QUESTION_BANKS[activeTrack];

    return (
      <div style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Top Assessment Header */}
        <div className="glass-panel" style={{
          padding: '16px 24px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderColor: activeTrack === 'programming' ? 'var(--cyber-purple)' : 'var(--cyber-cyan)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: activeTrack === 'programming' ? 'rgba(139,92,246,0.15)' : 'rgba(40,215,255,0.15)',
              border: `1px solid ${activeTrack === 'programming' ? 'var(--cyber-purple)' : 'var(--cyber-cyan)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: activeTrack === 'programming' ? 'var(--cyber-purple)' : 'var(--cyber-cyan)'
            }}>
              {activeTrack === 'logical' && <Brain size={20} />}
              {activeTrack === 'aptitude' && <Target size={20} />}
              {activeTrack === 'programming' && <Terminal size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {currentTrackConfig.title}
                </h2>
                {activeTrack === 'programming' && (
                  <span className="cyber-badge badge-purple" style={{ fontSize: '10px' }}>
                    {selectedLanguage}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {currentQ.topic || 'Continuous Adaptive Diagnostic'} • {totalQuestions} Questions Total
              </div>
            </div>
          </div>

          {/* Countdown Timer & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '8px',
              background: secondsRemaining < 300 ? 'rgba(239,68,68,0.15)' : 'rgba(0,212,255,0.08)',
              border: `1px solid ${secondsRemaining < 300 ? '#EF4444' : 'var(--border-subtle)'}`,
              color: secondsRemaining < 300 ? '#F87171' : 'var(--cyber-cyan)',
              fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700
            }}>
              <Clock size={16} />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            <button
              onClick={() => setShowExitConfirmModal(true)}
              className="btn-cyber-outline"
              style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--text-muted)' }}
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress Tracker Bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <span>Question <strong>{currentQIndex + 1}</strong> of {totalQuestions}</span>
            <span>Progress: <strong style={{ color: 'var(--cyber-cyan)' }}>{progressPercent}%</strong> ({answeredCount}/{totalQuestions} Answered)</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, var(--cyber-cyan), var(--cyber-purple))',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Question & Options Panel */}
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px', position: 'relative' }}>
          {/* Question Tag & Flag */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{
              fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyber-cyan)',
              background: 'rgba(40,215,255,0.08)', padding: '3px 10px', borderRadius: '4px',
              border: '1px solid rgba(40,215,255,0.2)'
            }}>
              QUESTION {currentQIndex + 1} // {currentQ.topic?.toUpperCase()}
            </span>

            <button
              onClick={handleToggleFlag}
              style={{
                background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: isCurrentFlagged ? '#FF9D4D' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '12px'
              }}
            >
              <Flag size={14} fill={isCurrentFlagged ? '#FF9D4D' : 'none'} />
              <span>{isCurrentFlagged ? 'Flagged for Review' : 'Flag Question'}</span>
            </button>
          </div>

          {/* Question Text */}
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '20px' }}>
            {currentQ.question}
          </h3>

          {/* Code Snippet if applicable */}
          {currentQ.code && (
            <div style={{
              background: '#070C18', border: '1px solid var(--border-subtle)',
              borderRadius: '8px', padding: '14px 18px', marginBottom: '24px',
              fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: '#38BDF8',
              whiteSpace: 'pre-wrap', lineHeight: 1.5
            }}>
              {currentQ.code}
            </div>
          )}

          {/* Options Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {currentQ.options?.map((opt, idx) => {
              const isSelected = userAnswers[currentQIndex] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    textAlign: 'left',
                    fontSize: '13.5px',
                    background: isSelected ? 'rgba(40, 215, 255, 0.12)' : 'rgba(255,255,255,0.02)',
                    border: isSelected ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isSelected ? '0 0 16px rgba(40, 215, 255, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '26px', height: '26px', borderRadius: '6px',
                      background: isSelected ? 'var(--cyber-cyan)' : 'rgba(255,255,255,0.06)',
                      color: isSelected ? '#050B18' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '12px', fontFamily: 'var(--font-mono)'
                    }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isSelected && <CheckCircle2 size={16} color="var(--cyber-cyan)" />}
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex(currentQIndex - 1)}
              className="btn-cyber-outline"
              style={{ opacity: currentQIndex === 0 ? 0.4 : 1 }}
            >
              <ArrowLeft size={14} />
              <span>Previous</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              {currentQIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentQIndex(currentQIndex + 1)}
                  className="btn-cyber-primary"
                  style={{ padding: '10px 20px' }}
                >
                  <span>Next Question</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="btn-cyber-primary"
                  style={{
                    padding: '10px 24px', fontWeight: 700,
                    background: 'var(--cyber-emerald)', color: '#060B14', border: 'none',
                    boxShadow: 'var(--cyber-emerald-glow)'
                  }}
                >
                  <span>Review & Submit Assessment →</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Question Jump Navigator */}
        <div className="glass-panel" style={{ padding: '18px 24px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>
            QUESTION MATRIX JUMP NAVIGATOR
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {activeQuestions.map((_, idx) => {
              const isAnswered = userAnswers[idx] !== undefined;
              const isFlagged = flaggedQuestions[idx];
              const isCurrent = idx === currentQIndex;

              let borderCol = 'var(--border-subtle)';
              let bgCol = 'rgba(255,255,255,0.03)';
              let textCol = 'var(--text-muted)';

              if (isCurrent) {
                borderCol = 'var(--cyber-cyan)';
                bgCol = 'rgba(40,215,255,0.2)';
                textCol = 'var(--cyber-cyan)';
              } else if (isFlagged) {
                borderCol = '#FF9D4D';
                bgCol = 'rgba(255,157,77,0.15)';
                textCol = '#FF9D4D';
              } else if (isAnswered) {
                borderCol = 'rgba(47,224,161,0.4)';
                bgCol = 'rgba(47,224,161,0.12)';
                textCol = 'var(--cyber-emerald)';
              }

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQIndex(idx)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '6px',
                    border: `1px solid ${borderCol}`, background: bgCol,
                    color: textCol, fontSize: '11px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'var(--font-mono)'
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Abandon / Exit Confirmation Modal */}
        {showExitConfirmModal && (
          <div className="modal-backdrop" onClick={() => setShowExitConfirmModal(false)}>
            <div className="modal-content-box" style={{ maxWidth: '440px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F87171', marginBottom: '12px' }}>
                <AlertTriangle size={24} />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Exit Assessment?</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                Are you sure you want to exit? Your progress in this diagnostic session will be lost and not recorded in your Sovereign Ledger.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowExitConfirmModal(false)}
                  className="btn-cyber-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Resume Assessment
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="btn-cyber-outline"
                  style={{ flex: 1, padding: '10px', color: '#F87171', borderColor: 'rgba(239,68,68,0.3)' }}
                >
                  Confirm Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Summary Confirmation Modal */}
        {showSubmitModal && (
          <div className="modal-backdrop" onClick={() => setShowSubmitModal(false)}>
            <div className="modal-content-box" style={{ maxWidth: '480px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Ready to Submit Assessment?
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Please review your progress before sealing your diagnostic results into the Sovereign Evidence Ledger.
              </p>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
                padding: '14px', borderRadius: '10px', background: 'rgba(10, 16, 30, 0.6)',
                border: '1px solid var(--border-subtle)', marginBottom: '24px', textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ANSWERED</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cyber-emerald)', marginTop: '4px' }}>
                    {answeredCount} / {totalQuestions}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>FLAGGED</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#FF9D4D', marginTop: '4px' }}>
                    {Object.keys(flaggedQuestions).filter(k => flaggedQuestions[k]).length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>UNANSWERED</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#F87171', marginTop: '4px' }}>
                    {totalQuestions - answeredCount}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="btn-cyber-outline"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Review Questions
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="btn-cyber-primary"
                  style={{
                    flex: 1.5, padding: '10px', fontWeight: 700,
                    background: 'var(--cyber-emerald)', color: '#060B14', border: 'none'
                  }}
                >
                  Confirm & Submit →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ASSESSMENT LANDING & RESULTS HUB
  // -------------------------------------------------------------
  return (
    <div>
      {/* Subheader Telemetry */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div className="telemetry-node-tag">
            <span>CONTINUOUS DIAGNOSTICS</span>
            <span>//</span>
            <span>SKILL ENGINE ACTIVE</span>
          </div>
          <h1>Skill Assessment</h1>
          <p>Measure your strengths. Discover your gaps. Build your edge.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            fontSize: '12px', color: 'var(--text-secondary)',
            background: 'rgba(255,255,255,0.03)', padding: '6px 14px',
            borderRadius: '8px', border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)'
          }}>
            Candidate Percentile: <strong style={{ color: 'var(--cyber-cyan)' }}>{latestAssessment ? `${latestAssessment.percentile}%` : '92.4%'}</strong>
          </div>
        </div>
      </div>

      {/* Fresh Completion Celebration Banner if just finished */}
      {completedResult && (
        <div style={{
          padding: '16px 20px', borderRadius: '12px',
          background: 'linear-gradient(90deg, rgba(47, 224, 161, 0.15) 0%, rgba(40, 215, 255, 0.15) 100%)',
          border: '1px solid rgba(47, 224, 161, 0.4)',
          marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🎉</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Assessment Complete! Score: {completedResult.score}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {completedResult.trackTitle} results sealed into your Digital Passport & Home Dashboard.
              </div>
            </div>
          </div>
          <button
            onClick={() => setCompletedResult(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Assessment Mode Switcher Tabs */}
      <div style={{
        display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap',
        borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px'
      }}>
        {[
          { id: 'INDUSTRY', label: '🏢 Industry Assessments', desc: 'Company assigned challenges & benchmarks' },
          { id: 'INSTITUTION', label: '🏛️ Academic Exams', desc: 'Scheduled college institutional tests' },
          { id: 'DIAGNOSTIC', label: '🎯 Diagnostic Practice Tracks', desc: 'Self-paced continuous baseline skills' }
        ].map(tab => {
          const isSel = assessmentCategoryTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAssessmentCategoryTab(tab.id)}
              style={{
                padding: '10px 18px', borderRadius: '10px', cursor: 'pointer',
                background: isSel ? 'rgba(0, 212, 255, 0.12)' : 'rgba(255,255,255,0.02)',
                border: isSel ? '1px solid var(--cyber-cyan, #00d9ff)' : '1px solid rgba(255,255,255,0.08)',
                color: isSel ? 'var(--cyber-cyan, #00d9ff)' : '#94a3b8',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: isSel ? '#ffffff' : '#cbd5e1' }}>
                {tab.label}
              </span>
              <span style={{ fontSize: '11px', color: isSel ? 'var(--cyber-cyan, #00d9ff)' : '#64748b' }}>
                {tab.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: Industry Assessments (FEATURE 3) */}
      {assessmentCategoryTab === 'INDUSTRY' && (
        <MyAssessments onShowToast={onShowToast} />
      )}

      {/* Tab Content 2: Official Institutional Examination Schedule */}
      {assessmentCategoryTab === 'INSTITUTION' && (
        <StudentInstitutionAssessments onShowToast={onShowToast} />
      )}

      {/* Tab Content 3: Practice Diagnostic Tracks */}
      {assessmentCategoryTab === 'DIAGNOSTIC' && (
        <>
          <div style={{ marginTop: '12px', marginBottom: '16px' }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
              Diagnostic Practice Tracks
            </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
          Autonomous self-paced benchmark tracks to calibrate your baseline readiness score.
        </p>
      </div>

      {/* 3 Assessment Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Track 1: Logical Reasoning */}
        <div className="glass-panel" style={{
          padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          border: '1px solid rgba(40, 215, 255, 0.35)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="cyber-badge badge-cyan">PROBLEM SOLVING</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID: LR-4416</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(40, 215, 255, 0.1)', border: '1px solid var(--cyber-cyan)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyber-cyan)'
              }}>
                <Brain size={18} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Logical Reasoning
              </h3>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Problem solving & critical thinking. Evaluate algorithmic deduction, causal clocks, and pattern synthesis.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '20px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>QUESTIONS</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>20 Qs</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DURATION</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>25 min</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DIFFICULTY</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-cyan)', marginTop: '2px' }}>Adaptive</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleStartTrack('logical')}
            className="btn-cyber-primary"
            style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
          >
            <span>Start Assessment →</span>
          </button>
        </div>

        {/* Track 2: Aptitude */}
        <div className="glass-panel" style={{
          padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="cyber-badge" style={{ background: 'var(--cyber-blue-dim)', color: 'var(--cyber-blue)', border: '1px solid var(--border-subtle)' }}>QUANT & VERBAL</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID: AP-2011</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'var(--cyber-blue-dim)', border: '1px solid var(--cyber-blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyber-blue)'
              }}>
                <Target size={18} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Aptitude
              </h3>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Quantitative, verbal & data interpretation. Test mathematical speed, ratio calculations, and verbal precision.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '20px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>QUESTIONS</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>25 Qs</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DURATION</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>30 min</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DIFFICULTY</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-blue)', marginTop: '2px' }}>Adaptive</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleStartTrack('aptitude')}
            className="btn-cyber-primary"
            style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
          >
            <span>Start Assessment →</span>
          </button>
        </div>

        {/* Track 3: Programming */}
        <div className="glass-panel glass-panel-glow-purple" style={{
          padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="cyber-badge badge-purple">LIVE TECHNICAL</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID: PR-5121</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'var(--cyber-purple-dim)', border: '1px solid var(--cyber-purple)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyber-purple)'
              }}>
                <Terminal size={18} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Programming
              </h3>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              Coding & technical problem solving. Syntax verification, algorithms, and complexity diagnostics.
            </p>

            {/* Language Selector */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                SELECT EVALUATION LANGUAGE:
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {QUESTION_BANKS.programming.supportedLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    style={{
                      padding: '4px 9px', borderRadius: '6px', fontSize: '11px',
                      background: selectedLanguage === lang ? 'var(--cyber-purple)' : 'var(--cyber-purple-dim)',
                      color: selectedLanguage === lang ? '#fff' : 'var(--cyber-purple)',
                      border: `1px solid ${selectedLanguage === lang ? 'var(--cyber-purple)' : 'rgba(139,92,246,0.25)'}`,
                      cursor: 'pointer', fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '20px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>QUESTIONS</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>15 Qs</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DURATION</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>45 min</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DIFFICULTY</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-purple)', marginTop: '2px' }}>Adaptive</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleStartTrack('programming')}
              className="btn-cyber-purple"
              style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
            >
              <span>Start Assessment →</span>
            </button>
            <button
              onClick={() => setShowSandbox(true)}
              className="btn-cyber-outline"
              title="Launch Code Sandbox"
              style={{ padding: '12px 14px' }}
            >
              <Code size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Post-Assessment Intelligence & Evidence Synthesis Panel */}
      {latestAssessment && (
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyber-cyan)', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                <Sparkles size={14} />
                <span>Post-Assessment Intelligence & Evidence Synthesis</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {latestAssessment.trackTitle} Diagnostics • Completed: {latestAssessment.completedAt}
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              SYNTHESIS CONFIDENCE: <strong style={{ color: 'var(--cyber-emerald)' }}>98.4%</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1.2fr 1fr', gap: '28px', alignItems: 'center' }}>
            {/* Circular Overall Score Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: '130px', height: '130px', borderRadius: '50%',
                background: 'var(--bg-input)',
                border: '3px solid var(--cyber-cyan)',
                boxShadow: 'var(--cyber-cyan-glow)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '34px', fontWeight: 900, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                  {latestAssessment.score}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
                  OVERALL SCORE
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                <div>Accuracy: <strong style={{ color: 'var(--text-primary)' }}>{latestAssessment.accuracy}%</strong></div>
                <div>Speed: <strong style={{ color: 'var(--cyber-cyan)' }}>{latestAssessment.speedEfficiency}%</strong></div>
              </div>
            </div>

            {/* Strengths & Weak Areas / Gaps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--cyber-emerald)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} />
                  <span>STRENGTHS</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  {latestAssessment.strengths?.map((str, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--cyber-emerald)' }}>✓</span> {str}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--cyber-rose)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} />
                  <span>WEAK AREAS & SKILL GAPS</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  {latestAssessment.weaknesses?.map((w, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--cyber-rose)' }}>•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Skill Impact & NEXUS AI Recommendation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Skill Impact Card */}
              <div style={{ padding: '14px', background: 'rgba(0, 212, 255, 0.05)', borderRadius: '10px', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                    SKILL IMPACT PROJECTION
                  </span>
                  <span className="cyber-badge badge-cyan" style={{ fontSize: '9px' }}>Verified Evidence</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-primary)', marginTop: '6px' }}>
                  {latestAssessment.skillImpact?.map((imp, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{imp.skill}:</span>
                      <strong style={{ color: 'var(--cyber-emerald)' }}>{imp.boost} evidence added</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* NEXUS AI Next Best Action */}
              <div style={{ padding: '14px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} color="var(--cyber-purple)" />
                  <span>NEXUS AI EXPLAINABLE RECOMMENDATION</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '10px' }}>
                  {latestAssessment.aiRecommendation?.summary}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setActivePage(latestAssessment.aiRecommendation?.actionPage || 'learning')}
                    className="btn-cyber-purple"
                    style={{ flex: 1, padding: '7px 12px', fontSize: '11.5px', fontWeight: 600 }}
                  >
                    <span>{latestAssessment.aiRecommendation?.nextBestAction || 'Take Action →'}</span>
                  </button>
                  <button
                    onClick={() => setActivePage('skills')}
                    className="btn-cyber-outline"
                    style={{ padding: '7px 12px', fontSize: '11.5px' }}
                  >
                    View Skills
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Code Sandbox Modal */}
      <CodeSandboxModal
        isOpen={showSandbox}
        onClose={() => setShowSandbox(false)}
        onAttested={() => {
          if (onShowToast) {
            onShowToast({
              title: 'Code Solution Attested',
              message: 'Live runtime and memory benchmarks signed into your Digital Passport.',
              type: 'success'
            });
          }
        }}
      />
    </div>
  );
}
