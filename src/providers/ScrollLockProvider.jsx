'use client';
import { createContext, useContext, useRef, useState, useCallback } from 'react';

const ScrollLockContext = createContext({
  lockScroll: () => {},
  unlockScroll: () => {},
  isLocked: false
});

export default function ScrollLockProvider({ children }) {
  const lockCount = useRef(0);
  const [isLocked, setIsLocked] = useState(false);

  const lockScroll = useCallback(() => {
    lockCount.current++;
    if (lockCount.current === 1) {
      window.lenis?.stop();
      window.lenisApp?.stop();
      setIsLocked(true);
    }
  }, []);

  const unlockScroll = useCallback(() => {
    lockCount.current = Math.max(0, lockCount.current - 1);
    if (lockCount.current === 0) {
      window.lenis?.start();
      window.lenisApp?.start();
      setIsLocked(false);
    }
  }, []);

  return (
    <ScrollLockContext.Provider value={{ lockScroll, unlockScroll, isLocked }}>
      {children}
    </ScrollLockContext.Provider>
  );
}

export const useScrollLockContext = () => useContext(ScrollLockContext);
