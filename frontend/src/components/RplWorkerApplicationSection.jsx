import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import RplApplicationTimeline from './RplApplicationTimeline';
import RplApplicationDetailModal from './RplApplicationDetailModal';

export default function RplWorkerApplicationSection({ onOpenAssessment, onStartRpl }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppId, setSelectedAppId] = useState(null);

  const loadMyApplications = async () => {
    setLoading(true);
    try {
      const res = await api.getMyRplApplications();
      if (res && res.success) {
        setApplications(res.applications || []);
      }
    } catch (err) {
      setError(err.message || 'Error loading applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyApplications();
  }, []);

  const activeApp = applications.length > 0 ? applications[0] : null;

  return (
    <div className="sw-worker-rpl-application-section" style={{ marginBottom: '24px' }}>
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#5f6368', background: '#ffffff', borderRadius: '10px', border: '1px solid #dadce0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px', animation: 'spin 1.5s linear infinite' }}>sync</span>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>Loading your RPL applications...</p>
        </div>
      ) : !activeApp ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #dadce0',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="material-symbols-outlined" style={{ color: '#1a73e8', fontSize: '24px' }}>history_edu</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#202124', fontWeight: 700 }}>Recognition of Prior Learning (RPL)</h3>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#5f6368' }}>
              You have not started an RPL application yet. Declare your informal work experience and gain formal recognition.
            </p>
          </div>
          <button
            onClick={onStartRpl}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: '#1a73e8',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
            Start RPL Application
          </button>
        </div>
      ) : (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #dadce0',
          boxShadow: '0 1px 3px rgba(60,64,67,0.08)',
          overflow: 'hidden'
        }}>
          {/* Header Bar */}
          <div style={{
            padding: '16px 20px',
            background: '#fafbfc',
            borderBottom: '1px solid #e8eaed',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="material-symbols-outlined" style={{ color: '#1a73e8', fontSize: '24px' }}>verified</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#202124', fontWeight: 700 }}>
                  MY RPL APPLICATION • <span style={{ color: '#1a73e8' }}>{activeApp.applicationNumber}</span>
                </h3>
                <span style={{ fontSize: '12px', color: '#5f6368' }}>
                  {activeApp.occupation} • NSQF Level {activeApp.nsqfLevel}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '12px',
                background: activeApp.status === 'COMPLETED' ? '#e6f4ea' : activeApp.status === 'FURTHER_EVIDENCE_REQUIRED' ? '#fef7e0' : '#e8f0fe',
                color: activeApp.status === 'COMPLETED' ? '#137333' : activeApp.status === 'FURTHER_EVIDENCE_REQUIRED' ? '#b06000' : '#1a73e8',
                fontWeight: 700,
                border: '1px solid currentColor'
              }}>
                {activeApp.status?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Operational Urgency / Reminder Banner */}
          {activeApp.reminders && (
            <div style={{
              background: activeApp.reminders.urgency === 'URGENT' ? '#fce8e6' : '#fef7e0',
              padding: '10px 20px',
              borderBottom: '1px solid #f1f3f4',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              fontWeight: 600,
              color: activeApp.reminders.urgency === 'URGENT' ? '#c5221f' : '#b06000'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {activeApp.reminders.urgency === 'URGENT' ? 'alarm' : 'schedule'}
              </span>
              <span>Assessment Notice: {activeApp.reminders.reminder}</span>
            </div>
          )}

          {/* Evidence Request Banner */}
          {activeApp.status === 'FURTHER_EVIDENCE_REQUIRED' && (
            <div style={{
              background: '#fef7e0',
              borderBottom: '1px solid #f9ab00',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: '#e37400', fontSize: '22px' }}>warning</span>
                <div>
                  <strong style={{ fontSize: '13px', color: '#b06000' }}>ADDITIONAL EVIDENCE REQUIRED</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#7a4200' }}>
                    Your assessor has requested additional video/photo evidence before evaluation can proceed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenAssessment(activeApp.assessmentId)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#e37400',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Upload Required Evidence
              </button>
            </div>
          )}

          {/* Logistics Grid */}
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#f8f9fa', padding: '12px 14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#5f6368', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Assigned Assessor
              </span>
              <strong style={{ fontSize: '14px', color: '#202124' }}>
                {activeApp.assignedAssessorName || 'Assessor assignment in progress'}
              </strong>
            </div>

            <div style={{ background: '#f8f9fa', padding: '12px 14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#5f6368', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Assessment Centre
              </span>
              <strong style={{ fontSize: '14px', color: '#202124' }}>
                {activeApp.assessmentCentreName || 'Pending scheduling'}
              </strong>
            </div>

            <div style={{ background: '#f8f9fa', padding: '12px 14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#5f6368', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Date & Time
              </span>
              <strong style={{ fontSize: '14px', color: '#202124' }}>
                {activeApp.scheduledDate ? `${activeApp.scheduledDate} • ${activeApp.scheduledTime}` : 'To be scheduled'}
              </strong>
            </div>

            <div style={{ background: '#f8f9fa', padding: '12px 14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#5f6368', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Evidence Submitted
              </span>
              <strong style={{ fontSize: '14px', color: '#137333' }}>
                {activeApp.evidenceCount} item(s) in portfolio
              </strong>
            </div>
          </div>

          {/* Action Row */}
          <div style={{
            padding: '12px 20px',
            background: '#fafbfc',
            borderTop: '1px solid #e8eaed',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setSelectedAppId(activeApp.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #dadce0',
                background: '#ffffff',
                color: '#1a73e8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
              View Application Details & Timeline
            </button>

            <button
              onClick={() => onOpenAssessment(activeApp.assessmentId)}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                background: '#1a73e8',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>construction</span>
              Open Assessment Workspace
            </button>
          </div>
        </div>
      )}

      {selectedAppId && (
        <RplApplicationDetailModal
          applicationId={selectedAppId}
          onClose={() => setSelectedAppId(null)}
          onOpenAssessment={(asmId) => {
            setSelectedAppId(null);
            if (onOpenAssessment) onOpenAssessment(asmId);
          }}
        />
      )}
    </div>
  );
}
