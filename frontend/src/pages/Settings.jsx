import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Settings as SettingsIcon,
  User,
  Camera,
  Lock,
  Bell,
  Palette,
  Shield,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  X,
  Check,
  CheckCircle2,
  Upload,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  ToggleLeft,
  ToggleRight,
  FileText,
  Download,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Building2,
  Code,
  Briefcase,
  Plus,
  Sparkles,
  LogOut,
  Archive,
  Edit3,
  Clock,
  Zap,
  CircleUser,
  Key
} from 'lucide-react';
import { loadStudentProfile, saveStudentProfile, calculateProfileCompletion } from '../services/profileStore';
import { getTheme, setTheme as setNexusTheme, getResolvedTheme } from '../services/themeStore';
import { normalizeRole } from '../services/notificationStore';

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS — TAB DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { key: 'account', label: 'Account', icon: User, desc: 'Email, phone, core identity' },
  { key: 'profile', label: 'Profile', icon: Edit3, desc: 'Personal & academic details' },
  { key: 'photo', label: 'Photo', icon: Camera, desc: 'Profile picture management' },
  { key: 'security', label: 'Security', icon: Lock, desc: 'Password & 2FA settings' },
  { key: 'notifications', label: 'Notifications', icon: Bell, desc: 'Alert preferences' },
  { key: 'appearance', label: 'Appearance', icon: Palette, desc: 'Theme & display options' },
  { key: 'privacy', label: 'Privacy', icon: Shield, desc: 'Data visibility controls' },
  { key: 'data', label: 'Data & Trash', icon: Archive, desc: 'Recoverable deleted items' },
  { key: 'danger', label: 'Danger Zone', icon: AlertTriangle, desc: 'Account deletion' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALS AVATAR GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════
function InitialsAvatar({ name, size = 64 }) {
  const initials = (name || 'S')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #fccb90, #d57eeb)'
  ];

  const colorIndex = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: colors[colorIndex],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: `${Math.round(size * 0.38)}px`, fontWeight: 800, color: '#fff',
      letterSpacing: '0.05em', fontFamily: 'var(--font-mono)',
      border: '3px solid var(--cyber-cyan)',
      boxShadow: '0 0 20px rgba(0, 212, 255, 0.25)',
      userSelect: 'none', flexShrink: 0
    }}>
      {initials}
    </div>
  );
}

