'use client';

import { useEffect } from 'react';
import { usePdfStore } from '@/store/usePdfStore';
import { LOCAL_STORAGE_THEME_KEY } from '@/constants';

export const ThemeManager = () => {
  const isDarkMode = usePdfStore((state) => state.isDarkMode);

  useEffect(() => {
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    if (savedTheme !== null) {
      const isDark = savedTheme === 'true';
      if (isDark !== isDarkMode) {
        usePdfStore.setState({ isDarkMode: isDark });
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.removeAttribute('style');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.removeAttribute('style');
    }
  }, [isDarkMode]);

  return null;
};
