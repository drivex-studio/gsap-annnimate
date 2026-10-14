'use client'

import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';
import { useTransitionRouter } from '@/providers/TransitionRouterProvider';
import { translate } from '@/libs/utils/i18n';
import RevealHeadline from '@/animations/shared/RevealHeadline';
import Button from '@/components/ui/Button';

gsap.registerPlugin(CustomEase);
CustomEase.create('annnimateInOut', 'M0,0 C0.7,0 0.16,1 1,1');

const EASE_IN_OUT = 'annnimateInOut';

const getSiteSortRank = (name = '') => {
  if (/powerade/i.test(name)) return -1;
  if (/pash/i.test(name)) return 1;
  return 2 * Number(Boolean(/forge/i.test(name)));
};

export default function HomeV3Showcase({ sites = [] }) {
  const validSites = useMemo(
    () =>
      sites
        .filter((site) => site.image)
        .sort((siteA, siteB) => getSiteSortRank(siteA.name) - getSiteSortRank(siteB.name)),
    [sites]
  );

  const displaySites = useMemo(() => {
    const repeated = [];
    while (validSites.length && repeated.length < 8) {
      repeated.push(...validSites);
    }
    return repeated;
  }, [validSites]);

  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  const overlayRefs = useRef([]);
  const renderRef = useRef(() => {});
  const stateRef = useRef({ offset: 0, h: 400, target: 0, visible: false, holdUntil: 0 });
  const router = useTransitionRouter();

  useGSAP(
    () => {
      const state = stateRef.current;
      const totalItems = displaySites.length;
      const getStackOffset = (dist) => ((0.14 * (1 - Math.pow(0.7, dist))) / (1 - 0.7)) * state.h;

      const updateDimensions = () => {
        const cardWidth = Math.max(300, Math.min(0.6 * trackRef.current.clientWidth, 920));
        state.h = cardWidth / 1.6;
        sectionRef.current.style.setProperty('--ss-w', `${cardWidth}px`);
        sectionRef.current.style.setProperty('--ss-h', `${state.h}px`);
      };

      const renderCards = () => {
        cardRefs.current.forEach((cardEl, index) => {
          if (!cardEl) return;

          const relOffset = gsap.utils.wrap(-totalItems / 2, totalItems / 2, index - state.offset);
          const absOffset = Math.abs(relOffset);
          const scale = Math.pow(0.88, absOffset);
          const translateY =
            relOffset > 0
              ? -state.h / 2 - getStackOffset(absOffset) + (scale * state.h) / 2
              : state.h / 2 + getStackOffset(absOffset) - (scale * state.h) / 2;

          cardEl.style.transform = `translate(-50%, -50%) translateY(${absOffset < 0.0001 ? 0 : translateY}px) scale(${scale})`;
          cardEl.style.zIndex = String(100 - Math.round(10 * absOffset));
          cardEl.style.visibility = absOffset > 3.5 ? 'hidden' : 'visible';

          const overlayEl = overlayRefs.current[index];
          if (overlayEl) {
            overlayEl.style.opacity = Math.min(1, absOffset < 1 ? 0.3 * absOffset : 0.2 + 0.1 * absOffset);
          }
        });
      };

      renderRef.current = renderCards;
      updateDimensions();
      renderCards();

      const resizeObserver = new ResizeObserver(() => {
        updateDimensions();
        renderCards();
      });

      resizeObserver.observe(trackRef.current);
      return () => resizeObserver.disconnect();
    },
    { scope: sectionRef, dependencies: [displaySites.length] }
  );

  const animateToOffset = (targetOffset, duration = 0.9, ease = EASE_IN_OUT) => {
    const state = stateRef.current;
    state.target = targetOffset;
    gsap.to(state, {
      offset: targetOffset,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration,
      ease,
      overwrite: true,
      onUpdate: renderRef.current,
    });
  };

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const state = stateRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      state.visible = entry.isIntersecting;
    });
    observer.observe(sectionEl);

    const intervalId = setInterval(() => {
      if (!state.visible || dragRef.current.on || performance.now() < state.holdUntil) return;
      animateToOffset(Math.round(state.target) + 1);
    }, 2600);

    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  const dragRef = useRef({ on: false, moved: false, y: 0, start: 0, v: 0, lastY: 0, lastT: 0 });
  const getDragSensitivity = () => 1 / (0.45 * stateRef.current.h);

  const handlePointerEnd = () => {
    const drag = dragRef.current;
    if (!drag.on) return;

    drag.on = false;
    stateRef.current.holdUntil = performance.now() + 2600;
    if (!drag.moved) return;

    const velocity = performance.now() - drag.lastT < 80 ? drag.v : 0;
    const targetIndex = Math.round(stateRef.current.offset + 300 * velocity);
    animateToOffset(
      targetIndex,
      gsap.utils.clamp(0.5, 1.2, 0.45 + 0.2 * Math.abs(targetIndex - stateRef.current.offset)),
      'expo.out'
    );
  };

  if (!validSites.length) return null;

  return (
    <section
      ref={sectionRef}
      data-theme="light"
      className="overflow-hidden bg-background py-96 text-foreground lg:py-160"
    >
      <div className="mx-auto flex w-(--ss-w) max-w-[calc(100%_-_32px)] flex-wrap items-end justify-between gap-24">
        <RevealHeadline
          as="h2"
          sizeClass="text-h2"
          className="max-w-[16ch] font-medium text-balance"
          trigger="scroll"
        >
          {translate('home-v3.showcase.headline')}
        </RevealHeadline>

        <Button href="/showcase" theme="brand">
          {translate('home-v3.showcase.link')}
        </Button>
      </div>

      <div
        ref={trackRef}
        onPointerDown={(evt) => {
          const now = performance.now();
          dragRef.current = {
            on: true,
            moved: false,
            y: evt.clientY,
            start: stateRef.current.offset,
            v: 0,
            lastY: evt.clientY,
            lastT: now,
          };
          gsap.killTweensOf(stateRef.current);
        }}
        onPointerMove={(evt) => {
          const drag = dragRef.current;
          if (!drag.on) return;

          if (Math.abs(evt.clientY - drag.y) > 4) {
            drag.moved = true;
          }
          stateRef.current.offset = drag.start + (evt.clientY - drag.y) * getDragSensitivity();

          const now = performance.now();
          const instantVel = ((evt.clientY - drag.lastY) * getDragSensitivity()) / Math.max(1, now - drag.lastT);
          drag.v = 0.6 * drag.v + 0.4 * instantVel;
          drag.lastY = evt.clientY;
          drag.lastT = now;
          renderRef.current();
        }}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        className="relative mt-64 h-[calc(var(--ss-h)*1.7)] w-full cursor-grab touch-pan-x select-none active:cursor-grabbing"
      >
        {displaySites.map((site, index) => (
          <button
            key={`${site.slug}-${index}`}
            ref={(btnEl) => {
              cardRefs.current[index] = btnEl;
            }}
            type="button"
            aria-label={site.name}
            onClick={() => {
              if (dragRef.current.moved) return;
              const state = stateRef.current;
              if (
                Math.abs(gsap.utils.wrap(-displaySites.length / 2, displaySites.length / 2, index - state.offset)) <
                  0.5 &&
                router
              ) {
                router.push(`/showcase/${displaySites[index].slug}`);
              }
            }}
            className="absolute top-1/2 left-1/2 block h-(--ss-h) w-(--ss-w) overflow-hidden bg-surface will-change-transform"
          >
            <img
              src={site.image}
              alt=""
              loading="lazy"
              draggable={false}
              className="absolute inset-0 object-cover object-top"
              style={{ width: '100%', height: '100%' }}
            />
            <span
              ref={(overlayEl) => {
                overlayRefs.current[index] = overlayEl;
              }}
              className="pointer-events-none absolute inset-0 bg-black opacity-0"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
