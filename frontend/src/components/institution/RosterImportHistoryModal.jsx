import React, { useState, useEffect } from 'react';
import { History, X, RefreshCw, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { academicService } from '../../services/academicService';

export default function RosterImportHistoryModal({ institution, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await academicService.getRosterImports();
      if (res.success && Array.isArray(res.data)) {
        setHistory(res.data);
      }
    } catch (err) {
      console.warn('Error loading roster imports history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '780px',
        maxHeight: '80vh',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(11, 17, 32, 0.96))',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(6, 182, 212, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(6, 182, 212, 0.04)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="cyber-badge badge-blue" style={{ fontSize: '10px' }}>
                PostgreSQL Audit Log
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Campus: {institution?.collegeId || 'TN010'}
              </span>
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Cohort Roster Synchronization History
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <RefreshCw className="spin" size={24} style={{ margin: '0 auto 12px' }} />
              <div>Fetching PostgreSQL import transactions...</div>
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <div>No roster imports recorded yet for this campus.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
                  <th style={{ padding: '10px 12px' }}>Timestamp</th>
                  <th style={{ padding: '10px 12px' }}>File / Source</th>
                  <th style={{ padding: '10px 12px' }}>Total</th>
                  <th style={{ padding: '10px 12px' }}>New</th>
                  <th style={{ padding: '10px 12px' }}>Updated</th>
                  <th style={{ padding: '10px 12px' }}>Unchanged</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11.5px' }}>
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {row.file_name}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                      {row.total_rows}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--cyber-cyan)', fontWeight: 700 }}>
                      +{row.new_count}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--cyber-amber)', fontWeight: 700 }}>
                      ~{row.updated_count}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                      {row.unchanged_count}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className="cyber-badge badge-emerald" style={{ fontSize: '9px' }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(6, 182, 212, 0.02)'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-cyber-outline"
            style={{ padding: '6px 18px', fontSize: '12px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
