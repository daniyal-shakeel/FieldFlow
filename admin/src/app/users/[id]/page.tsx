'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { API_BASE_URL, LOCAL_STORAGE_TOKEN_KEY, APP_TITLE } from '@/constants';
import { 
  ArrowLeft, 
  Coins, 
  UploadCloud, 
  Download, 
  Star, 
  Users, 
  Clock, 
  ShieldAlert, 
  CheckCircle,
  FileText,
  BadgeAlert,
  X
} from 'lucide-react';

interface ExternalAccount {
  provider: string;
  provider_user_id: string;
  email_address: string | null;
}

interface UserProfile {
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
  referred_by?: string | null;
  referral_earned?: boolean;
  tag?: string | null;
  is_dev?: boolean;
}

interface UsageLog {
  _id: string;
  event_type: 'upload' | 'export';
  filename: string;
  page_count: number;
  timestamp: string;
}

interface Transaction {
  _id: string;
  type: 'spend' | 'earn' | 'credit';
  amount: number;
  description: string;
  comment?: string;
  timestamp: string;
}

interface PaymentProof {
  _id: string;
  amount_pkr: number;
  plan_name: string;
  payment_method: string;
  status: string;
  tokens_claimed?: number;
  tokens_added?: number;
  amount_received_pkr?: number;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
}

interface RatingFeedback {
  _id: string;
  rating: number;
  comment: string;
  timestamp: string;
}

interface ReferralUser {
  _id: string;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  tokens_balance?: number;
}

interface DailyStat {
  date: string;
  uploads: number;
  exports: number;
}

interface UserDetailsResponse {
  user: UserProfile;
  stats: {
    total_uploads: number;
    total_exports: number;
    average_rating: number;
    ratings_count: number;
    referrals_count: number;
  };
  usage_logs: UsageLog[];
  transactions: Transaction[];
  payments: PaymentProof[];
  ratings: RatingFeedback[];
  referrals: ReferralUser[];
  daily: DailyStat[];
}

