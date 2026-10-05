import React, { useState, useEffect, useRef } from 'react';
import { Globe, AlertCircle, Loader2, Info } from 'lucide-react';
import { authService } from '../../services/authService';
import GoogleAuthModal from './GoogleAuthModal';

export default function GoogleAuthButton({
  role = 'student',
  onLoginSuccess,
  className = 'btn-cyber-outline',
  style = {}
}) {
  const [config, setConfig] = useState({ configured: false, clientId: null });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null, // 'LINK_ACCOUNT' | 'ONBOARDING'
    data: null
  });

  const googleBtnContainerRef = useRef(null);

  // Check backend Google OAuth configuration on mount
  // 1. Fetch backend Google OAuth configuration on mount
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const cfg = await authService.getGoogleConfig();
        if (isMounted && cfg) {
          setConfig(cfg);
        }
      } catch (err) {
        console.warn('Could not check Google config:', err);
      }
    }
    loadConfig();
    return () => { isMounted = false; };
  }, []);

  // 2. Initialize Google Identity Services when config is loaded and container ref is mounted
  useEffect(() => {
    if (!config.configured || !config.clientId) return;

    let isMounted = true;

    const setupGsi = () => {
      if (!isMounted || !googleBtnContainerRef.current || !window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: config.clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        googleBtnContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'filled_black',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 320
        });
      } catch (err) {
        console.warn('Failed to render Google button:', err);
      }
    };

    if (!window.google || !window.google.accounts) {
      let script = document.getElementById('google-gsi-client');
      if (!script) {
        script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = setupGsi;
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', setupGsi);
      }
    } else {
      setupGsi();
    }

    return () => { isMounted = false; };
  }, [config.configured, config.clientId]);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setErrorMsg('No Google credential returned.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await authService.googleLogin(response.credential);

      if (result.action === 'LOGIN_SUCCESS' && result.user) {
        onLoginSuccess(result.user);
      } else if (result.action === 'ACCOUNT_LINK_REQUIRED') {
        setModalState({
          isOpen: true,
          mode: 'LINK_ACCOUNT',
          data: {
            credential: response.credential,
            googleId: result.googleId,
            email: result.email,
            name: result.name,
            picture: result.picture
          }
        });
      } else if (result.action === 'ONBOARDING_REQUIRED') {
        setModalState({
          isOpen: true,
          mode: 'ONBOARDING',
          data: {
            credential: response.credential,
            ...result.googleIdentity
          }
        });
      } else {
        const msg = result.message || '';
        if (msg.toLowerCase().includes('test user') || msg.toLowerCase().includes('access_denied') || msg.toLowerCase().includes('restricted')) {
          setErrorMsg('OAuth access is currently restricted to registered test users on the Google Cloud OAuth consent screen. Please sign in with an authorized test account or use email and password.');
        } else {
          setErrorMsg(msg || 'Google authentication failed.');
        }
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('test user') || msg.toLowerCase().includes('access_denied') || msg.toLowerCase().includes('restricted')) {
        setErrorMsg('OAuth access is currently restricted to registered test users on the Google Cloud OAuth consent screen. Please sign in with an authorized test account or use email and password.');
      } else {
        setErrorMsg(msg || 'Google sign-in is temporarily unavailable. Please use email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerGooglePrompt = () => {
    if (config.configured && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setErrorMsg('Google sign-in is temporarily unavailable. Please use email and password.');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {config.configured && config.clientId ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
            <div ref={googleBtnContainerRef} style={{ minHeight: '40px', width: '100%', display: 'flex', justifyContent: 'center' }}></div>
          </div>
        ) : (
          <button
            type="button"
            onClick={triggerGooglePrompt}
            disabled={loading}
            className={className}
            style={{
              fontSize: '13px',
              fontWeight: 600,
              padding: '10px 16px',
              borderRadius: '8px',
              width: '100%',
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-primary)',
              transition: 'all 0.15s ease',
              ...style
            }}
            title={config.configured ? 'Sign in with Google' : 'Click to see Google OAuth status'}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} color="#EA4335" />}
            <span>Continue with Google</span>
          </button>
        )}

        {errorMsg && (
          <div style={{
            fontSize: '11px', color: '#F87171', background: 'rgba(239, 68, 68, 0.1)',
            padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.4
          }}>
            <Info size={13} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <GoogleAuthModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        googleData={modalState.data}
        defaultRole={role}
        onSuccess={(user) => {
          setModalState({ isOpen: false, mode: null, data: null });
          onLoginSuccess(user);
        }}
        onClose={() => setModalState({ isOpen: false, mode: null, data: null })}
      />
    </>
  );
}
