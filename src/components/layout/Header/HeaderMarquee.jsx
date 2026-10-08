"use client";
import React, { useRef, useEffect, Fragment } from 'react';
import gsap from 'gsap'; 
import Link from '@/components/navigation/Link';
import { isOfferActive } from '@/libs/config/PACK_SLUGS';
import { marqueeOffers } from '@/libs/config/navConfig'; 

export function HeaderMarquee({ scrolled = false, shiftY = 0 }) {
  let trackRef = useRef(null);
  let tweenRef = useRef(null);
  let containerRef = useRef(null);

  useEffect(() => {
    let container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    let root = document.documentElement;
    let updateHeight = () => root.style.setProperty('--anm-marquee-h', `${container.offsetHeight}px`);
    updateHeight();
    let observer = new ResizeObserver(updateHeight);
    observer.observe(container);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--anm-marquee-h');
    };
  }, []);

  useEffect(() => {
    let track = trackRef.current;
    if (track && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      tweenRef.current = gsap.to(track, { xPercent: -50, duration: 150, ease: 'none', repeat: -1 });
      return () => {
        tweenRef.current?.kill();
        tweenRef.current = null;
        gsap.set(track, { clearProps: 'transform' });
      };
    }
  }, []);

  let handleHover = scale => {
    let tween = tweenRef.current;
    if (tween) {
      gsap.to(tween, { timeScale: scale, duration: scale === 0 ? 0.6 : 0.9, ease: 'power3.out', overwrite: true });
    }
  };

  return (
    <div
      data-visible={scrolled}
      aria-hidden={!scrolled}
      className="invisible absolute inset-x-0 top-full z-[290] hidden opacity-0 transition-[opacity,visibility] duration-(--duration-quick) ease-(--ease-power3-out) data-[visible=true]:visible data-[visible=true]:opacity-100 lg:block"
    >
      <div style={{ transform: `translateY(${shiftY}px)` }} className="transition-transform duration-(--duration-snap) ease-(--ease-expo-out)">
        <div className="mx-auto w-[calc(100%-2*var(--v2-header-pad,0px))] max-w-[calc(1920px-2*var(--v2-header-pad,0px))] transition-[width,max-width] duration-(--duration-quick) ease-(--ease-power3-out)">
          <div
            ref={containerRef}
            onMouseEnter={() => handleHover(0)}
            onMouseLeave={() => handleHover(1)}
            className="overflow-hidden border-y border-foreground/10 bg-background-muted text-foreground"
          >
            <div ref={trackRef} className="flex w-max items-center">
              {Array.from({ length: 20 }).map((_, index) => {
                let isFirst = index === 0;
                return (
                  <Fragment key={index}>
                    {marqueeOffers.filter(item => !item.offer || isOfferActive()).map((item, idx) => (
                      <Fragment key={idx}>
                        <Link
                          href={item.href}
                          aria-hidden={!isFirst || undefined}
                          tabIndex={isFirst ? undefined : -1}
                          className="text-mono-sm inline-flex items-center gap-10 whitespace-nowrap px-32 py-8 transition-colors duration-(--duration-quick) hover:text-brand"
                        >
                          {item.square ? <span aria-hidden="true" className="size-8 shrink-0 bg-brand"></span> : null}
                          {item.label}
                        </Link>
                        <span aria-hidden="true" className="size-3 shrink-0 rounded-full bg-foreground/30"></span>
                      </Fragment>
                    ))}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
