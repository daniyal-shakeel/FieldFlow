'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { API_BASE_URL, LOCAL_STORAGE_TOKEN_KEY, APP_TITLE } from '@/constants';
import { Edit2, Coins, AlertCircle, X, Check } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price_pkr: number;
  tokens: number;
  tagline: string;
  features: string[];
  popular: boolean;
}

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editTokens, setEditTokens] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPlans = useCallback(async () => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) {
      router.replace('/');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/plans`);
      if (!res.ok) {
        throw new Error('Failed to fetch pricing plans');
      }
      const data = await res.json();
      setPlans(data);
    } catch (err: any) {
      setError(err.message || 'Server connection failed');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    document.title = `Manage Plans — ${APP_TITLE}`;
    fetchPlans();
  }, [fetchPlans]);

  const handleEditClick = (plan: Plan) => {
    setEditingPlan(plan);
    setEditPrice(String(plan.price_pkr));
    setEditTokens(String(plan.tokens));
    setSuccessMsg('');
    setError('');
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) return;

    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          price_pkr: Number(editPrice),
          tokens: Number(editTokens),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to update plan configurations');
      }

      setSuccessMsg(`Plan ${editingPlan.name} updated successfully!`);
      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) {
      setError(err.message || 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 animate-fade-in relative min-h-screen">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Manage Pricing Plans</h1>
            <p className="text-sm text-ink-subtle mt-0.5">
              Set base prices and configure target token payouts for Starter, Standard, Pro, and Enterprise tiers
            </p>
          </div>
          {successMsg && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#27a6441a] border border-[#27a64433] rounded-md text-xs font-semibold text-semantic-success animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin-slow" />
          </div>
        ) : error ? (
          <div className="bg-[#e5484d1a] border border-[#e5484d33] rounded-md px-4 py-3 max-w-xl text-sm font-medium text-semantic-error mb-6">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="p-6 rounded-lg border bg-surface-1 border-hairline relative flex flex-col justify-between hover:border-hairline-strong transition-all">
                {plan.popular && (
                  <span className="absolute top-4 right-4 bg-primary/15 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Popular
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-md bg-surface-2 border border-hairline flex items-center justify-center text-primary">
                      <Coins className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight text-ink">{plan.name} Plan</h3>
                  </div>
                  <p className="text-xs text-ink-subtle italic mb-4">{plan.tagline}</p>
                  
                  <div className="grid grid-cols-2 gap-4 bg-surface-2/40 border border-hairline p-4 rounded-md mb-6 text-xs font-mono">
                    <div>
                      <span className="text-ink-tertiary block text-[9px] uppercase tracking-wider">Price (PKR)</span>
                      <span className="font-bold text-ink text-sm">{plan.price_pkr.toLocaleString()} PKR</span>
                    </div>
                    <div>
                      <span className="text-ink-tertiary block text-[9px] uppercase tracking-wider">Tokens Payout</span>
                      <span className="font-bold text-primary text-sm">{plan.tokens} Tokens</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <span className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider block">Features included</span>
                    <ul className="space-y-1.5 text-xs text-ink-muted">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => handleEditClick(plan)}
                  className="w-full py-2 bg-surface-2 hover:bg-surface-3 border border-hairline hover:border-hairline-strong text-ink text-xs font-semibold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Configure Tier Settings</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal (Positioned as direct sibling under layout to ensure correct viewport centering) */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-1 border border-hairline rounded-lg max-w-md w-full flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink">Edit Plan: {editingPlan.name}</span>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1 hover:bg-surface-3 rounded text-ink-subtle hover:text-ink transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-[#e5484d1a] border border-[#e5484d33] rounded-md px-3 py-2 text-xs font-medium text-semantic-error flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider block mb-1.5">Price in PKR</label>
                  <div className="flex items-center rounded-md border border-hairline bg-surface-2 focus-within:border-hairline-strong px-3 py-1.5">
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="text-xs font-mono font-medium text-ink bg-transparent border-none outline-none focus:ring-0 w-full"
                    />
                    <span className="text-[10px] font-mono text-ink-subtle uppercase select-none">PKR</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider block mb-1.5">Tokens Credited</label>
                  <div className="flex items-center rounded-md border border-hairline bg-surface-2 focus-within:border-hairline-strong px-3 py-1.5">
                    <input
                      type="number"
                      value={editTokens}
                      onChange={(e) => setEditTokens(e.target.value)}
                      className="text-xs font-mono font-medium text-ink bg-transparent border-none outline-none focus:ring-0 w-full"
                    />
                    <span className="text-[10px] font-mono text-ink-subtle uppercase select-none">Tokens</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingPlan(null)}
                  disabled={saving}
                  className="px-4 py-2 flex-1 border border-hairline bg-surface-2 hover:bg-surface-3 text-ink text-xs font-semibold uppercase tracking-wider rounded transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !editPrice || !editTokens}
                  className="px-4 py-2 flex-1 bg-primary hover:bg-primary-hover text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin-slow shrink-0" />}
                  <span>Save Updates</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
