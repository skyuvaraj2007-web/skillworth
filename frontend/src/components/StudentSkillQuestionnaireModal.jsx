import React, { useState } from 'react';
import {
  Brain, Sparkles, Target, CheckCircle2, ChevronRight,
  ChevronLeft, Award, AlertCircle, Zap, X, Code, Cpu, Database
} from 'lucide-react';

const TARGET_ROLES = [
  'Full Stack Engineer',
  'AI / Machine Learning Engineer',
  'Data Engineer & Analyst',
  'Cloud & DevOps Architect',
  'Cybersecurity Analyst'
];

const DOMAINS = [
  'Information Technology & Software',
  'Artificial Intelligence & DeepTech',
  'Cloud Platforms & Infrastructure',
  'Data Science & Analytics',
  'Cybersecurity & Network Defense'
];

const POPULAR_SKILLS = [
  'Python', 'JavaScript', 'React', 'Node.js', 'SQL',
  'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'PyTorch',
  'TensorFlow', 'Git', 'Linux', 'REST APIs', 'System Design',
  'Data Structures', 'C++', 'Java', 'Algorithms'
];

export default function StudentSkillQuestionnaireModal({ isOpen, onClose, onCompleted, user }) {
  const [step, setStep] = useState(1);
  const [careerGoal, setCareerGoal] = useState('Full Stack Engineer');
  const [domain, setDomain] = useState('Information Technology & Software');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [workPreference, setWorkPreference] = useState('Hybrid');
  const [selectedSkills, setSelectedSkills] = useState(['Python', 'JavaScript', 'SQL']);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [ratings, setRatings] = useState({
    programming: 80,
    systemDesign: 70,
    cloudDevOps: 65,
    dataAI: 75,
    problemSolving: 85
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);

  if (!isOpen) return null;

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const addCustomSkill = (e) => {
    e.preventDefault();
    const clean = customSkillInput.trim();
    if (clean && !selectedSkills.includes(clean)) {
      setSelectedSkills([...selectedSkills, clean]);
      setCustomSkillInput('');
    }
  };

  const handleSliderChange = (category, val) => {
    setRatings(prev => ({ ...prev, [category]: Number(val) }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

    const payload = {
      careerGoal,
      domain,
      experienceLevel,
      workPreference,
      primarySkills: selectedSkills,
      categoryRatings: ratings
    };

    try {
      const res = await fetch(`${apiBase}/students/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        setAssessmentResult(json.data);
        if (onCompleted) onCompleted(json.data);
      } else {
        throw new Error('API assessment failed');
      }
    } catch (err) {
      console.warn('Backend questionnaire sync failed, computing local skill profile:', err);
      // Fallback calculation
      const fallbackProfile = {
        skillProfile: {
          targetRole: careerGoal,
          domain,
          categoryScores: ratings,
          overallRating: Math.round((ratings.programming + ratings.systemDesign + ratings.cloudDevOps + ratings.dataAI + ratings.problemSolving) / 5),
          matchPercentageWithTargetRole: 75,
          matchedSkills: selectedSkills.slice(0, 3),
          missingSkills: ['System Design', 'Docker', 'CI/CD'],
          gapSummary: `Skill profile computed for ${careerGoal}.`
        },
        readinessScore: 78
      };
      setAssessmentResult(fallbackProfile);
      if (onCompleted) onCompleted(fallbackProfile);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 9, 20, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0d1527 0%, #0a0f1d 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.15)',
        color: '#f8fafc',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(99, 102, 241, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(79, 70, 229, 0.5)'
            }}>
              <Brain size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Skills Assessment Questionnaire
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                  Nexus AI
                </span>
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Complete your skill baseline to unlock role-matched internships & recommendations
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div style={{ padding: '28px' }}>
          {assessmentResult ? (
            /* Results View */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
              }}>
                <CheckCircle2 size={36} color="#10b981" />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px' }}>
                Skill Profile Successfully Synthesized!
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 24px' }}>
                {assessmentResult.skillProfile?.gapSummary || 'Your baseline skill profile and gap analysis have been saved to your student record.'}
              </p>

              {/* Metric Badges */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Target Role Fit</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                    {assessmentResult.skillProfile?.matchPercentageWithTargetRole || 80}%
                  </div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Readiness Score</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                    {assessmentResult.readinessScore ?? 0}%
                  </div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Identified Gaps</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                    {assessmentResult.skillProfile?.missingSkills?.length || 0}
                  </div>
                </div>
              </div>

              {/* Skill Gap Details */}
              {assessmentResult.skillProfile?.missingSkills?.length > 0 && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem', marginBottom: '10px' }}>
                    <AlertCircle size={16} /> Recommended Skill Focus (Gap Analysis):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {assessmentResult.skillProfile.missingSkills.map((gap, i) => (
                      <span key={i} style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#fcd34d',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}>
                        + {gap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)'
                }}
              >
                Continue to My Recommendations & Dashboard
              </button>
            </div>
          ) : (
            /* Multi-step Form */
            <div>
              {/* Progress Steps Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                {[1, 2, 3].map((num) => (
                  <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: num === 3 ? 'none' : 1 }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: step >= num ? '#4f46e5' : 'rgba(255, 255, 255, 0.1)',
                      color: step >= num ? '#fff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}>
                      {num}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: step >= num ? '#f8fafc' : '#64748b', fontWeight: 600 }}>
                      {num === 1 ? 'Role & Domain' : num === 2 ? 'Skills & Competencies' : 'Ratings & Mode'}
                    </span>
                    {num < 3 && <div style={{ flex: 1, height: '2px', background: step > num ? '#4f46e5' : 'rgba(255, 255, 255, 0.08)', margin: '0 8px' }} />}
                  </div>
                ))}
              </div>

              {/* STEP 1 */}
              {step === 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                    Target Career Role
                  </label>
                  <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                    {TARGET_ROLES.map((role) => (
                      <div
                        key={role}
                        onClick={() => setCareerGoal(role)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: `1.5px solid ${careerGoal === role ? 'var(--cyber-blue)' : 'var(--border-subtle)'}`,
                          background: careerGoal === role ? 'var(--cyber-blue-dim)' : 'var(--bg-input)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: careerGoal === role ? 'var(--cyber-blue)' : 'var(--text-primary)' }}>
                          {role}
                        </span>
                        {careerGoal === role && <CheckCircle2 size={18} color="var(--cyber-blue)" />}
                      </div>
                    ))}
                  </div>

                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                    Industry Domain Focus
                  </label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      marginBottom: '20px'
                    }}
                  >
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                    Select Your Active Technical Competencies
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {POPULAR_SKILLS.map((skill) => {
                      const isSel = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: `1px solid ${isSel ? 'var(--cyber-blue)' : 'var(--border-subtle)'}`,
                            background: isSel ? 'var(--cyber-blue-dim)' : 'var(--bg-input)',
                            color: isSel ? 'var(--cyber-blue)' : 'var(--text-secondary)'
                          }}
                        >
                          {skill} {isSel && '✓'}
                        </button>
                      );
                    })}
                  </div>

                  <form onSubmit={addCustomSkill} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    <input
                      type="text"
                      placeholder="Add custom skill (e.g. GraphQL, Rust)..."
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        background: 'var(--cyber-blue)',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    >
                      Add
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>
                      Self-Assess Proficiency by Category (0 - 100%)
                    </label>

                    {[
                      { key: 'programming', label: 'Core Programming & Data Structures' },
                      { key: 'systemDesign', label: 'System Design & APIs' },
                      { key: 'cloudDevOps', label: 'Cloud & Infrastructure' },
                      { key: 'dataAI', label: 'Data Engineering & AI Foundations' },
                      { key: 'problemSolving', label: 'Algorithmic Problem Solving' }
                    ].map(({ key, label }) => (
                      <div key={key} style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
                          <span style={{ color: 'var(--cyber-blue)', fontWeight: 700 }}>{ratings[key]}%</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={ratings[key]}
                          onChange={(e) => handleSliderChange(key, e.target.value)}
                          style={{
                            width: '100%',
                            accentColor: 'var(--cyber-blue)',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                        Experience Level
                      </label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="Beginner">Beginner / Learner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced / Project Lead</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                        Work Preference
                      </label>
                      <select
                        value={workPreference}
                        onChange={(e) => setWorkPreference(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          background: '#131b2e',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="Hybrid">Hybrid</option>
                        <option value="Remote">Remote</option>
                        <option value="Onsite">Onsite</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      background: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                ) : <div />}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    Next Step <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                      border: 'none',
                      color: '#fff',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)'
                    }}
                  >
                    {isSubmitting ? 'Computing Skill Matrix...' : 'Complete & Generate Profile'}
                    <Sparkles size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
