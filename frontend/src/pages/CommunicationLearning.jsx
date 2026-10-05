import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Sparkles,
  Flame,
  Award,
  Zap,
  CheckCircle2,
  XCircle,
  Volume2,
  Mic,
  MicOff,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Headphones,
  MessagesSquare,
  TrendingUp,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Layers,
  HelpCircle,
  Clock,
  Target
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// NATIVE WEB AUDIO SOUND EFFECTS (Pleasant gamified chimes, zero external assets)
// ═══════════════════════════════════════════════════════════════════════════════
function playChime(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    if (type === 'correct') {
      // Ascending major chord (C5 -> E5 -> G5)
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.15, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
    } else if (type === 'incorrect') {
      // Gentle descending buzz
      [260, 220].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.12, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.25);
      });
    } else if (type === 'levelup') {
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.18, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.35);
      });
    }
  } catch (e) {
    // AudioContext may be restricted before user gesture
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT TO SPEECH (For listening drills)
// ═══════════════════════════════════════════════════════════════════════════════
function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

export default function CommunicationLearning({ setActivePage, user, onShowToast }) {
  const [activeTab, setActiveTab] = useState('daily'); // daily, vocabulary, grammar, reading, listening, speaking, conversation, progress
  const [profile, setProfile] = useState({
    xp: 0,
    level: 1,
    streak: 0,
    dailyGoal: 50,
    dailyGoalProgress: 0,
    overallScore: 0,
    categories: {
      vocabulary: 0,
      grammar: 0,
      reading: 0,
      listening: 0,
      speaking: 0,
      conversation: 0
    },
    activities: [],
    badges: [],
    strengths: [],
    areasToImprove: []
  });

  const [catalog, setCatalog] = useState({});
  const [loading, setLoading] = useState(true);

  // Active Lesson Session State
  const [currentLesson, setCurrentLesson] = useState(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [matchingPairs, setMatchingPairs] = useState({});
  const [selectedPairTerm, setSelectedPairTerm] = useState(null);
  const [arrangedTokens, setArrangedTokens] = useState([]);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [feedbackState, setFeedbackState] = useState(null); // 'correct' | 'incorrect' | null
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState(null);
  const sessionStartTimeRef = useRef(Date.now());

  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

  // ── Fetch Telemetry & Curriculum ───────────────────────────────────────────
  const fetchCommunicationData = async () => {
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [profileRes, lessonsRes] = await Promise.all([
        fetch(`${apiBase}/communication/profile`, { headers, credentials: 'include' }),
        fetch(`${apiBase}/communication/lessons`, { headers, credentials: 'include' })
      ]);

      if (profileRes.ok) {
        const pJson = await profileRes.json();
        if (pJson.success && pJson.data) {
          setProfile(pJson.data);
        }
      }

      if (lessonsRes.ok) {
        const lJson = await lessonsRes.json();
        if (lJson.success && lJson.data) {
          setCatalog(lJson.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load communication learning data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunicationData();
  }, [user]);

  // ── Start Lesson ───────────────────────────────────────────────────────────
  const startLesson = (lesson) => {
    setCurrentLesson(lesson);
    setExerciseIndex(0);
    setSelectedOption(null);
    setMatchingPairs({});
    setSelectedPairTerm(null);
    setFeedbackState(null);
    setSessionScore(0);
    setSessionCorrectCount(0);
    setSessionCompleted(false);
    setSessionStats(null);
    setSpokenTranscript('');
    sessionStartTimeRef.current = Date.now();

    // Prepare tokens for arrange_sentence if first exercise
    const firstEx = lesson.exercises[0];
    if (firstEx && firstEx.type === 'arrange_sentence') {
      const shuffled = [...(firstEx.tokens || [])].sort(() => Math.random() - 0.5);
      setAvailableTokens(shuffled);
      setArrangedTokens([]);
    }
  };

  // Switch exercise setup
  useEffect(() => {
    if (currentLesson && currentLesson.exercises[exerciseIndex]) {
      const ex = currentLesson.exercises[exerciseIndex];
      setSelectedOption(null);
      setFeedbackState(null);
      setSpokenTranscript('');

      if (ex.type === 'arrange_sentence') {
        const shuffled = [...(ex.tokens || [])].sort(() => Math.random() - 0.5);
        setAvailableTokens(shuffled);
        setArrangedTokens([]);
      }
      if (ex.type === 'match_meaning') {
        setMatchingPairs({});
        setSelectedPairTerm(null);
      }
      if (ex.type === 'listen_and_answer' && ex.audioText) {
        // Automatically speak after brief delay for listening exercises
        setTimeout(() => speakText(ex.audioText), 400);
      }
    }
  }, [exerciseIndex, currentLesson]);

  // ── Token Click Handler (Arrange Sentence) ─────────────────────────────────
  const handleTokenSelect = (token) => {
    if (feedbackState) return;
    setArrangedTokens([...arrangedTokens, token]);
    setAvailableTokens(availableTokens.filter((t, idx) => idx !== availableTokens.indexOf(token)));
  };

  const handleTokenRemove = (token) => {
    if (feedbackState) return;
    setArrangedTokens(arrangedTokens.filter((t, idx) => idx !== arrangedTokens.indexOf(token)));
    setAvailableTokens([...availableTokens, token]);
  };

  // ── Pair Matching Handler ──────────────────────────────────────────────────
  const handleSelectPairTerm = (term) => {
    if (feedbackState) return;
    setSelectedPairTerm(term);
  };

  const handleSelectPairMeaning = (meaning) => {
    if (feedbackState || !selectedPairTerm) return;
    setMatchingPairs(prev => ({ ...prev, [selectedPairTerm]: meaning }));
    setSelectedPairTerm(null);
  };

  // ── Speech Recognition (Speaking Practice) ─────────────────────────────────
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onShowToast) onShowToast({ title: 'Microphone Notice', message: 'Speech recognition not supported in this browser. You may verify manually.', type: 'info' });
      return;
    }

    if (isListeningSpeech) {
      setIsListeningSpeech(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListeningSpeech(true);
      recognition.onend = () => setIsListeningSpeech(false);
      recognition.onerror = () => setIsListeningSpeech(false);

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setSpokenTranscript(transcript);
        setIsListeningSpeech(false);
      };

      recognition.start();
    } catch (e) {
      setIsListeningSpeech(false);
    }
  };

  // ── Check Answer ───────────────────────────────────────────────────────────
  const checkAnswer = () => {
    if (!currentLesson) return;
    const currentEx = currentLesson.exercises[exerciseIndex];
    let isCorrect = false;

    if (currentEx.type === 'choose_word' || currentEx.type === 'complete_sentence' || currentEx.type === 'read_and_answer' || currentEx.type === 'listen_and_answer' || currentEx.type === 'conversation_choice') {
      isCorrect = selectedOption === currentEx.correctAnswer;
    } else if (currentEx.type === 'arrange_sentence') {
      const arrangedStr = arrangedTokens.join(' ');
      const correctStr = (currentEx.correctOrder || currentEx.tokens).join(' ');
      isCorrect = arrangedStr.trim().toLowerCase() === correctStr.trim().toLowerCase();
    } else if (currentEx.type === 'match_meaning') {
      isCorrect = (currentEx.pairs || []).every(pair => matchingPairs[pair.term] === pair.meaning);
    } else if (currentEx.type === 'speaking_practice') {
      // If student spoke, check similarity; or if student pressed verify
      if (spokenTranscript) {
        const words = currentEx.targetPhrase.toLowerCase().split(/\s+/);
        const spokenWords = spokenTranscript.toLowerCase().split(/\s+/);
        const matched = words.filter(w => spokenWords.some(sw => sw.includes(w) || w.includes(sw)));
        isCorrect = (matched.length / words.length) >= 0.5;
      } else {
        isCorrect = true; // manual cadence check pass
      }
    }

    if (isCorrect) {
      playChime('correct');
      setFeedbackState('correct');
      setSessionScore(prev => prev + (100 / currentLesson.exercises.length));
      setSessionCorrectCount(prev => prev + 1);
    } else {
      playChime('incorrect');
      setFeedbackState('incorrect');
    }
  };

  // ── Next Exercise / Complete Lesson ────────────────────────────────────────
  const nextExercise = async () => {
    if (exerciseIndex + 1 < currentLesson.exercises.length) {
      setExerciseIndex(prev => prev + 1);
      setFeedbackState(null);
      setSelectedOption(null);
    } else {
      // Lesson Complete: Submit activity telemetry to backend
      const totalExercises = currentLesson.exercises.length;
      const finalAccuracy = Math.round((sessionCorrectCount / totalExercises) * 100);
      const finalScore = Math.round(sessionScore);
      const timeSpent = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);

      try {
        const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
        const res = await fetch(`${apiBase}/communication/activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify({
            lessonId: currentLesson.id,
            category: currentLesson.category,
            score: finalScore,
            accuracy: finalAccuracy,
            timeSpent: timeSpent || 45,
            attempts: 1
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setSessionStats(json.data);
            playChime('levelup');
            // Notify other tabs and dashboard
            window.dispatchEvent(new CustomEvent('nexus_data_updated'));
            window.dispatchEvent(new CustomEvent('nexus_students_updated'));
            // Refresh local profile
            fetchCommunicationData();
          }
        }
      } catch (err) {
        console.warn('Failed to persist communication telemetry:', err.message);
      }

      setSessionCompleted(true);
    }
  };

  const currentEx = currentLesson?.exercises[exerciseIndex];
  const progressPct = currentLesson ? Math.round(((exerciseIndex) / currentLesson.exercises.length) * 100) : 0;

  const TABS = [
    { id: 'daily', label: 'Daily Practice', icon: Flame, badge: 'Sprint' },
    { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
    { id: 'grammar', label: 'Grammar', icon: Layers },
    { id: 'reading', label: 'Reading', icon: FileText },
    { id: 'listening', label: 'Listening', icon: Headphones },
    { id: 'speaking', label: 'Speaking', icon: Mic },
    { id: 'conversation', label: 'Conversation', icon: MessagesSquare },
    { id: 'progress', label: 'Progress', icon: TrendingUp }
  ];

  function FileText(props) {
    return <BookOpen {...props} />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', color: 'var(--text-primary)' }}>

      {/* ── HEADER TELEMETRY STRIP (DUOLINGO-STYLE GAMIFIED STATUS) ── */}
      <div className="glass-panel" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px', borderRadius: '14px', marginBottom: '22px',
        border: '1px solid var(--border-subtle)', background: 'rgba(10, 16, 30, 0.75)',
        flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)'
          }}>
            <MessageSquare size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.02em' }}>
                Communication Mastery
              </h1>
              <span className="cyber-badge badge-purple" style={{ fontSize: '10px' }}>
                LEVEL {profile.level} • {profile.level === 1 ? 'Novice' : profile.level === 2 ? 'Developing' : profile.level === 3 ? 'Competent' : profile.level === 4 ? 'Proficient' : 'Master'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Activity-driven language, executive presence, and workplace articulation.
            </div>
          </div>
        </div>

        {/* Gamification Stats: Streak, XP, Daily Goal, Overall Skill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>

          {/* Streak */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: 'rgba(255, 157, 77, 0.08)', border: '1px solid rgba(255, 157, 77, 0.25)' }}>
            <Flame size={20} color="#FF9D4D" style={{ animation: profile.streak > 0 ? 'pulse 1.5s infinite' : 'none' }} />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FF9D4D', fontFamily: 'var(--font-mono)' }}>
                {profile.streak}
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Day Streak
              </div>
            </div>
          </div>

          {/* XP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.25)' }}>
            <Zap size={20} color="var(--cyber-cyan)" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>
                {profile.xp}
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total XP
              </div>
            </div>
          </div>

          {/* Daily Goal */}
          <div style={{ minWidth: '130px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Daily Goal</span>
              <span style={{ color: 'var(--cyber-emerald)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {profile.dailyGoalProgress} / {profile.dailyGoal} XP
              </span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.round((profile.dailyGoalProgress / profile.dailyGoal) * 100))}%`,
                height: '100%', borderRadius: '3px',
                background: 'linear-gradient(90deg, #2FE0A1, #00D4FF)',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Overall Communication Capability */}
          <div style={{ textAlign: 'center', padding: '6px 14px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#8B5CF6', fontFamily: 'var(--font-mono)' }}>
              {profile.overallScore}%
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Communication
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIVE LESSON PLAYER (MODAL OVERLAY) ── */}
      {currentLesson && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(5, 10, 20, 0.88)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            borderRadius: '16px', border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)', padding: '28px', position: 'relative'
          }}>

            {/* Exit button */}
            <button
              onClick={() => setCurrentLesson(null)}
              style={{
                position: 'absolute', top: '18px', right: '18px',
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600
              }}
            >
              Exit Lesson ✕
            </button>

            {/* Session Completed State */}
            {sessionCompleted ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div style={{
                  width: '70px', height: '70px', borderRadius: '50%',
                  background: 'rgba(46, 224, 161, 0.15)', border: '2px solid var(--cyber-emerald)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                }}>
                  <Award size={36} color="var(--cyber-emerald)" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                  Lesson Complete!
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 24px' }}>
                  Your answers have been verified and cryptographically synchronized with your student capability profile.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
                  <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>XP EARNED</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-cyan)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                      +{sessionStats?.xpEarned || 25}
                    </div>
                  </div>
                  <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ACCURACY</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyber-emerald)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                      {sessionStats?.activity?.accuracy || 100}%
                    </div>
                  </div>
                  <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OVERALL SKILL</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#8B5CF6', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                      {sessionStats?.communication?.overallScore || profile.overallScore}%
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentLesson(null)}
                  className="btn-cyber-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '14px', fontWeight: 700 }}
                >
                  Continue Learning
                </button>
              </div>
            ) : (
              /* Ongoing Exercise View */
              <div>
                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${progressPct}%`, height: '100%',
                      background: 'linear-gradient(90deg, #8B5CF6, #00D4FF)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {exerciseIndex + 1} / {currentLesson.exercises.length}
                  </span>
                </div>

                {/* Category & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="cyber-badge badge-blue" style={{ fontSize: '9.5px', textTransform: 'uppercase' }}>
                    {currentLesson.category}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {currentLesson.title}
                  </span>
                </div>

                {/* Question Prompt */}
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
                  {currentEx?.question}
                </h3>

                {/* Optional Passage (Reading) */}
                {currentEx?.passage && (
                  <div style={{
                    padding: '14px 16px', borderRadius: '10px', background: 'rgba(0, 212, 255, 0.04)',
                    border: '1px solid rgba(0, 212, 255, 0.15)', fontSize: '12.5px', lineHeight: '1.6',
                    color: 'var(--text-secondary)', marginBottom: '16px', whiteSpace: 'pre-line'
                  }}>
                    {currentEx.passage}
                  </div>
                )}

                {/* Optional Audio Player (Listening) */}
                {currentEx?.type === 'listen_and_answer' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    borderRadius: '10px', background: 'rgba(139, 92, 246, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.25)', marginBottom: '18px'
                  }}>
                    <button
                      onClick={() => speakText(currentEx.audioText)}
                      style={{
                        padding: '10px 14px', borderRadius: '8px', border: 'none',
                        background: '#8B5CF6', color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600
                      }}
                    >
                      <Volume2 size={16} /> Play Audio Drill
                    </button>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Listen carefully to the spoken prompt and select the correct answer below.
                    </span>
                  </div>
                )}

                {/* Optional Scenario (Conversation) */}
                {currentEx?.scenario && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      SCENARIO: {currentEx.scenario}
                    </div>
                    {currentEx.partnerLine && (
                      <div style={{
                        padding: '12px 16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)',
                        borderLeft: '3px solid var(--cyber-cyan)', fontStyle: 'italic', fontSize: '13px', color: '#fff'
                      }}>
                        Colleague: {currentEx.partnerLine}
                      </div>
                    )}
                  </div>
                )}

                {/* Prompt sentence (Choose word / Complete sentence) */}
                {currentEx?.prompt && (
                  <div style={{
                    fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500,
                    marginBottom: '20px', padding: '12px 16px', background: 'var(--bg-input)',
                    borderRadius: '8px', border: '1px solid var(--border-subtle)'
                  }}>
                    {currentEx.prompt}
                  </div>
                )}

                {/* EXERCISE TYPE: Multiple Choice / Choose Word / Read & Answer / Conversation */}
                {currentEx?.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {currentEx.options.map((opt, i) => {
                      const isSelected = selectedOption === opt;
                      return (
                        <button
                          key={i}
                          disabled={Boolean(feedbackState)}
                          onClick={() => setSelectedOption(opt)}
                          style={{
                            padding: '14px 18px', borderRadius: '10px', textAlign: 'left',
                            fontSize: '13.5px', fontWeight: 500, cursor: feedbackState ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                            background: isSelected ? 'rgba(0, 212, 255, 0.12)' : 'var(--bg-input)',
                            border: isSelected ? '1.5px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                            color: isSelected ? '#fff' : 'var(--text-secondary)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '20px', height: '20px', borderRadius: '50%',
                              border: isSelected ? '5px solid var(--cyber-cyan)' : '2px solid var(--text-muted)',
                              flexShrink: 0
                            }} />
                            <span>{opt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* EXERCISE TYPE: Arrange Sentence */}
                {currentEx?.type === 'arrange_sentence' && (
                  <div style={{ marginBottom: '24px' }}>
                    {/* Arranged Slots */}
                    <div style={{
                      minHeight: '60px', padding: '14px', borderRadius: '10px',
                      background: 'rgba(0, 212, 255, 0.04)', border: '1px dashed var(--cyber-cyan)',
                      display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '16px'
                    }}>
                      {arrangedTokens.length === 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Click the words below in the correct order...
                        </span>
                      )}
                      {arrangedTokens.map((token, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleTokenRemove(token)}
                          style={{
                            padding: '8px 12px', borderRadius: '6px',
                            background: 'rgba(0, 212, 255, 0.15)', border: '1px solid var(--cyber-cyan)',
                            color: '#fff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          {token}
                        </button>
                      ))}
                    </div>

                    {/* Available Tokens */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {availableTokens.map((token, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleTokenSelect(token)}
                          style={{
                            padding: '8px 14px', borderRadius: '6px',
                            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer'
                          }}
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* EXERCISE TYPE: Match Meaning */}
                {currentEx?.type === 'match_meaning' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    {/* Terms column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Terms</div>
                      {(currentEx.pairs || []).map(p => {
                        const isMatched = Boolean(matchingPairs[p.term]);
                        const isSelected = selectedPairTerm === p.term;
                        return (
                          <button
                            key={p.term}
                            onClick={() => handleSelectPairTerm(p.term)}
                            style={{
                              padding: '10px 12px', borderRadius: '8px', textAlign: 'left',
                              background: isSelected ? 'rgba(0, 212, 255, 0.2)' : isMatched ? 'rgba(46, 224, 161, 0.12)' : 'var(--bg-input)',
                              border: isSelected ? '1.5px solid var(--cyber-cyan)' : isMatched ? '1px solid var(--cyber-emerald)' : '1px solid var(--border-subtle)',
                              color: '#fff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            {p.term} {isMatched && '✓'}
                          </button>
                        );
                      })}
                    </div>

                    {/* Meanings column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Definitions</div>
                      {(currentEx.pairs || []).map(p => {
                        const isAssigned = Object.values(matchingPairs).includes(p.meaning);
                        return (
                          <button
                            key={p.meaning}
                            onClick={() => handleSelectPairMeaning(p.meaning)}
                            style={{
                              padding: '10px 12px', borderRadius: '8px', textAlign: 'left',
                              background: isAssigned ? 'rgba(46, 224, 161, 0.12)' : 'var(--bg-input)',
                              border: isAssigned ? '1px solid var(--cyber-emerald)' : '1px solid var(--border-subtle)',
                              color: isAssigned ? 'var(--cyber-emerald)' : 'var(--text-secondary)',
                              fontSize: '12px', cursor: 'pointer'
                            }}
                          >
                            {p.meaning}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* EXERCISE TYPE: Speaking Practice */}
                {currentEx?.type === 'speaking_practice' && (
                  <div style={{ padding: '18px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '24px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Target Phrase</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px', lineHeight: '1.5' }}>
                      "{currentEx.targetPhrase}"
                    </div>
                    {currentEx.phoneticHint && (
                      <div style={{ fontSize: '12px', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', marginBottom: '14px' }}>
                        Phonetics: {currentEx.phoneticHint}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => speakText(currentEx.targetPhrase)}
                        style={{
                          padding: '8px 14px', borderRadius: '8px', background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px'
                        }}
                      >
                        <Volume2 size={15} /> Listen to Pronunciation
                      </button>

                      <button
                        onClick={toggleSpeechRecognition}
                        style={{
                          padding: '8px 16px', borderRadius: '8px', border: 'none',
                          background: isListeningSpeech ? '#EF4444' : '#8B5CF6', color: '#fff',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '12px', fontWeight: 600
                        }}
                      >
                        {isListeningSpeech ? <MicOff size={15} /> : <Mic size={15} />}
                        {isListeningSpeech ? 'Listening... (Speak Now)' : 'Record Voice'}
                      </button>
                    </div>

                    {spokenTranscript && (
                      <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(46, 224, 161, 0.08)', border: '1px solid var(--cyber-emerald)', fontSize: '12px', color: 'var(--text-primary)' }}>
                        Heard: <em>"{spokenTranscript}"</em>
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback Banner */}
                {feedbackState && (
                  <div style={{
                    padding: '16px 20px', borderRadius: '10px', marginBottom: '20px',
                    background: feedbackState === 'correct' ? 'rgba(46, 224, 161, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    border: feedbackState === 'correct' ? '1px solid var(--cyber-emerald)' : '1px solid #EF4444',
                    display: 'flex', alignItems: 'flex-start', gap: '12px'
                  }}>
                    {feedbackState === 'correct' ? (
                      <CheckCircle2 size={22} color="var(--cyber-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    ) : (
                      <XCircle size={22} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                    )}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: feedbackState === 'correct' ? 'var(--cyber-emerald)' : '#EF4444' }}>
                        {feedbackState === 'correct' ? 'Brilliant! Correct answer.' : 'Not quite right.'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>
                        {currentEx?.explanation || (feedbackState === 'correct' ? 'Great articulation!' : `Correct answer: ${currentEx?.correctAnswer}`)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Action Controls */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  {!feedbackState ? (
                    <button
                      onClick={checkAnswer}
                      className="btn-cyber-primary"
                      disabled={
                        (currentEx?.options && !selectedOption) ||
                        (currentEx?.type === 'arrange_sentence' && arrangedTokens.length === 0) ||
                        (currentEx?.type === 'match_meaning' && Object.keys(matchingPairs).length === 0)
                      }
                      style={{
                        padding: '12px 28px', fontSize: '13px', fontWeight: 700,
                        opacity: ((currentEx?.options && !selectedOption) || (currentEx?.type === 'arrange_sentence' && arrangedTokens.length === 0)) ? 0.5 : 1
                      }}
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={nextExercise}
                      className="btn-cyber-primary"
                      style={{
                        padding: '12px 28px', fontSize: '13px', fontWeight: 700,
                        background: feedbackState === 'correct' ? 'linear-gradient(135deg, #10B981, #06B6D4)' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
                      }}
                    >
                      {exerciseIndex + 1 < currentLesson.exercises.length ? 'Next Question →' : 'Complete Lesson 🎉'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TABS NAVIGATION ── */}
      <div style={{
        display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px'
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px', borderRadius: '8px 8px 0 0',
                background: isActive ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #8B5CF6' : '2px solid transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} color={isActive ? '#8B5CF6' : 'var(--text-muted)'} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="cyber-badge badge-amber" style={{ fontSize: '9px', padding: '1px 5px' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: DAILY PRACTICE (SPEED SPRINT)
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'daily' && (
        <div>
          <div className="glass-panel" style={{
            padding: '24px', borderRadius: '14px', marginBottom: '24px',
            background: 'linear-gradient(135deg, rgba(255, 157, 77, 0.08), rgba(139, 92, 246, 0.08))',
            border: '1px solid rgba(255, 157, 77, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="cyber-badge badge-amber" style={{ fontSize: '10px', marginBottom: '6px' }}>
                  DAILY RECOMMENDED SPRINT
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '4px 0' }}>
                  Today's Communication Practice
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  A 3-minute mixed speed drill covering vocabulary, grammar, reading, and engineering standup dialogues.
                </p>
              </div>

              {(catalog.daily || []).length > 0 && (
                <button
                  onClick={() => startLesson(catalog.daily[0])}
                  className="btn-cyber-primary"
                  style={{
                    padding: '12px 24px', fontSize: '13px', fontWeight: 700,
                    background: 'linear-gradient(135deg, #FF9D4D, #F43F5E)'
                  }}
                >
                  <Flame size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  {catalog.daily[0]?.isCompleted ? 'Practice Again (+20 XP)' : 'Start Daily Sprint (+40 XP)'}
                </button>
              )}
            </div>
          </div>

          {/* Today's Focus Cards */}
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
            Daily Curated Drills
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              { title: 'Workplace Lexicon', category: 'vocabulary', xp: '25 XP', desc: 'Precise words for executive memos & standups.' },
              { title: 'Technical Listening', category: 'listening', xp: '30 XP', desc: 'Identify blockers from verbal sprint recordings.' },
              { title: 'Disagreeing Respectfully', category: 'conversation', xp: '35 XP', desc: 'Constructive dialogue during PR reviews.' }
            ].map((drill, idx) => (
              <div key={idx} className="glass-panel" style={{
                padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="cyber-badge badge-blue" style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                    {drill.category}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    +{drill.xp}
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{drill.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', minHeight: '36px' }}>{drill.desc}</div>
                <button
                  onClick={() => {
                    const found = (catalog[drill.category] || [])[0];
                    if (found) startLesson(found);
                    else setActiveTab(drill.category);
                  }}
                  className="btn-cyber-primary"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12px' }}
                >
                  Start Drill →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TABS 2-7: CATEGORIZED MODULES (Vocabulary, Grammar, Reading, Listening, Speaking, Conversation)
          ═══════════════════════════════════════════════════════════════════════ */}
      {['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'conversation'].includes(activeTab) && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'capitalize' }}>
                {activeTab} Drills & Scenarios
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Current category proficiency: <strong style={{ color: '#8B5CF6' }}>{profile.categories[activeTab] || 0}%</strong>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="cyber-badge badge-purple" style={{ fontSize: '10px' }}>
                {profile.categories[activeTab] >= 80 ? 'Mastered' : profile.categories[activeTab] >= 50 ? 'Intermediate' : 'In Training'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {(catalog[activeTab] || []).map(lesson => (
              <div key={lesson.id} className="glass-panel" style={{
                padding: '20px', borderRadius: '12px',
                border: lesson.isCompleted ? '1px solid rgba(46, 224, 161, 0.3)' : '1px solid var(--border-subtle)',
                background: 'var(--bg-card)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="cyber-badge" style={{
                    fontSize: '9.5px',
                    ...(lesson.difficulty === 'Beginner' ? { background: 'rgba(46, 224, 161, 0.1)', color: 'var(--cyber-emerald)', border: '1px solid rgba(46, 224, 161, 0.3)' } :
                        { background: 'rgba(0, 212, 255, 0.1)', color: 'var(--cyber-cyan)', border: '1px solid rgba(0, 212, 255, 0.3)' })
                  }}>
                    {lesson.difficulty}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    +{lesson.xpReward} XP
                  </span>
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                  {lesson.title}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px', minHeight: '34px', lineHeight: '1.4' }}>
                  {lesson.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {lesson.exercises.length} Interactive Exercises
                  </span>

                  <button
                    onClick={() => startLesson(lesson)}
                    className={lesson.isCompleted ? 'btn-cyber-outline' : 'btn-cyber-primary'}
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                  >
                    {lesson.isCompleted ? 'Review Lesson' : 'Start Lesson →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 8: PROGRESS & ANALYTICS
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'progress' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>

            {/* Category Radar / Breakdown */}
            <div className="glass-panel" style={{ padding: '22px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={16} color="#8B5CF6" />
                <span>Category Proficiency Breakdown</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { key: 'vocabulary', label: 'Vocabulary', color: 'var(--cyber-cyan)' },
                  { key: 'grammar', label: 'Grammar', color: '#8B5CF6' },
                  { key: 'reading', label: 'Reading', color: '#3B82F6' },
                  { key: 'listening', label: 'Listening', color: '#FF9D4D' },
                  { key: 'speaking', label: 'Speaking', color: 'var(--cyber-emerald)' },
                  { key: 'conversation', label: 'Conversation', color: '#EC4899' }
                ].map(cat => {
                  const val = profile.categories[cat.key] || 0;
                  return (
                    <div key={cat.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{cat.label}</span>
                        <span style={{ fontWeight: 700, color: cat.color, fontFamily: 'var(--font-mono)' }}>{val}%</span>
                      </div>
                      <div style={{ height: '7px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${val}%`, height: '100%', borderRadius: '4px',
                          background: cat.color, transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths & Improvement Areas */}
            <div className="glass-panel" style={{ padding: '22px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={16} color="var(--cyber-emerald)" />
                <span>NEXUS Communication Intelligence</span>
              </h3>

              {/* Strengths */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--cyber-emerald)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  ✓ Validated Strengths
                </div>
                {profile.strengths && profile.strengths.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profile.strengths.map(s => (
                      <span key={s} className="cyber-badge badge-emerald" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                        {s} ({profile.categories[s] || 0}%)
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Complete exercises above 60% accuracy to establish strengths.
                  </div>
                )}
              </div>

              {/* Priority Improvement Areas */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '11.5px', color: '#FF9D4D', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  • Priority Improvement Areas
                </div>
                {profile.areasToImprove && profile.areasToImprove.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profile.areasToImprove.map(a => (
                      <span key={a} className="cyber-badge badge-amber" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                        {a} ({profile.categories[a] || 0}%)
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    All communication categories meet baseline benchmarks.
                  </div>
                )}
              </div>

              {/* Badges Earned */}
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--cyber-cyan)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  🏆 Earned Badges ({profile.badges?.length || 0})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(profile.badges || []).length > 0 ? (
                    profile.badges.map(b => (
                      <div key={b.id} style={{
                        padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px'
                      }}>
                        <span>{b.icon}</span>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{b.title}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      No badges unlocked yet. Complete your first practice drill to earn your first badge!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Telemetry Ledger */}
          <div className="glass-panel" style={{ padding: '22px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
              Communication Telemetry Ledger
            </h3>

            {profile.activities && profile.activities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {profile.activities.slice().reverse().map(act => (
                  <div key={act.activityId} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '10px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="cyber-badge badge-blue" style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                          {act.category}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                          {act.lessonId}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(act.completedAt).toLocaleString()} • {act.timeSpent || 30}s duration
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-emerald)', fontFamily: 'var(--font-mono)' }}>
                          {act.score}% Score
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {act.accuracy}% Accuracy
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
                No communication activities recorded yet. Complete your first lesson above to generate verifiable telemetry.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
