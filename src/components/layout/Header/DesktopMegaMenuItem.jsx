import React from 'react';
import { cn } from '@/libs/utils/className';
import MenuTrigger from 'next/link';
import { useScramble } from '@/hooks/useScramble'; 
import { useTransitionClick } from '@/hooks/useTransitionClick';

export function DesktopMegaMenuItem({ item, href, badge, active, expanded, setRef, onMouseEnter, onClick }) {
  let { ref: textRef, scramble } = useScramble({
    duration: 0.5,
    firstColorClass: 'scramble-brand',
    secondColorClass: 'scramble-inherit'
  });
  let handleClick = useTransitionClick(href || '', { onClick });

  return (
    <MenuTrigger
      href={href || '#'}
      ref={setRef}
      aria-expanded={expanded || false}
      aria-haspopup="true"
      onMouseEnter={() => {
        scramble();
        onMouseEnter?.();
      }}
      onClick={handleClick}
      className={cn(
        'text-mono relative flex h-full cursor-pointer items-center justify-center text-center transition-colors duration-200',
        active ? 'text-foreground' : 'text-foreground-muted hover:text-foreground'
      )}
    >
      <span className="relative inline-flex items-center">
        <span ref={textRef}>{item.label}</span>
        {badge ? (
          <span aria-hidden="true" className="pointer-events-none absolute top-0 left-full -translate-y-full text-accent-2xs text-brand whitespace-nowrap">
            {badge}
          </span>
        ) : null}
      </span>
    </MenuTrigger>
  );
}
