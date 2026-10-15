'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import Link from '@/components/navigation/Link';

const ASPECT_RATIO = 1280 / 804;

function calculateMetrics(containerWidth, containerHeight) {
  const width = Math.max(
    140,
    Math.min(0.24 * containerWidth, 0.6 * containerHeight * ASPECT_RATIO)
  );

  return {
    w: width,
    h: width / ASPECT_RATIO,
    r: 1.9 * width,
    p: 2.6 * width,
  };
}

export default function CylinderCarousel({
  items = [],
  autoplay = true,
  speed = 0.22,
  className = '',
}) {
  const containerRef = useRef(null);
  const cardsRef = useRef([]);

  const displayItems = [];
  while (items.length && displayItems.length < 12) {
    displayItems.push(...items);
  }

  useEffect(() => {
    const container = containerRef.current;
    const cards = cardsRef.current.filter(Boolean);

    if (!container || cards.length === 0) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let metrics = calculateMetrics(
      container.offsetWidth,
      container.offsetHeight
    );
    let angleStep = (metrics.w + 20) / metrics.r;
    let currentAngle = 0;
    let velocity = 0;
    let isDragging = false;
    let hasDragged = false;
    let lastPointerX = 0;
    let lastPointerTime = 0;
    let isIntersecting = true;

    const updateDimensions = () => {
      metrics = calculateMetrics(container.offsetWidth, container.offsetHeight);
      angleStep = (metrics.w + 20) / metrics.r;
      container.style.setProperty('--cs-w', `${metrics.w}px`);
      container.style.setProperty('--cs-h', `${metrics.h}px`);
      container.style.perspective = `${metrics.p}px`;
    };

    updateDimensions();

    const render = () => {
      const totalArc = angleStep * cards.length;
      const halfCardAngle = metrics.w / 2 / metrics.r;

      cards.forEach((card, index) => {
        const rawAngle = index * angleStep + currentAngle;
        const wrappedAngle = gsap.utils.wrap(
          -totalArc / 2,
          totalArc / 2,
          rawAngle
        );
        const angleDeg = (180 * wrappedAngle) / Math.PI;
        const absAngleDeg = Math.abs(angleDeg);
        const opacity =
          absAngleDeg > 78 ? 0 : absAngleDeg > 66 ? (78 - absAngleDeg) / 12 : 1;

        card.style.transform = `translate(-50%, -50%) translateZ(${metrics.r}px) rotateY(${-angleDeg}deg) translateZ(${-metrics.r}px)`;
        card.style.opacity = opacity;
        card.style.visibility = opacity === 0 ? 'hidden' : 'visible';

        const crossedProgress = gsap.utils.clamp(
          0,
          1,
          (wrappedAngle + halfCardAngle) / (2 * halfCardAngle)
        );

        card.style.setProperty('--cs-crossed', crossedProgress);
        card.dataset.edge =
          crossedProgress > 0 && crossedProgress < 1 ? 'true' : 'false';

        const videoEl = card.querySelector('video');
        if (videoEl) {
          const shouldPlay =
            isIntersecting &&
            crossedProgress > 0 &&
            wrappedAngle < 1.5 * angleStep;

          if (shouldPlay && videoEl.paused) {
            videoEl.play().catch(() => {});
          } else if (!shouldPlay && !videoEl.paused) {
            videoEl.pause();
          }
        }
      });
    };

    const onTick = (time, deltaTime) => {
      const dtRatio = deltaTime / (1000 / 60);

      if (!isDragging) {
        if (Math.abs(velocity) > 0.00002) {
          currentAngle += velocity * dtRatio;
          velocity *= Math.pow(0.94, dtRatio);
        } else if (autoplay && !prefersReducedMotion) {
          currentAngle += ((speed * angleStep) / 60) * dtRatio;
        }
      }

      render();
    };

    const handlePointerDown = (event) => {
      isDragging = true;
      hasDragged = false;
      velocity = 0;
      lastPointerX = event.clientX;
      lastPointerTime = performance.now();
      container.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
      if (!isDragging) return;

      const deltaX = event.clientX - lastPointerX;
      if (Math.abs(deltaX) > 2) {
        hasDragged = true;
      }

      const now = performance.now();
      const deltaAngle = deltaX / metrics.r;

      currentAngle += deltaAngle;
      velocity =
        (deltaAngle / Math.max(1, now - lastPointerTime)) * (1000 / 60);
      lastPointerX = event.clientX;
      lastPointerTime = now;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleClickCapture = (event) => {
      if (hasDragged) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('click', handleClickCapture, true);

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
      if (isIntersecting) {
        gsap.ticker.add(onTick);
      } else {
        gsap.ticker.remove(onTick);
        cards.forEach((card) => card.querySelector('video')?.pause());
      }
    });

    intersectionObserver.observe(container);
    render();

    return () => {
      gsap.ticker.remove(onTick);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('click', handleClickCapture, true);
    };
  }, [displayItems.length, autoplay, speed]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full min-h-[320px] w-full cursor-grab touch-pan-y select-none active:cursor-grabbing ${className}`}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[80%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, color-mix(in srgb, var(--brand) 45%, transparent), transparent)',
        }}
      />
      {displayItems.map((item, index) => (
        <Link
          key={`${item.slug}-${index}`}
          ref={(el) => (cardsRef.current[index] = el)}
          href={`/animations/${item.slug}`}
          draggable={false}
          aria-label={item.title}
          className="group absolute top-1/2 left-1/2 block h-(--cs-h) w-(--cs-w) overflow-hidden bg-surface text-left will-change-transform"
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          <img
            src={item.image}
            alt=""
            draggable={false}
            className="absolute inset-0 block object-cover"
            style={{
              width: '100%',
              height: '100%',
              filter: 'grayscale(1) contrast(1.35) brightness(1.05)',
            }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 mix-blend-multiply"
            style={{
              backgroundImage:
                'radial-gradient(circle at center, transparent 0 38%, rgba(0,0,0,0.55) 42%)',
              backgroundSize: '4px 4px',
            }}
          />
          <span
            className="absolute inset-0"
            style={{
              clipPath:
                'inset(0 0 0 calc((1 - var(--cs-crossed, 0)) * 100%))',
            }}
          >
            {item.video ? (
              <video
                src={item.video}
                poster={item.image}
                muted={true}
                loop={true}
                playsInline={true}
                preload="none"
                className="absolute inset-0 block object-cover"
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
            ) : (
              <img
                src={item.image}
                alt=""
                draggable={false}
                className="absolute inset-0 block object-cover"
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
            )}
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-2 -translate-x-1/2 bg-brand opacity-0 group-data-[edge=true]:opacity-100"
            style={{
              left: 'calc((1 - var(--cs-crossed, 0)) * 100%)',
              boxShadow:
                '0 0 12px 2px var(--brand), 0 0 40px 8px color-mix(in srgb, var(--brand) 50%, transparent)',
            }}
          />
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 px-10 pt-24 pb-8 lg:px-12 lg:pb-10"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
            }}
          >
            <span className="block text-[11px] font-medium leading-tight text-white lg:text-[12px]">
              {item.title}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
