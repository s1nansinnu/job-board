import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client from '../../api/client';
import { formatSalary, formatJobType, formatLocationType, timeAgo, JOB_CATEGORIES } from '../../utils/helpers';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import styles from './Jobs.module.css';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const location = searchParams.get('location') || '';
  const jobType = searchParams.get('job_type') || '';
  const locationType = searchParams.get('location_type') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [searchInput, setSearchInput] = useState(search);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, status: 'open' };
      if (search) params.search = search;
      if (category) params.category = category;
      if (location) params.location = location;
      if (jobType) params.job_type = jobType;
      if (locationType) params.location_type = locationType;
      const res = await client.get('/api/jobs', { params });
      setJobs(res.data.jobs || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, location, jobType, locationType, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilter('search', searchInput);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Browse Jobs</h1>
          <p className="page-subtitle">Discover opportunities that match your skills</p>
        </div>

        <div className={styles.jobsPage}>
          {/* Sidebar Filters */}
          <aside className={styles.sidebar}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700 }}>Filters</h3>
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear</button>
              </div>

              {/* Category */}
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Category</span>
                <div className={styles.filterOptions}>
                  {JOB_CATEGORIES.slice(0, 8).map((cat) => (
                    <button key={cat}
                      className={`${styles.filterOption} ${category === cat ? styles.filterOptionActive : ''}`}
                      onClick={() => updateFilter('category', category === cat ? '' : cat)}
                    >{cat}</button>
                  ))}
                </div>
              </div>

              {/* Job Type */}
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Job Type</span>
                <div className={styles.filterOptions}>
                  {['full_time', 'part_time', 'contract', 'internship'].map((t) => (
                    <button key={t}
                      className={`${styles.filterOption} ${jobType === t ? styles.filterOptionActive : ''}`}
                      onClick={() => updateFilter('job_type', jobType === t ? '' : t)}
                    >{formatJobType(t)}</button>
                  ))}
                </div>
              </div>

              {/* Location Type */}
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Work Mode</span>
                <div className={styles.filterOptions}>
                  {['onsite', 'remote', 'hybrid'].map((t) => (
                    <button key={t}
                      className={`${styles.filterOption} ${locationType === t ? styles.filterOptionActive : ''}`}
                      onClick={() => updateFilter('location_type', locationType === t ? '' : t)}
                    >{formatLocationType(t)}</button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className={styles.mainContent}>
            <form className={styles.searchRow} onSubmit={handleSearch}>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search by title, company, or keyword..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>

            <div className={styles.resultsInfo}>
              <span>{total} job{total !== 1 ? 's' : ''} found</span>
              {(search || category || jobType || locationType) && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear all filters</button>
              )}
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : jobs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No jobs found</div>
                <p>Try adjusting your filters or search terms</p>
                <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={clearFilters}>Clear Filters</button>
              </div>
            ) : (
              <>
                <div className={styles.jobsGrid}>
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="card card-highlight"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 4 }}>{job.title}</h3>
                      <p style={{ color: 'var(--accent-tertiary)', fontSize: 'var(--font-size-sm)', marginBottom: 12 }}>{job.company}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        <span className="tag">📍 {job.location}</span>
                        <span className="tag">{formatLocationType(job.location_type)}</span>
                        <span className="tag">{formatJobType(job.job_type)}</span>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--success)' }}>
                        {formatSalary(job.salary_min, job.salary_max)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                        <span>{timeAgo(job.created_at)}</span>
                        <span>{job.application_count || 0} applicant{job.application_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className={styles.pagination}>
                    <button className={styles.pageNum} disabled={page <= 1}
                      onClick={() => updateFilter('page', String(page - 1))}>← Prev</button>
                    {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
                      <button key={p}
                        className={`${styles.pageNum} ${p === page ? styles.pageNumActive : ''}`}
                        onClick={() => updateFilter('page', String(p))}
                      >{p}</button>
                    ))}
                    <button className={styles.pageNum} disabled={page >= pages}
                      onClick={() => updateFilter('page', String(page + 1))}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
