import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function RplAIMatchResults({
  matchResult,
  selectedPathway = null,
  onSelectPathway,
  loading = false
}) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary, #475569)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ margin: 0, fontWeight: 500 }}>{t('ai.analyzing', 'Analyzing your experience and matching Qualification Packs...')}</p>
      </div>
    );
  }

  if (!matchResult || !matchResult.pathways || matchResult.pathways.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted, #64748b)', background: 'var(--color-surface, #f8fafc)', borderRadius: '8px', border: '1px dashed var(--color-border, #cbd5e1)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--color-text-muted, #94a3b8)', marginBottom: '8px' }}>
          manage_search
        </span>
        <p style={{ margin: 0 }}>No Qualification Pack matches found. Please provide more detail about your daily tasks and tools.</p>
      </div>
    );
  }

  const { pathways, extractedProfile } = matchResult;

  const getScoreColor = (score) => {
    if (score >= 70) return '#16a34a';
    if (score >= 45) return '#d97706';
    return '#dc2626';
  };

  const getConfidenceBadge = (confidence) => {
    const isHigh = confidence === 'HIGH';
    const isMod = confidence === 'MODERATE';
    return {
      bg: isHigh ? '#dcfce7' : isMod ? '#fef3c7' : '#fee2e2',
      color: isHigh ? '#15803d' : isMod ? '#b45309' : '#b91c1c',
      label: isHigh ? t('ai.high', 'High Confidence') : isMod ? t('ai.moderate', 'Moderate Confidence') : t('ai.low', 'Low Confidence')
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary, #1e293b)' }}>
          {t('ai.pathways', 'Recommended Qualification Pathways')} ({pathways.length})
        </h4>
        {extractedProfile && (
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #475569)' }}>
            <strong>{extractedProfile.yearsOfExperience || 0} yrs</strong> detected experience &bull;{' '}
            <strong>{(extractedProfile.detectedTools || []).length}</strong> tools identified
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pathways.map((pathway, index) => {
          const isSelected = selectedPathway && (selectedPathway.qpId === pathway.qpId || selectedPathway.qpCode === pathway.qpCode);
          const confBadge = getConfidenceBadge(pathway.confidence);
          const scoreColor = getScoreColor(pathway.matchScore);

          return (
            <div
              key={pathway.qpId || pathway.qpCode || index}
              style={{
                border: isSelected ? '2px solid var(--color-primary-600, #2563eb)' : '1px solid var(--color-border, #e2e8f0)',
                background: isSelected ? 'var(--color-primary-50, #eff6ff)' : 'var(--color-card-bg, #ffffff)',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: isSelected ? '0 4px 6px -1px rgba(37, 99, 235, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      {pathway.qpCode || pathway.qpId}
                    </span>
                    <span
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      NSQF Level {pathway.nsqfLevel || 4}
                    </span>
                    <span
                      style={{
                        background: confBadge.bg,
                        color: confBadge.color,
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      {confBadge.label}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
                    {pathway.qpName || pathway.trade}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #64748b)', marginTop: '2px' }}>
                    Sector: {pathway.sector || 'General'}
                  </div>
                </div>

                {/* Score badge */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                    {pathway.matchScore}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #64748b)', marginTop: '2px' }}>
                    {t('ai.matchScore', 'Match Score')}
                  </div>
                </div>
              </div>

              {/* Score breakdown metrics */}
              {pathway.scoreBreakdown && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '8px',
                    background: 'var(--color-surface, #f8fafc)',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '12px'
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--color-text-secondary, #64748b)', marginBottom: '3px' }}>
                      {t('ai.taskAlignment', 'Task Match')}: <strong>{pathway.scoreBreakdown.taskAlignment || pathway.taskAlignmentScore || 0}%</strong>
                    </div>
                    <div style={{ background: '#e2e8f0', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pathway.scoreBreakdown.taskAlignment || pathway.taskAlignmentScore || 0}%`, background: '#3b82f6', height: '100%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-text-secondary, #64748b)', marginBottom: '3px' }}>
                      {t('ai.toolAlignment', 'Tool Match')}: <strong>{pathway.scoreBreakdown.toolAlignment || pathway.toolAlignmentScore || 0}%</strong>
                    </div>
                    <div style={{ background: '#e2e8f0', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pathway.scoreBreakdown.toolAlignment || pathway.toolAlignmentScore || 0}%`, background: '#8b5cf6', height: '100%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-text-secondary, #64748b)', marginBottom: '3px' }}>
                      {t('ai.experienceAlignment', 'Exp Match')}: <strong>{pathway.scoreBreakdown.experienceAlignment || pathway.experienceAlignmentScore || 0}%</strong>
                    </div>
                    <div style={{ background: '#e2e8f0', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pathway.scoreBreakdown.experienceAlignment || pathway.experienceAlignmentScore || 0}%`, background: '#10b981', height: '100%' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rationale and why it matches */}
              {pathway.whyItMatches && pathway.whyItMatches.length > 0 && (
                <div style={{ marginBottom: '10px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #334155)', marginBottom: '4px' }}>
                    {t('ai.whyMatch', 'Why this matches your profile')}:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-secondary, #475569)' }}>
                    {pathway.whyItMatches.slice(0, 3).map((reason, rIdx) => (
                      <li key={rIdx} style={{ marginBottom: '2px' }}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing information tips */}
              {pathway.missingInformation && pathway.missingInformation.length > 0 && (
                <div style={{ marginBottom: '12px', fontSize: '12px', color: '#b45309', background: '#fffbeb', padding: '6px 10px', borderRadius: '4px' }}>
                  <strong>{t('ai.missingInfo', 'Information to strengthen your application')}:</strong> {pathway.missingInformation.join(', ')}
                </div>
              )}

              {/* Select button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => onSelectPathway && onSelectPathway(pathway)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: isSelected ? '#16a34a' : 'var(--color-primary-600, #2563eb)',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {isSelected ? 'check_circle' : 'arrow_forward'}
                  </span>
                  {isSelected ? t('ai.selected', 'Selected Pathway') : t('ai.selectPathway', 'Select this Qualification Pathway')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
