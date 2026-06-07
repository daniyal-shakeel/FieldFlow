'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { API_BASE_URL, LOCAL_STORAGE_TOKEN_KEY, APP_TITLE } from '@/constants';
import { X } from 'lucide-react';


interface ExternalAccount {
  provider: string;
  provider_user_id: string;
  email_address: string | null;
}

interface User {
  _id: string;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  auth_methods: string[];
  external_accounts: ExternalAccount[];
  created_at: string;
  updated_at: string;
  last_sync_at: string;
  tokens_balance?: number;
  uploads_count?: number;
  exports_count?: number;
  avg_rating?: number | null;
  ratings?: { rating: number; comment: string; timestamp: string }[];
}



export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [awardAmount, setAwardAmount] = useState('');
  const [awardComment, setAwardComment] = useState('');
  const [submittingAward, setSubmittingAward] = useState(false);
  const [awardError, setAwardError] = useState('');
  const [awardSuccess, setAwardSuccess] = useState('');
  const [ratingsUser, setRatingsUser] = useState<User | null>(null);

  const handleAwardClick = (user: User) => {

    setSelectedUser(user);
    setAwardAmount('');
    setAwardComment('');
    setAwardError('');
    setAwardSuccess('');
    document.title = `Award Credits to ${user.first_name || user.email} — ${APP_TITLE}`;
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    document.title = `Users — ${APP_TITLE}`;
  };

  const handleViewRatings = (user: User) => {
    setRatingsUser(user);
    document.title = `Feedback for ${user.first_name || user.email} — ${APP_TITLE}`;
  };

  const handleCloseRatingsModal = () => {
    setRatingsUser(null);
    document.title = `Users — ${APP_TITLE}`;
  };


  const handleSubmitAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const amountNum = parseFloat(awardAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setAwardError('Please enter a valid amount greater than 0');
      return;
    }
    if (!awardComment.trim()) {
      setAwardError('Please enter a comment/reason');
      return;
    }

    setSubmittingAward(true);
    setAwardError('');
    setAwardSuccess('');

    try {
      const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
      if (!token) {
        router.replace('/');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/admin/users/${selectedUser.clerk_id}/grant-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amountNum,
          comment: awardComment.trim()
        })
      });

      if (res.status === 401) {
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
        router.replace('/');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setAwardError(data.detail || 'Failed to award credits');
      } else {
        setAwardSuccess(`Successfully awarded ${amountNum} credits!`);
        setUsers(prev => prev.map(u => u.clerk_id === selectedUser.clerk_id ? { ...u, tokens_balance: data.new_balance } : u));
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      }
    } catch {
      setAwardError('Connection error');
    } finally {
      setSubmittingAward(false);
    }
  };

  const fetchUsers = useCallback(async () => {

    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) {
      router.replace('/');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
        router.replace('/');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.detail || 'Failed to fetch users');
        return;
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError('Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    document.title = `Users — ${APP_TITLE}`;
    fetchUsers();
  }, [fetchUsers]);

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getAuthBadgeColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'email':
        return 'bg-primary/15 text-primary-hover border-primary/20';
      case 'oauth_google':
        return 'bg-[#4285f41a] text-[#8ab4f8] border-[#4285f433]';
      case 'oauth_facebook':
        return 'bg-[#1877f21a] text-[#6cb4ff] border-[#1877f233]';
      default:
        return 'bg-surface-3 text-ink-subtle border-hairline';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Users</h1>
            <p className="text-sm text-ink-subtle mt-0.5">
              {loading ? 'Loading…' : `${users.length} user${users.length !== 1 ? 's' : ''} synced from Clerk`}
            </p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-ink-subtle bg-surface-1 border border-hairline rounded-md hover:text-ink hover:bg-surface-2 transition-colors disabled:opacity-50"
          >
            <svg className={loading ? 'animate-spin-slow' : ''} width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 8a6 6 0 0110.47-4M14 8a6 6 0 01-10.47 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M13 1v3h-3M3 15v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-[#e5484d1a] border border-[#e5484d33] rounded-md px-4 py-3 text-sm text-semantic-error mb-6">
            {error}
          </div>
        )}

        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin-slow" />
          </div>
        ) : users.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-24 text-ink-subtle">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-3 opacity-40">
              <path d="M12 12a5 5 0 100-10 5 5 0 000 10zM3 21c0-3.87 4.03-7 9-7s9 3.13 9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hairline bg-surface-2">
                    <th className="text-left px-4 py-3 text-xs font-medium text-ink-subtle tracking-wide uppercase">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-ink-subtle tracking-wide uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-ink-subtle tracking-wide uppercase">Auth Methods</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-ink-subtle tracking-wide uppercase">External Accounts</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-ink-subtle tracking-wide uppercase">Tokens</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-ink-subtle tracking-wide uppercase">Uploads</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-ink-subtle tracking-wide uppercase">Exports</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-ink-subtle tracking-wide uppercase">Rating</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-ink-subtle tracking-wide uppercase">Created</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-ink-subtle tracking-wide uppercase">Last Sync</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-ink-subtle tracking-wide uppercase">Actions</th>
                  </tr>

                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-hairline last:border-b-0 hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3">
                        <div 
                          onClick={() => router.push(`/users/${user.clerk_id}`)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          {user.image_url ? (
                            <img
                              src={user.image_url}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0 group-hover:opacity-85 transition-opacity"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0 group-hover:bg-surface-4 transition-colors">
                              <span className="text-xs font-medium text-ink-subtle">
                                {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="font-medium text-ink whitespace-nowrap group-hover:text-primary group-hover:underline transition-colors">
                            {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'User'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{user.email || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {user.auth_methods.length > 0 ? (
                            user.auth_methods.map((method) => (
                              <span
                                key={method}
                                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getAuthBadgeColor(method)}`}
                              >
                                {method.replace('oauth_', '')}
                              </span>
                            ))
                          ) : (
                            <span className="text-ink-tertiary">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {user.external_accounts.length > 0 ? (
                            user.external_accounts.map((acc, i) => (
                              <span
                                key={i}
                                className="inline-flex px-2 py-0.5 rounded text-xs bg-surface-3 text-ink-subtle border border-hairline"
                              >
                                {acc.provider.replace('oauth_', '')}
                                {acc.email_address ? ` (${acc.email_address})` : ''}
                              </span>
                            ))
                          ) : (
                            <span className="text-ink-tertiary">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink font-mono font-medium whitespace-nowrap">
                        {user.tokens_balance !== undefined ? user.tokens_balance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '0.0'}
                      </td>
                      <td className="px-4 py-3 text-ink font-mono whitespace-nowrap text-xs">
                        {user.uploads_count || 0}
                      </td>
                      <td className="px-4 py-3 text-ink font-mono whitespace-nowrap text-xs">
                        {user.exports_count || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {user.avg_rating ? (
                          <button
                            onClick={() => handleViewRatings(user)}
                            className="inline-flex items-center gap-1 text-amber-400 hover:underline font-semibold cursor-pointer border-none bg-transparent"
                          >
                            ★ {user.avg_rating} ({user.ratings?.length || 0})
                          </button>
                        ) : (
                          <span className="text-ink-tertiary font-mono">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-subtle whitespace-nowrap text-xs">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3 text-ink-subtle whitespace-nowrap text-xs">{formatDate(user.last_sync_at)}</td>

                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => router.push(`/users/${user.clerk_id}`)}
                          className="px-2.5 py-1 text-xs font-semibold text-ink-subtle hover:text-ink bg-surface-2 hover:bg-surface-3 border border-hairline hover:border-hairline-strong rounded transition-all cursor-pointer"
                        >
                          Monitor
                        </button>
                        <button
                          onClick={() => handleAwardClick(user)}
                          className="px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 rounded transition-all cursor-pointer"
                        >
                          Award Credits
                        </button>
                      </td>
                    </tr>

                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-1 border border-hairline rounded-lg max-w-md w-full flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink">Award Free Credits</span>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-surface-3 rounded text-ink-subtle hover:text-ink transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAward} className="p-6 space-y-4">
              {awardError && (
                <div className="bg-[#e5484d1a] border border-[#e5484d33] rounded px-3 py-2 text-xs text-semantic-error">
                  {awardError}
                </div>
              )}
              {awardSuccess && (
                <div className="bg-[#27a6441a] border border-[#27a64433] rounded px-3 py-2 text-xs text-semantic-success">
                  {awardSuccess}
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-mono text-ink-subtle block">Target User</span>
                <span className="text-xs font-semibold text-ink truncate block mt-0.5">
                  {[selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(' ') || 'User'} ({selectedUser.email})
                </span>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-ink-subtle block mb-1.5">Credit Amount (Tokens)</label>
                <div className="flex items-center rounded-md border border-hairline bg-surface-2 focus-within:border-primary/40 px-3 py-2 transition-all">
                  <input
                    type="number"
                    value={awardAmount}
                    onChange={(e) => setAwardAmount(e.target.value)}
                    placeholder="0.0"
                    step="any"
                    min="0.01"
                    required
                    className="text-xs font-mono font-medium text-ink bg-transparent border-none outline-none focus:ring-0 w-full"
                  />
                  <span className="text-[10px] font-mono text-ink-subtle uppercase select-none">Tokens</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-ink-subtle block mb-1.5">Reason / Comment</label>
                <textarea
                  value={awardComment}
                  onChange={(e) => setAwardComment(e.target.value)}
                  placeholder="e.g., Promotion reward, compensation, etc."
                  required
                  rows={3}
                  className="text-xs text-ink bg-surface-2 border border-hairline rounded-md focus:border-primary/40 px-3 py-2 outline-none w-full resize-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submittingAward}
                  className="px-4 py-2 flex-1 border border-hairline bg-surface-2 hover:bg-surface-3 text-ink-subtle hover:text-ink text-xs font-semibold uppercase tracking-wider rounded transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAward || !awardAmount || !awardComment.trim()}
                  className="px-4 py-2 flex-1 bg-primary hover:bg-primary-hover text-white text-xs font-semibold uppercase tracking-wider rounded transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submittingAward && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />}
                  Award Credits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ratingsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-1 border border-hairline rounded-lg max-w-lg w-full flex flex-col shadow-2xl overflow-hidden animate-slide-up max-h-[80vh]">
            <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink">User Feedback & Reviews</span>
              <button
                onClick={handleCloseRatingsModal}
                className="p-1 hover:bg-surface-3 rounded text-ink-subtle hover:text-ink transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1 min-h-0">
              <div>
                <span className="text-[10px] uppercase font-mono text-ink-subtle block">Feedback Provider</span>
                <span className="text-xs font-semibold text-ink truncate block mt-0.5">
                  {[ratingsUser.first_name, ratingsUser.last_name].filter(Boolean).join(' ') || 'User'} ({ratingsUser.email})
                </span>
                <span className="text-[10px] text-ink-muted font-mono block mt-1">Average Rating: ★ {ratingsUser.avg_rating} / 5</span>
              </div>

              <div className="border-t border-hairline pt-4 space-y-3">
                {ratingsUser.ratings && ratingsUser.ratings.length > 0 ? (
                  ratingsUser.ratings.map((r, i) => (
                    <div key={i} className="bg-surface-2 border border-hairline rounded-md p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex text-amber-400 gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <span key={idx} className="text-xs select-none">
                              {idx < r.rating ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-ink-muted">
                          {new Date(r.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-ink italic leading-relaxed">
                        {r.comment ? `"${r.comment}"` : <span className="text-ink-tertiary">Rating submitted without comment</span>}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-ink-subtle text-center py-6">No rating records found on this account.</p>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-hairline bg-surface-2 flex justify-end">
              <button
                onClick={handleCloseRatingsModal}
                className="px-4 py-2 bg-surface-3 hover:bg-surface-4 text-ink hover:text-ink-strong text-xs font-semibold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>


  );
}
