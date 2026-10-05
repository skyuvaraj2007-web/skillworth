import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderGit2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Code,
  Users,
  Building,
  Tag,
  Sparkles,
  Layers,
  X,
  Eye,
  GitBranch,
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { academicService } from '../../services/academicService';

export default function ProjectDetailsExplorer({ portal = 'academic', onShowToast }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('ALL');
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await academicService.getProjects();
      if (res && res.success && Array.isArray(res.data)) {
        setProjects(res.data);
      } else if (Array.isArray(res)) {
        setProjects(res);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Compute available domains and skills dynamically from real projects
  const domains = useMemo(() => {
    const set = new Set();
    projects.forEach(p => {
      if (p.domain) set.add(p.domain);
    });
    return ['ALL', ...Array.from(set)];
  }, [projects]);

  const skillsList = useMemo(() => {
    const set = new Set();
    projects.forEach(p => {
      const techs = Array.isArray(p.technologies) ? p.technologies : (typeof p.technologies === 'string' ? p.technologies.split(',') : []);
      techs.forEach(t => {
        const trimmed = t.trim();
        if (trimmed) set.add(trimmed);
      });
    });
    return ['ALL', ...Array.from(set).slice(0, 12)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const techs = Array.isArray(p.technologies) ? p.technologies : (typeof p.technologies === 'string' ? p.technologies.split(',') : []);
      const title = (p.title || p.project_name || '').toLowerCase();
      const desc = (p.description || p.synopsis || '').toLowerCase();
      const domain = (p.domain || '').toLowerCase();
      const student = (p.studentName || p.authorName || p.student_name || '').toLowerCase();

      // Domain filter
      if (selectedDomain !== 'ALL' && p.domain !== selectedDomain) return false;

      // Skill filter
      if (selectedSkill !== 'ALL' && !techs.some(t => t.trim().toLowerCase() === selectedSkill.toLowerCase())) return false;

      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = title.includes(q) || desc.includes(q) || domain.includes(q) || student.includes(q) || techs.some(t => t.toLowerCase().includes(q));
        if (!matchesText) return false;
      }

      return true;
    });
  }, [projects, searchQuery, selectedSkill, selectedDomain]);

  return (
    <div>
      {/* ── HEADER BANNER ── */}
      <div className="glass-panel" style={{
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderGit2 style={{ color: 'var(--cyber-cyan)', width: '22px', height: '22px' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Student Projects & Engineering Portfolio Explorer
              </h1>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Search and explore real verified student capstone projects, sovereign repository proofs, and cross-functional teams.
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={fetchProjects}
          className="btn-cyber-outline"
          style={{ padding: '8px 16px', fontSize: '12px' }}
        >
          <span>Refresh Portfolio</span>
        </button>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="glass-panel" style={{ padding: '18px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {/* Main Search */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by project title, technology, domain, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cyber-input"
              style={{ width: '100%', paddingLeft: '36px', fontSize: '12.5px' }}
            />
          </div>

          {/* Domain Dropdown */}
          <div style={{ width: '220px' }}>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="cyber-input"
              style={{ width: '100%', fontSize: '12.5px' }}
            >
              {domains.map(d => (
                <option key={d} value={d}>{d === 'ALL' ? 'All Engineering Domains' : d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Skill Tag Pills */}
        {skillsList.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '4px', fontWeight: 600 }}>Filter by Skill:</span>
            {skillsList.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSkill(s)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedSkill === s ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                  background: selectedSkill === s ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.02)',
                  color: selectedSkill === s ? 'var(--cyber-cyan)' : 'var(--text-secondary)'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── PROJECT GRID ── */}
      {loading ? (
        <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Loading engineering project portfolio...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <AlertCircle size={42} color="var(--text-muted)" style={{ margin: '0 auto 14px', opacity: 0.6 }} />
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {projects.length === 0 ? 'No student project records available yet.' : 'No student projects matching your criteria.'}
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            {projects.length === 0
              ? 'Student project submissions will appear dynamically once created and verified.'
              : 'Try adjusting your search terms, domain filters, or skill tags.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
          {filteredProjects.map((p) => {
            const id = p.id || p.project_id || p.projectId;
            const techs = Array.isArray(p.technologies) ? p.technologies : (typeof p.technologies === 'string' ? p.technologies.split(',') : []);
            const isVerified = (p.status || '').toUpperCase() === 'VERIFIED' || p.is_verified;

            return (
              <div
                key={id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '12px',
                  border: isVerified ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-subtle)',
                  transition: 'transform 0.2s, border-color 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedProject(p)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--cyber-cyan)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isVerified ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span className="cyber-badge badge-purple" style={{ fontSize: '10px' }}>
                      {p.domain || 'Engineering Systems'}
                    </span>
                    {isVerified ? (
                      <span className="badge badge-emerald" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={11} /> Verified Proof
                      </span>
                    ) : (
                      <span className="badge badge-amber" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {p.status || 'Under Review'}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', lineHeight: 1.3 }}>
                    {p.title || p.project_name || 'Engineering Capstone'}
                  </h3>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description || p.synopsis || 'Advanced student technical project solving engineering challenges.'}
                  </p>
                </div>

                <div>
                  {/* Tech stack */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {techs.slice(0, 4).map((tech, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '10px',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'rgba(0,242,254,0.08)',
                          color: 'var(--cyber-cyan)',
                          border: '1px solid rgba(0,242,254,0.18)'
                        }}
                      >
                        {tech.trim()}
                      </span>
                    ))}
                    {techs.length > 4 && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        +{techs.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Footer with Student Author / Team & Details button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Users size={12} />
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {p.studentName || p.authorName || p.student_name || 'Student Team'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(p);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--cyber-cyan)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px'
                      }}
                    >
                      <Eye size={12} /> Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PROJECT DETAILS MODAL ── */}
      {selectedProject && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.88)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1400,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            border: '1px solid var(--cyber-cyan)',
            borderRadius: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="cyber-badge badge-purple" style={{ fontSize: '10.5px' }}>
                    {selectedProject.domain || 'Engineering'}
                  </span>
                  {selectedProject.status && (
                    <span className="badge badge-cyan" style={{ fontSize: '10.5px' }}>
                      {selectedProject.status}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedProject.title || selectedProject.project_name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Synopsis */}
            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                Project Overview & Architecture
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'rgba(10,16,30,0.6)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                {selectedProject.description || selectedProject.synopsis || 'Full project specifications.'}
              </p>
            </div>

            {/* Technologies */}
            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                Technical Stack & Competencies
              </h4>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(Array.isArray(selectedProject.technologies) ? selectedProject.technologies : (typeof selectedProject.technologies === 'string' ? selectedProject.technologies.split(',') : [])).map((t, i) => (
                  <span key={i} className="cyber-badge badge-cyan" style={{ fontSize: '11px' }}>
                    {t.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Student Author & Team */}
            <div className="glass-panel" style={{ padding: '14px 16px', background: 'rgba(10,16,30,0.6)', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--cyber-cyan)', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                Engineering Team & Attribution
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Primary Author</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedProject.studentName || selectedProject.authorName || 'Lead Student'}</strong>
                </div>
                {selectedProject.collegeName && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Campus</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedProject.collegeName}</strong>
                  </div>
                )}
                {selectedProject.department && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Department</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedProject.department}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Repository & Proof Link */}
            {selectedProject.github_url && (
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <a
                  href={selectedProject.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-cyber-outline"
                  style={{ fontSize: '12px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <GitBranch size={14} /> View Code Repository <ExternalLink size={12} />
                </a>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedProject(null)}
                className="btn-cyber-primary"
                style={{ padding: '8px 18px', fontSize: '12px' }}
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
