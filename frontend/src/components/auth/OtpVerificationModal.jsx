import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Key, ArrowRight, Lock, Sparkles, X } from 'lucide-react';
import { authService } from '../../services/authService';

/**
 * SKILLNEXUS AI — Demo OTP Verification Modal
 * Supports:
 * 1. Account registration activation (marks user isVerified = true)
 * 2. Password reset lifecycle with new password setup
 * 3. Interactive 6-digit OTP code entry with auto-fill demo button
 * 4. Resend OTP with fresh code generation
 */
export default function OtpVerificationModal({
  isOpen,
  onClose,
  email,
  role = 'student',
  initialOtp = '',
  purpose = 'REGISTRATION', // 'REGISTRATION' | 'PASSWORD_RESET'
  onSuccess
}) {
  const [otp, setOtp] = useState(initialOtp || '');
  const [displayedOtp, setDisplayedOtp] = useState(initialOtp || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Password reset specific states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCompleted, setResetCompleted] = useState(false);

  const otpInputsRef = useRef([]);

  useEffect(() => {
    if (initialOtp) {
      setDisplayedOtp(initialOtp);
      setOtp(initialOtp);
    }
  }, [initialOtp]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setStatusMessage('');
      setIsVerified(false);
      setResetCompleted(false);
      setNewPassword('');
      setConfirmPassword('');
      if (initialOtp) {
        setOtp(initialOtp);
        setDisplayedOtp(initialOtp);
      }
    }
  }, [isOpen, initialOtp]);

  if (!isOpen) return null;

  const handleOtpChange = (index, value) => {
    const val = value.replace(/\D/g, '').slice(-1);
    const currentOtpArr = (otp.padEnd(6, ' ')).split('');
    currentOtpArr[index] = val || ' ';
    const updated = currentOtpArr.join('').trimEnd();
    setOtp(updated);
    setError('');

    if (val && index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste) {
      setOtp(paste);
      if (otpInputsRef.current[Math.min(paste.length, 5)]) {
        otpInputsRef.current[Math.min(paste.length, 5)].focus();
      }
    }
  };

  const handleAutoFill = () => {
    if (displayedOtp) {
      setOtp(displayedOtp);
      setError('');
      setStatusMessage('Demo OTP auto-filled.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setStatusMessage('');
    try {
      const res = await authService.resendOtp(email, purpose);
      if (res.success && res.demoOtp) {
        setDisplayedOtp(res.demoOtp);
        setOtp('');
        setStatusMessage(`New Demo OTP dispatched: [ ${res.demoOtp} ]`);
      } else {
        setError(res.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError('Error connecting to authentication service.');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      if (purpose === 'REGISTRATION') {
        const res = await authService.verifyOtp(email, otp, 'REGISTRATION');
        if (res.success) {
          setIsVerified(true);
          setStatusMessage('Account verified successfully! You can now log in.');
        } else {
          setError(res.message || 'Incorrect or expired OTP.');
        }
      } else {
        // PASSWORD_RESET verification
        const res = await authService.verifyResetOtp(email, otp);
        if (res.success) {
          setIsVerified(true);
          setStatusMessage('OTP verified! Please set your new password.');
        } else {
          setError(res.message || 'Incorrect or expired OTP.');
        }
      }
    } catch (err) {
      setError('Error communicating with verification service.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authService.resetPasswordWithOtp(email, otp, newPassword);
      if (res.success) {
        setResetCompleted(true);
        setStatusMessage('Password updated successfully! You can now log in with your new password.');
      } else {
        setError(res.message || 'Failed to update password.');
      }
    } catch (err) {
      setError('Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToLogin = () => {
    if (onSuccess) {
      onSuccess(email);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl">
        {/* Glow Header Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header Icon & Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-tr from-indigo-500/10 via-purple-500/15 to-blue-500/10 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 shadow-inner">
              {purpose === 'REGISTRATION' ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              ) : (
                <Key className="w-8 h-8 text-indigo-500" />
              )}
            </div>

            <div className="inline-block px-3 py-1 mb-2 text-xs font-semibold tracking-wider text-indigo-700 dark:text-indigo-300 uppercase bg-indigo-50 dark:bg-indigo-950/50 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
              {purpose === 'REGISTRATION' ? 'Account Created Successfully ✓' : 'Password Recovery'}
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {purpose === 'REGISTRATION'
                ? 'Verify Your Account'
                : isVerified
                ? 'Create New Password'
                : 'Enter Reset Verification Code'}
            </h3>

            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {purpose === 'REGISTRATION'
                ? `A demo verification code has been dispatched for ${email}`
                : isVerified
                ? 'Please choose a strong password to secure your account'
                : `Enter the 6-digit Demo OTP dispatched for ${email}`}
            </p>
          </div>

          {/* DEVELOPMENT OTP INFORMATION CARD (Local Testing Only) */}
          {Boolean(import.meta.env.DEV || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))) && displayedOtp && !resetCompleted && (!isVerified || purpose === 'REGISTRATION') && (
            <div className={`mb-6 p-4 rounded-2xl border shadow-sm ${
              purpose === 'PASSWORD_RESET'
                ? 'bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-indigo-500/15 border-pink-400/50 dark:border-pink-600/40'
                : 'bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-emerald-500/15 border-cyan-400/50 dark:border-cyan-600/40'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className={`flex items-center gap-1.5 text-xs font-bold tracking-wider ${
                  purpose === 'PASSWORD_RESET'
                    ? 'text-pink-600 dark:text-pink-400'
                    : 'text-cyan-600 dark:text-cyan-400'
                }`}>
                  <Sparkles className="w-4 h-4" />
                  <span>DEVELOPMENT VERIFICATION</span>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  purpose === 'PASSWORD_RESET'
                    ? 'text-pink-700 dark:text-pink-300 bg-pink-100 dark:bg-pink-950/60'
                    : 'text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/60'
                }`}>
                  Expires in 10m
                </span>
              </div>

              <div className="flex items-center justify-between bg-white/90 dark:bg-slate-800/90 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700">
                <div 
                  onClick={handleAutoFill}
                  title="Click to auto-fill"
                  className={`font-mono text-xl sm:text-2xl font-black tracking-widest px-2 cursor-pointer ${
                    purpose === 'PASSWORD_RESET'
                      ? 'text-pink-600 dark:text-pink-400'
                      : 'text-cyan-600 dark:text-cyan-400'
                  }`}
                >
                  {displayedOtp.split('').join(' ')}
                </div>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className={`px-3 py-1.5 text-xs font-semibold text-white rounded-lg shadow-sm transition-all transform active:scale-95 ${
                    purpose === 'PASSWORD_RESET'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                      : 'bg-gradient-to-r from-cyan-500 to-emerald-600 hover:from-cyan-600 hover:to-emerald-700'
                  }`}
                >
                  Auto-fill OTP
                </button>
              </div>
              <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 text-center">
                For local testing only
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-300 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-300 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* FLOW A: Registration Complete Screen */}
          {purpose === 'REGISTRATION' && isVerified ? (
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Account Verified!</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Your {role} profile is now fully active in the SkillNexus database.
                </p>
              </div>
              <button
                type="button"
                onClick={handleContinueToLogin}
                className="w-full py-3 px-4 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Portal Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : purpose === 'PASSWORD_RESET' && resetCompleted ? (
            /* FLOW B: Password Reset Completed Screen */
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Password Updated!</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Your new password has been securely hashed and stored.
                </p>
              </div>
              <button
                type="button"
                onClick={handleContinueToLogin}
                className="w-full py-3 px-4 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Log In with New Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : purpose === 'PASSWORD_RESET' && isVerified ? (
            /* FLOW C: Reset Password Form (After OTP Verified) */
            <form onSubmit={handlePasswordResetSubmit} className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                <span>Set New Password</span>
              </button>
            </form>
          ) : (
            /* FLOW D: 6-Digit OTP Entry Form */
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <div 
                  className="flex justify-center gap-2 sm:gap-3" 
                  onPaste={handlePaste}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    maxWidth: '340px',
                    margin: '0 auto'
                  }}
                >
                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                    const char = otp[idx] || '';
                    return (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        size={1}
                        value={char}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        style={{
                          width: '44px',
                          minWidth: '0',
                          maxWidth: '48px',
                          height: '48px',
                          flex: '1 1 0',
                          padding: '0',
                          margin: '0',
                          boxSizing: 'border-box',
                          textAlign: 'center'
                        }}
                        className="text-center text-xl font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 outline-none transition-all shadow-inner"
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-3 px-4 font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>
                    {purpose === 'REGISTRATION' ? 'Verify & Activate Account' : 'Verify Reset OTP'}
                  </span>
                </button>

                <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Didn't receive the OTP?</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    <span>Resend Demo OTP</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
