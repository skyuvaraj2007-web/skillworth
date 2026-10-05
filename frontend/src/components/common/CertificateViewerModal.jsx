import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Award,
  CheckCircle,
  Building,
  Calendar,
  Tag,
  Eye,
  Maximize2
} from 'lucide-react';
import { certificateService } from '../../services/certificateService';

export default function CertificateViewerModal({ certificate, onClose, onDownload }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streamError, setStreamError] = useState(null);

  useEffect(() => {
    if (!certificate || !certificate.id) return;
    let isMounted = true;

    async function loadStream() {
      setLoading(true);
      setStreamError(null);
      try {
        const { blob, contentType } = await certificateService.fetchStreamBlob(certificate.id);
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err) {
        console.error('Failed to stream certificate:', err);
        if (isMounted) {
          setStreamError(err.message || 'Unable to load preview stream');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStream();

    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [certificate?.id]);

  if (!certificate) return null;

  const fileType = (certificate.fileType || certificate.fileName?.split('.').pop() || '').toLowerCase();
  const isPdf = fileType === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(fileType);
  const isOfficeDoc = ['doc', 'docx', 'ppt', 'pptx'].includes(fileType);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="cyber-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={13} /> VERIFIED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="cyber-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={13} /> UNDER REVIEW
          </span>
        );
      case 'REJECTED':
        return (
          <span className="cyber-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={13} /> REJECTED
          </span>
        );
      case 'NEEDS_CORRECTION':
        return (
          <span className="cyber-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={13} /> NEEDS CORRECTION
          </span>
        );
      default:
        return (
          <span className="cyber-badge" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={13} /> PENDING VERIFICATION
          </span>
        );
    }
  };

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload(certificate);
    } else {
      const downloadUrl = certificateService.getDownloadUrl(certificate.id);
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 15, 29, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '24px'
    }}>
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-subtle, rgba(226, 232, 240, 0.8))',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        color: 'var(--text-primary, #1e293b)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle, rgba(226, 232, 240, 0.8))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-secondary, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyber-purple, #8b5cf6)'
            }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  {certificate.title}
                </h3>
                {getStatusBadge(certificate.status)}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748b)', marginTop: '2px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span>Issuer: <strong>{certificate.issuer || 'Self-Reported'}</strong></span>
                {certificate.studentName && <span>Student: <strong>{certificate.studentName}</strong></span>}
                <span>Format: <strong>{fileType.toUpperCase()}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleDownloadClick}
              className="btn-cyber-outline"
              style={{ padding: '8px 14px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Download Certificate File"
            >
              <Download size={15} /> Download
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary, #64748b)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body: Two-Pane Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, minHeight: '480px', overflow: 'hidden' }}>
          {/* Left Pane: In-App Document Viewer */}
          <div style={{
            background: 'var(--bg-input, #0b1120)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            borderRight: '1px solid var(--border-subtle, rgba(226, 232, 240, 0.8))'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <div style={{
                  width: '36px', height: '36px', border: '3px solid rgba(99, 102, 241, 0.2)',
                  borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 12px'
                }} />
                <div style={{ fontSize: '13px' }}>Streaming Document from Secure Store...</div>
              </div>
            ) : streamError ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#ef4444' }}>
                <AlertTriangle size={36} style={{ margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600 }}>Unable to Preview File</div>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '6px 0 16px' }}>{streamError}</p>
                <button onClick={handleDownloadClick} className="btn-cyber-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                  <Download size={14} style={{ marginRight: '6px' }} /> Download File Directly
                </button>
              </div>
            ) : isPdf && blobUrl ? (
              <iframe
                src={`${blobUrl}#toolbar=0&navpanes=0`}
                title="Certificate PDF Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : isImage && blobUrl ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflow: 'auto' }}>
                <img
                  src={blobUrl}
                  alt={certificate.title}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                />
              </div>
            ) : isOfficeDoc ? (
              <div style={{ textAlign: 'center', padding: '40px 24px', color: '#fff', maxWidth: '420px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '16px',
                  background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  color: 'var(--cyber-cyan, #00f2fe)'
                }}>
                  <FileText size={32} />
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>
                  {fileType.toUpperCase()} Credential Document
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                  This presentation or document file is securely stored on SkillNexus servers. You can open and inspect it locally with full formatting.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={handleDownloadClick} className="btn-cyber-primary" style={{ padding: '9px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Download size={15} /> Open & Download
                  </button>
                  {certificate.credentialUrl && (
                    <a
                      href={certificate.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-cyber-outline"
                      style={{ padding: '9px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                    >
                      <ExternalLink size={15} /> Verify URL
                    </a>
                  )}
                </div>
              </div>
            ) : blobUrl ? (
              <iframe
                src={blobUrl}
                title="Document Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : null}
          </div>

          {/* Right Pane: Comprehensive Verification Dossier */}
          <div style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            background: 'var(--bg-card, #ffffff)'
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                CREDENTIAL METADATA
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Issuing Body:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>{certificate.issuer || 'N/A'}</span>
                </div>
                {certificate.certificateNumber && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary, #64748b)' }}>Certificate ID:</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--cyber-cyan, #0284c7)' }}>{certificate.certificateNumber}</span>
                  </div>
                )}
                {certificate.issueDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary, #64748b)' }}>Issue Date:</span>
                    <span style={{ fontWeight: 500 }}>{certificate.issueDate}</span>
                  </div>
                )}
                {certificate.category && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary, #64748b)' }}>Category:</span>
                    <span style={{ fontWeight: 500 }}>{certificate.category}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary, #64748b)' }}>Uploaded On:</span>
                  <span style={{ fontWeight: 500 }}>{certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle, #e2e8f0)', margin: 0 }} />

            {/* Related Skills Attestation */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                ASSOCIATED SKILL EVIDENCE
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {Array.isArray(certificate.relatedSkills) && certificate.relatedSkills.length > 0 ? (
                  certificate.relatedSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'rgba(99, 102, 241, 0.08)',
                        color: 'var(--cyber-purple, #6366f1)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Tag size={11} /> {sk}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748b)', fontStyle: 'italic' }}>
                    No specific skills mapped
                  </span>
                )}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle, #e2e8f0)', margin: 0 }} />

            {/* Verification Details */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                INSTITUTION REVIEW STATUS
              </div>
              <div style={{
                background: 'var(--bg-secondary, #f8fafc)',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid var(--border-subtle, #e2e8f0)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {getStatusBadge(certificate.status)}
                </div>
                {certificate.verifiedBy && (
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary, #475569)', marginTop: '6px' }}>
                    Verified By: <strong>{certificate.verifiedBy}</strong>
                  </div>
                )}
                {certificate.verifiedAt && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                    Verified on: {new Date(certificate.verifiedAt).toLocaleString()}
                  </div>
                )}
                {certificate.rejectionReason && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#dc2626',
                    fontSize: '12.5px'
                  }}>
                    <strong>Rejection Reason:</strong> {certificate.rejectionReason}
                  </div>
                )}
                {certificate.correctionReason && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    color: '#b45309',
                    fontSize: '12.5px'
                  }}>
                    <strong>Correction Required:</strong> {certificate.correctionReason}
                  </div>
                )}
              </div>
            </div>

            {certificate.credentialUrl && (
              <div>
                <a
                  href={certificate.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: 'var(--cyber-cyan, #0284c7)',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  <ExternalLink size={14} /> Open Online Credential URL
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
