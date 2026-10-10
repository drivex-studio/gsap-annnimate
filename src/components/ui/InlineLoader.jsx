'use client';
import React, { useEffect } from 'react';
import { cn } from '@/libs/utils/className'; 

function BaseSpinner({
  size = 40,
  speed = '0.9',
  color = 'var(--brand)',
  className
}) {
  const numericSize = Number(size) || 40;
  const calculatedDuration = Math.min(2, Math.max(0.5, 1 / (Number(speed) || 0.9)));

  return (
    <svg
      role="status"
      aria-label="Loading"
      className={cn('animate-spin', className)}
      width={numericSize}
      height={numericSize}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        color: color,
        animationDuration: `${calculatedDuration}s`
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function InlineLoader({
  size = '20',
  speed = '0.9',
  color,
  className
}) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)}>
      <BaseSpinner size={size} speed={speed} color={color} />
    </span>
  );
}

export function QuantumLoader({
  size = '45',
  speed = '1.75',
  color,
  className
}) {
  useEffect(() => {
    import('ldrs')
      .then((mod) => mod.quantum.register())
      .catch(() => {});
  }, []);

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <l-quantum
        size={size}
        speed={speed}
        color={color || 'rgb(168, 85, 247)'}
      />
    </div>
  );
}

export default function DefaultLoader({
  size = '40',
  speed = '0.9',
  className
}) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <BaseSpinner size={size} speed={speed} />
    </div>
  );
}
