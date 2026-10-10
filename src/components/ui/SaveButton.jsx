import React from 'react';
import { cn } from '@/libs/utils/className';
import { ArrowUpRight } from '@phosphor-icons/react';
import { useAnimation } from '@/animations/hooks/useAnimation';

function BookmarkIcon({ filled = false, className = "" }) {
  return (
    <svg viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1" strokeLinejoin="miter" strokeLinecap="square" className={className} aria-hidden="true">
      <path d="M3 2 H13 V14 L8 10 L3 14 Z" />
    </svg>
  );
}

const VARIANTS = {
  overlay: {
    bg: "bg-background/85 backdrop-blur-md hover:bg-background",
    transition: "transition-[opacity,translate,background-color] duration-(--duration-quick) ease-(--ease-back-out)"
  },
  inline: {
    bg: "bg-foreground/[0.06] hover:bg-foreground/10",
    transition: "transition-colors duration-(--duration-quick) ease-(--ease-back-out)"
  }
};

export default function SaveButton({
  animation,
  initialIsSaved = false,
  variant = "inline",
  isAuthenticated = true,
  fadeOnHover = false,
  unauthHint = "none",
  className = ""
}) {
  let config = VARIANTS[variant] ?? VARIANTS.inline;
  let { isSaved, isLoading, toggleSave } = useAnimation(isAuthenticated ? animation?.id : null, initialIsSaved, isAuthenticated ? animation : null);

  if (!isAuthenticated) {
    return unauthHint === "arrow" ? (
      <span aria-hidden="true" className={cn("flex size-32 items-center justify-center", config.bg, config.transition, fadeOnHover && "translate-y-16 opacity-0 group-hover:translate-y-0 group-hover:opacity-100", className)}>
        <ArrowUpRight className="size-16 text-foreground"/>
      </span>
    ) : null;
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSave?.(e);
      }}
      disabled={isLoading}
      aria-label={isSaved ? "Remove from saved" : "Save animation"}
      aria-pressed={isSaved}
      className={cn(
        "flex size-32 items-center justify-center",
        config.bg,
        config.transition,
        fadeOnHover && (isSaved ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"),
        className
      )}
    >
    <BookmarkIcon 
      filled={isSaved} 
      className={cn("size-16", isSaved ? "text-brand" : "text-foreground")} 
    />
    </button>
  );
}
