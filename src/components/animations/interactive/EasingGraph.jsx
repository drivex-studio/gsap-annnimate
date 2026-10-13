"use client";
import React, { useRef, useState, useEffect, useMemo } from 'react';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CustomEase } from 'gsap/CustomEase';
import { CustomWiggle } from 'gsap/CustomWiggle';
import { RoughEase, SlowMo } from 'gsap/EasePack';
import { ArrowCounterClockwise } from '@phosphor-icons/react';

gsap.registerPlugin(useGSAP, CustomEase, CustomWiggle, RoughEase, SlowMo);

function getEaseName(easeString) {
  let trimmed = String(easeString).trim();
  if (/^m[\s\d.,-]/i.test(trimmed)) return 'custom ease';
  let withoutArgs = trimmed.replace(/\(.*\)/, '').trim();
  return withoutArgs === 'none' || withoutArgs === 'linear' ? 'linear' : withoutArgs;
}

export default function EasingGraph({ caption, options = {} }) {
  const ease = options.ease || (Array.isArray(options.eases) && options.eases[0]) || 'expo.out';
  const duration = options.duration || 0.8;
  
  const figureRef = useRef(null);
  const rectRef = useRef(null);
  const lineRef = useRef(null);
  const spanRef = useRef(null);
  const timelineRef = useRef(null);
  const updateGraphRef = useRef(null);
  
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener?.('change', handleChange);
    
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  const easeFunction = useMemo(() => {
    return gsap.parseEase(ease) || gsap.parseEase('none');
  }, [ease]);

  const { lo, hi } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    
    for (let step = 0; step <= 64; step++) {
      const value = easeFunction(step / 64);
      if (value < min) min = value;
      if (value > max) max = value;
    }
    
    const margin = Math.max(0.06, (max - min) * 0.12);
    return {
      lo: Math.min(-0.12, min - margin),
      hi: Math.max(1.12, max + margin),
    };
  }, [easeFunction]);

  const getYPosition = (value) => 94 - ((value - lo) / (hi - lo)) * 88;

  const pathData = useMemo(() => {
    let path = '';
    for (let step = 0; step <= 64; step++) {
      const progress = step / 64;
      path += `${step === 0 ? 'M' : 'L'}${(100 * progress).toFixed(2)} ${getYPosition(easeFunction(progress)).toFixed(2)} `;
    }
    return path.trim();
  }, [easeFunction, lo, hi]);

  const gridLines = useMemo(() => Array.from({ length: 9 }, (_, index) => (100 * index) / 8), []);

  const { contextSafe } = useGSAP(() => {}, { scope: figureRef });

  updateGraphRef.current = contextSafe(() => {
    timelineRef.current?.kill();
    timelineRef.current = null;
    
    const updateElements = (progress) => {
      const xPos = 100 * progress;
      const yPos = getYPosition(easeFunction(progress));
      
      rectRef.current?.setAttribute('x', (xPos - 2.1).toFixed(2));
      rectRef.current?.setAttribute('y', (yPos - 2.1).toFixed(2));
      lineRef.current?.setAttribute('x1', xPos.toFixed(2));
      lineRef.current?.setAttribute('x2', xPos.toFixed(2));
      
      if (spanRef.current) {
        spanRef.current.style.top = `${yPos.toFixed(2)}%`;
      }
    };

    if (prefersReducedMotion) {
      updateElements(1);
      return;
    }

    const state = { t: 0 };
    updateElements(0);
    
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true });
    tl.to(state, {
      t: 1,
      duration: duration,
      ease: 'none',
      onUpdate: () => updateElements(state.t),
    });
    
    timelineRef.current = tl;
  });

  useEffect(() => {
    updateGraphRef.current?.();
    const figureEl = figureRef.current;
    
    if (!figureEl) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (timelineRef.current) {
        if (entry?.isIntersecting) {
          timelineRef.current.play();
        } else {
          timelineRef.current.pause();
        }
      }
    }, { rootMargin: '0px' });
    
    observer.observe(figureEl);
    
    return () => observer.disconnect();
  }, [prefersReducedMotion, ease]);

  return (
    <figure ref={figureRef} className="not-prose my-12 flex flex-col gap-12">
      {caption && (
        <figcaption className="text-mono-sm text-foreground-muted">
          Fig &middot; {caption}
        </figcaption>
      )}
      <div 
        aria-label={`Easing graph for ${getEaseName(ease)}`}
        className="relative border border-foreground/12 bg-surface px-24 py-32 lg:px-32"
      >
        <button
          type="button"
          onClick={() => {
            updateGraphRef.current?.();
            timelineRef.current?.restart(true);
          }}
          aria-label="Replay the graph"
          className="absolute right-12 top-12 z-10 inline-flex size-28 items-center justify-center text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/50"
        >
          <ArrowCounterClockwise className="size-16" />
        </button>
        <div className="mx-auto flex h-[min(300px,70vw)] items-stretch justify-center gap-16">
          <div className="aspect-square h-full">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="block h-full w-full overflow-visible"
            >
              {gridLines.map((line) => (
                <line
                  key={`v${line}`}
                  x1={line}
                  y1={0}
                  x2={line}
                  y2={100}
                  className="stroke-foreground/10"
                  strokeWidth={0.5}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {gridLines.map((line) => (
                <line
                  key={`h${line}`}
                  x1={0}
                  y1={line}
                  x2={100}
                  y2={line}
                  className="stroke-foreground/10"
                  strokeWidth={0.5}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <line
                x1={0}
                y1={getYPosition(0)}
                x2={100}
                y2={getYPosition(1)}
                className="stroke-foreground/20"
                strokeWidth={1}
                strokeDasharray="2 3"
                vectorEffect="non-scaling-stroke"
              />
              <line
                ref={lineRef}
                x1={0}
                y1={0}
                x2={0}
                y2={100}
                className="stroke-foreground/20"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={pathData}
                fill="none"
                className="stroke-brand"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <rect
                ref={rectRef}
                x={-4.2}
                y={getYPosition(0) - 2.1}
                width={4.2}
                height={4.2}
                className="fill-brand"
              />
            </svg>
          </div>
          <div className="relative h-full w-12 shrink-0">
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-1/2 top-0 -ml-px w-px bg-foreground/15"
            />
            <span
              ref={spanRef}
              aria-hidden="true"
              className="absolute left-1/2 -ml-5 -mt-5 block size-10 bg-brand"
              style={{ top: `${getYPosition(0)}%` }}
            />
          </div>
        </div>
      </div>
    </figure>
  );
}
