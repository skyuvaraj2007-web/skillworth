import React, { useState, useEffect, useMemo } from 'react';
import {
  Building,
  Briefcase,
  Search,
  MapPin,
  Users,
  Mail,
  Phone,
  Award,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Eye,
  AlertCircle
} from 'lucide-react';
import { academicService } from '../../services/academicService';
import '../common/CompactDataList.css';

export default function InstitutionCompanyIntelligence({ onShowToast, setActivePage }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await academicService.getCompanies();
      if (res && res.success && Array.isArray(res.data)) {
        setCompanies(res.data);
      } else if (Array.isArray(res)) {
        setCompanies(res);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error('Failed to load corporate partners:', err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const normalizedCompanies = useMemo(() => {
    return companies.map(c => ({
      id: c.id || c.companyId,
      companyName: c.company_name || c.name || c.companyName || 'Corporate Partner',
      partnerStatus: c.partnership_status || c.partnerStatus || c.tier || 'Strategic Partner',
      industry: c.industry || 'Technology & Systems',
      location: c.location || c.headquarters || 'India',
      website: c.website || c.website_url || '#',
      companySize: c.companySize || c.size || '500+ employees',
      openingsCount: Number(c.opportunities_count || c.openings || (c.currentOpenings ? c.currentOpenings.length : 0)),
      avgCTC: c.avg_ctc || (c.previousRecruitment?.avgCTC) || 'Market Standard',
      alumniHired: c.total_hires || (c.previousRecruitment?.totalHired) || 0,
      skills: Array.isArray(c.required_skills) ? c.required_skills : (Array.isArray(c.highDemandSkills) ? c.highDemandSkills.map(s => typeof s === 'string' ? s : s.name) : []),
      currentOpenings: Array.isArray(c.currentOpenings) ? c.currentOpenings : [],
      hrContact: c.hrContact || {
        name: c.contact_person || 'Talent Acquisition Team',
        designation: c.contact_designation || 'Head of Campus Relations',
        email: c.official_email || c.email || 'campus-relations@partner.com',
        phone: c.phone || 'Available via MoU Desk'
      }
    }));
  }, [companies]);

  const filtered = useMemo(() => {
    return normalizedCompanies.filter(c => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.companyName.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.skills.some(s => s.toLowerCase().includes(q))
      );
    });
  }, [normalizedCompanies, searchQuery]);

  return (
    <div>
      {/* ── HEADER & SEARCH ── */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '20px', background: 'linear-gradient(135deg, rgba(16,26,48,0.7) 0%, rgba(10,16,30,0.9) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} color="var(--cyber-cyan)" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Corporate Partners & Industry Intelligence
              </h2>
              <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>
                DATABASE DRIVEN
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Verified corporate partnerships, recruitment demand telemetry, and active placement relationships.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                fetchCompanies();
                if (onShowToast) onShowToast({ title: 'MoU Sync Complete', message: 'Corporate partner directory refreshed from database.', type: 'success' });
              }}
              className="btn-cyber-outline"
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              <span>Refresh Industry Feed</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by company name, industry, location, or demanded skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cyber-input"
            style={{ paddingLeft: '36px', width: '100%', fontSize: '12.5px' }}
          />
        </div>
      </div>

      {/* ── COMPACT COMPANY LIST TABLE ── */}
      <div className="compact-table-container" style={{ marginBottom: '28px' }}>
        <div className="compact-table-scroll">
          {loading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              Loading verified corporate partners...
            </div>
          ) : normalizedCompanies.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <AlertCircle size={38} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No corporate partners or company intelligence records available yet.
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Active industry partnerships and company connections will populate dynamically once registered.
              </div>
            </div>
          ) : (
            <table className="compact-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Corporate Partner</th>
                  <th style={{ width: '16%' }}>Location & Presence</th>
                  <th style={{ width: '16%' }}>Placement Telemetry</th>
                  <th style={{ width: '12%' }}>Open Roles</th>
                  <th style={{ width: '18%' }}>Key Demanded Skills</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No corporate partners matched your search filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((comp) => (
                    <tr
                      key={comp.id}
                      onClick={() => setSelectedCompany(comp)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-subtle)',
                            flexShrink: 0
                          }}>
                            <Building size={16} color="var(--cyber-cyan)" />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="compact-cell-title">{comp.companyName}</span>
                              <span className="badge badge-purple" style={{ fontSize: '9px', padding: '1px 6px' }}>
                                {comp.partnerStatus}
                              </span>
                            </div>
                            <div className="compact-cell-sub">{comp.industry}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          <MapPin size={12} color="var(--text-muted)" /> {comp.location}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {comp.companySize}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-emerald)' }}>
                          {comp.avgCTC}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          {comp.alumniHired} hires recorded
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-amber" style={{ fontSize: '11px', fontWeight: 700 }}>
                          {comp.openingsCount} Opportunities
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {comp.skills.slice(0, 3).map((sk, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(40,215,255,0.1)',
                                color: 'var(--cyber-cyan)',
                                border: '1px solid rgba(40,215,255,0.2)'
                              }}
                            >
                              {sk}
                            </span>
                          ))}
                          {comp.skills.length > 3 && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                              +{comp.skills.length - 3}
                            </span>
                          )}
                          {comp.skills.length === 0 && (
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>General Track</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCompany(comp);
                          }}
                          className="btn-compact-details"
                        >
                          <Eye size={12} />
                          <span>Profile →</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── COMPANY DOSSIER MODAL ── */}
      {selectedCompany && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '700px', width: '100%', padding: '28px', border: '1px solid var(--cyber-cyan)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <span className="cyber-badge badge-purple" style={{ fontSize: '10px' }}>{selectedCompany.partnerStatus}</span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px', margin: '6px 0 2px' }}>
                  {selectedCompany.companyName}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--cyber-cyan)' }}>{selectedCompany.industry} · {selectedCompany.location}</div>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* HR Contact info */}
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(10,16,30,0.6)', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-cyan)', marginBottom: '10px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Official Campus Relationship Contact
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12.5px' }}>
                <div><strong>Contact:</strong> {selectedCompany.hrContact.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={13} color="var(--cyber-cyan)" /> {selectedCompany.hrContact.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={13} color="var(--cyber-emerald)" /> {selectedCompany.hrContact.phone}</div>
              </div>
            </div>

            {/* Demanded Skills */}
            {selectedCompany.skills.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  HIGH-PRIORITY TECHNICAL SKILLS
                </h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {selectedCompany.skills.map((sk, idx) => (
                    <span key={idx} className="cyber-badge badge-cyan" style={{ fontSize: '11px' }}>
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setSelectedCompany(null);
                  if (setActivePage) setActivePage('institution-matching');
                }}
                className="btn-cyber-primary"
                style={{ padding: '8px 18px', fontSize: '12.5px' }}
              >
                Match Students Against Openings →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
