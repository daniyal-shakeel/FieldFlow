'use client';

import React, { useEffect, useState } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer/Footer';
import { fetchUserProfile, fetchUserTransactions, UserProfile, Transaction } from '@/lib/api';
import { Coins, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';

export default function TokenUsagePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSignedIn && user) {
      setLoading(true);
      Promise.all([
        fetchUserProfile(user.id),
        fetchUserTransactions(user.id)
      ])
        .then(([pData, tData]) => {
          setProfile(pData);
          setTransactions(tData.transactions);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isSignedIn, user, isLoaded]);

  if (!isLoaded || loading) {
    return (
      <div className="h-screen flex flex-col bg-canvas text-ink font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="h-screen flex flex-col bg-canvas text-ink font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md w-full p-8 rounded-lg border bg-surface-1 border-hairline text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <Coins className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight uppercase">Authentication Required</h2>
              <p className="text-xs text-ink-subtle leading-relaxed">
                Please sign in to view your token balance, check usage history, or purchase additional tokens.
              </p>
            </div>
            <SignInButton mode="modal">
              <button className="w-full py-2.5 bg-primary text-white hover:bg-primary-hover font-semibold rounded-md text-xs uppercase tracking-wide transition-all cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto flex flex-col font-sans bg-canvas text-ink">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pt-24 pb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-display-md uppercase">Token Usage</h1>
            <p className="text-xs text-ink-subtle mt-1">
              Track your wallet balance and document export activity. Need help? Read the{' '}
              <a href="/token-usage/how-to-use" className="text-primary hover:underline font-medium">
                How to Use Tokens guidelines
              </a>.
            </p>
          </div>
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-lg border bg-surface-1 border-hairline shrink-0">
            <Coins className="w-5 h-5 text-semantic-success" />
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-ink-subtle">Wallet Balance</p>
              <p className="text-xl font-bold tracking-tight text-ink mt-0.5">{profile?.tokens_balance} Tokens</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-hairline bg-surface-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">Transaction History</h2>
          </div>
          
          {transactions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center mx-auto text-ink-subtle">
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-xs text-ink-subtle">No transaction records found on this account.</p>
              <a href="/pricing" className="inline-block text-[11px] font-semibold text-primary uppercase hover:underline">
                Purchase Tokens
              </a>
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-surface-2/40 transition-colors">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      tx.amount > 0 ? 'bg-semantic-success/10 text-semantic-success' : 'bg-primary/10 text-primary'
                    }`}>
                      {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink truncate">{tx.description}</p>
                      {tx.comment && (
                        <p className="text-[11px] text-primary mt-1 font-medium italic">
                          Reason: {tx.comment}
                        </p>
                      )}
                      <p className="text-[10px] text-ink-subtle mt-0.5">
                        {new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(tx.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                  </div>
                  <div className={`text-xs font-semibold font-mono tracking-tight shrink-0 ${
                    tx.amount > 0 ? 'text-semantic-success' : 'text-ink-subtle'
                  }`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
