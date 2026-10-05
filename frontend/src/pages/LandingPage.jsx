import React, { useState } from 'react';
import SkillWorthLogo from '../components/SkillWorthLogo';

export default function LandingPage({ onNavigate, onLogin }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('worker');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [trade, setTrade] = useState('Electrical Maintenance');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Credential lookup tool state
  const [verifyKey, setVerifyKey] = useState('SKW-2025-EL-8842-PUB');
  const [verifiedRecord, setVerifiedRecord] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const handleOpenAuth = (role = 'worker') => {
    setSelectedRole(role);
    setLoginError('');
    if (role === 'worker') {
      setEmail('student.demo@skillnexus.ai');
      setPassword('Demo@2026');
    } else if (role === 'assessor') {
      setEmail('academician.demo@skillnexus.ai');
      setPassword('Demo@2026');
    } else if (role === 'institution') {
      setEmail('institution.demo@skillnexus.ai');
      setPassword('Demo@2026');
    }
    setAuthModalOpen(true);
  };

  const handleDemoLogin = async (role) => {
    let demoEmail = 'student.demo@skillnexus.ai';
    if (role === 'assessor') demoEmail = 'academician.demo@skillnexus.ai';
    if (role === 'institution') demoEmail = 'institution.demo@skillnexus.ai';

    setIsSubmitting(true);
    setLoginError('');
    try {
      if (onLogin) {
        await onLogin(demoEmail, 'Demo@2026', role);
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    try {
      if (authMode === 'login') {
        if (onLogin) {
          await onLogin(email, password, selectedRole);
        }
      } else {
        // Register new user
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name: fullName || 'New Candidate',
            role: selectedRole === 'assessor' ? 'academician' : selectedRole === 'institution' ? 'institution' : 'student',
            department: trade
          })
        });
        const data = await res.json();
        if (data.success) {
          if (onLogin) {
            await onLogin(email, password, selectedRole);
          }
        } else {
          setLoginError(data.message || 'Registration failed');
        }
      }
    } catch (err) {
      setLoginError(err.message || 'Authentication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCredential = async (e) => {
    e?.preventDefault();
    if (!verifyKey.trim()) return;

    setIsVerifying(true);
    setVerifyError('');
    setVerifiedRecord(null);

    try {
      const res = await fetch(`/api/certificates/verify/${encodeURIComponent(verifyKey.trim())}`);
      const data = await res.json();
      if (data.success && data.data) {
        setVerifiedRecord(data.data);
      } else {
        setVerifyError(data.message || 'No cryptographically sealed record found matching this key.');
      }
    } catch (err) {
      setVerifyError('Verification registry server currently unreachable. Check connection.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col w-full selection:bg-primary-container selection:text-on-primary">
      {/* ── TOP HEADER / NAVIGATION ── */}
      <header className="fixed top-0 w-full z-50 bg-[#17212b] shadow-[0_1px_8px_rgba(0,0,0,0.06)] border-b border-[#2d3a47]">
        <div className="h-16 max-w-[1360px] mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); }}
              className="flex items-center gap-3 group"
            >
              <SkillWorthLogo height={36} inverted={true} showSubtitle={true} />
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <a
              href="#overview"
              className="px-3 py-1.5 text-[13px] font-semibold text-[#f3f1eb] bg-white/10 rounded"
            >
              Overview
            </a>
            <a
              href="#verification"
              className="px-3 py-1.5 text-[13px] font-medium text-[#bec9c7] hover:text-[#f3f1eb] transition-colors"
            >
              Credential Verification
            </a>
            <button
              onClick={() => handleOpenAuth('worker')}
              className="px-3 py-1.5 text-[13px] font-medium text-[#bec9c7] hover:text-[#f3f1eb] transition-colors text-left"
            >
              Worker Portal
            </button>
            <button
              onClick={() => handleOpenAuth('assessor')}
              className="px-3 py-1.5 text-[13px] font-medium text-[#bec9c7] hover:text-[#f3f1eb] transition-colors text-left"
            >
              Evaluator Access
            </button>
            <button
              onClick={() => handleOpenAuth('institution')}
              className="px-3 py-1.5 text-[13px] font-medium text-[#bec9c7] hover:text-[#f3f1eb] transition-colors text-left"
            >
              Institutions
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenAuth('worker')}
              className="px-4 py-2 rounded bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover transition-colors shadow-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="w-full pt-16 flex-1 flex flex-col">
        {/* HERO SECTION */}
        <section id="overview" className="relative w-full py-16 md:py-24 border-b border-[#DDDCD4] overflow-hidden">
          <div className="max-w-[1360px] mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Hero Typography */}
              <div className="lg:col-span-6 flex flex-col gap-6 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full w-fit border border-[#DDDCD4]">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-[11px] uppercase tracking-widest text-primary font-bold">
                    YOUR EXPERIENCE HAS VALUE
                  </span>
                </div>

                <h1 className="font-display-lg text-on-surface tracking-tight leading-[1.08]">
                  Skills Earned.<br />
                  <span className="text-primary italic">Experience Recognized.</span>
                </h1>

                <p className="font-body-lg text-on-surface-variant max-w-xl">
                  SkillWorth helps people demonstrate skills gained through real-world experience and helps assessors evaluate those skills consistently through standardized ISO 17024 benchmarks.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => handleOpenAuth('worker')}
                    className="btn-primary px-6 py-3 rounded text-[14px]"
                  >
                    <span>Start Your Journey</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => handleOpenAuth('worker')}
                    className="btn-neutral px-6 py-3 rounded text-[14px]"
                  >
                    Login to Workspace
                  </button>
                </div>

                {/* Trust Proofpoints */}
                <div className="pt-6 flex flex-wrap items-center gap-6 text-on-surface-variant border-t border-[#DDDCD4]/60">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                    <span className="text-[13px] font-medium">ISO/IEC 17024 Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[20px]">lock</span>
                    <span className="text-[13px] font-medium">Verifiable Ledger Attestation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline text-[20px]">wifi_off</span>
                    <span className="text-[13px] font-medium">Offline-Ready Capture</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Prior Learning Journey Diagram */}
              <div className="lg:col-span-6 relative">
                <div className="bg-surface-container-lowest p-6 rounded-lg border border-[#DDDCD4] shadow-sm">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#DDDCD4]">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
                        Framework Architecture
                      </span>
                      <h3 className="font-headline-sm text-on-surface">The Prior Learning Journey</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-surface-container rounded text-[11px] text-primary font-mono font-semibold">
                      FLOW: REF-2025
                    </span>
                  </div>

                  {/* 4 Pipeline Stages */}
                  <div className="grid grid-cols-1 gap-2">
                    {/* Stage 1 */}
                    <div className="p-3.5 rounded bg-surface-container-low border border-[#DDDCD4]/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-[14px]">
                          01
                        </div>
                        <div>
                          <h4 className="font-headline-sm text-[15px] text-on-surface">1. Practical Experience</h4>
                          <p className="text-[13px] text-on-surface-variant">Real-world tradecraft, apprenticeships, on-site problem solving</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-outline">handyman</span>
                    </div>

                    <div className="flex justify-center -my-1">
                      <span className="material-symbols-outlined text-outline text-[16px]">south</span>
                    </div>

                    {/* Stage 2 */}
                    <div className="p-3.5 rounded bg-surface-container-low border border-[#DDDCD4]/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-[#C96B4B]/15 text-[#C96B4B] flex items-center justify-center font-bold text-[14px]">
                          02
                        </div>
                        <div>
                          <h4 className="font-headline-sm text-[15px] text-on-surface">2. Evidence Dossier</h4>
                          <p className="text-[13px] text-on-surface-variant">Photos, logs, blueprints, acoustic logs &amp; supervisor attestations</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-outline">folder_open</span>
                    </div>

                    <div className="flex justify-center -my-1">
                      <span className="material-symbols-outlined text-outline text-[16px]">south</span>
                    </div>

                    {/* Stage 3 */}
                    <div className="p-3.5 rounded bg-surface-container-low border border-[#DDDCD4]/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-[#D7A84B]/20 text-[#604400] flex items-center justify-center font-bold text-[14px]">
                          03
                        </div>
                        <div>
                          <h4 className="font-headline-sm text-[15px] text-on-surface">3. Standardized Assessment</h4>
                          <p className="text-[13px] text-on-surface-variant">Direct observation rubrics, safety checks &amp; interview scoring</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-outline">fact_check</span>
                    </div>

                    <div className="flex justify-center -my-1">
                      <span className="material-symbols-outlined text-outline text-[16px]">south</span>
                    </div>

                    {/* Stage 4 */}
                    <div className="p-3.5 rounded bg-[#176B68]/10 border border-[#176B68]/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-primary text-white flex items-center justify-center font-bold text-[14px]">
                          04
                        </div>
                        <div>
                          <h4 className="font-headline-sm text-[15px] text-primary font-bold">4. Certified Qualification</h4>
                          <p className="text-[13px] text-on-surface-variant">National RPL registry seal, ISO 17024 attestation &amp; verifiable credential</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-primary">verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PORTAL ROLE GATEWAYS (3 Cards) ── */}
        <section className="py-16 bg-surface-container-low border-b border-[#DDDCD4]">
          <div className="max-w-[1360px] mx-auto px-4 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Multi-Tenant Architecture
              </span>
              <h2 className="font-headline-xl text-on-surface mt-1">
                Unified Ecosystem for Prior Learning Recognition
              </h2>
              <p className="text-on-surface-variant mt-2 text-[15px]">
                Whether you are a skilled technician, an accredited assessor, or a regulatory institution, SkillWorth provides dedicated, compliant tooling.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Worker / Candidate */}
              <div className="stitch-card p-6 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[26px]">badge</span>
                  </div>
                  <h3 className="font-headline-md text-on-surface">Worker &amp; Candidate Portal</h3>
                  <p className="text-[14px] text-on-surface-variant mt-2">
                    Build your evidence dossier, upload work photos, submit field logs, and track your qualification recognition milestones.
                  </p>
                  <ul className="mt-4 space-y-2 text-[13px] text-on-surface-variant">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                      <span>Offline-ready photo &amp; audio log upload</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                      <span>Competency meter &amp; rubric checklist</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                      <span>Tamper-evident verifiable digital credential</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-6 mt-6 border-t border-[#DDDCD4]">
                  <button
                    onClick={() => handleOpenAuth('worker')}
                    className="w-full btn-primary"
                  >
                    <span>Launch Worker Portal</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => handleDemoLogin('worker')}
                    className="w-full mt-2 text-[12px] text-secondary hover:text-primary font-medium py-1"
                  >
                    Quick Demo as Rajesh Kumar
                  </button>
                </div>
              </div>

              {/* Card 2: Assessor / Evaluator */}
              <div className="stitch-card p-6 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded bg-[#3F6D7A]/15 text-[#3F6D7A] flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[26px]">rate_review</span>
                  </div>
                  <h3 className="font-headline-md text-on-surface">Assessor Calibration Workspace</h3>
                  <p className="text-[14px] text-on-surface-variant mt-2">
                    Standardized evaluation cockpit for accredited technical assessors to review dossiers and calibrate direct practical observations.
                  </p>
                  <ul className="mt-4 space-y-2 text-[13px] text-on-surface-variant">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                      <span>Weighted 4-factor scoring rubric matrix</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                      <span>Multi-source dossier inspection tool</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                      <span>One-click sign-off &amp; credential sealing</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-6 mt-6 border-t border-[#DDDCD4]">
                  <button
                    onClick={() => handleOpenAuth('assessor')}
                    className="w-full btn-primary bg-[#3F6D7A] hover:bg-[#325863]"
                  >
                    <span>Launch Assessor Workspace</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => handleDemoLogin('assessor')}
                    className="w-full mt-2 text-[12px] text-secondary hover:text-primary font-medium py-1"
                  >
                    Quick Demo as Dr. Meenakshi Sundaram
                  </button>
                </div>
              </div>

              {/* Card 3: Institution / Council */}
              <div className="stitch-card p-6 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded bg-tertiary/10 text-tertiary flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[26px]">account_balance</span>
                  </div>
                  <h3 className="font-headline-md text-on-surface">Institution Assessment Cockpit</h3>
                  <p className="text-[14px] text-on-surface-variant mt-2">
                    Governance console for awarding bodies, vocational colleges, and accreditation boards to manage cohorts and protocol studios.
                  </p>
                  <ul className="mt-4 space-y-2 text-[13px] text-on-surface-variant">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                      <span>Assessment Protocol Studio designer</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                      <span>Direct credential issuance &amp; revocation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                      <span>Real-time cohort telemetry &amp; pass rates</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-6 mt-6 border-t border-[#DDDCD4]">
                  <button
                    onClick={() => handleOpenAuth('institution')}
                    className="w-full btn-primary bg-[#17212b] hover:bg-[#22313f]"
                  >
                    <span>Launch Institution Cockpit</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => handleDemoLogin('institution')}
                    className="w-full mt-2 text-[12px] text-secondary hover:text-primary font-medium py-1"
                  >
                    Quick Demo as National RPL Authority
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PUBLIC CREDENTIAL VERIFICATION TOOL ── */}
        <section id="verification" className="py-16 bg-surface">
          <div className="max-w-[1000px] mx-auto px-4 md:px-8">
            <div className="stitch-card p-8 bg-surface-container-lowest">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#DDDCD4]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Public Verification Ledger
                  </span>
                  <h2 className="font-headline-lg text-on-surface mt-1">
                    Instant Credential Authentication
                  </h2>
                  <p className="text-[14px] text-on-surface-variant">
                    Verify any SkillWorth issued certificate against the cryptographically sealed national ledger.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[12px] font-mono text-secondary bg-surface-container px-3 py-1.5 rounded">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span>NSCN LEDGER LIVE</span>
                </div>
              </div>

              {/* Form Input */}
              <form onSubmit={handleVerifyCredential} className="mt-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[20px]">
                    qr_code_scanner
                  </span>
                  <input
                    type="text"
                    value={verifyKey}
                    onChange={(e) => setVerifyKey(e.target.value)}
                    placeholder="Enter Record Key (e.g. SKW-2025-EL-8842-PUB)"
                    className="stitch-input pl-10 h-11 text-[14px] font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="btn-primary h-11 px-6 whitespace-nowrap"
                >
                  {isVerifying ? (
                    <span>Verifying Ledger...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Verify Credential</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error Display */}
              {verifyError && (
                <div className="mt-4 p-4 rounded bg-[#ffdad6]/50 border border-error/20 text-error text-[13px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{verifyError}</span>
                </div>
              )}

              {/* Verified Result Card */}
              {verifiedRecord && (
                <div className="mt-6 p-6 rounded-lg bg-surface-container-low border border-[#DDDCD4] flex flex-col gap-4 animate-fadeIn">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-primary text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">verified</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-mono text-secondary uppercase block">
                          Record Key: {verifiedRecord.recordKey}
                        </span>
                        <h4 className="font-headline-sm text-on-surface text-[17px]">
                          {verifiedRecord.qualification}
                        </h4>
                      </div>
                    </div>
                    <span className="status-chip verified">
                      <span className="material-symbols-outlined text-[14px]">lock</span>
                      {verifiedRecord.ledgerState}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-[#DDDCD4]/60">
                    <div>
                      <span className="text-[11px] uppercase text-secondary font-semibold block">Awardee</span>
                      <span className="text-[14px] font-bold text-on-surface">{verifiedRecord.awardee}</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase text-secondary font-semibold block">Score</span>
                      <span className="text-[14px] font-bold text-primary">{verifiedRecord.score}</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase text-secondary font-semibold block">Standard</span>
                      <span className="text-[14px] font-medium text-on-surface">{verifiedRecord.accreditation}</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase text-secondary font-semibold block">Issued</span>
                      <span className="text-[14px] font-medium text-on-surface">{verifiedRecord.issueDate}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-surface-container rounded text-[12px] font-mono text-secondary break-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">fingerprint</span>
                    <span>Hash: {verifiedRecord.verificationHash}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full bg-[#17212b] text-[#bec9c7] py-10 border-t border-[#2d3a47]">
        <div className="max-w-[1360px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <SkillWorthLogo height={32} inverted={true} showSubtitle={true} />
          <div className="flex items-center gap-6 text-[13px]">
            <span>ISO/IEC 17024:2012 Compliant</span>
            <span>•</span>
            <span>National Prior Learning Framework</span>
            <span>•</span>
            <span>W3C Verifiable Credentials</span>
          </div>
          <span className="text-[12px] text-[#65727A]">
            © 2026 SkillWorth Registry Authority. All rights reserved.
          </span>
        </div>
      </footer>

      {/* ── AUTH / LOGIN MODAL ── */}
      {authModalOpen && (
        <div className="stitch-modal-backdrop" onClick={() => setAuthModalOpen(false)}>
          <div
            className="stitch-modal p-6 md:p-8 flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#DDDCD4]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-on-surface">SkillWorth Workspace Authentication</h3>
                  <span className="text-[12px] text-secondary">
                    {selectedRole === 'worker' && 'Candidate / Worker Experience Portal'}
                    {selectedRole === 'assessor' && 'Accredited Assessor Calibration Workspace'}
                    {selectedRole === 'institution' && 'Institutional Assessment Cockpit'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Role Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-surface-container rounded">
              <button
                type="button"
                onClick={() => handleOpenAuth('worker')}
                className={`py-2 text-[12px] font-semibold rounded transition-colors ${
                  selectedRole === 'worker' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-on-surface'
                }`}
              >
                Worker
              </button>
              <button
                type="button"
                onClick={() => handleOpenAuth('assessor')}
                className={`py-2 text-[12px] font-semibold rounded transition-colors ${
                  selectedRole === 'assessor' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-on-surface'
                }`}
              >
                Assessor
              </button>
              <button
                type="button"
                onClick={() => handleOpenAuth('institution')}
                className={`py-2 text-[12px] font-semibold rounded transition-colors ${
                  selectedRole === 'institution' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-on-surface'
                }`}
              >
                Institution
              </button>
            </div>

            {/* Quick Demo Login Preset Banner */}
            <div className="p-3 bg-surface-container-low rounded border border-[#DDDCD4] flex items-center justify-between">
              <div className="text-[12px]">
                <span className="font-semibold text-on-surface">Instant Demo Account: </span>
                <span className="text-secondary font-mono">
                  {selectedRole === 'worker' && 'Rajesh Kumar (student.demo@skillnexus.ai)'}
                  {selectedRole === 'assessor' && 'Dr. Meenakshi Sundaram (academician.demo@skillnexus.ai)'}
                  {selectedRole === 'institution' && 'National RPL Authority (institution.demo@skillnexus.ai)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDemoLogin(selectedRole)}
                disabled={isSubmitting}
                className="px-3 py-1 bg-primary text-white text-[12px] font-semibold rounded hover:bg-primary-hover whitespace-nowrap shadow-sm"
              >
                1-Click Demo Sign In
              </button>
            </div>

            {/* Login or Register Form */}
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              {loginError && (
                <div className="p-3 rounded bg-[#ffdad6]/60 border border-error/30 text-error text-[13px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{loginError}</span>
                </div>
              )}

              {authMode === 'register' && (
                <>
                  <div>
                    <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="stitch-input"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                      Trade / Vocational Specialization
                    </label>
                    <input
                      type="text"
                      required
                      value={trade}
                      onChange={(e) => setTrade(e.target.value)}
                      placeholder="e.g. Electrical Maintenance Specialist"
                      className="stitch-input"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="stitch-input"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="stitch-input"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-2.5 mt-2"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : authMode === 'login' ? (
                  <span>Sign In to Workspace</span>
                ) : (
                  <span>Register Profile</span>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-[13px]">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-primary font-semibold hover:underline"
                >
                  {authMode === 'login' ? 'Create new candidate account' : 'Already registered? Sign in'}
                </button>
                <span className="text-secondary text-[12px]">ISO 17024 Secured</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
