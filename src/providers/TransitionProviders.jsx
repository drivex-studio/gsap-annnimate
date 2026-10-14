'use client';

import { useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrambleTextPlugin } from '@/libs/utils/vendor';
import { ASCII_CHARS } from '@/animations/hooks/useScramble';
import { RouterTransition, TransitionRouterProvider } from '@/providers/TransitionRouterProvider';
import { useAnimation } from '@/providers/AnimationProvider';
import { getLayoutType } from '@/libs/config/GetLayoutType'; 
import { setTransitionTarget, getTransitionTarget, getTransitionLabel } from '@/libs/config/getTransitionLabel';

gsap.registerPlugin(ScrambleTextPlugin);

const TRANSITION_CONFIG = {
  app: {
    mechanism: 'fade',
    leave: { duration: 0.3, ease: 'power4.out' },
    enter: { duration: 0.4, ease: 'power4.out' }
  },
  sectionFade: {
    mechanism: 'fade',
    leave: { duration: 0.35, ease: 'power2.out' },
    enter: { duration: 0.5, ease: 'power2.out' }
  },
  marketing: {
    mechanism: 'panel',
    cover: { duration: 0.6, ease: 'expo.inOut' },
    reveal: { duration: 0.8, ease: 'expo.inOut' }
  },
  auth: null,
  admin: {
    mechanism: 'fade',
    leave: { duration: 0.3, ease: 'power4.out' },
    enter: { duration: 0.5, ease: 'power4.out' }
  },
  standalone: {
    mechanism: 'panel',
    cover: { duration: 0.6, ease: 'expo.inOut' },
    reveal: { duration: 0.8, ease: 'expo.inOut' }
  }
};

const DEFAULT_CONFIG = {
  mechanism: 'panel',
  cover: { duration: 0.6, ease: 'expo.inOut' },
  reveal: { duration: 0.8, ease: 'expo.inOut' }
};

const getConfig = (type) => type in TRANSITION_CONFIG ? TRANSITION_CONFIG[type] : DEFAULT_CONFIG;

const CLIP_COVER = 'inset(50% 50% 50% 50%)';
const CLIP_REVEAL = 'inset(0% 0% 0% 0%)';

const getWipePolygon = (progress) => {
  const t = 50 * progress;
  const p1 = (50 - t).toFixed(3);
  const p2 = (50 + t).toFixed(3);
  const p3 = (50 - t).toFixed(3);
  const p4 = (50 + t).toFixed(3);
  return `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${p1}% ${p3}%, ${p1}% ${p4}%, ${p2}% ${p4}%, ${p2}% ${p3}%, ${p1}% ${p3}%)`;
};

const debugLog = (...args) => 0;

const scrollToTop = () => {
  if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
  else window.scrollTo({ top: 0, behavior: 'instant' });
};

const determineLayout = (pathname) => {
  const type = getLayoutType(pathname);
  if (type !== 'app') return type;
  if (typeof document !== 'undefined' && document.querySelector('[data-anon-app-shell]')) return 'marketing';
  return type;
};

const getBaseSlug = (url) => url && typeof url === 'string' ? url.split('?')[0].split('#')[0].split('/').filter(Boolean)[0] || '' : '';
const isSameSection = (urlA, urlB) => {
  const slugA = getBaseSlug(urlA);
  return slugA !== '' && slugA === getBaseSlug(urlB);
};

