import React, { useState } from 'react';
import {
  User,
  Sliders,
  Bell,
  Lock,
  ShieldCheck,
  Upload,
  Plus,
  X,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

export default function AccountSettings({ onShowToast }) {
  const [activeSubTab, setActiveSubTab] = useState('My Profile & Career Target');

  const storedUser = (() => {
    try {
      const u = localStorage.getItem('nexus_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  })();

  const [settings, setSettings] = useState({
    name: storedUser?.name || storedUser?.fullName || '',
    email: storedUser?.email || '',
    phone: storedUser?.phone || '',
    college: storedUser?.collegeName || storedUser?.institutionName || '',
    degree: storedUser?.degree || '',
    gradYear: storedUser?.gradYear || '',
    desiredRole: storedUser?.targetRole || storedUser?.careerGoal || '',
    targetIndustry: '',
    compensation: '',
    modalities: {
      hybrid: true,
      remote: true,
      onsite: false
    },
    bio: storedUser?.bio || '',
    skills: Array.isArray(storedUser?.skills) ? storedUser.skills.map(s => typeof s === 'string' ? s : (s.name || s.skill)) : [],
    proactivityLevel: 50,
    autoSyncGithub: false,
    alertHighMatch: true,
    enableSimulationBots: false
  });

  const [newSkillInput, setNewSkillInput] = useState('');
  const [showAddSkillInput, setShowAddSkillInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const subTabs = [
    { label: 'My Profile & Career Target', icon: User },
    { label: 'Academic Credentials', icon: ShieldCheck },
    { label: 'AI Companion Calibration', icon: Sliders },
    { label: 'Notifications & Alerts', icon: Bell },
    { label: 'Privacy & Sovereign Data', icon: Lock },
    { label: 'Security & Passkeys', icon: ShieldCheck }
  ];

  const handleRemoveSkill = (skillToRemove) => {
    setSettings({
      ...settings,
      skills: settings.skills.filter(s => s !== skillToRemove)
    });
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkillInput.trim() && !settings.skills.includes(newSkillInput.trim())) {
      setSettings({
        ...settings,
        skills: [...settings.skills, newSkillInput.trim()]
      });
      setNewSkillInput('');
      setShowAddSkillInput(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settings.name,
          phone: settings.phone,
          college: settings.college,
          degree: settings.degree,
          gradYear: settings.gradYear,
          bio: settings.bio,
          techStackMatrix: settings.skills,
          careerTarget: {
            desiredRole: settings.desiredRole,
            targetIndustry: settings.targetIndustry,
            compensation: settings.compensation
          },
          companionPreferences: {
            proactivityLevel: settings.proactivityLevel,
            autoSyncGithub: settings.autoSyncGithub,
            alertHighMatch: settings.alertHighMatch,
            enableSimulationBots: settings.enableSimulationBots
          }
        })
      });

      if (onShowToast) {
        onShowToast({
          title: 'Settings Calibrated',
          message: 'Profile and opportunity radar weights recalibrated across all nodes.',
          type: 'success'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Top Telemetry Header */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div className="telemetry-node-tag">
            <span>SYSTEM PREFERENCES</span>
            <span>//</span>
            <span>PROFILE & IDENTITY</span>
            <span>//</span>
            <span>SECURE NODE v2.4.8</span>
          </div>
          <h1>Account Settings & Career Profile</h1>
          <p>Manage your personal profile, career algorithm targets, privacy credentials, and AI companion preferences.</p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: '11.5px', fontFamily: 'var(--font-mono)'
        }}>
          <span className="status-dot-pulse"></span>
          <span>INTEGRITY INDEX: <strong style={{ color: 'var(--cyber-emerald)' }}>99.4% Verified Identity</strong></span>
        </div>
      </div>

      {/* Main Grid: Left Subnav Column + Right Content Area matching Page 12 */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
        {/* Left Sub-navigation */}
        <div>
          <div className="glass-panel" style={{ padding: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '6px 10px', textTransform: 'uppercase' }}>
              CONFIGURATION SUB-MODULES
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {subTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.label;

                return (
                  <li key={tab.label}>
                    <button
                      onClick={() => setActiveSubTab(tab.label)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: '8px', border: 'none',
                        textAlign: 'left', cursor: 'pointer', fontSize: '12.5px',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                        background: isActive ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                        borderLeft: isActive ? '3px solid var(--cyber-cyan)' : '3px solid transparent'
                      }}
                    >
                      <Icon size={15} color={isActive ? 'var(--cyber-cyan)' : 'var(--text-muted)'} />
                      <span>{tab.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Profile Completion Box */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>PROFILE COMPLETION</span>
              <strong style={{ color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>92%</strong>
            </div>

            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: '92%', height: '100%', background: 'var(--grad-cyan-blue)', borderRadius: '3px' }}></div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Add 1 more GitHub project to reach 100% verified status.
            </div>
          </div>
        </div>

        {/* Right Form Content matching Page 12 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Banner */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <img
                src={storedUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={settings.name || "Student"}
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--cyber-cyan)' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {settings.name || 'Student Profile'}
                  </h3>
                  <span className="cyber-badge badge-emerald" style={{ fontSize: '8.5px' }}>
                    Verified Student
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  Candidate ID: {storedUser?.studentId || storedUser?.id || 'NEX-STU'} • Verified Institution: {settings.college || 'Linked Academic Campus'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (onShowToast) onShowToast({ title: 'Photo Uploaded', message: 'Profile avatar updated.', type: 'info' });
              }}
              className="btn-cyber-outline"
              style={{ fontSize: '12px', padding: '8px 14px' }}
            >
              <Upload size={13} />
              <span>Upload New Photo</span>
            </button>
          </div>

          {/* Form Section 1: Personal & Contact Information */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={15} color="var(--cyber-cyan)" />
              <span>Personal & Contact Information</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  INSTITUTIONAL EMAIL
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  PHONE NUMBER
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  COLLEGE / UNIVERSITY
                </label>
                <input
                  type="text"
                  value={settings.college}
                  onChange={(e) => setSettings({ ...settings, college: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  DEGREE / MAJOR
                </label>
                <input
                  type="text"
                  value={settings.degree}
                  onChange={(e) => setSettings({ ...settings, degree: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  EXPECTED GRADUATION YEAR
                </label>
                <input
                  type="text"
                  value={settings.gradYear}
                  onChange={(e) => setSettings({ ...settings, gradYear: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Form Section 2: Career Architecture & Target Role Calibration */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={15} color="var(--cyber-purple)" />
              <span>Career Architecture & Target Role Calibration</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  DESIRED TARGET ROLE
                </label>
                <input
                  type="text"
                  value={settings.desiredRole}
                  onChange={(e) => setSettings({ ...settings, desiredRole: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                    TARGET INDUSTRY DOMAIN
                  </label>
                  <input
                    type="text"
                    value={settings.targetIndustry}
                    onChange={(e) => setSettings({ ...settings, targetIndustry: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                    COMPENSATION EXPECTATIONS
                  </label>
                  <input
                    type="text"
                    value={settings.compensation}
                    onChange={(e) => setSettings({ ...settings, compensation: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                  RELOCATION & WORK MODALITY
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'hybrid', label: 'Hybrid (Bengaluru / NCR)' },
                    { key: 'remote', label: 'Remote (Global Tier 1)' },
                    { key: 'onsite', label: 'On-Site (Any Tech Hub)' }
                  ].map((item) => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.modalities[item.key]}
                        onChange={(e) => setSettings({
                          ...settings,
                          modalities: { ...settings.modalities, [item.key]: e.target.checked }
                        })}
                        style={{ accentColor: 'var(--cyber-cyan)' }}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Section 3: Bio & Personal Technical Statement */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Bio & Personal Technical Statement
            </h4>
            <textarea
              rows={3}
              value={settings.bio}
              onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
              style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none', lineHeight: 1.5 }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Nexus AI auto-tailors this summary into hiring manager ATS cover dispatches.
            </div>
          </div>

          {/* Form Section 4: Preferred Skills & Tech Stack Matrix */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Preferred Skills & Tech Stack Matrix
              </h4>
              <button
                type="button"
                onClick={() => setShowAddSkillInput(true)}
                style={{ background: 'none', border: 'none', color: 'var(--cyber-cyan)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={13} />
                <span>Add Technology / Skill</span>
              </button>
            </div>

            {/* Skill Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {settings.skills.map((sk) => (
                <span key={sk} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 10px', borderRadius: '6px',
                  background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)',
                  color: 'var(--cyber-cyan)', fontSize: '12px', fontFamily: 'var(--font-mono)'
                }}>
                  <span>{sk}</span>
                  <button
                    onClick={() => handleRemoveSkill(sk)}
                    style={{ background: 'none', border: 'none', color: 'var(--cyber-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}

              {showAddSkillInput && (
                <form onSubmit={handleAddSkill} style={{ display: 'inline-flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Skill name..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    autoFocus
                    style={{
                      padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-input)',
                      border: '1px solid var(--cyber-cyan)', color: '#FFF', fontSize: '12px', outline: 'none'
                    }}
                  />
                  <button type="submit" className="btn-cyber-primary" style={{ padding: '4px 8px', fontSize: '11px' }}>Add</button>
                </form>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '11.5px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>STRONGEST PILLAR</div>
                <div style={{ color: 'var(--cyber-emerald)', fontWeight: 600, marginTop: '2px' }}>Predictive Modeling (Level 82/100)</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>ACTIVE GAP TARGET</div>
                <div style={{ color: 'var(--cyber-amber)', fontWeight: 600, marginTop: '2px' }}>Vector Search Indexing (Remediation active)</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>PORTFOLIO EVIDENCE</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>5 Verified Artifacts (in PWS, EDA, ZK)</div>
              </div>
            </div>
          </div>

          {/* Form Section 5: Nexus AI Career Companion Preferences */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={15} color="var(--cyber-purple)" />
                <span>Nexus AI Career Companion Preferences</span>
              </h4>
              <span className="cyber-badge badge-purple" style={{ fontSize: '8.5px' }}>
                NEURAL AGENT RUNNING
              </span>
            </div>

            {/* Slider */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>AI Proactivity Level</span>
                <strong style={{ color: 'var(--cyber-purple)', fontFamily: 'var(--font-mono)' }}>
                  {settings.proactivityLevel >= 75 ? 'Agentic Gap Targeting' : 'Balanced'}
                </strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.proactivityLevel}
                onChange={(e) => setSettings({ ...settings, proactivityLevel: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--cyber-purple)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Passive</span>
                <span>Balanced</span>
                <span>Agentic Sprint</span>
              </div>
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.autoSyncGithub}
                  onChange={(e) => setSettings({ ...settings, autoSyncGithub: e.target.checked })}
                  style={{ accentColor: 'var(--cyber-cyan)', marginTop: '2px' }}
                />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Auto-sync validated GitHub repositories to Digital Passport</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nexus AI inspects commits on main branches, scores README documentation, and issues verifiable skill stamps.</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.alertHighMatch}
                  onChange={(e) => setSettings({ ...settings, alertHighMatch: e.target.checked })}
                  style={{ accentColor: 'var(--cyber-cyan)', marginTop: '2px' }}
                />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Alert me when a candidate job match exceeds 85% score</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Direct instant push notification sent to mobile app & institutional inbox with 1-click apply readiness payload.</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.enableSimulationBots}
                  onChange={(e) => setSettings({ ...settings, enableSimulationBots: e.target.checked })}
                  style={{ accentColor: 'var(--cyber-cyan)', marginTop: '2px' }}
                />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Enable Autonomous Career Interview Simulation Bots</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Permit the Companion to schedule 10-minute surprise technical mock interview popups twice weekly.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Footer matching Page 12 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px', background: 'var(--bg-input)',
            borderRadius: '10px', border: '1px solid var(--border-glow)'
          }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Last calibrated Today, 14:22 IST from Chennai Node
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  if (onShowToast) onShowToast({ title: 'Changes Discarded', message: 'Reverted to last synced profile state.', type: 'info' });
                }}
                className="btn-cyber-outline"
                style={{ fontSize: '12.5px', padding: '8px 16px' }}
              >
                Discard Changes
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="btn-cyber-primary"
                style={{ fontSize: '12.5px', padding: '8px 18px' }}
              >
                <Save size={14} />
                <span>{isSaving ? 'Calibrating Radar...' : 'Save Settings & Recalibrate Radar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
