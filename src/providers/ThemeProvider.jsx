"use client";
import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';

const STORAGE_KEY = 'theme';
const DEFAULT_THEME = 'dark';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(DEFAULT_THEME);
  const [systemTheme, setSystemTheme] = useState(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initialTheme = (() => {
      try {
        return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
      } catch (err) {
        return DEFAULT_THEME;
      }
    })();
    setThemeState(initialTheme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    setMounted(true);
    const handleMediaChange = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener?.('change', handleMediaChange);
    
    return () => mediaQuery.removeEventListener?.('change', handleMediaChange);
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    if (!mounted) return;

    (() => {
      if (typeof document === 'undefined') return;
      const css = document.createElement('style');
      css.appendChild(
        document.createTextNode(
          '*,*::before,*::after{transition:none !important;animation-duration:0s !important;animation-delay:0s !important;}'
        )
      );
      document.head.appendChild(css);
      window.getComputedStyle(document.body).opacity;
      
      requestAnimationFrame(() => {
        document.head.removeChild(css);
      });
    })();
    
    (() => {
      if (typeof document === 'undefined') return;
      const root = document.documentElement;
      if (resolvedTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    })();
  }, [mounted, resolvedTheme]);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (err) {}
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
}
