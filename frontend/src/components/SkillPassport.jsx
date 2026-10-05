import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function SkillPassport({ workerId = null, readOnly = false, initialData = null }) {
  const [passport, setPassport] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [isPublic, setIsPublic] = useState(true);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [selectedAssessmentRecord, setSelectedAssessmentRecord] = useState(null);

  const loadPassport = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkerSkillPassport(workerId);
      if (data && data.success) {
        setPassport(data);
        setIsPublic(data.isPublic !== false);
        if (data.assessmentRecords?.length > 0) {
          setSelectedAssessmentRecord(data.assessmentRecords[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load Worker Skill Passport:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      loadPassport();
    } else {
      setIsPublic(initialData.isPublic !== false);
      if (initialData.assessmentRecords?.length > 0) {
        setSelectedAssessmentRecord(initialData.assessmentRecords[0]);
      }
    }
  }, [workerId, initialData]);

  const handleToggleVisibility = async () => {
    if (readOnly) return;
    const nextState = !isPublic;
    setSavingVisibility(true);
    try {
      const res = await api.setPassportVisibility(nextState);
      if (res.success) {
        setIsPublic(nextState);
      }
    } catch (err) {
      console.error('Error setting passport visibility:', err);
    } finally {
      setSavingVisibility(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', background: '#fff', borderRadius: '12px' }}>
        <span className="material-symbols-outlined" style={{ animation: 'spin 1.5s infinite linear', fontSize: '36px', color: '#176B68' }}>
          sync
        </span>
        <p style={{ marginTop: '14px', color: '#5f6368', fontWeight: 500 }}>
          Generating Official SkillWorth Worker Skill Passport...
        </p>
      </div>
    );
  }

  if (!passport) {
    return (
      <div style={{ padding: '32px', background: '#fff', borderRadius: '12px', border: '1px solid #DDDCD4' }}>
        <p style={{ color: '#5f6368' }}>No Skill Passport dossier found for this worker profile.</p>
      </div>
    );
  }

  // 7-step RPL Journey indicators
  const journeySteps = [
    { num: 1, label: 'Experience' },
    { num: 2, label: 'QP Selection' },
    { num: 3, label: 'Evidence' },
    { num: 4, label: 'Practical Task' },
    { num: 5, label: 'Assessor Review' },
    { num: 6, label: 'Recommendation' },
    { num: 7, label: 'Awarding Body' }
  ];

  return (
    <div className="sw-skill-passport-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Utility Bar (Screen Only) */}
      <div className="sw-no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#ffffff',
        border: '1px solid #DDDCD4',
        borderRadius: '10px',
        padding: '14px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="material-symbols-outlined" style={{ color: '#176B68', fontSize: '24px' }}>
            badge
          </span>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1b1c18' }}>
              Worker Skill Passport Dossier
            </span>
            <span style={{ fontSize: '11px', color: '#80868b', marginLeft: '8px' }}>
              Portable assessment record for informal vocational trades
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Public / Private Visibility Toggle (Section 21) */}
          {!readOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#5f6368', fontWeight: 600 }}>
                Visibility:
              </span>
              <button
                type="button"
                disabled={savingVisibility}
                onClick={handleToggleVisibility}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: '1px solid #DDDCD4',
                  cursor: 'pointer',
                  background: isPublic ? '#e6f4ea' : '#f0f3f6',
                  color: isPublic ? '#137333' : '#555f6b',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  {isPublic ? 'public' : 'lock'}
                </span>
                {isPublic ? 'PUBLIC PROFILE' : 'PRIVATE PROFILE'}
              </button>
            </div>
          )}

          {/* Download / Print Button (Section 20) */}
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '6px 14px',
              background: '#176B68',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>print</span>
            Download / Print Passport
          </button>
        </div>
      </div>

      {/* 23. RPL Journey Visualization */}
      <div className="sw-no-print" style={{
        background: '#ffffff',
        border: '1px solid #DDDCD4',
        borderRadius: '10px',
        padding: '16px 20px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#555f6b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
          RPL Progression Journey
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', paddingBottom: '4px' }}>
          {journeySteps.map((s, idx) => {
            const isCompleted = passport.rplJourneyStep > s.num;
            const isCurrent = passport.rplJourneyStep === s.num;

            return (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '85px', textAlign: 'center' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  marginBottom: '4px',
                  background: isCompleted ? '#137333' : isCurrent ? '#176B68' : '#f0f3f6',
                  color: isCompleted || isCurrent ? '#ffffff' : '#80868b',
                  border: isCurrent ? '2px solid #0E4341' : 'none',
                  boxShadow: isCurrent ? '0 0 0 3px rgba(23,107,104,0.2)' : 'none'
                }}>
                  {isCompleted ? '✓' : isCurrent ? s.num : '○'}
                </div>
                <div style={{ fontSize: '11px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#176B68' : '#5f6368' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: isCompleted ? '#137333' : isCurrent ? '#176B68' : '#80868b' }}>
                  {isCompleted ? 'DONE' : isCurrent ? 'ACTIVE' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INSTITUTIONAL DOCUMENT-STYLE PASSPORT CONTAINER (Section 15)              */}
      {/* ========================================================================= */}
      <div id="printable-skill-passport" style={{
        background: '#ffffff',
        border: '2px solid #176B68',
        borderRadius: '12px',
        padding: '36px',
        boxShadow: '0 4px 16px rgba(23, 33, 43, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        fontFamily: 'Inter, sans-serif'
      }}>
        
        {/* Document Header */}
        <div style={{
          borderBottom: '2px solid #176B68',
          paddingBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '12px', height: '12px', background: '#176B68', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.12em', color: '#176B68', textTransform: 'uppercase' }}>
                SKILLWORTH &bull; RECOGNITION OF PRIOR LEARNING
              </span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#17212b', margin: '4px 0 8px 0' }}>
              WORKER SKILL PASSPORT
            </h1>
            <p style={{ fontSize: '12px', color: '#5f6368' }}>
              Standardized Vocational Portfolio & Practical Assessment Record
            </p>
          </div>

          {/* Verification QR Code (Section 19) */}
          <div style={{
            background: '#fbf9f3',
            border: '1px solid #DDDCD4',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {passport.qrCodeDataUrl ? (
              <img
                src={passport.qrCodeDataUrl}
                alt="Verification QR"
                style={{ width: '110px', height: '110px', display: 'block' }}
              />
            ) : (
              <div style={{ width: '110px', height: '110px', background: '#eae8e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#5f6368' }}>
                [QR Code]
              </div>
            )}
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#176B68', marginTop: '6px', letterSpacing: '0.04em' }}>
              SCAN TO VERIFY RECORD
            </span>
            <span style={{ fontSize: '8px', color: '#80868b' }}>
              {passport.recordId}
            </span>
          </div>
        </div>

        {/* Worker Demographics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          background: '#fbf9f3',
          border: '1px solid #DDDCD4',
          borderRadius: '8px',
          padding: '18px 22px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600, textTransform: 'uppercase' }}>Worker Full Name</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1b1c18', marginTop: '2px' }}>{passport.workerName}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600, textTransform: 'uppercase' }}>Worker ID</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#176B68', marginTop: '2px', fontFamily: 'monospace' }}>{passport.workerId}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600, textTransform: 'uppercase' }}>Primary Occupation</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1b1c18', marginTop: '2px' }}>{passport.primaryOccupation}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600, textTransform: 'uppercase' }}>Total Experience</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1b1c18', marginTop: '2px' }}>{passport.totalExperienceYears} Years</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600, textTransform: 'uppercase' }}>Passport Status</div>
            <div style={{
              display: 'inline-block',
              marginTop: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 800,
              background: '#e6f4f3',
              color: '#176B68'
            }}>
              {passport.passportStatus}
            </div>
          </div>
        </div>

        {/* Section A: Skills & Competencies (Section 15) */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#176B68', borderBottom: '1px solid #DDDCD4', paddingBottom: '6px', marginBottom: '12px' }}>
            SKILLS &amp; VERIFIED COMPETENCIES
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {passport.verifiedCompetencies?.length > 0 ? (
              passport.verifiedCompetencies.map((comp, idx) => {
                const isCompetent = comp.status === 'COMPETENT';
                return (
                  <div key={idx} style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #DDDCD4',
                    background: isCompetent ? '#f6fbf8' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: isCompetent ? '#137333' : '#b06000', fontWeight: 800, fontSize: '14px' }}>
                        {isCompetent ? '✓' : '◐'}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1b1c18' }}>
                        {comp.name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isCompetent ? '#e6f4ea' : '#fef7e0',
                      color: isCompetent ? '#137333' : '#b06000'
                    }}>
                      {comp.status}
                    </span>
                  </div>
                );
              })
            ) : (
              (passport.skills || []).map((sk, idx) => (
                <div key={idx} style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #DDDCD4',
                  background: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1b1c18'
                }}>
                  ✓ {sk}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section B: RPL Assessments (Section 15 & 17) */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#176B68', borderBottom: '1px solid #DDDCD4', paddingBottom: '6px', marginBottom: '12px' }}>
            RPL ASSESSMENTS
          </h3>

          {passport.assessmentRecords?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {passport.assessmentRecords.map((ar, idx) => (
                <div key={idx} style={{
                  border: '1px solid #DDDCD4',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  background: '#fbf9f3',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1b1c18' }}>
                      {ar.trade} &bull; NSQF Level {ar.nsqfLevel}
                    </div>
                    <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '2px' }}>
                      QP Code: <strong>{ar.qpCode}</strong> &bull; Assessment Status: <strong>{ar.status}</strong> &bull; Evaluated: {ar.date}
                    </div>
                    <div style={{ fontSize: '11px', color: '#80868b', marginTop: '2px' }}>
                      Assessor: {ar.assessorName || 'Authorized Lead Assessor'} &bull; Record ID: <strong>{ar.recordId}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#e6f4ea',
                      color: '#137333'
                    }}>
                      {ar.finalRecommendation?.replace(/_/g, ' ') || 'ASSESSED'}
                    </div>
                    {ar.percentage !== undefined && (
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#176B68', marginTop: '3px' }}>
                        Score: {ar.percentage}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#5f6368' }}>No formal RPL assessments completed yet.</p>
          )}
        </div>

        {/* Section C: Experience & Evidence Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#176B68', borderBottom: '1px solid #DDDCD4', paddingBottom: '6px', marginBottom: '10px' }}>
              DECLARED EXPERIENCE
            </h3>
            {passport.experiences?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {passport.experiences.map((exp, idx) => (
                  <div key={idx} style={{ padding: '8px 12px', background: '#fbf9f3', borderRadius: '6px', border: '1px solid #DDDCD4' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#1b1c18' }}>
                      {exp.occupation || exp.jobTitle}
                    </div>
                    <div style={{ fontSize: '11px', color: '#5f6368' }}>
                      {exp.years} years &bull; {exp.sector || 'Vocational'} &bull; {exp.tools || 'Hand tools'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#5f6368' }}>No declared experiences recorded.</p>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#176B68', borderBottom: '1px solid #DDDCD4', paddingBottom: '6px', marginBottom: '10px' }}>
              EVIDENCE ARTIFACTS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '10px 14px', background: '#fbf9f3', borderRadius: '6px', border: '1px solid #DDDCD4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#1b1c18', fontWeight: 600 }}>Total Evidence Items</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#176B68' }}>{passport.evidenceSummary?.totalItems || 0}</span>
              </div>
              <div style={{ padding: '10px 14px', background: '#e6f4ea', borderRadius: '6px', border: '1px solid #b7e1cd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#137333', fontWeight: 600 }}>Verified by Assessor</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#137333' }}>{passport.evidenceSummary?.verifiedByAssessor || 0}</span>
              </div>
              <div style={{ padding: '10px 14px', background: '#f0f3f6', borderRadius: '6px', border: '1px solid #DDDCD4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#555f6b', fontWeight: 600 }}>Supporting Evidence</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#555f6b' }}>{passport.evidenceSummary?.supportingEvidence || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section D: Skill Gap System (Section 22) */}
        {passport.skillGaps?.length > 0 && (
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#b06000', borderBottom: '1px solid #f6cea0', paddingBottom: '6px', marginBottom: '10px' }}>
              IDENTIFIED SKILL GAPS &amp; DEVELOPMENT PATHWAY
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {passport.skillGaps.map((gap, idx) => (
                <div key={idx} style={{
                  padding: '10px 14px',
                  background: '#fef7e0',
                  border: '1px solid #f6cea0',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#604400' }}>
                      {gap.competencyName} ({gap.competencyCode})
                    </div>
                    <div style={{ fontSize: '11px', color: '#604400', marginTop: '2px' }}>
                      {gap.gapDescription}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#176B68', fontWeight: 600, background: '#ffffff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #DDDCD4' }}>
                    Next Step: {gap.recommendedNextStep}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Footer & Disclaimer */}
        <div style={{
          borderTop: '2px solid #176B68',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '10px',
          color: '#80868b'
        }}>
          <div>
            <strong>DISCLAIMER:</strong> {passport.statement}
          </div>
          <div>
            Generated: {new Date(passport.updatedAt).toLocaleDateString('en-GB')} &bull; SkillWorth Platform
          </div>
        </div>

      </div>

    </div>
  );
}
