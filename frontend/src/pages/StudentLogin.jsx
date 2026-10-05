import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Mail,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Key,
  User,
  GraduationCap,
  Calendar,
  Target,
  X,
  Building2,
  Eye,
  EyeOff,
  MapPin,
  Check,
  Copy,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import OtpVerificationModal from '../components/auth/OtpVerificationModal';
import { authService } from '../services/authService';
import { saveRelationalStudent } from '../services/nexusDataStore';
import SihDemoLoginSection, { SihDemoLoginBanner } from '../components/auth/SihDemoAccessBar';
import LoginRoleTabs from '../components/auth/LoginRoleTabs';

export default function StudentLogin({ onLoginSuccess, onBackToRoles, onNavigateToOtp, onNavigateToForgot, prefillCredentials, onSelectRole, onShowToast }) {
  // Login form state - clean database credentials only, no hardcoded defaults
  const [email, setEmail] = useState(() => prefillCredentials?.email || '');
  const [password, setPassword] = useState(() => prefillCredentials?.password || '');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (prefillCredentials?.email) {
      setEmail(prefillCredentials.email);
      setPassword(prefillCredentials.password || '');
    }
  }, [prefillCredentials]);

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Password visibility state in Login & Register
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // OTP verification modal state (for standalone/forgot password)
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpModalPurpose, setOtpModalPurpose] = useState('REGISTRATION');
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [activeDemoOtp, setActiveDemoOtp] = useState('');

  // Registered institutions & academic mapping
  const [registeredColleges, setRegisteredColleges] = useState([]);
  const [selectedCollegeStructure, setSelectedCollegeStructure] = useState(null);

  useEffect(() => {
    let isMounted = true;
    authService.getRegisteredInstitutions(regData.state || 'Tamil Nadu').then(insts => {
      if (isMounted && Array.isArray(insts)) {
        setRegisteredColleges(insts);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // ── Student 4-Step Registration State ──────────────────────────────────────
  const [regStep, setRegStep] = useState(1);
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dob: '',
    age: 20,
    gender: 'Male',
    regNo: '',
    city: '',
    state: 'Tamil Nadu',
    collegeId: '',
    institution: '',
    university: '',
    departmentId: '',
    department: '',
    classId: '',
    className: '',
    yearSemester: 'III Year / V Sem',
    degree: 'B.Tech',
    specialization: '',
    batch: '2023–2027',
    semester: 'Semester 5'
  });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Dynamic department and class options loaded from DB
  const [dynamicDepartments, setDynamicDepartments] = useState([]);
  const [dynamicClasses, setDynamicClasses] = useState([]);

  // Step 3 OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [regDemoOtp, setRegDemoOtp] = useState('');
  const [regOtpCopied, setRegOtpCopied] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Auto-fill demo OTP in Student registration step 3
  const handleAutoFillRegDemoOtp = () => {
    if (!regDemoOtp) return;
    const chars = String(regDemoOtp).replace(/[^0-9]/g, '').slice(0, 6).split('');
    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = chars[i] || '';
    }
    setOtpDigits(newDigits);
    setRegOtpCopied(true);
    setTimeout(() => setRegOtpCopied(false), 2000);
    otpBoxRefs[5]?.current?.focus();
  };

  // Auto-fetch demo OTP if missing on step 3 mount
  useEffect(() => {
    if (regStep === 3 && regData.email && !regDemoOtp) {
      authService.resendOtp(regData.email.trim().toLowerCase(), 'REGISTRATION')
        .then(res => {
          if (res?.success && res.demoOtp) {
            setRegDemoOtp(res.demoOtp);
          }
        })
        .catch(() => {});
    }
  }, [regStep, regData.email, regDemoOtp]);

  // Step 4 Created summary & verified session
  const [createdStudentSummary, setCreatedStudentSummary] = useState(null);
  const [verifiedUserSession, setVerifiedUserSession] = useState(null);

  // OTP box input refs
  const otpBox0 = useRef(null);
  const otpBox1 = useRef(null);
  const otpBox2 = useRef(null);
  const otpBox3 = useRef(null);
  const otpBox4 = useRef(null);
  const otpBox5 = useRef(null);
  const otpBoxRefs = [otpBox0, otpBox1, otpBox2, otpBox3, otpBox4, otpBox5];

  // OTP Countdown timer
  useEffect(() => {
    let timer = null;
    if (showRegisterModal && regStep === 3 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showRegisterModal, regStep, resendCooldown]);

  const handleOpenRegisterModal = () => {
    setRegStep(1);
    setRegError('');
    setOtpError('');
    setOtpDigits(['', '', '', '', '', '']);
    setCreatedStudentSummary(null);
    setVerifiedUserSession(null);
    setShowRegisterModal(true);
  };

  const handleStateChange = async (newState) => {
    setRegData(prev => ({
      ...prev,
      state: newState,
      collegeId: '',
      institution: '',
      university: '',
      departmentId: '',
      department: '',
      classId: '',
      className: ''
    }));
    try {
      const insts = await authService.getRegisteredInstitutions(newState);
      setRegisteredColleges(insts || []);
    } catch (err) {
      console.warn('Error fetching institutions for state:', err);
      setRegisteredColleges([]);
    }
  };

  const handleCollegeSelect = async (cId) => {
    const match = registeredColleges.find(c => (c.collegeId || c.id || c.code) === cId);
    if (match) {
      const struct = match.academicStructure || [];
      setSelectedCollegeStructure(struct);

      setRegData(prev => ({
        ...prev,
        collegeId: match.collegeId || match.id || match.code,
        institution: match.collegeName || match.name,
        university: match.university || 'Anna University',
        city: prev.city || match.district || '',
        state: prev.state || match.state || 'Tamil Nadu',
        departmentId: '',
        department: '',
        classId: '',
        className: ''
      }));

      // Dynamically fetch departments for this institution from database
      try {
        const dRes = await fetch(`/api/auth/institutions/${encodeURIComponent(cId)}/departments`);
        const dData = await dRes.json();
        if (dData.success && Array.isArray(dData.data) && dData.data.length > 0) {
          setDynamicDepartments(dData.data);
          const firstDept = dData.data[0];
          setRegData(prev => ({
            ...prev,
            departmentId: firstDept.id,
            department: firstDept.name
          }));
          // Fetch classes for this first department
          loadClassesForDepartment(firstDept.id);
          return;
        }
      } catch (e) {
        console.warn('Dynamic departments fetch note:', e.message);
      }

      // Fallback to static structure if dynamic endpoint returns empty
      const firstDept = struct[0]?.department || match.departments?.[0] || 'Computer Science and Engineering';
      const deptConfig = struct.find(d => d.department === firstDept);
      setRegData(prev => ({
        ...prev,
        department: firstDept,
        degree: deptConfig?.degrees?.[0] || 'B.Tech',
        specialization: deptConfig?.specializations?.[0] || 'General'
      }));
    } else {
      setSelectedCollegeStructure(null);
      setDynamicDepartments([]);
      setDynamicClasses([]);
      setRegData(prev => ({
        ...prev,
        collegeId: '',
        institution: '',
        university: '',
        departmentId: '',
        department: '',
        classId: '',
        className: '',
        degree: '',
        specialization: ''
      }));
    }
  };

  const loadClassesForDepartment = async (deptId) => {
    try {
      const cRes = await fetch(`/api/auth/departments/${encodeURIComponent(deptId)}/classes`);
      const cData = await cRes.json();
      if (cData.success && Array.isArray(cData.data)) {
        setDynamicClasses(cData.data);
        if (cData.data.length > 0) {
          const firstClass = cData.data[0];
          setRegData(prev => ({
            ...prev,
            classId: firstClass.id,
            className: `${firstClass.name} ${firstClass.section || ''}`.trim(),
            yearSemester: firstClass.year_semester || prev.yearSemester
          }));
        } else {
          setRegData(prev => ({ ...prev, classId: '', className: '' }));
        }
      }
    } catch (err) {
      console.warn('Classes load note:', err.message);
    }
  };

  const handleDepartmentChange = (newDeptIdOrName) => {
    // Check if dynamic department matched
    const matchedDynDept = dynamicDepartments.find(d => d.id === newDeptIdOrName || d.name === newDeptIdOrName);
    if (matchedDynDept) {
      setRegData(prev => ({
        ...prev,
        departmentId: matchedDynDept.id,
        department: matchedDynDept.name,
        classId: '',
        className: ''
      }));
      loadClassesForDepartment(matchedDynDept.id);
      return;
    }

    const deptConfig = (selectedCollegeStructure || []).find(d => d.department === newDeptIdOrName);
    const newDeg = deptConfig?.degrees?.[0] || 'B.Tech';
    const newSpec = deptConfig?.specializations?.[0] || 'General';
    setRegData(prev => ({
      ...prev,
      department: newDeptIdOrName,
      degree: newDeg,
      specialization: newSpec
    }));
  };

  const handleClassChange = (selectedClassId) => {
    const matchedClass = dynamicClasses.find(c => c.id === selectedClassId);
    if (matchedClass) {
      setRegData(prev => ({
        ...prev,
        classId: matchedClass.id,
        className: `${matchedClass.name} ${matchedClass.section || ''}`.trim(),
        yearSemester: matchedClass.year_semester || prev.yearSemester,
        batch: matchedClass.batch || prev.batch
      }));
    }
  };

  const handleStep1Next = (e) => {
    if (e) e.preventDefault();
    setRegError('');

    if (!regData.fullName.trim() || regData.fullName.trim().length < 2) {
      setRegError('Please enter your full legal student name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regData.email.trim())) {
      setRegError('Please provide a valid institutional or personal email address.');
      return;
    }
    const phoneClean = regData.phone.replace(/[^0-9]/g, '');
    if (phoneClean.length < 10) {
      setRegError('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (!regData.dob) {
      setRegError('Please enter your date of birth.');
      return;
    }
    if (!regData.password || regData.password.length < 6) {
      setRegError('Password must be at least 6 characters in length.');
      return;
    }
    if (regData.password !== regData.confirmPassword) {
      setRegError('Password and Confirm Password do not match.');
      return;
    }

    setRegStep(2);
  };

  const handleStep2Submit = async (e) => {
    if (e) e.preventDefault();
    setRegError('');

    if (!regData.regNo.trim()) {
      setRegError('Register Number is strictly required by the sovereign university ledger.');
      return;
    }
    if (!regData.collegeId || !regData.institution) {
      setRegError('Please select your registered institution from the Tamil Nadu directory.');
      return;
    }
    if (!regData.city.trim()) {
      setRegError('Please enter your City / District location.');
      return;
    }
    if (!regData.department || !regData.degree) {
      setRegError('Please configure your academic department and degree program.');
      return;
    }

    setRegLoading(true);

    try {
      const res = await authService.register({
        name: regData.fullName.trim(),
        email: regData.email.trim().toLowerCase(),
        phone: regData.phone.trim(),
        password: regData.password,
        role: 'student',
        gender: regData.gender,
        dob: regData.dob,
        age: regData.age || 20,
        regNo: regData.regNo.trim(),
        collegeId: regData.collegeId,
        institutionId: regData.collegeId,
        collegeName: regData.institution,
        university: regData.university || 'Anna University',
        departmentId: regData.departmentId || null,
        department: regData.department,
        classId: regData.classId || null,
        className: regData.className || null,
        yearSemester: regData.yearSemester || regData.semester,
        degree: regData.degree,
        course: regData.degree,
        specialization: regData.specialization || regData.department,
        batch: regData.batch,
        semester: regData.semester,
        city: regData.city.trim(),
        state: regData.state.trim(),
        location: `${regData.city.trim()}, ${regData.state.trim()}`
      });

      if (!res.success) {
        setRegError(res.message || 'Registration failed. Please check your information.');
        setRegLoading(false);
        return;
      }

      if (res.demoOtp) {
        setRegDemoOtp(res.demoOtp);
      }
      setRegLoading(false);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError('');
      setResendCooldown(60);
      setRegStep(3); // Advance to Account Verification!
      setTimeout(() => {
        otpBoxRefs[0].current?.focus();
      }, 200);
    } catch (err) {
      setRegError('Network connection error during registration. Please try again.');
      setRegLoading(false);
    }
  };

  const handleOtpBoxChange = (val, index) => {
    const char = val.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    if (char && index < 5) {
      otpBoxRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpBoxRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (pasted.length) {
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const lastFilled = Math.min(pasted.length, 6) - 1;
      otpBoxRefs[Math.max(0, lastFilled)].current?.focus();
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    setOtpError('');
    const code = otpDigits.join('').trim();
    if (code.length < 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    setOtpVerifying(true);
    try {
      const res = await authService.verifyOtp(regData.email.trim().toLowerCase(), code, 'REGISTRATION');
      if (!res.success) {
        setOtpError(res.message || 'Incorrect or expired OTP code.');
        setOtpVerifying(false);
        return;
      }

      // Successful OTP Verification!
      if (res.user) {
        saveRelationalStudent(res.user);
        setVerifiedUserSession(res.user);
      }

      setCreatedStudentSummary({
        name: regData.fullName.trim(),
        email: regData.email.trim(),
        institution: regData.institution,
        university: regData.university || 'Anna University',
        department: regData.department,
        degree: regData.degree,
        specialization: regData.specialization || regData.department,
        regNo: regData.regNo.trim(),
        location: `${regData.city.trim()}, ${regData.state.trim()}`,
        batch: regData.batch,
        semester: regData.semester
      });

      setOtpVerifying(false);
      setRegStep(4); // Advance to Account Created Screen!
    } catch (err) {
      setOtpError('Failed to verify code. Please check your network connection.');
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setOtpError('');
    try {
      const res = await authService.resendOtp(regData.email.trim().toLowerCase(), 'REGISTRATION');
      if (res.success) {
        if (res.demoOtp) {
          setRegDemoOtp(res.demoOtp);
        }
        setResendCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => otpBoxRefs[0].current?.focus(), 100);
      } else {
        setOtpError(res.message || 'Could not resend OTP. Please try again.');
      }
    } catch (err) {
      setOtpError('Failed to request new OTP.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await authService.login(email, password, 'student');
      if (res.success && res.user) {
        setSuccessMsg('Signed in successfully.');
        saveRelationalStudent(res.user);
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 400);
      } else {
        setError(res.message || 'Invalid student credentials. Please check your email and password.');
      }
    } catch (err) {
      setError(err.message || 'Authentication server unreachable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await authService.forgotPassword(forgotEmail, 'student');
      if (res.success) {
        setShowForgotModal(false);
        if (onNavigateToOtp) {
          onNavigateToOtp({
            email: forgotEmail,
            role: 'student',
            purpose: 'PASSWORD_RESET',
            demoOtp: res.demoOtp || ''
          });
        } else {
          setOtpTargetEmail(forgotEmail);
          setActiveDemoOtp(res.demoOtp || '');
          setOtpModalPurpose('PASSWORD_RESET');
          setOtpModalOpen(true);
        }
      } else {
        setForgotError(res.message || 'Account not found. Please create an account first.');
      }
    } catch (err) {
      setForgotError('Could not reach auth server.');
    } finally {
      setForgotLoading(false);
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '36px 16px 64px',
      position: 'relative',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 460px) minmax(360px, 480px)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-glow)',
        background: 'var(--bg-card)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        maxWidth: '960px',
        width: '100%'
      }}>
        {/* Left Hero Panel */}
        <div style={{
          background: 'linear-gradient(180deg, #090E1F 0%, #060913 100%)',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid var(--border-subtle)'
        }}>
          <div>
            {/* Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '7px',
                background: 'var(--grad-cyan-blue)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: '14px'
              }}>⚡</div>
              <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em' }}>
                SKILLNEXUS <span style={{ color: 'var(--cyber-cyan)' }}>AI</span>
              </span>
              <span className="cyber-badge badge-cyan" style={{ fontSize: '9px', padding: '2px 7px' }}>
                STUDENT
              </span>
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1.25, marginBottom: '14px', color: 'var(--text-primary)' }}>
              Build Your Future <br />
              <span style={{ color: 'var(--cyber-cyan)' }}>With Confidence</span>
            </h1>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
              Assess your strengths. Build verified skills. Prove your abilities. Discover top career opportunities through automated AI validation.
            </p>

            {/* Step Roadmap */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { step: '1', title: 'Assess', desc: 'Pinpoint skills and competency benchmarks', color: 'var(--cyber-cyan)' },
                { step: '2', title: 'Learn & Build', desc: 'Hands-on projects and AI learning sprints', color: 'var(--cyber-purple)' },
                { step: '3', title: 'Prove & Match', desc: 'Cryptographic digital passport & job match', color: 'var(--cyber-emerald)' }
              ].map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 14px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)', border: `1px solid ${item.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 800, color: item.color
                  }}>
                    {item.step}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '11px', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)',
            paddingTop: '20px', marginTop: '30px'
          }}>
            <ShieldCheck size={14} color="var(--cyber-cyan)" />
            <span>AI Verified Credentials & Cryptographic Passport</span>
          </div>
        </div>

        {/* Right Login Panel */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Welcome Back, Student 👋
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Enter your credentials to access your Student Career Command Center.
              </p>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '12.5px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            {successMsg && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', background: 'rgba(47, 224, 161, 0.12)',
                border: '1px solid rgba(47, 224, 161, 0.3)', color: 'var(--cyber-emerald)', fontSize: '12.5px',
                marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <CheckCircle2 size={14} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Role Switcher Tabs */}
            <LoginRoleTabs activeRole="student" onSelectRole={onSelectRole} />

            {/* SIH DEMO ACCESS QUICK FILL */}
            <SihDemoLoginBanner role="student" onFill={(em, pw) => { setEmail(em); setPassword(pw); setError(''); }} />

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '11px', textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '6px'
                }}>
                  EMAIL
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                  borderRadius: '8px', padding: '9px 12px'
                }}>
                  <Mail size={15} color="var(--text-muted)" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{
                    fontSize: '11px', textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)'
                  }}>
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToForgot) {
                        onNavigateToForgot();
                      } else {
                        setForgotEmail(email);
                        setForgotSent(false);
                        setShowForgotModal(true);
                      }
                    }}
                    style={{ background: 'none', border: 'none', fontSize: '11.5px', color: 'var(--cyber-cyan)', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                  borderRadius: '8px', padding: '9px 12px'
                }}>
                  <Lock size={15} color="var(--text-muted)" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%'
                    }}
                    required
                  />
                </div>
              </div>

              {/* Remember Me & 2FA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--cyber-cyan)', cursor: 'pointer', width: '15px', height: '15px' }}
                  />
                  <span>Remember me</span>
                </label>
                <span style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  2FA: Biometric Ready
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-cyber-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  marginTop: '6px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>{loading ? 'Signing in...' : 'Sign In →'}</span>
              </button>
            </form>

            {/* Social SSO Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px 0 16px',
              width: '100%'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle, rgba(255, 255, 255, 0.08))' }}></div>
              <span style={{
                fontSize: '10.5px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}>
                OR SIGN IN WITH
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle, rgba(255, 255, 255, 0.08))' }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <GoogleAuthButton
                role="student"
                onLoginSuccess={(user) => {
                  saveRelationalStudent(user);
                  onLoginSuccess(user);
                }}
              />
            </div>
          </div>

          {/* Account & Back Links */}
          <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              New to SKILLNEXUS AI?{' '}
              <button
                type="button"
                onClick={() => {
                  setRegError('');
                  setShowRegisterModal(true);
                }}
                style={{
                  background: 'none', border: 'none', color: 'var(--cyber-cyan)',
                  cursor: 'pointer', fontWeight: 700, fontSize: '12.5px', padding: 0
                }}
              >
                Create Student Account
              </button>
            </span>

            <button
              type="button"
              onClick={onBackToRoles}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: '12px', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <ArrowLeft size={14} />
              <span>Back to login selection</span>
            </button>
          </div>
        </div>
      </div>

      {/* SIH DEMO LOGIN 4-CARD SECTION */}
      <div style={{ width: '100%', maxWidth: '1080px', marginTop: '36px' }}>
        <SihDemoLoginSection
          onSelectDemo={(roleId, creds) => {
            if (roleId === 'student') {
              setEmail(creds.email);
              setPassword(creds.password);
              setError('');
              setSuccessMsg('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (onSelectRole) {
              onSelectRole(roleId, creds);
            }
          }}
          onShowToast={onShowToast}
        />
      </div>

      {/* Student Account Registration Modal */}
      {showRegisterModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '680px', width: '100%', padding: '28px',
            borderRadius: '16px', border: '1px solid var(--cyber-cyan)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(40, 215, 255, 0.2)',
            maxHeight: '92vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {regStep === 4 ? (
                    <>
                      <Check size={22} color="#10B981" />
                      <span>Account Created Successfully!</span>
                    </>
                  ) : (
                    <span>Create Student Account</span>
                  )}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {regStep === 1 && 'Step 1 of 4: Personal Identity & Credentials'}
                  {regStep === 2 && 'Step 2 of 4: Institutional & Academic Identity'}
                  {regStep === 3 && 'Step 3 of 4: Email Verification & OTP'}
                  {regStep === 4 && 'Step 4 of 4: Account Verified & Ready to Access'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Step Navigation Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '18px' }}>
              {[
                { step: 1, label: '1. Basic Info' },
                { step: 2, label: '2. Academic' },
                { step: 3, label: '3. Verification' },
                { step: 4, label: '4. Created' }
              ].map(t => {
                const isActive = regStep === t.step;
                const isDone = regStep > t.step;
                return (
                  <button
                    type="button"
                    key={t.step}
                    disabled={t.step > regStep || regStep === 4}
                    onClick={() => {
                      if (t.step < regStep && regStep <= 2) {
                        setRegStep(t.step);
                      }
                    }}
                    style={{
                      padding: '8px 4px',
                      fontSize: '11px',
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: '6px',
                      background: isActive
                        ? 'rgba(0, 212, 255, 0.15)'
                        : isDone
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isActive
                        ? '1px solid var(--cyber-cyan)'
                        : isDone
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid var(--border-subtle)',
                      color: isActive
                        ? 'var(--cyber-cyan)'
                        : isDone
                        ? '#10B981'
                        : 'var(--text-secondary)',
                      cursor: (t.step < regStep && regStep <= 2) ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    {isDone ? <Check size={12} color="#10B981" /> : null}
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {regError && regStep <= 2 && (
              <div style={{
                padding: '9px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '12px',
                marginBottom: '14px'
              }}>
                {regError}
              </div>
            )}

            {/* STEP 1: Basic Information */}
            {regStep === 1 && (
              <form onSubmit={handleStep1Next} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>FULL NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Full Name"
                      value={regData.fullName}
                      onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>EMAIL ADDRESS *</label>
                    <input
                      type="email"
                      required
                      placeholder="student@institution.edu"
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>MOBILE NUMBER *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={regData.phone}
                      onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>DATE OF BIRTH</label>
                    <input
                      type="date"
                      value={regData.dob}
                      onChange={(e) => setRegData({ ...regData, dob: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>GENDER</label>
                    <select
                      value={regData.gender}
                      onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px', appearance: 'auto' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>PASSWORD * (MIN 6 CHARS)</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                        style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 36px 8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>CONFIRM PASSWORD *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={regData.confirmPassword}
                        onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                        style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 36px 8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {showRegConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="btn-cyber-outline"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-cyber-primary"
                    style={{ flex: 2, padding: '10px', fontWeight: 600 }}
                  >
                    Next: Academic Info →
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Academic Information (Strict Registered Institution Mapping + Register Number + Location) */}
            {regStep === 2 && (
              <form onSubmit={handleStep2Submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      REGISTER NUMBER / ROLL NUMBER * (MANDATORY & INSTITUTION-UNIQUE)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 717821E101 or RA2211003010489"
                      value={regData.regNo}
                      onChange={(e) => setRegData({ ...regData, regNo: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                    <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      * Unique per institution. Prevents duplicate registrations within the same campus.
                    </p>
                  </div>
                </div>

                {/* Location: City and State */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <MapPin size={11} color="var(--cyber-cyan)" />
                      <span>CITY / DISTRICT *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chennai, Coimbatore, Madurai"
                      value={regData.city}
                      onChange={(e) => setRegData({ ...regData, city: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>STATE *</label>
                    <select
                      required
                      value={regData.state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px', appearance: 'auto' }}
                    >
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    REGISTERED INSTITUTION / COLLEGE *
                  </label>
                  <select
                    required
                    value={regData.collegeId}
                    onChange={(e) => handleCollegeSelect(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px', appearance: 'auto' }}
                  >
                    <option value="">
                      {registeredColleges.length > 0
                        ? `-- Choose Registered Institution (${registeredColleges.length} verified in ${regData.state || 'State'}) --`
                        : `-- No Registered Institutions found in ${regData.state || 'State'} --`}
                    </option>
                    {registeredColleges.map((c, idx) => (
                      <option key={idx} value={c.collegeId || c.id || c.code}>
                        {c.collegeName || c.name} ({c.collegeCode || c.code || c.district || 'Verified'})
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    ✓ Verified institutional database. Automatically populates official university and degree curricula.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>UNIVERSITY / AFFILIATION</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Anna University"
                    value={regData.university || 'Anna University'}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '13px' }}
                  />
                </div>
                {/* AGE & REGISTER NUMBER */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>AGE *</span>
                    </label>
                    <input
                      type="number"
                      min="16"
                      max="60"
                      required
                      placeholder="e.g. 20"
                      value={regData.age || ''}
                      onChange={(e) => setRegData({ ...regData, age: parseInt(e.target.value, 10) || '' })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>YEAR / SEMESTER *</span>
                    </label>
                    <select
                      required
                      value={regData.yearSemester}
                      onChange={(e) => setRegData({ ...regData, yearSemester: e.target.value })}
                      style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    >
                      <option value="I Year / I Sem">I Year / I Sem</option>
                      <option value="I Year / II Sem">I Year / II Sem</option>
                      <option value="II Year / III Sem">II Year / III Sem</option>
                      <option value="II Year / IV Sem">II Year / IV Sem</option>
                      <option value="III Year / V Sem">III Year / V Sem</option>
                      <option value="III Year / VI Sem">III Year / VI Sem</option>
                      <option value="IV Year / VII Sem">IV Year / VII Sem</option>
                      <option value="IV Year / VIII Sem">IV Year / VIII Sem</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>DEPARTMENT (DYNAMIC) *</span>
                    </label>
                    {dynamicDepartments.length > 0 ? (
                      <select
                        required
                        value={regData.departmentId || regData.department}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                      >
                        {dynamicDepartments.map((dept, i) => (
                          <option key={i} value={dept.id}>{dept.name} ({dept.code || 'Dept'})</option>
                        ))}
                      </select>
                    ) : selectedCollegeStructure && selectedCollegeStructure.length > 0 ? (
                      <select
                        required
                        value={regData.department}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                      >
                        {selectedCollegeStructure.map((dept, i) => (
                          <option key={i} value={dept.department}>{dept.department}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="Select institution first..."
                        value={regData.department}
                        onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                        style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>CLASS / SECTION (DYNAMIC) *</span>
                    </label>
                    {dynamicClasses.length > 0 ? (
                      <select
                        required
                        value={regData.classId}
                        onChange={(e) => handleClassChange(e.target.value)}
                        style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                      >
                        {dynamicClasses.map((cls, i) => (
                          <option key={i} value={cls.id}>
                            {cls.name} {cls.section || ''} {cls.year_semester ? `(${cls.year_semester})` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. III CSE A"
                        value={regData.className}
                        onChange={(e) => setRegData({ ...regData, className: e.target.value })}
                        style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>BATCH / PASSING YEAR *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2024-2028 or 2027"
                      value={regData.batch}
                      onChange={(e) => setRegData({ ...regData, batch: e.target.value })}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>CURRENT SEMESTER *</label>
                    <select
                      value={regData.semester}
                      onChange={(e) => setRegData({ ...regData, semester: e.target.value })}
                      style={{ width: '100%', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                    >
                      <option value="Sem 1">Semester 1</option>
                      <option value="Sem 2">Semester 2</option>
                      <option value="Sem 3">Semester 3</option>
                      <option value="Sem 4">Semester 4</option>
                      <option value="Sem 5">Semester 5</option>
                      <option value="Sem 6">Semester 6</option>
                      <option value="Sem 7">Semester 7</option>
                      <option value="Sem 8">Semester 8</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="btn-cyber-outline"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="btn-cyber-primary"
                    style={{ flex: 2, padding: '10px', fontWeight: 600 }}
                  >
                    {regLoading ? 'Initiating Verification...' : 'Continue to Verification →'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Account Verification (OTP Input) */}
            {regStep === 3 && (
              <form onSubmit={handleVerifyOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '10px 0' }}>
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{
                    width: '54px', height: '54px', borderRadius: '50%',
                    background: 'rgba(0, 212, 255, 0.12)', border: '1px solid var(--cyber-cyan)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px', boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
                  }}>
                    <ShieldCheck size={28} color="var(--cyber-cyan)" />
                  </div>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Verify Your Email Address
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
                    We sent a 6-digit verification code to <strong style={{ color: 'var(--cyber-cyan)' }}>{regData.email}</strong>. Enter the code below to activate your student account.
                  </p>
                </div>

                {/* DEMO OTP FOR CREATING ACCOUNT BANNER */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)',
                  border: '1px solid rgba(0, 212, 255, 0.45)',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 0 20px rgba(0, 212, 255, 0.15)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={15} color="var(--cyber-cyan)" />
                      <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>
                        DEMO OTP FOR CREATING ACCOUNT
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoFillRegDemoOtp}
                      style={{
                        background: regOtpCopied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 212, 255, 0.15)',
                        border: `1px solid ${regOtpCopied ? 'var(--cyber-emerald)' : 'var(--cyber-cyan)'}`,
                        color: regOtpCopied ? 'var(--cyber-emerald)' : 'var(--cyber-cyan)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {regOtpCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{regOtpCopied ? 'Auto-filled!' : 'Auto-fill OTP'}</span>
                    </button>
                  </div>

                  <div
                    onClick={handleAutoFillRegDemoOtp}
                    title="Click to auto-fill OTP"
                    style={{
                      fontSize: '24px',
                      fontWeight: 900,
                      letterSpacing: '8px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--cyber-cyan)',
                      cursor: 'pointer',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(0, 212, 255, 0.25)',
                      textShadow: '0 0 12px rgba(0, 212, 255, 0.5)',
                      userSelect: 'none'
                    }}
                  >
                    [ {regDemoOtp ? regDemoOtp.split('').join(' ') : '• • • • • •'} ]
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Active registration code. Click code or button to auto-fill.</span>
                    <span style={{ color: 'var(--cyber-emerald)', fontWeight: 600 }}>Expires in 10m</span>
                  </div>
                </div>

                {otpError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '12.5px',
                    textAlign: 'center'
                  }}>
                    {otpError}
                  </div>
                )}

                {/* 6-Digit OTP Boxes */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '8px 0' }}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpBoxRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpBoxChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      onPaste={handleOtpPaste}
                      style={{
                        width: '46px',
                        height: '52px',
                        fontSize: '22px',
                        fontWeight: 700,
                        textAlign: 'center',
                        borderRadius: '10px',
                        background: 'var(--bg-input)',
                        border: digit ? '2px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        boxShadow: digit ? '0 0 10px rgba(0, 212, 255, 0.3)' : 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s'
                      }}
                    />
                  ))}
                </div>

                {/* Resend Cooldown / Button */}
                <div style={{ textAlign: 'center', fontSize: '12px' }}>
                  {resendCooldown > 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>
                      Resend code in <strong style={{ color: 'var(--cyber-cyan)' }}>{resendCooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isResending}
                      onClick={handleResendOtp}
                      style={{
                        background: 'none', border: 'none', color: 'var(--cyber-cyan)',
                        cursor: 'pointer', fontWeight: 600, fontSize: '12.5px',
                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <RotateCcw size={13} />
                      <span>{isResending ? 'Sending...' : 'Resend Verification Code'}</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRegStep(2)}
                    className="btn-cyber-outline"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    ← Edit Details
                  </button>
                  <button
                    type="submit"
                    disabled={otpVerifying || otpDigits.join('').length < 6}
                    className="btn-cyber-primary"
                    style={{ flex: 2, padding: '10px', fontWeight: 600 }}
                  >
                    {otpVerifying ? 'Verifying Code...' : 'Verify & Activate Account ✓'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Account Created Successfully Screen */}
            {regStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10B981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px', boxShadow: '0 0 25px rgba(16, 185, 129, 0.35)'
                  }}>
                    <Check size={32} color="#10B981" />
                  </div>
                  <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Welcome to SkillNexus AI!
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Your institutional student profile has been verified and registered.
                  </p>
                </div>

                {/* Summary Card */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>STUDENT NAME</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{createdStudentSummary?.name || regData.fullName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>REGISTER NUMBER</span>
                    <strong style={{ fontSize: '13px', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>{createdStudentSummary?.regNo || regData.regNo}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>INSTITUTION</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{createdStudentSummary?.institution || regData.institution}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>AFFILIATION</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{createdStudentSummary?.university || regData.university}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>DEPARTMENT & DEGREE</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                      {createdStudentSummary?.department || regData.department} • {createdStudentSummary?.degree || regData.degree}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>SPECIALIZATION</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{createdStudentSummary?.specialization || regData.specialization}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>LOCATION</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{createdStudentSummary?.location || `${regData.city}, ${regData.state}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>BATCH & SEMESTER</span>
                    <span style={{ fontSize: '12px', color: 'var(--cyber-emerald)', fontWeight: 600 }}>
                      {createdStudentSummary?.batch || regData.batch} ({createdStudentSummary?.semester || regData.semester})
                    </span>
                  </div>
                </div>

                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(0, 212, 255, 0.05)',
                  border: '1px dashed rgba(0, 212, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Sparkles size={18} color="var(--cyber-cyan)" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0 }}>
                    Skills, certifications, and career target roles can now be customized directly inside your <strong style={{ color: 'var(--text-primary)' }}>Student Profile</strong> at any time.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    if (verifiedUserSession && onLoginSuccess) {
                      onLoginSuccess(verifiedUserSession);
                    } else if (onLoginSuccess) {
                      onLoginSuccess({
                        email: regData.email.trim().toLowerCase(),
                        name: regData.fullName.trim(),
                        role: 'student',
                        collegeId: regData.collegeId,
                        collegeName: regData.institution,
                        university: regData.university,
                        regNo: regData.regNo.trim(),
                        department: regData.department,
                        degree: regData.degree,
                        specialization: regData.specialization,
                        batch: regData.batch,
                        semester: regData.semester,
                        location: `${regData.city}, ${regData.state}`
                      });
                    }
                  }}
                  className="btn-cyber-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700, marginTop: '6px' }}
                >
                  Go to Student Dashboard →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '440px', width: '100%', padding: '28px',
            borderRadius: '16px', border: '1px solid var(--cyber-cyan)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Student Account Recovery</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {forgotSent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircle2 size={40} color="var(--cyber-emerald)" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Reset Link Dispatched
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Instructions have been sent to <strong style={{ color: 'var(--cyber-cyan)' }}>{forgotEmail}</strong>.
                </p>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="btn-cyber-primary"
                  style={{ width: '100%', padding: '10px' }}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Enter your registered student email address. We will generate a secure Demo OTP for password reset.
                </p>

                {forgotError && (
                  <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#FCA5A5', fontSize: '12px' }}>
                    {forgotError}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    STUDENT EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="student@university.edu"
                    style={{
                      width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                      borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn-cyber-outline"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn-cyber-primary"
                    style={{ flex: 2, padding: '10px' }}
                  >
                    {forgotLoading ? 'Processing...' : 'Send Demo Reset OTP'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Demo OTP Verification & Password Reset Modal */}
      <OtpVerificationModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        email={otpTargetEmail}
        role="student"
        initialOtp={activeDemoOtp}
        purpose={otpModalPurpose}
        onSuccess={(verifiedEmail) => {
          setEmail(verifiedEmail);
          setPassword('');
          setSuccessMsg(
            otpModalPurpose === 'REGISTRATION'
              ? 'Account verified successfully! Please enter your password to sign in.'
              : 'Password reset successfully! Please sign in with your new password.'
          );
        }}
      />
    </div>
  );
}
