import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  BookOpen,
  Code,
  Brain,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  FileCode,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Layers,
  X
} from 'lucide-react';
import { collaborationService } from '../../services/collaborationService';

export default function InstitutionAssessmentTests({ onShowToast }) {
  const [assessments, setAssessments] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);

  // Form States for New Assessment
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assessmentType, setAssessmentType] = useState('PROGRAMMING');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingMarks, setPassingMarks] = useState(50);
  const [totalMarks, setTotalMarks] = useState(100);

  // Form States for New Question
  const [qText, setQText] = useState('');
  const [qLangId, setQLangId] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState('A');
  const [qMarks, setQMarks] = useState(10);
  const [qSnippet, setQSnippet] = useState('');
  const [qExplanation, setQExplanation] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [assRes, langRes] = await Promise.all([
        collaborationService.getInstitutionAssessments(),
        collaborationService.getProgrammingLanguages()
      ]);
      if (assRes.success) setAssessments(assRes.data || []);
      if (langRes.success) {
        setLanguages(langRes.data || []);
        if (langRes.data?.length > 0) {
          setQLangId(langRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load institution assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await collaborationService.createAssessment({
        title,
        description,
        assessmentType,
        durationMinutes: parseInt(durationMinutes, 10),
        passingMarks: parseInt(passingMarks, 10),
        totalMarks: parseInt(totalMarks, 10)
      });
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Assessment Created', message: `"${title}" has been saved to PostgreSQL.`, type: 'success' });
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        loadData();
      } else {
        if (onShowToast) onShowToast({ title: 'Creation Failed', message: res.message || 'Error creating assessment', type: 'error' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Creation Error', message: err.message, type: 'error' });
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedAssessment || !qText.trim()) return;

    try {
      const options = [
        { key: 'A', text: qOptA || 'Option A' },
        { key: 'B', text: qOptB || 'Option B' },
        { key: 'C', text: qOptC || 'Option C' },
        { key: 'D', text: qOptD || 'Option D' }
      ];

      const res = await collaborationService.addAssessmentQuestion(selectedAssessment.id, {
        questionText: qText,
        programmingLanguageId: selectedAssessment.assessment_type === 'PROGRAMMING' ? qLangId : null,
        options,
        correctAnswer: qCorrect,
        marks: parseInt(qMarks, 10) || 10,
        explanation: qExplanation,
        codeSnippet: qSnippet
      });

      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Question Added', message: 'Question saved and linked to assessment in PostgreSQL.', type: 'success' });
        setShowAddQuestionModal(false);
        setQText('');
        setQOptA('');
        setQOptB('');
        setQOptC('');
        setQOptD('');
        setQSnippet('');
        setQExplanation('');
        loadData();
      } else {
        if (onShowToast) onShowToast({ title: 'Failed to Add Question', message: res.message, type: 'error' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handlePublish = async (assessment) => {
    try {
      const res = await collaborationService.publishAssessment(assessment.id);
      if (res.success) {
        if (onShowToast) onShowToast({ title: 'Assessment Published', message: `"${assessment.title}" is now available to eligible students.`, type: 'success' });
        loadData();
      } else {
        if (onShowToast) onShowToast({ title: 'Publishing Failed', message: res.message, type: 'error' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const filteredAssessments = assessments.filter(a => {
    if (filterType === 'ALL') return true;
    return a.assessment_type === filterType;
  });

  return (
    <div style={{ padding: '24px', color: '#e2e8f0', minHeight: '100%' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
        padding: '24px',
        borderRadius: '14px',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award style={{ color: '#38bdf8', width: '28px', height: '28px' }} />
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Institutional Assessment Engine
            </h1>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Authoritative testing framework for Logical Reasoning, Aptitude, and Language-Gated Programming assessments.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: '#fff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
          }}
        >
          <Plus style={{ width: '18px', height: '18px' }} />
          Create Assessment
        </button>
      </div>

      {/* Filter Tabs & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {['ALL', 'LOGICAL_REASONING', 'APTITUDE', 'PROGRAMMING'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              style={{
                background: filterType === t ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                color: filterType === t ? '#38bdf8' : '#94a3b8',
                border: filterType === t ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
          Total Tests: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{filteredAssessments.length}</span>
        </div>
      </div>

      {/* Assessments Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading assessments from PostgreSQL...</div>
      ) : filteredAssessments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '12px',
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <HelpCircle style={{ width: '40px', height: '40px', color: '#64748b', margin: '0 auto 12px auto' }} />
          <h3 style={{ color: '#e2e8f0', margin: '0 0 6px 0' }}>No Assessments Found</h3>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>
            Click "Create Assessment" to deploy standard Aptitude, Logical Reasoning, or Programming tests.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredAssessments.map((a) => (
            <div
              key={a.id}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, border-color 0.2s',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    letterSpacing: '0.05em',
                    background: a.assessment_type === 'PROGRAMMING'
                      ? 'rgba(168, 85, 247, 0.15)'
                      : a.assessment_type === 'LOGICAL_REASONING'
                      ? 'rgba(236, 72, 153, 0.15)'
                      : 'rgba(34, 197, 94, 0.15)',
                    color: a.assessment_type === 'PROGRAMMING'
                      ? '#c084fc'
                      : a.assessment_type === 'LOGICAL_REASONING'
                      ? '#f472b6'
                      : '#4ade80',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {a.assessment_type || 'TEST'}
                  </span>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: a.status === 'PUBLISHED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.15)',
                    color: a.status === 'PUBLISHED' ? '#4ade80' : '#facc15'
                  }}>
                    {a.status || 'DRAFT'}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                  {a.title}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0', minHeight: '36px', lineHeight: '1.4' }}>
                  {a.description || 'Institutional skill benchmarking examination.'}
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  background: 'rgba(30, 41, 59, 0.5)',
                  padding: '10px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Questions</span>
                    <strong style={{ color: '#f1f5f9', fontSize: '14px' }}>{a.question_count || 0}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Duration</span>
                    <strong style={{ color: '#f1f5f9', fontSize: '14px' }}>{a.duration_minutes || 60}m</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Total Marks</span>
                    <strong style={{ color: '#f1f5f9', fontSize: '14px' }}>{a.total_marks || 100}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => {
                    setSelectedAssessment(a);
                    setShowAddQuestionModal(true);
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Plus style={{ width: '15px', height: '15px' }} />
                  Add Question
                </button>

                {a.status !== 'PUBLISHED' && (
                  <button
                    onClick={() => handlePublish(a)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Send style={{ width: '14px', height: '14px' }} />
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE ASSESSMENT MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: 700 }}>
                Deploy New Assessment Test
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateAssessment}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', marginBottom: '6px' }}>
                  Assessment Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Data Structures & Algorithms Benchmark"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', marginBottom: '6px' }}>
                  Assessment Type
                </label>
                <select
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '14px'
                  }}
                >
                  <option value="PROGRAMMING">PROGRAMMING (Course-Language Gated)</option>
                  <option value="LOGICAL_REASONING">LOGICAL REASONING (Common to Institution)</option>
                  <option value="APTITUDE">APTITUDE (Common to Institution)</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Provide syllabus, instructions, and objectives..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '14px',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>
                    Duration (Min)
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      background: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      background: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      background: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD QUESTION MODAL */}
      {showAddQuestionModal && selectedAssessment && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: 700 }}>
                  Add Question to "{selectedAssessment.title}"
                </h3>
                <span style={{ fontSize: '12px', color: '#38bdf8' }}>
                  Assessment Type: {selectedAssessment.assessment_type}
                </span>
              </div>
              <button
                onClick={() => setShowAddQuestionModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleAddQuestion}>
              {/* Programming Language Dropdown (Shown only if PROGRAMMING assessment) */}
              {selectedAssessment.assessment_type === 'PROGRAMMING' && (
                <div style={{
                  marginBottom: '16px',
                  background: 'rgba(168, 85, 247, 0.1)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(168, 85, 247, 0.25)'
                }}>
                  <label style={{ display: 'block', fontSize: '12.5px', color: '#c084fc', fontWeight: 700, marginBottom: '6px' }}>
                    Target Programming Language *
                  </label>
                  <select
                    required
                    value={qLangId}
                    onChange={(e) => setQLangId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#1e293b',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#f8fafc',
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                  >
                    {languages.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Note: Students will only receive this question if their enrolled course is linked to this language.
                  </span>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', marginBottom: '6px' }}>
                  Question Text *
                </label>
                <textarea
                  required
                  rows={3}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="e.g. What is the time complexity of searching an element in a balanced binary search tree?"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '14px',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Code Snippet (Optional) */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', marginBottom: '6px' }}>
                  Code Snippet (Optional)
                </label>
                <textarea
                  rows={3}
                  value={qSnippet}
                  onChange={(e) => setQSnippet(e.target.value)}
                  placeholder="def binary_search(arr, target): ..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#0a0f1d',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Multiple Choice Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>Option A</label>
                  <input
                    type="text"
                    required
                    value={qOptA}
                    onChange={(e) => setQOptA(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>Option B</label>
                  <input
                    type="text"
                    required
                    value={qOptB}
                    onChange={(e) => setQOptB(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>Option C</label>
                  <input
                    type="text"
                    required
                    value={qOptC}
                    onChange={(e) => setQOptC(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>Option D</label>
                  <input
                    type="text"
                    required
                    value={qOptD}
                    onChange={(e) => setQOptD(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Correct Option</label>
                  <select
                    value={qCorrect}
                    onChange={(e) => setQCorrect(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', fontWeight: 700, fontSize: '13px' }}
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Marks Allocated</label>
                  <input
                    type="number"
                    value={qMarks}
                    onChange={(e) => setQMarks(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Question to PostgreSQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
