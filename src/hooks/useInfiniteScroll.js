"use client"; 
import { useState, useRef, useEffect, useCallback, startTransition } from 'react'; // module id: 271645

/* --- useInfiniteScroll --- */
// module id: 451945

export const BATCH_SIZE = 12;

export function useInfiniteScroll(totalItems, resetDependencies = []) {
  const [displayedCount, setDisplayedCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef(null);
  const lastTimeRef = useRef(0);
  const countRef = useRef(displayedCount);

  useEffect(() => {
    countRef.current = displayedCount;
  }, [displayedCount]);

  useEffect(() => {
    setDisplayedCount(BATCH_SIZE);
    countRef.current = BATCH_SIZE;
    lastTimeRef.current = 0;
  }, resetDependencies);

  const handleScroll = useCallback(() => {
    if (countRef.current >= totalItems) return;
    
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    
    const now = performance.now();
    if (now - lastTimeRef.current < 150) return;
    if (sentinel.getBoundingClientRect().top - window.innerHeight >= 1500) return;
    
    lastTimeRef.current = now;
    
    const nextCount = Math.min(countRef.current + BATCH_SIZE, totalItems);
    countRef.current = nextCount;
    
    startTransition(() => {
      setDisplayedCount(nextCount);
    });
  }, [totalItems]);

  useEffect(() => {
    let scrollParent = null;
    let isAttached = false;
    
    const onScroll = () => handleScroll();
    
    const animationFrameId = requestAnimationFrame(() => {
      if (!isAttached) {
        const getScrollParent = (node) => {
          if (!node) return null;
          let current = node.parentElement;
          while (current && current !== document.body && current !== document.documentElement) {
            const style = window.getComputedStyle(current);
            if (/(auto|scroll|overlay)/.test(style.overflowY)) {
              return current;
            }
            current = current.parentElement;
          }
          return window;
        };

        scrollParent = getScrollParent(sentinelRef.current);
        
        if (scrollParent) {
          const target = scrollParent === window ? window : scrollParent;
          target.addEventListener('scroll', onScroll, { passive: true });
          isAttached = true;
          handleScroll();
        }
      }
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (isAttached && scrollParent) {
        const target = scrollParent === window ? window : scrollParent;
        target.removeEventListener('scroll', onScroll);
      }
    };
  }, [handleScroll]);

  return {
    displayedCount,
    sentinelRef,
    hasMore: displayedCount < totalItems
  };
}