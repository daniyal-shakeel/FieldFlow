'use client';

import React, { useEffect, useState } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer/Footer';
import { fetchUserProfile, UserProfile } from '@/lib/api';
import { Award, Copy, Check, Info, Share2, Users } from 'lucide-react';
import { usePdfStore } from '@/store/usePdfStore';

export default function ReferralsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const addToast = usePdfStore(state => state.addToast);

  useEffect(() => {
    if (isSignedIn && user) {
      setLoading(true);
      fetchUserProfile(user.id)
        .then((data) => {
          setProfile(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isSignedIn, user, isLoaded]);

  const referralUrl = user ? `${window.location.origin}/?ref=${user.id}` : '';

  const handleCopy = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl)
      .then(() => {
        setCopied(true);
        addToast('Referral link copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error(err);
        addToast('Failed to copy referral link.', 'error');
      });
  };

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
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight uppercase">Authentication Required</h2>
              <p className="text-xs text-ink-subtle leading-relaxed">
                Please sign in to access your custom referral link, share with friends, and start earning tokens.
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

  const successCount = profile?.referrals_count || 0;
  const remainingCount = Math.max(0, 10 - successCount);
  const totalEarned = successCount * 10;

  return (
    <div className="h-screen overflow-y-auto flex flex-col font-sans bg-canvas text-ink">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pt-24 pb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border bg-surface-1 border-hairline text-primary mb-4 text-[10px] font-semibold tracking-eyebrow uppercase">
            <Users className="w-3.5 h-3.5" />
            <span>Referral Program</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-display-md text-ink uppercase mb-4">
            Invite Friends, Earn Tokens
          </h1>
          <p className="text-xs md:text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
            Share the power of precision PDF editing. When someone registers with your link and buys a plan, you receive 10 tokens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-5 rounded-lg border bg-surface-1 border-hairline flex flex-col justify-between hover:border-hairline-strong transition-all">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-ink-subtle">Successful Referrals</p>
              <p className="text-2xl font-bold tracking-tight mt-1">{successCount} / 10</p>
            </div>
            <div className="text-[10px] text-ink-subtle mt-4">
              {remainingCount > 0 ? `${remainingCount} referral slots remaining` : 'Maximum slots reached'}
            </div>
          </div>

          <div className="p-5 rounded-lg border bg-surface-1 border-hairline flex flex-col justify-between hover:border-hairline-strong transition-all">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-ink-subtle">Total Earned</p>
              <p className="text-2xl font-bold tracking-tight text-semantic-success mt-1">{totalEarned} Tokens</p>
            </div>
            <div className="text-[10px] text-ink-subtle mt-4">
              Value of {totalEarned} document exports
            </div>
          </div>

          <div className="p-5 rounded-lg border bg-surface-1 border-hairline flex flex-col justify-between hover:border-hairline-strong transition-all">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-ink-subtle">Your Link Code</p>
              <p className="text-sm font-semibold truncate mt-2 font-mono text-primary">{user.id}</p>
            </div>
            <div className="text-[10px] text-ink-subtle mt-4">
              Referral code references your account
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8 rounded-lg border bg-surface-1 border-hairline mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink mb-4">Your Invitation Link</h2>
          <div className="flex gap-2.5">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="flex-1 bg-surface-2 border border-hairline rounded-md px-3 py-2 text-xs font-mono text-ink-muted focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 border border-hairline bg-surface-2 hover:bg-surface-3 hover:text-ink text-ink-muted rounded-md transition-all flex items-center space-x-2 text-xs uppercase font-medium cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-semantic-success" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="p-6 rounded-lg border bg-surface-1 border-hairline space-y-4">
          <div className="flex items-center space-x-2.5 text-xs font-semibold uppercase tracking-wide text-ink border-b border-hairline pb-3">
            <Info className="w-4 h-4 text-primary" />
            <span>How the program works</span>
          </div>
          <ul className="space-y-3.5 text-xs text-ink-muted leading-relaxed">
            <li className="flex items-start space-x-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5"></span>
              <span>
                <strong>Share your link</strong>: Copy your referral link above and send it to friends, colleagues, or share it on social media.
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5"></span>
              <span>
                <strong>New Sign Up</strong>: When someone navigates to the app via your link and signs up for a new account, they are locked as your referral.
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5"></span>
              <span>
                <strong>First Purchase</strong>: Once your referred friend makes their first payment proof purchase and it is approved by the admin, you instantly receive <strong>10 tokens</strong> in your wallet.
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5"></span>
              <span>
                <strong>Maximum Capacity</strong>: You can earn rewards for up to <strong>10 referred accounts</strong> (100 tokens maximum). Any registrations beyond 10 referrals will not award tokens.
              </span>
            </li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
