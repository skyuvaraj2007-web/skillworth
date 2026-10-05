import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowLeft, Building2, Key, GraduationCap, Phone, Globe, User, ShieldCheck, CheckCircle2, X, Search, Sparkles, Plus, Trash2 } from 'lucide-react';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import OtpVerificationModal from '../components/auth/OtpVerificationModal';
import CyberSelect from '../components/CyberSelect';
import { authService } from '../services/authService';
import SihDemoLoginSection, { SihDemoLoginBanner } from '../components/auth/SihDemoAccessBar';
import LoginRoleTabs from '../components/auth/LoginRoleTabs';

export default function InstitutionLogin({ onLoginSuccess, onBackToRoles, onNavigateToOtp, onNavigateToForgot, prefillCredentials, onSelectRole, onShowToast }) {
  // Clear hardcoded credentials - require real authentication
  const [email, setEmail] = useState(() => prefillCredentials?.email || '');
  const [password, setPassword] = useState(() => prefillCredentials?.password || '');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (prefillCredentials?.email) {
      setEmail(prefillCredentials.email);
      setPassword(prefillCredentials.password || '');
    }
  }, [prefillCredentials]);

  // Modals
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // OTP Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpModalPurpose, setOtpModalPurpose] = useState('REGISTRATION');
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [activeDemoOtp, setActiveDemoOtp] = useState('');

  // Tamil Nadu Master College Data
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [masterQuery, setMasterQuery] = useState('');
  const [masterSearchResults, setMasterSearchResults] = useState([]);
  const [isSearchingMaster, setIsSearchingMaster] = useState(false);

  useEffect(() => {
    let isMounted = true;
    authService.getTamilNaduDistricts().then(d => {
      if (isMounted && Array.isArray(d)) setDistricts(d);
    });
    return () => { isMounted = false; };
  }, []);

  // Search Tamil Nadu engineering college master data
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSearchingMaster(true);
      try {
        const results = await authService.searchMasterColleges(masterQuery, selectedDistrict);
        setMasterSearchResults(results && results.length > 0 ? results : (masterQuery.trim() || selectedDistrict ? [] : await authService.searchMasterColleges('', '')));
      } catch (err) {
        setMasterSearchResults([]);
      } finally {
        setIsSearchingMaster(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [masterQuery, selectedDistrict]);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Academic Structure Configuration State
  const [academicStructure, setAcademicStructure] = useState([
    {
      department: 'Computer Science and Engineering',
      code: 'CSE',
      degrees: ['B.E.', 'B.Tech'],
      specializations: ['Computer Science and Engineering', 'Artificial Intelligence & Data Science', 'Cyber Security']
    },
    {
      department: 'Information Technology',
      code: 'IT',
      degrees: ['B.Tech'],
      specializations: ['Information Technology', 'Cloud Computing']
    },
    {
      department: 'Electronics and Communication Engineering',
      code: 'ECE',
      degrees: ['B.E.'],
      specializations: ['Electronics and Communication Engineering', 'VLSI Design', 'Embedded Systems']
    }
  ]);

  // Access request state
  const [reqStep, setReqStep] = useState(1);
  const [reqData, setReqData] = useState({
    institutionName: '',
    collegeId: '',
    aisheCode: '',
    affiliatedUniversity: '',
    institutionType: 'University',
    state: 'Tamil Nadu',
    district: '',
    campusAddress: '',
    website: '',
    officialEmail: '',
    institutionId: '',
    contactPerson: '',
    designation: 'Head of Placement & Corporate Relations',
    phone: '',
    password: '',
    confirmPassword: '',
    departments: '',
    programs: ''
  });
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await authService.login(email, password, 'institution');
      if (res.success && res.user) {
        setSuccessMsg('Signed in successfully.');
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 400);
      } else {
        setError(res.message || 'Invalid credentials. Please verify your official email and password.');
      }
    } catch (err) {
      setError(err.message || 'Authentication service unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessRequestSubmit = async (e) => {
    e.preventDefault();
    setReqError('');

    if (!reqData.collegeId && !reqData.institutionName) {
      setReqError('Please search and select your institution from the Tamil Nadu directory.');
      return;
    }
    if (!reqData.officialEmail || !reqData.password) {
      setReqError('Please complete all required fields (*).');
      return;
    }
    if (reqData.password !== reqData.confirmPassword) {
      setReqError('Passwords do not match.');
      return;
    }
    if (reqData.password.length < 6) {
      setReqError('Password must be at least 6 characters long.');
      return;
    }

    setReqLoading(true);
    const targetCollegeId = reqData.collegeId || reqData.institutionId || reqData.aisheCode || `TN-${Date.now().toString().slice(-4)}`;
    const targetCollegeName = reqData.institutionName || 'Tamil Nadu Engineering Institution';

    try {
      const res = await authService.register({
        email: reqData.officialEmail,
        password: reqData.password,
        role: 'institution',
        name: reqData.contactPerson || 'Institution Administrator',
        collegeName: targetCollegeName,
        institutionName: targetCollegeName,
        collegeCode: targetCollegeId,
        collegeId: targetCollegeId,
        institutionId: targetCollegeId,
        institutionCode: targetCollegeId,
        aisheCode: reqData.aisheCode || targetCollegeId,
        affiliatedUniversity: reqData.affiliatedUniversity || 'Anna University',
        institutionType: reqData.institutionType || 'Autonomous',
        designation: reqData.designation || 'Head of Placement & Corporate Relations',
        phone: reqData.phone,
        website: reqData.website,
        state: reqData.state || 'Tamil Nadu',
        district: reqData.district || 'Chennai',
        address: reqData.campusAddress || `${reqData.district || 'Chennai'}, Tamil Nadu`,
        academicStructure: academicStructure,
        departments: academicStructure.map(a => a.department),
        programs: Array.from(new Set(academicStructure.flatMap(a => a.degrees || [])))
      });

      if (!res.success) {
        setReqError(res.message || 'Failed to register institution account.');
        setReqLoading(false);
        return;
      }

      setReqLoading(false);
      setShowAccessModal(false);
      if (onNavigateToOtp) {
        onNavigateToOtp({
          email: reqData.officialEmail,
          role: 'institution',
          purpose: 'ACCOUNT_VERIFICATION',
          demoOtp: res.demoOtp || ''
        });
      } else {
        setOtpTargetEmail(reqData.officialEmail);
        setActiveDemoOtp(res.demoOtp || '');
        setOtpModalPurpose('REGISTRATION');
        setOtpModalOpen(true);
      }
    } catch (err) {
      console.error('Institution registration error:', err);
      setReqError(err.message || 'Network error registering institution.');
      setReqLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await authService.forgotPassword(forgotEmail, 'institution');
      if (res.success) {
        setShowForgotModal(false);
        if (onNavigateToOtp) {
          onNavigateToOtp({
            email: forgotEmail,
            role: 'institution',
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
        border: '1px solid rgba(139, 92, 246, 0.35)',
        background: 'var(--bg-card)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(139, 92, 246, 0.15)',
        maxWidth: '960px',
        width: '100%'
      }}>
        {/* Left Hero Panel */}
        <div style={{
          background: 'linear-gradient(180deg, #130C24 0%, #060913 100%)',
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
                background: 'var(--grad-purple-indigo)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 900, fontSize: '14px'
              }}>🎓</div>
              <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em' }}>
                SKILLNEXUS <span style={{ color: 'var(--cyber-purple)' }}>AI</span>
              </span>
              <span className="cyber-badge badge-purple" style={{ fontSize: '9px', padding: '2px 7px' }}>
                ACADEMIA
              </span>
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1.25, marginBottom: '14px', color: 'var(--text-primary)' }}>
              Empower Future Talent <br />
              <span style={{ color: 'var(--cyber-purple)' }}>With Skill Intelligence</span>
            </h1>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
              Transform institutional readiness with automated student competency graphs, cohort benchmark analytics, and direct corporate placement pipelines.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { title: 'Real-Time Cohort Analytics', desc: 'Track curriculum proficiency across department cohorts' },
                { title: 'Accreditation-Ready Verification', desc: 'Tamper-proof digital skill proofs for NBA & NAAC compliance' },
                { title: 'Automated Placement Engine', desc: 'Match students directly to vetted enterprise openings' }
              ].map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '12px 14px', borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)'
                }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '6px',
                    background: 'rgba(139, 92, 246, 0.2)', border: '1px solid var(--cyber-purple)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', color: 'var(--cyber-purple)', fontWeight: 800, flexShrink: 0, marginTop: '2px'
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
            <Building2 size={14} color="var(--cyber-purple)" />
            <span>AI Institutional Intelligence & Roster Governance</span>
          </div>
        </div>

        {/* Right Login Panel */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Welcome Back, Institution 👋
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Manage student talent and career readiness with SKILLNEXUS AI.
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
                padding: '10px 14px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.4)', color: 'var(--cyber-purple)', fontSize: '12.5px',
                marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <CheckCircle2 size={14} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Role Switcher Tabs */}
            <LoginRoleTabs activeRole="institution" onSelectRole={onSelectRole} />

            {/* SIH DEMO ACCESS QUICK FILL */}
            <SihDemoLoginBanner role="institution" onFill={(em, pw) => { setEmail(em); setPassword(pw); setError(''); }} />

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '11px', textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '6px'
                }}>
                  INSTITUTION EMAIL
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
                    placeholder="dean@university.edu.in"
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
                        setForgotSent(false);
                        setShowForgotModal(true);
                      }
                    }}
                    style={{ background: 'none', border: 'none', fontSize: '11.5px', color: 'var(--cyber-purple)', cursor: 'pointer', padding: 0 }}
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

              {/* Remember Me & Accreditation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--cyber-purple)', cursor: 'pointer', width: '15px', height: '15px' }}
                  />
                  <span>Remember me</span>
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
                  AISHE & NBA Verified
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-cyber-purple"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  marginTop: '6px',
                  fontWeight: 600,
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
              role="institution"
              onLoginSuccess={onLoginSuccess}
            />
          </div>

          {/* Account & Back Links */}
          <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              New institution?{' '}
              <button
                type="button"
                onClick={() => {
                  setReqError('');
                  setReqStep(1);
                  setShowAccessModal(true);
                }}
                style={{
                  background: 'none', border: 'none', color: 'var(--cyber-purple)',
                  cursor: 'pointer', fontWeight: 700, fontSize: '12.5px', padding: 0
                }}
              >
                Request Institution Access
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
            if (roleId === 'institution') {
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

      {/* Institution Access Request Modal */}
      {showAccessModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '680px', width: '100%', padding: '28px',
            borderRadius: '16px', border: '1px solid var(--cyber-purple)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(139, 92, 246, 0.25)',
            maxHeight: '92vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Register Educational Institution</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Step {reqStep} of 3: Connect your campus to the SkillNexus AI Network.</p>
              </div>
              <button
                onClick={() => setShowAccessModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Step Navigation Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '18px' }}>
              {[
                { step: 1, label: '1. Institution Info' },
                { step: 2, label: '2. Administrator' },
                { step: 3, label: '3. Academic Structure' }
              ].map(t => (
                <button
                  type="button"
                  key={t.step}
                  onClick={() => setReqStep(t.step)}
                  style={{
                    padding: '8px 4px',
                    fontSize: '11px',
                    fontWeight: reqStep === t.step ? 700 : 500,
                    borderRadius: '6px',
                    background: reqStep === t.step ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: reqStep === t.step ? '1px solid var(--cyber-purple)' : '1px solid var(--border-subtle)',
                    color: reqStep === t.step ? 'var(--cyber-purple)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {reqError && (
                  <div style={{
                    padding: '9px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '12px',
                    marginBottom: '14px'
                  }}>
                    {reqError}
                  </div>
                )}

                <form onSubmit={handleAccessRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* STEP 1: Institution Info (Authoritative Tamil Nadu Master Database) */}
                  {reqStep === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Tamil Nadu Master College Directory Search */}
                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyber-purple)', fontWeight: 700 }}>
                            TAMIL NADU ENGINEERING COLLEGE MASTER DATA *
                          </label>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            38 Districts Directory
                          </span>
                        </div>

                        {/* District Filter & Search Query */}
                        <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: '8px', marginBottom: '8px' }}>
                          <CyberSelect
                            value={selectedDistrict}
                            onChange={(val) => setSelectedDistrict(val)}
                            options={[
                              { value: '', label: 'All 38 Districts' },
                              ...districts.map(d => ({ value: d.name, label: d.name, count: d.collegesCount }))
                            ]}
                            placeholder="All 38 Districts"
                            searchPlaceholder="Search districts..."
                            searchable={true}
                          />

                          <div style={{ position: 'relative' }}>
                            <input
                              type="text"
                              placeholder="Search official college name or code (e.g. 2712, Kongu, CIT, Anna Univ)..."
                              value={masterQuery}
                              onChange={(e) => setMasterQuery(e.target.value)}
                              style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px' }}
                            />
                          </div>
                        </div>

                        {/* Search Results Dropdown */}
                        {masterSearchResults.length > 0 && (
                          <div style={{ maxHeight: '180px', overflowY: 'auto', background: '#0B1120', border: '1px solid var(--cyber-purple)', borderRadius: '8px', padding: '4px', marginBottom: '8px' }}>
                            {masterSearchResults.map((mc, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setReqData(prev => ({
                                    ...prev,
                                    institutionName: mc.collegeName,
                                    collegeId: mc.collegeCode,
                                    institutionId: mc.collegeCode,
                                    aisheCode: mc.collegeCode,
                                    affiliatedUniversity: mc.university,
                                    institutionType: mc.collegeType || 'Autonomous',
                                    district: mc.district,
                                    campusAddress: `${mc.city}, ${mc.district}, Tamil Nadu`
                                  }));
                                  setMasterSearchResults([]);
                                  setMasterQuery('');
                                }}
                                style={{ padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {mc.collegeName}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  <span style={{ color: 'var(--cyber-cyan)' }}>Code: {mc.collegeCode}</span>
                                  <span>•</span>
                                  <span>{mc.district}</span>
                                  <span>•</span>
                                  <span>{mc.university}</span>
                                  <span>•</span>
                                  <span>{mc.collegeType}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Selected College Verification Card */}
                        {reqData.institutionName ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', marginTop: '6px' }}>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle2 size={14} />
                                <span>{reqData.institutionName}</span>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                TNEA Code: {reqData.collegeId || reqData.institutionId} | District: {reqData.district || 'Tamil Nadu'} | {reqData.affiliatedUniversity || 'Anna University'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReqData(p => ({ ...p, institutionName: '', collegeId: '', institutionId: '' }))}
                              style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: '11px' }}
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                            Select or search your institution from the official 38 districts master directory.
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>INSTITUTION CODE / AISHE CODE *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. C-24981 / TN-ENG-010"
                            value={reqData.aisheCode || reqData.institutionId}
                            onChange={(e) => setReqData({ ...reqData, aisheCode: e.target.value, institutionId: reqData.institutionId || e.target.value })}
                            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>AFFILIATED UNIVERSITY</label>
                          <input
                            type="text"
                            placeholder="e.g. Anna University / Deemed"
                            value={reqData.affiliatedUniversity}
                            onChange={(e) => setReqData({ ...reqData, affiliatedUniversity: e.target.value })}
                            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>INSTITUTION TYPE</label>
                          <select
                            value={reqData.institutionType}
                            onChange={(e) => setReqData({ ...reqData, institutionType: e.target.value })}
                            style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                          >
                            <option value="University">University</option>
                            <option value="Autonomous College">Autonomous College</option>
                            <option value="Government Engineering College">Government Engineering College</option>
                            <option value="Private Engineering College">Private Engineering College</option>
                            <option value="Deemed University">Deemed University</option>
                            <option value="Polytechnic">Polytechnic</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>OFFICIAL INSTITUTIONAL EMAIL *</label>
                          <input
                            type="email"
                            required
                            placeholder="registrar@campus.edu.in"
                            value={reqData.officialEmail}
                            onChange={(e) => setReqData({ ...reqData, officialEmail: e.target.value })}
                            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>CAMPUS WEBSITE</label>
                          <input
                            type="url"
                            placeholder="https://campus.edu.in"
                            value={reqData.website}
                            onChange={(e) => setReqData({ ...reqData, website: e.target.value })}
                            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>DISTRICT / CITY</label>
                          <input
                            type="text"
                            placeholder="e.g. Chennai, Coimbatore, Madurai"
                            value={reqData.district}
                            onChange={(e) => setReqData({ ...reqData, district: e.target.value })}
                            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Administrator Information */}
                  {reqStep === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>ADMINISTRATOR / TPO NAME *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dr. K. Ramanathan"
                            value={reqData.contactPerson}
                            onChange={(e) => setReqData({ ...reqData, contactPerson: e.target.value })}
                            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>DESIGNATION *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Head of Placements / Dean"
                            value={reqData.designation}
                            onChange={(e) => setReqData({ ...reqData, designation: e.target.value })}
                            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>OFFICIAL MOBILE NUMBER *</label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={reqData.phone}
                          onChange={(e) => setReqData({ ...reqData, phone: e.target.value })}
                          style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>PASSWORD *</label>
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={reqData.password}
                            onChange={(e) => setReqData({ ...reqData, password: e.target.value })}
                            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>CONFIRM PASSWORD *</label>
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={reqData.confirmPassword}
                            onChange={(e) => setReqData({ ...reqData, confirmPassword: e.target.value })}
                            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Academic Structure Configuration */}
                  {reqStep === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyber-purple)', fontWeight: 700 }}>
                          ACADEMIC STRUCTURE & DEPARTMENTS CONFIGURATION
                        </label>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Populates student registration dropdowns
                        </span>
                      </div>

                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0' }}>
                        Configure the departments, degrees, and specializations offered at your campus. Enrolled students will select from these verified options during registration.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                        {academicStructure.map((struct, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                                {struct.department} ({struct.code})
                              </div>
                              <button
                                type="button"
                                onClick={() => setAcademicStructure(academicStructure.filter((_, i) => i !== idx))}
                                style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: '2px 4px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--cyber-cyan)' }}>
                              Degrees: {struct.degrees.join(', ')}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              Specializations: {struct.specializations.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add New Department Section */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <input
                          type="text"
                          id="newDeptInputInst"
                          placeholder="Add department (e.g. Artificial Intelligence & Data Science)..."
                          style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const inp = document.getElementById('newDeptInputInst');
                            if (inp && inp.value.trim()) {
                              const deptName = inp.value.trim();
                              const code = deptName.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase();
                              setAcademicStructure([...academicStructure, {
                                department: deptName,
                                code: code || 'ENG',
                                degrees: ['B.E.', 'B.Tech'],
                                specializations: [deptName, `${deptName} (Advanced)`]
                              }]);
                              inp.value = '';
                            }
                          }}
                          className="btn-cyber-purple"
                          style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Plus size={14} /> Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Navigation Controls */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    {reqStep > 1 ? (
                      <button
                        type="button"
                        onClick={() => setReqStep(reqStep - 1)}
                        className="btn-cyber-outline"
                        style={{ flex: 1, padding: '10px' }}
                      >
                        ← Previous
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAccessModal(false)}
                        className="btn-cyber-outline"
                        style={{ flex: 1, padding: '10px' }}
                      >
                        Cancel
                      </button>
                    )}

                    {reqStep < 3 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (reqStep === 1 && (!reqData.officialEmail || (!reqData.collegeId && !reqData.institutionName))) {
                            setReqError('Please select your institution and enter an official email (*).');
                            return;
                          }
                          if (reqStep === 2) {
                            if (!reqData.contactPerson || !reqData.phone || !reqData.password) {
                              setReqError('Please complete all required administrator fields (*).');
                              return;
                            }
                            if (reqData.password !== reqData.confirmPassword) {
                              setReqError('Passwords do not match.');
                              return;
                            }
                            if (reqData.password.length < 6) {
                              setReqError('Password must be at least 6 characters long.');
                              return;
                            }
                          }
                          setReqError('');
                          setReqStep(reqStep + 1);
                        }}
                        className="btn-cyber-purple"
                        style={{ flex: 2, padding: '10px', fontWeight: 600 }}
                      >
                        Next Step →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={reqLoading}
                        className="btn-cyber-purple"
                        style={{ flex: 2, padding: '10px', fontWeight: 600 }}
                      >
                        {reqLoading ? 'Registering...' : 'Register Institution Console'}
                      </button>
                    )}
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
            borderRadius: '16px', border: '1px solid var(--cyber-purple)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Institution Account Recovery</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {forgotSent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircle2 size={40} color="var(--cyber-purple)" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Reset Link Dispatched
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Institutional recovery instructions sent to <strong style={{ color: 'var(--cyber-purple)' }}>{forgotEmail}</strong>.
                </p>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="btn-cyber-purple"
                  style={{ width: '100%', padding: '10px' }}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Enter your official institution email to receive a secure Demo OTP for password recovery.
                </p>

                {forgotError && (
                  <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#FCA5A5', fontSize: '12px' }}>
                    {forgotError}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    OFFICIAL INSTITUTION EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="dean@university.edu.in"
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
                    className="btn-cyber-purple"
                    style={{ flex: 2, padding: '10px' }}
                  >
                    {forgotLoading ? 'Processing...' : 'Send Demo Reset OTP'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Demo OTP Verification & Password Reset Modal */}
      <OtpVerificationModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        email={otpTargetEmail}
        role="institution"
        initialOtp={activeDemoOtp}
        purpose={otpModalPurpose}
        onSuccess={(verifiedEmail) => {
          setEmail(verifiedEmail);
          setPassword('');
          if (reqData.institutionId || reqData.collegeId) {
            setInstitutionId(reqData.institutionId || reqData.collegeId);
          }
          setSuccessMsg(
            otpModalPurpose === 'REGISTRATION'
              ? 'Institution account verified successfully! Please sign in with your credentials.'
              : 'Password reset successfully! Please sign in with your new password.'
          );
        }}
      />
    </div>
  );
}
