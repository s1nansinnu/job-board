import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { JOB_CATEGORIES } from '../../utils/helpers';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const EMPTY_JOB = {
  title: '', description: '', company: '', location: '',
  location_type: 'onsite', salary_min: '', salary_max: '', currency: 'USD',
  job_type: 'full_time', category: 'Engineering', requirements: '', benefits: '', status: 'open',
};

export default function EmployerJobForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ ...EMPTY_JOB, company: user?.company || '' });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      client.get(`/api/jobs/${id}`).then((r) => {
        const j = r.data;
        setForm({
          title: j.title || '', description: j.description || '', company: j.company || '',
          location: j.location || '', location_type: j.location_type || 'onsite',
          salary_min: j.salary_min || '', salary_max: j.salary_max || '', currency: j.currency || 'USD',
          job_type: j.job_type || 'full_time', category: j.category || 'Engineering',
          requirements: j.requirements || '', benefits: j.benefits || '', status: j.status || 'open',
        });
      }).catch(() => navigate('/employer/jobs'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, navigate]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      salary_min: form.salary_min ? parseInt(form.salary_min) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max) : null,
    };
    try {
      if (isEdit) {
        await client.put(`/api/jobs/${id}`, payload);
        addToast('Job updated successfully', 'success');
      } else {
        await client.post('/api/jobs', payload);
        addToast('Job posted successfully!', 'success');
      }
      navigate('/employer/jobs');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to save job', 'error');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="page container"><LoadingSpinner /></div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="page-header">
          <h1 className="page-title">{isEdit ? 'Edit Job' : 'Post a New Job'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update your job listing details' : 'Fill in the details to publish your job listing'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-6)' }}>Basic Information</h2>
            <div className="form-group">
              <label>Job Title *</label>
              <input value={form.title} onChange={handleChange('title')} placeholder="e.g. Senior Frontend Developer" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Company *</label>
                <input value={form.company} onChange={handleChange('company')} placeholder="Company name" required />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select value={form.category} onChange={handleChange('category')}>
                  {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Location *</label>
                <input value={form.location} onChange={handleChange('location')} placeholder="e.g. San Francisco, CA" required />
              </div>
              <div className="form-group">
                <label>Work Mode</label>
                <select value={form.location_type} onChange={handleChange('location_type')}>
                  <option value="onsite">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Job Type</label>
                <select value={form.job_type} onChange={handleChange('job_type')}>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={handleChange('status')}>
                  <option value="open">Open</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-6)' }}>Compensation</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Min Salary (Annual)</label>
                <input type="number" value={form.salary_min} onChange={handleChange('salary_min')} placeholder="e.g. 60000" />
              </div>
              <div className="form-group">
                <label>Max Salary (Annual)</label>
                <input type="number" value={form.salary_max} onChange={handleChange('salary_max')} placeholder="e.g. 90000" />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-6)' }}>Details</h2>
            <div className="form-group">
              <label>Job Description *</label>
              <textarea rows={8} value={form.description} onChange={handleChange('description')} placeholder="Describe the role, responsibilities, and what a typical day looks like..." required />
            </div>
            <div className="form-group">
              <label>Requirements</label>
              <textarea rows={5} value={form.requirements} onChange={handleChange('requirements')} placeholder="List the skills, experience, and qualifications needed..." />
            </div>
            <div className="form-group">
              <label>Benefits</label>
              <textarea rows={4} value={form.benefits} onChange={handleChange('benefits')} placeholder="Health insurance, remote work, stock options, etc..." />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Job' : 'Publish Job'}
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/employer/jobs')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
