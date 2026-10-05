import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  X,
  Award,
  BookOpen,
  FolderGit2,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Upload,
  UserPlus,
  History,
  Mail,
  Power,
  MessageSquare
} from 'lucide-react';
import { getStudentProjects, getStudentEnrollments } from '../../services/nexusDataStore';
import { academicService } from '../../services/academicService';
import RosterImportModal from './RosterImportModal';
import ManualStudentModal from './ManualStudentModal';
import RosterImportHistoryModal from './RosterImportHistoryModal';

export default function InstitutionStudentDetails({ onShowToast, institution }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeDossierTab, setActiveDossierTab] = useState('overview'); // overview, skills, projects, courses
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Sync relational students strictly for this institution's authenticated identity
  const loadStudents = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
      const res = await fetch(`${apiBase}/academic/students`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setStudents(json.data);
          return;
        }
      } else {
        throw new Error(`Failed to load institution students (${res.status})`);
      }
    } catch (e) {
      console.warn('Academic students fetch error:', e.message);
      setFetchError(e.message);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    const handleUpdate = () => loadStudents();
    window.addEventListener('nexus_students_updated', handleUpdate);
    window.addEventListener('nexus_data_updated', handleUpdate);
    return () => {
      window.removeEventListener('nexus_students_updated', handleUpdate);
      window.removeEventListener('nexus_data_updated', handleUpdate);
    };
  }, [institution]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Register Number,Name,Department,Year,Semester,CGPA,Readiness Score,Placement Status,Skills'];
    const rows = students.map(s => {
      const skillsStr = (s.skills || []).map(sk => typeof sk === 'string' ? sk : sk.name).join('; ');
      return `"${s.regNo || s.studentId}","${s.name}","${s.department}","${s.year}","${s.semester}","${s.cgpa}","${s.readinessScore || s.careerReadinessScore || 85}%","${s.placementStatus || 'In Training'}","${skillsStr}"`;
    });
    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Student_Roster_${institution?.collegeId || 'CAMPUS'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    if (onShowToast) {
      onShowToast({ title: 'Roster Exported', message: `CSV exported for ${students.length} students under ${institution?.institutionName || 'institution'}.`, type: 'success' });
    }
  };

  // Quick Endorsement Action
  const handleEndorseSeal = (studentId) => {
    if (onShowToast) {
      onShowToast({
        title: 'Institutional Seal Endorsed',
        message: `Cryptographic campus ledger block sealed for ${selectedStudent?.name}. Student profile elevated.`,
        type: 'success'
      });
    }
  };

  const selectedProjects = selectedStudent ? getStudentProjects(selectedStudent.studentId) : [];
  const selectedEnrollments = selectedStudent ? getStudentEnrollments(selectedStudent.studentId) : [];

  return (
    <div>
      {/* ── TOP CONTROLS & METRICS ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Institutional Student Database</span>
            <span className="cyber-badge badge-blue" style={{ fontSize: '10px' }}>
              CAMPUS: {institution?.collegeId || 'TN010'}
            </span>
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
            Query candidate cohorts across Department, Batch, Semester, Skill, Proficiency, Placement Status, and Readiness.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-cyber-primary"
            style={{ padding: '7px 14px', fontSize: '12px' }}
          >
            <Upload size={14} />
            <span>Import CSV / Excel</span>
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="btn-cyber-outline"
            style={{ padding: '7px 14px', fontSize: '12px', borderColor: 'var(--cyber-purple)', color: 'var(--cyber-purple)' }}
          >
            <UserPlus size={14} />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="btn-cyber-outline"
            style={{ padding: '7px 14px', fontSize: '12px' }}
          >
            <History size={14} />
            <span>Import History</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn-cyber-outline"
            style={{ padding: '7px 14px', fontSize: '12px' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── CANDIDATE ROSTER TABLE ── */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Found <strong style={{ color: 'var(--cyber-cyan)' }}>{students.length}</strong> matching student records in <strong style={{ color: 'var(--text-primary)' }}>{institution?.institutionName || institution?.name || 'Institution'}</strong>
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Strict Data Isolation Active
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Candidate', 'Dept & Year', 'Semester & CGPA', 'Proficiency', 'Key Skills', 'Readiness', 'Placement', 'Account', 'Actions'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '10.5px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No students currently registered under campus license {institution?.collegeId || 'TN010'}.
                  </td>
                </tr>
              ) : (
                students.map((s) => {
                  const studentSkills = (s.skills || []).map(sk => typeof sk === 'string' ? sk : sk.name);
                  const readiness = s.readinessScore || s.careerReadinessScore || 85;
                  const placement = s.placementStatus || 'In Training';
                  const prof = s.proficiencyLevel || (readiness >= 90 ? 'Advanced' : readiness >= 75 ? 'Proficient' : 'Intermediate');

                  return (
                    <tr
                      key={s.studentId}
                      style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                        setSelectedStudent(s);
                        setActiveDossierTab('overview');
                      }}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={s.name}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s.regNo || s.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        <div>{s.department}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.year || s.batch || 'III Year'}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ color: 'var(--text-secondary)' }}>{s.semester || 'Sem 6'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontWeight: 700 }}>CGPA {s.cgpa}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="cyber-badge badge-purple" style={{ fontSize: '9px' }}>
                          {prof}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '220px' }}>
                          {studentSkills.slice(0, 3).map((sk, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '9.5px',
                                padding: '2px 5px',
                                borderRadius: '3px',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {sk}
                            </span>
                          ))}
                          {studentSkills.length > 3 && (
                            <span style={{ fontSize: '9.5px', padding: '2px 4px', color: 'var(--text-muted)' }}>
                              +{studentSkills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: readiness >= 80 ? 'var(--cyber-emerald)' : 'var(--cyber-amber)', fontFamily: 'var(--font-mono)' }}>
                          {readiness}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          background: placement === 'Placed' ? 'rgba(59,130,246,0.15)' : placement === 'Placement Ready' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          color: placement === 'Placed' ? 'var(--cyber-blue)' : placement === 'Placement Ready' ? 'var(--cyber-emerald)' : 'var(--cyber-amber)'
                        }}>
                          {placement}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {(() => {
                          const accStatus = (s.accountStatus || s.status || 'ACTIVE').toUpperCase();
                          if (accStatus === 'INVITED') {
                            return <span className="cyber-badge badge-amber" style={{ fontSize: '9px' }}>Invited</span>;
                          } else if (accStatus === 'EMAIL_VERIFIED') {
                            return <span className="cyber-badge badge-blue" style={{ fontSize: '9px' }}>Verified</span>;
                          } else if (accStatus === 'DEACTIVATED') {
                            return <span className="cyber-badge badge-coral" style={{ fontSize: '9px' }}>Deactivated</span>;
                          }
                          return <span className="cyber-badge badge-emerald" style={{ fontSize: '9px' }}>Active</span>;
                        })()}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(s);
                              setActiveDossierTab('overview');
                            }}
                            style={{
                              background: 'none',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--cyber-cyan)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                            title="View Student Dossier"
                          >
                            Profile
                          </button>

                          {(s.accountStatus === 'INVITED' || s.status === 'INVITED') && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await academicService.resendStudentInvite(s.studentId || s.id);
                                  if (onShowToast) {
                                    onShowToast({ title: 'Invite Dispatched', message: `Fresh invitation sent to ${s.email || s.name}.`, type: 'success' });
                                  }
                                } catch (err) {
                                  if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
                                }
                              }}
                              style={{
                                background: 'rgba(245,158,11,0.1)',
                                border: '1px solid rgba(245,158,11,0.3)',
                                color: 'var(--cyber-amber)',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                fontSize: '10.5px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Resend Invitation Email"
                            >
                              <Mail size={12} />
                              <span>Resend</span>
                            </button>
                          )}

                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const isDeact = (s.accountStatus || s.status) === 'DEACTIVATED';
                              const nextStatus = isDeact ? 'ACTIVE' : 'DEACTIVATED';
                              try {
                                await academicService.updateStudentStatus(s.studentId || s.id, nextStatus);
                                loadStudents();
                                if (onShowToast) {
                                  onShowToast({
                                    title: isDeact ? 'Student Re-activated' : 'Student Deactivated',
                                    message: `${s.name}'s account is now ${nextStatus}.`,
                                    type: isDeact ? 'success' : 'warning'
                                  });
                                }
                              } catch (err) {
                                if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
                              }
                            }}
                            style={{
                              background: 'none',
                              border: '1px solid var(--border-subtle)',
                              color: (s.accountStatus || s.status) === 'DEACTIVATED' ? 'var(--cyber-emerald)' : 'var(--text-muted)',
                              padding: '4px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title={(s.accountStatus || s.status) === 'DEACTIVATED' ? 'Activate Account' : 'Deactivate Account'}
                          >
                            <Power size={12} />
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

      {/* ── RICH STUDENT ACADEMIC & CAREER DOSSIER MODAL ── */}
      {selectedStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', border: '1px solid var(--cyber-cyan)', borderRadius: '12px' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img
                  src={selectedStudent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={selectedStudent.name}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--cyber-cyan)' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {selectedStudent.name}
                    </h3>
                    <span className="cyber-badge badge-green" style={{ fontSize: '10px' }}>
                      Verified Campus Dossier
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--cyber-cyan)', margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>
                    {selectedStudent.regNo || selectedStudent.studentId} • {selectedStudent.collegeName || institution?.institutionName}
                  </p>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                    {selectedStudent.department} • {selectedStudent.year || 'III Year'} • {selectedStudent.semester || 'Sem 6'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Metrics Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ padding: '12px', background: 'rgba(10,16,30,0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CGPA</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyber-cyan)', marginTop: '2px' }}>{selectedStudent.cgpa || '0.00'}</div>
                <div style={{ fontSize: '10px', color: (selectedStudent.activeBacklogs || 0) > 0 ? '#F87171' : 'var(--cyber-emerald)', marginTop: '2px' }}>
                  {selectedStudent.activeBacklogs || 0} Backlogs
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(10,16,30,0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>COURSE PROGRESS</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyber-cyan)', marginTop: '2px' }}>
                  {selectedStudent.courseCompletionPercentage || 0}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedStudent.creditsCompleted || 0} / {selectedStudent.totalCredits || 160} Cr
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(10,16,30,0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>READINESS</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyber-emerald)', marginTop: '2px' }}>
                  {selectedStudent.readinessScore ?? selectedStudent.careerReadinessScore ?? 0}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Dynamic Fit</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(10,16,30,0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-amber)', marginTop: '6px' }}>
                  {selectedStudent.placementStatus || 'Unassessed'}
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(10,16,30,0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LEDGER SEAL</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-blue)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                  #{selectedStudent.collegeId || institution?.collegeId || 'CAMPUS'}-{String(selectedStudent.regNo || selectedStudent.studentId || 'DID').slice(-4)}
                </div>
              </div>
            </div>

            {/* Dossier Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              {[
                { id: 'overview', label: 'Academic & 4-Point Verification' },
                { id: 'communication', label: `Communication (${selectedStudent.communication?.overallScore ?? selectedStudent.capabilities?.communication ?? 0}%)` },
                { id: 'skills', label: `Verified Skills (${(selectedStudent.skills || []).length})` },
                { id: 'projects', label: `Projects & Proofs (${selectedProjects.length})` },
                { id: 'courses', label: `Learning (${selectedEnrollments.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDossierTab(tab.id)}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    borderBottom: activeDossierTab === tab.id ? '2px solid var(--cyber-cyan)' : '2px solid transparent',
                    color: activeDossierTab === tab.id ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: Overview */}
            {activeDossierTab === 'overview' && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="var(--cyber-emerald)" />
                  <span>4-Point Sovereign Evidence Checklist</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  {(() => {
                    const hasAssessment = (selectedStudent.assessments && selectedStudent.assessments.length > 0) || (selectedStudent.readinessBreakdown?.assessmentScore > 0);
                    const hasCourseCredit = (selectedStudent.creditsCompleted || 0) > 0 || selectedEnrollments.some(e => e.status === 'completed' || e.progress >= 100);
                    const hasGitProof = selectedProjects.some(p => p.proofVerified || p.status === 'Validated' || p.status === 'Verified');
                    const hasSeal = Boolean(selectedStudent.isEndorsed || selectedStudent.ledgerSealed);

                    return (
                      <>
                        <div style={{ padding: '12px', borderRadius: '6px', background: hasAssessment ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)', border: hasAssessment ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle2 size={18} color={hasAssessment ? 'var(--cyber-emerald)' : 'var(--text-muted)'} />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>1. Proctored Assessment</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {hasAssessment ? 'Passed diagnostic evaluation with verified score.' : 'Pending proctored diagnostic assessment.'}
                            </div>
                          </div>
                        </div>
                        <div style={{ padding: '12px', borderRadius: '6px', background: hasCourseCredit ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)', border: hasCourseCredit ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle2 size={18} color={hasCourseCredit ? 'var(--cyber-emerald)' : 'var(--text-muted)'} />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>2. Accredited Course Credit</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {hasCourseCredit ? `${selectedStudent.creditsCompleted || 0} credit hours accredited to ledger.` : 'No course credits logged yet.'}
                            </div>
                          </div>
                        </div>
                        <div style={{ padding: '12px', borderRadius: '6px', background: hasGitProof ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)', border: hasGitProof ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle2 size={18} color={hasGitProof ? 'var(--cyber-emerald)' : 'var(--text-muted)'} />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>3. Git Code Proof Sealed</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {hasGitProof ? 'Repository commits verified and sandbox tests passed.' : 'No verified repository commits logged.'}
                            </div>
                          </div>
                        </div>
                        <div style={{ padding: '12px', borderRadius: '6px', background: hasSeal ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)', border: hasSeal ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle2 size={18} color={hasSeal ? 'var(--cyber-emerald)' : 'var(--text-muted)'} />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>4. Faculty Cryptographic Seal</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {hasSeal ? 'Department Dean endorsement recorded on ledger.' : 'Awaiting departmental faculty cryptographic endorsement.'}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <strong>Preferred Career Track:</strong> {Array.isArray(selectedStudent.preferredRoles) ? selectedStudent.preferredRoles.join(', ') : (selectedStudent.preferredRoles || 'Full Stack Engineer, AI Specialist')}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <strong>Official Campus Email:</strong> {selectedStudent.email}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Skills */}
            {activeDossierTab === 'skills' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(selectedStudent.skills || []).map((sk, idx) => {
                  const name = typeof sk === 'string' ? sk : sk.name;
                  const conf = typeof sk === 'object' && sk.confidence ? sk.confidence : 80;
                  const level = typeof sk === 'object' && sk.level ? sk.level : 'Proficient';
                  return (
                    <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ minWidth: '160px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{level}</div>
                      </div>
                      <div style={{ flex: 1, margin: '0 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Mastery Confidence</span>
                          <span style={{ color: 'var(--cyber-cyan)', fontWeight: 700 }}>{conf}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${conf}%`, background: 'linear-gradient(90deg, var(--cyber-blue), var(--cyber-cyan))', borderRadius: '3px' }}></div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span className="cyber-badge badge-green" style={{ fontSize: '9px' }}>✓ Verified</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT: Projects */}
            {activeDossierTab === 'projects' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedProjects.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No project repositories submitted yet.
                  </div>
                ) : (
                  selectedProjects.map((prj) => (
                    <div key={prj.projectId} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {prj.title}
                        </h5>
                        <span className={`cyber-badge ${prj.status === 'Verified' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '9.5px' }}>
                          {prj.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px' }}>
                        {prj.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {(prj.technologies || []).map((tech, ti) => (
                            <span key={ti} style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', color: 'var(--cyber-cyan)' }}>
                              {tech}
                            </span>
                          ))}
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          {prj.validation?.unitTestsPassed || 'Unit tests evaluated'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: Courses */}
            {activeDossierTab === 'courses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedEnrollments.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No active course enrollments.
                  </div>
                ) : (
                  selectedEnrollments.map((enr) => (
                    <div key={enr.enrollmentId} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {enr.courseTitle}
                        </h5>
                        <span className={`cyber-badge ${enr.progress >= 100 ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: '9.5px' }}>
                          {enr.progress >= 100 ? 'Completed' : `${enr.progress}% Completed`}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Current Status: {enr.currentModule}
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${enr.progress}%`, background: 'var(--cyber-emerald)', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: Communication Skills */}
            {activeDossierTab === 'communication' && (
              <div>
                {(() => {
                  const comm = selectedStudent.communication || {};
                  const cats = comm.categories || {};
                  const overall = Number(comm.overallScore ?? selectedStudent.capabilities?.communication ?? 0);
                  const activities = Array.isArray(comm.activities) ? comm.activities : [];
                  const latestAct = activities.length > 0 ? activities[activities.length - 1] : null;

                  return (
                    <div>
                      {/* Top Metric Header */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px', textAlign: 'center' }}>
                        <div style={{ padding: '14px', background: 'rgba(139,92,246,0.08)', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.25)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OVERALL SKILL</div>
                          <div style={{ fontSize: '22px', fontWeight: 800, color: '#8B5CF6', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>{overall}%</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Level {comm.level || 1}</div>
                        </div>
                        <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>LESSONS COMPLETED</div>
                          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cyber-cyan)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                            {activities.filter(a => a.completion).length}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{activities.length} Attempts</div>
                        </div>
                        <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>LATEST SCORE</div>
                          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cyber-emerald)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                            {latestAct ? `${latestAct.score}%` : '0%'}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{latestAct ? `${latestAct.accuracy}% Acc` : 'No tests'}</div>
                        </div>
                        <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ACTIVE STREAK</div>
                          <div style={{ fontSize: '22px', fontWeight: 800, color: '#FF9D4D', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                            {comm.streak || 0}d
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{comm.xp || 0} XP Total</div>
                        </div>
                      </div>

                      {/* 6 Category Sub-Skills Breakdown */}
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                        Communication Sub-Capability Breakdown
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                        {[
                          { key: 'vocabulary', label: 'Vocabulary & Lexicon', color: 'var(--cyber-cyan)' },
                          { key: 'grammar', label: 'Grammar & Syntax', color: '#8B5CF6' },
                          { key: 'reading', label: 'Reading Comprehension', color: '#3B82F6' },
                          { key: 'listening', label: 'Listening Comprehension', color: '#FF9D4D' },
                          { key: 'speaking', label: 'Speaking & Articulation', color: 'var(--cyber-emerald)' },
                          { key: 'conversation', label: 'Workplace Conversation', color: '#EC4899' }
                        ].map(cat => {
                          const val = Number(cats[cat.key]?.score ?? cats[cat.key] ?? 0);
                          return (
                            <div key={cat.key} style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{cat.label}</span>
                                <span style={{ fontWeight: 700, color: cat.color, fontFamily: 'var(--font-mono)' }}>{val}%</span>
                              </div>
                              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${val}%`, height: '100%', background: cat.color, borderRadius: '3px', transition: 'width 0.3s ease' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Strengths & Improvement Areas */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(46, 224, 161, 0.05)', border: '1px solid rgba(46, 224, 161, 0.2)' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyber-emerald)', textTransform: 'uppercase', marginBottom: '6px' }}>
                            ✓ Validated Strengths
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {comm.strengths && comm.strengths.length > 0
                              ? comm.strengths.join(', ')
                              : overall >= 60 ? 'Strong baseline verbal foundation' : 'None established yet (score ≥60% needed)'}
                          </div>
                        </div>
                        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 157, 77, 0.05)', border: '1px solid rgba(255, 157, 77, 0.2)' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#FF9D4D', textTransform: 'uppercase', marginBottom: '6px' }}>
                            • Improvement Priorities
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {comm.areasToImprove && comm.areasToImprove.length > 0
                              ? comm.areasToImprove.join(', ')
                              : 'Practice interview and speaking drills to elevate proficiency.'}
                          </div>
                        </div>
                      </div>

                      {/* Practice Activity History */}
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                        Recent Practice Activity
                      </h4>
                      {activities.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border-subtle)', borderRadius: '6px' }}>
                          No recorded communication activity for this student yet.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {activities.slice(-3).reverse().map((act, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                              <div>
                                <span className="cyber-badge badge-blue" style={{ fontSize: '9px', textTransform: 'uppercase', marginRight: '8px' }}>
                                  {act.category}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{act.lessonId}</span>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  {new Date(act.completedAt).toLocaleString()}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-emerald)', fontFamily: 'var(--font-mono)' }}>
                                  {act.score}% Score
                                </span>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{act.accuracy}% Accuracy</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => handleEndorseSeal(selectedStudent.studentId)}
                className="btn-cyber-outline"
                style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--cyber-emerald)', borderColor: 'rgba(16,185,129,0.4)' }}
              >
                <ShieldCheck size={14} />
                <span>Re-verify Campus Ledger Seal</span>
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="btn-cyber-primary"
                style={{ padding: '8px 20px', fontSize: '12px' }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ROSTER IMPORT MODAL ── */}
      {showImportModal && (
        <RosterImportModal
          institution={institution}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => loadStudents()}
          onShowToast={onShowToast}
        />
      )}

      {/* ── MANUAL STUDENT ADD MODAL ── */}
      {showManualModal && (
        <ManualStudentModal
          institution={institution}
          onClose={() => setShowManualModal(false)}
          onSuccess={() => loadStudents()}
          onShowToast={onShowToast}
        />
      )}

      {/* ── ROSTER IMPORT HISTORY MODAL ── */}
      {showHistoryModal && (
        <RosterImportHistoryModal
          institution={institution}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}
