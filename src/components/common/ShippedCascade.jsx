import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useTransitionRouter } from '@/providers/TransitionRouterProvider';

gsap.registerPlugin(CustomEase);
CustomEase.create('annnimateInOut', 'M0,0 C0.7,0 0.16,1 1,1');

const EASE_IN_OUT = 'annnimateInOut';
const ASPECT_RATIO = 1280 / 804;
const TAN_15_DEG = Math.tan((15 * Math.PI) / 180);

const getCascadeDecay = (dist) => (0.89 * (1 - Math.pow(0.89, dist))) / (1 - 0.89);

const NAV_BUTTONS = [
  { dir: -1, label: 'Previous', Icon: CaretLeft },
  { dir: 1, label: 'Next', Icon: CaretRight },
];

export function ShippedCascade({ items = [], fill = false, className = '' }) {
  const containerRef = useRef(null);
  const gapPx = fill ? 24 : 80;
  const cardRefs = useRef([]);
  const frameRefs = useRef([]);
  const titleRefs = useRef([]);
  const overlayRefs = useRef([]);
  const renderRef = useRef(() => {});
  const syncActiveRef = useRef(() => {});
  const stateRef = useRef({ offset: 0, w: 480, active: -1 });
  const router = useTransitionRouter();

  const displayItems = useMemo(() => {
    const repeated = [];
    while (items.length && repeated.length < 20) {
      repeated.push(...items);
    }
    return repeated;
  }, [items]);

  useGSAP(
    () => {
      const state = stateRef.current;
      const totalItems = displayItems.length;
      state.active = -1;

      gsap.set(titleRefs.current.filter(Boolean), { yPercent: 100 });

      const updateMetrics = () => {
        const containerEl = containerRef.current;
        if (!containerEl) return;

        const maxWidthFromHeight = fill
          ? (containerEl.clientHeight - 2 * (48 + gapPx + 40 + 48)) * ASPECT_RATIO
          : Infinity;

        state.w = Math.max(280, Math.min(0.4 * containerEl.clientWidth, 640, maxWidthFromHeight));
        const winWidth = window.innerWidth;
        state.peek = Math.min(
          0.5,
          Math.max(
            0.18,
            ((0.6 * winWidth) / state.w - 0.5) /
              getCascadeDecay(Math.min(8, Math.max(3, Math.round(winWidth / 360))))
          )
        );

        containerEl.style.setProperty('--ss-w', `${state.w}px`);
        containerEl.style.setProperty('--ss-h', `${state.w / ASPECT_RATIO}px`);
      };

      const toggleActiveCard = (index, isOpen) => {
        const frameEl = frameRefs.current[index];
        const titleEl = titleRefs.current[index];
        if (!frameEl || !titleEl) return;

        const duration = 0.6 * !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        gsap.to(frameEl, {
          top: isOpen ? -16 : 0,
          left: isOpen ? -16 : 0,
          right: isOpen ? -16 : 0,
          bottom: isOpen ? -48 : 0,
          duration,
          ease: EASE_IN_OUT,
          overwrite: true,
        });

        gsap.to(titleEl, {
          yPercent: 100 * !isOpen,
          duration: isOpen ? duration : 0.6 * duration,
          delay: isOpen ? 0.25 * duration : 0,
          ease: EASE_IN_OUT,
          overwrite: true,
        });
      };

      const renderCards = () => {
        const { w: cardWidth, offset, peek } = state;

        cardRefs.current.forEach((cardEl, index) => {
          if (!cardEl) return;

          const relOffset = gsap.utils.wrap(-totalItems / 2, totalItems / 2, index - offset);
          const absOffset = Math.abs(relOffset);
          const translateX =
            Math.sign(relOffset) * (0.5 + peek * getCascadeDecay(absOffset) - Math.pow(0.89, absOffset) / 2) * cardWidth;
          const scale = Math.pow(0.89, absOffset);

          cardEl.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${
            translateX * TAN_15_DEG
          }px) rotate(${0.5 * Math.sign(relOffset) * (15 * (1 - Math.pow(0.7, absOffset)))}deg) scale(${scale})`;
          cardEl.style.zIndex = String(100 - Math.round(10 * Math.abs(relOffset)));

          const overlayEl = overlayRefs.current[index];
          if (overlayEl) {
            overlayEl.style.opacity = Math.min(1, absOffset < 1 ? 0.3 * absOffset : 0.2 + 0.1 * absOffset);
          }
        });
      };

      syncActiveRef.current = (showActive, targetOffset = state.offset) => {
        if (!showActive) {
          toggleActiveCard(state.active, false);
          state.active = -1;
          return;
        }

        const activeIdx = gsap.utils.wrap(0, totalItems, Math.round(targetOffset));
        if (activeIdx !== state.active) {
          toggleActiveCard(state.active, false);
          toggleActiveCard(activeIdx, true);
          state.active = activeIdx;
        }
      };

      renderRef.current = renderCards;
      updateMetrics();
      renderCards();
      syncActiveRef.current(true);

      const resizeObserver = new ResizeObserver(() => {
        updateMetrics();
        renderCards();
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    },
    { scope: containerRef, dependencies: [displayItems.length] }
  );

  const animateToOffset = (targetOffset, duration = 0.7, ease = EASE_IN_OUT) => {
    let activatedEarly = false;
    stateRef.current.target = targetOffset;

    const tween = gsap.to(stateRef.current, {
      offset: targetOffset,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration,
      ease,
      overwrite: true,
      onUpdate: () => {
        renderRef.current();
        if (!activatedEarly && tween.progress() >= 0.3) {
          activatedEarly = true;
          syncActiveRef.current(true, targetOffset);
        }
      },
      onComplete: () => syncActiveRef.current(true),
    });

    return tween;
  };

  const dragRef = useRef({ on: false, moved: false, x: 0, start: 0, v: 0, lastX: 0, lastT: 0 });
  const getDragSensitivity = () => 1 / (0.3 * stateRef.current.w * 1.6);

  const handlePointerEnd = () => {
    const drag = dragRef.current;
    if (!drag.on) return;
    drag.on = false;
    if (!drag.moved) return;

    const velocity = performance.now() - drag.lastT < 80 ? drag.v : 0;
    const targetIndex = Math.round(stateRef.current.offset + 450 * velocity);
    const deltaDist = Math.abs(targetIndex - stateRef.current.offset);

    animateToOffset(targetIndex, gsap.utils.clamp(0.5, 1.4, 0.45 + 0.25 * deltaDist), 'expo.out');
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={(evt) => {
        const now = performance.now();
        dragRef.current = {
          on: true,
          moved: false,
          x: evt.clientX,
          start: stateRef.current.offset,
          v: 0,
          lastX: evt.clientX,
          lastT: now,
        };
        gsap.killTweensOf(stateRef.current);
      }}
      onPointerMove={(evt) => {
        const drag = dragRef.current;
        if (!drag.on) return;

        if (!drag.moved && Math.abs(evt.clientX - drag.x) > 4) {
          drag.moved = true;
          syncActiveRef.current(false);
        }

        stateRef.current.offset = drag.start - (evt.clientX - drag.x) * getDragSensitivity();
        const now = performance.now();
        const instantVel = (-(evt.clientX - drag.lastX) * getDragSensitivity()) / Math.max(1, now - drag.lastT);
        drag.v = 0.6 * drag.v + 0.4 * instantVel;
        drag.lastX = evt.clientX;
        drag.lastT = now;
        renderRef.current();
      }}
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      style={{ '--ss-gap': `${gapPx}px` }}
      className={`relative w-full cursor-grab touch-pan-y select-none active:cursor-grabbing ${
        fill ? 'h-full' : 'h-[calc(var(--ss-h)_+_336px)]'
      } ${className}`}
    >
      {displayItems.map((item, index) => (
        <a
          key={`${item.slug}-${index}`}
          ref={(el) => {
            cardRefs.current[index] = el;
          }}
          href={`/animations/${item.slug}`}
          aria-label={item.title}
          draggable={false}
          onClick={(evt) => {
            evt.preventDefault();
            if (dragRef.current.moved) return;

            const state = stateRef.current;
            const totalItems = displayItems.length;
            const relOffset = gsap.utils.wrap(-totalItems / 2, totalItems / 2, index - state.offset);
            const href = `/animations/${displayItems[index].slug}`;

            if (Math.abs(relOffset) < 0.5) {
              if (router) {
                router.push(href);
              } else {
                window.location.href = href;
              }
            } else {
              syncActiveRef.current(false);
              animateToOffset(Math.round(state.offset + relOffset));
            }
          }}
          className="absolute top-1/2 left-1/2 block h-(--ss-h) w-(--ss-w) will-change-transform"
        >
          <span
            ref={(el) => {
              frameRefs.current[index] = el;
            }}
            className="absolute inset-0 bg-surface"
          />

          <span className="absolute inset-0 overflow-hidden bg-surface">
            <img
              src={item.image}
              alt=""
              loading="lazy"
              draggable={false}
              className="absolute inset-0 object-cover"
              style={{ width: '100%', height: '100%' }}
            />
            <span
              ref={(el) => {
                overlayRefs.current[index] = el;
              }}
              className="absolute inset-0 bg-black opacity-0"
            />
          </span>

          <span className="absolute top-full right-0 left-0 flex h-48 items-center">
            <span className="block min-w-0 overflow-hidden">
              <span
                ref={(el) => {
                  titleRefs.current[index] = el;
                }}
                className="text-body-sm block truncate font-medium"
              >
                {item.title}
              </span>
            </span>
          </span>
        </a>
      ))}

      <div className="absolute top-[calc(50%_+_var(--ss-h)/2_+_48px_+_var(--ss-gap))] right-0 left-0 z-[200] flex items-center justify-center gap-8">
        {NAV_BUTTONS.map(({ dir, label, Icon }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={() => {
              syncActiveRef.current(false);
              const state = stateRef.current;
              const baseTarget = gsap.isTweening(state)
                ? state.target ?? Math.round(state.offset)
                : Math.round(state.offset);
              animateToOffset(baseTarget + dir);
            }}
            className="inline-flex size-40 cursor-pointer items-center justify-center bg-surface text-foreground transition-[background-color,scale] duration-200 ease-(--ease-expo-out) hover:bg-surface/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/60 active:scale-90"
          >
            <Icon className="size-16" />
          </button>
        ))}
      </div>
    </div>
  );
}
