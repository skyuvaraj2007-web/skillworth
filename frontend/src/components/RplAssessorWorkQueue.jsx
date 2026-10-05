import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function RplAssessorWorkQueue({ onSelectAssessment }) {
  const [queueData, setQueueData] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getAssessorWorkQueue();
      if (res && res.success) {
        setQueueData(res);
      } else {
        setError(res?.message || 'Failed to load assessor work queue.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const getFilteredItems = () => {
    if (!queueData) return [];
    if (activeTab === 'ALL') return queueData.queue || [];
    return queueData.grouped?.[activeTab] || [];
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="sw-assessor-work-queue" style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#202124', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: '#1a73e8', fontSize: '28px' }}>assignment_ind</span>
            Assessor Assessment Queue
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5f6368' }}>
            Operational workload prioritized deterministically by assessment schedule urgency & evidence completion
          </p>
        </div>
        <button
          onClick={loadQueue}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid #dadce0',
            background: '#ffffff',
            color: '#3c4043',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
          Refresh Queue
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #dadce0',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { key: 'ALL', label: 'All Candidates', count: queueData?.totalCount || 0 },
          { key: 'todayAssessments', label: "Today's Assessments", count: queueData?.grouped?.todayAssessments?.length || 0, urgent: true },
          { key: 'pendingReview', label: 'Pending Review', count: queueData?.grouped?.pendingReview?.length || 0 },
          { key: 'evidencePending', label: 'Evidence Pending', count: queueData?.grouped?.evidencePending?.length || 0 },
          { key: 'upcoming', label: 'Upcoming', count: queueData?.grouped?.upcoming?.length || 0 },
          { key: 'awaitingDecision', label: 'Awaiting Decision', count: queueData?.grouped?.awaitingDecision?.length || 0 },
          { key: 'completed', label: 'Completed', count: queueData?.grouped?.completed?.length || 0 }
        ].map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid #1a73e8' : '3px solid transparent',
                color: isActive ? '#1a73e8' : '#5f6368',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                background: tab.urgent && tab.count > 0 ? '#ea4335' : isActive ? '#e8f0fe' : '#f1f3f4',
                color: tab.urgent && tab.count > 0 ? '#ffffff' : isActive ? '#1a73e8' : '#5f6368',
                fontWeight: 700
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#5f6368' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', animation: 'spin 1.5s linear infinite' }}>sync</span>
          <p style={{ marginTop: '12px' }}>Loading assessor queue...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '20px', background: '#fce8e6', color: '#c5221f', borderRadius: '8px' }}>
          {error}
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #e8eaed'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#bdc1c6', marginBottom: '12px' }}>inbox</span>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#202124' }}>No candidates in this queue view</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#70757a' }}>
            All assessments in this category have been processed or none are currently scheduled.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
          {filteredItems.map(item => (
            <div
              key={item.id}
              style={{
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #dadce0',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(60,64,67,0.08)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(60,64,67,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(60,64,67,0.08)';
              }}
            >
              <div>
                {/* Card Top: Priority & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: item.priority === 'URGENT' ? '#fce8e6' : item.priority === 'HIGH' ? '#fef7e0' : '#e8f0fe',
                    color: item.priorityColor || '#1a73e8',
                    fontWeight: 700,
                    border: `1px solid ${item.priorityColor || '#1a73e8'}`
                  }}>
                    {item.priority} PRIORITY
                  </span>
                  <span style={{
                    fontSize: '11px',
                    background: item.status === 'COMPLETED' ? '#e6f4ea' : '#f1f3f4',
                    color: item.status === 'COMPLETED' ? '#137333' : '#3c4043',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    {item.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Candidate Name & Trade */}
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#202124', fontWeight: 700 }}>
                    {item.workerName}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#5f6368', display: 'block', marginTop: '2px' }}>
                    Candidate ID: <code>{item.workerId}</code> • App: <strong>{item.applicationNumber}</strong>
                  </span>
                </div>

                {/* Qualification & Logistics Info */}
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  marginBottom: '14px'
                }}>
                  <div>
                    <span style={{ color: '#5f6368' }}>Trade / Role:</span>{' '}
                    <strong style={{ color: '#202124' }}>{item.occupation} (NSQF L{item.nsqfLevel})</strong>
                  </div>
                  <div>
                    <span style={{ color: '#5f6368' }}>QP Code:</span>{' '}
                    <code>{item.qualificationPackCode}</code>
                  </div>
                  <div>
                    <span style={{ color: '#5f6368' }}>Assessment Date:</span>{' '}
                    <strong style={{ color: item.scheduledDate ? '#1a73e8' : '#70757a' }}>
                      {item.scheduledDate ? `${item.scheduledDate} (${item.scheduledTime || 'Scheduled'})` : 'Unscheduled'}
                    </strong>
                  </div>
                  {item.assessmentCentre && (
                    <div>
                      <span style={{ color: '#5f6368' }}>Centre:</span>{' '}
                      <span style={{ color: '#3c4043' }}>{item.assessmentCentre}</span>
                    </div>
                  )}
                  {item.reminders && (
                    <div style={{ color: item.reminders.urgency === 'URGENT' ? '#ea4335' : '#b06000', fontWeight: 600 }}>
                      ⏳ {item.reminders.reminder}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f3f4' }}>
                <span style={{ fontSize: '11px', color: '#5f6368' }}>
                  {item.evidenceCount} evidence item(s)
                </span>
                <button
                  onClick={() => onSelectAssessment(item.assessmentId || item.id)}
                  style={{
                    padding: '8px 16px',
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
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                  Open Assessment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
