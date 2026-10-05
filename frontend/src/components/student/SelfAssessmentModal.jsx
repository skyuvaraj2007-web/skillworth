import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, ShieldAlert, Award, BookOpen } from 'lucide-react';

const CATEGORIES = [
  'Programming',
  'Web Development',
  'Data Science & AI',
  'Cloud & DevOps',
  'Database Systems',
  'Cyber Security',
  'Mobile Development',
  'Soft Skills & Communication',
  'Core Engineering'
];

const LEVELS = [
  { value: 'Beginner', desc: 'Familiar with core concepts, learning fundamentals' },
  { value: 'Elementary', desc: 'Can write basic scripts and solve simple problems' },
  { value: 'Intermediate', desc: 'Comfortable building features and troubleshooting' },
  { value: 'Advanced', desc: 'Proficient in complex architectures and best practices' },
  { value: 'Expert', desc: 'Deep mastery, system design, performance optimization' }
];

const CONFIDENCE_LEVELS = ['Low', 'Medium', 'High'];

export default function SelfAssessmentModal({ isOpen, onClose, onSaved, initialData = null }) {
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('Programming');
  const [level, setLevel] = useState('Intermediate');
  const [confidence, setConfidence] = useState('Medium');
  const [experience, setExperience] = useState('1 year');
  const [technologies, setTechnologies] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setSkillName(initialData.skillName || '');
      setCategory(initialData.category || 'Programming');
      setLevel(initialData.level || 'Intermediate');
      setConfidence(initialData.confidence || 'Medium');
      setExperience(initialData.experience || '1 year');
      setTechnologies(Array.isArray(initialData.technologies) ? initialData.technologies.join(', ') : '');
      setDescription(initialData.description || '');
    } else {
      setSkillName('');
      setCategory('Programming');
      setLevel('Intermediate');
      setConfidence('Medium');
      setExperience('1 year');
      setTechnologies('');
      setDescription('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!skillName.trim()) {
      setError('Please enter a skill name.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        id: initialData?.id || undefined,
        skillName: skillName.trim(),
        category,
        level,
        confidence,
        experience: experience.trim() || 'Self-Taught',
        technologies: technologies.split(',').map(t => t.trim()).filter(Boolean),
        description: description.trim()
      };

      await onSaved(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save self-assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(4, 9, 20, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card, #0c1427)',
        border: '1px solid var(--border-subtle, rgba(0, 242, 254, 0.2))',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        animation: 'modalSlideUp 0.25s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.05) 0%, transparent 100%)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--cyber-cyan, #00f2fe)" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
                {initialData ? 'Edit Self-Assessed Skill' : 'Self-Assess Skill'}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
              Record your personal appraisal of your current technical capability.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Critical Distinction Notice */}
        <div style={{
          padding: '12px 24px',
          background: 'rgba(245, 158, 11, 0.08)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <ShieldAlert size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '12px', color: '#fcd34d', lineHeight: 1.5 }}>
            <strong>Subjective Self-Assessment:</strong> This records what you believe your level is. It does <em>not</em> grant verified proficiency. Verified proficiency requires demonstrated evidence via completed lessons, practice accuracy, assessments, and capstone projects.
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Skill Name & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
                Skill Name *
              </label>
              <input
                type="text"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g. Python, Docker, React"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'white',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#0c1427',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'white',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Level & Confidence */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
                Self-Assessed Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#0c1427',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'white',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              >
                {LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.value}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
                Confidence Level
              </label>
              <select
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#0c1427',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'white',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              >
                {CONFIDENCE_LEVELS.map(c => (
                  <option key={c} value={c}>{c} Confidence</option>
                ))}
              </select>
            </div>
          </div>

          {/* Experience & Related Technologies */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
                Experience / Exposure
              </label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 1 year, 6 months, 3 projects"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'white',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
                Associated Technologies
              </label>
              <input
                type="text"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                placeholder="e.g. Pandas, NumPy, FastAPI"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'white',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
              Experience Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you have built or learned with this skill..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'white',
                fontSize: '13px',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '8px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                border: 'none',
                color: '#060B14',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(0, 242, 254, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={14} />
              <span>{isSubmitting ? 'Saving...' : (initialData ? 'Update Self-Assessment' : 'Save Self-Assessment')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
