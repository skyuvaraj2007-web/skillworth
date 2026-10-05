import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Plus,
  Brain,
  CheckCircle,
  Clock,
  Users,
  Search,
  AlertCircle,
  Trash2,
  Edit,
  Code,
  FileText,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Send,
  Building,
  Filter,
  RefreshCw,
  X,
  BookOpen,
  UserCheck
} from 'lucide-react';
import CompanyAssessmentBuilder from './CompanyAssessmentBuilder';
import QuestionBankDrawer from './QuestionBankDrawer';
import industryAssessmentService from '../../services/industryAssessmentService';
import AssessmentIntegrityReportModal from '../assessment/AssessmentIntegrityReportModal';

export default function CompanyTargetedAssessments({ user, onShowToast }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [showQuestionBankDrawer, setShowQuestionBankDrawer] = useState(false);
  const [viewingAssessment, setViewingAssessment] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [shortlistingStudentId, setShortlistingStudentId] = useState(null);
  const [viewingIntegrityStudent, setViewingIntegrityStudent] = useState(null);

  const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/company/assessments`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setAssessments(data.data);
      }
    } catch (err) {
      console.error('[CompanyTargetedAssessments] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiBase, token]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handlePublishExisting = async (assessmentId) => {
    try {
      const res = await fetch(`${apiBase}/company/assessments/${assessmentId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Publish failed');
      if (onShowToast) {
        onShowToast({
          title: 'Assessment Published',
          message: 'Targeted students have been notified via secure platform ledger.',
          type: 'success'
        });
      }
      fetchAssessments();
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleViewResults = async (asmt) => {
    setViewingAssessment(asmt);
    setLoadingResults(true);
    try {
      const res = await industryAssessmentService.getAssessmentResults(asmt.id);
      if (res.success) {
        setAssessmentResults(res.data);
      }
    } catch (e) {
      setAssessmentResults(null);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleShortlistCandidate = async (candidate) => {
    if (!viewingAssessment) return;
    try {
      setShortlistingStudentId(candidate.student_id);
      const res = await industryAssessmentService.shortlistCandidate(
        viewingAssessment.id,
        candidate.student_id,
        `Auto-shortlisted via assessment score: ${candidate.score}%`
      );

      if (res.success) {
        // Update local results state
        setAssessmentResults(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            results: prev.results.map(r =>
              r.student_id === candidate.student_id ? { ...r, shortlisted: true } : r
            )
          };
        });

        if (onShowToast) {
          onShowToast({
            title: 'Candidate Shortlisted! 🎯',
            message: `${candidate.student_name} has been moved to the Shortlisted stage with candidate notification dispatched.`,
            type: 'success'
          });
        }
      } else {
        throw new Error(res.message || 'Shortlisting failed');
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({ title: 'Shortlist Failed', message: err.message, type: 'error' });
      }
    } finally {
      setShortlistingStudentId(null);
    }
  };

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = (a.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterTab === 'DRAFTS') return a.status === 'DRAFT';
    if (filterTab === 'PUBLISHED') return a.status === 'PUBLISHED';
    return true;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
              background: 'rgba(0, 212, 255, 0.12)', color: 'var(--cyber-cyan, #00d9ff)',
              border: '1px solid rgba(0, 212, 255, 0.3)', letterSpacing: '0.05em'
            }}>
              INDUSTRY TARGETED ASSESSMENTS
            </span>
            <span style={{ color: '#64748b' }}>//</span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>FEATURE 3 BUILDER</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#ffffff' }}>
            Targeted Technical Assessments
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#94a3b8' }}>
            Author skill-based assessments, reuse Question Bank items, target specific cohorts, and review server-evaluated candidate scorecards.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowQuestionBankDrawer(true)}
            className="btn-cyber-outline"
            style={{
              padding: '10px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <BookOpen size={16} />
            <span>Question Bank</span>
          </button>

          <button
            onClick={() => setShowBuilderModal(true)}
            className="btn-cyber-primary"
            style={{
              padding: '10px 20px', fontSize: '13.5px', fontWeight: 700, borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Plus size={16} />
            <span>Create Assessment</span>
          </button>
        </div>
      </div>

      {/* ── FILTER TABS & SEARCH ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'ALL', label: 'All Assessments' },
            { id: 'PUBLISHED', label: 'Active & Published' },
            { id: 'DRAFTS', label: 'Drafts' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilterTab(t.id)}
              style={{
                padding: '7px 16px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.08)',
                background: filterTab === t.id ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
                color: filterTab === t.id ? 'var(--cyber-cyan, #00d9ff)' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px 8px 34px', borderRadius: '8px', width: '100%',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff', fontSize: '12.5px'
            }}
          />
        </div>
      </div>

      {/* ── ASSESSMENT LIST ── */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading enterprise assessments...</p>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <Award size={44} style={{ opacity: 0.25, margin: '0 auto 14px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '17px', color: '#ffffff' }}>No Assessments Created Yet</h3>
          <p style={{ margin: '0 0 18px', fontSize: '13px' }}>
            Author targeted challenges across Logical Reasoning, Aptitude, Numerical, and Programming with test cases.
          </p>
          <button
            onClick={() => setShowBuilderModal(true)}
            className="btn-cyber-primary"
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            Launch Assessment Builder
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '18px' }}>
          {filteredAssessments.map(asmt => (
            <div
              key={asmt.id}
              className="glass-card"
              style={{
                padding: '22px', borderRadius: '12px',
                background: 'rgba(10, 24, 48, 0.75)', border: '1px solid rgba(0, 212, 255, 0.2)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                    background: asmt.status === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: asmt.status === 'PUBLISHED' ? '#10b981' : '#f59e0b'
                  }}>
                    {asmt.status}
                  </span>

                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {asmt.duration_minutes || asmt.durationMinutes || 45} mins • Pass: {asmt.passing_score || 60}%
                  </span>
                </div>

                <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                  {asmt.title}
                </h3>
                <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                  {asmt.description || 'Targeted technical assessment evaluating domain and programming problem solving.'}
                </p>

                {/* Metrics */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
                  padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)',
                  marginBottom: '16px', textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Questions</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>{asmt.question_count || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Targeted</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--cyber-cyan, #00d9ff)' }}>{asmt.target_count || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Completed</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981' }}>{asmt.completed_count || 0}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                {asmt.status === 'DRAFT' && (
                  <button
                    onClick={() => handlePublishExisting(asmt.id)}
                    className="btn-cyber-primary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Send size={13} />
                    <span>Publish & Notify</span>
                  </button>
                )}
                <button
                  onClick={() => handleViewResults(asmt)}
                  className="btn-cyber-outline"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Award size={13} />
                  <span>Leaderboard ({asmt.completed_count || 0})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 6-STEP MODERN ASSESSMENT BUILDER MODAL ── */}
      <CompanyAssessmentBuilder
        isOpen={showBuilderModal}
        onClose={() => setShowBuilderModal(false)}
        onCreated={() => fetchAssessments()}
        onShowToast={onShowToast}
      />

      {/* ── QUESTION BANK REUSABLE DRAWER ── */}
      <QuestionBankDrawer
        isOpen={showQuestionBankDrawer}
        onClose={() => setShowQuestionBankDrawer(false)}
        onShowToast={onShowToast}
      />

      {/* ── CANDIDATE RESULTS & SHORTLIST LEADERBOARD MODAL ── */}
      {viewingAssessment && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(6, 26, 51, 0.9)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '820px', width: '100%', maxHeight: '88vh', overflowY: 'auto',
            padding: '26px', borderRadius: '16px', background: 'rgba(10, 24, 48, 0.98)',
            border: '1px solid rgba(0, 212, 255, 0.35)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color="var(--cyber-cyan, #00d9ff)" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyber-cyan, #00d9ff)' }}>
                    CANDIDATE RANKING LEADERBOARD
                  </span>
                </div>
                <h3 style={{ margin: '4px 0 0', fontSize: '19px', color: '#ffffff', fontWeight: 800 }}>
                  {viewingAssessment.title}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                  Automatic Sandbox Evaluation & Shortlisting Suite
                </p>
              </div>
              <button onClick={() => setViewingAssessment(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {loadingResults ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>
                <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                Loading candidate rankings...
              </div>
            ) : !assessmentResults || !assessmentResults.results || assessmentResults.results.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>
                No candidate attempts submitted for this assessment yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {assessmentResults.results.map((r) => {
                  const isShortlisted = r.shortlisted || r.stage === 'SHORTLISTED';
                  const isPassed = r.result_status === 'PASSED';
                  const isPending = r.score === null || r.score === undefined;

                  return (
                    <div
                      key={r.student_id}
                      style={{
                        padding: '14px 18px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px'
                      }}
                    >
                      {/* Left: Rank & Candidate Information */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          background: r.rank === 1 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 212, 255, 0.1)',
                          border: `1px solid ${r.rank === 1 ? '#f59e0b' : 'rgba(0, 212, 255, 0.3)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: r.rank === 1 ? '#f59e0b' : 'var(--cyber-cyan, #00d9ff)',
                          fontWeight: 800, fontSize: '13px', fontFamily: 'monospace'
                        }}>
                          #{r.rank}
                        </div>

                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                            {r.student_name}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                            {r.institution_name} • {r.department}
                          </div>

                          {/* Skill breakdown chips if available */}
                          {r.skill_breakdown && Object.keys(r.skill_breakdown).length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                              {Object.entries(r.skill_breakdown).map(([sk, skData]) => (
                                <span
                                  key={sk}
                                  style={{
                                    fontSize: '10px', padding: '1px 6px', borderRadius: '4px',
                                    background: (skData.accuracy || 0) >= 60 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                                    color: (skData.accuracy || 0) >= 60 ? '#34d399' : '#94a3b8',
                                    border: '1px solid rgba(255,255,255,0.06)'
                                  }}
                                >
                                  {sk}: {skData.accuracy || 0}%
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Score & Shortlist Action */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '16px', fontWeight: 800,
                            color: isPassed ? '#10b981' : (isPending ? '#94a3b8' : '#f87171')
                          }}>
                            {isPending ? 'PENDING' : `${r.score}%`}
                          </div>
                          <span style={{
                            fontSize: '9.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px',
                            background: isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)',
                            color: isPassed ? '#10b981' : '#94a3b8'
                          }}>
                            {r.status || 'SUBMITTED'}
                          </span>
                        </div>

                        {/* Shortlist & Integrity Report Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => setViewingIntegrityStudent({ assessmentId: viewingAssessment.id, studentId: r.student_id })}
                            className="btn-cyber-outline"
                            style={{ padding: '6px 12px', fontSize: '11px', borderColor: 'rgba(0, 212, 255, 0.4)' }}
                            title="Review candidate assessment integrity signals"
                          >
                            Integrity Report
                          </button>
                          {isShortlisted ? (
                            <span style={{
                              padding: '6px 14px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.2)', color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                              <UserCheck size={14} />
                              Shortlisted
                            </span>
                          ) : (
                            <button
                              disabled={shortlistingStudentId === r.student_id || isPending}
                              onClick={() => handleShortlistCandidate(r)}
                              className="btn-cyber-primary"
                              style={{
                                padding: '6px 14px', fontSize: '11.5px', fontWeight: 700,
                                background: isPassed ? 'linear-gradient(90deg, #10b981, #059669)' : undefined,
                                border: 'none', display: 'flex', alignItems: 'center', gap: '6px'
                              }}
                            >
                              <UserCheck size={13} />
                              <span>{shortlistingStudentId === r.student_id ? 'Shortlisting...' : 'Shortlist Candidate'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Candidate Assessment Integrity Report Modal */}
      {viewingIntegrityStudent && (
        <AssessmentIntegrityReportModal
          isOpen={Boolean(viewingIntegrityStudent)}
          onClose={() => setViewingIntegrityStudent(null)}
          assessmentId={viewingIntegrityStudent.assessmentId}
          studentId={viewingIntegrityStudent.studentId}
          userRole="company"
          onShowToast={(msg, type) => onShowToast && onShowToast({ title: 'Integrity Report', message: msg, type: type || 'info' })}
        />
      )}
    </div>
  );
}
