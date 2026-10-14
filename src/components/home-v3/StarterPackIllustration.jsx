'use client'
import { useRef } from 'react';
import { IsoFigure, PUNCH, useIsoLoop } from '@/components/common/iso';

const INNER_ITEM_COORDS = [
  { x: -34, y: -14 },
  { x: -6, y: -34 },
  { x: 8, y: 2 },
];

const starterPackFig = {
  model: () => [
    { x: -50, y: -50, z: 0, w: 100, d: 100, h: 40 },
    ...INNER_ITEM_COORDS.map((coord) => ({ ...coord, z: 30, w: 26, d: 26, h: 26, o: 0 })),
    { x: -50, y: -50, z: 40, w: 100, d: 100, h: 6, accent: true },
  ],
  cycle: (tl, boxes, nodes) => {
    const lidIndex = boxes.length - 1;

    tl.to(boxes[lidIndex], { z: 120, duration: 0.7, ease: PUNCH }, 0);

    INNER_ITEM_COORDS.forEach((_, index) => {
      const boxIndex = index + 1;
      tl.to(nodes[boxIndex], { opacity: 1, duration: 0.2, ease: 'none' }, 0.3 + 0.08 * index).to(
        boxes[boxIndex],
        { z: 60 + 10 * index, duration: 0.7, ease: PUNCH },
        0.3 + 0.08 * index
      );
    });

    tl.to(
      boxes.slice(1, lidIndex),
      { z: 30, duration: 0.6, ease: PUNCH, stagger: { each: 0.06, from: 'end' } },
      1.6
    )
      .to(nodes.slice(1, lidIndex), { opacity: 0, duration: 0.2, ease: 'none' }, 2.05)
      .to(boxes[lidIndex], { z: 40, duration: 0.6, ease: PUNCH }, 1.9)
      .to({}, { duration: 0.4 });
  },
};

export function StarterPackIllustration() {
  const containerRef = useRef(null);
  const { rest, onEnter, onLeave } = useIsoLoop(containerRef, starterPackFig);

  return (
    <div
      ref={containerRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-hidden="true"
      className="mx-auto flex h-[220px] max-w-[280px] items-center justify-center"
    >
      <IsoFigure boxes={rest} />
    </div>
  );
}
