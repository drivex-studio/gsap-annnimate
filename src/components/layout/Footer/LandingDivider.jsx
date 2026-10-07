"use client";
import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import gsap from 'gsap';
import { useReveal } from '@/hooks/useReveal';

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
  ref
) {
  const elementRef = useRef(null);
  const isHorizontal = orientation === 'horizontal';
  const scaleProp = isHorizontal ? 'scaleX' : 'scaleY';
  const transformOrigin = isHorizontal ? 'left center' : 'top center';

  const { reveal } = useReveal(elementRef, {
    mode: triggerMode === 'scroll' ? 'scroll' : 'manual',
    build: skip
      ? null
      : (el) =>
          gsap.timeline({ paused: true }).fromTo(
            el,
            { [scaleProp]: 0, transformOrigin: transformOrigin },
            { [scaleProp]: 1, duration: duration, delay: delay, ease: ease }
          ),
    start: start,
    deps: [isHorizontal, duration, delay, ease, skip],
  });

  useImperativeHandle(ref, () => ({ reveal: reveal }), [reveal]);

  useEffect(() => {
    if (triggerMode !== 'immediate' || skip) return;
    reveal();
  }, [triggerMode, skip, reveal]);

  const sizeStyle = isHorizontal
    ? { height: `${thickness}px`, width: length === 'full' ? '100%' : length }
    : { width: `${thickness}px`, height: length === 'full' ? '100%' : length };

  const finalStyle = color ? { ...sizeStyle, backgroundColor: color } : sizeStyle;

  return (
    <div
      ref={elementRef}
      role="separator"
      aria-orientation={orientation}
      className={`landing-divider ${className}`.trim()}
      style={finalStyle}
    />
  );
});
