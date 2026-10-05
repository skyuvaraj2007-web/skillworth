import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function RegisterPage({ setActivePage }) {
  const { register } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const [role, setRole] = useState('LEARNER');
  const [formData, setFormData] = useState({
    // Account credentials
    password: '',
    confirmPassword: '',
    preferredLanguage: lang,

    // Learner Personal
    fullName: '',
    email: '',
    mobile: '',
    dob: '',
    profilePhoto: '',

    // Learner Academic
    collegeName: '',
    department: 'Computer Science and Engineering',
    degree: 'B.Tech',
    specialization: 'Artificial Intelligence & Software Systems',
    currentYear: '3rd Year',
    studentId: '',
    graduationYear: '2026',

    // Learner Location
    state: 'Tamil Nadu',
    district: 'Coimbatore',

    // Learner Skill
    primarySkill: 'Python Software Engineering',
    skillLevel: 'Intermediate',

    // Institution Details
    institutionName: '',
    institutionType: 'Autonomous Engineering College',
    officialEmail: '',
    officialPhone: '',
    website: '',
    recognitionId: '',
    address: '',

    // Institution Representative / Assessor
    repFullName: '',
    repDesignation: '',
    repEmail: '',
    repPhone: '',
    applyAsAssessor: true,
    assessorQualification: 'Ph.D. / M.Tech in CSE',
    assessorSpecialization: 'Software Architecture & Prior Learning Evaluation',
    assessorExperience: 10,

    // Industry Details
    companyName: '',
    industrySector: 'Enterprise Software & Cloud Platforms',
    companyWebsite: '',
    companyOfficialEmail: '',
    companyPhone: '',
    officeAddress: '',

    // Industry Representative
    indRepName: '',
    indRepDesignation: 'Head of Technical Talent & University Relations',
    indRepEmail: '',
    indRepPhone: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        role,
        password: formData.password,
        preferredLanguage: formData.preferredLanguage || lang
      };

      if (role === 'LEARNER') {
        Object.assign(payload, {
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          dob: formData.dob,
          profilePhoto: formData.profilePhoto,
          collegeName: formData.collegeName,
          department: formData.department,
          degree: formData.degree,
          specialization: formData.specialization,
          currentYear: formData.currentYear,
          studentId: formData.studentId,
          graduationYear: formData.graduationYear,
          state: formData.state,
          district: formData.district,
          city: formData.district,
          primarySkill: formData.primarySkill,
          skillLevel: formData.skillLevel
        });
      } else if (role === 'INSTITUTION') {
        Object.assign(payload, {
          institutionName: formData.institutionName,
          institutionType: formData.institutionType,
          officialEmail: formData.officialEmail,
          officialPhone: formData.officialPhone,
          website: formData.website,
          recognitionId: formData.recognitionId,
          address: formData.address,
          state: formData.state,
          district: formData.district,
          city: formData.district,
          repFullName: formData.repFullName,
          repDesignation: formData.repDesignation,
          repEmail: formData.repEmail || formData.officialEmail,
          repPhone: formData.repPhone,
          applyAsAssessor: formData.applyAsAssessor,
          assessorQualification: formData.assessorQualification,
          assessorSpecialization: formData.assessorSpecialization,
          assessorExperience: formData.assessorExperience
        });
      } else if (role === 'INDUSTRY') {
        Object.assign(payload, {
          companyName: formData.companyName,
          industrySector: formData.industrySector,
          website: formData.companyWebsite,
          officialEmail: formData.companyOfficialEmail,
          officialPhone: formData.companyPhone,
          address: formData.officeAddress,
          state: formData.state,
          district: formData.district,
          city: formData.district,
          repFullName: formData.indRepName,
          repDesignation: formData.indRepDesignation,
          repEmail: formData.indRepEmail || formData.companyOfficialEmail,
          repPhone: formData.indRepPhone
        });
      }

      const res = await register(payload);

      if (res.success) {
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => {
          if (role === 'LEARNER') setActivePage('learner');
          else if (role === 'INSTITUTION') setActivePage('institution');
          else if (role === 'INDUSTRY') setActivePage('industry');
        }, 1200);
      } else {
        setError(res.message || 'Registration failed. Please check your information.');
      }
    } catch (err) {
      setError('Network or server error during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sw-page-container">
      <div className="sw-auth-card">
        <div className="sw-auth-header">
          <div className="sw-brand-icon" style={{ margin: '0 auto 12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#1a73e8' }}>person_add</span>
          </div>
          <h2 className="sw-auth-title">{t('createAccountTitle')}</h2>
          <p className="sw-auth-subtitle">Select your role to configure your dedicated verification portal.</p>
        </div>

        {/* Role Selection Tabs */}
        <div className="sw-role-selector">
          <button
            type="button"
            className={`sw-role-tab ${role === 'LEARNER' ? 'active' : ''}`}
            onClick={() => { setRole('LEARNER'); setError(''); }}
          >
            <span className="material-symbols-outlined">school</span>
            <span>{t('roleLearner')}</span>
          </button>
          <button
            type="button"
            className={`sw-role-tab ${role === 'INSTITUTION' ? 'active' : ''}`}
            onClick={() => { setRole('INSTITUTION'); setError(''); }}
          >
            <span className="material-symbols-outlined">account_balance</span>
            <span>{t('roleInstitution')}</span>
          </button>
          <button
            type="button"
            className={`sw-role-tab ${role === 'INDUSTRY' ? 'active' : ''}`}
            onClick={() => { setRole('INDUSTRY'); setError(''); }}
          >
            <span className="material-symbols-outlined">domain</span>
            <span>{t('roleIndustry')}</span>
          </button>
        </div>

        {error && <div className="sw-alert sw-alert-error">{error}</div>}
        {success && <div className="sw-alert sw-alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="sw-form">
          {/* ================= LEARNER FIELDS ================= */}
          {role === 'LEARNER' && (
            <>
              <div className="sw-form-section">
                <h4 className="sw-section-heading">Personal Information</h4>
                <div className="sw-form-grid">
                  <div className="sw-form-group">
                    <label>{t('fullName')} *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. Arun Kumar"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>{t('email')} *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="arun@university.edu"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>{t('phone')} *</label>
                    <input
                      type="tel"
                      name="mobile"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.mobile}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="sw-form-section">
                <h4 className="sw-section-heading">Academic Information</h4>
                <div className="sw-form-grid">
                  <div className="sw-form-group sw-span-2">
                    <label>{t('college')} *</label>
                    <input
                      type="text"
                      name="collegeName"
                      required
                      placeholder="e.g. PSG College of Technology"
                      value={formData.collegeName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>{t('department')} *</label>
                    <input
                      type="text"
                      name="department"
                      required
                      value={formData.department}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Degree / Course *</label>
                    <input
                      type="text"
                      name="degree"
                      required
                      placeholder="B.Tech / B.E. / M.Sc"
                      value={formData.degree}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Current Year *</label>
                    <select name="currentYear" value={formData.currentYear} onChange={handleChange}>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="Final Year">Final Year</option>
                      <option value="Recent Graduate">Recent Graduate</option>
                    </select>
                  </div>
                  <div className="sw-form-group">
                    <label>Student / Register ID *</label>
                    <input
                      type="text"
                      name="studentId"
                      required
                      placeholder="e.g. 22CS104"
                      value={formData.studentId}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Graduation Year</label>
                    <input
                      type="text"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="sw-form-section">
                <h4 className="sw-section-heading">Location & Prior Learning Skill</h4>
                <div className="sw-form-grid">
                  <div className="sw-form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>District / City *</label>
                    <input
                      type="text"
                      name="district"
                      required
                      value={formData.district}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>{t('primarySkill')} *</label>
                    <select name="primarySkill" value={formData.primarySkill} onChange={handleChange}>
                      <option value="Python Software Engineering">Python Software Engineering</option>
                      <option value="Full Stack Web Development">Full Stack Web Development</option>
                      <option value="Cloud Infrastructure & DevOps">Cloud Infrastructure & DevOps</option>
                    </select>
                  </div>
                  <div className="sw-form-group">
                    <label>{t('skillLevel')} *</label>
                    <select name="skillLevel" value={formData.skillLevel} onChange={handleChange}>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= INSTITUTION FIELDS ================= */}
          {role === 'INSTITUTION' && (
            <>
              <div className="sw-notice-box">
                <span className="material-symbols-outlined" style={{ color: '#d93025' }}>info</span>
                <span>All institutional registrations start in <strong>PENDING_VERIFICATION</strong> status until official academic accreditation is approved.</span>
              </div>

              <div className="sw-form-section">
                <h4 className="sw-section-heading">Institution Details</h4>
                <div className="sw-form-grid">
                  <div className="sw-form-group sw-span-2">
                    <label>{t('institutionName')} *</label>
                    <input
                      type="text"
                      name="institutionName"
                      required
                      placeholder="e.g. National Institute of Technology"
                      value={formData.institutionName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Institution Type *</label>
                    <input
                      type="text"
                      name="institutionType"
                      required
                      placeholder="Autonomous Engineering College / University"
                      value={formData.institutionType}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Recognition / NIRF ID</label>
                    <input
                      type="text"
                      name="recognitionId"
                      placeholder="NIRF-ENG-042"
                      value={formData.recognitionId}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Official Email *</label>
                    <input
                      type="email"
                      name="officialEmail"
                      required
                      placeholder="principal@institution.edu"
                      value={formData.officialEmail}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Official Phone *</label>
                    <input
                      type="tel"
                      name="officialPhone"
                      required
                      placeholder="+91 44 2235 7000"
                      value={formData.officialPhone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group sw-span-2">
                    <label>Website URL</label>
                    <input
                      type="url"
                      name="website"
                      placeholder="https://www.institution.edu.in"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group sw-span-2">
                    <label>Campus Address *</label>
                    <input
                      type="text"
                      name="address"
                      required
                      placeholder="Main Highway, Technology Campus"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>State *</label>
                    <input type="text" name="state" required value={formData.state} onChange={handleChange} />
                  </div>
                  <div className="sw-form-group">
                    <label>District / City *</label>
                    <input type="text" name="district" required value={formData.district} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="sw-form-section">
                <h4 className="sw-section-heading">Academic Representative & Assessor</h4>
                <div className="sw-form-grid">
                  <div className="sw-form-group">
                    <label>Representative Full Name *</label>
                    <input
                      type="text"
                      name="repFullName"
                      required
                      placeholder="Dr. S. Meenakshi Sundaram"
                      value={formData.repFullName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Designation *</label>
                    <input
                      type="text"
                      name="repDesignation"
                      required
                      placeholder="Director of Accreditation & Assessment"
                      value={formData.repDesignation}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Representative Direct Email</label>
                    <input
                      type="email"
                      name="repEmail"
                      placeholder="dean.assessment@institution.edu"
                      value={formData.repEmail}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      name="repPhone"
                      placeholder="+91 94440 12345"
                      value={formData.repPhone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="sw-checkbox-row" style={{ marginTop: '12px' }}>
                  <label className="sw-checkbox-label">
                    <input
                      type="checkbox"
                      name="applyAsAssessor"
                      checked={formData.applyAsAssessor}
                      onChange={handleChange}
                    />
                    <span>Accredit representative as an <strong>Authorized Assessor</strong> (Status starts as PENDING).</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* ================= INDUSTRY FIELDS ================= */}
          {role === 'INDUSTRY' && (
            <>
              <div className="sw-form-section">
                <h4 className="sw-section-heading">Company Information</h4>
                <div className="sw-form-grid">
                  <div className="sw-form-group sw-span-2">
                    <label>{t('companyName')} *</label>
                    <input
                      type="text"
                      name="companyName"
                      required
                      placeholder="e.g. HexaCloud Technologies Global"
                      value={formData.companyName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Industry Sector *</label>
                    <input
                      type="text"
                      name="industrySector"
                      required
                      placeholder="Enterprise Software, Cloud, AI"
                      value={formData.industrySector}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Company Website</label>
                    <input
                      type="url"
                      name="companyWebsite"
                      placeholder="https://company.tech"
                      value={formData.companyWebsite}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Official Corporate Email *</label>
                    <input
                      type="email"
                      name="companyOfficialEmail"
                      required
                      placeholder="talent@hexacloud.tech"
                      value={formData.companyOfficialEmail}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Corporate Phone *</label>
                    <input
                      type="tel"
                      name="companyPhone"
                      required
                      placeholder="+91 80 4000 8800"
                      value={formData.companyPhone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group sw-span-2">
                    <label>Headquarters / Office Address *</label>
                    <input
                      type="text"
                      name="officeAddress"
                      required
                      placeholder="Business Tech Park, Outer Ring Road"
                      value={formData.officeAddress}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>State *</label>
                    <input type="text" name="state" required value={formData.state} onChange={handleChange} />
                  </div>
                  <div className="sw-form-group">
                    <label>City *</label>
                    <input type="text" name="district" required value={formData.district} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="sw-form-section">
                <h4 className="sw-section-heading">Talent Acquisition Representative</h4>
                <div className="sw-form-grid">
                  <div className="sw-form-group">
                    <label>Representative Name *</label>
                    <input
                      type="text"
                      name="indRepName"
                      required
                      placeholder="Karthik Narayanan"
                      value={formData.indRepName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Designation *</label>
                    <input
                      type="text"
                      name="indRepDesignation"
                      required
                      value={formData.indRepDesignation}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Direct Email</label>
                    <input
                      type="email"
                      name="indRepEmail"
                      placeholder="karthik.n@hexacloud.tech"
                      value={formData.indRepEmail}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Direct Phone</label>
                    <input
                      type="tel"
                      name="indRepPhone"
                      placeholder="+91 98800 11223"
                      value={formData.indRepPhone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= COMMON ACCOUNT FIELDS ================= */}
          <div className="sw-form-section">
            <h4 className="sw-section-heading">Account Security & Preferences</h4>
            <div className="sw-form-grid">
              <div className="sw-form-group">
                <label>{t('password')} *</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div className="sw-form-group">
                <label>{t('confirmPassword')} *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              <div className="sw-form-group">
                <label>Preferred Language</label>
                <select
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={(e) => {
                    handleChange(e);
                    setLang(e.target.value);
                  }}
                >
                  <option value="en">English</option>
                  <option value="ta">????? (Tamil)</option>
                  <option value="hi">?????? (Hindi)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="sw-form-actions">
            <button
              type="submit"
              className="sw-btn-primary sw-btn-lg sw-btn-block"
              disabled={loading}
            >
              {loading ? 'Creating SkillWorth Account...' : t('submit')}
            </button>
          </div>
        </form>

        <div className="sw-auth-footer">
          <span>Already have an account? </span>
          <button className="sw-btn-link" onClick={() => setActivePage('login')}>
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
}