export default function UserMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const clerkId = params.id as string;

  const [data, setData] = useState<UserDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<'logs' | 'transactions' | 'payments' | 'reviews' | 'referrals'>('logs');

  // Award Credits modal states
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [awardAmount, setAwardAmount] = useState('');
  const [awardComment, setAwardComment] = useState('');
  const [submittingAward, setSubmittingAward] = useState(false);
  const [awardError, setAwardError] = useState('');
  const [awardSuccess, setAwardSuccess] = useState('');

  const fetchUserDetails = useCallback(async () => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) {
      router.replace('/');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${clerkId}?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
        router.replace('/');
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.detail || 'Failed to fetch user details');
        return;
      }

      const resData = await res.json();
      setData(resData);
    } catch {
      setError('Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  }, [router, clerkId, days]);

  useEffect(() => {
    if (data?.user) {
      const name = [data.user.first_name, data.user.last_name].filter(Boolean).join(' ') || data.user.email;
      document.title = `Monitor ${name} — ${APP_TITLE}`;
    } else {
      document.title = `Monitor User — ${APP_TITLE}`;
    }
  }, [data]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleOpenAwardModal = () => {
    setAwardModalOpen(true);
    setAwardAmount('');
    setAwardComment('');
    setAwardError('');
    setAwardSuccess('');
    if (data?.user) {
      document.title = `Award Credits to ${data.user.first_name || data.user.email} — ${APP_TITLE}`;
    }
  };

  const handleCloseAwardModal = () => {
    setAwardModalOpen(false);
    if (data?.user) {
      const name = [data.user.first_name, data.user.last_name].filter(Boolean).join(' ') || data.user.email;
      document.title = `Monitor ${name} — ${APP_TITLE}`;
    }
  };

  const handleSubmitAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.user) return;

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

      const res = await fetch(`${API_BASE_URL}/api/admin/users/${data.user.clerk_id}/grant-credits`, {
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

      const resData = await res.json();
      if (!res.ok) {
        setAwardError(resData.detail || 'Failed to award credits');
      } else {
        setAwardSuccess(`Successfully awarded ${amountNum} credits!`);
        setData(prev => prev ? {
          ...prev,
          user: { ...prev.user, tokens_balance: resData.new_balance }
        } : null);
        
        // Refresh detail tables in background
        fetchUserDetails();
        
        setTimeout(() => {
          handleCloseAwardModal();
        }, 1500);
      }
    } catch {
      setAwardError('Connection error');
    } finally {
      setSubmittingAward(false);
    }
  };

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

  const drawLineChart = (daily: DailyStat[]) => {
    if (!daily || daily.length === 0) return null;
    const width = 600;
    const height = 180;
    const padding = 35;
    
    const maxVal = Math.max(5, ...daily.map(d => Math.max(d.uploads, d.exports)));
    const yMax = Math.ceil(maxVal * 1.15);
    
    const getX = (index: number) => padding + (index / (daily.length - 1)) * (width - padding * 2);
    const getY = (val: number) => height - padding - (val / yMax) * (height - padding * 2);
    
    let uploadsPath = '';
    let exportsPath = '';
    
    daily.forEach((d, i) => {
      const x = getX(i);
      const yUpload = getY(d.uploads);
      const yExport = getY(d.exports);
      
      if (i === 0) {
        uploadsPath = `M ${x} ${yUpload}`;
        exportsPath = `M ${x} ${yExport}`;
      } else {
        uploadsPath += ` L ${x} ${yUpload}`;
        exportsPath += ` L ${x} ${yExport}`;
      }
    });

    const uploadsArea = `${uploadsPath} L ${getX(daily.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;
    const exportsArea = `${exportsPath} L ${getX(daily.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;
    
    const gridLines: React.ReactNode[] = [];
    const ticks = 3;
    for (let i = 0; i <= ticks; i++) {
      const val = Math.round((yMax / ticks) * i);
      const y = getY(val);
      gridLines.push(
        <g key={i} className="opacity-10 text-ink">
          <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
          <text x={padding - 8} y={y + 3} textAnchor="end" className="text-[8px] font-mono fill-ink-subtle">{val}</text>
        </g>
      );
    }

    const dateLabels: React.ReactNode[] = [];
    const labelInterval = Math.max(1, Math.ceil(daily.length / 6));
    daily.forEach((d, i) => {
      if (i % labelInterval === 0 || i === daily.length - 1) {
        const x = getX(i);
        const parts = d.date.split('-');
        const formattedDate = `${parts[1]}/${parts[2]}`;
        dateLabels.push(
          <text key={i} x={x} y={height - padding + 12} textAnchor="middle" className="text-[8px] font-mono fill-ink-subtle">
            {formattedDate}
          </text>
        );
      }
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-hairline">
        {gridLines}
        {dateLabels}
        
        <path d={uploadsArea} fill="url(#uploadsGrad)" className="opacity-5" />
        <path d={uploadsPath} fill="none" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
        
        <path d={exportsArea} fill="url(#exportsGrad)" className="opacity-5" />
        <path d={exportsPath} fill="none" className="stroke-semantic-success" strokeWidth="1.5" strokeLinecap="round" />

        <defs>
          <linearGradient id="uploadsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5e6ad2" />
            <stop offset="100%" stopColor="#5e6ad2" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="exportsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#27a644" />
            <stop offset="100%" stopColor="#27a644" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 animate-fade-in space-y-6">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/users')}
              className="p-1.5 hover:bg-surface-2 border border-hairline rounded text-ink-subtle hover:text-ink transition-colors cursor-pointer"
              title="Back to Users"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-ink">User Activity Monitoring</h1>
              <p className="text-xs text-ink-subtle mt-0.5">Comprehensive behavior and transaction log</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-semibold text-ink bg-surface-1 border border-hairline rounded-md hover:bg-surface-2 transition-all outline-none"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            <button
              onClick={fetchUserDetails}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-semibold text-ink-subtle bg-surface-1 border border-hairline rounded-md hover:text-ink hover:bg-surface-2 transition-colors disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-[#e5484d1a] border border-[#e5484d33] rounded-md px-4 py-3 text-sm text-semantic-error">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin-slow" />
          </div>
        ) : !data ? null : (
          <div className="space-y-6">
            
            {/* Top row: Profile details & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Profile Card */}
              <div className="bg-surface-1 border border-hairline rounded-lg p-5 flex flex-col justify-between space-y-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {data.user.image_url ? (
                      <img
                        src={data.user.image_url}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover border border-hairline flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center border border-hairline flex-shrink-0">
                        <span className="text-sm font-semibold text-ink">
                          {(data.user.first_name?.[0] || data.user.email?.[0] || '?').toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-ink truncate leading-snug">
                          {[data.user.first_name, data.user.last_name].filter(Boolean).join(' ') || 'User Account'}
                        </h2>
                        {data.user.is_dev && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-[#d977061a] text-[#f59e0b] border border-[#d9770633] flex-shrink-0">
                            Dev
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-subtle truncate">{data.user.email}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-hairline pt-3 space-y-2.5 text-xs text-ink-muted">
                    <div>
                      <span className="text-[9px] uppercase font-mono text-ink-subtle block">Clerk ID</span>
                      <span className="font-mono text-[11px] block mt-0.5 select-all text-ink">{data.user.clerk_id}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-ink-subtle">Auth Methods:</span>
                      <div className="flex flex-wrap gap-1">
                        {data.user.auth_methods.map(method => (
                          <span key={method} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getAuthBadgeColor(method)}`}>
                            {method.replace('oauth_', '')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-ink-subtle font-mono text-[10px]">REFERRED BY:</span>
                      <span className="font-mono font-semibold text-ink">{data.user.referred_by ? 'Yes' : 'None'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-ink-subtle font-mono text-[10px]">SIGNUP DATE:</span>
                      <span className="font-mono text-ink">{formatDate(data.user.created_at)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-ink-subtle font-mono text-[10px]">LAST SYNC:</span>
                      <span className="font-mono text-ink">{formatDate(data.user.last_sync_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-hairline pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-mono text-ink-subtle block">Token Balance</span>
                    <span className="text-lg font-mono font-bold text-ink flex items-center gap-1 mt-0.5">
                      <Coins className="w-4 h-4 text-primary shrink-0" />
                      {data.user.tokens_balance !== undefined ? data.user.tokens_balance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '0.0'}
                    </span>
                  </div>
                  <button
                    onClick={handleOpenAwardModal}
                    className="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 rounded-md transition-all cursor-pointer"
                  >
                    Award Credits
                  </button>
                </div>
              </div>

              {/* Chart Activity */}
              <div className="bg-surface-1 border border-hairline rounded-lg p-5 lg:col-span-2 flex flex-col justify-between space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-ink">User Page Activity</span>
                    <p className="text-[10px] text-ink-subtle mt-0.5">Timeline of PDF uploads vs exports</p>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1 text-primary">
                      <span className="w-1.5 h-1.5 rounded-sm bg-primary" /> Uploads
                    </span>
                    <span className="flex items-center gap-1 text-semantic-success">
                      <span className="w-1.5 h-1.5 rounded-sm bg-semantic-success" /> Exports
                    </span>
                  </div>
                </div>
                
                <div className="pt-2">
                  {drawLineChart(data.daily)}
                </div>
              </div>
            </div>

            {/* Middle row: User KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="bg-surface-1 border border-hairline p-4 rounded-lg space-y-1 shadow-sm">
                <span className="text-[9px] font-mono text-ink-subtle uppercase tracking-wider block">Total Uploads</span>
                <p className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
                  <UploadCloud className="w-4.5 h-4.5 text-primary" />
                  {data.stats.total_uploads}
                </p>
              </div>
              <div className="bg-surface-1 border border-hairline p-4 rounded-lg space-y-1 shadow-sm">
                <span className="text-[9px] font-mono text-ink-subtle uppercase tracking-wider block">Total Exports</span>
                <p className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
                  <Download className="w-4.5 h-4.5 text-semantic-success" />
                  {data.stats.total_exports}
                </p>
              </div>
              <div className="bg-surface-1 border border-hairline p-4 rounded-lg space-y-1 shadow-sm">
                <span className="text-[9px] font-mono text-ink-subtle uppercase tracking-wider block">Success Conversion</span>
                <p className="text-xl font-bold tracking-tight text-primary">
                  {data.stats.total_uploads > 0 
                    ? ((data.stats.total_exports / data.stats.total_uploads) * 100).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
              <div className="bg-surface-1 border border-hairline p-4 rounded-lg space-y-1 shadow-sm">
                <span className="text-[9px] font-mono text-ink-subtle uppercase tracking-wider block">Average Rating</span>
                <p className="text-xl font-bold tracking-tight text-amber-400 flex items-center gap-1.5">
                  <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
                  {data.stats.average_rating || '—'}
                </p>
              </div>
              <div className="bg-surface-1 border border-hairline p-4 rounded-lg space-y-1 shadow-sm col-span-2 sm:col-span-1 shadow-sm">
                <span className="text-[9px] font-mono text-ink-subtle uppercase tracking-wider block">Total Referrals</span>
                <p className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-primary" />
                  {data.stats.referrals_count}
                </p>
              </div>
            </div>

            {/* Bottom Row: Tabbed Log Feeds */}
            <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden shadow-sm">
              <div className="flex border-b border-hairline bg-surface-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                    activeTab === 'logs'
                      ? 'border-primary text-primary bg-surface-1'
                      : 'border-transparent text-ink-subtle hover:text-ink'
                  }`}
                >
                  Usage Logs ({data.usage_logs.length})
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                    activeTab === 'transactions'
                      ? 'border-primary text-primary bg-surface-1'
                      : 'border-transparent text-ink-subtle hover:text-ink'
                  }`}
                >
                  Transactions ({data.transactions.length})
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                    activeTab === 'payments'
                      ? 'border-primary text-primary bg-surface-1'
                      : 'border-transparent text-ink-subtle hover:text-ink'
                  }`}
                >
                  Payment Proofs ({data.payments.length})
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                    activeTab === 'reviews'
                      ? 'border-primary text-primary bg-surface-1'
                      : 'border-transparent text-ink-subtle hover:text-ink'
                  }`}
                >
                  Ratings & Reviews ({data.ratings.length})
                </button>
                <button
                  onClick={() => setActiveTab('referrals')}
                  className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                    activeTab === 'referrals'
                      ? 'border-primary text-primary bg-surface-1'
                      : 'border-transparent text-ink-subtle hover:text-ink'
                  }`}
                >
                  Referred Users ({data.referrals.length})
                </button>
              </div>

              <div className="p-6">
                {/* 1. Usage Logs Tab */}
                {activeTab === 'logs' && (
                  <div className="overflow-x-auto">
                    {data.usage_logs.length === 0 ? (
                      <p className="text-xs text-ink-subtle text-center py-12">No document activities logged on this user.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-hairline text-ink-subtle text-[11px] font-bold uppercase tracking-wide">
                            <th className="text-left pb-3">Event Type</th>
                            <th className="text-left pb-3">Filename</th>
                            <th className="text-left pb-3">Pages</th>
                            <th className="text-right pb-3">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline">
                          {data.usage_logs.map((log) => (
                            <tr key={log._id} className="hover:bg-surface-2/20 transition-colors">
                              <td className="py-3.5">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                                  log.event_type === 'upload' 
                                    ? 'bg-primary/10 text-primary border-primary/20' 
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                  {log.event_type}
                                </span>
                              </td>
                              <td className="py-3.5 text-ink font-medium max-w-[200px] truncate" title={log.filename}>
                                {log.filename}
                              </td>
                              <td className="py-3.5 text-ink-muted font-mono">{log.page_count} page{log.page_count !== 1 ? 's' : ''}</td>
                              <td className="py-3.5 text-right text-ink-subtle font-mono text-xs">{formatDate(log.timestamp)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* 2. Transactions Tab */}
                {activeTab === 'transactions' && (
                  <div className="overflow-x-auto">
                    {data.transactions.length === 0 ? (
                      <p className="text-xs text-ink-subtle text-center py-12">No transactions recorded.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-hairline text-ink-subtle text-[11px] font-bold uppercase tracking-wide">
                            <th className="text-left pb-3">Type</th>
                            <th className="text-left pb-3">Amount</th>
                            <th className="text-left pb-3">Description</th>
                            <th className="text-left pb-3">Comment / Reason</th>
                            <th className="text-right pb-3">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline">
                          {data.transactions.map((tx) => (
                            <tr key={tx._id} className="hover:bg-surface-2/20 transition-colors">
                              <td className="py-3.5">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                                  tx.type === 'credit'
                                    ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                                    : tx.type === 'spend'
                                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className={`py-3.5 font-mono font-bold text-xs ${
                                tx.amount > 0 ? 'text-semantic-success' : 'text-semantic-error'
                              }`}>
                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                              </td>
                              <td className="py-3.5 text-ink-muted font-medium text-xs">{tx.description}</td>
                              <td className="py-3.5 text-ink italic text-xs max-w-[200px] truncate" title={tx.comment || ''}>
                                {tx.comment || <span className="text-ink-tertiary font-normal not-italic">—</span>}
                              </td>
                              <td className="py-3.5 text-right text-ink-subtle font-mono text-xs">{formatDate(tx.timestamp)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* 3. Payments Tab */}
                {activeTab === 'payments' && (
                  <div className="overflow-x-auto">
                    {data.payments.length === 0 ? (
                      <p className="text-xs text-ink-subtle text-center py-12">No payment proofs submitted yet.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-hairline text-ink-subtle text-[11px] font-bold uppercase tracking-wide">
                            <th className="text-left pb-3">Plan</th>
                            <th className="text-left pb-3">Amount</th>
                            <th className="text-left pb-3">Method</th>
                            <th className="text-left pb-3">Tokens Claimed</th>
                            <th className="text-left pb-3">Status</th>
                            <th className="text-right pb-3">Submitted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline">
                          {data.payments.map((p) => (
                            <tr key={p._id} className="hover:bg-surface-2/20 transition-colors">
                              <td className="py-3.5 font-semibold text-ink text-xs">{p.plan_name}</td>
                              <td className="py-3.5 text-ink-muted font-mono font-medium text-xs">{p.amount_pkr.toLocaleString()} PKR</td>
                              <td className="py-3.5 text-ink-muted text-xs capitalize">{p.payment_method}</td>
                              <td className="py-3.5 text-ink-muted font-mono text-xs">{p.tokens_claimed || '—'}</td>
                              <td className="py-3.5">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border uppercase ${
                                  p.status === 'approved'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : p.status === 'rejected'
                                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                      : 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-right text-ink-subtle font-mono text-xs">{formatDate(p.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* 4. Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {data.ratings.length === 0 ? (
                      <p className="text-xs text-ink-subtle text-center py-12">No rating submissions found.</p>
                    ) : (
                      data.ratings.map((r) => (
                        <div key={r._id} className="bg-surface-2 border border-hairline rounded-md p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex text-amber-400 gap-0.5 select-none">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <span key={idx}>
                                  {idx < r.rating ? '★' : '☆'}
                                </span>
                              ))}
                            </div>
                            <span className="text-[10px] font-mono text-ink-subtle">
                              {formatDate(r.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-ink italic leading-relaxed">
                            {r.comment ? `"${r.comment}"` : <span className="text-ink-tertiary">Rating submitted without comment</span>}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 5. Referrals Tab */}
                {activeTab === 'referrals' && (
                  <div className="overflow-x-auto">
                    {data.referrals.length === 0 ? (
                      <p className="text-xs text-ink-subtle text-center py-12">This user has not referred anyone yet.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-hairline text-ink-subtle text-[11px] font-bold uppercase tracking-wide">
                            <th className="text-left pb-3">Referred User Email</th>
                            <th className="text-left pb-3">User ID</th>
                            <th className="text-left pb-3">Current Balance</th>
                            <th className="text-right pb-3">Signup Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline">
                          {data.referrals.map((ref) => (
                            <tr key={ref._id} className="hover:bg-surface-2/20 transition-colors">
                              <td className="py-3.5 font-semibold text-ink text-xs">{ref.email}</td>
                              <td className="py-3.5 text-ink-muted font-mono text-xs truncate max-w-[150px]">{ref.clerk_id}</td>
                              <td className="py-3.5 text-ink font-mono text-xs">{ref.tokens_balance || '0.0'}</td>
                              <td className="py-3.5 text-right text-ink-subtle font-mono text-xs">{formatDate(ref.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Award credits modal (copied details and adapted) */}
      {awardModalOpen && data?.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-1 border border-hairline rounded-lg max-w-md w-full flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink">Award Free Credits</span>
              <button
                onClick={handleCloseAwardModal}
                className="p-1 hover:bg-surface-3 rounded text-ink-subtle hover:text-ink transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAward} className="p-6 space-y-4">
              {awardError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded px-3 py-2 text-xs text-semantic-error">
                  {awardError}
                </div>
              )}
              {awardSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2 text-xs text-semantic-success">
                  {awardSuccess}
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-mono text-ink-subtle block">Target User</span>
                <span className="text-xs font-semibold text-ink truncate block mt-0.5">
                  {[data.user.first_name, data.user.last_name].filter(Boolean).join(' ') || 'User'} ({data.user.email})
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
                  onClick={handleCloseAwardModal}
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
    </AdminLayout>
  );
}
