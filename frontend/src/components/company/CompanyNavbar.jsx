import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  MessageSquare,
  Activity,
  MoreVertical,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  LogOut,
  CheckCircle2,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { getTheme, toggleTheme } from '../../services/themeStore';

export default function CompanyNavbar({
  activeTab,
  onTabSelect,
  user,
  onLogout,
  searchQuery,
  onSearchChange
}) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => getTheme());
  const menuRef = useRef(null);

  const companyName = user?.companyName || user?.company || 'ABC Technologies';
  const recruiterName = user?.name || user?.recruiterName || 'Sarah Jenkins';

  useEffect(() => {
    const handleThemeChange = (e) => {
      setCurrentTheme(e.detail.theme);
    };
    window.addEventListener('nexus_theme_changed', handleThemeChange);
    return () => window.removeEventListener('nexus_theme_changed', handleThemeChange);
  }, []);

  const tabLabels = {
    dashboard: 'Overview',
    students: 'Students',
    internships: 'Internships',
    apprenticeships: 'Apprenticeships',
    jobs: 'Jobs',
    applications: 'Applications',
    shortlisted: 'Shortlisted',
    colleges: 'Colleges',
    courses: 'Courses',
    certificates: 'Certificates',
    'ai-matching': 'AI Matching',
    'talent-pools': 'Talent Pools',
    analytics: 'Analytics',
    messages: 'Messages',
    settings: 'Settings'
  };

  const currentLabel = tabLabels[activeTab] || 'Overview';

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
        setShowNotifMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="company-top-navbar" ref={menuRef}>
      {/* 5. Left: Breadcrumb */}
      <div className="company-breadcrumb">
        <span className="company-breadcrumb-parent">Company</span>
        <span className="company-breadcrumb-separator">/</span>
        <span className="company-breadcrumb-current">{currentLabel}</span>
      </div>

      {/* Center/Left: Global Search Box */}
      <div className="company-global-search">
        <Search className="w-4 h-4 company-search-icon" />
        <input
          type="text"
          className="company-search-input"
          placeholder="Search students, skills, colleges..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery ? (
          <button 
            type="button" 
            onClick={() => onSearchChange('')} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="company-search-badge">⌘K</span>
        )}
      </div>

      {/* Right Side Icons & Profile */}
      <div className="company-navbar-right">
        {/* Status / Alert Indicator */}
        <div className="company-status-badge-live" title="NEXUS AI Matching Engine: Online">
          <div className="company-status-dot" />
          <span>Engine Active</span>
        </div>

        {/* Messages Shortcut */}
        <button
          type="button"
          className="company-icon-btn"
          title="Direct Talent Messages"
          onClick={() => onTabSelect('messages')}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_6px_#28D7FF]" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            className="company-icon-btn"
            title="Recruitment Notifications"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_6px_#8B5CF6]" />
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] mb-2">
                <span className="text-xs font-semibold text-[var(--text-heading)]">Recent Activity</span>
                <span className="text-[10px] text-cyan-500 font-bold">Live</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 text-center text-slate-400 text-xs">
                  No notifications yet.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={() => toggleTheme()}
          title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {currentTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Recruiter Avatar & Profile Pill */}
        <div
          className="company-user-pill"
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          title="Account Menu"
        >
          <div className="company-recruiter-avatar">
            {recruiterName.slice(0, 1).toUpperCase()}
          </div>
          <div className="company-recruiter-details">
            <span className="company-recruiter-name">{recruiterName}</span>
            <span className="company-corp-name">{companyName}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </div>

        {/* More Menu Dropdown */}
        {showMoreMenu && (
          <div className="absolute right-6 top-14 w-52 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-2 z-50">
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--text-primary)] hover:text-[var(--cyber-blue)] hover:bg-[var(--bg-card-hover)] rounded-lg transition-colors text-left"
              onClick={() => { setShowMoreMenu(false); onTabSelect('settings'); }}
            >
              <User className="w-4 h-4 text-cyan-500" />
              <span>Recruiter Profile</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--text-primary)] hover:text-[var(--cyber-blue)] hover:bg-[var(--bg-card-hover)] rounded-lg transition-colors text-left"
              onClick={() => { setShowMoreMenu(false); onTabSelect('settings'); }}
            >
              <Settings className="w-4 h-4 text-purple-500" />
              <span>Company Settings</span>
            </button>
            <div className="h-px bg-[var(--border-subtle)] my-1" />
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors text-left font-medium"
              onClick={() => { setShowMoreMenu(false); onLogout(); }}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
