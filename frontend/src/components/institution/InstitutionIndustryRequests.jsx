import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  ShieldCheck,
  Search,
  ChevronRight,
  AlertTriangle,
  X,
  Lock,
  Ban,
  Eye,
  RefreshCw,
  Building,
  Mail,
  Globe,
  MapPin,
  Phone,
  FileText,
  UserCheck
} from 'lucide-react';
import { academicService } from '../../services/academicService';
import { nexusApiClient } from '../../services/nexusApiClient';

export default function InstitutionIndustryRequests({ onShowToast }) {
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'approved', 'revoked'

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyId: '',
    companyName: '',
    companyEmail: '',
    website: '',
    registrationId: '',
    industry: 'Enterprise Software',
    location: 'Chennai, Tamil Nadu',
    contactPerson: '',
    contactDesignation: 'Talent Acquisition Lead',
    contactPhone: '',
    reason: 'Industry collaboration, placement drive, and career readiness evaluation.',
    shareScope: 'ALL_STUDENTS' // 'ALL_STUDENTS' or 'SELECTED_STUDENTS'
  });

  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [studentSearch, setStudentSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, stuData, compData] = await Promise.all([
        academicService.getIndustryRequests().catch(() => ({ success: false, data: [] })),
        nexusApiClient.getStudents().catch(() => []),
        nexusApiClient.getInstitutions().catch(() => []) // or get companies
      ]);

      if (reqRes.success && Array.isArray(reqRes.data)) {
        setRequests(reqRes.data);
      }

      if (Array.isArray(stuData)) {
        setStudents(stuData);
      }

      // Fetch active registered companies
      try {
        const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
        const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
        const cRes = await fetch(`${apiBase}/company`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include'
        });
        if (cRes.ok) {
          const cJson = await cRes.json();
          if (cJson.success && Array.isArray(cJson.data)) {
            setCompanies(cJson.data);
          }
        }
      } catch (e) {
        console.debug('Company list fetch note:', e.message);
      }
    } catch (err) {
      console.warn('Load industry requests note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle selecting a company from search autocomplete
  const handleSelectCompany = (comp) => {
    setFormData(prev => ({
      ...prev,
      companyId: comp.companyId || comp.id || comp.code || '',
      companyName: comp.name || comp.companyName || comp.company_name || '',
      companyEmail: comp.email || comp.officialEmail || comp.recruiterEmail || '',
      industry: comp.industry || prev.industry,
      location: comp.location || comp.headquarters || prev.location,
      website: comp.website || prev.website,
      registrationId: comp.registrationNumber || comp.code || prev.registrationId
    }));
    setCompanySearch(comp.name || comp.companyName || comp.company_name || '');
    setShowCompanyDropdown(false);
  };

  const handleCompanySearchChange = (val) => {
    setCompanySearch(val);
    setShowCompanyDropdown(true);
    setFormData(prev => ({
      ...prev,
      companyName: val,
      companyId: val.trim() ? prev.companyId : ''
    }));
  };

  const matchingCompanies = useMemo(() => {
    if (!companySearch.trim()) return companies.slice(0, 5);
    const q = companySearch.toLowerCase();
    return companies.filter(c =>
      (c.name || c.companyName || c.company_name || '').toLowerCase().includes(q) ||
      (c.industry || '').toLowerCase().includes(q)
    );
  }, [companies, companySearch]);

  const toggleStudent = (id) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s =>
      (s.name || s.fullName || '').toLowerCase().includes(q) ||
      (s.regNo || s.rollNumber || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      if (onShowToast) onShowToast({ title: 'Validation Warning', message: 'Company Name is required.', type: 'warning' });
      return;
    }
    if (!formData.companyEmail.trim()) {
      if (onShowToast) onShowToast({ title: 'Validation Warning', message: 'Company Email is required.', type: 'warning' });
      return;
    }

    const studentIds = formData.shareScope === 'SELECTED_STUDENTS' ? Array.from(selectedStudentIds) : students.map(s => s.studentId || s.id);

    try {
      setSubmitting(true);
      const targetCompanyId = formData.companyId || `COMP-${Date.now().toString().slice(-4)}`;
      const res = await academicService.requestCompanyAccess({
        companyId: targetCompanyId,
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        website: formData.website,
        registrationId: formData.registrationId,
        industry: formData.industry,
        location: formData.location,
        contactPerson: formData.contactPerson,
        contactDesignation: formData.contactDesignation,
        contactPhone: formData.contactPhone,
        message: formData.reason,
        studentIds
      });

      if (res.success) {
        if (onShowToast) {
          onShowToast({
            title: 'Company Access Request Dispatched',
            message: `Read-only student access request for ${studentIds.length} candidate(s) sent to ${formData.companyName}.`,
            type: 'success'
          });
        }
        setShowModal(false);
        setFormData({
          companyId: '', companyName: '', companyEmail: '', website: '', registrationId: '',
          industry: 'Enterprise Software', location: 'Chennai, Tamil Nadu', contactPerson: '',
          contactDesignation: 'Talent Acquisition Lead', contactPhone: '',
          reason: 'Industry collaboration, placement drive, and career readiness evaluation.', shareScope: 'ALL_STUDENTS'
        });
        setSelectedStudentIds(new Set());
        setCompanySearch('');
        loadData();
      } else {
        if (onShowToast) onShowToast({ title: 'Request Failed', message: res.message || 'Error creating request', type: 'error' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Submission Error', message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (requestId, compName) => {
    if (!window.confirm(`Are you sure you want to revoke company access for ${compName || 'this company'}? The company will immediately lose read-only student directory access.`)) {
      return;
    }

    try {
      const res = await academicService.revokeCompanyAccess(requestId);
      if (res.success) {
        if (onShowToast) {
          onShowToast({
            title: 'Access Relationship Revoked',
            message: `Read-only student directory access for ${compName || 'company'} has been revoked.`,
            type: 'success'
          });
        }
        loadData();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Revocation Error', message: err.message, type: 'error' });
    }
  };

  const filteredRequests = useMemo(() => {
    if (activeTab === 'pending') return requests.filter(r => (r.status || '').toUpperCase() === 'PENDING');
    if (activeTab === 'approved') return requests.filter(r => (r.status || '').toUpperCase() === 'ACCEPTED');
    if (activeTab === 'revoked') return requests.filter(r => ['REJECTED', 'REVOKED'].includes((r.status || '').toUpperCase()));
    return requests;
  }, [requests, activeTab]);

  const pendingCount = requests.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;
  const approvedCount = requests.filter(r => (r.status || '').toUpperCase() === 'ACCEPTED').length;
  const revokedCount = requests.filter(r => ['REJECTED', 'REVOKED'].includes((r.status || '').toUpperCase())).length;

  return (
    <div style={{ padding: '24px', color: 'var(--text-primary)', minHeight: '100%' }}>
      {/* ── HEADER BANNER ── */}
      <div className="glass-panel" style={{
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 style={{ color: 'var(--cyber-cyan)', width: '22px', height: '22px' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Company Connections & Read-Only Access Management
              </h1>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Request industry collaborations and control student data sharing rules with verified corporate partners.
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-cyber-primary"
          style={{ padding: '10px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} />
          <span>Request Company Access</span>
        </button>
      </div>

      {/* ── METRIC CARDS & TABS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div
          onClick={() => setActiveTab('all')}
          className="glass-panel hover-glow"
          style={{
            padding: '16px', borderRadius: '12px', cursor: 'pointer',
            border: activeTab === 'all' ? '2px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
            background: activeTab === 'all' ? 'rgba(40, 215, 255, 0.08)' : undefined
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Connections</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{requests.length}</div>
        </div>

        <div
          onClick={() => setActiveTab('pending')}
          className="glass-panel hover-glow"
          style={{
            padding: '16px', borderRadius: '12px', cursor: 'pointer',
            border: activeTab === 'pending' ? '2px solid var(--cyber-amber)' : '1px solid var(--border-subtle)',
            background: activeTab === 'pending' ? 'rgba(245, 158, 11, 0.08)' : undefined
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--cyber-amber)', textTransform: 'uppercase', fontWeight: 700 }}>Pending Requests</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-amber)', marginTop: '4px' }}>{pendingCount}</div>
        </div>

        <div
          onClick={() => setActiveTab('approved')}
          className="glass-panel hover-glow"
          style={{
            padding: '16px', borderRadius: '12px', cursor: 'pointer',
            border: activeTab === 'approved' ? '2px solid var(--cyber-emerald)' : '1px solid var(--border-subtle)',
            background: activeTab === 'approved' ? 'rgba(16, 185, 129, 0.08)' : undefined
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--cyber-emerald)', textTransform: 'uppercase', fontWeight: 700 }}>Approved Connections</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-emerald)', marginTop: '4px' }}>{approvedCount}</div>
        </div>

        <div
          onClick={() => setActiveTab('revoked')}
          className="glass-panel hover-glow"
          style={{
            padding: '16px', borderRadius: '12px', cursor: 'pointer',
            border: activeTab === 'revoked' ? '2px solid var(--cyber-rose)' : '1px solid var(--border-subtle)',
            background: activeTab === 'revoked' ? 'rgba(239, 68, 68, 0.08)' : undefined
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--cyber-rose)', textTransform: 'uppercase', fontWeight: 700 }}>Revoked / Rejected</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-rose)', marginTop: '4px' }}>{revokedCount}</div>
        </div>
      </div>

      {/* ── REQUESTS TABLE ── */}
      <div className="glass-panel" style={{ borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Company Access Requests Roster</span>
            <span className="cyber-badge badge-blue" style={{ fontSize: '10px' }}>
              FILTER: {activeTab.toUpperCase()}
            </span>
          </h2>
          <button onClick={loadData} className="btn-cyber-outline" style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading access requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <Building2 size={36} style={{ color: 'var(--text-dim)', marginBottom: '10px' }} />
            <p style={{ margin: 0, fontSize: '13.5px' }}>No company access requests found in this category.</p>
            <button onClick={() => setShowModal(true)} className="btn-cyber-primary" style={{ marginTop: '14px', padding: '8px 16px', fontSize: '12px' }}>
              Request Company Access
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-hover)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Request ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Target Company</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Roster Scope</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Access Type</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Requested On</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => {
                  const status = (r.status || 'PENDING').toUpperCase();
                  const isApproved = status === 'ACCEPTED';
                  const isRevoked = status === 'REVOKED' || status === 'REJECTED';

                  const badgeClass = isApproved ? 'badge-emerald' : isRevoked ? 'badge-rose' : 'badge-amber';
                  const companyDisplayName = r.companyName || r.company_name || r.companyId;

                  return (
                    <tr key={r.id || r.requestId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--cyber-blue)', fontWeight: 600 }}>
                        {(r.id || r.requestId || 'REQ').slice(0, 8)}...
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Building size={14} color="var(--cyber-cyan)" />
                          <span>{companyDisplayName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="cyber-badge badge-blue" style={{ fontSize: '11px' }}>
                          {r.studentCount || (r.studentIds ? r.studentIds.length : students.length)} Candidates
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                          <Lock size={12} color="var(--cyber-purple)" />
                          <span>READ ONLY</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`cyber-badge ${badgeClass}`} style={{ fontSize: '11px', fontWeight: 700 }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        {r.requestedAt || r.created_at ? new Date(r.requestedAt || r.created_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {isApproved && (
                          <button
                            onClick={() => handleRevoke(r.id || r.requestId, companyDisplayName)}
                            className="btn-cyber-outline"
                            style={{ padding: '4px 10px', fontSize: '11px', borderColor: 'var(--cyber-rose)', color: 'var(--cyber-rose)' }}
                          >
                            <Ban size={12} />
                            <span>Revoke Access</span>
                          </button>
                        )}
                        {!isApproved && !isRevoked && (
                          <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                            Awaiting Corporate Review
                          </span>
                        )}
                        {isRevoked && (
                          <span style={{ fontSize: '11.5px', color: 'var(--cyber-rose)', fontWeight: 600 }}>
                            Access Terminated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── REQUEST COMPANY ACCESS FORM MODAL ── */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto',
            padding: '24px', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)', background: 'var(--bg-card)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} color="var(--cyber-cyan)" />
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '17px', fontWeight: 800 }}>
                  Request Company Access & Student Sharing
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendRequest}>
              {/* ── SEARCH OR ENTER COMPANY ── */}
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  SEARCH OR ENTER COMPANY NAME *
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    value={companySearch}
                    onChange={(e) => handleCompanySearchChange(e.target.value)}
                    placeholder="Type registered company name (e.g. ABC Technologies, TCS)..."
                    style={{
                      width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px',
                      background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)', fontSize: '13.5px'
                    }}
                  />
                </div>

                {/* Search Autocomplete Dropdown */}
                {showCompanyDropdown && matchingCompanies.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                    background: 'var(--bg-card)', border: '1px solid var(--cyber-cyan)',
                    borderRadius: '8px', marginTop: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    maxHeight: '180px', overflowY: 'auto'
                  }}>
                    {matchingCompanies.map(c => (
                      <div
                        key={c.id || c.companyId || c.code}
                        onClick={() => handleSelectCompany(c)}
                        style={{
                          padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                        className="hover-glow"
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {c.name || c.companyName || c.company_name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {c.industry} • {c.location || c.headquarters || 'India'}
                          </div>
                        </div>
                        <span className="cyber-badge badge-blue" style={{ fontSize: '10px' }}>VERIFIED PARTNER</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    COMPANY EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.companyEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
                    placeholder="talent@company.com"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    COMPANY WEBSITE
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://company.com"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    INDUSTRY / SECTOR
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g. Enterprise Software, Data Science"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    LOCATION
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Chennai, Tamil Nadu"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    CONTACT PERSON
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="e.g. Ms. Sarah Jenkins"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    CONTACT PHONE
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* REASON FOR REQUEST */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  REASON FOR ACCESS REQUEST
                </label>
                <textarea
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Provide context for company request (e.g. Industry placement drive, skill mapping)..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
              </div>

              {/* ── MANDATORY READ-ONLY ACCESS DISCLOSURE CARD ── */}
              <div style={{
                padding: '14px 16px', borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)',
                marginBottom: '18px', display: 'flex', gap: '12px', alignItems: 'flex-start'
              }}>
                <Lock size={20} color="var(--cyber-cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-cyan)' }}>
                    Student Data Access Policy — READ ONLY
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Upon approval, the company receives <strong>read-only access</strong> to eligible student academic, skill, project, and career readiness records.
                    The institution and company <strong>cannot modify or alter student records</strong> through company access.
                  </p>
                </div>
              </div>

              {/* SUBMIT CONTROLS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cyber-outline"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-cyber-primary"
                  style={{ padding: '8px 20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  <span>{submitting ? 'Transmitting Request...' : 'Send Access Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
