// module id: 375403
import React, { useRef, useState, useEffect } from 'react'; // module id: 271645

import gsap from 'gsap'; // module id: 989970
import { useGSAP } from '@gsap/react'; // module id: 365747
import { SplitText } from 'gsap/SplitText'; // module id: 875324

// Replaced custom Turbopack icon with standard library import per user instruction
import { ArrowCounterClockwise } from '@phosphor-icons/react'; // module id: 949656

gsap.registerPlugin(useGSAP, SplitText);

const STAGGER_TIMINGS = {
  chars: 0.012,
  words: 0.06,
  lines: 0.12,
};

export default function SplitTextReveal({ caption, options = {} }) {
  const text = options.text || 'Ship award-grade motion';
  const modes = Array.isArray(options.modes) && options.modes.length > 0 
    ? options.modes 
    : ['chars', 'words', 'lines'];

  const figureRef = useRef(null);
  const textRef = useRef(null);
  const splitTextInstanceRef = useRef(null);
  const replayFnRef = useRef(null);

  const [activeMode, setActiveMode] = useState(modes[0]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener?.('change', handleChange);
    
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  const { contextSafe } = useGSAP(() => {}, { scope: figureRef });

  const triggerReveal = contextSafe((mode) => {
    const textEl = textRef.current;
    if (!textEl) return;

    // Clean up previous SplitText instance if it exists
    if (splitTextInstanceRef.current) {
      splitTextInstanceRef.current.revert();
    }

    if (prefersReducedMotion) {
      gsap.set(textEl, { opacity: 1 });
      return;
    }

    const split = new SplitText(textEl, { type: mode, linesClass: 'overflow-hidden' });
    splitTextInstanceRef.current = split;
    
    const targets = split[mode] || [];
    
    gsap.set(textEl, { opacity: 1 });
    gsap.from(targets, {
      yPercent: 100,
      opacity: 0,
      duration: 0.6,
      ease: 'expo.out',
      stagger: STAGGER_TIMINGS[mode] ?? 0.04,
      force3D: true,
    });
  });

  replayFnRef.current = () => triggerReveal(activeMode);

  useEffect(() => {
    const figureEl = figureRef.current;
    if (!figureEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          triggerReveal(activeMode);
          observer.disconnect();
        }
      },
      { rootMargin: '-10% 0px' }
    );

    observer.observe(figureEl);

    return () => {
      observer.disconnect();
      if (splitTextInstanceRef.current) {
        splitTextInstanceRef.current.revert();
      }
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
        aria-label={`SplitText reveal by ${activeMode}`}
        className="relative border border-foreground/12 bg-surface px-24 py-40 lg:px-32"
      >
        <button
          type="button"
          onClick={() => triggerReveal(activeMode)}
          aria-label="Replay the reveal"
          className="absolute right-12 top-12 z-10 inline-flex size-28 items-center justify-center text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/50"
        >
          <ArrowCounterClockwise className="size-16" />
        </button>
        <p 
          ref={textRef} 
          className="text-h4 m-0 mb-32 text-center font-medium text-foreground"
        >
          {text}
        </p>
        <div className="flex items-center justify-center gap-4">
          {modes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setActiveMode(mode);
                triggerReveal(mode);
              }}
              data-active={mode === activeMode ? 'true' : undefined}
              className="text-mono-sm border border-foreground/15 px-12 py-6 text-foreground-muted transition-colors hover:text-foreground data-[active=true]:border-brand data-[active=true]:bg-brand data-[active=true]:text-white"
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </figure>
  );
}