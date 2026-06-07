'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { LOCAL_STORAGE_PREFIX } from '@/constants';

export const ReferralTracker = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}_referred_by`, ref);
    }
  }, [searchParams]);

  return null;
};
