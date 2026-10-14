'use client'

import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const ASPECT_RATIO = 1280 / 804;
const COLUMN_SPEEDS = [25, 18, 26, 14, 30, 20, 24, 16, 28, 22, 17];
const SCROLL_PARALLAX = [0.18, 0.12, 0.22, 0.08, 0.3, 0.16, 0.26, 0.1, 0.2, 0.14, 0.24];

export default function StarterPackBackground({ images = [] }) {
  const containerRef = useRef(null);
  const columnRefs = useRef([]);

  const columns = useMemo(() => {
    if (!images.length) return [];

    const setSize = Math.max(6, images.length);
    const repeatCount = Math.max(3, Math.ceil(2 + 2600 / (setSize * (260 / ASPECT_RATIO + 16))));

    return Array.from({ length: 11 }, (_, colIndex) => {
      const baseSet = Array.from({ length: setSize }, (_, tileIndex) => images[(tileIndex + 3 * colIndex) % images.length]);
      return {
        set: baseSet.length,
        tiles: Array.from({ length: repeatCount }, () => baseSet).flat(),
      };
    });
  }, [images]);

  useGSAP(
    () => {
      const containerEl = containerRef.current;
      const colEls = columnRefs.current.filter(Boolean);
      if (!containerEl || !colEls.length) return;

      const loopHeight = columns[0].set * (260 / ASPECT_RATIO + 16);
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let elapsedSeconds = 0;
      let isVisible = false;

      const updatePositions = () => {
        const scrollY = window.scrollY;
        colEls.forEach((colEl, colIndex) => {
          const offset = elapsedSeconds * COLUMN_SPEEDS[colIndex] + scrollY * SCROLL_PARALLAX[colIndex];
          colEl.style.transform = `translateY(${-(((offset % loopHeight) + loopHeight) % loopHeight)}px)`;
        });
      };

      const onTick = (time, deltaTime) => {
        if (!isVisible) return;
        if (!reducedMotion) {
          elapsedSeconds += deltaTime / 1000;
        }
        updatePositions();
      };

      const observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
        },
        { rootMargin: '200px 0px' }
      );

      observer.observe(containerEl);
      updatePositions();
      gsap.ticker.add(onTick);

      return () => {
        gsap.ticker.remove(onTick);
        observer.disconnect();
      };
    },
    { scope: containerRef, dependencies: [columns.length] }
  );

  return (
    <div ref={containerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 flex [transform:translate(-50%,-50%)_rotate(-15deg)] gap-[16px]">
        {columns.map(({ tiles }, colIndex) => (
          <div
            key={colIndex}
            ref={(colEl) => {
              columnRefs.current[colIndex] = colEl;
            }}
            className="flex w-[260px] flex-col gap-[16px] will-change-transform"
          >
            {tiles.map((imgSrc, tileIndex) => (
              <div key={tileIndex} className="relative aspect-[1280/804] w-full overflow-hidden bg-surface">
                <img
                  src={imgSrc}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="absolute inset-0 object-cover"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
