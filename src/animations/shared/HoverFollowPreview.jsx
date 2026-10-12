"use client";

import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/libs/utils/className';

gsap.registerPlugin(useGSAP);

const CLIP_PATH_STYLE = "inset(var(--clip-t, 50%) var(--clip-r, 50%) var(--clip-b, 50%) var(--clip-l, 50%))";

export default function HoverFollowPreview({
  containerRef,
  items = [],
  width = 320,
  aspect = "16 / 10",
  frameClassName = ""
}) {
  let scopeRef = useRef(null);
  let previewWrapperRef = useRef(null);
  let mediaRefs = useRef([]);
  let xToRef = useRef(null);
  let yToRef = useRef(null);
  
  let targetPosRef = useRef({ x: 0, y: 0 });
  let mousePosRef = useRef({ x: -1, y: -1 });
  
  let isVisibleRef = useRef(false);
  let activeIndexRef = useRef(-1);
  let zIndexCounterRef = useRef(0);
  
  let [isTouch, setIsTouch] = useState(false);
  let [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0 || window.matchMedia("(hover: none)").matches);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  let isEnabled = !isTouch && !reducedMotion && items.length > 0;

  let { contextSafe } = useGSAP({ scope: scopeRef });

  useGSAP(() => {
    if (isEnabled && previewWrapperRef.current) {
      gsap.set(previewWrapperRef.current, { opacity: 0, scale: 0.5 });
      
      mediaRefs.current.forEach(mediaEl => {
        if (mediaEl) {
          gsap.set(mediaEl, {
            "--clip-t": "50%",
            "--clip-r": "50%",
            "--clip-b": "50%",
            "--clip-l": "50%",
            filter: "brightness(1)"
          });
        }
      });
      
      xToRef.current = gsap.quickTo(previewWrapperRef.current, "x", { duration: 0.5, ease: "power3.out" });
      yToRef.current = gsap.quickTo(previewWrapperRef.current, "y", { duration: 0.5, ease: "power3.out" });
    }
  }, { scope: scopeRef, dependencies: [isEnabled, items.length] });

  let showPreview = contextSafe((index) => {
    let currentMedia = mediaRefs.current[index];
    if (!previewWrapperRef.current || !currentMedia || (isVisibleRef.current && activeIndexRef.current === index)) return;
    
    let wasVisible = isVisibleRef.current;
    let prevIndex = activeIndexRef.current;
    
    activeIndexRef.current = index;
    isVisibleRef.current = true;
    
    if (!wasVisible) {
      gsap.killTweensOf(previewWrapperRef.current, "opacity,scale");
      gsap.set(previewWrapperRef.current, {
        x: targetPosRef.current.x,
        y: targetPosRef.current.y
      });
      gsap.fromTo(previewWrapperRef.current, {
        opacity: 0,
        scale: 0.6
      }, {
        opacity: 1,
        scale: 1,
        duration: 0.35,
        ease: "back.out(1.6)"
      });
    }
    
    if (prevIndex >= 0 && prevIndex !== index) {
      let prevMedia = mediaRefs.current[prevIndex];
      if (prevMedia) {
        gsap.killTweensOf(prevMedia);
        gsap.to(prevMedia, {
          filter: "brightness(0.7)",
          duration: 0.5,
          ease: "power3.out"
        });
        prevMedia.pause?.();
      }
    }
    
    zIndexCounterRef.current += 1;
    gsap.killTweensOf(currentMedia);
    gsap.set(currentMedia, {
      zIndex: zIndexCounterRef.current,
      filter: "brightness(1)",
      "--clip-t": "50%",
      "--clip-r": "50%",
      "--clip-b": "50%",
      "--clip-l": "50%"
    });
    
    gsap.to(currentMedia, {
      "--clip-t": "0%",
      "--clip-r": "0%",
      "--clip-b": "0%",
      "--clip-l": "0%",
      duration: 0.5,
      ease: "power3.out"
    });
    
    if (currentMedia.tagName === "VIDEO") {
      currentMedia.currentTime = 0;
      currentMedia.play?.().catch(() => {});
    }
  });

  let hidePreview = contextSafe(() => {
    if (!isVisibleRef.current) return;
    
    isVisibleRef.current = false;
    activeIndexRef.current = -1;
    
    if (previewWrapperRef.current) {
      gsap.killTweensOf(previewWrapperRef.current, "opacity,scale");
      gsap.to(previewWrapperRef.current, {
        opacity: 0,
        scale: 0.6,
        duration: 0.25,
        ease: "power2.out",
        onComplete: () => {
          if (!isVisibleRef.current) {
            mediaRefs.current.forEach(mediaEl => {
              if (mediaEl) {
                gsap.set(mediaEl, {
                  "--clip-t": "50%",
                  "--clip-r": "50%",
                  "--clip-b": "50%",
                  "--clip-l": "50%",
                  filter: "brightness(1)",
                  zIndex: 0
                });
                mediaEl.pause?.();
              }
            });
            zIndexCounterRef.current = 0;
          }
        }
      });
    }
  });

  let checkPointerOverTarget = contextSafe(() => {
    let containerEl = containerRef?.current;
    if (!containerEl || mousePosRef.current.x < 0) return;
    
    let elementUnderPointer = document.elementFromPoint(mousePosRef.current.x, mousePosRef.current.y);
    let hfpTarget = (elementUnderPointer && containerEl.contains(elementUnderPointer)) 
      ? elementUnderPointer.closest("[data-hfp-index]") 
      : null;
      
    if (hfpTarget) {
      let index = Number(hfpTarget.getAttribute("data-hfp-index"));
      if (!Number.isNaN(index)) {
        showPreview(index);
      }
    } else {
      hidePreview();
    }
  });

  useEffect(() => {
    if (!isEnabled) return;
    
    let handlePointerMove = (e) => {
      mousePosRef.current.x = e.clientX;
      mousePosRef.current.y = e.clientY;
      
      let previewHeight = previewWrapperRef.current?.offsetHeight || 0;
      targetPosRef.current.x = e.clientX + 24;
      targetPosRef.current.y = e.clientY - previewHeight / 2;
      
      checkPointerOverTarget();
      
      if (isVisibleRef.current) {
        xToRef.current?.(targetPosRef.current.x);
        yToRef.current?.(targetPosRef.current.y);
      }
    };
    
    let handleScroll = () => checkPointerOverTarget();
    
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [isEnabled, checkPointerOverTarget]);

  if (!isEnabled) return null;

  return (
    <span ref={scopeRef} aria-hidden="true" className="contents">
      <div
        ref={previewWrapperRef}
        className={cn("pointer-events-none fixed left-0 top-0 z-50 overflow-hidden bg-background opacity-0", frameClassName)}
        style={{ width, aspectRatio: aspect }}
      >
        {items.map((item, index) => {
          if (!item?.src) return null;
          
          if (item.type === "video") {
            return (
              <video
                key={index}
                ref={(el) => (mediaRefs.current[index] = el)}
                src={item.src}
                muted={true}
                loop={true}
                playsInline={true}
                preload="metadata"
                className="absolute inset-0 size-full object-cover"
                style={{ clipPath: CLIP_PATH_STYLE }}
              />
            );
          }
          
          return (
            <img
              key={index}
              ref={(el) => (mediaRefs.current[index] = el)}
              src={item.src}
              alt=""
              decoding="async"
              className="absolute inset-0 size-full object-cover"
              style={{ clipPath: CLIP_PATH_STYLE }}
            />
          );
        })}
      </div>
    </span>
  );
}
