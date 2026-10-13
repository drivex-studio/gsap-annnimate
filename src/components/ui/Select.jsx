"use client";

import React, { useState, useRef, useEffect } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { cn } from '@/libs/utils/className';

export default function Select({
  value,
  onChange,
  options = [],
  placeholder = "Select",
  disabled = false,
  size = "sm",
  labelSize = "sm",
  ariaLabel,
  align = "left",
  className = ""
}) {
  let [isOpen, setIsOpen] = useState(false);
  let containerRef = useRef(null);

  let selectedOption = options.find(t => t.value === value);
  let textClassName = size === "lg" ? "text-body" : labelSize === "xs" ? "text-[13px] font-sans" : "text-body-sm";
  let SelectedIcon = selectedOption?.icon || null;

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          "inline-flex w-full items-center justify-between gap-8 border border-foreground/10 bg-foreground/[0.05] px-10 text-foreground transition-colors hover:bg-foreground/[0.08] focus-visible:border-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
          textClassName,
          size === "lg" ? "h-48" : size === "md" ? "h-32" : "h-28",
          size === "lg" && "border-foreground/15 bg-surface px-16 hover:border-foreground/30 hover:bg-surface"
        )}
      >
        <span className={cn("flex min-w-0 items-center gap-8", !selectedOption && size === "lg" && "text-foreground/35")}>
          {SelectedIcon ? <SelectedIcon size={12} aria-hidden="true" className="shrink-0 text-foreground-muted" /> : null}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <CaretDown
          aria-hidden="true"
          className={cn("size-12 shrink-0 text-foreground-muted transition-transform duration-(--duration-quick) ease-(--ease-expo-out)", isOpen && "rotate-180")}
        />
      </button>
      
      {isOpen && (
        <ul
          role="listbox"
          className={cn(
            "absolute top-[calc(100%+4px)] z-30 min-w-full overflow-hidden border border-foreground/10 bg-surface py-4",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {options.map(opt => {
            let isSelected = opt.value === value;
            let OptIcon = opt.icon || null;
            
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange?.(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-8 whitespace-nowrap text-left transition-colors",
                    size === "lg" ? "px-16 py-10" : "px-10 py-6",
                    textClassName,
                    isSelected ? "text-foreground" : "text-foreground-muted hover:bg-foreground/[0.04] hover:text-foreground"
                  )}
                >
                  <span aria-hidden="true" className={cn("size-6 shrink-0", isSelected ? "bg-brand" : "bg-transparent")} />
                  {OptIcon ? <OptIcon size={12} aria-hidden="true" className="shrink-0" /> : null}
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
