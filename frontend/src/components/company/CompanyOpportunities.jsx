import React, { useState, useMemo, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Clock,
  Users,
  UserCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  X
} from 'lucide-react';

export default function CompanyOpportunities({
  opportunities = [],
  filterType = 'All', // 'All' | 'Internships' | 'Full-Time' | 'Apprenticeships'
  currentTab = 'opportunities',
  onCreateOpportunity,
  onUpdateOpportunity,
  onDeleteOpportunity,
  onCloseOpportunity,
  onFindMatchingStudents,
  onShowToast,
  user
}) {
  const isJobsMode = currentTab === 'jobs' || filterType === 'Full-Time';
  const isInternshipsMode = currentTab === 'internships' || filterType === 'Internships';

  const [activeTab, setActiveTab] = useState(() => {
    if (isJobsMode) return 'Full-Time';
    if (isInternshipsMode) return 'Internships';
    return filterType || 'All';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [deleteTargetOpp, setDeleteTargetOpp] = useState(null);

  useEffect(() => {
    if (isJobsMode) {
      setActiveTab('Full-Time');
    } else if (isInternshipsMode) {
      setActiveTab('Internships');
    } else if (filterType) {
      setActiveTab(filterType);
    }
  }, [filterType, isJobsMode, isInternshipsMode]);

  // Form State for Create / Edit Opportunity
  const [formData, setFormData] = useState({
    type: isJobsMode ? 'Full-Time' : 'Internship',
    title: '',
    description: '',
    department: 'Computer Science & Engineering',
    requiredSkills: 'Python, SQL, Problem Solving, Git, Communication',
    preferredSkills: 'Docker, FastAPI, Redis',
    skillWeights: { 'Python': 30, 'SQL': 20, 'Problem Solving': 20, 'Git': 15, 'Communication': 15 },
    minimumQualification: 'B.Tech / B.E.',
    graduationYear: '2026',
    eligibleColleges: 'All Partnered Colleges',
    eligibleDepartments: 'CSE, IT, AI & DS',
    eligibleYears: '3rd Year, 4th Year',
    minProgress: 80,
    minMatch: 80,
    location: 'Chennai (Hybrid)',
    workMode: 'Hybrid',
    positions: 4,
    deadline: '2026-10-15',
    assessmentRequirement: true,
    selectionProcess: 'Resume Evidence Screening → Proctored Code Diagnostic → Technical Interview'
  });

  const companyName = user?.companyName || user?.company || 'TechCorp Global Systems';

  // Defensive list of opportunities
  const safeOpps = useMemo(() => {
    return Array.isArray(opportunities) ? opportunities : [];
  }, [opportunities]);

  // Handle Tab Switch and Filtering
  const filteredOpps = useMemo(() => {
    return safeOpps.filter(opp => {
      if (!opp || typeof opp !== 'object') return false;
      const oppType = (opp.type || '').toLowerCase();

      // Type Tab Filter
      if (activeTab === 'Internships') {
        if (!oppType.includes('intern')) return false;
      } else if (activeTab === 'Full-Time') {
        if (!oppType.includes('full') && !oppType.includes('job')) return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (opp.title || opp.role || '').toLowerCase().includes(q);
        const matchesDept = (opp.department || '').toLowerCase().includes(q);
        const matchesLocation = (opp.location || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDept && !matchesLocation) return false;
      }

      return true;
    });
  }, [safeOpps, activeTab, searchQuery]);

  const handleOpenCreate = () => {
    setEditingOpp(null);
    setFormData({
      type: isJobsMode ? 'Full-Time' : 'Internship',
      title: '',
      description: '',
      department: 'Computer Science & Engineering',
      requiredSkills: 'Python, SQL, Problem Solving, Git, Communication',
      preferredSkills: 'Docker, FastAPI, Redis',
      skillWeights: { 'Python': 30, 'SQL': 20, 'Problem Solving': 20, 'Git': 15, 'Communication': 15 },
      minimumQualification: 'B.Tech / B.E.',
      graduationYear: '2026',
      eligibleColleges: 'All Partnered Colleges',
      eligibleDepartments: 'CSE, IT, AI & DS',
      eligibleYears: '3rd Year, 4th Year',
      minProgress: 80,
      minMatch: 80,
      location: 'Chennai (Hybrid)',
      workMode: 'Hybrid',
      positions: 4,
      deadline: '2026-10-15',
      assessmentRequirement: true,
      selectionProcess: 'Resume Evidence Screening → Proctored Code Diagnostic → Technical Interview'
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (opp) => {
    setEditingOpp(opp);
    const reqSkillsList = Array.isArray(opp.requiredSkills)
      ? opp.requiredSkills.map(s => typeof s === 'string' ? s : s.name).join(', ')
      : (opp.requiredSkills || '');

    setFormData({
      type: opp.type || opp.opportunityType || 'Internship',
      title: opp.title || opp.role || '',
      description: opp.description || '',
      department: opp.department || 'Computer Science & Engineering',
      requiredSkills: reqSkillsList,
      preferredSkills: Array.isArray(opp.preferredSkills) ? opp.preferredSkills.join(', ') : (opp.preferredSkills || ''),
      skillWeights: opp.skillWeights || {},
      minimumQualification: opp.minimumQualification || opp.minimum_qualification || 'B.Tech / B.E.',
      graduationYear: opp.graduationYear || opp.graduation_year || '2026',
      eligibleColleges: opp.eligibleColleges || 'All Partnered Colleges',
      eligibleDepartments: opp.eligibleDepartments || 'CSE, IT, AI & DS',
      eligibleYears: opp.eligibleYears || '3rd Year, 4th Year',
      minProgress: opp.minProgress || 80,
      minMatch: opp.minMatch || 80,
      location: opp.location || 'Chennai',
      workMode: opp.workMode || opp.mode || 'Hybrid',
      positions: opp.positions || 4,
      deadline: opp.deadline ? opp.deadline.split('T')[0] : '2026-10-15',
      assessmentRequirement: opp.assessmentRequirement !== undefined ? Boolean(opp.assessmentRequirement) : true,
      selectionProcess: opp.selectionProcess || 'Screening → Assessment → Interview'
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveOpportunity = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please provide an opportunity title.');
      return;
    }

    const oppId = editingOpp ? (editingOpp.opportunityId || editingOpp.oppId || editingOpp.id) : `OPP-${Date.now().toString().slice(-4)}`;

    const parsedRequired = typeof formData.requiredSkills === 'string'
      ? formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
      : (formData.requiredSkills || []);

    const parsedPreferred = typeof formData.preferredSkills === 'string'
      ? formData.preferredSkills.split(',').map(s => s.trim()).filter(Boolean)
      : (formData.preferredSkills || []);

    const oppPayload = {
      opportunityId: oppId,
      oppId: oppId,
      id: oppId,
      title: formData.title,
      role: formData.title,
      type: formData.type,
      opportunityType: formData.type,
      department: formData.department,
      company: companyName,
      companyName: companyName,
      companyId: user?.companyId || 'COM001',
      location: formData.location,
      workMode: formData.workMode,
      positions: parseInt(formData.positions) || 2,
      deadline: formData.deadline,
      minProgress: parseInt(formData.minProgress) || 80,
      minMatch: parseInt(formData.minMatch) || 80,
      description: formData.description,
      requiredSkills: parsedRequired,
      preferredSkills: parsedPreferred,
      skillWeights: formData.skillWeights || {},
      minimumQualification: formData.minimumQualification,
      graduationYear: Number(formData.graduationYear) || 2026,
      assessmentRequirement: Boolean(formData.assessmentRequirement),
      eligibleColleges: formData.eligibleColleges,
      eligibleDepartments: formData.eligibleDepartments,
      eligibleYears: formData.eligibleYears,
      selectionProcess: formData.selectionProcess,
      status: editingOpp ? (editingOpp.status || 'Active') : 'Active',
      applicantsCount: editingOpp ? (editingOpp.applicantsCount ?? editingOpp.applicantCount ?? editingOpp.applicants ?? 0) : 0,
      shortlistedCount: editingOpp ? (editingOpp.shortlistedCount ?? editingOpp.shortlisted ?? 0) : 0,
      createdAt: editingOpp ? editingOpp.createdAt : new Date().toISOString()
    };

    if (editingOpp) {
      if (onUpdateOpportunity) onUpdateOpportunity(oppPayload);
      if (onShowToast) onShowToast({ title: 'Opportunity Updated', message: `"${formData.title}" was updated successfully.`, type: 'success' });
    } else {
      if (onCreateOpportunity) onCreateOpportunity(oppPayload);
      if (onShowToast) onShowToast({ title: 'Opportunity Published', message: `"${formData.title}" is now published on the Sovereign Ledger.`, type: 'success' });
    }

    setIsCreateModalOpen(false);
  };

  return (
    <div className="comp-stack">
      {/* ── TOP TELEMETRY TAG ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div className="comp-telemetry-tag">
          <span>SKILLNEXUS ENTERPRISE</span>
          <span>//</span>
          <span>{isJobsMode ? 'FULL-TIME JOBS & CAREER OPENINGS' : isInternshipsMode ? 'INTERNSHIP OPPORTUNITIES & PIPELINE' : 'OPPORTUNITY PIPELINE & LEDGER POSTINGS'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="comp-badge comp-badge-purple">
            {filteredOpps.length} {isJobsMode ? 'JOBS' : isInternshipsMode ? 'INTERNSHIPS' : 'ROLES'}
          </span>
        </div>
      </div>

      {/* Screen Title & Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
            Opportunities
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94A3B8)', marginTop: '4px', margin: 0 }}>
            Create and manage job opportunities, internships and apprenticeships.
          </p>
        </div>

        <button
          type="button"
          className="btn-cyber-primary"
          onClick={handleOpenCreate}
          style={{ padding: '8px 20px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} />
          <span>Create Opportunity</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '14px', paddingBottom: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{
          display: 'flex', padding: '3px', borderRadius: '10px',
          background: 'rgba(10, 18, 36, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)'
        }}>
          {[
            { id: 'All', label: 'All' },
            { id: 'Internships', label: 'Internships' },
            { id: 'Full-Time', label: 'Full-Time' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(59,130,246,0.2) 100%)' : 'transparent',
                color: activeTab === tab.id ? '#00D4FF' : 'var(--text-muted, #94A3B8)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #94A3B8)' }} />
          <input
            type="text"
            placeholder="Filter by title, role or location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="company-input"
            style={{ width: '100%', paddingLeft: '32px' }}
          />
        </div>
      </div>

      {/* Opportunity Cards Grid */}
      <div className="comp-grid-3">
        {filteredOpps.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted, #94A3B8)' }} className="comp-card">
            <Briefcase size={36} style={{ margin: '0 auto 12px', opacity: 0.4, color: '#00D4FF' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>No opportunities found</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted, #94A3B8)', maxWidth: '400px', margin: '0 auto 16px' }}>
              No postings match your current filter. Click "Create Opportunity" to publish a new role.
            </p>
            <button
              type="button"
              className="btn-cyber-primary"
              onClick={handleOpenCreate}
              style={{ padding: '6px 16px', fontSize: '12px' }}
            >
              + Create Opportunity
            </button>
          </div>
        ) : (
          filteredOpps.map((opp, idx) => {
            const oppKey = opp.opportunityId || opp.oppId || opp.id || `opp-${idx}`;
            const skills = Array.isArray(opp.requiredSkills)
              ? opp.requiredSkills
              : typeof opp.requiredSkills === 'string'
                ? opp.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
                : ['React', 'Python'];
            const appCount = opp.applicantsCount ?? opp.applicantCount ?? opp.applicants ?? 0;
            const shortCount = opp.shortlistedCount ?? opp.shortlisted ?? 0;
            const isActive = opp.status === 'Active' || opp.status === 'ACTIVE';

            return (
              <div key={oppKey} className="comp-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {/* Top line: Type Badge + Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="comp-badge comp-badge-cyan">
                      {opp.type || 'Internship'}
                    </span>
                    <span className={`comp-badge ${isActive ? 'comp-badge-emerald' : 'comp-badge-amber'}`}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isActive ? '#10B981' : '#F59E0B' }} />
                      <span>{opp.status || 'Active'}</span>
                    </span>
                  </div>

                  {/* Title & Department */}
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 4px' }}>{opp.title || opp.role || 'Untitled Opportunity'}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted, #94A3B8)', margin: '0 0 10px' }}>{opp.department || 'Engineering'}</p>

                  {/* Location & Mode */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary, #94A3B8)', marginBottom: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#00D4FF" />
                      <span>{opp.location || 'Chennai (Hybrid)'}</span>
                    </span>
                    <span>•</span>
                    <span>{opp.workMode || opp.mode || 'Hybrid'}</span>
                  </div>

                  {/* Required Skills Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {skills.slice(0, 4).map((sk, i) => (
                      <span key={i} style={{
                        fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-secondary, #94A3B8)', fontFamily: 'var(--font-mono)'
                      }}>
                        {typeof sk === 'object' ? sk.name : sk}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted, #94A3B8)' }}>
                        +{skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom: Applicant metrics + Action Buttons */}
                <div style={{ paddingTop: '14px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted, #94A3B8)', marginBottom: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={13} color="#00D4FF" />
                      <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{appCount}</strong> Applications
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <UserCheck size={13} color="#8B5CF6" />
                      <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{shortCount}</strong> Shortlisted
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => onFindMatchingStudents && onFindMatchingStudents(opp)}
                      className="btn-cyber-primary"
                      style={{ padding: '5px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Find matching skilled candidates"
                    >
                      <Sparkles size={12} />
                      <span>Find Candidates</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(opp)}
                      className="btn-cyber-outline"
                      style={{ padding: '5px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>

                    {isActive ? (
                      <button
                        type="button"
                        onClick={() => onCloseOpportunity && onCloseOpportunity(oppKey)}
                        className="btn-cyber-outline"
                        style={{ padding: '5px 10px', fontSize: '11px', color: '#F59E0B', borderColor: 'rgba(245,158,11,0.3)' }}
                      >
                        Close
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)' }}>Closed</span>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteTargetOpp(opp)}
                      className="btn-cyber-outline"
                      style={{ padding: '5px 8px', fontSize: '11px', color: '#F43F5E', borderColor: 'rgba(244,63,94,0.3)' }}
                      title="Delete Opportunity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── CREATE / EDIT OPPORTUNITY MODAL (Cyber Theme) ── */}
      {isCreateModalOpen && (
        <div className="company-modal-overlay">
          <div className="company-modal-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00D4FF' }}>
                  <Briefcase size={16} />
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {editingOpp ? 'Edit Opportunity Posting' : 'Publish Opportunity to Talent Ledger'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94A3B8)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOpportunity} className="comp-stack-sm">
              <div className="comp-grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>Role Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="company-select"
                    style={{ width: '100%' }}
                  >
                    <option value="Internship">Internship</option>
                    <option value="Full-Time">Full-Time (Graduate Role)</option>
                    <option value="Apprenticeship">Apprenticeship</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>Positions Available</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.positions}
                    onChange={(e) => setFormData({ ...formData, positions: e.target.value })}
                    className="company-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>Opportunity Title</label>
                <input
                  type="text"
                  placeholder="e.g. Associate Cloud & Full-Stack Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="company-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div className="comp-grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>Department Target</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science & Engineering"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="company-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>Location &amp; Work Mode</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Chennai"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="company-input"
                      style={{ flex: 1 }}
                    />
                    <select
                      value={formData.workMode}
                      onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                      className="company-select"
                      style={{ width: '100px' }}
                    >
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                      <option value="On-Site">On-Site</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>Opportunity Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the role responsibilities, team, and expected project contributions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="company-input"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div className="comp-grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>Minimum Qualification</label>
                  <select
                    value={formData.minimumQualification}
                    onChange={(e) => setFormData({ ...formData, minimumQualification: e.target.value })}
                    className="company-select"
                    style={{ width: '100%' }}
                  >
                    <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                    <option value="M.Tech / M.E.">M.Tech / M.E.</option>
                    <option value="BCA / MCA">BCA / MCA</option>
                    <option value="B.Sc / M.Sc">B.Sc / M.Sc</option>
                    <option value="Any Degree">Any Technical Degree</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>Graduation Batch / Year</label>
                  <select
                    value={formData.graduationYear}
                    onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                    className="company-select"
                    style={{ width: '100%' }}
                  >
                    <option value="2024">2024 (Graduated)</option>
                    <option value="2025">2025 (Final Year)</option>
                    <option value="2026">2026 (Pre-Final Year)</option>
                    <option value="2027">2027 (Sophomore)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>
                  Required Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Python, SQL, Problem Solving, Git, Communication"
                  value={formData.requiredSkills}
                  onChange={(e) => {
                    const val = e.target.value;
                    const skills = val.split(',').map(s => s.trim()).filter(Boolean);
                    const newWeights = { ...(formData.skillWeights || {}) };
                    if (skills.length > 0) {
                      const even = Math.round(100 / skills.length);
                      skills.forEach(s => {
                        if (!newWeights[s]) newWeights[s] = even;
                      });
                    }
                    setFormData({ ...formData, requiredSkills: val, skillWeights: newWeights });
                  }}
                  className="company-input"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Dynamic Skill Importance & Weights Manager */}
              {(() => {
                const skillsList = (typeof formData.requiredSkills === 'string' ? formData.requiredSkills.split(',') : [])
                  .map(s => s.trim())
                  .filter(Boolean);
                if (skillsList.length === 0) return null;

                const currentWeights = formData.skillWeights || {};
                const totalWeight = skillsList.reduce((acc, s) => acc + (Number(currentWeights[s]) || 0), 0);

                const handleBalanceWeights = () => {
                  const even = Math.floor(100 / skillsList.length);
                  const remainder = 100 - (even * skillsList.length);
                  const balanced = {};
                  skillsList.forEach((s, idx) => {
                    balanced[s] = even + (idx === 0 ? remainder : 0);
                  });
                  setFormData({ ...formData, skillWeights: balanced });
                };

                return (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 212, 255, 0.04)',
                    border: '1px solid rgba(0, 212, 255, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#00D4FF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Skill Importance &amp; Match Weights (Total: {totalWeight}%)
                      </span>
                      <button
                        type="button"
                        onClick={handleBalanceWeights}
                        style={{
                          background: 'rgba(0,212,255,0.1)',
                          border: '1px solid rgba(0,212,255,0.3)',
                          color: '#00D4FF',
                          fontSize: '10px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Balance Evenly
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                      {skillsList.map((sk) => (
                        <div key={sk} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(10, 18, 36, 0.6)', padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: '11px', color: '#fff', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sk}>
                            {sk}
                          </span>
                          <input
                            type="number"
                            min="5"
                            max="100"
                            value={currentWeights[sk] !== undefined ? currentWeights[sk] : 20}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                skillWeights: {
                                  ...formData.skillWeights,
                                  [sk]: Number(e.target.value) || 0
                                }
                              });
                            }}
                            style={{
                              width: '44px',
                              background: '#0B132B',
                              border: '1px solid rgba(0, 212, 255, 0.4)',
                              color: '#00D4FF',
                              fontSize: '11px',
                              fontWeight: 700,
                              textAlign: 'center',
                              borderRadius: '4px',
                              padding: '2px'
                            }}
                          />
                          <span style={{ fontSize: '10px', color: 'var(--text-muted, #94A3B8)' }}>%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>
                  Preferred Skills (Bonus Evaluation Points, Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Docker, FastAPI, Redis, AWS, Kubernetes"
                  value={formData.preferredSkills}
                  onChange={(e) => setFormData({ ...formData, preferredSkills: e.target.value })}
                  className="company-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="comp-grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>Application Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="company-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #94A3B8)', marginBottom: '5px' }}>Min. Match Threshold (%)</label>
                  <input
                    type="number"
                    min="40"
                    max="100"
                    value={formData.minMatch}
                    onChange={(e) => setFormData({ ...formData, minMatch: e.target.value })}
                    className="company-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '4px'
              }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', display: 'block' }}>
                    Require Pre-Screening Assessment
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)' }}>
                    Requires verified proctored assessment score before interview scheduling.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.assessmentRequirement}
                  onChange={(e) => setFormData({ ...formData, assessmentRequirement: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#00D4FF' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-cyber-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                >
                  {editingOpp ? 'Update Opportunity' : 'Publish Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteTargetOpp && (
        <div className="company-modal-overlay">
          <div className="company-modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Archive Posting?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94A3B8)', marginBottom: '18px' }}>
              Are you sure you want to archive <strong>{deleteTargetOpp.title}</strong>? Candidates will no longer be able to submit applications.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteTargetOpp(null)}
                className="btn-cyber-outline"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteOpportunity) onDeleteOpportunity(deleteTargetOpp.opportunityId || deleteTargetOpp.oppId || deleteTargetOpp.id);
                  setDeleteTargetOpp(null);
                }}
                className="btn-cyber-outline"
                style={{ color: '#F43F5E', borderColor: 'rgba(244,63,94,0.4)' }}
              >
                Archive Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
