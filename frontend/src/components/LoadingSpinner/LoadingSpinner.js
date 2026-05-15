import React from 'react';

export default function LoadingSpinner({ size = 40 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
      <div style={{
        width: size, height: size,
        border: '3px solid var(--bg-tertiary)',
        borderTop: '3px solid var(--accent-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}
