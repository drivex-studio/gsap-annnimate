"use client"; 
import { useRef, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useAnimation } from '@/providers/AnimationProvider';
import { perfMeasure } from '@/libs/utils/perfLog';

gsap.registerPlugin(ScrollTrigger);

let isRefreshing = false;

export function useReveal(
  ref,
  {
    mode = "scroll",
    build,
    start = "top 85%",
    inView,
    deps = []
  } = {}
) {
  const { whenRevealed } = useAnimation();
  const animationRef = useRef(null);
  const hasRevealedRef = useRef(false);

  const buildRef = useRef(build);
  buildRef.current = build;

  const inViewRef = useRef(inView);
  inViewRef.current = inView;

  const checkInView = useCallback(() => {
    if (inViewRef.current) return inViewRef.current();
    
    const el = ref.current;
    if (!el) return false;
    
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 0;
    
    return rect.top < 0.9 * viewportHeight && rect.bottom > 0;
  }, [ref]);

  const play = useCallback(() => {
    if (!hasRevealedRef.current && ref.current) {
      hasRevealedRef.current = true;
      if (animationRef.current) {
        animationRef.current.restart(true);
      }
    }
  }, [ref]);

  useGSAP(() => {
    const el = ref.current;
    if (!el || !buildRef.current) return;
    
    const anim = buildRef.current(el);
    animationRef.current = anim;
    
    if (hasRevealedRef.current) {
      anim.restart(true);
    }
    
    return () => {
      anim?.kill();
      animationRef.current = null;
    };
  }, {
    scope: ref,
    dependencies: [mode, start, ...deps]
  });

  useEffect(() => {
    if (mode === "manual") return;
    
    let trigger = null;
    let rafId = 0;
    
    const cleanup = whenRevealed(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        hasRevealedRef.current = true;
        if (animationRef.current) {
          animationRef.current.progress(1);
        }
        return;
      }
      
      if (mode === "hero" || checkInView()) {
        play();
      } else {
        rafId = requestAnimationFrame(() => {
          if (ref.current) {
            if (checkInView()) {
              play();
              return;
            }
            
            trigger = ScrollTrigger.create({
              trigger: ref.current,
              start: start,
              once: true,
              onEnter: play
            });
            
            if (!isRefreshing) {
              isRefreshing = true;
              requestAnimationFrame(() => {
                isRefreshing = false;
                perfMeasure(
                  `ScrollTrigger.refresh (${ScrollTrigger.getAll().length} triggers)`,
                  () => ScrollTrigger.refresh()
                );
              });
            }
          }
        });
      }
    });
    
    return () => {
      cleanup();
      if (rafId) cancelAnimationFrame(rafId);
      trigger?.kill();
    };
  }, [whenRevealed, mode, start]);

  return {
    play,
    reveal: play
  };
}
