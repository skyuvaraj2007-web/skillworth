import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff, X, MessageSquare, Brain } from 'lucide-react';

export default function SkillNexusFAB({ onOpenAI, onVoiceQuery }) {
  const [isListening, setIsListening] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const recognitionRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSpeechSupported(!!SR);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isListening && !menuOpen) {
        setPulseActive(true);
        setTimeout(() => setPulseActive(false), 1800);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [isListening, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTooltip(true), 2000);
    const t2 = setTimeout(() => setShowTooltip(false), 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    let finalText = '';
    recognition.onstart = () => { setIsListening(true); setTranscript(''); setMenuOpen(false); };
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        interim += event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
      }
      setTranscript(interim);
    };
    recognition.onend = () => {
      setIsListening(false);
      const query = finalText.trim();
      if (query) { if (onVoiceQuery) onVoiceQuery(query); else if (onOpenAI) onOpenAI(query); }
      else { if (onOpenAI) onOpenAI(); }
      setTranscript('');
    };
    recognition.onerror = () => { setIsListening(false); setTranscript(''); };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    setTranscript('');
  };

  const handleMainClick = () => {
    if (isListening) { stopListening(); return; }
    setMenuOpen(prev => !prev);
    setShowTooltip(false);
  };

  const fabCss = [
    "@keyframes nexus-fab-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }",
    "@keyframes nexus-fab-pulse-ring { 0% { transform: scale(1); opacity: 0.55; } 70% { transform: scale(1.65); opacity: 0; } 100% { transform: scale(1.65); opacity: 0; } }",
    "@keyframes nexus-fab-listen-ring { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.4); opacity: 0.3; } }",
    "@keyframes nexus-fab-orbit1 { from { transform: rotate(0deg) translateX(34px) rotate(0deg); } to { transform: rotate(360deg) translateX(34px) rotate(-360deg); } }",
    "@keyframes nexus-fab-orbit2 { from { transform: rotate(180deg) translateX(28px) rotate(-180deg); } to { transform: rotate(540deg) translateX(28px) rotate(-540deg); } }",
    "@keyframes nexus-fab-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }",
    "@keyframes nexus-fab-glow { 0%, 100% { box-shadow: 0 0 22px rgba(0,217,255,0.45), 0 0 55px rgba(124,58,237,0.25), 0 8px 32px rgba(0,0,0,0.55); } 50% { box-shadow: 0 0 36px rgba(0,217,255,0.7), 0 0 80px rgba(124,58,237,0.45), 0 8px 32px rgba(0,0,0,0.55); } }",
    "@keyframes nexus-menu-in { from { opacity: 0; transform: scale(0.85) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }",
    "@keyframes nexus-voice-bar { 0%, 100% { height: 8px; } 50% { height: 22px; } }",
    ".nexus-fab-root { position: fixed; right: 22px; bottom: 30px; z-index: 9999; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; pointer-events: none; }",
    ".nexus-fab-root * { pointer-events: auto; }",
    ".nexus-fab-menu { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; animation: nexus-menu-in 0.22s cubic-bezier(0.16,1,0.3,1) forwards; }",
    ".nexus-fab-menu-item { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }",
    ".nexus-fab-menu-label { background: rgba(6,26,51,0.94); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border: 1px solid rgba(0,217,255,0.25); border-radius: 20px; padding: 7px 15px; font-size: 12.5px; font-weight: 700; color: #D7E7FF; white-space: nowrap; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }",
    ".nexus-fab-menu-btn { width: 44px; height: 44px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s ease; flex-shrink: 0; }",
    ".nexus-fab-menu-btn:hover { transform: scale(1.1); }",
    ".nexus-fab-btn { position: relative; width: 62px; height: 62px; border-radius: 50%; border: none; cursor: pointer; outline: none; background: linear-gradient(135deg, #00D9FF 0%, #00539C 45%, #7C3AED 100%); display: flex; align-items: center; justify-content: center; transition: transform 0.25s cubic-bezier(0.16,1,0.3,1); animation: nexus-fab-glow 3s ease-in-out infinite, nexus-fab-float 4s ease-in-out infinite; flex-shrink: 0; user-select: none; }",
    ".nexus-fab-btn:hover { transform: scale(1.1); }",
    ".nexus-fab-btn.listening { background: linear-gradient(135deg, #FF2D78 0%, #FF6B35 100%); animation: nexus-fab-float 4s ease-in-out infinite; }",
    ".nexus-fab-orbit-dot { position: absolute; top: 50%; left: 50%; width: 7px; height: 7px; border-radius: 50%; margin-top: -3.5px; margin-left: -3.5px; }",
    ".nexus-fab-orb1 { background: rgba(0,217,255,0.9); box-shadow: 0 0 8px rgba(0,217,255,0.9); animation: nexus-fab-orbit1 3.2s linear infinite; }",
    ".nexus-fab-orb2 { background: rgba(124,58,237,0.9); box-shadow: 0 0 8px rgba(124,58,237,0.9); animation: nexus-fab-orbit2 4.8s linear infinite; }",
    ".nexus-fab-pulse-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(0,217,255,0.6); pointer-events: none; }",
    ".nexus-fab-pulse-ring.active { animation: nexus-fab-pulse-ring 1.4s ease-out forwards; }",
    ".nexus-fab-listen-ring { position: absolute; inset: -6px; border-radius: 50%; border: 2px solid rgba(255,45,120,0.7); pointer-events: none; animation: nexus-fab-listen-ring 1.2s ease-in-out infinite; }",
    ".nexus-fab-arc-ring { position: absolute; inset: -6px; border-radius: 50%; border: 2px solid transparent; border-top-color: rgba(0,217,255,0.5); border-right-color: rgba(124,58,237,0.3); animation: nexus-fab-spin 3s linear infinite; pointer-events: none; }",
    ".nexus-fab-transcript { position: absolute; bottom: 74px; right: 0; background: rgba(6,26,51,0.96); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,45,120,0.4); border-radius: 16px; padding: 10px 14px; max-width: 240px; font-size: 12.5px; color: #D7E7FF; box-shadow: 0 6px 28px rgba(0,0,0,0.6); word-break: break-word; pointer-events: none; min-width: 160px; }",
    ".nexus-fab-waveform { display: flex; align-items: center; gap: 3px; height: 24px; }",
    ".nexus-fab-wave-bar { width: 3px; border-radius: 2px; background: #FF2D78; animation: nexus-voice-bar 0.6s ease-in-out infinite; }",
    ".nexus-fab-wave-bar:nth-child(2) { animation-delay: 0.1s; }",
    ".nexus-fab-wave-bar:nth-child(3) { animation-delay: 0.2s; }",
    ".nexus-fab-wave-bar:nth-child(4) { animation-delay: 0.1s; }",
    ".nexus-fab-tooltip { position: absolute; bottom: 74px; right: 0; background: rgba(6,26,51,0.94); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border: 1px solid rgba(0,217,255,0.25); border-radius: 16px; padding: 10px 16px; font-size: 12px; color: #D7E7FF; white-space: nowrap; box-shadow: 0 4px 20px rgba(0,0,0,0.55); pointer-events: none; animation: nexus-menu-in 0.2s ease forwards; }"
  ].join("\n");

  return (
    <>
      <style>{fabCss}</style>
      <div className="nexus-fab-root" ref={menuRef}>
        {menuOpen && !isListening && (
          <div className="nexus-fab-menu">
            <div className="nexus-fab-menu-item" onClick={() => { setMenuOpen(false); if (onOpenAI) onOpenAI(); }}>
              <span className="nexus-fab-menu-label">💬 Open AI Chat</span>
              <button className="nexus-fab-menu-btn" style={{ background: 'linear-gradient(135deg, #00539C 0%, #1688FF 100%)', boxShadow: '0 4px 18px rgba(0,83,156,0.5)' }}>
                <MessageSquare size={20} color="#fff" />
              </button>
            </div>
            {isSpeechSupported && (
              <div className="nexus-fab-menu-item" onClick={() => { setMenuOpen(false); startListening(); }}>
                <span className="nexus-fab-menu-label">🎙️ Voice Assistant</span>
                <button className="nexus-fab-menu-btn" style={{ background: 'linear-gradient(135deg, #FF2D78 0%, #FF6B35 100%)', boxShadow: '0 4px 18px rgba(255,45,120,0.5)' }}>
                  <Mic size={20} color="#fff" />
                </button>
              </div>
            )}
            <div className="nexus-fab-menu-item" onClick={() => { setMenuOpen(false); if (onVoiceQuery) onVoiceQuery('What are my top skill gaps?'); else if (onOpenAI) onOpenAI('What are my top skill gaps?'); }}>
              <span className="nexus-fab-menu-label">⚡ Quick Skill Insight</span>
              <button className="nexus-fab-menu-btn" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)', boxShadow: '0 4px 18px rgba(124,58,237,0.5)' }}>
                <Brain size={20} color="#fff" />
              </button>
            </div>
          </div>
        )}

        {isListening && (
          <div className="nexus-fab-transcript">
            {transcript ? (
              <span>{transcript}</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ color: '#FF2D78', fontWeight: 700, fontSize: '11px', letterSpacing: '0.05em' }}>LISTENING...</span>
                <div className="nexus-fab-waveform">
                  {[1,2,3,4,5].map(i => <div key={i} className="nexus-fab-wave-bar" />)}
                </div>
                <span style={{ fontSize: '11px', color: 'rgba(215,231,255,0.6)' }}>Speak your query...</span>
              </div>
            )}
          </div>
        )}

        {showTooltip && !isListening && !menuOpen && (
          <div className="nexus-fab-tooltip">
            <strong style={{ color: '#00D9FF', display: 'block', marginBottom: '2px' }}>✦ Skill Nexus AI</strong>
            Tap to chat or use voice
          </div>
        )}

        <button
          id="skill-nexus-fab"
          className={"nexus-fab-btn" + (isListening ? " listening" : "")}
          onClick={handleMainClick}
          title={isListening ? "Stop listening" : "Skill Nexus AI"}
          aria-label={isListening ? "Stop voice input" : "Open Skill Nexus AI"}
        >
          <div className="nexus-fab-arc-ring" />
          {!isListening && (
            <>
              <div className="nexus-fab-orbit-dot nexus-fab-orb1" />
              <div className="nexus-fab-orbit-dot nexus-fab-orb2" />
            </>
          )}
          <div className={"nexus-fab-pulse-ring" + (pulseActive ? " active" : "")} />
          {isListening && <div className="nexus-fab-listen-ring" />}
          {isListening ? (
            <MicOff size={26} color="#fff" strokeWidth={2.5} />
          ) : menuOpen ? (
            <X size={24} color="#fff" strokeWidth={2.5} />
          ) : (
            <Sparkles size={26} color="#fff" strokeWidth={2} />
          )}
        </button>
      </div>
    </>
  );
}
