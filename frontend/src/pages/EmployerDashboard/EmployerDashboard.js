import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { timeAgo } from '../../utils/helpers';

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/api/jobs', { params: { employer_id: user?.id, limit: 50 } }),
      client.get('/api/applications?limit=50'),
    ]).then(([jRes, aRes]) => {
      setJobs(jRes.data.jobs || []);
      setApps(aRes.data.applications || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const openJobs = jobs.filter((j) => j.status === 'open').length;
  const totalApps = apps.length;
  const shortlisted = apps.filter((a) => a.status === 'shortlisted').length;

  if (loading) return <div className="page container"><LoadingSpinner /></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Employer Dashboard</h1>
          <p className="page-subtitle">Manage your job listings and applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-4" style={{ marginBottom: 'var(--space-8)' }}>
          {[
            { label: 'Active Jobs', value: openJobs, color: 'var(--success)' },
            { label: 'Total Jobs', value: jobs.length, color: 'var(--info)' },
            { label: 'Applications', value: totalApps, color: 'var(--accent-primary)' },
            { label: 'Shortlisted', value: shortlisted, color: 'var(--warning)' },
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
          <Link to="/employer/jobs/new" className="card card-highlight" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>➕</div>
            <div style={{ fontWeight: 600 }}>Post New Job</div>
          </Link>
          <Link to="/employer/jobs" className="card card-highlight" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
            <div style={{ fontWeight: 600 }}>Manage Listings</div>
          </Link>
          <Link to="/jobs" className="card card-highlight" style={{ textAlign: 'center', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>Browse All Jobs</div>
          </Link>
        </div>

        {/* Recent Applications */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Recent Applications</h2>
          {apps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">No applications yet</div>
              <p>Post a job to start receiving applications</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {apps.slice(0, 8).map((app) => (
                <div key={app.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 'var(--space-4)', background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: 8
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{app.candidate_name}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      for {app.job_title} • {timeAgo(app.created_at)}
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
