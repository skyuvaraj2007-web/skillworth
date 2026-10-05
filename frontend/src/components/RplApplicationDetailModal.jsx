import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import RplApplicationTimeline from './RplApplicationTimeline';

export default function RplApplicationDetailModal({ applicationId, onClose, onOpenAssessment, onAssignAssessor, onSchedule }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await api.getRplApplication(applicationId);
      if (res && res.success) {
        setApplication(res.application);
      } else {
        setError(res?.message || 'Failed to load application dossier.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      loadDetail();
    }
  }, [applicationId]);

  if (!applicationId) return null;

  return (
    <div className="sw-modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(32, 33, 36, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div className="sw-modal-card" style={{
        background: '#ffffff',
        borderRadius: '12px',
        width: '900px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
        border: '1px solid #dadce0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e8eaed',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8f9fa'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="material-symbols-outlined" style={{ color: '#1a73e8', fontSize: '24px' }}>assignment</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#202124', fontWeight: 700 }}>
                RPL Application Dossier • {application?.applicationNumber || 'Loading...'}
              </h3>
            </div>
            {application && (
              <span style={{ fontSize: '12px', color: '#5f6368', marginTop: '2px', display: 'block' }}>
                Trade: <strong>{application.occupation}</strong> (NSQF Level {application.nsqfLevel}) • Submitted on {new Date(application.createdAt).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#5f6368' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', animation: 'spin 1.5s linear infinite' }}>sync</span>
              <p style={{ marginTop: '12px' }}>Loading complete application details...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '20px', background: '#fce8e6', color: '#c5221f', borderRadius: '8px' }}>
              {error}
            </div>
          ) : application ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Operational Status & Reminder Banner */}
              <div style={{
                background: application.priority?.priority === 'URGENT' ? '#fce8e6' : application.priority?.priority === 'HIGH' ? '#fef7e0' : '#e8f0fe',
                border: `1px solid ${application.priority?.color || '#1a73e8'}`,
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="material-symbols-outlined" style={{ color: application.priority?.color, fontSize: '26px' }}>
                    {application.priority?.priority === 'URGENT' ? 'alarm' : 'verified_user'}
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '15px', color: '#202124' }}>Status: {application.status?.replace(/_/g, ' ')}</strong>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: application.priority?.color,
                        color: '#ffffff',
                        fontWeight: 700
                      }}>
                        {application.priority?.priority} PRIORITY
                      </span>
                    </div>
                    {application.reminders && (
                      <span style={{ fontSize: '12px', color: '#3c4043', fontWeight: 600 }}>
                        ⏳ {application.reminders.reminder}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {onAssignAssessor && (
                    <button
                      onClick={() => onAssignAssessor(application)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid #1a73e8',
                        background: '#ffffff',
                        color: '#1a73e8',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {application.assignedAssessorId ? 'Change Assessor' : 'Assign Assessor'}
                    </button>
                  )}
                  {onSchedule && (
                    <button
                      onClick={() => onSchedule(application, application.scheduledDate ? 'RESCHEDULE' : 'SCHEDULE')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#1a73e8',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {application.scheduledDate ? 'Reschedule' : 'Schedule Assessment'}
                    </button>
                  )}
                  {application.assessmentId && onOpenAssessment && (
                    <button
                      onClick={() => onOpenAssessment(application.assessmentId)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#137333',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Open Assessment Workspace
                    </button>
                  )}
                </div>
              </div>

              {/* Grid: Worker & Logistics details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '14px', border: '1px solid #e8eaed' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Candidate Information
                  </h4>
                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><span style={{ color: '#5f6368' }}>Full Name:</span> <strong>{application.learnerName}</strong></div>
                    <div><span style={{ color: '#5f6368' }}>Candidate ID:</span> <code>{application.learnerId}</code></div>
                    <div><span style={{ color: '#5f6368' }}>Application ID:</span> <strong>{application.applicationNumber}</strong></div>
                  </div>
                </div>

                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '14px', border: '1px solid #e8eaed' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Qualification Pathway
                  </h4>
                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><span style={{ color: '#5f6368' }}>Occupation:</span> <strong>{application.occupation}</strong></div>
                    <div><span style={{ color: '#5f6368' }}>QP Code:</span> <strong>{application.qualificationPackCode || 'QP-CON-Q0103'}</strong></div>
                    <div><span style={{ color: '#5f6368' }}>NSQF Level:</span> <strong>Level {application.nsqfLevel}</strong></div>
                  </div>
                </div>

                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '14px', border: '1px solid #e8eaed' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Assessment Logistics
                  </h4>
                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><span style={{ color: '#5f6368' }}>Lead Assessor:</span> <strong>{application.assignedAssessorName || 'Not yet assigned'}</strong></div>
                    <div><span style={{ color: '#5f6368' }}>Centre:</span> <strong>{application.assessmentCentreName || 'Pending scheduling'}</strong></div>
                    <div>
                      <span style={{ color: '#5f6368' }}>Schedule:</span>{' '}
                      <strong>{application.scheduledDate ? `${application.scheduledDate} at ${application.scheduledTime}` : 'Unscheduled'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Lifecycle Timeline */}
              <div style={{ background: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed' }}>
                <RplApplicationTimeline application={application} />
              </div>

              {/* Audit Trail Section */}
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#202124', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#5f6368' }}>history</span>
                  Audit Trail & Operational Events
                </h4>
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(application.auditLogs || []).length === 0 ? (
                    <span style={{ fontSize: '12px', color: '#70757a' }}>No audit entries recorded yet.</span>
                  ) : (
                    (application.auditLogs || []).map((log, i) => (
                      <div key={log.id || i} style={{ fontSize: '12px', padding: '6px 10px', background: '#ffffff', borderRadius: '6px', border: '1px solid #dadce0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <strong style={{ color: '#1a73e8' }}>{log.action}</strong>
                          <span style={{ color: '#80868b' }}>{new Date(log.timestamp).toLocaleString('en-GB')}</span>
                        </div>
                        <div style={{ color: '#3c4043' }}>{log.details}</div>
                        <div style={{ color: '#70757a', fontSize: '11px', marginTop: '2px' }}>Actor: {log.userName}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
