import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AssessmentScheduleModal({ application, mode = 'SCHEDULE', onClose, onSuccess }) {
  const [centres, setCentres] = useState([]);
  const [assessors, setAssessors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conflictWarning, setConflictWarning] = useState('');

  const [formData, setFormData] = useState({
    date: application?.scheduledDate || '',
    time: application?.scheduledTime || '10:00 AM',
    endTime: application?.scheduledEndTime || '12:30 PM',
    assessmentCentreId: application?.assessmentCentreId || '',
    assessorId: application?.assignedAssessorId || '',
    assessorName: application?.assignedAssessorName || '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, uRes] = await Promise.all([
          api.getAssessmentCentres(),
          api.getPendingReviews().catch(() => ({ assessors: [] }))
        ]);
        if (cRes && cRes.success) {
          setCentres(cRes.assessmentCentres || []);
          if (!formData.assessmentCentreId && cRes.assessmentCentres.length > 0) {
            setFormData(prev => ({ ...prev, assessmentCentreId: cRes.assessmentCentres[0].id }));
          }
        }
        // Load assessors from demo users or default
        setAssessors([
          { id: 'usr_demo_assessor_01', name: 'Dr. S. Meenakshi Sundaram', role: 'ISO 17024 Lead Evaluator', activeCount: 2 },
          { id: 'ASSR-02', name: 'Prof. K. Raghavan', role: 'Master Vocational Assessor', activeCount: 1 },
          { id: 'ASSR-03', name: 'M. Anandhi', role: 'Technical Evaluator (Automotive & Welder)', activeCount: 3 }
        ]);
        if (!formData.assessorId) {
          setFormData(prev => ({ 
            ...prev, 
            assessorId: 'usr_demo_assessor_01',
            assessorName: 'Dr. S. Meenakshi Sundaram'
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, [application]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setConflictWarning('');
    setLoading(true);

    try {
      if (mode === 'SCHEDULE') {
        const res = await api.scheduleRplAssessment(application.id, {
          scheduledDate: formData.date,
          scheduledTime: formData.time,
          scheduledEndTime: formData.endTime,
          assessmentCentreId: formData.assessmentCentreId,
          assessorId: formData.assessorId,
          assessorName: formData.assessorName,
          notes: formData.notes
        });

        if (res && res.success) {
          onSuccess(res.application);
        } else {
          if (res?.conflict) {
            setConflictWarning(res.message || 'ASSESSMENT SLOT CONFLICT: This assessor already has an assessment at this time.');
          } else {
            setError(res?.message || 'Failed to schedule assessment.');
          }
        }
      } else if (mode === 'RESCHEDULE') {
        if (!formData.reason.trim()) {
          setError('Rescheduling reason is mandatory for audit transparency.');
          setLoading(false);
          return;
        }

        const res = await api.rescheduleRplAssessment(application.id, {
          newDate: formData.date,
          newTime: formData.time,
          reason: formData.reason
        });

        if (res && res.success) {
          onSuccess(res.application);
        } else {
          if (res?.conflict) {
            setConflictWarning(res.message || 'ASSESSMENT SLOT CONFLICT: This assessor already has an assessment at this time.');
          } else {
            setError(res?.message || 'Failed to reschedule assessment.');
          }
        }
      } else if (mode === 'CANCEL') {
        if (!formData.reason.trim()) {
          setError('Cancellation reason is mandatory.');
          setLoading(false);
          return;
        }

        const res = await api.cancelRplAssessment(application.id, {
          reason: formData.reason
        });

        if (res && res.success) {
          onSuccess(res.application);
        } else {
          setError(res?.message || 'Failed to cancel assessment.');
        }
      }
    } catch (err) {
      setError(err.message || 'Server communication error.');
    } finally {
      setLoading(false);
    }
  };

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
      padding: '16px'
    }}>
      <div className="sw-modal-card" style={{
        background: '#ffffff',
        borderRadius: '12px',
        width: '560px',
        maxWidth: '100%',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
        border: '1px solid #dadce0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e8eaed',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8f9fa'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', color: '#202124', fontWeight: 700 }}>
              {mode === 'SCHEDULE' && 'Schedule Practical Assessment'}
              {mode === 'RESCHEDULE' && 'Reschedule Assessment Slot'}
              {mode === 'CANCEL' && 'Cancel Scheduled Assessment'}
            </h3>
            <span style={{ fontSize: '12px', color: '#5f6368' }}>
              Candidate: <strong>{application?.learnerName}</strong> • {application?.applicationNumber}
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368' }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && (
            <div style={{
              background: '#fce8e6',
              color: '#c5221f',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
              <span>{error}</span>
            </div>
          )}

          {conflictWarning && (
            <div style={{
              background: '#fef7e0',
              border: '1px solid #f9ab00',
              color: '#b06000',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#e37400' }}>warning</span>
              <div>
                <strong>ASSESSMENT SLOT CONFLICT</strong>
                <p style={{ margin: '4px 0 0 0' }}>{conflictWarning}</p>
                <span style={{ fontSize: '11px', color: '#7a4200' }}>Please select a different date or time slot to prevent double-booking.</span>
              </div>
            </div>
          )}

          {mode !== 'CANCEL' ? (
            <>
              {/* Centre Selection */}
              {mode === 'SCHEDULE' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3c4043', marginBottom: '6px' }}>
                    Assessment Centre
                  </label>
                  <select
                    value={formData.assessmentCentreId}
                    onChange={(e) => setFormData({ ...formData, assessmentCentreId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dadce0',
                      fontSize: '13px'
                    }}
                    required
                  >
                    {centres.map(c => (
                      <option key={c.id} value={c.id} disabled={!c.active}>
                        {c.name} ({c.district}, {c.state}) — Capacity: {c.capacity} {!c.active ? '[INACTIVE]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Assessor Selection */}
              {mode === 'SCHEDULE' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3c4043', marginBottom: '6px' }}>
                    Assigned Lead Assessor
                  </label>
                  <select
                    value={formData.assessorId}
                    onChange={(e) => {
                      const ass = assessors.find(a => a.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        assessorId: e.target.value,
                        assessorName: ass?.name || ''
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dadce0',
                      fontSize: '13px'
                    }}
                    required
                  >
                    {assessors.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} • {a.role} ({a.activeCount} active assessments)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3c4043', marginBottom: '6px' }}>
                    {mode === 'RESCHEDULE' ? 'New Date' : 'Assessment Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dadce0',
                      fontSize: '13px'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3c4043', marginBottom: '6px' }}>
                    {mode === 'RESCHEDULE' ? 'New Start Time' : 'Start Time'}
                  </label>
                  <input
                    type="text"
                    value={formData.time}
                    placeholder="e.g. 10:00 AM"
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dadce0',
                      fontSize: '13px'
                    }}
                    required
                  />
                </div>
              </div>

              {mode === 'RESCHEDULE' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#c5221f', marginBottom: '6px' }}>
                    Mandatory Reason for Rescheduling *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="State reason (e.g. candidate requested shift, assessor availability change, workshop maintenance)..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dadce0',
                      fontSize: '13px'
                    }}
                    required
                  />
                </div>
              )}

              {mode === 'SCHEDULE' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3c4043', marginBottom: '6px' }}>
                    Assessment Logistics Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Safety shoes & PPE mandatory in practical bay"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #dadce0',
                      fontSize: '13px'
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#fce8e6', borderRadius: '8px', marginBottom: '16px', color: '#c5221f', fontSize: '13px' }}>
                <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '6px' }}>warning</span>
                Cancelling this assessment will notify both the worker and assessor. The record and its complete audit history will be preserved.
              </div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#c5221f', marginBottom: '6px' }}>
                Mandatory Cancellation Reason *
              </label>
              <textarea
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="State precise reason for assessment cancellation..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dadce0',
                  fontSize: '13px'
                }}
                required
              />
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #dadce0',
                background: '#ffffff',
                color: '#3c4043',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                background: mode === 'CANCEL' ? '#ea4335' : '#1a73e8',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {loading && <span className="material-symbols-outlined" style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }}>sync</span>}
              {mode === 'SCHEDULE' && 'Confirm Schedule'}
              {mode === 'RESCHEDULE' && 'Save New Schedule'}
              {mode === 'CANCEL' && 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
