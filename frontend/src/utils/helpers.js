export function formatSalary(min, max, currency = 'USD') {
  const fmt = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };
  if (!min && !max) return 'Not specified';
  if (min && max) return `$${fmt(min)} - $${fmt(max)}`;
  if (min) return `From $${fmt(min)}`;
  return `Up to $${fmt(max)}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}

export function formatJobType(type) {
  const map = {
    full_time: 'Full Time', part_time: 'Part Time',
    contract: 'Contract', internship: 'Internship',
  };
  return map[type] || type;
}

export function formatLocationType(type) {
  const map = { onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' };
  return map[type] || type;
}

export function formatStatus(status) {
  return (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusColor(status) {
  const map = {
    applied: 'var(--info)', reviewing: 'var(--warning)',
    shortlisted: 'var(--success)', interview: 'var(--accent-secondary)',
    offered: 'var(--success)', rejected: 'var(--danger)',
    withdrawn: 'var(--text-tertiary)', open: 'var(--success)',
    closed: 'var(--danger)', draft: 'var(--text-tertiary)',
  };
  return map[status] || 'var(--text-secondary)';
}

export function statusBgColor(status) {
  const map = {
    applied: 'var(--info-bg)', reviewing: 'var(--warning-bg)',
    shortlisted: 'var(--success-bg)', interview: 'rgba(139,92,246,0.1)',
    offered: 'var(--success-bg)', rejected: 'var(--danger-bg)',
    withdrawn: 'rgba(100,116,139,0.1)', open: 'var(--success-bg)',
    closed: 'var(--danger-bg)', draft: 'rgba(100,116,139,0.1)',
  };
  return map[status] || 'var(--bg-tertiary)';
}

export const JOB_CATEGORIES = [
  'Engineering', 'Design', 'Marketing', 'Sales', 'Finance',
  'HR', 'Operations', 'Product', 'Data Science', 'DevOps',
  'Customer Support', 'Legal', 'Healthcare', 'Education', 'Other',
];
