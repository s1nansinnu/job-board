import React from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          maxWidth: 520, width: '100%',
          maxHeight: '85vh', overflowY: 'auto',
          animation: 'slideUp 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-tertiary)', border: 'none',
              color: 'var(--text-secondary)', cursor: 'pointer',
              width: 32, height: 32, borderRadius: '50%',
              fontSize: '1.1rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
