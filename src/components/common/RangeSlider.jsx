'use client';

// Variable Mapping:
// o -> AnimatedNumber, u -> AnimatedDigit
// i -> DIGITS, s -> MARKS
// default function -> RangeSlider
// label: e, value: i, min: u, max: c, step: d, unit: f, disabled: m, onChange: g, onCommit: p, className: b
// containerRef: h, backgroundRef: x, thumbRef: v, quickToTweens: C, prefersReducedMotion: w
// numMin: N, numMax: j, currentValue/setCurrentValue: y/M, prevValueRef: E, rAFRef: A, rAFValueRef: k
// numCurrentValue: V, progress: H, prevProgressRef: L, decimalPlaces: S
// contextSafe: Z, isDraggingRef: F, lastEmittedValueRef: $, valueTextRef: R, lastPointerRef: z
// scheduleOnChange: O, handlePointerMove: T, isEditing/setIsEditing: _/D, editValue/setEditValue: U/q
// isCommittingEditRef: B, handleEditCommit: I, handlePointerDown: P

import { useState, useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746

const DIGITS = ["9", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const MARKS = [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];

function AnimatedNumber({ value, className = '' }) {
  let stringValue = String(value ?? '');
  
  return (
    <span className={cn("inline-flex items-center tabular-nums", className)} aria-label={stringValue}>
      {stringValue.split('').map((char, index) => 
        /[0-9]/.test(char) ? (
          <AnimatedDigit key={`${stringValue.length}-${index}`} digit={Number(char)} />
        ) : (
          <span key={`${stringValue.length}-${index}-${char}`} aria-hidden="true">
            {char}
          </span>
        )
      )}
    </span>
  );
}

function AnimatedDigit({ digit }) {
  let digitRef = useRef(null);
  let isInitialized = useRef(false);

  useEffect(() => {
    let element = digitRef.current;
    if (!element) return;
    
    let yOffset = -(20 * (digit + 1));
    
    if (!isInitialized.current) {
      isInitialized.current = true;
      gsap.set(element, { y: yOffset });
      return;
    }
    
    let prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(element, { 
      y: yOffset, 
      duration: 0.4 * !prefersReducedMotion, 
      ease: "back.out(1.6)", 
      overwrite: "auto" 
    });
  }, [digit]);

  return (
    <span aria-hidden="true" className="inline-block overflow-hidden" style={{ height: 20 }}>
      <span ref={digitRef} className="flex flex-col">
        {DIGITS.map((char, index) => (
          <span key={`${char}-${index}`} className="flex items-center justify-center" style={{ height: 20 }}>
            {char}
          </span>
        ))}
      </span>
    </span>
  );
}

// NOTE: module id: 125303
export default function RangeSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  disabled = false,
  onChange,
  onCommit,
  className = ''
}) {
  let containerRef = useRef(null);
  let backgroundRef = useRef(null);
  let thumbRef = useRef(null);
  let quickToTweens = useRef(null);
  let prefersReducedMotion = useRef(false);
  
  let numMin = Number(min);
  let numMax = Number(max);
  
  let [currentValue, setCurrentValue] = useState(value);
  let prevValueRef = useRef(value);
  let rAFRef = useRef(0);
  let rAFValueRef = useRef(null);

  useEffect(() => {
    if (String(value) !== String(prevValueRef.current)) {
      setCurrentValue(value);
    }
  }, [value]);

  useEffect(() => {
    return () => cancelAnimationFrame(rAFRef.current);
  }, []);

  let numCurrentValue = Number(currentValue);
  let progress = useMemo(() => {
    if (!Number.isFinite(numCurrentValue) || numMax <= numMin) return 0;
    return Math.min(1, Math.max(0, (numCurrentValue - numMin) / (numMax - numMin)));
  }, [numCurrentValue, numMin, numMax]);

  let prevProgressRef = useRef(progress);
  prevProgressRef.current = progress;

  let decimalPlaces = Math.max(
    (String(step).split(".")[1] || "").length,
    (String(currentValue).split(".")[1] || "").length
  );

  let { contextSafe } = useGSAP(() => {
    let container = containerRef.current;
    let background = backgroundRef.current;
    let thumb = thumbRef.current;
    
    if (!container || !background || !thumb) return;
    
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let duration = 0.3 * !prefersReducedMotion.current;
    
    gsap.set(background, { scaleX: prevProgressRef.current, transformOrigin: "0% 50%", force3D: true });
    gsap.set(container, { "--p": prevProgressRef.current });
    gsap.set(thumb, { scaleY: 0.95, transformOrigin: "50% 50%", force3D: true });
    
    quickToTweens.current = {
      fill: gsap.quickTo(background, "scaleX", { duration: duration, ease: "back.out(1.4)" }),
      pos: gsap.quickTo(container, "--p", { duration: duration, ease: "back.out(1.4)" }),
      stretch: gsap.quickTo(thumb, "scaleX", { duration: 0.25, ease: "power2.out" })
    };
  }, { scope: containerRef });

  useGSAP(() => {
    if (containerRef.current && quickToTweens.current && !isDraggingRef.current) {
      quickToTweens.current.fill(progress);
      quickToTweens.current.pos(progress);
    }
  }, { dependencies: [progress], scope: containerRef });

  let isDraggingRef = useRef(false);
  let lastEmittedValueRef = useRef(null);
  let valueTextRef = useRef(null);
  let lastPointerRef = useRef({ x: 0, t: 0 });

  let scheduleOnChange = (newVal) => {
    rAFValueRef.current = newVal;
    if (!rAFRef.current) {
      rAFRef.current = requestAnimationFrame(() => {
        rAFRef.current = 0;
        prevValueRef.current = rAFValueRef.current;
        onChange?.(rAFValueRef.current);
      });
    }
  };

  let handlePointerMove = (clientX) => {
    let container = containerRef.current;
    if (!container || !quickToTweens.current) return;
    
    let rect = container.getBoundingClientRect();
    let currentProgress = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    
    quickToTweens.current.fill(currentProgress);
    quickToTweens.current.pos(currentProgress);
    prevProgressRef.current = currentProgress;
    
    let now = performance.now();
    let lastPointer = lastPointerRef.current;
    
    if (!prefersReducedMotion.current && lastPointer.t) {
      let speed = Math.abs(clientX - lastPointer.x) / Math.max(1, now - lastPointer.t);
      quickToTweens.current.stretch(1 + Math.min(0.7, 0.45 * speed));
    }
    
    lastPointerRef.current = { x: clientX, t: now };
    
    let parsedStep = Number(step) || 1;
    let calculatedValue = Math.round((numMin + currentProgress * (numMax - numMin) - numMin) / parsedStep) * parsedStep + numMin;
    let formattedValue = String(parseFloat(Math.min(numMax, Math.max(numMin, calculatedValue)).toFixed(6)));
    
    if (formattedValue !== lastEmittedValueRef.current) {
      lastEmittedValueRef.current = formattedValue;
      setCurrentValue(formattedValue);
      scheduleOnChange(formattedValue);
      
      if (!prefersReducedMotion.current && valueTextRef.current) {
        gsap.fromTo(
          valueTextRef.current,
          { scale: 1.18, transformOrigin: "100% 50%" },
          { scale: 1, duration: 0.25, ease: "back.out(2)", overwrite: "auto" }
        );
      }
    }
  };

  let [isEditing, setIsEditing] = useState(false);
  let [editValue, setEditValue] = useState("");
  let isCommittingEditRef = useRef(false);

  let handleEditCommit = contextSafe((val) => {
    if (isCommittingEditRef.current) return;
    isCommittingEditRef.current = true;
    setIsEditing(false);
    
    let parsedNum = Number(String(val).replace(",", "."));
    if (!Number.isFinite(parsedNum)) return;
    
    let clampedNum = Math.min(numMax, Math.max(numMin, parsedNum));
    let formattedString = String(parseFloat(clampedNum.toFixed(6)));
    
    if (formattedString === String(currentValue)) return;
    
    setCurrentValue(formattedString);
    lastEmittedValueRef.current = formattedString;
    prevValueRef.current = formattedString;
    
    let newProgress = numMax > numMin ? (clampedNum - numMin) / (numMax - numMin) : 0;
    prevProgressRef.current = newProgress;
    
    if (quickToTweens.current) {
      quickToTweens.current.fill(newProgress);
      quickToTweens.current.pos(newProgress);
    }
    
    onChange?.(formattedString);
    onCommit?.(formattedString);
  });

  let handlePointerDown = contextSafe((e) => {
    if (disabled) return;
    isDraggingRef.current = true;
    containerRef.current?.setAttribute("data-dragging", "true");
    
    if (!prefersReducedMotion.current) {
      gsap.timeline({ overwrite: "auto" })
        .to(backgroundRef.current, { scaleY: 1.08, duration: 0.12, ease: "power2.out", force3D: true })
        .to(backgroundRef.current, { scaleY: 0.82, duration: 0.38, ease: "back.out(3)" });
        
      gsap.to(thumbRef.current, { scaleY: 1, duration: 0.3, ease: "back.out(3)", overwrite: "auto" });
    }
    
    if (e?.clientX != null) {
      handlePointerMove(e.clientX);
    }
    
    let onPointerMove = (evt) => handlePointerMove(evt.clientX);
    window.addEventListener("pointermove", onPointerMove);
    
    let onPointerUp = contextSafe(() => {
      window.removeEventListener("pointermove", onPointerMove);
      isDraggingRef.current = false;
      containerRef.current?.removeAttribute("data-dragging");
      
      let finalNum = Number(lastEmittedValueRef.current ?? currentValue);
      let finalProgress = numMax > numMin && Number.isFinite(finalNum) 
        ? Math.min(1, Math.max(0, (finalNum - numMin) / (numMax - numMin))) 
        : 0;
        
      if (quickToTweens.current) {
        quickToTweens.current.fill(finalProgress);
        quickToTweens.current.pos(finalProgress);
        quickToTweens.current.stretch(1);
      }
      
      lastPointerRef.current = { x: 0, t: 0 };
      
      if (!prefersReducedMotion.current) {
        gsap.to(backgroundRef.current, { scaleY: 1, duration: 0.45, ease: "back.out(3)", overwrite: "auto" });
        gsap.to(thumbRef.current, { scaleY: 0.95, duration: 0.45, ease: "back.out(3)", overwrite: "auto" });
      }
      
      if (lastEmittedValueRef.current != null) {
        onCommit?.(lastEmittedValueRef.current);
      }
    });
    
    window.addEventListener("pointerup", onPointerUp, { once: true });
    window.addEventListener("pointercancel", onPointerUp, { once: true });
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative h-40 select-none overflow-hidden border border-foreground/[0.08] bg-foreground/[0.04] transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-foreground/[0.055] data-[dragging]:border-foreground/[0.14] data-[dragging]:bg-foreground/[0.06]",
        disabled && "opacity-45",
        className
      )}
    >
      {MARKS.map((mark) => (
        <span
          key={mark}
          aria-hidden="true"
          className="absolute top-1/2 h-10 w-px -translate-y-1/2 bg-foreground/[0.12]"
          style={{ left: `${100 * mark}%` }}
        />
      ))}
      
      <div
        ref={backgroundRef}
        aria-hidden="true"
        className="absolute inset-y-2 left-0 w-full bg-foreground/[0.07] transition-[background-color] duration-(--duration-quick) group-data-[dragging]:bg-foreground/[0.09]"
      />
      
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[13px] h-14 w-4"
        style={{ left: "calc(var(--p, 0) * 100%)", marginLeft: -2 }}
      >
        <span
          ref={thumbRef}
          className="block h-full w-full bg-foreground/50 transition-[background-color] duration-(--duration-quick) group-hover:bg-foreground/70 group-data-[dragging]:bg-foreground"
        />
      </span>
      
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-12">
        <span className="truncate text-body-sm text-foreground/80">{label}</span>
        
        <span ref={valueTextRef} className="inline-flex items-center text-body-sm text-foreground">
          {isEditing ? (
            <input
              type="text"
              inputMode="decimal"
              value={editValue}
              autoFocus={true}
              aria-label={`${label} value`}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleEditCommit(editValue)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleEditCommit(editValue);
                } else if (e.key === "Escape") {
                  isCommittingEditRef.current = true;
                  setIsEditing(false);
                }
              }}
              style={{ width: `${Math.max(editValue.length, 2) + 1}ch` }}
              className="pointer-events-auto bg-transparent text-right text-body-sm text-foreground outline-none"
            />
          ) : (
            <button
              type="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Edit ${label} value`}
              onClick={() => {
                if (!disabled) {
                  isCommittingEditRef.current = false;
                  setEditValue(Number.isFinite(numCurrentValue) ? String(parseFloat(numCurrentValue.toFixed(6))) : "");
                  setIsEditing(true);
                }
              }}
              className="pointer-events-auto inline-flex cursor-text items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30"
            >
              <AnimatedNumber value={Number.isFinite(numCurrentValue) ? numCurrentValue.toFixed(decimalPlaces) : ""} />
              {unit ? <span>{unit}</span> : null}
            </button>
          )}
        </span>
      </div>
      
      <input
        type="range"
        aria-label={label}
        min={numMin}
        max={numMax}
        step={step}
        value={Number.isFinite(numCurrentValue) ? numCurrentValue : numMin}
        disabled={disabled}
        onChange={(e) => {
          if (isDraggingRef.current) return;
          let targetValue = e.target.value;
          setCurrentValue(targetValue);
          lastEmittedValueRef.current = targetValue;
          
          let parsedTarget = Number(targetValue);
          let newProgress = numMax > numMin && Number.isFinite(parsedTarget)
            ? Math.min(1, Math.max(0, (parsedTarget - numMin) / (numMax - numMin)))
            : 0;
            
          if (quickToTweens.current) {
            quickToTweens.current.fill(newProgress);
            quickToTweens.current.pos(newProgress);
          }
          
          scheduleOnChange(targetValue);
          onCommit?.(targetValue);
        }}
        onPointerDown={handlePointerDown}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 disabled:cursor-default"
      />
    </div>
  );
}
