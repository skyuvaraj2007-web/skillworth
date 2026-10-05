import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  Award,
  Building,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2
} from 'lucide-react';
import { certificateService } from '../../services/certificateService';

const ALLOWED_EXTS = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'doc', 'docx', 'pptx', 'ppt'];
const DANGEROUS_EXTS = ['exe', 'bat', 'cmd', 'sh', 'php', 'js', 'vbs', 'msi', 'dll', 'com'];

const PRESET_CATEGORIES = [
  'Technical',
  'Web Development',
  'Cloud & DevOps',
  'Data & AI',
  'Programming',
  'Database',
  'Cybersecurity',
  'Soft Skills',
  'Core Engineering',
  'Internship',
  'Competition & Hackathon'
];

export default function CertificateUploadModal({ isOpen, onClose, onSuccess, onShowToast }) {
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [programName, setProgramName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [sendToCollege, setSendToCollege] = useState(true);

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [suggestedSkills, setSuggestedSkills] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const ext = selected.name.split('.').pop().toLowerCase();
    if (DANGEROUS_EXTS.includes(ext)) {
      setFile(null);
      setFileError(`Executable / script files (.${ext}) are strictly blocked for security.`);
      return;
    }

    if (!ALLOWED_EXTS.includes(ext)) {
      setFile(null);
      setFileError(`Unsupported format .${ext}. Allowed formats: PDF, PNG, JPG, JPEG, WEBP, DOC, DOCX, PPT, PPTX.`);
      return;
    }

    if (selected.size > 25 * 1024 * 1024) {
      setFile(null);
      setFileError('File size exceeds the 25MB safety threshold.');
      return;
    }

    setFileError(null);
    setFile(selected);

    // Auto-fill title if empty
    if (!title.trim()) {
      const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleAddSkill = (skillToAdd) => {
    const s = (skillToAdd || skillInput).trim();
    if (s && !skills.some(existing => existing.toLowerCase() === s.toLowerCase())) {
      setSkills(prev => [...prev, s]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleAiSuggestSkills = async () => {
    if (!title.trim() && !description.trim()) {
      if (onShowToast) onShowToast({ title: 'Input Required', message: 'Please enter a certificate title or description to analyze.', type: 'warning' });
      return;
    }

    setIsSuggesting(true);
    try {
      const res = await certificateService.suggestSkillsForCertificate({
        title,
        description,
        category
      });
      if (res.success && Array.isArray(res.data)) {
        const newSuggestions = res.data.filter(s => !skills.some(e => e.toLowerCase() === s.toLowerCase()));
        setSuggestedSkills(newSuggestions);
        if (newSuggestions.length === 0 && onShowToast) {
          onShowToast({ title: 'NEXUS AI', message: 'All relevant taxonomy skills are already attached.', type: 'info' });
        }
      }
    } catch (err) {
      console.error('Skill suggestion failed:', err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      if (onShowToast) onShowToast({ title: 'Validation Error', message: 'Certificate title is required.', type: 'error' });
      return;
    }
    if (!file) {
      setFileError('Please select a certificate document or badge file.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('title', title.trim());
      formData.append('issuer', issuer.trim());
      formData.append('certificateNumber', certificateNumber.trim());
      formData.append('issueDate', issueDate);
      formData.append('expiryDate', expiryDate);
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('credentialUrl', credentialUrl.trim());
      formData.append('courseName', programName.trim());
      formData.append('projectName', projectName.trim());
      formData.append('sendToCollege', sendToCollege ? 'true' : 'false');
      formData.append('relatedSkills', JSON.stringify(skills));

      const res = await certificateService.uploadCertificate(formData);

      if (res && res.success) {
        if (onShowToast) {
          onShowToast({
            title: 'Certificate Submitted',
            message: sendToCollege
              ? 'Certificate submitted to your college for academic verification.'
              : 'Certificate saved to your personal registry.',
            type: 'success'
          });
        }
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        if (onShowToast) {
          onShowToast({
            title: 'Submission Failed',
            message: res?.message || 'Failed to upload certificate.',
            type: 'error'
          });
        }
      }
    } catch (err) {
      console.error('Certificate submission error:', err);
      if (onShowToast) onShowToast({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 15, 29, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        color: 'var(--text-primary, #1e293b)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-secondary, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(99, 102, 241, 0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cyber-cyan, #0284c7)'
            }}>
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                Submit Certificate Evidence
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-secondary, #64748b)' }}>
                Upload external credentials to be reviewed by your college and linked to verified skill intelligence.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-secondary, #64748b)',
              cursor: 'pointer', padding: '6px', borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* File Upload Zone */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '6px' }}>
              Certificate File <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{
              border: '2px dashed var(--border-subtle, #cbd5e1)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              background: 'var(--bg-secondary, #f8fafc)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'border-color 0.2s'
            }}>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.ppt,.pptx"
                onChange={handleFileChange}
                style={{
                  position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%'
                }}
              />
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <CheckCircle2 size={22} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary, #0f172a)' }}>{file.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB • Click to replace</div>
                  </div>
                </div>
              ) : (
                <div>
                  <UploadCloud size={32} style={{ color: 'var(--cyber-cyan, #0284c7)', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                    Drop document here or click to browse
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '4px' }}>
                    Supported: PDF, PPT, PPTX, DOC, DOCX, PNG, JPG, JPEG, WEBP (Max 25MB)
                  </div>
                </div>
              )}
            </div>
            {fileError && (
              <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={13} /> {fileError}
              </div>
            )}
          </div>

          {/* Title & Category Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '6px' }}>
                Certificate Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. AWS Certified Cloud Practitioner"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="input-cyber"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '13.5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="input-cyber"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '13.5px' }}
              >
                {PRESET_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Issuer & Credential ID Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '6px' }}>
                Issuing Organization
              </label>
              <input
                type="text"
                placeholder="e.g. Amazon Web Services, Coursera, NPTEL"
                value={issuer}
                onChange={e => setIssuer(e.target.value)}
                className="input-cyber"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '13.5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '6px' }}>
                Certificate / License ID
              </label>
              <input
                type="text"
                placeholder="e.g. AWS-CCP-8492048"
                value={certificateNumber}
                onChange={e => setCertificateNumber(e.target.value)}
                className="input-cyber"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '13.5px' }}
              />
            </div>
          </div>

          {/* Issue Date & Expiry Date Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '6px' }}>
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="input-cyber"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '13.5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '6px' }}>
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="input-cyber"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '13.5px' }}
              />
            </div>
          </div>

          {/* Online Credential URL */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '6px' }}>
              Verifiable Credential / Badge URL (Optional)
            </label>
            <input
              type="url"
              placeholder="e.g. https://www.credly.com/badges/your-credential-id"
              value={credentialUrl}
              onChange={e => setCredentialUrl(e.target.value)}
              className="input-cyber"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '13.5px' }}
            />
          </div>

          {/* Related Skills & NEXUS AI Suggestions */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                Related Skill Evidence
              </label>
              <button
                type="button"
                onClick={handleAiSuggestSkills}
                disabled={isSuggesting}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--cyber-purple, #7c3aed)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={13} /> {isSuggesting ? 'Analyzing...' : 'NEXUS AI Suggest Skills'}
              </button>
            </div>

            {/* Input & Add Button */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Type a skill (e.g. Python, Cloud Computing, React) and press Enter"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                className="input-cyber"
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="btn-cyber-outline"
                style={{ padding: '8px 16px', fontSize: '12.5px' }}
              >
                Add
              </button>
            </div>

            {/* Attached Skill Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '32px' }}>
              {skills.map((sk, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: 'var(--cyber-purple, #6366f1)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Tag size={11} /> {sk}
                  <X
                    size={13}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRemoveSkill(sk)}
                  />
                </span>
              ))}
            </div>

            {/* AI Suggested Skill Chips */}
            {suggestedSkills.length > 0 && (
              <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.06)', border: '1px dashed rgba(124, 58, 237, 0.3)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyber-purple, #7c3aed)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={11} /> NEXUS AI SUGGESTED SKILLS (Click to attach):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {suggestedSkills.map((sk, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        handleAddSkill(sk);
                        setSuggestedSkills(prev => prev.filter(s => s !== sk));
                      }}
                      style={{
                        fontSize: '11.5px',
                        padding: '3px 8px',
                        borderRadius: '16px',
                        background: '#ffffff',
                        border: '1px solid var(--cyber-purple, #a78bfa)',
                        color: 'var(--cyber-purple, #7c3aed)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      + {sk}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Direct College Verification Checkbox */}
          <div style={{
            background: 'var(--bg-secondary, #f8fafc)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <input
              type="checkbox"
              id="sendToCollege"
              checked={sendToCollege}
              onChange={e => setSendToCollege(e.target.checked)}
              style={{ marginTop: '3px', cursor: 'pointer' }}
            />
            <label htmlFor="sendToCollege" style={{ fontSize: '13px', color: 'var(--text-primary, #0f172a)', cursor: 'pointer', lineHeight: 1.4 }}>
              <strong>Send to Mapped College for Academic Verification</strong>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                Your certificate will route directly to your institution review dashboard. Once verified by your faculty, it elevates your verified skill intelligence and closes AI skill gaps.
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-cyber-outline"
              disabled={isSubmitting}
              style={{ padding: '10px 20px', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-cyber-primary"
              style={{ padding: '10px 22px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Uploading Credential...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>{sendToCollege ? 'Submit for College Verification' : 'Save Certificate'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
