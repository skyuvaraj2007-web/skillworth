import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function CompetencyEvidenceMatrix({
  assessment,
  qualificationPack,
  evidence = [],
  onUpdate,
  readOnly = false
}) {
  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCompId, setExpandedCompId] = useState(null);
  const [evaluating, setEvaluating] = useState({});
  const [saveMessage, setSaveMessage] = useState('');
  const [activeRequestModal, setActiveRequestModal] = useState(null);
  const [requestFormData, setRequestFormData] = useState({
    requiredEvidence: 'Practical video demonstration of operating standard',
    message: '',
    deadline: ''
  });
  const [linkingEvidenceId, setLinkingEvidenceId] = useState('');

  // Final Assessment Decision State
  const [finalDecision, setFinalDecision] = useState(assessment?.finalRecommendation || 'RECOMMENDED_FOR_CERTIFICATION');
  const [finalRemarks, setFinalRemarks] = useState(assessment?.assessorFinalRemarks || '');
  const [confirmFinalModal, setConfirmFinalModal] = useState(false);
  const [finalSubmitting, setFinalSubmitting] = useState(false);

  // Load matrix from API
  const loadMatrix = async () => {
    if (!assessment?.id) return;
    setLoading(true);
    try {
      const res = await api.getAssessmentMatrix(assessment.id);
      if (res && res.matrix) {
        setMatrixData(res);
        // Initialize evaluating state for each competency
        const evals = {};
        res.matrix.forEach(m => {
          evals[m.competencyId] = {
            score: m.assessorScore !== null ? m.assessorScore : 3,
            decision: m.assessorDecision || (m.status === 'COMPETENT' ? 'COMPETENT' : 'UNDER_REVIEW'),
            remarks: m.assessorRemarks || '',
            overrideReason: ''
          };
        });
        setEvaluating(evals);
      }
    } catch (err) {
      console.error('Failed to load matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, [assessment?.id]);

  const handleScoreChange = (compId, val) => {
    setEvaluating(prev => ({
      ...prev,
      [compId]: {
        ...prev[compId],
        score: Number(val),
        decision: Number(val) >= 3 ? 'COMPETENT' : Number(val) >= 2 ? 'FURTHER_EVIDENCE_REQUIRED' : 'NOT_YET_COMPETENT'
      }
    }));
  };

  const handleDecisionChange = (compId, val) => {
    setEvaluating(prev => ({
      ...prev,
      [compId]: { ...prev[compId], decision: val }
    }));
  };

  const handleRemarksChange = (compId, val) => {
    setEvaluating(prev => ({
      ...prev,
      [compId]: { ...prev[compId], remarks: val }
    }));
  };

  const handleSaveEvaluation = async (compId) => {
    if (!assessment?.id) return;
    const item = evaluating[compId];
    if (!item) return;

    setSaveMessage('');
    try {
      const res = await api.updateMatrixCompetency(assessment.id, compId, {
        assessorScore: item.score,
        assessorDecision: item.decision,
        assessorRemarks: item.remarks,
        overrideReason: item.overrideReason
      });

      if (res.success) {
        setSaveMessage(`Competency evaluation saved successfully.`);
        await loadMatrix();
        if (onUpdate) onUpdate();
      } else {
        setSaveMessage(res.message || 'Failed to update competency.');
      }
    } catch (err) {
      console.error('Error saving matrix competency:', err);
      setSaveMessage('Server error updating competency.');
    }
  };

  const handleLinkEvidence = async (competencyId, competencyCode) => {
    if (!linkingEvidenceId || !assessment?.id) return;
    try {
      const res = await api.linkEvidenceToCompetency(assessment.id, {
        evidenceId: linkingEvidenceId,
        competencyId,
        competencyCode
      });
      if (res.success) {
        setLinkingEvidenceId('');
        await loadMatrix();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error('Error linking evidence:', err);
    }
  };

  const handleOpenEvidenceRequest = (comp) => {
    setActiveRequestModal(comp);
    setRequestFormData({
      requiredEvidence: comp.evidenceRequired?.[0] || 'Short practical demonstration video',
      message: `Please upload a clear demonstration showing ${comp.competencyName} operating procedures.`,
      deadline: ''
    });
  };

  const handleSubmitEvidenceRequest = async (e) => {
    e.preventDefault();
    if (!activeRequestModal || !assessment?.id) return;

    try {
      const res = await api.requestEvidence(assessment.id, {
        competencyId: activeRequestModal.competencyId,
        competencyCode: activeRequestModal.competencyCode,
        competencyName: activeRequestModal.competencyName,
        requiredEvidence: requestFormData.requiredEvidence,
        message: requestFormData.message,
        deadline: requestFormData.deadline
      });

      if (res.success) {
        setActiveRequestModal(null);
        await loadMatrix();
        if (onUpdate) onUpdate();
      } else {
        alert(res.message || 'Could not send evidence request.');
      }
    } catch (err) {
      console.error('Error sending evidence request:', err);
    }
  };

  const handleSubmitFinalDecision = async () => {
    if (!assessment?.id) return;
    setFinalSubmitting(true);
    try {
      const res = await api.submitRplDecision(assessment.id, finalDecision, finalRemarks);
      if (res.success) {
        setConfirmFinalModal(false);
        await loadMatrix();
        if (onUpdate) onUpdate();
      } else {
        alert(res.message || 'Could not submit final decision.');
      }
    } catch (err) {
      console.error('Error submitting final decision:', err);
    } finally {
      setFinalSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', background: '#fff', borderRadius: '12px' }}>
        <span className="material-symbols-outlined" style={{ animation: 'spin 1.5s infinite linear', fontSize: '32px', color: '#176B68' }}>
          sync
        </span>
        <p style={{ marginTop: '12px', color: '#5f6368', fontWeight: 500 }}>
          Compiling Dynamic Competency Evidence Matrix...
        </p>
      </div>
    );
  }

  if (!matrixData || !matrixData.matrix) {
    return (
      <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #DDDCD4' }}>
        <p style={{ color: '#5f6368' }}>No competency matrix records found for this assessment.</p>
      </div>
    );
  }

  const { matrix, coverage, qualificationPack: qp, unassignedEvidence = [] } = matrixData;

  // Counts for decision panel
  const totalComp = matrix.length;
  const competentCount = matrix.filter(m => m.status === 'COMPETENT' || m.assessorDecision === 'COMPETENT').length;
  const furtherReqCount = matrix.filter(m => m.status === 'FURTHER_EVIDENCE_REQUIRED' || m.assessorDecision === 'FURTHER_EVIDENCE_REQUIRED').length;
  const notYetCompCount = matrix.filter(m => m.status === 'NOT_YET_COMPETENT' || m.assessorDecision === 'NOT_YET_COMPETENT').length;

  return (
    <div className="sw-competency-matrix-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header Information */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #DDDCD4',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="material-symbols-outlined" style={{ color: '#176B68' }}>grid_view</span>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#176B68', textTransform: 'uppercase' }}>
              Dynamic Competency Evidence Matrix
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1b1c18', margin: '2px 0' }}>
            Worker: {matrixData.workerName || assessment?.learnerName || 'Candidate'}
          </h2>
          <p style={{ fontSize: '13px', color: '#5f6368' }}>
            Qualification: <strong>{qp.trade}</strong> ({qp.qpCode}) &bull; Sector: {qp.sector} &bull; NSQF Level: {qp.nsqfLevel}
          </p>
          <p style={{ fontSize: '12px', color: '#80868b', marginTop: '2px' }}>
            Assessment Record ID: <strong>{assessment?.credentialId || `SW-RPL-${assessment?.id}`}</strong>
          </p>
        </div>

        {/* Coverage Card */}
        <div style={{
          background: '#fbf9f3',
          border: '1px solid #DDDCD4',
          borderRadius: '10px',
          padding: '16px 20px',
          minWidth: '280px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#555f6b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Evidence Coverage
            </span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#176B68' }}>
              {coverage.coveragePercentage}%
            </span>
          </div>

          <div style={{ background: '#e4e2dd', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              width: `${coverage.coveragePercentage}%`,
              background: '#176B68',
              height: '100%',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#5f6368' }}>
            <span title="Fully supported units" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ color: '#137333', fontWeight: 700 }}>✓</span> Fully: {coverage.fullySupported}
            </span>
            <span title="Partially supported units" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ color: '#b06000', fontWeight: 700 }}>◐</span> Partial: {coverage.partiallySupported}
            </span>
            <span title="Missing evidence units" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ color: '#d93025', fontWeight: 700 }}>⚠</span> Missing: {coverage.missing}
            </span>
          </div>
        </div>
      </div>

      {/* Save Notification */}
      {saveMessage && (
        <div style={{
          padding: '12px 16px',
          background: '#e6f4ea',
          color: '#137333',
          border: '1px solid #b7e1cd',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
          {saveMessage}
        </div>
      )}

      {/* Unassigned Evidence Bar if present */}
      {unassignedEvidence.length > 0 && (
        <div style={{
          background: '#fef7e0',
          border: '1px solid #f6cea0',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#b06000' }}>warning</span>
            <div>
              <strong style={{ fontSize: '13px', color: '#604400' }}>Unassigned Evidence Detected ({unassignedEvidence.length} item{unassignedEvidence.length > 1 ? 's' : ''}):</strong>
              <span style={{ fontSize: '12px', color: '#604400', marginLeft: '6px' }}>
                Files uploaded without competency mapping. Expand a competency below to assign.
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {unassignedEvidence.map(ue => (
              <span key={ue.id} style={{
                background: '#fff',
                border: '1px solid #DDDCD4',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#1b1c18'
              }}>
                📄 {ue.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2. Primary Desktop Matrix Table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #DDDCD4',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(23, 33, 43, 0.05)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
            <thead>
              <tr style={{ background: '#f5f3ed', borderBottom: '1px solid #DDDCD4', fontSize: '12px', color: '#555f6b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 18px', width: '28%' }}>Competency Unit</th>
                <th style={{ padding: '14px 18px', width: '18%' }}>Evidence</th>
                <th style={{ padding: '14px 18px', width: '18%' }}>Practical Task</th>
                <th style={{ padding: '14px 18px', width: '14%', textAlign: 'center' }}>AI Observation</th>
                <th style={{ padding: '14px 18px', width: '10%', textAlign: 'center' }}>Score</th>
                <th style={{ padding: '14px 18px', width: '12%', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => {
                const isExpanded = expandedCompId === row.competencyId;
                const evalItem = evaluating[row.competencyId] || {};

                // Status tag color mapping
                let statusBadgeBg = '#f0f3f6';
                let statusBadgeColor = '#555f6b';
                let statusLabel = row.status.replace(/_/g, ' ');

                if (row.status === 'COMPETENT') {
                  statusBadgeBg = '#e6f4ea';
                  statusBadgeColor = '#137333';
                  statusLabel = '✓ COMPETENT';
                } else if (row.status === 'FURTHER_EVIDENCE_REQUIRED') {
                  statusBadgeBg = '#fef7e0';
                  statusBadgeColor = '#b06000';
                  statusLabel = '⚠ FURTHER EVIDENCE';
                } else if (row.status === 'NOT_YET_COMPETENT') {
                  statusBadgeBg = '#fce8e6';
                  statusBadgeColor = '#d93025';
                  statusLabel = 'NOT YET COMPETENT';
                } else if (row.status === 'EVIDENCE_SUBMITTED') {
                  statusBadgeBg = '#e6f4f3';
                  statusBadgeColor = '#176B68';
                  statusLabel = 'SUBMITTED';
                }

                // AI Confidence color
                let aiBadgeBg = '#f0f3f6';
                let aiBadgeColor = '#555f6b';
                if (row.aiConfidence === 'HIGH') {
                  aiBadgeBg = '#e6f4ea';
                  aiBadgeColor = '#137333';
                } else if (row.aiConfidence === 'MODERATE') {
                  aiBadgeBg = '#fef7e0';
                  aiBadgeColor = '#b06000';
                } else if (row.aiConfidence === 'INSUFFICIENT DATA' || row.aiConfidence === 'LOW') {
                  aiBadgeBg = '#fce8e6';
                  aiBadgeColor = '#d93025';
                }

                return (
                  <React.Fragment key={row.competencyId}>
                    <tr
                      onClick={() => setExpandedCompId(isExpanded ? null : row.competencyId)}
                      style={{
                        borderBottom: isExpanded ? 'none' : '1px solid #eae8e2',
                        background: isExpanded ? '#fbf9f3' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Competency */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#176B68', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                            chevron_right
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#1b1c18' }}>
                              {row.competencyName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#80868b' }}>
                              {row.competencyCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Evidence */}
                      <td style={{ padding: '14px 18px', fontSize: '12px', color: '#555f6b' }}>
                        {row.evidenceSubmitted > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#176B68' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>attach_file</span>
                            {row.evidenceSubmitted} artifact{row.evidenceSubmitted > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#80868b' }}>— None</span>
                        )}
                      </td>

                      {/* Practical Task */}
                      <td style={{ padding: '14px 18px', fontSize: '12px', color: '#1b1c18' }}>
                        <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.practicalTask}>
                          {row.practicalTask}
                        </div>
                      </td>

                      {/* AI Observation Confidence */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          background: aiBadgeBg,
                          color: aiBadgeColor
                        }}>
                          {row.aiConfidence}
                        </span>
                      </td>

                      {/* Score */}
                      <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>
                        {row.assessorScore !== null ? (
                          <span style={{ color: '#176B68' }}>{row.assessorScore} / 4</span>
                        ) : (
                          <span style={{ color: '#80868b' }}>—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: statusBadgeBg,
                          color: statusBadgeColor
                        }}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>

                    {/* 3. Detailed Expandable Panel (Section 5) */}
                    {isExpanded && (
                      <tr style={{ background: '#fbf9f3', borderBottom: '1px solid #DDDCD4' }}>
                        <td colSpan={6} style={{ padding: '0 24px 24px 24px' }}>
                          <div style={{
                            background: '#ffffff',
                            border: '1px solid #DDDCD4',
                            borderRadius: '8px',
                            padding: '20px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '20px'
                          }}>
                            
                            {/* Left Column: Criteria & Required vs Submitted Evidence */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#176B68', marginBottom: '6px' }}>
                                  Performance Criteria
                                </h4>
                                <ol style={{ paddingLeft: '20px', fontSize: '12px', color: '#1b1c18', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {row.performanceCriteria.map((pc, idx) => (
                                    <li key={idx}>{pc}</li>
                                  ))}
                                </ol>
                              </div>

                              <div>
                                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#555f6b', marginBottom: '6px' }}>
                                  Required Evidence Types
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {row.evidenceRequired.map((er, idx) => (
                                    <span key={idx} style={{
                                      fontSize: '11px',
                                      background: '#f0f3f6',
                                      color: '#555f6b',
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      border: '1px solid #DDDCD4'
                                    }}>
                                      ✓ {er}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#555f6b' }}>
                                    Submitted Evidence ({row.evidenceList?.length || 0})
                                  </h4>
                                  {!readOnly && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEvidenceRequest(row)}
                                      style={{
                                        fontSize: '11px',
                                        background: '#fef7e0',
                                        color: '#604400',
                                        border: '1px solid #f6cea0',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>outgoing_mail</span>
                                      Request More Evidence
                                    </button>
                                  )}
                                </div>

                                {row.evidenceList?.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {row.evidenceList.map(ev => (
                                      <div key={ev.id} style={{
                                        background: '#fbf9f3',
                                        border: '1px solid #DDDCD4',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}>
                                        <div>
                                          <div style={{ fontWeight: 600, fontSize: '12px', color: '#1b1c18' }}>
                                            {ev.isVideo ? '🎥' : '📷'} {ev.title}
                                          </div>
                                          <div style={{ fontSize: '11px', color: '#80868b' }}>
                                            {ev.description || 'Candidate practical artifact'}
                                          </div>
                                        </div>
                                        {ev.fileUrl && (
                                          <a
                                            href={ev.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ fontSize: '11px', color: '#176B68', fontWeight: 600, textDecoration: 'none' }}
                                          >
                                            View Artifact ↗
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{
                                    padding: '12px',
                                    background: '#fcf7f7',
                                    border: '1px dashed #e4c4c2',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    color: '#d93025'
                                  }}>
                                    ⚠ No candidate evidence submitted for this competency yet.
                                  </div>
                                )}

                                {/* Assign unassigned evidence if available */}
                                {!readOnly && unassignedEvidence.length > 0 && (
                                  <div style={{ marginTop: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <select
                                      value={linkingEvidenceId}
                                      onChange={(e) => setLinkingEvidenceId(e.target.value)}
                                      style={{
                                        fontSize: '12px',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        border: '1px solid #DDDCD4',
                                        background: '#fff',
                                        flex: 1
                                      }}
                                    >
                                      <option value="">Assign Unassigned Evidence...</option>
                                      {unassignedEvidence.map(ue => (
                                        <option key={ue.id} value={ue.id}>{ue.title}</option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      disabled={!linkingEvidenceId}
                                      onClick={() => handleLinkEvidence(row.competencyId, row.competencyCode)}
                                      style={{
                                        padding: '4px 10px',
                                        fontSize: '11px',
                                        background: linkingEvidenceId ? '#176B68' : '#e4e2dd',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: linkingEvidenceId ? 'pointer' : 'default',
                                        fontWeight: 600
                                      }}
                                    >
                                      Link Item
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Column: AI Observation & Assessor Evaluation */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              
                              {/* Advisory AI Observation (Section 11) */}
                              <div style={{
                                background: '#f5f3ed',
                                border: '1px solid #DDDCD4',
                                borderRadius: '6px',
                                padding: '12px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#555f6b', textTransform: 'uppercase' }}>
                                    AI Preliminary Observation
                                  </span>
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: aiBadgeBg,
                                    color: aiBadgeColor
                                  }}>
                                    Confidence: {row.aiConfidence}
                                  </span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#1b1c18', lineHeight: 1.4 }}>
                                  "{row.aiObservation}"
                                </p>
                                <p style={{ fontSize: '10px', color: '#80868b', marginTop: '4px' }}>
                                  * Advisory observation only. Final competence requires authorized human assessor sign-off.
                                </p>
                              </div>

                              {/* Assessor Observation / Remarks */}
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1b1c18', marginBottom: '4px' }}>
                                  Assessor Observation & Technical Notes:
                                </label>
                                <textarea
                                  rows={2}
                                  disabled={readOnly}
                                  value={evalItem.remarks || ''}
                                  onChange={(e) => handleRemarksChange(row.competencyId, e.target.value)}
                                  placeholder="Document specific practical observations, measurement tolerances, or oral check answers..."
                                  style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    fontSize: '12px',
                                    borderRadius: '6px',
                                    border: '1px solid #DDDCD4',
                                    resize: 'vertical',
                                    background: readOnly ? '#f5f3ed' : '#ffffff'
                                  }}
                                />
                              </div>

                              {/* Assessor Score & Decision */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1b1c18', marginBottom: '4px' }}>
                                    Score (0–4 Scale):
                                  </label>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    {[0, 1, 2, 3, 4].map(s => (
                                      <button
                                        key={s}
                                        type="button"
                                        disabled={readOnly}
                                        onClick={() => handleScoreChange(row.competencyId, s)}
                                        style={{
                                          width: '34px',
                                          height: '32px',
                                          borderRadius: '6px',
                                          border: evalItem.score === s ? '2px solid #176B68' : '1px solid #DDDCD4',
                                          background: evalItem.score === s ? '#176B68' : '#ffffff',
                                          color: evalItem.score === s ? '#ffffff' : '#1b1c18',
                                          fontWeight: 700,
                                          fontSize: '13px',
                                          cursor: readOnly ? 'default' : 'pointer'
                                        }}
                                      >
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1b1c18', marginBottom: '4px' }}>
                                    Competency Decision:
                                  </label>
                                  <select
                                    disabled={readOnly}
                                    value={evalItem.decision || 'UNDER_REVIEW'}
                                    onChange={(e) => handleDecisionChange(row.competencyId, e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '6px 10px',
                                      fontSize: '12px',
                                      borderRadius: '6px',
                                      border: '1px solid #DDDCD4',
                                      background: '#ffffff',
                                      fontWeight: 600
                                    }}
                                  >
                                    <option value="COMPETENT">COMPETENT</option>
                                    <option value="FURTHER_EVIDENCE_REQUIRED">FURTHER EVIDENCE REQUIRED</option>
                                    <option value="NOT_YET_COMPETENT">NOT YET COMPETENT</option>
                                  </select>
                                </div>
                              </div>

                              {/* Save Button */}
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveEvaluation(row.competencyId)}
                                  style={{
                                    alignSelf: 'flex-start',
                                    padding: '8px 18px',
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
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>save</span>
                                  Save Competency Assessment
                                </button>
                              )}

                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Bottom Assessor Decision Panel (Section 12 & 13) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #DDDCD4',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1b1c18' }}>
              ASSESSMENT SUMMARY
            </h3>
            <p style={{ fontSize: '12px', color: '#5f6368' }}>
              Consolidated evaluation across all Qualification Pack competencies.
            </p>
          </div>
          <div style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: '#e6f4f3',
            color: '#176B68',
            letterSpacing: '0.05em'
          }}>
            STATUS: ASSESSOR REVIEW ACTIVE
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ background: '#fbf9f3', border: '1px solid #DDDCD4', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600 }}>Total Units</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#1b1c18', marginTop: '2px' }}>{totalComp}</div>
          </div>
          <div style={{ background: '#e6f4ea', border: '1px solid #b7e1cd', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#137333', fontWeight: 600 }}>Competent</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#137333', marginTop: '2px' }}>{competentCount}</div>
          </div>
          <div style={{ background: '#fef7e0', border: '1px solid #f6cea0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#b06000', fontWeight: 600 }}>Further Evidence</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#b06000', marginTop: '2px' }}>{furtherReqCount}</div>
          </div>
          <div style={{ background: '#fce8e6', border: '1px solid #f5c2c0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#d93025', fontWeight: 600 }}>Not Yet Competent</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#d93025', marginTop: '2px' }}>{notYetCompCount}</div>
          </div>
          <div style={{ background: '#fbf9f3', border: '1px solid #DDDCD4', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600 }}>Coverage</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#176B68', marginTop: '2px' }}>{coverage.coveragePercentage}%</div>
          </div>
          <div style={{ background: '#fbf9f3', border: '1px solid #DDDCD4', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600 }}>Avg Score</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#176B68', marginTop: '2px' }}>{coverage.weightedCompetencyScore} / 4</div>
          </div>
        </div>

        {/* Final Decision Action Controls */}
        {!readOnly && (
          <div style={{
            borderTop: '1px solid #DDDCD4',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1b1c18', marginBottom: '4px' }}>
                  Lead Assessor Final Recommendation:
                </label>
                <select
                  value={finalDecision}
                  onChange={(e) => setFinalDecision(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #DDDCD4',
                    background: '#ffffff',
                    fontWeight: 600
                  }}
                >
                  <option value="RECOMMENDED_FOR_CERTIFICATION">RECOMMENDED FOR CERTIFICATION</option>
                  <option value="FURTHER_EVIDENCE_REQUIRED">FURTHER EVIDENCE REQUIRED</option>
                  <option value="NOT_YET_COMPETENT">NOT YET COMPETENT</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1b1c18', marginBottom: '4px' }}>
                  Comprehensive Assessment Remarks:
                </label>
                <input
                  type="text"
                  value={finalRemarks}
                  onChange={(e) => setFinalRemarks(e.target.value)}
                  placeholder="Summary validation remarks for credential record..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #DDDCD4',
                    background: '#ffffff'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '4px'
            }}>
              <p style={{ fontSize: '11px', color: '#5f6368', fontStyle: 'italic' }}>
                "Final assessment decision is the responsibility of the authorized assessor."
              </p>

              <button
                type="button"
                onClick={() => setConfirmFinalModal(true)}
                style={{
                  padding: '10px 22px',
                  background: '#176B68',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(23, 107, 104, 0.2)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified_user</span>
                Submit Final Assessor Decision
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Request More Evidence Modal (Section 9) */}
      {activeRequestModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(23, 33, 43, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#176B68' }}>
                Request Additional Evidence
              </h3>
              <button
                type="button"
                onClick={() => setActiveRequestModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#80868b' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#5f6368', marginBottom: '14px' }}>
              Unit: <strong>{activeRequestModal.competencyName}</strong> ({activeRequestModal.competencyCode})
            </p>

            <form onSubmit={handleSubmitEvidenceRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1b1c18', marginBottom: '4px' }}>
                  Required Evidence Description:
                </label>
                <input
                  type="text"
                  required
                  value={requestFormData.requiredEvidence}
                  onChange={(e) => setRequestFormData({ ...requestFormData, requiredEvidence: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #DDDCD4'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1b1c18', marginBottom: '4px' }}>
                  Specific Instructions / Task Request:
                </label>
                <textarea
                  rows={3}
                  required
                  value={requestFormData.message}
                  onChange={(e) => setRequestFormData({ ...requestFormData, message: e.target.value })}
                  placeholder="e.g. Please upload a short video demonstrating your normal safety procedure before beginning the task."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #DDDCD4'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1b1c18', marginBottom: '4px' }}>
                  Submission Deadline (Optional):
                </label>
                <input
                  type="date"
                  value={requestFormData.deadline}
                  onChange={(e) => setRequestFormData({ ...requestFormData, deadline: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #DDDCD4'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveRequestModal(null)}
                  style={{
                    padding: '8px 16px',
                    background: '#f0f3f6',
                    color: '#555f6b',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    background: '#176B68',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Send Request to Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Final Assessor Confirmation Modal (Section 13) */}
      {confirmFinalModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(23, 33, 43, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#176B68' }}>gavel</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1b1c18' }}>
                Confirm Final Assessment Decision
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#555f6b', lineHeight: 1.5, marginBottom: '14px' }}>
              You are about to record the final assessment evaluation for candidate <strong>{matrixData.workerName}</strong> under Qualification Pack <strong>{qp.trade}</strong> ({qp.qpCode}).
            </p>

            <div style={{
              background: '#fbf9f3',
              border: '1px solid #DDDCD4',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '12px',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div><strong>Decision:</strong> {finalDecision.replace(/_/g, ' ')}</div>
              <div><strong>Remarks:</strong> {finalRemarks || 'Verified by authorized lead assessor'}</div>
              <div><strong>Coverage:</strong> {coverage.coveragePercentage}% ({coverage.fullySupported} / {coverage.totalCompetencies} units)</div>
            </div>

            <p style={{ fontSize: '11px', color: '#80868b', fontStyle: 'italic', marginBottom: '18px' }}>
              "Final assessment decision is the responsibility of the authorized assessor. Audit log entries will be immutably recorded."
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={finalSubmitting}
                onClick={() => setConfirmFinalModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#f0f3f6',
                  color: '#555f6b',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={finalSubmitting}
                onClick={handleSubmitFinalDecision}
                style={{
                  padding: '8px 20px',
                  background: '#176B68',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {finalSubmitting ? 'Recording Decision...' : 'Confirm & Finalize'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
