import React from 'react';
import { useAuth } from '../context/AuthContext';
export default function Dashboard() {
  const { user } = useAuth();
  return <section><span className="badge badge-success mb-4">Signed in</span><h1 className="text-3xl font-bold">Welcome, {user.name}.</h1><p className="mt-3 text-base-content/70">View the profile details associated with your account.</p><div className="mt-8 max-w-xl rounded-box border border-base-300 bg-base-100 p-6"><h2 className="text-lg font-semibold">Your account</h2><dl className="mt-4 space-y-4"><div><dt className="text-sm text-base-content/60">Name</dt><dd className="break-words">{user.name}</dd></div><div><dt className="text-sm text-base-content/60">Email</dt><dd className="break-all">{user.email}</dd></div></dl></div></section>;
}

