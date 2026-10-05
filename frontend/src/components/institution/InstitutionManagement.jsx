import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  Award,
  Settings,
  Edit3,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Upload,
  RefreshCw,
  Plus
} from 'lucide-react';
import { academicService } from '../../services/academicService';

export default function InstitutionManagement({ institution, onShowToast, onOpenSetupWizard, setActivePage }) {
  const [profile, setProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadManagementData = async () => {
    setLoading(true);
    try {
      const res = await academicService.getSetupStatus();
      if (res && res.success && res.data) {
        setProfile(res.data.profile || {});
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      console.warn('Management data fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagementData();
  }, [institution]);

  const collegeName = profile?.name || institution?.institutionName || institution?.name || 'Higher Education Institution';
  const collegeCode = profile?.code || institution?.collegeId || institution?.id || 'TN-CAMPUS';
  const district = profile?.district || 'Tamil Nadu';

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* ── HEADER BANNER ── */}
      <div className="glass-panel" style={{
        padding: '22px 24px',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, rgba(16, 26, 48, 0.7) 0%, rgba(10, 16, 30, 0.9) 100%)',
        borderTop: '3px solid var(--cyber-cyan)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--cyber-cyan)" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Institution Management & Accreditation Console
              </h2>
              <span className="cyber-badge badge-blue" style={{ fontSize: '10px' }}>
                ADMINISTRATIVE NODE
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Configure institutional metadata, accreditation parameters, academic department structure, and multi-tenant access rights.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onOpenSetupWizard && (
              <button
                onClick={onOpenSetupWizard}
                className="btn-cyber-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              >
                <Edit3 size={13} />
                <span>Configure Profile</span>
              </button>
            )}
            <button
              onClick={loadManagementData}
              disabled={loading}
              className="btn-cyber-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── METADATA CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Building2 size={20} color="var(--cyber-cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Institution Identity</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {collegeName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            License Node: <span style={{ color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>{collegeCode}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span className="cyber-badge badge-emerald" style={{ fontSize: '10px' }}>ACTIVE CAMPUS</span>
            <span className="cyber-badge badge-blue" style={{ fontSize: '10px' }}>DISTRICT: {district}</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Award size={20} color="var(--cyber-purple)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Accreditation & Affiliation</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Affiliation: <strong style={{ color: 'var(--text-primary)' }}>{profile?.affiliation || 'Anna University / State Directorate'}</strong>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            AISHE / Accreditation: <strong style={{ color: 'var(--text-primary)' }}>{profile?.aisheCode || 'C-41224 (NAAC A++)'}</strong>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            NIRF Band: <strong style={{ color: 'var(--cyber-purple)' }}>{profile?.nirfRank || 'Rank Band 50-100'}</strong>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <GraduationCap size={20} color="var(--cyber-emerald)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Academic Roster Management</span>
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Manage student enrollments, bulk CSV rosters, and departmental batch configurations.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {setActivePage && (
              <button
                onClick={() => setActivePage('institution-students')}
                className="btn-cyber-primary"
                style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Users size={12} />
                <span>Open Student Roster</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── ACADEMIC DEPARTMENTS ── */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={18} color="var(--cyber-cyan)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Configured Academic Departments ({departments.length})
            </h3>
          </div>
          {onOpenSetupWizard && (
            <button
              onClick={onOpenSetupWizard}
              className="btn-cyber-outline"
              style={{ padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={12} />
              <span>Add Department</span>
            </button>
          )}
        </div>

        {departments.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Building2 size={32} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No departments configured yet.
            </div>
            <div style={{ fontSize: '12px', marginBottom: '14px' }}>
              Use the Setup Wizard to configure your institution departments and academic tracks.
            </div>
            {onOpenSetupWizard && (
              <button
                onClick={onOpenSetupWizard}
                className="btn-cyber-primary"
                style={{ padding: '7px 16px', fontSize: '12px' }}
              >
                Launch Setup Wizard
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  {['Department Code', 'Department Name', 'Degree / Stream', 'Status'].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px'
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {departments.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--cyber-cyan)', fontWeight: 600 }}>
                      {d.code || `DEPT-${idx + 1}`}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {d.name || d}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {d.degree || 'B.Tech / B.E.'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="cyber-badge badge-emerald" style={{ fontSize: '10px' }}>
                        ACCREDITED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
