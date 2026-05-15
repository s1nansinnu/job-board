import React from 'react';
import { statusColor, statusBgColor, formatStatus } from '../../utils/helpers';

export default function StatusBadge({ status, size = 'md' }) {
  const color = statusColor(status);
  const bg = statusBgColor(status);
  const sizes = {
    sm: { padding: '2px 8px', fontSize: '0.7rem' },
    md: { padding: '4px 12px', fontSize: '0.8rem' },
    lg: { padding: '6px 16px', fontSize: '0.875rem' },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      ...sizes[size],
      borderRadius: '9999px',
      fontWeight: 600,
      color: color,
      background: bg,
      border: `1px solid ${color}22`,
    }}>
      <span style={{
        width: 6, height: 6,
        borderRadius: '50%',
        background: color,
      }} />
      {formatStatus(status)}
    </span>
  );
}
