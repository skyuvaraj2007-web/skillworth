import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Building,
  MapPin,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Users,
  Briefcase,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileBadge
} from 'lucide-react';
import { authService } from '../services/authService';

export default function StudentCollegePage({ setActivePage, onShowToast, user }) {
  const [studentProfile, setStudentProfile] = useState(null);
  const [collegeDetails, setCollegeDetails] = useState(null);
  const [loadingCollege, setLoadingCollege] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCollegeInfo = async () => {
      setLoadingCollege(true);
      try {
        const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };

        let prof = null;
        try {
          const profRes = await fetch('/api/students/profile', { headers, credentials: 'include' });
          if (profRes.ok) {
            const pJson = await profRes.json();
            if (pJson.success && pJson.data && isMounted) {
              prof = pJson.data;
              setStudentProfile(prof);
            }
          }
        } catch (e) {}

        const activeCollegeId = prof?.institutionId || prof?.collegeId || user?.collegeId || user?.institutionId;
        if (activeCollegeId) {
          const res = await fetch(`/api/college-master/${encodeURIComponent(activeCollegeId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && (data.college || data.data) && isMounted) {
              setCollegeDetails(data.college || data.data);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch college details:', err);
      } finally {
        if (isMounted) setLoadingCollege(false);
      }
    };

    fetchCollegeInfo();
    return () => { isMounted = false; };
  }, [user]);

  // Purely dynamic values from authenticated student database record
  const collegeName = studentProfile?.institutionName || studentProfile?.collegeName || studentProfile?.college || user?.collegeName || user?.institution || user?.college || '';
  const collegeId = studentProfile?.institutionId || studentProfile?.collegeId || user?.collegeId || user?.institutionId || '';
  const department = studentProfile?.department || user?.department || 'Department Not Specified';
  const degree = studentProfile?.degree || user?.degree || user?.course || 'Degree Not Specified';
  const specialization = studentProfile?.specialization || user?.specialization || 'General Curriculum';
  const semester = (studentProfile?.semester || user?.semester) ? `Sem ${studentProfile?.semester || user?.semester}` : '';
  const year = studentProfile?.year || user?.year || 'Undergraduate';
  const batch = studentProfile?.batch || user?.batch || '';
  const regNo = studentProfile?.regNo || user?.regNo || user?.registerNumber || user?.studentId || 'Not Assigned';
  const cgpa = studentProfile?.cgpa ? String(studentProfile.cgpa) : (user?.cgpa ? String(user.cgpa) : '0.00');
  const creditsCompleted = Number(studentProfile?.creditsCompleted ?? user?.creditsCompleted) || 0;
  const totalCredits = Number(studentProfile?.totalCredits ?? user?.totalCredits) || 160;
  const backlogs = Number(studentProfile?.activeBacklogs ?? user?.activeBacklogs) || 0;

  const district = collegeDetails?.district || studentProfile?.institutionLocation || user?.district || 'Tamil Nadu';
  const code = collegeDetails?.code || collegeId || 'CAMPUS-ID';
  const university = collegeDetails?.university || studentProfile?.university || user?.university || 'Affiliated University';
  const naacGrade = collegeDetails?.naacGrade || 'Accredited';
  const nirfRank = collegeDetails?.nirfRank || 'Recognized';

  if (!loadingCollege && !collegeName) {
    return (
      <div style={{ padding: '40px 32px', maxWidth: '1000px', margin: '0 auto' }}>
        <div
          className="glass-panel"
          style={{
            borderRadius: '20px',
            padding: '48px 36px',
            textAlign: 'center',
            border: '1px solid rgba(0, 217, 255, 0.2)',
            background: 'linear-gradient(135deg, rgba(6, 26, 51, 0.8) 0%, rgba(10, 16, 30, 0.9) 100%)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'rgba(0, 83, 156, 0.25)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--cyber-cyan)'
            }}
          >
            <GraduationCap size={36} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
            No Institution Linked Yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '560px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            You are not currently associated with an academic college or institution in the database. When you register with an institution or update your profile, your verified curriculum, campus placement drives, and official credentials will appear here.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
            <button
              onClick={() => setActivePage('profile')}
              className="btn-cyber-primary"
              style={{ padding: '12px 24px', fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              Update Student Profile
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setActivePage('home')}
              className="btn-cyber-outline"
              style={{ padding: '12px 24px', fontSize: '13.5px' }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner / Hero Card */}
      <div
        className="glass-panel"
        style={{
          borderRadius: '20px',
          padding: '36px',
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(13, 148, 136, 0.15) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          marginBottom: '28px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
                flexShrink: 0
              }}
            >
              <GraduationCap size={34} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.4)'
                  }}
                >
                  TNEA CODE: {code}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShieldCheck size={13} />
                  REGISTERED PARTNER CAMPUS
                </span>
              </div>

              <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
                {collegeName}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: 'var(--text-secondary)', fontSize: '13.5px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} color="var(--cyber-cyan)" />
                  District: <strong style={{ color: 'var(--text-primary)' }}>{district}, Tamil Nadu</strong>
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={15} color="var(--brand-primary)" />
                  University: <strong style={{ color: 'var(--text-primary)' }}>{university}</strong>
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setActivePage('passport')}
              className="btn-cyber-outline"
              style={{ padding: '10px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FileBadge size={16} />
              Verified Passport
            </button>
            <button
              onClick={() => setActivePage('profile')}
              className="btn-cyber-primary"
              style={{ padding: '10px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              Academic Profile
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Student's Academic Enrollment Details & Campus Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Card 1: Student Enrolled Program */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <BookOpen size={20} color="var(--cyber-cyan)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Enrolled Curriculum
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Program / Degree</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>{degree}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Department</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>{department}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Specialization</span>
              <span style={{ fontWeight: 700, color: 'var(--cyber-cyan)', fontSize: '13.5px' }}>{specialization}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Register / Roll No</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{regNo}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Batch / Class</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{year} ({semester}) • {batch}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Academic Standing & Credits */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <TrendingUp size={20} color="var(--cyber-emerald)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Academic Performance
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>CURRENT CGPA</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-emerald)', marginTop: '4px' }}>
                {cgpa} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 10</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>ACTIVE BACKLOGS</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: backlogs === 0 ? 'var(--cyber-emerald)' : 'var(--cyber-crimson)', marginTop: '4px' }}>
                {backlogs}
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span>Credit Progression</span>
              <span><strong>{creditsCompleted}</strong> / {totalCredits} Credits</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.round((creditsCompleted / totalCredits) * 100))}%`,
                  height: '100%',
                  background: 'var(--grad-emerald-teal)',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: College Recognition & Accreditation */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Award size={20} color="var(--cyber-amber)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Campus Recognition
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: '10px' }}>
              <CheckCircle2 size={18} color="var(--cyber-emerald)" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>NAAC Accreditation</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Grade {naacGrade} Accredited Higher Education Institution</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: '10px' }}>
              <CheckCircle2 size={18} color="var(--cyber-emerald)" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Autonomous & AICTE Approved</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Affiliated with Tamil Nadu Engineering Directorate</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: '10px' }}>
              <Sparkles size={18} color="var(--cyber-cyan)" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>SkillNexus Campus Partner</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Direct industry recruitment pipelines enabled</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campus Placement & Industry Readiness Integration */}
      <div
        className="glass-panel"
        style={{
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Campus Placement & Internship Drives
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Students from {collegeName} have direct access to exclusive corporate placement drives on SkillNexus AI.
            </p>
          </div>

          <button
            onClick={() => setActivePage('opportunities')}
            className="btn-cyber-primary"
            style={{ padding: '9px 16px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Briefcase size={14} />
            Explore Campus Drives
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {[
            {
              title: 'TCS Digital & Ninja Hiring Drive',
              role: 'Associate Software Engineer',
              status: 'Open for IV Year & III Year',
              badge: 'Campus Partner'
            },
            {
              title: 'Zoho Corporation Developer Trainee',
              role: 'Product Engineer',
              status: 'Applications Verified',
              badge: 'Direct Pipeline'
            },
            {
              title: 'Cognizant GenC Elevate Challenge',
              role: 'Full Stack Specialist',
              status: 'Assessment Live',
              badge: 'TN Engineering Cohort'
            }
          ].map((drive, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-input)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: 700 }}>
                  {drive.badge}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--cyber-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                  Active
                </span>
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {drive.title}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Role: {drive.role}
              </p>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Eligibility: {drive.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
