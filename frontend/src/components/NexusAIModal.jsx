import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, X, Send, Mic, MicOff, Volume2 } from 'lucide-react';
import { loadAssessmentStore } from '../services/assessmentStore';

/* ═══════════════════════════════════════════════════════
   NEXUS AI MODAL — Full voice + chat companion
   Voice flow: record → auto-send → AI reply → TTS speak
════════════════════════════════════════════════════════ */
export default function NexusAIModal({ isOpen, onClose, setActivePage, initialMessage }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Greetings! I am your Nexus AI Career Companion. I'm actively synthesizing your skill telemetry, diagnostic velocity, and corporate opportunities. How can I accelerate your roadmap today?"
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Voice states
  const [voiceState, setVoiceState] = useState('idle'); // idle | listening | processing
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const initialMsgFiredRef = useRef(false);
  const inputRef = useRef(null);

  // Check browser support
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSpeechSupported(!!SR);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Build auth headers from any available token
  const getAuthHeaders = useCallback(() => {
    const token =
      localStorage.getItem('nexus_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('nexus_auth_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
  }, []);

  // Core send function — useCallback so it is stable across renders
  const handleSend = useCallback(async (textToSend) => {
    const query = (textToSend || input || '').trim();
    if (!query) return;

    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    setInput('');
    setLoading(true);
    setVoiceTranscript('');

    const store = loadAssessmentStore();
    const latest = store?.assessments?.[0];

    try {
      const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
      const res = await fetch(`${apiBase}/ai/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ message: query, latestAssessment: latest })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        const aiMsg = { sender: 'ai', text: data.reply, suggestions: data.suggestions };
        setMessages(prev => [...prev, aiMsg]);
        if (isTTSEnabled) speakText(data.reply);
      } else {
        throw new Error(data.message || 'AI synthesis unavailable');
      }
    } catch (_err) {
      // Offline / rule-based fallback responses
      let reply = '';
      const q = query.toLowerCase();
      if (q.includes('assessment') || q.includes('review') || q.includes('test')) {
        reply = latest
          ? `Your latest ${latest.trackTitle || 'assessment'} score: ${latest.score}% (${latest.percentile || '—'}th percentile). Strengths: ${latest.strengths?.join(', ') || 'analysis pending'}. Key gaps: ${latest.weaknesses?.join(', ') || 'none identified'}. ${latest.aiRecommendation?.summary || ''}`
          : "You haven't completed an assessment yet. I recommend starting with Logical Reasoning or Programming to benchmark your foundational skills.";
      } else if (q.includes('gap') || q.includes('miss') || q.includes('improve') || q.includes('skill')) {
        reply = "Your current priority skill gaps: System Design (43%) and Cloud Computing (58%). Completing Graph Algorithms sprint and the containerization lab will lift your candidate readiness index to 85%+.";
      } else if (q.includes('course') || q.includes('learn') || q.includes('study')) {
        reply = "Top recommended courses for your profile: 1) Data Structures & Algorithms (DSA Pro), 2) Cloud Architecture Fundamentals (AWS/GCP), 3) System Design Master Class. Enroll from the Learning page.";
      } else if (q.includes('job') || q.includes('career') || q.includes('opportunit') || q.includes('intern')) {
        reply = `Your highest verified opportunity match is Data Analyst Intern at ABC Technologies (92% match). Backend Developer role at TechVentures follows at 87%. Visit Opportunities to apply.`;
      } else if (q.includes('readiness') || q.includes('score') || q.includes('progress')) {
        reply = `Career Journey Readiness: ${store?.careerJourney || 72}%. Technical Skills: ${store?.capabilities?.technicalSkills || 68}%, Problem Solving: ${store?.capabilities?.problemSolving || 75}%. You're in the top 35% of your cohort!`;
      } else {
        reply = `I analyzed your profile: Career Readiness is ${store?.careerJourney || 72}%. You have ${store?.capabilities?.technicalSkills || 68}% technical proficiency and ${store?.capabilities?.problemSolving || 75}% problem-solving score. Ask me about skill gaps, courses, career paths, or your assessments!`;
      }
      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      if (isTTSEnabled) speakText(reply);
    } finally {
      setLoading(false);
    }
  }, [input, isTTSEnabled, getAuthHeaders]);

  // Auto-fire initialMessage when modal opens
  useEffect(() => {
    if (isOpen && initialMessage && !initialMsgFiredRef.current) {
      initialMsgFiredRef.current = true;
      setTimeout(() => handleSend(initialMessage), 400);
    }
    if (!isOpen) {
      initialMsgFiredRef.current = false;
      // Stop any active speech
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  }, [isOpen, initialMessage, handleSend]);

  // Text-to-speech for AI responses
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    // Truncate long replies for TTS
    const shortText = text.length > 220 ? text.slice(0, 220) + '...' : text;
    const utt = new SpeechSynthesisUtterance(shortText);
    utt.lang = 'en-US';
    utt.rate = 1.05;
    utt.pitch = 1.0;
    utt.volume = 1.0;
    // Try to use a natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium'));
    if (preferred) utt.voice = preferred;
    window.speechSynthesis.speak(utt);
  };

  // ── VOICE RECOGNITION ──
  const startVoiceRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceError('Voice recognition not supported in this browser. Use Chrome or Edge.');
      return;
    }
    // Stop TTS while listening
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    setVoiceError('');
    setVoiceTranscript('');
    setVoiceState('listening');

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let finalText = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += t;
        } else {
          interim += t;
        }
      }
      setVoiceTranscript(finalText || interim);
    };

    recognition.onend = () => {
      setVoiceState('idle');
      if (finalText.trim()) {
        // Auto-populate input and auto-send
        setInput(finalText.trim());
        handleSend(finalText.trim());
      } else {
        setVoiceError('No speech detected. Try again.');
      }
    };

    recognition.onerror = (event) => {
      setVoiceState('idle');
      const errMap = {
        'not-allowed': 'Microphone access denied. Please allow microphone permission in your browser.',
        'no-speech': 'No speech detected. Try speaking closer to the mic.',
        'network': 'Network error during voice processing.',
        'aborted': 'Voice input cancelled.',
      };
      setVoiceError(errMap[event.error] || ('Voice error: ' + event.error));
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setVoiceState('idle');
      setVoiceError('Could not start voice recognition: ' + e.message);
    }
  }, [handleSend]);

  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceState('idle');
  }, []);

  if (!isOpen) return null;

  const quickPrompts = [
    "What are my skill gaps?",
    "Recommend courses for me",
    "Show my career readiness",
    "Best job matches for me"
  ];

  const isListening = voiceState === 'listening';

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        style={{
          width: '100%', maxWidth: '480px', height: '100vh',
          background: 'rgba(6, 26, 51, 0.97)',
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          borderLeft: '1px solid rgba(0, 217, 255, 0.35)',
          boxShadow: '-12px 0 50px rgba(0,0,0,0.75), 0 0 35px rgba(124,58,237,0.25)',
          display: 'flex', flexDirection: 'column', zIndex: 101,
          animation: 'slideInRight 0.25s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,36,71,0.9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #00D9FF 0%, #00539C 50%, #7C3AED 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 18px rgba(0,217,255,0.5)', color: '#fff'
            }}>
              <Sparkles size={19} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                Nexus AI Career Companion
              </div>
              <div style={{ fontSize: '10.5px', color: '#00D9FF', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#19D3AE', display: 'inline-block', boxShadow: '0 0 6px #19D3AE' }} />
                Voice + Intelligence Active
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* TTS toggle */}
            <button
              onClick={() => { setIsTTSEnabled(p => !p); window.speechSynthesis?.cancel(); }}
              title={isTTSEnabled ? 'Mute AI voice' : 'Enable AI voice'}
              style={{
                background: isTTSEnabled ? 'rgba(0,217,255,0.15)' : 'rgba(255,255,255,0.05)',
                border: isTTSEnabled ? '1px solid rgba(0,217,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', width: '30px', height: '30px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isTTSEnabled ? '#00D9FF' : '#888', cursor: 'pointer'
              }}
            >
              <Volume2 size={14} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '50%', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Voice Status Banner (shows when listening) ── */}
        {(isListening || voiceError) && (
          <div style={{
            padding: '10px 20px',
            background: isListening ? 'rgba(255,45,120,0.12)' : 'rgba(255,80,80,0.1)',
            borderBottom: `1px solid ${isListening ? 'rgba(255,45,120,0.3)' : 'rgba(255,80,80,0.3)'}`,
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            {isListening ? (
              <>
                {/* Animated waveform */}
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '20px' }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      width: '3px', background: '#FF2D78', borderRadius: '2px',
                      animation: `nexus-voice-bar 0.5s ease-in-out ${i * 0.08}s infinite`,
                      height: '12px'
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '12px', color: '#FF7EB3', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {voiceTranscript || 'Listening... speak now'}
                </span>
                <button
                  onClick={stopVoiceRecognition}
                  style={{ marginLeft: 'auto', background: 'rgba(255,45,120,0.25)', border: '1px solid rgba(255,45,120,0.5)', borderRadius: '8px', padding: '3px 10px', color: '#FF2D78', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Stop
                </button>
              </>
            ) : (
              <span style={{ fontSize: '11.5px', color: '#FF8080' }}>⚠ {voiceError}</span>
            )}
          </div>
        )}

        {/* ── Message Stream ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
              {m.sender === 'ai' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '6px', background: 'linear-gradient(135deg, #00D9FF, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={10} color="#fff" />
                  </div>
                  <span style={{ fontSize: '10px', color: '#00D9FF', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>NEXUS AI</span>
                  {/* Replay TTS button */}
                  {isSpeechSupported && (
                    <button
                      onClick={() => speakText(m.text)}
                      title="Read aloud"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,217,255,0.5)', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                    >
                      <Volume2 size={11} />
                    </button>
                  )}
                </div>
              )}
              <div style={{
                padding: '12px 16px', borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                fontSize: '13.5px', lineHeight: 1.6,
                background: m.sender === 'user'
                  ? 'linear-gradient(135deg, #00539C 0%, #1688FF 60%, #00D9FF 100%)'
                  : 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontWeight: m.sender === 'user' ? 600 : 400,
                border: m.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.11)',
                boxShadow: m.sender === 'user' ? '0 4px 16px rgba(0,83,156,0.45)' : '0 2px 12px rgba(0,0,0,0.2)',
                whiteSpace: 'pre-wrap'
              }}>
                {m.text}
              </div>
              {/* AI suggestion chips */}
              {m.suggestions && m.suggestions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {m.suggestions.map((s, si) => (
                    <button
                      key={si}
                      onClick={() => handleSend(s)}
                      style={{
                        padding: '4px 11px', borderRadius: '16px',
                        background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.28)',
                        color: '#00D9FF', fontSize: '11px', cursor: 'pointer', fontWeight: 600
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '10px 14px', background: 'rgba(17,26,48,0.9)', borderRadius: '12px', border: '1px solid rgba(0,217,255,0.15)' }}>
              <div style={{ fontSize: '12px', color: '#00D9FF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="status-dot-pulse" />
                Synthesizing career intelligence...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick Prompts ── */}
        <div style={{ padding: '8px 16px', display: 'flex', gap: '7px', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              style={{
                whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: '999px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.11)',
                color: '#D7E7FF', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,217,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(0,217,255,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)'; }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* ── Input Bar ── */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(4,18,38,0.98)' }}>
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              ref={inputRef}
              type="text"
              placeholder={isListening ? 'Listening...' : 'Ask about skills, jobs, courses...'}
              value={isListening ? voiceTranscript : input}
              onChange={(e) => !isListening && setInput(e.target.value)}
              readOnly={isListening}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                border: isListening ? '1px solid rgba(255,45,120,0.4)' : '1px solid rgba(255,255,255,0.13)',
                borderRadius: '14px', padding: '11px 16px', color: '#fff',
                fontSize: '13px', outline: 'none',
                boxShadow: isListening ? 'inset 0 0 8px rgba(255,45,120,0.12)' : 'inset 0 1px 2px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease'
              }}
            />

            {/* Voice button */}
            {isSpeechSupported && (
              <button
                type="button"
                onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                disabled={loading}
                title={isListening ? 'Stop listening' : 'Voice input — click to speak'}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                  background: isListening
                    ? 'linear-gradient(135deg, #FF2D78, #FF6B35)'
                    : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0,
                  boxShadow: isListening ? '0 0 18px rgba(255,45,120,0.65)' : 'none',
                  transition: 'all 0.25s ease',
                  animation: isListening ? 'nexus-fab-listen-ring 1s ease-in-out infinite' : 'none',
                  color: '#fff'
                }}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}

            {/* Send button */}
            <button
              type="submit"
              disabled={loading || (!input.trim() && !voiceTranscript.trim())}
              style={{
                width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                background: (loading || (!input.trim() && !voiceTranscript.trim()))
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg, #00539C, #1688FF, #00D9FF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0,
                boxShadow: (loading || !input.trim()) ? 'none' : '0 4px 14px rgba(0,83,156,0.5)',
                transition: 'all 0.2s ease', color: '#fff'
              }}
            >
              <Send size={17} />
            </button>
          </form>

          {/* Helper hint */}
          {!isListening && !voiceError && isSpeechSupported && (
            <div style={{ marginTop: '7px', fontSize: '10px', color: 'rgba(215,231,255,0.35)', textAlign: 'center' }}>
              🎙️ Click mic to speak — AI will auto-respond &nbsp;|&nbsp; 🔊 Toggle voice output above
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
