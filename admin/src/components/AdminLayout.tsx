'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LOCAL_STORAGE_TOKEN_KEY, APP_TITLE, SIDEBAR_NAV_ITEMS } from '@/constants';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) {
      router.replace('/');
      return;
    }
    setReady(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
    router.replace('/');
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin-slow" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="w-60 flex-shrink-0 border-r border-hairline bg-surface-1 flex flex-col">
        <div className="px-5 py-5 border-b border-hairline">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h8M2 12h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-ink">{APP_TITLE}</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {SIDEBAR_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-surface-2 text-ink'
                    : 'text-ink-subtle hover:text-ink hover:bg-surface-2'
                }`}
              >
                {item.icon === 'users' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM2 14c0-2.21 2.69-4 6-4s6 1.79 6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                {item.icon === 'analytics' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 13h12M4 10v3M8 6v7M12 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}

                {item.icon === 'plans' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 6h6M5 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                {item.icon === 'payments' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
                {item.icon === 'accounts' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M1.5 13.5h13M3.5 13.5v-8h9v8M6.5 8.5v2M9.5 8.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                {item.icon === 'settings' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M6.73 2.24l-.27 1.09a.75.75 0 01-.52.52L4.85 4.12l-.73-.73a6.04 6.04 0 00-.88.88l.73.73-.27 1.09a.75.75 0 01-.52.52L2.24 6.73a6.04 6.04 0 000 1.24l.94.12c.25.03.47.18.58.4l.42.84-.48.96c.24.32.52.6.84.84l.96-.48.84.42c.22.11.37.33.4.58l.12.94c.41.04.83.04 1.24 0l.12-.94c.03-.25.18-.47.4-.58l.84-.42.96.48c.32-.24.6-.52.84-.84l-.48-.96.42-.84c.11-.22.33-.37.58-.4l.94-.12c.04-.41.04-.83 0-1.24l-.94-.12a.75.75 0 01-.58-.4l-.42-.84.48-.96a6.04 6.04 0 00-.84-.84l-.96.48-.84-.42a.75.75 0 01-.4-.58l-.12-.94a6.04 6.04 0 00-1.24 0z" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                )}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-hairline">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-ink-subtle hover:text-semantic-error hover:bg-surface-2 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M5.5 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
