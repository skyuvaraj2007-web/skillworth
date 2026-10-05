import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Reusable Cyber ErrorBoundary for SkillNexus
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SkillNexus ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const componentTitle = this.props.title || 'Component';

      return (
        <div
          className="glass-panel"
          style={{
            padding: '32px 28px',
            borderRadius: '16px',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.08)',
            margin: '20px 0',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            maxWidth: '680px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--cyber-rose, #dc2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-heading, #172B4D)'
              }}
            >
              Unable to Display {componentTitle}
            </h3>
            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '13px',
                color: 'var(--text-secondary, #64748B)',
                maxWidth: '480px',
                lineHeight: 1.5
              }}
            >
              An unexpected render issue occurred while loading this view. You can reload this section or navigate back to the main console.
            </p>
          </div>

          {this.state.error?.message && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                fontSize: '11px',
                color: 'var(--cyber-rose, #dc2626)',
                fontFamily: 'monospace',
                maxWidth: '520px',
                wordBreak: 'break-word',
                textAlign: 'left'
              }}
            >
              {this.state.error.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={this.handleReset}
              className="btn-cyber-primary"
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--brand-primary, #00539C), var(--cyber-cyan, #0284c7))',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} />
              <span>Retry View</span>
            </button>

            {this.props.onNavigateHome && (
              <button
                onClick={this.props.onNavigateHome}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #E2E8F0)',
                  background: 'none',
                  color: 'var(--text-primary, #172B4D)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Home size={14} />
                <span>Return to Dashboard</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
