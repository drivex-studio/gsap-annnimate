import { PUNCH } from '@/libs/utils/iso';

export const soloFig = {
  model: () => [
    { x: -60, y: -60, z: 0, w: 120, d: 120, h: 4 },
    { x: -26, y: -26, z: 4, w: 52, d: 52, h: 52, accent: true },
  ],
  cycle: (tl, boxes) => {
    tl.to(boxes[1], { z: 40, duration: 0.6, ease: PUNCH }, 0)
      .to(boxes[1], { z: 4, duration: 0.6, ease: PUNCH }, 0.8)
      .to({}, { duration: 0.5 });
  },
};

export const getSeatBoxCoord = (index, totalSeats) => ({
  x: -16 + (index - (totalSeats - 1) / 2) * 30,
  y: -16 - (index - (totalSeats - 1) / 2) * 30,
});

export const buildSeatBoxes = (seats) => {
  return Array.from({ length: 8 }, (_, index) => ({
    ...getSeatBoxCoord(Math.min(index, seats - 1), seats),
    z: 0,
    w: 32,
    d: 32,
    h: 32,
    o: Number(index < seats),
    accent: index === 0,
  }));
};

export const parseViewBox = (viewBoxStr) => {
  const [x, y, w, h] = viewBoxStr.split(' ').map(Number);
  return { x, y, w, h };
};

export const emptyFig = {
  model: () => [],
  cycle: () => {},
};

export const revealFig = {
  model: () => [
    { x: -70, y: -45, z: 0, w: 140, d: 90, h: 4 },
    { x: -58, y: -32, z: 4, w: 64, d: 14, h: 0, o: 0 },
    { x: -58, y: -8, z: 4, w: 40, d: 10, h: 0, o: 0 },
    { x: 22, y: -30, z: 4, w: 36, d: 50, h: 0, o: 0 },
    { x: -70, y: -45, z: 6, w: 140, d: 90, h: 4, accent: true },
  ],
  cycle: (tl, boxes, nodes) => {
    tl.to(boxes[4], { z: 96, duration: 0.8, ease: PUNCH }, 0)
      .to(nodes[4], { opacity: 0, duration: 0.5, ease: PUNCH }, 0.35);

    [1, 2, 3].forEach((boxIdx, staggerIdx) => {
      const startTime = 0.45 + 0.1 * staggerIdx;

      tl.to(nodes[boxIdx], { opacity: 1, duration: 0.2, ease: 'none' }, startTime)
        .to(boxes[boxIdx], {
          h: boxIdx === 3 ? 30 : 6,
          duration: 0.6,
          ease: PUNCH,
        }, startTime);
    });

    tl.to(boxes.slice(1, 4), { h: 0, duration: 0.5, ease: PUNCH, stagger: 0.05 }, 2)
      .to(nodes.slice(1, 4), { opacity: 0, duration: 0.2, ease: 'none' }, 2.4)
      .to(nodes[4], { opacity: 1, duration: 0.4, ease: PUNCH }, 2.1)
      .to(boxes[4], { z: 6, duration: 0.7, ease: PUNCH }, 2.1)
      .to({}, { duration: 0.4 });
  },
};

export const menuFig = {
  model: () => [
    { x: -70, y: -45, z: 0, w: 140, d: 90, h: 4 },
    { x: -70, y: -45, z: 4, w: 4, d: 90, h: 4, accent: true },
    ...[0, 1, 2].map((rowIdx) => ({
      x: -64,
      y: -36 + 26 * rowIdx,
      z: 8,
      w: 40,
      d: 14,
      h: 0,
      o: 0,
    })),
  ],
  cycle: (tl, boxes, nodes) => {
    tl.to(boxes[1], { w: 56, duration: 0.7, ease: PUNCH }, 0);

    [2, 3, 4].forEach((boxIdx, staggerIdx) => {
      const startTime = 0.45 + 0.1 * staggerIdx;

      tl.to(nodes[boxIdx], { opacity: 1, duration: 0.2, ease: 'none' }, startTime)
        .to(boxes[boxIdx], { h: 5, duration: 0.5, ease: PUNCH }, startTime);
    });

    tl.to(
      boxes.slice(2),
      { h: 0, duration: 0.4, ease: PUNCH, stagger: { each: 0.05, from: 'end' } },
      1.8
    )
      .to(nodes.slice(2), { opacity: 0, duration: 0.2, ease: 'none' }, 2.1)
      .to(boxes[1], { w: 4, duration: 0.6, ease: PUNCH }, 2.1)
      .to({}, { duration: 0.4 });
  },
};
