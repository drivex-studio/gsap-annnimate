"use client";
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

const ASPECT_RATIO = 1280 / 804;

function getCarouselDimensions(containerWidth, containerHeight) {
  const cardWidth = Math.max(140, Math.min(0.24 * containerWidth, 0.6 * containerHeight * ASPECT_RATIO));
  return {
    w: cardWidth,
    h: cardWidth / ASPECT_RATIO,
    r: 1.9 * cardWidth,
    p: 2.6 * cardWidth,
  };
}

export default function Carousel3D({ items = [], autoplay = true, speed = 0.22, className = '' }) {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const repeatedItems = [];

  while (items.length && repeatedItems.length < 12) {
    repeatedItems.push(...items);
  }

  useEffect(() => {
    const containerEl = containerRef.current;
    const cardEls = cardRefs.current.filter(Boolean);
    if (!containerEl || cardEls.length === 0) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dims = getCarouselDimensions(containerEl.offsetWidth, containerEl.offsetHeight);
    let angleStep = (dims.w + 20) / dims.r;
    let rotationOffset = 0;
    let velocity = 0;
    let isDragging = false;
    let hasDragged = false;
    let lastClientX = 0;
    let lastMoveTime = 0;
    let isVisible = true;

    const updateMetrics = () => {
      dims = getCarouselDimensions(containerEl.offsetWidth, containerEl.offsetHeight);
      angleStep = (dims.w + 20) / dims.r;
      containerEl.style.setProperty('--cs-w', `${dims.w}px`);
      containerEl.style.setProperty('--cs-h', `${dims.h}px`);
      containerEl.style.perspective = `${dims.p}px`;
    };

    updateMetrics();

    const renderCards = () => {
      const totalAngle = angleStep * cardEls.length;
      const halfCardAngle = dims.w / 2 / dims.r;

      cardEls.forEach((cardEl, index) => {
        let rawAngle = index * angleStep + rotationOffset;
        rawAngle = gsap.utils.wrap(-totalAngle / 2, totalAngle / 2, rawAngle);

        const angleDeg = (180 * rawAngle) / Math.PI;
        const absAngleDeg = Math.abs(angleDeg);
        let opacity = 1;
        if (absAngleDeg > 78) {
          opacity = 0;
        } else if (absAngleDeg > 66) {
          opacity = (78 - absAngleDeg) / 12;
        }

        cardEl.style.transform = `translate(-50%, -50%) translateZ(${dims.r}px) rotateY(${-angleDeg}deg) translateZ(${-dims.r}px)`;
        cardEl.style.opacity = opacity;
        cardEl.style.visibility = opacity === 0 ? 'hidden' : 'visible';

        const crossedProgress = gsap.utils.clamp(0, 1, (rawAngle + halfCardAngle) / (2 * halfCardAngle));
        cardEl.style.setProperty('--cs-crossed', crossedProgress);
        cardEl.dataset.edge = crossedProgress > 0 && crossedProgress < 1 ? 'true' : 'false';

        const videoEl = cardEl.querySelector('video');
        if (videoEl) {
          const shouldPlay = isVisible && crossedProgress > 0 && rawAngle < 1.5 * angleStep;
          if (shouldPlay && videoEl.paused) {
            videoEl.play().catch(() => {});
          } else if (!shouldPlay && !videoEl.paused) {
            videoEl.pause();
          }
        }
      });
    };

    const onTick = (time, deltaTime) => {
      const frameScale = deltaTime / (1000 / 60);
      if (!isDragging) {
        if (Math.abs(velocity) > 0.00002) {
          rotationOffset += velocity * frameScale;
          velocity *= Math.pow(0.94, frameScale);
        } else if (autoplay && !reducedMotion) {
          rotationOffset += ((speed * angleStep) / 60) * frameScale;
        }
      }
      renderCards();
    };

    const onPointerDown = (ptrEvt) => {
      isDragging = true;
      hasDragged = false;
      velocity = 0;
      lastClientX = ptrEvt.clientX;
      lastMoveTime = performance.now();
      containerEl.setPointerCapture?.(ptrEvt.pointerId);
    };

    const onPointerMove = (evt) => {
      if (!isDragging) return;
      const deltaX = evt.clientX - lastClientX;
      if (Math.abs(deltaX) > 2) {
        hasDragged = true;
      }
      const now = performance.now();
      const deltaAngle = deltaX / dims.r;
      rotationOffset += deltaAngle;
      velocity = (deltaAngle / Math.max(1, now - lastMoveTime)) * (1000 / 60);
      lastClientX = evt.clientX;
      lastMoveTime = now;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onClickCapture = (evt) => {
      if (hasDragged) {
        evt.preventDefault();
        evt.stopPropagation();
      }
    };

    containerEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    containerEl.addEventListener('click', onClickCapture, true);

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(containerEl);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        gsap.ticker.add(onTick);
      } else {
        gsap.ticker.remove(onTick);
        cardEls.forEach((cardEl) => cardEl.querySelector('video')?.pause());
      }
    });

    intersectionObserver.observe(containerEl);
    renderCards();

    return () => {
      gsap.ticker.remove(onTick);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      containerEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      containerEl.removeEventListener('click', onClickCapture, true);
    };
  }, [repeatedItems.length, autoplay, speed]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full min-h-[320px] w-full cursor-grab touch-pan-y select-none active:cursor-grabbing ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[80%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background: 'radial-gradient(closest-side, color-mix(in srgb, var(--brand) 45%, transparent), transparent)',
        }}
      />

      {repeatedItems.map((item, index) => (
        <Link
          key={`${item.slug}-${index}`}
          ref={(itemEl) => {
            cardRefs.current[index] = itemEl;
          }}
          href={`/animations/${item.slug}`}
          draggable={false}
          aria-label={item.title}
          className="group absolute top-1/2 left-1/2 block h-(--cs-h) w-(--cs-w) overflow-hidden bg-surface text-left will-change-transform"
          style={{ backfaceVisibility: 'hidden' }}
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
              backgroundImage: 'radial-gradient(circle at center, transparent 0 38%, rgba(0,0,0,0.55) 42%)',
              backgroundSize: '4px 4px',
            }}
          />

          <span
            className="absolute inset-0"
            style={{ clipPath: 'inset(0 0 0 calc((1 - var(--cs-crossed, 0)) * 100%))' }}
          >
            {item.video ? (
              <video
                src={item.video}
                poster={item.image}
                muted
                loop
                playsInline
                preload="none"
                className="absolute inset-0 block object-cover"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <img
                src={item.image}
                alt=""
                draggable={false}
                className="absolute inset-0 block object-cover"
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </span>

          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-2 -translate-x-1/2 bg-brand opacity-0 group-data-[edge=true]:opacity-100"
            style={{
              left: 'calc((1 - var(--cs-crossed, 0)) * 100%)',
              boxShadow: '0 0 12px 2px var(--brand), 0 0 40px 8px color-mix(in srgb, var(--brand) 50%, transparent)',
            }}
          />

          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 px-10 pt-24 pb-8 lg:px-12 lg:pb-10"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}
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
