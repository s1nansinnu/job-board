import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { formatDate, timeAgo } from '../../utils/helpers';

const STATUS_OPTIONS = ['applied', 'reviewing', 'shortlisted', 'interview', 'offered', 'rejected'];

export default function EmployerApplications() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [job, setJob] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchData = async () => {
    try {
      const [jobRes, appsRes] = await Promise.all([
        client.get(`/api/jobs/${id}`),
        client.get('/api/applications', { params: { job_id: id, limit: 50, ...(filter ? { status: filter } : {}) } }),
      ]);
      setJob(jobRes.data);
      setApps(appsRes.data.applications || []);
    }  catch (err) {
    console.error('fetchData error:', err.response?.data || err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id, filter]); // eslint-disable-line
  const downloadResume = async (userId, filename) => {
    try {
      const response = await client.get(`/api/profile/resume/${userId}`, {
        responseType: 'blob',  // ← tells axios to get binary data
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'resume';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      addToast('Failed to download resume', 'error');
    }
  };
  const updateStatus = async (appId, newStatus) => {
    setUpdating(appId);
    try {
      await client.patch(`/api/applications/${appId}/status`, { status: newStatus, note: '' });
      addToast(`Status updated to ${newStatus}`, 'success');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to update status', 'error');
    } finally { setUpdating(null); }
  };

  if (loading) return <div className="page container"><LoadingSpinner /></div>;

  return (
    <div className="page">
      <div className="container">
        <Link to="/employer/jobs" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}>← Back to Jobs</Link>

        {job && (
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>Applications for {job.title}</h1>
                <p style={{ color: 'var(--text-secondary)' }}>{job.company} • {job.location}</p>
              </div>
              <StatusBadge status={job.status} size="lg" />
            </div>
          </div>
        )}

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
          <button className={`btn ${!filter ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('')}>All ({apps.length})</button>
          {STATUS_OPTIONS.map((s) => (
            <button key={s}
              className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setFilter(filter === s ? '' : s)}
              style={{ textTransform: 'capitalize' }}
            >{s.replace('_', ' ')}</button>
          ))}
        </div>

        {apps.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No applications yet</div>
            <p>Share your job listing to start receiving applications</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {apps.map((app) => (
              <div key={app.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {app.candidate_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{app.candidate_name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>{app.candidate_email}</div>
                      </div>
                    </div>

                    {app.candidate_skills && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {app.candidate_skills.split(',').map((s, i) => (
                          <span key={i} className="tag">{s.trim()}</span>
                        ))}
                      </div>
                    )}

                    {app.candidate_location && (
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>📍 {app.candidate_location}</div>
                    )}

                    {app.cover_letter && (
                      <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Cover Letter:</strong>
                        <p style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{app.cover_letter}</p>
                      </div>
                    )}

                    <div style={{ marginTop: 8, fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                      Applied {timeAgo(app.created_at)} • {formatDate(app.created_at)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    <StatusBadge status={app.status} size="lg" />

                    {/* Resume download */}
                    {app.candidate_resume_filename && (
                      <button
                        onClick={() => downloadResume(app.candidate_id, app.candidate_resume_filename)}
                      >
                        📄 Download Resume
                      </button>
                    )}

                    {/* Status update */}
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      disabled={updating === app.id}
                      style={{
                        padding: '6px 12px', fontSize: 'var(--font-size-sm)',
                        width: 'auto', minWidth: 160,
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} style={{ textTransform: 'capitalize' }}>
                          {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
