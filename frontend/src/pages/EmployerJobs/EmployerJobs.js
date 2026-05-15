import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

export default function EmployerJobs() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchJobs = async () => {
    try {
      const params = { employer_id: user?.id, limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await client.get('/api/jobs', { params });
      setJobs(res.data.jobs || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [statusFilter]); // eslint-disable-line

  const toggleStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      await client.patch(`/api/jobs/${jobId}/status`, { status: newStatus });
      addToast(`Job ${newStatus === 'open' ? 'reopened' : 'closed'} successfully`, 'success');
      fetchJobs();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to update status', 'error');
    }
  };

  if (loading) return <div className="page container"><LoadingSpinner /></div>;

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">My Job Listings</h1>
            <p className="page-subtitle">Manage and track your posted jobs</p>
          </div>
          <Link to="/employer/jobs/new" className="btn btn-primary">+ Post New Job</Link>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-6)' }}>
          {['', 'open', 'closed', 'draft'].map((s) => (
            <button key={s}
              className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setStatusFilter(s)}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {jobs.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">No jobs posted yet</div>
            <Link to="/employer/jobs/new" className="btn btn-primary" style={{ marginTop: 16 }}>Post Your First Job</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {jobs.map((job) => (
              <div key={job.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{job.title}</h3>
                    <StatusBadge status={job.status} size="sm" />
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                    <span>📍 {job.location}</span>
                    <span>📋 {job.application_count || 0} applications</span>
                    <span>📅 {formatDate(job.created_at)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/employer/jobs/${job.id}/apps`} className="btn btn-secondary btn-sm">
                    Applications ({job.application_count || 0})
                  </Link>
                  <Link to={`/employer/jobs/${job.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                  <button
                    className={`btn btn-sm ${job.status === 'open' ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => toggleStatus(job.id, job.status)}
                  >
                    {job.status === 'open' ? 'Close' : 'Reopen'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
