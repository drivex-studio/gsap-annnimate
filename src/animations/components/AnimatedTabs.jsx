import React, { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { cn } from '@/libs/utils/className';

gsap.registerPlugin(Flip);

export default function AnimatedTabs({
  activeId,
  pillClassName,
  containerClassName,
  duration = 0.4,
  ease = "expo.inOut",
  children,
  ...rest
}) {
  let containerRef = useRef(null);
  let pillRef = useRef(null);
  let isMounted = useRef(false);

  let setPosition = useCallback((target, opacity = 1) => {
    if (!pillRef.current || !target || !containerRef.current) return;
    
    let targetRect = target.getBoundingClientRect();
    let containerRect = containerRef.current.getBoundingClientRect();
    
    gsap.set(pillRef.current, {
      width: targetRect.width,
      height: targetRect.height,
      x: targetRect.left - containerRect.left,
      y: targetRect.top - containerRect.top,
      opacity: opacity
    });
  }, []);

  let animateTo = useCallback((target) => {
    if (!pillRef.current || !target || !containerRef.current) return;
    
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPosition(target, 1);
      return;
    }
    
    let state = Flip.getState(pillRef.current);
    setPosition(target, 1);
    
    Flip.from(state, {
      duration,
      ease,
      absolute: true
    });
  }, [setPosition, duration, ease]);

  useEffect(() => {
    let timeoutId;
    
    let updateLayout = () => {
      let activeEl = containerRef.current?.querySelector(`[data-flip-id="${activeId}"]`);
      if (activeEl) setPosition(activeEl, 1);
    };
    
    updateLayout();
    isMounted.current = true;
    
    let handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateLayout, 200);
    };
    
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
    
    let activeEl = containerRef.current?.querySelector(`[data-flip-id="${activeId}"]`);
    if (activeEl) animateTo(activeEl);
  }, [activeId, animateTo]);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex", containerClassName)}
      {...rest}
    >
      <span
        ref={pillRef}
        aria-hidden="true"
        className={cn("pointer-events-none absolute left-0 top-0 bg-foreground/10 opacity-0", pillClassName)}
        style={{ zIndex: 1 }}
      />
      {children}
    </div>
  );
}
