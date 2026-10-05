import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Clock,
  Award,
  Users,
  Code,
  FileText,
  Sliders,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Building,
  GraduationCap,
  Briefcase,
  Layers,
  Save,
  Send,
  Eye,
  Shuffle
} from 'lucide-react';
import industryAssessmentService from '../../services/industryAssessmentService';
import QuestionBankDrawer from './QuestionBankDrawer';

export default function CompanyAssessmentBuilder({ isOpen, onClose, onCreated, onShowToast }) {
  // Wizard step 1 - 6
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Metadata from backend (opportunities, colleges, depts, candidates)
  const [targetMetadata, setTargetMetadata] = useState({
    opportunities: [],
    colleges: [],
    departments: [],
    students: [],
    applicants: [],
    shortlisted: []
  });
  const [loadingTargets, setLoadingTargets] = useState(false);

  // Question Bank Drawer
  const [showQuestionBankDrawer, setShowQuestionBankDrawer] = useState(false);

  // ── Step 1: Assessment Information ──
  const [info, setInfo] = useState({
    title: '',
    opportunityId: '',
    category: 'Full Stack Development',
    difficulty: 'Medium',
    description: '',
    instructions: 'Please answer all questions independently. Programming questions will execute in a secure automated sandbox.'
  });

  // ── Step 2: Skills & Categories ──
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState(['JavaScript', 'React', 'Problem Solving']);
  const [skillWeights, setSkillWeights] = useState({
    JavaScript: 40,
    React: 30,
    'Problem Solving': 30
  });

  // ── Step 3: Questions ──
  const [questions, setQuestions] = useState([]);
  const [showNewQForm, setShowNewQForm] = useState(false);
  const [newQ, setNewQ] = useState({
    type: 'MCQ', // 'MCQ' | 'MULTIPLE_ANSWER' | 'NUMERICAL' | 'PROGRAMMING' | 'LOGICAL_REASONING' | 'APTITUDE'
    title: '',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '0',
    multipleAnswers: [],
    numericalAnswer: '',
    numericalTolerance: 0,
    points: 5,
    difficulty: 'Medium',
    category: 'Full Stack Development',
    skills: ['JavaScript'],
    explanation: '',
    saveToBank: true,
    // Programming specific
    programmingLanguage: 'javascript',
    inputFormat: 'Two space-separated integers on a single line.',
    outputFormat: 'Single integer representing the result.',
    constraints: '1 <= N <= 10^5',
    starterCode: '// Complete the solution function\nfunction solution(input) {\n  const [a, b] = input.trim().split(" ").map(Number);\n  return a + b;\n}',
    testCases: [
      { input: '2 3', expectedOutput: '5', isHidden: false },
      { input: '10 20', expectedOutput: '30', isHidden: true }
    ]
  });

  // ── Step 4: Candidates & Targeting ──
  const [candidateTargetType, setCandidateTargetType] = useState('STUDENTS'); 
  // 'STUDENTS' | 'COLLEGE' | 'DEPARTMENT' | 'APPLICANTS' | 'SHORTLISTED'
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [selectedCollegeIds, setSelectedCollegeIds] = useState(new Set());
  const [selectedDepartments, setSelectedDepartments] = useState(new Set());

  // ── Step 5: Settings ──
  const [settings, setSettings] = useState({
    durationMinutes: 45,
    passingScore: 60,
    attemptsAllowed: 1,
    randomQuestionOrder: true,
    randomOptions: true,
    showScoreImmediately: true,
    deadline: ''
  });

  // Load target options when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadTargets(info.opportunityId);
    }
  }, [isOpen]);

  // Re-fetch targeting when selected opportunity changes
  const handleOpportunityChange = (oppId) => {
    setInfo(prev => ({ ...prev, opportunityId: oppId }));
    loadTargets(oppId);
  };

  const loadTargets = async (oppId) => {
    setLoadingTargets(true);
    try {
      const res = await industryAssessmentService.fetchCandidateTargets(oppId);
      if (res.success && res.data) {
        setTargetMetadata(res.data);
      }
    } catch (err) {
      console.error('Failed to load candidate targets:', err);
    } finally {
      setLoadingTargets(false);
    }
  };

  if (!isOpen) return null;

  // ── Skill helpers ──
  const handleAddSkill = () => {
    const s = skillInput.trim();
    if (!s || skills.includes(s)) return;
    const newSkills = [...skills, s];
    setSkills(newSkills);
    setSkillInput('');
    // re-distribute equal weights
    const weightEach = Math.floor(100 / newSkills.length);
    const updated = {};
    newSkills.forEach((sk, i) => {
      updated[sk] = i === newSkills.length - 1 ? 100 - (weightEach * (newSkills.length - 1)) : weightEach;
    });
    setSkillWeights(updated);
  };

  const handleRemoveSkill = (skillToRemove) => {
    const newSkills = skills.filter(s => s !== skillToRemove);
    setSkills(newSkills);
    const updated = { ...skillWeights };
    delete updated[skillToRemove];
    if (newSkills.length > 0) {
      const weightEach = Math.floor(100 / newSkills.length);
      newSkills.forEach((sk, i) => {
        updated[sk] = i === newSkills.length - 1 ? 100 - (weightEach * (newSkills.length - 1)) : weightEach;
      });
    }
    setSkillWeights(updated);
  };

  // ── Question helpers ──
  const handleAddQuestion = () => {
    if (!newQ.questionText.trim()) {
      if (onShowToast) onShowToast({ title: 'Validation Error', message: 'Question text is required', type: 'warning' });
      return;
    }

    const formatted = {
      ...newQ,
      id: `q_temp_${Date.now()}`,
      skills: newQ.skills.length > 0 ? newQ.skills : [skills[0] || 'General']
    };

    setQuestions(prev => [...prev, formatted]);
    setShowNewQForm(false);
    // Reset form
    setNewQ({
      type: 'MCQ',
      title: '',
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: '0',
      multipleAnswers: [],
      numericalAnswer: '',
      numericalTolerance: 0,
      points: 5,
      difficulty: 'Medium',
      category: info.category,
      skills: skills.slice(0, 1),
      explanation: '',
      saveToBank: true,
      programmingLanguage: 'javascript',
      inputFormat: 'Two space-separated integers on a single line.',
      outputFormat: 'Single integer representing the result.',
      constraints: '1 <= N <= 10^5',
      starterCode: '// Complete the solution function\nfunction solution(input) {\n  return input;\n}',
      testCases: [
        { input: '2 3', expectedOutput: '5', isHidden: false },
        { input: '10 20', expectedOutput: '30', isHidden: true }
      ]
    });
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  // When questions are selected from Question Bank drawer
  const handleQuestionsSelectedFromBank = (selectedBankQuestions) => {
    const formatted = selectedBankQuestions.map(bq => ({
      ...bq,
      id: `q_bank_${bq.id}_${Date.now()}`,
      points: bq.points || 5,
      saveToBank: false
    }));
    setQuestions(prev => [...prev, ...formatted]);
    if (onShowToast) {
      onShowToast({
        title: 'Questions Added',
        message: `Imported ${selectedBankQuestions.length} questions from Question Bank.`,
        type: 'success'
      });
    }
  };

  // ── Candidate selection helpers ──
  const toggleStudent = (id) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCollege = (id) => {
    setSelectedCollegeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDept = (dept) => {
    setSelectedDepartments(prev => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  };

  // Compute total targeted candidate count
  const computeTargetCandidateCount = () => {
    if (candidateTargetType === 'STUDENTS') return selectedStudentIds.size;
    if (candidateTargetType === 'APPLICANTS') return targetMetadata.applicants?.length || 0;
    if (candidateTargetType === 'SHORTLISTED') return targetMetadata.shortlisted?.length || 0;
    if (candidateTargetType === 'COLLEGE') {
      const studentsInColleges = (targetMetadata.students || []).filter(s =>
        selectedCollegeIds.has(s.institution_id || s.institutionId)
      );
      return studentsInColleges.length;
    }
    if (candidateTargetType === 'DEPARTMENT') {
      const studentsInDepts = (targetMetadata.students || []).filter(s =>
        selectedDepartments.has(s.department)
      );
      return studentsInDepts.length;
    }
    return 0;
  };

  // ── Final Submit (Draft or Publish) ──
  const handleSubmit = async (publishImmediately = false) => {
    if (!info.title.trim()) {
      if (onShowToast) onShowToast({ title: 'Validation', message: 'Please enter an assessment title in Step 1', type: 'warning' });
      setCurrentStep(1);
      return;
    }
    if (questions.length === 0) {
      if (onShowToast) onShowToast({ title: 'Validation', message: 'Please add at least 1 question in Step 3', type: 'warning' });
      setCurrentStep(3);
      return;
    }

    try {
      setSubmitting(true);

      // Resolve candidate list based on target type
      let finalStudentIds = [];
      if (candidateTargetType === 'STUDENTS') {
        finalStudentIds = Array.from(selectedStudentIds);
      } else if (candidateTargetType === 'APPLICANTS') {
        finalStudentIds = (targetMetadata.applicants || []).map(a => a.student_id);
      } else if (candidateTargetType === 'SHORTLISTED') {
        finalStudentIds = (targetMetadata.shortlisted || []).map(a => a.student_id);
      } else if (candidateTargetType === 'COLLEGE') {
        finalStudentIds = (targetMetadata.students || [])
          .filter(s => selectedCollegeIds.has(s.institution_id || s.institutionId))
          .map(s => s.id);
      } else if (candidateTargetType === 'DEPARTMENT') {
        finalStudentIds = (targetMetadata.students || [])
          .filter(s => selectedDepartments.has(s.department))
          .map(s => s.id);
      }

      const payload = {
        title: info.title,
        opportunity_id: info.opportunityId || null,
        category: info.category,
        difficulty: info.difficulty,
        description: info.description,
        instructions: info.instructions,
        skills,
        skill_weights: skillWeights,
        questions,
        candidate_target_type: candidateTargetType,
        target_student_ids: finalStudentIds,
        target_college_ids: Array.from(selectedCollegeIds),
        target_departments: Array.from(selectedDepartments),
        duration_minutes: Number(settings.durationMinutes) || 45,
        passing_score: Number(settings.passingScore) || 60,
        attempts_allowed: Number(settings.attemptsAllowed) || 1,
        random_order: settings.randomQuestionOrder,
        random_options: settings.randomOptions,
        settings: {
          showScoreImmediately: settings.showScoreImmediately,
          deadline: settings.deadline
        },
        publish_immediately: publishImmediately
      };

      const res = await industryAssessmentService.createAssessmentBuilder(payload);
      if (res.success) {
        if (onShowToast) {
          onShowToast({
            title: publishImmediately ? 'Assessment Published! 🚀' : 'Assessment Saved as Draft',
            message: publishImmediately
              ? `Assigned to ${res.data.assignedCandidatesCount} candidates. Notifications dispatched.`
              : 'Saved successfully. You can review and publish anytime.',
            type: 'success'
          });
        }
        if (onCreated) onCreated(res.data);
        onClose();
      } else {
        throw new Error(res.message || 'Creation failed');
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({ title: 'Creation Failed', message: err.message, type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Information' },
    { num: 2, label: 'Skills' },
    { num: 3, label: 'Questions' },
    { num: 4, label: 'Candidates' },
    { num: 5, label: 'Settings' },
    { num: 6, label: 'Preview' }
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 12, 24, 0.88)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div className="glass-card" style={{
        maxWidth: '960px', width: '100%', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        borderRadius: '16px', background: 'rgba(10, 24, 48, 0.98)',
        border: '1px solid rgba(0, 212, 255, 0.35)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden'
      }}>
        {/* ── HEADER ── */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                background: 'rgba(0, 212, 255, 0.12)', color: 'var(--cyber-cyan, #00d9ff)',
                border: '1px solid rgba(0, 212, 255, 0.3)'
              }}>
                STEP {currentStep} OF 6
              </span>
              <span style={{ color: '#64748b' }}>//</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                Industry Assessment Builder
              </span>
            </div>
            <h2 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
              {currentStep === 1 && 'Step 1: Assessment Information'}
              {currentStep === 2 && 'Step 2: Skills & Weightage'}
              {currentStep === 3 && 'Step 3: Questions & Question Bank'}
              {currentStep === 4 && 'Step 4: Target Candidates'}
              {currentStep === 5 && 'Step 5: Assessment Settings'}
              {currentStep === 6 && 'Step 6: Preview & Publish'}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#94a3b8',
              cursor: 'pointer', padding: '6px', borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── STEPPER BAR ── */}
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)'
        }}>
          {steps.map(s => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <button
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                style={{
                  flex: 1, padding: '12px 8px', background: isActive ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                  border: 'none', borderBottom: isActive ? '2px solid var(--cyber-cyan, #00d9ff)' : '2px solid transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  color: isActive ? 'var(--cyber-cyan, #00d9ff)' : (isCompleted ? '#10b981' : '#64748b'),
                  fontSize: '12px', fontWeight: isActive ? 700 : 500, transition: 'all 0.2s ease'
                }}
              >
                {isCompleted ? <CheckCircle size={14} /> : <span style={{ fontFamily: 'monospace' }}>{s.num}.</span>}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── STEP CONTENT (SCROLLABLE) ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* STEP 1: Assessment Information */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Assessment Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Full-Stack Engineering Benchmark 2026"
                  value={info.title}
                  onChange={e => setInfo({ ...info, title: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#ffffff', fontSize: '13.5px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                    Linked Opportunity (Optional)
                  </label>
                  <select
                    value={info.opportunityId}
                    onChange={e => handleOpportunityChange(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff', fontSize: '13px'
                    }}
                  >
                    <option value="">-- Standalone Assessment (No Opportunity) --</option>
                    {(targetMetadata.opportunities || []).map(opp => (
                      <option key={opp.id} value={opp.id}>
                        {opp.title} ({opp.type || 'Job'})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Linking to an opportunity allows directly testing applicants or shortlisted candidates.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                    Domain / Category
                  </label>
                  <select
                    value={info.category}
                    onChange={e => setInfo({ ...info, category: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff', fontSize: '13px'
                    }}
                  >
                    <option value="Full Stack Development">Full Stack Development</option>
                    <option value="Frontend Engineering">Frontend Engineering</option>
                    <option value="Backend & Cloud Systems">Backend & Cloud Systems</option>
                    <option value="Data Science & ML">Data Science & Machine Learning</option>
                    <option value="Algorithms & Data Structures">Algorithms & Data Structures</option>
                    <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                    <option value="Logical Reasoning">Logical Reasoning</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Overview of the technical challenge, target evaluation objectives, and expectations..."
                  value={info.description}
                  onChange={e => setInfo({ ...info, description: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#ffffff', fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Candidate Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions visible to candidates before starting..."
                  value={info.instructions}
                  onChange={e => setInfo({ ...info, instructions: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#ffffff', fontSize: '13px'
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Skills & Categories */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#ffffff', marginBottom: '6px', fontWeight: 700 }}>
                  Targeted Skills
                </label>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#94a3b8' }}>
                  Define the core competencies evaluated in this assessment. Candidates will receive granular skill breakdown scores and evidence growth.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    placeholder="Enter skill name (e.g. Python, Docker, SQL)..."
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                    style={{
                      flex: 1, padding: '9px 14px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff', fontSize: '13px'
                    }}
                  />
                  <button
                    onClick={handleAddSkill}
                    className="btn-cyber-primary"
                    style={{ padding: '9px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} />
                    Add Skill
                  </button>
                </div>

                {/* Skill Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {skills.map(sk => (
                    <span
                      key={sk}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                        background: 'rgba(0, 212, 255, 0.12)', color: 'var(--cyber-cyan, #00d9ff)',
                        border: '1px solid rgba(0, 212, 255, 0.3)', display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                    >
                      {sk}
                      <button
                        onClick={() => handleRemoveSkill(sk)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Skill Weights Sliders */}
              {skills.length > 0 && (
                <div style={{
                  padding: '16px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                      Skill Weight Distribution (Total: {Object.values(skillWeights).reduce((a, b) => a + Number(b), 0)}%)
                    </h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Used to compute weighted skill proficiency scores
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {skills.map(sk => (
                      <div key={sk} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ minWidth: '120px', fontSize: '12.5px', color: '#e2e8f0', fontWeight: 500 }}>
                          {sk}
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={skillWeights[sk] || 0}
                          onChange={e => {
                            setSkillWeights({ ...skillWeights, [sk]: Number(e.target.value) });
                          }}
                          style={{ flex: 1, accentColor: 'var(--cyber-cyan, #00d9ff)' }}
                        />
                        <span style={{ minWidth: '45px', textAlign: 'right', fontSize: '12.5px', fontWeight: 700, color: 'var(--cyber-cyan, #00d9ff)' }}>
                          {skillWeights[sk] || 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Questions & Question Bank */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Question Action Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontWeight: 700 }}>
                    Assessment Question Set ({questions.length} Questions, {questions.reduce((a, b) => a + (Number(b.points) || 5), 0)} Marks)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Author new questions or pick pre-verified problems from your reusable Question Bank.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowQuestionBankDrawer(true)}
                    className="btn-cyber-outline"
                    style={{
                      padding: '8px 16px', fontSize: '12.5px', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <BookOpen size={15} />
                    Browse Question Bank
                  </button>

                  <button
                    onClick={() => setShowNewQForm(true)}
                    className="btn-cyber-primary"
                    style={{
                      padding: '8px 16px', fontSize: '12.5px', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Plus size={15} />
                    Create Question
                  </button>
                </div>
              </div>

              {/* Questions List */}
              {questions.length === 0 ? (
                <div style={{
                  padding: '40px 20px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
                  border: '1px dashed rgba(255,255,255,0.15)'
                }}>
                  <HelpCircle size={36} style={{ color: '#64748b', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                    No questions added yet
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px' }}>
                    Add multiple choice, numerical, or programming problems with sandbox test cases.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button
                      onClick={() => setShowQuestionBankDrawer(true)}
                      className="btn-cyber-outline"
                      style={{ padding: '7px 14px', fontSize: '12px' }}
                    >
                      Import from Question Bank
                    </button>
                    <button
                      onClick={() => setShowNewQForm(true)}
                      className="btn-cyber-primary"
                      style={{ padding: '7px 14px', fontSize: '12px' }}
                    >
                      Create Custom Question
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      style={{
                        padding: '14px 18px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                            background: 'rgba(0, 212, 255, 0.1)', color: 'var(--cyber-cyan, #00d9ff)'
                          }}>
                            Q{idx + 1} • {q.type}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {q.difficulty} • {q.points || 5} pts
                          </span>
                          {q.programmingLanguage && (
                            <span style={{
                              fontSize: '10px', padding: '1px 6px', borderRadius: '4px',
                              background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc'
                            }}>
                              {q.programmingLanguage}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600, lineHeight: 1.5 }}>
                          {q.questionText}
                        </div>

                        {q.options && q.options.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {q.options.map((opt, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                                  background: (q.type === 'MCQ' && String(q.correctAnswer) === String(i)) ||
                                    (q.type === 'MULTIPLE_ANSWER' && Array.isArray(q.multipleAnswers) && q.multipleAnswers.includes(String(i)))
                                    ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                                  color: (q.type === 'MCQ' && String(q.correctAnswer) === String(i)) ||
                                    (q.type === 'MULTIPLE_ANSWER' && Array.isArray(q.multipleAnswers) && q.multipleAnswers.includes(String(i)))
                                    ? '#34d399' : '#94a3b8',
                                  border: '1px solid rgba(255,255,255,0.06)'
                                }}
                              >
                                {String.fromCharCode(65 + i)}: {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        style={{
                          background: 'none', border: 'none', color: '#ef4444',
                          cursor: 'pointer', padding: '4px', opacity: 0.8
                        }}
                        title="Delete Question"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* In-Wizard New Question Form Modal */}
              {showNewQForm && (
                <div style={{
                  padding: '20px', borderRadius: '12px',
                  background: 'rgba(6, 20, 38, 0.95)', border: '1px solid rgba(0, 212, 255, 0.3)',
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                      Add New Assessment Question
                    </h4>
                    <button
                      onClick={() => setShowNewQForm(false)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Question Type</label>
                        <select
                          value={newQ.type}
                          onChange={e => setNewQ({ ...newQ, type: e.target.value })}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }}
                        >
                          <option value="MCQ">MCQ (Single Choice)</option>
                          <option value="MULTIPLE_ANSWER">Multiple Answer (Checkbox)</option>
                          <option value="NUMERICAL">Numerical Answer</option>
                          <option value="PROGRAMMING">Programming Challenge</option>
                          <option value="LOGICAL_REASONING">Logical Reasoning</option>
                          <option value="APTITUDE">Quantitative Aptitude</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Difficulty</label>
                        <select
                          value={newQ.difficulty}
                          onChange={e => setNewQ({ ...newQ, difficulty: e.target.value })}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }}
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Points / Marks</label>
                        <input
                          type="number"
                          value={newQ.points}
                          onChange={e => setNewQ({ ...newQ, points: Number(e.target.value) })}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Question / Problem Statement *
                      </label>
                      <textarea
                        rows={3}
                        value={newQ.questionText}
                        onChange={e => setNewQ({ ...newQ, questionText: e.target.value })}
                        placeholder="Write the full question prompt here..."
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }}
                      />
                    </div>

                    {/* MCQ & MULTIPLE ANSWER */}
                    {(newQ.type === 'MCQ' || newQ.type === 'MULTIPLE_ANSWER' || newQ.type === 'LOGICAL_REASONING' || newQ.type === 'APTITUDE') && (
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          Options (Select the correct answer button)
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {newQ.options.map((opt, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (newQ.type === 'MULTIPLE_ANSWER') {
                                    const curr = newQ.multipleAnswers || [];
                                    const key = String(i);
                                    const next = curr.includes(key) ? curr.filter(k => k !== key) : [...curr, key];
                                    setNewQ({ ...newQ, multipleAnswers: next });
                                  } else {
                                    setNewQ({ ...newQ, correctAnswer: String(i) });
                                  }
                                }}
                                style={{
                                  padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                  background: (newQ.type === 'MULTIPLE_ANSWER' && (newQ.multipleAnswers || []).includes(String(i))) ||
                                    (newQ.type !== 'MULTIPLE_ANSWER' && String(newQ.correctAnswer) === String(i))
                                    ? '#10b981' : 'rgba(255,255,255,0.08)',
                                  color: (newQ.type === 'MULTIPLE_ANSWER' && (newQ.multipleAnswers || []).includes(String(i))) ||
                                    (newQ.type !== 'MULTIPLE_ANSWER' && String(newQ.correctAnswer) === String(i))
                                    ? '#000' : '#94a3b8',
                                  border: 'none', cursor: 'pointer'
                                }}
                              >
                                {String.fromCharCode(65 + i)} {((newQ.type === 'MULTIPLE_ANSWER' && (newQ.multipleAnswers || []).includes(String(i))) || (newQ.type !== 'MULTIPLE_ANSWER' && String(newQ.correctAnswer) === String(i))) ? '✓ Correct' : ''}
                              </button>
                              <input
                                type="text"
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                value={opt}
                                onChange={e => {
                                  const next = [...newQ.options];
                                  next[i] = e.target.value;
                                  setNewQ({ ...newQ, options: next });
                                }}
                                style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* NUMERICAL */}
                    {newQ.type === 'NUMERICAL' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Exact Numeric Value
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={newQ.numericalAnswer}
                            onChange={e => setNewQ({ ...newQ, numericalAnswer: e.target.value })}
                            placeholder="e.g. 42 or 3.14"
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Acceptable Tolerance (±)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={newQ.numericalTolerance}
                            onChange={e => setNewQ({ ...newQ, numericalTolerance: Number(e.target.value) })}
                            placeholder="0 for exact match"
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* PROGRAMMING */}
                    {newQ.type === 'PROGRAMMING' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Language</label>
                            <select
                              value={newQ.programmingLanguage}
                              onChange={e => setNewQ({ ...newQ, programmingLanguage: e.target.value })}
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }}
                            >
                              <option value="javascript">JavaScript (Node.js)</option>
                              <option value="python">Python 3</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Constraints</label>
                            <input
                              type="text"
                              value={newQ.constraints}
                              onChange={e => setNewQ({ ...newQ, constraints: e.target.value })}
                              placeholder="e.g. 1 <= N <= 10^5"
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Starter Code</label>
                          <textarea
                            rows={3}
                            value={newQ.starterCode}
                            onChange={e => setNewQ({ ...newQ, starterCode: e.target.value })}
                            style={{ width: '100%', fontFamily: 'monospace', padding: '8px', borderRadius: '6px', background: '#070f1e', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', fontSize: '12px' }}
                          />
                        </div>

                        {/* Test Cases */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label style={{ fontSize: '11px', color: '#94a3b8' }}>Test Cases (Visible & Hidden)</label>
                            <button
                              type="button"
                              onClick={() => {
                                setNewQ({
                                  ...newQ,
                                  testCases: [...(newQ.testCases || []), { input: '', expectedOutput: '', isHidden: false }]
                                });
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--cyber-cyan, #00d9ff)', fontSize: '11px', cursor: 'pointer' }}
                            >
                              + Add Test Case
                            </button>
                          </div>

                          {(newQ.testCases || []).map((tc, tcIdx) => (
                            <div key={tcIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                              <input
                                type="text"
                                placeholder="Input (e.g. 5 10)"
                                value={tc.input}
                                onChange={e => {
                                  const next = [...newQ.testCases];
                                  next[tcIdx].input = e.target.value;
                                  setNewQ({ ...newQ, testCases: next });
                                }}
                                style={{ padding: '6px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px' }}
                              />
                              <input
                                type="text"
                                placeholder="Expected Output (e.g. 15)"
                                value={tc.expectedOutput}
                                onChange={e => {
                                  const next = [...newQ.testCases];
                                  next[tcIdx].expectedOutput = e.target.value;
                                  setNewQ({ ...newQ, testCases: next });
                                }}
                                style={{ padding: '6px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px' }}
                              />
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={tc.isHidden}
                                  onChange={e => {
                                    const next = [...newQ.testCases];
                                    next[tcIdx].isHidden = e.target.checked;
                                    setNewQ({ ...newQ, testCases: next });
                                  }}
                                />
                                Hidden
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = newQ.testCases.filter((_, i) => i !== tcIdx);
                                  setNewQ({ ...newQ, testCases: next });
                                }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Save to question bank checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <input
                        type="checkbox"
                        id="saveToBankCheckbox"
                        checked={newQ.saveToBank}
                        onChange={e => setNewQ({ ...newQ, saveToBank: e.target.checked })}
                      />
                      <label htmlFor="saveToBankCheckbox" style={{ fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                        Save this question to company Question Bank for future reuse
                      </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setShowNewQForm(false)}
                        className="btn-cyber-outline"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="btn-cyber-primary"
                        style={{ padding: '6px 18px', fontSize: '12px' }}
                      >
                        Add to Assessment
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Target Candidates */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontWeight: 700 }}>
                  Select Target Candidate Audience
                </h3>
                <p style={{ margin: '2px 0 12px', fontSize: '12px', color: '#94a3b8' }}>
                  Choose how you want to target candidates: specific students, partner colleges, academic departments, or applicants from an opportunity.
                </p>

                {/* Target Strategy Tabs */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { id: 'STUDENTS', label: 'Selected Students', icon: Users },
                    { id: 'COLLEGE', label: 'Selected Colleges', icon: Building },
                    { id: 'DEPARTMENT', label: 'Departments', icon: GraduationCap },
                    { id: 'APPLICANTS', label: 'Opportunity Applicants', icon: Briefcase },
                    { id: 'SHORTLISTED', label: 'Shortlisted Candidates', icon: Award }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isSel = candidateTargetType === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setCandidateTargetType(tab.id)}
                        style={{
                          padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                          border: isSel ? '1px solid var(--cyber-cyan, #00d9ff)' : '1px solid rgba(255,255,255,0.08)',
                          background: isSel ? 'rgba(0, 212, 255, 0.12)' : 'rgba(255,255,255,0.02)',
                          color: isSel ? 'var(--cyber-cyan, #00d9ff)' : '#94a3b8',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <Icon size={14} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Target Audience Summary Callout */}
                <div style={{
                  padding: '12px 16px', borderRadius: '8px',
                  background: 'rgba(0, 212, 255, 0.06)', border: '1px solid rgba(0, 212, 255, 0.2)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px'
                }}>
                  <div style={{ fontSize: '12.5px', color: '#ffffff' }}>
                    Current Estimated Audience: <strong style={{ color: 'var(--cyber-cyan, #00d9ff)' }}>{computeTargetCandidateCount()} Candidates</strong>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Auto-enrolled upon publishing
                  </span>
                </div>

                {/* TAB CONTENT: Specific Students */}
                {candidateTargetType === 'STUDENTS' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Select individual candidates from registered students ({targetMetadata.students?.length || 0} total)
                      </span>
                      <button
                        onClick={() => {
                          const allIds = new Set((targetMetadata.students || []).map(s => s.id));
                          setSelectedStudentIds(allIds);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--cyber-cyan, #00d9ff)', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Select All
                      </button>
                    </div>

                    <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(targetMetadata.students || []).map(s => {
                        const isChecked = selectedStudentIds.has(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleStudent(s.id)}
                            style={{
                              padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                              background: isChecked ? 'rgba(0, 212, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                              border: isChecked ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                              />
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                                  {s.name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                  {s.institution_name || 'Partner College'} • {s.department || 'Computer Science'}
                                </div>
                              </div>
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {s.email}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: College */}
                {candidateTargetType === 'COLLEGE' && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                      Select partner colleges. All enrolled students will be assigned this assessment.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                      {(targetMetadata.colleges || []).map(c => {
                        const isChecked = selectedCollegeIds.has(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleCollege(c.id)}
                            style={{
                              padding: '12px', borderRadius: '8px', cursor: 'pointer',
                              background: isChecked ? 'rgba(0, 212, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                              border: isChecked ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid rgba(255,255,255,0.06)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                              />
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                                {c.name}
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '22px', display: 'block' }}>
                              {c.city || 'Tamil Nadu'} • Code: {c.code || 'NEXUS'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: Departments */}
                {candidateTargetType === 'DEPARTMENT' && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                      Target students by academic discipline across all institutions.
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(targetMetadata.departments || ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Data Science', 'Artificial Intelligence', 'Mechanical Engineering']).map(dept => {
                        const isChecked = selectedDepartments.has(dept);
                        return (
                          <button
                            key={dept}
                            onClick={() => toggleDept(dept)}
                            style={{
                              padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                              background: isChecked ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.04)',
                              border: isChecked ? '1px solid var(--cyber-cyan, #00d9ff)' : '1px solid rgba(255,255,255,0.08)',
                              color: isChecked ? 'var(--cyber-cyan, #00d9ff)' : '#94a3b8',
                              cursor: 'pointer'
                            }}
                          >
                            {isChecked ? '✓ ' : '+ '} {dept}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: Applicants */}
                {candidateTargetType === 'APPLICANTS' && (
                  <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {!info.opportunityId ? (
                      <div style={{ color: '#f87171', fontSize: '13px' }}>
                        Please link an Opportunity in Step 1 to automatically target its applicants.
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600, marginBottom: '6px' }}>
                          Target All Registered Applicants ({targetMetadata.applicants?.length || 0} applicants)
                        </div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                          Every candidate who submitted an application for this opportunity will be invited to complete this technical assessment.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT: Shortlisted */}
                {candidateTargetType === 'SHORTLISTED' && (
                  <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {!info.opportunityId ? (
                      <div style={{ color: '#f87171', fontSize: '13px' }}>
                        Please link an Opportunity in Step 1 to automatically target its shortlisted candidates.
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600, marginBottom: '6px' }}>
                          Target Shortlisted Candidates ({targetMetadata.shortlisted?.length || 0} candidates)
                        </div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                          Only candidates with stage marked as SHORTLISTED for this opportunity will receive this assessment.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Settings */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={settings.durationMinutes}
                    onChange={e => setSettings({ ...settings, durationMinutes: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff', fontSize: '13px'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Timer auto-submits when time expires.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                    Passing Score (%) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={settings.passingScore}
                    onChange={e => setSettings({ ...settings, passingScore: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff', fontSize: '13px'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Threshold to designate PASSED status.
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                    Max Attempts Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={settings.attemptsAllowed}
                    onChange={e => setSettings({ ...settings, attemptsAllowed: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff', fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                    Submission Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={settings.deadline}
                    onChange={e => setSettings({ ...settings, deadline: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff', fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div style={{
                padding: '16px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Randomize Question Order</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Each student receives questions in a distinct randomized sequence.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.randomQuestionOrder}
                    onChange={e => setSettings({ ...settings, randomQuestionOrder: e.target.checked })}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Randomize Options (MCQ)</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Shuffle option choices (A, B, C, D) to eliminate answer key sharing.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.randomOptions}
                    onChange={e => setSettings({ ...settings, randomOptions: e.target.checked })}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Show Candidate Results Immediately</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Display score, %, and skill-wise breakdown to student upon submission.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showScoreImmediately}
                    onChange={e => setSettings({ ...settings, showScoreImmediately: e.target.checked })}
                  />
                </label>
              </div>
            </div>
          )}

          {/* STEP 6: Preview & Publish */}
          {currentStep === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                padding: '20px', borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
                border: '1px solid rgba(0, 212, 255, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                      background: 'rgba(0, 212, 255, 0.15)', color: 'var(--cyber-cyan, #00d9ff)'
                    }}>
                      PREVIEW ASSESSMENT
                    </span>
                    <h2 style={{ margin: '8px 0 4px', fontSize: '20px', color: '#ffffff', fontWeight: 800 }}>
                      {info.title || 'Untitled Assessment'}
                    </h2>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                      {info.category} • {info.difficulty} Difficulty • {settings.durationMinutes} Minutes
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--cyber-cyan, #00d9ff)' }}>
                      {questions.reduce((a, b) => a + (Number(b.points) || 5), 0)} Marks
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {questions.length} Total Questions
                    </div>
                  </div>
                </div>

                {info.description && (
                  <p style={{ margin: '14px 0 0', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {info.description}
                  </p>
                )}
              </div>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>SKILLS EVALUATED</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
                    {skills.join(', ') || 'General'}
                  </div>
                </div>

                <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>TARGET AUDIENCE</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-cyan, #00d9ff)', marginTop: '4px' }}>
                    {computeTargetCandidateCount()} Candidates ({candidateTargetType})
                  </div>
                </div>

                <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>BENCHMARK SETTINGS</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                    Pass: {settings.passingScore}% • {settings.attemptsAllowed} Attempt
                  </div>
                </div>
              </div>

              {/* Questions Preview Accordion */}
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#ffffff', fontWeight: 700 }}>
                  Questions Summary ({questions.length})
                </h4>
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {questions.map((q, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px', borderRadius: '6px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--cyber-cyan, #00d9ff)', fontWeight: 700 }}>
                          #{i + 1}
                        </span>
                        <span style={{ fontSize: '12px', color: '#ffffff' }}>
                          {q.questionText.slice(0, 80)}{q.questionText.length > 80 ? '...' : ''}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {q.type} • {q.points || 5} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="btn-cyber-outline"
                style={{ padding: '8px 16px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ChevronLeft size={16} />
                Previous Step
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep < 6 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="btn-cyber-primary"
                style={{ padding: '8px 20px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Next Step
                <ChevronRight size={16} />
              </button>
            ) : (
              <>
                <button
                  disabled={submitting}
                  onClick={() => handleSubmit(false)}
                  className="btn-cyber-outline"
                  style={{ padding: '8px 18px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={15} />
                  Save Draft
                </button>
                <button
                  disabled={submitting}
                  onClick={() => handleSubmit(true)}
                  className="btn-cyber-primary"
                  style={{
                    padding: '8px 22px', fontSize: '12.5px', fontWeight: 700,
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    border: 'none', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Send size={15} />
                  {submitting ? 'Publishing...' : 'Publish & Assign Now'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reusable Question Bank Drawer Modal */}
      <QuestionBankDrawer
        isOpen={showQuestionBankDrawer}
        onClose={() => setShowQuestionBankDrawer(false)}
        onSelectQuestions={handleQuestionsSelectedFromBank}
        onShowToast={onShowToast}
      />
    </div>
  );
}
