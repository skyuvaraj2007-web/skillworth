import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Compass,
  GraduationCap,
  Award,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { collaborationService } from '../../services/collaborationService';
import CompanyStudentDevelopment from './CompanyStudentDevelopment';

export default function CompanyAuthorizedStudents({ onShowToast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStudentId, setActiveStudentId] = useState(null);

  const loadAuthorizedStudents = async () => {
    try {
      setLoading(true);
      const res = await collaborationService.getAuthorizedStudents();
      if (res.success) {
        setStudents(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load authorized students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthorizedStudents();
  }, []);

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.institutionName || s.collegeName || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q) ||
      (s.rollNumber || s.regNo || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: '24px', color: '#e2e8f0', minHeight: '100%' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
        padding: '24px',
        borderRadius: '14px',
        border: '1px solid rgba(0, 212, 255, 0.25)',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users style={{ color: '#00d4ff', width: '28px', height: '28px' }} />
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Authorized Student Talent Pool
            </h1>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Students shared with your company by academic institutions under accepted access agreements.
          </p>
        </div>

        <div style={{
          background: 'rgba(0, 212, 255, 0.12)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 700,
          color: '#00d4ff'
        }}>
          {students.length} Authorized Candidates
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search style={{ position: 'absolute', left: '14px', top: '12px', width: '18px', height: '18px', color: '#64748b' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by student name, college, department, or roll number..."
          style={{
            width: '100%',
            padding: '10px 14px 10px 42px',
            borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#f8fafc',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Student Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading authorized candidates...</div>
      ) : filteredStudents.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '12px',
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <ShieldCheck style={{ width: '40px', height: '40px', color: '#64748b', margin: '0 auto 12px auto' }} />
          <h3 style={{ color: '#e2e8f0', margin: '0 0 6px 0' }}>No Authorized Students Found</h3>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>
            When university partners send access requests and you accept them, verified candidates appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredStudents.map((s) => (
            <div
              key={s.studentId || s.id}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0284c7, #00d4ff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, color: '#fff', fontSize: '16px'
                    }}>
                      {s.name ? s.name.slice(0, 2).toUpperCase() : 'ST'}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                        {s.name}
                      </h3>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                        {s.rollNumber || s.regNo || 'Enrolled Student'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800,
                      background: 'rgba(168, 85, 247, 0.18)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)'
                    }}>
                      READ ONLY
                    </span>
                    <span style={{
                      padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                      background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80'
                    }}>
                      {s.readinessScore || s.readiness || 0}% Ready
                    </span>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(30, 41, 59, 0.4)', padding: '10px 12px', borderRadius: '8px',
                  marginBottom: '14px', fontSize: '12.5px', color: '#cbd5e1'
                }}>
                  <div><strong>Institution:</strong> {s.institutionName || s.collegeName || s.collegeId || 'Partner University'}</div>
                  <div style={{ marginTop: '3px' }}><strong>Department:</strong> {s.department || 'Engineering'} ({s.batch || '2026'})</div>
                </div>

                {/* Skills Preview */}
                {s.skills && s.skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                    {s.skills.slice(0, 4).map((sk, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                          background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff',
                          border: '1px solid rgba(0, 212, 255, 0.2)'
                        }}
                      >
                        {sk.name || sk.skill || sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveStudentId(s.studentId || s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #0284c7, #00d4ff)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                <Compass style={{ width: '15px', height: '15px' }} />
                View 360° Developmental Profile
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Full 360-degree Development Modal */}
      {activeStudentId && (
        <CompanyStudentDevelopment
          studentId={activeStudentId}
          onClose={() => setActiveStudentId(null)}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
