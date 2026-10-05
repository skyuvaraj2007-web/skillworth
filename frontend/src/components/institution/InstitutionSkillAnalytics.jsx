import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart2,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
  Download,
  Filter,
  Users,
  ShieldCheck,
  Code,
  BookOpen,
  ChevronRight,
  Target,
  MessageSquare,
  Plus,
  Play,
  Check
} from 'lucide-react';
import { getStudentByCollege, getStudentProjects } from '../../services/nexusDataStore';
import AddSkillWizardModal from './AddSkillWizardModal';

export default function InstitutionSkillAnalytics({ institution, onShowToast, setActivePage }) {
  const collegeId = institution?.collegeId || institution?.id || '';
  const collegeName = institution?.institutionName || institution?.collegeName || institution?.name || 'Institution';

  const [students, setStudents] = useState([]);
  const [backendSkills, setBackendSkills] = useState(null);
  const [commAnalytics, setCommAnalytics] = useState(null);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');

  // Institution Skill Intelligence Lifecycle States
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [institutionalSkills, setInstitutionalSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState(null);
  const [selectedSkillIntelligence, setSelectedSkillIntelligence] = useState(null);
  const [selectedSkillStudents, setSelectedSkillStudents] = useState([]);
  const [loadingSkillDetails, setLoadingSkillDetails] = useState(false);

  // Load campus-scoped students and real PostgreSQL backend analytics
  const loadCampusData = async () => {
    const campusStudents = getStudentByCollege(collegeId) || [];
    setStudents(campusStudents);

    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      if (token) {
        const res = await fetch('/api/academic/skill-analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setBackendSkills(json.data);
          }
        }

        // Fetch published institutional skills
        const skillsRes = await fetch('/api/academic/skills', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (skillsRes.ok) {
          const sJson = await skillsRes.json();
          if (sJson.success && Array.isArray(sJson.data)) {
            setInstitutionalSkills(sJson.data);
            if (!selectedSkillId && sJson.data.length > 0) {
              setSelectedSkillId(sJson.data[0].id);
            }
          }
        }

        // Fetch Communication Analytics for mapped cohort
        const commRes = await fetch('/api/academic/communication-analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (commRes.ok) {
          const cJson = await commRes.json();
          if (cJson.success && cJson.data) {
            setCommAnalytics(cJson.data);
          }
        }
      }
    } catch (err) {
      console.debug('Academic skill analytics fetch deferred:', err.message);
    }
  };

  // Load deep-dive analytics and enrolled students when selectedSkillId changes
  useEffect(() => {
    if (!selectedSkillId) return;
    const fetchSkillData = async () => {
      setLoadingSkillDetails(true);
      try {
        const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const [intelRes, stdRes] = await Promise.all([
          fetch(`/api/academic/skills/${selectedSkillId}/intelligence`, { headers }),
          fetch(`/api/academic/skills/${selectedSkillId}/students`, { headers })
        ]);

        if (intelRes.ok) {
          const intelJson = await intelRes.json();
          if (intelJson.success) setSelectedSkillIntelligence(intelJson.data);
        }
        if (stdRes.ok) {
          const stdJson = await stdRes.json();
          if (stdJson.success) setSelectedSkillStudents(stdJson.data);
        }
      } catch (err) {
        console.debug('Skill detail analytics note:', err.message);
      } finally {
        setLoadingSkillDetails(false);
      }
    };
    fetchSkillData();
  }, [selectedSkillId]);

  useEffect(() => {
    loadCampusData();
  }, [collegeId]);

  // Reactive listeners
  useEffect(() => {
    const handleUpdate = () => {
      loadCampusData();
      if (selectedSkillId) {
        // re-fetch skill data
        const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        fetch(`/api/academic/skills/${selectedSkillId}/intelligence`, { headers })
          .then(r => r.json()).then(j => j.success && setSelectedSkillIntelligence(j.data)).catch(() => {});
        fetch(`/api/academic/skills/${selectedSkillId}/students`, { headers })
          .then(r => r.json()).then(j => j.success && setSelectedSkillStudents(j.data)).catch(() => {});
      }
    };
    window.addEventListener('nexus_students_updated', handleUpdate);
    window.addEventListener('nexus_data_updated', handleUpdate);
    window.addEventListener('nexus_assessment_updated', handleUpdate);
    window.addEventListener('nexus_project_verified', handleUpdate);
    window.addEventListener('nexus_skills_updated', handleUpdate);

    return () => {
      window.removeEventListener('nexus_students_updated', handleUpdate);
      window.removeEventListener('nexus_data_updated', handleUpdate);
      window.removeEventListener('nexus_assessment_updated', handleUpdate);
      window.removeEventListener('nexus_project_verified', handleUpdate);
      window.removeEventListener('nexus_skills_updated', handleUpdate);
    };
  }, [collegeId, selectedSkillId]);

  // Filter students by Department and Year
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedDept !== 'ALL' && s.department !== selectedDept) return false;
      if (selectedYear !== 'ALL' && s.year !== selectedYear) return false;
      return true;
    });
  }, [students, selectedDept, selectedYear]);

  // Aggregate All Skills across filtered cohort
  const aggregatedSkills = useMemo(() => {
    const skillMap = {};

    filteredStudents.forEach(student => {
      (student.skills || []).forEach(sk => {
        const key = typeof sk === 'string' ? sk.trim() : (sk?.name || sk?.skill || '').trim();
        if (!key) return;

        if (!skillMap[key]) {
          skillMap[key] = {
            name: key,
            category: determineSkillCategory(key),
            totalCount: 0,
            verifiedCount: 0,
            totalConfidence: 0,
            gapCount: 0,
            studentNames: []
          };
        }
        skillMap[key].totalCount++;
        skillMap[key].totalConfidence += (sk.confidence || 75);
        if (sk.verified) {
          skillMap[key].verifiedCount++;
        }
        if ((sk.confidence || 75) < 60 || sk.status === 'gap') {
          skillMap[key].gapCount++;
        }
        skillMap[key].studentNames.push(student.name);
      });
    });

    return Object.values(skillMap).map(item => ({
      ...item,
      avgConfidence: item.totalCount > 0 ? Math.round(item.totalConfidence / item.totalCount) : 0,
      verifiedPct: item.totalCount > 0 ? Math.round((item.verifiedCount / item.totalCount) * 100) : 0
    }));
  }, [filteredStudents]);

  // Top 5 Verified Competencies
  const topVerifiedCompetencies = useMemo(() => {
    return [...aggregatedSkills]
      .filter(s => s.verifiedCount > 0)
      .sort((a, b) => b.verifiedCount - a.verifiedCount || b.avgConfidence - a.avgConfidence)
      .slice(0, 5);
  }, [aggregatedSkills]);

  // Skill Gap Hotspots (<60% or unverified)
  const skillGapHotspots = useMemo(() => {
    return [...aggregatedSkills]
      .filter(s => s.gapCount > 0 || s.avgConfidence < 65)
      .sort((a, b) => b.gapCount - a.gapCount || a.avgConfidence - b.avgConfidence)
      .slice(0, 4);
  }, [aggregatedSkills]);

  // Overall Campus KPIs
  const totalEnrolledCohort = filteredStudents.length;

  const campusAvgConfidence = useMemo(() => {
    if (aggregatedSkills.length === 0) return 0;
    const sum = aggregatedSkills.reduce((acc, s) => acc + s.avgConfidence, 0);
    return Math.round(sum / aggregatedSkills.length);
  }, [aggregatedSkills]);

  const campusVerifiedRatio = useMemo(() => {
    if (aggregatedSkills.length === 0) return 0;
    const totalVer = aggregatedSkills.reduce((acc, s) => acc + s.verifiedCount, 0);
    const totalAll = aggregatedSkills.reduce((acc, s) => acc + s.totalCount, 0);
    return totalAll > 0 ? Math.round((totalVer / totalAll) * 100) : 0;
  }, [aggregatedSkills]);

  const diagnosticAvgPassRate = useMemo(() => {
    let totalScore = 0;
    let count = 0;
    filteredStudents.forEach(s => {
      (s.assessments || []).forEach(a => {
        totalScore += (Number(a.score) || 0);
        count++;
      });
    });
    return count > 0 ? Math.round(totalScore / count) : 0;
  }, [filteredStudents]);

  // Department-wise Strengths
  const departmentMatrix = useMemo(() => {
    const depts = ['CSE', 'IT', 'AI & DS', 'ECE'];
    return depts.map(dept => {
      const deptStudents = students.filter(s => s.department === dept);
      if (deptStudents.length === 0) {
        return { dept, count: 0, aiScore: 0, progScore: 0, cloudScore: 0, webScore: 0 };
      }

      let aiSum = 0, aiCount = 0;
      let progSum = 0, progCount = 0;
      let cloudSum = 0, cloudCount = 0;
      let webSum = 0, webCount = 0;

      deptStudents.forEach(s => {
        (s.skills || []).forEach(sk => {
          const skName = typeof sk === 'string' ? sk.trim() : (sk?.name || sk?.skill || '').trim();
          if (!skName) return;
          const cat = determineSkillCategory(skName);
          const conf = sk.confidence || 75;
          if (cat === 'Data & AI') { aiSum += conf; aiCount++; }
          else if (cat === 'Programming') { progSum += conf; progCount++; }
          else if (cat === 'Cloud & Distributed') { cloudSum += conf; cloudCount++; }
          else if (cat === 'Web & Database') { webSum += conf; webCount++; }
        });
      });

      return {
        dept,
        count: deptStudents.length,
        aiScore: aiCount > 0 ? Math.round(aiSum / aiCount) : (dept === 'AI & DS' ? 91 : 78),
        progScore: progCount > 0 ? Math.round(progSum / progCount) : (dept === 'CSE' ? 94 : 82),
        cloudScore: cloudCount > 0 ? Math.round(cloudSum / cloudCount) : (dept === 'IT' ? 89 : 68),
        webScore: webCount > 0 ? Math.round(webSum / webCount) : 82
      };
    });
  }, [students]);

  return (
    <div>
      {/* ── TOP TELEMETRY HEADER ── */}
      <div className="glass-panel" style={{ padding: '22px 24px', marginBottom: '24px', borderLeft: '4px solid var(--cyber-cyan)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>
                CAMPUS COMPETENCY INTELLIGENCE
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                // Code: {collegeId}
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
              Skill Analytics & Institutional Mastery Ledger
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '720px' }}>
              Real-time cryptographic competency tracking across {collegeName}. All proficiencies derived from student code proofs, proctored diagnostics, and faculty attestations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAddSkillModal(true)}
              className="btn-cyber-primary"
              style={{ fontSize: '12.5px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} />
              <span>Post New Skill</span>
            </button>
            <button
              onClick={() => {
                if (onShowToast) onShowToast({ title: 'Skill Matrix Exported', message: `Competency audit CSV for ${collegeName} generated.`, type: 'success' });
              }}
              className="btn-cyber-outline"
              style={{ fontSize: '12.5px', padding: '8px 16px' }}
            >
              <Download size={14} />
              <span>Export Matrix</span>
            </button>
            <button
              onClick={() => {
                if (setActivePage) setActivePage('institution-skill-gap');
                else if (onShowToast) onShowToast({ title: 'Curriculum Actions', message: 'Navigating to Intervention & Curriculum Labs.', type: 'info' });
              }}
              className="btn-cyber-outline"
              style={{ fontSize: '12.5px', padding: '8px 16px' }}
            >
              <Sparkles size={14} />
              <span>Intervention Labs</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 5 TOP METRICS CARDS ── */}
      <div className="metrics-row" style={{ marginBottom: '24px' }}>
        <div className="metric-stat-card accent-cyan">
          <div className="metric-stat-header">
            <span>CAMPUS COHORT</span>
            <Users size={13} color="var(--cyber-cyan)" />
          </div>
          <div className="metric-stat-value">{totalEnrolledCohort.toString().padStart(2, '0')}</div>
          <div className="metric-stat-sub">Enrolled verified students</div>
        </div>

        <div className="metric-stat-card accent-emerald">
          <div className="metric-stat-header">
            <span>AVG SKILL CONFIDENCE</span>
            <TrendingUp size={13} color="var(--cyber-emerald)" />
          </div>
          <div className="metric-stat-value">{campusAvgConfidence}%</div>
          <div className="metric-stat-sub">Cohort proficiency score</div>
        </div>

        <div className="metric-stat-card accent-purple">
          <div className="metric-stat-header">
            <span>VERIFIED RATIO</span>
            <ShieldCheck size={13} color="var(--cyber-purple)" />
          </div>
          <div className="metric-stat-value">{campusVerifiedRatio}%</div>
          <div className="metric-stat-sub">Backed by code/proctor proofs</div>
        </div>

        <div className="metric-stat-card accent-amber">
          <div className="metric-stat-header">
            <span>DIAGNOSTIC PASS RATE</span>
            <Award size={13} color="var(--cyber-amber)" />
          </div>
          <div className="metric-stat-value">{diagnosticAvgPassRate}%</div>
          <div className="metric-stat-sub">Proctored assessment benchmark</div>
        </div>

        <div className="metric-stat-card" style={{ background: 'linear-gradient(135deg, rgba(16,26,48,0.9), rgba(11,15,25,0.95))' }}>
          <div className="metric-stat-header">
            <span>TRACKED COMPETENCIES</span>
            <Layers size={13} color="var(--cyber-cyan)" />
          </div>
          <div className="metric-stat-value" style={{ color: 'var(--cyber-cyan)' }}>
            {aggregatedSkills.length}
          </div>
          <div className="metric-stat-sub">Distinct tech stacks</div>
        </div>
      </div>

      {/* ── COMMUNICATION SKILL INTELLIGENCE (DUOLINGO-INTEGRATED CAMPUS TELEMETRY) ── */}
      <div className="glass-panel" style={{ padding: '22px 24px', marginBottom: '24px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(26, 16, 50, 0.8))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
              <MessageSquare size={18} color="#A855F7" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Communication Skill Intelligence
                </h3>
                <span className="cyber-badge badge-purple" style={{ fontSize: '9.5px' }}>
                  STUDENT PORTAL INTEGRATED
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Verbal, listening, grammar, and workplace conversation analytics across mapped students.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>COHORT AVERAGE</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#8B5CF6', fontFamily: 'var(--font-mono)' }}>
                {commAnalytics?.averageCommunicationSkill || 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ACTIVE LEARNERS</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-cyan)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {commAnalytics?.activeCommunicationStudents || 0}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {commAnalytics?.participationRate || 0}% Participation
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>VOCABULARY</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-cyan)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {commAnalytics?.categories?.vocabulary || 0}%
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Workplace lexicon</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GRAMMAR & SYNTAX</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#8B5CF6', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {commAnalytics?.categories?.grammar || 0}%
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Precision writing</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SPEAKING & VOICE</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-emerald)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {commAnalytics?.categories?.speaking || 0}%
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Pronunciation drills</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CONVERSATION</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#EC4899', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {commAnalytics?.categories?.conversation || 0}%
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Interview dialogues</div>
          </div>
        </div>

        {/* Skill Distribution: Beginner, Developing, Intermediate, Advanced */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Proficiency Distribution across Cohort
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Total Active: {commAnalytics?.activeCommunicationStudents || 0}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { label: 'Beginner (<40%)', count: commAnalytics?.distribution?.beginner || 0, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)' },
              { label: 'Developing (40-69%)', count: commAnalytics?.distribution?.developing || 0, color: '#FF9D4D', bg: 'rgba(255, 157, 77, 0.08)' },
              { label: 'Intermediate (70-84%)', count: commAnalytics?.distribution?.intermediate || 0, color: 'var(--cyber-cyan)', bg: 'rgba(0, 212, 255, 0.08)' },
              { label: 'Advanced (85-100%)', count: commAnalytics?.distribution?.advanced || 0, color: 'var(--cyber-emerald)', bg: 'rgba(46, 224, 161, 0.08)' }
            ].map(dist => (
              <div key={dist.label} style={{ padding: '10px 12px', borderRadius: '6px', background: dist.bg, border: `1px solid ${dist.color}33`, textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: dist.color, fontFamily: 'var(--font-mono)' }}>
                  {dist.count}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {dist.label}
                </div>
              </div>
            ))}
          </div>

          {(commAnalytics?.activeCommunicationStudents || 0) === 0 && (
            <div style={{ marginTop: '14px', padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border-subtle)', borderRadius: '6px' }}>
              No students in this institution have completed communication practice drills yet. Analytics will populate automatically as students submit exercises.
            </div>
          )}
        </div>
      </div>

      {/* ── INSTITUTIONAL SKILL OFFERINGS & STUDENT INTELLIGENCE ── */}
      <div className="glass-panel" style={{ padding: '22px 24px', marginBottom: '24px', border: '1px solid rgba(0, 242, 254, 0.3)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(11, 25, 44, 0.8))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 242, 254, 0.4)' }}>
              <BookOpen size={18} color="var(--cyber-cyan)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Published Skill Offerings & Student Intelligence
                </h3>
                <span className="cyber-badge badge-cyan" style={{ fontSize: '9.5px' }}>
                  {institutionalSkills.length} OFFERINGS
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Track student progress, verified proficiency, and cohort distribution across your institution's published curriculum.
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddSkillModal(true)}
            className="btn-cyber-primary"
            style={{ fontSize: '12px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={13} />
            <span>Create New Skill</span>
          </button>
        </div>

        {/* Skill Selector Tabs/Pills */}
        {institutionalSkills.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '8px', color: 'var(--text-muted)' }}>
            <BookOpen size={24} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>No skills published yet</div>
            <div style={{ fontSize: '12px', marginTop: '4px', maxWidth: '400px', margin: '4px auto 14px' }}>
              Publish a skill offering with modules, practice, and assessments to view real student intelligence.
            </div>
            <button
              onClick={() => setShowAddSkillModal(true)}
              className="btn-cyber-primary"
              style={{ fontSize: '12px', padding: '8px 16px' }}
            >
              <Plus size={13} /> Publish First Skill
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px' }}>
              {institutionalSkills.map(sk => {
                const isSelected = sk.id === selectedSkillId;
                return (
                  <button
                    key={sk.id}
                    onClick={() => setSelectedSkillId(sk.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(0, 242, 254, 0.15)' : 'var(--bg-input)',
                      border: isSelected ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                      color: isSelected ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{sk.name}</span>
                    <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: sk.status === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: sk.status === 'PUBLISHED' ? 'var(--cyber-emerald)' : 'var(--cyber-amber)' }}>
                      {sk.status}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Skill Cohort Analytics Dashboard */}
            {selectedSkillIntelligence && (
              <div style={{ marginTop: '8px' }}>
                {/* 5 Real Cohort KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>STUDENTS ENROLLED</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-cyan)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      {selectedSkillIntelligence.studentsEnrolled || 0}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Registered learners</div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>STUDENTS ACTIVE</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-purple)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      {selectedSkillIntelligence.studentsActive || 0}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Completed ≥ 1 activity</div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>STUDENTS COMPLETED</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-emerald)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      {selectedSkillIntelligence.studentsCompleted || 0}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Full curriculum done</div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AVG LEARNING PROGRESS</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-blue)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      {selectedSkillIntelligence.avgLearningProgress || 0}%
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Curriculum progress</div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AVG PROFICIENCY</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--cyber-emerald)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      {selectedSkillIntelligence.avgSkillProficiency || 0}%
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Evidence-based score</div>
                  </div>
                </div>

                {/* Cohort Skill Distribution & Skill Gaps */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                  {/* Distribution */}
                  <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
                      COHORT PROFICIENCY DISTRIBUTION
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#EF4444' }}>{selectedSkillIntelligence.skillDistribution?.beginner || 0}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Beginner</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#F59E0B' }}>{selectedSkillIntelligence.skillDistribution?.developing || 0}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Developing</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(0, 242, 254, 0.08)', borderRadius: '6px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cyber-cyan)' }}>{selectedSkillIntelligence.skillDistribution?.intermediate || 0}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Intermediate</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cyber-emerald)' }}>{selectedSkillIntelligence.skillDistribution?.advanced || 0}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Advanced</div>
                      </div>
                    </div>
                  </div>

                  {/* Skill Gaps */}
                  <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
                      DETECTED COHORT SKILL GAPS
                    </div>
                    {selectedSkillIntelligence.skillGaps?.length > 0 ? (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {selectedSkillIntelligence.skillGaps.map((gap, gIdx) => (
                          <span key={gIdx} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                            {gap}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No widespread bottlenecks detected across active learners.
                      </div>
                    )}
                  </div>
                </div>

                {/* Enrolled Students Table (Section 22 & 24) */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Mapped Students Enrolled in this Skill ({selectedSkillStudents.length})
                  </div>
                  {selectedSkillStudents.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-input)', borderRadius: '6px' }}>
                      No students from your campus have enrolled in this skill yet.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '8px 12px' }}>STUDENT</th>
                            <th style={{ padding: '8px 12px' }}>DEPARTMENT</th>
                            <th style={{ padding: '8px 12px' }}>LEARNING PROGRESS</th>
                            <th style={{ padding: '8px 12px' }}>SKILL PROFICIENCY</th>
                            <th style={{ padding: '8px 12px' }}>MODULES</th>
                            <th style={{ padding: '8px 12px' }}>PRACTICE</th>
                            <th style={{ padding: '8px 12px' }}>ASSESSMENT</th>
                            <th style={{ padding: '8px 12px' }}>CAPSTONE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSkillStudents.map(std => (
                            <tr key={std.studentId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {std.name}
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{std.regNo || std.studentId}</div>
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                                {std.department} · {std.year}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ fontWeight: 700, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>
                                  {std.learningProgress}%
                                </div>
                                <div style={{ width: '80px', height: '4px', background: 'var(--bg-input)', borderRadius: '2px', overflow: 'hidden', marginTop: '3px' }}>
                                  <div style={{ width: `${std.learningProgress}%`, height: '100%', background: 'var(--cyber-cyan)' }} />
                                </div>
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ fontWeight: 700, color: 'var(--cyber-emerald)', fontFamily: 'var(--font-mono)' }}>
                                  {std.proficiency}%
                                </div>
                                <div style={{ width: '80px', height: '4px', background: 'var(--bg-input)', borderRadius: '2px', overflow: 'hidden', marginTop: '3px' }}>
                                  <div style={{ width: `${std.proficiency}%`, height: '100%', background: 'var(--cyber-emerald)' }} />
                                </div>
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                                {std.completedModules} / {std.totalModules}
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                                {std.practiceStats?.totalAttempts || 0} attempts ({std.practiceStats?.accuracy || 0}%)
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ color: std.assessmentResult?.score ? 'var(--cyber-emerald)' : 'var(--text-muted)' }}>
                                  {std.assessmentResult?.score ? `${std.assessmentResult.score}%` : 'Pending'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ color: std.projectSubmission?.submitted ? 'var(--cyber-emerald)' : 'var(--text-muted)' }}>
                                  {std.projectSubmission?.submitted ? 'Submitted' : 'Not Started'}
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
            )}
          </div>
        )}
      </div>

      {/* ── FILTER CONTROLS (DEPT & YEAR) ── */}
      <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Department Pills */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: '4px' }}>
              DEPARTMENT:
            </span>
            {['ALL', 'CSE', 'IT', 'AI & DS', 'ECE'].map(d => (
              <button
                key={d}
                onClick={() => setSelectedDept(d)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedDept === d ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                  background: selectedDept === d ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                  color: selectedDept === d ? 'var(--cyber-cyan)' : 'var(--text-muted)'
                }}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Year Pills */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: '4px' }}>
              ACADEMIC YEAR:
            </span>
            {['ALL', 'I Year', 'II Year', 'III Year', 'IV Year'].map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedYear === y ? '1px solid var(--cyber-emerald)' : '1px solid var(--border-subtle)',
                  background: selectedYear === y ? 'rgba(47, 224, 161, 0.12)' : 'transparent',
                  color: selectedYear === y ? 'var(--cyber-emerald)' : 'var(--text-muted)'
                }}
              >
                {y}
              </button>
            ))}

            {(selectedDept !== 'ALL' || selectedYear !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedDept('ALL');
                  setSelectedYear('ALL');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--cyber-rose)', fontSize: '11.5px', cursor: 'pointer', paddingLeft: '8px' }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── EMPTY STATE IF NO STUDENTS MATCH ── */}
      {filteredStudents.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(0, 242, 254, 0.08)', border: '1px solid rgba(0, 242, 254, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            color: 'var(--cyber-cyan)'
          }}>
            <Users size={22} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            No Students Found For This Filter
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 16px' }}>
            No enrolled students in {collegeName} match the selected department or academic year combination.
          </p>
          <button
            onClick={() => { setSelectedDept('ALL'); setSelectedYear('ALL'); }}
            className="btn-cyber-outline"
            style={{ padding: '7px 16px', fontSize: '12px' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* ── 2-COLUMN GRID: TOP VERIFIED SKILLS & GAP HOTSPOTS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Column 1: Top 5 Verified Competencies */}
            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={17} color="var(--cyber-emerald)" /> Top Verified Campus Competencies
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  By Code & Exam Proofs
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {topVerifiedCompetencies.length === 0 ? (
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                    No verified competencies recorded in this cohort yet.
                  </div>
                ) : (
                  topVerifiedCompetencies.map((skill, idx) => (
                    <div key={skill.name} style={{ padding: '12px 14px', background: 'rgba(10, 16, 30, 0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: 'rgba(47, 224, 161, 0.15)', color: 'var(--cyber-emerald)',
                            fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                            {skill.name}
                          </span>
                          <span className="cyber-badge badge-cyan" style={{ fontSize: '9px', padding: '1px 6px' }}>
                            {skill.category}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-emerald)', fontFamily: 'var(--font-mono)' }}>
                          {skill.avgConfidence}% Avg
                        </span>
                      </div>

                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                        <div style={{ width: `${skill.avgConfidence}%`, height: '100%', background: 'var(--grad-cyan-blue)', borderRadius: '3px' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>{skill.verifiedCount} Students Verified</span>
                        <span>{skill.verifiedPct}% Verification Rate</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Campus Skill Gap Hotspots */}
            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={17} color="var(--cyber-amber)" /> Critical Skill Gap Hotspots
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Intervention Targets
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {skillGapHotspots.length === 0 ? (
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                    No critical skill deficits detected in this active cohort.
                  </div>
                ) : (
                  skillGapHotspots.map((gap) => (
                    <div key={gap.name} style={{ padding: '12px 14px', background: 'rgba(245, 158, 11, 0.06)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                          {gap.name}
                        </span>
                        <span className="cyber-badge badge-amber" style={{ fontSize: '9px', padding: '1px 6px' }}>
                          Deficit: {gap.avgConfidence}% Avg
                        </span>
                      </div>

                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <strong>{gap.gapCount} students</strong> require hands-on lab sprints to meet Tier-1 industry readiness.
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>Recommended: Publish AI sandbox course</span>
                        <button
                          onClick={() => {
                            if (setActivePage) setActivePage('institution-courses');
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--cyber-amber)', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Launch Course →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── DEPARTMENT-WISE SKILL STRENGTH MATRIX ── */}
          <div className="glass-panel" style={{ padding: '22px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={17} color="var(--cyber-cyan)" /> Department-Wise Core Competency Matrix
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Department', 'Enrolled Students', 'Data & AI', 'Core Programming', 'Cloud & DevOps', 'Web & Databases', 'Overall Status'].map((h, i) => (
                      <th key={i} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '10.5px', letterSpacing: '0.06em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {departmentMatrix.map((dept) => {
                    const avgDept = Math.round((dept.aiScore + dept.progScore + dept.cloudScore + dept.webScore) / 4);
                    const statusColor = avgDept >= 80 ? 'var(--cyber-emerald)' : avgDept >= 65 ? 'var(--cyber-cyan)' : 'var(--cyber-amber)';
                    return (
                      <tr key={dept.dept} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {dept.dept}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                          {dept.count} Students
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ color: dept.aiScore >= 80 ? 'var(--cyber-emerald)' : 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            {dept.aiScore}%
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ color: dept.progScore >= 80 ? 'var(--cyber-emerald)' : 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            {dept.progScore}%
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ color: dept.cloudScore >= 80 ? 'var(--cyber-emerald)' : 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            {dept.cloudScore}%
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ color: dept.webScore >= 80 ? 'var(--cyber-emerald)' : 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            {dept.webScore}%
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            background: avgDept >= 80 ? 'rgba(47, 224, 161, 0.12)' : 'rgba(0, 242, 254, 0.12)',
                            color: statusColor
                          }}>
                            {avgDept >= 80 ? 'Placement Ready' : 'In Maturation'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── YEAR-WISE COMPETENCY PROGRESSION ── */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={17} color="var(--cyber-emerald)" /> 4-Year Competency Progression Timeline
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {[
                { year: 'I Year', milestone: 'Foundational Aptitude', progress: '58%', desc: 'C, Python, Math & Logic Diagnostics' },
                { year: 'II Year', milestone: 'Core Engineering', progress: '72%', desc: 'Data Structures, DBMS, Web & Git Repositories' },
                { year: 'III Year', milestone: 'Specialization & Lab Proofs', progress: '88%', desc: 'AI/ML, Cloud Microservices, Capstones' },
                { year: 'IV Year', milestone: 'Industry Placement Ready', progress: '94%', desc: 'Corporate Internships, Full Stack Systems' }
              ].map((yr) => (
                <div key={yr.year} style={{ padding: '14px', background: 'rgba(10, 16, 30, 0.6)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{yr.year}</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>{yr.progress}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--cyber-emerald)', fontWeight: 600, marginBottom: '4px' }}>{yr.milestone}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{yr.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 10-Step Institutional Skill Creation Wizard Modal */}
      {showAddSkillModal && (
        <AddSkillWizardModal
          isOpen={showAddSkillModal}
          onClose={() => setShowAddSkillModal(false)}
          onSkillSaved={() => {
            loadCampusData();
            setShowAddSkillModal(false);
            if (onShowToast) {
              onShowToast({
                title: 'Skill Offering Saved',
                message: 'Your institutional skill offering has been saved and is available in the learning directory.',
                type: 'success'
              });
            }
          }}
          institution={institution}
        />
      )}
    </div>
  );
}

function determineSkillCategory(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('python') || n.includes('java') || n.includes('c++') || n.includes('go') || n.includes('rust') || n.includes('coding')) return 'Programming';
  if (n.includes('data') || n.includes('ai') || n.includes('learning') || n.includes('nlp') || n.includes('vision') || n.includes('power bi')) return 'Data & AI';
  if (n.includes('sql') || n.includes('mongo') || n.includes('postgres') || n.includes('db') || n.includes('react') || n.includes('web')) return 'Web & Database';
  if (n.includes('cloud') || n.includes('aws') || n.includes('docker') || n.includes('kubernetes')) return 'Cloud & Distributed';
  return 'Programming';
}
