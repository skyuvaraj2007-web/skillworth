import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Upload, 
  UserPlus, 
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { academicService } from '../../services/academicService';

export default function InstitutionSetupWizard({ 
  institution, 
  onClose, 
  onSetupComplete, 
  onOpenImportModal, 
  onOpenManualAddModal 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1 Form
  const [institutionForm, setInstitutionForm] = useState({
    name: institution?.institutionName || institution?.name || '',
    email: institution?.email || '',
    code: institution?.collegeId || institution?.code || '',
    address: institution?.address || '',
    website: institution?.website || ''
  });

  // Step 2 Departments
  const [departments, setDepartments] = useState([]);
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const res = await academicService.getDepartments();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setDepartments(res.data);
      } else {
        // Default standard engineering departments
        setDepartments([
          { code: 'CSE', name: 'Computer Science and Engineering' },
          { code: 'IT', name: 'Information Technology' },
          { code: 'ECE', name: 'Electronics and Communication Engineering' },
          { code: 'AI&DS', name: 'Artificial Intelligence and Data Science' },
          { code: 'MECH', name: 'Mechanical Engineering' }
        ]);
      }
    } catch (err) {
      console.warn('Could not fetch departments:', err);
    }
  };

  const handleAddDepartment = () => {
    if (!newDeptCode.trim() || !newDeptName.trim()) {
      setError('Please provide both department code (e.g. CSE) and full name.');
      return;
    }
    const cleanCode = newDeptCode.trim().toUpperCase();
    if (departments.some(d => d.code.toUpperCase() === cleanCode)) {
      setError(`Department code "${cleanCode}" already exists.`);
      return;
    }
    setDepartments([...departments, { code: cleanCode, name: newDeptName.trim() }]);
    setNewDeptCode('');
    setNewDeptName('');
    setError(null);
  };

  const handleRemoveDepartment = (indexToRemove) => {
    setDepartments(departments.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveStep1 = async (e) => {
    e.preventDefault();
    if (!institutionForm.name.trim() || !institutionForm.email.trim()) {
      setError('College Name and Official Email are required.');
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  const handleSaveStep2 = async () => {
    if (departments.length === 0) {
      setError('Please configure at least one academic department.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await academicService.updateInstitutionSetup({
        ...institutionForm,
        departments
      });
      setCurrentStep(3);
    } catch (err) {
      setError(err.message || 'Failed to save setup configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = () => {
    if (onSetupComplete) onSetupComplete();
    if (onClose) onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '680px',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(11, 17, 32, 0.95))',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(6, 182, 212, 0.15)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(6, 182, 212, 0.04)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="cyber-badge badge-blue" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                Onboarding Wizard
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Step {currentStep} of 3
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {currentStep === 1 && 'Step 1 — College / Institution Identity'}
              {currentStep === 2 && 'Step 2 — Academic Departments Configuration'}
              {currentStep === 3 && 'Step 3 — Initial Student Cohort Provisioning'}
            </h2>
          </div>

          {/* Stepper Dots */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3].map(step => (
              <div
                key={step}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: currentStep === step 
                    ? 'var(--cyber-cyan)' 
                    : currentStep > step 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  color: currentStep === step 
                    ? '#0B1120' 
                    : currentStep > step 
                    ? 'var(--cyber-emerald)' 
                    : 'var(--text-muted)',
                  border: currentStep === step 
                    ? 'none' 
                    : currentStep > step 
                    ? '1px solid rgba(16, 185, 129, 0.4)' 
                    : '1px solid var(--border-subtle)'
                }}
              >
                {currentStep > step ? '✓' : step}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', maxHeight: '65vh', overflowY: 'auto' }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '18px',
              color: 'var(--cyber-coral)',
              fontSize: '12.5px'
            }}>
              {error}
            </div>
          )}

          {/* ── STEP 1: COLLEGE INFO ── */}
          {currentStep === 1 && (
            <form onSubmit={handleSaveStep1} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                Verify your institutional identity details. These will be bound to your cryptographic ledger blocks and student invitations.
              </p>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  COLLEGE / INSTITUTION NAME *
                </label>
                <input
                  type="text"
                  value={institutionForm.name}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, name: e.target.value })}
                  className="cyber-input"
                  placeholder="e.g. National Institute of Engineering & Technology"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    OFFICIAL PLACEMENT EMAIL *
                  </label>
                  <input
                    type="email"
                    value={institutionForm.email}
                    onChange={(e) => setInstitutionForm({ ...institutionForm, email: e.target.value })}
                    className="cyber-input"
                    placeholder="placements@institution.edu"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    CAMPUS / COLLEGE CODE
                  </label>
                  <input
                    type="text"
                    value={institutionForm.code}
                    onChange={(e) => setInstitutionForm({ ...institutionForm, code: e.target.value })}
                    className="cyber-input"
                    placeholder="e.g. TN010"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  CAMPUS POSTAL ADDRESS
                </label>
                <input
                  type="text"
                  value={institutionForm.address}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, address: e.target.value })}
                  className="cyber-input"
                  placeholder="City, District, State"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  OFFICIAL INSTITUTION WEBSITE
                </label>
                <input
                  type="url"
                  value={institutionForm.website}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, website: e.target.value })}
                  className="cyber-input"
                  placeholder="https://www.institution.edu"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="submit" className="btn-cyber-primary" style={{ padding: '10px 24px' }}>
                  <span>Proceed to Departments</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: DEPARTMENTS ── */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Configure academic departments for your campus. Incoming roster files will be validated strictly against these authorized department codes.
              </p>

              {/* Add department inputs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr auto',
                gap: '10px',
                alignItems: 'flex-end',
                padding: '14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    CODE (e.g. CSE)
                  </label>
                  <input
                    type="text"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                    className="cyber-input"
                    placeholder="CSE"
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    DEPARTMENT FULL NAME
                  </label>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="cyber-input"
                    placeholder="Computer Science and Engineering"
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDepartment}
                  className="btn-cyber-outline"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>

              {/* Department items list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {departments.map((dept, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="cyber-badge badge-blue" style={{ fontSize: '10px', fontWeight: 700 }}>
                        {dept.code}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {dept.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDepartment(idx)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Remove department"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn-cyber-outline"
                  style={{ padding: '10px 18px' }}
                >
                  <ArrowLeft size={15} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveStep2}
                  className="btn-cyber-primary"
                  style={{ padding: '10px 24px' }}
                >
                  <span>{loading ? 'Saving Setup...' : 'Save & Continue'}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: INITIAL ROSTER PROVISIONING ── */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: 'var(--cyber-emerald)'
              }}>
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  Institution Setup Complete!
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '460px', margin: '0 auto' }}>
                  {institutionForm.name} is configured with {departments.length} active departments. You are now ready to provision your student cohorts.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginTop: '10px'
              }}>
                <div
                  onClick={() => {
                    handleCompleteSetup();
                    if (onOpenImportModal) onOpenImportModal();
                  }}
                  style={{
                    padding: '20px',
                    background: 'rgba(6, 182, 212, 0.05)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cyber-cyan)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Upload size={20} color="var(--cyber-cyan)" />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                      Import CSV / Excel
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    Bulk upload your cohort spreadsheet with live validation, metrics counters, and diff preview.
                  </p>
                </div>

                <div
                  onClick={() => {
                    handleCompleteSetup();
                    if (onOpenManualAddModal) onOpenManualAddModal();
                  }}
                  style={{
                    padding: '20px',
                    background: 'rgba(168, 85, 247, 0.05)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cyber-purple)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <UserPlus size={20} color="var(--cyber-purple)" />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                      Add Student Manually
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    Provision an individual student profile with instant single-use activation email dispatch.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleCompleteSetup}
                  className="btn-cyber-outline"
                  style={{ padding: '10px 24px', fontSize: '12.5px' }}
                >
                  <span>Proceed to Institution Dashboard</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
