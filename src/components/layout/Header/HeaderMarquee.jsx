'use client';

// Variable Mapping: w -> MARQUEE_ITEMS, y -> HeaderMarquee, e -> scrolled / targetRate / item, i -> shiftY / groupIndex / itemIndex, s -> trackRef, o -> animStateRef, l -> containerRef, a -> isScrolledRef, c -> isIntersectingRef, h -> syncPlayback, d -> updatePlaybackRate, n -> isFirstGroup

import { Fragment, useEffect, useRef } from 'react'; // NOTE: module id: 271645
import gsap from 'gsap'; // NOTE: module id: 989970
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682
import { isOfferActive } from '@/libs/config/PACK_SLUGS'; // NOTE: module id: 825740
import TransitionLink from '@/components/navigation/Link'; // NOTE: module id: 101836

const MARQUEE_ITEMS = [
  {
    label: t('common.header.marquee.label'),
    href: '/pricing',
    offer: true,
  },
  {
    label: t('common.header.marquee.labelMenuKit'),
    href: '/kits/menu',
    square: true,
  },
];

// NOTE: module id: 76624
export default function HeaderMarquee({ scrolled = false, shiftY = 0 }) {
  const trackRef = useRef(null);
  const animStateRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl || typeof ResizeObserver === 'undefined') return;

    const rootEl = document.documentElement;
    const updateHeightVar = () =>
      rootEl.style.setProperty('--anm-marquee-h', `${containerEl.offsetHeight}px`);

    updateHeightVar();
    const resizeObserver = new ResizeObserver(updateHeightVar);
    resizeObserver.observe(containerEl);

    return () => {
      resizeObserver.disconnect();
      rootEl.style.removeProperty('--anm-marquee-h');
    };
  }, []);

  useEffect(() => {
    const trackEl = trackRef.current;
    if (
      !trackEl ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const getKeyframes = () => [
      { transform: 'translateX(0px)' },
      { transform: `translateX(${-trackEl.scrollWidth / 2}px)` },
    ];

    const animation = trackEl.animate(getKeyframes(), {
      duration: 150000,
      iterations: Infinity,
      easing: 'linear',
    });

    const resizeObserver = new ResizeObserver(() =>
      animation.effect.setKeyframes(getKeyframes())
    );
    resizeObserver.observe(trackEl);
    animStateRef.current = { anim: animation, rate: 1 };

    return () => {
      resizeObserver.disconnect();
      gsap.killTweensOf(animStateRef.current);
      animation.cancel();
      animStateRef.current = null;
    };
  }, []);

  const isScrolledRef = useRef(scrolled);
  const isIntersectingRef = useRef(true);

  const syncPlayback = () => {
    const animation = animStateRef.current?.anim;
    if (animation) {
      if (isScrolledRef.current && isIntersectingRef.current) {
        animation.play();
      } else {
        animation.pause();
      }
    }
  };

  useEffect(() => {
    isScrolledRef.current = scrolled;
    syncPlayback();
  }, [scrolled]);

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isIntersectingRef.current = entry.isIntersecting;
      syncPlayback();
    });

    intersectionObserver.observe(containerEl);
    return () => intersectionObserver.disconnect();
  }, []);

  const updatePlaybackRate = (targetRate) => {
    const animState = animStateRef.current;
    if (animState) {
      gsap.to(animState, {
        rate: targetRate,
        duration: targetRate === 0 ? 0.6 : 0.9,
        ease: 'power3.out',
        overwrite: true,
        onUpdate: () => {
          animState.anim.playbackRate = animState.rate;
        },
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
        <div className="mx-auto w-[calc(100%-2*var(--v2-header-pad,0px))] max-w-[calc(var(--v2-max,1920px)-2*var(--v2-header-pad,0px))] transition-[width,max-width] duration-(--duration-quick) ease-(--ease-power3-out)">
          <div
            ref={containerRef}
            onMouseEnter={() => updatePlaybackRate(0)}
            onMouseLeave={() => updatePlaybackRate(1)}
            className="overflow-hidden border-y border-foreground/10 bg-background-muted text-foreground"
          >
            <div ref={trackRef} className="flex w-max items-center">
              {Array.from({ length: 20 }).map((_, groupIndex) => {
                const isFirstGroup = groupIndex === 0;
                return (
                  <Fragment key={groupIndex}>
                    {MARQUEE_ITEMS.filter(
                      (item) => !item.offer || isOfferActive()
                    ).map((item, itemIndex) => (
                      <Fragment key={itemIndex}>
                        <TransitionLink
                          href={item.href}
                          aria-hidden={!isFirstGroup || undefined}
                          tabIndex={isFirstGroup ? undefined : -1}
                          className="text-mono-sm inline-flex items-center gap-10 whitespace-nowrap px-32 py-8 transition-colors duration-(--duration-quick) hover:text-brand"
                        >
                          {item.square ? (
                            <span
                              aria-hidden="true"
                              className="size-8 shrink-0 bg-brand"
                            />
                          ) : null}
                          {item.label}
                        </TransitionLink>
                        <span
                          aria-hidden="true"
                          className="size-3 shrink-0 rounded-full bg-foreground/30"
                        />
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
