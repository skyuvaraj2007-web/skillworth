import React, { useState, useEffect } from 'react';
import {
  Brain,
  Search,
  Plus,
  Filter,
  CheckCircle,
  Code,
  CheckSquare,
  HelpCircle,
  Hash,
  Sparkles,
  X,
  ChevronRight,
  BookOpen,
  Tag
} from 'lucide-react';
import industryAssessmentService from '../../services/industryAssessmentService';

export default function QuestionBankDrawer({ isOpen, onClose, onSelectQuestions, selectedQuestionIds = [] }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set(selectedQuestionIds));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savingNewQ, setSavingNewQ] = useState(false);

  // New Question Form State
  const [newQ, setNewQ] = useState({
    title: '',
    category: 'Programming',
    questionType: 'PROGRAMMING',
    difficulty: 'Intermediate',
    marks: 10,
    skills: ['Algorithms', 'JavaScript'],
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    multipleAnswers: [],
    numericalAnswer: '',
    numericalTolerance: 0,
    explanation: '',
    programmingLanguage: 'JavaScript',
    starterCode: 'function solution(input) {\n  // Implement solution\n}',
    inputDescription: '',
    outputDescription: '',
    constraints: '',
    testCases: [{ input: '1, 2', expectedOutput: '3', isHidden: false }]
  });

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
    }
  }, [isOpen, categoryFilter, difficultyFilter, typeFilter, searchQuery]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await industryAssessmentService.getQuestionBank({
        category: categoryFilter,
        difficulty: difficultyFilter,
        questionType: typeFilter,
        search: searchQuery
      });
      setQuestions(data);
    } catch (err) {
      console.error('[QuestionBank] load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (q) => {
    const next = new Set(selectedIds);
    if (next.has(q.id)) {
      next.delete(q.id);
    } else {
      next.add(q.id);
    }
    setSelectedIds(next);
  };

  const handleConfirmSelection = () => {
    const chosen = questions.filter(q => selectedIds.has(q.id));
    onSelectQuestions(chosen);
    onClose();
  };

  const handleSaveNewQuestion = async (e) => {
    e.preventDefault();
    if (!newQ.questionText.trim()) return;
    setSavingNewQ(true);
    try {
      const saved = await industryAssessmentService.saveToQuestionBank(newQ);
      setQuestions(prev => [saved, ...prev]);
      setSelectedIds(prev => new Set([...prev, saved.id]));
      setShowCreateModal(false);
      // Reset form
      setNewQ({
        title: '',
        category: 'Programming',
        questionType: 'PROGRAMMING',
        difficulty: 'Intermediate',
        marks: 10,
        skills: ['Algorithms', 'JavaScript'],
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        multipleAnswers: [],
        numericalAnswer: '',
        numericalTolerance: 0,
        explanation: '',
        programmingLanguage: 'JavaScript',
        starterCode: 'function solution(input) {\n  // Implement solution\n}',
        inputDescription: '',
        outputDescription: '',
        constraints: '',
        testCases: [{ input: '1, 2', expectedOutput: '3', isHidden: false }]
      });
    } catch (err) {
      alert(err.message || 'Failed to save question');
    } finally {
      setSavingNewQ(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border-l border-slate-700/60 shadow-2xl flex flex-col h-full overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Enterprise Question Bank
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  {questions.length} Questions
                </span>
              </h2>
              <p className="text-xs text-slate-400">Search, curate, and reuse verified technical & reasoning challenges</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Question</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="Programming">Programming</option>
            <option value="Logical Reasoning">Logical Reasoning</option>
            <option value="Aptitude">Aptitude</option>
            <option value="Web Development">Web Development</option>
            <option value="Data Science">Data Science</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Types</option>
            <option value="MCQ">Single MCQ</option>
            <option value="MULTIPLE_ANSWER">Multiple Answer</option>
            <option value="NUMERICAL">Numerical</option>
            <option value="PROGRAMMING">Programming / Code</option>
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Hard">Hard / Advanced</option>
          </select>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading verified question bank...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/20 rounded-2xl border border-slate-800 border-dashed">
              <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium">No questions matched your filters</p>
              <p className="text-xs text-slate-500 mt-1">Try broadening your search or create a new question challenge</p>
            </div>
          ) : (
            questions.map((q) => {
              const isSelected = selectedIds.has(q.id);
              const qSkills = Array.isArray(q.skills) ? q.skills : (typeof q.skills === 'string' ? JSON.parse(q.skills || '[]') : []);

              return (
                <div
                  key={q.id}
                  onClick={() => toggleSelect(q)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        q.question_type === 'PROGRAMMING' || q.questionType === 'PROGRAMMING'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : q.question_type === 'MULTIPLE_ANSWER'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : q.question_type === 'NUMERICAL'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {q.question_type || q.questionType || 'MCQ'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {q.difficulty || 'Intermediate'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700/60 text-slate-400">
                        {q.marks || 5} Marks
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-600 bg-slate-800'
                      }`}>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-white mt-2 leading-snug">
                    {q.question_text || q.questionText}
                  </p>

                  {/* Skills badges */}
                  {qSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {qSkills.map((sk, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center space-x-1">
                          <Tag className="w-2.5 h-2.5 text-indigo-400" />
                          <span>{sk}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Programming preview */}
                  {(q.question_type === 'PROGRAMMING' || q.questionType === 'PROGRAMMING') && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 flex items-center justify-between">
                      <span>Language: {q.programming_language || 'JavaScript'}</span>
                      <span className="text-slate-500 text-[11px]">Sandboxed Unit Test Evaluation</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span className="text-indigo-400 font-bold">{selectedIds.size}</span> question(s) selected
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={selectedIds.size === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all flex items-center space-x-2"
            >
              <span>Add Selected Questions</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create Question Modal Sub-view */}
        {showCreateModal && (
          <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col overflow-y-auto p-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Add Reusable Question to Question Bank
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewQuestion} className="space-y-4 max-w-3xl mx-auto w-full pb-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">Question Type</label>
                  <select
                    value={newQ.questionType}
                    onChange={(e) => setNewQ({ ...newQ, questionType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="MCQ">Single Choice (MCQ)</option>
                    <option value="MULTIPLE_ANSWER">Multiple Answer</option>
                    <option value="NUMERICAL">Numerical</option>
                    <option value="PROGRAMMING">Programming Challenge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={newQ.category}
                    onChange={(e) => setNewQ({ ...newQ, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                    placeholder="e.g. Programming, Algorithms"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">Difficulty & Marks</label>
                  <div className="flex space-x-2">
                    <select
                      value={newQ.difficulty}
                      onChange={(e) => setNewQ({ ...newQ, difficulty: e.target.value })}
                      className="w-1/2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Hard">Hard</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={newQ.marks}
                      onChange={(e) => setNewQ({ ...newQ, marks: Number(e.target.value) })}
                      className="w-1/2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                      placeholder="Marks"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Question Statement</label>
                <textarea
                  rows="3"
                  value={newQ.questionText}
                  onChange={(e) => setNewQ({ ...newQ, questionText: e.target.value })}
                  placeholder="Describe the challenge or problem in detail..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  required
                />
              </div>

              {/* Conditional based on questionType */}
              {newQ.questionType === 'MCQ' && (
                <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                  <label className="block text-xs font-semibold text-slate-300">Options & Correct Answer</label>
                  {newQ.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={newQ.correctAnswer === opt && opt !== ''}
                        onChange={() => setNewQ({ ...newQ, correctAnswer: opt })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newQ.options];
                          updated[idx] = e.target.value;
                          setNewQ({ ...newQ, options: updated });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                        required
                      />
                    </div>
                  ))}
                </div>
              )}

              {newQ.questionType === 'NUMERICAL' && (
                <div className="grid grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Target Numerical Answer</label>
                    <input
                      type="number"
                      step="any"
                      value={newQ.numericalAnswer}
                      onChange={(e) => setNewQ({ ...newQ, numericalAnswer: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                      placeholder="e.g. 42.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Tolerance (+/-)</label>
                    <input
                      type="number"
                      step="any"
                      value={newQ.numericalTolerance}
                      onChange={(e) => setNewQ({ ...newQ, numericalTolerance: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                      placeholder="e.g. 0.1"
                    />
                  </div>
                </div>
              )}

              {newQ.questionType === 'PROGRAMMING' && (
                <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1">Programming Language</label>
                      <select
                        value={newQ.programmingLanguage}
                        onChange={(e) => setNewQ({ ...newQ, programmingLanguage: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                      >
                        <option value="JavaScript">JavaScript (Node.js Sandbox)</option>
                        <option value="Python">Python</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1">Constraints</label>
                      <input
                        type="text"
                        value={newQ.constraints}
                        onChange={(e) => setNewQ({ ...newQ, constraints: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                        placeholder="e.g. 1 <= n <= 10^5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Starter Code Template</label>
                    <textarea
                      rows="3"
                      value={newQ.starterCode}
                      onChange={(e) => setNewQ({ ...newQ, starterCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-700"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-300">Test Cases (Auto-Graded)</label>
                      <button
                        type="button"
                        onClick={() => setNewQ({
                          ...newQ,
                          testCases: [...newQ.testCases, { input: '', expectedOutput: '', isHidden: false }]
                        })}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Test Case</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {newQ.testCases.map((tc, idx) => (
                        <div key={idx} className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                          <input
                            type="text"
                            placeholder="Input (e.g. [1, 2])"
                            value={tc.input}
                            onChange={(e) => {
                              const updated = [...newQ.testCases];
                              updated[idx].input = e.target.value;
                              setNewQ({ ...newQ, testCases: updated });
                            }}
                            className="w-2/5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Expected Output (e.g. 3)"
                            value={tc.expectedOutput}
                            onChange={(e) => {
                              const updated = [...newQ.testCases];
                              updated[idx].expectedOutput = e.target.value;
                              setNewQ({ ...newQ, testCases: updated });
                            }}
                            className="w-2/5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                            required
                          />
                          <label className="flex items-center space-x-1.5 text-xs text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tc.isHidden}
                              onChange={(e) => {
                                const updated = [...newQ.testCases];
                                updated[idx].isHidden = e.target.checked;
                                setNewQ({ ...newQ, testCases: updated });
                              }}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Hidden</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewQ}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  {savingNewQ ? 'Saving...' : 'Save to Question Bank'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
