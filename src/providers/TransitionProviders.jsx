"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

import gsap from 'gsap';
import { ScrambleTextPlugin } from '@/libs/utils/vendor';
import { ASCII_CHARS } from '@/hooks/useScramble';

import { 
  RouterTransition,
  TransitionRouterProvider
} from '@/providers/TransitionRouterProvider';
import { useAnimation } from '@/providers/AnimationProvider';
import { getLayoutType } from '@/libs/config/GetLayoutType'; 
import { setTransitionTarget, getTransitionTarget, getTransitionLabel } from '@/libs/config/getTransitionLabel';

gsap.registerPlugin(ScrambleTextPlugin);

const TRANSITION_CONFIG = {
  app: {
    mechanism: "fade",
    leave: { duration: 0.3, ease: "power4.out" },
    enter: { duration: 0.4, ease: "power4.out" }
  },
  sectionFade: {
    mechanism: "fade",
    leave: { duration: 0.35, ease: "power2.out" },
    enter: { duration: 0.5, ease: "power2.out" }
  },
  marketing: {
    mechanism: "panel",
    cover: { duration: 0.6, ease: "expo.inOut" },
    reveal: { duration: 0.8, ease: "expo.inOut" }
  },
  auth: null,
  admin: {
    mechanism: "fade",
    leave: { duration: 0.3, ease: "power4.out" },
    enter: { duration: 0.5, ease: "power4.out" }
  },
  standalone: {
    mechanism: "panel",
    cover: { duration: 0.6, ease: "expo.inOut" },
    reveal: { duration: 0.8, ease: "expo.inOut" }
  }
};

const DEFAULT_CONFIG = {
  mechanism: "panel",
  cover: { duration: 0.6, ease: "expo.inOut" },
  reveal: { duration: 0.8, ease: "expo.inOut" }
};

function getConfig(type) {
  return type in TRANSITION_CONFIG ? TRANSITION_CONFIG[type] : DEFAULT_CONFIG;
}

const CLIP_COVER = "inset(50% 50% 50% 50%)";
const CLIP_REVEAL = "inset(0% 0% 0% 0%)";

function getWipePolygon(progress) {
  let t = 50 * progress;
  let p1 = (50 - t).toFixed(3);
  let p2 = (50 + t).toFixed(3);
  let p3 = (50 - t).toFixed(3);
  let p4 = (50 + t).toFixed(3);
  return `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${p1}% ${p3}%, ${p1}% ${p4}%, ${p2}% ${p4}%, ${p2}% ${p3}%, ${p1}% ${p3}%)`;
}

const debugLog = (...args) => 0;

