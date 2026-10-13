'use client';
import React, { useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

import { CaretLeft } from '@/components/icons/CaretLeft';
import { CaretRight } from '@/components/icons/CaretRight';

import Link from '@components/navigation/Link';
import { useScramble } from '@/hooks/useScramble';
import analytics from '@/libs/utils/analytics';

gsap.registerPlugin(useGSAP);

export default function DetailNav({ items = [] }) {
  const pathname = usePathname();
  const match = pathname?.match(/^\/animations\/([^/]+)$/);
  const currentSlug = match ? decodeURIComponent(match[1]) : null;
  
  const isValidPage = !!currentSlug && currentSlug !== 'saved' && items.length > 0;
  const itemCount = items.length;
  const currentIndex = isValidPage ? items.findIndex(item => item.slug === currentSlug) : -1;

  const getAdjacentItem = (offset) => {
    if (currentIndex === -1 || itemCount < 2) return null;
    return items[(currentIndex + offset + itemCount) % itemCount];
  };

  const prevItem = getAdjacentItem(-1);
  const nextItem = getAdjacentItem(1);

  const [activeItems, setActiveItems] = useState({ prev: prevItem, next: nextItem });
  
  const prevScramble = useScramble({ duration: 0.35 });
  const nextScramble = useScramble({ duration: 0.35 });
  const widthsRef = useRef(null);

  useGSAP(() => {
    if (activeItems.prev?.slug !== prevItem?.slug || activeItems.next?.slug !== nextItem?.slug) {
      if (isValidPage) {
        widthsRef.current = {
          prev: prevScramble.ref.current?.offsetWidth ?? null,
          next: nextScramble.ref.current?.offsetWidth ?? null
        };
      }
      setActiveItems({ prev: prevItem, next: nextItem });
    }
  }, { dependencies: [prevItem?.slug, nextItem?.slug, isValidPage] });

  useGSAP(() => {
    const prevWidths = widthsRef.current;
    if (!prevWidths) return;
    widthsRef.current = null;

    const animateWidth = (scrambleCtrl, text, oldWidth) => {
      const el = scrambleCtrl.ref.current;
      if (!el || !text || getComputedStyle(el).display === 'none') return;
      
      scrambleCtrl.kill();
      scrambleCtrl.scramble(text);
      
      const newWidth = el.offsetWidth;
      if (oldWidth != null && Math.abs(newWidth - oldWidth) > 1) {
        gsap.fromTo(
          el,
          { width: oldWidth },
          { width: newWidth, duration: 0.4, ease: 'expo.out' }
        );
      }
    };

    animateWidth(prevScramble, activeItems.prev?.title, prevWidths.prev);
    animateWidth(nextScramble, activeItems.next?.title, prevWidths.next);
  }, { dependencies: [activeItems] });

  if (!isValidPage) return null;

  const trackNavigation = (action, toSlug) => {
    analytics.track(
      'detail_browse_used',
      { action, from_slug: currentSlug, to_slug: toSlug || null },
      { transport: 'sendBeacon' }
    );
  };

  const btnClassName = "text-accent-xs flex items-center gap-8 px-16 py-14 text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10";

  return (
    <div className="pointer-events-none sticky bottom-24 z-[100] flex justify-center px-16">
      <div data-theme="dark" className="pointer-events-auto flex max-w-full items-stretch bg-surface text-foreground">
        {prevItem && (
          <React.Fragment>
            <Link
              href={`/animations/${prevItem.slug}`}
              className={btnClassName}
              aria-label={`Previous component: ${prevItem.title}`}
              onClick={() => trackNavigation('prev', prevItem.slug)}
            >
              <CaretLeft className="size-14 shrink-0 text-foreground-muted" />
              <span ref={prevScramble.ref} className="hidden max-w-[18ch] truncate md:block">
                {activeItems.prev?.title || prevItem.title}
              </span>
            </Link>
            <span aria-hidden="true" className="w-px self-stretch bg-foreground/10" />
          </React.Fragment>
        )}

        <Link href="/animations" className={btnClassName} onClick={() => trackNavigation('browse_all')}>
          <span className="whitespace-nowrap">Browse all {itemCount}</span>
        </Link>

        {nextItem && (
          <React.Fragment>
            <span aria-hidden="true" className="w-px self-stretch bg-foreground/10" />
            <Link
              href={`/animations/${nextItem.slug}`}
              className={btnClassName}
              aria-label={`Next component: ${nextItem.title}`}
              onClick={() => trackNavigation('next', nextItem.slug)}
            >
              <span ref={nextScramble.ref} className="hidden max-w-[18ch] truncate md:block">
                {activeItems.next?.title || nextItem.title}
              </span>
              <CaretRight className="size-14 shrink-0 text-foreground-muted" />
            </Link>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
