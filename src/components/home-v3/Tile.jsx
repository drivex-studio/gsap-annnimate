'use client';

import React, { useRef } from 'react';
import { PUNCH, useIsoLoop, IsoFigure, tone } from '@/components/common/iso';
import { t } from '@/libs/utils/i18n';
import RevealHeadline from '@/animations/shared/RevealHeadline';
import AnimatedButton from '@/animations/components/AnimatedButton';
import { ScrollTrigger } from '@/libs/utils/vendor';

const heightConfigs = [50, 80, 32];

export const awardFig = {
  model: () => [
    ...[-1, 0, 1].map((step, index) => ({
      x: -24 + 50 * step,
      y: -24 - 50 * step,
      z: 0,
      w: 48,
      d: 48,
      h: heightConfigs[index],
    })),
    { x: -12, y: -12, z: heightConfigs[1], w: 24, d: 24, h: 24, accent: true },
  ],
  cycle: (tl, items) => {
    tl.to(items.slice(0, 3), { h: 6, duration: 0.6, ease: PUNCH, stagger: 0.05 }, 0)
      .to(items[3], { z: 6, duration: 0.6, ease: PUNCH }, 0.05)
      .to(items[0], { h: heightConfigs[0], duration: 0.8, ease: PUNCH }, 0.9)
      .to(items[2], { h: heightConfigs[2], duration: 0.8, ease: PUNCH }, 1)
      .to(items[1], { h: heightConfigs[1], duration: 0.9, ease: PUNCH }, 1.15)
      .to(items[3], { z: heightConfigs[1], duration: 0.9, ease: PUNCH }, 1.15)
      .to({}, { duration: 0.5 });
  },
};

export const formats = {
  model: () => [-1, 0, 1].map((step) => ({
    x: -28 + 52 * step,
    y: -28 - 52 * step,
    z: 0,
    w: 56,
    d: 56,
    h: 56,
    accent: 0 === step,
  })),
  cycle: (tl, items) => {
    tl.to(items, { x: -28, y: -28, duration: 0.7, ease: PUNCH }, 0);
    items.forEach((item) => tl.to(item, { x: item.x, y: item.y, duration: 0.8, ease: PUNCH }, 1));
    tl.to({}, { duration: 0.5 });
  },
};

export const agentFig = {
  model: () => {
    let items = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (1 !== row || 1 !== col) {
          items.push({
            x: -68 + 48 * row,
            y: -68 + 48 * col,
            z: 0,
            w: 40,
            d: 40,
            h: 4,
            depth: row + col,
          });
        }
      }
    }

    items.sort((a, b) => a.depth - b.depth);

    let idx = items.findIndex((item) => item.depth > 2);

    items.splice(
      idx,
      0,
      { x: -20, y: -20, z: 0, w: 40, d: 40, h: 0, dashed: true },
      { x: -20, y: -20, z: 0, w: 40, d: 40, h: 40, accent: true, piece: true },
    );

    return items;
  },
  cycle: (tl, items) => {
    let piece = items.find((item) => item.piece);

    tl.to(piece, { z: 80, duration: 0.7, ease: PUNCH }, 0)
      .to(piece, { z: 0, duration: 0.7, ease: PUNCH }, 1)
      .to({}, { duration: 0.6 });
  },
};

const calcHeight = (index) => 14 + 96 * (1 - Math.pow(2, -10 * index / 8));

export const values = {
  model: () => Array.from({ length: 9 }, (_, index) => ({
    x: -66 + 16 * index,
    y: -32,
    z: 0,
    w: 5,
    d: 64,
    h: calcHeight(index),
    accent: 8 === index,
  })),
  cycle: (tl, items) => {
    let proxy = { v: 0 };
    let updateFn = () => items.forEach((item, index) => {
      item.h = calcHeight(index) + (14 + index / 8 * 96 - calcHeight(index)) * proxy.v;
    });

    tl.to(proxy, { v: 1, duration: 0.9, ease: PUNCH, onUpdate: updateFn }, 0)
      .to(proxy, { v: 0, duration: 0.9, ease: PUNCH, onUpdate: updateFn }, 1.3)
      .to({}, { duration: 0.5 });
  },
};

const codeOffsets = [[-18, 10], [14, -16], [-10, -14], [16, 12]];

