import React, { useState, useEffect } from 'react';
import { UserPlus, X, CheckCircle, AlertCircle, RefreshCw, Mail, Copy, Check } from 'lucide-react';
import { academicService } from '../../services/academicService';

export default function ManualStudentModal({ institution, onClose, onSuccess, onShowToast }) {
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdStudent, setCreatedStudent] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    phoneNumber: '',
    departmentId: '',
    graduationYear: 2026
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const res = await academicService.getDepartments();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setDepartments(res.data);
        setForm(prev => ({ ...prev, departmentId: res.data[0].id }));
      }
    } catch (err) {
      console.warn('Error loading departments:', err);
    } finally {
      setLoadingDepts(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.rollNumber.trim()) {
      setError('Student Name, College Email, and Roll Number are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await academicService.createManualStudent(form);
      if (res.success) {
        setCreatedStudent(res);
        if (onShowToast) {
          onShowToast({
            title: 'Student Profile Provisioned',
            message: `Student account created with status INVITED. Invitation email dispatched to ${form.email}.`,
            type: 'success'
          });
        }
        if (onSuccess) onSuccess(res);
      } else {
        setError(res.message || 'Failed to create student profile.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setSubmitting(false);
    }
  };

  const activationUrl = createdStudent?.invitationToken 
    ? `${window.location.origin}/activate?token=${encodeURIComponent(createdStudent.invitationToken)}`
    : null;

  const handleCopyLink = () => {
    if (activationUrl) {
      navigator.clipboard.writeText(activationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
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
        maxWidth: '560px',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(11, 17, 32, 0.96))',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(168, 85, 247, 0.15)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(168, 85, 247, 0.04)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="cyber-badge badge-purple" style={{ fontSize: '10px' }}>
                Single Candidate Enrollment
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Campus: {institution?.collegeId || 'TN010'}
              </span>
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Add Student to Institutional Roster
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              color: 'var(--cyber-coral)',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {createdStudent ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--cyber-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle size={28} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                Candidate Provisioned & Invited!
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                Account created with status <strong style={{ color: 'var(--cyber-amber)' }}>INVITED</strong>. A branded invitation email has been dispatched to <strong>{form.email}</strong>.
              </p>

              {activationUrl && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '14px',
                  textAlign: 'left',
                  marginBottom: '20px'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    SINGLE-USE ACTIVATION LINK (EXPIRES IN 7 DAYS):
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      readOnly
                      value={activationUrl}
                      className="cyber-input"
                      style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="btn-cyber-outline"
                      style={{ padding: '6px 12px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
                    >
                      {copiedLink ? <Check size={14} color="var(--cyber-emerald)" /> : <Copy size={14} />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="btn-cyber-primary"
                style={{ padding: '9px 24px', fontSize: '13px' }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  STUDENT FULL NAME *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="cyber-input"
                  placeholder="e.g. Rahul Sharma"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    COLLEGE EMAIL *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="cyber-input"
                    placeholder="rahul@srmist.edu.in"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    ROLL / REGISTER NUMBER *
                  </label>
                  <input
                    type="text"
                    value={form.rollNumber}
                    onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                    className="cyber-input"
                    placeholder="e.g. 22CS101"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    ACADEMIC DEPARTMENT *
                  </label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className="cyber-input"
                    style={{ width: '100%', background: '#0B1120' }}
                    required
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    GRADUATION YEAR
                  </label>
                  <input
                    type="number"
                    value={form.graduationYear}
                    onChange={(e) => setForm({ ...form, graduationYear: parseInt(e.target.value, 10) || 2026 })}
                    className="cyber-input"
                    placeholder="2026"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  PHONE NUMBER (OPTIONAL)
                </label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="cyber-input"
                  placeholder="+91 98765 43210"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '14px'
              }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-cyber-outline"
                  style={{ padding: '8px 16px', fontSize: '12.5px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-cyber-primary"
                  style={{ padding: '8px 22px', fontSize: '12.5px' }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="spin" size={14} />
                      <span>Provisioning...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      <span>Provision & Send Invite</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
