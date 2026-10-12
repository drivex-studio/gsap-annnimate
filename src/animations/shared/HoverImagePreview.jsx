'use client';

import React, { useRef, useState, useEffect } from 'react'; // module id: 271645
import gsap from 'gsap'; // module id: 989970

import { useGSAP } from '@gsap/react'; // module id: 365747
import { cn } from '@/libs/utils/className'; // module id: 103746

/* Setup */
gsap.registerPlugin(useGSAP);

const CLIP_PATH_VAR = 'inset(var(--clip-t, 50%) var(--clip-r, 50%) var(--clip-b, 50%) var(--clip-l, 50%))';

/* --- HoverImagePreview --- */
// module id: 934783
export default function HoverImagePreview({
  containerRef,
  items = [],
  width = 320,
  aspect = '16 / 10',
  frameClassName = ''
}) {
  const scopeRef = useRef(null);
  const wrapperRef = useRef(null);
  const mediaRefs = useRef([]);
  
  const quickX = useRef(null);
  const quickY = useRef(null);
  
  const targetPos = useRef({ x: 0, y: 0 });
  const mousePos = useRef({ x: -1, y: -1 });
  
  const isVisible = useRef(false);
  const activeIndex = useRef(-1);
  const zIndexCounter = useRef(0);
  
  const [isTouch, setIsTouch] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      window.matchMedia('(hover: none)').matches
    );
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const shouldEnable = !isTouch && !reduceMotion && items.length > 0;
  
  const { contextSafe } = useGSAP({ scope: scopeRef });

  useGSAP(() => {
    if (shouldEnable && wrapperRef.current) {
      gsap.set(wrapperRef.current, { opacity: 0, scale: 0.5 });
      
      mediaRefs.current.forEach(el => {
        if (el) {
          gsap.set(el, {
            '--clip-t': '50%',
            '--clip-r': '50%',
            '--clip-b': '50%',
            '--clip-l': '50%',
            filter: 'brightness(1)'
          });
        }
      });
      
      quickX.current = gsap.quickTo(wrapperRef.current, 'x', { duration: 0.5, ease: 'power3.out' });
      quickY.current = gsap.quickTo(wrapperRef.current, 'y', { duration: 0.5, ease: 'power3.out' });
    }
  }, { scope: scopeRef, dependencies: [shouldEnable, items.length] });

  const showItem = contextSafe((index) => {
    const el = mediaRefs.current[index];
    if (!wrapperRef.current || !el || (isVisible.current && activeIndex.current === index)) return;
    
    const wasVisible = isVisible.current;
    const prevIndex = activeIndex.current;
    
    activeIndex.current = index;
    isVisible.current = true;
    
    if (!wasVisible) {
      gsap.killTweensOf(wrapperRef.current, 'opacity,scale');
      gsap.set(wrapperRef.current, { x: targetPos.current.x, y: targetPos.current.y });
      gsap.fromTo(wrapperRef.current, 
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)' }
      );
    }
    
    if (prevIndex >= 0 && prevIndex !== index) {
      const prevEl = mediaRefs.current[prevIndex];
      if (prevEl) {
        gsap.killTweensOf(prevEl);
        gsap.to(prevEl, { filter: 'brightness(0.7)', duration: 0.5, ease: 'power3.out' });
        prevEl.pause?.();
      }
    }
    
    zIndexCounter.current += 1;
    gsap.killTweensOf(el);
    gsap.set(el, {
      zIndex: zIndexCounter.current,
      filter: 'brightness(1)',
      '--clip-t': '50%',
      '--clip-r': '50%',
      '--clip-b': '50%',
      '--clip-l': '50%'
    });
    
    gsap.to(el, {
      '--clip-t': '0%',
      '--clip-r': '0%',
      '--clip-b': '0%',
      '--clip-l': '0%',
      duration: 0.5,
      ease: 'power3.out'
    });
    
    if (el.tagName === 'VIDEO') {
      el.currentTime = 0;
      el.play?.().catch(() => {});
    }
  });

  const hideAll = contextSafe(() => {
    if (!isVisible.current) return;
    
    isVisible.current = false;
    activeIndex.current = -1;
    
    if (wrapperRef.current) {
      gsap.killTweensOf(wrapperRef.current, 'opacity,scale');
      gsap.to(wrapperRef.current, {
        opacity: 0,
        scale: 0.6,
        duration: 0.25,
        ease: 'power2.out',
        onComplete: () => {
          if (!isVisible.current) {
            mediaRefs.current.forEach(el => {
              if (el) {
                gsap.set(el, {
                  '--clip-t': '50%',
                  '--clip-r': '50%',
                  '--clip-b': '50%',
                  '--clip-l': '50%',
                  filter: 'brightness(1)',
                  zIndex: 0
                });
                el.pause?.();
              }
            });
            zIndexCounter.current = 0;
          }
        }
      });
    }
  });

  const handleIntersect = contextSafe(() => {
    const parent = containerRef?.current;
    if (!parent || mousePos.current.x < 0) return;
    
    const elementUnderMouse = document.elementFromPoint(mousePos.current.x, mousePos.current.y);
    const targetNode = elementUnderMouse && parent.contains(elementUnderMouse) 
      ? elementUnderMouse.closest('[data-hfp-index]') 
      : null;
      
    if (targetNode) {
      const idx = Number(targetNode.getAttribute('data-hfp-index'));
      if (!Number.isNaN(idx)) {
        showItem(idx);
      }
    } else {
      hideAll();
    }
  });

  useEffect(() => {
    if (!shouldEnable) return;
    
    const onPointerMove = (e) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      
      const height = wrapperRef.current?.offsetHeight || 0;
      targetPos.current.x = e.clientX + 24;
      targetPos.current.y = e.clientY - height / 2;
      
      handleIntersect();
      
      if (isVisible.current) {
        quickX.current?.(targetPos.current.x);
        quickY.current?.(targetPos.current.y);
      }
    };
    
    const onScroll = () => handleIntersect();
    
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll, { capture: true });
    };
  }, [shouldEnable, handleIntersect]);

  if (!shouldEnable) return null;

  return (
    <span ref={scopeRef} aria-hidden="true" className="contents">
      <div 
        ref={wrapperRef} 
        className={cn('pointer-events-none fixed left-0 top-0 z-50 overflow-hidden bg-background opacity-0', frameClassName)} 
        style={{ width, aspectRatio: aspect }}
      >
        {items.map((item, idx) => {
          if (!item?.src) return null;
          
          if (item.type === 'video') {
            return (
              <video 
                key={idx} 
                ref={el => mediaRefs.current[idx] = el} 
                src={item.src} 
                muted 
                loop 
                playsInline 
                preload="metadata" 
                className="absolute inset-0 size-full object-cover" 
                style={{ clipPath: CLIP_PATH_VAR }} 
              />
            );
          }
          
          return (
            <img 
              key={idx} 
              ref={el => mediaRefs.current[idx] = el} 
              src={item.src} 
              alt="" 
              decoding="async" 
              className="absolute inset-0 size-full object-cover" 
              style={{ clipPath: CLIP_PATH_VAR }} 
            />
          );
        })}
      </div>
    </span>
  );
}