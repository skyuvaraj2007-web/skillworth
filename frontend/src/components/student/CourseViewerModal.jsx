import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  Circle,
  Play,
  FileText,
  Clock,
  Award,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { learningService } from '../../services/learningService';

export default function CourseViewerModal({
  isOpen,
  courseId,
  onClose,
  onProgressUpdated,
  onShowToast
}) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [completing, setCompleting] = useState(false);

  const loadCourse = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await learningService.getCourseDetails(courseId);
      if (res.success && res.data) {
        setCourse(res.data);
      } else {
        onShowToast?.({ title: 'Error', message: res.message || 'Failed to load course details', type: 'error' });
      }
    } catch (err) {
      console.error('Error fetching course details:', err);
      onShowToast?.({ title: 'Error', message: 'Failed to connect to course service', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && courseId) {
      loadCourse();
    }
  }, [isOpen, courseId]);

  if (!isOpen) return null;

  const modules = course?.modules || [];
  const currentModule = modules[activeModuleIdx] || modules[0];
  const lessons = currentModule?.lessons || [];
  const currentLesson = lessons[activeLessonIdx] || lessons[0];

  const handleCompleteLesson = async () => {
    if (!currentLesson || completing) return;
    setCompleting(true);
    try {
      const res = await learningService.completeLesson(courseId, currentLesson.id, {
        moduleId: currentModule?.id,
        timeSpentSeconds: 120
      });
      if (res.success) {
        onShowToast?.({
          title: 'Lesson Completed!',
          message: `Progress updated: ${res.data.progress}% (${res.data.completedLessons}/${res.data.totalLessons} lessons)`,
          type: 'success'
        });
        await loadCourse();
        onProgressUpdated?.();
      } else {
        onShowToast?.({ title: 'Error', message: res.message || 'Could not record completion', type: 'error' });
      }
    } catch (err) {
      console.error('Error completing lesson:', err);
      onShowToast?.({ title: 'Error', message: 'Failed to record lesson progress', type: 'error' });
    } finally {
      setCompleting(false);
    }
  };

  const handleNext = () => {
    if (activeLessonIdx < lessons.length - 1) {
      setActiveLessonIdx(activeLessonIdx + 1);
    } else if (activeModuleIdx < modules.length - 1) {
      setActiveModuleIdx(activeModuleIdx + 1);
      setActiveLessonIdx(0);
    }
  };

  const handlePrev = () => {
    if (activeLessonIdx > 0) {
      setActiveLessonIdx(activeLessonIdx - 1);
    } else if (activeModuleIdx > 0) {
      setActiveModuleIdx(activeModuleIdx - 1);
      const prevLessons = modules[activeModuleIdx - 1]?.lessons || [];
      setActiveLessonIdx(Math.max(0, prevLessons.length - 1));
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(6, 12, 24, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#0d1527',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '1100px',
        height: '90vh',
        maxHeight: '750px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 35px rgba(99, 102, 241, 0.15)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.9)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#6366f1',
                background: 'rgba(99, 102, 241, 0.15)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {course?.category || 'Course'}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {course?.difficulty || 'Intermediate'}
              </span>
              {course?.assignedBy && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <UserCheck size={12} />
                  Assigned by {course.assignedBy.name} ({course.assignedBy.designation || 'Faculty'})
                </span>
              )}
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
              {course?.title || 'Course Player'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Course Progress</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: course?.progress >= 100 ? '#10b981' : '#6366f1' }}>
                {course?.progress || 0}% ({course?.completedLessons || 0}/{course?.totalLessons || 0} Lessons)
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                borderRadius: '8px',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body (Sidebar + Content) */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <div style={{ textAlign: 'center' }}>
              <Clock size={32} className="animate-spin" style={{ color: '#6366f1', margin: '0 auto 12px' }} />
              <div>Loading course modules and lessons...</div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Left Module / Lesson Navigation */}
            <div style={{
              width: '320px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(10, 16, 30, 0.6)',
              overflowY: 'auto',
              padding: '16px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Curriculum Syllabus
              </div>

              {modules.map((m, mIdx) => (
                <div key={m.id || mIdx} style={{ marginBottom: '14px' }}>
                  <div
                    onClick={() => {
                      setActiveModuleIdx(mIdx);
                      setActiveLessonIdx(0);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: activeModuleIdx === mIdx ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                      color: activeModuleIdx === mIdx ? '#6366f1' : '#cbd5e1',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}
                  >
                    <span>{m.title}</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                      {m.completedCount}/{m.totalCount}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '8px' }}>
                    {(m.lessons || []).map((l, lIdx) => {
                      const isCurrent = activeModuleIdx === mIdx && activeLessonIdx === lIdx;
                      return (
                        <div
                          key={l.id || lIdx}
                          onClick={() => {
                            setActiveModuleIdx(mIdx);
                            setActiveLessonIdx(lIdx);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: isCurrent ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.02)',
                            border: isCurrent ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                            color: isCurrent ? '#ffffff' : l.isCompleted ? '#10b981' : '#94a3b8',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {l.isCompleted ? (
                              <CheckCircle2 size={13} color="#10b981" />
                            ) : (
                              <Circle size={13} color="#64748b" />
                            )}
                            <span style={{ fontWeight: isCurrent ? 700 : 400 }}>{l.title}</span>
                          </div>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{l.duration || '10m'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Lesson Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px' }}>
              {currentLesson ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>
                          {currentModule?.title}
                        </div>
                        <h1 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>
                          {currentLesson.title}
                        </h1>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {currentLesson.isCompleted ? (
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#10b981',
                            background: 'rgba(16, 185, 129, 0.15)',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <CheckCircle2 size={14} /> Completed
                          </span>
                        ) : (
                          <button
                            onClick={handleCompleteLesson}
                            disabled={completing}
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              border: 'none',
                              color: '#fff',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: completing ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            <CheckCircle2 size={15} />
                            {completing ? 'Recording...' : 'Mark Lesson Complete'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Lesson Content Box */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '24px',
                      lineHeight: '1.6',
                      color: '#cbd5e1',
                      fontSize: '14px',
                      marginBottom: '20px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#6366f1' }}>
                        <Play size={18} />
                        <strong style={{ color: '#fff' }}>Interactive Lesson Material & Notes</strong>
                      </div>
                      <p style={{ margin: '0 0 14px' }}>
                        {currentLesson.content || `Welcome to "${currentLesson.title}". This module covers core competencies and practical frameworks required for proficiency in ${course?.category || 'this subject'}. Follow along with the code samples and concepts below to build your verified mastery.`}
                      </p>

                      <div style={{
                        background: '#090d16',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        padding: '16px',
                        fontFamily: 'monospace',
                        fontSize: '12.5px',
                        color: '#38bdf8',
                        margin: '16px 0'
                      }}>
                        // SkillNexus Interactive Knowledge Check<br />
                        // Target Topic: {currentLesson.title}<br />
                        // Status: {currentLesson.isCompleted ? 'COMPLETED & VERIFIED' : 'IN_PROGRESS'}<br />
                        const moduleStatus = "{currentLesson.isCompleted ? 'VERIFIED' : 'ACTIVE'}";
                      </div>

                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                        💡 Tip: After reviewing the materials and executing the practice, click <strong>Mark Lesson Complete</strong> to advance your curriculum progress and sync with your faculty dashboard.
                      </div>
                    </div>
                  </div>

                  {/* Navigation footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
                    <button
                      onClick={handlePrev}
                      disabled={activeModuleIdx === 0 && activeLessonIdx === 0}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#cbd5e1',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: (activeModuleIdx === 0 && activeLessonIdx === 0) ? 'not-allowed' : 'pointer',
                        opacity: (activeModuleIdx === 0 && activeLessonIdx === 0) ? 0.4 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <ArrowLeft size={14} /> Previous Lesson
                    </button>

                    <button
                      onClick={handleNext}
                      disabled={activeModuleIdx === modules.length - 1 && activeLessonIdx === lessons.length - 1}
                      style={{
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: '#6366f1',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: (activeModuleIdx === modules.length - 1 && activeLessonIdx === lessons.length - 1) ? 'not-allowed' : 'pointer',
                        opacity: (activeModuleIdx === modules.length - 1 && activeLessonIdx === lessons.length - 1) ? 0.4 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Next Lesson <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  Select a lesson to begin
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
