import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Award,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Eye,
  RefreshCw,
  Target
} from 'lucide-react';
import { academicService } from '../../services/academicService';
import InstitutionStudentDetails from './InstitutionStudentDetails';

export default function InstitutionStudentPerformance({ onShowToast, institution }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await academicService.getStudentPerformanceList({
        department: selectedDept,
        classId: selectedClass,
        search
      });
      if (res?.success && Array.isArray(res.data)) {
        setStudents(res.data);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Failed to load student performance roster:', err);
      if (onShowToast) onShowToast({ title: 'Error', message: 'Failed to load students', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedDept, selectedClass]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedTier !== 'All' && s.readinessStatus !== selectedTier) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (s.name || '').toLowerCase().includes(q) ||
          (s.rollNumber || '').toLowerCase().includes(q) ||
          (s.department || '').toLowerCase().includes(q) ||
          (s.academician || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [students, search, selectedTier]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} color="var(--cyber-cyan)" />
            <span>Institution Student Performance Overview</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Institution-wide registry tracking progress, diagnostic assessments, digital certificates, and academician advisors.
          </p>
        </div>
        <button
          onClick={fetchStudents}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 600,
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            color: 'var(--cyber-cyan)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── FILTERS ── */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by student, roll number, or advisor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '6px',
              fontSize: '12.5px',
              background: 'rgba(10, 16, 30, 0.8)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Department */}
        <select
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12.5px',
            background: 'rgba(10, 16, 30, 0.8)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <option value="All">All Departments</option>
          <option value="CSE">CSE</option>
          <option value="ECE">ECE</option>
          <option value="EEE">EEE</option>
          <option value="MECH">MECH</option>
        </select>

        {/* Readiness Tier */}
        <select
          value={selectedTier}
          onChange={e => setSelectedTier(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12.5px',
            background: 'rgba(10, 16, 30, 0.8)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <option value="All">All Readiness Tiers</option>
          <option value="Industry Ready">Industry Ready (75%+)</option>
          <option value="Near Ready">Near Ready (60-74%)</option>
          <option value="Needs Support">Needs Support (&lt;60%)</option>
        </select>
      </div>

      {/* ── STUDENT PERFORMANCE TABLE ── */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 16px' }}>Student Name</th>
                <th style={{ padding: '12px 16px' }}>Roll / ID</th>
                <th style={{ padding: '12px 16px' }}>Department</th>
                <th style={{ padding: '12px 16px' }}>Class</th>
                <th style={{ padding: '12px 16px' }}>Academician</th>
                <th style={{ padding: '12px 16px' }}>Course Progress</th>
                <th style={{ padding: '12px 16px' }}>Skill Score</th>
                <th style={{ padding: '12px 16px' }}>Assessment</th>
                <th style={{ padding: '12px 16px' }}>Certificates</th>
                <th style={{ padding: '12px 16px' }}>Readiness</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {loading ? 'Loading student performance data...' : 'No students matching the selected criteria.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr
                    key={s.id || idx}
                    onClick={() => setSelectedStudentForDetail(s)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                      {s.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}>
                      {s.rollNumber}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontSize: '12.5px' }}>
                      {s.department}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                      {s.class}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--cyber-cyan)', fontSize: '12.5px', fontWeight: 600 }}>
                      {s.academician}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '50px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${s.courseProgress}%`, height: '100%', background: 'var(--cyber-cyan)' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{s.courseProgress}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                      {s.skillScore}%
                    </td>
                    <td style={{ padding: '12px 16px', color: s.assessmentScore > 0 ? 'var(--cyber-emerald)' : 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                      {s.assessmentScore > 0 ? `${s.assessmentScore}%` : 'Pending'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {s.certificates}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: s.readinessStatus === 'Industry Ready' ? 'rgba(16, 185, 129, 0.12)' : s.readinessStatus === 'Near Ready' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: s.readinessStatus === 'Industry Ready' ? 'var(--cyber-emerald)' : s.readinessStatus === 'Near Ready' ? 'var(--cyber-cyan)' : 'var(--cyber-rose)'
                        }}
                      >
                        {s.industryReadiness}% ({s.readinessStatus})
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudentForDetail(s);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          background: 'rgba(0, 242, 254, 0.1)',
                          color: 'var(--cyber-cyan)',
                          border: '1px solid rgba(0, 242, 254, 0.2)',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={12} /> View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── STUDENT DETAILS MODAL ── */}
      {selectedStudentForDetail && (
        <InstitutionStudentDetails
          student={selectedStudentForDetail}
          onClose={() => setSelectedStudentForDetail(null)}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
