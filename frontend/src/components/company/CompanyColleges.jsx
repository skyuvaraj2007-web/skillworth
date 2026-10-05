import React, { useState, useEffect, useMemo } from 'react';
import { Building, MapPin, Users, Award, ExternalLink, Filter, X, ShieldCheck, Mail, Globe, CheckCircle2, ChevronRight, Eye } from 'lucide-react';
import '../common/CompactDataList.css';

export default function CompanyColleges({ onFilterCollege, onTabSelect }) {
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerColleges, setPartnerColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchPartners() {
      setLoading(true);
      try {
        const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
        const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
        const res = await fetch(`${apiBase}/company/partnerships`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          credentials: 'include'
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && isMounted) {
            setPartnerColleges(json.data);
          }
        }
      } catch (err) {
        console.warn('Failed to load company partnerships:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPartners();
    return () => { isMounted = false; };
  }, []);

  // Dynamically load partner institutions from live database
  const colleges = useMemo(() => {
    if (partnerColleges.length > 0) {
      return partnerColleges.map(p => ({
        institutionId: p.institutionId || p.institution_id || p.id,
        collegeName: p.institutionName || p.institution_name || p.name,
        collegeCode: p.institutionCode || p.institution_code || `INST-${String(p.id).slice(0, 4).toUpperCase()}`,
        city: p.city || 'Tamil Nadu',
        state: p.state || 'India',
        nirf: p.nirf || 'Verified',
        naac: p.naac || 'Accredited',
        studentCount: p.studentCount || p.student_count || 0,
        placementRate: p.placementRate || 'Active',
        departments: p.departments || ['Engineering & Technology'],
        tier: p.partnership_tier || p.tier || 'Campus Partner',
        email: p.email || 'partner@institution.edu',
        website: p.website_url || p.website || '#'
      }));
    }
    return [];
  }, [partnerColleges]);

  const filteredColleges = useMemo(() => {
    if (!searchQuery.trim()) return colleges;
    const q = searchQuery.toLowerCase();
    return colleges.filter(c =>
      (c.collegeName || '').toLowerCase().includes(q) ||
      (c.collegeCode || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.state || '').toLowerCase().includes(q)
    );
  }, [colleges, searchQuery]);

  const handleSelectCollege = (colName) => {
    if (onFilterCollege) onFilterCollege(colName);
    onTabSelect('students');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Partnered Colleges Directory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative institutions integrated with the SKILLNEXUS AI sovereign ledger.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search partnered campuses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="company-input w-full text-xs"
          />
        </div>
      </div>

      {/* ── COMPACT COLLEGES TABLE ── */}
      <div className="compact-table-container" style={{ marginBottom: '28px' }}>
        <div className="compact-table-scroll">
          <table className="compact-table">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Institution Campus</th>
                <th style={{ width: '14%' }}>Location</th>
                <th style={{ width: '13%' }}>Accreditation</th>
                <th style={{ width: '11%' }}>Placement</th>
                <th style={{ width: '11%' }}>Talent Pool</th>
                <th style={{ width: '13%' }}>Departments</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredColleges.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {colleges.length === 0 ? 'No partner colleges yet' : 'No institutions matched your search filter.'}
                  </td>
                </tr>
              ) : (
                filteredColleges.map((col) => {
                  const colId = col.institutionId || col.collegeId || col.id;
                  const colName = col.collegeName || col.name;
                  const colCode = col.collegeCode || col.code || colId;
                  const location = `${col.city || 'Tamil Nadu'}, ${col.state || 'India'}`;
                  const studentCount = col.studentCount || col.students || 0;
                  const placement = col.placementRate || col.placement || 'N/A';
                  const depts = col.departments || ['Engineering'];
                  const tier = col.tier || 'Partner Campus';
                  const naac = col.naac || 'Accredited';
                  const nirf = col.nirf || 'Verified';

                  return (
                    <tr
                      key={colId}
                      onClick={() => setSelectedCollege(col)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: 'rgba(40,215,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(40,215,255,0.25)',
                            color: 'var(--cyber-cyan)',
                            flexShrink: 0
                          }}>
                            <Building size={16} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="compact-cell-title">{colName}</span>
                              <span className="badge badge-cyan" style={{ fontSize: '9px', padding: '1px 5px', fontFamily: 'monospace' }}>
                                {colCode}
                              </span>
                            </div>
                            <div className="compact-cell-sub" style={{ color: 'var(--cyber-purple)' }}>{tier}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          <MapPin size={12} color="var(--cyber-cyan)" /> {location}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{naac}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{nirf}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-emerald)' }}>
                          {placement}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {studentCount.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>verified</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {depts.slice(0, 3).map((d) => (
                            <span key={d} className="badge badge-purple" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                              {d}
                            </span>
                          ))}
                          {depts.length > 3 && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              +{depts.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCollege(col);
                            }}
                            className="btn-compact-details"
                          >
                            <Eye size={12} />
                            <span>Details →</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCollege(colName);
                            }}
                            className="company-btn-outline-cyan"
                            style={{ padding: '4px 7px', fontSize: '11px', borderRadius: '4px' }}
                            title="Filter students from this college"
                          >
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEDICATED COLLEGE INTELLIGENCE MODAL (Phase 14) */}
      {selectedCollege && (
        <div className="company-modal-overlay" onClick={() => setSelectedCollege(null)}>
          <div className="company-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-snug">
                    {selectedCollege.collegeName || selectedCollege.name}
                  </h2>
                  <span className="text-xs text-cyan-300 font-mono">
                    {selectedCollege.collegeCode || selectedCollege.code || selectedCollege.institutionId} • Sovereign Verified
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCollege(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Available Talent</span>
                  <span className="text-lg font-bold text-white font-mono">
                    {(selectedCollege.studentCount || selectedCollege.students || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Placement Status</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {selectedCollege.placementRate || selectedCollege.placement || 'Active'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Accreditation</span>
                  <span className="text-xs font-bold text-cyan-400 mt-1 block">
                    {selectedCollege.naac || 'Verified'} • {selectedCollege.nirf || 'Recognized'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Campus Standing</span>
                  <span className="text-xs font-bold text-purple-400 mt-1 block">
                    {selectedCollege.tier || 'Partner Campus'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Campus Departments & Programs</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedCollege.departments || ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil']).map(dept => (
                    <span key={dept} className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-slate-200 font-mono text-[11px]">
                      {dept}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/20">
                <span className="text-xs font-bold text-cyan-300 block mb-1">Placement & TPO Office</span>
                <p className="text-slate-300 text-[11px]">
                  Official Contact: <span className="font-mono text-white">{selectedCollege.email || 'placements@campus.edu'}</span>
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Direct recruiter communications and fast-track interview scheduling enabled.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-5">
              <button
                type="button"
                onClick={() => setSelectedCollege(null)}
                className="company-btn-secondary text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const name = selectedCollege.collegeName || selectedCollege.name;
                  setSelectedCollege(null);
                  handleSelectCollege(name);
                }}
                className="company-btn-gradient text-xs"
              >
                <span>Filter Candidates from this Campus</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
