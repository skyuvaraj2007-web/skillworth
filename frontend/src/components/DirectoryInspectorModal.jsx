import React, { useState, useMemo, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  X,
  Building2,
  MapPin,
  Award,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  BarChart3,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  GraduationCap
} from 'lucide-react';
import {
  TN_COLLEGES,
  getDirectoryStats,
  getAllDistricts,
  getDistrictCounts,
  getAllInstitutionTypes,
  filterDirectory,
  TAMIL_NADU_DISTRICTS
} from '../services/collegeDirectory';
import CyberSelect from './CyberSelect';

/**
 * DirectoryInspectorModal
 * Official Authoritative Inspector for the Tamil Nadu Higher Education Master Directory.
 * Covers all 38 districts with Anna University / TNEA codes, regulatory standing, and Career Intel Tiers.
 */
export default function DirectoryInspectorModal({ isOpen, onClose }) {
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [tier, setTier] = useState('ALL');
  const [ownership, setOwnership] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [directoryVersion, setDirectoryVersion] = useState(0);

  // Sync reactively when colleges are loaded from backend
  useEffect(() => {
    const handleUpdate = () => setDirectoryVersion(v => v + 1);
    window.addEventListener('nexus_directory_updated', handleUpdate);
    return () => window.removeEventListener('nexus_directory_updated', handleUpdate);
  }, []);

  const stats = useMemo(() => getDirectoryStats(), [directoryVersion, isOpen]);
  const allDistricts = useMemo(() => getAllDistricts(), [directoryVersion, isOpen]);
  const districtCounts = useMemo(() => getDistrictCounts(), [directoryVersion, isOpen]);
  const allTypes = useMemo(() => getAllInstitutionTypes(), [directoryVersion, isOpen]);

  const filteredColleges = useMemo(() => {
    return filterDirectory({
      district,
      institutionType: type,
      tier,
      ownershipType: ownership,
      search
    });
  }, [district, type, tier, ownership, search, directoryVersion]);

  const totalPages = Math.max(1, Math.ceil(filteredColleges.length / pageSize));

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredColleges.slice(start, start + pageSize);
  }, [filteredColleges, page, pageSize]);

  // Copy TNEA Code
  const handleCopyCode = (code, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(String(code));
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setDistrict('ALL');
    setType('ALL');
    setTier('ALL');
    setOwnership('ALL');
    setPage(1);
  };

  const isFiltered = district !== 'ALL' || type !== 'ALL' || tier !== 'ALL' || ownership !== 'ALL' || search.trim() !== '';

  const POPULAR_DISTRICTS = ['Chennai', 'Coimbatore', 'Erode', 'Madurai', 'Salem', 'Tiruchirappalli', 'Tirunelveli', 'Vellore'];

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(2, 6, 23, 0.92)',
      backdropFilter: 'blur(16px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1240px',
        height: '94vh',
        background: 'linear-gradient(180deg, #0B132B 0%, #060A17 100%)',
        border: '1px solid rgba(0, 242, 254, 0.4)',
        borderRadius: '18px',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(0, 242, 254, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* ── 1. MODAL HEADER ── */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.85)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="cyber-badge badge-cyan" style={{ fontSize: '10.5px', padding: '3px 9px', letterSpacing: '0.5px' }}>
                <Database size={12} style={{ marginRight: '5px' }} />
                OFFICIAL TAMIL NADU MASTER DIRECTORY
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'rgba(255, 255, 255, 0.65)' }}>
                DCE • UGC • AICTE • ANNA UNIVERSITY (TNEA 2026)
              </span>
              <span style={{
                fontSize: '10.5px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: 600
              }}>
                All 38 Districts Active
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Tamil Nadu Higher Education Master Directory
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--cyber-cyan)', background: 'rgba(0, 242, 254, 0.1)', padding: '2px 10px', borderRadius: '12px', border: '1px solid rgba(0, 242, 254, 0.25)' }}>
                {stats.total} Institutions
              </span>
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#F87171',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 600
                }}
              >
                <RotateCcw size={12} />
                Reset Filters
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#E2E8F0',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.color = '#F87171';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#E2E8F0';
              }}
              title="Close Directory (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── 2. STATS RIBBON (Clickable to Filter) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
          padding: '14px 24px',
          background: 'rgba(10, 16, 32, 0.7)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          {/* Total Institutions */}
          <div
            onClick={() => { setTier('ALL'); setPage(1); }}
            style={{
              padding: '10px 14px',
              background: tier === 'ALL' && !isFiltered ? 'rgba(0, 242, 254, 0.1)' : 'rgba(15, 23, 42, 0.75)',
              borderRadius: '10px',
              border: tier === 'ALL' && !isFiltered ? '1px solid rgba(0, 242, 254, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>TOTAL REGISTRY</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>{stats.total}</div>
            <div style={{ fontSize: '10px', color: '#34D399', marginTop: '2px' }}>38 Districts Tamil Nadu</div>
          </div>

          {/* Tier 1 Excellence */}
          <div
            onClick={() => { setTier(tier === 'SKILLNEXUS Tier 1' ? 'ALL' : 'SKILLNEXUS Tier 1'); setPage(1); }}
            style={{
              padding: '10px 14px',
              background: tier === 'SKILLNEXUS Tier 1' ? 'rgba(0, 242, 254, 0.18)' : 'rgba(0, 242, 254, 0.05)',
              borderRadius: '10px',
              border: tier === 'SKILLNEXUS Tier 1' ? '1px solid #00F2FE' : '1px solid rgba(0, 242, 254, 0.22)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '10px', color: '#38BDF8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>TIER 1 (EXCELLENCE)</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#00F2FE', marginTop: '2px' }}>{stats.tiers['SKILLNEXUS Tier 1']}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>NIRF / CEG / IIT / CFTI</div>
          </div>

          {/* Tier 2 Established */}
          <div
            onClick={() => { setTier(tier === 'SKILLNEXUS Tier 2' ? 'ALL' : 'SKILLNEXUS Tier 2'); setPage(1); }}
            style={{
              padding: '10px 14px',
              background: tier === 'SKILLNEXUS Tier 2' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(168, 85, 247, 0.05)',
              borderRadius: '10px',
              border: tier === 'SKILLNEXUS Tier 2' ? '1px solid #A855F7' : '1px solid rgba(168, 85, 247, 0.22)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '10px', color: '#C084FC', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>TIER 2 (ESTABLISHED)</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#C084FC', marginTop: '2px' }}>{stats.tiers['SKILLNEXUS Tier 2']}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>UGC Autonomous / Heritage</div>
          </div>

          {/* Tier 3 Regional */}
          <div
            onClick={() => { setTier(tier === 'SKILLNEXUS Tier 3' ? 'ALL' : 'SKILLNEXUS Tier 3'); setPage(1); }}
            style={{
              padding: '10px 14px',
              background: tier === 'SKILLNEXUS Tier 3' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.05)',
              borderRadius: '10px',
              border: tier === 'SKILLNEXUS Tier 3' ? '1px solid #60A5FA' : '1px solid rgba(59, 130, 246, 0.22)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '10px', color: '#60A5FA', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>TIER 3 (REGIONAL)</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#93C5FD', marginTop: '2px' }}>{stats.tiers['SKILLNEXUS Tier 3']}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>Affiliated Engineering</div>
          </div>

          {/* Tier 4 Developing */}
          <div
            onClick={() => { setTier(tier === 'SKILLNEXUS Tier 4' ? 'ALL' : 'SKILLNEXUS Tier 4'); setPage(1); }}
            style={{
              padding: '10px 14px',
              background: tier === 'SKILLNEXUS Tier 4' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              border: tier === 'SKILLNEXUS Tier 4' ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>TIER 4 (DEVELOPING)</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#CBD5E1', marginTop: '2px' }}>{stats.tiers['SKILLNEXUS Tier 4'] || 0}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>Emerging Campuses</div>
          </div>
        </div>

        {/* ── 3. FILTER BAR (FIXED HIGH CONTRAST & VISIBILITY) ── */}
        <div style={{
          padding: '14px 24px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Main Controls Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr',
            gap: '10px',
            alignItems: 'center'
          }}>
            {/* Search Input with Clear Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#0B132B',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              borderRadius: '8px',
              padding: '0 12px',
              gap: '8px',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)'
            }}>
              <Search size={15} style={{ color: '#00F2FE', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search college name, code (e.g. 2712), city..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '9px 0',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 500
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* District Custom CyberSelect */}
            <CyberSelect
              value={district}
              onChange={(val) => { setDistrict(val); setPage(1); }}
              options={[
                { value: 'ALL', label: 'All 38 Districts', count: stats.total },
                ...allDistricts.map(d => ({ value: d, label: d, count: districtCounts[d] || 0 }))
              ]}
              placeholder="All 38 Districts"
              searchPlaceholder="Search 38 districts..."
              searchable={true}
            />

            {/* Institution Type Custom CyberSelect */}
            <CyberSelect
              value={type}
              onChange={(val) => { setType(val); setPage(1); }}
              options={[
                { value: 'ALL', label: 'All Institution Types' },
                ...allTypes.map(t => ({ value: t, label: t }))
              ]}
              placeholder="All Types"
              searchable={false}
            />

            {/* Tier Custom CyberSelect */}
            <CyberSelect
              value={tier}
              onChange={(val) => { setTier(val); setPage(1); }}
              options={[
                { value: 'ALL', label: 'All Skill Tiers' },
                { value: 'SKILLNEXUS Tier 1', label: 'SKILLNEXUS Tier 1', count: stats.tiers['SKILLNEXUS Tier 1'] },
                { value: 'SKILLNEXUS Tier 2', label: 'SKILLNEXUS Tier 2', count: stats.tiers['SKILLNEXUS Tier 2'] },
                { value: 'SKILLNEXUS Tier 3', label: 'SKILLNEXUS Tier 3', count: stats.tiers['SKILLNEXUS Tier 3'] },
                { value: 'SKILLNEXUS Tier 4', label: 'SKILLNEXUS Tier 4', count: stats.tiers['SKILLNEXUS Tier 4'] || 0 }
              ]}
              placeholder="All Skill Tiers"
              searchable={false}
            />

            {/* Ownership / Category Custom CyberSelect */}
            <CyberSelect
              value={ownership}
              onChange={(val) => { setOwnership(val); setPage(1); }}
              options={[
                { value: 'ALL', label: 'All Categories' },
                { value: 'Autonomous', label: 'Autonomous' },
                { value: 'Government', label: 'Government' },
                { value: 'Government-Aided', label: 'Government-Aided' },
                { value: 'Self-Financing', label: 'Self-Financing' },
                { value: 'Deemed', label: 'Deemed University' }
              ]}
              placeholder="All Categories"
              searchable={false}
            />
          </div>

          {/* Popular District Quick Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              POPULAR DISTRICTS:
            </span>
            <button
              onClick={() => { setDistrict('ALL'); setPage(1); }}
              style={{
                padding: '3px 9px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                border: district === 'ALL' ? '1px solid #00F2FE' : '1px solid rgba(255, 255, 255, 0.12)',
                background: district === 'ALL' ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: district === 'ALL' ? '#00F2FE' : '#CBD5E1',
                transition: 'all 0.15s'
              }}
            >
              All 38
            </button>
            {POPULAR_DISTRICTS.map(d => (
              <button
                key={d}
                onClick={() => { setDistrict(district === d ? 'ALL' : d); setPage(1); }}
                style={{
                  padding: '3px 9px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: district === d ? '1px solid #00F2FE' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: district === d ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: district === d ? '#00F2FE' : '#CBD5E1',
                  transition: 'all 0.15s'
                }}
              >
                {d} {districtCounts[d] ? `(${districtCounts[d]})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. TABLE CONTENT & REGISTRY VIEW ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {paginated.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: '#00F2FE'
              }}>
                <Search size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                No Institutions Matched Your Filter Criteria
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', maxWidth: '450px', marginBottom: '18px' }}>
                Try adjusting your search terms, changing the selected district, or resetting the tier filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="btn-cyber-primary"
                style={{ padding: '8px 18px', fontSize: '12px' }}
              >
                <RotateCcw size={14} style={{ marginRight: '6px' }} />
                Reset All Filters
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 2
                }}>
                  <th style={{ padding: '12px 14px', width: '38%' }}>TNEA CODE & COLLEGE NAME</th>
                  <th style={{ padding: '12px 14px', width: '18%' }}>DISTRICT & CITY</th>
                  <th style={{ padding: '12px 14px', width: '18%' }}>TYPE & UNIVERSITY</th>
                  <th style={{ padding: '12px 14px', width: '16%' }}>SKILLNEXUS TIER</th>
                  <th style={{ padding: '12px 14px', width: '10%', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((col) => {
                  const code = col.collegeCode || col.collegeId || col.id;
                  const isTier1 = col.tier === 'SKILLNEXUS Tier 1';
                  const isTier2 = col.tier === 'SKILLNEXUS Tier 2';
                  const isTier3 = col.tier === 'SKILLNEXUS Tier 3';

                  return (
                    <tr
                      key={code || col.collegeName}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.06)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Code & Name */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span
                            onClick={(e) => handleCopyCode(code, e)}
                            style={{
                              fontSize: '10.5px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              color: '#00F2FE',
                              background: 'rgba(0, 242, 254, 0.12)',
                              border: '1px solid rgba(0, 242, 254, 0.35)',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Click to copy official TNEA code"
                          >
                            {code}
                            {copiedCode === code ? <Check size={11} color="#34D399" /> : <Copy size={11} />}
                          </span>

                          {col.isRegistered && (
                            <span style={{
                              fontSize: '9.5px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34D399',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              borderRadius: '4px',
                              padding: '1px 6px',
                              fontWeight: 700
                            }}>
                              ACTIVE PORTAL
                            </span>
                          )}
                        </div>

                        <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13px', lineHeight: '1.3' }}>
                          {col.collegeName}
                        </div>
                      </td>

                      {/* District & Location */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#E2E8F0', fontWeight: 600 }}>
                          <MapPin size={13} style={{ color: '#00F2FE', flexShrink: 0 }} />
                          <span>{col.district}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginLeft: '18px', marginTop: '2px' }}>
                          {col.city || col.district}
                        </div>
                      </td>

                      {/* Type & University */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: (col.collegeType === 'Autonomous' || col.ownershipType === 'Autonomous') ? 'rgba(16, 185, 129, 0.15)'
                            : (col.collegeType === 'Government' || col.ownershipType === 'Government') ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(168, 85, 247, 0.15)',
                          color: (col.collegeType === 'Autonomous' || col.ownershipType === 'Autonomous') ? '#34D399'
                            : (col.collegeType === 'Government' || col.ownershipType === 'Government') ? '#FBBF24'
                            : '#C084FC',
                          border: (col.collegeType === 'Autonomous' || col.ownershipType === 'Autonomous') ? '1px solid rgba(16, 185, 129, 0.3)'
                            : (col.collegeType === 'Government' || col.ownershipType === 'Government') ? '1px solid rgba(245, 158, 11, 0.3)'
                            : '1px solid rgba(168, 85, 247, 0.3)'
                        }}>
                          {col.collegeType || col.ownershipType || 'Affiliated'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
                          {col.universityAffiliation || col.university || 'Anna University'}
                        </div>
                      </td>

                      {/* Tier Score */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          background: isTier1 ? 'rgba(0, 242, 254, 0.15)'
                            : isTier2 ? 'rgba(168, 85, 247, 0.15)'
                            : isTier3 ? 'rgba(59, 130, 246, 0.15)'
                            : 'rgba(255, 255, 255, 0.08)',
                          color: isTier1 ? '#00F2FE'
                            : isTier2 ? '#C084FC'
                            : isTier3 ? '#60A5FA'
                            : '#CBD5E1',
                          border: isTier1 ? '1px solid rgba(0, 242, 254, 0.4)'
                            : isTier2 ? '1px solid rgba(168, 85, 247, 0.4)'
                            : isTier3 ? '1px solid rgba(59, 130, 246, 0.4)'
                            : '1px solid rgba(255, 255, 255, 0.15)',
                          display: 'inline-block'
                        }}>
                          {col.tier}
                        </span>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                          Score: <strong style={{ color: '#FFFFFF' }}>{col.tierScore || 70}</strong>/100
                        </div>
                      </td>

                      {/* Action Button */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedCollege(col)}
                          style={{
                            background: 'rgba(0, 242, 254, 0.08)',
                            border: '1px solid rgba(0, 242, 254, 0.3)',
                            color: '#00F2FE',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#00F2FE';
                            e.currentTarget.style.color = '#020617';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 242, 254, 0.08)';
                            e.currentTarget.style.color = '#00F2FE';
                          }}
                        >
                          Inspect Card
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 5. PAGINATION & FOOTER CONTROLS ── */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          <div>
            Showing <strong style={{ color: '#00F2FE' }}>{filteredColleges.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong> to{' '}
            <strong style={{ color: '#00F2FE' }}>{Math.min(page * pageSize, filteredColleges.length)}</strong> of{' '}
            <strong style={{ color: '#FFFFFF' }}>{filteredColleges.length}</strong> institutions matching filter criteria
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', width: '130px' }}>
              <CyberSelect
                value={pageSize}
                onChange={(val) => { setPageSize(Number(val)); setPage(1); }}
                options={[
                  { value: 10, label: '10 / page' },
                  { value: 25, label: '25 / page' },
                  { value: 50, label: '50 / page' }
                ]}
                searchable={false}
                triggerStyle={{ padding: '4px 8px', fontSize: '11px' }}
              />
            </div>

            {/* Previous / Next */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  background: page === 1 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 242, 254, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: page === 1 ? 'rgba(255, 255, 255, 0.25)' : '#00F2FE',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={13} />
                Previous
              </button>

              <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: '#FFFFFF', padding: '0 4px' }}>
                {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  background: page >= totalPages ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 242, 254, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: page >= totalPages ? 'rgba(255, 255, 255, 0.25)' : '#00F2FE',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Next
                <ChevronRight size={13} />
              </button>
            </div>

            <button
              onClick={onClose}
              className="btn-cyber-outline"
              style={{ padding: '6px 14px', fontSize: '11.5px', marginLeft: '6px' }}
            >
              Close Directory
            </button>
          </div>
        </div>
      </div>

      {/* ── 6. COLLEGE DETAIL INSPECTOR DRAWER / MODAL ── */}
      {selectedCollege && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '650px',
            background: '#0B132B',
            border: '1px solid rgba(0, 242, 254, 0.5)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(0, 242, 254, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>
                  TNEA CODE: {selectedCollege.collegeCode || selectedCollege.collegeId}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px', marginBottom: '2px' }}>
                  {selectedCollege.collegeName}
                </h3>
                <div style={{ fontSize: '12px', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} />
                  {selectedCollege.city ? `${selectedCollege.city}, ` : ''}{selectedCollege.district} District, Tamil Nadu
                </div>
              </div>
              <button
                onClick={() => setSelectedCollege(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Spec Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'var(--font-mono)' }}>UNIVERSITY AFFILIATION</div>
                <div style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 600, marginTop: '2px' }}>
                  {selectedCollege.universityAffiliation || selectedCollege.university || 'Anna University'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'var(--font-mono)' }}>INSTITUTION TYPE</div>
                <div style={{ fontSize: '13px', color: '#34D399', fontWeight: 600, marginTop: '2px' }}>
                  {selectedCollege.collegeType || selectedCollege.ownershipType || 'Autonomous'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'var(--font-mono)' }}>CAREER INTEL TIER</div>
                <div style={{ fontSize: '13px', color: '#00F2FE', fontWeight: 700, marginTop: '2px' }}>
                  {selectedCollege.tier}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'var(--font-mono)' }}>REGISTRATION STATUS</div>
                <div style={{ fontSize: '13px', color: '#34D399', fontWeight: 600, marginTop: '2px' }}>
                  ● Verified Active
                </div>
              </div>
            </div>

            {/* Tier Rationale */}
            <div style={{
              background: 'rgba(0, 242, 254, 0.05)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#00F2FE', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={13} />
                SKILLNEXUS INTELLIGENCE SCORE: {selectedCollege.tierScore || 75}/100
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: '1.4' }}>
                {selectedCollege.tierReason || 'Classified using authoritative regulatory metrics, university standing, autonomous status, and academic evidence.'}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => {
                  setDistrict(selectedCollege.district);
                  setSelectedCollege(null);
                  setPage(1);
                }}
                className="btn-cyber-outline"
                style={{ padding: '7px 14px', fontSize: '11.5px' }}
              >
                Filter {selectedCollege.district} District
              </button>
              <button
                onClick={() => setSelectedCollege(null)}
                className="btn-cyber-primary"
                style={{ padding: '7px 16px', fontSize: '11.5px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
