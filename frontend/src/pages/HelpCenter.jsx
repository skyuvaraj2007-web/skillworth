import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Building2,
  Briefcase,
  Users,
  Award,
  FolderGit2,
  FileText,
  Lock,
  Sparkles,
  Sliders,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { normalizeRole } from '../services/notificationStore';

export default function HelpCenter({ onShowToast, user }) {
  const currentRole = normalizeRole(user?.role);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // ── 1. STUDENT FAQS & CATEGORIES ──────────────────────────────────────────
  const studentCategories = [
    { label: "Getting Started", icon: HelpCircle },
    { label: "Account & Profile", icon: HelpCircle },
    { label: "Learning", icon: BookOpen },
    { label: "Course Enrollment", icon: BookOpen },
    { label: "Skill Assessment", icon: Award },
    { label: "Projects", icon: FolderGit2 },
    { label: "Certificates & Badges", icon: Award },
    { label: "Digital Passport", icon: ShieldCheck },
    { label: "Opportunities", icon: ExternalLink },
    { label: "Applications", icon: FileText },
    { label: "Notifications", icon: Mail },
    { label: "Privacy & Security", icon: Lock }
  ];

  const studentFaqs = [
    {
      category: "Getting Started",
      q: "What is SKILLNEXUS AI and how does it help my career?",
      a: "SKILLNEXUS AI is a sovereign skill verification and career velocity platform. It helps you assess current competencies, enroll in targeted micro-sprints, build verified projects, seal achievements to a cryptographic Digital Passport, and automatically match with top employer internships."
    },
    {
      category: "Course Enrollment",
      q: "How do I enroll in a course or learning sprint?",
      a: "Navigate to Learning → Course Enrollment. You can browse high-demand tech stacks (such as Generative AI, Cloud Microservices, and Full Stack Development) and click 'Enroll Now'. Courses with prerequisites will automatically verify your assessment scores."
    },
    {
      category: "Skill Assessment",
      q: "How do I complete a skill assessment and when can I retake it?",
      a: "Visit the Skill Assessment workspace and choose a diagnostic topic. Assessments feature timed, proctored coding and algorithmic challenges. If you wish to improve your score, a 14-day cooldown applies to allow time for gap remediation."
    },
    {
      category: "Skill Assessment",
      q: "How are my skill readiness scores and competency percentiles calculated?",
      a: "The Skill Readiness Index dynamically benchmarks your verified assessment accuracy, proctored test results, GitHub commit audits, and completed courses against real-time industry requirement rubrics."
    },
    {
      category: "Projects",
      q: "How do I validate a custom project and get it verified?",
      a: "Go to Projects → Validate New Project. Submit your public GitHub repository URL. The Nexus AI engine audits your commit velocity, Docker containers, test pass rates, and codebase architecture, followed by faculty proctor attestation."
    },
    {
      category: "Certificates & Badges",
      q: "How do I earn certified credentials and badges?",
      a: "Certificates are issued automatically upon scoring ≥80% in comprehensive module assessments. Badges (such as 'Top 5% Project Architect') unlock when you complete milestone projects and maintain consistent learning streaks."
    },
    {
      category: "Digital Passport",
      q: "How does the Cryptographic Digital Passport work?",
      a: "Your Digital Passport stores cryptographic hashes (ZK-SNARK seals) of your verified skills, projects, and certifications. Employers can mathematically verify your achievements without contacting third parties."
    },
    {
      category: "Opportunities",
      q: "How does opportunity matching work and why does my match score change?",
      a: "Match scores compare your verified competencies directly against employer job requirements. As you complete new assessments, verify projects, or when employers adjust required tech stacks, your match percentage updates dynamically in real-time."
    },
    {
      category: "Applications",
      q: "What is 1-Click Express Apply for internships?",
      a: "When your verified competency match exceeds 85%, you unlock 1-Click Express Apply. This instantly sends your tamper-proof Digital Passport directly to hiring managers without requiring redundant manual forms."
    },
    {
      category: "Notifications",
      q: "Where do deleted notifications go and how can I restore them?",
      a: "Deleted notifications are safely stored in your role's Notification Trash Bin located in Settings → Notification Trash Bin. You can restore them to your active feed anytime."
    },
    {
      category: "Privacy & Security",
      q: "Who can see my profile and assessment scores?",
      a: "You have complete sovereign control. In Settings → Profile Preferences, you can set visibility to Public, Verified Corporate Partners Only, or Anonymous (where recruiters only see verified ZK-proofs without personal identifiers)."
    }
  ];

  // ── 2. INSTITUTION FAQS & CATEGORIES ─────────────────────────────────────
  const institutionCategories = [
    { label: "Getting Started", icon: HelpCircle },
    { label: "Institution Profile", icon: Building2 },
    { label: "Academic Workspace", icon: BookOpen },
    { label: "Student Details", icon: Users },
    { label: "Student Readiness", icon: Award },
    { label: "Cohort Telemetry", icon: ShieldCheck },
    { label: "Verified Skill Proofs", icon: FolderGit2 },
    { label: "Placement Pipeline", icon: ExternalLink },
    { label: "Courses", icon: BookOpen },
    { label: "Notifications", icon: Mail },
    { label: "Institution Settings", icon: Sliders },
    { label: "Privacy & Security", icon: Lock }
  ];

  const institutionFaqs = [
    {
      category: "Getting Started",
      q: "How does the Academia Workspace empower our institution?",
      a: "The Academia Workspace provides comprehensive cohort telemetry, student readiness indices, and verified project attestation pipelines. Faculty and placement officers can monitor student velocity, verify proofs, and connect candidates with hiring partners."
    },
    {
      category: "Cohort Telemetry",
      q: "How is the Campus Readiness Average calculated across cohorts?",
      a: "Campus Readiness is an aggregated metric derived from verified student assessments, completed course sprints, faculty-attested project proofs, and placement benchmark tests across CSE, IT, AI & DS, and core departments."
    },
    {
      category: "Verified Skill Proofs",
      q: "How do faculty members review and validate student project submissions?",
      a: "Navigate to Verified Skill Proofs (or notifications). Click 'Review Proof' to inspect the automated Git commit audit, test suite pass rates, and codebase architecture. Faculty can then issue an authorized cryptographic attestation stamp."
    },
    {
      category: "Student Details",
      q: "How do I filter and export student roster readiness reports?",
      a: "Open Student Details from the sidebar. You can filter students by department, graduation batch, semester, CGPA, and specific skill competencies. Data can be exported for accreditation or recruitment prep."
    },
    {
      category: "Placement Pipeline",
      q: "How do we identify placement-ready students for corporate recruitment drives?",
      a: "The Placement Pipeline automatically filters students who have achieved ≥80% Career Readiness and completed at least 2 verified project proofs, ensuring employers receive high-confidence candidates."
    },
    {
      category: "Courses",
      q: "How can our department add or manage curriculum-aligned courses?",
      a: "In Course Management, department heads can map institutional curriculum syllabi to industry competencies, create customized learning tracks, and monitor class-wide completion rates."
    },
    {
      category: "Institution Settings",
      q: "How do I configure placement criteria and faculty validation requirements?",
      a: "Visit Institution Settings → Academic Preferences. You can adjust the minimum readiness score threshold for placement eligibility, mandate faculty signatures on proofs, and manage notification triggers."
    },
    {
      category: "Notifications",
      q: "How are institution notifications isolated from student alerts?",
      a: "All institutional notifications (new student registrations, proof submissions, high-readiness alerts) are strictly isolated to authenticated campus administration accounts. Students and recruiters cannot view campus administrative feeds."
    }
  ];

  // ── 3. COMPANY FAQS & CATEGORIES ─────────────────────────────────────────
  const companyCategories = [
    { label: "Getting Started", icon: HelpCircle },
    { label: "Company Profile", icon: Building2 },
    { label: "Talent Search", icon: Search },
    { label: "Candidate Matching", icon: Sparkles },
    { label: "Opportunities", icon: Briefcase },
    { label: "Applications", icon: FileText },
    { label: "Candidate Skills", icon: ShieldCheck },
    { label: "Project Proofs", icon: FolderGit2 },
    { label: "Interviews", icon: Calendar },
    { label: "Notifications", icon: Mail },
    { label: "Company Settings", icon: Sliders },
    { label: "Privacy & Security", icon: Lock }
  ];

  const companyFaqs = [
    {
      category: "Getting Started",
      q: "How does SKILLNEXUS AI streamline corporate hiring?",
      a: "SkillNexus AI eliminates resume fraud and unqualified candidate screening. Candidates are pre-vetted via cryptographic skill proofs, live coding rubrics, and automated AI assessments, allowing you to hire job-ready interns and graduates with explainable match data."
    },
    {
      category: "Candidate Matching",
      q: "How does the AI Explainable Matching algorithm work?",
      a: "Rather than simple keyword matching, our engine compares your defined hiring criteria (roles, skills, proficiency level, location) against tamper-proof evidence in student portfolios. We provide a percentage fit score and break down exactly why each candidate matches."
    },
    {
      category: "Talent Search",
      q: "How do I filter candidates by verified competencies and project proofs?",
      a: "In Company Workspace → Talent Search, you can filter by department (e.g. CSE, IT, AI & DS), graduation batch, minimum match score (70% - 90%+), and specific technology stacks (Python, Docker, AWS, React)."
    },
    {
      category: "Project Proofs",
      q: "How can I verify a student's GitHub code evidence and project integrity?",
      a: "In Company Workspace → Project Proofs, you can review verified student repositories. Each entry displays audited commit history, Docker container execution health, unit test pass rates, and institutional faculty attestations."
    },
    {
      category: "Opportunities",
      q: "How do I publish an internship or job opening?",
      a: "Click 'Create Opportunity' in your Company Workspace. Define the opportunity title, type (3-month, 6-month, or full-time convertible), stipend/salary, and required skill tags. The platform immediately matches your posting with top-scoring candidates."
    },
    {
      category: "Applications",
      q: "How do I track and manage candidate applications?",
      a: "Use Company Workspace → Applications to view candidates in stages: New, Under Review, Shortlisted, Interview, and Selected. You can advance candidates through recruitment stages with one click."
    },
    {
      category: "Interviews",
      q: "What is 1-Click Fast-Track Interview dispatch?",
      a: "When you identify a high-match candidate, clicking '1-Click Fast-Track Interview' automatically issues an official interview invitation through their verified campus institutional portal."
    },
    {
      category: "Company Settings",
      q: "How do I adjust our hiring preferences and candidate filters?",
      a: "Go to Company Settings → Hiring Preferences. You can modify your preferred roles, mandatory skill competencies, experience expectations, and graduation batch targets."
    },
    {
      category: "Privacy & Security",
      q: "Is candidate data protected under privacy agreements?",
      a: "Yes. All student data access is cryptographically audited. Students grant explicit permissions through their sovereign Digital Passports, ensuring complete compliance with data protection and institutional confidentiality standards."
    }
  ];

  // Derive current role configuration
  const categories = currentRole === 'institution'
    ? institutionCategories
    : currentRole === 'company'
      ? companyCategories
      : studentCategories;

  const faqs = currentRole === 'institution'
    ? institutionFaqs
    : currentRole === 'company'
      ? companyFaqs
      : studentFaqs;

  // Filtered FAQs based on category click & text search
  const filteredFaqs = faqs.filter(f => {
    const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesQuery = !searchQuery.trim() ||
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleContactSupport = () => {
    if (onShowToast) {
      onShowToast({
        title: "Support Request Dispatched",
        message: `Your ${currentRole.toUpperCase()} inquiry has been routed to the priority Nexus AI assistance desk.`,
        type: "success"
      });
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Telemetry Header */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div className="telemetry-node-tag">
            <span>SUPPORT & GUIDANCE</span>
            <span>//</span>
            <span>{currentRole.toUpperCase()} KNOWLEDGE NODE</span>
            <span>//</span>
            <span>DIAGNOSTIC PROTOCOL</span>
          </div>
          <h1>{currentRole === 'institution' ? 'Institution Help Center' : currentRole === 'company' ? 'Company Help Center' : 'Student Help Center'}</h1>
          <p>
            {currentRole === 'institution'
              ? 'Institutional guides, cohort telemetry explanation, proof verification procedures, and academic workspace documentation.'
              : currentRole === 'company'
                ? 'Corporate recruiter guides, AI talent matching rubrics, opportunity posting manuals, and project proof verification docs.'
                : 'Comprehensive guides to skill verification, learning modules, assessment diagnostics, and cryptographic passport management.'}
          </p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '8px',
          background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)',
          fontSize: '11.5px', fontFamily: 'var(--font-mono)'
        }}>
          <span className="status-dot-pulse" style={{ background: 'var(--cyber-cyan)', boxShadow: 'var(--cyber-cyan-glow)' }}></span>
          <span>SUPPORT AI: <strong style={{ color: 'var(--cyber-cyan)' }}>ONLINE</strong></span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        {/* Left Content Area */}
        <div>
          {/* Search Bar */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              How can we assist your {currentRole} session today?
            </h2>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', background: 'var(--bg-input)',
              borderRadius: '8px', border: '1px solid var(--border-subtle)'
            }}>
              <Search size={18} color="var(--text-muted)" />
              <input
                type="text"
                placeholder={`Search ${currentRole} documentation, questions, workflows...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', color: '#fff',
                  width: '100%', outline: 'none', fontSize: '14px'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
              <button
                onClick={() => setSelectedCategory('All')}
                style={{
                  padding: '5px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  background: selectedCategory === 'All' ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: selectedCategory === 'All' ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                  color: selectedCategory === 'All' ? 'var(--cyber-cyan)' : 'var(--text-secondary)'
                }}
              >
                All Topics ({faqs.length})
              </button>
              {categories.map((cat, idx) => {
                const count = faqs.filter(f => f.category === cat.label).length;
                if (count === 0) return null;
                const isSelected = selectedCategory === cat.label;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedCategory(cat.label)}
                    style={{
                      padding: '5px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      background: isSelected ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                      color: isSelected ? 'var(--cyber-cyan)' : 'var(--text-secondary)'
                    }}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedCategory === 'All' ? `Frequently Asked Questions (${filteredFaqs.length})` : `${selectedCategory} (${filteredFaqs.length})`}
              </h3>
              {searchQuery && (
                <span style={{ fontSize: '12px', color: 'var(--cyber-cyan)' }}>
                  Filtering by "{searchQuery}"
                </span>
              )}
            </div>

            {filteredFaqs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <HelpCircle size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>No matching topics found</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Try searching with different keywords or clearing filters.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredFaqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div
                      key={index}
                      style={{
                        borderRadius: '8px',
                        background: isOpen ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.015)',
                        border: isOpen ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
                        transition: 'all 0.2s ease', overflow: 'hidden'
                      }}
                    >
                      <button
                        onClick={() => toggleFaq(index)}
                        style={{
                          width: '100%', padding: '16px 20px', background: 'transparent',
                          border: 'none', display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', cursor: 'pointer', textAlign: 'left',
                          color: isOpen ? 'var(--cyber-cyan)' : 'var(--text-primary)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="cyber-badge" style={{ fontSize: '9px', padding: '2px 7px' }}>
                            {faq.category}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{faq.q}</span>
                        </div>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {isOpen && (
                        <div style={{
                          padding: '0 20px 20px 20px', fontSize: '13px',
                          color: 'var(--text-secondary)', lineHeight: 1.6,
                          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                          paddingTop: '14px'
                        }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Categories & Support */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Categories List */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Documentation Categories
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {categories.map((cat, i) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.label;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedCategory(cat.label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '6px', background: isSelected ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                      border: 'none', color: isSelected ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                      fontSize: '12.5px', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={14} color={isSelected ? 'var(--cyber-cyan)' : 'var(--text-muted)'} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact Support Card */}
          <div className="glass-panel" style={{ padding: '20px', borderTop: '2px solid var(--cyber-cyan)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageCircle size={15} color="var(--cyber-cyan)" /> Need Specialized Help?
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Our dedicated AI diagnostic and support team assists with {currentRole} configuration, API integration, and troubleshooting.
            </p>
            <button
              onClick={handleContactSupport}
              className="btn-cyber-primary"
              style={{ width: '100%', fontSize: '12px', padding: '10px', justifyContent: 'center' }}
            >
              <Mail size={13} /> Contact Support Desk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
