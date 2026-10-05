import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="sw-footer">
      <div className="sw-footer-content">
        <div className="sw-footer-brand">
          <div className="sw-brand" style={{ cursor: 'default' }}>
            <div className="sw-brand-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#1a73e8' }}>verified</span>
            </div>
            <span className="sw-brand-title">SkillWorth</span>
          </div>
          <p className="sw-footer-text">
            National AI-Assisted Recognition of Prior Learning & Competency Verification Platform.
            Accredited under ISO/IEC 17024 standards.
          </p>
        </div>

        <div className="sw-footer-badges">
          <div className="sw-compliance-badge">
            <span className="material-symbols-outlined" style={{ color: '#137333', fontSize: '16px' }}>gavel</span>
            <span>ISO/IEC 17024 Compliant</span>
          </div>
          <div className="sw-compliance-badge">
            <span className="material-symbols-outlined" style={{ color: '#1a73e8', fontSize: '16px' }}>verified_user</span>
            <span>Tamper-Proof Verification</span>
          </div>
        </div>
      </div>
      <div className="sw-footer-bottom">
        <span>? 2026 SkillWorth. All rights reserved. Completely Independent Standalone Architecture.</span>
      </div>
    </footer>
  );
}
