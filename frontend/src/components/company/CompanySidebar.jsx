import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  GraduationCap,
  Building2,
  FileText,
  UserCheck,
  Building,
  BookOpen,
  Award,
  Sparkles,
  Layers,
  BarChart3,
  MessageSquare,
  Settings,
  Cpu,
  ChevronRight,
  LogOut
} from 'lucide-react';

export default function CompanySidebar({ activeTab, onTabSelect, user, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Talent Pool', icon: Users },
    { id: 'selected', label: 'Selected Candidates', icon: UserCheck, badge: 'Offers' },
    { id: 'colleges', label: 'College Collaboration', icon: Building2, badge: 'Partners' },
    { id: 'assessments', label: 'Assessments', icon: Award },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'courses', label: 'Learning', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const isItemActive = (id) => {
    if (id === 'dashboard') return activeTab === 'dashboard' || activeTab === 'overview';
    if (id === 'students') return ['students', 'talent-search', 'student-profile', 'ai-matching', 'talent-pools'].includes(activeTab);
    if (id === 'selected') return ['selected', 'selected-candidates', 'selected-students'].includes(activeTab);
    if (id === 'colleges') return ['colleges', 'collaboration', 'access-requests', 'requests', 'authorized-students'].includes(activeTab);
    if (id === 'assessments') return activeTab === 'assessments';
    if (id === 'opportunities') return ['opportunities', 'jobs', 'internships', 'apprenticeships', 'applications', 'shortlisted'].includes(activeTab);
    if (id === 'courses') return ['courses', 'certificates', 'learning-assessments'].includes(activeTab);
    if (id === 'analytics') return activeTab === 'analytics';
    if (id === 'messages') return activeTab === 'messages';
    if (id === 'settings') return activeTab === 'settings';
    return activeTab === id;
  };

  const companyName = user?.companyName || user?.company || 'Corporate Partner';
  const recruiterName = user?.name || user?.recruiterName || 'Talent Lead';

  return (
    <aside className="company-sidebar" aria-label="Company Navigation">
      {/* 3. Company Branding */}
      <div className="company-sidebar-header">
        <div className="company-logo-badge">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div className="company-brand-text">
          <div className="company-brand-title">
            <span>SKILLNEXUS</span>
            <span style={{ color: 'var(--company-accent-cyan)' }}>AI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
            <span style={{
              fontSize: '9.5px', fontWeight: 700, padding: '1.5px 6px', borderRadius: '4px',
              background: 'rgba(0, 212, 255, 0.12)', color: 'var(--company-accent-cyan)',
              border: '1px solid rgba(0, 212, 255, 0.25)', letterSpacing: '0.06em',
              fontFamily: 'var(--font-mono, monospace)'
            }}>
              COMPANY WORKSPACE
            </span>
          </div>
        </div>
      </div>

      {/* 4. Left Sidebar Navigation */}
      <nav className="company-sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`company-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabSelect(item.id)}
            >
              {isActive && <div className="nav-indicator" />}
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="company-nav-badge">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Ask Nexus Card (Aligned with Student & Institution sidebar) */}
      <div style={{
        margin: '10px 12px',
        padding: '12px',
        borderRadius: '10px',
        background: 'var(--company-bg-card)',
        border: '1px solid var(--company-border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #00D4FF 0%, #3B82F6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={13} color="#000" />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Nexus Talent AI</span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--company-text-muted)', lineHeight: 1.4, margin: '0 0 8px' }}>
          Autonomous candidate ranking and sovereign skill verification.
        </p>
        <button
          type="button"
          onClick={() => onTabSelect('ai-matching')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #00D4FF 0%, #3B82F6 100%)',
            border: 'none', color: '#060B14', fontSize: '11.5px',
            fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 0 12px rgba(0, 212, 255, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <span>Run AI Match</span>
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Bottom of Sidebar */}
      <div className="company-sidebar-footer">
        <div className="company-profile-brief" title={`${recruiterName} (${companyName})`}>
          <div className="company-avatar-box">
            {companyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="company-name-info">
            <span className="company-name-text">{companyName}</span>
            <span className="company-role-tag">Recruiter • {recruiterName.split(' ')[0]}</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={onLogout}
          className="company-icon-btn" 
          title="Sign Out"
          style={{ width: '28px', height: '28px' }}
        >
          <LogOut className="w-4 h-4 text-slate-400 hover:text-red-400 transition-colors" />
        </button>
      </div>
    </aside>
  );
}