function TransitionOverlay() {
  const overlayClass = 'absolute inset-0 [will-change:clip-path]';
  const initStyle = { clipPath: CLIP_COVER };
  
  const { revealed } = useAnimation();
  const textWrapperRef = useRef(null);
  const textElRef = useRef(null);
  const tlRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    tlRef.current?.kill();
    tlRef.current = null;
    
    if (textWrapperRef.current) gsap.to(textWrapperRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power2.in', overwrite: true });
  }, []);

  useEffect(() => {
    if (revealed) cleanup();
  }, [revealed, cleanup]);

  useEffect(() => {
    const handleCover = (e) => {
      const wrapper = textWrapperRef.current;
      const textEl = textElRef.current;
      if (!wrapper || !textEl) return;
      
      const label = (e.detail?.label || 'Loading').trim() || 'Loading';
      
      tlRef.current?.kill();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => cleanup(), 5000);
      
      gsap.set(wrapper, { autoAlpha: 1 });
      
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        textEl.className = 'text-accent-base scramble-brand';
        textEl.innerText = label;
        return;
      }
      
      const charCount = label.replace(/\s/g, '').length;
      textEl.className = 'text-accent-base';
      textEl.innerText = label.replace(/[^\s]/g, ' ');
      
      const tl = gsap.timeline();
      tl.to(textEl, {
        duration: 0.8,
        scrambleText: {
          text: ((str) => {
            let res = '';
            for (const char of str) res += char === ' ' ? ' ' : ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
            return res;
          })(label),
          chars: ASCII_CHARS,
          speed: 1,
          revealDelay: 0.1,
          oldClass: 'scramble-white',
          newClass: 'scramble-white'
        },
        ease: 'none'
      }, 0);
      
      tl.to(textEl, {
        duration: 0.8,
        scrambleText: {
          text: label,
          chars: ASCII_CHARS,
          speed: 1,
          revealDelay: 0.1,
          oldClass: 'scramble-white',
          newClass: 'scramble-brand'
        },
        ease: 'none'
      }, charCount > 0 ? 0.8 / charCount : 0);
      
      tlRef.current = tl;
    };
    
    const handleReveal = () => cleanup();
    
    window.addEventListener('seedtransition:cover', handleCover);
    window.addEventListener('seedtransition:reveal', handleReveal);
    
    return () => {
      window.removeEventListener('seedtransition:cover', handleCover);
      window.removeEventListener('seedtransition:reveal', handleReveal);
      tlRef.current?.kill();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [cleanup]);

  return (
    <div id="transition-overlay" aria-hidden="true" className="pointer-events-none fixed inset-0 z-[310] overflow-hidden">
      <div className={`ts-brand ${overlayClass} bg-brand`} style={initStyle} />
      <div className={`ts-dark ${overlayClass} bg-[#141314]`} style={initStyle} />
      <div ref={textWrapperRef} className="absolute inset-0 z-[2] grid place-items-center" style={{ opacity: 0 }}>
        <span ref={textElRef} className="text-accent-base text-brand">Loading</span>
      </div>
    </div>
  );
}

