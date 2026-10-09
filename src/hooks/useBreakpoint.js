import { useSyncExternalStore } from 'react';

const BREAKPOINTS = { // original mangled: r
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// module id: 400701
export function useBreakpoint(breakpoint) { // original mangled: e
  let width = typeof breakpoint === 'number' ? breakpoint : BREAKPOINTS[breakpoint]; // original mangled: i
  
  if (width == null) {
    throw new Error(`useBreakpoint: unknown breakpoint "${breakpoint}". Use one of: ${Object.keys(BREAKPOINTS).join(', ')} or a raw px number.`);
  }

  let query = `(min-width: ${width}px)`; // original mangled: n

  return useSyncExternalStore(
    (callback) => { // original mangled: e
      let mediaQueryList = window.matchMedia(query); // original mangled: t
      mediaQueryList.addEventListener('change', callback);
      return () => mediaQueryList.removeEventListener('change', callback);
    },
    () => window.matchMedia(query).matches,
    () => false // Server-side rendering fallback
  );
}
