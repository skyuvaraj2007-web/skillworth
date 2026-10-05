import React from 'react';
import { GraduationCap, BookOpen, Building2, Briefcase } from 'lucide-react';
import './LoginRoleTabs.css';

export default function LoginRoleTabs({ activeRole, onSelectRole }) {
  const roles = [
    { id: 'student', label: 'Student', icon: GraduationCap, color: '#00D9FF' },
    { id: 'academician', label: 'Academician', icon: BookOpen, color: '#F59E0B' },
    { id: 'institution', label: 'Institution', icon: Building2, color: '#19D3AE' },
    { id: 'industry', label: 'Industry', icon: Briefcase, color: '#E879F9' }
  ];

  return (
    <div className="login-role-tabs-wrapper" role="tablist" aria-label="Select Login Role">
      {roles.map((r) => {
        const Icon = r.icon;
        const isActive = activeRole === r.id;
        return (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`login-role-tab-btn ${isActive ? 'active' : ''}`}
            style={{
              '--role-accent': r.color,
              borderColor: isActive ? r.color : 'rgba(255, 255, 255, 0.08)',
              background: isActive
                ? `linear-gradient(135deg, rgba(255,255,255,0.06), ${r.color}22)`
                : 'rgba(15, 23, 42, 0.6)'
            }}
            onClick={() => onSelectRole && onSelectRole(r.id)}
          >
            <Icon size={14} color={isActive ? r.color : '#94a3b8'} style={{ flexShrink: 0 }} />
            <span style={{ color: isActive ? '#f8fafc' : '#94a3b8', fontWeight: isActive ? 700 : 500, lineHeight: 1 }}>
              {r.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