export default function TransitionLayout({ children }) {
  const pathname = usePathname();
  const { triggerPageEnter, revealPage, onGatesClear } = useAnimation();
  
  const currentType = useRef(null);
  const lastPathname = useRef(pathname);
  const isIntercepted = useRef(false);
  const transitionConfig = useRef(null);
  const leftElements = useRef([]);
  const leaveRef = useRef(null);
  const enterRef = useRef(null);

  useEffect(() => {
    currentType.current = determineLayout(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!('navigation' in window)) {
      const fallback = () => {
        const currentPath = window.location.pathname;
        if (currentPath === lastPathname.current) return;
        lastPathname.current = currentPath;
        if (enterRef.current) enterRef.current();
      };
      window.addEventListener('popstate', fallback);
      return () => window.removeEventListener('popstate', fallback);
    }
    
    const onNavigate = (e) => {
      if (e.navigationType !== 'traverse' || e.hashChange) return;
      const destUrl = new URL(e.destination.url);
      const currentPath = window.location.pathname;
      
      if (destUrl.pathname === currentPath) return;
      
      if (e.canIntercept && leaveRef.current) {
        isIntercepted.current = true;
        setTransitionTarget(destUrl.pathname);
        e.intercept({ handler: async () => await leaveRef.current() });
      }
    };
    
    const onSuccess = () => {
      if (isIntercepted.current && enterRef.current) {
        isIntercepted.current = false;
        enterRef.current();
      }
    };
    
    window.navigation.addEventListener('navigate', onNavigate);
    window.navigation.addEventListener('navigatesuccess', onSuccess);
    
    return () => {
      window.navigation.removeEventListener('navigate', onNavigate);
      window.navigation.removeEventListener('navigatesuccess', onSuccess);
    };
  }, []);

  const handleLeave = useCallback(async () => {
    const fromType = currentType.current;
    const target = getTransitionTarget();
    const toType = target ? determineLayout(target) : fromType;
    const currentPath = window.location.pathname;
    
    let config = fromType === toType ? getConfig(fromType) : (fromType === 'marketing' || toType === 'marketing') ? getConfig('marketing') : getConfig(fromType);
    if (config && isSameSection(currentPath, target)) config = getConfig('sectionFade');
    
    transitionConfig.current = config;
    if (!config) return Promise.resolve();
    
    if (config.mechanism === 'panel') {
      const brandEl = document.querySelector('#transition-overlay .ts-brand');
      const darkEl = document.querySelector('#transition-overlay .ts-dark');
      
      if (!brandEl || !darkEl) {
        scrollToTop();
        return Promise.resolve();
      }
      
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set('#transition-overlay', { pointerEvents: 'auto' });
        gsap.set([brandEl, darkEl], { clipPath: CLIP_REVEAL });
        scrollToTop();
        return Promise.resolve();
      }
      
      const { duration = 0.6, ease = 'expo.inOut' } = config.cover;
      return new Promise((resolve) => {
        gsap.set('#transition-overlay', { pointerEvents: 'auto' });
        window.dispatchEvent(new CustomEvent('seedtransition:cover', { detail: { label: getTransitionLabel() } }));
        
        const tl = gsap.timeline({ onComplete: () => { scrollToTop(); resolve(); } });
        tl.fromTo(brandEl, { clipPath: CLIP_COVER }, { clipPath: CLIP_REVEAL, duration, ease }, 0);
        tl.fromTo(darkEl, { clipPath: CLIP_COVER }, { clipPath: CLIP_REVEAL, duration, ease }, 0.08);
      });
    }
    
    const contentEls = document.querySelectorAll('[data-transition-content]');
    const footerEl = document.querySelector('footer');
    
    if (contentEls.length === 0) {
      scrollToTop();
      return Promise.resolve();
    }
    
    const { duration: fDur, ease: fEase } = config.leave;
    const elementsArray = Array.from(contentEls);
    if (footerEl) elementsArray.push(footerEl);
    leftElements.current = elementsArray;
    
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: () => { scrollToTop(); resolve(); } });
      tl.to(contentEls, { opacity: 0, duration: fDur, ease: fEase }, 0);
      if (footerEl) tl.to(footerEl, { opacity: 0, duration: fDur, ease: fEase }, 0);
    });
  }, []);

  const handleEnter = useCallback(async () => {
    const config = transitionConfig.current || getConfig(determineLayout(pathname));
    if (!config) return Promise.resolve();
    
    const finishEnter = () => requestAnimationFrame(() => requestAnimationFrame(() => triggerPageEnter()));
    
    if (config.mechanism === 'panel') {
      const brandEl = document.querySelector('#transition-overlay .ts-brand');
      const darkEl = document.querySelector('#transition-overlay .ts-dark');
      
      if (!brandEl || !darkEl) {
        finishEnter();
        return Promise.resolve();
      }
      
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finishEnter();
        gsap.set([brandEl, darkEl], { clipPath: CLIP_COVER });
        gsap.set('#transition-overlay', { pointerEvents: 'none' });
        return Promise.resolve();
      }
      
      const { duration = 0.8, ease = 'expo.inOut' } = config.reveal;
      return new Promise((resolve) => {
        let hasRevealed = false;
        let unregisterGate = null;
        let revealTimeout = null;
        
        const runReveal = () => {
          if (hasRevealed) return;
          hasRevealed = true;
          if (revealTimeout) clearTimeout(revealTimeout);
          if (unregisterGate) unregisterGate();
          
          window.dispatchEvent(new CustomEvent('seedtransition:reveal'));
          
          const tl = gsap.timeline({
            onComplete: () => {
              revealPage();
              gsap.set([brandEl, darkEl], { clipPath: CLIP_COVER });
              gsap.set('#transition-overlay', { pointerEvents: 'none' });
              resolve();
            }
          });
          
          const progressObj = { pd: 0, pb: 0 };
          if (darkEl) darkEl.style.clipPath = getWipePolygon(0);
          if (brandEl) brandEl.style.clipPath = getWipePolygon(0);
          
          tl.to(progressObj, { pd: 1, duration, ease, onUpdate: () => { if (darkEl) darkEl.style.clipPath = getWipePolygon(progressObj.pd); } }, 0);
          tl.to(progressObj, { pb: 1, duration, ease, onUpdate: () => { if (brandEl) brandEl.style.clipPath = getWipePolygon(progressObj.pb); } }, 0.16);
          tl.call(revealPage, [], 0.16 + 0.8 * duration);
        };
        
        revealTimeout = setTimeout(runReveal, 4000);
        requestAnimationFrame(() => requestAnimationFrame(() => { unregisterGate = onGatesClear(runReveal); }));
      });
    }
    
    const { duration: eDur, ease: eEase } = config.enter;
    const contentEls = document.querySelectorAll('[data-transition-content]');
    const footerEl = document.querySelector('footer');
    
    const currentElSet = new Set(contentEls);
    const staleEls = leftElements.current.filter((el) => el && !currentElSet.has(el));
    if (staleEls.length) gsap.set(staleEls, { opacity: 1 });
    leftElements.current = [];
    
    if (contentEls.length === 0) {
      finishEnter();
      return Promise.resolve();
    }
    
    const tl = gsap.timeline();
    return new Promise((resolve) => {
      tl.fromTo(contentEls, { opacity: 0 }, { opacity: 1, duration: eDur, ease: eEase }, 0);
      if (footerEl) tl.fromTo(footerEl, { opacity: 0 }, { opacity: 1, duration: eDur, ease: eEase }, 0);
      tl.call(finishEnter, [], 0);
      tl.call(() => resolve(), [], '>');
    });
  }, [pathname, triggerPageEnter, revealPage, onGatesClear]);

  useEffect(() => {
    leaveRef.current = handleLeave;
    enterRef.current = handleEnter;
  }, [handleLeave, handleEnter]);

  return (
    <RouterTransition leave={handleLeave} enter={handleEnter}>
      <TransitionRouterProvider>
        {children}
        <TransitionOverlay />
      </TransitionRouterProvider>
    </RouterTransition>
  );
}
