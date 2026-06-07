'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, LOCAL_STORAGE_TOKEN_KEY, APP_TITLE } from '@/constants';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    document.title = `Login — ${APP_TITLE}`;
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (token) {
      router.replace('/users');
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.detail || 'Invalid credentials');
        return;
      }

      const data = await res.json();
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, data.token);
      router.replace('/users');
    } catch {
      setError('Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin-slow" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-canvas px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h12M3 18h15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{APP_TITLE}</h1>
          <p className="text-sm text-ink-subtle mt-1">Sign in to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-1 border border-hairline rounded-lg p-6 space-y-4"
        >
          {error && (
            <div className="bg-[#e5484d1a] border border-[#e5484d33] rounded-md px-3 py-2.5 text-sm text-semantic-error">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="block text-xs font-medium text-ink-subtle">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@fieldflow.dev"
              autoComplete="email"
              className="w-full bg-surface-2 border border-hairline rounded-md px-3 py-2 text-sm text-ink placeholder-ink-tertiary outline-none focus:border-primary-focus focus:ring-1 focus:ring-primary-focus transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="block text-xs font-medium text-ink-subtle">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-surface-2 border border-hairline rounded-md px-3 py-2 text-sm text-ink placeholder-ink-tertiary outline-none focus:border-primary-focus focus:ring-1 focus:ring-primary-focus transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                Signing in…
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-ink-tertiary mt-6">
          FieldFlow PDF Editor — Admin Panel
        </p>
      </div>
    </div>
  );
}
