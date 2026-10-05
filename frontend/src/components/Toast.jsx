import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  const borderColor = isError ? 'var(--cyber-rose)' : (isInfo ? 'var(--cyber-cyan)' : 'var(--cyber-emerald)');
  const bgColor = isError ? 'rgba(244, 63, 94, 0.15)' : (isInfo ? 'rgba(0, 212, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)');
  const iconColor = isError ? 'var(--cyber-rose)' : (isInfo ? 'var(--cyber-cyan)' : 'var(--cyber-emerald)');

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 200,
      background: '#0B1120',
      border: `1px solid ${borderColor}`,
      borderRadius: '10px',
      padding: '14px 18px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      maxWidth: '420px',
      animation: 'slideUp 0.2s ease-out'
    }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: bgColor, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0
      }}>
        {isError ? <AlertCircle size={16} color={iconColor} /> : (isInfo ? <Info size={16} color={iconColor} /> : <CheckCircle2 size={16} color={iconColor} />)}
      </div>

      <div style={{ flex: 1 }}>
        {toast.title && (
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {toast.title}
          </div>
        )}
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          {toast.message}
        </div>
      </div>

      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
