import { useSyncExternalStore } from 'react';

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export function useBreakpoint(breakpoint) {
  let width = typeof breakpoint === 'number' ? breakpoint : BREAKPOINTS[breakpoint];
  
  if (width == null) {
    throw new Error(`useBreakpoint: unknown breakpoint "${breakpoint}". Use one of: ${Object.keys(BREAKPOINTS).join(', ')} or a raw px number.`);
  }

  let query = `(min-width: ${width}px)`;

  return useSyncExternalStore(
    (callback) => {
      let mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener('change', callback);
      return () => mediaQueryList.removeEventListener('change', callback);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
