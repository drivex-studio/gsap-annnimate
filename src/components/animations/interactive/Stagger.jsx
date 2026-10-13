"use client";
import React, { useRef, useState, useEffect } from 'react';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowCounterClockwise } from '@phosphor-icons/react';

gsap.registerPlugin(useGSAP);

export default function Stagger({ caption, options = {} }) {
  const count = options.count || 8;
  const min = options.min ?? 0;
  const max = options.max ?? 0.15;
  const defaultValue = options.value ?? 0.06;

  const figureRef = useRef(null);
  const elementsRef = useRef([]);
  const replayFnRef = useRef(null);

  const [stagger, setStagger] = useState(defaultValue);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener?.('change', handleChange);
    
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  const { contextSafe } = useGSAP(() => {}, { scope: figureRef });

  const triggerStagger = contextSafe((currentStagger) => {
    const targets = elementsRef.current.filter(Boolean);
    if (targets.length) {
      if (prefersReducedMotion) {
        gsap.set(targets, { y: 0, opacity: 1 });
        return;
      }
      gsap.fromTo(
        targets,
        { y: 28, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.5, 
          ease: 'expo.out', 
          stagger: currentStagger, 
          overwrite: true, 
          force3D: true 
        }
      );
    }
  });

  replayFnRef.current = () => triggerStagger(stagger);

  useEffect(() => {
    const figureEl = figureRef.current;
    if (!figureEl) return;

    const targets = elementsRef.current.filter(Boolean);
    
    gsap.set(targets, {
      y: prefersReducedMotion ? 0 : 28,
      opacity: prefersReducedMotion ? 1 : 0,
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          triggerStagger(stagger);
          observer.disconnect();
        }
      },
      { rootMargin: '-10% 0px' }
    );

    observer.observe(figureEl);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <figure ref={figureRef} className="not-prose my-12 flex flex-col gap-12">
      {caption ? (
        <figcaption className="text-mono-sm text-foreground-muted">
          Fig &middot; {caption}
        </figcaption>
      ) : null}
      <div 
        aria-label={`Stagger of ${count} elements`} 
        className="relative border border-foreground/12 bg-surface px-24 py-32 lg:px-32"
      >
        <button
          type="button"
          onClick={() => triggerStagger(stagger)}
          aria-label="Replay the stagger"
          className="absolute right-12 top-12 z-10 inline-flex size-28 items-center justify-center text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/50"
        >
          <ArrowCounterClockwise className="size-16" />
        </button>
        <div className="flex items-end justify-center gap-8 pb-32">
          {Array.from({ length: count }).map((_, index) => (
            <span
              key={index}
              ref={(el) => (elementsRef.current[index] = el)}
              aria-hidden="true"
              className="block size-24 shrink-0 bg-brand"
            />
          ))}
        </div>
        <div className="flex items-center gap-16">
          <span className="text-mono-sm shrink-0 text-foreground-muted">
            stagger
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={0.01}
            value={stagger}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setStagger(val);
              triggerStagger(val);
            }}
            aria-label="Stagger amount in seconds"
            className="h-1 flex-1 cursor-pointer appearance-none rounded-none bg-foreground/15 accent-brand"
          />
          <span className="text-mono-sm w-[52px] shrink-0 text-right tabular-nums text-foreground">
            {stagger.toFixed(2)}s
          </span>
        </div>
      </div>
    </figure>
  );
}
