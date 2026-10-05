import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Award,
  BookOpen,
  Code,
  Users,
  CheckCircle2,
  Clock,
  Send,
  PlusCircle,
  Building,
  Terminal,
  FolderGit2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
  X,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Bell,
  Trash2,
  Plus,
  Play,
  Layers,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { dispatchAssessmentAssignedNotification } from '../../services/notificationStore';
import '../common/CompactDataList.css';

const PROGRAMMING_LANGUAGES = [
  { id: 'JavaScript', name: 'JavaScript (Node.js)', icon: '⚡', starter: '// JavaScript Solution\nfunction solution(input) {\n  // Implement system logic here\n  return true;\n}' },
  { id: 'TypeScript', name: 'TypeScript', icon: '🔷', starter: '// TypeScript Solution\nfunction solution(input: string): boolean {\n  // Implement typed system logic here\n  return true;\n}' },
  { id: 'Python', name: 'Python 3.11', icon: '🐍', starter: '# Python 3 Solution\ndef solution(input_data):\n    # Implement system logic here\n    return True\n' },
  { id: 'Java', name: 'Java 17', icon: '☕', starter: '// Java Solution\npublic class Solution {\n    public static boolean solution(String input) {\n        // Implement logic here\n        return true;\n    }\n}' },
  { id: 'C++', name: 'C++ 20', icon: '⚙️', starter: '// C++ Solution\n#include <iostream>\n#include <string>\n\nbool solution(const std::string& input) {\n    // Implement logic here\n    return true;\n}' },
  { id: 'Go', name: 'Go (Golang)', icon: '🐹', starter: '// Go Solution\npackage main\n\nfunc Solution(input string) bool {\n    // Implement logic here\n    return true\n}' }
];

