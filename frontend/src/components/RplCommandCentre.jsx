import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import AssessmentScheduleModal from './AssessmentScheduleModal';
import AssessorAssignmentModal from './AssessorAssignmentModal';
import RplApplicationDetailModal from './RplApplicationDetailModal';

export default function RplCommandCentre({ onOpenAssessment }) {
  const [overview, setOverview] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [occupationFilter, setOccupationFilter] = useState('');

  // Modal states
  const [selectedAppForDetail, setSelectedAppForDetail] = useState(null);
  const [selectedAppForAssign, setSelectedAppForAssign] = useState(null);
  const [selectedAppForSchedule, setSelectedAppForSchedule] = useState(null);
  const [scheduleModalMode, setScheduleModalMode] = useState('SCHEDULE');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovRes, appsRes] = await Promise.all([
        api.getInstitutionRplOverview(),
        api.getAllRplApplications({
          search: searchTerm,
          status: statusFilter,
          occupation: occupationFilter
        })
      ]);

      if (ovRes && ovRes.success) setOverview(ovRes.overview);
      if (appsRes && appsRes.success) setApplications(appsRes.applications || []);
    } catch (err) {
      setError(err.message || 'Error loading command centre data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, occupationFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenSchedule = (app, mode = 'SCHEDULE') => {
    setSelectedAppForSchedule(app);
    setScheduleModalMode(mode);
  };

  return (
    <div className="sw-rpl-command-centre" style={{ padding: '24px 0' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#202124', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: '#1a73e8', fontSize: '30px' }}>hub</span>
            RPL Command Centre & Operations Queue
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5f6368' }}>
            Real-time RPL candidate pipeline, assessor dispatching, and assessment centre slot scheduling
          </p>
        </div>
        <button
          onClick={loadData}
          style={{
            padding: '8px 16px',
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
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards (Real Database Values) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '12px',
        marginBottom: '28px'
      }}>
        {[
          { label: 'Applications', value: overview?.totalApplications ?? 0, color: '#1a73e8', icon: 'description' },
          { label: 'Under Review', value: overview?.underReview ?? 0, color: '#f2994a', icon: 'manage_search' },
          { label: 'Evidence Pending', value: overview?.evidencePending ?? 0, color: '#e37400', icon: 'pending_actions' },
          { label: 'Assessor Assigned', value: overview?.assessorAssigned ?? 0, color: '#5f6368', icon: 'assignment_ind' },
          { label: 'Scheduled', value: overview?.scheduled ?? 0, color: '#1a73e8', icon: 'event' },
          { label: "Today's Assessments", value: overview?.todayAssessments ?? 0, color: '#ea4335', icon: 'alarm', urgent: true },
          { label: 'Awaiting Decision', value: overview?.awaitingDecision ?? 0, color: '#9334e6', icon: 'gavel' },
          { label: 'Completed', value: overview?.completed ?? 0, color: '#137333', icon: 'verified' }
        ].map((kpi, idx) => (
          <div
            key={idx}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              border: kpi.urgent && kpi.value > 0 ? '2px solid #ea4335' : '1px solid #dadce0',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(60,64,67,0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#5f6368', fontWeight: 600 }}>{kpi.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: kpi.color }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: kpi.color }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Review Queue Filters & Search */}
      <div style={{
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #dadce0',
        padding: '18px 20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(60,64,67,0.08)'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '9px', fontSize: '18px', color: '#5f6368' }}>search</span>
            <input
              type="text"
              placeholder="Search by worker name, application number, occupation, QP code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '6px',
                border: '1px solid #dadce0',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #dadce0',
                fontSize: '13px',
                background: '#ffffff'
              }}
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="EVIDENCE_COLLECTION">Evidence Collection</option>
              <option value="FURTHER_EVIDENCE_REQUIRED">Further Evidence Required</option>
              <option value="ASSESSOR_ASSIGNED">Assessor Assigned</option>
              <option value="ASSESSMENT_SCHEDULED">Assessment Scheduled</option>
              <option value="UNDER_ASSESSMENT">Under Assessment</option>
              <option value="RECOMMENDED_FOR_CERTIFICATION">Recommended for Certification</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#1a73e8',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Apply Filters
          </button>

          {(searchTerm || statusFilter || occupationFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setOccupationFilter('');
                setTimeout(loadData, 50);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #dadce0',
                background: '#ffffff',
                color: '#5f6368',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Review Queue Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #dadce0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(60,64,67,0.08)'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8eaed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#202124', fontWeight: 700 }}>
            Application Review Queue ({applications.length})
          </h3>
          <span style={{ fontSize: '12px', color: '#5f6368' }}>
            Strict Role-Based Operations & Verified Audit Records
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#5f6368' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', animation: 'spin 1.5s linear infinite' }}>sync</span>
            <p style={{ marginTop: '10px' }}>Loading application queue...</p>
          </div>
        ) : applications.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#70757a' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '42px', color: '#bdc1c6', marginBottom: '8px' }}>find_in_page</span>
            <p style={{ margin: 0, fontSize: '14px' }}>No RPL applications match current filter criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e8eaed', color: '#5f6368', fontWeight: 600 }}>
                  <th style={{ padding: '12px 16px' }}>App ID</th>
                  <th style={{ padding: '12px 16px' }}>Candidate</th>
                  <th style={{ padding: '12px 16px' }}>Occupation & QP</th>
                  <th style={{ padding: '12px 16px' }}>NSQF</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Assessor</th>
                  <th style={{ padding: '12px 16px' }}>Assessment Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr 
                    key={app.id} 
                    style={{ borderBottom: '1px solid #f1f3f4', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafd'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <strong style={{ color: '#1a73e8' }}>{app.applicationNumber}</strong>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <strong style={{ color: '#202124' }}>{app.learnerName}</strong>
                      <div style={{ fontSize: '11px', color: '#80868b' }}><code>{app.learnerId}</code></div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div>{app.occupation}</div>
                      <div style={{ fontSize: '11px', color: '#5f6368' }}><code>{app.qualificationPackCode || 'N/A'}</code></div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#e8eaed', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        L{app.nsqfLevel}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: app.status === 'COMPLETED' ? '#e6f4ea' : app.status === 'FURTHER_EVIDENCE_REQUIRED' ? '#fef7e0' : app.status === 'CANCELLED' ? '#fce8e6' : '#e8f0fe',
                        color: app.status === 'COMPLETED' ? '#137333' : app.status === 'FURTHER_EVIDENCE_REQUIRED' ? '#b06000' : app.status === 'CANCELLED' ? '#c5221f' : '#1a73e8',
                        fontWeight: 600
                      }}>
                        {app.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#3c4043' }}>
                      {app.assignedAssessorName ? (
                        <span>{app.assignedAssessorName}</span>
                      ) : (
                        <span style={{ color: '#80868b', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {app.scheduledDate ? (
                        <div>
                          <strong>{app.scheduledDate}</strong>
                          <div style={{ fontSize: '11px', color: '#5f6368' }}>{app.scheduledTime}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#80868b' }}>Pending</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => setSelectedAppForDetail(app.id)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '4px',
                            border: '1px solid #dadce0',
                            background: '#ffffff',
                            color: '#1a73e8',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          title="Open Application Dossier"
                        >
                          Open
                        </button>

                        <button
                          onClick={() => setSelectedAppForAssign(app)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '4px',
                            border: '1px solid #dadce0',
                            background: '#ffffff',
                            color: '#3c4043',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                          title="Assign Assessor"
                        >
                          Assign
                        </button>

                        <button
                          onClick={() => handleOpenSchedule(app, app.scheduledDate ? 'RESCHEDULE' : 'SCHEDULE')}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '4px',
                            border: '1px solid #dadce0',
                            background: '#ffffff',
                            color: '#3c4043',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                          title={app.scheduledDate ? 'Reschedule Assessment' : 'Schedule Assessment'}
                        >
                          {app.scheduledDate ? 'Reschedule' : 'Schedule'}
                        </button>

                        {app.scheduledDate && app.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleOpenSchedule(app, 'CANCEL')}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid #fad2cf',
                              background: '#ffffff',
                              color: '#ea4335',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            title="Cancel Assessment"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedAppForDetail && (
        <RplApplicationDetailModal
          applicationId={selectedAppForDetail}
          onClose={() => setSelectedAppForDetail(null)}
          onOpenAssessment={(asmId) => {
            setSelectedAppForDetail(null);
            if (onOpenAssessment) onOpenAssessment(asmId);
          }}
          onAssignAssessor={(app) => {
            setSelectedAppForDetail(null);
            setSelectedAppForAssign(app);
          }}
          onSchedule={(app, mode) => {
            setSelectedAppForDetail(null);
            handleOpenSchedule(app, mode);
          }}
        />
      )}

      {selectedAppForAssign && (
        <AssessorAssignmentModal
          application={selectedAppForAssign}
          onClose={() => setSelectedAppForAssign(null)}
          onSuccess={(updatedApp) => {
            setSelectedAppForAssign(null);
            loadData();
          }}
        />
      )}

      {selectedAppForSchedule && (
        <AssessmentScheduleModal
          application={selectedAppForSchedule}
          mode={scheduleModalMode}
          onClose={() => setSelectedAppForSchedule(null)}
          onSuccess={(updatedApp) => {
            setSelectedAppForSchedule(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
