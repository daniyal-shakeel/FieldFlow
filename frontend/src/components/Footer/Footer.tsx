import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-canvas border-t border-hairline pt-16 pb-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
        <div className="md:col-span-2 space-y-4">
          <a 
            href="/" 
            className="text-sm font-semibold tracking-eyebrow text-ink uppercase flex items-center space-x-2 hover:opacity-95 transition-opacity"
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
            <span>FIELDFLOW <span className="text-ink-subtle ml-0.5 font-normal uppercase">PDF</span></span>
          </a>
          <p className="text-xs text-ink-subtle leading-relaxed max-w-sm">
            Precision in-browser PDF editor designed for structured documents. Redact, align, and modify invoice text layers without layout shifts.
          </p>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full border border-hairline bg-surface-1 text-semantic-success text-[10px] font-semibold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse"></span>
            <span>All Systems Operational</span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink">Product</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="/upload" className="text-ink-subtle hover:text-ink transition-colors">
                PDF Editor
              </a>
            </li>
            <li>
              <a href="/pricing" className="text-ink-subtle hover:text-ink transition-colors">
                Pricing
              </a>
            </li>
            <li>
              <a href="/upload" className="text-ink-subtle hover:text-ink transition-colors">
                Visual Selector
              </a>
            </li>
            <li>
              <a href="/upload" className="text-ink-subtle hover:text-ink transition-colors">
                Local Drafts
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink">Resources</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="/guide" className="text-ink-subtle hover:text-ink transition-colors">
                User Guide
              </a>
            </li>
            <li>
              <a href="/guide" className="text-ink-subtle hover:text-ink transition-colors">
                Tool Boundaries
              </a>
            </li>
            <li>
              <a href="/guide" className="text-ink-subtle hover:text-ink transition-colors">
                Keyboard Shortcuts
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink">Legal</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="/privacy" className="text-ink-subtle hover:text-ink transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="/privacy" className="text-ink-subtle hover:text-ink transition-colors">
                Data Security
              </a>
            </li>
            <li>
              <a href="/privacy" className="text-ink-subtle hover:text-ink transition-colors">
                GDPR & Compliance
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] font-mono text-ink-tertiary uppercase tracking-normal">
          FieldFlow PDF © 2026 • Professional Document Utilities
        </p>
        <div className="flex space-x-6 text-[10px] font-mono text-ink-tertiary uppercase tracking-normal">
          <a href="/privacy" className="hover:text-ink transition-colors">Security</a>
          <span>•</span>
          <a href="/guide" className="hover:text-ink transition-colors">Support</a>
        </div>
      </div>
    </footer>
  );
};
