import React, { useRef, useEffect } from 'react';

import gsap from 'gsap'; // module id: 989970
import { SplitText } from '@/libs/utils/vendor'; // module id: 875324

import { useDualLayerScramble } from '@/hooks/useDualLayerScramble'; // module id: 798851

gsap.registerPlugin(SplitText);

// module id: 327018
export default function FAQItem({
  q, // original mangled: e
  a, // original mangled: s
  isOpen, // original mangled: i
  onToggle, // original mangled: c
  isDesktop, // original mangled: o
  duration = 0.8, // original mangled: d
  ease = "expo.inOut" // original mangled: u
}) {
  let contentRef = useRef(null); // original mangled: m
  let iconRef = useRef(null); // original mangled: h
  let verticalLineRef = useRef(null); // original mangled: f
  
  let timelineRef = useRef(null); // original mangled: g
  let splitTextRef = useRef(null); // original mangled: p
  let textAnimRef = useRef(null); // original mangled: x
  
  let prevIsOpen = useRef(false); // original mangled: b

  let { ref: scrambleRef, scramble: triggerScramble } = useDualLayerScramble({ // original mangled: v, y
    duration: 0.5,
    speed: 1,
    firstColorClass: "scramble-brand",
    secondColorClass: "scramble-inherit"
  });

  // Setup the accordion expand/collapse timeline
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    
    let contentEl = contentRef.current;
    if (!contentEl) return;
    
    gsap.set(contentEl, {
      height: 0,
      overflow: "hidden",
      force3D: true
    });
    
    let tl = gsap.timeline({
      paused: true,
      defaults: {
        duration,
        ease
      }
    });
    
    tl.to(contentEl, {
      height: "auto",
      duration,
      ease
    }, 0);
    
    if (iconRef.current) {
      tl.to(iconRef.current, {
        rotation: -180,
        duration,
        ease
      }, 0);
    }
    
    if (verticalLineRef.current) {
      tl.to(verticalLineRef.current, {
        opacity: 0,
        duration: 0.5 * duration,
        ease: "power2.inOut"
      }, 0.25 * duration);
    }
    
    timelineRef.current = tl;
    
    return () => {
      tl.kill();
      textAnimRef.current?.kill();
      splitTextRef.current?.revert();
    };
  }, [duration, ease]);

  // Handle open/close state changes
  useEffect(() => {
    if (timelineRef.current && isOpen !== prevIsOpen.current) {
      prevIsOpen.current = isOpen;
      
      if (isOpen) {
        timelineRef.current.play();
        
        if (isDesktop) {
          triggerScramble();
        }
        
        if (isDesktop && contentRef.current) {
          let timeoutId = window.setTimeout(() => {
            document.fonts?.ready.then(() => {
              let contentEl = contentRef.current;
              if (contentEl) {
                contentEl.querySelectorAll("p").forEach(pTag => {
                  if (pTag.querySelector(".faq-split-line")) return;
                  
                  splitTextRef.current = SplitText.create(pTag, {
                    type: "lines",
                    mask: "lines",
                    linesClass: "faq-split-line"
                  });
                  
                  let lines = splitTextRef.current.lines;
                  
                  gsap.set(lines, {
                    yPercent: 110,
                    force3D: true
                  });
                  
                  textAnimRef.current = gsap.to(lines, {
                    yPercent: 0,
                    duration: 0.6,
                    stagger: 0.06,
                    ease: "expo.out",
                    force3D: true
                  });
                });
              }
            });
          }, 180);
          
          return () => window.clearTimeout(timeoutId);
        }
      } else {
        timelineRef.current.reverse();
        textAnimRef.current?.kill();
        textAnimRef.current = null;
        splitTextRef.current?.revert();
        splitTextRef.current = null;
      }
    }
  }, [isOpen, isDesktop, triggerScramble]);

  return (
    <div className="faq-item border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`group flex w-full cursor-pointer items-start justify-between gap-16 border-0 bg-transparent py-24 text-left transition-colors duration-300 lg:items-center ${isOpen ? "text-foreground" : "text-foreground-muted hover:text-foreground"}`}
      >
        <span ref={scrambleRef} className="text-body-lg">
          {q}
        </span>
        <svg
          ref={iconRef}
          className="h-12 w-12 shrink-0"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            ref={verticalLineRef}
            d="M8 1V15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
          <path
            d="M1 8H15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
      </button>
      <div ref={contentRef}>
        <div className="text-body max-w-[96ch] pb-24 text-foreground-muted">
          <p>{a}</p>
        </div>
      </div>
    </div>
  );
}
