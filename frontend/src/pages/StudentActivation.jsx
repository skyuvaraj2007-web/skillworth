import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Building2, 
  User, 
  Mail, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { academicService } from '../services/academicService';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';

export default function StudentActivation() {
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token');

  const navigate = (path) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [error, setError] = useState(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setError('Missing invitation token. Please use the activation link sent to your college email.');
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    setVerifying(true);
    setError(null);
    try {
      const res = await academicService.verifyInvitation(token);
      if (res.success && res.valid) {
        setTokenValid(true);
        setStudentInfo(res.student);
      } else {
        setTokenValid(false);
        setError(res.message || 'Invalid or expired invitation token.');
      }
    } catch (err) {
      setTokenValid(false);
      setError(err.message || 'Failed to verify invitation token.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePasswordActivation = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setActivating(true);
    setError(null);
    try {
      const res = await academicService.activateAccount(token, password);
      if (res.success) {
        setActivationSuccess(true);
        if (res.token && res.user) {
          localStorage.setItem('nexus_token', res.token);
          localStorage.setItem('nexus_user', JSON.stringify(res.user));
          window.dispatchEvent(new Event('nexus_auth_changed'));
          setTimeout(() => {
            navigate('/student');
          }, 2000);
        }
      } else {
        setError(res.message || 'Activation failed.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setActivating(false);
    }
  };

  const handleGoogleSuccess = (authData) => {
    if (authData?.token && authData?.user) {
      localStorage.setItem('nexus_token', authData.token);
      localStorage.setItem('nexus_user', JSON.stringify(authData.user));
      window.dispatchEvent(new Event('nexus_auth_changed'));
      navigate('/student');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(6, 182, 212, 0.08), transparent 70%), #0B1120',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: 'var(--text-primary)'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '520px',
        background: 'var(--bg-card)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(6, 182, 212, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Brand Banner */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-subtle)',
          textAlign: 'center',
          background: 'rgba(6, 182, 212, 0.04)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(6, 182, 212, 0.12)',
            padding: '5px 12px',
            borderRadius: '20px',
            color: 'var(--cyber-cyan)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            marginBottom: '12px'
          }}>
            <ShieldCheck size={14} />
            <span>SOVEREIGN STUDENT ACTIVATION</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: '#FFFFFF' }}>
            Claim Your SKILL NEXUS Profile
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
            Connect to your institutional career ledger, skill verifications, and direct placements.
          </p>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px' }}>
          {verifying ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <RefreshCw className="spin" size={28} style={{ margin: '0 auto 12px' }} />
              <div>Verifying cryptographic invitation token...</div>
            </div>
          ) : error && !tokenValid ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--cyber-coral)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <AlertCircle size={28} />
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0', color: '#FFFFFF' }}>
                Invalid or Expired Invitation
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 24px 0' }}>
                {error}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-cyber-outline"
                style={{ padding: '8px 20px', fontSize: '12.5px' }}
              >
                Go to Sign In
              </button>
            </div>
          ) : activationSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--cyber-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#FFFFFF' }}>
                Account Successfully Activated!
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                Welcome to SKILL NEXUS, <strong>{studentInfo?.name}</strong>. Redirecting to your Student Portal...
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <RefreshCw className="spin" size={20} color="var(--cyber-cyan)" />
              </div>
            </div>
          ) : (
            <div>
              {/* Student Identity Card */}
              {studentInfo && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>
                    Verified Institutional Profile
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <User size={18} color="var(--cyber-cyan)" />
                    <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                      {studentInfo.name}
                    </span>
                    <span className="cyber-badge badge-blue" style={{ fontSize: '9.5px' }}>
                      {studentInfo.rollNumber}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>{studentInfo.departmentName} • Class of {studentInfo.graduationYear}</div>
                    <div style={{ color: 'var(--cyber-cyan)' }}>{studentInfo.institutionName}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{studentInfo.email}</div>
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  color: 'var(--cyber-coral)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {/* Activation Form */}
              <form onSubmit={handlePasswordActivation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    CREATE ACCOUNT PASSWORD *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="cyber-input"
                    placeholder="At least 6 characters"
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    CONFIRM PASSWORD *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="cyber-input"
                    placeholder="Re-enter password"
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={activating}
                  className="btn-cyber-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '13px', marginTop: '6px' }}
                >
                  {activating ? (
                    <>
                      <RefreshCw className="spin" size={15} />
                      <span>Activating Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Activate & Open Student Portal</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {/* Or Google Option */}
              <div style={{
                position: 'relative',
                textAlign: 'center',
                margin: '20px 0 16px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <span style={{
                  position: 'relative',
                  top: '-10px',
                  background: '#0F172A',
                  padding: '0 12px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}>
                  Or Activate with Single Sign-On
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleAuthButton
                  onSuccess={handleGoogleSuccess}
                  onError={(err) => setError(err.message || 'Google verification failed')}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