export const codeFig = {
  model: () => codeOffsets.map((offset, index) => ({
    x: -45,
    y: -45,
    z: 16 * index,
    w: 90,
    d: 90,
    h: 10,
    accent: index === codeOffsets.length - 1,
  })),
  cycle: (tl, items) => {
    items.forEach((item, index) =>
      tl.to(item, {
        x: item.x + codeOffsets[index][0],
        y: item.y + codeOffsets[index][1],
        duration: 0.6,
        ease: PUNCH,
      }, 0.05 * index),
    );

    items.forEach((item, index) =>
      tl.to(item, {
        x: item.x,
        y: item.y,
        duration: 0.8,
        ease: PUNCH,
      }, 0.9 + (items.length - 1 - index) * 0.05),
    );

    tl.to({}, { duration: 0.5 });
  },
};

export const weekly = {
  model: () => [
    ...Array.from({ length: 9 }, (_, index) => ({
      x: -117 + 26 * index,
      y: -40,
      z: 0,
      w: 4,
      d: 80,
      h: 110,
      accent: 8 === index,
    })),
    { x: 117, y: -40, z: 0, w: 4, d: 80, h: 110, accent: true, o: 0 },
  ],
  cycle: (tl, items, refs) => {
    items.slice(0, 9).forEach((item, index) =>
      tl.to(item, { x: -117 + 26 * (index - 1), duration: 0.8, ease: PUNCH }, 0),
    );

    tl.to(refs[0], { opacity: 0, duration: 0.8, ease: PUNCH }, 0)
      .add(() => tone(refs[8], false), 0.15)
      .to(items[9], { x: 91, duration: 0.8, ease: PUNCH }, 0.1)
      .to(refs[9], { opacity: 1, duration: 0.8, ease: PUNCH }, 0.1)
      .to({}, { duration: 0.5 })
      .add(() => {
        items.slice(0, 9).forEach((item, index) => item.x = -117 + 26 * index);
        items[9].x = 117;
      })
      .set(refs[0], { opacity: 1 })
      .add(() => tone(refs[8], true))
      .set(refs[9], { opacity: 0 });
  },
};

export function Tile({ className = '', fig, title, line, children = null }) {
  let ref = useRef(null);
  let { rest, onEnter, onLeave } = useIsoLoop(ref, fig);

  return (
    <div
      ref={ref}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`col-span-12 flex flex-col gap-32 bg-background p-24 lg:p-40 ${className}`}
    >
      <div aria-hidden="true" className="flex h-[260px] items-center justify-center">
        <IsoFigure boxes={rest} />
      </div>
      <div className="flex flex-col gap-8">
        <h3 className="text-body font-medium">{title}</h3>
        <p className="text-body-sm max-w-[44ch] text-foreground-muted">{line}</p>
      </div>
      {children}
    </div>
  );
}

export default function BentoSection({ count = 0 }) {
  const renderTile = (key, fig, className, extraProps) => (
    <Tile
      key={key}
      className={className}
      fig={fig}
      title={t(`home-v3.bento.${key}.title`)}
      line={t(`home-v3.bento.${key}.line`, extraProps)}
    />
  );

  return (
    <section data-theme="dark" className="bg-background py-96 text-foreground lg:py-160">
      <div className="v2-container flex flex-col gap-48 lg:gap-64">
        <RevealHeadline
          as="h2"
          sizeClass="text-h2"
          className="max-w-[18ch] font-medium text-balance"
          trigger="scroll"
        >
          {t('home-v3.bento.headline')}
        </RevealHeadline>
        <div className="grid grid-cols-12 gap-px border border-border bg-border">
          {renderTile('award', awardFig, 'md:col-span-6 lg:col-span-5')}
          {renderTile('agent', agentFig, 'md:col-span-6 lg:col-span-4')}
          {renderTile('formats', formats, 'md:col-span-6 lg:col-span-3')}
          {renderTile('values', values, 'md:col-span-6 lg:col-span-3')}
          {renderTile('code', codeFig, 'md:col-span-6 lg:col-span-4')}
          {renderTile('weekly', weekly, 'md:col-span-6 lg:col-span-5', { count })}
        </div>
        <ScrollTrigger trigger="scroll" className="flex justify-center">
          <AnimatedButton href="/animations" theme="brand">
            {t('home-v3.bento.browse')}
          </AnimatedButton>
        </ScrollTrigger>
      </div>
    </section>
  );
}
