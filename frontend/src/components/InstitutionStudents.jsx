import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  GraduationCap,
  Mail,
  Award,
  CheckCircle2,
  ChevronRight,
  X,
  ExternalLink,
  BookOpen,
  Code2,
  FolderGit2,
  TrendingUp,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { getStudentsByCollegeId, getAllStudents } from '../services/studentStore';
import { getCollegeById } from '../services/collegeDirectory';

/**
 * InstitutionStudents
 * Academic Workspace -> Student Details
 * Displays students strictly associated with current institution's collegeId.
 */
export default function InstitutionStudents({ institution, onShowToast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // Resolve current institution's collegeId
  const currentCollegeId = institution?.collegeId || institution?.id || '';
  const collegeInfo = useMemo(() => currentCollegeId ? getCollegeById(currentCollegeId) : null, [currentCollegeId]);

  // Load students strictly for this college
  const loadCollegeStudents = () => {
    setLoading(true);
    setTimeout(() => {
      const records = getStudentsByCollegeId(currentCollegeId);
      setStudents(records);
      setLoading(false);
    }, 250);
  };

  useEffect(() => {
    loadCollegeStudents();

    // Listen for live student registrations
    const handleUpdate = (e) => {
      if (e.detail && e.detail.collegeId === currentCollegeId) {
        loadCollegeStudents();
        if (onShowToast) {
          onShowToast({
            title: 'Roster Synchronized',
            message: `New student registration linked: ${e.detail.student.name}`,
            type: 'success'
          });
        }
      }
    };

    window.addEventListener('nexus_students_updated', handleUpdate);
    return () => window.removeEventListener('nexus_students_updated', handleUpdate);
  }, [currentCollegeId]);

  // Extract dynamic list of departments from student data
  const availableDepts = useMemo(() => {
    const set = new Set();
    students.forEach(s => {
      if (s.department) set.add(s.department);
    });
    // Add standard ones if not present
    ['CSE', 'IT', 'ECE', 'EEE', 'AI & DS', 'MECH'].forEach(d => set.add(d));
    return Array.from(set).sort();
  }, [students]);

  // Available Years
  const availableYears = ['I Year', 'II Year', 'III Year', 'IV Year'];

  // Filtering & Search
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // 1. Search (Name, Student ID, Email)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = student.name?.toLowerCase().includes(q);
        const matchId = student.studentId?.toLowerCase().includes(q);
        const matchEmail = student.email?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchEmail) return false;
      }

      // 2. Department
      if (selectedDept !== 'ALL') {
        const studentDept = (student.department || '').toUpperCase();
        if (studentDept !== selectedDept.toUpperCase()) return false;
      }

      // 3. Year
      if (selectedYear !== 'ALL') {
        if (student.year !== selectedYear) return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedDept, selectedYear]);

  // Sorting
  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'dept':
          return (a.department || '').localeCompare(b.department || '');
        case 'year':
          return (a.year || '').localeCompare(b.year || '');
        case 'readiness_desc':
          return (b.learningProgress || 0) - (a.learningProgress || 0);
        case 'recent':
          return new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0);
        default:
          return 0;
      }
    });
    return list;
  }, [filteredStudents, sortBy]);

  // Pagination
  const paginatedStudents = useMemo(() => {
    return sortedStudents.slice(0, page * PAGE_SIZE);
  }, [sortedStudents, page]);

  const hasMore = paginatedStudents.length < sortedStudents.length;

  return (
    <div style={{ marginTop: '32px' }}>
      {/* Section Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--cyber-cyan)',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Building2 size={13} />
            <span>Academic Workspace // Student Details</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--cyber-emerald)' }}>ID: {currentCollegeId}</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Institutional Student Roster
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Verified student profiles registered under {collegeInfo ? collegeInfo.collegeName : (institution?.institutionName || 'your institution')}.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(10, 16, 30, 0.6)',
          padding: '8px 16px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>AFFILIATED ROSTER</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>
              {students.length} <span style={{ fontSize: '11.5px', fontWeight: 400, color: 'var(--text-secondary)' }}>Students</span>
            </div>
          </div>
          <div style={{ width: '1px', height: '28px', background: 'var(--border-subtle)' }} />
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>COLLEGE CODE</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-purple)', fontFamily: 'var(--font-mono)' }}>
              {currentCollegeId}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search + Department + Year + Sort */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 2fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(160px, 1.2fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '0 12px',
          gap: '8px'
        }}>
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search student by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '9px 0',
              color: 'var(--text-primary)',
              fontSize: '13px'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Department Filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '9px 12px',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="ALL">All Departments</option>
            {availableDepts.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '9px 12px',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="ALL">All Academic Years</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div style={{ position: 'relative' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '9px 12px',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="name_asc">Sort: Name (A → Z)</option>
            <option value="name_desc">Sort: Name (Z → A)</option>
            <option value="readiness_desc">Sort: Skill Readiness (High → Low)</option>
            <option value="dept">Sort: Department</option>
            <option value="year">Sort: Academic Year</option>
            <option value="recent">Sort: Recently Registered</option>
          </select>
        </div>
      </div>

      {/* Roster Display */}
      {loading ? (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: 'rgba(10, 16, 30, 0.4)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            display: 'inline-block',
            width: '28px',
            height: '28px',
            border: '3px solid rgba(0, 242, 254, 0.2)',
            borderTopColor: 'var(--cyber-cyan)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Loading student records for {currentCollegeId}...
          </div>
        </div>
      ) : students.length === 0 ? (
        /* Empty State for Institution with 0 students */
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: 'rgba(10, 16, 30, 0.4)',
          borderRadius: '12px',
          border: '1px dashed var(--border-subtle)'
        }}>
          <GraduationCap size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            No students have registered with your institution yet.
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 16px' }}>
            Students registered using this institution's official college identity (<strong style={{ color: 'var(--cyber-cyan)' }}>{currentCollegeId}</strong>) will appear here automatically in real time.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        /* No match for current filter */
        <div style={{
          padding: '36px 20px',
          textAlign: 'center',
          background: 'rgba(10, 16, 30, 0.4)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          <Filter size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No matching students found</div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Try adjusting your search term, department, or academic year filter.
          </div>
          <button
            onClick={() => { setSearchQuery(''); setSelectedDept('ALL'); setSelectedYear('ALL'); }}
            className="btn-cyber-outline"
            style={{ marginTop: '14px', padding: '6px 14px', fontSize: '12px' }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        /* Student Table / Cards */
        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '14px 18px' }}>STUDENT NAME</th>
                  <th style={{ padding: '14px 14px' }}>DEPARTMENT</th>
                  <th style={{ padding: '14px 14px' }}>YEAR</th>
                  <th style={{ padding: '14px 14px' }}>CONTACT / EMAIL</th>
                  <th style={{ padding: '14px 14px' }}>SKILLS & READINESS</th>
                  <th style={{ padding: '14px 14px' }}>STATUS</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((stu) => (
                  <tr
                    key={stu.studentId}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setSelectedStudent(stu)}
                  >
                    {/* Student Info */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={stu.avatar}
                          alt={stu.name}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid rgba(0, 242, 254, 0.3)'
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stu.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {stu.studentId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td style={{ padding: '14px 14px' }}>
                      <span className="cyber-badge badge-purple" style={{ fontSize: '10px' }}>
                        {stu.department}
                      </span>
                    </td>

                    {/* Year */}
                    <td style={{ padding: '14px 14px', color: 'var(--text-secondary)' }}>
                      {stu.year}
                    </td>

                    {/* Email */}
                    <td style={{ padding: '14px 14px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Mail size={12} />
                        {stu.email}
                      </span>
                    </td>

                    {/* Skills & Readiness */}
                    <td style={{ padding: '14px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: '70px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '3px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                            <span style={{ color: 'var(--cyber-cyan)', fontWeight: 700 }}>{stu.learningProgress}%</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${stu.learningProgress}%`,
                              background: 'var(--grad-cyan-blue)',
                              borderRadius: '2px'
                            }} />
                          </div>
                        </div>
                        <span style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                          whiteSpace: 'nowrap'
                        }}>
                          {stu.skills?.length || 0} skills
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 14px' }}>
                      <span className="cyber-badge badge-emerald" style={{ fontSize: '9px' }}>
                        ● {stu.status || 'Active'}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(stu);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--cyber-cyan)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Inspect <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination / Load More Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(10, 16, 30, 0.5)',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}>
            <div>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{paginatedStudents.length}</strong> of{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{filteredStudents.length}</strong> matching students
            </div>

            {hasMore ? (
              <button
                onClick={() => setPage(p => p + 1)}
                className="btn-cyber-outline"
                style={{ padding: '6px 14px', fontSize: '11.5px' }}
              >
                Load More Students
              </button>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                All eligible records loaded
              </span>
            )}
          </div>
        </div>
      )}

      {/* Interactive Student Details Modal / Drawer */}
      {selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '680px',
            background: 'linear-gradient(180deg, #0d1527 0%, #080d19 100%)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.1)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(15, 23, 42, 0.6)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>VERIFIED STUDENT PROFILE</span>
                <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--cyber-purple)' }}>
                  {selectedStudent.studentId}
                </span>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Profile Top Row */}
              <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '22px' }}>
                <img
                  src={selectedStudent.avatar}
                  alt={selectedStudent.name}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--cyber-cyan)'
                  }}
                />
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedStudent.name}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    <span className="cyber-badge badge-purple">{selectedStudent.department}</span>
                    <span className="cyber-badge badge-cyan">{selectedStudent.year}</span>
                    <span className="cyber-badge badge-emerald">● {selectedStudent.status}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {selectedStudent.email} • {selectedStudent.collegeName}
                  </div>
                </div>
              </div>

              {/* Progress & Competency Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '22px'
              }}>
                <div style={{
                  padding: '12px',
                  background: 'rgba(10, 16, 30, 0.6)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>LEARNING PROGRESS</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-cyan)', marginTop: '4px' }}>
                    {selectedStudent.learningProgress}%
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${selectedStudent.learningProgress}%`, background: 'var(--grad-cyan-blue)' }} />
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  background: 'rgba(10, 16, 30, 0.6)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SKILL COUNT</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-purple)', marginTop: '4px' }}>
                    {selectedStudent.skills?.length || 0}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {selectedStudent.verifiedSkills?.length || 0} Cryptographically Verified
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  background: 'rgba(10, 16, 30, 0.6)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>INSTITUTION CODE</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyber-emerald)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    {selectedStudent.collegeId}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Isolated Roster Link
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Code2 size={14} style={{ color: 'var(--cyber-cyan)' }} />
                  TECHNICAL SKILLS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedStudent.skills?.map((sk, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(0, 242, 254, 0.08)',
                        border: '1px solid rgba(0, 242, 254, 0.25)',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        color: 'var(--cyber-cyan)',
                        fontWeight: 500
                      }}
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assessments */}
              {selectedStudent.assessments && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} style={{ color: 'var(--cyber-emerald)' }} />
                    ASSESSMENT BREAKDOWN
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {Object.entries(selectedStudent.assessments).map(([key, val]) => (
                      <div
                        key={key}
                        style={{
                          padding: '10px 12px',
                          background: 'rgba(10, 16, 30, 0.5)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-emerald)', fontFamily: 'var(--font-mono)' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {selectedStudent.projects && selectedStudent.projects.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FolderGit2 size={14} style={{ color: 'var(--cyber-purple)' }} />
                    CAPSTONE & INDUSTRY PROJECTS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedStudent.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(10, 16, 30, 0.5)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '12.5px',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{proj}</span>
                        <span className="cyber-badge badge-cyan" style={{ fontSize: '9px' }}>VERIFIED CODE</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Skills Badges */}
              {selectedStudent.verifiedSkills && selectedStudent.verifiedSkills.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} style={{ color: 'var(--cyber-emerald)' }} />
                    ACADEMIC & INDUSTRY CERTIFICATIONS
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedStudent.verifiedSkills.map((cert, idx) => (
                      <span
                        key={idx}
                        className="cyber-badge badge-emerald"
                        style={{ fontSize: '10.5px', padding: '4px 8px' }}
                      >
                        ✓ {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                onClick={() => setSelectedStudent(null)}
                className="btn-cyber-outline"
                style={{ padding: '8px 18px', fontSize: '12.5px' }}
              >
                Close Roster Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
