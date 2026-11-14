import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';
export default function Layout() {
  const { user, loading, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function handleLogout() {
    setBusy(true);
    try { await logout(); toast.success('Signed out.'); navigate('/'); }
    catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-base-200 text-base-content">
    <a className="sr-only focus:not-sr-only" href="#main">Skip to content</a>
    <header className="border-b border-base-300 bg-base-100"><nav aria-label="Main navigation" className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
      <Link to="/" className="text-lg font-bold">MERN Starter</Link>
      {!loading && <div className="flex items-center gap-2">{user ? <><Link className="btn btn-ghost btn-sm" to="/dashboard">Dashboard</Link><button className="btn btn-outline btn-sm" onClick={handleLogout} disabled={busy}>{busy ? 'Signing out…' : 'Log out'}</button></> : <><Link className="btn btn-ghost btn-sm" to="/login">Log in</Link><Link className="btn btn-primary btn-sm" to="/register">Get started</Link></>}</div>}
    </nav></header>
    <main id="main" className="mx-auto max-w-5xl px-5 py-12"><Outlet /></main>
    <footer className="mx-auto max-w-5xl px-5 py-8 text-center text-sm text-base-content/60">MERN Template · Felipe Vanegas Gil</footer>
  </div>;
}

