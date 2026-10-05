import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function LoginPage({ setActivePage }) {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [role, setRole] = useState('LEARNER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoFill = (demoRole) => {
    setRole(demoRole);
    if (demoRole === 'LEARNER') {
      setEmail('learner.demo@skillworth.org');
      setPassword('SkillWorth@2026');
    } else if (demoRole === 'INSTITUTION') {
      setEmail('assessor.demo@skillworth.org');
      setPassword('SkillWorth@2026');
    } else if (demoRole === 'INDUSTRY') {
      setEmail('industry.demo@skillworth.org');
      setPassword('SkillWorth@2026');
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password, role);
      if (res.success) {
        if (res.user.role === 'LEARNER') setActivePage('learner');
        else if (res.user.role === 'INSTITUTION') setActivePage('institution');
        else if (res.user.role === 'INDUSTRY') setActivePage('industry');
        else setActivePage('landing');
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Network or server error during sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sw-page-container">
      <div className="sw-auth-card">
        <div className="sw-auth-header">
          <div className="sw-brand-icon" style={{ margin: '0 auto 12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#1a73e8' }}>lock</span>
          </div>
          <h2 className="sw-auth-title">{t('loginTitle')}</h2>
          <p className="sw-auth-subtitle">Access your SkillWorth RPL dashboard and records.</p>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="sw-demo-bar">
          <div className="sw-demo-title">
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#1a73e8' }}>bolt</span>
            <span>Quick Demo Logins:</span>
          </div>
          <div className="sw-demo-btns">
            <button
              type="button"
              className={`sw-demo-btn ${role === 'LEARNER' ? 'active' : ''}`}
              onClick={() => handleDemoFill('LEARNER')}
            >
              Learner
            </button>
            <button
              type="button"
              className={`sw-demo-btn ${role === 'INSTITUTION' ? 'active' : ''}`}
              onClick={() => handleDemoFill('INSTITUTION')}
            >
              Assessor / Inst
            </button>
            <button
              type="button"
              className={`sw-demo-btn ${role === 'INDUSTRY' ? 'active' : ''}`}
              onClick={() => handleDemoFill('INDUSTRY')}
            >
              Industry
            </button>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="sw-role-selector">
          <button
            type="button"
            className={`sw-role-tab ${role === 'LEARNER' ? 'active' : ''}`}
            onClick={() => { setRole('LEARNER'); setError(''); }}
          >
            <span className="material-symbols-outlined">school</span>
            <span>Learner</span>
          </button>
          <button
            type="button"
            className={`sw-role-tab ${role === 'INSTITUTION' ? 'active' : ''}`}
            onClick={() => { setRole('INSTITUTION'); setError(''); }}
          >
            <span className="material-symbols-outlined">account_balance</span>
            <span>Institution</span>
          </button>
          <button
            type="button"
            className={`sw-role-tab ${role === 'INDUSTRY' ? 'active' : ''}`}
            onClick={() => { setRole('INDUSTRY'); setError(''); }}
          >
            <span className="material-symbols-outlined">domain</span>
            <span>Industry</span>
          </button>
        </div>

        {error && <div className="sw-alert sw-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="sw-form">
          <div className="sw-form-group">
            <label>{t('email')} *</label>
            <input
              type="email"
              required
              placeholder="e.g. user@skillworth.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="sw-form-group">
            <label>{t('password')} *</label>
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="sw-btn-primary sw-btn-lg sw-btn-block"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : t('login')}
          </button>
        </form>

        <div className="sw-auth-footer">
          <span>Don't have an account? </span>
          <button className="sw-btn-link" onClick={() => setActivePage('register')}>
            Create SkillWorth Account
          </button>
        </div>
      </div>
    </div>
  );
}
