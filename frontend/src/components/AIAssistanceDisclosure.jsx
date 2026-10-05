import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function AIAssistanceDisclosure({
  provider = 'deterministic-fallback',
  model = 'SkillWorth Rule Engine v1.0',
  isLiveAI = false,
  confidence = null,
  compact = false,
  onDismiss = null,
  style = {}
}) {
  const { t } = useLanguage();

  const isFallback = provider === 'deterministic-fallback' || !isLiveAI;

  return (
    <div
      style={{
        background: isFallback ? 'var(--color-surface, #f8fafc)' : 'var(--color-primary-50, #eff6ff)',
        border: `1px solid ${isFallback ? 'var(--color-border, #cbd5e1)' : 'var(--color-primary-200, #bfdbfe)'}`,
        borderLeft: `4px solid ${isFallback ? 'var(--color-warning-500, #f59e0b)' : 'var(--color-primary-600, #2563eb)'}`,
        borderRadius: '6px',
        padding: compact ? '8px 12px' : '12px 16px',
        marginBottom: '16px',
        fontSize: '13px',
        color: 'var(--color-text-primary, #1e293b)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        ...style
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '18px',
              color: isFallback ? 'var(--color-warning-600, #d97706)' : 'var(--color-primary-600, #2563eb)'
            }}
          >
            psychology
          </span>
          <span>{t('ai.disclosure', 'AI Assistance Disclosure')}</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '2px 6px',
              borderRadius: '4px',
              background: isFallback ? '#fef3c7' : '#dbeafe',
              color: isFallback ? '#92400e' : '#1e40af',
              border: `1px solid ${isFallback ? '#fde68a' : '#bfdbfe'}`
            }}
          >
            {isFallback ? t('ai.ruleEngine', 'Deterministic Rule Engine (Fallback)') : t('ai.liveAI', 'Live LLM Engine')}
          </span>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted, #64748b)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Dismiss"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
          </button>
        )}
      </div>

      <p style={{ margin: 0, lineHeight: 1.4, color: 'var(--color-text-secondary, #475569)' }}>
        <strong>{t('ai.advisoryOnly', 'AI provides advisory recommendations only. The human assessor holds full, final evaluation authority.')}</strong>{' '}
        {t('ai.notFinalAuthority', 'No automated pass/fail decisions are made by this system.')}
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '11px',
          color: 'var(--color-text-muted, #64748b)',
          marginTop: '2px'
        }}
      >
        <span>
          <strong>{t('ai.provider', 'Provider')}:</strong> {provider}
        </span>
        <span>
          <strong>{t('ai.model', 'Model')}:</strong> {model}
        </span>
        {confidence && (
          <span>
            <strong>{t('ai.confidence', 'Confidence')}:</strong>{' '}
            <span
              style={{
                color:
                  confidence === 'HIGH' ? '#15803d' : confidence === 'MODERATE' ? '#b45309' : '#b91c1c',
                fontWeight: 600
              }}
            >
              {confidence}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
