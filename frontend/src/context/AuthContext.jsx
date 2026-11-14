import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { api, errorMessage, sessionChanged } from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [expiresAt, setExpiresAt] = useState(0);
  const version = useRef(0);
  const channel = useRef(null);
  const clear = useCallback(() => {
    version.current++; sessionChanged(); setUser(null); setExpiresAt(0); setSessionError(''); setLoading(false);
  }, []);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    try {
      const { data } = await api.get('/auth/me');
      if (request !== version.current) return;
      setUser(data.user); setExpiresAt(data.sessionExpiresAt); setSessionError('');
    } catch (error) {
      if (request !== version.current) return;
      if (error.response?.status === 401) clear(); else setSessionError(errorMessage(error));
    } finally { if (request === version.current) setLoading(false); }
  }, [clear]);
  useEffect(() => {
    void refresh();
    const focus = () => { void refresh(); };
    window.addEventListener('focus', focus);
    window.addEventListener('session-expired', clear);
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('mern-session');
      channel.current.onmessage = () => { clear(); void refresh(); };
    }
    return () => { version.current++; channel.current?.close(); channel.current = null; window.removeEventListener('focus', focus); window.removeEventListener('session-expired', clear); };
  }, [refresh, clear]);
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(clear, Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt, clear]);
  async function authenticate(action, fields) {
    const request = ++version.current;
    const { data } = await api.post('/auth/' + action, fields);
    if (request !== version.current) { await refresh(); return; }
    sessionChanged(); setUser(data.user); setExpiresAt(data.sessionExpiresAt); setSessionError(''); setLoading(false);
    channel.current?.postMessage('changed');
  }
  async function logout() { version.current++; await api.post('/auth/logout'); clear(); channel.current?.postMessage('changed'); }
  return <AuthContext.Provider value={{ user, loading, sessionError, authenticate, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