export default function Settings({ setActivePage, onShowToast, user, initialTab }) {
  const currentRole = normalizeRole(user?.role);

  const getInitialInstitutionProfile = () => ({
    name: user?.institutionName || user?.collegeName || user?.name || 'Institution Admin',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || user?.district || '',
    bio: user?.headline || user?.description || '',
    institutionType: user?.institutionType || 'College',
    website: user?.website || '',
    department: user?.department || 'Administration'
  });

  const getInitialCompanyProfile = () => {
    let saved = {};
    try {
      const raw = localStorage.getItem('nexus_company_profile');
      if (raw) saved = JSON.parse(raw);
    } catch {}
    return {
      name: saved.name || saved.companyName || user?.companyName || user?.company || user?.name || 'Tata Consultancy Services',
      recruiterName: saved.recruiterName || user?.recruiterName || user?.name || 'Vikram Malhotra',
      email: saved.email || user?.email || 'vikram.recruiter@tcs.corp',
      phone: saved.phone || user?.phone || '+91 98401 23456',
      location: saved.location || user?.location || user?.headquarters || 'Siruseri IT Park, Chennai, Tamil Nadu',
      website: saved.website || user?.website || 'https://www.tcs.com',
      industry: saved.industry || user?.industry || 'Information Technology & Software',
      companyType: saved.companyType || 'Enterprise / Global MNC',
      companySize: saved.companySize || '5,000+ Employees (Global MNC)',
      hiringFocus: saved.hiringFocus || 'Full-Stack Developers, Cloud Architects, AI Engineers',
      bio: saved.bio || user?.description || 'Global leader in IT services, consulting, and digital innovation partnering with premier Indian universities for top campus talent.',
      autoMatchThreshold: saved.autoMatchThreshold ?? 80,
      corporateId: saved.corporateId || user?.companyId || user?.id || 'IND-TCS-0042',
      verificationStatus: saved.verificationStatus || 'Enterprise Verified Corporate Node',
      talentAccessTier: saved.talentAccessTier || 'Tier-1 All-India Campus Access',
      avatar: saved.avatar || user?.avatar || ''
    };
  };

  const activeTabsList = currentRole === 'company' ? [
    { key: 'account', label: 'Company Account', icon: Building2, desc: 'Corporate identity & recruiter credentials' },
    { key: 'profile', label: 'Hiring & Presence', icon: Briefcase, desc: 'Industry sector, hiring focus & AI matching' },
    { key: 'photo', label: 'Company Logo', icon: Camera, desc: 'Official corporate branding & badge' },
    { key: 'security', label: 'Security & Keys', icon: Lock, desc: 'Password & secure recruiter authentication' },
    { key: 'notifications', label: 'Recruitment Alerts', icon: Bell, desc: 'Applications, drive invites & candidate alerts' },
    { key: 'appearance', label: 'Theme & Display', icon: Palette, desc: 'UI theme & dashboard display settings' },
    { key: 'privacy', label: 'Corporate Visibility', icon: Shield, desc: 'Company profile visibility & direct inquiries' },
    { key: 'danger', label: 'Danger Zone', icon: AlertTriangle, desc: 'Corporate account termination' },
  ] : currentRole === 'institution' ? [
    { key: 'account', label: 'Institution Account', icon: Building2, desc: 'Campus identity, administration & contact' },
    { key: 'profile', label: 'Campus Details', icon: Edit3, desc: 'Accreditation, departments & description' },
    { key: 'photo', label: 'Campus Seal', icon: Camera, desc: 'Official seal & badge management' },
    { key: 'security', label: 'Security', icon: Lock, desc: 'Admin passwords & authentication' },
    { key: 'notifications', label: 'Notifications', icon: Bell, desc: 'Drive alerts & academic updates' },
    { key: 'appearance', label: 'Appearance', icon: Palette, desc: 'Theme & display options' },
    { key: 'privacy', label: 'Data Governance', icon: Shield, desc: 'Data privacy & regulatory compliance' },
    { key: 'danger', label: 'Danger Zone', icon: AlertTriangle, desc: 'Account deactivation' },
  ] : TABS;

  const [profile, setProfile] = useState(() => {
    if (currentRole === 'institution') return getInitialInstitutionProfile();
    if (currentRole === 'company') return getInitialCompanyProfile();
    return loadStudentProfile();
  });
  const [formData, setFormData] = useState(() => {
    if (currentRole === 'institution') return getInitialInstitutionProfile();
    if (currentRole === 'company') return getInitialCompanyProfile();
    return loadStudentProfile();
  });
  const [activeTab, setActiveTab] = useState(() => {
    const validTabs = activeTabsList.map(t => t.key);
    if (initialTab && validTabs.includes(initialTab)) return initialTab;
    if (initialTab === 'trash') return currentRole === 'company' ? 'profile' : 'data';
    return 'account';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [trashBin, setTrashBin] = useState([]);
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try { const raw = localStorage.getItem('nexus_notification_prefs'); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  });
  const [privacySettings, setPrivacySettings] = useState(() => {
    try { const raw = localStorage.getItem('nexus_privacy_settings'); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  });
  const [themePref, setThemePref] = useState(() => getTheme());
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPass: '', confirm: '' });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateStep, setDeactivateStep] = useState(0);
  const fileInputRef = useRef(null);

  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

  // Fetch trash bin from backend
  const fetchTrash = useCallback(async () => {
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    try {
      const res = await fetch(`${apiBase}/students/profile`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTrashBin(json.data.trashBin || []);
        }
      }
    } catch {}
  }, [apiBase]);

  useEffect(() => {
    if (currentRole === 'student') fetchTrash();
  }, [currentRole, fetchTrash]);

  useEffect(() => {
    const handleProfileUpdate = (e) => {
      if (e.detail) {
        setProfile(prev => ({ ...prev, ...e.detail }));
        setFormData(prev => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener('nexus_profile_updated', handleProfileUpdate);
    window.addEventListener('nexus_company_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('nexus_profile_updated', handleProfileUpdate);
      window.removeEventListener('nexus_company_updated', handleProfileUpdate);
    };
  }, []);

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSave = async (section) => {
    setIsSaving(true);
    try {
      let updated;
      if (currentRole === 'company') {
        updated = { ...formData };
        setProfile(prev => ({ ...prev, ...updated }));
        localStorage.setItem('nexus_company_profile', JSON.stringify(updated));
        try {
          const authUser = JSON.parse(localStorage.getItem('nexus_auth_user') || '{}');
          if (authUser) {
            authUser.companyName = formData.name;
            authUser.name = formData.recruiterName || formData.name;
            authUser.phone = formData.phone;
            authUser.location = formData.location;
            authUser.industry = formData.industry;
            localStorage.setItem('nexus_auth_user', JSON.stringify(authUser));
          }
        } catch {}
      } else if (currentRole === 'institution') {
        updated = { ...formData };
        setProfile(prev => ({ ...prev, ...updated }));
      } else {
        updated = saveStudentProfile(formData);
        setProfile(prev => ({ ...prev, ...updated }));
      }

      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const endpoint = currentRole === 'company'
        ? `${apiBase}/company/profile`
        : currentRole === 'institution'
          ? `${apiBase}/academic/profile`
          : `${apiBase}/students/profile`;

      const payload = currentRole === 'company'
        ? {
            companyName: formData.name,
            recruiterName: formData.recruiterName,
            email: formData.email,
            phone: formData.phone,
            location: formData.location,
            website: formData.website,
            industry: formData.industry,
            companySize: formData.companySize,
            companyType: formData.companyType,
            hiringFocus: formData.hiringFocus,
            autoMatchThreshold: formData.autoMatchThreshold,
            bio: formData.bio || '',
            avatar: formData.avatar || ''
          }
        : currentRole === 'institution'
        ? {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            location: formData.location,
            website: formData.website,
            institutionType: formData.institutionType,
            department: formData.department,
            bio: formData.bio || ''
          }
        : {
            name: formData.name, phone: formData.phone, department: formData.department,
            degree: formData.degree, batch: formData.gradYear,
            cgpa: formData.cgpa, bio: formData.bio || '', location: formData.location || '',
            dob: formData.dob || '', gender: formData.gender || '', avatar: formData.avatar || '',
            skills: Array.isArray(formData.skills) ? formData.skills.map(s => typeof s === 'string' ? { name: s, level: 'Intermediate', confidence: 75, verified: false } : s) : []
          };

      try {
        await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.debug('Settings backend sync deferred:', e);
      }

      if (currentRole === 'company') {
        window.dispatchEvent(new CustomEvent('nexus_company_updated', { detail: updated }));
      }
      window.dispatchEvent(new CustomEvent('nexus_profile_updated', { detail: updated }));
      window.dispatchEvent(new CustomEvent('nexus_students_updated'));
      window.dispatchEvent(new CustomEvent('nexus_data_updated'));
      if (onShowToast) onShowToast({
        title: `${section || (currentRole === 'company' ? 'Industry Settings' : 'Settings')} Saved`,
        message: currentRole === 'company' ? 'Corporate presence and recruiter parameters saved successfully.' : 'Your changes have been saved successfully.',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast({ title: 'Save Failed', message: 'Could not sync changes. Please try again.', type: 'error' });
    } finally { setIsSaving(false); }
  };

  // ── Photo handlers ─────────────────────────────────────────────────────────
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      if (onShowToast) onShowToast({ title: 'File Too Large', message: 'Maximum photo size is 5MB.', type: 'error' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      if (onShowToast) onShowToast({ title: 'Invalid File', message: 'Only image files (JPEG, PNG, WebP) are accepted.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const avatarUrl = reader.result;
      setProfile(prev => ({ ...prev, avatar: avatarUrl }));
      setFormData(prev => ({ ...prev, avatar: avatarUrl }));
      if (currentRole === 'company') {
        const comp = { ...formData, avatar: avatarUrl };
        localStorage.setItem('nexus_company_profile', JSON.stringify(comp));
        window.dispatchEvent(new CustomEvent('nexus_company_updated', { detail: comp }));
      } else if (currentRole === 'student') {
        saveStudentProfile({ ...profile, avatar: avatarUrl });
      }
      window.dispatchEvent(new CustomEvent('nexus_profile_updated', { detail: { avatar: avatarUrl } }));
      if (onShowToast) onShowToast({
        title: currentRole === 'company' ? 'Logo Updated' : 'Photo Updated',
        message: currentRole === 'company' ? 'Corporate brand logo has been updated.' : 'Profile photo has been changed.',
        type: 'success'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfile(prev => ({ ...prev, avatar: '' }));
    setFormData(prev => ({ ...prev, avatar: '' }));
    if (currentRole === 'company') {
      const comp = { ...formData, avatar: '' };
      localStorage.setItem('nexus_company_profile', JSON.stringify(comp));
      window.dispatchEvent(new CustomEvent('nexus_company_updated', { detail: comp }));
    } else if (currentRole === 'student') {
      saveStudentProfile({ ...profile, avatar: '' });
    }
    window.dispatchEvent(new CustomEvent('nexus_profile_updated', { detail: { avatar: '' } }));
    if (onShowToast) onShowToast({
      title: currentRole === 'company' ? 'Logo Removed' : 'Photo Removed',
      message: currentRole === 'company' ? 'Corporate logo removed. Company initials will be displayed.' : 'Profile photo has been removed. Initials will be displayed.',
      type: 'info'
    });
  };

  // ── Password change handler ────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPass !== pwForm.confirm) {
      if (onShowToast) onShowToast({ title: 'Password Mismatch', message: 'New password and confirmation do not match.', type: 'error' });
      return;
    }
    if (pwForm.newPass.length < 8) {
      if (onShowToast) onShowToast({ title: 'Weak Password', message: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const res = await fetch(`${apiBase}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPass })
      });
      if (res.ok) {
        setPwForm({ current: '', newPass: '', confirm: '' });
        if (onShowToast) onShowToast({ title: 'Password Changed', message: 'Your password has been updated securely.', type: 'success' });
      } else {
        const json = await res.json().catch(() => ({}));
        if (onShowToast) onShowToast({ title: 'Error', message: json.message || 'Could not change password.', type: 'error' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: 'Password change failed. Please try again.', type: 'error' });
    } finally { setIsSaving(false); }
  };

  // ── Notification preferences handler ───────────────────────────────────────
  const toggleNotifPref = (key) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    localStorage.setItem('nexus_notification_prefs', JSON.stringify(updated));
  };

  // ── Privacy settings handler ───────────────────────────────────────────────
  const togglePrivacy = (key) => {
    const updated = { ...privacySettings, [key]: !privacySettings[key] };
    setPrivacySettings(updated);
    localStorage.setItem('nexus_privacy_settings', JSON.stringify(updated));
  };

  // ── Theme handler ──────────────────────────────────────────────────────────
  const handleThemeChange = (pref) => {
    setNexusTheme(pref);
    setThemePref(pref);
  };

  // ── Trash restore/delete handlers ──────────────────────────────────────────
  const handleRestoreItem = async (item) => {
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    try {
      const res = await fetch(`${apiBase}/students/trash/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ itemId: item.id || item._id, type: item.type })
      });
      if (res.ok) {
        setTrashBin(prev => prev.filter(t => (t.id || t._id) !== (item.id || item._id)));
        if (onShowToast) onShowToast({ title: 'Item Restored', message: `"${item.name || item.title}" has been restored.`, type: 'success' });
        window.dispatchEvent(new CustomEvent('nexus_data_updated'));
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: 'Could not restore item.', type: 'error' });
    }
  };

  const handlePermanentDelete = async (item) => {
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    try {
      const res = await fetch(`${apiBase}/students/trash/${encodeURIComponent(item.id || item._id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include'
      });
      if (res.ok) {
        setTrashBin(prev => prev.filter(t => (t.id || t._id) !== (item.id || item._id)));
        if (onShowToast) onShowToast({ title: 'Permanently Deleted', message: `"${item.name || item.title}" has been permanently deleted.`, type: 'warning' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: 'Could not delete item.', type: 'error' });
    }
  };

  // ── Account deactivation handler ───────────────────────────────────────────
  const handleDeactivateAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      if (onShowToast) onShowToast({ title: 'Confirmation Required', message: 'Please type "DELETE MY ACCOUNT" exactly to proceed.', type: 'error' });
      return;
    }
    setIsDeactivating(true);
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    try {
      const res = await fetch(`${apiBase}/students/account/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ confirmation: 'DELETE MY ACCOUNT' })
      });
      if (res.ok) {
        localStorage.clear();
        if (onShowToast) onShowToast({ title: 'Account Deactivated', message: 'Your account has been deactivated. You will be redirected.', type: 'warning' });
        setTimeout(() => { window.location.reload(); }, 2000);
      } else {
        const json = await res.json().catch(() => ({}));
        if (onShowToast) onShowToast({ title: 'Error', message: json.message || 'Could not deactivate account.', type: 'error' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ title: 'Error', message: 'Account deactivation failed.', type: 'error' });
    } finally { setIsDeactivating(false); }
  };

  // ── Helper: Toggle Switch ──────────────────────────────────────────────────
  const ToggleSwitch = ({ isOn, onToggle, label, description }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 16px', borderRadius: '10px', background: 'var(--bg-input)',
      border: '1px solid var(--border-subtle)', marginBottom: '10px'
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        {description && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{description}</div>}
      </div>
      <button
        onClick={onToggle}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color: isOn ? 'var(--cyber-emerald)' : 'var(--text-muted)',
          transition: 'color 0.2s ease'
        }}
      >
        {isOn ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
      </button>
    </div>
  );

  // ── Helper: Section Card ───────────────────────────────────────────────────
  const SectionCard = ({ icon: Icon, iconColor, title, children, actionButton }) => (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          {Icon && <Icon size={17} color={iconColor || 'var(--cyber-cyan)'} />} {title}
        </h3>
        {actionButton}
      </div>
      {children}
    </div>
  );

  // ── Helper: Theme Option Card ──────────────────────────────────────────────
  const ThemeOption = ({ value, label, icon: Icon, desc, gradient }) => {
    const isActive = themePref === value;
    return (
      <button
        onClick={() => handleThemeChange(value)}
        style={{
          flex: '1 1 140px', padding: '20px', borderRadius: '12px', cursor: 'pointer',
          background: isActive ? gradient : 'var(--bg-input)',
          border: isActive ? '2px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          transition: 'all 0.25s ease', transform: isActive ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isActive ? '0 0 25px rgba(0, 212, 255, 0.15)' : 'none'
        }}
      >
        <Icon size={24} color={isActive ? '#fff' : 'var(--text-muted)'} />
        <span style={{ fontSize: '13px', fontWeight: isActive ? 800 : 600, color: isActive ? '#fff' : 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontSize: '10px', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>{desc}</span>
        {isActive && <CheckCircle2 size={16} color="var(--cyber-emerald)" />}
      </button>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>

      {/* Top Header & Breadcrumb */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <button
              onClick={() => setActivePage(currentRole === 'institution' ? 'institution-console' : currentRole === 'company' ? 'industry-portal' : 'home')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)', padding: '5px 12px', borderRadius: '6px',
                fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cyber-cyan)'; e.currentTarget.style.borderColor = 'var(--cyber-cyan)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              <ArrowLeft size={13} />
              <span>{currentRole === 'institution' ? 'Back to Institution Console' : currentRole === 'company' ? 'Back to Industry Portal' : 'Back to Dashboard'}</span>
            </button>
            <div className="telemetry-node-tag" style={{ margin: 0 }}>
              <span>{currentRole === 'institution' ? 'INSTITUTION' : currentRole === 'company' ? 'CORPORATE PARTNER' : 'STUDENT DIRECTORY'}</span>
              <span>//</span>
              <span>{currentRole === 'institution' ? 'INSTITUTIONAL SETTINGS' : currentRole === 'company' ? 'INDUSTRY SETTINGS' : 'SETTINGS CENTER'}</span>
            </div>
          </div>
          <h1>{currentRole === 'institution' ? 'Institutional Settings' : currentRole === 'company' ? 'Industry & Corporate Settings' : 'Settings'}</h1>
          <p>{currentRole === 'institution'
            ? 'Manage your institution profile, governance, security, communications, and operational preferences.'
            : currentRole === 'company'
              ? 'Manage your corporate presence, recruiter credentials, AI candidate screening thresholds, and recruitment alert settings.'
              : 'Manage your account, profile, security, notifications, appearance, and privacy preferences.'}</p>
        </div>
      </div>

      {/* ═══════ LAYOUT: Sidebar + Content ═══════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Tab Sidebar */}
        <div className="glass-panel" style={{ padding: '8px', position: 'sticky', top: '20px' }}>
          {activeTabsList.map(tab => {
            const isActive = activeTab === tab.key;
            const isDanger = tab.key === 'danger';
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                  background: isActive ? (isDanger ? 'rgba(244,63,94,0.12)' : 'rgba(0,212,255,0.08)') : 'transparent',
                  border: isActive ? (isDanger ? '1px solid rgba(244,63,94,0.3)' : '1px solid rgba(0,212,255,0.25)') : '1px solid transparent',
                  color: isActive ? (isDanger ? 'var(--cyber-rose)' : 'var(--cyber-cyan)') : 'var(--text-secondary)',
                  transition: 'all 0.2s ease', textAlign: 'left', marginBottom: '2px'
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <tab.icon size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500 }}>{tab.label}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{tab.desc}</div>
                </div>
                {isActive && <ChevronRight size={14} />}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div>
          {/* ═══════ ACCOUNT TAB ═══════ */}
          {activeTab === 'account' && (
            <>
              <SectionCard
                icon={currentRole === 'company' ? Building2 : User}
                iconColor="var(--cyber-cyan)"
                title={currentRole === 'company' ? 'Corporate Account & Recruiter Details' : 'Account Information'}
                actionButton={
                  <button onClick={() => handleSave('Account')} disabled={isSaving} className="btn-cyber-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
                    <Save size={13} /> <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                }
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  {(currentRole === 'company' ? [
                    { label: 'COMPANY NAME', key: 'name', icon: Building2 },
                    { label: 'LEAD RECRUITER NAME', key: 'recruiterName', icon: User },
                    { label: 'OFFICIAL CORPORATE EMAIL', key: 'email', icon: Mail, type: 'email' },
                    { label: 'CONTACT PHONE NUMBER', key: 'phone', icon: Phone },
                    { label: 'CORPORATE HEADQUARTERS', key: 'location', icon: MapPin },
                    { label: 'OFFICIAL WEBSITE / PORTAL', key: 'website', icon: Briefcase }
                  ] : [
                    { label: 'FULL NAME', key: 'name', icon: User },
                    { label: 'EMAIL ADDRESS', key: 'email', icon: Mail, type: 'email' },
                    { label: 'PHONE NUMBER', key: 'phone', icon: Phone },
                    { label: 'LOCATION', key: 'location', icon: MapPin },
                  ]).map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                        <f.icon size={11} /> {f.label}
                      </label>
                      <input
                        type={f.type || 'text'}
                        value={formData[f.key] || ''}
                        onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', transition: 'border 0.2s ease' }}
                        onFocus={e => e.target.style.borderColor = 'var(--cyber-cyan)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                      />
                    </div>
                  ))}
                </div>

                {/* Protected Identifiers */}
                <div style={{ marginTop: '20px', padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={11} /> {currentRole === 'company' ? 'PROTECTED CORPORATE CREDENTIALS (Enterprise Verified)' : 'PROTECTED IDENTIFIERS (Read Only)'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {(currentRole === 'company' ? [
                      { label: 'Corporate Node ID', value: profile.corporateId || user?.companyId || user?.id || 'IND-CORP-902' },
                      { label: 'Industry Domain', value: profile.industry || 'Information Technology & AI' },
                      { label: 'Verification Status', value: profile.verificationStatus || 'Enterprise Verified Corporate Node' },
                      { label: 'Talent Access Tier', value: profile.talentAccessTier || 'Tier-1 All-India Campus Access' }
                    ] : currentRole === 'institution' ? [
                      { label: 'Institution Code', value: user?.institutionCode || user?.aisheCode || 'INS-TN-2024' },
                      { label: 'Affiliation', value: user?.affiliation || 'Anna University' },
                      { label: 'AISHE Status', value: 'Verified Accreditation' },
                      { label: 'Campus Tier', value: 'Autonomous / Center of Excellence' }
                    ] : [
                      { label: 'Student ID', value: profile.regNo || profile.institutionalId || profile.candidateId },
                      { label: 'Institution', value: profile.college },
                      { label: 'Department', value: profile.department },
                      { label: 'Batch / Year', value: profile.gradYear || profile.year }
                    ]).map(f => (
                      <div key={f.label} style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>{f.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: currentRole === 'company' ? 'var(--cyber-cyan)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{f.value || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ═══════ PROFILE TAB ═══════ */}
          {activeTab === 'profile' && (
            <>
              {currentRole === 'company' ? (
                <SectionCard
                  icon={Briefcase}
                  iconColor="var(--cyber-cyan)"
                  title="Corporate Presence & Hiring Parameters"
                  actionButton={
                    <button onClick={() => handleSave('Hiring & Presence')} disabled={isSaving} className="btn-cyber-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
                      <Save size={13} /> <span>{isSaving ? 'Saving...' : 'Save Parameters'}</span>
                    </button>
                  }
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>INDUSTRY SECTOR / DOMAIN</label>
                      <select
                        value={formData.industry || 'Information Technology & Software'}
                        onChange={e => setFormData({ ...formData, industry: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}
                      >
                        <option value="Information Technology & Software">Information Technology & Software</option>
                        <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
                        <option value="Automobile, EV & Smart Mobility">Automobile, EV & Smart Mobility</option>
                        <option value="FinTech & Banking Infrastructure">FinTech & Banking Infrastructure</option>
                        <option value="Healthcare, Biotech & MedTech">Healthcare, Biotech & MedTech</option>
                        <option value="Core Engineering, Electrical & Mechanical">Core Engineering, Electrical & Mechanical</option>
                        <option value="Semiconductors, VLSI & Embedded Systems">Semiconductors, VLSI & Embedded Systems</option>
                        <option value="Cloud Computing & Cyber Defense">Cloud Computing & Cyber Defense</option>
                        <option value="Supply Chain, Logistics & E-Commerce">Supply Chain, Logistics & E-Commerce</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>WORKFORCE SCALE / COMPANY SIZE</label>
                      <select
                        value={formData.companySize || '5,000+ Employees (Global MNC)'}
                        onChange={e => setFormData({ ...formData, companySize: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}
                      >
                        <option value="1-50 Employees (Early Stage / Seed)">1-50 Employees (Early Stage / Seed)</option>
                        <option value="51-250 Employees (Growth Stage)">51-250 Employees (Growth Stage)</option>
                        <option value="251-1,000 Employees (Mid-Market)">251-1,000 Employees (Mid-Market)</option>
                        <option value="1,000-5,000 Employees (Large Enterprise)">1,000-5,000 Employees (Large Enterprise)</option>
                        <option value="5,000+ Employees (Global MNC)">5,000+ Employees (Global MNC)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>COMPANY STRUCTURE / TYPE</label>
                      <select
                        value={formData.companyType || 'Enterprise / Global MNC'}
                        onChange={e => setFormData({ ...formData, companyType: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}
                      >
                        <option value="Enterprise / Global MNC">Enterprise / Global MNC</option>
                        <option value="Private Limited Enterprise">Private Limited Enterprise</option>
                        <option value="DeepTech Startup">DeepTech Startup</option>
                        <option value="R&D Innovation Lab">R&D Innovation Lab</option>
                        <option value="Government PSU / Statutory Enterprise">Government PSU / Statutory Enterprise</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>PRIMARY HIRING FOCUS</label>
                      <input
                        type="text"
                        value={formData.hiringFocus || ''}
                        onChange={e => setFormData({ ...formData, hiringFocus: e.target.value })}
                        placeholder="e.g. Full-Stack Developers, Cloud Architects, AI Engineers"
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* AI Autonomous Fast-Track Screening Threshold Slider */}
                  <div style={{ marginTop: '20px', padding: '18px 20px', borderRadius: '12px', background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={16} color="var(--cyber-cyan)" />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Autonomous Fast-Track Candidate Screening Threshold
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>
                          {formData.autoMatchThreshold ?? 80}%
                        </span>
                        <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.4)', color: 'var(--cyber-cyan)', fontWeight: 700 }}>
                          [AI FILTER ACTIVE]
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="95"
                      value={formData.autoMatchThreshold ?? 80}
                      onChange={e => setFormData({ ...formData, autoMatchThreshold: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--cyber-cyan)', cursor: 'pointer', margin: '8px 0' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <span>70% (Broad Talent Pool)</span>
                      <span>80% (Optimal Standard)</span>
                      <span>95% (Elite Prodigy Filter)</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                      Students with a composite NEXUS AI skill credibility score matching or exceeding this threshold will automatically bypass initial filters and be highlighted directly in your talent acquisition pipeline.
                    </p>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                      CORPORATE OVERVIEW & TALENT VALUE PROPOSITION
                    </label>
                    <textarea
                      rows={4}
                      value={formData.bio || ''}
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Highlight your company culture, technology stack, internship stipends, mentorship programs, and growth opportunities offered to student candidates..."
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.5, outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                </SectionCard>
              ) : (
                <SectionCard icon={Edit3} iconColor="var(--cyber-cyan)" title={currentRole === 'institution' ? "Campus Information" : "Personal Details"}
                  actionButton={
                    <button onClick={() => handleSave('Profile')} disabled={isSaving} className="btn-cyber-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
                      <Save size={13} /> <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  }>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>DATE OF BIRTH</label>
                      <input type="date" value={formData.dob || ''} onChange={e => setFormData({ ...formData, dob: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>GENDER</label>
                      <select value={formData.gender || ''} onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>DESIRED TARGET ROLE</label>
                      <input type="text" value={formData.desiredRole || ''} onChange={e => setFormData({ ...formData, desiredRole: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>CGPA (OUT OF 10.0)</label>
                      <input type="text" value={formData.cgpa || ''} onChange={e => setFormData({ ...formData, cgpa: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>PROFESSIONAL BIO</label>
                    <textarea rows={4} value={formData.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Write a short professional summary about yourself..."
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.5, outline: 'none', resize: 'vertical' }} />
                  </div>
                </SectionCard>
              )}
            </>
          )}

          {/* ═══════ PHOTO TAB ═══════ */}
          {activeTab === 'photo' && (
            <SectionCard icon={Camera} iconColor="var(--cyber-cyan)" title={currentRole === 'company' ? 'Company Brand Logo' : currentRole === 'institution' ? 'Campus Seal / Logo' : 'Profile Photo'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Logo" style={{
                      width: '120px', height: '120px', borderRadius: currentRole === 'company' ? '18px' : '50%', objectFit: 'cover',
                      border: '4px solid var(--cyber-cyan)', boxShadow: '0 0 30px rgba(0,212,255,0.3)',
                      background: '#0B132B'
                    }} />
                  ) : (
                    <div style={{
                      width: '120px', height: '120px', borderRadius: currentRole === 'company' ? '18px' : '50%',
                      background: 'linear-gradient(135deg, #00D4FF, #0055FF)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '4px solid var(--cyber-cyan)', boxShadow: '0 0 30px rgba(0,212,255,0.3)',
                      fontSize: '44px', fontWeight: 800, color: '#fff',
                      userSelect: 'none'
                    }}>
                      {(profile.name || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {profile.avatar ? (currentRole === 'company' ? 'Current corporate logo' : 'Current profile photo') : (currentRole === 'company' ? 'Using generated initials logo' : 'Using initials avatar')}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{
                    padding: '30px', borderRadius: '12px', border: '2px dashed var(--border-subtle)',
                    background: 'rgba(0,212,255,0.02)', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                    onClick={() => fileInputRef.current?.click()}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyber-cyan)'; e.currentTarget.style.background = 'rgba(0,212,255,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'rgba(0,212,255,0.02)'; }}
                  >
                    <Upload size={32} color="var(--cyber-cyan)" style={{ marginBottom: '10px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Click to upload corporate logo or drag & drop</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPEG, SVG or WebP • Recommended 400x400 • Max 5MB</div>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                    <button onClick={() => fileInputRef.current?.click()} className="btn-cyber-primary" style={{ fontSize: '12px', padding: '9px 18px' }}>
                      <Upload size={13} /> <span>{currentRole === 'company' ? 'Upload Brand Logo' : 'Upload New Photo'}</span>
                    </button>
                    {profile.avatar && (
                      <button onClick={handleRemovePhoto} className="btn-cyber-outline" style={{ fontSize: '12px', padding: '9px 18px', color: 'var(--cyber-rose)', borderColor: 'rgba(244,63,94,0.3)' }}>
                        <Trash2 size={13} /> <span>{currentRole === 'company' ? 'Remove Logo' : 'Remove Photo'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ═══════ SECURITY TAB ═══════ */}
          {activeTab === 'security' && (
            <>
              <SectionCard icon={Lock} iconColor="#FF9D4D" title="Change Password">
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px' }}>
                  {[
                    { label: 'CURRENT PASSWORD', key: 'current', show: showCurrentPw, toggle: () => setShowCurrentPw(!showCurrentPw) },
                    { label: 'NEW PASSWORD', key: 'newPass', show: showNewPw, toggle: () => setShowNewPw(!showNewPw) },
                    { label: 'CONFIRM NEW PASSWORD', key: 'confirm', show: showNewPw, toggle: () => setShowNewPw(!showNewPw) },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>{f.label}</label>
                      <div style={{ position: 'relative' }}>
                        <input type={f.show ? 'text' : 'password'} value={pwForm[f.key] || ''} onChange={e => setPwForm({ ...pwForm, [f.key]: e.target.value })} required
                          style={{ width: '100%', padding: '10px 40px 10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                        <button type="button" onClick={f.toggle} style={{
                          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0
                        }}>
                          {f.show ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" disabled={isSaving} className="btn-cyber-primary" style={{ fontSize: '12.5px', padding: '10px 20px' }}>
                      <Lock size={13} /> <span>{isSaving ? 'Updating...' : 'Update Password'}</span>
                    </button>
                  </div>
                </form>
              </SectionCard>

              {currentRole === 'company' && (
                <SectionCard icon={Key} iconColor="var(--cyber-cyan)" title="Recruiter ATS & API Integration Keys">
                  <div style={{ padding: '16px 20px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Live Recruiter Integration Token</span>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(46,224,161,0.12)', border: '1px solid rgba(46,224,161,0.35)', color: 'var(--cyber-emerald)', fontWeight: 700 }}>
                        Active Enterprise Key
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="password"
                        readOnly
                        value="nx_live_corp_9942a08f87e14cb788390b"
                        style={{ flex: 1, padding: '9px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText('nx_live_corp_9942a08f87e14cb788390b');
                          if (onShowToast) onShowToast({ title: 'Token Copied', message: 'Corporate ATS token copied to clipboard.', type: 'info' });
                        }}
                        className="btn-cyber-outline"
                        style={{ fontSize: '11px', padding: '8px 14px' }}
                      >
                        Copy Token
                      </button>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Use this bearer token to synchronize candidate shortlists with external ATS platforms (Workday, Greenhouse, Taleo).
                    </div>
                  </div>
                </SectionCard>
              )}

              <SectionCard icon={Shield} iconColor="var(--cyber-emerald)" title="Two-Factor Authentication">
                <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(46,224,161,0.06)', border: '1px solid rgba(46,224,161,0.25)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Shield size={24} color="var(--cyber-emerald)" />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Two-Factor Authentication</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>Add an extra layer of security to your corporate account with 2FA verification.</div>
                  </div>
                  <button className="btn-cyber-outline" style={{ marginLeft: 'auto', fontSize: '12px', padding: '8px 14px' }}>
                    <Zap size={13} /> <span>Coming Soon</span>
                  </button>
                </div>
              </SectionCard>
            </>
          )}

          {/* ═══════ NOTIFICATIONS TAB ═══════ */}
          {activeTab === 'notifications' && (
            <SectionCard icon={Bell} iconColor="#8B5CF6" title={currentRole === 'company' ? 'Recruitment Alert Preferences' : 'Notification Preferences'}>
              {(currentRole === 'company' ? [
                { key: 'candidateApplications', label: 'Candidate Applications', desc: 'Instant alerts when students submit applications for posted roles or internships' },
                { key: 'autoMatchAlerts', label: 'AI Auto-Match Alerts', desc: 'Notify when high-confidence candidates (>=85%) match your open technical requisitions' },
                { key: 'campusDriveInvites', label: 'Campus Placement Drive Invites', desc: 'Direct requests and invitation links from accredited engineering & polytechnic institutions' },
                { key: 'interviewMessages', label: 'Candidate Inquiries & Direct Messages', desc: 'Real-time messages from shortlisted applicants and interview candidates' },
                { key: 'talentDigest', label: 'Weekly Talent Intelligence Digest', desc: 'Comprehensive summary of emerging skills, top cohort performers, and university trends' },
                { key: 'systemUpdates', label: 'Platform & Operational Updates', desc: 'Security updates, compliance notices, and new portal recruitment features' }
              ] : [
                { key: 'courseUpdates', label: 'Course Updates', desc: 'Notifications about course deadlines, progress, and new content' },
                { key: 'opportunityAlerts', label: 'Opportunity Alerts', desc: 'Get notified when new internships or jobs match your profile' },
                { key: 'skillVerification', label: 'Skill Verification', desc: 'Alerts when your skills are verified or need re-assessment' },
                { key: 'applicationStatus', label: 'Application Status', desc: 'Updates about your job/internship applications' },
                { key: 'systemUpdates', label: 'System & Platform Updates', desc: 'Important announcements and feature releases' },
                { key: 'emailDigest', label: 'Weekly Email Digest', desc: 'Receive a weekly summary of activities and opportunities' },
                { key: 'mentorMessages', label: 'Mentor Messages', desc: 'Notifications from mentors and advisors' },
                { key: 'peerActivity', label: 'Peer Activity', desc: 'See when peers complete courses or earn certificates' }
              ]).map(pref => (
                <ToggleSwitch
                  key={pref.key}
                  isOn={notifPrefs[pref.key] !== false}
                  onToggle={() => toggleNotifPref(pref.key)}
                  label={pref.label}
                  description={pref.desc}
                />
              ))}
            </SectionCard>
          )}

          {/* ═══════ APPEARANCE TAB ═══════ */}
          {activeTab === 'appearance' && (
            <SectionCard icon={Palette} iconColor="var(--cyber-cyan)" title="Theme & Display">
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <ThemeOption value="light" label="Light Mode" icon={Sun} desc="Clean and bright" gradient="linear-gradient(135deg, #f8fafc, #e2e8f0)" />
                <ThemeOption value="dark" label="Dark Mode" icon={Moon} desc="Easy on the eyes" gradient="linear-gradient(135deg, #0f172a, #1e293b)" />
                <ThemeOption value="system" label="System" icon={Monitor} desc="Follow OS settings" gradient="linear-gradient(135deg, #4f46e5, #06b6d4)" />
              </div>

              <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>ACTIVE THEME</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--cyber-emerald)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {themePref === 'light' ? 'Light Mode' : themePref === 'dark' ? 'Dark Mode' : 'System Preference'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    (Resolved: {getResolvedTheme(themePref)})
                  </span>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ═══════ PRIVACY TAB ═══════ */}
          {activeTab === 'privacy' && (
            <SectionCard icon={Shield} iconColor="var(--cyber-purple)" title={currentRole === 'company' ? 'Corporate Visibility & Talent Access Controls' : 'Privacy & Visibility Controls'}>
              {(currentRole === 'company' ? [
                { key: 'publicCompanyProfile', label: 'Public Corporate Directory Profile', desc: 'Allow colleges, universities, and students to discover your company profile in the talent portal' },
                { key: 'directInquiries', label: 'Allow Direct Student Pitches', desc: 'Permit verified students with matching skill badges to send direct introduction pitches' },
                { key: 'hiringMetrics', label: 'Display Hiring Scale & Metrics', desc: 'Showcase your company annual campus hire count and student selection badges to attract top candidates' },
                { key: 'salaryBenchmarks', label: 'Stipend & Salary Transparency', desc: 'Display transparent compensation benchmarks and stipend bands on opportunity cards' },
                { key: 'campusVisibility', label: 'Campus Placement Partner Visibility', desc: 'Feature your brand on partner university placement boards and hiring leaderboards' }
              ] : [
                { key: 'showEmail', label: 'Show Email to Companies', desc: 'Allow companies to see your email address in candidate profiles' },
                { key: 'showPhone', label: 'Show Phone Number', desc: 'Display phone number in your public profile' },
                { key: 'showCGPA', label: 'Show CGPA', desc: 'Include CGPA in your talent discovery profile' },
                { key: 'profileDiscoverable', label: 'Profile Discoverable', desc: 'Allow companies to find you through talent search' },
                { key: 'showProjects', label: 'Show Projects', desc: 'Allow viewing of your project portfolio' },
                { key: 'showCertificates', label: 'Show Certificates', desc: 'Display earned certificates to recruiters' },
                { key: 'allowDataExport', label: 'Allow Data Export', desc: 'Enable platform to include your data in institutional reports' }
              ]).map(pref => (
                <ToggleSwitch
                  key={pref.key}
                  isOn={privacySettings[pref.key] !== false}
                  onToggle={() => togglePrivacy(pref.key)}
                  label={pref.label}
                  description={pref.desc}
                />
              ))}
            </SectionCard>
          )}

          {/* ═══════ DATA & TRASH TAB ═══════ */}
          {activeTab === 'data' && (
            <>
              <SectionCard icon={Archive} iconColor="#FF9D4D" title={currentRole === 'company' ? 'Requisition Archive & Talent History' : 'Trash Bin — Recoverable Items'}>
                {trashBin.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {trashBin.map((item, i) => (
                      <div key={item.id || item._id || i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', borderRadius: '10px',
                        background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap', gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Trash2 size={16} color="#FF9D4D" />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name || item.title || 'Unnamed item'}</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                              Type: {item.type || 'Unknown'} {item.deletedAt ? ` • Deleted ${new Date(item.deletedAt).toLocaleDateString()}` : ''}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleRestoreItem(item)} className="btn-cyber-outline" style={{ fontSize: '11px', padding: '6px 12px' }}>
                            <RotateCcw size={12} /> Restore
                          </button>
                          <button onClick={() => handlePermanentDelete(item)} style={{
                            padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                            color: 'var(--cyber-rose)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                          }}>
                            <X size={12} /> Delete Forever
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)',
                    border: '1px dashed var(--border-subtle)', borderRadius: '10px'
                  }}>
                    <Archive size={32} color="var(--text-muted)" style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{currentRole === 'company' ? 'No archived requisitions' : 'Trash bin is empty'}</div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>{currentRole === 'company' ? 'Expired job postings and archived candidate pipelines will appear here.' : 'Deleted items will appear here for recovery.'}</div>
                  </div>
                )}
              </SectionCard>

              <SectionCard icon={Download} iconColor="var(--cyber-cyan)" title="Corporate Talent Data Export">
                <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <Download size={22} color="var(--cyber-cyan)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Export Your Corporate Recruitment Records</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>Download a complete report of active job requisitions, candidate evaluation scores, interview logs, and candidate shortlists in CSV / JSON format.</div>
                  </div>
                  <button
                    onClick={() => {
                      if (onShowToast) onShowToast({ title: 'Export Initiated', message: 'Corporate recruitment dataset downloaded successfully.', type: 'success' });
                    }}
                    className="btn-cyber-primary"
                    style={{ fontSize: '12px', padding: '9px 16px' }}
                  >
                    <Download size={13} /> <span>Request Export</span>
                  </button>
                </div>
              </SectionCard>
            </>
          )}

          {/* ═══════ DANGER ZONE TAB ═══════ */}
          {activeTab === 'danger' && (
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.03)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cyber-rose)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <AlertTriangle size={18} /> {currentRole === 'company' ? 'Danger Zone — Corporate Account Termination' : 'Danger Zone — Account Deletion'}
              </h3>

              <div style={{
                padding: '20px', borderRadius: '10px',
                background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cyber-rose)', marginBottom: '8px' }}>
                  ⚠️ This action is irreversible
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {currentRole === 'company' ? 'Terminating your corporate account will:' : 'Deactivating your account will:'}
                  <ul style={{ margin: '8px 0 0 16px', padding: 0, listStyle: 'disc' }}>
                    {currentRole === 'company' ? (
                      <>
                        <li>Unlist your enterprise profile from all university placement partner directories</li>
                        <li>Cancel all active job, internship, and apprenticeship postings</li>
                        <li>Terminate scheduled candidate interviews and ongoing recruitment drives</li>
                        <li>Revoke all corporate recruiter credentials and ATS API keys</li>
                      </>
                    ) : (
                      <>
                        <li>Remove your profile from talent discovery</li>
                        <li>Cancel all active course enrollments</li>
                        <li>Withdraw all pending applications</li>
                        <li>Delete all uploaded documents</li>
                        <li>Revoke all active sessions</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {deactivateStep === 0 && (
                <button onClick={() => setDeactivateStep(1)}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                    background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.4)',
                    color: 'var(--cyber-rose)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                  <AlertTriangle size={14} /> {currentRole === 'company' ? 'I want to terminate my corporate account' : 'I want to deactivate my account'}
                </button>
              )}

              {deactivateStep === 1 && (
                <div style={{
                  padding: '20px', borderRadius: '10px',
                  background: 'rgba(244,63,94,0.08)', border: '2px solid rgba(244,63,94,0.4)'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cyber-rose)', marginBottom: '12px' }}>
                    Type <code style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(244,63,94,0.15)', fontSize: '12px' }}>DELETE MY ACCOUNT</code> to confirm:
                  </div>
                  <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="Type confirmation text..."
                    style={{
                      width: '100%', padding: '12px', background: 'var(--bg-input)',
                      border: deleteConfirmText === 'DELETE MY ACCOUNT' ? '2px solid var(--cyber-rose)' : '1px solid var(--border-subtle)',
                      borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                      marginBottom: '14px'
                    }} />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setDeactivateStep(0); setDeleteConfirmText(''); }}
                      className="btn-cyber-outline" style={{ fontSize: '12.5px', padding: '10px 18px' }}>
                      Cancel
                    </button>
                    <button onClick={handleDeactivateAccount} disabled={isDeactivating || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                      style={{
                        padding: '10px 22px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
                        background: deleteConfirmText === 'DELETE MY ACCOUNT' ? 'var(--cyber-rose)' : 'rgba(244,63,94,0.2)',
                        color: deleteConfirmText === 'DELETE MY ACCOUNT' ? '#fff' : 'var(--text-muted)',
                        border: 'none', cursor: deleteConfirmText === 'DELETE MY ACCOUNT' ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}>
                      <AlertTriangle size={13} /> {isDeactivating ? 'Processing...' : (currentRole === 'company' ? 'Terminate Corporate Account' : 'Permanently Delete Account')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
