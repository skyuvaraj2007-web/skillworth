import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import AIAssistanceDisclosure from './AIAssistanceDisclosure';
import RplAIMatchResults from './RplAIMatchResults';

export default function RplAIExperienceInterview({
  user,
  selectedPathway,
  onPathwaySelected,
  onComplete
}) {
  const { t } = useLanguage();
  const [experienceText, setExperienceText] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Sample starter prompts
  const samplePrompts = [
    "I have worked for 5 years as an electrician doing residential wiring, installing MCBs, and inverter battery connections using multimeters and conduit pipes.",
    "நான் 4 வருடங்களாக வெல்டிங் வேலை செய்கிறேன். TIG, MIG வெல்டிங் மற்றும் மெட்டல் ஃபேப்ரிகேஷன் செய்கிறேன்.",
    "मैं 6 साल से ऑटोमोबाइल मैकेनिक का काम कर रहा हूँ। टू-व्हीलर और फोर-व्हीलर इंजन ओवरहालिंग और ब्रेक रिपेयर करता हूँ।"
  ];

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please type your experience.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setExperienceText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleAnalyze = async () => {
    if (!experienceText.trim()) {
      setError("Please describe your work experience before analyzing.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await api.aiAnalyzeAndMatch(experienceText);
      if (result.success) {
        setMatchData(result);
      } else {
        setError(result.message || "Failed to analyze experience.");
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
      setError("Error communicating with AI service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* AI Transparency Disclosure Banner */}
      <AIAssistanceDisclosure
        provider={matchData?.provider || 'deterministic-fallback'}
        model={matchData?.model || 'SkillWorth Multi-QP Discovery Engine'}
        isLiveAI={matchData?.isLiveAI || false}
        confidence={matchData?.matchResult?.topMatch?.confidence}
      />

      {/* Main Experience Interview Card */}
      <div
        style={{
          background: 'var(--color-card-bg, #ffffff)',
          border: '1px solid var(--color-border, #e2e8f0)',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary-600, #2563eb)' }}>
            record_voice_over
          </span>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
            {t('ai.experienceInterview', 'AI Skill Discovery & Experience Interview')}
          </h3>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--color-text-secondary, #64748b)', lineHeight: 1.5 }}>
          Describe what you do in your day-to-day work, the tools and machines you operate, how many years you have been practicing, and typical projects. You can type in English, Tamil, Hindi, or use speech input.
        </p>

        {/* Sample prompt pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted, #64748b)', alignSelf: 'center' }}>
            Try an example:
          </span>
          {samplePrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => setExperienceText(prompt)}
              style={{
                background: 'var(--color-surface, #f1f5f9)',
                border: '1px solid var(--color-border, #cbd5e1)',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '11px',
                color: 'var(--color-text-secondary, #475569)',
                cursor: 'pointer',
                textAlign: 'left',
                maxWidth: '280px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={prompt}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Experience text area */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <textarea
            value={experienceText}
            onChange={(e) => setExperienceText(e.target.value)}
            placeholder={t(
              'ai.experiencePlaceholder',
              'Describe your daily work, tools used, tasks performed, and years of experience in your own words (English, Tamil, Hindi)...'
            )}
            rows={5}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '6px',
              border: '1px solid var(--color-border, #cbd5e1)',
              fontSize: '14px',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <button
              type="button"
              onClick={handleVoiceInput}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isListening ? '#fee2e2' : 'var(--color-surface, #f8fafc)',
                color: isListening ? '#dc2626' : 'var(--color-text-primary, #334155)',
                border: `1px solid ${isListening ? '#fca5a5' : 'var(--color-border, #cbd5e1)'}`,
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {isListening ? 'mic' : 'mic_none'}
              </span>
              {isListening ? 'Listening... Click to stop' : 'Voice Input'}
            </button>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || !experienceText.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--color-primary-600, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading || !experienceText.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !experienceText.trim() ? 0.6 : 1
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                auto_awesome
              </span>
              {loading ? t('ai.analyzing', 'Analyzing...') : t('ai.analyzeExperience', 'Analyze Experience with AI')}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Extracted Profile Highlights */}
        {matchData?.extractedProfile && (
          <div
            style={{
              background: 'var(--color-surface, #f8fafc)',
              border: '1px solid var(--color-border, #e2e8f0)',
              borderRadius: '6px',
              padding: '14px',
              marginBottom: '16px'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Extracted Profile Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted, #64748b)' }}>Experience: </span>
                <strong>{matchData.extractedProfile.yearsOfExperience || 0} years</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted, #64748b)' }}>Detected Tools: </span>
                <strong>{(matchData.extractedProfile.detectedTools || []).join(', ') || 'None specifically detected'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted, #64748b)' }}>Core Tasks: </span>
                <strong>{(matchData.extractedProfile.detectedTasks || []).slice(0, 3).join(', ') || 'General trade activities'}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Match Results */}
        {matchData && (
          <RplAIMatchResults
            matchResult={matchData.matchResult}
            selectedPathway={selectedPathway}
            onSelectPathway={(pathway) => {
              if (onPathwaySelected) onPathwaySelected(pathway);
              if (onComplete) onComplete(pathway);
            }}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