function TransitionOverlay() {
  let overlayClass = "absolute inset-0 [will-change:clip-path]";
  let initStyle = { clipPath: CLIP_COVER };
  
  let { revealed } = useAnimation();
  let textWrapperRef = useRef(null);
  let textElRef = useRef(null);
  let tlRef = useRef(null);
  let timeoutRef = useRef(null);
  
  let cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    tlRef.current?.kill();
    tlRef.current = null;
    
    let el = textWrapperRef.current;
    if (el) {
      gsap.to(el, { autoAlpha: 0, duration: 0.3, ease: "power2.in", overwrite: true });
    }
  }, []);

  useEffect(() => {
    if (revealed) cleanup();
  }, [revealed, cleanup]);

  useEffect(() => {
    let handleCover = (e) => {
      let wrapper = textWrapperRef.current;
      let textEl = textElRef.current;
      if (!wrapper || !textEl) return;
      
      let label = (e.detail?.label || "Loading").trim() || "Loading";
      
      tlRef.current?.kill();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => cleanup(), 5000);
      
      gsap.set(wrapper, { autoAlpha: 1 });
      
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        textEl.className = "text-accent-base scramble-brand";
        textEl.innerText = label;
        return;
      }
      
      let charCount = label.replace(/\s/g, "").length;
      textEl.className = "text-accent-base";
      textEl.innerText = label.replace(/[^\s]/g, " ");
      
      let tl = gsap.timeline();
      tl.to(textEl, {
        duration: 0.8,
        scrambleText: {
          text: function(str) {
            let res = "";
            for (let char of str) {
              res += char === " " ? " " : ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
            }
            return res;
          }(label),
          chars: ASCII_CHARS,
          speed: 1,
          revealDelay: 0.1,
          oldClass: "scramble-white",
          newClass: "scramble-white"
        },
        ease: "none"
      }, 0);
      
      tl.to(textEl, {
        duration: 0.8,
        scrambleText: {
          text: label,
          chars: ASCII_CHARS,
          speed: 1,
          revealDelay: 0.1,
          oldClass: "scramble-white",
          newClass: "scramble-brand"
        },
        ease: "none"
      }, charCount > 0 ? 0.8 / charCount : 0);
      
      tlRef.current = tl;
    };
    
    let handleReveal = () => cleanup();
    
    window.addEventListener("seedtransition:cover", handleCover);
    window.addEventListener("seedtransition:reveal", handleReveal);
    
    return () => {
      window.removeEventListener("seedtransition:cover", handleCover);
      window.removeEventListener("seedtransition:reveal", handleReveal);
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

const scrollToTop = () => {
  if (window.lenis) {
    window.lenis.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo({ top: 0, behavior: "instant" });
  }
};

const determineLayout = (pathname) => {
  let type = getLayoutType(pathname);
  if (type !== "app") return type;
  if (typeof document !== "undefined" && document.querySelector("[data-anon-app-shell]")) {
    return "marketing";
  }
  return type;
};

const getBaseSlug = (url) => {
  return url && typeof url === "string" 
    ? url.split("?")[0].split("#")[0].split("/").filter(Boolean)[0] || "" 
    : "";
};

const isSameSection = (urlA, urlB) => {
  let slugA = getBaseSlug(urlA);
  let slugB = getBaseSlug(urlB);
  return slugA !== "" && slugA === slugB;
};

export default function TransitionLayout({ children }) {
  let pathname = usePathname();
  let { triggerPageEnter, revealPage, onGatesClear } = useAnimation();
  
  let currentType = useRef(null);
  let lastPathname = useRef(pathname);
  let isIntercepted = useRef(false);
  let transitionConfig = useRef(null);
  let leftElements = useRef([]);

  debugLog("TransitionLayout render, pathname:", pathname);

  useEffect(() => {
    debugLog("Layout type updated:", determineLayout(pathname));
    currentType.current = determineLayout(pathname);
  }, [pathname]);

  let leaveRef = useRef(null);
  let enterRef = useRef(null);

  useEffect(() => {
    debugLog("Setting up Navigation API listener");
    if (!("navigation" in window)) {
      debugLog("Navigation API not supported, using popstate fallback");
      let fallback = () => {
        let currentPath = window.location.pathname;
        if (currentPath !== lastPathname.current) {
          lastPathname.current = currentPath;
          if (enterRef.current) enterRef.current();
        }
      };
      window.addEventListener("popstate", fallback);
      return () => window.removeEventListener("popstate", fallback);
    }
    
    debugLog("Navigation API supported, setting up intercept");
    let onNavigate = (e) => {
      debugLog("navigate event:", { type: e.navigationType, destination: e.destination?.url, canIntercept: e.canIntercept, hashChange: e.hashChange });
      
      if (e.navigationType !== "traverse") {
        debugLog("Skipping - not a traverse navigation (handled by TransitionRouter)");
        return;
      }
      if (e.hashChange) {
        debugLog("Skipping hash-only change");
        return;
      }
      
      let destUrl = new URL(e.destination.url);
      let currentPath = window.location.pathname;
      
      if (destUrl.pathname === currentPath) {
        debugLog("Skipping - same pathname");
      } else if (e.canIntercept && leaveRef.current) {
        debugLog("Intercepting back/forward navigation, running leave animation");
        isIntercepted.current = true;
        setTransitionTarget(destUrl.pathname);
        
        e.intercept({
          handler: async () => {
            debugLog("Intercept handler: running leave animation");
            await leaveRef.current();
            debugLog("Intercept handler: leave animation complete");
          }
        });
      } else {
        debugLog("Cannot intercept:", { canIntercept: e.canIntercept, hasLeaveRef: !!leaveRef.current });
      }
    };
    
    let onSuccess = () => {
      debugLog("navigatesuccess event, isIntercepted:", isIntercepted.current);
      if (isIntercepted.current && enterRef.current) {
        isIntercepted.current = false;
        debugLog("Running enter animation");
        enterRef.current();
      }
    };
    
    window.navigation.addEventListener("navigate", onNavigate);
    window.navigation.addEventListener("navigatesuccess", onSuccess);
    
    return () => {
      window.navigation.removeEventListener("navigate", onNavigate);
      window.navigation.removeEventListener("navigatesuccess", onSuccess);
    };
  }, []);

  let handleLeave = useCallback(async () => {
    debugLog("leave() called");
    let fromType = currentType.current;
    let target = getTransitionTarget();
    let toType = target ? determineLayout(target) : fromType;
    let currentPath = window.location.pathname;
    
    let config = fromType === toType 
      ? getConfig(fromType) 
      : (fromType === "marketing" || toType === "marketing") ? getConfig("marketing") : getConfig(fromType);
      
    if (config && isSameSection(currentPath, target)) {
      config = getConfig("sectionFade");
    }
    
    transitionConfig.current = config;
    debugLog("leave() - from:", fromType, "to:", toType, "sameSection:", isSameSection(currentPath, target), "config:", config);
    
    if (!config) {
      debugLog("leave() - skipping (no config)");
      return Promise.resolve();
    }
    
    if (config.mechanism === "panel") {
      let brandEl = document.querySelector("#transition-overlay .ts-brand");
      let darkEl = document.querySelector("#transition-overlay .ts-dark");
      
      debugLog("leave() panel mechanism, squares found:", !!brandEl, !!darkEl, "reduce:", window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      
      if (!brandEl || !darkEl) {
        debugLog("leave() - overlay squares missing, skipping cover");
        scrollToTop();
        return Promise.resolve();
      }
      
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set("#transition-overlay", { pointerEvents: "auto" });
        gsap.set([brandEl, darkEl], { clipPath: CLIP_REVEAL });
        scrollToTop();
        return Promise.resolve();
      }
      
      let { duration, ease } = config.cover;
      
      return new Promise((resolve) => {
        gsap.set("#transition-overlay", { pointerEvents: "auto" });
        window.dispatchEvent(new CustomEvent("seedtransition:cover", { detail: { label: getTransitionLabel() } }));
        
        let tl = gsap.timeline({
          onComplete: () => {
            scrollToTop();
            resolve();
          }
        });
        
        tl.fromTo(brandEl, { clipPath: CLIP_COVER }, { clipPath: CLIP_REVEAL, duration: duration || 0.6, ease: ease || "expo.inOut" }, 0);
        tl.fromTo(darkEl, { clipPath: CLIP_COVER }, { clipPath: CLIP_REVEAL, duration: duration || 0.6, ease: ease || "expo.inOut" }, 0.08);
      });
    }
    
    let contentEls = document.querySelectorAll("[data-transition-content]");
    let footerEl = document.querySelector("footer");
    
    debugLog("leave() - found content elements:", contentEls.length, "footer:", !!footerEl);
    
    if (contentEls.length === 0) {
      debugLog("leave() - no content elements found!");
      scrollToTop();
      return;
    }
    
    let { duration: fDur, ease: fEase } = config.leave;
    debugLog("leave() - animating with duration:", fDur, "ease:", fEase);
    
    let elementsArray = Array.from(contentEls);
    if (footerEl) elementsArray.push(footerEl);
    leftElements.current = elementsArray;
    
    return new Promise((resolve) => {
      let tl = gsap.timeline({
        onComplete: () => {
          debugLog("leave() - animation complete");
          scrollToTop();
          resolve();
        }
      });
      tl.to(contentEls, { opacity: 0, duration: fDur, ease: fEase }, 0);
      if (footerEl) tl.to(footerEl, { opacity: 0, duration: fDur, ease: fEase }, 0);
    });
  }, []);

  let handleEnter = useCallback(async () => {
    debugLog("enter() called");
    let config = transitionConfig.current || getConfig(determineLayout(pathname));
    debugLog("enter() - config:", config);
    
    if (!config) {
      debugLog("enter() - skipping (no config)");
      return Promise.resolve();
    }
    
    let finishEnter = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          debugLog("enter() - triggering pageEnter animations");
          triggerPageEnter();
        });
      });
    };
    
    if (config.mechanism === "panel") {
      let brandEl = document.querySelector("#transition-overlay .ts-brand");
      let darkEl = document.querySelector("#transition-overlay .ts-dark");
      
      debugLog("enter() panel mechanism, squares found:", !!brandEl, !!darkEl, "reduce:", window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      
      if (!brandEl || !darkEl) {
        debugLog("enter() - overlay squares missing, firing pageEnter only");
        finishEnter();
        return Promise.resolve();
      }
      
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finishEnter();
        gsap.set([brandEl, darkEl], { clipPath: CLIP_COVER });
        gsap.set("#transition-overlay", { pointerEvents: "none" });
        return Promise.resolve();
      }
      
      let { duration, ease } = config.reveal;
      
      return new Promise((resolve) => {
        let hasRevealed = false;
        let unregisterGate = null;
        let revealTimeout = null;
        
        let runReveal = () => {
          if (hasRevealed) return;
          hasRevealed = true;
          if (revealTimeout) clearTimeout(revealTimeout);
          if (unregisterGate) unregisterGate();
          
          window.dispatchEvent(new CustomEvent("seedtransition:reveal"));
          
          let tl = gsap.timeline({
            onComplete: () => {
              revealPage();
              gsap.set([brandEl, darkEl], { clipPath: CLIP_COVER });
              gsap.set("#transition-overlay", { pointerEvents: "none" });
              resolve();
            }
          });
          
          let progressObj = { pd: 0, pb: 0 };
          if (darkEl) darkEl.style.clipPath = getWipePolygon(0);
          if (brandEl) brandEl.style.clipPath = getWipePolygon(0);
          
          tl.to(progressObj, {
            pd: 1, duration: duration || 0.8, ease: ease || "expo.inOut", onUpdate: () => {
              if (darkEl) darkEl.style.clipPath = getWipePolygon(progressObj.pd);
            }
          }, 0);
          
          tl.to(progressObj, {
            pb: 1, duration: duration || 0.8, ease: ease || "expo.inOut", onUpdate: () => {
              if (brandEl) brandEl.style.clipPath = getWipePolygon(progressObj.pb);
            }
          }, 0.16);
          
          tl.call(revealPage, [], 0.16 + 0.8 * (duration || 0.8));
        };
        
        revealTimeout = setTimeout(runReveal, 4000);
        
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            debugLog("enter() panel - waiting on ready-gates before reveal");
            unregisterGate = onGatesClear(runReveal);
          });
        });
      });
    }
    
    let fadeConfig = config.enter;
    let contentEls = document.querySelectorAll("[data-transition-content]");
    let footerEl = document.querySelector("footer");
    
    debugLog("enter() - found content elements:", contentEls.length, "footer:", !!footerEl);
    
    let currentElSet = new Set(contentEls);
    let staleEls = leftElements.current.filter(el => el && !currentElSet.has(el));
    if (staleEls.length) {
      gsap.set(staleEls, { opacity: 1 });
    }
    leftElements.current = [];
    
    if (contentEls.length === 0) {
      debugLog("enter() - no content elements found!");
      finishEnter();
      return;
    }
    
    let { duration: eDur, ease: eEase } = fadeConfig;
    debugLog("enter() - animating with duration:", eDur, "ease:", eEase);
    
    let tl = gsap.timeline();
    return new Promise((resolve) => {
      tl.fromTo(contentEls, { opacity: 0 }, { opacity: 1, duration: eDur, ease: eEase }, 0);
      if (footerEl) {
        tl.fromTo(footerEl, { opacity: 0 }, { opacity: 1, duration: eDur, ease: eEase }, 0);
      }
      tl.call(finishEnter, [], 0);
      tl.call(() => resolve(), [], ">");
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
