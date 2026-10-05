import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Building,
  MapPin,
  Users,
  Award,
  ExternalLink,
  Filter,
  Search,
  Plus,
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  Handshake,
  Send,
  Sparkles,
  Calendar,
  FileText,
  Check,
  GraduationCap,
  ArrowRight,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { dispatchCrossRoleCollaborationNotification } from '../../services/notificationStore';
import { collaborationService } from '../../services/collaborationService';

export default function CompanyCollegeCollaboration({
  onFilterCollege,
  onTabSelect,
  onSelectStudent,
  onShowToast,
  user
}) {
  const [activeSubTab, setActiveSubTab] = useState('directory'); // 'directory' | 'requests' | 'authorized'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollegeDetail, setSelectedCollegeDetail] = useState(null);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [targetCollegeForCollab, setTargetCollegeForCollab] = useState(null);

  const companyName = user?.companyName || user?.company || 'Corporate Partner';
  const recruiterName = user?.name || user?.recruiterName || 'Talent Acquisition Lead';

  // Modal form state
  const [collabForm, setCollabForm] = useState({
    collegeName: '',
    collegeCode: '',
    partnershipType: 'Campus Recruitment Drive & Cohort Access',
    departments: ['Computer Science & Engineering', 'Information Technology'],
    batchYear: '2026 Batch',
    minCgpa: '7.5',
    proposedDate: '2026-08-20',
    notes: 'Seeking high-readiness engineering candidates specializing in Cloud Systems and Full-Stack Development.'
  });

  // Outbound & Inbound Requests state
  const [requestsList, setRequestsList] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus_company_collaboration_requests');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'REQ-COL-901',
        institutionName: 'PSG College of Technology',
        collegeCode: 'PSG-TECH-TN',
        partnershipType: 'Campus Placement & Talent Cohort Access',
        departments: ['Computer Science & Engineering', 'Information Technology'],
        batchYear: '2026 Batch',
        minCgpa: '7.5',
        status: 'ACCEPTED',
        studentCount: 42,
        requestedAt: '2026-09-18T10:30:00Z',
        responseNote: 'Cohort authorized. Placement cell assigned Dr. K. Ramanathan as departmental coordinator.'
      },
      {
        id: 'REQ-COL-902',
        institutionName: 'College of Engineering, Guindy (Anna University)',
        collegeCode: 'CEG-AU-TN',
        partnershipType: 'Autonomous AI Fast-Track Screening Drive',
        departments: ['Computer Science & Engineering', 'AI & Data Science'],
        batchYear: '2026 Batch',
        minCgpa: '8.0',
        status: 'PENDING',
        studentCount: 38,
        requestedAt: '2026-09-21T14:15:00Z',
        responseNote: 'Awaiting Dean of Placement review.'
      },
      {
        id: 'REQ-COL-903',
        institutionName: 'Coimbatore Institute of Technology (CIT)',
        collegeCode: 'CIT-CBE-TN',
        partnershipType: 'Joint Sovereign Apprenticeship MoU',
        departments: ['Electronics & Communication', 'Computer Science'],
        batchYear: '2025 Batch',
        minCgpa: '7.0',
        status: 'ACCEPTED',
        studentCount: 29,
        requestedAt: '2026-09-15T09:00:00Z',
        responseNote: 'MoU approved by Academic Council.'
      }
    ];
  });

  // Accredited Campus Directory
  const colleges = useMemo(() => [
    {
      institutionId: 'INST-PSG',
      collegeName: 'PSG College of Technology',
      collegeCode: 'PSG-TECH-TN',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      nirf: 'NIRF Rank 63',
      naac: 'NAAC A++',
      studentCount: 1450,
      placementRate: '96.4%',
      departments: ['Computer Science & Engineering', 'Information Technology', 'AI & Data Science', 'ECE', 'Mechanical'],
      tier: 'Autonomous • Tier 1 Institution',
      email: 'placements@psgtech.edu',
      status: 'ACTIVE PARTNER',
      isPartnered: true
    },
    {
      institutionId: 'INST-CEG',
      collegeName: 'College of Engineering, Guindy (Anna University)',
      collegeCode: 'CEG-AU-TN',
      city: 'Chennai',
      state: 'Tamil Nadu',
      nirf: 'NIRF Rank 14',
      naac: 'NAAC A++',
      studentCount: 2200,
      placementRate: '98.1%',
      departments: ['Computer Science', 'Information Technology', 'Data Analytics', 'ECE', 'EEE'],
      tier: 'State University Campus',
      email: 'tpo@annauniv.edu',
      status: 'REQUEST PENDING',
      isPartnered: false
    },
    {
      institutionId: 'INST-CIT',
      collegeName: 'Coimbatore Institute of Technology (CIT)',
      collegeCode: 'CIT-CBE-TN',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      nirf: 'NIRF Rank 102',
      naac: 'NAAC A+',
      studentCount: 980,
      placementRate: '91.8%',
      departments: ['Computer Science & Engineering', 'Electronics & Comm', 'Mechanical', 'Chemical'],
      tier: 'Government Aided Autonomous',
      email: 'placements@cit.edu.in',
      status: 'ACTIVE PARTNER',
      isPartnered: true
    },
    {
      institutionId: 'INST-SSN',
      collegeName: 'SSN College of Engineering',
      collegeCode: 'SSN-CHN-TN',
      city: 'Chennai',
      state: 'Tamil Nadu',
      nirf: 'NIRF Rank 45',
      naac: 'NAAC A++',
      studentCount: 1250,
      placementRate: '95.2%',
      departments: ['CSE', 'IT', 'ECE', 'EEE', 'Biomedical'],
      tier: 'Autonomous • Sovereign Node',
      email: 'placement@ssn.edu.in',
      status: 'DISCOVERABLE',
      isPartnered: false
    },
    {
      institutionId: 'INST-THIAGAR',
      collegeName: 'Thiagarajar College of Engineering (TCE)',
      collegeCode: 'TCE-MDU-TN',
      city: 'Madurai',
      state: 'Tamil Nadu',
      nirf: 'NIRF Rank 85',
      naac: 'NAAC A+',
      studentCount: 1100,
      placementRate: '93.0%',
      departments: ['Computer Science', 'IT', 'ECE', 'Mechatronics'],
      tier: 'Government Aided Autonomous',
      email: 'tpo@tce.edu',
      status: 'DISCOVERABLE',
      isPartnered: false
    },
    {
      institutionId: 'INST-KCT',
      collegeName: 'Kumaraguru College of Technology (KCT)',
      collegeCode: 'KCT-CBE-TN',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      nirf: 'NIRF Rank 99',
      naac: 'NAAC A++',
      studentCount: 1320,
      placementRate: '92.5%',
      departments: ['CSE', 'IT', 'AI & Data Science', 'ECE', 'Aeronautical'],
      tier: 'Autonomous',
      email: 'placements@kct.ac.in',
      status: 'DISCOVERABLE',
      isPartnered: false
    }
  ], []);

  // Authorized Student Cohorts unlocked by Partner Colleges
  const authorizedStudents = useMemo(() => [
    {
      studentId: 'STU-PSG-2026-042',
      name: 'Alex Johnson',
      college: 'PSG College of Technology',
      department: 'Computer Science & Engineering',
      cgpa: '8.92',
      skills: ['Kubernetes', 'Docker', 'Go', 'React', 'Cloud Architecture'],
      readiness: 94,
      passportVerified: true,
      placementStatus: 'SELECTED (Google Cloud)',
      mentor: 'Dr. K. Ramanathan'
    },
    {
      studentId: 'STU-PSG-2026-088',
      name: 'Priya Sundaram',
      college: 'PSG College of Technology',
      department: 'Information Technology',
      cgpa: '9.14',
      skills: ['Python', 'PyTorch', 'FastAPI', 'PostgreSQL', 'NLP'],
      readiness: 92,
      passportVerified: true,
      placementStatus: 'AVAILABLE',
      mentor: 'Dr. K. Ramanathan'
    },
    {
      studentId: 'STU-CIT-2025-104',
      name: 'Karthik Raja',
      college: 'Coimbatore Institute of Technology (CIT)',
      department: 'Computer Science & Engineering',
      cgpa: '8.65',
      skills: ['Java', 'Spring Boot', 'Kafka', 'Microservices', 'AWS'],
      readiness: 88,
      passportVerified: true,
      placementStatus: 'AVAILABLE',
      mentor: 'Prof. M. Selvam'
    },
    {
      studentId: 'STU-CIT-2025-055',
      name: 'Ananya Ramesh',
      college: 'Coimbatore Institute of Technology (CIT)',
      department: 'Electronics & Communication',
      cgpa: '8.78',
      skills: ['Embedded C', 'IoT', 'RTOS', 'Python', 'C++'],
      readiness: 89,
      passportVerified: true,
      placementStatus: 'INTERVIEWING',
      mentor: 'Dr. V. Rajesh'
    }
  ], []);

  // Filtered colleges for directory search
  const filteredColleges = useMemo(() => {
    if (!searchQuery.trim()) return colleges;
    const q = searchQuery.toLowerCase();
    return colleges.filter(c =>
      c.collegeName.toLowerCase().includes(q) ||
      c.collegeCode.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.nirf.toLowerCase().includes(q) ||
      c.departments.some(d => d.toLowerCase().includes(q))
    );
  }, [colleges, searchQuery]);

  const handleOpenCollabModal = (college = null) => {
    if (college) {
      setTargetCollegeForCollab(college);
      setCollabForm(prev => ({
        ...prev,
        collegeName: college.collegeName,
        collegeCode: college.collegeCode,
        departments: college.departments.slice(0, 3)
      }));
    } else {
      setTargetCollegeForCollab(colleges[0]);
      setCollabForm(prev => ({
        ...prev,
        collegeName: colleges[0].collegeName,
        collegeCode: colleges[0].collegeCode,
        departments: colleges[0].departments.slice(0, 3)
      }));
    }
    setIsCollabModalOpen(true);
  };

  const handleDepartmentToggle = (dept) => {
    setCollabForm(prev => {
      const current = prev.departments;
      if (current.includes(dept)) {
        return { ...prev, departments: current.filter(d => d !== dept) };
      } else {
        return { ...prev, departments: [...current, dept] };
      }
    });
  };

  const handleSubmitCollabRequest = (e) => {
    e.preventDefault();
    const newReq = {
      id: `REQ-COL-${Date.now().toString().slice(-4)}`,
      institutionName: collabForm.collegeName,
      collegeCode: collabForm.collegeCode,
      partnershipType: collabForm.partnershipType,
      departments: collabForm.departments,
      batchYear: collabForm.batchYear,
      minCgpa: collabForm.minCgpa,
      status: 'PENDING',
      studentCount: 35,
      requestedAt: new Date().toISOString(),
      responseNote: 'Request transmitted. Awaiting College Placement Cell response.'
    };

    const updated = [newReq, ...requestsList];
    setRequestsList(updated);
    try {
      localStorage.setItem('nexus_company_collaboration_requests', JSON.stringify(updated));
    } catch {}

    // Dispatch live cross-role notifications across Student, Institution, Academician, and Company!
    dispatchCrossRoleCollaborationNotification({
      companyName,
      institutionName: collabForm.collegeName,
      collegeCode: collabForm.collegeCode,
      departments: collabForm.departments,
      batchYear: collabForm.batchYear,
      partnershipType: collabForm.partnershipType,
      recruiterName,
      notes: collabForm.notes
    });

    setIsCollabModalOpen(false);
    setActiveSubTab('requests');

    if (onShowToast) {
      onShowToast({
        title: 'Collaboration Request Dispatched',
        message: `Official collaboration & talent cohort access request transmitted to ${collabForm.collegeName}. Notifications sent to College & Department Mentors.`,
        type: 'success'
      });
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '48px', color: '#e2e8f0' }}>
      {/* ── TOP TELEMETRY & HERO HEADER ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 28px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(6, 11, 20, 0.95) 100%)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-card)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(0, 212, 255, 0.12)', border: '1px solid rgba(0, 212, 255, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyber-cyan)'
            }}>
              <Handshake size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  College Collaboration & Talent Access Hub
                </h1>
                <span style={{
                  fontSize: '9.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
                  background: 'rgba(0, 212, 255, 0.15)', color: 'var(--cyber-cyan)',
                  border: '1px solid rgba(0, 212, 255, 0.3)', letterSpacing: '0.06em'
                }}>
                  MULTI-CAMPUS PORTAL
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Partner directly with accredited colleges, initiate placement drives, and request sovereign access to pre-screened student cohorts.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => handleOpenCollabModal()}
            className="btn-cyber-primary"
            style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>Initiate College Collaboration</span>
          </button>
        </div>
      </div>

      {/* ── HIGH-LEVEL TELEMETRY STATS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '3px solid var(--cyber-cyan)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            PARTNER CAMPUSES
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {colleges.filter(c => c.isPartnered).length} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ {colleges.length} Verified</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--cyber-cyan)', marginTop: '4px' }}>
            Accredited Institutional Nodes
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '3px solid var(--cyber-purple)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ACTIVE MoUs & DRIVES
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {requestsList.filter(r => r.status === 'ACCEPTED').length} Active
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--cyber-purple)', marginTop: '4px' }}>
            Campus Recruitment MoUs
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '3px solid var(--cyber-amber)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            PENDING ACCESS REQUESTS
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {requestsList.filter(r => r.status === 'PENDING').length} In Review
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--cyber-amber)', marginTop: '4px' }}>
            Awaiting TPO Approvals
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '3px solid var(--cyber-emerald)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            UNLOCKED TALENT POOL
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {authorizedStudents.length} Students
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--cyber-emerald)', marginTop: '4px' }}>
            Sovereign Profiles Authorized
          </div>
        </div>
      </div>

      {/* ── WORKSPACE SUB-NAVIGATION TABS ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('directory')}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              color: activeSubTab === 'directory' ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
              borderBottom: activeSubTab === 'directory' ? '2px solid var(--cyber-cyan)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <Building size={15} />
            <span>Accredited Campus Directory ({colleges.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('requests')}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              color: activeSubTab === 'requests' ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
              borderBottom: activeSubTab === 'requests' ? '2px solid var(--cyber-cyan)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={15} />
            <span>Access Requests & Status ({requestsList.length})</span>
            {requestsList.filter(r => r.status === 'PENDING').length > 0 && (
              <span style={{
                fontSize: '10px', padding: '1px 6px', borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B',
                border: '1px solid rgba(245, 158, 11, 0.4)'
              }}>
                {requestsList.filter(r => r.status === 'PENDING').length} Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('authorized')}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              color: activeSubTab === 'authorized' ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
              borderBottom: activeSubTab === 'authorized' ? '2px solid var(--cyber-cyan)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={15} />
            <span>Authorized Student Cohorts ({authorizedStudents.length})</span>
          </button>
        </div>

        {activeSubTab === 'directory' && (
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search colleges, codes, cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="company-input"
              style={{ width: '100%', paddingLeft: '34px', fontSize: '12.5px', height: '36px' }}
            />
          </div>
        )}
      </div>

      {/* ── TAB 1: ACCREDITED CAMPUS DIRECTORY ── */}
      {activeSubTab === 'directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
            gap: '16px'
          }}>
            {filteredColleges.map((col) => (
              <div
                key={col.institutionId}
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '12px',
                  border: col.isPartnered ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid var(--border-subtle)',
                  background: col.isPartnered ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.04) 0%, rgba(15, 23, 42, 0.7) 100%)' : 'var(--bg-card)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '10px',
                        background: col.isPartnered ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: col.isPartnered ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: col.isPartnered ? 'var(--cyber-cyan)' : 'var(--text-secondary)'
                      }}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                          {col.collegeName}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>
                            {col.collegeCode}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>•</span>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={11} color="var(--text-muted)" /> {col.city}, {col.state}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '9.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                      background: col.isPartnered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                      color: col.isPartnered ? '#10B981' : 'var(--cyber-purple)',
                      border: col.isPartnered ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)',
                      whiteSpace: 'nowrap'
                    }}>
                      {col.status}
                    </span>
                  </div>

                  {/* Highlights Grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
                    padding: '10px 12px', borderRadius: '8px', background: 'rgba(6, 11, 20, 0.5)',
                    border: '1px solid var(--border-subtle)', marginBottom: '14px'
                  }}>
                    <div>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>ACCREDITATION</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-cyan)', marginTop: '2px' }}>
                        {col.naac}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{col.nirf}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>PLACEMENT</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', marginTop: '2px' }}>
                        {col.placementRate}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TPO Verified</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>STUDENT POOL</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                        {col.studentCount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Engineering</div>
                    </div>
                  </div>

                  {/* Departments */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                      KEY DEPARTMENTS
                    </div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {col.departments.slice(0, 3).map(dept => (
                        <span
                          key={dept}
                          style={{
                            fontSize: '10.5px', padding: '2px 8px', borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {dept}
                        </span>
                      ))}
                      {col.departments.length > 3 && (
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', padding: '2px 4px' }}>
                          +{col.departments.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', gap: '8px'
                }}>
                  <button
                    type="button"
                    onClick={() => setSelectedCollegeDetail(col)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                      fontSize: '12px', cursor: 'pointer', padding: '6px 8px'
                    }}
                  >
                    <Eye size={13} />
                    <span>Campus Info</span>
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (onFilterCollege) onFilterCollege(col.collegeName);
                        if (onTabSelect) onTabSelect('students');
                      }}
                      className="company-btn-outline-cyan"
                      style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '6px' }}
                    >
                      <span>Filter Talent</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCollabModal(col)}
                      className="btn-cyber-primary"
                      style={{ padding: '6px 14px', fontSize: '11.5px', borderRadius: '6px' }}
                    >
                      <Handshake size={13} />
                      <span>{col.isPartnered ? 'Manage MoU / Drive' : 'Request Access'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: ACCESS REQUESTS & STATUS TRACKING ── */}
      {activeSubTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderRadius: '8px', background: 'rgba(0, 212, 255, 0.04)',
            border: '1px solid rgba(0, 212, 255, 0.15)'
          }}>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Showing all talent cohort access and placement collaboration requests dispatched to institutional placement offices.
            </div>
            <button
              type="button"
              onClick={() => handleOpenCollabModal()}
              className="btn-cyber-outline"
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              <Plus size={13} />
              <span>New Access Request</span>
            </button>
          </div>

          <div className="compact-table-container">
            <table className="compact-table">
              <thead>
                <tr>
                  <th style={{ width: '26%' }}>Institution Campus</th>
                  <th style={{ width: '22%' }}>Collaboration & Purpose</th>
                  <th style={{ width: '18%' }}>Target Departments</th>
                  <th style={{ width: '10%' }}>Target Batch</th>
                  <th style={{ width: '12%' }}>Status</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requestsList.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyber-cyan)'
                        }}>
                          <Building size={15} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>
                            {req.institutionName}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            ID: {req.id} • {req.collegeCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {req.partnershipType}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Min CGPA: {req.minCgpa} • {req.studentCount} Students
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {req.departments.map(d => (
                          <span
                            key={d}
                            style={{
                              fontSize: '9.5px', padding: '1px 6px', borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {d.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, color: '#fff',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {req.batchYear}
                      </span>
                    </td>

                    <td>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                        background: req.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.15)' : req.status === 'PENDING' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: req.status === 'ACCEPTED' ? '#10B981' : req.status === 'PENDING' ? '#F59E0B' : '#F43F5E',
                        border: req.status === 'ACCEPTED' ? '1px solid rgba(16, 185, 129, 0.3)' : req.status === 'PENDING' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        {req.status === 'ACCEPTED' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        <span>{req.status}</span>
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (req.status === 'ACCEPTED') {
                            setActiveSubTab('authorized');
                          } else {
                            if (onShowToast) {
                              onShowToast({
                                title: 'Request Telemetry',
                                message: req.responseNote,
                                type: 'info'
                              });
                            }
                          }
                        }}
                        className="company-btn-outline-cyan"
                        style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '5px' }}
                      >
                        {req.status === 'ACCEPTED' ? 'View Cohort →' : 'Check Status'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: AUTHORIZED STUDENT COHORTS ── */}
      {activeSubTab === 'authorized' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 18px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} /> Verified Sovereign Talent Cohorts
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                These student profiles have been cryptographically authorized by partner colleges for direct recruitment and offer release.
              </div>
            </div>

            <button
              type="button"
              onClick={() => onTabSelect && onTabSelect('students')}
              className="btn-cyber-primary"
              style={{ padding: '7px 16px', fontSize: '12px' }}
            >
              <span>Explore All Candidates</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '16px'
          }}>
            {authorizedStudents.map((stu) => (
              <div
                key={stu.studentId}
                className="glass-panel"
                style={{
                  padding: '20px', borderRadius: '12px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                        {stu.name}
                      </h4>
                      <div style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {stu.studentId} • {stu.cgpa} CGPA
                      </div>
                    </div>

                    <span style={{
                      fontSize: '9.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.15)', color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      PASSPORT VERIFIED
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    🏛️ <strong>{stu.college}</strong>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Dept: {stu.department} • Mentor: <span style={{ color: '#F59E0B' }}>{stu.mentor}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {stu.skills.map(sk => (
                      <span
                        key={sk}
                        style={{
                          fontSize: '10.5px', padding: '2px 7px', borderRadius: '4px',
                          background: 'rgba(0, 212, 255, 0.08)', color: 'var(--cyber-cyan)',
                          border: '1px solid rgba(0, 212, 255, 0.2)'
                        }}
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: '12px', borderTop: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 600 }}>
                    {stu.readiness}% Readiness Benchmark
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (onTabSelect) onTabSelect('selected');
                    }}
                    className="btn-cyber-primary"
                    style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
                  >
                    <span>View in Selected / Offers</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: INITIATE COLLEGE COLLABORATION & TALENT ACCESS ── */}
      {isCollabModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(3, 7, 18, 0.82)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
          onClick={() => setIsCollabModalOpen(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: '640px', background: '#0a1120',
              borderRadius: '16px', border: '1px solid rgba(0, 212, 255, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 212, 255, 0.15)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.08) 0%, transparent 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'rgba(0, 212, 255, 0.15)', border: '1px solid rgba(0, 212, 255, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyber-cyan)'
                }}>
                  <Handshake size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#fff' }}>
                    Initiate College Collaboration
                  </h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Transmit sovereign talent cohort request to placement office & faculty mentors
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCollabModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitCollabRequest} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* College Picker */}
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  TARGET ACCREDITED COLLEGE *
                </label>
                <select
                  value={collabForm.collegeName}
                  onChange={(e) => {
                    const found = colleges.find(c => c.collegeName === e.target.value);
                    if (found) {
                      setCollabForm(prev => ({
                        ...prev,
                        collegeName: found.collegeName,
                        collegeCode: found.collegeCode,
                        departments: found.departments.slice(0, 3)
                      }));
                    }
                  }}
                  className="company-input"
                  style={{ width: '100%', fontSize: '13px' }}
                  required
                >
                  {colleges.map(c => (
                    <option key={c.institutionId} value={c.collegeName}>
                      {c.collegeName} ({c.collegeCode}) — {c.city}, {c.naac}
                    </option>
                  ))}
                </select>
              </div>

              {/* Collaboration Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    COLLABORATION PURPOSE *
                  </label>
                  <select
                    value={collabForm.partnershipType}
                    onChange={(e) => setCollabForm(prev => ({ ...prev, partnershipType: e.target.value }))}
                    className="company-input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                  >
                    <option value="Campus Recruitment Drive & Cohort Access">Campus Recruitment Drive & Cohort Access</option>
                    <option value="MoU & Corporate Partnership">Formal MoU & Corporate Partnership</option>
                    <option value="Fast-Track AI Screening Access">Fast-Track AI Screening Access</option>
                    <option value="Joint Sovereign Apprenticeship">Joint Sovereign Apprenticeship</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    TARGET BATCH YEAR
                  </label>
                  <select
                    value={collabForm.batchYear}
                    onChange={(e) => setCollabForm(prev => ({ ...prev, batchYear: e.target.value }))}
                    className="company-input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                  >
                    <option value="2026 Batch">2026 Batch (Graduating Engineers)</option>
                    <option value="2025 Batch">2025 Batch (Immediate Joiners)</option>
                    <option value="2027 Batch">2027 Batch (Pre-Final Interns)</option>
                  </select>
                </div>
              </div>

              {/* Target Departments */}
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  TARGET DEPARTMENTS
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['Computer Science & Engineering', 'Information Technology', 'AI & Data Science', 'Electronics & Communication', 'Electrical & Electronics', 'Mechanical'].map(dept => {
                    const isSelected = collabForm.departments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => handleDepartmentToggle(dept)}
                        style={{
                          padding: '6px 12px', borderRadius: '6px',
                          fontSize: '11.5px', fontWeight: 600,
                          background: isSelected ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                          border: isSelected ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                      >
                        {isSelected && <Check size={12} />}
                        <span>{dept}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Min CGPA & Drive Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    MINIMUM CGPA BENCHMARK
                  </label>
                  <select
                    value={collabForm.minCgpa}
                    onChange={(e) => setCollabForm(prev => ({ ...prev, minCgpa: e.target.value }))}
                    className="company-input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                  >
                    <option value="7.0">7.0+ CGPA</option>
                    <option value="7.5">7.5+ CGPA (Recommended)</option>
                    <option value="8.0">8.0+ CGPA (Honors)</option>
                    <option value="8.5">8.5+ CGPA (Top 5%)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    PROPOSED DRIVE / START DATE
                  </label>
                  <input
                    type="date"
                    value={collabForm.proposedDate}
                    onChange={(e) => setCollabForm(prev => ({ ...prev, proposedDate: e.target.value }))}
                    className="company-input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              {/* Note / Pitch */}
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  RECRUITER NOTE TO PLACEMENT CELL & FACULTY
                </label>
                <textarea
                  value={collabForm.notes}
                  onChange={(e) => setCollabForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="company-input"
                  style={{ width: '100%', fontSize: '12px', resize: 'vertical' }}
                  placeholder="Outline key skill expectations, compensation range, and interview timeline..."
                />
              </div>

              {/* Notice */}
              <div style={{
                padding: '12px 14px', borderRadius: '8px',
                background: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.2)',
                fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4
              }}>
                <span style={{ color: 'var(--cyber-cyan)', fontWeight: 700 }}>Cross-Portal Relay:</span> Submitting will instantly alert the College Placement Office and notify departmental Academician Mentors to review and authorize the talent cohort.
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsCollabModalOpen(false)}
                  className="company-btn-secondary"
                  style={{ padding: '8px 18px', fontSize: '12.5px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{ padding: '8px 22px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  <span>Transmit Collaboration Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CAMPUS INTELLIGENCE MODAL ── */}
      {selectedCollegeDetail && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(3, 7, 18, 0.82)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
          onClick={() => setSelectedCollegeDetail(null)}
        >
          <div
            style={{
              width: '100%', maxWidth: '580px', background: '#0a1120',
              borderRadius: '16px', border: '1px solid var(--border-subtle)',
              padding: '24px', position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                  {selectedCollegeDetail.collegeName}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {selectedCollegeDetail.collegeCode} • {selectedCollegeDetail.tier}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCollegeDetail(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>LOCATION</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>
                  {selectedCollegeDetail.city}, {selectedCollegeDetail.state}
                </div>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ACCREDITATION & RANK</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cyber-cyan)', marginTop: '2px' }}>
                  {selectedCollegeDetail.naac} • {selectedCollegeDetail.nirf}
                </div>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HISTORIC PLACEMENT RATE</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#10B981', marginTop: '2px' }}>
                  {selectedCollegeDetail.placementRate}
                </div>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TOTAL CANDIDATES AVAILABLE</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                  {selectedCollegeDetail.studentCount.toLocaleString()} Students
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                ACADEMIC DEPARTMENTS
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {selectedCollegeDetail.departments.map(d => (
                  <span
                    key={d}
                    style={{
                      fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedCollegeDetail(null)}
                className="company-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedCollegeDetail;
                  setSelectedCollegeDetail(null);
                  handleOpenCollabModal(target);
                }}
                className="btn-cyber-primary"
                style={{ padding: '8px 18px', fontSize: '12px' }}
              >
                <Handshake size={14} />
                <span>Initiate Collaboration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
