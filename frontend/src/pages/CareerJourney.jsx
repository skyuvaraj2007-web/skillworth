import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  User,
  Award,
  Brain,
  BookOpen,
  FolderGit2,
  ShieldCheck,
  Briefcase,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Bot,
  RefreshCw,
  Calendar,
  Building,
  Target
} from 'lucide-react';
import './CareerJourney.css';

export default function CareerJourney({ setActivePage, onShowToast, user }) {
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJourney = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
      const res = await fetch('/api/student/journey', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setJourney(data.data);
      } else {
        throw new Error(data.message || 'Failed to load career journey');
      }
    } catch (e) {
      setError(e.message);
      if (onShowToast) onShowToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, []);

  const handleNavigate = (page) => {
    if (setActivePage) setActivePage(page);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: '#6366F1',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ fontSize: '15px', fontWeight: '500' }}>Retrieving your verified Career Journey...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '700px',
        margin: '40px auto',
        padding: '30px',
        background: 'var(--bg-surface)',
        border: '1px solid #EF4444',
        borderRadius: '16px',
        textAlign: 'center'
      }}>
        <AlertCircle size={42} color="#EF4444" style={{ marginBottom: '12px' }} />
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Career Journey Unavailable</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>{error}</p>
        <button
          onClick={fetchJourney}
          className="btn-cyber-primary"
          style={{ padding: '10px 20px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} /> Retry Fetch
        </button>
      </div>
    );
  }

  if (!journey) return null;

  const {
    profile = {},
    assessment = null,
    skillGap = null,
    learning = [],
    projects = [],
    certifications = [],
    passport = null,
    opportunities = [],
    applications = [],
    industryAssessments = [],
    interviews = [],
    placement = null,
    stages = [],
    journeyProgress = 0,
    completedStagesCount = 0,
    totalStages = 12,
    nextBestAction = null
  } = journey;

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px 16px 60px 16px',
      boxSizing: 'border-box'
    }}>
      {/* Header Profile Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '22px',
              fontWeight: '700',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)'
            }}>
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {profile.name || 'Student Career Journey'}
                </h1>
                <span style={{
                  background: 'rgba(79, 70, 229, 0.12)',
                  color: '#4F46E5',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  {profile.desiredRole || 'Full Stack Engineer'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {profile.department} • {profile.institutionName} • Class of {profile.batch}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => handleNavigate('career-copilot')}
              className="btn-cyber-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              <Bot size={16} /> Open AI Copilot →
            </button>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div style={{
          background: 'var(--bg-elevated, rgba(255,255,255,0.03))',
          padding: '16px 20px',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Overall Career Progression
            </span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#4F46E5' }}>
              {journeyProgress}% ({completedStagesCount}/{totalStages} Stages Verified)
            </span>
          </div>
          <div style={{
            height: '10px',
            borderRadius: '5px',
            background: 'var(--border-subtle, #E5E7EB)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${journeyProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4F46E5, #06B6D4, #10B981)',
              borderRadius: '5px',
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>
        </div>
      </div>

      {/* Next Best Action Card */}
      {nextBestAction && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1.5px solid rgba(79, 70, 229, 0.3)',
          borderRadius: '18px',
          padding: '20px 24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 18px rgba(79, 70, 229, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Next Best Action
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {nextBestAction.title}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '650px' }}>
                {nextBestAction.description}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => handleNavigate(nextBestAction.actionRoute)}
              className="btn-cyber-primary"
              style={{
                padding: '9px 18px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {nextBestAction.actionLabel} <ArrowRight size={14} />
            </button>
            <button
              onClick={() => handleNavigate('career-copilot')}
              className="btn-cyber-secondary"
              style={{
                padding: '9px 14px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Bot size={15} /> Ask Copilot
            </button>
          </div>
        </div>
      )}

      {/* 12-Stage Timeline */}
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '18px' }}>
        Complete 12-Stage Career Journey Rail
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* STAGE 1: Profile Stage */}
        <StageCard
          number={1}
          icon={User}
          title="Student Profile"
          status={profile.name ? 'COMPLETED' : 'IN_PROGRESS'}
          summary={`${profile.name} • ${profile.email}`}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '10px' }}>
            <InfoItem label="Target Career" value={profile.desiredRole} />
            <InfoItem label="Department" value={profile.department} />
            <InfoItem label="Institution" value={profile.institutionName} />
            <InfoItem label="Graduation Year" value={profile.batch} />
          </div>
        </StageCard>

        {/* STAGE 2: Skill Assessment Stage */}
        <StageCard
          number={2}
          icon={Award}
          title="Diagnostic Skill Assessment"
          status={assessment && (assessment.attempts?.length > 0 || assessment.completedCount > 0) ? 'COMPLETED' : 'PENDING'}
          summary={assessment ? `${assessment.completedCount || assessment.attempts?.length || 1} Assessment(s) Logged` : 'Pending initial benchmark diagnostic'}
          onAction={() => handleNavigate('assessment')}
          actionLabel="Go to Assessments"
        >
          {assessment?.attempts && assessment.attempts.length > 0 ? (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {assessment.attempts.map((att, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-elevated, rgba(0,0,0,0.02))',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '13px' }}>{att.title}</span>
                    <span style={{ marginLeft: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {att.completedAt ? new Date(att.completedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <span style={{
                    fontWeight: '700',
                    fontSize: '13px',
                    color: att.score >= 60 ? '#10B981' : '#F59E0B'
                  }}>
                    {att.score}% ({att.status || 'PASSED'})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              No diagnostic assessment attempts completed yet. Take an initial assessment to verify your programming fundamentals.
            </p>
          )}
        </StageCard>

        {/* STAGE 3: AI Skill Gap Stage */}
        <StageCard
          number={3}
          icon={Brain}
          title="AI Skill Gap Analysis"
          status={skillGap ? 'COMPLETED' : 'PENDING'}
          summary={skillGap ? `Readiness for ${skillGap.targetRole}: ${skillGap.readinessScore}%` : 'Analysis pending target role benchmark'}
          onAction={() => handleNavigate('skill-gap')}
          actionLabel="Open AI Workbench"
        >
          {skillGap ? (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "{skillGap.aiExplanation || 'Evaluated verified proficiencies against benchmark requirements.'}"
              </p>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12.5px' }}>
                <span style={{ color: '#10B981', fontWeight: '600' }}>✓ {skillGap.strongCount || 0} Strong</span>
                <span style={{ color: '#3B82F6', fontWeight: '600' }}>• {skillGap.goodCount || 0} Good</span>
                <span style={{ color: '#F59E0B', fontWeight: '600' }}>⚠ {skillGap.improveCount || 0} Need Work</span>
                <span style={{ color: '#EF4444', fontWeight: '600' }}>✕ {skillGap.missingCount || 0} Missing</span>
              </div>
            </div>
          ) : (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Run the AI Skill Gap engine to compare your recorded competencies with real corporate industry requirements.
            </p>
          )}
        </StageCard>

        {/* STAGE 4: Learning Stage */}
        <StageCard
          number={4}
          icon={BookOpen}
          title="Curated Learning & Courses"
          status={learning.some(l => l.progress >= 100) ? 'COMPLETED' : (learning.length > 0 ? 'IN_PROGRESS' : 'PENDING')}
          summary={`${learning.length} Active Course Enrollments`}
          onAction={() => handleNavigate('learning')}
          actionLabel="Browse Courses"
        >
          {learning.length > 0 ? (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {learning.map((c, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-elevated, rgba(0,0,0,0.02))',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{c.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '80px', height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${c.progress}%`, height: '100%', background: '#4F46E5' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', minWidth: '36px', textAlign: 'right' }}>
                      {c.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              No course enrollments found. Enroll in institutional modules to close your priority skill gaps.
            </p>
          )}
        </StageCard>

        {/* STAGE 5: Projects Stage */}
        <StageCard
          number={5}
          icon={FolderGit2}
          title="Engineering Projects"
          status={projects.some(p => p.verified) ? 'COMPLETED' : (projects.length > 0 ? 'IN_PROGRESS' : 'PENDING')}
          summary={`${projects.length} Engineering Project(s) Logged`}
          onAction={() => handleNavigate('projects')}
          actionLabel="Submit Project"
        >
          {projects.length > 0 ? (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {projects.map((p, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-elevated, rgba(0,0,0,0.02))',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{p.title}</span>
                    {Array.isArray(p.techStack) && p.techStack.length > 0 && (
                      <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        ({p.techStack.slice(0, 3).join(', ')})
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: '700',
                    color: p.verified ? '#10B981' : 'var(--text-secondary)'
                  }}>
                    {p.verified ? '✓ VERIFIED PROOF' : (p.status || 'DRAFT')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              No technical projects submitted. Connect your GitHub repository to earn verified skill proofs.
            </p>
          )}
        </StageCard>

        {/* STAGE 6: Certifications Stage */}
        <StageCard
          number={6}
          icon={Award}
          title="Verified Certifications"
          status={certifications.length > 0 ? 'COMPLETED' : 'PENDING'}
          summary={`${certifications.length} Credential(s) Earned`}
          onAction={() => handleNavigate('skills')}
          actionLabel="Upload Certificate"
        >
          {certifications.length > 0 ? (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {certifications.map((c, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-elevated, rgba(0,0,0,0.02))',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>
                    {c.title} — <span style={{ fontWeight: '400', color: 'var(--text-secondary)' }}>{c.issuer}</span>
                  </span>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: c.verified ? '#10B981' : '#F59E0B' }}>
                    {c.verified ? '✓ VERIFIED' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              No certificates logged. Upload official course completion certificates for faculty verification.
            </p>
          )}
        </StageCard>

        {/* STAGE 7: Digital Skill Passport Stage */}
        <StageCard
          number={7}
          icon={ShieldCheck}
          title="Digital Skill Passport"
          status={passport ? 'COMPLETED' : 'PENDING'}
          summary={passport ? `Passport ID: ${passport.publicId} (Seal Verified)` : 'Passport issuance pending credentials'}
          onAction={() => handleNavigate('passport')}
          actionLabel="Open Passport"
        >
          {passport ? (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10B981',
                color: '#10B981',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                ✓ OFFICIAL VERIFICATION SEAL
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Badge Tier: <strong>{passport.badgeLevel || 'ADVANCED'}</strong>
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Verified Score: <strong>{passport.verifiedScore}%</strong>
              </span>
            </div>
          ) : (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Digital Skill Passport not yet created. Visit the Digital Passport page to generate your W3C verifiable credentials.
            </p>
          )}
        </StageCard>

        {/* STAGE 8: Industry Matching Stage */}
        <StageCard
          number={8}
          icon={Briefcase}
          title="Industry Skill Matching"
          status={opportunities.length > 0 ? 'COMPLETED' : 'PENDING'}
          summary={`${opportunities.length} Matched Corporate Roles Available`}
          onAction={() => handleNavigate('opportunities')}
          actionLabel="View Opportunities"
        >
          {opportunities.length > 0 ? (
            <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {opportunities.slice(0, 3).map((opp, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-elevated, rgba(0,0,0,0.02))',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)' }}>{opp.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{opp.company} • {opp.location}</div>
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#4F46E5', fontWeight: '700' }}>Match: {opp.matchScore}%</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>{opp.type}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              No corporate opportunities matched yet. Update your skills to unlock matched internships.
            </p>
          )}
        </StageCard>

        {/* STAGE 9: Application Stage */}
        <StageCard
          number={9}
          icon={Send}
          title="Opportunity Applications"
          status={applications.length > 0 ? 'COMPLETED' : 'PENDING'}
          summary={`${applications.length} Application(s) Submitted`}
          onAction={() => handleNavigate('opportunities')}
          actionLabel="Apply to Roles"
        >
          {applications.length > 0 ? (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {applications.map((app, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-elevated, rgba(0,0,0,0.02))',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{app.role}</span>
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>at {app.company}</span>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#4F46E5',
                    background: 'rgba(79, 70, 229, 0.1)',
                    padding: '3px 10px',
                    borderRadius: '6px'
                  }}>
                    {app.stage || 'Submitted'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              No applications submitted yet. Browse matching opportunities and transmit your verified profile.
            </p>
          )}
        </StageCard>

        {/* STAGE 10: Industry Assessment Stage */}
        <StageCard
          number={10}
          icon={Award}
          title="Industry Assessments"
          status={industryAssessments.some(ia => ia.resultStatus === 'PASSED') ? 'COMPLETED' : (industryAssessments.length > 0 ? 'IN_PROGRESS' : 'PENDING')}
          summary={`${industryAssessments.length} Targeted Industry Challenge(s)`}
          onAction={() => handleNavigate('assessment')}
          actionLabel="Open Assessments"
        >
          {industryAssessments.length > 0 ? (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {industryAssessments.map((ia, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-elevated, rgba(0,0,0,0.02))',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{ia.title}</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: ia.resultStatus === 'PASSED' ? '#10B981' : (ia.status === 'COMPLETED' ? '#3B82F6' : '#F59E0B')
                  }}>
                    {ia.resultStatus || ia.status} {ia.score !== null ? `(${ia.score}%)` : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              No custom industry assessments assigned by employers. When a company requests a benchmark, it will appear here.
            </p>
          )}
        </StageCard>

        {/* STAGE 11: Shortlist & Interview Stage */}
        <StageCard
          number={11}
          icon={Calendar}
          title="Shortlist & Interview"
          status={interviews.length > 0 || applications.some(a => ['Shortlisted', 'Interview'].includes(a.stage)) ? 'COMPLETED' : 'PENDING'}
          summary={interviews.length > 0 ? `${interviews.length} Interview(s) Scheduled` : (applications.some(a => a.stage === 'Shortlisted') ? 'Candidate Shortlisted' : 'Awaiting recruiter review')}
          onAction={() => handleNavigate('career-copilot')}
          actionLabel="Interview Prep with Copilot"
        >
          {interviews.length > 0 ? (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {interviews.map((intv, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-elevated, rgba(0,0,0,0.02))',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{intv.round_type || 'Technical Round'}</span>
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      for {intv.opp_title || 'Opportunity'}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#4F46E5' }}>
                    {intv.scheduled_at ? new Date(intv.scheduled_at).toLocaleDateString() : 'Confirmed'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Once recruiters review your verified profile or assessment results, interview invitations will appear here.
            </p>
          )}
        </StageCard>

        {/* STAGE 12: Internship / Placement Stage */}
        <StageCard
          number={12}
          icon={Target}
          title="Internship & Corporate Placement"
          status={placement ? 'COMPLETED' : 'PENDING'}
          summary={placement ? `Placed at ${placement.company} as ${placement.role}` : 'Final milestone of your Skill Nexus trajectory'}
        >
          {placement ? (
            <div style={{
              marginTop: '10px',
              padding: '14px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10B981',
              color: '#10B981',
              fontWeight: '700',
              fontSize: '14px'
            }}>
              🎉 Official Corporate Placement Confirmed: {placement.role} at {placement.company}
            </div>
          ) : (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Complete the prior stages to receive offer letters and finalize your placement credential.
            </p>
          )}
        </StageCard>

      </div>
    </div>
  );
}

// Reusable Stage Card Component
function StageCard({ number, icon: Icon, title, status, summary, children, onAction, actionLabel }) {
  const isCompleted = status === 'COMPLETED';
  const isInProgress = status === 'IN_PROGRESS';

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: isCompleted ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
      borderRadius: '16px',
      padding: '18px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
      transition: 'border-color 0.2s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: isCompleted
              ? 'linear-gradient(135deg, #10B981, #059669)'
              : (isInProgress ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'var(--bg-elevated, #374151)'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: '800',
            fontSize: '14px',
            flexShrink: 0
          }}>
            {isCompleted ? <CheckCircle2 size={18} /> : number}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {title}
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                borderRadius: '6px',
                padding: '2px 8px',
                textTransform: 'uppercase',
                background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : (isInProgress ? 'rgba(245, 158, 11, 0.15)' : 'rgba(156, 163, 175, 0.15)'),
                color: isCompleted ? '#10B981' : (isInProgress ? '#F59E0B' : '#9CA3AF')
              }}>
                {status}
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              {summary}
            </p>
          </div>
        </div>

        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="btn-cyber-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {actionLabel} <ChevronRight size={13} />
          </button>
        )}
      </div>

      {children}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div style={{
      background: 'var(--bg-elevated, rgba(0,0,0,0.02))',
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px solid var(--border-subtle)'
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>
        {label}
      </div>
      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>
        {value || 'Not set'}
      </div>
    </div>
  );
}
