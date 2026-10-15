'use client';
import { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import gsap from 'gsap';
import { useReveal } from '@/animations/hooks/useReveal';

const AnimatedDivider = forwardRef(function AnimatedDivider(
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
  const containerRef = useRef(null);

  const isHorizontal = orientation === 'horizontal';
  const scaleProp = isHorizontal ? 'scaleX' : 'scaleY';
  const transformOrigin = isHorizontal ? 'left center' : 'top center';

  const build = skip
    ? null
    : (element) =>
        gsap
          .timeline({ paused: true })
          .fromTo(
            element,
            { [scaleProp]: 0, transformOrigin },
            { [scaleProp]: 1, duration, delay, ease },
          );

  const { reveal } = useReveal(containerRef, {
    mode: triggerMode === 'scroll' ? 'scroll' : 'manual',
    build,
    start,
    deps: [isHorizontal, duration, delay, ease, skip],
  });

  useImperativeHandle(ref, () => ({ reveal }), [reveal]);

  useEffect(() => {
    if (triggerMode !== 'immediate' || skip) return;
    reveal();
  }, [triggerMode, skip, reveal]);

  const sizeStyle = isHorizontal
    ? { height: `${thickness}px`, width: length === 'full' ? '100%' : length }
    : { width: `${thickness}px`, height: length === 'full' ? '100%' : length };

  const style = color ? { ...sizeStyle, backgroundColor: color } : sizeStyle;

  return (
    <div
      ref={containerRef}
      role="separator"
      aria-orientation={orientation}
      className={`landing-divider ${className}`.trim()}
      style={style}
    />
  );
});

export default AnimatedDivider;
