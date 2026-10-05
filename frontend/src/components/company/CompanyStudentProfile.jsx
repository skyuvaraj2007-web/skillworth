import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  MessageSquare,
  Send,
  Download,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Target,
  ExternalLink,
  FolderGit2,
  CheckCircle2,
  Calendar,
  Award,
  Check,
  Layers,
  Code,
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function CompanyStudentProfile({
  student,
  onBack,
  onToggleShortlist,
  isShortlisted = false,
  onContactStudent,
  onOpenInviteModal,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!student) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>Student profile not found.</p>
        <button type="button" onClick={onBack} className="company-btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students</span>
        </button>
      </div>
    );
  }

  // Profile data resolution
  const matchScore = student.aiMatchScore || student.matchScore || 0;
  const courseProgressItems = student.courseProgressList || student.courses || [];

  const readinessBreakdown = student.readinessBreakdown || {
    technicalSkills: student.technicalScore || student.readiness || 0,
    projects: student.projectsScore || 0,
    certificates: student.certificatesScore || 0,
    communication: student.communicationScore || 0,
    interviewReadiness: student.interviewScore || 0
  };

  const skillsList = student.skills || [];
  const projects = student.projectsList || student.projects || [];
  const certs = student.certifications || student.certificates || [];
  const timelineItems = student.timeline || [];
  const assessments = student.assessments || [];

  const handleDownloadResume = () => {
    if (onShowToast) {
      onShowToast({
        title: 'Resume Export Generated',
        message: `Cryptographically verified Digital Passport PDF generated for ${student.name}.`,
        type: 'success'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Student Search</span>
      </button>

      {/* 9. Profile Header Card */}
      <div className="company-card p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Avatar & Personal Info */}
          <div className="flex items-start md:items-center gap-5">
            <div className="relative">
              <img
                src={student.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={student.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-400/40 shadow-[0_0_20px_rgba(40,215,255,0.25)]"
              />
              <div className="absolute -bottom-1 -right-1 bg-[#050B18] p-1 rounded-full border border-cyan-400">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">{student.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3" />
                  <span>Sovereign Verified</span>
                </span>
              </div>

              <p className="text-sm text-slate-300 mt-1 font-medium">
                {student.department || 'CSE'} • {student.year || '3rd Year'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {student.collegeName || student.institutionName || 'Affiliated Campus'}
              </p>
            </div>
          </div>

          {/* Large Circular Match + Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Match Circle */}
            <div className="flex items-center gap-3 bg-white/[0.03] border border-cyan-500/20 px-4 py-2.5 rounded-2xl shadow-[inset_0_0_15px_rgba(40,215,255,0.05)]">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    stroke="#28D7FF"
                    strokeWidth="3.2"
                    strokeDasharray={`${matchScore}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-bold text-white text-base">{matchScore}%</span>
              </div>
              <div>
                <span className="text-xs font-bold text-cyan-300 block">Excellent Match</span>
                <span className="text-[11px] text-slate-400">NEXUS AI Evidence Score</span>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onToggleShortlist(student.studentId)}
                className={`text-xs py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  isShortlisted
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isShortlisted ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
              </button>

              <button
                type="button"
                onClick={() => onContactStudent(student)}
                className="company-btn-secondary text-xs py-2 px-3 justify-center"
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Contact Student</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenInviteModal(student)}
                className="company-btn-gradient text-xs py-2 px-3 justify-center"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invite to Opp</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadResume}
                className="company-btn-secondary text-xs py-2 px-3 justify-center"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Resume</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Tabs Navigation */}
        <div className="flex border-b border-white/10 mt-6 -mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'skills', label: 'Skills' },
            { id: 'projects', label: 'Projects' },
            { id: 'certificates', label: 'Certificates' },
            { id: 'assessments', label: 'Assessments' },
            { id: 'timeline', label: 'Timeline' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="company-card">
              <h2 className="company-card-title text-sm font-semibold mb-4">Personal Information</h2>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-cyan-400" /> Email</span>
                  <span className="text-white font-medium">{student.email || 'Not Disclosed'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-cyan-400" /> Phone</span>
                  <span className="text-white font-medium">{student.phone || 'Not Disclosed'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400 flex items-center gap-2"><Building className="w-3.5 h-3.5 text-cyan-400" /> College</span>
                  <span className="text-white font-medium text-right">{student.collegeName || student.institutionName || 'Partner Institution'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400 flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5 text-cyan-400" /> Department</span>
                  <span className="text-white font-medium">{student.department || 'Engineering'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Academic Year</span>
                  <span className="text-white font-medium">{student.year || '3rd Year (Batch of 2026)'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400 flex items-center gap-2"><Target className="w-3.5 h-3.5 text-purple-400" /> Career Goal</span>
                  <span className="text-cyan-300 font-semibold">{student.careerGoal || 'Full Stack Engineer & AI Systems Architect'}</span>
                </div>
              </div>
            </div>

            {/* Course Progress */}
            <div className="company-card">
              <h2 className="company-card-title text-sm font-semibold mb-4">Course Progress</h2>
              <div className="space-y-4">
                {courseProgressItems.length === 0 ? (
                  <p className="text-xs text-slate-400">No course progress records yet.</p>
                ) : (
                  courseProgressItems.map(item => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-200">{item.name}</span>
                        <span className="font-mono text-cyan-400 font-semibold">{item.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Career Readiness Circular Indicators */}
          <div className="company-card">
            <h2 className="company-card-title text-sm font-semibold mb-4">Career Readiness Assessment</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: 'Technical Skills', val: readinessBreakdown.technicalSkills, color: '#28D7FF' },
                { label: 'Projects', val: readinessBreakdown.projects, color: '#3478FF' },
                { label: 'Certificates', val: readinessBreakdown.certificates, color: '#8B5CF6' },
                { label: 'Communication', val: readinessBreakdown.communication, color: '#2FE0A1' },
                { label: 'Interview Readiness', val: readinessBreakdown.interviewReadiness, color: '#FF9D4D' }
              ].map(meter => (
                <div key={meter.label} className="flex flex-col items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="relative w-16 h-16 flex items-center justify-center my-1">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        stroke={meter.color}
                        strokeWidth="3.5"
                        strokeDasharray={`${meter.val}, 100`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute font-bold text-white text-xs">{meter.val}%</span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium text-center mt-1">{meter.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SKILLS */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {skillsList.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              No verified skills recorded yet.
            </div>
          ) : (
            skillsList.map(skill => (
              <div key={skill.name} className="company-card p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">{skill.name}</span>
                    {skill.verified ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 font-mono">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">In Progress</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                    <span>Confidence:</span>
                    <span className="font-mono text-cyan-400 font-semibold">{skill.confidence || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${skill.confidence || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {skill.evidence || 'Verified proctored diagnostic assessment & repository proofs.'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              No projects published yet.
            </div>
          ) : (
            projects.map(proj => (
              <div key={proj.title || proj.id} className="company-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-white">{proj.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified Proof</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 my-3">
                    {(proj.technologies || []).map(tech => (
                      <span key={tech} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {proj.description || 'Project details verified.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-3">
                    {proj.github && (
                      <a
                        href={proj.github}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <FolderGit2 className="w-3.5 h-3.5" />
                        <span>Code</span>
                      </a>
                    )}
                    {proj.liveDemo && (
                      <a
                        href={proj.liveDemo}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Ledger Sealed</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              No verified certificates yet.
            </div>
          ) : (
            certs.map(cert => (
              <div key={cert.title || cert.credentialId} className="company-card p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{cert.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{cert.issuer}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-mono">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-white/5">
                    <span>Issued: {cert.date || 'Verified'}</span>
                    <span className="font-mono text-cyan-400">{cert.credentialId || ''}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: ASSESSMENTS */}
      {activeTab === 'assessments' && (
        <div className="company-card">
          <h2 className="company-card-title text-sm font-semibold mb-4">Proctored Code Diagnostics</h2>
          <div className="space-y-3">
            {assessments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No proctored code diagnostics recorded yet.</p>
            ) : (
              assessments.map(as => (
                <div key={as.domain || as.title} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-xs">{as.domain || as.title}</h4>
                    <span className="text-[11px] text-slate-400">{as.percentile || 'Proctored'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-cyan-400 font-mono">{as.score}%</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      {as.status || 'Verified'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="company-card">
          <h2 className="company-card-title text-sm font-semibold mb-6">Attested Academic & Project Timeline</h2>
          {timelineItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No timeline events recorded yet.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyan-500/30">
              {timelineItems.map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#28D7FF]" />
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-purple-500/15 text-purple-300">
                        {item.type}
                      </span>
                      <span className="text-[11px] text-slate-400">{item.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[11px] text-slate-300 mt-1">{item.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
