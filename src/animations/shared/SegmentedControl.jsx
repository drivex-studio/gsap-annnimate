"use client";
import React, { useRef, useCallback } from 'react';
import { cn } from '@/libs/utils/className';
import AnimatedTabs from '@/animations/components/AnimatedTabs';

export default function SegmentedControl({
  tabs,
  activeId,
  onChange,
  ariaLabel = "Tabs",
  className = "",
  fill = false,
  iconSize = "size-12"
}) {
  let wrapperRef = useRef(null);

  let handleKeyDown = useCallback((e, currentIndex) => {
    let tabElements = wrapperRef.current?.querySelectorAll("[data-flip-id]");
    if (!tabElements?.length) return;
    
    let nextIndex = null;
    
    switch (e.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % tabElements.length;
        break;
      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + tabElements.length) % tabElements.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabElements.length - 1;
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        onChange(tabs[currentIndex].id);
        return;
      default:
        return;
    }
    
    if (nextIndex !== null) {
      e.preventDefault();
      tabElements[nextIndex]?.focus();
    }
  }, [onChange, tabs]);

  return (
    <div ref={wrapperRef} className={cn(fill && "w-full")}>
      <AnimatedTabs
        activeId={activeId}
        aria-label={ariaLabel}
        role="tablist"
        containerClassName={cn(
          "overflow-x-auto bg-foreground/[0.04] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          fill && "w-full",
          className
        )}
        className={cn(
          "items-stretch",
          fill && "w-full"
        )}
      >
        {tabs.map((tab, index) => {
          let isActive = activeId === tab.id;
          let Icon = tab.Icon;
          
          return (
            <button
              key={tab.id}
              type="button"
              data-flip-id={tab.id}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              aria-selected={isActive}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              className={cn(
                "relative z-10 inline-flex items-center gap-8 whitespace-nowrap px-16 py-12 text-mono-sm",
                fill ? "flex-1 justify-center" : "shrink-0",
                "transition-colors duration-(--duration-fast) ease-(--ease-expo-out)",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-foreground/30",
                isActive ? "text-foreground" : "text-foreground/55 hover:text-foreground"
              )}
              style={isActive && tab.color ? { color: tab.color } : undefined}
            >
              {Icon ? (
                <span
                  className={cn("flex shrink-0 items-center justify-center", iconSize)}
                  style={tab.color ? { color: tab.color } : undefined}
                >
                  <Icon className={iconSize} />
                </span>
              ) : null}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </AnimatedTabs>
    </div>
  );
}
