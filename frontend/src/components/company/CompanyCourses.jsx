import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Users,
  Clock,
  Award,
  CheckCircle2,
  ChevronRight,
  X,
  Sparkles,
  Code,
  Check,
  Eye,
  PlusCircle,
  Building,
  Layers,
  Plus,
  Trash2,
  Bell,
  Send,
  RefreshCw
} from 'lucide-react';
import '../common/CompactDataList.css';

export default function CompanyCourses({ onTabSelect, onShowToast, user }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveCourses, setLiveCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Collaboration Institutions state for dropdown
  const [partnerInstitutions, setPartnerInstitutions] = useState([]);

  // Course Creation Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate random course code
  const generateCourseCode = useCallback(() => {
    const prefixes = ['CRS-CLOUD', 'CRS-AI', 'CRS-DEV', 'CRS-CYBER', 'CRS-SYS'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${randomPrefix}-${randomNum}`;
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    code: generateCourseCode(),
    category: 'Cloud Computing',
    level: 'Intermediate',
    durationWeeks: 8,
    hours: 36,
    instructor: user?.companyName ? `${user.companyName} Fellow Lead` : 'Enterprise Technology Fellow',
    institutionId: '',
    skillsInput: 'Kubernetes, Go, Microservices, Docker, CI/CD',
    description: 'Enterprise curriculum track focused on high-concurrency microservices, sovereign cloud deployment, and production resilience.',
    modules: [
      { title: 'Core Foundations & Distributed Architecture', duration: '4 Hours' },
      { title: 'Containerization & Microservices Design', duration: '6 Hours' },
      { title: 'Orchestration, CI/CD & Cloud Deployment', duration: '8 Hours' },
      { title: 'Production Capstone & Proctored Submission', duration: '6 Hours' }
    ]
  });

  const apiBase = useMemo(() => {
    return (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const res = await fetch(`${apiBase}/company/courses-catalog`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setLiveCourses(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load company courses:', err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Load courses and partner colleges on mount
  useEffect(() => {
    fetchCourses();

    async function fetchPartners() {
      try {
        const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
        const res = await fetch(`${apiBase}/company/partnerships`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          credentials: 'include'
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            setPartnerInstitutions(json.data);
            return;
          }
        }

        // Fallback to all accredited institutions
        const instRes = await fetch(`${apiBase}/nexus/institutions`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (instRes.ok) {
          const instJson = await instRes.json();
          if (Array.isArray(instJson.data)) {
            setPartnerInstitutions(instJson.data);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch partner institutions:', err);
      }
    }
    fetchPartners();
  }, [fetchCourses, apiBase]);

  // Handle module updates
  const handleAddModule = () => {
    setFormData(prev => ({
      ...prev,
      modules: [
        ...prev.modules,
        { title: `Module ${prev.modules.length + 1}: Practical Application`, duration: '4 Hours' }
      ]
    }));
  };

  const handleRemoveModule = (index) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index)
    }));
  };

  const handleModuleChange = (index, field, value) => {
    setFormData(prev => {
      const nextModules = [...prev.modules];
      nextModules[index] = { ...nextModules[index], [field]: value };
      return { ...prev, modules: nextModules };
    });
  };

  // Submit new course
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      if (onShowToast) onShowToast({ type: 'warning', title: 'Title Required', message: 'Please provide a course title.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const skillsArray = formData.skillsInput
        ? formData.skillsInput.split(',').map(s => s.trim()).filter(Boolean)
        : ['Applied Engineering'];

      const payload = {
        title: formData.title.trim(),
        code: formData.code.trim(),
        category: formData.category,
        level: formData.level,
        difficulty: formData.level,
        durationWeeks: Number(formData.durationWeeks) || 8,
        hours: Number(formData.hours) || 36,
        instructor: formData.instructor.trim() || 'Enterprise Faculty',
        institutionId: formData.institutionId || null,
        skillsTaught: skillsArray,
        skillsDeveloped: skillsArray,
        description: formData.description,
        modules: formData.modules.map((m, idx) => ({
          moduleNumber: idx + 1,
          title: m.title,
          duration: m.duration || '3 Hours',
          description: `Comprehensive module covering ${m.title}`,
          lessons: [m.title, 'Hands-on laboratory exercises', 'Assessment quiz']
        }))
      };

      const res = await fetch(`${apiBase}/company/courses`, {
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
        if (onShowToast) {
          onShowToast({
            type: 'success',
            title: 'Course Published & Broadcasted',
            message: 'Course saved! Real-time notifications dispatched to the collaboration institution and enrolled students.'
          });
        }
        setShowAddModal(false);
        // Reset form code for next time
        setFormData(prev => ({
          ...prev,
          title: '',
          code: generateCourseCode(),
          description: ''
        }));
        // Refetch courses immediately
        await fetchCourses();
      } else {
        throw new Error(json.message || 'Failed to create course');
      }
    } catch (err) {
      console.error('Error creating course:', err);
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Publish Failed',
          message: err.message || 'Failed to post sponsored course.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamically load courses from live API
  const courses = useMemo(() => {
    return liveCourses || [];
  }, [liveCourses]);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.toLowerCase();
    return courses.filter(c =>
      (c.courseName || c.title || '').toLowerCase().includes(q) ||
      (c.courseCode || c.code || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q) ||
      (c.institutionName || '').toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Curriculum & Course Telemetry</h1>
          <p className="text-sm text-slate-400 mt-1">
            Attested university curriculum and competency learning tracks evaluated by SKILLNEXUS AI.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search verified courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="company-input w-full text-xs"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="company-btn-gradient text-xs flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)',
              color: '#fff',
              fontWeight: 600,
              padding: '8px 16px',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.35)',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            <PlusCircle size={15} />
            <span>+ Add New Course</span>
          </button>
        </div>
      </div>

      {/* ── SELECTED STUDENTS ASSESSMENT ACTION BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '12px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(0, 212, 255, 0.15)',
            border: '1px solid rgba(0, 212, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00D4FF',
            flexShrink: 0
          }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#fff' }}>
                Selected Students & Project Assessment Tests
              </span>
              <span className="badge badge-purple" style={{ fontSize: '9.5px' }}>
                NEW WORKSPACE
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: '2px 0 0' }}>
              Pick selected students from your candidate roster and post programming challenges & capstone project evaluations with automated multi-role notifications.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onTabSelect && onTabSelect('learning-assessments')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '12px',
            padding: '8px 16px',
            boxShadow: '0 0 14px rgba(0, 212, 255, 0.3)',
            cursor: 'pointer',
            border: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <span>Manage Selected Students & Assessments</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* ── COMPACT COURSES TABLE ── */}
      <div className="compact-table-container" style={{ marginBottom: '28px' }}>
        <div className="compact-table-scroll">
          <table className="compact-table">
            <thead>
              <tr>
                <th style={{ width: '32%' }}>Course Curriculum</th>
                <th style={{ width: '13%' }}>Category</th>
                <th style={{ width: '10%' }}>Duration</th>
                <th style={{ width: '11%' }}>Enrolled</th>
                <th style={{ width: '11%' }}>Completion</th>
                <th style={{ width: '13%' }}>Skills Developed</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading courses...' : courses.length === 0 ? 'No courses published yet. Click "+ Add New Course" to sponsor one.' : 'No courses matched your search filter.'}
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => {
                  const id = course.courseId || course.id;
                  const title = course.courseName || course.title;
                  const code = course.courseCode || course.code;
                  const duration = course.duration || (course.durationWeeks ? `${course.durationWeeks} Weeks` : 'Self-Paced');
                  const enrolled = course.enrolledCount || course.enrolled || 0;
                  const completion = course.completionRate || 'N/A';
                  const skills = course.skillsDeveloped || course.skills || [];
                  const instructor = course.instructor || 'Campus Faculty Lead';
                  const instName = course.institutionName;

                  return (
                    <tr
                      key={id}
                      onClick={() => setSelectedCourse(course)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: 'rgba(168,85,247,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(168,85,247,0.25)',
                            color: 'var(--cyber-purple)',
                            flexShrink: 0
                          }}>
                            <BookOpen size={16} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span className="compact-cell-title">{title}</span>
                              <span className="badge badge-purple" style={{ fontSize: '9px', padding: '1px 5px', fontFamily: 'monospace' }}>
                                {code}
                              </span>
                              {instName && (
                                <span className="badge badge-cyan" style={{ fontSize: '9px', padding: '1px 5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <Building size={9} />
                                  <span>{instName}</span>
                                </span>
                              )}
                            </div>
                            <div className="compact-cell-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={11} color="var(--cyber-emerald)" />
                              <span>{instructor}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-cyan" style={{ fontSize: '10px' }}>
                          {course.category || 'General CS'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          <Clock size={12} color="var(--text-muted)" /> {duration}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {enrolled.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>students</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-emerald)' }}>
                          {completion}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {skills.slice(0, 2).map((sk) => (
                            <span key={sk} className="badge badge-cyan" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                              {sk}
                            </span>
                          ))}
                          {skills.length > 2 && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              +{skills.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCourse(course);
                          }}
                          className="btn-compact-details"
                        >
                          <Eye size={12} />
                          <span>Details →</span>
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

      {/* ── SPONSOR & ADD NEW COURSE MODAL ── */}
      {showAddModal && (
        <div className="company-modal-overlay" onClick={() => !isSubmitting && setShowAddModal(false)}>
          <div
            className="company-modal-content max-w-2xl w-full"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-snug">
                    Sponsor & Publish Curriculum Track
                  </h2>
                  <p className="text-xs text-slate-400">
                    Deploy accredited course tracks directly to your partner institution and enrolled students.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Broadcast Banner */}
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <Bell size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <strong className="text-cyan-300 block mb-0.5">Automated Collaboration Broadcast</strong>
                Publishing will instantly notify the respected collaboration institution's academic portal and all its enrolled students, integrating this course directly into their learning telemetry.
              </div>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              {/* Row 1: Title & Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">
                    Course Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Cloud Microservices & Kubernetes"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="company-input w-full"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-medium">Course Code</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, code: generateCourseCode() })}
                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={10} /> Auto
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="company-input w-full font-mono text-cyan-300"
                  />
                </div>
              </div>

              {/* Row 2: Target Collaboration Institution */}
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                  <Building size={13} className="text-purple-400" />
                  <span>Respected Collaboration Institution</span>
                  <span className="text-slate-500 font-normal">(Select target college)</span>
                </label>
                <select
                  value={formData.institutionId}
                  onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                  className="company-input w-full"
                >
                  <option value="">All Collaboration Institutions (Ecosystem-wide)</option>
                  {partnerInstitutions.map((inst) => {
                    const id = inst.institutionId || inst.institution_id || inst.id;
                    const name = inst.institutionName || inst.institution_name || inst.name || 'Accredited Institution';
                    const code = inst.institutionCode || inst.code || '';
                    return (
                      <option key={id} value={id}>
                        {name} {code ? `(${code})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Row 3: Category, Level, Duration & Hours */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="company-input w-full"
                  >
                    <option value="Cloud Computing">Cloud Computing</option>
                    <option value="Artificial Intelligence">Artificial Intelligence & ML</option>
                    <option value="Full Stack Development">Full Stack Development</option>
                    <option value="Cybersecurity">Cybersecurity & Networks</option>
                    <option value="DevOps & SRE">DevOps & Site Reliability</option>
                    <option value="Data Engineering">Data Engineering & Analytics</option>
                    <option value="Systems Architecture">Systems Architecture</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Difficulty Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="company-input w-full"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Duration (Weeks)</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={formData.durationWeeks}
                    onChange={(e) => setFormData({ ...formData, durationWeeks: e.target.value })}
                    className="company-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Total Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    className="company-input w-full font-mono"
                  />
                </div>
              </div>

              {/* Row 4: Instructor & Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Instructor / Evaluator Lead</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. R. Narayanan / Industry Fellow"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    className="company-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Skills Developed (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Kubernetes, Go, Docker, Microservices"
                    value={formData.skillsInput}
                    onChange={(e) => setFormData({ ...formData, skillsInput: e.target.value })}
                    className="company-input w-full"
                  />
                </div>
              </div>

              {/* Row 5: Course Overview */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Curriculum Overview / Objectives</label>
                <textarea
                  rows={2}
                  placeholder="Provide brief learning outcomes and industrial relevance..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="company-input w-full resize-none text-xs"
                />
              </div>

              {/* Row 6: Interactive Curriculum Modules Builder */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-purple-400" />
                    <span className="font-semibold text-white">Curriculum Modules ({formData.modules.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                  >
                    <Plus size={12} /> Add Module
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formData.modules.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-white/5"
                    >
                      <span className="font-mono text-slate-400 text-[11px] w-6 flex-shrink-0">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Module title..."
                        value={m.title}
                        onChange={(e) => handleModuleChange(idx, 'title', e.target.value)}
                        className="company-input flex-1 py-1 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Duration"
                        value={m.duration}
                        onChange={(e) => handleModuleChange(idx, 'duration', e.target.value)}
                        className="company-input w-24 py-1 text-xs text-center"
                      />
                      {formData.modules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveModule(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowAddModal(false)}
                  className="company-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="company-btn-gradient text-xs flex items-center gap-2"
                  style={{
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    padding: '9px 20px',
                    boxShadow: '0 0 15px rgba(168, 85, 247, 0.35)',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    border: 'none',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  <Send size={13} />
                  <span>{isSubmitting ? 'Broadcasting Course...' : 'Publish & Notify Collaborators'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED COURSE DETAILS MODAL */}
      {selectedCourse && (
        <div className="company-modal-overlay" onClick={() => setSelectedCourse(null)}>
          <div className="company-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-snug">
                    {selectedCourse.courseName || selectedCourse.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-cyan-300 font-mono">
                      {selectedCourse.courseCode || selectedCourse.code} • Sovereign Verified Course Track
                    </span>
                    {selectedCourse.institutionName && (
                      <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                        {selectedCourse.institutionName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-300 text-sm leading-relaxed">
                {selectedCourse.description || 'Comprehensive curriculum providing practical technical skills, project-backed evidence, and industrial readiness.'}
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Duration</span>
                  <span className="text-base font-bold text-white font-mono mt-0.5 block">
                    {selectedCourse.duration || `${selectedCourse.durationWeeks || 6} Weeks`}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Enrolled Students</span>
                  <span className="text-base font-bold text-cyan-400 font-mono mt-0.5 block">
                    {(selectedCourse.enrolledCount || selectedCourse.enrolled || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Completion Rate</span>
                  <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">
                    {selectedCourse.completionRate || 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Attested Competencies & Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedCourse.skillsDeveloped || selectedCourse.skills || []).length === 0 ? (
                    <span className="text-slate-400 text-xs">General competencies covered.</span>
                  ) : (
                    (selectedCourse.skillsDeveloped || selectedCourse.skills).map(sk => (
                      <span key={sk} className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-cyan-300 font-mono text-[11px]">
                        {sk}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {selectedCourse.institutionName && (
                <div className="p-3 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-cyan-400 uppercase font-mono block">Target Collaboration Institution</span>
                    <span className="text-sm font-semibold text-white block mt-0.5">{selectedCourse.institutionName}</span>
                  </div>
                  <Building className="w-5 h-5 text-cyan-400" />
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-purple-500/[0.04] border border-purple-500/20">
                <span className="text-xs font-bold text-purple-300 block mb-1">Instructor / Evaluator</span>
                <p className="text-slate-300 text-[11px]">
                  {selectedCourse.instructor || 'Campus Faculty Lead'}
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  All module completions require proctored unit test submissions and verified code reviews.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-5">
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="company-btn-secondary text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCourse(null);
                  onTabSelect('students');
                }}
                className="company-btn-gradient text-xs"
              >
                <span>Find Completers in Talent Search</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
