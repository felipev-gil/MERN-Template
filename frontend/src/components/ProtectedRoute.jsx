import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';
export default function ProtectedRoute() {
  const { user, loading, sessionError } = useAuth();
  if (loading) return <Loading />;
  if (sessionError) return <div role="alert" className="alert alert-error flex flex-wrap"><span>{sessionError}</span><button className="btn btn-sm" onClick={() => window.location.reload()}>Retry</button></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

