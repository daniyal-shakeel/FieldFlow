'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { API_BASE_URL, LOCAL_STORAGE_TOKEN_KEY, APP_TITLE } from '@/constants';

interface PaymentAccount {
  id: string;
  name: string;
  enabled: boolean;
  account_number: string;
  account_title: string;
  extra_info: {
    username?: string;
    iban?: string;
  };
}

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAccounts = useCallback(async () => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) {
      router.replace('/');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payments/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
        router.replace('/');
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch payment accounts');
      }
      const data = await res.json();
      setAccounts(data);
    } catch (err: any) {
      setError(err.message || 'Server connection failed');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    document.title = `Payment Accounts — ${APP_TITLE}`;
    fetchAccounts();
  }, [fetchAccounts]);

  const handleToggle = async (account_id: string, currentStatus: boolean) => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) {
      router.replace('/');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payments/accounts/${account_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !currentStatus }),
      });

      if (res.status === 401) {
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
        router.replace('/');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setAccounts(prev =>
        prev.map(acc => (acc.id === account_id ? { ...acc, enabled: !currentStatus } : acc))
      );
    } catch (err: any) {
      alert(err.message || 'Toggle failed');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight text-ink">Payment Accounts</h1>
          <p className="text-sm text-ink-subtle mt-0.5">
            Enable or disable payment accounts to reflect on the user payment page in real time
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {accounts.map(acc => (
              <div key={acc.id} className="p-5 rounded-lg border bg-surface-1 border-hairline flex flex-col justify-between hover:border-hairline-strong transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{acc.name}</span>
                    <button
                      onClick={() => handleToggle(acc.id, acc.enabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        acc.enabled ? 'bg-primary' : 'bg-surface-3'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          acc.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="space-y-1.5 pt-2 text-xs">
                    <div>
                      <span className="text-ink-subtle block font-medium">Account Title</span>
                      <span className="text-ink font-mono font-medium">{acc.account_title}</span>
                    </div>
                    <div>
                      <span className="text-ink-subtle block font-medium">Account Number</span>
                      <span className="text-ink font-mono font-medium">{acc.account_number}</span>
                    </div>
                    {acc.extra_info.username && (
                      <div>
                        <span className="text-ink-subtle block font-medium">Username</span>
                        <span className="text-ink font-mono font-medium">{acc.extra_info.username}</span>
                      </div>
                    )}
                    {acc.extra_info.iban && (
                      <div>
                        <span className="text-ink-subtle block font-medium">IBAN</span>
                        <span className="text-ink font-mono font-medium truncate block">{acc.extra_info.iban}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
