import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', top: 'calc(var(--navbar-height, 72px) + 16px)',
        right: '16px', zIndex: 10000, display: 'flex', flexDirection: 'column',
        gap: '8px', maxWidth: '400px',
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              animation: 'slideUp 0.3s ease',
              fontSize: '0.875rem',
              fontWeight: 500,
              background: toast.type === 'success' ? 'rgba(16,185,129,0.15)'
                : toast.type === 'error' ? 'rgba(239,68,68,0.15)'
                : toast.type === 'warning' ? 'rgba(245,158,11,0.15)'
                : 'rgba(59,130,246,0.15)',
              color: toast.type === 'success' ? '#10b981'
                : toast.type === 'error' ? '#ef4444'
                : toast.type === 'warning' ? '#f59e0b'
                : '#3b82f6',
              borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.3)'
                : toast.type === 'error' ? 'rgba(239,68,68,0.3)'
                : toast.type === 'warning' ? 'rgba(245,158,11,0.3)'
                : 'rgba(59,130,246,0.3)',
            }}
          >
            {toast.type === 'success' ? '✓ ' : toast.type === 'error' ? '✕ ' : toast.type === 'warning' ? '⚠ ' : 'ℹ '}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
