"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { CaretDown } from '@phosphor-icons/react';
import { cn } from '@/libs/utils/className';

const CUSTOM_EASES = [
  { value: "annnimate", label: "Annnimate Drift", bezier: [0.3, 0.9, 0.1, 1] },
  { value: "annnimateInOut", label: "Annnimate Punch", bezier: [0.7, 0, 0.16, 1] }
];

const STANDARD_EASE_TYPES = [
  "power1", "power2", "power3", "power4", "expo", "circ", "sine", "back", "elastic", "bounce"
];

const EASE_DIRECTIONS = [
  { id: "out", label: "Out" },
  { id: "in", label: "In" },
  { id: "inOut", label: "In-out" }
];

function EaseCurveIcon({ value, className = "" }) {
  let pathData = useMemo(() => {
    let generatePoints = function(easeStr, resolution = 48) {
      let easeFn;
      let customEase = CUSTOM_EASES.find(item => item.value === easeStr);
      let points = [];
      
      if (customEase) {
        let [x1, y1, x2, y2] = customEase.bezier;
        for (let i = 0; i <= resolution; i++) {
          points.push(function getBezierPoint(t, p1x, p1y, p2x, p2y) {
            let u = 1 - t;
            return {
              x: 3 * u * u * t * p1x + 3 * u * t * t * p2x + t * t * t,
              y: 3 * u * u * t * p1y + 3 * u * t * t * p2y + t * t * t
            };
          }(i / resolution, x1, y1, x2, y2));
        }
        return points;
      }
      
      try {
        easeFn = gsap.parseEase(easeStr);
      } catch {
        easeFn = null;
      }
      
      if (!easeFn) easeFn = (v) => v;
      
      for (let i = 0; i <= resolution; i++) {
        let progress = i / resolution;
        points.push({ x: progress, y: easeFn(progress) });
      }
      return points;
    }(value);

    let yValues = generatePoints.map(p => p.y);
    let minY = Math.min(0, ...yValues);
    let maxY = Math.max(1, ...yValues);
    
    return generatePoints.map((point, index) => {
      let svgX = 3 + 38 * point.x;
      let svgY = 3 + (1 - (point.y - minY) / (maxY - minY)) * 20;
      return `${index === 0 ? "M" : "L"}${svgX.toFixed(1)},${svgY.toFixed(1)}`;
    }).join(" ");
  }, [value]);

  return (
    <svg viewBox="0 0 44 26" aria-hidden="true" className={cn("h-16 w-28 shrink-0", className)}>
      <path d={pathData} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function EaseOptionButton({ value, label, active, onSelect, house = false }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={() => onSelect(value)}
      className={cn(
        "flex flex-col items-center gap-4 border px-4 py-6 transition-colors",
        active 
          ? "border-foreground/40 bg-foreground/[0.08] text-foreground" 
          : "border-foreground/[0.06] bg-foreground/[0.02] text-foreground-muted hover:bg-foreground/[0.06] hover:text-foreground"
      )}
    >
      <EaseCurveIcon value={value} className={house && !active ? "text-brand/80" : undefined} />
      <span className="max-w-full truncate text-[11px] font-sans leading-none">{label}</span>
    </button>
  );
}

export default function EasingSelect({
  value,
  onChange,
  disabled = false,
  align = "right",
  ariaLabel = "Easing",
  className = ""
}) {
  let [isOpen, setIsOpen] = useState(false);
  let [direction, setDirection] = useState(() => {
    let dirSuffix = String(value || "").split(".")[1];
    return EASE_DIRECTIONS.some(dir => dir.id === dirSuffix) ? dirSuffix : "out";
  });
  
  let containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    
    let handleMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    let handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  let handleSelect = (val) => {
    onChange?.(val);
    setIsOpen(false);
  };

  let standardOptions = [
    ...STANDARD_EASE_TYPES.map(type => ({
      value: `${type}.${direction}`,
      label: type.charAt(0).toUpperCase() + type.slice(1)
    })),
    { value: "none", label: "Linear" }
  ];

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(prev => !prev)}
        className="inline-flex h-28 w-full items-center justify-between gap-8 border border-foreground/10 bg-foreground/[0.05] px-10 text-[13px] font-sans text-foreground transition-colors hover:bg-foreground/[0.08] focus-visible:border-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
      >
        <span className="flex min-w-0 items-center gap-8">
          <EaseCurveIcon value={value} className="text-foreground-muted" />
          <span className="truncate">
            {(function formatEaseLabel(easeVal) {
              let custom = CUSTOM_EASES.find(c => c.value === easeVal);
              if (custom) return custom.label;
              if (!easeVal || easeVal === "none" || easeVal === "linear") return "Linear";
              
              let [type, dir] = String(easeVal).split(".");
              let capType = type.charAt(0).toUpperCase() + type.slice(1);
              let formatDir = dir === "inOut" ? "in-out" : (dir || "");
              
              return formatDir ? `${capType} ${formatDir}` : capType;
            })(value)}
          </span>
        </span>
        <CaretDown
          aria-hidden="true"
          className={cn("size-12 shrink-0 text-foreground-muted transition-transform duration-(--duration-quick) ease-(--ease-expo-out)", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            "absolute top-[calc(100%+4px)] z-30 w-[264px] border border-foreground/10 bg-surface p-8",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {}
          <div className="mb-8 flex gap-4">
            {EASE_DIRECTIONS.map(dir => (
              <button
                key={dir.id}
                type="button"
                onClick={() => setDirection(dir.id)}
                className={cn(
                  "flex-1 border px-8 py-4 text-[12px] font-sans transition-colors",
                  direction === dir.id ? "border-foreground/30 bg-foreground/[0.08] text-foreground" : "border-transparent text-foreground-muted hover:text-foreground"
                )}
              >
                {dir.label}
              </button>
            ))}
          </div>

          {}
          <div className="mb-8 grid grid-cols-2 gap-4">
            {CUSTOM_EASES.map(custom => (
              <button
                key={custom.value}
                type="button"
                role="option"
                aria-selected={value === custom.value}
                onClick={() => handleSelect(custom.value)}
                className={cn(
                  "flex w-full flex-col items-center gap-4 border px-8 py-6 transition-colors",
                  value === custom.value ? "border-foreground/40 bg-foreground/[0.08] text-foreground" : "border-foreground/[0.06] bg-foreground/[0.02] text-foreground-muted hover:bg-foreground/[0.06] hover:text-foreground"
                )}
              >
                <EaseCurveIcon value={custom.value} className={value === custom.value ? undefined : "text-brand/80"} />
                <span className="truncate text-[12px] font-sans">{custom.label}</span>
              </button>
            ))}
          </div>

          <div className="mb-8 h-px bg-foreground/10" />

          {}
          <div className="grid grid-cols-3 gap-4">
            {standardOptions.map(opt => (
              <EaseOptionButton
                key={opt.value}
                value={opt.value}
                label={opt.label}
                active={value === opt.value}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
