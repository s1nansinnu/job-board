import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { timeAgo } from '../../utils/helpers';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/api/applications?limit=50')
      .then((r) => setApps(r.data.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <div className="page container"><LoadingSpinner /></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Welcome, {user?.name}</h1>
          <p className="page-subtitle">Track your job applications and profile</p>
        </div>

        {/* Stats */}
        <div className="grid grid-4" style={{ marginBottom: 'var(--space-8)' }}>
          {[
            { label: 'Total Applied', value: apps.length, color: 'var(--info)' },
            { label: 'Shortlisted', value: statusCounts.shortlisted || 0, color: 'var(--success)' },
            { label: 'Interviews', value: statusCounts.interview || 0, color: 'var(--accent-secondary)' },
            { label: 'Offers', value: statusCounts.offered || 0, color: 'var(--success)' },
          ].map((s, i) => (
            <div key={i} className="card stat-card">
              <div className="stat-value" style={{ background: s.color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-3" style={{ marginBottom: 'var(--space-8)' }}>
          <Link to="/jobs" className="card card-highlight" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>Browse Jobs</div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Find new opportunities</div>
          </Link>
          <Link to="/candidate/profile" className="card card-highlight" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>👤</div>
            <div style={{ fontWeight: 600 }}>My Profile</div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Update your info</div>
          </Link>
          <Link to="/candidate/applications" className="card card-highlight" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
            <div style={{ fontWeight: 600 }}>Applications</div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>View all {apps.length} applications</div>
          </Link>
        </div>

        {/* Recent Applications */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Recent Applications</h2>
          {apps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">No applications yet</div>
              <p>Start exploring jobs and apply today!</p>
              <Link to="/jobs" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Jobs</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {apps.slice(0, 5).map((app) => (
                <div key={app.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 'var(--space-4)', background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: 8
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{app.job_title}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      {app.job_company} • {timeAgo(app.created_at)}
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
