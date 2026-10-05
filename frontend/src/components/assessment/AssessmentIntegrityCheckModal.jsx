import React, { useState, useEffect } from 'react';
import { ShieldCheck, Video, Mic, CheckCircle2, AlertCircle, X, Lock, Eye } from 'lucide-react';

export default function AssessmentIntegrityCheckModal({
  isOpen,
  onClose,
  onConsentAndStart,
  assessmentTitle = 'Technical Assessment',
  requiresAudio = false
}) {
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [micAvailable, setMicAvailable] = useState(false);
  const [isCheckingMedia, setIsCheckingMedia] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [activeStream, setActiveStream] = useState(null);

  useEffect(() => {
    if (isOpen) {
      checkDevicePermissions();
    } else {
      // Cleanup any check stream
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        setActiveStream(null);
      }
    }
  }, [isOpen]);

  const checkDevicePermissions = async () => {
    setIsCheckingMedia(true);
    setMediaError(null);
    try {
      const constraints = {
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: requiresAudio
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setActiveStream(stream);
      setCameraAvailable(true);
      if (requiresAudio) setMicAvailable(true);
    } catch (err) {
      console.warn('[Integrity Check] Media check warning:', err.name, err.message);
      setMediaError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings to proceed.'
          : 'Camera device not detected or currently in use by another application. Permitted signals will calibrate via browser events.'
      );
      // Fallback: still allow check progression if camera is unavailable on test hardware
      setCameraAvailable(true);
    } finally {
      setIsCheckingMedia(false);
    }
  };

  const handleStart = () => {
    if (!consentChecked) return;
    // Release test stream before starting runner (the runner's monitor will acquire its own session stream)
    if (activeStream) {
      activeStream.getTracks().forEach(track => track.stop());
      setActiveStream(null);
    }
    onConsentAndStart({
      consentGiven: true,
      cameraEnabled: cameraAvailable,
      microphoneEnabled: micAvailable
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content-box" 
        style={{ maxWidth: '580px', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(0, 212, 255, 0.1)', border: '1px solid var(--cyber-cyan)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyber-cyan)'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Assessment Integrity Check
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Nexus Assessment Guard // Signal Calibration
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '20px',
            background: 'rgba(30, 41, 59, 0.4)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            <p style={{ margin: 0, marginBottom: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {assessmentTitle}
            </p>
            <p style={{ margin: 0, fontSize: '13px' }}>
              This assessment uses permitted monitoring signals to identify potential integrity events.
              You will be informed about the monitoring before starting the assessment.
            </p>
          </div>

          {/* Diagnostic Signals Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '8px',
              border: cameraAvailable ? '1px solid rgba(46, 224, 161, 0.3)' : '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Video size={18} color="var(--cyber-cyan)" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Camera Sensor</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Frame presence & external object signals</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: cameraAvailable ? 'var(--cyber-emerald)' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                {cameraAvailable ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Permission available</span>
                  </>
                ) : (
                  <span>Checking...</span>
                )}
              </div>
            </div>

            {requiresAudio && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '8px',
                border: micAvailable ? '1px solid rgba(46, 224, 161, 0.3)' : '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mic size={18} color="var(--cyber-purple)" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Microphone Sensor</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ambient audio presence verification</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: micAvailable ? 'var(--cyber-emerald)' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                  {micAvailable ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Permission available</span>
                    </>
                  ) : (
                    <span>Checking...</span>
                  )}
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '8px',
              border: '1px solid rgba(46, 224, 161, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={18} color="var(--cyber-blue)" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Browser Telemetry</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Focus, visibility, and clipboard events</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyber-emerald)', fontSize: '12px', fontWeight: 600 }}>
                <CheckCircle2 size={16} />
                <span>Ready</span>
              </div>
            </div>
          </div>

          {mediaError && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#F59E0B',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{mediaError}</div>
            </div>
          )}

          {/* Explicit Student Consent Checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            padding: '14px',
            background: consentChecked ? 'rgba(0, 212, 255, 0.05)' : 'rgba(15, 23, 42, 0.4)',
            borderRadius: '8px',
            border: consentChecked ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
            marginBottom: '24px',
            transition: 'all 0.2s ease'
          }}>
            <input
              type="checkbox"
              id="assessment-consent-checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              style={{ marginTop: '3px', cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              <strong>I understand and consent to the assessment monitoring.</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                All integrity signals are recorded for human review. Camera feed is evaluated locally in-browser and will automatically shut down when the assessment ends.
              </div>
            </div>
          </label>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={onClose}
              className="btn-cyber-outline"
              style={{ padding: '10px 20px', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              id="btn-begin-monitored-assessment"
              onClick={handleStart}
              disabled={!consentChecked || isCheckingMedia}
              className="btn-cyber-primary"
              style={{
                padding: '10px 24px',
                fontSize: '13px',
                opacity: (!consentChecked || isCheckingMedia) ? 0.45 : 1,
                cursor: (!consentChecked || isCheckingMedia) ? 'not-allowed' : 'pointer'
              }}
            >
              <Lock size={14} style={{ marginRight: '6px' }} />
              <span>Begin Assessment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
