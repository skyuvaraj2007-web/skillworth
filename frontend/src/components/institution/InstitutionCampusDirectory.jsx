import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  ShieldCheck,
  Search,
  ChevronRight,
  AlertCircle,
  X,
  Mail,
  MapPin,
  Send,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { academicService } from '../../services/academicService';

export default function InstitutionCampusDirectory({ onShowToast }) {
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('partners'); // 'partners' | 'incoming' | 'outgoing'
  const [showModal, setShowModal] = useState(false);
  const [targetInstId, setTargetInstId] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [partneredColleges, setPartneredColleges] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [industryPartners, setIndustryPartners] = useState([]);

  const loadCollaborations = async () => {
    setLoading(true);
    try {
      const res = await academicService.getCollaborations();
      const payload = res?.data || res;
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        setPartneredColleges(payload.partneredColleges || []);
        setIncomingRequests(payload.incomingRequests || []);
        setOutgoingRequests(payload.outgoingRequests || []);
        setIndustryPartners(payload.industryPartners || []);
      } else if (Array.isArray(payload)) {
        setPartneredColleges(payload.filter(c => ['ACTIVE', 'ACCEPTED', 'APPROVED'].includes((c.status || '').toUpperCase())));
        setIncomingRequests(payload.filter(c => (c.status || '').toUpperCase() === 'PENDING' && !c.isOutgoing));
        setOutgoingRequests(payload.filter(c => (c.status || '').toUpperCase() === 'PENDING' && c.isOutgoing));
        setIndustryPartners([]);
      } else {
        setPartneredColleges([]);
        setIncomingRequests([]);
        setOutgoingRequests([]);
        setIndustryPartners([]);
      }
    } catch (err) {
      console.error('Failed to load campus collaborations:', err);
      setPartneredColleges([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setIndustryPartners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborations();
  }, []);

  const activePartners = partneredColleges;

  const handleRespond = async (id, action, type = 'institution') => {
    setActionId(id);
    try {
      const res = await academicService.respondToCollaboration(id, action, type);
      if (res && res.success) {
        if (onShowToast) {
          onShowToast({
            title: action === 'accept' ? 'Collaboration Accepted' : 'Collaboration Declined',
            message: action === 'accept' ? 'Partnership MoU established.' : 'Request declined.',
            type: action === 'accept' ? 'success' : 'info'
          });
        }
        await loadCollaborations();
      } else {
        if (onShowToast) {
          onShowToast({
            title: 'Action Response',
            message: res?.message || 'Collaboration updated.',
            type: 'info'
          });
        }
        await loadCollaborations();
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({ title: 'Error', message: err.message || 'Failed to update request.', type: 'error' });
      }
    } finally {
      setActionId(null);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!targetInstId.trim()) return;
    setSubmitting(true);
    try {
      const res = await academicService.requestCollaboration(targetInstId.trim(), message.trim());
      if (res && res.success) {
        if (onShowToast) {
          onShowToast({
            title: 'Collaboration Proposal Dispatched',
            message: 'Partnership request sent to target institution.',
            type: 'success'
          });
        }
        setShowModal(false);
        setTargetInstId('');
        setMessage('');
        await loadCollaborations();
      } else {
        if (onShowToast) {
          onShowToast({
            title: 'Request Note',
            message: res.message || 'Could not send request.',
            type: 'error'
          });
        }
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({ title: 'Error', message: err.message, type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* ── HEADER & DISPATCH ── */}
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
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Campus Directory & Inter-College Collaborations
              </h1>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Authoritative inter-institution partnerships, joint curriculum drives, and collaborative placement networks.
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
          <span>New College Collaboration</span>
        </button>
      </div>

      {/* ── METRIC STATS ── */}
      <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="metric-stat-card accent-emerald">
          <div className="metric-stat-header">PARTNERED COLLEGES</div>
          <div className="metric-stat-value">{activePartners.length}</div>
          <div className="metric-stat-sub">Active MoUs & Networks</div>
        </div>
        <div className="metric-stat-card accent-amber">
          <div className="metric-stat-header">INCOMING REQUESTS</div>
          <div className="metric-stat-value">{incomingRequests.length}</div>
          <div className="metric-stat-sub">Awaiting Campus Review</div>
        </div>
        <div className="metric-stat-card accent-cyan">
          <div className="metric-stat-header">OUTGOING PROPOSALS</div>
          <div className="metric-stat-value">{outgoingRequests.length}</div>
          <div className="metric-stat-sub">Pending Response</div>
        </div>
        <div className="metric-stat-card accent-purple">
          <div className="metric-stat-header">INDUSTRY PARTNERS</div>
          <div className="metric-stat-value">{industryPartners.length}</div>
          <div className="metric-stat-sub">Corporate MoUs & Hiring</div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('partners')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'partners' ? '1px solid var(--cyber-emerald)' : '1px solid var(--border-subtle)',
            background: activeTab === 'partners' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'partners' ? 'var(--cyber-emerald)' : 'var(--text-secondary)'
          }}
        >
          Partnered Colleges ({activePartners.length})
        </button>
        <button
          onClick={() => setActiveTab('incoming')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'incoming' ? '1px solid var(--cyber-amber)' : '1px solid var(--border-subtle)',
            background: activeTab === 'incoming' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'incoming' ? 'var(--cyber-amber)' : 'var(--text-secondary)'
          }}
        >
          Incoming Requests ({incomingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'outgoing' ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
            background: activeTab === 'outgoing' ? 'rgba(0,242,254,0.12)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'outgoing' ? 'var(--cyber-cyan)' : 'var(--text-secondary)'
          }}
        >
          Outgoing Requests ({outgoingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('industry')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'industry' ? '1px solid var(--cyber-purple, #a855f7)' : '1px solid var(--border-subtle)',
            background: activeTab === 'industry' ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'industry' ? 'var(--cyber-purple, #c084fc)' : 'var(--text-secondary)'
          }}
        >
          Industry Collaborations ({industryPartners.length})
        </button>
      </div>

      {/* ── SECTION 1: PARTNERED COLLEGES ── */}
      {activeTab === 'partners' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              Loading campus directory...
            </div>
          ) : activePartners.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <Building2 size={38} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No partner colleges yet
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Click "New College Collaboration" to connect with peer academic institutions.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Partner College', 'Location', 'Accreditation', 'Departments', 'Partnership Status', 'Established'].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activePartners.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.institutionName || item.targetInstitutionName || item.collegeName || 'Academic Institution'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.code || item.targetInstitutionCode || 'INST-CODE'}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="var(--text-muted)" /> {item.location || 'Tamil Nadu, India'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--cyber-cyan)', fontWeight: 600 }}>
                        {item.naac || 'NAAC A++'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {Array.isArray(item.departments) ? item.departments.slice(0, 3).join(', ') : 'CSE, IT, AI & DS'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge badge-emerald" style={{ fontSize: '10px' }}>
                          ACTIVE PARTNER
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '11px' }}>
                        {item.since || item.created_at ? new Date(item.since || item.created_at).toLocaleDateString() : 'Active'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 2: INCOMING REQUESTS ── */}
      {activeTab === 'incoming' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {incomingRequests.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <AlertCircle size={38} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No collaboration requests yet
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Incoming partnership invitations from other colleges will appear here for review.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Requesting College', 'Location', 'Collaboration Proposal Message', 'Date Received', 'Actions'].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incomingRequests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{req.institutionName || req.requesterInstitutionName || req.collegeName || 'Peer Institution'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.code || req.requesterInstitutionCode || 'INST-REQUESTER'}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {req.location || 'India'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {req.requestMessage || req.message || 'Inter-college student project and placement synergy.'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '11px' }}>
                        {req.requestDate || req.created_at ? new Date(req.requestDate || req.created_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleRespond(req.id, 'accept', 'institution')}
                            disabled={actionId === req.id}
                            className="btn-cyber-primary"
                            style={{ padding: '5px 12px', fontSize: '11px' }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespond(req.id, 'reject', 'institution')}
                            disabled={actionId === req.id}
                            className="btn-cyber-outline"
                            style={{ padding: '5px 12px', fontSize: '11px', borderColor: 'var(--cyber-rose)', color: 'var(--cyber-rose)' }}
                          >
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 3: OUTGOING REQUESTS ── */}
      {activeTab === 'outgoing' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {outgoingRequests.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <Clock size={38} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No outgoing collaboration requests pending
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Proposals you send to partner institutions will be tracked here.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Target Institution', 'Sent Date', 'Proposal Message', 'Status'].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {outgoingRequests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{req.requestedInstitution || req.targetInstitutionName || req.collegeName || 'Target Campus'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.code || req.targetInstitutionCode || 'INST-TARGET'}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '11px' }}>
                        {req.date || req.created_at ? new Date(req.date || req.created_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {req.requestMessage || req.message || 'Inter-college placement and learning partnership proposal.'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge badge-amber" style={{ fontSize: '10px' }}>
                          PENDING PARTNER ACCEPTANCE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 4: INDUSTRY COLLABORATIONS ── */}
      {activeTab === 'industry' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {industryPartners.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <Building2 size={38} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No industry collaboration requests yet
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Industry recruitment drives, hiring partnerships, and corporate MoUs will appear here.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Company Name', 'Sector / Industry', 'Location', 'Partnership Tier', 'Message / Scope', 'Status', 'Action'].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {industryPartners.map((ind) => {
                    const isPending = (ind.status || '').toUpperCase() === 'PENDING';
                    const isActive = ['ACTIVE', 'ACCEPTED', 'APPROVED'].includes((ind.status || '').toUpperCase());
                    return (
                      <tr key={ind.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ind.companyName || 'Corporate Partner'}</div>
                          {ind.website && (
                            <a href={ind.website} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--cyber-cyan)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              Visit Portal <ExternalLink size={10} />
                            </a>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                          {ind.industry || 'Technology'}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                          {ind.location || 'India'}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--cyber-purple, #c084fc)', fontWeight: 600 }}>
                          {ind.tier || 'Prime Hiring Partner'}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                          {ind.message || 'Corporate placement and skill development partnership.'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className={`badge ${isActive ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '10px' }}>
                            {ind.status ? ind.status.toUpperCase() : 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {isPending ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleRespond(ind.id, 'accept', 'company')}
                                disabled={actionId === ind.id}
                                className="btn-cyber-primary"
                                style={{ padding: '5px 12px', fontSize: '11px' }}
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRespond(ind.id, 'reject', 'company')}
                                disabled={actionId === ind.id}
                                className="btn-cyber-outline"
                                style={{ padding: '5px 12px', fontSize: '11px', borderColor: 'var(--cyber-rose)', color: 'var(--cyber-rose)' }}
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {ind.requestedDate ? new Date(ind.requestedDate).toLocaleDateString() : 'Partnered'}
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
      )}

      {/* ── NEW COLLABORATION MODAL ── */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '28px', border: '1px solid var(--cyber-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Request College Collaboration MoU
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRequest}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Target Institution ID / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter target institution identifier or name..."
                  value={targetInstId}
                  onChange={(e) => setTargetInstId(e.target.value)}
                  className="cyber-input"
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Partnership Proposal & Scope
                </label>
                <textarea
                  rows={4}
                  placeholder="State the objective (e.g., Shared student placement drives, collaborative project hackathons)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="cyber-input"
                  style={{ width: '100%', fontSize: '12.5px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cyber-outline"
                  style={{ padding: '8px 16px', fontSize: '12.5px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-cyber-primary"
                  style={{ padding: '8px 18px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  <span>{submitting ? 'Sending...' : 'Send Collaboration Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
