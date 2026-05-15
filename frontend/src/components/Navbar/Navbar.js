import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const candidateLinks = [
    { path: '/jobs', label: 'Browse Jobs' },
    { path: '/candidate/dashboard', label: 'Dashboard' },
    { path: '/candidate/applications', label: 'My Applications' },
    { path: '/candidate/profile', label: 'Profile' },
  ];

  const employerLinks = [
    { path: '/jobs', label: 'Browse Jobs' },
    { path: '/employer/dashboard', label: 'Dashboard' },
    { path: '/employer/jobs', label: 'My Listings' },
    { path: '/employer/jobs/new', label: '+ Post Job' },
  ];

  const links = user?.role === 'employer' ? employerLinks : user ? candidateLinks : [{ path: '/jobs', label: 'Browse Jobs' }];

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to="/" className={styles.logo}>JobBoard</Link>

        <div className={`${styles.navLinks} ${mobileOpen ? styles.navLinksOpen : ''}`}>
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`${styles.navLink} ${isActive(link.path) ? styles.navLinkActive : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className={styles.navActions}>
          {user ? (
            <>
              <div className={styles.userBadge}>
                <div className={styles.userAvatar}>
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <span>{user.name}</span>
                <span className={styles.roleBadge}>{user.role}</span>
              </div>
              <button onClick={logout} className="btn btn-ghost btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
          <button
            className={styles.mobileToggle}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </nav>
  );
}
