'use client'
import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { cn } from '@/libs/utils/className';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';

const SmartTooltipContext = createContext(null);

const TOOLTIP_BASE_CLASSES = "z-50 overflow-hidden border border-foreground/10 bg-surface px-10 py-6 text-accent-xs text-foreground";

export function SmartTooltipGroup({
  children,
  delayDuration = 300,
  flipDuration = 0.2,
  flipEase = "power3.out",
  enterDuration = 0.25,
  enterEase = "power3.out",
  exitDuration = 0.2,
  exitEase = "power2.in",
  hideDelay = 100,
  flipThreshold = 800,
  side = "top",
  sideOffset = 8
}) {
  let [activeTooltipId, setActiveTooltipId] = useState(null);
  let [content, setContent] = useState("");
  let [isVisible, setIsVisible] = useState(false);
  
  let floatingRef = useRef(null);
  let triggersMap = useRef(new Map());
  let enterTimeout = useRef(null);
  let hideTimeout = useRef(null);
  let lastInteractionTime = useRef(0);
  let isAnimatingOut = useRef(false);

  let calculatePosition = useCallback((triggerElement) => {
    if (!triggerElement || !floatingRef.current) return { top: 0, left: 0, side: "top" };
    
    let triggerRect = triggerElement.getBoundingClientRect();
    let tooltipRect = floatingRef.current.getBoundingClientRect();
    let ww = window.innerWidth;
    let wh = window.innerHeight;
    
    let top, left;
    let computedSide = side;

    switch (side) {
      case "top":
        top = triggerRect.top - tooltipRect.height - sideOffset;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        if (top < sideOffset) {
          computedSide = "bottom";
          top = triggerRect.bottom + sideOffset;
        }
        break;
      case "bottom":
        top = triggerRect.bottom + sideOffset;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        if (top + tooltipRect.height > wh - sideOffset) {
          computedSide = "top";
          top = triggerRect.top - tooltipRect.height - sideOffset;
        }
        break;
      case "left":
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - sideOffset;
        if (left < sideOffset) {
          computedSide = "right";
          left = triggerRect.right + sideOffset;
        }
        break;
      case "right":
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + sideOffset;
        if (left + tooltipRect.width > ww - sideOffset) {
          computedSide = "left";
          left = triggerRect.left - tooltipRect.width - sideOffset;
        }
        break;
      default:
        top = triggerRect.top - tooltipRect.height - sideOffset;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    }

    left = Math.max(sideOffset, Math.min(left, ww - tooltipRect.width - sideOffset));
    top = Math.max(sideOffset, Math.min(top, wh - tooltipRect.height - sideOffset));

    return { top, left, side: computedSide };
  }, [side, sideOffset]);

  let showTooltip = useCallback((id, tooltipContent) => {
    let now = Date.now();
    let timeSinceLast = now - lastInteractionTime.current;
    lastInteractionTime.current = now;
    
    let triggerEl = triggersMap.current.get(id);
    if (!triggerEl) return;

    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }

    if (isVisible && activeTooltipId !== id && timeSinceLast < flipThreshold && floatingRef.current) {
      setContent(tooltipContent);
      setActiveTooltipId(id);
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!floatingRef.current) return;
          let pos = calculatePosition(triggerEl);
          gsap.to(floatingRef.current, {
            x: pos.left,
            y: pos.top,
            duration: flipDuration,
            ease: flipEase
          });
        });
      });
    } else {
      setContent(tooltipContent);
      setActiveTooltipId(id);
      setIsVisible(true);
      
      requestAnimationFrame(() => {
        if (!floatingRef.current) return;
        let pos = calculatePosition(triggerEl);
        
        gsap.set(floatingRef.current, { x: pos.left, y: pos.top });
        gsap.fromTo(floatingRef.current, 
          { opacity: 0, scale: 0.9, yPercent: pos.side === "top" ? 5 : pos.side === "bottom" ? -5 : 0 },
          { opacity: 1, scale: 1, yPercent: 0, duration: enterDuration, ease: enterEase }
        );
      });
    }
  }, [isVisible, activeTooltipId, flipThreshold, flipDuration, flipEase, enterDuration, enterEase, calculatePosition]);

  let hideTooltip = useCallback(() => {
    if (floatingRef.current && !isAnimatingOut.current) {
      isAnimatingOut.current = true;
      gsap.to(floatingRef.current, {
        opacity: 0,
        scale: 0.9,
        yPercent: side === "top" ? 5 : side === "bottom" ? -5 : 0,
        duration: exitDuration,
        ease: exitEase,
        onComplete: () => {
          setIsVisible(false);
          setActiveTooltipId(null);
          isAnimatingOut.current = false;
        }
      });
    }
  }, [side, exitDuration, exitEase]);

  let registerTrigger = useCallback((id, element) => {
    if (element) {
      triggersMap.current.set(id, element);
    } else {
      triggersMap.current.delete(id);
    }
  }, []);

  let handleMouseEnter = useCallback((id, content) => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    if (enterTimeout.current) clearTimeout(enterTimeout.current);
    
    if (isVisible) {
      showTooltip(id, content);
    } else {
      enterTimeout.current = setTimeout(() => {
        showTooltip(id, content);
        enterTimeout.current = null;
      }, delayDuration);
    }
  }, [isVisible, delayDuration, showTooltip]);

  let handleMouseLeave = useCallback(() => {
    if (enterTimeout.current) {
      clearTimeout(enterTimeout.current);
      enterTimeout.current = null;
    }
    hideTimeout.current = setTimeout(() => {
      hideTooltip();
      hideTimeout.current = null;
    }, hideDelay);
  }, [hideDelay, hideTooltip]);

  useEffect(() => {
    return () => {
      if (enterTimeout.current) clearTimeout(enterTimeout.current);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  return (
    <SmartTooltipContext.Provider activeTooltipId handleMouseEnter, handleMouseLeave, registerTrigger, value="{{" }}>
      {children}
      {isVisible && (
        <div
          ref={floatingRef}
          className={cn("pointer-events-none fixed", TOOLTIP_BASE_CLASSES)}
          style={{ top: 0, left: 0, opacity: 0 }}
        >
          {content}
        </div>
      )}
    </SmartTooltipContext.Provider>
  );
}

export function SmartTooltip({ children, content, id }) {
  let context = useContext(SmartTooltipContext);
  let fallbackId = useRef(id || `tooltip-${Math.random().toString(36).substr(2, 9)}`);
  let [triggerNode, setTriggerNode] = useState(null);
  
  let refCallback = useCallback((node) => {
    setTriggerNode(node);
  }, []);

  useEffect(() => {
    if (context && triggerNode) {
      context.registerTrigger(fallbackId.current, triggerNode);
      return () => {
        context.registerTrigger(fallbackId.current, null);
      };
    }
  }, [context, triggerNode]);

  if (context) {
    return (
      <div
        ref={refCallback}
        onMouseEnter={() => context.handleMouseEnter(fallbackId.current, content)}
        onMouseLeave={() => context.handleMouseLeave()}
        className="flex flex-1 min-w-0"
      >
        {children}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration="{300}">
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset="{8}">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
