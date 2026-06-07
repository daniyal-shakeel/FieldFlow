'use client';

import React, { useEffect, useState } from 'react';
import { useUser, SignInButton, UserButton, Show } from '@clerk/nextjs';
import { usePdfStore } from '@/store/usePdfStore';
import { Sun, Moon, ArrowRight, Coins } from 'lucide-react';
import { fetchUserProfile } from '@/lib/api';
import { usePathname } from 'next/navigation';

export const Header: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const isDarkMode = usePdfStore((state) => state.isDarkMode);
  const toggleDarkMode = usePdfStore((state) => state.toggleDarkMode);
  const pathname = usePathname();
  const [tokens, setTokens] = useState<number | null>(null);

  useEffect(() => {
    if (isSignedIn && user) {
      fetchUserProfile(user.id)
        .then((profile) => {
          setTokens(profile.tokens_balance);
        })
        .catch(console.error);
    }
  }, [isSignedIn, user, pathname]);

  return (
    <header className="h-14 px-6 flex items-center justify-between shrink-0 z-50 fixed top-0 left-0 right-0 border-b bg-canvas border-hairline">
      <div className="flex items-center space-x-6 min-w-0">
        <a 
          href="/" 
          className="text-sm font-semibold tracking-eyebrow text-ink shrink-0 uppercase flex items-center space-x-2 hover:opacity-95 transition-opacity"
        >
          <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
          <span>FIELDFLOW <span className="text-ink-subtle ml-0.5 font-normal uppercase">PDF</span></span>
        </a>
        <nav className="hidden md:flex items-center space-x-4 shrink-0">
          <a 
            href="/upload" 
            className={`text-[11px] uppercase tracking-wider transition-colors ${
              (pathname === '/editor' || pathname === '/upload') ? 'font-bold text-primary' : 'font-medium text-ink-subtle hover:text-ink'
            }`}
          >
            Editor
          </a>
          <a 
            href="/pricing" 
            className={`text-[11px] uppercase tracking-wider transition-colors ${
              pathname.startsWith('/pricing') ? 'font-bold text-primary' : 'font-medium text-ink-subtle hover:text-ink'
            }`}
          >
            Pricing
          </a>
          <a 
            href="/referrals" 
            className={`text-[11px] uppercase tracking-wider transition-colors ${
              pathname === '/referrals' ? 'font-bold text-primary' : 'font-medium text-ink-subtle hover:text-ink'
            }`}
          >
            Refer & Earn
          </a>
          {isSignedIn && (
            <a 
              href="/token-usage" 
              className={`text-[11px] uppercase tracking-wider transition-colors ${
                pathname === '/token-usage' ? 'font-bold text-primary' : 'font-medium text-ink-subtle hover:text-ink'
              }`}
            >
              Token Usage
            </a>
          )}
          <a 
            href="/guide" 
            className={`text-[11px] uppercase tracking-wider transition-colors ${
              pathname === '/guide' ? 'font-bold text-primary' : 'font-medium text-ink-subtle hover:text-ink'
            }`}
          >
            Guide & Limits
          </a>
          <a 
            href="/privacy" 
            className={`text-[11px] uppercase tracking-wider transition-colors ${
              pathname === '/privacy' ? 'font-bold text-primary' : 'font-medium text-ink-subtle hover:text-ink'
            }`}
          >
            Privacy Policy
          </a>
        </nav>
      </div>

      <div className="flex items-center space-x-3 shrink-0">
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-md border border-hairline bg-surface-1 text-ink-subtle hover:text-ink hover:bg-surface-2 transition-all cursor-pointer"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {isSignedIn && tokens !== null && (
          <a 
            href="/token-usage" 
            className="px-2.5 py-1.5 rounded-md bg-surface-1 border border-hairline hover:border-hairline-strong transition-all flex items-center space-x-1.5 text-xs text-ink-muted"
          >
            <Coins className="w-3.5 h-3.5 text-semantic-success" />
            <span>{tokens} Tokens</span>
          </a>
        )}

        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="px-3.5 py-2 border border-hairline bg-surface-1 text-ink hover:bg-surface-2 rounded-md transition-all font-medium tracking-wide text-xs uppercase cursor-pointer">
              Sign In
            </button>
          </SignInButton>
        </Show>

        <Show when="signed-in">
          <UserButton />
        </Show>

        <a
          href="/upload"
          className="flex items-center space-x-2 px-3.5 py-2 bg-primary text-white hover:bg-primary-hover rounded-md transition-all font-medium tracking-wide text-xs uppercase cursor-pointer"
        >
          <span>Launch App</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </a>
      </div>
    </header>
  );
};
