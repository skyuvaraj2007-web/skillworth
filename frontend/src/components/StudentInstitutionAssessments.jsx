import React, { useState, useEffect } from 'react';
import {
  Award,
  Clock,
  CheckCircle2,
  FileCode,
  Brain,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Send,
  RotateCcw
} from 'lucide-react';
import { collaborationService } from '../services/collaborationService';

export default function StudentInstitutionAssessments({ onShowToast, onFinished }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Test State
  const [activeTest, setActiveTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qId]: selectedKey }
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const res = await collaborationService.getStudentInstitutionAssessments();
      if (res.success) {
        setAssessments(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load student institution assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  // Timer Effect for Active Exam
  useEffect(() => {
    let interval = null;
    if (activeTest && timeRemaining > 0 && !resultSummary) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTest, timeRemaining, resultSummary]);

  const handleStartTest = async (assessment) => {
    try {
      setLoading(true);
      const res = await collaborationService.getInstitutionAssessmentDetails(assessment.id);
      if (res.success && res.data) {
        const testData = res.data;
        const qList = testData.questions || [];
        if (qList.length === 0) {
          if (onShowToast) {
            onShowToast({
              title: 'No Questions Eligible',
              message: testData.assessment_type === 'PROGRAMMING'
                ? 'No programming questions match your enrolled course languages. Enroll in a relevant programming course to unlock this assessment.'
                : 'This assessment currently has no active questions.',
              type: 'warning'
            });
          }
          setLoading(false);
          return;
        }

        setActiveTest(testData);
        setQuestions(qList);
        setCurrentIdx(0);
        setUserAnswers({});
        setTimeRemaining((testData.duration_minutes || 45) * 60);
        setResultSummary(null);
      } else {
        if (onShowToast) onShowToast({ title: 'Unable to Launch', message: res.message, type: 'error' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId, optionKey) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optionKey
    }));
  };

  const handleSubmitTest = async () => {
    if (!activeTest || submitting) return;
    try {
      setSubmitting(true);
      const answersArray = Object.entries(userAnswers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption
      }));

      const res = await collaborationService.submitInstitutionAssessmentAttempt(
        activeTest.id,
        answersArray,
        (activeTest.duration_minutes || 45) * 60 - timeRemaining
      );

      if (res.success) {
        setResultSummary(res.data);
        if (onShowToast) {
          onShowToast({
            title: 'Exam Completed',
            message: `Result: ${res.data.percentage}% (${res.data.totalScore}/${res.data.maxScore} marks). Verified to PostgreSQL.`,
            type: 'success'
          });
        }
      } else {
        if (onShowToast) onShowToast({ title: 'Submission Failed', message: res.message, type: 'error' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── ACTIVE TEST VIEW ──
  if (activeTest && questions.length > 0) {
    if (resultSummary) {
      const isPassed = resultSummary.isPassed || (resultSummary.percentage >= 50);
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.9)',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          padding: '36px',
          textAlign: 'center',
          maxWidth: '640px',
          margin: '40px auto'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: isPassed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px auto',
            border: `2px solid ${isPassed ? '#4ade80' : '#f87171'}`
          }}>
            <Award style={{ width: '32px', height: '32px', color: isPassed ? '#4ade80' : '#f87171' }} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px 0' }}>
            {isPassed ? 'Assessment Benchmark Achieved!' : 'Assessment Attempt Recorded'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 24px 0' }}>
            Your examination response has been verified and permanently committed to the PostgreSQL evidence ledger.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
            background: 'rgba(30, 41, 59, 0.6)', padding: '16px', borderRadius: '10px',
            marginBottom: '28px'
          }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>SCORE</span>
              <strong style={{ color: '#38bdf8', fontSize: '20px' }}>{resultSummary.percentage}%</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>MARKS</span>
              <strong style={{ color: '#f1f5f9', fontSize: '20px' }}>{resultSummary.totalScore} / {resultSummary.maxScore}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>OUTCOME</span>
              <strong style={{ color: isPassed ? '#4ade80' : '#f87171', fontSize: '20px' }}>
                {isPassed ? 'PASSED' : 'NEEDS WORK'}
              </strong>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTest(null);
              setResultSummary(null);
              loadAssessments();
              if (onFinished) onFinished();
            }}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px',
              fontWeight: 700, fontSize: '14px', cursor: 'pointer'
            }}
          >
            Back to Assessment Directory
          </button>
        </div>
      );
    }

    const currentQ = questions[currentIdx];
    const answeredCount = Object.keys(userAnswers).length;

    return (
      <div style={{
        background: '#0a0f1d',
        borderRadius: '16px',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        padding: '28px',
        maxWidth: '840px',
        margin: '20px auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Test Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em' }}>
              OFFICIAL INSTITUTIONAL EXAMINATION // {activeTest.assessment_type}
            </span>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
              {activeTest.title}
            </h2>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '8px 14px', borderRadius: '8px', color: '#f87171', fontWeight: 700, fontFamily: 'monospace', fontSize: '16px'
          }}>
            <Clock style={{ width: '16px', height: '16px' }} />
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Question Area */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
              Question {currentIdx + 1} of {questions.length}
            </span>
            <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 700 }}>
              {currentQ.marks || 10} Marks
            </span>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.5)', padding: '18px', borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '16px'
          }}>
            <p style={{ margin: 0, fontSize: '15px', color: '#f8fafc', lineHeight: 1.5, fontWeight: 500 }}>
              {currentQ.question_text}
            </p>

            {currentQ.code_snippet && (
              <pre style={{
                background: '#040711', padding: '12px', borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.2)', color: '#38bdf8',
                fontFamily: 'monospace', fontSize: '13px', marginTop: '12px', overflowX: 'auto'
              }}>
                {currentQ.code_snippet}
              </pre>
            )}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.isArray(currentQ.options) ? (
              currentQ.options.map((opt, idx) => {
                const optKey = opt.key || String.fromCharCode(65 + idx);
                const isSelected = userAnswers[currentQ.id] === optKey;
                return (
                  <div
                    key={optKey}
                    onClick={() => handleSelectOption(currentQ.id, optKey)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                      background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '6px',
                      background: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#0f172a' : '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '12px'
                    }}>
                      {optKey}
                    </div>
                    <span style={{ color: isSelected ? '#f8fafc' : '#cbd5e1', fontSize: '14px' }}>
                      {opt.text || opt}
                    </span>
                  </div>
                );
              })
            ) : null}
          </div>
        </div>

        {/* Navigation & Submit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px' }}>
          <button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            style={{
              background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8', padding: '10px 18px', borderRadius: '8px', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Previous
          </button>

          <span style={{ color: '#64748b', fontSize: '12.5px' }}>
            Answered {answeredCount} of {questions.length}
          </span>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
              style={{
                background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Next Question →
            </button>
          ) : (
            <button
              onClick={handleSubmitTest}
              disabled={submitting}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none', color: '#fff', padding: '10px 22px', borderRadius: '8px',
                fontWeight: 700, cursor: 'pointer'
              }}
            >
              {submitting ? 'Committing...' : 'Finish & Submit Exam'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── ASSESSMENTS DIRECTORY LIST ──
  return (
    <div style={{ marginTop: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Award style={{ color: 'var(--cyber-cyan)', width: '22px', height: '22px' }} />
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
          Official Institutional Examination Schedule
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Checking college examination schedule...</div>
      ) : assessments.length === 0 ? (
        <div style={{
          padding: '30px', textAlign: 'center', background: 'var(--bg-input)',
          borderRadius: '12px', border: '1px dashed var(--border-subtle)', color: 'var(--text-secondary)',
          fontWeight: 600
        }}>
          No official institution examinations published at this time.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {assessments.map((a) => (
            <div
              key={a.id}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8'
                  }}>
                    {a.assessment_type}
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    {a.duration_minutes || 45} mins
                  </span>
                </div>

                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  {a.title}
                </h3>
                <p style={{ margin: '0 0 14px 0', color: '#94a3b8', fontSize: '12.5px', lineHeight: 1.4 }}>
                  {a.description || 'Institutional skill benchmarking examination.'}
                </p>
              </div>

              <button
                onClick={() => handleStartTest(a)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff',
                  border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                }}
              >
                <span>Enter Institutional Exam</span>
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
