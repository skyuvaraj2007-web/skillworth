import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Award,
  ShieldCheck,
  Code,
  Layers,
  Play,
  Check,
  FileCode,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Send,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

const playChime = (type = 'success') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    if (type === 'success') {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (err) {}
};

export default function SkillLearningPathModal({
  isOpen,
  onClose,
  skillId,
  onProgressUpdated,
  onShowToast
}) {
  const [skill, setSkill] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeSection, setActiveSection] = useState('lessons'); // 'lessons' | 'practice' | 'assessment' | 'project'
  const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);

  // Practice state
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [practiceSubmitted, setPracticeSubmitted] = useState({});

  // Project state
  const [projectRepo, setProjectRepo] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [submittingProject, setSubmittingProject] = useState(false);

  // Load skill and progress telemetry
  const loadData = async () => {
    if (!skillId) return;
    setLoading(true);
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const [skillRes, progRes] = await Promise.all([
        fetch(`/api/learning/skills/${skillId}`, { headers }).then(r => r.json()),
        fetch(`/api/learning/skills/${skillId}/progress`, { headers }).then(r => r.json())
      ]);

      if (skillRes.success && skillRes.data) {
        setSkill(skillRes.data);
      }
      if (progRes.success && progRes.data) {
        setProgressData(progRes.data);
      }
    } catch (err) {
      console.error('Error loading skill learning path:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && skillId) {
      loadData();
    }
  }, [isOpen, skillId]);

  if (!isOpen) return null;

  const modules = skill?.modules || [];
  const currentModule = modules[activeModuleIdx] || modules[0];
  const lessons = currentModule?.lessons || [];
  const currentLesson = lessons[selectedLessonIdx] || lessons[0];
  const practiceQuestions = currentModule?.practiceActivities || skill?.practiceActivities || [];

  const completedLessonIds = new Set(progressData?.completedLessonIds || []);
  const isCurrentLessonCompleted = currentLesson ? (completedLessonIds.has(currentLesson.id) || completedLessonIds.has(String(currentLesson.id))) : false;

  // Complete lesson handler
  const handleCompleteLesson = async () => {
    if (!currentLesson) return;
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');

    try {
      const res = await fetch(`/api/learning/skills/${skillId}/lessons/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          moduleId: currentModule?.id || (activeModuleIdx + 1),
          lessonId: currentLesson.id,
          lessonTitle: currentLesson.title
        })
      });
      const json = await res.json();
      if (json.success) {
        playChime('success');
        if (onShowToast) {
          onShowToast({
            title: 'Lesson Completed!',
            message: `Progress: ${json.data.learningProgress}% | Proficiency: ${json.data.proficiency}%`,
            type: 'success'
          });
        }
        await loadData();
        if (onProgressUpdated) onProgressUpdated();
      }
    } catch (err) {
      console.error('Error completing lesson:', err);
    }
  };

  // Practice answer check
  const handleCheckPractice = async (qIdx, q) => {
    const chosen = practiceAnswers[qIdx];
    if (!chosen) return;
    const isCorrect = chosen === q.correctAnswer;
    const score = isCorrect ? 100 : 40;
    const accuracy = isCorrect ? 100 : 40;

    setPracticeSubmitted(prev => ({ ...prev, [qIdx]: { isCorrect, explanation: q.explanation } }));
    if (isCorrect) playChime('success');
    else playChime('error');

    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    try {
      const res = await fetch(`/api/learning/skills/${skillId}/practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          activityId: q.id || `prc_${qIdx}`,
          moduleId: currentModule?.id || (activeModuleIdx + 1),
          lessonId: currentLesson?.id,
          score,
          accuracy,
          timeSpent: 45,
          answers: [{ questionId: q.id, chosen, isCorrect }]
        })
      });
      const json = await res.json();
      if (json.success) {
        await loadData();
        if (onProgressUpdated) onProgressUpdated();
      }
    } catch (err) {
      console.error('Error recording practice:', err);
    }
  };

  // Project submission handler
  const handleSubmitProject = async (e) => {
    e.preventDefault();
    if (!projectRepo.trim()) return;
    setSubmittingProject(true);
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');

    try {
      const res = await fetch(`/api/learning/skills/${skillId}/project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          projectTitle: skill?.project?.title || `${skill?.name} Capstone Project`,
          repositoryUrl: projectRepo.trim(),
          notes: projectNotes.trim(),
          technologies: skill?.technologies || [skill?.name],
          score: 95
        })
      });
      const json = await res.json();
      if (json.success) {
        playChime('success');
        try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } }); } catch (e) {}
        if (onShowToast) {
          onShowToast({
            title: 'Project Evidence Submitted!',
            message: 'Your capstone project has been validated and recorded on your ledger.',
            type: 'success'
          });
        }
        await loadData();
        if (onProgressUpdated) onProgressUpdated();
      }
    } catch (err) {
      console.error('Error submitting project:', err);
    } finally {
      setSubmittingProject(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 22, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card, #0c1222)',
        border: '1px solid var(--border-subtle, rgba(0, 212, 255, 0.2))',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '1100px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(12, 18, 34, 0.95)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>
                <Sparkles size={11} /> LEARNING PATH
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {skill?.institutionName || 'Institutional Skill'}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-heading)' }}>
              {skill?.name || 'Skill Learning Pathway'}
            </h2>
          </div>

          {/* Progress & Proficiency Telemetry Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: '10px',
              padding: '6px 14px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '9.5px', color: 'var(--cyber-cyan)', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                LEARNING PROGRESS
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {progressData?.learningProgress ?? 0}%
              </div>
            </div>

            <div style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '10px',
              padding: '6px 14px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '9.5px', color: 'var(--cyber-purple)', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                SKILL PROFICIENCY
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {progressData?.proficiency ?? 0}%
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Best Next Action Banner */}
        {progressData?.bestNextAction && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} color="var(--cyber-cyan)" />
              <strong style={{ color: 'var(--cyber-cyan)' }}>BEST NEXT ACTION:</strong>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{progressData.bestNextAction.action}</span>
              <span style={{ color: 'var(--text-muted)' }}>— {progressData.bestNextAction.reason}</span>
            </div>
          </div>
        )}

        {/* Main Body: Left Module Navigator & Right Content Area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Module Sidebar */}
          <div style={{
            width: '280px',
            borderRight: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            background: 'rgba(8, 12, 24, 0.7)',
            overflowY: 'auto',
            padding: '16px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
              MODULES ({modules.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {modules.map((m, idx) => {
                const isActive = activeModuleIdx === idx;
                const isCompleted = (progressData?.completedModuleIds || []).includes(m.id || m.moduleNumber);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveModuleIdx(idx);
                      setSelectedLessonIdx(0);
                    }}
                    style={{
                      background: isActive ? 'rgba(0, 212, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? 'var(--cyber-cyan)' : 'transparent'}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10px', color: isActive ? 'var(--cyber-cyan)' : 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        MODULE {m.moduleNumber || idx + 1}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px', lineHeight: 1.3 }}>
                        {m.title}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {m.lessons?.length || 0} Lessons • {m.duration}
                      </div>
                    </div>
                    {isCompleted && (
                      <CheckCircle2 size={16} color="var(--cyber-emerald, #10b981)" style={{ flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Practical Project Link */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setActiveSection('project')}
                style={{
                  width: '100%',
                  background: activeSection === 'project' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeSection === 'project' ? 'var(--cyber-purple)' : 'transparent'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <FileCode size={16} color="var(--cyber-purple)" />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Capstone Project
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {progressData?.projectSubmission?.submitted ? '✓ Submitted & Verified' : 'Practical Submission'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Right Main Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Section Tab bar */}
            <div style={{
              display: 'flex',
              gap: '16px',
              padding: '12px 24px',
              borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              background: 'rgba(10, 15, 28, 0.6)'
            }}>
              <button
                onClick={() => setActiveSection('lessons')}
                className={`filter-pill ${activeSection === 'lessons' ? 'active' : ''}`}
                style={{ fontSize: '12px' }}
              >
                <BookOpen size={13} style={{ marginRight: '6px' }} /> Lessons ({lessons.length})
              </button>
              <button
                onClick={() => setActiveSection('practice')}
                className={`filter-pill ${activeSection === 'practice' ? 'active' : ''}`}
                style={{ fontSize: '12px' }}
              >
                <HelpCircle size={13} style={{ marginRight: '6px' }} /> Practice Checkpoint ({practiceQuestions.length})
              </button>
              <button
                onClick={() => setActiveSection('project')}
                className={`filter-pill ${activeSection === 'project' ? 'active' : ''}`}
                style={{ fontSize: '12px' }}
              >
                <FileCode size={13} style={{ marginRight: '6px' }} /> Capstone Project
              </button>
            </div>

            {/* Tab 1: Lessons Reader */}
            {activeSection === 'lessons' && (
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Lesson List on left of reader */}
                <div style={{
                  width: '240px',
                  borderRight: '1px solid rgba(255,255,255,0.08)',
                  overflowY: 'auto',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {lessons.map((l, lIdx) => {
                    const isSelected = selectedLessonIdx === lIdx;
                    const isDone = completedLessonIds.has(l.id) || completedLessonIds.has(String(l.id));
                    return (
                      <button
                        key={lIdx}
                        onClick={() => setSelectedLessonIdx(lIdx)}
                        style={{
                          background: isSelected ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                          border: `1px solid ${isSelected ? 'rgba(0, 212, 255, 0.3)' : 'transparent'}`,
                          borderRadius: '6px',
                          padding: '8px 10px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? 'var(--cyber-cyan)' : 'var(--text-primary)' }}>
                            {l.title}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{l.duration}</div>
                        </div>
                        {isDone && <CheckCircle2 size={13} color="var(--cyber-emerald)" />}
                      </button>
                    );
                  })}
                </div>

                {/* Lesson Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {currentLesson ? (
                    <>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span className="cyber-badge" style={{ fontSize: '10px' }}>{currentLesson.duration || '45 Mins'}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Topic: {currentLesson.topic || currentModule?.title}</span>
                        </div>
                        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                          {currentLesson.title}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '6px' }}>
                          {currentLesson.description}
                        </p>
                      </div>

                      {/* Content Box */}
                      <div className="glass-panel" style={{ padding: '20px', fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary)' }}>
                        <div style={{ marginBottom: '14px' }}>
                          {currentLesson.content}
                        </div>

                        {/* Practical Code Walkthrough */}
                        <div style={{
                          background: '#070b15',
                          border: '1px solid rgba(0, 212, 255, 0.2)',
                          borderRadius: '8px',
                          padding: '16px',
                          marginTop: '16px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12.5px',
                          color: '#38bdf8'
                        }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '8px' }}>
                            # Applied Implementation Pattern
                          </div>
                          <pre style={{ margin: 0, overflowX: 'auto', color: '#e2e8f0' }}>
{`// Production Pattern: ${currentLesson.title}
class ${skill?.name?.replace(/[^a-zA-Z]/g, '') || 'Architecture'}Engine {
  constructor(config = {}) {
    this.status = 'INITIALIZED';
    this.telemetry = [];
  }

  execute(task) {
    console.log('[RUN] Processing task:', task);
    return { success: true, timestamp: Date.now() };
  }
}`}
                          </pre>
                        </div>
                      </div>

                      {/* Lesson Footer Action */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {isCurrentLessonCompleted ? '✓ This lesson is completed' : 'Complete lesson reading to advance progress'}
                        </div>

                        <button
                          onClick={handleCompleteLesson}
                          className="btn-cyber-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <CheckCircle2 size={16} />
                          {isCurrentLessonCompleted ? 'Marked as Completed' : 'Mark Lesson Complete'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No lessons found for this module.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Practice Checkpoint */}
            {activeSection === 'practice' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-heading)' }}>
                    Practice & Knowledge Verification
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginTop: '4px' }}>
                    Practice activities directly feed into your demonstrated Skill Proficiency score.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {practiceQuestions.map((q, qIdx) => {
                    const submitted = practiceSubmitted[qIdx];
                    return (
                      <div key={qIdx} className="glass-panel" style={{ padding: '20px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                          Question {qIdx + 1}: {q.question}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                          {(q.options || []).map((opt, oIdx) => {
                            const isSelected = practiceAnswers[qIdx] === opt;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => !submitted && setPracticeAnswers(p => ({ ...p, [qIdx]: opt }))}
                                disabled={Boolean(submitted)}
                                style={{
                                  background: isSelected ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${isSelected ? 'var(--cyber-cyan)' : 'rgba(255,255,255,0.08)'}`,
                                  borderRadius: '8px',
                                  padding: '10px 14px',
                                  textAlign: 'left',
                                  cursor: submitted ? 'default' : 'pointer',
                                  color: 'var(--text-primary)',
                                  fontSize: '13px'
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {!submitted ? (
                          <button
                            onClick={() => handleCheckPractice(qIdx, q)}
                            disabled={!practiceAnswers[qIdx]}
                            className="btn-cyber-primary"
                            style={{ fontSize: '12px', padding: '6px 16px' }}
                          >
                            Check Answer
                          </button>
                        ) : (
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: submitted.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${submitted.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            fontSize: '12.5px',
                            color: submitted.isCorrect ? '#10b981' : '#f87171'
                          }}>
                            <strong>{submitted.isCorrect ? '✓ Correct!' : '✗ Needs review.'}</strong> {submitted.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Capstone Project */}
            {activeSection === 'project' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-heading)' }}>
                    {skill?.project?.title || `${skill?.name} Practical Capstone Project`}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                    {skill?.project?.description || 'Build and deploy a complete production-ready application demonstrating core concepts.'}
                  </p>
                </div>

                {/* Project Specs */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--cyber-cyan)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                    PROJECT REQUIREMENTS & EVALUATION CRITERIA
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.8 }}>
                    {(skill?.project?.requirements || ['Write clean, modular code', 'Handle errors and edge cases', 'Include unit tests and documentation']).map((req, rIdx) => (
                      <li key={rIdx}>{req}</li>
                    ))}
                  </ul>

                  <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <strong>Expected Outcome:</strong> {skill?.project?.expectedOutcome || 'A fully functional project with working code and documentation.'}
                  </div>
                </div>

                {/* Project Submission Box */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '12px' }}>
                    Submit Capstone Repository
                  </h4>

                  {progressData?.projectSubmission?.submitted ? (
                    <div style={{
                      padding: '16px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: 'var(--cyber-emerald)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px' }}>
                        <ShieldCheck size={18} /> Project Attestation Verified
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '6px' }}>
                        Repository: <a href={progressData.projectSubmission.repositoryUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--cyber-cyan)' }}>{progressData.projectSubmission.repositoryUrl}</a>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Submitted on: {new Date(progressData.projectSubmission.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitProject} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                          REPOSITORY URL (GitHub / GitLab / Bitbucket) *
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="https://github.com/username/project-repo"
                          value={projectRepo}
                          onChange={(e) => setProjectRepo(e.target.value)}
                          style={{
                            width: '100%',
                            background: 'var(--bg-input, rgba(255,255,255,0.04))',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            color: 'var(--text-primary)',
                            fontSize: '13px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                          IMPLEMENTATION NOTES & ARCHITECTURE HIGHLIGHTS
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Briefly explain key patterns, framework decisions, and testing strategy..."
                          value={projectNotes}
                          onChange={(e) => setProjectNotes(e.target.value)}
                          style={{
                            width: '100%',
                            background: 'var(--bg-input, rgba(255,255,255,0.04))',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingProject || !projectRepo.trim()}
                        className="btn-cyber-primary"
                        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}
                      >
                        <Send size={15} />
                        {submittingProject ? 'Submitting...' : 'Submit Practical Project'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
