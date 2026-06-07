'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePdfStore } from '@/store/usePdfStore';

export const DynamicTitle = () => {
  const pathname = usePathname();
  const filename = usePdfStore((state) => state.filename);
  const selectedSpanId = usePdfStore((state) => state.selectedSpanId);
  const selectedCustomBoxId = usePdfStore((state) => state.selectedCustomBoxId);

  useEffect(() => {
    let isTabFocused = true;

    const getActiveTitle = () => {
      if (pathname === '/pricing') {
        return 'Pricing Plans - FieldFlow PDF';
      }
      if (pathname === '/pricing/pay') {
        return 'Checkout Payment Details - FieldFlow PDF';
      }
      if (pathname === '/token-usage') {
        return 'Token Usage History - FieldFlow PDF';
      }
      if (pathname === '/token-usage/how-to-use') {
        return 'Token Guidelines & Mechanics - FieldFlow PDF';
      }
      if (pathname === '/referrals') {
        return 'Share & Earn Referrals - FieldFlow PDF';
      }
      if (pathname === '/guide') {
        return 'User Guide & Boundaries - FieldFlow PDF';
      }
      if (pathname === '/privacy') {
        return 'Privacy Guarantee & Policy - FieldFlow PDF';
      }
      if (pathname === '/upload') {
        return 'Upload Document - FieldFlow PDF';
      }
      if (pathname === '/editor') {
        if (!filename) {
          return 'Editor - FieldFlow PDF';
        }
        if (selectedCustomBoxId) {
          return `Editing Custom Text | ${filename} - FieldFlow PDF`;
        }
        if (selectedSpanId) {
          return `Modifying PDF Field | ${filename} - FieldFlow PDF`;
        }
        return `Editing: ${filename} - FieldFlow PDF`;
      }
      return 'FieldFlow PDF - Precision Layout-Safe PDF Editor';
    };


    const updateTitle = () => {
      const activeTitle = getActiveTitle();
      const currentTitle = isTabFocused ? activeTitle : 'Come back! ✏️';
      if (document.title !== currentTitle) {
        document.title = currentTitle;
      }
    };

    const handleFocus = () => {
      isTabFocused = true;
      updateTitle();
    };

    const handleBlur = () => {
      isTabFocused = false;
      updateTitle();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    updateTitle();

    let observer: MutationObserver | null = null;
    const target = document.querySelector('title');
    if (target) {
      observer = new MutationObserver(() => {
        updateTitle();
      });
      observer.observe(target, { childList: true, characterData: true, subtree: true });
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [pathname, filename, selectedSpanId, selectedCustomBoxId]);

  return null;
};
