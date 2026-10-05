import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function PublicAssessmentVerification({ recordId, onBack }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!recordId) {
      setError('No assessment record ID provided.');
      setLoading(false);
      return;
    }

    const fetchVerification = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.verifyAssessmentRecord(recordId);
        if (res && res.valid) {
          setRecord(res);
        } else {
          setError(res.message || 'Assessment record not found or unverified.');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('Network or server error during record verification.');
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [recordId]);

  return (
    <div style={{
      maxWidth: '680px',
      margin: '40px auto',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#176B68',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '16px'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Portal
        </button>
      )}

      <div style={{
        background: '#ffffff',
        border: '2px solid #176B68',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 16px rgba(23, 33, 43, 0.08)'
      }}>
        
        {/* Header */}
        <div style={{
          borderBottom: '2px solid #176B68',
          paddingBottom: '16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#176B68', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              SkillWorth Verification Registry
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#17212b', margin: '4px 0' }}>
              SKILLWORTH ASSESSMENT RECORD
            </h2>
          </div>
          <div style={{
            background: '#e6f4ea',
            color: '#137333',
            border: '1px solid #b7e1cd',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em'
          }}>
            OFFICIAL ASSESSMENT RECORD
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <span className="material-symbols-outlined" style={{ animation: 'spin 1.5s infinite linear', fontSize: '32px', color: '#176B68' }}>
              sync
            </span>
            <p style={{ marginTop: '12px', color: '#5f6368', fontSize: '13px' }}>
              Verifying cryptographic assessment record in SkillWorth registry...
            </p>
          </div>
        ) : error ? (
          <div style={{
            background: '#fce8e6',
            border: '1px solid #f5c2c0',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            color: '#d93025'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', marginBottom: '8px' }}>error</span>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Verification Unsuccessful</h3>
            <p style={{ fontSize: '13px' }}>{error}</p>
            <p style={{ fontSize: '11px', color: '#80868b', marginTop: '12px' }}>
              Record ID: <code>{recordId}</code>
            </p>
          </div>
        ) : (
          <div>
            {/* Valid Status Banner */}
            <div style={{
              background: '#e6f4ea',
              border: '1px solid #b7e1cd',
              borderRadius: '8px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#137333' }}>
                verified
              </span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#137333', letterSpacing: '0.04em' }}>
                  {record.verificationStatus || 'VALID SKILLWORTH ASSESSMENT RECORD'}
                </div>
                <div style={{ fontSize: '11px', color: '#137333' }}>
                  Authenticity verified against active registry. Tamper-evident evaluation record.
                </div>
              </div>
            </div>

            {/* Field Breakdown */}
            <div style={{
              background: '#fbf9f3',
              border: '1px solid #DDDCD4',
              borderRadius: '8px',
              padding: '18px 22px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600, textTransform: 'uppercase' }}>Worker</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1b1c18', marginTop: '2px' }}>{record.workerName}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600, textTransform: 'uppercase' }}>Qualification Pathway</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1b1c18', marginTop: '2px' }}>{record.qualification}</div>
                {record.qpCode && (
                  <div style={{ fontSize: '11px', color: '#80868b' }}>QP: {record.qpCode}</div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600, textTransform: 'uppercase' }}>Assessment Status</div>
                <div style={{
                  display: 'inline-block',
                  marginTop: '4px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: '#e6f4f3',
                  color: '#176B68'
                }}>
                  {record.assessmentStatus || 'ASSESSED & VERIFIED'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600, textTransform: 'uppercase' }}>Assessment Date</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1b1c18', marginTop: '2px' }}>{record.assessmentDate}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600, textTransform: 'uppercase' }}>Assessment Record ID</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#176B68', fontFamily: 'monospace', marginTop: '2px' }}>{record.recordId}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#555f6b', fontWeight: 600, textTransform: 'uppercase' }}>Authorized Assessor</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1b1c18', marginTop: '2px' }}>{record.assessor || 'Authorized Lead Assessor'}</div>
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{
              borderTop: '1px solid #DDDCD4',
              paddingTop: '14px',
              fontSize: '11px',
              color: '#5f6368',
              lineHeight: 1.4
            }}>
              <strong>Notice:</strong> {record.disclaimer || 'This is a verified SkillWorth RPL Assessment Record and Recommendation. Official certification is issued by accredited awarding bodies upon formal validation.'}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
