"use client"; 
import { useState, useRef, useEffect, useCallback, startTransition } from 'react';

export const BATCH_SIZE = 12;

export function useInfiniteScroll(maxCount, resetDependencies = []) {
  let [displayedCount, setDisplayedCount] = useState(BATCH_SIZE);
  let sentinelRef = useRef(null);
  let lastScrollTime = useRef(0);
  let currentCountRef = useRef(displayedCount);

  useEffect(() => {
    currentCountRef.current = displayedCount;
  }, [displayedCount]);

  useEffect(() => {
    setDisplayedCount(BATCH_SIZE);
    currentCountRef.current = BATCH_SIZE;
    lastScrollTime.current = 0;
  }, resetDependencies);

  let handleScroll = useCallback(() => {
    if (currentCountRef.current >= maxCount) return;
    
    let el = sentinelRef.current;
    if (!el) return;
    
    let now = performance.now();
    if (now - lastScrollTime.current < 150 || el.getBoundingClientRect().top - window.innerHeight >= 1500) return;
    
    lastScrollTime.current = now;
    let nextCount = Math.min(currentCountRef.current + BATCH_SIZE, maxCount);
    currentCountRef.current = nextCount;
    
    startTransition(() => {
      setDisplayedCount(nextCount);
    });
  }, [maxCount]);

  useEffect(() => {
    let scrollParent = null;
    let isAttached = false;
    
    let onScrollEvent = () => handleScroll();
    
    let rafId = requestAnimationFrame(() => {
      if (!isAttached) {
        scrollParent = (function getScrollParent(node) {
          if (!node) return null;
          let parent = node.parentElement;
          while (parent && parent !== document.body && parent !== document.documentElement) {
            let style = window.getComputedStyle(parent);
            if (/(auto|scroll|overlay)/.test(style.overflowY)) return parent;
            parent = parent.parentElement;
          }
          return window;
        })(sentinelRef.current);
        
        if (scrollParent) {
          (scrollParent === window ? window : scrollParent).addEventListener("scroll", onScrollEvent, { passive: true });
          isAttached = true;
          handleScroll();
        }
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (isAttached && scrollParent) {
        (scrollParent === window ? window : scrollParent).removeEventListener("scroll", onScrollEvent);
      }
    };
  }, [handleScroll]);

  return {
    displayedCount,
    sentinelRef,
    hasMore: displayedCount < maxCount
  };
}
