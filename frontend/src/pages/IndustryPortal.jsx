import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';

export default function IndustryPortal({ setActivePage }) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [credentialId, setCredentialId] = useState('SW-884201');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!credentialId.trim()) return;

    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const res = await api.verifyCredential(credentialId.trim());
      if (res.valid && res.credential) {
        setVerificationResult(res.credential);
      } else {
        setError(res.message || 'No valid SkillWorth credential found with this ID.');
      }
    } catch (err) {
      setError('Network or server error during credential lookup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sw-page-container">
      {/* Industry Header */}
      <div className="sw-dashboard-header">
        <div className="sw-profile-card">
          <div className="sw-profile-avatar" style={{ backgroundColor: '#e6f4ea', color: '#137333' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>domain</span>
          </div>
          <div className="sw-profile-info">
            <div className="sw-profile-title-row">
              <h2>{user?.companyName || 'HexaCloud Technologies Global'}</h2>
              <span className="sw-role-badge sw-badge-green">Verified Hiring Partner</span>
            </div>
            <p className="sw-profile-sub">
              {user?.repDesignation || 'Head of Global University Talent'} ? {user?.repFullName || 'Karthik Narayanan'}
            </p>
            <div className="sw-profile-meta-tags">
              <span className="sw-meta-tag"><span className="material-symbols-outlined">location_on</span> {user?.city || 'Bengaluru'}, {user?.state || 'Karnataka'}</span>
              <span className="sw-meta-tag"><span className="material-symbols-outlined">category</span> {user?.industrySector || 'Enterprise Software & Cloud Platforms'}</span>
              <span className="sw-meta-tag"><span className="material-symbols-outlined">verified_user</span> Direct Accreditation Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Tool */}
      <div className="sw-grid-2col" style={{ gridTemplateColumns: '1.1fr 1fr' }}>
        <div className="sw-card">
          <div className="sw-card-header-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#1a73e8' }}>qr_code_scanner</span>
            <div>
              <h3 className="sw-card-title">Instant Credential Verification</h3>
              <p className="sw-card-sub">Lookup candidate credentials directly against the SkillWorth National Registry.</p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="sw-form" style={{ marginTop: '20px' }}>
            <div className="sw-form-group">
              <label>Enter SkillWorth Credential ID *</label>
              <div className="sw-verify-input-group">
                <input
                  type="text"
                  required
                  placeholder="e.g. SW-884201"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                  className="sw-input-code"
                />
                <button
                  type="submit"
                  className="sw-btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Credential'}
                </button>
              </div>
              <small className="sw-form-hint">
                Try pre-verified demo credential: <strong style={{ color: '#1a73e8', cursor: 'pointer' }} onClick={() => setCredentialId('SW-884201')}>SW-884201</strong>
              </small>
            </div>
          </form>

          {error && (
            <div className="sw-alert sw-alert-error" style={{ marginTop: '16px' }}>
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Verification Result Card */}
          {verificationResult && (
            <div className="sw-verification-badge-card">
              <div className="sw-vbadge-header">
                <div className="sw-vbadge-status">
                  <span className="material-symbols-outlined" style={{ color: '#137333', fontSize: '24px' }}>verified</span>
                  <div>
                    <h4 style={{ margin: 0, color: '#137333', fontSize: '18px' }}>AUTHENTIC & VALID</h4>
                    <span style={{ fontSize: '12px', color: '#5f6368' }}>ISO/IEC 17024 Compliant Certification</span>
                  </div>
                </div>
                <span className="sw-vbadge-id">{verificationResult.credentialId}</span>
              </div>

              <div className="sw-vbadge-grid">
                <div className="sw-vbadge-field">
                  <label>Verified Skill</label>
                  <div className="sw-vbadge-val">{verificationResult.skill}</div>
                </div>

                <div className="sw-vbadge-field">
                  <label>Competency Level</label>
                  <div className="sw-vbadge-val">{verificationResult.level}</div>
                </div>

                <div className="sw-vbadge-field">
                  <label>Accrediting Institution</label>
                  <div className="sw-vbadge-val">{verificationResult.institution}</div>
                </div>

                <div className="sw-vbadge-field">
                  <label>Authorized Assessor</label>
                  <div className="sw-vbadge-val">{verificationResult.verifiedBy}</div>
                </div>

                <div className="sw-vbadge-field">
                  <label>Assessment Status</label>
                  <div className="sw-vbadge-val" style={{ color: '#137333', fontWeight: 600 }}>
                    {verificationResult.assessment}
                  </div>
                </div>

                <div className="sw-vbadge-field">
                  <label>Verification Date</label>
                  <div className="sw-vbadge-val">{verificationResult.assessmentDate || '15/09/2026'}</div>
                </div>
              </div>

              <div className="sw-vbadge-privacy-note">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#5f6368' }}>security</span>
                <span>Learner personal PII (email, phone, address) is protected under SkillWorth privacy policies.</span>
              </div>
            </div>
          )}
        </div>

        {/* Talent Discovery & Hiring Overview */}
        <div className="sw-card">
          <h3 className="sw-card-title">Pre-Verified Technical Talent Pipeline</h3>
          <p className="sw-card-sub">Candidates accredited via standardized practical assessments & video demonstration review.</p>

          <div className="sw-candidate-talent-list">
            <div className="sw-talent-item">
              <div className="sw-talent-avatar">AK</div>
              <div className="sw-talent-info">
                <div className="sw-talent-top">
                  <h4>Arun Kumar</h4>
                  <span className="sw-badge-green">Credential: SW-884201</span>
                </div>
                <p>Python Software Engineering ? Intermediate</p>
                <div className="sw-talent-tags">
                  <span>AsyncIO</span>
                  <span>Token Bucket Rate Limiter</span>
                  <span>OOD</span>
                </div>
              </div>
            </div>

            <div className="sw-talent-item">
              <div className="sw-talent-avatar" style={{ backgroundColor: '#e8f0fe', color: '#1a73e8' }}>PR</div>
              <div className="sw-talent-info">
                <div className="sw-talent-top">
                  <h4>Priya Ramanathan</h4>
                  <span className="sw-badge-blue">Pending Assessor Sign-Off</span>
                </div>
                <p>Full Stack Web Development ? Intermediate</p>
                <div className="sw-talent-tags">
                  <span>React</span>
                  <span>Node.js</span>
                  <span>REST API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
