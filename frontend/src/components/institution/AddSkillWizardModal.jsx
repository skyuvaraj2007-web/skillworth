import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  BookOpen,
  Award,
  Users,
  Clock,
  Calendar,
  Layers,
  ShieldCheck,
  Eye,
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Upload,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

const WIZARD_STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Learning' },
  { id: 3, label: 'Structure' },
  { id: 4, label: 'Instructor' },
  { id: 5, label: 'Assessment' },
  { id: 6, label: 'Eligibility' },
  { id: 7, label: 'Industry' },
  { id: 8, label: 'Enrollment' },
  { id: 9, label: 'Notifications' },
  { id: 10, label: 'Preview' }
];

const CATEGORIES = [
  'Programming',
  'Web Development',
  'Cloud',
  'AI/ML',
  'Database',
  'Cybersecurity',
  'Data Science',
  'DevOps',
  'Other'
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const MODES = ['Online', 'Offline', 'Hybrid'];
const ASSESSMENT_TYPES = ['Quiz', 'Coding Test', 'Assignment', 'Project', 'Practical', 'Final Assessment'];
const ENROLLMENT_TYPES = [
  { type: 'OPEN', label: 'Open Enrollment', desc: 'Eligible students can enroll immediately with 1-click confirmation.' },
  { type: 'APPROVAL_REQUIRED', label: 'Approval Required', desc: 'Students submit enrollment requests that faculty must review and approve.' },
  { type: 'INVITE_ONLY', label: 'Invite Only', desc: 'Only pre-authorized cohorts or invited students can access this skill.' }
];

export default function AddSkillWizardModal({ isOpen, onClose, onSkillSaved, onSuccess, institution, initialSkill }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sourced academic departments from institution
  const availableDepartments = Array.isArray(institution?.departments) && institution.departments.length > 0
    ? institution.departments
    : ['CSE', 'IT', 'AI & DS', 'ECE', 'EEE', 'Mechanical', 'Civil'];

  // 10-Step Comprehensive Skill Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    name: '',
    category: 'Programming',
    level: 'Intermediate',
    shortDescription: '',
    detailedDescription: '',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',

    // Step 2: Learning Details
    learningObjectives: ['Understand core fundamental concepts', 'Build hands-on practical implementations', 'Deploy production-ready projects'],
    prerequisites: ['Basic Programming Logic'],
    topicsCovered: ['Foundations & Architecture', 'Data Structures & Flow', 'API Integration', 'Testing & Deployment'],

    // Step 3: Course Structure
    duration: '6 Weeks',
    totalHours: 40,
    mode: 'Hybrid',
    startDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 49).toISOString().split('T')[0],
    classDays: 'Mon, Wed, Fri',
    classTiming: '4:30 PM - 6:30 PM',
    numberOfSessions: 18,
    maxStudents: 60,

    // Step 4: Instructor
    instructorName: institution?.dean || 'Prof. K. Ramanathan',
    instructorDesignation: 'Associate Professor & Skill Lead',
    instructorDepartment: 'Dept. of Computer Science & Engineering',
    instructorExperience: '12+ Years Academic & Industry Mentorship',
    instructorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    contactInfo: institution?.officialEmail || 'faculty.lead@nexus.edu',

    // Step 5: Assessment & Benchmark
    assessmentType: 'Coding Test + Project',
    passingScore: 75,
    numberOfAssessments: 2,
    benchmarks: { bronze: 60, silver: 75, gold: 85, expert: 95 },
    certificateAvailable: true,
    certificateCriteria: 'Score ≥ 75% on proctored benchmark test and completed capstone project.',
    finalSkillScore: 85,

    // Step 6: Student Eligibility
    eligibleDepartments: [...availableDepartments],
    eligibleYears: ['2nd', '3rd', '4th'],
    eligibleSemesters: ['3', '4', '5', '6', '7', '8'],
    minCgpa: 7.0,
    requiredPreviousSkills: [],
    applicationDeadline: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],

    // Step 7: Industry Visibility
    industryVisible: true,
    sharedFields: ['skillName', 'completionStatus', 'benchmark', 'assessmentScore', 'projects', 'certification', 'relatedSkills'],

    // Step 8: Enrollment Settings
    enrollmentType: 'OPEN',
    enrollmentStartDate: new Date().toISOString().split('T')[0],
    enrollmentDeadline: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    seatLimit: 60,
    waitlistEnabled: true,
    autoEnrollEligible: false,

    // Step 9: Notifications
    notifyOnPublish: true,
    notifyEnrollmentConfirmation: true,
    notifySessionReminder: true,
    notifyAssessmentReminder: true,
    notifyCourseCompletion: true
  });

  // Dynamic Array Handlers for Step 2
  const [newObjective, setNewObjective] = useState('');
  const [newPrereq, setNewPrereq] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newPrereqSkill, setNewPrereqSkill] = useState('');

  if (!isOpen) return null;

  // Validation per step
  const validateCurrentStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setErrorMsg('Skill Name is required.');
        return false;
      }
      if (!formData.shortDescription.trim()) {
        setErrorMsg('Short Description is required.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (formData.learningObjectives.length === 0) {
        setErrorMsg('Please add at least one learning objective.');
        return false;
      }
    }
    if (currentStep === 3) {
      if (!formData.duration.trim()) {
        setErrorMsg('Duration is required.');
        return false;
      }
      if (!formData.totalHours || formData.totalHours <= 0) {
        setErrorMsg('Total Hours must be greater than 0.');
        return false;
      }
    }
    if (currentStep === 4) {
      if (!formData.instructorName.trim()) {
        setErrorMsg('Instructor Name is required.');
        return false;
      }
    }
    if (currentStep === 6) {
      if (formData.eligibleDepartments.length === 0) {
        setErrorMsg('Please select at least one eligible department.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 10));
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Submit Handler (Save Draft or Publish)
  const handleSave = async (isPublish = false) => {
    if (isPublish && !validateCurrentStep()) return;
    setLoading(true);
    setErrorMsg('');

    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    const instId = institution?.collegeId || institution?.institutionId || 'TN010';

    const payload = {
      name: formData.name,
      category: formData.category,
      level: formData.level,
      shortDescription: formData.shortDescription,
      detailedDescription: formData.detailedDescription,
      thumbnail: formData.thumbnail,
      learningObjectives: formData.learningObjectives,
      prerequisites: formData.prerequisites,
      topicsCovered: formData.topicsCovered,
      duration: formData.duration,
      totalHours: Number(formData.totalHours),
      mode: formData.mode,
      schedule: {
        startDate: formData.startDate,
        endDate: formData.endDate,
        classDays: formData.classDays,
        classTiming: formData.classTiming
      },
      numberOfSessions: Number(formData.numberOfSessions),
      maxStudents: Number(formData.maxStudents),
      instructor: {
        name: formData.instructorName,
        designation: formData.instructorDesignation,
        department: formData.instructorDepartment,
        experience: formData.instructorExperience,
        photo: formData.instructorPhoto,
        contactInfo: formData.contactInfo
      },
      assessment: {
        type: formData.assessmentType,
        passingScore: Number(formData.passingScore),
        numberOfAssessments: Number(formData.numberOfAssessments),
        benchmarks: formData.benchmarks
      },
      certification: {
        available: formData.certificateAvailable,
        criteria: formData.certificateCriteria,
        finalSkillScore: Number(formData.finalSkillScore)
      },
      eligibility: {
        departments: formData.eligibleDepartments,
        years: formData.eligibleYears,
        semesters: formData.eligibleSemesters,
        minCgpa: Number(formData.minCgpa),
        requiredPreviousSkills: formData.requiredPreviousSkills,
        maxSeats: Number(formData.maxStudents),
        applicationDeadline: formData.applicationDeadline
      },
      industryVisibility: {
        isVisible: formData.industryVisible,
        sharedFields: formData.sharedFields
      },
      enrollmentSettings: {
        type: formData.enrollmentType,
        startDate: formData.enrollmentStartDate,
        deadline: formData.enrollmentDeadline,
        seatLimit: Number(formData.seatLimit),
        waitlistEnabled: formData.waitlistEnabled,
        autoEnrollEligible: formData.autoEnrollEligible
      },
      notifications: {
        notifyOnPublish: formData.notifyOnPublish,
        notifyEnrollmentConfirmation: formData.notifyEnrollmentConfirmation,
        notifySessionReminder: formData.notifySessionReminder,
        notifyAssessmentReminder: formData.notifyAssessmentReminder,
        notifyCourseCompletion: formData.notifyCourseCompletion
      },
      status: isPublish ? 'PUBLISHED' : 'DRAFT',
      isPublish
    };

    try {
      const res = await fetch('/api/academic/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save skill offering');
      }

      setLoading(false);
      if (isPublish) {
        try {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        } catch {}
      }

      const savedData = {
        ...data.data,
        isPublish,
        notifiedCount: data.data?.notifiedStudentsCount || 0
      };
      if (onSkillSaved) onSkillSaved(savedData, isPublish);
      if (onSuccess) onSuccess(savedData, isPublish);
      onClose();
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Failed to connect to campus academic server');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(10, 15, 30, 0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div 
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          background: 'var(--bg-card, rgba(255, 255, 255, 0.95))',
          border: '1px solid var(--border-subtle, rgba(124, 58, 237, 0.25))',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(124, 58, 237, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading, #1E1B4B)', margin: 0 }}>
                Offer New Skill / Course
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary, #6B7280)', margin: 0 }}>
                Step {currentStep} of 10 — {WIZARD_STEPS[currentStep - 1].label}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Horizontal Step Indicator */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          padding: '12px 28px',
          borderBottom: '1px solid var(--border-subtle)',
          gap: '6px',
          background: 'var(--bg-input, rgba(255,255,255,0.4))'
        }}>
          {WIZARD_STEPS.map((s) => {
            const isCompleted = s.id < currentStep;
            const isCurrent = s.id === currentStep;
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (s.id < currentStep) setCurrentStep(s.id);
                }}
                disabled={s.id > currentStep}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: isCurrent 
                    ? '1.5px solid #7C3AED' 
                    : isCompleted 
                    ? '1px solid rgba(16, 185, 129, 0.4)' 
                    : '1px solid transparent',
                  background: isCurrent 
                    ? 'rgba(124, 58, 237, 0.12)' 
                    : isCompleted 
                    ? 'rgba(16, 185, 129, 0.08)' 
                    : 'transparent',
                  color: isCurrent 
                    ? '#7C3AED' 
                    : isCompleted 
                    ? '#059669' 
                    : 'var(--text-muted, #9CA3AF)',
                  fontSize: '11px',
                  fontWeight: isCurrent ? 800 : 600,
                  whiteSpace: 'nowrap',
                  cursor: s.id < currentStep ? 'pointer' : 'default',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 800,
                  background: isCompleted ? '#10B981' : isCurrent ? '#7C3AED' : 'rgba(156, 163, 175, 0.3)',
                  color: '#FFFFFF'
                }}>
                  {isCompleted ? <Check size={10} /> : s.id}
                </span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Notification Banner */}
        {errorMsg && (
          <div style={{
            margin: '14px 28px 0',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#DC2626',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step Body Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>

          {/* STEP 1: BASIC INFORMATION */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                  Skill / Course Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python Programming & Applied Systems"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Skill Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Skill Level *
                  </label>
                  <select
                    value={formData.level}
                    onChange={e => setFormData({ ...formData, level: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                  Short Description *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Concise overview summarizing the learning trajectory and outcomes..."
                  value={formData.shortDescription}
                  onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                  Detailed Curriculum Description (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Comprehensive syllabus, industry use cases, and capstone requirements..."
                  value={formData.detailedDescription}
                  onChange={e => setFormData({ ...formData, detailedDescription: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: LEARNING DETAILS */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Learning Objectives */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                  Learning Objectives (What You'll Learn)
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Add learning objective (e.g. Master OOP & Async APIs)..."
                    value={newObjective}
                    onChange={e => setNewObjective(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newObjective.trim()) {
                        e.preventDefault();
                        setFormData({ ...formData, learningObjectives: [...formData.learningObjectives, newObjective.trim()] });
                        setNewObjective('');
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newObjective.trim()) {
                        setFormData({ ...formData, learningObjectives: [...formData.learningObjectives, newObjective.trim()] });
                        setNewObjective('');
                      }
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: '#7C3AED',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {formData.learningObjectives.map((obj, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '12.5px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={14} color="#10B981" /> {obj}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, learningObjectives: formData.learningObjectives.filter((_, idx) => idx !== i) })}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prerequisites */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                  Prerequisites
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Add prerequisite (e.g. Basic Python or C Programming)..."
                    value={newPrereq}
                    onChange={e => setNewPrereq(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPrereq.trim()) {
                        setFormData({ ...formData, prerequisites: [...formData.prerequisites, newPrereq.trim()] });
                        setNewPrereq('');
                      }
                    }}
                    style={{ padding: '8px 14px', borderRadius: '8px', background: '#3B82F6', color: '#FFFFFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {formData.prerequisites.map((p, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>
                      {p}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFormData({ ...formData, prerequisites: formData.prerequisites.filter((_, idx) => idx !== i) })} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Topics Covered */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                  Topics Covered
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Add topic (e.g. Asynchronous I/O, REST APIs)..."
                    value={newTopic}
                    onChange={e => setNewTopic(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTopic.trim()) {
                        setFormData({ ...formData, topicsCovered: [...formData.topicsCovered, newTopic.trim()] });
                        setNewTopic('');
                      }
                    }}
                    style={{ padding: '8px 14px', borderRadius: '8px', background: '#06B6D4', color: '#FFFFFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {formData.topicsCovered.map((t, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>
                      {t}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFormData({ ...formData, topicsCovered: formData.topicsCovered.filter((_, idx) => idx !== i) })} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: COURSE STRUCTURE */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Duration *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 6 Weeks"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Total Hours *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.totalHours}
                    onChange={e => setFormData({ ...formData, totalHours: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Delivery Mode *
                  </label>
                  <select
                    value={formData.mode}
                    onChange={e => setFormData({ ...formData, mode: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    {MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Class Days
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mon, Wed, Fri"
                    value={formData.classDays}
                    onChange={e => setFormData({ ...formData, classDays: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Class Timing
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4:30 PM - 6:30 PM"
                    value={formData.classTiming}
                    onChange={e => setFormData({ ...formData, classTiming: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Number of Sessions
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.numberOfSessions}
                    onChange={e => setFormData({ ...formData, numberOfSessions: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Maximum Students (Seat Limit) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxStudents}
                    onChange={e => setFormData({ ...formData, maxStudents: Number(e.target.value), seatLimit: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: INSTRUCTOR */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Instructor Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Faculty or industry instructor name"
                    value={formData.instructorName}
                    onChange={e => setFormData({ ...formData, instructorName: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Associate Professor & Dept Lead"
                    value={formData.instructorDesignation}
                    onChange={e => setFormData({ ...formData, instructorDesignation: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Department
                  </label>
                  <select
                    value={formData.instructorDepartment}
                    onChange={e => setFormData({ ...formData, instructorDepartment: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    {availableDepartments.map(d => <option key={d} value={`Dept. of ${d}`}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Instructor Experience
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10+ Years Industry & Research Experience"
                    value={formData.instructorExperience}
                    onChange={e => setFormData({ ...formData, instructorExperience: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                  Contact / Support Information
                </label>
                <input
                  type="text"
                  placeholder="Official faculty email or lab support contact"
                  value={formData.contactInfo}
                  onChange={e => setFormData({ ...formData, contactInfo: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {/* STEP 5: ASSESSMENT & SKILL BENCHMARK */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Assessment Type *
                  </label>
                  <select
                    value={formData.assessmentType}
                    onChange={e => setFormData({ ...formData, assessmentType: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    {ASSESSMENT_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Passing Score Threshold (%) *
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={100}
                    value={formData.passingScore}
                    onChange={e => setFormData({ ...formData, passingScore: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Benchmark Thresholds */}
              <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '10px' }}>
                  Skill Benchmark Thresholds
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#CD7F32' }}>Bronze Tier</span>
                    <input
                      type="number"
                      value={formData.benchmarks.bronze}
                      onChange={e => setFormData({ ...formData, benchmarks: { ...formData.benchmarks, bronze: Number(e.target.value) } })}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}>Silver Tier</span>
                    <input
                      type="number"
                      value={formData.benchmarks.silver}
                      onChange={e => setFormData({ ...formData, benchmarks: { ...formData.benchmarks, silver: Number(e.target.value) } })}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#F59E0B' }}>Gold Tier</span>
                    <input
                      type="number"
                      value={formData.benchmarks.gold}
                      onChange={e => setFormData({ ...formData, benchmarks: { ...formData.benchmarks, gold: Number(e.target.value) } })}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#8B5CF6' }}>Expert Tier</span>
                    <input
                      type="number"
                      value={formData.benchmarks.expert}
                      onChange={e => setFormData({ ...formData, benchmarks: { ...formData.benchmarks, expert: Number(e.target.value) } })}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Certification */}
              <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                    🏆 Institutional Certificate Available
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.certificateAvailable}
                    onChange={e => setFormData({ ...formData, certificateAvailable: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
                {formData.certificateAvailable && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Certificate Issuance Criteria
                    </label>
                    <input
                      type="text"
                      value={formData.certificateCriteria}
                      onChange={e => setFormData({ ...formData, certificateCriteria: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: STUDENT ELIGIBILITY */}
          {currentStep === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Eligible Departments */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                  Eligible Departments * (from Institution Academic Structure)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableDepartments.map(dept => {
                    const isSelected = formData.eligibleDepartments.includes(dept);
                    return (
                      <button
                        type="button"
                        key={dept}
                        onClick={() => {
                          if (isSelected) {
                            setFormData({ ...formData, eligibleDepartments: formData.eligibleDepartments.filter(d => d !== dept) });
                          } else {
                            setFormData({ ...formData, eligibleDepartments: [...formData.eligibleDepartments, dept] });
                          }
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: isSelected ? '1.5px solid #7C3AED' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'rgba(124, 58, 237, 0.15)' : 'var(--bg-input)',
                          color: isSelected ? '#7C3AED' : 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {isSelected && <Check size={12} />}
                        <span>{dept}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Eligible Years */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                    Eligible Academic Years
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['1st', '2nd', '3rd', '4th'].map(yr => {
                      const isSelected = formData.eligibleYears.includes(yr);
                      return (
                        <button
                          type="button"
                          key={yr}
                          onClick={() => {
                            if (isSelected) {
                              setFormData({ ...formData, eligibleYears: formData.eligibleYears.filter(y => y !== yr) });
                            } else {
                              setFormData({ ...formData, eligibleYears: [...formData.eligibleYears, yr] });
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid #3B82F6' : '1px solid var(--border-subtle)',
                            background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
                            color: isSelected ? '#3B82F6' : 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {yr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Minimum CGPA Requirement
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.minCgpa}
                    onChange={e => setFormData({ ...formData, minCgpa: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Required Previous Skills */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                  Required Previous Skills (Prerequisites)
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="e.g. C Programming, Python..."
                    value={newPrereqSkill}
                    onChange={e => setNewPrereqSkill(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPrereqSkill.trim()) {
                        setFormData({ ...formData, requiredPreviousSkills: [...formData.requiredPreviousSkills, newPrereqSkill.trim()] });
                        setNewPrereqSkill('');
                      }
                    }}
                    style={{ padding: '8px 14px', borderRadius: '8px', background: '#7C3AED', color: '#FFFFFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {formData.requiredPreviousSkills.map((sk, idx) => (
                    <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>
                      {sk}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFormData({ ...formData, requiredPreviousSkills: formData.requiredPreviousSkills.filter((_, i) => i !== idx) })} />
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                  Application Deadline *
                </label>
                <input
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={e => setFormData({ ...formData, applicationDeadline: e.target.value, enrollmentDeadline: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {/* STEP 7: INDUSTRY VISIBILITY */}
          {currentStep === 7 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                padding: '16px',
                borderRadius: '14px',
                background: formData.industryVisible ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-input)',
                border: formData.industryVisible ? '1.5px solid #3B82F6' : '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 4px' }}>
                    Make Skill & Verified Outcomes Visible to Industry / Companies
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    Permit authenticated enterprise recruiters to discover certified students on the Sovereign Ledger.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.industryVisible}
                  onChange={e => setFormData({ ...formData, industryVisible: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              {formData.industryVisible && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '10px' }}>
                    Select Student Information Shared with Industry:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { key: 'skillName', label: 'Skill Name & Curriculum' },
                      { key: 'completionStatus', label: 'Completion Status' },
                      { key: 'benchmark', label: 'Achieved Benchmark Level' },
                      { key: 'assessmentScore', label: 'Proctored Assessment Score' },
                      { key: 'projects', label: 'Completed Capstone Projects' },
                      { key: 'certification', label: 'Official Institutional Certificate' },
                      { key: 'relatedSkills', label: 'Related Core Competencies' }
                    ].map(f => {
                      const isChecked = formData.sharedFields.includes(f.key);
                      return (
                        <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setFormData({ ...formData, sharedFields: formData.sharedFields.filter(k => k !== f.key) });
                              } else {
                                setFormData({ ...formData, sharedFields: [...formData.sharedFields, f.key] });
                              }
                            }}
                          />
                          <span>{f.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 8: ENROLLMENT SETTINGS */}
          {currentStep === 8 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '4px' }}>
                Enrollment Workflow Type *
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ENROLLMENT_TYPES.map(eType => {
                  const isSelected = formData.enrollmentType === eType.type;
                  return (
                    <div
                      key={eType.type}
                      onClick={() => setFormData({ ...formData, enrollmentType: eType.type })}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #7C3AED' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'var(--bg-input)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: isSelected ? '#7C3AED' : 'var(--text-heading)' }}>
                          {eType.label}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {eType.desc}
                        </div>
                      </div>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: isSelected ? '5px solid #7C3AED' : '2px solid var(--border-subtle)',
                        background: '#FFFFFF'
                      }} />
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '6px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Seat Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.seatLimit}
                    onChange={e => setFormData({ ...formData, seatLimit: Number(e.target.value), maxStudents: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Enrollment Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.enrollmentDeadline}
                    onChange={e => setFormData({ ...formData, enrollmentDeadline: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.waitlistEnabled}
                    onChange={e => setFormData({ ...formData, waitlistEnabled: e.target.checked })}
                  />
                  <span>Enable Waitlist when Seats Full</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.autoEnrollEligible}
                    onChange={e => setFormData({ ...formData, autoEnrollEligible: e.target.checked })}
                  />
                  <span>Auto-enroll 100% Eligible Students</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 9: NOTIFICATIONS */}
          {currentStep === 9 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Configure automated student notifications dispatched through the existing SkillNexus notification engine:
              </p>

              {[
                { key: 'notifyOnPublish', label: '🔔 Notify Eligible Students upon Publishing', desc: 'Dispatches high-priority "New Skill Available" alert with 1-click details link.' },
                { key: 'notifyEnrollmentConfirmation', label: '✓ Enrollment Confirmation', desc: 'Alerts student immediately when approved or enrolled.' },
                { key: 'notifySessionReminder', label: '⏰ Upcoming Session & Class Reminders', desc: 'Notifies enrolled cohort 24h prior to live session dates.' },
                { key: 'notifyAssessmentReminder', label: '📝 Proctored Assessment Reminders', desc: 'Reminds enrolled students to take benchmark assessment.' },
                { key: 'notifyCourseCompletion', label: '🏆 Certificate & Benchmark Announcement', desc: 'Sends celebratory badge and cryptographic credential notification.' }
              ].map(n => (
                <div
                  key={n.key}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                      {n.label}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {n.desc}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData[n.key]}
                    onChange={e => setFormData({ ...formData, [n.key]: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* STEP 10: PREVIEW & PUBLISH */}
          {currentStep === 10 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Preview Card */}
              <div style={{
                padding: '22px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(6, 182, 212, 0.06) 100%)',
                border: '1.5px solid rgba(124, 58, 237, 0.3)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.15)', color: '#7C3AED', fontSize: '11px', fontWeight: 800 }}>
                        {formData.category}
                      </span>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', fontSize: '11px', fontWeight: 800 }}>
                        {formData.level}
                      </span>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4', fontSize: '11px', fontWeight: 800 }}>
                        {formData.mode}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-heading)', margin: 0 }}>
                      {formData.name || 'Untitled Skill'}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                      Offered by {institution?.institutionName || 'Institution'} • Instructor: {formData.instructorName}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SEATS AVAILABLE</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                      {formData.seatLimit} Seats
                    </div>
                  </div>
                </div>

                <div style={{ margin: '14px 0', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {formData.shortDescription}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '12px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DURATION</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{formData.duration}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HOURS</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{formData.totalHours}h</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ENROLLMENT</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#7C3AED' }}>{formData.enrollmentType}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CERTIFICATION</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#10B981' }}>{formData.certificateAvailable ? 'Available' : 'None'}</div>
                  </div>
                </div>

                <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <strong>Eligible Departments:</strong> {formData.eligibleDepartments.join(', ')} • <strong>Years:</strong> {formData.eligibleYears.join(', ')} • <strong>Min CGPA:</strong> {formData.minCgpa || 'None'}
                </div>
              </div>

              <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '12.5px', color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span>Ready to publish. Publishing will automatically notify eligible campus students and open enrollment.</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-input, rgba(255,255,255,0.4))'
        }}>
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSave(false)}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                background: 'none',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Save Draft
            </button>

            {currentStep < 10 ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
                }}
              >
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSave(true)}
                style={{
                  padding: '9px 24px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Sparkles size={16} />
                <span>{loading ? 'Publishing...' : 'Publish Skill Offering'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
