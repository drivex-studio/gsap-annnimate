"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation'; // module id: 618566

import gsap from 'gsap'; // module id: 989970
import { ScrambleTextPlugin } from '@/libs/utils/vendor'; // module id: 437302 (Mapped)
import { ASCII_CHARS } from '@/hooks/useScramble'; // module id: 254359 (Mapped)

import { 
  RouterTransition,
  TransitionRouterProvider
} from '@/providers/TransitionRouterProvider'; // module id: 676040
import { useAnimation } from '@/providers/AnimationProvider'; // module id: 488463
import { getLayoutType } from '@/libs/config/GetLayoutType'; 
import { setTransitionTarget, getTransitionTarget, getTransitionLabel } from '@/libs/config/getTransitionLabel'; // module id: 842365

gsap.registerPlugin(ScrambleTextPlugin);

// Transition Configuration
const TRANSITION_CONFIG = { // original mangled: c
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

const DEFAULT_CONFIG = { // original mangled: u
  mechanism: "panel",
  cover: { duration: 0.6, ease: "expo.inOut" },
  reveal: { duration: 0.8, ease: "expo.inOut" }
};

function getConfig(type) { // original mangled: d
  return type in TRANSITION_CONFIG ? TRANSITION_CONFIG[type] : DEFAULT_CONFIG;
}

// Clip Path Constants
const CLIP_COVER = "inset(50% 50% 50% 50%)"; // original mangled: f
const CLIP_REVEAL = "inset(0% 0% 0% 0%)"; // original mangled: m

function getWipePolygon(progress) { // original mangled: h
  let t = 50 * progress;
  let p1 = (50 - t).toFixed(3);
  let p2 = (50 + t).toFixed(3);
  let p3 = (50 - t).toFixed(3);
  let p4 = (50 + t).toFixed(3);
  return `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${p1}% ${p3}%, ${p1}% ${p4}%, ${p2}% ${p4}%, ${p2}% ${p3}%, ${p1}% ${p3}%)`;
}

// Debugger stub
const debugLog = (...args) => 0; // original mangled: ((...e)=>0)

function TransitionOverlay() { // original mangled: v
  let overlayClass = "absolute inset-0 [will-change:clip-path]"; // original mangled: e
  let initStyle = { clipPath: CLIP_COVER }; // original mangled: n
  
  let { revealed } = useAnimation(); // original mangled: a
  let textWrapperRef = useRef(null); // original mangled: i
  let textElRef = useRef(null); // original mangled: s
  let tlRef = useRef(null); // original mangled: c
  let timeoutRef = useRef(null); // original mangled: u
  
  let cleanup = useCallback(() => { // original mangled: d
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
      
      let label = (e.detail?.label || "Loading").trim() || "Loading"; // original mangled: n
      
      tlRef.current?.kill();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => cleanup(), 5000);
      
      gsap.set(wrapper, { autoAlpha: 1 });
      
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        textEl.className = "text-accent-base scramble-brand";
        textEl.innerText = label;
        return;
      }
      
      let charCount = label.replace(/\s/g, "").length; // original mangled: a
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
    
    let handleReveal = () => cleanup(); // original mangled: t
    
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

// Helpers
const scrollToTop = () => { // original mangled: w
  if (window.lenis) {
    window.lenis.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo({ top: 0, behavior: "instant" });
  }
};

const determineLayout = (pathname) => { // original mangled: b
  let type = getLayoutType(pathname); // original mangled: t
  if (type !== "app") return type;
  if (typeof document !== "undefined" && document.querySelector("[data-anon-app-shell]")) {
    return "marketing";
  }
  return type;
};

const getBaseSlug = (url) => { // original mangled: x
  return url && typeof url === "string" 
    ? url.split("?")[0].split("#")[0].split("/").filter(Boolean)[0] || "" 
    : "";
};

const isSameSection = (urlA, urlB) => { // original mangled: _
  let slugA = getBaseSlug(urlA);
  let slugB = getBaseSlug(urlB);
  return slugA !== "" && slugA === slugB;
};

// module id: 791141
export default function TransitionLayout({ children }) { // original mangled: e
  let pathname = usePathname(); // original mangled: s
  let { triggerPageEnter, revealPage, onGatesClear } = useAnimation(); // original mangled: c, u, p
  
  let currentType = useRef(null); // original mangled: g
  let lastPathname = useRef(pathname); // original mangled: x
  let isIntercepted = useRef(false); // original mangled: S
  let transitionConfig = useRef(null); // original mangled: E
  let leftElements = useRef([]); // original mangled: k

  debugLog("TransitionLayout render, pathname:", pathname);

  useEffect(() => {
    debugLog("Layout type updated:", determineLayout(pathname));
    currentType.current = determineLayout(pathname);
  }, [pathname]);

  let leaveRef = useRef(null); // original mangled: A
  let enterRef = useRef(null); // original mangled: C

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

  let handleLeave = useCallback(async () => { // original mangled: T
    debugLog("leave() called");
    let fromType = currentType.current; // original mangled: e
    let target = getTransitionTarget(); // original mangled: t
    let toType = target ? determineLayout(target) : fromType; // original mangled: r
    let currentPath = window.location.pathname; // original mangled: n
    
    let config = fromType === toType 
      ? getConfig(fromType) 
      : (fromType === "marketing" || toType === "marketing") ? getConfig("marketing") : getConfig(fromType); // original mangled: a
      
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
      let brandEl = document.querySelector("#transition-overlay .ts-brand"); // original mangled: e
      let darkEl = document.querySelector("#transition-overlay .ts-dark"); // original mangled: t
      
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
      
      let { duration, ease } = config.cover; // original mangled: r, n
      
      return new Promise((resolve) => { // original mangled: a
        gsap.set("#transition-overlay", { pointerEvents: "auto" });
        window.dispatchEvent(new CustomEvent("seedtransition:cover", { detail: { label: getTransitionLabel() } }));
        
        let tl = gsap.timeline({
          onComplete: () => {
            scrollToTop();
            resolve();
          }
        });
        
        // Inline panel cover function
        tl.fromTo(brandEl, { clipPath: CLIP_COVER }, { clipPath: CLIP_REVEAL, duration: duration || 0.6, ease: ease || "expo.inOut" }, 0);
        tl.fromTo(darkEl, { clipPath: CLIP_COVER }, { clipPath: CLIP_REVEAL, duration: duration || 0.6, ease: ease || "expo.inOut" }, 0.08);
      });
    }
    
    // Fade Mechanism
    let contentEls = document.querySelectorAll("[data-transition-content]"); // original mangled: i
    let footerEl = document.querySelector("footer"); // original mangled: l
    
    debugLog("leave() - found content elements:", contentEls.length, "footer:", !!footerEl);
    
    if (contentEls.length === 0) {
      debugLog("leave() - no content elements found!");
      scrollToTop();
      return;
    }
    
    let { duration: fDur, ease: fEase } = config.leave; // original mangled: s, c
    debugLog("leave() - animating with duration:", fDur, "ease:", fEase);
    
    let elementsArray = Array.from(contentEls); // original mangled: u
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

  let handleEnter = useCallback(async () => { // original mangled: j
    debugLog("enter() called");
    let config = transitionConfig.current || getConfig(determineLayout(pathname)); // original mangled: e
    debugLog("enter() - config:", config);
    
    if (!config) {
      debugLog("enter() - skipping (no config)");
      return Promise.resolve();
    }
    
    let finishEnter = () => { // original mangled: t
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          debugLog("enter() - triggering pageEnter animations");
          triggerPageEnter();
        });
      });
    };
    
    if (config.mechanism === "panel") {
      let brandEl = document.querySelector("#transition-overlay .ts-brand"); // original mangled: r
      let darkEl = document.querySelector("#transition-overlay .ts-dark"); // original mangled: n
      
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
      
      let { duration, ease } = config.reveal; // original mangled: a, i
      
      return new Promise((resolve) => { // original mangled: e
        let hasRevealed = false; // original mangled: t
        let unregisterGate = null; // original mangled: l
        let revealTimeout = null; // original mangled: s
        
        let runReveal = () => { // original mangled: c
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
          
          // Inline panel reveal function
          let progressObj = { pd: 0, pb: 0 }; // original mangled: l
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
    
    // Fade Mechanism Enter
    let fadeConfig = config.enter; // original mangled: r
    let contentEls = document.querySelectorAll("[data-transition-content]"); // original mangled: n
    let footerEl = document.querySelector("footer"); // original mangled: a
    
    debugLog("enter() - found content elements:", contentEls.length, "footer:", !!footerEl);
    
    let currentElSet = new Set(contentEls); // original mangled: i
    // Cleanup old elements left behind
    let staleEls = leftElements.current.filter(el => el && !currentElSet.has(el)); // original mangled: l
    if (staleEls.length) {
      gsap.set(staleEls, { opacity: 1 });
    }
    leftElements.current = [];
    
    if (contentEls.length === 0) {
      debugLog("enter() - no content elements found!");
      finishEnter();
      return;
    }
    
    let { duration: eDur, ease: eEase } = fadeConfig; // original mangled: m, g
    debugLog("enter() - animating with duration:", eDur, "ease:", eEase);
    
    let tl = gsap.timeline(); // original mangled: v
    return new Promise((resolve) => { // original mangled: e
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
