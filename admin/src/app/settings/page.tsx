'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { API_BASE_URL, LOCAL_STORAGE_TOKEN_KEY, APP_TITLE } from '@/constants';

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface SyncResult {
  synced_count: number;
  total_clerk_users: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState('');
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [loadingLastSync, setLoadingLastSync] = useState(true);

  const [pkrPerToken, setPkrPerToken] = useState<number | string>(10);
  const [savingRate, setSavingRate] = useState(false);
  const [rateError, setRateError] = useState('');
  const [rateSuccess, setRateSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setPkrPerToken(data.pkr_per_token);
    } catch {}
  }, []);

  const fetchLastSync = useCallback(async () => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const users = data.users || [];
      if (users.length > 0) {
        const latest = users.reduce((max: string, u: { last_sync_at?: string }) => {
          if (!u.last_sync_at) return max;
          return u.last_sync_at > max ? u.last_sync_at : max;
        }, '');
        setLastSyncDate(latest || null);
      }
    } catch {} finally {
      setLoadingLastSync(false);
    }
  }, []);

  useEffect(() => {
    document.title = `Settings — ${APP_TITLE}`;
    fetchLastSync();
    fetchSettings();
  }, [fetchLastSync, fetchSettings]);

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) {
      router.replace('/');
      return;
    }
    setSavingRate(true);
    setRateError('');
    setRateSuccess(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pkr_per_token: Number(pkrPerToken) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setRateError(data?.detail || 'Failed to update token rate');
        return;
      }
      setRateSuccess(true);
      setTimeout(() => setRateSuccess(false), 2000);
    } catch {
      setRateError('Unable to connect to the server');
    } finally {
      setSavingRate(false);
    }
  };

  const handleSync = async () => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) {
      router.replace('/');
      return;
    }

    setSyncStatus('loading');
    setSyncError('');
    setSyncResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
        router.replace('/');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSyncError(data?.detail || 'Sync failed');
        setSyncStatus('error');
        return;
      }

      const data = await res.json();
      setSyncResult(data);
      setSyncStatus('success');
      setLastSyncDate(new Date().toISOString());
    } catch {
      setSyncError('Unable to connect to the server');
      setSyncStatus('error');
    }
  };


  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight text-ink">Settings</h1>
          <p className="text-sm text-ink-subtle mt-0.5">
            Manage admin panel configuration
          </p>
        </div>

        <div className="bg-surface-1 border border-hairline rounded-lg p-6 max-w-xl mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-primary">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 6h8M4 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-ink font-sans">Token Conversion Rate</h2>
              <p className="text-sm text-ink-subtle mt-1 leading-relaxed">
                Set the PKR value of a single token. When approving payments, the system converts the received PKR amount into tokens using this conversion rate.
              </p>
              
              <form onSubmit={handleSaveRate} className="mt-4 flex flex-col sm:flex-row gap-3">
                <div className="flex items-center rounded-md border border-hairline bg-surface-2 focus-within:border-hairline-strong transition-colors px-3 py-1.5 flex-1 max-w-[200px]">
                  <input
                    type="number"
                    step="any"
                    value={pkrPerToken}
                    onChange={(e) => setPkrPerToken(e.target.value)}
                    className="text-xs font-mono font-medium text-ink bg-transparent border-none outline-none focus:ring-0 w-full"
                    placeholder="Rate in PKR"
                    required
                  />
                  <span className="text-[10px] font-mono text-ink-subtle uppercase select-none">PKR</span>
                </div>
                
                <button
                  type="submit"
                  disabled={savingRate}
                  className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  {savingRate ? 'Saving…' : 'Save Rate'}
                </button>
              </form>
              
              {rateSuccess && (
                <p className="text-xs text-semantic-success mt-2 font-medium">Conversion rate updated successfully!</p>
              )}
              {rateError && (
                <p className="text-xs text-semantic-error mt-2 font-medium">{rateError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-surface-1 border border-hairline rounded-lg p-6 max-w-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M2 8a6 6 0 0110.47-4M14 8a6 6 0 01-10.47 4" stroke="#5e6ad2" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M13 1v3h-3M3 15v-3h3" stroke="#5e6ad2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-ink">Sync Clerk Users</h2>
              <p className="text-sm text-ink-subtle mt-1 leading-relaxed">
                Manually trigger a full sync of all users from Clerk to the local MongoDB database.
                This will fetch every user from Clerk and upsert them into the local collection.
              </p>

              {loadingLastSync ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-ink-tertiary">
                  <span className="w-3 h-3 border border-ink-tertiary border-t-transparent rounded-full animate-spin-slow" />
                  Loading sync info…
                </div>
              ) : lastSyncDate ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-ink-subtle">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Last synced: {new Date(lastSyncDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(lastSyncDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              ) : (
                <div className="mt-3 text-xs text-ink-tertiary">
                  No sync has been performed yet
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={handleSync}
                  disabled={syncStatus === 'loading'}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncStatus === 'loading' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                      Syncing…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8a6 6 0 0110.47-4M14 8a6 6 0 01-10.47 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M13 1v3h-3M3 15v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Trigger Sync
                    </>
                  )}
                </button>
              </div>

              {syncStatus === 'success' && syncResult && (
                <div className="mt-4 bg-[#27a6441a] border border-[#27a64433] rounded-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 8.5l3 3 5-6" stroke="#27a644" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-sm font-medium text-semantic-success">Sync completed</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div className="bg-surface-2 rounded-md px-3 py-2">
                      <p className="text-xs text-ink-subtle">Users synced</p>
                      <p className="text-lg font-semibold text-ink mt-0.5">{syncResult.synced_count}</p>
                    </div>
                    <div className="bg-surface-2 rounded-md px-3 py-2">
                      <p className="text-xs text-ink-subtle">Total in Clerk</p>
                      <p className="text-lg font-semibold text-ink mt-0.5">{syncResult.total_clerk_users}</p>
                    </div>
                  </div>
                </div>
              )}

              {syncStatus === 'error' && (
                <div className="mt-4 bg-[#e5484d1a] border border-[#e5484d33] rounded-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="#e5484d" strokeWidth="1.5"/>
                      <path d="M8 5v3M8 10.5v.5" stroke="#e5484d" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span className="text-sm font-medium text-semantic-error">Sync failed</span>
                  </div>
                  <p className="text-sm text-ink-subtle mt-1">{syncError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
