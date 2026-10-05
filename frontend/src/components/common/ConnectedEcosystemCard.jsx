import React from 'react';
import { School, UserCheck, GraduationCap, Building2, CheckCircle2, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function ConnectedEcosystemCard({ activeRole = 'student', onSelectRole }) {
  const roles = [
    {
      id: 'institution',
      title: 'ABC Engineering College',
      subtitle: 'Accredited Autonomous Institution • NAAC A++',
      category: 'Institution',
      meta: '45 Students in CSE III-A • 1 Active Skill Program',
      icon: School,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.25)',
      active: activeRole === 'institution'
    },
    {
      id: 'academician',
      title: 'Dr. Ramesh Sundaram',
      subtitle: 'Professor & Head • Dept. of CSE',
      category: 'Academician',
      meta: 'Class Mentor • React.js Mini Project Assigned',
      icon: UserCheck,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.08)',
      border: 'rgba(139, 92, 246, 0.25)',
      active: activeRole === 'academician'
    },
    {
      id: 'student',
      title: 'Arun Kumar (23CSE042)',
      subtitle: 'III CSE A • CGPA: 8.85 • Full Stack AI Track',
      category: 'Primary Student',
      meta: '8 Verified Skills • Enrolled in React.js Program',
      icon: GraduationCap,
      color: '#00D4FF',
      bg: 'rgba(0, 212, 255, 0.08)',
      border: 'rgba(0, 212, 255, 0.25)',
      active: activeRole === 'student'
    },
    {
      id: 'industry',
      title: 'SBT TECH Innovations',
      subtitle: 'Enterprise AI & Cloud Systems Partner',
      category: 'Industry Partner',
      meta: 'Associate Full Stack AI Developer • Dynamic Matching & Shortlisting',
      icon: Building2,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.25)',
      active: activeRole === 'industry' || activeRole === 'company'
    }
  ];

  return (
    <div style={{
      background: 'rgba(21, 31, 53, 0.85)',
      border: '1px solid #263452',
      borderRadius: '12px',
      padding: '18px 20px',
      marginBottom: '20px'
    }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#00D4FF" />
          <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Connected SIH Demo Ecosystem
          </h4>
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(0, 212, 255, 0.15)',
            border: '1px solid rgba(0, 212, 255, 0.4)',
            color: '#00D4FF',
            fontWeight: 800
          }}>
            DATABASE LINKED
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#94A3B8' }}>
          4 Roles • PostgreSQL Single Source of Truth
        </div>
      </div>

      {/* Modern Connected Tree Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '12px',
        position: 'relative'
      }}>
        {roles.map((r, idx) => {
          const Icon = r.icon;
          return (
            <div
              key={r.id}
              onClick={() => onSelectRole && onSelectRole(r.id)}
              style={{
                background: r.bg,
                border: `1px solid ${r.active ? r.color : r.border}`,
                borderRadius: '10px',
                padding: '12px 14px',
                cursor: onSelectRole ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: r.active ? `0 0 16px ${r.color}20` : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: r.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {r.category}
                </span>
                {r.active && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: r.color,
                    background: `${r.color}20`,
                    padding: '1px 5px',
                    borderRadius: '4px'
                  }}>
                    <CheckCircle2 size={10} /> Active View
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: `${r.color}15`, border: `1px solid ${r.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={13} color={r.color} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.title}
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px', lineHeight: 1.3 }}>
                {r.subtitle}
              </div>

              <div style={{
                fontSize: '10.5px',
                color: r.color,
                background: 'rgba(11, 18, 32, 0.5)',
                padding: '4px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                lineHeight: 1.2
              }}>
                {r.meta}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
