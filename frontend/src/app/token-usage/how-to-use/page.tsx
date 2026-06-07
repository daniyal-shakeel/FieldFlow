'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer/Footer';
import { ArrowLeft, Coins, CheckCircle, HelpCircle, Gift, AlertTriangle } from 'lucide-react';

export default function HowToUseTokensPage() {
  return (
    <div className="h-screen overflow-y-auto flex flex-col font-sans bg-canvas text-ink">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pt-24 pb-16">
        <a
          href="/token-usage"
          className="inline-flex items-center space-x-2 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle hover:text-ink mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Token Usage</span>
        </a>

        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border bg-surface-1 border-hairline text-primary mb-4 text-[10px] font-semibold tracking-eyebrow uppercase">
            <Coins className="w-3.5 h-3.5" />
            <span>Guidelines</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-display-md uppercase">How to Use Tokens</h1>
          <p className="text-xs md:text-sm text-ink-subtle mt-2 max-w-lg mx-auto leading-relaxed">
            Understand how our pay-as-you-go token mechanics, signup rewards, and referral programs work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch animate-fade-in">
          {/* Earning Tokens */}
          <div className="p-6 rounded-lg border bg-surface-1 border-hairline flex flex-col justify-between hover:border-hairline-strong transition-all">
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-surface-2 border border-hairline flex items-center justify-center text-primary">
                  <Gift className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-ink uppercase">Earning Tokens</h3>
              </div>
              
              <div className="space-y-4 text-xs leading-relaxed text-ink-muted">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink font-semibold block">5 Free Welcome Tokens</strong>
                    Every new user gets 5 free tokens automatically credited to their wallet balance on signup. No purchase required.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink font-semibold block">10 Referral Tokens</strong>
                    Share your unique referral link (available under the referrals dashboard). When a referred friend signs up and completes their first approved purchase, your wallet will be credited with **10 tokens** (capped at a maximum of 10 referrals / 100 tokens per account).
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink font-semibold block">Purchasing Tokens</strong>
                    Buy Starter, Standard, Pro, or Enterprise token packs from our pricing catalog. Upload manual proof of JazzCash, Easypaisa, NayaPay, or Meezan Bank payments, and your wallet will be updated upon validation.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Consuming Tokens */}
          <div className="p-6 rounded-lg border bg-surface-1 border-hairline flex flex-col justify-between hover:border-hairline-strong transition-all">
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-surface-2 border border-hairline flex items-center justify-center text-primary">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-ink uppercase">Consuming Tokens</h3>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-ink-muted">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink font-semibold block">0.5 Tokens per Exported Page</strong>
                    Each page loaded to the editor canvas costs exactly **0.5 tokens** upon export. For example, exporting a selection of 3 pages consumes 1.5 tokens.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink font-semibold block">Free Single-Page PDF Editing</strong>
                    Any single-page PDF is 100% free to edit and export unlimited times. No tokens, account registration, or log in are required for single-page files.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink font-semibold block">Export Gating (Multi-page only)</strong>
                    The editor requires you to have a sufficient token balance to perform exports of multi-page PDFs (cost = pages selected * 0.5). If your balance is insufficient, you can purchase tokens or refer friends to credit your wallet.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink font-semibold block">Transaction Ledger</strong>
                    Every token addition (earns/purchases/signup bonus) and subtraction (exports) is permanently logged in a secure database ledger. You can inspect your complete history logs on the token usage dashboard.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Protection Note */}
        <div className="mt-8 p-4 rounded-lg bg-surface-1 border border-hairline flex items-start space-x-3.5 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-brand-secure shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-ink-muted">
            <h4 className="font-bold uppercase tracking-wider text-ink">Payment & Signup Verification</h4>
            <p className="mt-1">
              Ensure you have signed up and synced your Clerk profile *before* transferring funds or uploading payment receipts. If a payment proof is uploaded, our administrators review and credit tokens by rounding payouts to whole-number counts.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
