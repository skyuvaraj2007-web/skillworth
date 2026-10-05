import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  Lock,
  Layers,
  FileCheck,
  FolderGit2,
  GraduationCap,
  ThumbsUp,
  ThumbsDown,
  Sparkles
} from 'lucide-react';
import { getAllProjects, validateProjectByFaculty } from '../../services/nexusDataStore';

export default function InstitutionProofs({ onShowToast, institution }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProof, setSelectedProof] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setVersion(v => v + 1);
    window.addEventListener('nexus_project_submitted', handleUpdate);
    window.addEventListener('nexus_project_verified', handleUpdate);
    window.addEventListener('nexus_data_updated', handleUpdate);
    return () => {
      window.removeEventListener('nexus_project_submitted', handleUpdate);
      window.removeEventListener('nexus_project_verified', handleUpdate);
      window.removeEventListener('nexus_data_updated', handleUpdate);
    };
  }, []);

  const instCollegeId = String(institution?.collegeId || institution?.id || '').toUpperCase().trim();

  const relationalProjects = useMemo(() => {
    return getAllProjects()
      .filter(p => {
        if (!p.studentId) return true;
        const sid = String(p.studentId).toUpperCase();
        if (!instCollegeId) return true;
        return sid.includes(`-${instCollegeId}-`);
      })
      .map(p => ({
        id: p.projectId,
        isRelational: true,
        student: p.studentName || 'Student Candidate',
        studentId: p.studentId,
        dept: p.department || 'CSE',
        skill: Array.isArray(p.technologies) ? p.technologies.slice(0, 2).join(' & ') : p.title,
        type: 'Project Verification',
        hash: p.validation?.proctorSignature || `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}...${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
        date: p.validation?.verifiedDate || new Date().toISOString().split('T')[0],
        status: p.status === 'Verified' ? 'verified' : 'pending',
        evidence: {
          score: p.validation?.score ? `${p.validation.score}/100` : 'Evaluating in Sandbox',
          assessment: p.title,
          gitRepo: p.repositoryUrl || 'https://github.com/nexus-student/project-repo',
          proctorId: p.validation?.proctorSignature || 'Pending Faculty Review',
          blockNumber: p.validation?.blockNumber || 'Awaiting Mint Block',
          validator: p.reviewer || 'Faculty Review Board'
        }
      }));
  }, [version, instCollegeId]);

  // Live relational submissions only - no hardcoded fake proofs
  const allProofs = useMemo(() => {
    return relationalProjects;
  }, [relationalProjects]);

  const types = ['ALL', 'Skill Assessment', 'Project Verification', 'Course Completion', 'Internship Attestation', 'Badge Attestation'];

  const filtered = useMemo(() => {
    return allProofs.filter(p => {
      if (filterStatus !== 'ALL' && p.status !== filterStatus.toLowerCase()) return false;
      if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchStudent = p.student.toLowerCase().includes(q);
        const matchSkill = p.skill.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        if (!matchStudent && !matchSkill && !matchId) return false;
      }
      return true;
    });
  }, [allProofs, filterStatus, typeFilter, searchQuery]);

  const pendingCount = allProofs.filter(p => p.status === 'pending').length;
  const verifiedCount = allProofs.filter(p => p.status === 'verified').length;

  const handleApproveProof = (proofId) => {
    const facultyName = institution?.institutionName ? `Faculty Board (${institution.institutionName})` : 'Prof. K. Ramanathan (Dean)';
    validateProjectByFaculty(proofId, true, facultyName);
    setVersion(v => v + 1);
    setSelectedProof(null);
    if (onShowToast) {
      onShowToast({
        title: 'Proof Cryptographically Sealed',
        message: `Project ${proofId} verified & minted to block ledger. Student skills elevated.`,
        type: 'success'
      });
    }
  };

  const handleRejectProof = (proofId) => {
    validateProjectByFaculty(proofId, false, 'Faculty Review Board');
    setVersion(v => v + 1);
    setSelectedProof(null);
    if (onShowToast) {
      onShowToast({
        title: 'Proof Returned for Revision',
        message: `Project ${proofId} rejected. Revision note dispatched to student.`,
        type: 'warning'
      });
    }
  };

  return (
    <div>
      {/* ── METRICS ROW ── */}
      <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="metric-stat-card accent-emerald">
          <div className="metric-stat-header">TOTAL VERIFIED PROOFS</div>
          <div className="metric-stat-value">{verifiedCount}</div>
          <div className="metric-stat-sub">Immutable On-Chain Signatures</div>
        </div>
        <div className="metric-stat-card accent-amber">
          <div className="metric-stat-header">PENDING ATTESTATION</div>
          <div className="metric-stat-value">{pendingCount}</div>
          <div className="metric-stat-sub">Faculty Queue Review</div>
        </div>
        <div className="metric-stat-card accent-cyan">
          <div className="metric-stat-header">CERTIFICATE PROOFS</div>
          <div className="metric-stat-value">{allProofs.filter(p => p.type === 'certificate' || p.category === 'Certificate').length}</div>
          <div className="metric-stat-sub">Industry Endorsed</div>
        </div>
        <div className="metric-stat-card accent-purple">
          <div className="metric-stat-header">PROJECT ARTIFACTS</div>
          <div className="metric-stat-value">{relationalProjects.length || allProofs.filter(p => p.type === 'project' || p.projectTitle).length}</div>
          <div className="metric-stat-sub">Live Git Commits Linked</div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search proof by student, skill, or proof ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '36px',
              paddingRight: '12px',
              paddingTop: '8px',
              paddingBottom: '8px',
              background: 'rgba(10,16,30,0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'verified', 'pending'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                background: filterStatus === st ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
                border: filterStatus === st ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                color: filterStatus === st ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── PROOFS TABLE ── */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Attestation Registry: <strong style={{ color: 'var(--cyber-cyan)' }}>{filtered.length}</strong> Proof Records
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Autonomous Sandbox Consensus Active
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Proof ID', 'Candidate', 'Dept', 'Skill & Artifact', 'Type', 'Hash Digest', 'Status', 'Actions'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '10.5px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No proofs match the selected query.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setSelectedProof(p)}
                  >
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--cyber-cyan)', fontWeight: 600 }}>
                      {p.id}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.student}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.studentId}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {p.dept}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.skill}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.evidence.assessment}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="cyber-badge badge-blue" style={{ fontSize: '9px' }}>
                        {p.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {p.hash}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        background: p.status === 'verified' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: p.status === 'verified' ? 'var(--cyber-emerald)' : 'var(--cyber-amber)'
                      }}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {p.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveProof(p.id);
                            }}
                            className="btn-cyber-primary"
                            style={{ padding: '4px 8px', fontSize: '10.5px' }}
                            title="Approve & Mint Seal to Ledger"
                          >
                            ✓ Validate
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProof(p);
                          }}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--cyber-cyan)',
                            padding: '4px 10px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Inspect →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PROOF EVIDENCE INSPECTION MODAL ── */}
      {selectedProof && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '640px', width: '100%', padding: '28px', border: `1px solid ${selectedProof.status === 'verified' ? 'var(--cyber-emerald)' : 'var(--cyber-amber)'}`, borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color={selectedProof.status === 'verified' ? "var(--cyber-emerald)" : "var(--cyber-amber)"} />
                  <span className={`cyber-badge ${selectedProof.status === 'verified' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '10px' }}>
                    {selectedProof.status === 'verified' ? 'CRYPTOGRAPHICALLY SEALED' : 'PENDING FACULTY ATTESTATION'}
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', margin: '4px 0 2px' }}>
                  {selectedProof.skill}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Student: {selectedProof.student} ({selectedProof.studentId}) • {selectedProof.dept}
                </div>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Proof payload specs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', marginBottom: '20px' }}>
              <div style={{ padding: '10px 14px', background: 'rgba(10,16,30,0.6)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', display: 'block', fontFamily: 'var(--font-mono)' }}>HASH DIGEST (SHA-256)</span>
                <span style={{ color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{selectedProof.hash}</span>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(10,16,30,0.6)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', display: 'block', fontFamily: 'var(--font-mono)' }}>ASSESSMENT / PROJECT TITLE</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedProof.evidence.assessment} (Evaluation: {selectedProof.evidence.score})</span>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(10,16,30,0.6)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', display: 'block', fontFamily: 'var(--font-mono)' }}>GIT REPOSITORY AUDIT</span>
                <span style={{ color: 'var(--cyber-cyan)' }}>{selectedProof.evidence.gitRepo}</span>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(10,16,30,0.6)', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', display: 'block', fontFamily: 'var(--font-mono)' }}>BLOCK NUMBER</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{selectedProof.evidence.blockNumber}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', display: 'block', fontFamily: 'var(--font-mono)' }}>VALIDATOR NODE</span>
                  <span style={{ color: 'var(--cyber-emerald)' }}>{selectedProof.evidence.validator}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div>
                {selectedProof.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleApproveProof(selectedProof.id)}
                      className="btn-cyber-primary"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                    >
                      ✓ Approve & Seal to Ledger
                    </button>
                    <button
                      onClick={() => handleRejectProof(selectedProof.id)}
                      className="btn-cyber-outline"
                      style={{ padding: '8px 14px', fontSize: '12px', color: 'var(--cyber-rose)', borderColor: 'rgba(244,63,94,0.4)' }}
                    >
                      Request Revisions
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSelectedProof(null)}
                  className="btn-cyber-outline"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
