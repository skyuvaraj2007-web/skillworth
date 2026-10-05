import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  X,
  Clock,
  User,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';

export default function AssessmentIntegrityReportModal({
  isOpen,
  onClose,
  assessmentId,
  studentId = null,
  userRole = 'student',
  onShowToast = null
}) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reviewingEventId, setReviewingEventId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
      const url = `/api/assessments/${assessmentId}/integrity-report${studentId ? `?studentId=${studentId}` : ''}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setReport(data.data);
      } else {
        setError(data.message || 'Failed to load integrity report.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [assessmentId, studentId]);

  useEffect(() => {
    if (isOpen) {
      fetchReport();
    }
  }, [isOpen, fetchReport]);

  const handleReviewAction = async (eventId, reviewStatus) => {
    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
      const res = await fetch(`/api/assessments/${assessmentId}/review-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          eventId,
          reviewStatus,
          notes: reviewNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onShowToast) onShowToast(`Event marked as ${reviewStatus.replace(/_/g, ' ')}.`, 'success');
        setReviewingEventId(null);
        setReviewNotes('');
        fetchReport();
      } else {
        if (onShowToast) onShowToast(data.message || 'Review submission failed.', 'error');
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message, 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!isOpen) return null;

  const isAuthorizedReviewer = ['institution', 'academician', 'faculty', 'company', 'industry', 'admin'].includes(
    String(userRole).toLowerCase()
  );

  const filteredEvents = (report?.events || []).filter(e => {
    if (severityFilter !== 'ALL' && e.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && e.reviewStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content-box" 
        style={{ maxWidth: '900px', width: '92%', maxHeight: '90vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: report?.overallStatus === 'NORMAL' ? 'rgba(46, 224, 161, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${report?.overallStatus === 'NORMAL' ? 'var(--cyber-emerald)' : '#F59E0B'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: report?.overallStatus === 'NORMAL' ? 'var(--cyber-emerald)' : '#F59E0B'
            }}>
              {report?.overallStatus === 'NORMAL' ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Assessment Integrity Report
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {report?.assessmentTitle || 'Technical Benchmark'} // Nexus Assessment Guard
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading assessment integrity report...
            </div>
          )}

          {error && (
            <div style={{
              padding: '16px', borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444', fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          {!loading && !error && report && (
            <>
              {/* Meta & Status Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Candidate / Student</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {report.student?.name || 'Student Candidate'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{report.student?.email || ''}</div>
                </div>

                <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={15} color="var(--cyber-cyan)" />
                    {report.durationMinutes} minutes
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Session verified</div>
                </div>

                <div style={{
                  padding: '14px', borderRadius: '8px',
                  background: report.overallStatus === 'NORMAL' ? 'rgba(46, 224, 161, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: report.overallStatus === 'NORMAL' ? '1px solid rgba(46, 224, 161, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Assessment Status</div>
                  <div style={{
                    fontSize: '13px', fontWeight: 700,
                    color: report.overallStatus === 'NORMAL' ? 'var(--cyber-emerald)' : '#F59E0B',
                    marginTop: '4px'
                  }}>
                    {report.statusLabel}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Human review recommended for flagged signals</div>
                </div>
              </div>

              {/* Signals Counter Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                marginBottom: '24px'
              }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.3)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: report.counters.tabSwitches > 0 ? '#F59E0B' : 'var(--text-primary)' }}>
                    {report.counters.tabSwitches}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Tab Switches</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.3)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: report.counters.fullscreenExits > 0 ? '#F59E0B' : 'var(--text-primary)' }}>
                    {report.counters.fullscreenExits}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Fullscreen Exits</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.3)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: report.counters.pasteAttempts > 0 ? '#F59E0B' : 'var(--text-primary)' }}>
                    {report.counters.pasteAttempts}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Paste Attempts</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.3)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: report.counters.additionalPersons > 0 ? '#EF4444' : 'var(--text-primary)' }}>
                    {report.counters.additionalPersons}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Additional Persons</div>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.3)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: report.counters.phoneLikeObjects > 0 ? '#EF4444' : 'var(--text-primary)' }}>
                    {report.counters.phoneLikeObjects}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Phone-like Objects</div>
                </div>
              </div>

              {/* Filters */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Recorded Integrity Signals ({filteredEvents.length})
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    style={{
                      padding: '6px 10px', borderRadius: '6px',
                      background: 'rgba(15, 23, 42, 0.8)', color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)', fontSize: '12px'
                    }}
                  >
                    <option value="ALL">All Severities</option>
                    <option value="LOW">Low Severity</option>
                    <option value="MEDIUM">Medium Severity</option>
                    <option value="HIGH">High Severity</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: '6px 10px', borderRadius: '6px',
                      background: 'rgba(15, 23, 42, 0.8)', color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)', fontSize: '12px'
                    }}
                  >
                    <option value="ALL">All Review Statuses</option>
                    <option value="PENDING_REVIEW">Pending Review</option>
                    <option value="CONFIRMED">Confirmed Concern</option>
                    <option value="DISMISSED">Dismissed</option>
                    <option value="NEEDS_MORE_REVIEW">Needs More Review</option>
                  </select>
                </div>
              </div>

              {/* Events Table / List */}
              {filteredEvents.length === 0 ? (
                <div style={{
                  padding: '32px', textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.3)', borderRadius: '8px',
                  color: 'var(--text-muted)', fontSize: '13px'
                }}>
                  <ShieldCheck size={28} color="var(--cyber-emerald)" style={{ margin: '0 auto 8px auto' }} />
                  <div>No integrity events recorded for the selected filter criteria.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredEvents.map(ev => {
                    const isPending = ev.reviewStatus === 'PENDING_REVIEW';
                    const isConfirmed = ev.reviewStatus === 'CONFIRMED';
                    const isDismissed = ev.reviewStatus === 'DISMISSED';

                    return (
                      <div
                        key={ev.id}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '8px',
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                              background: ev.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : (ev.severity === 'MEDIUM' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(46, 224, 161, 0.15)'),
                              color: ev.severity === 'HIGH' ? '#EF4444' : (ev.severity === 'MEDIUM' ? '#F59E0B' : 'var(--cyber-emerald)')
                            }}>
                              {ev.severity}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {ev.eventType.replace(/_/g, ' ')}
                            </span>
                            {ev.questionId && (
                              <span style={{ fontSize: '11px', color: 'var(--cyber-cyan)', background: 'rgba(0, 212, 255, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                Question: {ev.questionId}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {new Date(ev.timestamp).toLocaleTimeString()}
                            </span>
                            <span style={{
                              fontSize: '11px', fontWeight: 600,
                              color: isConfirmed ? '#EF4444' : (isDismissed ? 'var(--cyber-emerald)' : '#F59E0B')
                            }}>
                              {ev.reviewStatus.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Metadata note */}
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Signal confidence: {ev.confidence}% • Duration: {ev.durationSeconds}s
                          {ev.metadata?.note ? ` • ${ev.metadata.note}` : ''}
                          {ev.reviewedBy ? ` • Reviewed by: ${ev.reviewedBy}` : ''}
                        </div>

                        {/* Human Review Action for Authorized Reviewers */}
                        {isAuthorizedReviewer && (
                          <div style={{
                            marginTop: '6px', paddingTop: '8px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px'
                          }}>
                            {reviewingEventId === ev.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                <input
                                  type="text"
                                  placeholder="Reviewer notes (optional)..."
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  style={{
                                    flexGrow: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '4px',
                                    background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)'
                                  }}
                                />
                                <button
                                  onClick={() => handleReviewAction(ev.id, 'CONFIRMED')}
                                  disabled={isSubmittingReview}
                                  style={{
                                    padding: '6px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '4px',
                                    background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#EF4444', cursor: 'pointer'
                                  }}
                                >
                                  Confirm Concern
                                </button>
                                <button
                                  onClick={() => handleReviewAction(ev.id, 'DISMISSED')}
                                  disabled={isSubmittingReview}
                                  style={{
                                    padding: '6px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '4px',
                                    background: 'rgba(46, 224, 161, 0.2)', border: '1px solid var(--cyber-emerald)', color: 'var(--cyber-emerald)', cursor: 'pointer'
                                  }}
                                >
                                  Dismiss Event
                                </button>
                                <button
                                  onClick={() => handleReviewAction(ev.id, 'NEEDS_MORE_REVIEW')}
                                  disabled={isSubmittingReview}
                                  style={{
                                    padding: '6px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '4px',
                                    background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', color: '#F59E0B', cursor: 'pointer'
                                  }}
                                >
                                  Need More Review
                                </button>
                                <button
                                  onClick={() => setReviewingEventId(null)}
                                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setReviewingEventId(ev.id); setReviewNotes(ev.metadata?.reviewerNotes || ''); }}
                                className="btn-cyber-outline"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                              >
                                Review Event
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} className="btn-cyber-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
