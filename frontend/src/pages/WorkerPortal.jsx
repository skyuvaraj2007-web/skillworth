import React, { useState, useEffect } from 'react';
import SkillWorthLogo from '../components/SkillWorthLogo';

export default function WorkerPortal({ user, onNavigate, onLogout }) {
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('online'); // 'online' | 'syncing' | 'offline'
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Form state for adding new evidence
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Work Log');
  const [newIssuer, setNewIssuer] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Active assessment data
  const [assessmentData, setAssessmentData] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 4000);
  };

  const fetchEvidenceAndAssessment = async () => {
    setLoading(true);
    try {
      // 1. Fetch certificates / evidence
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const certRes = await fetch('/api/certificates/my', { credentials: 'include', headers });
      const certData = await certRes.json();
      if (certData.success && Array.isArray(certData.data)) {
        setEvidenceList(certData.data);
      }

      // 2. Fetch candidate assessment dossier
      const asmtRes = await fetch('/api/assessments/rpl/candidate/demo-student-user-canonical');
      const asmtJson = await asmtRes.json();
      if (asmtJson.success && asmtJson.data) {
        setAssessmentData(asmtJson.data.assessment);
      }
    } catch (err) {
      console.warn('Error fetching worker evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidenceAndAssessment();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!newTitle) {
        setNewTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please specify an evidence title.');
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let fileBase64 = null;
      let fileName = selectedFile ? selectedFile.name : `${newTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`;

      if (selectedFile) {
        fileBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(selectedFile);
        });
      }

      const payload = {
        title: newTitle.trim(),
        category: newCategory,
        issuer: newIssuer.trim() || 'Workplace Site Supervisor',
        description: newDescription.trim() || 'Direct photographic and written evidence of workplace competence.',
        fileName,
        fileBase64,
        status: 'Under Review',
        sendToCollege: true
      };

      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToast('Evidence successfully uploaded and queued for assessor calibration!');
        setNewTitle('');
        setNewDescription('');
        setNewIssuer('');
        setSelectedFile(null);
        // Refresh evidence list from backend
        fetchEvidenceAndAssessment();
      } else {
        showToast(data.message || 'Failed to submit evidence.');
      }
    } catch (err) {
      showToast('Network error while submitting evidence.');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSync = () => {
    if (syncStatus === 'offline') {
      setSyncStatus('syncing');
      setTimeout(() => {
        setSyncStatus('online');
        showToast('Local offline evidence synced with national registry.');
      }, 1500);
    } else {
      setSyncStatus('offline');
      showToast('Offline mode active. All evidence stored in browser ledger.');
    }
  };

  // Official verified credential (from evidence list or default)
  const officialCert = evidenceList.find(c => c.certificateNumber === 'SKW-2025-EL-8842-PUB' || c.status === 'Verified') || {
    certificateNumber: 'SKW-2025-EL-8842-PUB',
    title: 'Certificate IV in Electrical Maintenance',
    issuer: 'National RPL Assessment Authority',
    score: '100% Competent',
    accreditation: 'ISO/IEC 17024:2012',
    ledgerState: 'Cryptographically Sealed',
    verificationHash: '0x7f9a1c84e93021bcfe8842ad91054c098af7530a230ffcf'
  };

  const candidateName = user?.name || 'Rajesh Kumar';
  const candidateTrade = 'Electrical Maintenance Specialist • 7+ Years Field Experience';
  const candidateId = user?.studentId || 'RPL-8842-IN';

  return (
    <div className="min-h-screen bg-surface flex flex-col w-full text-on-surface">
      {/* ── TOAST NOTIFICATION ── */}
      <div
        className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 pointer-events-none flex items-center gap-3 px-4 py-3 bg-[#17212b] text-[#f3f1eb] rounded-lg shadow-xl border border-[#2d3a47] ${
          toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}
      >
        <span className="material-symbols-outlined text-primary-fixed text-[20px]">check_circle</span>
        <span className="text-[13px] font-medium">{toastMessage}</span>
      </div>

      {/* ── TOP HEADER ── */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#17212b] z-40 border-b border-[#2d3a47] shadow-sm">
        <div className="h-full max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <SkillWorthLogo height={34} inverted={true} showSubtitle={true} />
            <div className="hidden md:flex items-center gap-2 text-[12px] text-[#bec9c7]">
              <span className="px-2 py-0.5 rounded bg-white/10 uppercase tracking-wider text-[#a5f0eb] font-semibold">
                National RPL Authority
              </span>
              <span>•</span>
              <span>ISO 17024 Assessment Pipeline</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-2 mr-4">
              <button
                onClick={() => onNavigate && onNavigate('worker-portal')}
                className="px-3 py-1.5 rounded text-[13px] font-semibold bg-white/10 text-white"
              >
                Worker Portal
              </button>
              <button
                onClick={() => onNavigate && onNavigate('assessor-workspace')}
                className="px-3 py-1.5 rounded text-[13px] font-medium text-[#bec9c7] hover:text-white transition-colors"
              >
                Assessor Workspace
              </button>
              <button
                onClick={() => onNavigate && onNavigate('institution-portal')}
                className="px-3 py-1.5 rounded text-[13px] font-medium text-[#bec9c7] hover:text-white transition-colors"
              >
                Institution Management
              </button>
            </nav>

            <button
              onClick={toggleSync}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-[12px] text-[#f3f1eb] transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus === 'online' ? 'bg-[#a5f0eb]' : syncStatus === 'syncing' ? 'bg-[#ffd68c] animate-pulse' : 'bg-outline'
                }`}
              ></span>
              <span className="font-mono">
                {syncStatus === 'online' && 'Registry Online'}
                {syncStatus === 'syncing' && 'Syncing...'}
                {syncStatus === 'offline' && 'Offline Cache'}
              </span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded text-[#bec9c7] hover:text-white hover:bg-white/10 transition-colors"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── WORKER MAIN CONTENT ── */}
      <main className="w-full pt-20 pb-16 flex-1">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col gap-6">
          {/* Top Worker Identity Bar & Offline Sync */}
          <div className="stitch-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgBAL3eJ_VcA0vM3L85ctin0fiMXZ9gnqJewqqeY5W8Dh-52PxXi6saOuGigSwguADXi9IOnK8nroNUNfKgn6if9MZH9JxAGM9MGV3-0EdM0r1xSlyeXJO45adsFLYpuwnYdHSAu9dTy-JxMWIMSWulcB9Bxq9UI05ocJNhqN7gUlXfqCwRIc5sbgLp_F2MPgf_2uqXA7PKs80WBENZqHx-gob0S2ihMPMHV1913YdAOHmI3MLa4uQ8g"
                  alt={candidateName}
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                  ✓
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-headline-lg text-on-surface text-[22px]">{candidateName}</h1>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-secondary text-[11px] font-mono font-semibold">
                    ID: {candidateId}
                  </span>
                </div>
                <span className="text-[14px] text-on-surface-variant font-medium">
                  {candidateTrade}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleSync}
                className="btn-neutral text-[12px] flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">sync</span>
                <span>{syncStatus === 'online' ? 'Connected to Registry' : 'Offline — Changes Saved Locally'}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="btn-neutral p-2 text-secondary hover:text-on-surface"
                title="Print / Export Dossier"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
              </button>
            </div>
          </div>

          {/* Skill Journey Tracker (4 Milestones) */}
          <div className="stitch-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDDCD4] mb-4">
              <div>
                <span className="text-[11px] uppercase font-bold text-primary tracking-wider">
                  Accreditation Workflow
                </span>
                <h3 className="font-headline-sm text-on-surface">Recognition of Prior Learning Pipeline</h3>
              </div>
              <span className="text-[12px] font-mono text-secondary">
                STAGE 4 / 4 ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="p-3 rounded bg-surface-container-low border border-[#DDDCD4]">
                <div className="flex items-center justify-between text-[12px] font-semibold text-primary mb-1">
                  <span>STEP 01</span>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                </div>
                <span className="font-headline-sm text-[14px] block text-on-surface">Experience Audit</span>
                <span className="text-[12px] text-on-surface-variant">7+ Years field experience verified</span>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded bg-surface-container-low border border-[#DDDCD4]">
                <div className="flex items-center justify-between text-[12px] font-semibold text-primary mb-1">
                  <span>STEP 02</span>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                </div>
                <span className="font-headline-sm text-[14px] block text-on-surface">Evidence Dossier</span>
                <span className="text-[12px] text-on-surface-variant">{evidenceList.length} artifacts cataloged</span>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded bg-surface-container-low border border-[#DDDCD4]">
                <div className="flex items-center justify-between text-[12px] font-semibold text-primary mb-1">
                  <span>STEP 03</span>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                </div>
                <span className="font-headline-sm text-[14px] block text-on-surface">Practical Calibration</span>
                <span className="text-[12px] text-on-surface-variant">95% Competency score awarded</span>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded bg-[#176B68]/10 border border-[#176B68]/40">
                <div className="flex items-center justify-between text-[12px] font-semibold text-primary mb-1">
                  <span>STEP 04</span>
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                </div>
                <span className="font-headline-sm text-[14px] block text-primary font-bold">Credential Issued</span>
                <span className="text-[12px] text-on-surface-variant">NSCN cryptographically sealed</span>
              </div>
            </div>
          </div>

          {/* Main 3-Column Layout: Evidence Submission | Rubric Checklist | Credential Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── LEFT COLUMN: Evidence Dossier & Upload Form (5 cols) ── */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Evidence Submission Form */}
              <div className="stitch-card p-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#DDDCD4] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">upload_file</span>
                    <h3 className="font-headline-sm text-on-surface">Submit Real Evidence</h3>
                  </div>
                  <span className="text-[11px] font-mono text-secondary">ISO 17024 ARTIFACT</span>
                </div>

                <form onSubmit={handleSubmitEvidence} className="flex flex-col gap-3">
                  <div>
                    <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                      Evidence Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="stitch-select text-[13px]"
                    >
                      <option value="Work Log">Work Log (Daily/Weekly Field Execution)</option>
                      <option value="Photo Evidence">Photo Evidence (On-Site Equipment Inspection)</option>
                      <option value="Supervisor Sign-off">Supervisor Competency Attestation Letter</option>
                      <option value="Blueprint">Engineering Blueprint / Schematic Diagram</option>
                      <option value="Audio/Video">Audio/Video Acoustic Diagnostic Recording</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                      Evidence Title
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Substation Motor Isolation Procedure"
                      className="stitch-input text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                      Issuing Facility / Workplace
                    </label>
                    <input
                      type="text"
                      value={newIssuer}
                      onChange={(e) => setNewIssuer(e.target.value)}
                      placeholder="e.g. Apex Industrial Substation #4"
                      className="stitch-input text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                      Technical Description &amp; Standards
                    </label>
                    <textarea
                      rows={2}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Document safety protocols followed, multimeter readings, or tools deployed..."
                      className="stitch-textarea text-[13px]"
                    />
                  </div>

                  {/* File Upload Drop Zone */}
                  <div>
                    <label className="text-[12px] font-semibold text-secondary uppercase block mb-1">
                      Document / Photo Attachment
                    </label>
                    <div className="border-2 border-dashed border-[#DDDCD4] rounded p-4 text-center hover:border-primary transition-colors cursor-pointer bg-surface-container-low">
                      <input
                        type="file"
                        id="evidence-file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.m4a,.mp3,.mp4,.docx"
                      />
                      <label htmlFor="evidence-file" className="cursor-pointer flex flex-col items-center gap-1">
                        <span className="material-symbols-outlined text-outline text-[24px]">cloud_upload</span>
                        <span className="text-[13px] font-semibold text-on-surface">
                          {selectedFile ? selectedFile.name : 'Click to select photo or document'}
                        </span>
                        <span className="text-[11px] text-secondary">
                          {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'PDF, PNG, JPG, Audio up to 25MB'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="btn-primary w-full mt-2"
                  >
                    {isUploading ? (
                      <span>Uploading to Registry...</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span>Submit to Evidence Dossier</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Submitted Evidence Dossier List */}
              <div className="stitch-card p-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#DDDCD4] mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">folder</span>
                    <h3 className="font-headline-sm text-on-surface">Current Dossier Artifacts</h3>
                  </div>
                  <span className="text-[12px] font-mono text-secondary font-semibold">
                    {evidenceList.length} SUBMITTED
                  </span>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-secondary text-[13px]">
                    Loading dossier artifacts...
                  </div>
                ) : evidenceList.length === 0 ? (
                  <div className="py-8 text-center text-secondary text-[13px]">
                    No evidence submitted yet. Use the form above to add your first artifact.
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-[#DDDCD4]/60">
                    {evidenceList.map((item) => (
                      <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary mt-0.5">
                            <span className="material-symbols-outlined text-[18px]">
                              {item.category?.includes('Photo') ? 'photo_camera' : item.category?.includes('Audio') ? 'mic' : item.category?.includes('Blueprint') ? 'architecture' : 'description'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-headline-sm text-[14px] text-on-surface">{item.title}</h4>
                            <div className="flex items-center gap-2 text-[12px] text-secondary mt-0.5 flex-wrap">
                              <span>{item.category || 'Vocational Evidence'}</span>
                              <span>•</span>
                              <span>{item.issueDate || '2025-11'}</span>
                              {item.issuer && (
                                <>
                                  <span>•</span>
                                  <span>{item.issuer}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className={`status-chip ${item.status === 'Verified' ? 'verified' : 'review'}`}>
                          {item.status === 'Verified' ? 'Verified' : 'Under Review'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── MIDDLE & RIGHT COLUMNS (7 cols) ── */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Practical Assessment Rubric Checklist */}
              <div className="stitch-card p-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#DDDCD4] mb-4">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-primary tracking-wider">
                      Assessment Matrix
                    </span>
                    <h3 className="font-headline-sm text-on-surface">Standardized Practical Rubric Calibration</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-secondary">
                    CALIBRATED: 95%
                  </span>
                </div>

                {/* Competency Meter */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-[12px] font-semibold mb-2">
                    <span className="text-secondary">Competency Progress Track</span>
                    <span className="text-primary font-bold">95% Overall (Competent)</span>
                  </div>
                  <div className="competency-meter">
                    <div className="segment filled"></div>
                    <div className="segment filled"></div>
                    <div className="segment filled"></div>
                    <div className="segment filled"></div>
                    <div className="segment filled"></div>
                    <div className="segment filled"></div>
                    <div className="segment filled"></div>
                    <div className="segment filled"></div>
                    <div className="segment filled"></div>
                    <div className="segment pending"></div>
                  </div>
                </div>

                {/* Rubric Criteria Items */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded bg-surface-container-low border border-[#DDDCD4] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase text-secondary font-semibold block">Criterion 1 (Weight: 40%)</span>
                      <h4 className="font-headline-sm text-[14px] text-on-surface">
                        Direct Observation: Isolation &amp; Lockout/Tagout Protocol
                      </h4>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">
                        Execution of circuit isolation, zero energy testing, and statutory tag placement.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary text-[15px]">38 / 40</span>
                      <span className="status-chip verified block mt-1">Competent</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded bg-surface-container-low border border-[#DDDCD4] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase text-secondary font-semibold block">Criterion 2 (Weight: 30%)</span>
                      <h4 className="font-headline-sm text-[14px] text-on-surface">
                        Technical Interview: Motor Diagnostics &amp; Fault Tracing
                      </h4>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">
                        Acoustic resonance diagnosis, insulation resistance reading interpretation.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary text-[15px]">28 / 30</span>
                      <span className="status-chip verified block mt-1">Competent</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded bg-surface-container-low border border-[#DDDCD4] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase text-secondary font-semibold block">Criterion 3 (Weight: 20%)</span>
                      <h4 className="font-headline-sm text-[14px] text-on-surface">
                        Evidence Portfolio: Documented Field History
                      </h4>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">
                        Review of 5 independent work logs, site photos, blueprints, and supervisor sign-offs.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary text-[15px]">19 / 20</span>
                      <span className="status-chip verified block mt-1">Competent</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded bg-surface-container-low border border-[#DDDCD4] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase text-secondary font-semibold block">Criterion 4 (Weight: 10%)</span>
                      <h4 className="font-headline-sm text-[14px] text-on-surface">
                        Workplace Safety &amp; ISO 17024 Compliance Standards
                      </h4>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">
                        Continuous adherence to statutory electrical safety rules, PPE usage, and reporting.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary text-[15px]">10 / 10</span>
                      <span className="status-chip verified block mt-1">Competent</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* National Verified Credential Card */}
              <div className="stitch-card p-6 bg-gradient-to-br from-white to-surface-container-low border-2 border-primary/20">
                <div className="flex items-start justify-between pb-4 border-b border-[#DDDCD4]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-primary text-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[26px]">workspace_premium</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-mono text-secondary uppercase font-bold tracking-wider">
                        Official National RPL Registry Record
                      </span>
                      <h3 className="font-headline-md text-on-surface text-[18px]">
                        {officialCert.title}
                      </h3>
                      <span className="text-[12px] text-primary font-mono font-semibold">
                        KEY: {officialCert.certificateNumber}
                      </span>
                    </div>
                  </div>
                  <span className="status-chip verified">
                    Cryptographically Sealed
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 my-4 text-center">
                  <div className="p-3 bg-surface-container rounded border border-[#DDDCD4]/60">
                    <span className="text-[11px] uppercase text-secondary block font-semibold">Accreditation</span>
                    <span className="text-[13px] font-bold text-on-surface">ISO/IEC 17024</span>
                  </div>
                  <div className="p-3 bg-surface-container rounded border border-[#DDDCD4]/60">
                    <span className="text-[11px] uppercase text-secondary block font-semibold">Assessment Score</span>
                    <span className="text-[13px] font-bold text-primary">100% Competent</span>
                  </div>
                  <div className="p-3 bg-surface-container rounded border border-[#DDDCD4]/60">
                    <span className="text-[11px] uppercase text-secondary block font-semibold">Ledger State</span>
                    <span className="text-[13px] font-bold text-primary">Sealed &amp; Verifiable</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-[12px] text-secondary">
                    <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
                    <span>W3C Tamper-Evident Digital Skill Credential</span>
                  </div>

                  <button
                    onClick={() => setCertificateModalOpen(true)}
                    className="btn-primary px-5 py-2.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    <span>View Official Certificate</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── OFFICIAL VERIFIED CREDENTIAL MODAL ── */}
      {certificateModalOpen && (
        <div className="stitch-modal-backdrop" onClick={() => setCertificateModalOpen(false)}>
          <div
            className="stitch-modal p-6 md:p-8 flex flex-col gap-6 max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#DDDCD4]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-primary text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[28px]">verified</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-[18px] text-on-surface">
                    National Skill Credential Network (NSCN)
                  </h3>
                  <span className="text-[12px] font-mono text-secondary">
                    REGISTRY RECORD: {officialCert.certificateNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCertificateModalOpen(false)}
                className="p-1 rounded text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Certificate Body Card */}
            <div className="p-6 rounded-lg bg-surface-container-low border border-[#DDDCD4] flex flex-col gap-4">
              <div className="text-center py-2 border-b border-[#DDDCD4]/60">
                <SkillWorthLogo height={34} showSubtitle={true} className="justify-center mb-2" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
                  Certificate of Competence &amp; Prior Learning Recognition
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <span className="text-[11px] uppercase font-semibold text-secondary block">Candidate Awardee</span>
                  <span className="font-headline-sm text-on-surface text-[17px] font-bold">{candidateName}</span>
                  <span className="text-[12px] text-secondary font-mono block">ID: {candidateId}</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-semibold text-secondary block">Assigned Qualification</span>
                  <span className="font-headline-sm text-primary text-[17px] font-bold">{officialCert.title}</span>
                  <span className="text-[12px] text-secondary block">ANZSCO / NSQF Equivalent Level 5</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center py-2 bg-surface-container rounded border border-[#DDDCD4]/60">
                <div>
                  <span className="text-[11px] uppercase text-secondary block">Framework Standard</span>
                  <span className="text-[13px] font-bold text-on-surface">ISO/IEC 17024:2012</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase text-secondary block">Calibration Score</span>
                  <span className="text-[13px] font-bold text-primary">100% Competent</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase text-secondary block">Cryptographic State</span>
                  <span className="text-[13px] font-bold text-primary">Tamper-Proof</span>
                </div>
              </div>

              <div className="p-3 bg-surface-container rounded text-[11px] font-mono text-secondary break-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">fingerprint</span>
                <span>SHA-256: {officialCert.verificationHash}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-[12px] text-secondary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
                <span>Verified via National Skill Credential Network Ledger</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="btn-neutral px-4 py-2 text-[13px]"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => setCertificateModalOpen(false)}
                  className="btn-primary px-5 py-2 text-[13px]"
                >
                  Close Registry View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
