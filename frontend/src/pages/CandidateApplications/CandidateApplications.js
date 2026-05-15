import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { formatDate, timeAgo } from '../../utils/helpers';

const STATUSES = ['all', 'applied', 'reviewing', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn'];

export default function CandidateApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const params = { limit: 50 };
    if (filter !== 'all') params.status = filter;
    client.get('/api/applications', { params })
      .then((r) => setApps(r.data.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const viewDetail = async (id) => {
    try {
      const res = await client.get(`/api/applications/${id}`);
      setSelected(res.data);
      setHistory(res.data.status_history || []);
    } catch { }
  };

  if (loading) return <div className="page container"><LoadingSpinner /></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">My Applications</h1>
          <p className="page-subtitle">Track the status of all your job applications</p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
          {STATUSES.map((s) => (
            <button key={s}
              className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => { setFilter(s); setSelected(null); }}
              style={{ textTransform: 'capitalize' }}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 'var(--space-6)' }}>
          {/* Application List */}
          <div>
            {apps.length === 0 ? (
              <div className="card empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-title">No applications found</div>
                <Link to="/jobs" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Jobs</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {apps.map((app) => (
                  <div key={app.id}
                    className="card"
                    style={{
                      cursor: 'pointer',
                      borderColor: selected?.id === app.id ? 'var(--accent-primary)' : undefined,
                    }}
                    onClick={() => viewDetail(app.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{app.job_title}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                          {app.job_company} • {app.job_location}
                        </div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)', marginTop: 4 }}>
                          Applied {timeAgo(app.created_at)}
                        </div>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="card" style={{ position: 'sticky', top: 'calc(var(--navbar-height) + var(--space-8))', height: 'fit-content' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{selected.job_title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 16 }}>{selected.job_company}</p>
              <div style={{ marginBottom: 16 }}><StatusBadge status={selected.status} size="lg" /></div>

              {selected.cover_letter && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 4 }}>Cover Letter</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', whiteSpace: 'pre-wrap' }}>{selected.cover_letter}</div>
                </div>
              )}

              <hr className="divider" />
              <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Status Timeline</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{
                      width: 8, minHeight: 8, borderRadius: 4,
                      background: i === history.length - 1 ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      flexShrink: 0, marginTop: 6,
                    }} />
                    <div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                        <StatusBadge status={h.to_status} size="sm" />
                      </div>
                      {h.note && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{h.note}</div>}
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>{formatDate(h.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link to={`/jobs/${selected.job_id}`} className="btn btn-secondary btn-sm" style={{ marginTop: 16, width: '100%' }}>
                View Job Listing
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
