import React, { useState } from 'react';
import { Lock, Mail, ArrowLeft, Building, Key, ShieldCheck, CheckCircle2, Globe, Phone, User, X, AlertCircle } from 'lucide-react';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { authService } from '../services/authService';
import OtpVerificationModal from '../components/auth/OtpVerificationModal';
import SihDemoLoginSection, { SihDemoLoginBanner } from '../components/auth/SihDemoAccessBar';
import LoginRoleTabs from '../components/auth/LoginRoleTabs';

export default function IndustryLogin({ onLoginSuccess, onBackToRoles, onNavigateToOtp, onNavigateToForgot, prefillCredentials, onSelectRole, onShowToast }) {
  const [email, setEmail] = useState(() => prefillCredentials?.email || '');
  const [password, setPassword] = useState(() => prefillCredentials?.password || '');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  React.useEffect(() => {
    if (prefillCredentials?.email) {
      setEmail(prefillCredentials.email);
      setPassword(prefillCredentials.password || '');
    }
  }, [prefillCredentials]);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // OTP Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [activeDemoOtp, setActiveDemoOtp] = useState('');
  const [otpModalPurpose, setOtpModalPurpose] = useState('REGISTRATION'); // 'REGISTRATION' | 'PASSWORD_RESET'

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Enterprise Registration Form State
  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyId: '',
    sector: 'Technology & AI',
    companyType: 'Enterprise',
    businessEmail: '',
    website: '',
    contactPerson: '',
    designation: 'Head of Talent Acquisition',
    phone: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    companySize: '500-1000',
    hiringVolume: '50-100 hires/year',
    password: '',
    confirmPassword: ''
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await authService.login(email, password, 'company');
      if (res.success && res.user) {
        setSuccessMsg('Signed in successfully.');
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 400);
      } else {
        setError(res.message || 'Invalid enterprise credentials. Please check your corporate email and password.');
      }
    } catch (err) {
      setError(err.message || 'Authentication server unreachable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    if (!companyData.companyName || !companyData.businessEmail || !companyData.companyId || !companyData.password || !companyData.contactPerson) {
      setRegError('Please complete all required fields (*).');
      return;
    }

    // Business email domain check
    const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    const emailDomain = companyData.businessEmail.split('@')[1]?.toLowerCase();
    if (freeDomains.includes(emailDomain)) {
      setRegError('Please register with an official corporate domain email (e.g., name@company.com), not a personal webmail address.');
      return;
    }

    if (companyData.password !== companyData.confirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }
    if (companyData.password.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await authService.register({
        ...companyData,
        role: 'company',
        email: companyData.businessEmail,
        name: companyData.contactPerson,
        companyName: companyData.companyName,
        companyId: companyData.companyId,
        industry: companyData.sector,
        designation: companyData.designation
      });

      if (!res.success) {
        setRegError(res.message || 'Failed to register company account.');
        setRegLoading(false);
        return;
      }

      setRegLoading(false);
      setShowRegisterModal(false);
      if (onNavigateToOtp) {
        onNavigateToOtp({
          email: companyData.businessEmail,
          role: 'company',
          purpose: 'ACCOUNT_VERIFICATION',
          demoOtp: res.demoOtp || ''
        });
      } else {
        setOtpTargetEmail(companyData.businessEmail);
        setActiveDemoOtp(res.demoOtp || '');
        setOtpModalPurpose('REGISTRATION');
        setOtpModalOpen(true);
      }
    } catch (err) {
      setRegError('Network connection error during company registration.');
      setRegLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await authService.forgotPassword(forgotEmail, 'company');
      if (res.success) {
        setShowForgotModal(false);
        if (onNavigateToOtp) {
          onNavigateToOtp({
            email: forgotEmail,
            role: 'company',
            purpose: 'PASSWORD_RESET',
            demoOtp: res.demoOtp || ''
          });
        } else {
          setOtpTargetEmail(forgotEmail);
          setActiveDemoOtp(res.demoOtp || '');
          setOtpModalPurpose('PASSWORD_RESET');
          setOtpModalOpen(true);
        }
      } else {
        setForgotError(res.message || 'Account not found. Please create an account first.');
      }
    } catch (err) {
      setForgotError('Could not reach auth server.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '36px 16px 64px',
      position: 'relative',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 460px) minmax(360px, 480px)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        background: 'var(--bg-card)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(16, 185, 129, 0.15)',
        maxWidth: '960px',
        width: '100%'
      }}>
        {/* Left Hero Panel */}
        <div style={{
          background: 'linear-gradient(180deg, #071518 0%, #060913 100%)',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '7px',
                background: 'var(--grad-emerald-teal)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: '14px'
              }}>🏢</div>
              <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em' }}>
                SKILLNEXUS <span style={{ color: 'var(--cyber-emerald)' }}>AI</span>
              </span>
              <span className="cyber-badge badge-emerald" style={{ fontSize: '9px', padding: '2px 7px' }}>
                CORPORATE
              </span>
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1.25, marginBottom: '14px', color: 'var(--text-primary)' }}>
              Discover Future Talent <br />
              <span style={{ color: 'var(--cyber-emerald)' }}>Evidence-Backed & Verified</span>
            </h1>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
              Cut candidate screening overhead by 80%. Hire job-ready students pre-vetted via cryptographic skill proofs, live coding rubrics, and automated AI assessments.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { title: 'Zero-Bias Cryptographic Profiles', desc: 'Direct access to tamper-proof skill evidence & Git portfolios' },
                { title: 'AI Match Score Engine', desc: 'Calculate candidate readiness percentage against job requirements' },
                { title: 'Pre-Verified University Pipelines', desc: 'Direct access to top cohorts across premier engineering institutions' }
              ].map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '12px 14px', borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)'
                }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--cyber-emerald)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', color: 'var(--cyber-emerald)', fontWeight: 800, flexShrink: 0, marginTop: '2px'
                  }}>✓</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '11px', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)',
            paddingTop: '20px', marginTop: '30px'
          }}>
            <Building size={14} color="var(--cyber-emerald)" />
            <span>AI Verified Talent Sourcing & Enterprise Onboarding</span>
          </div>
        </div>

        {/* Right Login Panel */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Welcome Back, Industry 👋
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Discover future-ready talent with NEXUS AI.
              </p>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '12.5px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            {successMsg && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--cyber-emerald)', fontSize: '12.5px',
                marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <CheckCircle2 size={14} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Role Switcher Tabs */}
            <LoginRoleTabs activeRole="industry" onSelectRole={onSelectRole} />

            {/* SIH DEMO ACCESS QUICK FILL */}
            <SihDemoLoginBanner role="industry" onFill={(em, pw) => { setEmail(em); setPassword(pw); setError(''); }} />

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '11px', textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '6px'
                }}>
                  BUSINESS EMAIL
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                  borderRadius: '8px', padding: '9px 12px'
                }}>
                  <Mail size={15} color="var(--text-muted)" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="talent@techcorp.global"
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%'
                    }}
                    required
                  />
                </div>
              </div>



              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{
                    fontSize: '11px', textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)'
                  }}>
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToForgot) {
                        onNavigateToForgot();
                      } else {
                        setForgotEmail(email);
                        setForgotError('');
                        setShowForgotModal(true);
                      }
                    }}
                    style={{ background: 'none', border: 'none', fontSize: '11.5px', color: 'var(--cyber-emerald)', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                  borderRadius: '8px', padding: '9px 12px'
                }}>
                  <Lock size={15} color="var(--text-muted)" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%'
                    }}
                    required
                  />
                </div>
              </div>

              {/* Remember Me & SSO */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--cyber-emerald)', cursor: 'pointer', width: '15px', height: '15px' }}
                  />
                  <span>Remember me on this device</span>
                </label>
                <span style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  SSO & SAML 2.0
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-cyber-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  marginTop: '6px',
                  fontWeight: 600,
                  background: 'var(--cyber-emerald)',
                  color: '#060B14',
                  border: 'none',
                  boxShadow: 'var(--cyber-emerald-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>{loading ? 'Signing in...' : 'Sign In →'}</span>
              </button>
            </form>

            {/* Optional SSO Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px 0 16px',
              width: '100%'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle, rgba(255, 255, 255, 0.08))' }}></div>
              <span style={{
                fontSize: '10.5px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}>
                OR SIGN IN WITH
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle, rgba(255, 255, 255, 0.08))' }}></div>
            </div>

            <GoogleAuthButton
              role="company"
              onLoginSuccess={onLoginSuccess}
            />
          </div>

          {/* Account & Back Links */}
          <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              New to SKILLNEXUS AI?{' '}
              <button
                type="button"
                onClick={() => {
                  setRegError('');
                  setShowRegisterModal(true);
                }}
                style={{
                  background: 'none', border: 'none', color: 'var(--cyber-emerald)',
                  cursor: 'pointer', fontWeight: 700, fontSize: '12.5px', padding: 0
                }}
              >
                Register Your Company
              </button>
            </span>

            <button
              type="button"
              onClick={onBackToRoles}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: '12px', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <ArrowLeft size={14} />
              <span>Back to login selection</span>
            </button>
          </div>
        </div>
      </div>

      {/* SIH DEMO LOGIN 4-CARD SECTION */}
      <div style={{ width: '100%', maxWidth: '1080px', marginTop: '36px' }}>
        <SihDemoLoginSection
          onSelectDemo={(roleId, creds) => {
            if (roleId === 'industry' || roleId === 'company') {
              setEmail(creds.email);
              setPassword(creds.password);
              setError('');
              setSuccessMsg('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (onSelectRole) {
              onSelectRole(roleId, creds);
            }
          }}
          onShowToast={onShowToast}
        />
      </div>

      {/* Company Registration Modal */}
      {showRegisterModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '560px', width: '100%', padding: '28px',
            borderRadius: '16px', border: '1px solid var(--cyber-emerald)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(16, 185, 129, 0.25)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Register Company</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Access pre-verified graduate talent across top campuses.</p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {regError && (
              <div style={{
                padding: '9px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '12px',
                marginBottom: '14px'
              }}>
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. Company Information */}
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyber-emerald)', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  1. COMPANY INFORMATION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>COMPANY NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TechCorp Global Systems"
                      value={companyData.companyName}
                      onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>CIN / REGISTRATION NO.</label>
                    <input
                      type="text"
                      placeholder="e.g. U72200TN2016PTC104592"
                      value={companyData.cinNumber}
                      onChange={(e) => setCompanyData({ ...companyData, cinNumber: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>INDUSTRY / SECTOR *</label>
                    <select
                      value={companyData.sector}
                      onChange={(e) => setCompanyData({ ...companyData, sector: e.target.value })}
                      style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    >
                      <option value="IT & Software">IT & Software</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Automotive">Automotive</option>
                      <option value="EdTech">EdTech</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="Telecom">Telecom</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Government / PSU">Government / PSU</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>COMPANY TYPE</label>
                    <select
                      value={companyData.companyType}
                      onChange={(e) => setCompanyData({ ...companyData, companyType: e.target.value })}
                      style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    >
                      <option value="Startup">Startup</option>
                      <option value="SME">SME</option>
                      <option value="MNC">MNC</option>
                      <option value="Enterprise">Enterprise</option>
                      <option value="Government">Government</option>
                      <option value="Non-profit">Non-profit</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>COMPANY SIZE</label>
                    <select
                      value={companyData.companySize}
                      onChange={(e) => setCompanyData({ ...companyData, companySize: e.target.value })}
                      style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    >
                      <option value="1–10">1–10 Employees</option>
                      <option value="11–50">11–50 Employees</option>
                      <option value="51–200">51–200 Employees</option>
                      <option value="201–500">201–500 Employees</option>
                      <option value="501–1000">501–1000 Employees</option>
                      <option value="1000+">1000+ Employees</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>COMPANY WEBSITE</label>
                    <input
                      type="url"
                      placeholder="https://techcorp.global"
                      value={companyData.website}
                      onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Company Location */}
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyber-cyan)', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  2. COMPANY LOCATION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>STATE *</label>
                    <input
                      type="text"
                      readOnly
                      value="Tamil Nadu"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--cyber-cyan)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>CITY / DISTRICT *</label>
                    <select
                      value={companyData.city}
                      onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                      style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    >
                      <option value="Chennai">Chennai</option>
                      <option value="Coimbatore">Coimbatore</option>
                      <option value="Madurai">Madurai</option>
                      <option value="Tiruchirappalli">Tiruchirappalli</option>
                      <option value="Salem">Salem</option>
                      <option value="Kancheepuram">Kancheepuram</option>
                      <option value="Tirunelveli">Tirunelveli</option>
                      <option value="Bengaluru">Bengaluru</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>OFFICE LOCATION / ADDRESS</label>
                    <input
                      type="text"
                      placeholder="e.g. OMR IT Corridor, Sholinganallur"
                      value={companyData.officeLocation}
                      onChange={(e) => setCompanyData({ ...companyData, officeLocation: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>PIN CODE</label>
                    <input
                      type="text"
                      placeholder="600096"
                      value={companyData.pinCode}
                      onChange={(e) => setCompanyData({ ...companyData, pinCode: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Recruiter / Authorized Person */}
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyber-purple)', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  3. RECRUITER / AUTHORIZED PERSON
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>RECRUITER NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={companyData.contactPerson}
                      onChange={(e) => setCompanyData({ ...companyData, contactPerson: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>DESIGNATION *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Head of Talent Acquisition"
                      value={companyData.designation}
                      onChange={(e) => setCompanyData({ ...companyData, designation: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>OFFICIAL COMPANY EMAIL *</label>
                    <input
                      type="email"
                      required
                      placeholder="talent@techcorp.global"
                      value={companyData.businessEmail}
                      onChange={(e) => setCompanyData({ ...companyData, businessEmail: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Corporate domain required</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>OFFICIAL PHONE NUMBER *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 44 4891 0291"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>LINKEDIN PROFILE (OPTIONAL)</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/recruiter-profile"
                    value={companyData.linkedin}
                    onChange={(e) => setCompanyData({ ...companyData, linkedin: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* 4. Login & Security */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyber-amber)', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  4. LOGIN & SECURITY
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>USERNAME / COMPANY ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TECHCORP-GLOBAL-CORP"
                    value={companyData.companyId}
                    onChange={(e) => setCompanyData({ ...companyData, companyId: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>PASSWORD *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={companyData.password}
                      onChange={(e) => setCompanyData({ ...companyData, password: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>CONFIRM PASSWORD *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={companyData.confirmPassword}
                      onChange={(e) => setCompanyData({ ...companyData, confirmPassword: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="otpVerifiedCheck"
                      defaultChecked
                      style={{ transform: 'scale(1.1)', accentColor: 'var(--cyber-emerald)', cursor: 'pointer' }}
                    />
                    <label htmlFor="otpVerifiedCheck" style={{ fontSize: '11.5px', color: 'var(--cyber-emerald)', cursor: 'pointer', fontWeight: 600 }}>
                      OTP Verified via Domain Email ✓
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="enable2FACheck"
                      checked={companyData.enable2FA || false}
                      onChange={(e) => setCompanyData({ ...companyData, enable2FA: e.target.checked })}
                      style={{ transform: 'scale(1.1)', accentColor: 'var(--cyber-cyan)', cursor: 'pointer' }}
                    />
                    <label htmlFor="enable2FACheck" style={{ fontSize: '11.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      Enable 2FA (Authenticator App)
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="btn-cyber-outline"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="btn-cyber-primary"
                  style={{
                    flex: 2, padding: '10px', fontWeight: 600,
                    background: 'var(--cyber-emerald)', color: '#060B14', border: 'none'
                  }}
                >
                  {regLoading ? 'Registering...' : 'Register Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '440px', width: '100%', padding: '28px',
            borderRadius: '16px', border: '1px solid var(--cyber-emerald)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Company Account Recovery</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {forgotError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--cyber-crimson)',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '14px',
                color: 'var(--cyber-crimson)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <AlertCircle size={14} />
                <span>{forgotError}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Enter your verified business email address. A demo 6-digit verification code will be generated to reset your password.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  BUSINESS EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="talent@techcorp.global"
                  style={{
                    width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                    borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="btn-cyber-outline"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn-cyber-primary"
                  style={{ flex: 2, padding: '10px', background: 'var(--cyber-emerald)', color: '#060B14', border: 'none' }}
                >
                  {forgotLoading ? 'Processing...' : 'Send Demo Reset OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Demo OTP Verification & Password Reset Modal */}
      <OtpVerificationModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        email={otpTargetEmail}
        role="company"
        initialOtp={activeDemoOtp}
        purpose={otpModalPurpose}
        onSuccess={(verifiedEmail) => {
          setEmail(verifiedEmail);
          setPassword('');
          setSuccessMsg(
            otpModalPurpose === 'REGISTRATION'
              ? 'Corporate account verified successfully! Please sign in with your credentials.'
              : 'Password reset successfully! Please sign in with your new password.'
          );
        }}
      />
    </div>
  );
}
