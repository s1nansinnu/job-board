import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page container"><div className="skeleton" style={{ height: 200 }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
