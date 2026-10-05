import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  TrendingUp,
  Flame,
  Clock,
  CheckCircle2,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Award,
  ArrowRight,
  ChevronRight,
  Target,
  Zap,
  Activity,
  AlertCircle,
  FolderGit2
} from 'lucide-react';

export default function LearningProgressAnalytics({ setActivePage, onShowToast }) {
  const [activeSection, setActiveSection] = useState('all');
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [adaptiveRecs, setAdaptiveRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
      const headers = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };

      const [anRes, crRes, adRes] = await Promise.all([
        fetch('/api/learning/student/learning-analytics', { headers }),
        fetch('/api/learning/student/courses', { headers }),
        fetch('/api/learning/student/adaptive-recommendations', { headers })
      ]);

      const [anData, crData, adData] = await Promise.all([
        anRes.json(),
        crRes.json(),
        adRes.json()
      ]);

      if (anData.success) setAnalytics(anData.data);
      if (crData.success && Array.isArray(crData.data)) setCourses(crData.data);
      if (adData.success && Array.isArray(adData.data)) setAdaptiveRecs(adData.data);
    } catch (err) {
      console.warn('[LearningProgressAnalytics] Fetch note:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalCourses = analytics?.courses || courses.length || 0;
  const completedCourses = analytics?.completed || courses.filter(c => c.progressPercentage >= 100).length || 0;
  const inProgress = analytics?.activeCourses || courses.filter(c => c.progressPercentage > 0 && c.progressPercentage < 100).length || 0;
  const notStarted = Math.max(0, totalCourses - completedCourses - inProgress);
  const overallProgress = analytics?.learningProgress || 0;
  const totalHours = analytics?.learningActivity?.totalHours || 0;

  const sections = [
    { id: 'all', label: 'All Analytics' },
    { id: 'progress', label: 'Course Progress' },
    { id: 'skills', label: 'Skill Intelligence' },
    { id: 'recommendations', label: 'Adaptive Recommendations' }
  ];

  const isEmpty = totalCourses === 0 && (analytics?.assessments || 0) === 0 && (analytics?.projects || 0) === 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>

      {/* ── Page Header ── */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div className="telemetry-node-tag">
            <span>TELEMETRY SYNCED</span>
            <span>//</span>
            <span>POSTGRESQL SINGLE SOURCE OF TRUTH</span>
            <span>//</span>
            <span>AUTHENTICATED METRICS</span>
          </div>
          <h1>Learning Progress & Analytics</h1>
          <p>Verified learning trajectory, course completion benchmarks, and adaptive skill recommendations.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setActivePage('learning')} className="btn-cyber-outline">
            <BookOpen size={14} />
            <span>My Courses</span>
          </button>
          <button onClick={() => setActivePage('enroll')} className="btn-cyber-primary">
            <Zap size={14} />
            <span>Explore Catalog</span>
          </button>
        </div>
      </div>

      {/* ── Telemetry Strip ── */}
      <div className="telemetry-strip" style={{ marginBottom: '24px' }}>
        <div className="telemetry-item">
          <span className="telemetry-label">DATABASE SYNC</span>
          <span className="telemetry-value" style={{ color: 'var(--cyber-emerald)' }}>● LIVE</span>
        </div>
        <div className="telemetry-divider">|</div>
        <div className="telemetry-item">
          <span className="telemetry-label">ENROLLED COURSES</span>
          <span className="telemetry-value">{totalCourses}</span>
        </div>
        <div className="telemetry-divider">|</div>
        <div className="telemetry-item">
          <span className="telemetry-label">COMPLETION RATE</span>
          <span className="telemetry-value" style={{ color: 'var(--cyber-cyan)' }}>{overallProgress}%</span>
        </div>
        <div className="telemetry-divider">|</div>
        <div className="telemetry-item">
          <span className="telemetry-label">ASSESSMENTS</span>
          <span className="telemetry-value">{analytics?.assessments || 0}</span>
        </div>
        <div className="telemetry-divider">|</div>
        <div className="telemetry-item">
          <span className="telemetry-label">TIME LOGGED</span>
          <span className="telemetry-value">{totalHours}h</span>
        </div>
      </div>

      {/* ── Section Nav ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={activeSection === s.id ? 'btn-cyber-primary' : 'btn-cyber-outline'}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Loading State ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Activity size={32} style={{ margin: '0 auto 12px auto', animation: 'spin 2s linear infinite' }} />
          <div>Retrieving verified learning analytics from database...</div>
        </div>
      )}

      {/* ── Empty State for Brand New Student ── */}
      {!loading && isEmpty && (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'rgba(0, 212, 255, 0.1)', border: '1px solid var(--cyber-cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto',
            color: 'var(--cyber-cyan)'
          }}>
            <BookOpen size={30} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Learning Records Yet
          </h2>
          <p style={{ maxWidth: '520px', margin: '0 auto 24px auto', fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            You haven't enrolled in any courses or completed diagnostic assessments yet. Start your journey by taking an assessment or enrolling in a course from our catalog.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', maxWidth: '700px', margin: '0 auto 28px auto', gap: '12px' }}>
            {[
              { label: 'Courses', val: '0' },
              { label: 'Completed', val: '0' },
              { label: 'Assessments', val: '0' },
              { label: 'Projects', val: '0' },
              { label: 'Certifications', val: '0' },
              { label: 'Learning Progress', val: '0%' }
            ].map((stat, i) => (
              <div key={i} style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.val}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button onClick={() => setActivePage('enroll')} className="btn-cyber-primary" style={{ padding: '10px 24px' }}>
              Browse Available Courses
            </button>
            <button onClick={() => setActivePage('assessment')} className="btn-cyber-outline" style={{ padding: '10px 24px' }}>
              Take Skill Assessment
            </button>
          </div>
        </div>
      )}

      {/* ── Active Dashboard Content (when data exists) ── */}
      {!loading && !isEmpty && (
        <>
          {/* Top KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Courses Enrolled</span>
                <BookOpen size={16} color="var(--cyber-cyan)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{totalCourses}</div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--cyber-emerald)' }}>{completedCourses} completed</span>
                <span>•</span>
                <span>{inProgress} in progress</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Progress</span>
                <TrendingUp size={16} color="var(--cyber-emerald)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cyber-emerald)' }}>{overallProgress}%</div>
              <div style={{
                height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', marginTop: '10px'
              }}>
                <div style={{ height: '100%', width: `${overallProgress}%`, background: 'var(--cyber-emerald)' }} />
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assessments Taken</span>
                <Target size={16} color="var(--cyber-purple)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{analytics?.assessments || 0}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Average Score: <strong style={{ color: 'var(--cyber-purple)' }}>{analytics?.assessmentAverageScore || 0}%</strong>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Learning Hours</span>
                <Clock size={16} color="var(--cyber-blue)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{totalHours}h</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                {analytics?.learningActivity?.streakDays || 0} active study sessions
              </div>
            </div>
          </div>

          {/* Section: Course Progress */}
          {(activeSection === 'all' || activeSection === 'progress') && (
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Enrolled Courses & Progress
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Derived directly from PostgreSQL enrollments & module completions
                  </div>
                </div>
                <button onClick={() => setActivePage('learning')} className="btn-cyber-outline" style={{ fontSize: '12px', padding: '6px 14px' }}>
                  Manage Courses
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {courses.map(crs => (
                  <div
                    key={crs.enrollmentId || crs.courseId}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px'
                    }}
                  >
                    <div style={{ minWidth: '240px', flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(0, 212, 255, 0.1)', color: 'var(--cyber-cyan)' }}>
                          {crs.category}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {crs.difficulty} • {crs.instructorName}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {crs.courseTitle}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {crs.completedModules} / {crs.moduleCount} Modules Completed • {crs.timeSpentHours}h logged
                      </div>
                    </div>

                    <div style={{ width: '200px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Status: {crs.courseStatus}</span>
                        <span style={{ fontWeight: 700, color: crs.progressPercentage >= 100 ? 'var(--cyber-emerald)' : 'var(--cyber-cyan)' }}>
                          {crs.progressPercentage}%
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${crs.progressPercentage}%`,
                          background: crs.progressPercentage >= 100 ? 'var(--cyber-emerald)' : 'var(--cyber-cyan)'
                        }} />
                      </div>
                    </div>

                    <button
                      onClick={() => setActivePage('learning')}
                      className="btn-cyber-outline"
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                    >
                      Continue →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Skill Intelligence & Weak Areas */}
          {(activeSection === 'all' || activeSection === 'skills') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {/* Skills Gained */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Award size={16} color="var(--cyber-emerald)" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Skills Gained & Verified ({analytics?.skillsGained?.length || 0})
                  </h3>
                </div>
                {(analytics?.skillsGained || []).length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '20px 0' }}>
                    Complete course assessments and modules to attest verified skills into your ledger.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {analytics.skillsGained.map((sk, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(46, 224, 161, 0.1)',
                          border: '1px solid rgba(46, 224, 161, 0.3)',
                          color: 'var(--cyber-emerald)',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        <CheckCircle2 size={12} />
                        {sk.name} ({sk.level})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Weak Skills / Improvement Targets */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <AlertCircle size={16} color="#F59E0B" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Weak Skills / Gaps Identified
                  </h3>
                </div>
                {(analytics?.weakSkills || []).length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '20px 0' }}>
                    No significant skill gaps identified. Keep your benchmarks updated via diagnostic assessments.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analytics.weakSkills.map((w, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{w.skill}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tested in {w.totalQuestions} questions</div>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B' }}>
                          {w.accuracy}% accuracy
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Adaptive Learning Recommendations */}
          {(activeSection === 'all' || activeSection === 'recommendations') && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={18} color="var(--cyber-purple)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Adaptive Learning Engine Recommendations
                </h3>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Remediation courses directly mapped from your assessment skill gaps to active catalog courses.
              </p>

              {adaptiveRecs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No remediation needed at this time. All assessed skills are currently performing within benchmark.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  {adaptiveRecs.map((rec, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '18px',
                        borderRadius: '8px',
                        background: 'rgba(139, 92, 246, 0.06)',
                        border: '1px solid rgba(139, 92, 246, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
                            Gap: {rec.weakSkill}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {rec.recommendedCourse.hours}h • {rec.recommendedCourse.difficulty}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                          {rec.recommendedCourse.title}
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                          {rec.reason}
                        </p>
                      </div>

                      <button
                        onClick={() => setActivePage('enroll')}
                        className="btn-cyber-primary"
                        style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                      >
                        {rec.isEnrolled ? 'Resume Course →' : 'Enroll in Remediation Course →'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}
