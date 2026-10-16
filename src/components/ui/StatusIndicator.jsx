'use client';

import React, { useRef } from 'react';

import { cn } from '@/libs/utils/className';

import { usePauseOffscreen } from '@/hooks/usePauseOffscreen'; // module id: 771267

export default function StatusIndicator({ className = 'size-8' }) {
  const indicatorRef = useRef(null);

  usePauseOffscreen(indicatorRef);

  return (
    <span
      ref={indicatorRef}
      aria-hidden="true"
      className={cn('relative inline-flex', className)}
    >
      <span className="absolute inset-0 animate-ping bg-brand opacity-60" />
      <span className="relative block size-full bg-brand" />
    </span>
  );
}
