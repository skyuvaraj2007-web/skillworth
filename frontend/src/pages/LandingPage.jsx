import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LandingPage({ setActivePage }) {
  const { t } = useLanguage();

  return (
    <div className="sw-landing">
      {/* Hero Section */}
      <section className="sw-hero">
        <div className="sw-hero-badge">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#1a73e8' }}>verified</span>
          <span>Standardized Skill Assessment &amp; RPL Verification</span>
        </div>
        <h1 className="sw-hero-title">
          Verify Skills. Empower Talent.<br />
          <span className="sw-gradient-text">Built on Real Competence.</span>
        </h1>
        <p className="sw-hero-subtitle">
          SkillWorth bridges academia, industry, and prior learning through transparent evidence evaluation,
          video demonstration analysis, and authorized human assessor verification.
        </p>

        <div className="sw-hero-cta">
          <button 
            className="sw-btn-primary sw-btn-lg"
            onClick={() => setActivePage('register')}
          >
            <span className="material-symbols-outlined">how_to_reg</span>
            {t('register')}
          </button>
          <button 
            className="sw-btn-outline sw-btn-lg"
            onClick={() => setActivePage('verify')}
          >
            <span className="material-symbols-outlined">qr_code_scanner</span>
            {t('verifyCredential')}
          </button>
          <button 
            className="sw-btn-secondary sw-btn-lg"
            onClick={() => setActivePage('login')}
          >
            <span className="material-symbols-outlined">login</span>
            Quick Demo Login
          </button>
        </div>
      </section>

      {/* 3 Stakeholder Roles */}
      <section className="sw-roles-section">
        <div className="sw-section-header">
          <h2 className="sw-section-title">A Unified Ecosystem for Prior Learning</h2>
          <p className="sw-section-sub">Role-based workflows tailored to learners, accredited institutions, and industry hiring partners.</p>
        </div>

        <div className="sw-role-cards-grid">
          {/* Learner Card */}
          <div className="sw-role-card">
            <div className="sw-role-card-header">
              <div className="sw-role-card-icon" style={{ backgroundColor: '#e8f0fe', color: '#1a73e8' }}>
                <span className="material-symbols-outlined">school</span>
              </div>
              <span className="sw-role-badge sw-badge-blue">Learner</span>
            </div>
            <h3 className="sw-role-card-title">Learner & Student</h3>
            <p className="sw-role-card-desc">
              Showcase practical skills through portfolio artifacts, code repositories, and recorded video demonstrations.
              Take rigorous online assessments and earn verifiable credentials.
            </p>
            <ul className="sw-role-features">
              <li><span className="material-symbols-outlined">check_circle</span> Multi-format evidence submission</li>
              <li><span className="material-symbols-outlined">check_circle</span> Video demonstration upload & preview</li>
              <li><span className="material-symbols-outlined">check_circle</span> Instant AI preliminary analysis</li>
              <li><span className="material-symbols-outlined">check_circle</span> Tamper-proof SW-XXXXXX Credential</li>
            </ul>
            <button 
              className="sw-btn-outline sw-btn-block"
              onClick={() => setActivePage('register')}
            >
              Start as Learner &rarr;
            </button>
          </div>

          {/* Institution Card */}
          <div className="sw-role-card">
            <div className="sw-role-card-header">
              <div className="sw-role-card-icon" style={{ backgroundColor: '#fce8e6', color: '#d93025' }}>
                <span className="material-symbols-outlined">account_balance</span>
              </div>
              <span className="sw-role-badge sw-badge-red">Institution</span>
            </div>
            <h3 className="sw-role-card-title">Institution & Assessor</h3>
            <p className="sw-role-card-desc">
              Accredited universities and assessment centers deploy standardized protocols. Authorized assessors
              review student video demonstrations and sign off on credentials.
            </p>
            <ul className="sw-role-features">
              <li><span className="material-symbols-outlined">check_circle</span> Assessor accreditation workflow</li>
              <li><span className="material-symbols-outlined">check_circle</span> Practical video evaluation suite</li>
              <li><span className="material-symbols-outlined">check_circle</span> Decision protocol (Approve / Reject)</li>
              <li><span className="material-symbols-outlined">check_circle</span> Standardized audit compliance records</li>
            </ul>
            <button 
              className="sw-btn-outline sw-btn-block"
              onClick={() => setActivePage('register')}
            >
              Partner as Institution &rarr;
            </button>
          </div>

          {/* Industry Card */}
          <div className="sw-role-card">
            <div className="sw-role-card-header">
              <div className="sw-role-card-icon" style={{ backgroundColor: '#e6f4ea', color: '#137333' }}>
                <span className="material-symbols-outlined">domain</span>
              </div>
              <span className="sw-role-badge sw-badge-green">Industry</span>
            </div>
            <h3 className="sw-role-card-title">Industry & Enterprise</h3>
            <p className="sw-role-card-desc">
              Instantly verify candidate competence using unique Credential IDs. Review competency scores,
              assessor endorsements, and hire pre-validated technical talent.
            </p>
            <ul className="sw-role-features">
              <li><span className="material-symbols-outlined">check_circle</span> Instant Credential ID verification</li>
              <li><span className="material-symbols-outlined">check_circle</span> Pre-validated competency metrics</li>
              <li><span className="material-symbols-outlined">check_circle</span> Zero-fraud talent matching</li>
              <li><span className="material-symbols-outlined">check_circle</span> Direct access to verified candidates</li>
            </ul>
            <button 
              className="sw-btn-outline sw-btn-block"
              onClick={() => setActivePage('register')}
            >
              Join as Industry Partner &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* Workflow Step Indicator */}
      <section className="sw-workflow-section">
        <h2 className="sw-section-title">The SkillWorth RPL Process</h2>
        <div className="sw-steps-container">
          <div className="sw-step-item">
            <div className="sw-step-number">1</div>
            <h4>Register & Select Skill</h4>
            <p>Choose your technical domain and review required competencies.</p>
          </div>
          <div className="sw-step-arrow">&rarr;</div>
          <div className="sw-step-item">
            <div className="sw-step-number">2</div>
            <h4>Submit Video & Evidence</h4>
            <p>Upload project code, documentation, and a recorded video walkthrough.</p>
          </div>
          <div className="sw-step-arrow">&rarr;</div>
          <div className="sw-step-item">
            <div className="sw-step-number">3</div>
            <h4>AI & Human Assessment</h4>
            <p>Complete protocol questions while AI assists and authorized assessors verify.</p>
          </div>
          <div className="sw-step-arrow">&rarr;</div>
          <div className="sw-step-item">
            <div className="sw-step-number">4</div>
            <h4>Official Credential</h4>
            <p>Earn a verified SkillWorth RPL assessment record endorsed by authorized assessors.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
