import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

export default function CandidateProfile() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState({ name: '', phone: '', location: '', bio: '', skills: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumeInfo, setResumeInfo] = useState({ has_resume: false, resume_filename: '' });

  useEffect(() => {
    client.get('/api/profile').then((r) => {
      const d = r.data;
      setProfile({ name: d.name || '', phone: d.phone || '', location: d.location || '', bio: d.bio || '', skills: d.skills || '' });
      setResumeInfo({ has_resume: d.has_resume, resume_filename: d.resume_filename || '' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await client.put('/api/profile', profile);
      updateUser({ ...user, ...res.data });
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to update profile', 'error');
    } finally { setSaving(false); }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await client.post('/api/profile/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResumeInfo({ has_resume: true, resume_filename: res.data.filename });
      addToast('Resume uploaded successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to upload resume', 'error');
    } finally { setUploading(false); }
  };

  const handleDeleteResume = async () => {
    try {
      await client.delete('/api/profile/resume');
      setResumeInfo({ has_resume: false, resume_filename: '' });
      addToast('Resume deleted', 'info');
    } catch (err) {
      addToast('Failed to delete resume', 'error');
    }
  };

  if (loading) return <div className="page container"><LoadingSpinner /></div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="page-header">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Keep your profile updated to stand out</p>
        </div>

        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-6)' }}>Personal Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 234 567 890" />
              </div>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="City, Country" />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea rows={4} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell employers about yourself..." />
            </div>
            <div className="form-group">
              <label>Skills (comma-separated)</label>
              <input value={profile.skills} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} placeholder="React, Python, SQL, ..." />
            </div>
          </div>

          {/* Resume */}
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-6)' }}>Resume</h2>
            {resumeInfo.has_resume ? (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--space-4)', background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>📄 {resumeInfo.resume_filename}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Currently uploaded</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`${client.defaults.baseURL}/api/profile/resume/${user?.id}`}
                    target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">Download</a>
                  <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteResume}>Delete</button>
                </div>
              </div>
            ) : null}
            <div style={{
              border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-8)', textAlign: 'center', cursor: 'pointer',
              transition: 'border-color var(--transition-fast)',
            }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--border)';
                const f = e.dataTransfer.files[0];
                if (f) {
                  const input = document.getElementById('resume-upload');
                  const dt = new DataTransfer();
                  dt.items.add(f);
                  input.files = dt.files;
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }}
              onClick={() => document.getElementById('resume-upload').click()}
            >
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>{uploading ? '⏳' : '📤'}</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {uploading ? 'Uploading...' : 'Drop your resume here or click to browse'}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                PDF or DOCX, max 5MB
              </div>
              <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleResumeUpload} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ width: '100%' }}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
