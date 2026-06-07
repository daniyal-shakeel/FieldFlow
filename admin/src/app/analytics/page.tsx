'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { API_BASE_URL, LOCAL_STORAGE_TOKEN_KEY, APP_TITLE } from '@/constants';

interface OverallStats {
  total_uploads: number;
  total_exports: number;
  filtered_uploads: number;
  filtered_exports: number;
  total_ratings: number;
  average_rating: number;
}

interface DailyStat {
  date: string;
  uploads: number;
  exports: number;
}

interface RatingDist {
  stars: number;
  count: number;
}

interface FeedbackItem {
  id: string;
  clerk_id: string | null;
  email: string;
  rating: number;
  comment: string;
  timestamp: string;
}

interface AnalyticsData {
  overall: OverallStats;
  daily: DailyStat[];
  ratings_distribution: RatingDist[];
  feedback: FeedbackItem[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) {
      router.replace('/');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/analytics?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
        router.replace('/');
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.detail || 'Failed to fetch analytics');
        return;
      }

      const resData = await res.json();
      setData(resData);
    } catch {
      setError('Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  }, [router, days]);

  useEffect(() => {
    document.title = `Analytics — ${APP_TITLE}`;
    fetchAnalytics();
  }, [fetchAnalytics]);

  const drawLineChart = (daily: DailyStat[]) => {
    if (!daily || daily.length === 0) return null;
    const width = 600;
    const height = 240;
    const padding = 40;
    
    const maxVal = Math.max(10, ...daily.map(d => Math.max(d.uploads, d.exports)));
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
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const val = Math.round((yMax / ticks) * i);
      const y = getY(val);
      gridLines.push(
        <g key={i} className="opacity-10 text-ink">
          <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
          <text x={padding - 10} y={y + 4} textAnchor="end" className="text-[9px] font-mono fill-ink-subtle">{val}</text>
        </g>
      );
    }

    const dateLabels: React.ReactNode[] = [];
    const labelInterval = Math.max(1, Math.ceil(daily.length / 5));
    daily.forEach((d, i) => {
      if (i % labelInterval === 0 || i === daily.length - 1) {
        const x = getX(i);
        const parts = d.date.split('-');
        const formattedDate = `${parts[1]}/${parts[2]}`;
        dateLabels.push(
          <text key={i} x={x} y={height - padding + 15} textAnchor="middle" className="text-[9px] font-mono fill-ink-subtle">
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

  const drawRatingsDist = (dist: RatingDist[]) => {
    if (!dist || dist.length === 0) return null;
    const maxCount = Math.max(1, ...dist.map(d => d.count));
    
    return (
      <div className="space-y-3.5 text-xs py-1">
        {dist.map((item) => {
          const percentage = (item.count / maxCount) * 100;
          return (
            <div key={item.stars} className="flex items-center gap-3">
              <span className="w-12 text-right font-mono font-medium text-ink-subtle">
                ★ {item.stars}
              </span>
              <div className="flex-1 h-3 rounded bg-surface-3 overflow-hidden border border-hairline">
                <div 
                  className="h-full bg-primary rounded transition-all duration-500" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 font-mono text-ink text-right font-semibold">
                {item.count}
              </span>
            </div>
          );
        }).reverse()}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Usage Analytics</h1>
            <p className="text-sm text-ink-subtle mt-0.5">
              Monitor overall website metrics, PDF uploads, exports, and customer feedback
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="text-xs text-ink-subtle font-medium uppercase font-mono">Range:</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-semibold text-ink bg-surface-1 border border-hairline rounded-md hover:bg-surface-2 transition-all outline-none"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={180}>Last 180 Days</option>
            </select>
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
            {/* KPI grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-1 border border-hairline p-5 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">Total PDF Uploads</span>
                <p className="text-2xl font-bold tracking-tight text-ink">{data.overall.total_uploads}</p>
                <span className="text-[10px] text-ink-muted block font-mono">Filtered: {data.overall.filtered_uploads}</span>
              </div>
              <div className="bg-surface-1 border border-hairline p-5 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">Total PDF Exports</span>
                <p className="text-2xl font-bold tracking-tight text-ink">{data.overall.total_exports}</p>
                <span className="text-[10px] text-ink-muted block font-mono">Filtered: {data.overall.filtered_exports}</span>
              </div>
              <div className="bg-surface-1 border border-hairline p-5 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">Export Success Rate</span>
                <p className="text-2xl font-bold tracking-tight text-primary">
                  {data.overall.total_uploads > 0 
                    ? ((data.overall.total_exports / data.overall.total_uploads) * 100).toFixed(1)
                    : '0.0'}%
                </p>
                <span className="text-[10px] text-ink-muted block font-mono">Upload to export conversion</span>
              </div>
              <div className="bg-surface-1 border border-hairline p-5 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">Average Rating</span>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-bold tracking-tight text-amber-400">★ {data.overall.average_rating || '0.0'}</p>
                  <span className="text-xs text-ink-subtle">/ 5</span>
                </div>
                <span className="text-[10px] text-ink-muted block font-mono">Total votes: {data.overall.total_ratings}</span>
              </div>
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Activity Chart */}
              <div className="bg-surface-1 border border-hairline p-5 rounded-lg lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink">Daily PDF Activity</span>
                  <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wide">
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="w-2 h-2 rounded bg-primary" /> Uploads
                    </span>
                    <span className="flex items-center gap-1.5 text-semantic-success">
                      <span className="w-2 h-2 rounded bg-semantic-success" /> Exports
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  {drawLineChart(data.daily)}
                </div>
              </div>

              {/* Ratings Distribution Chart */}
              <div className="bg-surface-1 border border-hairline p-5 rounded-lg space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-ink block">Ratings Distribution</span>
                <div>
                  {drawRatingsDist(data.ratings_distribution)}
                </div>
              </div>
            </div>

            {/* Feedback & Review Feed */}
            <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-hairline bg-surface-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink">Recent Customer Reviews</h2>
              </div>
              
              <div className="divide-y divide-hairline max-h-[400px] overflow-y-auto">
                {data.feedback.length === 0 ? (
                  <div className="p-12 text-center text-xs text-ink-subtle">
                    No rating reviews submitted yet.
                  </div>
                ) : (
                  data.feedback.map((item) => (
                    <div key={item.id} className="p-4 space-y-2 hover:bg-surface-2/30 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-ink-muted truncate max-w-[200px]" title={item.email}>
                          {item.email}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="flex text-amber-400 gap-0.5 select-none">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <span key={idx}>
                                {idx < item.rating ? '★' : '☆'}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] font-mono text-ink-subtle">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-ink italic">
                        {item.comment ? `"${item.comment}"` : <span className="text-ink-tertiary">Rating submitted without comment</span>}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
