import React, { useState } from 'react';
import {
  Sparkles,
  GraduationCap,
  Building2,
  Briefcase,
  BookOpen,
  Copy,
  Check,
  Key,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import './SihDemoAccessBar.css';

export const SIH_DEMO_ACCOUNTS = [
  {
    role: 'student',
    roleLabel: 'STUDENT',
    name: 'Arun Kumar',
    email: 'student.demo@skillnexus.ai',
    password: 'Demo@2026',
    buttonText: 'Use Student Demo',
    icon: GraduationCap,
    color: '#00D9FF',
    accentBorder: 'rgba(0, 217, 255, 0.3)',
    accentBg: 'rgba(0, 217, 255, 0.08)'
  },
  {
    role: 'faculty',
    canonicalRole: 'academician',
    roleLabel: 'ACADEMICIAN',
    name: 'Dr. Ramesh Sundaram',
    email: 'academician.demo@skillnexus.ai',
    password: 'Demo@2026',
    buttonText: 'Use Academician Demo',
    icon: BookOpen,
    color: '#F59E0B',
    accentBorder: 'rgba(245, 158, 11, 0.3)',
    accentBg: 'rgba(245, 158, 11, 0.08)'
  },
  {
    role: 'institution',
    roleLabel: 'INSTITUTION',
    name: 'ABC Eng Admin',
    email: 'institution.demo@skillnexus.ai',
    password: 'Demo@2026',
    buttonText: 'Use Institution Demo',
    icon: Building2,
    color: '#19D3AE',
    accentBorder: 'rgba(25, 211, 174, 0.3)',
    accentBg: 'rgba(25, 211, 174, 0.08)'
  },
  {
    role: 'industry',
    canonicalRole: 'company',
    roleLabel: 'INDUSTRY',
    name: 'Kavitha N',
    email: 'industry.demo@skillnexus.ai',
    password: 'Demo@2026',
    buttonText: 'Use Industry Demo',
    icon: Briefcase,
    color: '#E879F9',
    accentBorder: 'rgba(232, 121, 249, 0.3)',
    accentBg: 'rgba(232, 121, 249, 0.08)'
  }
];

export const SIH_DEMO_CREDENTIALS = {
  student: SIH_DEMO_ACCOUNTS[0],
  academician: SIH_DEMO_ACCOUNTS[1],
  faculty: SIH_DEMO_ACCOUNTS[1],
  institution: SIH_DEMO_ACCOUNTS[2],
  industry: SIH_DEMO_ACCOUNTS[3],
  company: SIH_DEMO_ACCOUNTS[3]
};

/**
 * 4-Card SIH Demo Login Section for the Login / Role page
 * Desktop: 4 cards in one row
 * Tablet: 2 cards per row
 * Mobile: 1 card per row
 * No horizontal scrolling
 */
export default function SihDemoLoginSection({ onSelectDemo, onSelectRoleWithCreds, onShowToast }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const selectCallback = onSelectDemo || onSelectRoleWithCreds;

  const handleCopy = async (e, text, key, label) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement('textarea');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedKey(key);
      if (onShowToast) {
        onShowToast({
          title: 'Copied!',
          message: `${label || text} copied to clipboard`,
          type: 'success'
        });
      }
      window.dispatchEvent(new CustomEvent('nexus_show_toast', {
        detail: {
          title: 'Copied!',
          message: `${label || text} copied to clipboard`,
          type: 'success'
        }
      }));
      setTimeout(() => {
        setCopiedKey((curr) => (curr === key ? null : curr));
      }, 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const toggleShowPassword = (roleKey) => {
    setShowPassword((prev) => ({
      ...prev,
      [roleKey]: !prev[roleKey]
    }));
  };

  return (
    <section className="sih-demo-section-container" aria-label="SIH Demo Login Accounts">
      {/* Header */}
      <div className="sih-demo-header">
        <div className="sih-demo-badge">
          <Sparkles size={14} color="#818cf8" />
          <span>SMART INDIA HACKATHON 2026</span>
        </div>
        <h2 className="sih-demo-title">
          SIH DEMO LOGIN
        </h2>
        <p className="sih-demo-subtitle">
          Use a demo account to explore each role
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="sih-demo-grid">
        {SIH_DEMO_ACCOUNTS.map((acc) => {
          const Icon = acc.icon;
          const emailCopied = copiedKey === `${acc.role}_email`;
          const passCopied = copiedKey === `${acc.role}_pass`;
          const isPasswordVisible = Boolean(showPassword[acc.role]);

          return (
            <div
              key={acc.roleLabel}
              className="sih-demo-card"
              style={{
                borderColor: acc.accentBorder
              }}
            >
              {/* Card Top: Icon & Demo Badge */}
              <div className="sih-demo-card-top">
                <div
                  className="sih-demo-role-icon"
                  style={{
                    background: acc.accentBg,
                    border: `1px solid ${acc.accentBorder}`
                  }}
                >
                  <Icon size={18} color={acc.color} />
                </div>
                <span
                  className="sih-demo-pill-badge"
                  style={{
                    background: acc.accentBg,
                    border: `1px solid ${acc.accentBorder}`,
                    color: acc.color
                  }}
                >
                  <ShieldCheck size={11} />
                  DEMO ACCOUNT
                </span>
              </div>

              {/* Card Body: User Info & Credentials with Copy Buttons */}
              <div className="sih-demo-card-body">
                <div>
                  <div className="sih-demo-role-name" style={{ color: acc.color }}>
                    {acc.roleLabel}
                  </div>
                  <h3 className="sih-demo-user-name" title={acc.name}>
                    {acc.name}
                  </h3>
                </div>

                {/* Email Box */}
                <div className="sih-demo-credential-box">
                  <div className="sih-demo-credential-info">
                    <div className="sih-demo-cred-label">Email</div>
                    <div className="sih-demo-cred-val" title={acc.email}>
                      {acc.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`sih-demo-copy-btn ${emailCopied ? 'copied' : ''}`}
                    onClick={(e) => handleCopy(e, acc.email, `${acc.role}_email`, 'Email')}
                    title="Copy email to clipboard"
                  >
                    {emailCopied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{emailCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                {/* Password Box */}
                <div className="sih-demo-credential-box">
                  <div className="sih-demo-credential-info">
                    <div className="sih-demo-cred-label">Password</div>
                    <div className="sih-demo-cred-val">
                      {isPasswordVisible ? acc.password : '•••••••••'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => toggleShowPassword(acc.role)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={isPasswordVisible ? 'Hide password' : 'Show password'}
                    >
                      {isPasswordVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      type="button"
                      className={`sih-demo-copy-btn ${passCopied ? 'copied' : ''}`}
                      onClick={(e) => handleCopy(e, acc.password, `${acc.role}_pass`, 'Password')}
                      title="Copy password to clipboard"
                    >
                      {passCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{passCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button: Auto-fills login form and selects role */}
              <button
                type="button"
                className="sih-demo-action-btn"
                style={{
                  background: acc.color,
                  boxShadow: `0 4px 14px ${acc.accentBg}`
                }}
                onClick={() => {
                  if (selectCallback) {
                    selectCallback(acc.role, {
                      email: acc.email,
                      password: acc.password,
                      role: acc.role
                    });
                  }
                }}
              >
                <Key size={14} />
                <span>{acc.buttonText}</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Single-role quick fill pill for login screens
 */
export function SihDemoLoginBanner({ role, onFill }) {
  const normRole = (role || 'student').toLowerCase();
  const demo = SIH_DEMO_CREDENTIALS[normRole] || SIH_DEMO_CREDENTIALS.student;
  const [copied, setCopied] = useState(false);

  const handleQuickCopy = (e, text) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: demo.accentBg,
      border: `1px solid ${demo.accentBorder}`,
      borderRadius: '12px',
      padding: '12px 14px',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: `0 4px 16px ${demo.accentBg}`
    }}>
      {/* Top Row: Role Badge + Action Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color={demo.color || demo.badgeColor} />
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            color: demo.color || demo.badgeColor,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono, monospace)'
          }}>
            SIH {demo.roleLabel} Demo Account
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={(e) => handleQuickCopy(e, `${demo.email} / ${demo.password}`)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
            title="Copy credentials"
          >
            {copied ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={() => onFill(demo.email, demo.password)}
            style={{
              background: demo.color || demo.badgeColor,
              color: '#070b14',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: `0 2px 8px ${demo.accentBorder}`,
              transition: 'all 0.15s ease'
            }}
          >
            <Key size={12} />
            <span>Auto-fill Demo</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Full Credentials info - never truncated */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '6px',
        paddingTop: '6px',
        borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
        fontSize: '12px'
      }}>
        <div style={{
          color: '#f8fafc',
          fontFamily: 'var(--font-mono, monospace)',
          fontWeight: 600,
          wordBreak: 'break-all'
        }}>
          {demo.email}
        </div>
        <div style={{
          color: '#94a3b8',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>{demo.name}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
          <span style={{
            background: 'rgba(255,255,255,0.06)',
            padding: '1px 6px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono, monospace)',
            color: '#cbd5e1'
          }}>
            {demo.password}
          </span>
        </div>
      </div>
    </div>
  );
}
