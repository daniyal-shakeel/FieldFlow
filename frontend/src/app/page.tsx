'use client';

import React from 'react';
import { usePdfStore } from '@/store/usePdfStore';
import {
  Sun,
  Moon,
  ArrowRight,
  UploadCloud,
  Zap,
  Shield,
  Receipt,
  Download,
  Layers,
  MousePointer,
  Link,
  CheckCircle2,
  Cpu,
  Server,
  BookOpen
} from 'lucide-react';
import { Footer } from '@/components/Footer/Footer';
import { PricingSection } from '@/components/Pricing/PricingSection';
import { SignInButton, UserButton, Show } from '@clerk/nextjs';

export default function LandingPage() {
  const isDarkMode = usePdfStore(state => state.isDarkMode);
  const toggleDarkMode = usePdfStore(state => state.toggleDarkMode);

  return (
    <div className="h-screen overflow-y-auto flex flex-col font-sans transition-colors duration-300 bg-canvas text-ink">
      <header className="h-14 px-6 flex items-center justify-between shrink-0 z-50 fixed top-0 left-0 right-0 border-b bg-canvas border-hairline">
        <div className="flex items-center space-x-6">
          <a
            href="/"
            className="text-sm font-semibold tracking-eyebrow text-ink shrink-0 uppercase flex items-center space-x-2 hover:opacity-95 transition-opacity"
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-primary text-ink"></span>
            <span>FIELDFLOW <span className="text-ink-subtle ml-0.5 font-normal uppercase">PDF</span></span>
          </a>
          <nav className="flex items-center space-x-4">
            <a
              href="/upload"
              className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle hover:text-ink transition-colors"
            >
              Editor
            </a>
            <a
              href="/pricing"
              className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle hover:text-ink transition-colors"
            >
              Pricing
            </a>
            <a
              href="/guide"
              className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle hover:text-ink transition-colors"
            >
              Guide & Limits
            </a>
            <a
              href="/privacy"
              className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle hover:text-ink transition-colors"
            >
              Privacy Policy
            </a>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md border border-hairline bg-surface-1 text-ink-subtle hover:text-ink hover:bg-surface-2 transition-all cursor-pointer"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

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
            className="flex items-center space-x-2 px-3.5 py-2 bg-primary text-ink hover:bg-primary-hover rounded-md transition-all font-medium tracking-wide text-xs uppercase"
          >
            <span>Launch App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 pt-28 pb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border bg-surface-1 border-hairline text-primary mb-4 text-[10px] font-semibold tracking-eyebrow uppercase animate-pulse">
            <Zap className="w-3.5 h-3.5" />
            <span>FieldFlow PDF Editor v1.4</span>
          </div>

          <h2 className="text-5xl md:text-7xl font-semibold mb-6 tracking-display-xl text-ink uppercase leading-none max-w-4xl mx-auto">
            Precision PDF editing <br />
            <span className="text-primary">without layout shift</span>
          </h2>

          <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed text-ink-muted tracking-body mb-8">
            An in-browser structured PDF text layer editor built for invoices, utility bills, and receipts. Redact, reposition, resize, and align elements with mathematical precision.
          </p>

          {/* Free Tier Attraction Banner */}
          <div className="max-w-xl mx-auto mb-8 p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-ink-muted flex items-center justify-center space-x-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-primary text-white uppercase tracking-wider shrink-0">
              Free Benefit
            </span>
            <span className="text-left font-medium">
              Edit and export <strong className="text-primary font-semibold">single-page PDFs 100% free</strong>, unlimited times, with no account required!
            </span>
          </div>

          <div className="flex justify-center space-x-4">
            <a
              href="/upload"
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-ink hover:bg-primary-hover active:bg-primary-focus rounded-md transition-all font-semibold text-sm uppercase tracking-wide shadow-lg shadow-primary/10"
            >
              <span>Launch Editor</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/guide"
              className="flex items-center space-x-2 px-6 py-3 bg-surface-1 border border-hairline hover:bg-surface-2 text-ink rounded-md transition-all font-semibold text-sm uppercase tracking-wide"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Guide</span>
            </a>
          </div>
        </div>

        <div className="mb-24 rounded-xl border border-hairline bg-surface-1 p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-3 left-4 flex space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
          </div>
          <div className="text-[10px] font-mono text-ink-subtle text-center border-b border-hairline pb-3 mb-6 uppercase tracking-wider">
            invoice_copy.pdf — FieldFlow PDF Editor
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
            <div className="lg:col-span-3 bg-canvas border border-hairline rounded-lg p-8 relative flex flex-col justify-between overflow-hidden aspect-[1.414/1] md:aspect-[1.8/1]">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="w-28 h-5 bg-surface-2 border border-hairline rounded flex items-center px-2">
                    <span className="text-[9px] font-mono text-ink-muted">In-Memory PDF</span>
                  </div>
                  <div className="w-20 h-3 bg-surface-2 rounded-sm opacity-50"></div>
                </div>
                <div className="text-right space-y-1">
                  <div className="w-24 h-4 bg-surface-2 rounded-sm"></div>
                  <div className="w-16 h-3 bg-surface-2 rounded-sm opacity-50"></div>
                </div>
              </div>

              <div className="my-8 space-y-6">
                <div className="flex justify-between items-center relative py-2 px-3 rounded border border-primary bg-primary/5">
                  <span className="text-xs font-semibold font-mono text-primary uppercase">Invoice Amount</span>
                  <span className="text-xs font-bold font-mono text-primary">$1,243.50</span>

                  <div className="absolute top-1/2 -left-20 w-20 border-t border-dashed border-primary/40"></div>
                  <div className="absolute -left-24 top-4 text-[8px] font-mono text-primary">x: 140 pt</div>

                  <div className="absolute top-1/2 -right-20 w-20 border-t border-dashed border-primary/40"></div>
                  <div className="absolute -right-24 top-4 text-[8px] font-mono text-primary">w: 380 pt</div>

                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex items-center space-x-1.5 p-1 rounded border border-hairline bg-surface-3 shadow-lg">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-primary text-ink uppercase">Left</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-medium text-ink-subtle hover:text-ink uppercase">Center</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-medium text-ink-subtle hover:text-ink uppercase">Right</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 px-3 rounded border border-dashed border-hairline-strong bg-transparent opacity-60">
                  <span className="text-xs font-mono text-ink-muted uppercase">Customer ID</span>
                  <span className="text-xs font-mono text-ink-muted">C-8243-FF</span>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-hairline pt-4">
                <div className="w-32 h-3 bg-surface-2 rounded-sm opacity-40"></div>
                <div className="w-24 h-4 bg-surface-2 rounded-sm"></div>
              </div>
            </div>

            <div className="border border-hairline bg-surface-2 rounded-lg p-5 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="border-b border-hairline pb-2">
                  <span className="text-[10px] font-mono text-primary uppercase tracking-wider">Field Inspector</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-ink-subtle uppercase">Coordinates</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-1.5 rounded border border-hairline bg-canvas text-[10px] font-mono text-ink">X: 140.0 pt</div>
                    <div className="p-1.5 rounded border border-hairline bg-canvas text-[10px] font-mono text-ink">Y: 280.5 pt</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-ink-subtle uppercase">Target Value</span>
                  <div className="p-2 rounded border border-primary bg-canvas text-[10px] font-mono text-primary leading-tight">
                    $1,243.50
                  </div>
                </div>

                <div className="p-3 rounded border border-hairline bg-canvas/40 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <span className="text-[9px] font-mono text-ink uppercase">Magic Linked Updates</span>
                  </div>
                  <p className="text-[8px] font-mono text-ink-subtle leading-normal">
                    This element appears 3 times. Update all copies instantly.
                  </p>
                </div>
              </div>

              <div className="text-[8px] font-mono text-ink-tertiary text-center pt-4">
                FIELDFLOW CORE ENGINE v1.4
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <div className="p-6 lg:p-8 rounded-lg border bg-surface-1 border-hairline">
            <div className="p-2.5 rounded-md mb-4 bg-surface-2 border border-hairline text-primary inline-flex">
              <Link className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold tracking-card-title text-ink uppercase mb-2">
              Magic Connected Fields
            </h3>
            <p className="text-xs leading-relaxed text-ink-muted">
              Auto-detects matching strings across bank copies, customer slips, and duplicate bill pages. Update once, sync everywhere dynamically.
            </p>
          </div>

          <div className="p-6 lg:p-8 rounded-lg border bg-surface-1 border-hairline">
            <div className="p-2.5 rounded-md mb-4 bg-surface-2 border border-hairline text-primary inline-flex">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold tracking-card-title text-ink uppercase mb-2">
              Real-Time Alignment
            </h3>
            <p className="text-xs leading-relaxed text-ink-muted">
              Adjust spacing, text alignment, fonts, and dimensions directly on the browser canvas. High-precision guides calculate spacing instantly.
            </p>
          </div>

          <div className="p-6 lg:p-8 rounded-lg border bg-surface-1 border-hairline">
            <div className="p-2.5 rounded-md mb-4 bg-surface-2 border border-hairline text-primary inline-flex">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold tracking-card-title text-ink uppercase mb-2">
              High-Fidelity Export
            </h3>
            <p className="text-xs leading-relaxed text-ink-muted">
              The server uses PyMuPDF True Redaction to bake edited fields straight into vector paths. Keeps background structures, logo stamps, and lines clean.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-24">
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-3xl font-semibold tracking-display-md text-ink uppercase">
              Designed for professional <br />
              <span className="text-primary">workflows</span>
            </h3>
            <p className="text-xs leading-relaxed text-ink-muted max-w-sm">
              We focus on absolute details, speed, and privacy. No complex overlays, no file-locking, and zero document retention.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-lg border bg-surface-1 border-hairline flex items-start space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Zero Server Retention</h4>
                <p className="text-xs leading-relaxed text-ink-muted">
                  PDF documents are parsed strictly in-memory. After you download your exported file, all buffers and metadata are immediately released from our server ram.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-lg border bg-surface-1 border-hairline flex items-start space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">IndexedDB Drafts</h4>
                <p className="text-xs leading-relaxed text-ink-muted">
                  Clicking "Save to Draft" saves your files and edit coordinates locally in your browser's IndexedDB. Restores file layouts instantly upon opening.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-lg border bg-surface-1 border-hairline flex items-start space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Visual Selective Parsing</h4>
                <p className="text-xs leading-relaxed text-ink-muted">
                  Multi-page documents can be visually targeted to select and load only specific pages onto the canvas. No more page limits—pay only for what you need!
                </p>
              </div>
            </div>
          </div>
        </div>

        <PricingSection />

        <div className="rounded-lg border bg-surface-1 border-hairline p-12 text-center relative overflow-hidden mb-16">
          <h3 className="text-3xl font-semibold tracking-display-md text-ink uppercase mb-2">
            Start editing in seconds
          </h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed mb-8">
            Single-page PDFs are 100% FREE with unlimited downloads and no registration. For multi-page PDFs, select your pages dynamically at just 0.5 tokens per page.
          </p>
          <a
            href="/editor"
            className="inline-flex items-center space-x-2 px-8 py-3.5 bg-primary text-ink hover:bg-primary-hover active:bg-primary-focus rounded-md transition-all font-semibold text-xs uppercase tracking-wide"
          >
            <span>Launch Free Editor</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <Footer />
      </main>
    </div>
  );
}
