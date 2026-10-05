import React, { useState } from 'react';
import { KeyRound, Mail, ArrowLeft, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { authService } from '../services/authService';

export default function ForgotPasswordPage({ role = 'student', onNavigate, onOtpSent }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getTargetLoginPage = () => {
    const norm = String(role).toLowerCase();
    if (norm === 'institution') return 'institution-login';
    if (norm === 'company' || norm === 'industry') return 'industry-login';
    return 'student-login';
  };

  const roleLabel = String(role).toLowerCase() === 'institution'
    ? 'INSTITUTION ACCOUNT'
    : String(role).toLowerCase() === 'company' || String(role).toLowerCase() === 'industry'
      ? 'INDUSTRY ACCOUNT'
      : 'STUDENT ACCOUNT';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authService.forgotPassword(email.trim(), role);

      if (!res.success) {
        setErrorMsg(res.message || 'Account not found. Please verify your email.');
        setLoading(false);
        return;
      }

      setLoading(false);

      if (onOtpSent) {
        onOtpSent({
          email: email.trim(),
          role,
          purpose: 'PASSWORD_RESET',
          demoOtp: res.demoOtp || ''
        });
      } else if (onNavigate) {
        onNavigate('verify-otp', {
          email: email.trim(),
          role,
          purpose: 'PASSWORD_RESET',
          demoOtp: res.demoOtp || ''
        });
      }
    } catch (err) {
      setErrorMsg('Network error connecting to authentication server.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: '24px 16px',
      overflow: 'hidden'
    }}>
      {/* Aurora Glow Gradient Blobs */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '25%',
        width: '360px',
        height: '360px',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.16) 0%, rgba(59, 130, 246, 0.08) 60%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '25%',
        width: '380px',
        height: '380px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.14) 0%, rgba(236, 72, 153, 0.08) 60%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Glassmorphic Container Card */}
      <div 
        className="glass-card"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '460px',
          width: '100%',
          padding: '36px 32px',
          borderRadius: '24px',
          background: 'var(--bg-card, rgba(255, 255, 255, 0.85))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-subtle, rgba(124, 58, 237, 0.18))',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), 0 0 30px rgba(124, 58, 237, 0.10)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        {/* Top Key Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
          border: '2px solid rgba(124, 58, 237, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 0 25px rgba(124, 58, 237, 0.25)'
        }}>
          <KeyRound size={32} color="#7C3AED" />
        </div>

        {/* Role Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '999px',
          background: 'rgba(124, 58, 237, 0.08)',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          color: 'var(--brand-primary, #7C3AED)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono, monospace)',
          fontWeight: 700,
          letterSpacing: '0.08em',
          marginBottom: '10px'
        }}>
          <Sparkles size={12} />
          <span>{roleLabel}</span>
        </div>

        {/* Heading & Subtitle */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: 800,
          color: 'var(--text-heading, #1E1B4B)',
          marginBottom: '8px',
          letterSpacing: '-0.02em'
        }}>
          Forgot Password
        </h1>

        <p style={{
          fontSize: '13.5px',
          color: 'var(--text-secondary, #4B5563)',
          lineHeight: 1.5,
          maxWidth: '360px',
          marginBottom: '24px'
        }}>
          Enter your registered email to receive a secure Demo OTP for password recovery.
        </p>

        {errorMsg && (
          <div style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#DC2626',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', textAlign: 'left' }}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--text-secondary, #4B5563)',
              marginBottom: '6px'
            }}>
              REGISTERED EMAIL ADDRESS *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                placeholder="e.g. name@campus.edu or company@corp.com"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  borderRadius: '10px',
                  background: 'var(--bg-input, rgba(255, 255, 255, 0.8))',
                  border: '1.5px solid var(--border-subtle, rgba(124, 58, 237, 0.2))',
                  color: 'var(--text-primary, #0F172A)',
                  fontSize: '13.5px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
              <Mail 
                size={16} 
                color="var(--text-muted, #9CA3AF)" 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Generating Demo OTP...</span>
              </>
            ) : (
              <span>Send Demo OTP →</span>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate(getTargetLoginPage())}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #9CA3AF)',
            fontSize: '12px',
            cursor: 'pointer',
            marginTop: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ArrowLeft size={13} />
          <span>Back to login</span>
        </button>
      </div>
    </div>
  );
}
