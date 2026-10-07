import React from 'react';
import Link from 'next/link';
import { cn } from '@/libs/utils/className';
import { useTransitionClick } from '@/hooks/useTransitionClick';
import { useScramble } from '@/hooks/useScramble'; 

export default function DesktopNavItem({ item, href, badge, active, expanded, setRef, onMouseEnter, onClick }) {
  const { ref: textRef, scramble } = useScramble({
    duration: 0.5,
    firstColorClass: "scramble-brand",
    secondColorClass: "scramble-inherit"
  });

  const handleTransitionClick = useTransitionClick(href || "", { onClick });

  return (
    <Link
      href={href || "#"}
      ref={setRef}
      aria-expanded={expanded || false}
      aria-haspopup="true"
      onMouseEnter={() => {
        scramble();
        onMouseEnter?.();
      }}
      onClick={handleTransitionClick}
      className={cn(
        "text-mono relative flex h-full cursor-pointer items-center justify-center text-center transition-colors is duration-200",
        active ? "text-foreground" : "text-foreground-muted hover:text-foreground"
      )}
    >
      <span className="relative inline-flex items-center">
        <span ref={textRef}>{item.label}</span>
        {badge ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-full -translate-y-full text-accent-2xs text-brand whitespace-nowrap"
          >
            {badge}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
