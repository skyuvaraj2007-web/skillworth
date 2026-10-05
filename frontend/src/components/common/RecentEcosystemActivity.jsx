import React, { useState, useEffect } from 'react';
import { Activity, Briefcase, BookOpen, Award, Star, Clock, RefreshCw } from 'lucide-react';
import { formatTimeAgo } from '../../utils/timeAgo';

export default function RecentEcosystemActivity({ compact = false }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async () => {
    try {
      const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
      const res = await fetch(`${apiBase}/nexus/ecosystem-activity`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setActivities(data.data);
      }
    } catch (e) {
      console.debug('[RecentEcosystemActivity] fetch note:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'industry':
        return { label: 'INDUSTRY', bg: 'rgba(0, 212, 255, 0.12)', border: '#00D4FF', text: '#00D4FF', icon: Briefcase };
      case 'institution':
        return { label: 'INSTITUTION', bg: 'rgba(16, 185, 129, 0.12)', border: '#10B981', text: '#10B981', icon: BookOpen };
      case 'academician':
        return { label: 'FACULTY', bg: 'rgba(139, 92, 246, 0.12)', border: '#8B5CF6', text: '#8B5CF6', icon: Award };
      case 'student':
        return { label: 'STUDENT', bg: 'rgba(245, 158, 11, 0.12)', border: '#F59E0B', text: '#F59E0B', icon: Star };
      default:
        return { label: 'NETWORK', bg: 'rgba(255, 255, 255, 0.08)', border: '#64748B', text: '#94A3B8', icon: Activity };
    }
  };

  return (
    <div style={{
      background: 'rgba(21, 31, 53, 0.85)',
      border: '1px solid #263452',
      borderRadius: '12px',
      padding: compact ? '16px' : '20px',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Activity size={15} color="#00D4FF" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
              Live Connected Ecosystem Activity
            </h4>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              Real cross-role database events in PostgreSQL
            </span>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          title="Refresh live activity"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid #263452',
            borderRadius: '6px',
            padding: '5px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#94A3B8',
            fontSize: '11px'
          }}
        >
          <RefreshCw size={12} className={refreshing ? 'spin-anim' : ''} />
          <span>Sync</span>
        </button>
      </div>

      {/* Activity List */}
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
          <Activity size={20} className="spin-anim" style={{ margin: '0 auto 8px', color: '#00D4FF' }} />
          Streaming connected events from Supabase...
        </div>
      ) : activities.length === 0 ? (
        <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
          No recent ecosystem events recorded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activities.slice(0, compact ? 4 : 6).map((act) => {
            const badge = getRoleBadge(act.role);
            const Icon = badge.icon;
            const timeAgoStr = formatTimeAgo(act.timestamp);

            return (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(11, 18, 32, 0.65)',
                  border: '1px solid rgba(38, 52, 82, 0.6)',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '6px',
                    background: badge.bg, border: `1px solid ${badge.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={13} color={badge.text} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '12.5px', color: '#F8FAFC', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ color: badge.text, fontWeight: 700 }}>{act.actor}</span>
                      {' '}{act.action}{' '}
                      <span style={{ color: '#E2E8F0', fontWeight: 700 }}>"{act.target}"</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#64748B',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono, monospace)',
                  flexShrink: 0
                }}>
                  <Clock size={11} />
                  <span>{timeAgoStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