export default function CompanyLearningAssessments({ user, onShowToast, onNavigateToStudents }) {
  const [activeSubTab, setActiveSubTab] = useState('ROSTER'); // 'ROSTER' | 'POSTED_TESTS'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState('ALL');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('ALL');

  // Live data
  const [candidates, setCandidates] = useState([]);
  const [postedAssessments, setPostedAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

  // Post Assessment Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Students, 2: Language & Project, 3: Questions, 4: Review

  // Results Drawer State
  const [selectedAssessmentDetail, setSelectedAssessmentDetail] = useState(null);

  const apiBase = useMemo(() => {
    return (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
  }, []);

  const companyName = user?.companyName || user?.company || user?.name || 'Enterprise Technology Partner';
  const companyId = user?.companyId || user?.userId || user?.id || '';

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    programmingLanguage: 'JavaScript',
    projectTitle: '',
    projectDomain: 'Full Stack & Distributed Systems',
    projectDescription: '',
    projectDeliverables: 'Production-ready code implementation, unit tests, and repository link.',
    starterCode: PROGRAMMING_LANGUAGES[0].starter,
    durationMinutes: 45,
    passingScore: 70,
    deadline: '',
    instructions: 'Complete the core programming challenge and architecture questions. Code execution executes in a secure sandbox.',
    codingQuestion: {
      title: 'Core Algorithm & System Worker Implementation',
      problemText: 'Implement the high-performance worker processing function for the project requirements. Handle edge cases cleanly and ensure optimal runtime complexity.',
      constraints: '1 <= N <= 10^5, Memory limit: 256MB, Time limit: 2000ms',
      testCases: [
        { input: 'ping_worker_health', expectedOutput: 'true', isHidden: false },
        { input: 'batch_size_5000', expectedOutput: 'true', isHidden: true }
      ]
    },
    mcqs: [
      {
        questionText: 'Which distributed communication model best minimizes coupling between the project services?',
        options: [
          'Asynchronous Event-Driven Messaging (e.g. Kafka / RabbitMQ)',
          'Synchronous Blocking HTTP RPC with tight loop polling',
          'Shared raw file system polling without locking',
          'Monolithic in-memory singleton state'
        ],
        correctAnswer: '0'
      }
    ]
  });

  // Fetch Candidates & Posted Assessments
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    try {
      const [candRes, asmtRes] = await Promise.all([
        fetch(`${apiBase}/company/candidates`, { headers, credentials: 'include' }).catch(() => null),
        fetch(`${apiBase}/company/learning-assessments`, { headers, credentials: 'include' }).catch(() => null)
      ]);

      if (candRes && candRes.ok) {
        const json = await candRes.json();
        if (Array.isArray(json.data)) setCandidates(json.data);
      }

      if (asmtRes && asmtRes.ok) {
        const json = await asmtRes.json();
        if (Array.isArray(json.data)) setPostedAssessments(json.data);
      }
    } catch (err) {
      console.warn('[CompanyLearningAssessments] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Unique institutions & skills for filtering
  const uniqueColleges = useMemo(() => {
    const set = new Set();
    candidates.forEach(c => {
      const col = c.college || c.institutionName || c.institution_name;
      if (col) set.add(col);
    });
    return Array.from(set);
  }, [candidates]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const nameMatch = (c.name || c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.rollNumber || c.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.department || '').toLowerCase().includes(searchQuery.toLowerCase());

      const college = c.college || c.institutionName || c.institution_name || '';
      const collegeMatch = selectedCollegeFilter === 'ALL' || college === selectedCollegeFilter;

      return nameMatch && collegeMatch;
    });
  }, [candidates, searchQuery, selectedCollegeFilter]);

  // Selected Student Objects
  const selectedStudents = useMemo(() => {
    return candidates.filter(c => selectedStudentIds.has(c.studentId || c.id));
  }, [candidates, selectedStudentIds]);

  // Distinct institutions among selected students
  const affectedInstitutions = useMemo(() => {
    const map = new Map();
    selectedStudents.forEach(s => {
      const name = s.college || s.institutionName || s.institution_name || 'Accredited Campus';
      const id = s.institutionId || s.collegeId || name;
      map.set(id, name);
    });
    return Array.from(map.values());
  }, [selectedStudents]);

  // Toggle selection
  const handleToggleSelectStudent = (id) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedStudentIds.size === filteredCandidates.length && filteredCandidates.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredCandidates.map(c => c.studentId || c.id)));
    }
  };

  // Open Create Modal for specific student
  const handleOpenCreateForSingle = (student) => {
    const id = student.studentId || student.id;
    setSelectedStudentIds(new Set([id]));
    setFormData(prev => ({
      ...prev,
      title: `Competency Assessment: ${student.name || 'Candidate'}`,
      projectTitle: 'Real-Time Distributed Telemetry Pipeline'
    }));
    setModalStep(1);
    setShowCreateModal(true);
  };

  // Language Change helper
  const handleLanguageChange = (langId) => {
    const found = PROGRAMMING_LANGUAGES.find(l => l.id === langId);
    setFormData(prev => ({
      ...prev,
      programmingLanguage: langId,
      starterCode: found ? found.starter : prev.starterCode
    }));
  };

  // Add/Remove Test Cases
  const handleAddTestCase = () => {
    setFormData(prev => ({
      ...prev,
      codingQuestion: {
        ...prev.codingQuestion,
        testCases: [
          ...prev.codingQuestion.testCases,
          { input: `sample_input_${prev.codingQuestion.testCases.length + 1}`, expectedOutput: 'true', isHidden: false }
        ]
      }
    }));
  };

  const handleRemoveTestCase = (index) => {
    setFormData(prev => ({
      ...prev,
      codingQuestion: {
        ...prev.codingQuestion,
        testCases: prev.codingQuestion.testCases.filter((_, i) => i !== index)
      }
    }));
  };

  // Submit and Post Assessment
  const handlePublishAssessment = async (e) => {
    if (e) e.preventDefault();

    if (!formData.title.trim()) {
      if (onShowToast) onShowToast({ title: 'Title Required', message: 'Please provide an assessment title.', type: 'warning' });
      return;
    }

    if (!formData.projectTitle.trim()) {
      if (onShowToast) onShowToast({ title: 'Project Required', message: 'Please specify the related project title.', type: 'warning' });
      return;
    }

    if (selectedStudents.length === 0) {
      if (onShowToast) onShowToast({ title: 'Students Required', message: 'Select at least one candidate for this assessment.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const payload = {
        title: formData.title.trim(),
        programmingLanguage: formData.programmingLanguage,
        projectTitle: formData.projectTitle.trim(),
        projectDomain: formData.projectDomain,
        projectDescription: formData.projectDescription,
        projectDeliverables: formData.projectDeliverables,
        starterCode: formData.starterCode,
        durationMinutes: Number(formData.durationMinutes) || 45,
        passingScore: Number(formData.passingScore) || 70,
        deadline: formData.deadline || null,
        instructions: formData.instructions,
        selectedStudents: selectedStudents.map(s => ({
          id: s.studentId || s.id,
          name: s.name || s.full_name,
          email: s.email,
          institutionId: s.institutionId || s.collegeId,
          institutionName: s.college || s.institutionName,
          department: s.department
        })),
        questions: [
          {
            topic: formData.projectTitle,
            category: 'Programming',
            questionType: 'PROGRAMMING',
            questionText: formData.codingQuestion.problemText,
            programmingLanguage: formData.programmingLanguage,
            starterCode: formData.starterCode,
            constraints: formData.codingQuestion.constraints,
            marks: 50,
            testCases: formData.codingQuestion.testCases
          },
          ...formData.mcqs.map((m, idx) => ({
            topic: 'System Architecture',
            category: 'Architecture',
            questionType: 'MCQ',
            questionText: m.questionText,
            options: m.options,
            correctAnswer: m.correctAnswer,
            marks: 25
          }))
        ]
      };

      const res = await fetch(`${apiBase}/company/learning-assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        // Dispatch notifications across local stores as well for instant reactive UI updates
        selectedStudents.forEach(stu => {
          dispatchAssessmentAssignedNotification({
            assessmentId: json.data?.id || `asmt_${Date.now()}`,
            title: formData.title,
            companyName: companyName,
            programmingLanguage: formData.programmingLanguage,
            projectTitle: formData.projectTitle,
            projectDescription: formData.projectDescription,
            durationMinutes: formData.durationMinutes,
            deadline: formData.deadline || 'Active Cycle',
            studentId: stu.studentId || stu.id,
            studentName: stu.name || stu.full_name,
            institutionId: stu.institutionId || stu.collegeId,
            institutionName: stu.college || stu.institutionName,
            department: stu.department
          });
        });

        if (onShowToast) {
          onShowToast({
            title: 'Assessment Posted & Dispatched! 🚀',
            message: `Assessment test "${formData.title}" posted. Notifications delivered to ${selectedStudents.length} student(s) and their institution(s).`,
            type: 'success'
          });
        }

        setShowCreateModal(false);
        setSelectedStudentIds(new Set());
        setActiveSubTab('POSTED_TESTS');
        await fetchData();
      } else {
        throw new Error(json.message || 'Failed to post assessment');
      }
    } catch (err) {
      console.error('Error posting learning assessment:', err);
      if (onShowToast) {
        onShowToast({
          title: 'Posting Failed',
          message: err.message || 'Could not post assessment test.',
          type: 'error'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-purple" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              INDUSTRY COMPETENCY LEDGER
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-cyan-400 font-mono flex items-center gap-1">
              <Sparkles size={11} /> Proctored Project Evaluations
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Selected Students & Assessment Tests
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Evaluate selected candidates through tailored programming language challenges and practical project tasks. 
            Real-time notifications are instantly transmitted to candidates and their respective colleges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setModalStep(1);
              setShowCreateModal(true);
            }}
            className="company-btn-gradient text-xs flex items-center gap-2"
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)',
              color: '#fff',
              fontWeight: 700,
              boxShadow: '0 0 16px rgba(0, 212, 255, 0.35)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <PlusCircle size={15} />
            <span>+ Post Assessment Test</span>
          </button>
        </div>
      </div>

      {/* ── SUB-TAB SWITCHER ── */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '12px'
      }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('ROSTER')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: activeSubTab === 'ROSTER' ? 'rgba(0, 212, 255, 0.12)' : 'transparent',
            border: activeSubTab === 'ROSTER' ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid transparent',
            color: activeSubTab === 'ROSTER' ? '#00D4FF' : '#94A3B8',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={14} />
          <span>Selected Students Candidate Roster ({candidates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('POSTED_TESTS')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: activeSubTab === 'POSTED_TESTS' ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
            border: activeSubTab === 'POSTED_TESTS' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid transparent',
            color: activeSubTab === 'POSTED_TESTS' ? '#C084FC' : '#94A3B8',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Award size={14} />
          <span>Posted Assessments & Telemetry ({postedAssessments.length})</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VIEW 1: SELECTED STUDENTS ROSTER */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'ROSTER' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter candidate by name, roll no, department..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="company-input w-full text-xs pl-9"
                />
              </div>

              {uniqueColleges.length > 0 && (
                <select
                  value={selectedCollegeFilter}
                  onChange={e => setSelectedCollegeFilter(e.target.value)}
                  className="company-input text-xs max-w-xs"
                >
                  <option value="ALL">All Partner Institutions ({uniqueColleges.length})</option>
                  {uniqueColleges.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="btn-compact-details"
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                {selectedStudentIds.size === filteredCandidates.length && filteredCandidates.length > 0
                  ? 'Deselect All'
                  : `Select All (${filteredCandidates.length})`}
              </button>
            </div>
          </div>

          {/* Floating Batch Action Banner */}
          {selectedStudentIds.size > 0 && (
            <div style={{
              background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
              border: '1px solid rgba(0, 212, 255, 0.4)',
              borderRadius: '10px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.15)'
            }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-sm">
                  {selectedStudentIds.size}
                </div>
                <div>
                  <span className="text-white text-xs font-bold block">
                    {selectedStudentIds.size} Candidates Selected for Assessment
                  </span>
                  <span className="text-[11px] text-cyan-300">
                    Targeting {affectedInstitutions.length} Institution(s): {affectedInstitutions.join(', ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds(new Set())}
                  className="company-btn-secondary text-xs"
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalStep(2);
                    setShowCreateModal(true);
                  }}
                  className="company-btn-gradient text-xs flex items-center gap-1.5"
                  style={{
                    background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  <Send size={13} />
                  <span>Configure & Post Assessment for Selected ({selectedStudentIds.size}) →</span>
                </button>
              </div>
            </div>
          )}

          {/* Students Table */}
          <div className="compact-table-container">
            <div className="compact-table-scroll">
              <table className="compact-table">
                <thead>
                  <tr>
                    <th style={{ width: '4%' }}>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                        onChange={handleSelectAllFiltered}
                      />
                    </th>
                    <th style={{ width: '28%' }}>Candidate & Roll Number</th>
                    <th style={{ width: '24%' }}>College / Institution</th>
                    <th style={{ width: '18%' }}>Department & Semester</th>
                    <th style={{ width: '14%' }}>Verified Skills</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        {loading ? 'Loading candidates...' : 'No matching candidates found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map(candidate => {
                      const id = candidate.studentId || candidate.id;
                      const isSelected = selectedStudentIds.has(id);
                      const name = candidate.name || candidate.full_name || 'Candidate';
                      const rollNo = candidate.rollNumber || candidate.roll_number || id;
                      const college = candidate.college || candidate.institutionName || candidate.institution_name || 'Accredited College';
                      const dept = candidate.department || 'Computer Science';
                      const skills = candidate.skills || candidate.matchedSkills || ['Problem Solving', 'Data Structures'];
                      const readiness = candidate.readinessScore || candidate.overallScore || 85;

                      return (
                        <tr
                          key={id}
                          style={{
                            background: isSelected ? 'rgba(0, 212, 255, 0.04)' : undefined
                          }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectStudent(id)}
                            />
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: isSelected ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.06)',
                                border: isSelected ? '1px solid #00D4FF' : '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isSelected ? '#00D4FF' : '#fff',
                                fontWeight: 700,
                                fontSize: '12px'
                              }}>
                                {name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="compact-cell-title" style={{ color: isSelected ? '#00D4FF' : undefined }}>
                                  {name}
                                </div>
                                <div className="compact-cell-sub font-mono" style={{ fontSize: '10px' }}>
                                  {rollNo}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Building size={12} className="text-cyan-400 flex-shrink-0" />
                              <span style={{ fontSize: '12px', color: '#E2E8F0' }}>{college}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '11.5px', color: '#CBD5E1' }}>{dept}</div>
                            <div style={{ fontSize: '10px', color: '#64748B' }}>Readiness: {readiness}%</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {skills.slice(0, 2).map((sk, sIdx) => {
                                const skName = typeof sk === 'object' ? sk.name : String(sk);
                                return (
                                  <span key={sIdx} className="badge badge-cyan" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                    {skName}
                                  </span>
                                );
                              })}
                              {skills.length > 2 && (
                                <span style={{ fontSize: '9px', color: '#64748B' }}>+{skills.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenCreateForSingle(candidate)}
                              className="btn-compact-details"
                              style={{
                                color: '#00D4FF',
                                borderColor: 'rgba(0, 212, 255, 0.3)'
                              }}
                            >
                              <PlusCircle size={11} />
                              <span>Assign Test →</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VIEW 2: POSTED ASSESSMENTS & TELEMETRY */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'POSTED_TESTS' && (
        <div className="space-y-4">
          {postedAssessments.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <Award size={36} className="text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Learning Assessments Posted Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Select candidates from the candidate roster and click "+ Post Assessment Test" to assign coding challenges and project evaluations.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('ROSTER');
                  setShowCreateModal(true);
                }}
                className="company-btn-gradient text-xs inline-flex items-center gap-2 mt-2"
                style={{
                  background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                <PlusCircle size={13} />
                <span>Select Students & Create First Test</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {postedAssessments.map(asmt => {
                const lang = asmt.programmingLanguage || 'JavaScript';
                const projTitle = asmt.projectTitle || 'Capstone Project';
                const projDomain = asmt.projectDomain || 'Software Engineering';
                const totalAssigned = asmt.totalAssigned || (asmt.assignedStudents || []).length || 0;
                const totalSubmitted = asmt.totalSubmitted || 0;
                const avgScore = asmt.averageScore;

                return (
                  <div
                    key={asmt.id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                      background: 'linear-gradient(90deg, #00D4FF, #A855F7)'
                    }} />

                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold">
                            {lang}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">
                            {asmt.trackCode}
                          </span>
                        </div>
                        <span className="badge badge-emerald" style={{ fontSize: '9.5px' }}>
                          PUBLISHED & LIVE
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-white leading-snug">
                        {asmt.title}
                      </h3>

                      {/* Related Project Banner */}
                      <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                          <FolderGit2 size={12} className="text-cyan-400" />
                          <span>Related Project:</span>
                        </div>
                        <div className="text-xs font-bold text-cyan-300">
                          {projTitle}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {asmt.projectDescription || asmt.description || 'Comprehensive evaluation covering code design, scalability, and test compliance.'}
                        </p>
                      </div>

                      {/* Telemetry Stats */}
                      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                        <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">Assigned</span>
                          <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                            {totalAssigned} Students
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">Completed</span>
                          <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                            {totalSubmitted} / {totalAssigned}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">Time Limit</span>
                          <span className="text-sm font-bold text-cyan-400 font-mono mt-0.5 block">
                            {asmt.durationMinutes} min
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-2">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock size={12} />
                        <span>Deadline: {asmt.deadline ? new Date(asmt.deadline).toLocaleDateString() : 'Continuous'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedAssessmentDetail(asmt)}
                        className="btn-compact-details text-xs flex items-center gap-1.5"
                        style={{
                          background: 'rgba(0, 212, 255, 0.1)',
                          borderColor: 'rgba(0, 212, 255, 0.3)',
                          color: '#00D4FF',
                          padding: '6px 12px'
                        }}
                      >
                        <Eye size={12} />
                        <span>View Submissions & Details →</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODAL: POST ASSESSMENT TEST FOR SELECTED STUDENTS */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="company-modal-overlay" onClick={() => !isSubmitting && setShowCreateModal(false)}>
          <div
            className="company-modal-content max-w-3xl w-full"
            style={{ maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-snug">
                    Post Assessment Test for Selected Students
                  </h2>
                  <p className="text-xs text-slate-400">
                    Define programming challenge, related project specs, and broadcast notifications to students and institutions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Wizard Indicator */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[
                { step: 1, label: '1. Candidates' },
                { step: 2, label: '2. Project & Tech' },
                { step: 3, label: '3. Coding Test' },
                { step: 4, label: '4. Broadcast' }
              ].map(st => (
                <button
                  key={st.step}
                  type="button"
                  onClick={() => setModalStep(st.step)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                    modalStep === st.step
                      ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300 shadow-sm'
                      : modalStep > st.step
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-white/[0.02] border border-white/5 text-slate-500'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <form onSubmit={handlePublishAssessment} className="space-y-4 text-xs">
              {/* ── STEP 1: SELECTED STUDENTS ── */}
              {modalStep === 1 && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2.5">
                    <Bell size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-cyan-300">Target Selected Candidates ({selectedStudents.length})</strong>
                      The assessment test will be assigned to these specific candidates. Their institutions will also be notified automatically.
                    </div>
                  </div>

                  {selectedStudents.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                      <p className="text-slate-400 text-xs">No students currently selected.</p>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentIds(new Set(candidates.slice(0, 3).map(c => c.studentId || c.id)))}
                        className="btn-compact-details text-xs"
                      >
                        + Auto-select Top 3 Candidates
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedStudents.map(stu => (
                        <div
                          key={stu.studentId || stu.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/10"
                        >
                          <div className="flex items-center gap-2.5">
                            <UserCheck size={14} className="text-cyan-400" />
                            <div>
                              <span className="font-bold text-white">{stu.name || stu.full_name}</span>
                              <span className="text-[10px] text-slate-400 block">
                                {stu.college || stu.institutionName} • {stu.department}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleSelectStudent(stu.studentId || stu.id)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {affectedInstitutions.length > 0 && (
                    <div className="p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/20 text-[11px] text-purple-300">
                      <strong>Partner Institutions Receiving Notice:</strong> {affectedInstitutions.join(', ')}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setModalStep(2)}
                      className="company-btn-gradient text-xs flex items-center gap-1.5"
                      style={{
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        border: 'none'
                      }}
                    >
                      <span>Next: Programming Language & Project →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: PROGRAMMING LANGUAGE & RELATED PROJECT ── */}
              {modalStep === 2 && (
                <div className="space-y-4">
                  {/* Assessment Title */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Assessment Test Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Distributed Microservices & High-Throughput Node.js Assessment"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="company-input w-full"
                    />
                  </div>

                  {/* Programming Language Selection */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
                      <Code size={13} className="text-cyan-400" />
                      <span>Target Programming Language</span> <span className="text-rose-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PROGRAMMING_LANGUAGES.map(lang => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => handleLanguageChange(lang.id)}
                          className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                            formData.programmingLanguage === lang.id
                              ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                              : 'bg-black/20 border-white/5 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          <span className="text-base">{lang.icon}</span>
                          <span className="font-bold text-xs">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Related Project Section */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold">
                      <FolderGit2 size={15} />
                      <span>Related Project Specifications</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Project Title / Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. High-Concurrency E-Commerce Order Processor"
                          value={formData.projectTitle}
                          onChange={e => setFormData({ ...formData, projectTitle: e.target.value })}
                          className="company-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Project Domain / Tech Stack</label>
                        <input
                          type="text"
                          placeholder="e.g. Node.js, Express, Docker, PostgreSQL"
                          value={formData.projectDomain}
                          onChange={e => setFormData({ ...formData, projectDomain: e.target.value })}
                          className="company-input w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Project Scope & Problem Statement</label>
                      <textarea
                        rows={3}
                        placeholder="Detail the industrial problem statement, operational requirements, and expectations..."
                        value={formData.projectDescription}
                        onChange={e => setFormData({ ...formData, projectDescription: e.target.value })}
                        className="company-input w-full resize-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Project Deliverables Required from Candidate</label>
                      <input
                        type="text"
                        placeholder="e.g. Working code solution, unit test pass, and GitHub repository URL"
                        value={formData.projectDeliverables}
                        onChange={e => setFormData({ ...formData, projectDeliverables: e.target.value })}
                        className="company-input w-full text-xs"
                      />
                    </div>
                  </div>

                  {/* Nav */}
                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="company-btn-secondary text-xs"
                    >
                      ← Back to Candidates
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalStep(3)}
                      className="company-btn-gradient text-xs flex items-center gap-1.5"
                      style={{
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        border: 'none'
                      }}
                    >
                      <span>Next: Test Coding Problem →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: CODING CHALLENGE & TEST SETTINGS ── */}
              {modalStep === 3 && (
                <div className="space-y-4">
                  {/* Duration, Passing Score, Deadline */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Time Limit (Minutes)</label>
                      <input
                        type="number"
                        min="15"
                        max="180"
                        value={formData.durationMinutes}
                        onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })}
                        className="company-input w-full font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Passing Score (%)</label>
                      <input
                        type="number"
                        min="40"
                        max="100"
                        value={formData.passingScore}
                        onChange={e => setFormData({ ...formData, passingScore: e.target.value })}
                        className="company-input w-full font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Submission Deadline</label>
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                        className="company-input w-full font-mono"
                      />
                    </div>
                  </div>

                  {/* Coding Problem Code Editor */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold">
                        <Terminal size={14} />
                        <span>Starter Code Template ({formData.programmingLanguage})</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Automated Sandbox Solution</span>
                    </div>

                    <textarea
                      rows={6}
                      value={formData.starterCode}
                      onChange={e => setFormData({ ...formData, starterCode: e.target.value })}
                      className="company-input w-full font-mono text-cyan-300 text-xs"
                      style={{ background: '#070F1E' }}
                    />

                    {/* Test Cases */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-white text-xs">Public & Verification Test Cases</span>
                        <button
                          type="button"
                          onClick={handleAddTestCase}
                          className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Plus size={11} /> Add Test Case
                        </button>
                      </div>

                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {formData.codingQuestion.testCases.map((tc, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-white/5">
                            <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                            <input
                              type="text"
                              placeholder="Input parameter..."
                              value={tc.input}
                              onChange={e => {
                                const nextCases = [...formData.codingQuestion.testCases];
                                nextCases[idx].input = e.target.value;
                                setFormData({
                                  ...formData,
                                  codingQuestion: { ...formData.codingQuestion, testCases: nextCases }
                                });
                              }}
                              className="company-input flex-1 py-1 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Expected output..."
                              value={tc.expectedOutput}
                              onChange={e => {
                                const nextCases = [...formData.codingQuestion.testCases];
                                nextCases[idx].expectedOutput = e.target.value;
                                setFormData({
                                  ...formData,
                                  codingQuestion: { ...formData.codingQuestion, testCases: nextCases }
                                });
                              }}
                              className="company-input flex-1 py-1 text-xs text-emerald-400 font-mono"
                            />
                            {formData.codingQuestion.testCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTestCase(idx)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Nav */}
                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setModalStep(2)}
                      className="company-btn-secondary text-xs"
                    >
                      ← Back to Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalStep(4)}
                      className="company-btn-gradient text-xs flex items-center gap-1.5"
                      style={{
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        border: 'none'
                      }}
                    >
                      <span>Review & Broadcast Notifications →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: REVIEW & BROADCAST NOTIFICATIONS ── */}
              {modalStep === 4 && (
                <div className="space-y-4">
                  {/* Summary Card */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-sm">{formData.title}</span>
                      <span className="badge badge-purple font-mono text-[10px]">{formData.programmingLanguage}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">Candidates</span>
                        <span className="font-bold text-white mt-0.5 block">{selectedStudents.length} Students</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">Colleges</span>
                        <span className="font-bold text-cyan-300 mt-0.5 block">{affectedInstitutions.length} Campuses</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">Duration</span>
                        <span className="font-bold text-white mt-0.5 block">{formData.durationMinutes} Mins</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">Passing</span>
                        <span className="font-bold text-emerald-400 mt-0.5 block">{formData.passingScore}%</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-slate-300">
                      <strong className="text-cyan-400 block mb-0.5">Project Scope:</strong>
                      {formData.projectTitle} • {formData.projectDomain}
                    </div>
                  </div>

                  {/* Broadcast Preview Banner */}
                  <div className="p-3.5 rounded-xl bg-cyan-500/[0.08] border border-cyan-500/25 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                      <Bell size={14} />
                      <span>Multi-Role Notification Transmission Engine</span>
                    </div>

                    <div className="space-y-1.5 text-[11.5px] text-slate-300">
                      <div className="flex items-start gap-2">
                        <span className="badge badge-cyan" style={{ fontSize: '9px' }}>STUDENTS</span>
                        <span>
                          Direct notification dispatched to each student inbox with 1-click action: 
                          <strong className="text-white"> "Attend Assessment Test Now"</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="badge badge-emerald" style={{ fontSize: '9px' }}>INSTITUTION</span>
                        <span>
                          Notice dispatched to each respective college placement portal:
                          <strong className="text-white"> "{companyName} posted assessment in {formData.programmingLanguage} for student"</strong>.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit / Cancel Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setModalStep(3)}
                      className="company-btn-secondary text-xs"
                    >
                      ← Back to Test Specs
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="company-btn-gradient text-xs flex items-center gap-2"
                      style={{
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        padding: '10px 22px',
                        boxShadow: '0 0 16px rgba(0, 212, 255, 0.4)',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        border: 'none',
                        opacity: isSubmitting ? 0.7 : 1
                      }}
                    >
                      <Send size={13} />
                      <span>{isSubmitting ? 'Transmitting & Broadcasting...' : 'Post Assessment & Broadcast Notifications 🚀'}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* DRAWER / MODAL: VIEW ASSESSMENT DETAILS & SUBMISSIONS */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {selectedAssessmentDetail && (
        <div className="company-modal-overlay" onClick={() => setSelectedAssessmentDetail(null)}>
          <div
            className="company-modal-content max-w-2xl w-full"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{selectedAssessmentDetail.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="badge badge-purple" style={{ fontSize: '9px' }}>
                      {selectedAssessmentDetail.programmingLanguage}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedAssessmentDetail.trackCode}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssessmentDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Project Scope Banner */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                <span className="text-[10px] text-cyan-400 uppercase font-mono block">Related Industrial Project</span>
                <span className="text-sm font-bold text-white block">{selectedAssessmentDetail.projectTitle}</span>
                <p className="text-slate-400 leading-relaxed text-xs">
                  {selectedAssessmentDetail.projectDescription || selectedAssessmentDetail.description}
                </p>
                <div className="text-[11px] text-slate-300 pt-1 border-t border-white/5">
                  <strong>Deliverables:</strong> {selectedAssessmentDetail.projectDeliverables || 'Comprehensive code implementation and verified unit test execution.'}
                </div>
              </div>

              {/* Assigned Candidates List */}
              <div>
                <h4 className="font-semibold text-white mb-2 flex items-center justify-between">
                  <span>Assigned Candidates & Submission Telemetry</span>
                  <span className="text-xs text-slate-400">
                    {(selectedAssessmentDetail.assignedStudents || []).length} Candidates
                  </span>
                </h4>

                <div className="space-y-2">
                  {(selectedAssessmentDetail.assignedStudents || []).length === 0 ? (
                    <div className="p-4 text-center rounded-lg bg-black/20 text-slate-400 text-xs">
                      No candidates assigned to this assessment record.
                    </div>
                  ) : (
                    (selectedAssessmentDetail.assignedStudents || []).map((stu, idx) => {
                      const isDone = stu.status === 'COMPLETED' || stu.status === 'SUBMITTED';
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-white text-xs block">{stu.student_name}</span>
                            <span className="text-[10px] text-slate-400 block">
                              {stu.institution_name || 'Partner College'} • {stu.department}
                            </span>
                          </div>

                          <div className="text-right flex items-center gap-3">
                            <div>
                              <span className={`badge ${isDone ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '9.5px' }}>
                                {isDone ? 'SUBMITTED & EVALUATED' : 'TEST PENDING'}
                              </span>
                              {stu.score !== null && (
                                <span className="text-xs font-mono font-bold text-cyan-300 block mt-0.5">
                                  Score: {stu.score}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10 mt-5">
              <button
                type="button"
                onClick={() => setSelectedAssessmentDetail(null)}
                className="company-btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
