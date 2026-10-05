import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  ExternalLink,
  Lock,
  AlertCircle,
  Clock,
  Building,
  GraduationCap,
  Briefcase,
  Code,
  BookOpen,
  Check,
  Layers,
  Sparkles,
  QrCode
} from 'lucide-react';
import passportService from '../services/passportService';

export default function PublicPassportView({ publicId, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [passportData, setPassportData] = useState(null);
  const [errorState, setErrorState] = useState(null); // 'NOT_FOUND' | 'PRIVATE' | 'NETWORK'
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    loadPublicPassport();
  }, [publicId]);

  const loadPublicPassport = async () => {
    if (!publicId) {
      setErrorState('NOT_FOUND');
      setErrorMessage('No public passport identifier provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorState(null);
    try {
      const data = await passportService.getPublicPassport(publicId);
      setPassportData(data);
    } catch (err) {
      if (err.isPrivate || err.status === 403) {
        setErrorState('PRIVATE');
        setErrorMessage(err.message || 'This candidate passport is currently set to private.');
      } else if (err.status === 404) {
        setErrorState('NOT_FOUND');
        setErrorMessage('No authentic digital passport found matching this identifier.');
      } else {
        setErrorState('NETWORK');
        setErrorMessage(err.message || 'Unable to connect to verification ledger.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', color: '#94a3b8'
      }}>
        <div className="animate-spin" style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '3px solid rgba(0, 212, 255, 0.2)', borderTopColor: 'var(--cyber-cyan, #00d9ff)',
          marginBottom: '16px'
        }} />
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
          Verifying Skill Nexus Platform Record...
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
          Checking cryptographic sovereign ledger proof
        </div>
      </div>
    );
  }

  // ── ERROR OR PRIVATE STATE ──
  if (errorState) {
    return (
      <div style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px' }}>
        <div className="glass-card" style={{
          padding: '40px 28px', textAlign: 'center', borderRadius: '16px',
          background: 'rgba(10, 24, 48, 0.95)',
          border: `1px solid ${errorState === 'PRIVATE' ? '#f59e0b' : '#ef4444'}`,
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          {errorState === 'PRIVATE' ? (
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#f59e0b', margin: '0 auto 16px'
            }}>
              <Lock size={26} />
            </div>
          ) : (
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ef4444', margin: '0 auto 16px'
            }}>
              <AlertCircle size={26} />
            </div>
          )}

          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
            {errorState === 'PRIVATE' ? 'Digital Passport is Private' : 'Invalid Verification Identifier'}
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.5 }}>
            {errorMessage}
          </p>

          <div style={{
            fontSize: '11.5px', color: '#64748b', background: 'rgba(255,255,255,0.03)',
            padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)'
          }}>
            Queried ID: <code style={{ color: 'var(--cyber-cyan, #00d9ff)' }}>{publicId}</code>
          </div>

          <div style={{ marginTop: '24px' }}>
            <a
              href="/"
              className="btn-cyber-primary"
              style={{
                display: 'inline-block', textDecoration: 'none',
                padding: '9px 24px', fontSize: '13px'
              }}
            >
              Return to Skill Nexus Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { student, skillScore, skills, projects, certifications, courses, assessments, experiences, verificationSeal } = passportData;

  const tabs = [
    { id: 'Overview', label: 'Overview' },
    { id: 'Skills', label: `Skills (${skills?.length || 0})` },
    { id: 'Projects', label: `Projects (${projects?.length || 0})` },
    { id: 'Certifications', label: `Certifications (${certifications?.length || 0})` },
    { id: 'Assessments', label: `Assessments (${assessments?.length || 0})` },
    { id: 'Experience', label: `Experience (${experiences?.length || 0})` }
  ];

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '30px 20px 80px' }}>
      {/* ── OFFICIAL VERIFICATION BADGE BANNER ── */}
      <div style={{
        padding: '14px 20px', borderRadius: '12px',
        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(0, 212, 255, 0.12) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                Authentic Skill Nexus Platform Credential
              </span>
              <span style={{
                fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981'
              }}>
                VERIFIED RECORD
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
              Cryptographically audited ledger entry • ID: <code style={{ color: 'var(--cyber-cyan, #00d9ff)' }}>{verificationSeal.publicIdentifier}</code>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
          <div>Verified At: {new Date(verificationSeal.verificationDate).toLocaleDateString()}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#64748b' }}>
            Hash: {verificationSeal.qrHash.slice(0, 18)}...
          </div>
        </div>
      </div>

      {/* ── PROFILE HEADER HERO CARD ── */}
      <div className="glass-card" style={{
        padding: '30px', borderRadius: '16px',
        background: 'rgba(10, 24, 48, 0.9)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          {/* Avatar & Student Name */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{
              width: '84px', height: '84px', borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              border: '2px solid var(--cyber-cyan, #00d9ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: 800, color: '#ffffff',
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
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
                  {student.fullName}
                </h1>
                <CheckCircle2 size={20} color="var(--cyber-cyan, #00d9ff)" />
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

                {student.email && (
                  <span style={{ color: '#64748b' }}>
                    • {student.email}
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

          {/* Overall Skill Score Pill (from existing Skill Engine) */}
          <div style={{
            padding: '16px 22px', borderRadius: '12px',
            background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.3)',
            textAlign: 'center', minWidth: '150px'
          }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>OVERALL SKILL SCORE</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--cyber-cyan, #00d9ff)', lineHeight: 1.1, marginTop: '2px' }}>
              {skillScore?.overallScore ?? 0}%
            </div>
            <div style={{
              fontSize: '11px', fontWeight: 700, color: '#10b981',
              marginTop: '4px'
            }}>
              {skillScore?.readinessTier || 'Industry Ready'}
            </div>
          </div>
        </div>

        {/* Bio */}
        {student.bio && (
          <p style={{ margin: '18px 0 0', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
            {student.bio}
          </p>
        )}

        {/* Links */}
        {(student.githubUrl || student.linkedinUrl) && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
            {student.githubUrl && (
              <a
                href={student.githubUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '12px', color: 'var(--cyber-cyan, #00d9ff)', display: 'flex', alignItems: 'center', gap: '6px',
                  textDecoration: 'none'
                }}
              >
                <Github size={14} /> GitHub Profile
              </a>
            )}
            {student.linkedinUrl && (
              <a
                href={student.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '12px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px',
                  textDecoration: 'none'
                }}
              >
                <Linkedin size={14} /> LinkedIn Profile
              </a>
            )}
          </div>
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
                padding: '12px 18px', background: 'transparent',
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
          {/* Top Skills Overview */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: '14px', background: 'rgba(10, 24, 48, 0.7)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
              Top Evaluated Competencies
            </h3>
            {skillScore?.topSkills && skillScore.topSkills.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {skillScore.topSkills.map((sk, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '14px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                        {sk.skillName}
                      </span>
                      <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--cyber-cyan, #00d9ff)' }}>
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

                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Source: {sk.source}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>No skills recorded yet.</div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div className="glass-card" style={{ padding: '18px', borderRadius: '10px' }}>
              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>VERIFIED ASSESSMENTS</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                {assessments?.length || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>Automated sandbox evaluated</div>
            </div>

            <div className="glass-card" style={{ padding: '18px', borderRadius: '10px' }}>
              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>VERIFIED PROJECTS</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                {projects?.length || 0}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--cyber-cyan, #00d9ff)', marginTop: '2px' }}>Codebase validated</div>
            </div>

            <div className="glass-card" style={{ padding: '18px', borderRadius: '10px' }}>
              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>CERTIFICATIONS</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                {certifications?.length || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#c084fc', marginTop: '2px' }}>Institution signed</div>
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
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#ffffff' }}>
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
                    Category: {sk.category} • {sk.proficiencyLevel}
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
              No verified projects recorded.
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
              No certifications issued yet.
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
              No industry assessment attempts recorded.
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
              No experience or internships recorded.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
