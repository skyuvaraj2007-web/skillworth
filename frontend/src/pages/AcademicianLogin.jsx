import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  ArrowLeft,
  GraduationCap,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Key,
  User,
  Phone,
  Sparkles,
  Eye,
  EyeOff,
  BookOpen,
  Award
} from 'lucide-react';
import { authService } from '../services/authService';
import SihDemoLoginSection, { SihDemoLoginBanner } from '../components/auth/SihDemoAccessBar';
import LoginRoleTabs from '../components/auth/LoginRoleTabs';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';

export default function AcademicianLogin({ onLoginSuccess, onBackToRoles, onNavigateToOtp, onNavigateToForgot, prefillCredentials, onSelectRole, onShowToast }) {
  const [email, setEmail] = useState(() => prefillCredentials?.email || '');
  const [password, setPassword] = useState(() => prefillCredentials?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (prefillCredentials?.email) {
      setEmail(prefillCredentials.email);
      setPassword(prefillCredentials.password || '');
    }
  }, [prefillCredentials]);

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regData, setRegData] = useState({
    name: '',
    facultyId: '',
    email: '',
    password: '',
    designation: 'Associate Professor',
    department: 'Computer Science & Engineering',
    institutionId: '',
    phone: '',
    bio: ''
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Registered institutions for picker
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    let isMounted = true;
    authService.getRegisteredInstitutions().then(insts => {
      if (isMounted && Array.isArray(insts)) setInstitutions(insts);
    });
    return () => { isMounted = false; };
  }, []);

  const [rememberMe, setRememberMe] = useState(true);

  // Quick Demo Account Auto-Fill
  const handleQuickDemoFill = () => {
    setEmail('arun@example.com');
    setPassword('Arun@123');
    setError('');
  };

  // Handle Login Submit via dedicated academician endpoint
  const handleLogin = async (e) => {
    e?.preventDefault();
    if (loading) return;

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await authService.academicianLogin(email.trim(), password.trim(), rememberMe);

      if (!result.success) {
        setError(result.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Academician authentication verified. Initializing Academician Dashboard...');
      setTimeout(() => {
        onLoginSuccess(result.user);
      }, 300);
    } catch (err) {
      setError('Unable to login right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!regData.name || !regData.email || !regData.password) {
      setRegError('Please complete all required fields.');
      return;
    }

    setRegLoading(true);
    setRegError('');

    try {
      const res = await fetch('/api/auth/register/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regData.name,
          fullName: regData.name,
          email: regData.email,
          password: regData.password,
          facultyId: regData.facultyId || `FAC-${Date.now().toString().slice(-6)}`,
          designation: regData.designation,
          department: regData.department,
          institutionId: regData.institutionId || (institutions[0]?.id || 'VTI-73698'),
          phone: regData.phone,
          bio: regData.bio
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      setShowRegisterModal(false);
      setSuccessMsg('Faculty account created! Please sign in with your credentials.');
      setEmail(regData.email);
      setPassword(regData.password);
    } catch (err) {
      setRegError(err.message || 'Error creating account.');
    } finally {
      setRegLoading(false);
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
      boxSizing: 'border-box',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(99, 102, 241, 0.12) 0%, #070b14 70%)'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 460px) minmax(360px, 480px)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        background: 'var(--bg-card, #0B1120)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
        maxWidth: '960px',
        width: '100%'
      }}>
        {/* Left Hero Panel */}
        <div style={{
          background: 'linear-gradient(180deg, #1C1508 0%, #060913 100%)',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '7px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#070B14', fontWeight: 900, fontSize: '14px'
              }}>🎓</div>
              <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em' }}>
                SKILLNEXUS <span style={{ color: '#F59E0B' }}>AI</span>
              </span>
              <span style={{
                fontSize: '9px', padding: '2px 7px', borderRadius: '999px',
                background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#F59E0B', fontWeight: 800, letterSpacing: '0.05em'
              }}>
                ACADEMICIAN
              </span>
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1.25, marginBottom: '14px', color: 'var(--text-primary, #F8FAFC)' }}>
              Nurture Student Potential <br />
              <span style={{ color: '#F59E0B' }}>With Skill Intelligence</span>
            </h1>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary, #94A3B8)', lineHeight: 1.6, marginBottom: '32px' }}>
              Guide students through verified learning pathways, validate project competency, and track class cohort telemetry in real time.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { title: 'Real-Time Cohort Telemetry', desc: 'Track curriculum proficiency across department cohorts and classes' },
                { title: 'Competency Proof Verification', desc: 'Cryptographically endorse student milestone projects and achievements' },
                { title: 'Corporate Career Advisory', desc: 'Direct vetted top students into curated industry placement pipelines' }
              ].map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '12px 14px', borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)'
                }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '6px',
                    background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', color: '#F59E0B', fontWeight: 800, flexShrink: 0, marginTop: '2px'
                  }}>✓</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #F8FAFC)' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '11px', color: 'var(--text-dim, #64748B)', borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            paddingTop: '20px', marginTop: '30px'
          }}>
            <ShieldCheck size={14} color="#F59E0B" />
            <span>Verified Faculty Sovereign Node & Academic Credentials</span>
          </div>
        </div>

        {/* Right Login Panel */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary, #F8FAFC)', marginBottom: '6px' }}>
                Welcome Back, Academician 👋
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94A3B8)' }}>
                Mentor students and track cohort telemetry with SKILLNEXUS AI.
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
                padding: '10px 14px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)', color: '#F59E0B', fontSize: '12.5px',
                marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <CheckCircle2 size={14} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Role Switcher Tabs */}
            <LoginRoleTabs activeRole="academician" onSelectRole={onSelectRole} />

            {/* SIH DEMO ACCESS QUICK FILL */}
            <SihDemoLoginBanner role="academician" onFill={(em, pw) => { setEmail(em); setPassword(pw); setError(''); }} />

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '11px', textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary, #94A3B8)', marginBottom: '6px'
                }}>
                  INSTITUTIONAL EMAIL
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--bg-input, rgba(255, 255, 255, 0.04))', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                  borderRadius: '8px', padding: '9px 12px'
                }}>
                  <Mail size={15} color="var(--text-muted, #64748B)" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="professor@institution.edu.in"
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--text-primary, #F8FAFC)', fontSize: '13px', outline: 'none', width: '100%'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{
                    fontSize: '11px', textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary, #94A3B8)'
                  }}>
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToForgot) {
                        onNavigateToForgot('faculty');
                      } else {
                        setError('Please contact your institution admin to reset credentials.');
                      }
                    }}
                    style={{ background: 'none', border: 'none', fontSize: '11.5px', color: '#F59E0B', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--bg-input, rgba(255, 255, 255, 0.04))', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                  borderRadius: '8px', padding: '9px 12px'
                }}>
                  <Lock size={15} color="var(--text-muted, #64748B)" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--text-primary, #F8FAFC)', fontSize: '13px', outline: 'none', width: '100%'
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Node Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary, #94A3B8)', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#F59E0B', cursor: 'pointer', width: '15px', height: '15px' }}
                  />
                  <span>Remember me</span>
                </label>
                <span style={{
                  color: 'var(--text-muted, #64748B)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  Node: Verified Faculty
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  marginTop: '6px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#070B14',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)',
                  cursor: loading ? 'not-allowed' : 'pointer',
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
                color: 'var(--text-muted, #64748B)',
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
              role="faculty"
              onLoginSuccess={onLoginSuccess}
            />
          </div>

          {/* Account & Back Links */}
          <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary, #94A3B8)' }}>
              New academician or faculty member?{' '}
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                style={{
                  background: 'none', border: 'none', color: '#F59E0B',
                  cursor: 'pointer', fontWeight: 700, fontSize: '12.5px', padding: 0
                }}
              >
                Register Faculty Profile
              </button>
            </span>

            <button
              type="button"
              onClick={onBackToRoles}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted, #64748B)',
                fontSize: '12px', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary, #F8FAFC)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted, #64748B)'}
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
            if (roleId === 'academician' || roleId === 'faculty') {
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

      {/* Faculty Registration Modal */}
      {showRegisterModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            background: '#0f172a',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            padding: '28px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: '0 0 4px' }}>
                  Register Academician Profile
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  Create an institutional faculty account to mentor students.
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {regError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {regError}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regData.name}
                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                    placeholder="Dr. Rajesh Sharma"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>Faculty ID / Roll Code</label>
                  <input
                    type="text"
                    value={regData.facultyId}
                    onChange={(e) => setRegData({ ...regData, facultyId: e.target.value })}
                    placeholder="FAC-2026-042"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>Official Email *</label>
                  <input
                    type="email"
                    required
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    placeholder="rajesh@institution.edu.in"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>Password *</label>
                  <input
                    type="password"
                    required
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    placeholder="••••••••••••"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>Designation</label>
                  <select
                    value={regData.designation}
                    onChange={(e) => setRegData({ ...regData, designation: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Head of Department">Head of Department (HOD)</option>
                    <option value="Dean of Academics">Dean of Academics</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>Department</label>
                  <input
                    type="text"
                    value={regData.department}
                    onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                    placeholder="Computer Science & Engineering"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>Affiliated Institution</label>
                <select
                  value={regData.institutionId}
                  onChange={(e) => setRegData({ ...regData, institutionId: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '13px' }}
                >
                  {institutions.map(inst => (
                    <option key={inst.id || inst.code} value={inst.id || inst.code}>
                      {inst.name || inst.collegeName} ({inst.code || inst.collegeCode || 'TN'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#cbd5e1', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  style={{ background: '#6366f1', border: 'none', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: regLoading ? 'not-allowed' : 'pointer' }}
                >
                  {regLoading ? 'Registering...' : 'Register Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
