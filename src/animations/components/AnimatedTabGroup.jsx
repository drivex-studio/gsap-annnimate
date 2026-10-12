import React, { useRef, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { cn } from '@/libs/utils/className';
gsap.registerPlugin(Flip);

export default function AnimatedTabGroup({
  activeId,
  pillClassName,
  containerClassName,
  duration = 0.4,
  ease = "expo.inOut",
  children,
  ...props
}) {
  let containerRef = useRef(null);
  let pillRef = useRef(null);
  let isMounted = useRef(false);

  let updatePillPosition = useCallback((targetElement, opacity = 1) => {
    if (!pillRef.current || !targetElement || !containerRef.current) return;
    let targetRect = targetElement.getBoundingClientRect();
    let containerRect = containerRef.current.getBoundingClientRect();
    
    gsap.set(pillRef.current, {
      width: targetRect.width,
      height: targetRect.height,
      x: targetRect.left - containerRect.left,
      y: targetRect.top - containerRect.top,
      opacity: opacity
    });
  }, []);

  let animatePillTo = useCallback((targetElement) => {
    if (!pillRef.current || !targetElement || !containerRef.current) return;
    
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      updatePillPosition(targetElement, 1);
      return;
    }
    
    let state = Flip.getState(pillRef.current);
    updatePillPosition(targetElement, 1);
    
    Flip.from(state, {
      duration: duration,
      ease: ease,
      absolute: true
    });
  }, [updatePillPosition, duration, ease]);

  useEffect(() => {
    let timeoutId;
    
    let handleResize = () => {
      let activeElement = containerRef.current?.querySelector(`[data-flip-id="${activeId}"]`);
      if (activeElement) {
        updatePillPosition(activeElement, 1);
      }
    };
    
    handleResize();
    isMounted.current = true;
    
    let debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 200);
    };
    
    window.addEventListener("resize", debouncedResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", debouncedResize);
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
    let activeElement = containerRef.current?.querySelector(`[data-flip-id="${activeId}"]`);
    if (activeElement) {
      animatePillTo(activeElement);
    }
  }, [activeId, animatePillTo]);

  return (
    <div ref={containerRef} className={cn("relative inline-flex", containerClassName)} {...props}>
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
