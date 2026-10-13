"use client";
import React, { useRef, useState, useEffect } from 'react';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Draggable } from 'gsap/Draggable'; 

import { ArrowCounterClockwise } from '@phosphor-icons/react';

gsap.registerPlugin(useGSAP, Draggable);

export default function ScrubSim({ caption, options = {} }) {
  const smoothing = options.smoothing ?? 0.4;
  
  const figureRef = useRef(null);
  const trackRef = useRef(null);
  const indicatorRef = useRef(null);
  const scrubBoundsRef = useRef(null);
  const handleRef = useRef(null);
  const quickToRef = useRef(null);
  const draggableInstanceRef = useRef(null);
  const tweenRef = useRef(null);
  const replayFnRef = useRef(null);
  
  const [progress, setProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  function getMaxScrollWidth() {
    const boundsEl = scrubBoundsRef.current;
    const handleEl = handleRef.current;
    if (boundsEl && handleEl) {
      return Math.max(1, boundsEl.clientWidth - handleEl.offsetWidth);
    }
    return 1;
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener?.('change', handleChange);
    
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  const updateIndicator = (percent) => {
    const trackEl = trackRef.current;
    const indicatorEl = indicatorRef.current;
    
    const maxOffset = (!trackEl || !indicatorEl) 
      ? 0 
      : Math.max(0, trackEl.clientWidth - indicatorEl.offsetWidth);
      
    quickToRef.current?.(maxOffset * (percent / 100));
  };

  useGSAP(() => {
    quickToRef.current = gsap.quickTo(indicatorRef.current, 'x', {
      duration: prefersReducedMotion ? 0 : smoothing,
      ease: 'power3',
    });
    quickToRef.current?.(0);
    
    gsap.set(handleRef.current, { x: 0 });
    
    if (draggableInstanceRef.current?.[0]) {
      draggableInstanceRef.current[0].kill();
    }
    
    draggableInstanceRef.current = Draggable.create(handleRef.current, {
      type: 'x',
      bounds: scrubBoundsRef.current,
      inertia: false,
      onPress() {
        tweenRef.current?.kill();
        this.update();
      },
      onDrag() {
        const percent = gsap.utils.clamp(0, 100, (this.x / getMaxScrollWidth()) * 100);
        setProgress(percent);
        updateIndicator(percent);
      },
    });

    replayFnRef.current = () => {
      tweenRef.current?.kill();
      
      if (prefersReducedMotion) {
        setProgress(0);
        updateIndicator(0);
        return;
      }
      
      const state = { p: 0 };
      setProgress(0);
      gsap.set(handleRef.current, { x: 0 });
      updateIndicator(0);
      
      tweenRef.current = gsap.to(state, {
        p: 100,
        duration: 1.3,
        ease: 'power1.inOut',
        onUpdate: () => {
          setProgress(state.p);
          gsap.set(handleRef.current, { x: (getMaxScrollWidth() * state.p) / 100 });
          updateIndicator(state.p);
        },
        onComplete: () => {
          draggableInstanceRef.current?.[0]?.update();
        },
      });
    };
  }, { scope: figureRef, dependencies: [prefersReducedMotion, smoothing] });

  useEffect(() => {
    const figureEl = figureRef.current;
    if (!figureEl) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        replayFnRef.current?.();
        observer.disconnect();
      }
    }, { rootMargin: '-10% 0px' });
    
    observer.observe(figureEl);
    
    return () => {
      observer.disconnect();
      tweenRef.current?.kill();
    };
  }, [prefersReducedMotion]);

  return (
    <figure ref={figureRef} className="not-prose my-12 flex flex-col gap-12">
      {caption ? (
        <figcaption className="text-mono-sm text-foreground-muted">
          Fig &middot; {caption}
        </figcaption>
      ) : null}
      <div 
        aria-label="Scrub - drag the handle to advance the animation both ways" 
        className="relative border border-foreground/12 bg-surface px-24 py-32 lg:px-32"
      >
        <button
          type="button"
          onClick={() => replayFnRef.current?.()}
          aria-label="Replay the scrub sweep"
          className="absolute right-12 top-12 z-10 inline-flex size-28 items-center justify-center text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/50"
        >
          <ArrowCounterClockwise className="size-16" />
        </button>
        
        <div ref={trackRef} className="relative mb-32 flex h-24 items-center overflow-visible">
          <span 
            aria-hidden="true" 
            className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-foreground/12" 
          />
          <span 
            ref={indicatorRef} 
            aria-hidden="true" 
            className="relative z-10 block size-24 shrink-0 bg-brand" 
          />
        </div>
        
        <div className="flex items-center gap-16">
          <span className="text-mono-sm shrink-0 text-foreground-muted">scroll</span>
          <div ref={scrubBoundsRef} className="relative h-24 flex-1">
            <span 
              aria-hidden="true" 
              className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-foreground/15" 
            />
            <div
              ref={handleRef}
              role="slider"
              tabIndex={0}
              aria-label="Scroll position"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 10 : 2;
                let newProgress = null;
                
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                  newProgress = progress + step;
                }
                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                  newProgress = progress - step;
                }
                
                if (newProgress !== null) {
                  e.preventDefault();
                  tweenRef.current?.kill();
                  
                  newProgress = gsap.utils.clamp(0, 100, newProgress);
                  setProgress(newProgress);
                  gsap.set(handleRef.current, { x: (getMaxScrollWidth() * newProgress) / 100 });
                  draggableInstanceRef.current?.[0]?.update();
                  updateIndicator(newProgress);
                }
              }}
              className="absolute left-0 top-1/2 -mt-8 flex h-16 cursor-grab touch-none select-none items-center gap-6 active:cursor-grabbing focus-visible:outline-none"
            >
              <span aria-hidden="true" className="h-0 w-0 border-y-4 border-r-6 border-y-transparent border-r-current text-foreground-muted" />
              <span aria-hidden="true" className="block size-16 rounded-full bg-brand ring-2 ring-surface" />
              <span aria-hidden="true" className="h-0 w-0 border-y-4 border-l-6 border-y-transparent border-l-current text-foreground-muted" />
            </div>
          </div>
          <span className="text-mono-sm w-[44px] shrink-0 text-right tabular-nums text-foreground">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </figure>
  );
}
