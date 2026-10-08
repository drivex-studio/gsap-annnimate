"use client";
import React, { useRef } from 'react';
import { usePageEnterAnimation } from '@/providers/AnimationProvider';
import ImageGrid from '@/components/ui/ImageCarousel';

const LAYOUT = { rowCount: 9 };

export default function AuthShowcase({
  images = [],
  className = '',
  driftVx,
  driftVy
}) {
  let gridRef = useRef(null);
  usePageEnterAnimation(() => gridRef.current?.reveal(), [], 'AuthShowcase');

  return (
    <div className={`relative hidden overflow-hidden bg-background lg:block ${className}`.trim()}>
      {images.length > 0 ? (
        <ImageGrid
          ref={gridRef}
          images={images}
          entrance="center-out"
          layout={LAYOUT}
          className="h-full"
          driftVx={driftVx}
          driftVy={driftVy}
        />
      ) : null}
    </div>
  );
}
