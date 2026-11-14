import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';
import Loading from '../components/Loading';
export default function AuthPage({ mode }) {
  const register = mode === 'register';
  const { user, loading, authenticate } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  if (loading) return <Loading />;
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setMessage(''); setErrors({});
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try { await authenticate(mode, fields); toast.success(register ? 'Your account is ready.' : 'Welcome back.'); }
    catch (error) { setMessage(errorMessage(error)); setErrors(Object.fromEntries((error.response?.data?.errors || []).map(item => [item.field, item.message]))); }
    finally { setBusy(false); }
  }
  const fields = [...(register ? [{ name: 'name', label: 'Name', type: 'text', autoComplete: 'name' }] : []), { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' }, { name: 'password', label: 'Password', type: 'password', autoComplete: register ? 'new-password' : 'current-password' }];
  return <section className="mx-auto max-w-md rounded-box border border-base-300 bg-base-100 p-7 shadow-sm">
    <h1 className="text-3xl font-bold">{register ? 'Create your account' : 'Welcome back'}</h1><p className="mb-6 mt-2 text-base-content/70">{register ? 'Start with a few simple details.' : 'Log in to your dashboard.'}</p>
    <form onSubmit={submit} className="space-y-4">
      {message && <p role="alert" className="text-sm text-error">{message}</p>}
      {fields.map(field => <div key={field.name}><label htmlFor={field.name} className="mb-1 block text-sm font-medium">{field.label}</label><input {...field} id={field.name} className="input input-bordered w-full" required disabled={busy} minLength={field.name === 'password' ? 8 : field.name === 'name' ? 2 : undefined} maxLength={field.name === 'name' ? 80 : field.name === 'email' ? 254 : undefined} aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? field.name + '-error' : field.name === 'password' && register ? 'password-help' : undefined} />{errors[field.name] && <p id={field.name + '-error'} className="mt-1 text-sm text-error">{errors[field.name]}</p>}</div>)}
      {register && <p id="password-help" className="text-xs text-base-content/70">Use at least 8 characters, up to 72 UTF-8 bytes. Some characters use multiple bytes.</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Log in'}</button>
    </form>
    <p className="mt-6 text-sm">{register ? 'Already have an account? ' : 'New here? '}<Link className="link link-primary" to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p>
  </section>;
}

