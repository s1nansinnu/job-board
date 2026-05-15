import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Jobs from './pages/Jobs/Jobs';
import JobDetail from './pages/JobDetail/JobDetail';
import CandidateDashboard from './pages/CandidateDashboard/CandidateDashboard';
import CandidateProfile from './pages/CandidateProfile/CandidateProfile';
import CandidateApplications from './pages/CandidateApplications/CandidateApplications';
import EmployerDashboard from './pages/EmployerDashboard/EmployerDashboard';
import EmployerJobs from './pages/EmployerJobs/EmployerJobs';
import EmployerJobForm from './pages/EmployerJobForm/EmployerJobForm';
import EmployerApplications from './pages/EmployerApplications/EmployerApplications';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />

        {/* Candidate Routes */}
        <Route path="/candidate/dashboard" element={
          <ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute>
        } />
        <Route path="/candidate/profile" element={
          <ProtectedRoute role="candidate"><CandidateProfile /></ProtectedRoute>
        } />
        <Route path="/candidate/applications" element={
          <ProtectedRoute role="candidate"><CandidateApplications /></ProtectedRoute>
        } />

        {/* Employer Routes */}
        <Route path="/employer/dashboard" element={
          <ProtectedRoute role="employer"><EmployerDashboard /></ProtectedRoute>
        } />
        <Route path="/employer/jobs" element={
          <ProtectedRoute role="employer"><EmployerJobs /></ProtectedRoute>
        } />
        <Route path="/employer/jobs/new" element={
          <ProtectedRoute role="employer"><EmployerJobForm /></ProtectedRoute>
        } />
        <Route path="/employer/jobs/:id/edit" element={
          <ProtectedRoute role="employer"><EmployerJobForm /></ProtectedRoute>
        } />
        <Route path="/employer/jobs/:id/apps" element={
          <ProtectedRoute role="employer"><EmployerApplications /></ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default App;
