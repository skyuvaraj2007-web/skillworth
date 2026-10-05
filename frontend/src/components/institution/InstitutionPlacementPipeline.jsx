import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  GraduationCap,
  Users,
  Award,
  TrendingUp,
  CheckCircle2,
  Building,
  DollarSign,
  ArrowRight,
  Filter,
  CheckSquare,
  Square,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  FileCheck
} from 'lucide-react';
import { academicService } from '../../services/academicService';

export default function InstitutionPlacementPipeline({ onShowToast, initialTab = 'pipeline' }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab); // 'pipeline' | 'selected'

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedAppIds, setSelectedAppIds] = useState(new Set());
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await academicService.getApplications();
      if (res && res.success && Array.isArray(res.applications)) {
        setApplications(res.applications);
      } else if (res && res.success && Array.isArray(res.data)) {
        setApplications(res.data);
      } else if (Array.isArray(res)) {
        setApplications(res);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Failed to load applications for placement pipeline:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Compute distinct companies
  const companyList = ['All', ...Array.from(new Set(applications.map(a => a.companyName || a.company || 'Unknown Recruiter').filter(Boolean)))];

  // Filter applications by company & search
  const filteredApplications = applications.filter(app => {
    const comp = app.companyName || app.company || 'Unknown Recruiter';
    const matchesCompany = selectedCompany === 'All' || comp === selectedCompany;
    const name = (app.studentName || app.name || '').toLowerCase();
    const regNo = (app.studentRegNo || app.regNo || app.rollNo || '').toLowerCase();
    const title = (app.opportunityTitle || app.role || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || name.includes(q) || regNo.includes(q) || title.includes(q);
    return matchesCompany && matchesSearch;
  });

  // Selected for test subset
  const selectedForTestApps = applications.filter(a => {
    const stage = (a.currentStage || a.stage || '').toUpperCase();
    return stage === 'SELECTED_FOR_TEST' || stage === 'SELECTED FOR TEST' || stage === 'TEST_COMPLETED';
  });

  // Dynamic funnel numbers
  const getFunnelCounts = (list) => {
    const counts = {
      applied: 0,
      shortlisted: 0,
      selectedForTest: 0,
      interview: 0,
      selected: 0,
      joined: 0
    };
    list.forEach(a => {
      const stage = (a.currentStage || a.stage || '').toUpperCase();
      if (stage.includes('APPL') || stage.includes('SUBMIT')) counts.applied++;
      else if (stage.includes('SHORT') || stage.includes('REVIEW')) counts.shortlisted++;
      else if (stage.includes('TEST')) counts.selectedForTest++;
      else if (stage.includes('INTERVIEW')) counts.interview++;
      else if (stage.includes('SELECT') || stage.includes('OFFER')) counts.selected++;
      else if (stage.includes('JOIN') || stage.includes('ACCEPT')) counts.joined++;
      else counts.applied++;
    });
    return counts;
  };

  const funnelCounts = getFunnelCounts(filteredApplications);

  const getStageBadge = (stageRaw) => {
    const st = (stageRaw || 'APPLIED').toUpperCase();
    if (st.includes('JOIN') || st.includes('ACCEPT')) {
      return { label: 'JOINED', color: 'var(--cyber-blue)', bg: 'rgba(59, 130, 246, 0.15)' };
    }
    if (st.includes('SELECT') && !st.includes('TEST')) {
      return { label: 'SELECTED', color: 'var(--cyber-emerald)', bg: 'rgba(16, 185, 129, 0.15)' };
    }
    if (st.includes('TEST')) {
      return { label: 'SELECTED FOR TEST', color: 'var(--cyber-cyan)', bg: 'rgba(6, 182, 212, 0.18)' };
    }
    if (st.includes('INTERVIEW')) {
      return { label: 'INTERVIEW', color: 'var(--cyber-amber)', bg: 'rgba(245, 158, 11, 0.15)' };
    }
    if (st.includes('SHORT') || st.includes('REVIEW')) {
      return { label: 'SHORTLISTED', color: 'var(--cyber-purple)', bg: 'rgba(168, 85, 247, 0.15)' };
    }
    return { label: 'APPLIED', color: 'var(--text-muted)', bg: 'rgba(255, 255, 255, 0.06)' };
  };

  const handleSelectStudentForTest = async (appId) => {
    setProcessingId(appId);
    try {
      const res = await academicService.selectStudentForTest(appId);
      if (res && res.success) {
        if (onShowToast) {
          onShowToast({
            title: 'Testing Dispatched',
            message: 'Student selected for company test. Multi-party notification sent.',
            type: 'success'
          });
        }
        await loadApplications();
      } else {
        if (onShowToast) {
          onShowToast({
            title: 'Action Update',
            message: res.message || 'Updated application status.',
            type: 'info'
          });
        }
        await loadApplications();
      }
    } catch (err) {
      console.error('Error selecting student for test:', err);
      if (onShowToast) {
        onShowToast({
          title: 'Error',
          message: err.message || 'Failed to select student for test.',
          type: 'error'
        });
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkSelectForTest = async () => {
    if (selectedAppIds.size === 0) return;
    setProcessingId('bulk');
    let successCount = 0;
    try {
      for (const id of selectedAppIds) {
        const res = await academicService.selectStudentForTest(id);
        if (res && res.success) successCount++;
      }
      setSelectedAppIds(new Set());
      if (onShowToast) {
        onShowToast({
          title: 'Bulk Dispatch Complete',
          message: `Successfully selected ${successCount} candidates for company testing.`,
          type: 'success'
        });
      }
      await loadApplications();
    } catch (err) {
      console.error('Bulk selection error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedAppIds.size === filteredApplications.length) {
      setSelectedAppIds(new Set());
    } else {
      setSelectedAppIds(new Set(filteredApplications.map(a => a.id || a.applicationId)));
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedAppIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAppIds(next);
  };

  return (
    <div>
      {/* ── TOP BANNER & METRICS ── */}
      <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="metric-stat-card accent-cyan">
          <div className="metric-stat-header">TOTAL APPLICATIONS</div>
          <div className="metric-stat-value">{applications.length}</div>
          <div className="metric-stat-sub">Across All Campus Drives</div>
        </div>
        <div className="metric-stat-card accent-purple">
          <div className="metric-stat-header">TESTING PIPELINE</div>
          <div className="metric-stat-value">{selectedForTestApps.length}</div>
          <div className="metric-stat-sub">Selected for Company Assessment</div>
        </div>
        <div className="metric-stat-card accent-emerald">
          <div className="metric-stat-header">HIRES & SELECTIONS</div>
          <div className="metric-stat-value">{funnelCounts.selected + funnelCounts.joined}</div>
          <div className="metric-stat-sub">Direct Offers & Placements</div>
        </div>
        <div className="metric-stat-card accent-amber">
          <div className="metric-stat-header">PARTICIPATING COMPANIES</div>
          <div className="metric-stat-value">{Math.max(0, companyList.length - 1)}</div>
          <div className="metric-stat-sub">With Live Candidate Applications</div>
        </div>
      </div>

      {/* ── TAB NAVIGATION & ACTIONS ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('pipeline')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: activeTab === 'pipeline' ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
              background: activeTab === 'pipeline' ? 'rgba(0,242,254,0.12)' : 'rgba(255,255,255,0.02)',
              color: activeTab === 'pipeline' ? 'var(--cyber-cyan)' : 'var(--text-secondary)'
            }}
          >
            <TrendingUp size={16} /> Placement Funnel & Roster ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('selected')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: activeTab === 'selected' ? '1px solid var(--cyber-emerald)' : '1px solid var(--border-subtle)',
              background: activeTab === 'selected' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.02)',
              color: activeTab === 'selected' ? 'var(--cyber-emerald)' : 'var(--text-secondary)'
            }}
          >
            <FileCheck size={16} /> Selected Students ({selectedForTestApps.length})
          </button>
        </div>

        {selectedAppIds.size > 0 && activeTab === 'pipeline' && (
          <button
            onClick={handleBulkSelectForTest}
            disabled={processingId === 'bulk'}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, var(--cyber-cyan), #3b82f6)',
              color: '#050a18',
              border: 'none',
              boxShadow: '0 0 15px rgba(0,242,254,0.3)'
            }}
          >
            <Sparkles size={16} /> Select {selectedAppIds.size} Candidates for Company Testing
          </button>
        )}
      </div>

      {/* ── COMPANY RECRUITMENT FUNNEL BREAKDOWN ── */}
      {activeTab === 'pipeline' && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={16} color="var(--cyber-cyan)" /> Live Recruitment Stage Funnel
              </h3>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Applied → Shortlisted → Selected for Test → Technical Interview → Selected → Joined
              </span>
            </div>

            {/* Company Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {companyList.map(comp => (
                <button
                  key={comp}
                  onClick={() => setSelectedCompany(comp)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: selectedCompany === comp ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                    background: selectedCompany === comp ? 'rgba(0,242,254,0.12)' : 'transparent',
                    color: selectedCompany === comp ? 'var(--cyber-cyan)' : 'var(--text-muted)'
                  }}
                >
                  {comp}
                </button>
              ))}
            </div>
          </div>

          {/* 6-Stage Real Funnel */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            padding: '16px',
            background: 'rgba(10,16,30,0.6)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)'
          }}>
            {[
              { stage: 'Applied', count: funnelCounts.applied, color: 'var(--text-muted)' },
              { stage: 'Shortlisted', count: funnelCounts.shortlisted, color: 'var(--cyber-purple)' },
              { stage: 'Selected for Test', count: funnelCounts.selectedForTest, color: 'var(--cyber-cyan)' },
              { stage: 'Interview', count: funnelCounts.interview, color: 'var(--cyber-amber)' },
              { stage: 'Selected', count: funnelCounts.selected, color: 'var(--cyber-emerald)' },
              { stage: 'Joined', count: funnelCounts.joined, color: 'var(--cyber-blue)' }
            ].map((st, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '10px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: st.color, fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>
                  {st.count}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{st.stage}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SEARCH BAR ── */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 14px',
          borderRadius: '8px',
          background: 'rgba(10,16,30,0.7)',
          border: '1px solid var(--border-subtle)'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search candidate by student name, roll number, or role..."
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
      </div>

      {/* ── MAIN CANDIDATE TABLE (PIPELINE TAB) ── */}
      {activeTab === 'pipeline' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={toggleSelectAll}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: selectedAppIds.size === filteredApplications.length && filteredApplications.length > 0 ? 'var(--cyber-cyan)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {selectedAppIds.size === filteredApplications.length && filteredApplications.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Active Recruitment Candidate Roster ({filteredApplications.length})
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Real-time application records from database
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              Loading real-time placement applications...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <AlertCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No student applications or placement pipeline records available yet.
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                When students apply for company opportunities or campus drives, they will appear dynamically in this pipeline.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '10px 14px', width: '40px' }}></th>
                    {['Candidate', 'Department', 'CGPA', 'Recruiter', 'Opportunity Role', 'Funnel Stage', 'Actions'].map((h, i) => (
                      <th key={i} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '10.5px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => {
                    const id = app.id || app.applicationId;
                    const badge = getStageBadge(app.currentStage || app.stage);
                    const isSelectedForTest = (app.currentStage || app.stage || '').toUpperCase().includes('TEST');
                    const isChecked = selectedAppIds.has(id);

                    return (
                      <tr
                        key={id}
                        style={{ borderBottom: '1px solid var(--border-subtle)', background: isChecked ? 'rgba(0,242,254,0.03)' : 'transparent' }}
                        onMouseEnter={(e) => !isChecked && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={(e) => !isChecked && (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => toggleSelectOne(id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isChecked ? 'var(--cyber-cyan)' : 'var(--text-muted)' }}
                          >
                            {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.studentName || app.name || 'Candidate'}</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {app.studentRegNo || app.regNo || app.rollNo || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{app.studentDepartment || app.department || 'CSE'}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--cyber-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {app.studentCgpa || app.cgpa || '8.0'}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {app.companyName || app.company || 'Unknown'}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                          {app.opportunityTitle || app.role || 'Software Engineering Track'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            background: badge.bg,
                            color: badge.color,
                            letterSpacing: '0.04em'
                          }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          {!isSelectedForTest ? (
                            <button
                              onClick={() => handleSelectStudentForTest(id)}
                              disabled={processingId === id}
                              style={{
                                background: 'rgba(0,242,254,0.1)',
                                border: '1px solid var(--cyber-cyan)',
                                color: 'var(--cyber-cyan)',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Sparkles size={12} /> {processingId === id ? 'Selecting...' : 'Select for Company Testing'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--cyber-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <CheckCircle2 size={14} /> Ready for Test
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

      {/* ── DEDICATED "SELECTED STUDENTS" TAB ── */}
      {activeTab === 'selected' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-emerald)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> Selected Students for Company Testing ({selectedForTestApps.length})
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Candidates cleared and routed to company testing and assessment pipeline
              </span>
            </div>
          </div>

          {selectedForTestApps.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <AlertCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No selected students yet.
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Use the Placement Funnel & Roster tab and click "Select for Company Testing" to add students to this assessment cohort.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Student Name', 'Roll / Reg No', 'Department', 'CGPA', 'Target Company', 'Opportunity Title', 'Funnel Stage', 'Testing Status', 'Date Selected'].map((h, i) => (
                      <th key={i} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '10.5px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedForTestApps.map((app) => {
                    const id = app.id || app.applicationId;
                    const dateSelected = app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : 'Recent';
                    return (
                      <tr
                        key={id}
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {app.studentName || app.name || 'Candidate'}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {app.studentRegNo || app.regNo || app.rollNo || 'N/A'}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                          {app.studentDepartment || app.department || 'CSE'}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--cyber-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {app.studentCgpa || app.cgpa || '8.0'}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {app.companyName || app.company || 'Recruiter'}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                          {app.opportunityTitle || app.role || 'Direct Campus Track'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            background: 'rgba(6,182,212,0.18)',
                            color: 'var(--cyber-cyan)'
                          }}>
                            SELECTED FOR TEST
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            background: 'rgba(16,185,129,0.15)',
                            color: 'var(--cyber-emerald)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <CheckCircle2 size={12} /> Test Dispatched
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {dateSelected}
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
    </div>
  );
}
