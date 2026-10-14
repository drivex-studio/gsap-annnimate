'use client'
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { faces, IsoFigure, PUNCH, reduced, str, viewBox } from '@/libs/utils/iso';
import { buildSeatBoxes, getSeatBoxCoord, parseViewBox } from '@/components/home-v3/pricingFigures';

export function StudioSeatsFigure({ seats }) {
  const containerRef = useRef(null);
  const clampedSeats = Math.min(seats, 8);
  const [initialBoxes] = useState(() => buildSeatBoxes(clampedSeats));
  const stateRef = useRef(null);

  if (!stateRef.current) {
    stateRef.current = {
      m: initialBoxes.map((box) => ({ ...box })),
      n: clampedSeats,
      vb: parseViewBox(viewBox(initialBoxes)),
    };
  }

  const renderSvg = () => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const { m: boxes, vb } = stateRef.current;
    const boxEls = svgEl.querySelectorAll('[data-box]');

    boxes.forEach((box, boxIdx) => {
      const boxEl = boxEls[boxIdx];
      if (!boxEl) return;

      faces(box).forEach((facePts, faceIdx) => {
        boxEl.children[faceIdx]?.setAttribute('points', facePts.map(str).join(' '));
      });
      boxEl.style.opacity = box.o;
    });

    svgEl.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  };

  useEffect(() => {
    const state = stateRef.current;
    if (clampedSeats === state.n) return;

    const prevSeats = state.n;
    state.n = clampedSeats;

    const duration = 0.7 * !reduced();
    const tl = gsap.timeline({ onUpdate: renderSvg });

    state.tl?.kill();
    state.hop?.kill();

    state.m.forEach((box, index) => {
      const targetCoord = getSeatBoxCoord(index, clampedSeats);
      if (index < clampedSeats) {
        if (box.o < 0.05) {
          gsap.set(box, { ...targetCoord, z: 40, o: 0 });
        }
        tl.to(
          box,
          { ...targetCoord, z: 0, o: 1, duration, ease: PUNCH },
          index >= prevSeats ? (index - prevSeats) * 0.06 : 0
        );
      } else if (box.o > 0 || box.z !== 40) {
        tl.to(
          box,
          { z: 40, o: 0, duration: 0.8 * duration, ease: PUNCH },
          index < prevSeats ? (prevSeats - 1 - index) * 0.06 : 0
        );
      }
    });

    tl.to(state.vb, { ...parseViewBox(viewBox(buildSeatBoxes(clampedSeats))), duration, ease: PUNCH }, 0);
    state.tl = tl;
  }, [clampedSeats]);

  useEffect(() => {
    const articleEl = containerRef.current?.closest('article');
    if (!articleEl) return;

    const onMouseEnter = () => {
      if (reduced() || stateRef.current.hop?.isActive() || stateRef.current.tl?.isActive()) return;

      const activeBoxes = stateRef.current.m.slice(0, stateRef.current.n);
      const hopTl = (stateRef.current.hop = gsap.timeline({ onUpdate: renderSvg }));

      activeBoxes.forEach((box, index) => {
        hopTl
          .to(box, { z: 22, duration: 0.45, ease: PUNCH }, 0.07 * index)
          .to(box, { z: 0, duration: 0.45, ease: PUNCH }, 0.5 + 0.07 * index);
      });
    };

    articleEl.addEventListener('mouseenter', onMouseEnter);
    return () => {
      articleEl.removeEventListener('mouseenter', onMouseEnter);
      stateRef.current.hop?.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full">
      <IsoFigure boxes={initialBoxes} />
    </div>
  );
}
