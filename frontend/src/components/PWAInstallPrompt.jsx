import React, { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Check if already running in standalone mode (installed PWA)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Check if user previously dismissed prompt in this session
    const dismissed = sessionStorage.getItem('sw_pwa_prompt_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // App installed event
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Online / Offline monitor
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('sw_pwa_prompt_dismissed', 'true');
  };

  return (
    <>
      {/* Offline Status Alert Banner */}
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            zIndex: 9999,
            backgroundColor: '#b06000',
            color: '#ffffff',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            cloud_off
          </span>
          <span>You are currently offline. Cached pages are available; reconnect for live assessments and AI features.</span>
        </div>
      )}

      {/* Subtle PWA Install Banner */}
      {!isStandalone && isInstallable && !isDismissed && (
        <div
          role="dialog"
          aria-label="Install SkillWorth Application"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9990,
            backgroundColor: '#ffffff',
            color: '#1b1c18',
            border: '1px solid #DDDCD4',
            borderLeft: '4px solid #176B68',
            borderRadius: '8px',
            padding: '12px 16px',
            maxWidth: '360px',
            boxShadow: '0 8px 24px rgba(23, 33, 43, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#e6f4f3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#176B68' }}>
              install_mobile
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#176B68', lineHeight: 1.2 }}>
              Install SkillWorth App
            </div>
            <div style={{ fontSize: '11px', color: '#5f6368', marginTop: '2px', lineHeight: 1.3 }}>
              Fast offline access to RPL portal &amp; verification
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleInstallClick}
              aria-label="Install SkillWorth app to your device"
              style={{
                backgroundColor: '#176B68',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Install
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss installation prompt"
              style={{
                background: 'none',
                border: 'none',
                color: '#80868b',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                close
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
