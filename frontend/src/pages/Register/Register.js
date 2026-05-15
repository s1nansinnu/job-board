import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import styles from '../Login/Login.module.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('candidate');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (role === 'employer' && !company.trim()) { setError('Company name is required for employers'); return; }
    setLoading(true);
    try {
      const user = await register(name, email, password, role, company);
      addToast(`Welcome, ${user.name}! Account created successfully.`, 'success');
      navigate(user.role === 'employer' ? '/employer/dashboard' : '/candidate/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Create Account</h1>
        <p className={styles.authSubtitle}>Join JobBoard today</p>

        {/* Role Tabs */}
        <div className={styles.roleTabs}>
          <button type="button" className={`${styles.roleTab} ${role === 'candidate' ? styles.roleTabActive : ''}`} onClick={() => setRole('candidate')}>
            🎯 Candidate
          </button>
          <button type="button" className={`${styles.roleTab} ${role === 'employer' ? styles.roleTabActive : ''}`} onClick={() => setRole('employer')}>
            🏢 Employer
          </button>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <input id="reg-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          {role === 'employer' && (
            <div className="form-group">
              <label htmlFor="reg-company">Company Name</label>
              <input id="reg-company" type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." required />
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-pass">Password</label>
              <input id="reg-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 chars" required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input id="reg-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm" required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className={styles.authFooter}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
