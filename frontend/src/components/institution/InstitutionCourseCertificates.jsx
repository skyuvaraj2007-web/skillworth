import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, Clock, ShieldCheck, Search, Filter, BookOpen, Building2, UserCheck, AlertCircle } from 'lucide-react';
import { academicService } from '../../services/academicService';

export default function InstitutionCourseCertificates({ onShowToast }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [notesModal, setNotesModal] = useState({ open: false, certId: null, action: null, text: '' });

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const res = await academicService.getCourseCertificates();
      if (res && res.success && Array.isArray(res.data)) {
        setCertificates(res.data);
      } else {
        setCertificates([]);
      }
    } catch (err) {
      console.error('Error fetching course certificates:', err);
      if (onShowToast) onShowToast({ title: 'Error', message: 'Failed to load course certificates.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const handleVerifyOrReject = async (certId, action, notes) => {
    setVerifyingId(certId);
    try {
      let res;
      if (action === 'VERIFIED') {
        res = await academicService.verifyCourseCertificate(certId, notes);
      } else {
        res = await academicService.rejectCourseCertificate(certId, notes);
      }

      if (res && res.success) {
        if (onShowToast) {
          onShowToast({
            title: action === 'VERIFIED' ? 'Certificate Verified' : 'Certificate Rejected',
            message: action === 'VERIFIED'
              ? 'Certificate verified by College. Full credentials auto-shared with offering company.'
              : 'Certificate verification rejected.',
            type: action === 'VERIFIED' ? 'success' : 'info'
          });
        }
        setNotesModal({ open: false, certId: null, action: null, text: '' });
        await loadCertificates();
      } else {
        if (onShowToast) onShowToast({ title: 'Operation Failed', message: res?.message || 'Failed to process certificate verification.', type: 'error' });
      }
    } catch (err) {
      console.error('Error verifying certificate:', err);
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredCerts = certificates.filter(c => {
    const statusMatch = filterStatus === 'ALL' || c.status === filterStatus;
    const query = searchQuery.toLowerCase();
    const searchMatch = !query ||
      (c.studentName || '').toLowerCase().includes(query) ||
      (c.studentId || '').toLowerCase().includes(query) ||
      (c.courseTitle || '').toLowerCase().includes(query) ||
      (c.companyName || '').toLowerCase().includes(query) ||
      (c.certificateId || '').toLowerCase().includes(query);
    return statusMatch && searchMatch;
  });

  const pendingCount = certificates.filter(c => c.status === 'PENDING_VERIFICATION').length;
  const verifiedCount = certificates.filter(c => c.status === 'VERIFIED').length;

  return (
    <div style={{ background: 'var(--cyber-card-bg, #0f172a)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '24px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyber-cyan, #00f2fe)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
            <ShieldCheck size={16} />
            <span>Academic Verification Authority</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: '4px 0 0 0' }}>College-Verified Course Certificates</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>
            Review completed company courses submitted by students. Verified certificates auto-share credentials with offering companies.
          </p>
        </div>

        {/* Counter Badges */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '10px 16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#eab308' }}>{pendingCount}</div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600' }}>Pending Verification</div>
          </div>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '10px 16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#22c55e' }}>{verifiedCount}</div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600' }}>College Verified</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search by student, course, company, or cert ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px'
            }}
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{
            padding: '10px 16px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px'
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING_VERIFICATION">Pending Verification ({pendingCount})</option>
          <option value="VERIFIED">Verified by College ({verifiedCount})</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Main Table */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading course completion certificates...</div>
      ) : filteredCerts.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
          <Award size={36} style={{ color: '#475569', marginBottom: '8px' }} />
          <div>No certificates found matching your query.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#64748b', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px' }}>Student</th>
                <th style={{ padding: '12px' }}>Course & Company</th>
                <th style={{ padding: '12px' }}>Completion Date</th>
                <th style={{ padding: '12px' }}>Grade / Score</th>
                <th style={{ padding: '12px' }}>Verification Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>College Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.map(cert => (
                <tr key={cert.certificateId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ fontWeight: '700', color: '#fff' }}>{cert.studentName}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {cert.studentId}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{cert.department || 'Computer Science'}</div>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--cyber-cyan, #00f2fe)' }}>{cert.courseTitle}</div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Building2 size={12} style={{ color: '#94a3b8' }} />
                      <span>{cert.companyName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px', color: '#cbd5e1' }}>
                    {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'Recent'}
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ padding: '4px 8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', color: '#60a5fa', fontWeight: '700', fontSize: '12px' }}>
                      {cert.grade || 'Completed (100%)'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    {cert.status === 'VERIFIED' ? (
                      <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '20px', color: '#4ade80', fontWeight: '700', fontSize: '11px' }}>
                          <CheckCircle2 size={13} />
                          <span>Verified by College</span>
                        </span>
                        {cert.verifiedAt && (
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                            {new Date(cert.verifiedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : cert.status === 'REJECTED' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '20px', color: '#f87171', fontWeight: '700', fontSize: '11px' }}>
                        <XCircle size={13} />
                        <span>Rejected</span>
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', borderRadius: '20px', color: '#facc15', fontWeight: '700', fontSize: '11px' }}>
                        <Clock size={13} />
                        <span>Pending Verification</span>
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                    {cert.status === 'PENDING_VERIFICATION' ? (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          disabled={verifyingId === cert.certificateId}
                          onClick={() => setNotesModal({ open: true, certId: cert.certificateId, action: 'VERIFIED', text: 'Verified by College Academic Board.' })}
                          style={{
                            padding: '6px 12px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <ShieldCheck size={13} />
                          <span>Verify & Share</span>
                        </button>
                        <button
                          disabled={verifyingId === cert.certificateId}
                          onClick={() => setNotesModal({ open: true, certId: cert.certificateId, action: 'REJECTED', text: '' })}
                          style={{
                            padding: '6px 10px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            color: '#f87171',
                            fontWeight: '600',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {cert.status === 'VERIFIED' ? 'Credentials Shared' : 'No Action Required'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes / Confirmation Modal */}
      {notesModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', padding: '24px', maxWidth: '460px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
              {notesModal.action === 'VERIFIED' ? 'Verify Certificate & Share Credentials' : 'Reject Certificate Verification'}
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              {notesModal.action === 'VERIFIED'
                ? 'By verifying this certificate, you confirm the student completed all course requirements. The full certificate credentials will be automatically released to the offering company.'
                : 'Please provide a reason for rejecting this certificate verification.'}
            </p>

            <textarea
              rows={3}
              placeholder="Add optional notes or verification rationale..."
              value={notesModal.text}
              onChange={e => setNotesModal({ ...notesModal, text: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                marginBottom: '20px'
              }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setNotesModal({ open: false, certId: null, action: null, text: '' })}
                style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={verifyingId === notesModal.certId}
                onClick={() => handleVerifyOrReject(notesModal.certId, notesModal.action, notesModal.text)}
                style={{
                  padding: '8px 16px',
                  background: notesModal.action === 'VERIFIED' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {verifyingId === notesModal.certId ? 'Processing...' : notesModal.action === 'VERIFIED' ? 'Confirm Verification' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
