'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, SignInButton } from '@clerk/nextjs';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer/Footer';
import { API_BASE_URL } from '@/constants';
import { usePdfStore } from '@/store/usePdfStore';
import { AlertTriangle, CheckCircle, Upload, ArrowLeft } from 'lucide-react';

interface PaymentAccount {
  id: string;
  name: string;
  account_number: string;
  account_title: string;
  extra_info: {
    username?: string;
    iban?: string;
  };
}

function CheckoutContent() {
  const { user, isLoaded, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const addToast = usePdfStore(state => state.addToast);

  const plan = searchParams.get('plan') || 'Starter';
  const price = searchParams.get('price') || '100';
  const tokens = searchParams.get('tokens') || '5';

  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/payments/accounts`)
      .then(res => res.json())
      .then(data => {
        setAccounts(data);
        if (data.length > 0) {
          setSelectedMethod(data[0].id);
        }
      })
      .catch(err => {
        console.error(err);
        addToast('Failed to load payment accounts', 'error');
      })
      .finally(() => setLoadingAccounts(false));
  }, [addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !user) {
      addToast('Please sign in to make a purchase', 'error');
      return;
    }
    if (!proofFile) {
      addToast('Please upload payment proof image', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('clerkId', user.id);
      formData.append('amountPkr', price);
      formData.append('planName', plan);
      formData.append('paymentMethod', selectedMethod);
      formData.append('proofImage', proofFile);

      const res = await fetch(`${API_BASE_URL}/api/payments/proof`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to submit proof');
      }

      setSuccess(true);
      addToast('Payment proof submitted successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Submission failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAccount = accounts.find(acc => acc.id === selectedMethod);

  const getLogo = (methodId: string) => {
    if (methodId === 'jazzcash') {
      return (
        <svg className="w-10 h-6 shrink-0" viewBox="0 0 100 60" fill="none">
          <rect width="100" height="60" rx="6" fill="#000000" />
          <text x="50" y="28" fill="#F40009" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Jazz</text>
          <text x="50" y="44" fill="#FFB900" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Cash</text>
        </svg>
      );
    }
    if (methodId === 'easypaisa') {
      return (
        <svg className="w-10 h-6 shrink-0" viewBox="0 0 100 60" fill="none">
          <rect width="100" height="60" rx="6" fill="#00A859" />
          <text x="50" y="32" fill="#FFFFFF" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">easy</text>
          <text x="50" y="48" fill="#FFFFFF" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">paisa</text>
        </svg>
      );
    }
    if (methodId === 'nayapay') {
      return (
        <svg className="w-10 h-6 shrink-0" viewBox="0 0 100 60" fill="none">
          <rect width="100" height="60" rx="6" fill="#FF5722" />
          <text x="50" y="35" fill="#FFFFFF" fontSize="14" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">Naya</text>
          <text x="50" y="50" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Pay</text>
        </svg>
      );
    }
    if (methodId === 'meezan') {
      return (
        <svg className="w-10 h-6 shrink-0" viewBox="0 0 100 60" fill="none">
          <rect width="100" height="60" rx="6" fill="#4B0F3A" />
          <text x="50" y="35" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Meezan</text>
          <text x="50" y="48" fill="#E8B036" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Bank</text>
        </svg>
      );
    }
    return (
      <div className="w-10 h-6 shrink-0 rounded bg-surface-3 flex items-center justify-center border border-hairline">
        <span className="text-[8px] font-bold text-ink-subtle uppercase">Bank</span>
      </div>
    );
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto p-8 border border-hairline bg-surface-1 rounded-lg text-center space-y-6 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-semantic-success/15 flex items-center justify-center mx-auto text-semantic-success">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold uppercase tracking-tight text-ink">Proof Submitted</h2>
          <p className="text-xs text-ink-subtle leading-relaxed max-w-sm mx-auto">
            Your payment proof has been sent to our administration team for manual verification. Upon validation, the tokens will be credited directly to your wallet.
          </p>
        </div>
        <button
          onClick={() => router.replace('/editor')}
          className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Go to Editor
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-6">
        {/* Warning Callout */}
        <div className="p-4 rounded-lg bg-[#e5484d1a] border border-[#e5484d33] flex items-start space-x-3.5">
          <AlertTriangle className="w-5 h-5 text-semantic-error shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Important Warning</h3>
            <p className="text-xs text-ink-muted leading-relaxed mt-1">
              Create your account before making payment, otherwise credits will be lost.
            </p>
          </div>
        </div>

        {/* Selected Plan Details */}
        <div className="p-6 rounded-lg border bg-surface-1 border-hairline space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink border-b border-hairline pb-3">Selected Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">{plan} Plan</p>
              <p className="text-[10px] text-ink-subtle mt-0.5">Pay-as-you-go token pack</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-mono font-bold text-ink">{price} PKR</p>
              <p className="text-[10px] text-primary uppercase font-semibold mt-0.5">{tokens} Tokens</p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6 rounded-lg border bg-surface-1 border-hairline space-y-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink border-b border-hairline pb-3">Send Payment To</h3>
          
          {loadingAccounts ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-xs text-ink-subtle">No payment methods are currently active.</p>
          ) : (
            <div className="space-y-3">
              {accounts.map(acc => (
                <label
                  key={acc.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedMethod === acc.id
                      ? 'bg-surface-2 border-primary/40'
                      : 'bg-surface-1 border-hairline hover:bg-surface-2/40'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedMethod === acc.id}
                      onChange={() => setSelectedMethod(acc.id)}
                      className="text-primary focus:ring-0 w-3.5 h-3.5"
                    />
                    {getLogo(acc.id)}
                    <span className="text-xs font-semibold text-ink truncate">{acc.name}</span>
                  </div>
                </label>
              ))}
            </div>
          )}

          {selectedAccount && (
            <div className="p-4 rounded-lg bg-surface-2 border border-hairline space-y-3 animate-fade-in">
              <div>
                <p className="text-[9px] uppercase font-mono tracking-wider text-ink-subtle">Account Title</p>
                <p className="text-xs font-semibold text-ink mt-0.5">{selectedAccount.account_title}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-mono tracking-wider text-ink-subtle">Account Number</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs font-semibold font-mono text-primary">{selectedAccount.account_number}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedAccount.account_number);
                      addToast('Account number copied!', 'success');
                    }}
                    className="text-[10px] font-semibold text-ink-subtle hover:text-ink cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
              {selectedAccount.extra_info.username && (
                <div>
                  <p className="text-[9px] uppercase font-mono tracking-wider text-ink-subtle">Username</p>
                  <p className="text-xs font-semibold text-ink mt-0.5">{selectedAccount.extra_info.username}</p>
                </div>
              )}
              {selectedAccount.extra_info.iban && (
                <div>
                  <p className="text-[9px] uppercase font-mono tracking-wider text-ink-subtle">IBAN</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] font-semibold font-mono text-ink-muted truncate mr-4">{selectedAccount.extra_info.iban}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedAccount.extra_info.iban || '');
                        addToast('IBAN copied!', 'success');
                      }}
                      className="text-[10px] font-semibold text-ink-subtle hover:text-ink shrink-0 cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="p-6 rounded-lg border bg-surface-1 border-hairline space-y-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink border-b border-hairline pb-3">Submit Proof</h3>
          
          {!isLoaded ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !isSignedIn ? (
            <div className="text-center py-4 space-y-4">
              <p className="text-xs text-ink-subtle leading-relaxed">
                You must sign in to submit your payment proof. Make sure you create an account first.
              </p>
              <SignInButton mode="modal">
                <button className="w-full py-2 bg-primary text-white hover:bg-primary-hover font-semibold rounded-md text-xs uppercase tracking-wide cursor-pointer">
                  Sign In / Create Account
                </button>
              </SignInButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider block">Uploaded Proof Image</label>
                <div className="flex items-center justify-center border-2 border-dashed border-hairline hover:border-hairline-strong rounded-lg p-6 bg-surface-2 transition-all relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="text-center space-y-2 pointer-events-none">
                    <Upload className="w-6 h-6 text-ink-subtle mx-auto" />
                    <p className="text-xs text-ink-muted font-medium">
                      {proofFile ? proofFile.name : 'Choose a file or drag here'}
                    </p>
                    <p className="text-[10px] text-ink-subtle">Supports PNG, JPG, JPEG up to 5MB</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !proofFile}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2"
              >
                {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></div>}
                <span>{submitting ? 'Submitting…' : 'Submit Payment Proof'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="h-screen overflow-y-auto flex flex-col font-sans bg-canvas text-ink">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 pt-24 pb-16">
        <a
          href="/pricing"
          className="inline-flex items-center space-x-2 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle hover:text-ink mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Plans</span>
        </a>
        <Suspense fallback={
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <CheckoutContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
