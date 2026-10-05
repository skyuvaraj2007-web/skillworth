import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Building, Building2, GraduationCap, AlertCircle, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { authService } from '../../services/authService';
import CollegeAutocomplete from '../CollegeAutocomplete';

export default function GoogleAuthModal({
  isOpen,
  mode, // 'LINK_ACCOUNT' or 'ONBOARDING'
  googleData, // { googleId, email, name, picture, credential }
  defaultRole = 'student',
  onSuccess,
  onClose
}) {
  if (!isOpen || !googleData) return null;

  // Link form state
  const [linkPassword, setLinkPassword] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');

  // Onboarding form state
  const [selectedRole, setSelectedRole] = useState(defaultRole || 'student');
  const [profileData, setProfileData] = useState({
    name: googleData.name || '',
    collegeName: '',
    collegeId: '',
    degree: 'B.Tech Computer Science and Engineering',
    department: 'CSE',
    gradYear: '2026',
    careerGoal: 'Software Engineer',
    institutionName: '',
    institutionType: 'Autonomous',
    district: 'Chennai',
    companyName: '',
    industry: 'Information Technology',
    designation: 'Talent Acquisition Partner'
  });
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardError, setOnboardError] = useState('');

  // Handle Account Linking (Flow C)
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    setLinkLoading(true);
    setLinkError('');

    try {
      const res = await authService.linkGoogleAccount({
        credential: googleData.credential,
        googleId: googleData.googleId,
        email: googleData.email,
        password: linkPassword
      });

      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setLinkError(res.message || 'Verification failed. Please check your password.');
      }
    } catch (err) {
      setLinkError(err.message || 'Unable to connect to authentication server.');
    } finally {
      setLinkLoading(false);
    }
  };

  // Handle Complete Onboarding (Flow B)
  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setOnboardLoading(true);
    setOnboardError('');

    try {
      const res = await authService.completeGoogleOnboarding({
        credential: googleData.credential,
        googleId: googleData.googleId,
        email: googleData.email,
        name: profileData.name || googleData.name,
        role: selectedRole,
        profileData: {
          ...profileData,
          picture: googleData.picture
        }
      });

      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setOnboardError(res.message || 'Onboarding registration failed.');
      }
    } catch (err) {
      setOnboardError(err.message || 'Server error during onboarding.');
    } finally {
      setOnboardLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(5, 10, 20, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: '#0D1527', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
        borderRadius: '16px', maxWidth: '520px', width: '100%', maxHeight: '90vh',
        overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {googleData.picture ? (
              <img
                src={googleData.picture}
                alt={googleData.name}
                style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--cyber-cyan, #06B6D4)' }}
              />
            ) : (
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06B6D4'
              }}>
                <User size={20} />
              </div>
            )}
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                {mode === 'LINK_ACCOUNT' ? 'Link Google Account' : 'Complete Nexus Onboarding'}
              </h3>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>
                {googleData.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 28px' }}>
          {mode === 'LINK_ACCOUNT' ? (
            /* FLOW C: Account Linking */
            <form onSubmit={handleLinkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '12px 14px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', alignItems: 'flex-start', gap: '10px'
              }}>
                <ShieldCheck size={18} color="#06B6D4" style={{ marginTop: '2px', flexShrink: 0 }} />
                <p style={{ fontSize: '12.5px', color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>
                  A SKILL NEXUS account already exists for <strong>{googleData.email}</strong>. Enter your existing account password to link your Google identity for 1-click sovereign sign-in.
                </p>
              </div>

              {linkError && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '12.5px',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <AlertCircle size={15} />
                  <span>{linkError}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94A3B8', marginBottom: '6px' }}>
                  Current Account Password
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px', padding: '10px 12px'
                }}>
                  <Lock size={16} color="#94A3B8" />
                  <input
                    type="password"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder="Enter your existing password"
                    required
                    style={{
                      background: 'transparent', border: 'none', color: '#F8FAFC',
                      fontSize: '13px', outline: 'none', width: '100%'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={linkLoading}
                className="btn-cyber-primary"
                style={{
                  padding: '12px', fontSize: '13.5px', fontWeight: 600,
                  marginTop: '6px', width: '100%', justifyContent: 'center'
                }}
              >
                <span>{linkLoading ? 'Verifying & Linking...' : 'Link Google Account →'}</span>
              </button>
            </form>
          ) : (
            /* FLOW B: New User Onboarding */
            <form onSubmit={handleOnboardingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                padding: '12px 14px', borderRadius: '8px', background: 'rgba(47, 224, 161, 0.08)',
                border: '1px solid rgba(47, 224, 161, 0.25)', display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <CheckCircle2 size={18} color="#2FE0A1" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '12.5px', color: '#CBD5E1', margin: 0 }}>
                  Google identity verified. Select your sovereign portal sector to finish your profile setup:
                </p>
              </div>

              {onboardError && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '12.5px',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <AlertCircle size={15} />
                  <span>{onboardError}</span>
                </div>
              )}

              {/* Sector Selection Cards */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94A3B8', marginBottom: '8px' }}>
                  Select Your Sector / Role
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {[
                    { role: 'student', label: 'Student', icon: GraduationCap, color: '#06B6D4' },
                    { role: 'institution', label: 'Institution', icon: Building, color: '#8B5CF6' },
                    { role: 'company', label: 'Company', icon: Building2, color: '#10B981' }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isSel = selectedRole === tab.role;
                    return (
                      <button
                        key={tab.role}
                        type="button"
                        onClick={() => setSelectedRole(tab.role)}
                        style={{
                          padding: '12px 8px', borderRadius: '10px',
                          border: isSel ? `2px solid ${tab.color}` : '1px solid rgba(255,255,255,0.1)',
                          background: isSel ? `${tab.color}18` : 'rgba(255,255,255,0.03)',
                          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <Icon size={20} color={isSel ? tab.color : '#94A3B8'} />
                        <span style={{ fontSize: '12px', fontWeight: isSel ? 700 : 500, color: isSel ? '#F8FAFC' : '#94A3B8' }}>
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sector-Specific Fields */}
              {selectedRole === 'student' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94A3B8', marginBottom: '4px' }}>
                      Institution / College (Tamil Nadu Directory)
                    </label>
                    <CollegeAutocomplete
                      value={profileData.collegeName}
                      onChange={(college) => {
                        setProfileData(prev => ({
                          ...prev,
                          collegeName: college.name,
                          collegeId: college.code || college.id
                        }));
                      }}
                      placeholder="Search Anna University, SRM, IIT Madras, etc."
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94A3B8', marginBottom: '4px' }}>
                        Department
                      </label>
                      <input
                        type="text"
                        value={profileData.department}
                        onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                        placeholder="CSE / AI / ECE"
                        style={{
                          width: '100%', padding: '9px 12px', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                          color: '#F8FAFC', fontSize: '13px', outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94A3B8', marginBottom: '4px' }}>
                        Career Target
                      </label>
                      <input
                        type="text"
                        value={profileData.careerGoal}
                        onChange={(e) => setProfileData({ ...profileData, careerGoal: e.target.value })}
                        placeholder="e.g. AI Engineer, Full-Stack"
                        style={{
                          width: '100%', padding: '9px 12px', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                          color: '#F8FAFC', fontSize: '13px', outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === 'institution' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94A3B8', marginBottom: '4px' }}>
                      College / University Name
                    </label>
                    <input
                      type="text"
                      value={profileData.institutionName}
                      onChange={(e) => setProfileData({ ...profileData, institutionName: e.target.value })}
                      placeholder="e.g. Anna University Regional Campus"
                      required
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '8px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#F8FAFC', fontSize: '13px', outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94A3B8', marginBottom: '4px' }}>
                        District / City
                      </label>
                      <input
                        type="text"
                        value={profileData.district}
                        onChange={(e) => setProfileData({ ...profileData, district: e.target.value })}
                        placeholder="Chennai / Coimbatore"
                        style={{
                          width: '100%', padding: '9px 12px', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                          color: '#F8FAFC', fontSize: '13px', outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94A3B8', marginBottom: '4px' }}>
                        Campus Classification
                      </label>
                      <select
                        value={profileData.institutionType}
                        onChange={(e) => setProfileData({ ...profileData, institutionType: e.target.value })}
                        style={{
                          width: '100%', padding: '9px 12px', borderRadius: '8px',
                          background: '#1A2234', border: '1px solid rgba(255,255,255,0.12)',
                          color: '#F8FAFC', fontSize: '13px', outline: 'none'
                        }}
                      >
                        <option value="Autonomous">Autonomous</option>
                        <option value="Affiliated">Affiliated</option>
                        <option value="Deemed University">Deemed University</option>
                        <option value="Centrally Funded">Centrally Funded</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === 'company' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94A3B8', marginBottom: '4px' }}>
                      Enterprise / Company Name
                    </label>
                    <input
                      type="text"
                      value={profileData.companyName}
                      onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                      placeholder="e.g. Zoho Corporation, Freshworks"
                      required
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '8px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#F8FAFC', fontSize: '13px', outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94A3B8', marginBottom: '4px' }}>
                        Industry Sector
                      </label>
                      <input
                        type="text"
                        value={profileData.industry}
                        onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                        placeholder="Technology / Finance / SaaS"
                        style={{
                          width: '100%', padding: '9px 12px', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                          color: '#F8FAFC', fontSize: '13px', outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94A3B8', marginBottom: '4px' }}>
                        Your Recruiter Role
                      </label>
                      <input
                        type="text"
                        value={profileData.designation}
                        onChange={(e) => setProfileData({ ...profileData, designation: e.target.value })}
                        placeholder="Head of University Hiring"
                        style={{
                          width: '100%', padding: '9px 12px', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                          color: '#F8FAFC', fontSize: '13px', outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={onboardLoading}
                className="btn-cyber-primary"
                style={{
                  padding: '12px', fontSize: '13.5px', fontWeight: 600,
                  marginTop: '6px', width: '100%', justifyContent: 'center'
                }}
              >
                <span>{onboardLoading ? 'Creating Sovereign Profile...' : 'Complete Onboarding & Enter Portal →'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
