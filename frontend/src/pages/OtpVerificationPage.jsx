import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { authService } from '../services/authService';

export default function OtpVerificationPage({
  email = '',
  role = 'student',
  purpose = 'ACCOUNT_VERIFICATION',
  initialOtp = '',
  onNavigate
}) {
  // Purpose normalization
  const isReset = purpose === 'PASSWORD_RESET' || purpose === 'FORGOT_PASSWORD';
  const effectivePurpose = isReset ? 'PASSWORD_RESET' : 'ACCOUNT_VERIFICATION';
  const isDev = Boolean(import.meta.env.DEV || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')));

  // State
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resolvedEmail, setResolvedEmail] = useState(() => {
    if (email) return email;
    try {
      const saved = sessionStorage.getItem('nexus_otp_params');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.email) return p.email;
      }
    } catch {}
    return '';
  });
  const [demoOtp, setDemoOtp] = useState(() => {
    if (initialOtp) return initialOtp;
    try {
      const saved = sessionStorage.getItem('nexus_otp_params');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.demoOtp) return p.demoOtp;
      }
    } catch {}
    return '';
  });
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Flow Progression State: 'VERIFY' | 'ACCOUNT_VERIFIED' | 'NEW_PASSWORD' | 'PASSWORD_RESET_SUCCESS'
  const [flowState, setFlowState] = useState('VERIFY');

  // New Password State (for password reset step)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Input Box Refs
  const inputRefs = useRef([]);

  // Auto-fetch demo OTP if missing on load
  useEffect(() => {
    const targetEmail = email || resolvedEmail;
    if (!demoOtp && targetEmail) {
      authService.resendOtp(targetEmail, effectivePurpose).then(res => {
        if (res?.demoOtp) {
          setDemoOtp(res.demoOtp);
          try {
            const saved = sessionStorage.getItem('nexus_otp_params');
            const p = saved ? JSON.parse(saved) : {};
            p.demoOtp = res.demoOtp;
            sessionStorage.setItem('nexus_otp_params', JSON.stringify(p));
          } catch {}
        }
      }).catch(() => {});
    }
  }, [demoOtp, email, resolvedEmail, effectivePurpose]);

  // 60-second Countdown Timer
  useEffect(() => {
    if (flowState !== 'VERIFY') return;
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, flowState]);

  // Focus the first empty input box on mount
  useEffect(() => {
    if (flowState === 'VERIFY' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [flowState]);

  // Handle single digit changes
  const handleDigitChange = (index, value) => {
    // Only accept numeric characters
    const clean = value.replace(/[^0-9]/g, '');
    if (!clean) {
      const updated = [...digits];
      updated[index] = '';
      setDigits(updated);
      return;
    }

    const digit = clean.slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);
    setErrorMsg('');

    // Advance to next box if available
    if (digit && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle Backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle Paste event across all 6 boxes
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (!pasteData) return;

    const chars = pasteData.slice(0, 6).split('');
    const updated = [...digits];
    chars.forEach((c, idx) => {
      if (idx < 6) updated[idx] = c;
    });
    setDigits(updated);
    setErrorMsg('');

    // Focus last filled box or 6th box
    const nextIdx = Math.min(chars.length, 5);
    if (inputRefs.current[nextIdx]) {
      inputRefs.current[nextIdx].focus();
    }
  };

  // Auto-fill Demo OTP helper
  const handleAutoFillDemo = () => {
    if (!demoOtp) return;
    const chars = String(demoOtp).replace(/[^0-9]/g, '').slice(0, 6).split('');
    const updated = [...digits];
    chars.forEach((c, idx) => {
      if (idx < 6) updated[idx] = c;
    });
    setDigits(updated);
    setErrorMsg('');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const res = await authService.resendOtp(email, effectivePurpose);
      if (res.success && res.demoOtp) {
        setDemoOtp(res.demoOtp);
        setTimeLeft(60);
        setIsExpired(false);
        setDigits(['', '', '', '', '', '']);
        setStatusMsg('New OTP generated successfully.');
        setTimeout(() => setStatusMsg(''), 4000);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      } else {
        setErrorMsg(res.message || 'Failed to resend OTP. Please try again.');
      }
    } catch {
      setErrorMsg('Could not connect to authentication server.');
    } finally {
      setResending(false);
    }
  };

  // Trigger celebration confetti
  const triggerCelebration = () => {
    try {
      const count = 200;
      const defaults = { origin: { y: 0.7 } };
      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    } catch (e) {
      console.warn('Confetti effect error:', e);
    }
  };

  // Submit OTP Verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = digits.join('');

    if (enteredOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    if (isExpired) {
      setErrorMsg('Your OTP has expired. Please click Resend OTP to request a new code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authService.verifyOtp(email, enteredOtp, effectivePurpose);

      if (!res.success) {
        setErrorMsg(res.message || 'Incorrect OTP. Please check the code and try again.');
        setLoading(false);
        return;
      }

      setLoading(false);

      if (isReset) {
        // Password Reset flow moves to the Create New Password form
        setFlowState('NEW_PASSWORD');
      } else {
        // Account Verification celebration
        setFlowState('ACCOUNT_VERIFIED');
        triggerCelebration();
      }
    } catch (err) {
      setErrorMsg('Network error connecting to verification server.');
      setLoading(false);
    }
  };

  // Submit New Password after Reset OTP verification
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setPasswordLoading(true);
    setErrorMsg('');

    try {
      const enteredOtp = digits.join('') || demoOtp;
      const res = await authService.resetPassword(email, enteredOtp, newPassword);

      if (!res.success) {
        setErrorMsg(res.message || 'Failed to update password. Please try again.');
        setPasswordLoading(false);
        return;
      }

      setPasswordLoading(false);
      setFlowState('PASSWORD_RESET_SUCCESS');
      triggerCelebration();
    } catch (err) {
      setErrorMsg('Network error resetting password. Please try again.');
      setPasswordLoading(false);
    }
  };

  // Target login page determination
  const getTargetLoginPage = () => {
    const norm = String(role).toLowerCase();
    if (norm === 'institution') return 'institution-login';
    if (norm === 'company' || norm === 'industry') return 'industry-login';
    return 'student-login';
  };

  const roleLabel = isReset
    ? 'PASSWORD RESET'
    : String(role).toLowerCase() === 'institution'
      ? 'INSTITUTION ACCOUNT'
      : String(role).toLowerCase() === 'company' || String(role).toLowerCase() === 'industry'
        ? 'INDUSTRY ACCOUNT'
        : 'STUDENT ACCOUNT';

  // Render timer formatted as MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: '24px 16px',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      {/* Aurora Glow Gradient Blobs */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '20%',
        width: '380px',
        height: '380px',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '20%',
        width: '420px',
        height: '420px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.16) 0%, rgba(236, 72, 153, 0.09) 50%, transparent 70%)',
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
          margin: '0 auto',
          padding: '36px 28px',
          borderRadius: '24px',
          background: 'var(--bg-card, rgba(255, 255, 255, 0.85))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-subtle, rgba(124, 58, 237, 0.18))',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08), 0 0 30px rgba(124, 58, 237, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: ENTER 6-DIGIT OTP VERIFICATION                        */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {flowState === 'VERIFY' && (
          <>
            {/* Top Animated Circular Security Icon */}
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
              border: '2px solid rgba(124, 58, 237, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
              boxShadow: '0 0 25px rgba(124, 58, 237, 0.25)',
              position: 'relative'
            }}>
              <ShieldCheck size={34} color="#7C3AED" style={{ filter: 'drop-shadow(0 2px 8px rgba(124, 58, 237, 0.4))' }} />
              <div style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: '1px dashed rgba(6, 182, 212, 0.45)',
                animation: 'spin 12s linear infinite'
              }} />
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
              {isReset ? 'Verify Password Reset' : 'Verify Your Account'}
            </h1>

            <p style={{
              fontSize: '13.5px',
              color: 'var(--text-secondary, #4B5563)',
              lineHeight: 1.5,
              maxWidth: '380px',
              marginBottom: '20px'
            }}>
              {isReset
                ? 'Enter the 6-digit code to continue resetting your password.'
                : 'Enter the 6-digit verification code to continue.'}
              {email && (
                <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary, #111827)', marginTop: '4px' }}>
                  Sent to: {email}
                </span>
              )}
            </p>

            {/* DEVELOPMENT OTP GLASSMORPHIC INFORMATION CARD (Development Mode Only) */}
            {isDev && demoOtp && (
              <div
                style={{
                  width: '100%',
                  background: 'rgba(6, 26, 51, 0.75)',
                  border: '1px solid rgba(0, 217, 255, 0.35)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  marginBottom: '22px',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px rgba(0, 83, 156, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={13} color="var(--cyber-cyan, #00D9FF)" />
                    <span style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.12em', fontFamily: 'var(--font-mono, monospace)', color: 'var(--cyber-cyan, #00D9FF)' }}>
                      DEVELOPMENT VERIFICATION
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillDemo}
                    style={{
                      background: 'rgba(0, 83, 156, 0.25)',
                      border: '1px solid rgba(0, 217, 255, 0.4)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: copied ? '#2FE0A1' : '#00D9FF',
                      padding: '3px 10px'
                    }}
                    title="Auto-fill code"
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copied ? 'Filled' : 'Auto-fill'}</span>
                  </button>
                </div>

                <div
                  onClick={handleAutoFillDemo}
                  title="Click to auto-fill code"
                  style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    letterSpacing: '10px',
                    fontFamily: 'var(--font-mono, monospace)',
                    color: '#FFD662',
                    cursor: 'pointer',
                    padding: '8px 24px',
                    borderRadius: '8px',
                    background: 'rgba(3, 15, 30, 0.6)',
                    border: '1px solid rgba(255, 214, 98, 0.25)',
                    textShadow: '0 0 16px rgba(255, 214, 98, 0.4)'
                  }}
                >
                  {demoOtp.split('').join(' ')}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)' }}>
                  For local testing only
                </span>
              </div>
            )}

            {/* Error or Status Messages */}
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

            {statusMsg && (
              <div style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#059669',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{statusMsg}</span>
              </div>
            )}

            {/* 6-DIGIT OTP INPUT FORM */}
            <form onSubmit={handleVerifyOtp} style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>
              <div style={{ marginBottom: '12px', width: '100%' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--text-secondary, #4B5563)',
                  marginBottom: '12px'
                }}>
                  ENTER 6-DIGIT CODE
                </label>

                <div
                  onPaste={handlePaste}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    maxWidth: '360px',
                    margin: '0 auto'
                  }}
                >
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      size={1}
                      value={digit}
                      onChange={e => handleDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      style={{
                        width: '48px',
                        minWidth: '0',
                        maxWidth: '52px',
                        height: '56px',
                        flex: '1 1 0',
                        padding: '0',
                        margin: '0',
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        fontSize: '24px',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono, monospace)',
                        color: 'var(--text-primary, #F8FAFC)',
                        background: 'rgba(6, 26, 51, 0.75)',
                        backdropFilter: 'blur(12px)',
                        border: errorMsg
                          ? '2px solid rgba(239, 68, 68, 0.8)'
                          : digit
                            ? '2px solid #00D9FF'
                            : '1.5px solid rgba(0, 217, 255, 0.25)',
                        borderRadius: '12px',
                        boxShadow: errorMsg
                          ? '0 0 16px rgba(239, 68, 68, 0.3)'
                          : digit
                            ? '0 0 16px rgba(0, 217, 255, 0.4)'
                            : 'none',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        cursor: 'text'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || digits.join('').length !== 6}
                style={{
                  width: '100%',
                  marginTop: '18px',
                  padding: '13px 20px',
                  borderRadius: '12px',
                  background: digits.join('').length === 6
                    ? 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 50%, #06B6D4 100%)'
                    : 'rgba(124, 58, 237, 0.4)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  border: 'none',
                  cursor: digits.join('').length === 6 ? 'pointer' : 'not-allowed',
                  boxShadow: digits.join('').length === 6
                    ? '0 8px 24px rgba(124, 58, 237, 0.35)'
                    : 'none',
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
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>{isReset ? 'Verify OTP' : 'Verify Account'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Countdown & Resend Section */}
            <div style={{
              marginTop: '22px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              color: 'var(--text-secondary, #6B7280)'
            }}>
              {!isExpired ? (
                <div>
                  <span>OTP expires in </span>
                  <strong style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    color: timeLeft <= 15 ? '#EF4444' : 'var(--brand-primary, #7C3AED)',
                    fontSize: '13px'
                  }}>
                    {formatTimer(timeLeft)}
                  </strong>
                </div>
              ) : (
                <div style={{ color: '#EF4444', fontWeight: 600 }}>
                  Your OTP has expired.
                </div>
              )}

              <div>
                <span>Didn't receive the OTP? </span>
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResend}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-primary, #7C3AED)',
                    fontWeight: 700,
                    cursor: resending ? 'not-allowed' : 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {resending && <RefreshCw size={12} className="spin" />}
                  <span>Resend OTP</span>
                </button>
              </div>

              {/* Back to Login Link */}
              <button
                type="button"
                onClick={() => onNavigate && onNavigate(getTargetLoginPage())}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #9CA3AF)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginTop: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={13} />
                <span>Back to login</span>
              </button>
            </div>
          </>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: ACCOUNT VERIFICATION SUCCESS CELEBRATION (PART 17)   */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {flowState === 'ACCOUNT_VERIFIED' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 8px'
          }}>
            <div style={{
              width: '78px',
              height: '78px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
              border: '2px solid #10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 0 35px rgba(16, 185, 129, 0.4)'
            }}>
              <CheckCircle2 size={44} color="#10B981" />
            </div>

            <h2 style={{
              fontSize: '26px',
              fontWeight: 800,
              color: 'var(--text-heading, #1E1B4B)',
              marginBottom: '10px',
              letterSpacing: '-0.02em'
            }}>
              Account Verified!
            </h2>

            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary, #4B5563)',
              marginBottom: '28px',
              lineHeight: 1.6,
              maxWidth: '340px'
            }}>
              Your SkillNexus AI account is activated and ready. You can now sign in to your role workspace.
            </p>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate(getTargetLoginPage())}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
                color: '#FFFFFF',
                fontSize: '14.5px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              Continue to Login →
            </button>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* VIEW 3: CREATE NEW PASSWORD (FORGOT PASSWORD STEP)           */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {flowState === 'NEW_PASSWORD' && (
          <div style={{ width: '100%' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
              border: '2px solid #7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 0 25px rgba(124, 58, 237, 0.3)'
            }}>
              <KeyRound size={30} color="#7C3AED" />
            </div>

            <h2 style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-heading, #1E1B4B)',
              marginBottom: '6px'
            }}>
              Create New Password
            </h2>

            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary, #4B5563)',
              marginBottom: '20px'
            }}>
              Enter and confirm your new secure password for <strong>{email}</strong>.
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
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--text-secondary, #4B5563)',
                  marginBottom: '6px'
                }}>
                  NEW PASSWORD *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setErrorMsg(''); }}
                    placeholder="At least 6 characters"
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-input, rgba(255, 255, 255, 0.8))',
                      border: '1px solid var(--border-subtle, rgba(124, 58, 237, 0.2))',
                      color: 'var(--text-primary, #0F172A)',
                      fontSize: '13px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted, #9CA3AF)',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--text-secondary, #4B5563)',
                  marginBottom: '6px'
                }}>
                  CONFIRM NEW PASSWORD *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
                  placeholder="Re-enter password"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-input, rgba(255, 255, 255, 0.8))',
                    border: '1px solid var(--border-subtle, rgba(124, 58, 237, 0.2))',
                    color: 'var(--text-primary, #0F172A)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '13px 20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: passwordLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {passwordLoading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Change Password</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* VIEW 4: PASSWORD CHANGED SUCCESS (PART 22)                   */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {flowState === 'PASSWORD_RESET_SUCCESS' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 8px'
          }}>
            <div style={{
              width: '78px',
              height: '78px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
              border: '2px solid #10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 0 35px rgba(16, 185, 129, 0.4)'
            }}>
              <CheckCircle2 size={44} color="#10B981" />
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-heading, #1E1B4B)',
              marginBottom: '10px'
            }}>
              Password Changed Successfully!
            </h2>

            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary, #4B5563)',
              marginBottom: '28px',
              lineHeight: 1.6
            }}>
              Your password has been updated. You can now log in using your new password.
            </p>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate(getTargetLoginPage())}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
                color: '#FFFFFF',
                fontSize: '14.5px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              Continue to Login →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
