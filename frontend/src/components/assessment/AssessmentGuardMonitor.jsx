import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, Video, VideoOff, AlertTriangle, Eye, ShieldAlert } from 'lucide-react';
import { VisionIntegrityEngine } from '../../utils/visionIntegrityEngine';

export default function AssessmentGuardMonitor({
  assessmentId,
  sessionId,
  currentQuestionId = null,
  monitoringEnabled = true,
  cameraEnabled = true,
  onIntegritySignal = null,
  onShowToast = null
}) {
  const [streamActive, setStreamActive] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [lastSignalMessage, setLastSignalMessage] = useState(null);
  const [cameraMinimized, setCameraMinimized] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const lastEventTimeRef = useRef(0);
  const visionEngineRef = useRef(new VisionIntegrityEngine());

  // Debounced event logger with real non-fabricated confidence support
  const logIntegrityEvent = useCallback(async (eventType, severity = 'MEDIUM', duration = 1, metadata = {}, confidence = null) => {
    const now = Date.now();
    // Debounce identical events within 3 seconds
    if (now - lastEventTimeRef.current < 3000 && eventType === lastSignalMessage?.type) {
      return;
    }
    lastEventTimeRef.current = now;

    setEventCount(prev => prev + 1);
    setLastSignalMessage({ type: eventType, time: new Date().toLocaleTimeString() });

    if (onShowToast) {
      const friendlyName = eventType
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
      onShowToast(`Integrity Signal: ${friendlyName} noted for review.`, 'warning');
    }

    if (onIntegritySignal) {
      onIntegritySignal({ eventType, severity, duration, questionId: currentQuestionId, metadata, confidence });
    }

    // Persist event to backend API
    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
      // Derive genuine confidence: use provided model confidence, or metadata.confidence if present
      const resolvedConfidence = typeof confidence === 'number'
        ? confidence
        : (typeof metadata?.confidence === 'number' ? metadata.confidence : 100.0);

      await fetch(`/api/assessments/${assessmentId}/monitoring/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sessionId,
          eventType,
          severity,
          durationSeconds: duration,
          confidence: resolvedConfidence,
          questionId: currentQuestionId,
          metadata: {
            ...metadata,
            label: 'Potential Integrity Event',
            reviewRequired: true,
            clientTimestamp: new Date().toISOString()
          }
        })
      });
    } catch (err) {
      console.warn('[AssessmentGuard] Event recording note:', err.message);
    }
  }, [assessmentId, sessionId, currentQuestionId, lastSignalMessage, onShowToast, onIntegritySignal]);

  // Setup Browser Telemetry Listeners (Tab switch, Blur, Fullscreen, Paste)
  useEffect(() => {
    if (!monitoringEnabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logIntegrityEvent('TAB_SWITCH', 'MEDIUM', 3, { note: 'Browser tab hidden' });
      }
    };

    const handleWindowBlur = () => {
      logIntegrityEvent('WINDOW_BLUR', 'LOW', 2, { note: 'Window focus changed' });
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logIntegrityEvent('FULLSCREEN_EXIT', 'MEDIUM', 2, { note: 'Fullscreen view exited' });
      }
    };

    const handlePaste = (e) => {
      logIntegrityEvent('PASTE_ATTEMPT', 'MEDIUM', 1, {
        note: 'Clipboard paste attempt intercepted',
        clipboardDataLength: e.clipboardData ? e.clipboardData.getData('text').length : 0
      });
    };

    const handleCopy = () => {
      logIntegrityEvent('COPY_ATTEMPT', 'LOW', 1, { note: 'Content copy shortcut triggered' });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('copy', handleCopy);
    };
  }, [monitoringEnabled, logIntegrityEvent]);

  // Camera Sensor Setup & Frame Presence Analysis
  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      if (!cameraEnabled) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 } },
          audio: false
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setStreamActive(true);

        // Vision Integrity Engine Computer-Vision Analyzer (Face, Multi-person, Phone, Entry)
        detectionIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || !canvasRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = 160;
            canvas.height = 120;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, 160, 120);
              try {
                const imgData = ctx.getImageData(0, 0, 160, 120);
                const analysis = await visionEngineRef.current.analyze(imgData);

                if (analysis && Array.isArray(analysis.signals) && analysis.signals.length > 0) {
                  for (const sig of analysis.signals) {
                    logIntegrityEvent(
                      sig.eventType,
                      sig.severity,
                      2,
                      {
                        ...sig.metadata,
                        visionDiagnostics: analysis.diagnostics
                      },
                      sig.confidence
                    );
                  }
                }
              } catch (e) {
                console.warn('[AssessmentGuard] Vision analysis frame note:', e.message);
              }
            }
          }
        }, 3000);
      } catch (err) {
        console.warn('[AssessmentGuard] Camera initialization note:', err.message);
      }
    };

    startCamera();

    // CLEANUP: Strict camera resource release
    return () => {
      isMounted = false;
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        mediaStreamRef.current = null;
      }
      setStreamActive(false);
    };
  }, [cameraEnabled, logIntegrityEvent]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Live Video Frame Feed (if camera active and not minimized) */}
      {streamActive && !cameraMinimized && (
        <div style={{
          width: '180px',
          height: '135px',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '2px solid var(--cyber-cyan)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
          background: '#0a0f1d',
          position: 'relative'
        }}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <div style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(10, 15, 29, 0.75)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '9px',
            fontWeight: 700,
            color: 'var(--cyber-emerald)'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--cyber-emerald)',
              display: 'inline-block',
              animation: 'pulse 1.5s infinite'
            }} />
            REC
          </div>

          <button
            onClick={() => setCameraMinimized(true)}
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: 'rgba(10, 15, 29, 0.8)',
              border: 'none',
              borderRadius: '3px',
              color: 'var(--text-muted)',
              fontSize: '10px',
              cursor: 'pointer',
              padding: '2px 5px'
            }}
          >
            _
          </button>
        </div>
      )}

      {/* Primary HUD Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 14px',
        borderRadius: '24px',
        background: 'rgba(15, 23, 42, 0.95)',
        border: eventCount > 0 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(46, 224, 161, 0.4)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        cursor: 'pointer'
      }}
      onClick={() => setCameraMinimized(prev => !prev)}
      title="Nexus Assessment Guard is actively calibrating signals. Click to toggle preview."
      >
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: eventCount > 0 ? '#F59E0B' : 'var(--cyber-emerald)',
          animation: 'pulse 2s infinite'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color={eventCount > 0 ? '#F59E0B' : 'var(--cyber-emerald)'} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.3px' }}>
            NEXUS GUARD ACTIVE
          </span>
        </div>

        {cameraEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', color: streamActive ? 'var(--cyber-cyan)' : 'var(--text-muted)' }}>
            {streamActive ? <Video size={12} /> : <VideoOff size={12} />}
          </div>
        )}

        {eventCount > 0 && (
          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#F59E0B'
          }}>
            {eventCount} {eventCount === 1 ? 'Signal' : 'Signals'}
          </div>
        )}
      </div>
    </div>
  );
}
