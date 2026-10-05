import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  RotateCcw,
  FileText,
  BarChart2,
  Users,
  Brain,
  Download,
  Building,
  Check,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { academicService } from '../../services/academicService';
import CertificateViewerModal from '../common/CertificateViewerModal';

export default function InstitutionCertificateVerification({ onShowToast }) {
  const [certificates, setCertificates] = useState([]);
  const [analytics, setAnalytics] = useState({
    total: 0,
    pending: 0,
    underReview: 0,
    verified: 0,
    rejected: 0,
    needsCorrection: 0
  });
  const [skillGapIntel, setSkillGapIntel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'ai-gaps'

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [skillFilter, setSkillFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals & Active Viewer
  const [selectedCertForView, setSelectedCertForView] = useState(null);
  const [actionModal, setActionModal] = useState({
    open: false,
    cert: null,
    action: null, // 'VERIFY' | 'REJECT' | 'NEEDS_CORRECTION'
    reason: '',
    isSubmitting: false
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [certsRes, analyticsRes, gapsRes] = await Promise.all([
        academicService.getInstitutionCertificates({
          status: statusFilter,
          search: searchQuery,
          skill: skillFilter,
          category: categoryFilter
        }).catch(() => ({ success: false, data: [] })),
        academicService.getInstitutionCertificateAnalytics().catch(() => ({ success: false, data: null })),
        academicService.getInstitutionSkillGaps().catch(() => ({ success: false, data: null }))
      ]);

      if (certsRes.success && Array.isArray(certsRes.data)) {
        setCertificates(certsRes.data);
      }
      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
      if (gapsRes.success && gapsRes.data) {
        setSkillGapIntel(gapsRes.data);
      }
    } catch (err) {
      console.error('Failed to load institution certificate data:', err);
      if (onShowToast) onShowToast({ title: 'Error', message: 'Failed to load certificate verification records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, skillFilter, categoryFilter, onShowToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleActionConfirm = async () => {
    const { cert, action, reason } = actionModal;
    if (!cert) return;

    if ((action === 'REJECT' || action === 'NEEDS_CORRECTION') && !reason.trim()) {
      if (onShowToast) onShowToast({ title: 'Reason Required', message: `Please provide an explanation for ${action === 'REJECT' ? 'rejection' : 'correction request'}.`, type: 'warning' });
      return;
    }

    setActionModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      let res;
      if (action === 'VERIFY') {
        res = await academicService.verifyCertificate(cert.id, reason);
      } else if (action === 'REJECT') {
        res = await academicService.rejectCertificate(cert.id, reason);
      } else if (action === 'NEEDS_CORRECTION') {
        res = await academicService.requestCertificateCorrection(cert.id, reason);
      }

      if (res && res.success) {
        if (onShowToast) {
          onShowToast({
            title: action === 'VERIFY' ? 'Certificate Verified' : (action === 'REJECT' ? 'Certificate Rejected' : 'Correction Requested'),
            message: action === 'VERIFY'
              ? `Certificate "${cert.title}" has been verified. Verified skill evidence generated for ${cert.studentName}.`
              : `Review notification dispatched to student ${cert.studentName}.`,
            type: action === 'VERIFY' ? 'success' : 'info'
          });
        }
        setActionModal({ open: false, cert: null, action: null, reason: '', isSubmitting: false });
        await loadData();
      } else {
        if (onShowToast) onShowToast({ title: 'Action Failed', message: res?.message || 'Could not update certificate.', type: 'error' });
        setActionModal(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch (err) {
      console.error('Certificate verification action error:', err);
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
      setActionModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const filteredCertificates = certificates.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (c.title || '').toLowerCase().includes(q);
      const matchStudent = (c.studentName || '').toLowerCase().includes(q) || (c.studentId || '').toLowerCase().includes(q);
      const matchIssuer = (c.issuer || '').toLowerCase().includes(q);
      const matchSkill = (c.relatedSkills || []).some(s => s.toLowerCase().includes(q));
      if (!matchTitle && !matchStudent && !matchIssuer && !matchSkill) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '4px', color: 'var(--text-primary, #1e293b)' }}>
      {/* Header Banner */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-subtle)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyber-purple, #8b5cf6)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <ShieldCheck size={16} />
            <span>Academic Verification Command</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 6px 0', color: 'var(--text-primary, #0f172a)' }}>
            Student Certificate Verification & AI Skill Evidence
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary, #64748b)', maxWidth: '680px', lineHeight: 1.5 }}>
            Authenticate and validate external credentials uploaded by your enrolled students. Verified credentials directly feed into verified skill intelligence and close campus-wide industry skill gaps.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-secondary, #f1f5f9)', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveTab('queue')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'queue' ? 'var(--bg-card, #ffffff)' : 'transparent',
              color: activeTab === 'queue' ? 'var(--cyber-purple, #7c3aed)' : 'var(--text-secondary, #64748b)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'queue' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <ShieldCheck size={15} /> Verification Queue ({analytics.total})
          </button>
          <button
            onClick={() => setActiveTab('ai-gaps')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'ai-gaps' ? 'var(--bg-card, #ffffff)' : 'transparent',
              color: activeTab === 'ai-gaps' ? 'var(--cyber-cyan, #0284c7)' : 'var(--text-secondary, #64748b)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'ai-gaps' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Brain size={15} /> Campus AI Skill Gaps
          </button>
        </div>
      </div>

      {/* Real Database Analytics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-subtle, #e2e8f0)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>TOTAL</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary, #0f172a)', marginTop: '4px' }}>{analytics.total}</div>
        </div>

        <div style={{ background: 'rgba(234, 179, 8, 0.06)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>PENDING</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{analytics.pending}</div>
        </div>

        <div style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>UNDER REVIEW</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>{analytics.underReview}</div>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>VERIFIED</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>{analytics.verified}</div>
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase' }}>REJECTED</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{analytics.rejected}</div>
        </div>

        <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>CORRECTION</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{analytics.needsCorrection}</div>
        </div>
      </div>

      {/* ── TAB 1: CERTIFICATE VERIFICATION QUEUE ── */}
      {activeTab === 'queue' && (
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by student, certificate title, ID, or skill..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-cyber"
                style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input-cyber"
              style={{ padding: '9px 14px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Verification</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
              <option value="NEEDS_CORRECTION">Needs Correction</option>
            </select>

            <button
              onClick={loadData}
              className="btn-cyber-outline"
              style={{ padding: '9px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} /> Refresh
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <div>Loading campus certificate records...</div>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div style={{ padding: '64px 20px', textAlign: 'center' }}>
              <Award size={48} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary, #0f172a)' }}>
                No certificates in this view
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary, #64748b)', margin: 0 }}>
                {statusFilter !== 'ALL' || searchQuery ? 'No records match your search criteria.' : 'No certificates have been submitted for verification yet.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle, #e2e8f0)', background: 'var(--bg-secondary, #f8fafc)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Student</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Certificate</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Issuer</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Related Skills</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Format</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Submitted</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Status</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748b)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map(cert => (
                    <tr key={cert.id} style={{ borderBottom: '1px solid var(--border-subtle, #e2e8f0)', transition: 'background 0.15s' }}>
                      {/* Student Info */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>{cert.studentName || 'Student'}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', fontFamily: 'monospace' }}>{cert.studentId}</div>
                      </td>

                      {/* Certificate Title & Category */}
                      <td style={{ padding: '14px', maxWidth: '240px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>{cert.title}</div>
                        {cert.certificateNumber && (
                          <div style={{ fontSize: '11px', color: 'var(--cyber-cyan, #0284c7)', fontFamily: 'monospace' }}>
                            ID: {cert.certificateNumber}
                          </div>
                        )}
                        {cert.category && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                            {cert.category}
                          </div>
                        )}
                      </td>

                      {/* Issuer */}
                      <td style={{ padding: '14px', color: 'var(--text-secondary, #475569)' }}>
                        {cert.issuer || 'N/A'}
                      </td>

                      {/* Related Skills */}
                      <td style={{ padding: '14px', maxWidth: '180px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(cert.relatedSkills || []).map((sk, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: 'rgba(99, 102, 241, 0.08)',
                                color: 'var(--cyber-purple, #6366f1)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                fontWeight: 600
                              }}
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* File Format */}
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'var(--bg-secondary, #f1f5f9)',
                          color: 'var(--text-primary, #0f172a)',
                          textTransform: 'uppercase'
                        }}>
                          {cert.fileType || 'FILE'}
                        </span>
                      </td>

                      {/* Submitted Date */}
                      <td style={{ padding: '14px', fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
                        {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px' }}>
                        {cert.status === 'VERIFIED' && (
                          <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            VERIFIED
                          </span>
                        )}
                        {cert.status === 'PENDING' && (
                          <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '14px', background: 'rgba(234, 179, 8, 0.1)', color: '#b45309', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                            PENDING
                          </span>
                        )}
                        {cert.status === 'UNDER_REVIEW' && (
                          <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            UNDER REVIEW
                          </span>
                        )}
                        {cert.status === 'REJECTED' && (
                          <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            REJECTED
                          </span>
                        )}
                        {cert.status === 'NEEDS_CORRECTION' && (
                          <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            CORRECTION
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedCertForView(cert)}
                            className="btn-cyber-outline"
                            style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="View Certificate Document & Dossier"
                          >
                            <Eye size={13} /> View
                          </button>

                          {cert.status !== 'VERIFIED' && (
                            <button
                              onClick={() => setActionModal({ open: true, cert, action: 'VERIFY', reason: '', isSubmitting: false })}
                              className="btn-cyber-primary"
                              style={{ padding: '6px 10px', fontSize: '12px', background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Verify Certificate"
                            >
                              <Check size={13} /> Verify
                            </button>
                          )}

                          {cert.status !== 'REJECTED' && (
                            <button
                              onClick={() => setActionModal({ open: true, cert, action: 'REJECT', reason: '', isSubmitting: false })}
                              style={{
                                padding: '6px 10px',
                                fontSize: '12px',
                                background: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#dc2626',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Reject Certificate"
                            >
                              <X size={13} /> Reject
                            </button>
                          )}

                          {cert.status !== 'NEEDS_CORRECTION' && cert.status !== 'VERIFIED' && (
                            <button
                              onClick={() => setActionModal({ open: true, cert, action: 'NEEDS_CORRECTION', reason: '', isSubmitting: false })}
                              style={{
                                padding: '6px 10px',
                                fontSize: '12px',
                                background: 'transparent',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                color: '#b45309',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Request Student Correction"
                            >
                              <RotateCcw size={13} /> Correction
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: CAMPUS AI SKILL GAP INTELLIGENCE ── */}
      {activeTab === 'ai-gaps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Summary Card */}
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: 'var(--cyber-cyan, #0284c7)' }}>
              <Brain size={20} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                Campus-Wide Industry Skill Gap Analysis
              </h3>
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: 'var(--text-secondary, #64748b)', lineHeight: 1.5 }}>
              NEXUS AI aggregates active student skill evidence, verified certificates, and company demand from active Industry Opportunities to reveal institutional competency deficits.
            </p>

            {skillGapIntel?.topInstitutionSkillGaps && skillGapIntel.topInstitutionSkillGaps.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {skillGapIntel.topInstitutionSkillGaps.map((gap, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      borderRadius: '12px',
                      padding: '18px',
                      background: 'var(--bg-secondary, #f8fafc)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: gap.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: gap.priority === 'HIGH' ? '#dc2626' : '#d97706',
                          border: `1px solid ${gap.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}>
                          {gap.priority} PRIORITY GAP
                        </span>
                        <h4 style={{ margin: '8px 0 0 0', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                          {gap.skill}
                        </h4>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>{gap.studentsAffected}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>Students Affected</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary, #475569)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><strong>Industry Requirement:</strong> {gap.industryDemand}</div>
                      <div><strong>Current Campus Proof:</strong> {gap.currentEvidence}</div>
                    </div>

                    <div style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '12px',
                      color: 'var(--cyber-purple, #6d28d9)'
                    }}>
                      <strong>Recommended Academic Action:</strong> {gap.recommendedAction}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                No critical cohort skill gaps detected.
              </div>
            )}
          </div>
        </div>
      )}

      {/* In-App Certificate Viewer Modal */}
      {selectedCertForView && (
        <CertificateViewerModal
          certificate={selectedCertForView}
          onClose={() => setSelectedCertForView(null)}
        />
      )}

      {/* Verification / Rejection / Correction Action Modal */}
      {actionModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 15, 29, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            color: 'var(--text-primary, #0f172a)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 800 }}>
              {actionModal.action === 'VERIFY' && 'Confirm Certificate Verification'}
              {actionModal.action === 'REJECT' && 'Reject Certificate Submission'}
              {actionModal.action === 'NEEDS_CORRECTION' && 'Request Student Correction'}
            </h3>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary, #64748b)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              {actionModal.action === 'VERIFY' && (
                <>
                  Are you sure you want to verify <strong>"{actionModal.cert?.title}"</strong> for student <strong>{actionModal.cert?.studentName}</strong>?
                  <br />
                  This will generate verified credential evidence, elevate demonstrated skill proficiency, and recalculate AI skill gap readiness.
                </>
              )}
              {actionModal.action === 'REJECT' && (
                <>
                  Specify the reason why <strong>"{actionModal.cert?.title}"</strong> is being rejected. This explanation will be displayed to the student.
                </>
              )}
              {actionModal.action === 'NEEDS_CORRECTION' && (
                <>
                  Specify the correction required for <strong>"{actionModal.cert?.title}"</strong> (e.g. upload higher resolution document, provide valid credential ID).
                </>
              )}
            </p>

            {(actionModal.action === 'REJECT' || actionModal.action === 'NEEDS_CORRECTION') && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  Institutional Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={actionModal.action === 'REJECT' ? 'e.g. Certificate ID could not be validated on the issuer registry.' : 'e.g. Please provide the verifiable Credly badge URL or re-upload a clear copy.'}
                  value={actionModal.reason}
                  onChange={e => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="input-cyber"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', resize: 'vertical' }}
                  required
                />
              </div>
            )}

            {actionModal.action === 'VERIFY' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  Faculty Verification Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authenticated via official AWS certification registry"
                  value={actionModal.reason}
                  onChange={e => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="input-cyber"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setActionModal({ open: false, cert: null, action: null, reason: '', isSubmitting: false })}
                className="btn-cyber-outline"
                disabled={actionModal.isSubmitting}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleActionConfirm}
                className="btn-cyber-primary"
                disabled={actionModal.isSubmitting}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  background: actionModal.action === 'VERIFY' ? '#059669' : (actionModal.action === 'REJECT' ? '#dc2626' : '#d97706'),
                  borderColor: actionModal.action === 'VERIFY' ? '#059669' : (actionModal.action === 'REJECT' ? '#dc2626' : '#d97706')
                }}
              >
                {actionModal.isSubmitting ? 'Processing...' : (
                  actionModal.action === 'VERIFY' ? 'Confirm Verification' : (actionModal.action === 'REJECT' ? 'Confirm Rejection' : 'Dispatch Request')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
