'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { API_BASE_URL, LOCAL_STORAGE_TOKEN_KEY, APP_TITLE } from '@/constants';
import { CheckCircle, XCircle, Eye, AlertCircle, X } from 'lucide-react';

interface PaymentProof {
  id: string;
  clerk_id: string;
  amount_pkr: number;
  plan_name: string;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  amount_received_pkr?: number;
  tokens_added?: number;
  tokens_claimed?: number;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  tag?: string | null;
  is_dev?: boolean;
}

interface User {
  clerk_id: string;
  email: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokenRate, setTokenRate] = useState(10);

  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchProofsAndUsers = useCallback(async () => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) {
      router.replace('/');
      return;
    }
    setLoading(true);
    try {
      const [proofsRes, usersRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/payments/proofs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (proofsRes.status === 401 || usersRes.status === 401) {
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
        router.replace('/');
        return;
      }

      if (!proofsRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch transaction data');
      }

      const proofsData = await proofsRes.json();
      const usersData = await usersRes.json();
      const settingsData = await settingsRes.json();

      setProofs(proofsData);
      setTokenRate(settingsData.pkr_per_token || 10);

      const mapping: Record<string, string> = {};
      (usersData.users || []).forEach((u: User) => {
        mapping[u.clerk_id] = u.email;
      });
      setUserMap(mapping);
    } catch (err: any) {
      setError(err.message || 'Server connection failed');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    document.title = `Payment Approvals — ${APP_TITLE}`;
    fetchProofsAndUsers();
  }, [fetchProofsAndUsers]);

  useEffect(() => {
    if (selectedProof) {
      const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
      fetch(`${API_BASE_URL}/api/admin/payments/proofs/${selectedProof.id}/image`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error();
          return res.blob();
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setImageSrc(url);
        })
        .catch(() => {
          setImageSrc(null);
        });
      setAmountReceived(String(selectedProof.amount_pkr));
    } else {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      setImageSrc(null);
      setAmountReceived('');
    }
  }, [selectedProof]);

  const handleApprove = async () => {
    if (!selectedProof) return;
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) return;

    setSubmittingAction(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payments/proofs/${selectedProof.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount_received_pkr: Number(amountReceived) }),
      });

      if (!res.ok) {
        throw new Error('Failed to approve transaction');
      }

      setSelectedProof(null);
      fetchProofsAndUsers();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProof) return;
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) return;

    setSubmittingAction(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payments/proofs/${selectedProof.id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to reject transaction');
      }

      setSelectedProof(null);
      fetchProofsAndUsers();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  const calculatedTokens = tokenRate > 0 ? (Number(amountReceived) / tokenRate).toFixed(2) : '0';

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight text-ink">Payment Approvals</h1>
          <p className="text-sm text-ink-subtle mt-0.5">
            Review user manual payment proofs and grant token balance credits upon verification
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin-slow" />
          </div>
        ) : error ? (
          <div className="bg-[#e5484d1a] border border-[#e5484d33] rounded-md px-4 py-3 max-w-xl text-sm font-medium text-semantic-error">
            {error}
          </div>
        ) : proofs.length === 0 ? (
          <div className="p-12 border border-hairline bg-surface-1 rounded-lg text-center text-xs text-ink-subtle">
            No payment proofs have been submitted yet.
          </div>
        ) : (
          <div className="border border-hairline bg-surface-1 rounded-lg overflow-hidden">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-surface-2 border-b border-hairline text-ink-subtle uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-5 py-3.5 font-medium">User Email</th>
                  <th className="px-5 py-3.5 font-medium">Plan Name</th>
                  <th className="px-5 py-3.5 font-medium">Amount</th>
                  <th className="px-5 py-3.5 font-medium">Method</th>
                  <th className="px-5 py-3.5 font-medium">Date</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {proofs.map(p => (
                  <tr key={p.id} className="hover:bg-surface-2/30 transition-colors">
                    <td className="px-5 py-4 font-mono max-w-[220px]" title={p.clerk_id}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{userMap[p.clerk_id] || p.clerk_id}</span>
                        {p.is_dev && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-[#d977061a] text-[#f59e0b] border border-[#d9770633] flex-shrink-0">
                            Dev
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-ink uppercase">{p.plan_name}</td>
                    <td className="px-5 py-4 font-mono">
                      {p.amount_pkr} PKR
                      {p.amount_received_pkr && (
                        <span className="block text-[10px] text-semantic-success mt-0.5">
                          Recv: {p.amount_received_pkr} PKR
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-medium uppercase text-ink-subtle">{p.payment_method}</td>
                    <td className="px-5 py-4 text-ink-subtle">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        p.status === 'approved'
                          ? 'bg-[#27a6441a] text-semantic-success'
                          : p.status === 'rejected'
                          ? 'bg-[#e5484d1a] text-semantic-error'
                          : 'bg-surface-3 text-ink-subtle'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {p.status === 'pending' ? (
                        <button
                          onClick={() => setSelectedProof(p)}
                          className="px-3 py-1 bg-primary text-white hover:bg-primary-hover font-semibold rounded text-[10px] uppercase tracking-wider cursor-pointer"
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedProof(p)}
                          className="p-1 border border-hairline hover:bg-surface-2 text-ink-subtle hover:text-ink rounded cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail/Approval Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-1 border border-hairline rounded-lg max-w-xl w-full flex flex-col max-h-[90vh] shadow-2xl">
              <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink">Review Payment Proof</span>
                <button
                  onClick={() => setSelectedProof(null)}
                  className="p-1 hover:bg-surface-3 rounded text-ink-subtle hover:text-ink transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-ink-subtle block">User Email</span>
                    <span className="font-semibold text-ink truncate block">{userMap[selectedProof.clerk_id] || selectedProof.clerk_id}</span>
                  </div>
                  <div>
                    <span className="text-ink-subtle block">Method & Plan</span>
                    <span className="font-semibold text-ink uppercase block">{selectedProof.payment_method} — {selectedProof.plan_name}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">Proof Image</span>
                  <div className="border border-hairline bg-surface-2 rounded-lg flex items-center justify-center p-2 min-h-[250px] relative overflow-hidden">
                    {imageSrc ? (
                      <img src={imageSrc} alt="Proof of Payment" className="max-h-[300px] w-auto object-contain rounded" />
                    ) : (
                      <div className="text-center text-ink-tertiary">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-ink-subtle" />
                        <span className="text-xs">Loading payment proof image…</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedProof.status === 'pending' ? (
                  <div className="space-y-4 pt-4 border-t border-hairline">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider block mb-1.5">Amount Actually Received (PKR)</label>
                        <div className="flex items-center rounded-md border border-hairline bg-surface-2 focus-within:border-hairline-strong px-3 py-1.5">
                          <input
                            type="number"
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(e.target.value)}
                            className="text-xs font-mono font-medium text-ink bg-transparent border-none outline-none focus:ring-0 w-full"
                          />
                          <span className="text-[10px] font-mono text-ink-subtle uppercase select-none">PKR</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider block mb-1.5">Tokens to Credit</label>
                        <div className="flex items-center rounded-md border border-hairline bg-surface-3 px-3 py-1.5 select-none">
                          <span className="text-xs font-mono font-semibold text-primary">{selectedProof.tokens_claimed || 5}</span>
                          <span className="text-[10px] font-mono text-ink-subtle uppercase ml-auto">Tokens</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleReject}
                        disabled={submittingAction}
                        className="px-4 py-2 flex-1 border border-hairline bg-surface-2 hover:bg-surface-3 text-semantic-error text-xs font-semibold uppercase tracking-wider rounded transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Reject Proof
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={submittingAction || !amountReceived}
                        className="px-4 py-2 flex-1 bg-primary hover:bg-primary-hover text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {submittingAction && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin-slow shrink-0" />}
                        Approve Payment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-hairline space-y-2 text-xs">
                    <p className="text-ink-subtle">
                      This transaction has been resolved.
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-[11px] bg-surface-2 p-3 border border-hairline rounded-md">
                      <div>
                        <span className="text-ink-tertiary block uppercase font-mono text-[9px]">Amount Received</span>
                        <span className="font-semibold text-ink">{selectedProof.amount_received_pkr || 0} PKR</span>
                      </div>
                      <div>
                        <span className="text-ink-tertiary block uppercase font-mono text-[9px]">Tokens Credited</span>
                        <span className="font-semibold text-primary">{selectedProof.tokens_added || 0} Tokens</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
