import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Award,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { academicService } from '../../services/academicService';

export default function InstitutionCandidateList({ institution, onShowToast, setActivePage }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const loadCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await academicService.getStudents();
      if (res && res.success && Array.isArray(res.data)) {
        setCandidates(res.data);
      } else if (Array.isArray(res)) {
        setCandidates(res);
      } else {
        setCandidates([]);
      }
    } catch (err) {
      console.error('Failed to load candidate list:', err);
      setError(err.message || 'Unable to load candidate roster.');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
    const handleUpdate = () => loadCandidates();
    window.addEventListener('nexus_students_updated', handleUpdate);
    window.addEventListener('nexus_data_updated', handleUpdate);
    return () => {
      window.removeEventListener('nexus_students_updated', handleUpdate);
      window.removeEventListener('nexus_data_updated', handleUpdate);
    };
  }, [institution]);

  // Extract distinct departments
  const departments = useMemo(() => {
    const set = new Set();
    candidates.forEach(c => {
      if (c.department) set.add(c.department);
      else if (c.departmentName) set.add(c.departmentName);
    });
    return ['ALL', ...Array.from(set)];
  }, [candidates]);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const dept = c.department || c.departmentName || '';
      const matchesDept = selectedDept === 'ALL' || dept === selectedDept;

      const status = (c.placementStatus || '').toLowerCase();
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'READY' && (status.includes('ready') || Number(c.readinessScore || c.careerReadinessScore || 0) >= 75)) ||
        (selectedStatus === 'PLACED' && status.includes('placed')) ||
        (selectedStatus === 'TRAINING' && (status.includes('training') || !status));

      const q = searchQuery.toLowerCase().trim();
      const name = (c.name || c.full_name || '').toLowerCase();
      const reg = (c.regNo || c.studentId || '').toLowerCase();
      const skillsStr = (c.skills || []).map(s => typeof s === 'string' ? s : s.name).join(' ').toLowerCase();
      const matchesSearch = !q || name.includes(q) || reg.includes(q) || skillsStr.includes(q);

      return matchesDept && matchesStatus && matchesSearch;
    });
  }, [candidates, selectedDept, selectedStatus, searchQuery]);

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* ── HEADER BANNER ── */}
      <div className="glass-panel" style={{
        padding: '22px 24px',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, rgba(16, 26, 48, 0.7) 0%, rgba(10, 16, 30, 0.9) 100%)',
        borderTop: '3px solid var(--cyber-cyan)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--cyber-cyan)" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Candidate Roster & Talent Pool
              </h2>
              <span className="cyber-badge badge-blue" style={{ fontSize: '10px' }}>
                CAMPUS AUTHORIZED
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Verified student profiles, career readiness telemetry, and skill profiles authenticated under your institutional license.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={loadCandidates}
              disabled={loading}
              className="btn-cyber-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              title="Refresh database records"
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            {setActivePage && (
              <button
                onClick={() => setActivePage('institution-placement')}
                className="btn-cyber-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              >
                <span>View Pipeline</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search bar */}
          <div style={{
            flex: '1 1 280px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(10, 16, 30, 0.7)',
            border: '1px solid var(--border-subtle)'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search candidate by name, roll number, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                width: '100%'
              }}
            />
          </div>

          {/* Department Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                background: 'rgba(10, 16, 30, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12.5px',
                outline: 'none'
              }}
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Placement Readiness Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                background: 'rgba(10, 16, 30, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12.5px',
                outline: 'none'
              }}
            >
              <option value="ALL">All Candidates</option>
              <option value="READY">Placement Ready (≥75%)</option>
              <option value="TRAINING">In Training</option>
              <option value="PLACED">Placed</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── CANDIDATE TABLE / CARDS ── */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Authorized Candidates ({filteredCandidates.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Source: Live Institutional Database
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading candidates...
          </div>
        ) : error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <AlertCircle size={36} color="var(--cyber-rose)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Unable to load candidates.
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              {error}
            </p>
            <button
              onClick={loadCandidates}
              className="btn-cyber-primary"
              style={{ padding: '7px 16px', fontSize: '12px' }}
            >
              Retry
            </button>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <AlertCircle size={38} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No candidates available yet.
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
              {searchQuery || selectedDept !== 'ALL' || selectedStatus !== 'ALL'
                ? 'No students matched your active filters. Try adjusting your search query or criteria.'
                : 'No student candidates are currently registered under this institution. Students registered under your campus license will appear here automatically.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  {['Candidate Name', 'Roll / Register No', 'Department', 'Semester', 'CGPA', 'Readiness Score', 'Verified Skills', 'Placement Status'].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '11px 14px',
                        textAlign: 'left',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((c) => {
                  const id = c.id || c.studentId || c.userId;
                  const readiness = Number(c.readinessScore || c.careerReadinessScore || c.learningProgress || 0);
                  const skills = c.skills || [];
                  const verifiedSkillsCount = skills.filter(sk => typeof sk === 'object' ? sk.verified : true).length || (c.verifiedSkills?.length || 0);

                  return (
                    <tr
                      key={id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {c.name || c.full_name || 'Student Candidate'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {c.email || ''}
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--cyber-cyan)' }}>
                        {c.regNo || c.studentId || '—'}
                      </td>

                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {c.department || c.departmentName || '—'}
                      </td>

                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {c.semester ? `Sem ${c.semester}` : (c.year ? `Year ${c.year}` : '—')}
                      </td>

                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {c.cgpa ? Number(c.cgpa).toFixed(2) : '—'}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            flex: 1,
                            minWidth: '50px',
                            height: '6px',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(100, readiness)}%`,
                              height: '100%',
                              background: readiness >= 75 ? 'var(--cyber-emerald)' : readiness >= 50 ? 'var(--cyber-amber)' : 'var(--cyber-rose)',
                              borderRadius: '3px'
                            }} />
                          </div>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: readiness >= 75 ? 'var(--cyber-emerald)' : readiness >= 50 ? 'var(--cyber-amber)' : 'var(--cyber-rose)'
                          }}>
                            {readiness}%
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className="cyber-badge badge-blue" style={{ fontSize: '10px' }}>
                            {verifiedSkillsCount} Verified
                          </span>
                          {skills.slice(0, 2).map((sk, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-muted)'
                              }}
                            >
                              {typeof sk === 'string' ? sk : sk.name}
                            </span>
                          ))}
                          {skills.length > 2 && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              +{skills.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          background: (c.placementStatus && c.placementStatus.toLowerCase().includes('ready')) || readiness >= 75
                            ? 'rgba(16, 185, 129, 0.15)'
                            : (c.placementStatus && c.placementStatus.toLowerCase().includes('placed'))
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          color: (c.placementStatus && c.placementStatus.toLowerCase().includes('ready')) || readiness >= 75
                            ? 'var(--cyber-emerald)'
                            : (c.placementStatus && c.placementStatus.toLowerCase().includes('placed'))
                              ? 'var(--cyber-blue)'
                              : 'var(--cyber-amber)'
                        }}>
                          {(c.placementStatus || (readiness >= 75 ? 'READY' : 'IN TRAINING')).toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
