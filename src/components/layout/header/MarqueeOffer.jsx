"use client";
import React, { useRef, useEffect, Fragment } from 'react';
import { gsap } from 'gsap';
import TransitionLink from '@/components/ui/TransitionLink';
import { isOfferActive } from '@/libs/config/PACK_SLUGS';
import { translate } from '@/libs/utils/i18n';

const marqueeItems = [
  { label: translate("common.header.marquee.label"), href: "/pricing", offer: true },
  { label: translate("common.header.marquee.labelMenuKit"), href: "/kits/menu", square: true }
];

export default function MarqueeOffer({ scrolled = false, shiftY = 0 }) {
  const trackRef = useRef(null);
  const tweenRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const root = document.documentElement;
    const updateHeight = () => root.style.setProperty("--anm-marquee-h", `${container.offsetHeight}px`);
    
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(container);

    return () => {
      observer.disconnect();
      root.style.removeProperty("--anm-marquee-h");
    };
  }, []);

  // Initialize Infinite GSAP Marquee
  useEffect(() => {
    const track = trackRef.current;
    if (track && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      tweenRef.current = gsap.to(track, {
        xPercent: -50,
        duration: 150,
        ease: "none",
        repeat: -1
      });
    }
    return () => {
      tweenRef.current?.kill();
      tweenRef.current = null;
      if (track) gsap.set(track, { clearProps: "transform" });
    };
  }, []);

  const handleHover = (timeScale) => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, {
        timeScale,
        duration: timeScale === 0 ? 0.6 : 0.9,
        ease: "power3.out",
        overwrite: true
      });
    }
  };

  return (
    <div
      data-visible={scrolled}
      aria-hidden={!scrolled}
      className="invisible absolute inset-x-0 top-full z-[290] hidden opacity-0 transition-[opacity,visibility] duration-(--duration-quick) ease-(--ease-power3-out) data-[visible=true]:visible data-[visible=true]:opacity-100 lg:block"
    >
      <div
        style={{ transform: `translateY(${shiftY}px)` }}
        className="transition-transform duration-(--duration-snap) ease-(--ease-expo-out)"
      >
        <div className="mx-auto w-[calc(100%-2*var(--v2-header-pad,0px))] max-w-[calc(1920px-2*var(--v2-header-pad,0px))] transition-[width,max-width] duration-(--duration-quick) ease-(--ease-power3-out)">
          <div
            ref={containerRef}
            onMouseEnter={() => handleHover(0)}
            onMouseLeave={() => handleHover(1)}
            className="overflow-hidden border-y border-foreground/10 bg-background-muted text-foreground"
          >
            <div ref={trackRef} className="flex w-max items-center">
              {Array.from({ length: 20 }).map((_, index) => {
                const isFirst = index === 0;
                return (
                  <Fragment key={index}>
                    {marqueeItems.filter(item => !item.offer || isOfferActive()).map((item, itemIdx) => (
                      <Fragment key={itemIdx}>
                        <TransitionLink
                          href={item.href}
                          aria-hidden={!isFirst ? true : undefined}
                          tabIndex={isFirst ? undefined : -1}
                          className="text-mono-sm inline-flex items-center gap-10 whitespace-nowrap px-32 py-8 transition-colors duration-(--duration-quick) hover:text-brand"
                        >
                          {item.square ? (
                            <span aria-hidden="true" className="size-8 shrink-0 bg-brand" />
                          ) : null}
                          {item.label}
                        </TransitionLink>
                        <span aria-hidden="true" className="size-3 shrink-0 rounded-full bg-foreground/30" />
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
