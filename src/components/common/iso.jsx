'use client';

import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(CustomEase);
CustomEase.create('annnimateInOut', 'M0,0 C0.7,0 0.16,1 1,1');
CustomEase.create('annnimate', 'M0,0 C0.3,0.9 0.1,1 1,1');

export const PUNCH = 'annnimateInOut';
export const DRIFT = 'annnimate';

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const COS_30 = Math.cos(Math.PI / 6);

const projectIso = (x, y, z) => [(x - y) * COS_30, (x + y) * 0.5 - z];

export const str = (pt) => `${pt[0].toFixed(2)},${pt[1].toFixed(2)}`;

export function faces({ x, y, z, w, d, h }) {
  return [
    [
      projectIso(x, y + d, z),
      projectIso(x + w, y + d, z),
      projectIso(x + w, y + d, z + h),
      projectIso(x, y + d, z + h),
    ],
    [
      projectIso(x + w, y, z),
      projectIso(x + w, y + d, z),
      projectIso(x + w, y + d, z + h),
      projectIso(x + w, y, z + h),
    ],
    [
      projectIso(x, y, z + h),
      projectIso(x + w, y, z + h),
      projectIso(x + w, y + d, z + h),
      projectIso(x, y + d, z + h),
    ],
  ];
}

const DEFAULT_STROKE_OPACITIES = [0.46, 0.4, 0.52];
const ACCENT_STROKE_OPACITIES = [0.75, 0.88, 1];

export function viewBox(boxes, pad = 24) {
  const pts = boxes.filter((box) => box.o !== 0).flatMap((box) => faces(box).flat());
  const xs = pts.map((pt) => pt[0]);
  const ys = pts.map((pt) => pt[1]);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;

  return `${minX} ${minY} ${Math.max(...xs) + pad - minX} ${Math.max(...ys) + pad - minY}`;
}

const DEFAULT_BOX_CLASS = 'fill-background text-foreground';
const ACCENT_BOX_CLASS = 'fill-background text-brand';

export function IsoFigure({ boxes }) {
  return (
    <svg viewBox={viewBox(boxes)} className="h-full w-full overflow-visible" strokeLinejoin="miter">
      {boxes.map((box, boxIdx) => (
        <g
          key={boxIdx}
          data-box
          className={box.accent ? ACCENT_BOX_CLASS : DEFAULT_BOX_CLASS}
          strokeDasharray={box.dashed ? '3 3' : undefined}
          style={box.o != null ? { opacity: box.o } : undefined}
        >
          {faces(box).map((facePts, faceIdx) => (
            <polygon
              key={faceIdx}
              points={facePts.map(str).join(' ')}
              stroke="currentColor"
              strokeOpacity={(box.accent ? ACCENT_STROKE_OPACITIES : DEFAULT_STROKE_OPACITIES)[faceIdx]}
              strokeDasharray={faceIdx !== 0 || box.dashed ? undefined : '2 1.5'}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

export const tone = (groupEl, isAccent) => {
  groupEl.setAttribute('class', isAccent ? ACCENT_BOX_CLASS : DEFAULT_BOX_CLASS);
  [...groupEl.children].forEach((childEl, faceIdx) => {
    childEl.setAttribute('stroke-opacity', (isAccent ? ACCENT_STROKE_OPACITIES : DEFAULT_STROKE_OPACITIES)[faceIdx]);
  });
};

export function useIsoLoop(scopeRef, fig, deps = []) {
  const tlRef = useRef(null);
  const isHoveredRef = useRef(false);
  const rest = useMemo(() => fig.model(), [fig, ...deps]);

  useGSAP(
    () => {
      const boxNodes = gsap.utils.selector(scopeRef.current)('[data-box]');
      const boxes = fig.model();
      const tl = gsap.timeline({
        paused: true,
        onUpdate: () => {
          boxes.forEach((box, boxIdx) => {
            faces(box).forEach((facePts, faceIdx) => {
              boxNodes[boxIdx]?.children[faceIdx]?.setAttribute('points', facePts.map(str).join(' '));
            });
          });
        },
        onComplete: () => {
          if (!fig.hold && isHoveredRef.current) {
            tl.restart();
          }
        },
      });

      fig.cycle(tl, boxes, boxNodes);
      tlRef.current = tl;

      return () => tl.kill();
    },
    { scope: scopeRef, dependencies: [fig, ...deps] }
  );

  return {
    rest,
    onEnter: () => {
      isHoveredRef.current = true;
      const tl = tlRef.current;
      if (!reduced() && tl) {
        if (fig.hold) {
          tl.play();
        } else if (!tl.isActive()) {
          tl.restart();
        }
      }
    },
    onLeave: () => {
      isHoveredRef.current = false;
      if (fig.hold) {
        tlRef.current?.reverse();
      }
    },
    play: () => {
      isHoveredRef.current = false;
      const tl = tlRef.current;
      if (!reduced() && tl) {
        tl.restart();
      }
    },
  };
}
