import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AssessorAssignmentModal({ application, onClose, onSuccess }) {
  const [selectedAssessorId, setSelectedAssessorId] = useState(application?.assignedAssessorId || 'usr_demo_assessor_01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const assessors = [
    {
      id: 'usr_demo_assessor_01',
      name: 'Dr. S. Meenakshi Sundaram',
      designation: 'Professor & ISO 17024 Lead Evaluator',
      accreditation: 'Accredited Master Assessor',
      supportedSectors: ['Software & IT', 'Electronics & Hardware', 'Construction'],
      activeCount: 2,
      availability: 'AVAILABLE'
    },
    {
      id: 'ASSR-02',
      name: 'Prof. K. Raghavan',
      designation: 'Senior Technical Evaluator',
      accreditation: 'National Vocational Assessor Certified',
      supportedSectors: ['Construction & Carpentry', 'Welding & Fabrication', 'Plumbing'],
      activeCount: 1,
      availability: 'AVAILABLE'
    },
    {
      id: 'ASSR-03',
      name: 'M. Anandhi',
      designation: 'Industrial Skills Testing Lead',
      accreditation: 'Sector Skill Council Certified',
      supportedSectors: ['Automotive Repairs', 'Welding', 'Renewable Solar'],
      activeCount: 3,
      availability: 'BUSY_SLOTS'
    }
  ];

  const handleAssign = async () => {
    setError('');
    setLoading(true);
    const selected = assessors.find(a => a.id === selectedAssessorId);
    try {
      const res = await api.assignRplAssessor(application.id, {
        assessorId: selectedAssessorId,
        assessorName: selected?.name || 'Authorized Lead Assessor'
      });
      if (res && res.success) {
        onSuccess(res.application);
      } else {
        setError(res?.message || 'Failed to assign assessor.');
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
        width: '540px',
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
              Assign RPL Lead Assessor
            </h3>
            <span style={{ fontSize: '12px', color: '#5f6368' }}>
              Institution Assessment Operations
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Target Application Meta */}
          <div style={{
            background: '#f8fafd',
            border: '1px solid #e8f0fe',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#5f6368' }}>Candidate:</span>{' '}
                <strong style={{ color: '#202124' }}>{application?.learnerName}</strong>
              </div>
              <div>
                <span style={{ color: '#5f6368' }}>Application No:</span>{' '}
                <strong style={{ color: '#1a73e8' }}>{application?.applicationNumber}</strong>
              </div>
              <div>
                <span style={{ color: '#5f6368' }}>Occupation:</span>{' '}
                <strong style={{ color: '#202124' }}>{application?.occupation}</strong>
              </div>
              <div>
                <span style={{ color: '#5f6368' }}>QP / NSQF:</span>{' '}
                <strong style={{ color: '#202124' }}>{application?.qualificationPackCode || 'Standard QP'} (L{application?.nsqfLevel})</strong>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fce8e6',
              color: '#c5221f',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#3c4043', marginBottom: '8px' }}>
            Select Certified Assessor
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
            {assessors.map(ass => {
              const isSelected = selectedAssessorId === ass.id;
              return (
                <div
                  key={ass.id}
                  onClick={() => setSelectedAssessorId(ass.id)}
                  style={{
                    border: isSelected ? '2px solid #1a73e8' : '1px solid #dadce0',
                    background: isSelected ? '#f8fafd' : '#ffffff',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#202124' }}>{ass.name}</span>
                      <span style={{ fontSize: '10px', background: '#e6f4ea', color: '#137333', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {ass.accreditation}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#5f6368', display: 'block', marginTop: '2px' }}>
                      {ass.designation}
                    </span>
                    <span style={{ fontSize: '11px', color: '#80868b', display: 'block', marginTop: '2px' }}>
                      Trades: {ass.supportedSectors.join(' • ')}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '11px',
                      color: ass.availability === 'AVAILABLE' ? '#137333' : '#b06000',
                      fontWeight: 600
                    }}>
                      {ass.activeCount} active
                    </span>
                    <div style={{ marginTop: '4px' }}>
                      <input 
                        type="radio" 
                        name="assessorSelect" 
                        checked={isSelected} 
                        onChange={() => setSelectedAssessorId(ass.id)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
              type="button"
              onClick={handleAssign}
              disabled={loading}
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
              {loading && <span className="material-symbols-outlined" style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }}>sync</span>}
              Confirm Assessor Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
