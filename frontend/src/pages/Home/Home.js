import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { formatSalary, formatJobType, formatLocationType, timeAgo } from '../../utils/helpers';
import styles from './Home.module.css';

export default function Home() {
  const [stats, setStats] = useState({ open_jobs: 0, candidates: 0, employers: 0 });
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    client.get('/api/stats').then((r) => setStats(r.data)).catch(() => {});
    client.get('/api/jobs?limit=6&status=open').then((r) => setFeaturedJobs(r.data.jobs || [])).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/jobs?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Find Your <span className={styles.heroGradient}>Dream Job</span><br />
            Build Your Future
          </h1>
          <p className={styles.heroSubtitle}>
            Discover thousands of job opportunities from top companies.
            Apply with ease, track your progress, and land your next role.
          </p>
          <div className={styles.heroCta}>
            <Link to="/jobs" className="btn btn-primary btn-lg">Browse Jobs</Link>
            <Link to="/register" className="btn btn-secondary btn-lg">Get Started</Link>
          </div>

          {/* Search */}
          <div className={styles.searchSection}>
            <form className={styles.searchBox} onSubmit={handleSearch}>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search jobs by title, company, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className={`btn btn-primary ${styles.searchBtn}`}>
                Search
              </button>
            </form>
          </div>
        </section>

        {/* Stats */}
        <section className={styles.statsSection}>
          <div className="grid grid-4">
            {[
              { value: stats.open_jobs, label: 'Open Positions' },
              { value: stats.candidates, label: 'Candidates' },
              { value: stats.employers, label: 'Companies' },
              { value: stats.applications, label: 'Applications' },
            ].map((s, i) => (
              <div key={i} className="card stat-card" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="stat-value">{s.value || 0}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Jobs */}
        {featuredJobs.length > 0 && (
          <section className={styles.featuredSection}>
            <h2 className={styles.sectionTitle}>Featured Opportunities</h2>
            <div className={styles.jobsGrid}>
              {featuredJobs.map((job) => (
                <div
                  key={job.id}
                  className={`card card-highlight ${styles.jobCard}`}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className={styles.jobCardHeader}>
                    <div>
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      <p className={styles.jobCompany}>{job.company}</p>
                    </div>
                  </div>
                  <div className={styles.jobMeta}>
                    <span className="tag">📍 {job.location}</span>
                    <span className="tag">{formatLocationType(job.location_type)}</span>
                    <span className="tag">{formatJobType(job.job_type)}</span>
                    <span className="tag">{job.category}</span>
                  </div>
                  <div className={styles.jobSalary}>
                    {formatSalary(job.salary_min, job.salary_max)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    {timeAgo(job.created_at)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
              <Link to="/jobs" className="btn btn-secondary btn-lg">View All Jobs →</Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
