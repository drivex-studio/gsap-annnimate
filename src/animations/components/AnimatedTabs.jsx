import React, { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap'; // module id: 989970
import { Flip } from 'gsap/Flip'; // module id: 433965
import { cn } from '@/libs/utils/className';

gsap.registerPlugin(Flip);

// module id: 876355
export default function AnimatedTabs({
  activeId, // original mangled: t
  pillClassName, // original mangled: a
  containerClassName, // original mangled: o
  duration = 0.4, // original mangled: l
  ease = "expo.inOut", // original mangled: u
  children, // original mangled: c
  ...rest // original mangled: h
}) {
  let containerRef = useRef(null); // original mangled: f
  let pillRef = useRef(null); // original mangled: p
  let isMounted = useRef(false); // original mangled: d

  let setPosition = useCallback((target, opacity = 1) => { // original mangled: g
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

  let animateTo = useCallback((target) => { // original mangled: m
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

  // Initial layout and resize handling
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
  }, []); // Note: Emulates the original code's exact dependency array

  // Animate when activeId changes
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
