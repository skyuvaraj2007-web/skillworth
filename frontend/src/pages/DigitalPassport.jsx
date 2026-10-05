import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Share2,
  Download,
  QrCode,
  Lock,
  CheckCircle2,
  Award,
  ExternalLink,
  Copy,
  Clock,
  Key,
  Users,
  Check,
  Building,
  GraduationCap,
  Briefcase,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  X
} from 'lucide-react';
import passportService from '../services/passportService';

export default function DigitalPassport({ onShowToast, user }) {
  const [loading, setLoading] = useState(true);
  const [passportData, setPassportData] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');

  // Share & Privacy Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Editable privacy form state inside modal
  const [privacyForm, setPrivacyForm] = useState({
    isPublic: true,
    showEmail: false,
    showRollNumber: false,
    showCgpa: false,
    showAssessments: true,
    showProjects: true,
    showCertificates: true,
    showCourses: true,
    showExperience: true
  });

  const loadPassport = async () => {
    setLoading(true);
    try {
      const data = await passportService.getMyPassport();
      setPassportData(data);
      if (data.passport) {
        setPrivacyForm({
          isPublic: data.passport.isPublic !== false,
          ...(data.passport.privacySettings || {})
        });
      }
    } catch (err) {
      console.error('Failed to load passport:', err);
      if (onShowToast) {
        onShowToast({ title: 'Error', message: err.message, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassport();
  }, []);

  const handleCopyPublicLink = () => {
    if (!passportData?.passport?.publicId) return;
    const origin = window.location.origin;
    const url = `${origin}/passport/${passportData.passport.publicId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    if (onShowToast) {
      onShowToast({
        title: 'Passport Link Copied! 📋',
        message: 'Shareable verification link copied to your clipboard.',
        type: 'success'
      });
    }
  };

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      const { isPublic, ...privacySettings } = privacyForm;
      await passportService.updatePrivacySettings({
        isPublic,
        privacySettings
      });

      if (onShowToast) {
        onShowToast({
          title: 'Privacy Updated',
          message: 'Your Digital Passport privacy preferences have been updated.',
          type: 'success'
        });
      }
      setShowShareModal(false);
      loadPassport();
    } catch (err) {
      if (onShowToast) {
        onShowToast({ title: 'Update Failed', message: err.message, type: 'error' });
      }
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleExportJsonLd = () => {
    window.open(passportService.getExportJsonLdUrl(), '_blank');
    if (onShowToast) {
      onShowToast({
        title: 'Verifiable Credential Exported',
        message: 'W3C Verifiable Credential JSON-LD document downloaded.',
        type: 'success'
      });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ margin: 0, fontSize: '18px', color: '#ffffff' }}>Loading Digital Skill Passport...</h3>
        <p style={{ fontSize: '13px', color: '#64748b' }}>Aggregating verified achievements from Skill Nexus ecosystem</p>
      </div>
    );
  }

  if (!passportData) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
        <ShieldCheck size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
        <h3>Unable to load passport data.</h3>
        <button onClick={loadPassport} className="btn-cyber-primary" style={{ marginTop: '14px', padding: '8px 18px' }}>
          Retry
        </button>
      </div>
    );
  }

  const { student, passport, skillScore, skills, projects, certifications, courses, assessments, experiences, badges, metrics } = passportData;
  const publicShareUrl = `${window.location.origin}/passport/${passport?.publicId}`;

  const tabs = [
    { id: 'Overview', label: 'Overview' },
    { id: 'Skills', label: `Skills (${skills?.length || 0})` },
    { id: 'Projects', label: `Projects (${projects?.length || 0})` },
    { id: 'Certifications', label: `Certifications (${certifications?.length || 0})` },
    { id: 'Assessments', label: `Assessments (${assessments?.length || 0})` },
    { id: 'Experience', label: `Experience (${experiences?.length || 0})` }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ── TOP TELEMETRY BAR ── */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div className="telemetry-node-tag">
            <span>FEATURE 4: DIGITAL SKILL PASSPORT</span>
            <span>//</span>
            <span>SOVEREIGN VERIFICATION ACTIVE</span>
          </div>
          <h1>Digital Skill Passport</h1>
          <p>Your verified digital professional profile collecting achievements across the Skill Nexus ecosystem.</p>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowShareModal(true)}
            className="btn-cyber-primary"
            style={{
              padding: '9px 18px', fontSize: '12.5px', fontWeight: 700, borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Share2 size={15} />
            <span>Share Passport</span>
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            className="btn-cyber-outline"
            style={{
              padding: '9px 14px', fontSize: '12.5px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
            title="Show QR Code"
          >
            <QrCode size={16} />
            <span>QR Code</span>
          </button>

          <button
            onClick={handleExportJsonLd}
            className="btn-cyber-outline"
            style={{
              padding: '9px 14px', fontSize: '12.5px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
            title="Export W3C JSON-LD Credential"
          >
            <Download size={15} />
            <span>Export JSON-LD</span>
          </button>
        </div>
      </div>

      {/* ── HERO PROFILE CARD ── */}
      <div className="glass-card" style={{
        padding: '28px', borderRadius: '16px',
        background: 'rgba(10, 24, 48, 0.9)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          {/* Avatar & Student Info */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              border: '2px solid var(--cyber-cyan, #00d9ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 800, color: '#ffffff',
              boxShadow: '0 0 24px rgba(0, 212, 255, 0.25)', overflow: 'hidden'
            }}>
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                student.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
                  {student.fullName}
                </h2>
                <CheckCircle2 size={18} color="var(--cyber-cyan, #00d9ff)" />
                <span style={{
                  fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                  background: passport?.isPublic ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: passport?.isPublic ? '#10b981' : '#f59e0b',
                  border: `1px solid ${passport?.isPublic ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                }}>
                  {passport?.isPublic ? 'PUBLIC PASSPORT' : 'PRIVATE'}
                </span>
              </div>

              <div style={{ fontSize: '13.5px', color: '#94a3b8', marginBottom: '6px' }}>
                {student.institutionName} • {student.departmentName}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#cbd5e1' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <GraduationCap size={14} color="var(--cyber-cyan, #00d9ff)" />
                  Class of {student.graduationYear}
                </span>

                {student.targetCareerRole && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase size={14} color="#a855f7" />
                    {student.targetCareerRole}
                  </span>
                )}

                {student.rollNumber && (
                  <span style={{ color: '#64748b' }}>
                    • Roll: {student.rollNumber}
                  </span>
                )}

                {student.cgpa && (
                  <span style={{ color: '#10b981', fontWeight: 700 }}>
                    • CGPA: {student.cgpa}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Skill Engine Score & Verification Metrics */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            {/* Overall Skill Score Pill (from existing Skill Engine) */}
            <div style={{
              padding: '14px 20px', borderRadius: '12px',
              background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.3)',
              textAlign: 'center', minWidth: '140px'
            }}>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700 }}>OVERALL SKILL SCORE</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--cyber-cyan, #00d9ff)', lineHeight: 1.1, marginTop: '2px' }}>
                {skillScore?.overallScore ?? 0}%
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                {skillScore?.readinessTier || 'Industry Ready'}
              </div>
            </div>

            {/* Total Verified Items */}
            <div style={{
              padding: '14px 20px', borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)',
              textAlign: 'center', minWidth: '140px'
            }}>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700 }}>VERIFIED CREDENTIALS</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', lineHeight: 1.1, marginTop: '2px' }}>
                {metrics?.verifiedItemsCount || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Platform Ledger Signed
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {student.bio && (
          <p style={{ margin: '16px 0 0', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
            {student.bio}
          </p>
        )}
      </div>

      {/* ── SECTION TABS ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '24px', overflowX: 'auto', gap: '4px'
      }}>
        {tabs.map(t => {
          const isSel = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '12px 20px', background: 'transparent',
                border: 'none', borderBottom: isSel ? '2px solid var(--cyber-cyan, #00d9ff)' : '2px solid transparent',
                color: isSel ? 'var(--cyber-cyan, #00d9ff)' : '#94a3b8',
                fontWeight: isSel ? 700 : 500, fontSize: '13.5px', cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Evaluated Skills */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: '14px', background: 'rgba(10, 24, 48, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                  Top Skills (Calibrated via Skill Engine)
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Multi-source verified competency ratings and proficiency benchmarks.
                </p>
              </div>
              <button onClick={() => setActiveTab('Skills')} className="btn-cyber-outline" style={{ padding: '6px 12px', fontSize: '11.5px' }}>
                View All Skills ({skills?.length || 0}) →
              </button>
            </div>

            {skillScore?.topSkills && skillScore.topSkills.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {skillScore.topSkills.map((sk, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '16px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                        {sk.skillName}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--cyber-cyan, #00d9ff)' }}>
                        {sk.score}%
                      </span>
                    </div>

                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{
                        height: '100%', width: `${sk.score}%`,
                        background: 'linear-gradient(90deg, var(--cyber-cyan, #00d9ff), #a855f7)',
                        borderRadius: '3px'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                      <span>{sk.category} • {sk.proficiencyLevel}</span>
                      <span style={{ color: sk.isVerified ? '#10b981' : '#94a3b8' }}>
                        {sk.isVerified ? '✓ Verified' : 'Claimed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>No skills recorded yet. Complete assessments or courses to add skills.</div>
            )}
          </div>

          {/* Quick Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 700 }}>INDUSTRY ASSESSMENTS</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                {metrics?.assessmentsCount || 0}
              </div>
              <div style={{ fontSize: '11.5px', color: '#10b981', marginTop: '2px' }}>
                Automated sandbox evaluated
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 700 }}>PROJECTS & CAPSTONES</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                {metrics?.projectsCount || 0}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--cyber-cyan, #00d9ff)', marginTop: '2px' }}>
                Faculty audited proofs
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 700 }}>CERTIFICATIONS ISSUED</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                {metrics?.certificationsCount || 0}
              </div>
              <div style={{ fontSize: '11.5px', color: '#c084fc', marginTop: '2px' }}>
                Official institution sealed
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 700 }}>COURSES ENROLLED</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                {metrics?.coursesCount || 0}
              </div>
              <div style={{ fontSize: '11.5px', color: '#38bdf8', marginTop: '2px' }}>
                Curriculum module progress
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SKILLS ── */}
      {activeTab === 'Skills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {skills && skills.length > 0 ? (
            skills.map((sk, idx) => (
              <div
                key={idx}
                className="glass-card"
                style={{
                  padding: '16px 20px', borderRadius: '10px',
                  background: 'rgba(10, 24, 48, 0.7)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                      {sk.skillName}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                      background: sk.isVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                      color: sk.isVerified ? '#10b981' : '#94a3b8',
                      border: `1px solid ${sk.isVerified ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.08)'}`
                    }}>
                      {sk.verificationStatus || (sk.isVerified ? 'VERIFIED' : 'SELF-REPORTED')}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    Category: {sk.category} • Proficiency: {sk.proficiencyLevel}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    Source: <strong style={{ color: '#cbd5e1' }}>{sk.source}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--cyber-cyan, #00d9ff)' }}>
                    {sk.score}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Proficiency Score</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              No skills registered in candidate profile yet.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: PROJECTS ── */}
      {activeTab === 'Projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {projects && projects.length > 0 ? (
            projects.map((p, idx) => (
              <div
                key={p.id || idx}
                className="glass-card"
                style={{
                  padding: '20px', borderRadius: '12px',
                  background: 'rgba(10, 24, 48, 0.7)',
                  border: '1px solid rgba(0, 212, 255, 0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{
                      fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                      background: p.verificationStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 212, 255, 0.12)',
                      color: p.verificationStatus === 'VERIFIED' ? '#10b981' : 'var(--cyber-cyan, #00d9ff)',
                      border: `1px solid ${p.verificationStatus === 'VERIFIED' ? '#10b981' : 'rgba(0, 212, 255, 0.3)'}`
                    }}>
                      {p.verificationStatus}
                    </span>
                    <h3 style={{ margin: '6px 0 2px', fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
                      {p.title}
                    </h3>
                  </div>

                  <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                    {p.verificationId}
                  </span>
                </div>

                <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                  {p.description || 'Verified software engineering project with live automated code audit.'}
                </p>

                {/* Tech stack */}
                {p.techStack && p.techStack.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {p.techStack.map((tech, ti) => (
                      <span
                        key={ti}
                        style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                          background: 'rgba(255,255,255,0.04)', color: '#cbd5e1',
                          border: '1px solid rgba(255,255,255,0.08)'
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Source: <strong style={{ color: '#cbd5e1' }}>{p.verificationSource}</strong>
                  </span>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {p.githubUrl && (
                      <a href={p.githubUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--cyber-cyan, #00d9ff)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Github size={13} /> Code Repository
                      </a>
                    )}
                    {p.liveUrl && (
                      <a href={p.liveUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#34d399', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ExternalLink size={13} /> Live Deployment
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              No verified projects recorded. Submit projects in My Projects to add to your Digital Passport.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: CERTIFICATIONS ── */}
      {activeTab === 'Certifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {certifications && certifications.length > 0 ? (
            certifications.map((c, idx) => (
              <div
                key={c.id || idx}
                className="glass-card"
                style={{
                  padding: '18px 20px', borderRadius: '12px',
                  background: 'rgba(10, 24, 48, 0.7)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Award size={18} color="#c084fc" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                      {c.title}
                    </h3>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Certificate Number: <code style={{ color: 'var(--cyber-cyan, #00d9ff)' }}>{c.certificateNumber}</code>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    Source: <strong style={{ color: '#cbd5e1' }}>{c.verificationSource}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '10.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981'
                  }}>
                    VERIFIED CREDENTIAL
                  </span>
                  <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', marginTop: '6px' }}>
                    Hash: {c.verificationHash?.slice(0, 16)}...
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              No certifications issued yet. Complete certified course sprints to earn verified credentials.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: ASSESSMENTS ── */}
      {activeTab === 'Assessments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {assessments && assessments.length > 0 ? (
            assessments.map((a, idx) => (
              <div
                key={a.id || idx}
                className="glass-card"
                style={{
                  padding: '18px 20px', borderRadius: '12px',
                  background: 'rgba(10, 24, 48, 0.7)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                      background: 'rgba(0, 212, 255, 0.12)', color: 'var(--cyber-cyan, #00d9ff)'
                    }}>
                      {a.companyName}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                      background: a.resultStatus === 'PASSED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: a.resultStatus === 'PASSED' ? '#10b981' : '#f87171'
                    }}>
                      {a.resultStatus}
                    </span>
                  </div>

                  <h3 style={{ margin: '4px 0 2px', fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                    {a.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Category: {a.category} • Difficulty: {a.difficulty}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    Source: <strong style={{ color: '#cbd5e1' }}>{a.verificationSource}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: a.resultStatus === 'PASSED' ? '#10b981' : '#f87171' }}>
                    {a.score}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Percentile: {a.percentile}%</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              No industry assessments attempted yet. Complete assigned assessments in Skill Assessment to benchmark your scores.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 6: EXPERIENCE ── */}
      {activeTab === 'Experience' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {experiences && experiences.length > 0 ? (
            experiences.map((exp, idx) => (
              <div
                key={exp.id || idx}
                className="glass-card"
                style={{
                  padding: '18px 20px', borderRadius: '12px',
                  background: 'rgba(10, 24, 48, 0.7)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Briefcase size={16} color="var(--cyber-cyan, #00d9ff)" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                      {exp.title}
                    </h3>
                  </div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                    {exp.company} • {exp.type} ({exp.location})
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    Source: <strong style={{ color: '#cbd5e1' }}>{exp.verificationSource}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '10.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                    background: 'rgba(0, 212, 255, 0.12)', color: 'var(--cyber-cyan, #00d9ff)',
                    border: '1px solid rgba(0, 212, 255, 0.3)'
                  }}>
                    {exp.stage}
                  </span>
                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px' }}>
                    {new Date(exp.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              No experience or internship records yet. Apply to opportunities in Opportunities to record experiences.
            </div>
          )}
        </div>
      )}

      {/* ── SHARE & PRIVACY MODAL ── */}
      {showShareModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 12, 24, 0.88)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '560px', width: '100%', maxHeight: '88vh', overflowY: 'auto',
            padding: '26px', borderRadius: '16px', background: 'rgba(10, 24, 48, 0.98)',
            border: '1px solid rgba(0, 212, 255, 0.35)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="var(--cyber-cyan, #00d9ff)" />
                <h3 style={{ margin: 0, fontSize: '17px', color: '#ffffff', fontWeight: 800 }}>
                  Share Digital Skill Passport
                </h3>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Public Link Generator Callout */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Public Verification Link
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={publicShareUrl}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--cyber-cyan, #00d9ff)', fontSize: '12.5px', fontFamily: 'monospace'
                  }}
                />
                <button
                  onClick={handleCopyPublicLink}
                  className="btn-cyber-primary"
                  style={{ padding: '9px 16px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Recruiters can verify your authentic achievements at this URL without creating an account.
              </span>
            </div>

            {/* Public / Private Toggle */}
            <div style={{
              padding: '14px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '18px'
            }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                    Enable Public Passport Sharing
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                    When disabled, anyone visiting your verification link receives a private profile notice.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacyForm.isPublic}
                  onChange={e => setPrivacyForm({ ...privacyForm, isPublic: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--cyber-cyan, #00d9ff)', cursor: 'pointer' }}
                />
              </label>
            </div>

            {/* Granular Privacy Controls */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#ffffff', fontWeight: 700 }}>
                Public Profile Privacy Controls
              </h4>
              <p style={{ margin: '0 0 12px', fontSize: '11.5px', color: '#94a3b8' }}>
                Choose which information is visible to the public or recruiter viewers.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'showEmail', label: 'Display Email Address', desc: 'Masks personal email on public view when unchecked' },
                  { key: 'showRollNumber', label: 'Display Student Roll Number', desc: 'Hides academic roll number identifier' },
                  { key: 'showCgpa', label: 'Display CGPA', desc: 'Restricts grade point average visibility' },
                  { key: 'showAssessments', label: 'Show Industry Assessments', desc: 'Includes company assessment scores and benchmarks' },
                  { key: 'showProjects', label: 'Show Verified Projects', desc: 'Includes technical project evidence cards' },
                  { key: 'showCertifications', label: 'Show Certifications', desc: 'Includes verified credentials & hashes' },
                  { key: 'showExperience', label: 'Show Internships & Experience', desc: 'Includes verified internship stages' }
                ].map(item => (
                  <label
                    key={item.key}
                    style={{
                      padding: '10px 14px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacyForm[item.key] !== false}
                      onChange={e => setPrivacyForm({ ...privacyForm, [item.key]: e.target.checked })}
                      style={{ accentColor: 'var(--cyber-cyan, #00d9ff)' }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowShareModal(false)}
                className="btn-cyber-outline"
                style={{ padding: '8px 16px', fontSize: '12.5px' }}
              >
                Cancel
              </button>
              <button
                disabled={savingPrivacy}
                onClick={handleSavePrivacy}
                className="btn-cyber-primary"
                style={{ padding: '8px 20px', fontSize: '12.5px', fontWeight: 700 }}
              >
                {savingPrivacy ? 'Saving...' : 'Save Privacy Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR CODE MODAL ── */}
      {showQrModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 12, 24, 0.88)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '420px', width: '100%', padding: '28px', borderRadius: '16px',
            background: 'rgba(10, 24, 48, 0.98)', border: '1px solid rgba(0, 212, 255, 0.35)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#ffffff', fontWeight: 800 }}>
                Passport Verification QR
              </h3>
              <button onClick={() => setShowQrModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* QR Render Preview */}
            <div style={{
              width: '200px', height: '200px', margin: '0 auto 16px',
              padding: '16px', background: '#ffffff', borderRadius: '12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <QrCode size={160} color="#050d1a" />
            </div>

            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
              {student.fullName}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--cyber-cyan, #00d9ff)', fontFamily: 'monospace', marginBottom: '14px' }}>
              ID: {passport?.publicId}
            </div>
            <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
              Scan with any mobile camera or QR reader to verify candidate credentials on the Skill Nexus platform ledger.
            </p>

            <button
              onClick={handleCopyPublicLink}
              className="btn-cyber-primary"
              style={{ width: '100%', padding: '9px', fontSize: '12.5px' }}
            >
              Copy Verification URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
