import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  Users,
  AlertCircle,
  Check,
  X,
  FileText
} from 'lucide-react';
import { collaborationService } from '../../services/collaborationService';

export default function CompanyStudentAccessRequests({ onShowToast, onNavigateToAuthorized }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await collaborationService.getCompanyAccessRequests();
      if (res.success) {
        setRequests(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load company access requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleRespond = async (requestId, action) => {
    try {
      setActionLoadingId(requestId);
      const res = await collaborationService.respondToAccessRequest(requestId, action);
      if (res.success) {
        if (onShowToast) {
          onShowToast({
            title: action === 'ACCEPT' ? 'Access Granted' : 'Request Rejected',
            message: action === 'ACCEPT'
              ? 'Student cohort is now authorized for viewing and recruitment.'
              : 'Student access request has been declined.',
            type: action === 'ACCEPT' ? 'success' : 'info'
          });
        }
        await loadRequests();
      } else {
        if (onShowToast) onShowToast({ title: 'Operation Failed', message: res.message, type: 'error' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div style={{ padding: '24px', color: '#e2e8f0', minHeight: '100%' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px',
        borderRadius: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck style={{ color: 'var(--cyber-blue)', width: '28px', height: '28px' }} />
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Academic Student Access Requests
            </h1>
          </div>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
            Review institutional requests granting your organization secure access to verified student talent pipelines.
          </p>
        </div>

        {onNavigateToAuthorized && (
          <button
            onClick={onNavigateToAuthorized}
            style={{
              background: 'var(--cyber-blue-dim)',
              color: 'var(--cyber-blue)',
              border: '1px solid var(--border-subtle)',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            View Authorized Students →
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            style={{
              background: filterStatus === st ? 'var(--cyber-blue-dim)' : 'var(--bg-input)',
              color: filterStatus === st ? 'var(--cyber-blue)' : 'var(--text-secondary)',
              border: filterStatus === st ? '1px solid var(--cyber-blue)' : '1px solid var(--border-subtle)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading access requests from PostgreSQL...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="empty-state-card">
          <Clock style={{ width: '40px', height: '40px', color: 'var(--cyber-blue)', margin: '0 auto 12px auto' }} />
          <h3 style={{ color: 'var(--text-heading)', margin: '0 0 6px 0' }}>No {filterStatus === 'ALL' ? '' : filterStatus} Requests</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
            When partner universities share student cohorts with your company, they will appear here for verification.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredRequests.map((r) => {
            const isPending = r.status === 'PENDING';
            const statusColor = r.status === 'ACCEPTED' ? '#10B981' : r.status === 'REJECTED' ? '#E11D48' : '#D97706';
            const statusBg = r.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.15)' : r.status === 'REJECTED' ? 'rgba(225, 29, 72, 0.15)' : 'rgba(217, 119, 6, 0.15)';

            return (
              <div
                key={r.id}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: statusBg,
                      color: statusColor
                    }}>
                      {r.status}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                      REF: {r.id.slice(0, 8)}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 700, color: 'var(--text-heading)' }}>
                    {r.institution_name || 'Academic Institution'}
                  </h3>

                  <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                    {r.notes || 'Cohort fast-track access sharing request.'}
                  </p>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <span>Cohort Size: <strong style={{ color: 'var(--cyber-blue)' }}>{r.student_count || (r.student_ids ? r.student_ids.length : 1)} Verified Students</strong></span>
                    <span>•</span>
                    <span>Received: {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Accept / Reject actions if PENDING */}
                {isPending ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleRespond(r.id, 'REJECT')}
                      disabled={actionLoadingId === r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <X style={{ width: '16px', height: '16px' }} />
                      Reject
                    </button>
                    <button
                      onClick={() => handleRespond(r.id, 'ACCEPT')}
                      disabled={actionLoadingId === r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <Check style={{ width: '16px', height: '16px' }} />
                      Accept Cohort Access
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                    Decided on {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : 'N/A'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
