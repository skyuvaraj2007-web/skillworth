import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  ArrowLeft,
  ShieldCheck,
  Award,
  BookOpen,
  Briefcase,
  FolderGit2,
  Edit3,
  Check,
  X,
  Plus,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Building2,
  Sparkles,
  ExternalLink,
  Code,
  Save,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  TrendingUp,
  Upload,
  FileText,
  Download,
  Trash2,
  Camera,
  CircleUser,
  BarChart3,
  Clock,
  Hash,
  Target,
  ChevronRight,
  AlertCircle,
  MessageSquare,
  Flame
} from 'lucide-react';
import { loadStudentProfile, saveStudentProfile, calculateProfileCompletion } from '../services/profileStore';
import { normalizeRole } from '../services/notificationStore';

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALS AVATAR GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════
function InitialsAvatar({ name, size = 84 }) {
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

export default function MyProfile({ setActivePage, onShowToast, user }) {
  const [profile, setProfile] = useState(() => loadStudentProfile());
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(() => loadStudentProfile());
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('Resume');
  const [enrollments, setEnrollments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [commProfile, setCommProfile] = useState(null);

  const currentRole = normalizeRole(user?.role);
  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

  const [instProfile, setInstProfile] = useState(() => {
    try { const raw = localStorage.getItem('nexus_institution_profile'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [compProfile, setCompProfile] = useState(() => {
    try { const raw = localStorage.getItem('nexus_industry_profile'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });

  const instData = instProfile || {
    institutionName: user?.institutionName || user?.name || 'Institution Information Unavailable',
    campusId: user?.campusId || user?.code || user?.id || '—',
    email: user?.email || '—',
    collegeId: user?.collegeId || user?.code || user?.id || '—',
    district: user?.district || user?.city || '—',
    university: user?.university || user?.affiliation || '—',
    type: user?.type || 'Educational Institution',
    website: user?.website || '—',
    phone: user?.phone || '—',
    contactPerson: user?.contactPerson || user?.name || '—',
    departments: user?.departments || [],
    studentCount: user?.studentCount || 0,
    coursesOffered: user?.coursesOffered || 0
  };

  const compData = compProfile || {
    companyName: user?.companyName || user?.name || 'Company Information Unavailable',
    recruiterHandle: user?.recruiterHandle || user?.companyId || user?.id || '—',
    email: user?.email || '—',
    contactPerson: user?.contactPerson || user?.name || '—',
    industry: user?.industry || 'Technology & Innovation',
    location: user?.location || (user?.city ? `${user.city}, ${user.state || ''}` : '—'),
    website: user?.website || '—',
    phone: user?.phone || '—',
    preferredSkills: user?.preferredSkills || [],
    preferredRoles: user?.preferredRoles || [],
    experienceLevel: user?.experienceLevel || 'All Undergraduate Years',
    internshipType: user?.internshipType || 'Full-time / Internship'
  };

  const [isEditingInst, setIsEditingInst] = useState(false);
  const [instFormData, setInstFormData] = useState(instData);
  const [isEditingComp, setIsEditingComp] = useState(false);
  const [compFormData, setCompFormData] = useState(compData);

  // ── Fetch all profile sections from backend ────────────────────────────────
  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
    const opts = { headers, credentials: 'include' };

    // Institution profile fetch
    if (currentRole === 'institution') {
      try {
        const res = await fetch(`${apiBase}/academic/profile`, opts);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setInstProfile(json.data);
            setInstFormData(json.data);
          }
        }
      } catch (err) {
        console.debug('Institution profile fetch deferred:', err);
      }
      return;
    }

    // Company / Industry profile fetch
    if (currentRole === 'company' || currentRole === 'industry') {
      try {
        const res = await fetch(`${apiBase}/company/profile`, opts);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setCompProfile(json.data);
            setCompFormData(json.data);
          }
        }
      } catch (err) {
        console.debug('Company profile fetch deferred:', err);
      }
      return;
    }

    try {
      const [profRes, docRes, statsRes, appRes, commRes] = await Promise.allSettled([
        fetch(`${apiBase}/students/profile`, opts),
        fetch(`${apiBase}/students/documents`, opts),
        fetch(`${apiBase}/students/dashboard`, opts),
        fetch(`${apiBase}/students/applications`, opts),
        fetch(`${apiBase}/communication/profile`, opts)
      ]);

      // Profile
      if (profRes.status === 'fulfilled' && profRes.value.ok) {
        const json = await profRes.value.json();
        if (json.success && json.data) {
          const d = json.data;
          const mapped = {
            name: d.name || d.fullName || '',
            email: d.email || '',
            phone: d.phone || d.phoneNumber || '',
            bio: d.bio || '',
            dob: d.dob || '',
            gender: d.gender || '',
            location: d.location || '',
            avatar: d.avatar || '',
            college: d.institutionName || d.collegeName || d.college || '',
            collegeId: d.institutionId || d.collegeId || '',
            institutionId: d.institutionId || d.collegeId || '',
            degree: d.degree || d.course || '',
            department: d.department || d.departmentName || '',
            gradYear: d.batch || d.gradYear || d.graduationYear || '',
            year: d.year || '',
            semester: d.semester || '',
            regNo: d.regNo || d.registerNumber || d.studentId || '',
            desiredRole: d.careerGoals || d.desiredRole || d.targetRole || (d.preferredRoles && d.preferredRoles[0]) || '',
            cgpa: d.cgpa || '0.00',
            creditsCompleted: Number(d.creditsCompleted) || 0,
            totalCredits: Number(d.totalCredits) || 160,
            courseCompletionPercentage: d.courseCompletionPercentage || 0,
            activeBacklogs: d.activeBacklogs || 0,
            skills: Array.isArray(d.skills) ? d.skills.map(s => typeof s === 'string' ? s : s.name) : [],
            certifications: Array.isArray(d.certifications) ? d.certifications : [],
            trashBin: Array.isArray(d.trashBin) ? d.trashBin : [],
            modalities: d.modalities || { hybrid: false, remote: false, onsite: false },
            candidateId: d.studentId || d.candidateId || '',
            institutionalId: d.regNo || d.registerNumber || d.studentId || ''
          };
          setProfile(prev => ({ ...prev, ...mapped, achievements: prev.achievements || { projectsCompleted: 0, verifiedSkills: 0, coursesCompleted: 0, opportunitiesMatched: 0 } }));
          setFormData(prev => ({ ...prev, ...mapped, achievements: prev.achievements || { projectsCompleted: 0, verifiedSkills: 0, coursesCompleted: 0, opportunitiesMatched: 0 } }));
        }
      }

      // Documents
      if (docRes.status === 'fulfilled' && docRes.value.ok) {
        const json = await docRes.value.json();
        if (json.data) setDocuments(json.data);
      }

      // Communication Telemetry
      if (commRes && commRes.status === 'fulfilled' && commRes.value.ok) {
        const json = await commRes.value.json();
        if (json.success && json.data) setCommProfile(json.data);
      }

      // Dashboard stats (projects, enrollments, etc.)
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const json = await statsRes.value.json();
        if (json.success && json.data) {
          const dd = json.data;
          setProjects(dd.projects || []);
          setProfile(prev => ({
            ...prev,
            achievements: {
              projectsCompleted: dd.projectsCompleted || 0,
              verifiedSkills: dd.skillsVerified || 0,
              coursesCompleted: dd.coursesCompleted || 0,
              opportunitiesMatched: dd.opportunitiesApplied || 0
            }
          }));
        }
      }

      // Applications
      if (appRes.status === 'fulfilled' && appRes.value.ok) {
        const json = await appRes.value.json();
        if (json.data) setApplications(json.data);
      }

      // Enrollments
      try {
        const enrollRes = await fetch(`${apiBase}/learning/enrollments`, opts);
        if (enrollRes.ok) {
          const json = await enrollRes.json();
          setEnrollments(json.data || json.enrollments || []);
        }
      } catch {}

      // Certificates
      try {
        const certRes = await fetch(`${apiBase}/academic/course-certificates`, opts);
        if (certRes.ok) {
          const json = await certRes.json();
          setCertificates(json.data || []);
        }
      } catch {}
    } catch (err) {
      console.debug('Profile fetch deferred:', err);
    }
  }, [apiBase, currentRole]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const handleProfileUpdate = (e) => {
      if (e.detail) {
        setProfile(prev => ({ ...prev, ...e.detail }));
        if (!isEditing) setFormData(prev => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener('nexus_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('nexus_profile_updated', handleProfileUpdate);
  }, [isEditing]);

  // ── Edit / Save / Cancel Handlers ──────────────────────────────────────────
  const handleToggleEdit = () => {
    if (isEditing) {
      setFormData(profile);
      setIsEditing(false);
    } else {
      setFormData(profile);
      setIsEditing(true);
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setNewSkill('');
      setShowSkillInput(false);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const updated = saveStudentProfile(formData);
      setProfile(prev => ({ ...prev, ...updated }));
      setIsEditing(false);

      // Persist to backend
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      await fetch(`${apiBase}/students/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name, phone: formData.phone, department: formData.department,
          degree: formData.degree, course: formData.degree, batch: formData.gradYear,
          cgpa: formData.cgpa, creditsCompleted: Number(formData.creditsCompleted) || 0,
          totalCredits: Number(formData.totalCredits) || 160, activeBacklogs: Number(formData.activeBacklogs) || 0,
          careerGoals: formData.desiredRole, desiredRole: formData.desiredRole,
          bio: formData.bio || '', location: formData.location || '',
          dob: formData.dob || '', gender: formData.gender || '',
          avatar: formData.avatar || '',
          skills: Array.isArray(formData.skills) ? formData.skills.map(s => typeof s === 'string' ? { name: s, level: 'Intermediate', confidence: 75, verified: false } : s) : []
        })
      });

      window.dispatchEvent(new CustomEvent('nexus_students_updated'));
      window.dispatchEvent(new CustomEvent('nexus_data_updated'));
      if (onShowToast) onShowToast({ title: 'Profile Updated', message: 'Your profile has been saved and synchronized.', type: 'success' });
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast({ title: 'Update Error', message: 'Could not synchronize profile. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Profile Completion ─────────────────────────────────────────────────────
  const completion = calculateProfileCompletion(profile, documents, projects);

  // ── Institution & Company Save Handlers ─────────────────────────────────────
  const handleSaveInst = async (e) => {
    if (e) e.preventDefault();
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const res = await fetch(`${apiBase}/academic/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify(instFormData)
      });
      if (res.ok) {
        const json = await res.json();
        const updated = json.data || instFormData;
        localStorage.setItem('nexus_institution_profile', JSON.stringify(updated));
        setInstProfile(updated);
        setInstFormData(updated);
        setIsEditingInst(false);
        if (onShowToast) onShowToast({ title: 'Institution Profile Updated', message: 'Academic details saved successfully.', type: 'success' });
        return;
      }
    } catch (err) {
      console.error('Institution profile save error:', err);
    }
    localStorage.setItem('nexus_institution_profile', JSON.stringify(instFormData));
    setInstProfile(instFormData);
    setIsEditingInst(false);
    if (onShowToast) onShowToast({ title: 'Institution Profile Updated', message: 'Academic details saved locally.', type: 'success' });
  };

  const handleSaveComp = async (e) => {
    if (e) e.preventDefault();
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const res = await fetch(`${apiBase}/company/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify(compFormData)
      });
      if (res.ok) {
        const json = await res.json();
        const updated = json.data || compFormData;
        localStorage.setItem('nexus_industry_profile', JSON.stringify(updated));
        setCompProfile(updated);
        setCompFormData(updated);
        setIsEditingComp(false);
        if (onShowToast) onShowToast({ title: 'Company Profile Updated', message: 'Company details saved successfully.', type: 'success' });
        return;
      }
    } catch (err) {
      console.error('Company profile save error:', err);
    }
    localStorage.setItem('nexus_industry_profile', JSON.stringify(compFormData));
    setCompProfile(compFormData);
    setIsEditingComp(false);
    if (onShowToast) onShowToast({ title: 'Company Profile Updated', message: 'Company details saved locally.', type: 'success' });
  };

  // ── Photo upload handler ───────────────────────────────────────────────────
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      if (onShowToast) onShowToast({ title: 'File Too Large', message: 'Maximum photo size is 5MB.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const avatarData = reader.result;
      setProfile(prev => ({ ...prev, avatar: avatarData }));
      setFormData(prev => ({ ...prev, avatar: avatarData }));
      saveStudentProfile({ ...profile, avatar: avatarData });
      if (onShowToast) onShowToast({ title: 'Photo Updated', message: 'Your profile photo has been updated.', type: 'success' });
    };
    reader.readAsDataURL(file);
  };

  // ── Document upload handler ────────────────────────────────────────────────
  const handleDocUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      if (onShowToast) onShowToast({ title: 'File Too Large', message: 'Maximum file size is 10MB.', type: 'error' });
      return;
    }
    setIsUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch(`${apiBase}/students/documents`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ title: file.name.replace(/\.[^/.]+$/, ''), type: uploadDocType, fileName: file.name, fileBase64: reader.result, mimeType: file.type || 'application/pdf' })
        });
        if (res.ok) {
          const json = await res.json();
          setDocuments(prev => [json.data, ...prev]);
          if (onShowToast) onShowToast({ title: 'Document Uploaded!', message: `"${file.name}" stored securely.`, type: 'success' });
        }
      } catch (err) { console.error('Upload failed:', err); }
      finally { setIsUploadingDoc(false); }
    };
    reader.readAsDataURL(file);
  };

  // ── Application stats ──────────────────────────────────────────────────────
  const appStats = {
    applied: applications.length,
    shortlisted: applications.filter(a => ['Shortlisted', 'shortlisted', 'Interview', 'interview'].includes(a.stage || a.status)).length,
    selected: applications.filter(a => ['Offer', 'offer', 'Selected', 'selected', 'Accepted', 'accepted'].includes(a.stage || a.status)).length
  };

  // ─────────────────────── RENDER ─────────────────────────────────────────────

  // Helper: Section card wrapper
  const SectionCard = ({ icon: Icon, iconColor, title, rightAction, children }) => (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          {Icon && <Icon size={17} color={iconColor || 'var(--cyber-cyan)'} />} {title}
        </h3>
        {rightAction}
      </div>
      {children}
    </div>
  );

  // Helper: Info cell
  const InfoCell = ({ label, value, accent, mono }) => (
    <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '13.5px', fontWeight: 600, color: accent || 'var(--text-primary)', marginTop: '2px', ...(mono ? { fontFamily: 'var(--font-mono)' } : {}) }}>
        {value || '—'}
      </div>
    </div>
  );

  // Helper: Certificate badge color
  const certBadgeStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'verified' || s === 'approved') return { bg: 'rgba(46, 224, 161, 0.12)', color: 'var(--cyber-emerald)', border: 'rgba(46, 224, 161, 0.3)', label: 'Verified' };
    if (s === 'rejected') return { bg: 'rgba(244, 63, 94, 0.12)', color: 'var(--cyber-rose)', border: 'rgba(244, 63, 94, 0.3)', label: 'Rejected' };
    return { bg: 'rgba(255, 157, 77, 0.12)', color: '#FF9D4D', border: 'rgba(255, 157, 77, 0.3)', label: 'Pending Verification' };
  };

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
              <span>Back to Dashboard</span>
            </button>
            <div className="telemetry-node-tag" style={{ margin: 0 }}>
              <span>{currentRole === 'institution' ? 'ACADEMIA DIRECTORY' : currentRole === 'company' ? 'CORPORATE DIRECTORY' : 'STUDENT IDENTITY LEDGER'}</span>
              <span>//</span>
              <span>{currentRole === 'institution' ? 'INSTITUTION PROFILE' : currentRole === 'company' ? 'COMPANY PROFILE' : 'CANDIDATE DOSSIER'}</span>
            </div>
          </div>
          <h1>{currentRole === 'institution' ? 'Institution Profile' : currentRole === 'company' ? 'Company Profile' : 'My Profile'}</h1>
          <p>
            {currentRole === 'institution' ? 'Manage your institution profile, academic information, and official contact details.' :
             currentRole === 'company' ? 'Manage your company profile, hiring preferences, and talent requirements.' :
             'Your complete student profile overview — personal, academic, skills, courses, projects, and certificates.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentRole === 'student' && (
            <>
              <button onClick={() => setActivePage('passport')} className="btn-cyber-outline" style={{ fontSize: '12.5px', padding: '8px 14px' }}>
                <ShieldCheck size={14} color="var(--cyber-emerald)" /> <span>Digital Passport</span>
              </button>
              <button onClick={handleToggleEdit} className={isEditing ? 'btn-cyber-outline' : 'btn-cyber-primary'} style={{ fontSize: '12.5px', padding: '8px 16px' }}>
                {isEditing ? (<><X size={14} /><span>Cancel Editing</span></>) : (<><Edit3 size={14} /><span>Edit Profile</span></>)}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ══ STUDENT PROFILE CONTENT ══ */}
      {currentRole === 'student' && (
      <>
      {/* ═══════════════ PROFILE HEADER CARD ═══════════════ */}
      <div className="glass-panel" style={{
        padding: '28px', marginBottom: '24px', position: 'relative', overflow: 'hidden',
        border: '1px solid var(--border-glow)', background: 'var(--grad-hero-banner)'
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '300px', height: '100%',
          background: 'radial-gradient(circle at top right, rgba(0, 212, 255, 0.1), transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
            {/* Profile Photo or Initials Avatar */}
            <div style={{ position: 'relative' }}>
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name || 'Student Profile'}
                  style={{
                    width: '84px', height: '84px', borderRadius: '50%',
                    objectFit: 'cover', border: '3px solid var(--cyber-cyan)',
                    boxShadow: '0 0 20px rgba(0, 212, 255, 0.25)'
                  }}
                />
              ) : (
                <InitialsAvatar name={profile.name} size={84} />
              )}
              <label style={{
                position: 'absolute', bottom: '0px', right: '0px',
                width: '26px', height: '26px', borderRadius: '50%',
                background: 'var(--cyber-cyan)', border: '2px solid #0B1120',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}>
                <Camera size={12} color="#0B1120" strokeWidth={2.5} />
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </label>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{profile.name}</h2>
                <span className="cyber-badge badge-emerald" style={{ fontSize: '9px', padding: '3px 8px' }}>
                  <ShieldCheck size={11} style={{ marginRight: '4px' }} /> Verified Student
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--cyber-cyan)', fontWeight: 600, marginTop: '4px' }}>{profile.desiredRole || 'Career goal not set'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Building2 size={13} color="var(--text-muted)" /> {profile.college || 'Institution not set'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><GraduationCap size={13} color="var(--text-muted)" /> {profile.department || 'Dept'} • {profile.year || profile.gradYear || '—'}</span>
                {profile.email && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={13} color="var(--text-muted)" /> {profile.email}</span>}
                {profile.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={13} color="var(--text-muted)" /> {profile.phone}</span>}
              </div>
            </div>
          </div>

          {/* Profile Completion Badge */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)', minWidth: '120px'
          }}>
            <div style={{
              position: 'relative', width: '56px', height: '56px'
            }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke={completion.percentage >= 80 ? 'var(--cyber-emerald)' : completion.percentage >= 50 ? 'var(--cyber-cyan)' : '#FF9D4D'}
                  strokeWidth="3" strokeDasharray={`${completion.percentage}, 100`} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {completion.percentage}%
              </div>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>Profile</div>
          </div>
        </div>
      </div>

      {isEditing ? (
        /* ═══════════════ EDIT PROFILE FORM MODE ═══════════════ */
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Personal Information */}
          <SectionCard icon={User} iconColor="var(--cyber-cyan)" title="Personal Information">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {[
                { label: 'FULL NAME', key: 'name', required: true },
                { label: 'INSTITUTIONAL EMAIL', key: 'email', type: 'email', required: true },
                { label: 'PHONE NUMBER', key: 'phone' },
                { label: 'LOCATION / CAMPUS', key: 'location' },
                { label: 'DATE OF BIRTH', key: 'dob', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>{f.label}</label>
                  <input type={f.type || 'text'} required={f.required} value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>GENDER</label>
                <select value={formData.gender || ''} onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </SectionCard>

          {/* Academic Information */}
          <SectionCard icon={GraduationCap} iconColor="var(--cyber-emerald)" title="Academic Information">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {[
                { label: 'COLLEGE / UNIVERSITY', key: 'college', required: true },
                { label: 'DEGREE & MAJOR', key: 'degree', required: true },
                { label: 'DEPARTMENT', key: 'department' },
                { label: 'GRADUATION YEAR / BATCH', key: 'gradYear' },
                { label: 'CGPA (OUT OF 10.0)', key: 'cgpa', placeholder: 'e.g. 8.50' },
                { label: 'ACTIVE BACKLOGS', key: 'activeBacklogs', type: 'number' },
                { label: 'CREDITS COMPLETED', key: 'creditsCompleted', type: 'number' },
                { label: 'TOTAL PROGRAM CREDITS', key: 'totalCredits', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>{f.label}</label>
                  <input type={f.type || 'text'} required={f.required} placeholder={f.placeholder || ''}
                    value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Career Targets */}
          <SectionCard icon={Briefcase} iconColor="var(--cyber-purple)" title="Career Targets & Goals">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>DESIRED TARGET ROLE</label>
                <input type="text" value={formData.desiredRole || ''} onChange={e => setFormData({ ...formData, desiredRole: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>PROFESSIONAL BIO</label>
                <textarea rows={3} value={formData.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.5, outline: 'none', resize: 'vertical' }} />
              </div>
            </div>
          </SectionCard>

          {/* Skills */}
          <SectionCard icon={Code} iconColor="var(--cyber-cyan)" title="Skills & Tech Stack"
            rightAction={
              <button type="button" onClick={() => setShowSkillInput(true)}
                style={{ background: 'none', border: 'none', color: 'var(--cyber-cyan)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> Add Skill
              </button>
            }>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {formData.skills.map(skill => (
                <span key={skill} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px',
                  background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)',
                  color: 'var(--cyber-cyan)', fontSize: '12.5px', fontFamily: 'var(--font-mono)'
                }}>
                  <span>{skill}</span>
                  <button type="button" onClick={() => handleRemoveSkill(skill)}
                    style={{ background: 'none', border: 'none', color: 'var(--cyber-cyan)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    <X size={13} />
                  </button>
                </span>
              ))}
              {showSkillInput && (
                <div style={{ display: 'inline-flex', gap: '6px' }}>
                  <input type="text" placeholder="Skill name..." value={newSkill} onChange={e => setNewSkill(e.target.value)} autoFocus
                    style={{ padding: '4px 10px', background: 'var(--bg-input)', border: '1px solid var(--cyber-cyan)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none' }} />
                  <button type="button" onClick={handleAddSkill} className="btn-cyber-primary" style={{ padding: '4px 8px', fontSize: '11px' }}>Add</button>
                  <button type="button" onClick={() => setShowSkillInput(false)} className="btn-cyber-outline" style={{ padding: '4px 8px', fontSize: '11px' }}>Cancel</button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-glow)' }}>
            <button type="button" onClick={handleToggleEdit} className="btn-cyber-outline" style={{ fontSize: '13px', padding: '10px 18px' }}>Cancel</button>
            <button type="submit" disabled={isSaving} className="btn-cyber-primary" style={{ fontSize: '13px', padding: '10px 22px' }}>
              <Save size={14} /> <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* ═══════════════ VIEW PROFILE MODE ═══════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Row 1: Profile Completion + Personal Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Profile Completion */}
            <SectionCard icon={BarChart3} iconColor="var(--cyber-emerald)" title="Profile Completion">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: completion.percentage >= 80 ? 'var(--cyber-emerald)' : completion.percentage >= 50 ? 'var(--cyber-cyan)' : '#FF9D4D', fontFamily: 'var(--font-mono)' }}>
                  {completion.percentage}%
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${completion.percentage}%`, height: '100%', borderRadius: '4px', background: completion.percentage >= 80 ? 'var(--cyber-emerald)' : completion.percentage >= 50 ? 'var(--cyber-cyan)' : '#FF9D4D', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {completion.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                    {item.done
                      ? <CheckCircle2 size={14} color="var(--cyber-emerald)" />
                      : <AlertCircle size={14} color="var(--text-muted)" />}
                    <span style={{ color: item.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Personal Information */}
            <SectionCard icon={User} iconColor="var(--cyber-cyan)" title="Personal Information">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <InfoCell label="FULL NAME" value={profile.name} />
                <InfoCell label="EMAIL" value={profile.email} />
                <InfoCell label="PHONE" value={profile.phone} />
                <InfoCell label="LOCATION" value={profile.location} />
                {profile.dob && <InfoCell label="DATE OF BIRTH" value={profile.dob} />}
                {profile.gender && <InfoCell label="GENDER" value={profile.gender} />}
              </div>
            </SectionCard>
          </div>

          {/* Row 2: Academic Information */}
          <SectionCard icon={GraduationCap} iconColor="var(--cyber-emerald)" title="Academic Information">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <InfoCell label="INSTITUTION" value={profile.college} />
              <InfoCell label="DEPARTMENT" value={profile.department} />
              <InfoCell label="STUDENT ID" value={profile.regNo || profile.institutionalId || profile.candidateId} mono accent="var(--cyber-cyan)" />
              <InfoCell label="DEGREE & MAJOR" value={profile.degree} />
              <InfoCell label="GRADUATION / BATCH" value={profile.gradYear} accent="var(--cyber-cyan)" mono />
              <InfoCell label="CGPA" value={`${profile.cgpa || '0.00'} / 10.0`} accent="var(--cyber-emerald)" mono />
              <InfoCell label="CREDITS PROGRESS" value={`${profile.creditsCompleted || 0} / ${profile.totalCredits || 160}`} />
              <InfoCell label="ACTIVE BACKLOGS" value={String(profile.activeBacklogs || 0)} />
            </div>
          </SectionCard>

          {/* Row 3: Skills + Courses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Skills */}
            <SectionCard icon={Code} iconColor="var(--cyber-cyan)" title="Skills"
              rightAction={<button onClick={() => setActivePage('skills')} style={{ background: 'none', border: 'none', color: 'var(--cyber-cyan)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>View All →</button>}>
              {profile.skills.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.skills.map(skill => (
                    <span key={skill} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px',
                      background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.25)',
                      color: 'var(--cyber-cyan)', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)'
                    }}>
                      <CheckCircle2 size={12} color="var(--cyber-emerald)" /> {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
                  No skills added yet. Click Edit Profile to add your skills.
                </div>
              )}
            </SectionCard>

            {/* Courses */}
            <SectionCard icon={BookOpen} iconColor="#8B5CF6" title="My Courses"
              rightAction={<button onClick={() => setActivePage('learning')} style={{ background: 'none', border: 'none', color: 'var(--cyber-cyan)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>View All →</button>}>
              {enrollments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {enrollments.slice(0, 4).map((enr, i) => (
                    <div key={enr.enrollmentId || i} style={{
                      padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{enr.title || enr.courseName || 'Course'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ width: `${enr.progress || 0}%`, height: '100%', borderRadius: '3px', background: (enr.progress || 0) >= 100 ? 'var(--cyber-emerald)' : 'var(--cyber-cyan)', transition: 'width 0.3s ease' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>{enr.progress || 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
                  No courses enrolled yet.
                </div>
              )}
            </SectionCard>
          </div>

          {/* Row 3.5: Communication & Verbal Intelligence */}
          <SectionCard
            icon={MessageSquare}
            iconColor="#8B5CF6"
            title="Communication & Verbal Intelligence"
            rightAction={
              <button
                onClick={() => setActivePage('communication')}
                style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Launch Communication Module →
              </button>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignItems: 'center' }}>

              {/* Overall Score + Level */}
              <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OVERALL PROFICIENCY</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#8B5CF6', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                  {commProfile?.overallScore || 0}%
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className="cyber-badge badge-purple" style={{ fontSize: '10px' }}>
                    LEVEL {commProfile?.level || 1}
                  </span>
                  <span className="cyber-badge badge-amber" style={{ fontSize: '10px' }}>
                    🔥 {commProfile?.streak || 0}d Streak
                  </span>
                  <span className="cyber-badge badge-blue" style={{ fontSize: '10px' }}>
                    ⚡ {commProfile?.xp || 0} XP
                  </span>
                </div>
              </div>

              {/* 6 Category Bars */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { key: 'vocabulary', label: 'Vocabulary', color: 'var(--cyber-cyan)' },
                  { key: 'grammar', label: 'Grammar', color: '#8B5CF6' },
                  { key: 'reading', label: 'Reading', color: '#3B82F6' },
                  { key: 'listening', label: 'Listening', color: '#FF9D4D' },
                  { key: 'speaking', label: 'Speaking', color: 'var(--cyber-emerald)' },
                  { key: 'conversation', label: 'Conversation', color: '#EC4899' }
                ].map(cat => {
                  const val = commProfile?.categories?.[cat.key] || 0;
                  return (
                    <div key={cat.key} style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{cat.label}</span>
                        <span style={{ fontWeight: 700, color: cat.color, fontFamily: 'var(--font-mono)' }}>{val}%</span>
                      </div>
                      <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${val}%`, height: '100%', background: cat.color, borderRadius: '3px', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Strengths & Improvement Areas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--cyber-emerald)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Validated Strengths:
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {commProfile?.strengths?.length > 0 ? commProfile.strengths.join(', ') : 'None established yet (score ≥60% needed)'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#FF9D4D', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Focus Areas:
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {commProfile?.areasToImprove?.length > 0 ? commProfile.areasToImprove.join(', ') : 'All categories baseline'}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Completed Lessons: <strong style={{ color: '#fff' }}>{commProfile?.completedLessonsCount || 0}</strong>
                </div>
              </div>

            </div>
          </SectionCard>

          {/* Row 4: Projects + Certificates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Projects */}
            <SectionCard icon={FolderGit2} iconColor="var(--cyber-emerald)" title="My Projects"
              rightAction={<button onClick={() => setActivePage('projects')} style={{ background: 'none', border: 'none', color: 'var(--cyber-cyan)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>View All →</button>}>
              {projects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {projects.slice(0, 4).map((proj, i) => (
                    <div key={proj.id || i} style={{
                      padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{proj.title || 'Untitled Project'}</div>
                        {proj.tech && proj.tech.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                            {proj.tech.map(t => <span key={t} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,212,255,0.08)', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>{t}</span>)}
                          </div>
                        )}
                      </div>
                      <span className="cyber-badge" style={{
                        fontSize: '10px', padding: '3px 8px',
                        ...(proj.status === 'Validated' ? { background: 'rgba(46,224,161,0.12)', color: 'var(--cyber-emerald)', border: '1px solid rgba(46,224,161,0.3)' } :
                            { background: 'rgba(0,212,255,0.08)', color: 'var(--cyber-cyan)', border: '1px solid rgba(0,212,255,0.25)' })
                      }}>{proj.status || 'In Progress'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
                  No projects added yet.
                </div>
              )}
            </SectionCard>

            {/* Certificates */}
            <SectionCard icon={Award} iconColor="#FF9D4D" title="Certificates">
              {certificates.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {certificates.slice(0, 4).map((cert, i) => {
                    const badge = certBadgeStyle(cert.status || cert.verificationStatus);
                    return (
                      <div key={cert.id || cert.certificateId || i} style={{
                        padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{cert.courseName || cert.title || 'Certificate'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {cert.issuedBy || cert.institutionName || 'Institution'} {cert.issuedAt ? `• ${new Date(cert.issuedAt).toLocaleDateString()}` : ''}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '10px', padding: '3px 8px', borderRadius: '6px', fontWeight: 700,
                          background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                        }}>{badge.label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
                  No certificates yet. Complete courses to earn certificates.
                </div>
              )}
            </SectionCard>
          </div>

          {/* Row 5: Opportunities Summary + Documents */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Opportunities Summary */}
            <SectionCard icon={Briefcase} iconColor="var(--cyber-purple)" title="Opportunities"
              rightAction={<button onClick={() => setActivePage('opportunities')} style={{ background: 'none', border: 'none', color: 'var(--cyber-cyan)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>View All →</button>}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Applied', value: appStats.applied, color: 'var(--cyber-cyan)' },
                  { label: 'Shortlisted', value: appStats.shortlisted, color: '#FF9D4D' },
                  { label: 'Selected', value: appStats.selected, color: 'var(--cyber-emerald)' }
                ].map(s => (
                  <div key={s.label} style={{ padding: '16px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Documents */}
            <SectionCard icon={FileText} iconColor="var(--cyber-cyan)" title="Documents & Resume"
              rightAction={
                <label style={{
                  padding: '6px 14px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                  color: '#fff', fontSize: '11px', fontWeight: 600,
                  cursor: isUploadingDoc ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  <Upload size={12} /> <span>{isUploadingDoc ? 'Uploading...' : 'Upload'}</span>
                  <input type="file" accept=".pdf,.doc,.docx,.png,.jpg" style={{ display: 'none' }} disabled={isUploadingDoc}
                    onChange={e => handleDocUpload(e.target.files?.[0])} />
                </label>
              }>
              {documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {documents.slice(0, 3).map(doc => (
                    <div key={doc.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
                      borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={16} color="var(--cyber-cyan)" />
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{doc.title || doc.fileName}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            <span style={{ padding: '1px 5px', borderRadius: '3px', background: 'rgba(0,212,255,0.1)', color: 'var(--cyber-cyan)', fontSize: '9px', fontWeight: 700 }}>{doc.type || 'Document'}</span>
                            {' • '}{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Today'}
                          </div>
                        </div>
                      </div>
                      <a href={`${apiBase}/students/documents/${encodeURIComponent(doc.id)}/download`} target="_blank" rel="noopener noreferrer"
                        className="btn-cyber-outline" style={{ padding: '4px 10px', fontSize: '10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Download size={11} /> Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
                  No documents uploaded yet.
                </div>
              )}
            </SectionCard>
          </div>

          {/* Row 6: Quick Actions */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Quick Actions</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { label: 'Take Assessment', icon: Award, page: 'assessment', color: '#3478FF' },
                { label: 'Add Project', icon: FolderGit2, page: 'projects', color: '#2FE0A1' },
                { label: 'Browse Opportunities', icon: Briefcase, page: 'opportunities', color: '#FF9D4D' },
                { label: 'Settings', icon: Sparkles, page: 'settings', color: 'var(--cyber-cyan)' }
              ].map(a => (
                <button key={a.label} onClick={() => setActivePage(a.page)} className="btn-cyber-outline"
                  style={{ fontSize: '12px', padding: '8px 14px' }}>
                  <a.icon size={13} color={a.color} /> {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          INSTITUTION PROFILE VIEW (preserved exactly)
          ════════════════════════════════════════════════════════════════ */}
      {currentRole === 'institution' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '28px', borderTop: '3px solid var(--cyber-purple)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '14px', background: 'var(--grad-purple-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
                <Building2 size={34} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>{instFormData.institutionName}</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="cyber-badge badge-purple" style={{ fontSize: '10px' }}>{instFormData.type}</span>
                  <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>ID: {instFormData.campusId}</span>
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                {isEditingInst ? (
                  <>
                    <button onClick={() => { setInstFormData(instData); setIsEditingInst(false); }} className="btn-cyber-outline" style={{ padding: '8px 16px', fontSize: '12px' }}><X size={13} /> Cancel</button>
                    <button onClick={handleSaveInst} className="btn-cyber-primary" style={{ padding: '8px 18px', fontSize: '12px', background: 'var(--cyber-purple)', border: 'none' }}><Save size={13} /> Save Profile</button>
                  </>
                ) : (
                  <button onClick={() => setIsEditingInst(true)} className="btn-cyber-primary" style={{ padding: '8px 18px', fontSize: '12px', background: 'var(--cyber-purple)', border: 'none' }}><Edit3 size={13} /> Edit Profile</button>
                )}
              </div>
            </div>
            {isEditingInst ? (
              <form onSubmit={handleSaveInst} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                {[['INSTITUTION NAME', 'institutionName'], ['CONTACT PERSON / DEAN', 'contactPerson'], ['DISTRICT', 'district'], ['AFFILIATED UNIVERSITY', 'university']].map(([lbl, key]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{lbl}</label>
                    <input type="text" value={instFormData[key] || ''} onChange={e => setInstFormData({ ...instFormData, [key]: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }} />
                  </div>
                ))}
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                {[['INSTITUTION ID', instFormData.campusId], ['COLLEGE ID', instFormData.collegeId], ['DISTRICT', instFormData.district], ['UNIVERSITY', instFormData.university], ['TYPE', instFormData.type], ['CONTACT PERSON', instFormData.contactPerson]].map(([label, val]) => (
                  <div key={label} style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-purple)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={15} /> Official Contact Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {[['Email', instFormData.email], ['Phone', instFormData.phone], ['Website', instFormData.website]].map(([label, val]) => (
                <div key={label} style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-cyan)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><GraduationCap size={15} /> Academic Overview & Departments</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              {[['STUDENTS ENROLLED', (Number(instFormData.studentCount) || 0).toLocaleString()], ['DEPARTMENTS', (instFormData.departments || []).length], ['COURSES OFFERED', Number(instFormData.coursesOffered) || 0]].map(([label, val]) => (
                <div key={label} style={{ padding: '16px', borderRadius: '8px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.25)', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-purple)', fontFamily: 'var(--font-mono)' }}>{val}</div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>ACTIVE DEPARTMENTS</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(instFormData.departments || []).length > 0 ? (
                  instFormData.departments.map(d => <span key={d} className="cyber-badge badge-purple" style={{ fontSize: '11px', padding: '4px 10px' }}>{d}</span>)
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No departments registered yet</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          COMPANY / INDUSTRY PROFILE VIEW (preserved exactly)
          ════════════════════════════════════════════════════════════════ */}
      {currentRole === 'company' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '28px', borderTop: '3px solid var(--cyber-emerald)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '14px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
                <Briefcase size={34} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>{compFormData.companyName}</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="cyber-badge badge-emerald" style={{ fontSize: '10px' }}>{compFormData.industry}</span>
                  <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>ID: {compFormData.recruiterHandle}</span>
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                {isEditingComp ? (
                  <>
                    <button onClick={() => { setCompFormData(compData); setIsEditingComp(false); }} className="btn-cyber-outline" style={{ padding: '8px 16px', fontSize: '12px' }}><X size={13} /> Cancel</button>
                    <button onClick={handleSaveComp} className="btn-cyber-primary" style={{ padding: '8px 18px', fontSize: '12px', background: 'var(--cyber-emerald)', color: '#060B14', border: 'none' }}><Save size={13} /> Save Profile</button>
                  </>
                ) : (
                  <button onClick={() => setIsEditingComp(true)} className="btn-cyber-primary" style={{ padding: '8px 18px', fontSize: '12px', background: 'var(--cyber-emerald)', color: '#060B14', border: 'none' }}><Edit3 size={13} /> Edit Profile</button>
                )}
              </div>
            </div>
            {isEditingComp ? (
              <form onSubmit={handleSaveComp} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                {[['COMPANY NAME', 'companyName'], ['CONTACT PERSON / LEAD', 'contactPerson'], ['LOCATION', 'location'], ['OFFICIAL EMAIL', 'email']].map(([lbl, key]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{lbl}</label>
                    <input type={key === 'email' ? 'email' : 'text'} value={compFormData[key] || ''} onChange={e => setCompFormData({ ...compFormData, [key]: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }} />
                  </div>
                ))}
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                {[['COMPANY ID', compFormData.recruiterHandle], ['INDUSTRY', compFormData.industry], ['LOCATION', compFormData.location], ['CONTACT PERSON', compFormData.contactPerson], ['EMAIL', compFormData.email], ['PHONE', compFormData.phone]].map(([label, val]) => (
                  <div key={label} style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-emerald)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={15} /> Hiring Preferences & Roles</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>PREFERRED ROLES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(compFormData.preferredRoles || []).length > 0 ? (
                    compFormData.preferredRoles.map(r => <div key={r} style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', fontSize: '12.5px', color: 'var(--text-primary)' }}>{r}</div>)
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No preferred roles specified</div>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>EXPERIENCE LEVEL</div>
                <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(10,16,30,0.6)', border: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '12px' }}>{compFormData.experienceLevel}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>INTERNSHIP TYPE</div>
                <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(10,16,30,0.6)', border: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-primary)' }}>{compFormData.internshipType}</div>
              </div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyber-cyan)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={15} /> Preferred Technical Competencies</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(compFormData.preferredSkills || []).length > 0 ? (
                compFormData.preferredSkills.map(sk => <span key={sk} className="cyber-badge badge-emerald" style={{ fontSize: '12px', padding: '5px 12px' }}>{sk}</span>)
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No preferred skills specified</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
