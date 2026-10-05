import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Building,
  ArrowRight,
  Cpu,
  User,
  Mail,
  Phone,
  BookOpen,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CourseEnrollment({ setActivePage, onShowToast, user }) {
  const [formData, setFormData] = useState({
    name: user?.name || user?.fullName || 'Student',
    email: user?.email || '',
    phone: user?.phone || '+91 98765 43210',
    college: user?.institutionName || user?.college || 'Affiliated University',
    degree: user?.department || user?.degree || 'B.Tech Computer Science & Engineering',
    gradYear: user?.yearOfStudy ? String(2024 + (4 - parseInt(user.yearOfStudy, 10))) : '2026',
    motivation: 'I want to build production-grade applications and advance my industry skills.',
    tier: 'Intermediate',
    priorExperience: {
      python: true,
      linearAlgebra: true,
      pytorch: false,
      apiRest: true
    },
    deliveryFormat: 'Self-Paced with AI',
    dailySlot: 'Evening (6 PM - 8 PM)',
    targetRole: 'AI Engineer / Full-Stack Developer',
    targetHorizon: 'Targeting Upcoming Internship',
    attestationConfirmed: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/learning/enroll', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          courseId: 'crs_genai_01',
          courseTitle: 'Generative AI Fundamentals',
          totalModules: 10,
          deliveryFormat: formData.deliveryFormat,
          preferredSlot: formData.dailySlot,
          goals: formData.motivation
        })
      });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}

      if (onShowToast) {
        onShowToast({
          title: 'Enrollment Confirmed!',
          message: 'Generative AI Fundamentals is now active in your Learning Hub. 100% Institutional Subsidy Applied.',
          type: 'success'
        });
      }

      setTimeout(() => {
        setActivePage('learning');
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Top Header Telemetry */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div className="telemetry-node-tag">
            <span>NEXUS ACADEMY</span>
            <span>//</span>
            <span>ENROLL-48</span>
            <span>//</span>
            <span>ACADEMIC YEAR 2025-26</span>
          </div>
          <h1>Course Enrollment</h1>
          <p>Take the next step in your learning journey with certified industry alignment.</p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
          fontSize: '11.5px', fontFamily: 'var(--font-mono)'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>CANDIDATE PROFILE:</span>
          <strong style={{ color: 'var(--cyber-cyan)' }}>{user?.name || user?.full_name || 'Enrolled Student'} • {user?.department || 'Verified Academic'}</strong>
        </div>
      </div>

      {/* Course Banner matching Page 8 Top */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        marginBottom: '28px',
        background: 'var(--bg-card)',
        borderColor: 'rgba(56, 189, 248, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="cyber-badge badge-cyan">ADVANCED AI TRACK</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TRACK ID: NX-K302-0042 // ACADEMIC TIER 1</span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Generative AI Fundamentals
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              By NEXUS AI Academy in direct partnership with Anthropic, HuggingFace & ScaleAI Labs.
            </div>
          </div>

          <div style={{
            display: 'flex', gap: '20px', padding: '10px 16px',
            background: 'var(--bg-input)', borderRadius: '10px',
            border: '1px solid var(--border-subtle)', fontSize: '11.5px', fontFamily: 'var(--font-mono)'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>BATCH SEATS</span>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>42 / 50 Enrolled</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>SKILL MATCH</span>
              <div style={{ fontWeight: 700, color: 'var(--cyber-cyan)' }}>88% Aligned</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>NEXT COHORT</span>
              <div style={{ fontWeight: 700, color: 'var(--cyber-emerald)' }}>Oct 14, 2025</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span>⏱ 6 Weeks Duration</span>
          <span>•</span>
          <span>⚡ Beginner to Intermediate</span>
          <span>•</span>
          <span>🛡 Verified Digital Certificate</span>
          <span>•</span>
          <span style={{ color: 'var(--cyber-cyan)', fontWeight: 600 }}>Fast-Track to 12 Job Opportunities</span>
        </div>

        {/* Curriculum Highlights Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['LLM Architectures', 'Prompt Engineering', 'LangChain Ops', 'Embeddings & RAG', 'Vector DB Engines', 'Autonomous Agents', 'Safety & Red-Teaming', 'Prod Deployment'].map((mod, idx) => (
            <span key={idx} style={{
              padding: '4px 10px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
              fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)'
            }}>
              {mod}
            </span>
          ))}
          <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid var(--cyber-cyan)', fontSize: '11px', color: 'var(--cyber-cyan)', fontWeight: 600 }}>
            H100 Cloud GPU Tier Included
          </span>
        </div>
      </div>

      {/* Main Grid: 6 Form Sections on Left + Tuition Sidebar on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left: 6 Form Sections */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section 1: Student Details */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <User size={16} color="var(--cyber-cyan)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                1. Student Details
              </h3>
              <span className="cyber-badge badge-cyan" style={{ fontSize: '9px', marginLeft: 'auto' }}>
                Verified Institutional Profile
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  INSTITUTIONAL EMAIL
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  PHONE NUMBER
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  INSTITUTION / COLLEGE
                </label>
                <input
                  type="text"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  DEGREE / PROGRAM
                </label>
                <input
                  type="text"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  GRADUATION YEAR
                </label>
                <input
                  type="text"
                  value={formData.gradYear}
                  onChange={(e) => setFormData({ ...formData, gradYear: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Learning Goals & Motivation */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sparkles size={16} color="var(--cyber-purple)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                2. Learning Goals & Motivation
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--cyber-cyan)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                • Analyzed by Nexus AI
              </span>
            </div>

            <label style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Why do you want to enroll in this course?
            </label>
            <textarea
              rows={3}
              value={formData.motivation}
              onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
              style={{
                width: '100%', padding: '12px', background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)', borderRadius: '8px',
                color: 'var(--text-primary)', fontSize: '12.5px', lineHeight: 1.5,
                outline: 'none', resize: 'vertical'
              }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              High-clarity response increases AI personalized mentor assignment accuracy.
            </div>
          </div>

          {/* Section 3: Current Skill Level & Background */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Cpu size={16} color="var(--cyber-emerald)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                3. Current Skill Level & Background
              </h3>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Proficiency Tier in Machine Learning
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {['Beginner', 'Intermediate', 'Advanced'].map(tier => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setFormData({ ...formData, tier })}
                    style={{
                      padding: '10px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600,
                      cursor: 'pointer', textAlign: 'center',
                      background: formData.tier === tier ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: formData.tier === tier ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                      color: formData.tier === tier ? 'var(--cyber-cyan)' : 'var(--text-secondary)'
                    }}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Prior Experience & Prerequisite Check
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { key: 'python', label: 'Python (Verified 5.3)' },
                  { key: 'linearAlgebra', label: 'Linear Algebra (Verified 5.2)' },
                  { key: 'pytorch', label: 'PyTorch (Optional Lab)' },
                  { key: 'apiRest', label: 'API & REST (Verified 5.2)' }
                ].map((item) => (
                  <label key={item.key} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 10px', borderRadius: '6px',
                    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                    fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.priorExperience[item.key]}
                      onChange={(e) => setFormData({
                        ...formData,
                        priorExperience: { ...formData.priorExperience, [item.key]: e.target.checked }
                      })}
                      style={{ accentColor: 'var(--cyber-cyan)' }}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Learning Preference & Schedule */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Clock size={16} color="var(--cyber-amber)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                4. Learning Preference & Schedule
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                  DELIVERY FORMAT
                </label>
                <select
                  value={formData.deliveryFormat}
                  onChange={(e) => setFormData({ ...formData, deliveryFormat: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                >
                  <option>Self-Paced with AI</option>
                  <option>Live Cohort</option>
                  <option>Hybrid Blend</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                  PREFERRED DAILY SYNC SLOT
                </label>
                <select
                  value={formData.dailySlot}
                  onChange={(e) => setFormData({ ...formData, dailySlot: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                >
                  <option>Morning (8 AM - 10 AM)</option>
                  <option>Evening (6 PM - 8 PM)</option>
                  <option>Weekends Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Target Career Goal */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Award size={16} color="var(--cyber-cyan)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                5. Target Career Goal
              </h3>
              <span className="cyber-badge badge-cyan" style={{ fontSize: '9px', marginLeft: 'auto' }}>
                Placement Sync
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  DESIRED PROFESSIONAL ROLE
                </label>
                <input
                  type="text"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  TARGET CAREER HORIZON
                </label>
                <input
                  type="text"
                  value={formData.targetHorizon}
                  onChange={(e) => setFormData({ ...formData, targetHorizon: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Section 6: Confirmation & Digital Attestation */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ShieldCheck size={16} color="var(--cyber-emerald)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                6. Confirmation & Digital Attestation
              </h3>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.attestationConfirmed}
                onChange={(e) => setFormData({ ...formData, attestationConfirmed: e.target.checked })}
                style={{ accentColor: 'var(--cyber-cyan)', marginTop: '2px' }}
                required
              />
              <span>
                I confirm that the information provided is correct and agree to commit approximately 6 hours/week to lab exercises and mentor reviews.
              </span>
            </label>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '10px' }}>
              Enrolling automatically syncs curriculum milestones with your Career Command Center, My Skills matrix, and Digital Passport.
            </div>
          </div>
        </form>

        {/* Right Sticky Sidebar: Tuition & Lab Access matching Page 8 */}
        <div>
          <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '80px', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '4px' }}>
              ENROLLMENT ACTION
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Tuition & Lab Access
            </h3>

            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-emerald)' }}>
                100% SPONSORED
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Institutional Subsidy: -₹24,000
              </div>
              <div style={{ fontSize: '11px', color: 'var(--cyber-cyan)', marginTop: '2px' }}>
                Student Due: ₹0.00
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-cyber-primary"
              style={{ width: '100%', padding: '12px', fontSize: '14px', marginBottom: '10px' }}
            >
              <span>{isSubmitting ? 'Confirming Ledger Proof...' : 'Confirm & Enroll Now →'}</span>
            </button>

            <button
              onClick={() => setActivePage('learning')}
              className="btn-cyber-outline"
              style={{ width: '100%', padding: '8px', fontSize: '12px', marginBottom: '20px' }}
            >
              Cancel
            </button>

            {/* Immediate Privileges */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>
                IMMEDIATE PRIVILEGES
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                <li>• Instant access to GPU sandboxes</li>
                <li>• NEXUS AI companion assistance</li>
                <li>• Automated verification tracking</li>
              </ul>
            </div>

            {/* Career Match Lift */}
            <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--cyber-purple)', fontWeight: 700, textTransform: 'uppercase' }}>
                AI COMPANION TIP
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                Career Calibration Match
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Enrolling closes 1 high-priority skill gap in your target Data Scientist matrix. Your callback rate increases from 68% → 91%.
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
              12 ACTIVE RECRUITERS COLLABORATING
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
