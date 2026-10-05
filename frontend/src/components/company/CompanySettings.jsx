import React, { useState, useEffect } from 'react';
import { Settings, Building, Mail, MapPin, Key, Bell, Shield, Save, Sun, Moon, Laptop } from 'lucide-react';
import { getTheme, setTheme } from '../../services/themeStore';

export default function CompanySettings({ user, onShowToast, setActivePage }) {
  const [themePref, setThemePrefState] = useState(() => getTheme());
  const [formData, setFormData] = useState(() => {
    let saved = {};
    try {
      const raw = localStorage.getItem('nexus_company_profile');
      if (raw) saved = JSON.parse(raw);
    } catch {}
    return {
      companyName: saved.name || saved.companyName || user?.companyName || user?.company || user?.name || 'Tata Consultancy Services',
      recruiterName: saved.recruiterName || user?.recruiterName || user?.name || 'Vikram Malhotra',
      email: saved.email || user?.email || 'vikram.recruiter@tcs.corp',
      location: saved.location || user?.location || user?.headquarters || 'Siruseri IT Park, Chennai, Tamil Nadu',
      industry: saved.industry || user?.industry || 'Information Technology & Software',
      autoMatchThreshold: saved.autoMatchThreshold ?? 80,
      notificationsEnabled: true
    };
  });

  useEffect(() => {
    const handleThemeChange = (e) => {
      setThemePrefState(e.detail.preference || getTheme());
    };
    const handleCompanyUpdate = (e) => {
      if (e.detail) {
        setFormData(prev => ({
          ...prev,
          companyName: e.detail.name || e.detail.companyName || prev.companyName,
          recruiterName: e.detail.recruiterName || prev.recruiterName,
          email: e.detail.email || prev.email,
          location: e.detail.location || prev.location,
          industry: e.detail.industry || prev.industry,
          autoMatchThreshold: e.detail.autoMatchThreshold ?? prev.autoMatchThreshold
        }));
      }
    };
    window.addEventListener('nexus_theme_changed', handleThemeChange);
    window.addEventListener('nexus_company_updated', handleCompanyUpdate);
    return () => {
      window.removeEventListener('nexus_theme_changed', handleThemeChange);
      window.removeEventListener('nexus_company_updated', handleCompanyUpdate);
    };
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    try {
      let existing = {};
      try {
        const raw = localStorage.getItem('nexus_company_profile');
        if (raw) existing = JSON.parse(raw);
      } catch {}
      const updated = {
        ...existing,
        name: formData.companyName,
        companyName: formData.companyName,
        recruiterName: formData.recruiterName,
        email: formData.email,
        location: formData.location,
        industry: formData.industry,
        autoMatchThreshold: formData.autoMatchThreshold
      };
      localStorage.setItem('nexus_company_profile', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('nexus_company_updated', { detail: updated }));
      window.dispatchEvent(new CustomEvent('nexus_profile_updated', { detail: updated }));
    } catch {}

    if (onShowToast) {
      onShowToast({
        title: 'Settings Saved',
        message: 'Recruiter parameters and corporate profile updated successfully.',
        type: 'success'
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Recruiter & Company Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure corporate presence, hiring match thresholds, and verified recruitment credentials.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Appearance & Theme Section */}
        <div className="company-card" style={{ padding: '20px' }}>
          <h3 className="company-card-title text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
            <Sun className="w-4 h-4 text-cyan-400" />
            <span>Appearance</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Customize how SkillNexus AI looks on your device.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            {/* Light */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: themePref === 'light' ? '2px solid var(--cyber-blue)' : '1px solid var(--border-subtle)',
                background: themePref === 'light' ? 'var(--nav-active-bg)' : 'var(--bg-input)',
                color: themePref === 'light' ? 'var(--cyber-blue)' : 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Sun size={22} color={themePref === 'light' ? 'var(--cyber-blue)' : 'var(--text-muted)'} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>☀ Light</span>
              {themePref === 'light' ? (
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'var(--cyber-blue)', color: '#fff', fontWeight: 800 }}>
                  [ACTIVE]
                </span>
              ) : (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Available</span>
              )}
            </button>

            {/* Dark */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: themePref === 'dark' ? '2px solid var(--cyber-blue)' : '1px solid var(--border-subtle)',
                background: themePref === 'dark' ? 'var(--nav-active-bg)' : 'var(--bg-input)',
                color: themePref === 'dark' ? 'var(--cyber-blue)' : 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Moon size={22} color={themePref === 'dark' ? 'var(--cyber-blue)' : 'var(--text-muted)'} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>🌙 Dark</span>
              {themePref === 'dark' ? (
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'var(--cyber-blue)', color: '#fff', fontWeight: 800 }}>
                  [ACTIVE]
                </span>
              ) : (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Available</span>
              )}
            </button>

            {/* System */}
            <button
              type="button"
              onClick={() => setTheme('system')}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: themePref === 'system' ? '2px solid var(--cyber-blue)' : '1px solid var(--border-subtle)',
                background: themePref === 'system' ? 'var(--nav-active-bg)' : 'var(--bg-input)',
                color: themePref === 'system' ? 'var(--cyber-blue)' : 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Laptop size={22} color={themePref === 'system' ? 'var(--cyber-blue)' : 'var(--text-muted)'} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>◐ System</span>
              {themePref === 'system' ? (
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'var(--cyber-blue)', color: '#fff', fontWeight: 800 }}>
                  [ACTIVE]
                </span>
              ) : (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Available</span>
              )}
            </button>
          </div>
        </div>

        {/* Recruiter Profile */}
        <div className="company-card">
          <h3 className="company-card-title text-sm font-semibold mb-4">Corporate Recruiter Identity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="company-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Lead Recruiter Name</label>
              <input
                type="text"
                value={formData.recruiterName}
                onChange={(e) => setFormData({ ...formData, recruiterName: e.target.value })}
                className="company-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="company-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Corporate HQ / Office</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="company-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* AI Match Parameters */}
        <div className="company-card">
          <h3 className="company-card-title text-sm font-semibold mb-4">Autonomous AI Match Thresholds</h3>
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-300 font-medium">Automatic Fast-Track Screening Threshold</span>
                <span className="font-mono text-cyan-400 font-bold">{formData.autoMatchThreshold}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                value={formData.autoMatchThreshold}
                onChange={(e) => setFormData({ ...formData, autoMatchThreshold: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Candidates with a composite NEXUS AI score above this threshold will automatically bypass manual resume review.
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-3">
          {setActivePage && (
            <button
              type="button"
              onClick={() => setActivePage('settings')}
              className="btn-cyber-outline"
              style={{ padding: '8px 18px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Settings size={14} />
              <span>Open Full Industry Settings Console</span>
            </button>
          )}
          <button
            type="submit"
            className="btn-cyber-primary"
            style={{ padding: '9px 24px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}
          >
            <Save size={15} />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
