import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Navbar({ activePage, setActivePage }) {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="sw-header">
      <div className="sw-nav-container">
        <div className="sw-brand" onClick={() => setActivePage('landing')}>
          <div className="sw-brand-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#1a73e8' }}>verified</span>
          </div>
          <div className="sw-brand-text">
            <span className="sw-brand-title">SkillWorth</span>
            <span className="sw-brand-sub">RPL Platform</span>
          </div>
        </div>

        <nav className="sw-nav-links">
          <button 
            className={`sw-nav-btn ${activePage === 'landing' ? 'active' : ''}`}
            onClick={() => setActivePage('landing')}
          >
            {t('navHome')}
          </button>

          {user && user.role === 'LEARNER' && (
            <button 
              className={`sw-nav-btn ${activePage === 'learner' ? 'active' : ''}`}
              onClick={() => setActivePage('learner')}
            >
              {t('learnerDashboard')}
            </button>
          )}

          {user && user.role === 'INSTITUTION' && (
            <button 
              className={`sw-nav-btn ${activePage === 'institution' ? 'active' : ''}`}
              onClick={() => setActivePage('institution')}
            >
              {t('institutionPortal')}
            </button>
          )}

          {user && user.role === 'INDUSTRY' && (
            <button 
              className={`sw-nav-btn ${activePage === 'industry' ? 'active' : ''}`}
              onClick={() => setActivePage('industry')}
            >
              {t('industryPortal')}
            </button>
          )}

          <button 
            className={`sw-nav-btn ${activePage === 'verify' ? 'active' : ''}`}
            onClick={() => setActivePage('verify')}
          >
            {t('verifyCredential')}
          </button>
        </nav>

        <div className="sw-nav-actions">
          {/* Language Switcher */}
          <div className="sw-lang-select-wrapper">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#5f6368' }}>translate</span>
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value)}
              className="sw-lang-dropdown"
              aria-label="Select Language"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>

          {user ? (
            <div className="sw-user-pill">
              <div className="sw-user-avatar">
                {(user.fullName || user.repFullName || user.companyName || user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="sw-user-meta">
                <span className="sw-user-name">{user.fullName || user.repFullName || user.companyName || user.email}</span>
                <span className="sw-role-tag">{user.role}</span>
              </div>
              <button 
                onClick={logout} 
                className="sw-logout-btn"
                title={t('logout')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
              </button>
            </div>
          ) : (
            <div className="sw-auth-btns">
              <button 
                className="sw-btn-text"
                onClick={() => setActivePage('login')}
              >
                {t('login')}
              </button>
              <button 
                className="sw-btn-primary"
                onClick={() => setActivePage('register')}
              >
                {t('register')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
