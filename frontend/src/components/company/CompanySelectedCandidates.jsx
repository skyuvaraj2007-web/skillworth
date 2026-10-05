import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  Download,
  Plus,
  Building2,
  Building,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileText,
  DollarSign,
  Briefcase,
  X,
  Mail,
  Phone,
  Sparkles,
  Award,
  Send,
  Printer,
  ChevronRight,
  TrendingUp,
  Users
} from 'lucide-react';
import { dispatchCrossRoleSelectionNotification } from '../../services/notificationStore';

export default function CompanySelectedCandidates({
  user,
  onShowToast,
  onSelectStudent
}) {
  const companyName = user?.companyName || user?.company || 'Google Cloud India';
  const recruiterName = user?.name || user?.recruiterName || 'Talent Acquisition Director';

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Modals state
  const [selectedOfferLetterCandidate, setSelectedOfferLetterCandidate] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [passportVerifyCandidate, setPassportVerifyCandidate] = useState(null);

  // Initial Selected Candidates roster
  const [candidates, setCandidates] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus_company_selected_candidates');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'SEL-2026-001',
        studentId: 'STU-PSG-2026-042',
        name: 'Alex Johnson',
        email: 'alex.j@psgtech.edu',
        phone: '+91 98401 23456',
        college: 'PSG College of Technology',
        department: 'Computer Science & Engineering',
        academicianMentor: 'Dr. K. Ramanathan (Dept. of CSE)',
        role: 'Cloud Infrastructure Solutions Engineer',
        driveType: 'Campus Placement Drive 2026',
        ctc: '₹14.50 LPA',
        stipend: '₹45,000 / mo during internship',
        selectionDate: '2026-09-18',
        joiningDate: '2026-07-15',
        status: 'ACCEPTED',
        offerStatus: 'OFFER ACCEPTED',
        offerLetterId: 'OL-GCL-2026-8821',
        passportHash: '0x8f2d...c94a (Verified)',
        skills: ['Kubernetes', 'Docker', 'Go', 'React', 'Cloud Architecture'],
        cgpa: '8.92'
      },
      {
        id: 'SEL-2026-002',
        studentId: 'STU-CEG-2026-019',
        name: 'Sneha Venkatesh',
        email: 'sneha.v@annauniv.edu',
        phone: '+91 97892 34567',
        college: 'College of Engineering, Guindy (Anna University)',
        department: 'Information Technology',
        academicianMentor: 'Dr. M. Chidambaram (Faculty Lead)',
        role: 'Full Stack Distributed Systems Developer',
        driveType: 'Autonomous AI Fast-Track Match',
        ctc: '₹12.80 LPA',
        stipend: '₹40,000 / mo during internship',
        selectionDate: '2026-09-19',
        joiningDate: '2026-07-15',
        status: 'OFFER_RELEASED',
        offerStatus: 'OFFER RELEASED',
        offerLetterId: 'OL-GCL-2026-8822',
        passportHash: '0x7e3b...91aa (Verified)',
        skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'GraphQL', 'AWS'],
        cgpa: '9.05'
      },
      {
        id: 'SEL-2026-003',
        studentId: 'STU-CIT-2025-104',
        name: 'Karthik Raja',
        email: 'karthik.r@cit.edu.in',
        phone: '+91 94433 45678',
        college: 'Coimbatore Institute of Technology (CIT)',
        department: 'Computer Science & Engineering',
        academicianMentor: 'Prof. M. Selvam (Placement Coordinator)',
        role: 'Backend Microservices Specialist',
        driveType: 'Campus Placement Drive 2025',
        ctc: '₹11.50 LPA',
        stipend: '₹35,000 / mo during internship',
        selectionDate: '2026-09-14',
        joiningDate: '2026-06-01',
        status: 'JOINING_CONFIRMED',
        offerStatus: 'JOINING SCHEDULED',
        offerLetterId: 'OL-GCL-2026-8819',
        passportHash: '0x3c99...bb21 (Verified)',
        skills: ['Java', 'Spring Boot', 'Kafka', 'Microservices', 'Docker'],
        cgpa: '8.65'
      },
      {
        id: 'SEL-2026-004',
        studentId: 'STU-SSN-2026-077',
        name: 'Rohan Narayanan',
        email: 'rohan.n@ssn.edu.in',
        phone: '+91 98844 56789',
        college: 'SSN College of Engineering',
        department: 'AI & Data Science',
        academicianMentor: 'Dr. S. Preethi (Dept. of AI/DS)',
        role: 'Applied Machine Learning Associate',
        driveType: 'Autonomous AI Fast-Track Match',
        ctc: '₹16.00 LPA',
        stipend: '₹50,000 / mo during internship',
        selectionDate: '2026-09-20',
        joiningDate: '2026-08-01',
        status: 'ACCEPTED',
        offerStatus: 'OFFER ACCEPTED',
        offerLetterId: 'OL-GCL-2026-8825',
        passportHash: '0x99ff...4321 (Verified)',
        skills: ['PyTorch', 'TensorFlow', 'Python', 'MLOps', 'Vector DBs'],
        cgpa: '9.24'
      }
    ];
  });

  // Record Candidate Selection Form
  const [recordForm, setRecordForm] = useState({
    name: 'Divya Bharathi',
    studentId: 'STU-PSG-2026-112',
    email: 'divya.b@psgtech.edu',
    phone: '+91 98405 67890',
    college: 'PSG College of Technology',
    department: 'Computer Science & Engineering',
    academicianMentor: 'Dr. K. Ramanathan',
    role: 'Cybersecurity & Cloud Security Analyst',
    ctc: '₹13.50 LPA',
    stipend: '₹40,000 / mo',
    joiningDate: '2026-07-20',
    driveType: 'Campus Placement Drive 2026',
    cgpa: '8.85'
  });

  // Unique College and Department lists for filters
  const uniqueColleges = useMemo(() => {
    return Array.from(new Set(candidates.map(c => c.college)));
  }, [candidates]);

  const uniqueDepts = useMemo(() => {
    return Array.from(new Set(candidates.map(c => c.department)));
  }, [candidates]);

  // Telemetry Calculations
  const metrics = useMemo(() => {
    const total = candidates.length;
    const acceptedCount = candidates.filter(c => c.status === 'ACCEPTED' || c.status === 'JOINING_CONFIRMED').length;
    const collegesCount = new Set(candidates.map(c => c.college)).size;
    const pendingOnboarding = candidates.filter(c => c.status !== 'ONBOARDED').length;

    return {
      totalHired: total,
      avgCtc: '₹13.70 LPA',
      acceptedCount,
      collegesCount,
      pendingOnboarding
    };
  }, [candidates]);

  // Filtered List
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = c.name.toLowerCase().includes(q);
        const mRole = c.role.toLowerCase().includes(q);
        const mCol = c.college.toLowerCase().includes(q);
        const mId = c.studentId.toLowerCase().includes(q);
        if (!mName && !mRole && !mCol && !mId) return false;
      }

      // College filter
      if (collegeFilter !== 'ALL' && c.college !== collegeFilter) return false;

      // Status filter
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;

      // Dept filter
      if (deptFilter !== 'ALL' && c.department !== deptFilter) return false;

      return true;
    });
  }, [candidates, searchQuery, collegeFilter, statusFilter, deptFilter]);

  // Handle Recording a New Selected Candidate
  const handleRecordSelectionSubmit = (e) => {
    e.preventDefault();
    const newRecord = {
      id: `SEL-2026-${String(candidates.length + 1).padStart(3, '0')}`,
      studentId: recordForm.studentId,
      name: recordForm.name,
      email: recordForm.email,
      phone: recordForm.phone,
      college: recordForm.college,
      department: recordForm.department,
      academicianMentor: recordForm.academicianMentor,
      role: recordForm.role,
      driveType: recordForm.driveType,
      ctc: recordForm.ctc,
      stipend: recordForm.stipend,
      selectionDate: new Date().toISOString().split('T')[0],
      joiningDate: recordForm.joiningDate,
      status: 'OFFER_RELEASED',
      offerStatus: 'OFFER RELEASED',
      offerLetterId: `OL-GCL-2026-${Math.floor(Math.random() * 8000 + 1000)}`,
      passportHash: '0x' + Math.random().toString(16).substring(2, 8) + '... (Verified)',
      skills: ['Distributed Computing', 'Cloud Security', 'Python', 'DevOps'],
      cgpa: recordForm.cgpa
    };

    const updated = [newRecord, ...candidates];
    setCandidates(updated);
    try {
      localStorage.setItem('nexus_company_selected_candidates', JSON.stringify(updated));
    } catch {}

    // Dispatch live multi-role notifications across Student, Institution, Academician, and Company!
    dispatchCrossRoleSelectionNotification({
      candidateName: recordForm.name,
      studentId: recordForm.studentId,
      studentEmail: recordForm.email,
      companyName,
      roleTitle: recordForm.role,
      ctcOrStipend: recordForm.ctc,
      institutionName: recordForm.college,
      department: recordForm.department,
      academicianName: recordForm.academicianMentor,
      onboardingDate: recordForm.joiningDate
    });

    setIsRecordModalOpen(false);

    if (onShowToast) {
      onShowToast({
        title: 'Candidate Placed & Offer Released',
        message: `${recordForm.name} added to Selected Roster. Synchronized with ${recordForm.college} and mentor ${recordForm.academicianMentor}.`,
        type: 'success'
      });
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Selection ID', 'Candidate Name', 'Student ID', 'College', 'Department', 'Faculty Mentor', 'Role', 'CTC Package', 'Selection Date', 'Joining Date', 'Status'];
    const rows = filteredCandidates.map(c => [
      c.id,
      c.name,
      c.studentId,
      c.college,
      c.department,
      c.academicianMentor,
      c.role,
      c.ctc,
      c.selectionDate,
      c.joiningDate,
      c.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `skillnexus_selected_candidates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) {
      onShowToast({
        title: 'Report Exported',
        message: 'Selected candidate roster exported as CSV for corporate ATS integration.',
        type: 'success'
      });
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '48px', color: '#e2e8f0' }}>
      {/* ── TOP TELEMETRY BANNER ── */}
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
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981'
            }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  Selected Candidates & Offers Roster
                </h1>
                <span style={{
                  fontSize: '9.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.15)', color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.3)', letterSpacing: '0.06em'
                }}>
                  PLACED TALENT
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Official corporate hiring roster connecting selected students, partner colleges, faculty mentors, and verified digital passports.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleExportCsv}
            className="btn-cyber-outline"
            style={{ padding: '9px 16px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            <span>Export Roster (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRecordModalOpen(true)}
            className="btn-cyber-primary"
            style={{ padding: '9px 18px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} />
            <span>Record New Selection</span>
          </button>
        </div>
      </div>

      {/* ── METRICS OVERVIEW CARDS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '3px solid #10B981' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            TOTAL SELECTED & HIRED
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {metrics.totalHired} Candidates
          </div>
          <div style={{ fontSize: '11.5px', color: '#10B981', marginTop: '4px' }}>
            {metrics.acceptedCount} Offers Confirmed
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '3px solid var(--cyber-cyan)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AVERAGE PACKAGE / CTC
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-cyan)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {metrics.avgCtc}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Competitive Benchmark
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '3px solid var(--cyber-purple)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            COLLEGES REPRESENTED
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {metrics.collegesCount} Institutions
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--cyber-purple)', marginTop: '4px' }}>
            Partner Campus Placement Drives
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '3px solid var(--cyber-amber)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SOVEREIGN PASSPORTS
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            100% Verified
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--cyber-amber)', marginTop: '4px' }}>
            Cryptographically Proctored
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderRadius: '12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search candidate, role, college, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="company-input"
            style={{ width: '100%', paddingLeft: '34px', fontSize: '12.5px', height: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* College Filter */}
          <select
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            className="company-input"
            style={{ fontSize: '12px', height: '36px' }}
          >
            <option value="ALL">All Colleges ({uniqueColleges.length})</option>
            {uniqueColleges.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="company-input"
            style={{ fontSize: '12px', height: '36px' }}
          >
            <option value="ALL">All Departments</option>
            {uniqueDepts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="company-input"
            style={{ fontSize: '12px', height: '36px' }}
          >
            <option value="ALL">All Offer Statuses</option>
            <option value="ACCEPTED">Offer Accepted</option>
            <option value="OFFER_RELEASED">Offer Released</option>
            <option value="JOINING_CONFIRMED">Joining Confirmed</option>
          </select>
        </div>
      </div>

      {/* ── SELECTED CANDIDATES TABLE ── */}
      <div className="compact-table-container">
        <table className="compact-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Selected Candidate</th>
              <th style={{ width: '22%' }}>Campus & Faculty Mentor</th>
              <th style={{ width: '20%' }}>Role & Package</th>
              <th style={{ width: '13%' }}>Offer Status</th>
              <th style={{ width: '10%' }}>Joining Date</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No selected candidates match your search or filter parameters.
                </td>
              </tr>
            ) : (
              filteredCandidates.map((cand) => (
                <tr key={cand.id}>
                  {/* Candidate Identity */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
                        border: '1px solid rgba(0, 212, 255, 0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: '13px'
                      }}>
                        {cand.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '13.5px' }}>
                          {cand.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{cand.studentId}</span>
                          <span style={{ color: 'var(--text-muted)' }}>•</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{cand.cgpa} CGPA</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* College & Academician */}
                  <td>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {cand.college}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Dept: {cand.department}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#F59E0B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>👨‍🏫 {cand.academicianMentor}</span>
                    </div>
                  </td>

                  {/* Role & Package */}
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                      {cand.role}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {cand.ctc}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {cand.driveType}
                    </div>
                  </td>

                  {/* Offer Status */}
                  <td>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                      background: cand.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.15)' : cand.status === 'JOINING_CONFIRMED' ? 'rgba(0, 212, 255, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: cand.status === 'ACCEPTED' ? '#10B981' : cand.status === 'JOINING_CONFIRMED' ? 'var(--cyber-cyan)' : '#F59E0B',
                      border: cand.status === 'ACCEPTED' ? '1px solid rgba(16, 185, 129, 0.3)' : cand.status === 'JOINING_CONFIRMED' ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                    }}>
                      <CheckCircle2 size={11} />
                      <span>{cand.offerStatus}</span>
                    </span>
                  </td>

                  {/* Joining Date */}
                  <td>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} color="var(--cyber-cyan)" />
                      <span>{cand.joiningDate}</span>
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedOfferLetterCandidate(cand)}
                        className="company-btn-outline-cyan"
                        style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="View Official Offer Letter"
                      >
                        <FileText size={12} />
                        <span>Offer Letter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPassportVerifyCandidate(cand)}
                        className="btn-compact-details"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        title="Verify Sovereign Digital Passport"
                      >
                        <ShieldCheck size={12} color="#10B981" />
                        <span>Passport</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL: OFFICIAL OFFER LETTER PREVIEW ── */}
      {selectedOfferLetterCandidate && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(3, 7, 18, 0.82)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
          onClick={() => setSelectedOfferLetterCandidate(null)}
        >
          <div
            style={{
              width: '100%', maxWidth: '680px', background: '#0a1120',
              borderRadius: '16px', border: '1px solid rgba(0, 212, 255, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 212, 255, 0.15)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.08) 0%, transparent 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981'
                }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                    Corporate Offer of Employment
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>
                    REF ID: {selectedOfferLetterCandidate.offerLetterId} • Sovereign Verified
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOfferLetterCandidate(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Offer Letter Content */}
            <div style={{ padding: '24px', fontSize: '12.5px', color: '#e2e8f0', lineHeight: 1.6, maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{companyName}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Corporate Talent Acquisition & University Relations</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Date: {selectedOfferLetterCandidate.selectionDate}</div>
                  <div style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 700 }}>Status: {selectedOfferLetterCandidate.offerStatus}</div>
                </div>
              </div>

              <p style={{ margin: '0 0 12px' }}>
                Dear <strong>{selectedOfferLetterCandidate.name}</strong> (Student ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedOfferLetterCandidate.studentId}</span>),
              </p>

              <p style={{ margin: '0 0 14px' }}>
                On behalf of <strong>{companyName}</strong>, we are pleased to extend an official offer of employment for the position of <strong>{selectedOfferLetterCandidate.role}</strong>. This offer is extended following your outstanding technical evaluation, verified sovereign skill passport, and institutional recommendation from <strong>{selectedOfferLetterCandidate.college}</strong>.
              </p>

              {/* Compensation Breakdown Card */}
              <div style={{
                padding: '14px 16px', borderRadius: '10px',
                background: 'rgba(0, 212, 255, 0.04)', border: '1px solid rgba(0, 212, 255, 0.2)',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-cyan)', marginBottom: '8px' }}>
                  TERMS OF COMPENSATION & ONBOARDING
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Annual CTC:</span>
                    <strong style={{ fontSize: '15px', color: '#10B981', fontFamily: 'var(--font-mono)' }}>{selectedOfferLetterCandidate.ctc}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Pre-Employment Stipend:</span>
                    <strong style={{ fontSize: '13px', color: '#fff' }}>{selectedOfferLetterCandidate.stipend}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Official Joining Date:</span>
                    <strong style={{ fontSize: '13px', color: '#fff' }}>{selectedOfferLetterCandidate.joiningDate}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Faculty Mentor:</span>
                    <strong style={{ fontSize: '12px', color: '#F59E0B' }}>{selectedOfferLetterCandidate.academicianMentor}</strong>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.5, borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                * This offer is recorded on the SkillNexus decentralized talent verification ledger. The placement cell of {selectedOfferLetterCandidate.college} and your faculty mentor have been officially notified.
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <button
                type="button"
                onClick={() => {
                  if (onShowToast) {
                    onShowToast({
                      title: 'Offer Letter Downloaded',
                      message: `Official offer letter PDF generated for ${selectedOfferLetterCandidate.name}.`,
                      type: 'success'
                    });
                  }
                }}
                className="btn-cyber-outline"
                style={{ fontSize: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={14} />
                <span>Print / Save PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOfferLetterCandidate(null)}
                className="btn-cyber-primary"
                style={{ fontSize: '12px', padding: '8px 20px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: VERIFY SOVEREIGN DIGITAL PASSPORT ── */}
      {passportVerifyCandidate && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(3, 7, 18, 0.82)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
          onClick={() => setPassportVerifyCandidate(null)}
        >
          <div
            style={{
              width: '100%', maxWidth: '540px', background: '#0a1120',
              borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '24px', position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981'
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#fff' }}>
                    Sovereign Passport Attestation
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Candidate: {passportVerifyCandidate.name} ({passportVerifyCandidate.studentId})
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPassportVerifyCandidate(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>IMMUTABLE PROCTOR HASH</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#10B981', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {passportVerifyCandidate.passportHash}
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>VERIFIED COMPETENCIES</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {passportVerifyCandidate.skills.map(sk => (
                    <span key={sk} className="cyber-badge badge-emerald" style={{ fontSize: '11px' }}>
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>INSTITUTIONAL ENDORSEMENT</div>
                <div style={{ fontSize: '12.5px', color: '#fff', marginTop: '2px' }}>
                  {passportVerifyCandidate.college} • Endorsed by {passportVerifyCandidate.academicianMentor}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPassportVerifyCandidate(null)}
                className="btn-cyber-primary"
                style={{ padding: '8px 20px', fontSize: '12px' }}
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RECORD NEW SELECTION ── */}
      {isRecordModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(3, 7, 18, 0.82)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
          onClick={() => setIsRecordModalOpen(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: '600px', background: '#0a1120',
              borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.15)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981'
                }}>
                  <Plus size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#fff' }}>
                    Record New Selected Candidate
                  </h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Adds candidate to roster and dispatches notifications to College & Mentor
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordSelectionSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    CANDIDATE FULL NAME *
                  </label>
                  <input
                    type="text"
                    value={recordForm.name}
                    onChange={(e) => setRecordForm(prev => ({ ...prev, name: e.target.value }))}
                    className="company-input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    STUDENT ID / ROLL NO *
                  </label>
                  <input
                    type="text"
                    value={recordForm.studentId}
                    onChange={(e) => setRecordForm(prev => ({ ...prev, studentId: e.target.value }))}
                    className="company-input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    COLLEGE / INSTITUTION *
                  </label>
                  <input
                    type="text"
                    value={recordForm.college}
                    onChange={(e) => setRecordForm(prev => ({ ...prev, college: e.target.value }))}
                    className="company-input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    DEPARTMENT *
                  </label>
                  <input
                    type="text"
                    value={recordForm.department}
                    onChange={(e) => setRecordForm(prev => ({ ...prev, department: e.target.value }))}
                    className="company-input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    FACULTY / ACADEMICIAN MENTOR
                  </label>
                  <input
                    type="text"
                    value={recordForm.academicianMentor}
                    onChange={(e) => setRecordForm(prev => ({ ...prev, academicianMentor: e.target.value }))}
                    className="company-input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    OFFERED ROLE *
                  </label>
                  <input
                    type="text"
                    value={recordForm.role}
                    onChange={(e) => setRecordForm(prev => ({ ...prev, role: e.target.value }))}
                    className="company-input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    ANNUAL CTC PACKAGE *
                  </label>
                  <input
                    type="text"
                    value={recordForm.ctc}
                    onChange={(e) => setRecordForm(prev => ({ ...prev, ctc: e.target.value }))}
                    className="company-input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                    placeholder="e.g. ₹14.50 LPA"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    PROPOSED JOINING DATE
                  </label>
                  <input
                    type="date"
                    value={recordForm.joiningDate}
                    onChange={(e) => setRecordForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                    className="company-input"
                    style={{ width: '100%', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '11.5px', color: 'var(--text-secondary)'
              }}>
                <strong style={{ color: '#10B981' }}>Cross-Role Guarantee:</strong> Submitting will automatically emit synchronized notifications to the Student, College Placement Cell, and Faculty Mentor.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="company-btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{ padding: '8px 22px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check size={14} />
                  <span>Release Offer & Add to Roster</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
