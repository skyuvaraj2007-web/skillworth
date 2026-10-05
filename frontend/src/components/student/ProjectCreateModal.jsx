import React, { useState } from 'react';
import {
  X,
  Plus,
  FolderGit2,
  Code,
  Globe,
  GitBranch,
  FileText,
  Tag,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { projectService } from '../../services/projectService';

export default function ProjectCreateModal({
  isOpen,
  onClose,
  onShowToast,
  onProjectCreated
}) {
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('Lead Software Engineer');
  const [category, setCategory] = useState('FULL STACK & AI');
  const [status, setStatus] = useState('ONGOING');
  const [techStack, setTechStack] = useState('React, Node.js, PostgreSQL, Docker');
  const [skills, setSkills] = useState('Full Stack Development, API Design, Database Optimization');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [overview, setOverview] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [solution, setSolution] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      if (onShowToast) onShowToast({ title: 'Missing Title', message: 'Project title is required.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        role: role.trim() || 'Software Engineer',
        category,
        status,
        technologies: techStack.split(',').map(s => s.trim()).filter(Boolean),
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        repoUrl: repoUrl.trim(),
        demoUrl: demoUrl.trim(),
        shortDescription: overview.trim() || title.trim(),
        overview: overview.trim(),
        problemStatement: problemStatement.trim(),
        solution: solution.trim(),
        keyFeatures: keyFeatures ? keyFeatures.split('\n').map(s => s.trim()).filter(Boolean) : [],
        isCurrentProject: status === 'ONGOING'
      };

      const res = await projectService.createProject(payload);
      if (res.success) {
        if (onShowToast) {
          onShowToast({
            title: 'Project Created',
            message: `"${title}" registered in your portfolio & initial cloud sandbox initialized.`,
            type: 'success'
          });
        }
        if (onProjectCreated) onProjectCreated(res.data);
        onClose();
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({ title: 'Creation Failed', message: err.message, type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(5, 7, 15, 0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        width: '100%', maxWidth: '780px', maxHeight: '90vh',
        background: 'var(--bg-card, #0f172a)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
        borderRadius: '20px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7)', overflow: 'hidden'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(0,242,254,0.06), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(0,242,254,0.12)', color: 'var(--cyber-cyan, #00f2fe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Plus size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Add New Project Experience
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Turn your software engineering builds into verifiable corporate-ready credentials.
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', padding: '6px', borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title & Role */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Project Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Distributed Real-Time Cloud Telemetry Engine"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                  color: '#fff', fontSize: '13.5px', boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                My Role
              </label>
              <input
                type="text"
                placeholder="e.g. Lead Software Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                  color: '#fff', fontSize: '13.5px', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Category & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                  color: '#fff', fontSize: '13.5px', boxSizing: 'border-box'
                }}
              >
                <option value="FULL STACK & AI">FULL STACK & AI</option>
                <option value="GENERATIVE AI & LLMOPS">GENERATIVE AI & LLMOPS</option>
                <option value="DATA SCIENCE & BI">DATA SCIENCE & BI</option>
                <option value="CLOUD & DISTRIBUTED SYSTEMS">CLOUD & DISTRIBUTED SYSTEMS</option>
                <option value="CYBERSECURITY & INFRASTRUCTURE">CYBERSECURITY & INFRASTRUCTURE</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Development Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                  color: '#fff', fontSize: '13.5px', boxSizing: 'border-box'
                }}
              >
                <option value="ONGOING">Ongoing / In Active Development</option>
                <option value="COMPLETED">Completed</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {/* Tech Stack & Skills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cyber-cyan)', marginBottom: '6px' }}>
                Technologies (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. React, Node.js, PostgreSQL, Docker"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                  color: '#fff', fontSize: '13.5px', boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cyber-purple, #a855f7)', marginBottom: '6px' }}>
                Skills Demonstrated (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Distributed Systems, Cloud Computing"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                  color: '#fff', fontSize: '13.5px', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Links (Repo & Demo) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Repository URL (GitHub / GitLab)
              </label>
              <input
                type="url"
                placeholder="https://github.com/username/project"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                  color: '#fff', fontSize: '13.5px', boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Live Production Demo URL
              </label>
              <input
                type="url"
                placeholder="https://my-app.nexusdev.app"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                  color: '#fff', fontSize: '13.5px', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Overview / Description */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Project Overview
            </label>
            <textarea
              rows={2}
              placeholder="High-level summary of the architecture and primary goals..."
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                color: '#fff', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical'
              }}
            />
          </div>

          {/* Problem & Solution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cyber-amber, #f59e0b)', marginBottom: '6px' }}>
                Problem Statement
              </label>
              <textarea
                rows={2}
                placeholder="What challenge or inefficiency does this solve?"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                  color: '#fff', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cyber-emerald, #10b981)', marginBottom: '6px' }}>
                Solution Architecture
              </label>
              <textarea
                rows={2}
                placeholder="How was this engineered? (e.g. Ring buffer, caching, async jobs)"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)', border: '1px solid var(--border-subtle)',
                  color: '#fff', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '10px',
            borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '8px'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-cyber-ghost"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-cyber-primary"
              style={{ padding: '8px 22px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={15} />
              <span>{isSubmitting ? 'Creating...' : 'Create Project Experience'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
