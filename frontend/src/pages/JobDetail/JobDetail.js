import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatSalary, formatJobType, formatLocationType, formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import Modal from '../../components/Modal/Modal';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await client.get(`/api/jobs/${id}`);
        setJob(res.data);
      } catch { navigate('/jobs'); }
      finally { setLoading(false); }
    };
    fetchJob();
    // Check if already applied
    if (user?.role === 'candidate') {
      client.get('/api/applications', { params: { page: 1, limit: 100 } })
        .then((res) => {
          const apps = res.data.applications || [];
          if (apps.some((a) => a.job_id === parseInt(id))) setHasApplied(true);
        }).catch(() => {});
    }
  }, [id, navigate, user]);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      await client.post('/api/applications', { job_id: parseInt(id), cover_letter: coverLetter });
      addToast('Application submitted successfully!', 'success');
      setShowApply(false);
      setHasApplied(true);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to apply', 'error');
    } finally { setApplying(false); }
  };

  if (loading) return <div className="page container"><LoadingSpinner /></div>;
  if (!job) return null;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 900 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/jobs')} style={{ marginBottom: 'var(--space-4)' }}>
          ← Back to Jobs
        </button>

        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, marginBottom: 4 }}>{job.title}</h1>
              <p style={{ color: 'var(--accent-tertiary)', fontSize: 'var(--font-size-lg)', marginBottom: 16 }}>{job.company}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span className="tag">📍 {job.location}</span>
                <span className="tag">{formatLocationType(job.location_type)}</span>
                <span className="tag">{formatJobType(job.job_type)}</span>
                <span className="tag">{job.category}</span>
                <StatusBadge status={job.status} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--success)', marginBottom: 8 }}>
                {formatSalary(job.salary_min, job.salary_max)}
              </div>
              {user?.role === 'candidate' && job.status === 'open' && (
                hasApplied ? (
                  <span className="btn btn-secondary" style={{ opacity: 0.7, cursor: 'default' }}>✓ Applied</span>
                ) : (
                  <button className="btn btn-primary btn-lg" onClick={() => setShowApply(true)}>Apply Now</button>
                )
              )}
              {!user && job.status === 'open' && (
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>Login to Apply</button>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-6)' }}>
          <div>
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 16 }}>Description</h2>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{job.description}</div>
            </div>

            {job.requirements && (
              <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 16 }}>Requirements</h2>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{job.requirements}</div>
              </div>
            )}

            {job.benefits && (
              <div className="card">
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 16 }}>Benefits</h2>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{job.benefits}</div>
              </div>
            )}
          </div>

          <div>
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Job Details</h3>
              {[
                ['Posted', formatDate(job.created_at)],
                ['Type', formatJobType(job.job_type)],
                ['Location', job.location],
                ['Work Mode', formatLocationType(job.location_type)],
                ['Category', job.category],
                ['Applications', `${job.application_count || 0}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 'var(--font-size-sm)' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Modal */}
        <Modal isOpen={showApply} onClose={() => setShowApply(false)} title={`Apply for ${job.title}`}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--font-size-sm)' }}>
            at {job.company} • {job.location}
          </p>
          <form onSubmit={handleApply}>
            <div className="form-group">
              <label>Cover Letter (optional)</label>
              <textarea
                rows={6}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell the employer why you're a great fit for this role..."
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={applying}>
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowApply(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
