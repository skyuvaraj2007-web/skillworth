import React from 'react';

const STANDARD_STAGES = [
  { key: 'APPLICATION_SUBMITTED', label: 'Application submitted', icon: 'description' },
  { key: 'EXPERIENCE_DECLARED', label: 'Experience declaration completed', icon: 'history_edu' },
  { key: 'QP_SELECTED', label: 'Qualification pathway selected', icon: 'school' },
  { key: 'EVIDENCE_SUBMITTED', label: 'Evidence submitted', icon: 'video_library' },
  { key: 'UNDER_REVIEW', label: 'Application reviewed', icon: 'fact_check' },
  { key: 'ASSESSOR_ASSIGNED', label: 'Assessor assigned', icon: 'badge' },
  { key: 'ASSESSMENT_SCHEDULED', label: 'Assessment scheduled', icon: 'event' },
  { key: 'UNDER_ASSESSMENT', label: 'Practical assessment', icon: 'construction' },
  { key: 'DECISION_SUBMITTED', label: 'Assessor decision', icon: 'gavel' },
  { key: 'RECOMMENDED_FOR_CERTIFICATION', label: 'RPL record generated', icon: 'verified' },
  { key: 'PASSPORT_UPDATED', label: 'Skill Passport updated', icon: 'workspace_premium' }
];

export default function RplApplicationTimeline({ application }) {
  if (!application) return null;

  const backendTimeline = application.timeline || [];
  const status = application.status;

  // Map backend stages to see what has occurred
  const getStageMatch = (stageKey) => {
    return backendTimeline.find(item => 
      item.stage === stageKey || 
      (stageKey === 'APPLICATION_SUBMITTED' && (item.stage === 'APPLICATION_CREATED' || item.stage === 'SUBMITTED')) ||
      (stageKey === 'QP_SELECTED' && item.stage === 'QP_SELECTED') ||
      (stageKey === 'EVIDENCE_SUBMITTED' && (item.stage === 'EVIDENCE_COLLECTION' || item.stage === 'EVIDENCE_SUBMITTED')) ||
      (stageKey === 'UNDER_REVIEW' && (item.stage === 'UNDER_REVIEW' || item.status === 'UNDER_REVIEW')) ||
      (stageKey === 'ASSESSOR_ASSIGNED' && (item.stage === 'ASSESSOR_ASSIGNED' || application.assignedAssessorId)) ||
      (stageKey === 'ASSESSMENT_SCHEDULED' && (item.stage === 'ASSESSMENT_SCHEDULED' || application.scheduledDate)) ||
      (stageKey === 'UNDER_ASSESSMENT' && (item.stage === 'UNDER_ASSESSMENT' || item.stage === 'ASSESSOR_REVIEW')) ||
      (stageKey === 'DECISION_SUBMITTED' && (item.stage === 'DECISION_SUBMITTED' || ['COMPLETED', 'RECOMMENDED_FOR_CERTIFICATION', 'NOT_YET_COMPETENT'].includes(item.status))) ||
      (stageKey === 'RECOMMENDED_FOR_CERTIFICATION' && (['RECOMMENDED_FOR_CERTIFICATION', 'COMPLETED'].includes(application.status) || Boolean(application.assessment?.credentialId))) ||
      (stageKey === 'PASSPORT_UPDATED' && (['RECOMMENDED_FOR_CERTIFICATION', 'COMPLETED'].includes(application.status)))
    );
  };

  // Determine current active stage index
  const determineStageState = (stageKey, index) => {
    const match = getStageMatch(stageKey);
    if (match) {
      return { state: 'COMPLETED', entry: match };
    }

    // Check if this is the current active stage based on application.status
    if (
      (stageKey === 'UNDER_REVIEW' && status === 'SUBMITTED') ||
      (stageKey === 'ASSESSOR_ASSIGNED' && ['UNDER_REVIEW', 'QP_SELECTED'].includes(status)) ||
      (stageKey === 'ASSESSMENT_SCHEDULED' && status === 'ASSESSOR_ASSIGNED') ||
      (stageKey === 'UNDER_ASSESSMENT' && status === 'ASSESSMENT_SCHEDULED') ||
      (stageKey === 'DECISION_SUBMITTED' && ['UNDER_ASSESSMENT', 'ASSESSOR_REVIEW', 'FURTHER_EVIDENCE_REQUIRED'].includes(status))
    ) {
      return { state: 'CURRENT', entry: null };
    }

    return { state: 'UPCOMING', entry: null };
  };

  return (
    <div className="sw-rpl-timeline-container" style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '15px', color: '#202124', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: '#1a73e8', fontSize: '20px' }}>timeline</span>
          RPL Application Lifecycle Timeline
        </h4>
        <span style={{ fontSize: '11px', color: '#5f6368', background: '#f1f3f4', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
          {application.applicationNumber}
        </span>
      </div>

      <div className="sw-vertical-timeline" style={{ position: 'relative', paddingLeft: '28px' }}>
        {/* Continuous vertical timeline connector line */}
        <div style={{
          position: 'absolute',
          top: '12px',
          bottom: '24px',
          left: '11px',
          width: '2px',
          background: '#e0e0e0',
          zIndex: 1
        }} />

        {STANDARD_STAGES.map((stage, idx) => {
          const { state, entry } = determineStageState(stage.key, idx);
          const isCompleted = state === 'COMPLETED';
          const isCurrent = state === 'CURRENT';

          return (
            <div 
              key={stage.key} 
              className="sw-timeline-node" 
              style={{
                position: 'relative',
                marginBottom: '20px',
                zIndex: 2
              }}
            >
              {/* Marker icon */}
              <div style={{
                position: 'absolute',
                left: '-28px',
                top: '0',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isCompleted ? '#137333' : isCurrent ? '#1a73e8' : '#ffffff',
                border: isCompleted ? '2px solid #137333' : isCurrent ? '2px solid #1a73e8' : '2px solid #dadce0',
                color: isCompleted || isCurrent ? '#ffffff' : '#80868b',
                boxShadow: isCurrent ? '0 0 0 4px rgba(26,115,232,0.18)' : 'none',
                transition: 'all 0.2s ease'
              }}>
                {isCompleted ? (
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', fontWeight: 700 }}>check</span>
                ) : isCurrent ? (
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', animation: 'spin 3s linear infinite' }}>sync</span>
                ) : (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dadce0' }} />
                )}
              </div>

              {/* Stage Content */}
              <div style={{
                background: isCurrent ? '#f8fafd' : '#ffffff',
                border: isCurrent ? '1px solid #c2e7ff' : '1px solid #f1f3f4',
                borderRadius: '8px',
                padding: '10px 14px',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: isCompleted || isCurrent ? 700 : 500,
                    color: isCompleted ? '#137333' : isCurrent ? '#1a73e8' : '#5f6368'
                  }}>
                    {stage.label}
                  </span>
                  {entry?.timestamp && (
                    <span style={{ fontSize: '11px', color: '#80868b' }}>
                      {new Date(entry.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>

                {entry && (
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#3c4043' }}>
                    <p style={{ margin: '0 0 2px 0' }}>{entry.description}</p>
                    {entry.actor && (
                      <span style={{ fontSize: '10px', color: '#5f6368', background: '#e8eaed', padding: '1px 6px', borderRadius: '4px' }}>
                        By: {entry.actor}
                      </span>
                    )}
                  </div>
                )}

                {isCurrent && !entry && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#1a73e8', fontWeight: 600 }}>
                    In progress • Awaiting next operational action
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
