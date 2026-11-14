import React from 'react';
import { Link } from 'react-router-dom';
export default function NotFound() { return <section className="py-16 text-center"><p className="text-sm font-bold text-primary">404</p><h1 className="mt-3 text-3xl font-bold">Page not found</h1><p className="my-5">The page you requested does not exist.</p><Link className="btn btn-primary" to="/">Back to home</Link></section>; }

