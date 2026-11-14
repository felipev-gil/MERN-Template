import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function Home() {
  const { user } = useAuth();
  return <section className="py-10 sm:py-20">
    <span className="badge badge-outline mb-5">MERN TEMPLATE</span>
    <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-6xl">Your account.<br />One place to sign in.</h1>
    <p className="mt-6 max-w-xl text-lg text-base-content/70">Create an account, sign in, and view your profile from a personal dashboard.</p>
    <div className="mt-8 flex flex-wrap gap-3"><Link className="btn btn-primary" to={user ? '/dashboard' : '/register'}>{user ? 'Open dashboard' : 'Create an account'}</Link>{!user && <Link className="btn btn-outline" to="/login">Log in</Link>}</div>
    <div className="mt-16 grid gap-4 sm:grid-cols-3">{[['Create an account', 'Register with your name, email, and password.'], ['View your profile', 'See your account details in your dashboard.'], ['Pick up where you left off', 'Stay signed in when you refresh, and log out when you are done.']].map(([title, description]) => <article key={title} className="rounded-box border border-base-300 bg-base-100 p-6"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-base-content/70">{description}</p></article>)}</div>
  </section>;
}

