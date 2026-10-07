'use client'
import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { cn } from '@/libs/utils/className';
import { useScramble } from '@/hooks/useScramble';
import TransitionLink from '@/components/ui/TransitionLink';

export default function MobileNavItem({ item, expanded, onToggle }) {
  const iconRef = useRef(null);
  const verticalLineRef = useRef(null);
  const isInitialMount = useRef(true);

  const { ref: textRef, scramble } = useScramble({
    duration: 0.5,
    firstColorClass: "scramble-brand",
    secondColorClass: "scramble-inherit"
  });

  useEffect(() => {
    gsap.to(iconRef.current, {
      rotation: expanded ? -180 : 0,
      duration: 0.6,
      ease: "power3.inOut"
    });
    
    gsap.to(verticalLineRef.current, {
      opacity: expanded ? 0 : 1,
      duration: 0.35,
      ease: "power3.inOut"
    });

    if (!isInitialMount.current && expanded) {
      scramble();
    }
    isInitialMount.current = false;
  }, [expanded, scramble]);

  return (
    <div className="border-b border-border-muted">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className={cn("text-mono flex w-full items-center justify-between py-12 text-foreground transition-colors duration-200")}
      >
        <span ref={textRef}>{item.label}</span>
        <svg ref={iconRef} className="size-12 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path ref={verticalLineRef} d="M8 1V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M1 8H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      </button>
      <div className="v2-mm-collapse" data-open={expanded} inert={!expanded}>
        <div>
          <div className="flex flex-col gap-4 pb-12 pl-12">
            {item.mega.columns.flatMap(col => col.links).map(link => (
              <TransitionLink
                key={link.label}
                href={link.href}
                className="text-body-sm py-4 text-foreground-muted hover:text-foreground"
              >
                {link.label}
                {link.badge ? (
                  <span className="text-accent-2xs ml-8 inline-block bg-brand px-6 py-2 align-middle text-black">
                    {link.badge}
                  </span>
                ) : null}
              </TransitionLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
