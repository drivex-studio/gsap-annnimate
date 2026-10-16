'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import gsap from 'gsap';

import { useReveal } from '@/animations/hooks/useReveal'; // module id: 228414

export const LandingDivider = forwardRef(function LandingDivider(
  {
    orientation = 'horizontal',
    thickness = 1,
    length = 'full',
    color,
    duration = 0.8,
    delay = 0,
    ease = 'power3.out',
    start = 'top 85%',
    triggerMode = 'scroll',
    skip = false,
    className = '',
  },
  ref,
) {
  const dividerRef = useRef(null);
  const isHorizontal = orientation === 'horizontal';
  const scaleProp = isHorizontal ? 'scaleX' : 'scaleY';
  const transformOrigin = isHorizontal ? 'left center' : 'top center';

  const { reveal } = useReveal(dividerRef, {
    mode: triggerMode === 'scroll' ? 'scroll' : 'manual',
    build: skip
      ? null
      : (element) =>
          gsap.timeline({ paused: true }).fromTo(
            element,
            {
              [scaleProp]: 0,
              transformOrigin,
            },
            {
              [scaleProp]: 1,
              duration,
              delay,
              ease,
            },
          ),
    start,
    deps: [isHorizontal, duration, delay, ease, skip],
  });

  useImperativeHandle(ref, () => ({ reveal }), [reveal]);

  useEffect(() => {
    if (triggerMode === 'immediate' && !skip) {
      reveal();
    }
  }, [triggerMode, skip, reveal]);

  const dimensionStyle = isHorizontal
    ? {
        height: `${thickness}px`,
        width: length === 'full' ? '100%' : length,
      }
    : {
        width: `${thickness}px`,
        height: length === 'full' ? '100%' : length,
      };

  const inlineStyle = color
    ? {
        ...dimensionStyle,
        backgroundColor: color,
      }
    : dimensionStyle;

  return (
    <div
      ref={dividerRef}
      role="separator"
      aria-orientation={orientation}
      className={`landing-divider ${className}`.trim()}
      style={inlineStyle}
    />
  );
});
