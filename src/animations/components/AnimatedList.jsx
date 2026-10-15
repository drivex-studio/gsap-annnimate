'use client';

import { useRef, Children } from 'react';
import gsap from 'gsap';
import { useReveal } from '@/animations/hooks/useReveal';

export default function AnimatedList({
  children,
  className = '',
  tag: Tag = 'ul',
  itemClassName = '',
  duration = 0.6,
  stagger = 0.08,
  delay = 0,
  ease = 'power2.out',
  start = 'top 80%',
  trigger = 'scroll',
}) {
  const listRef = useRef(null);

  useReveal(listRef, {
    mode: trigger === 'pageEnter' ? 'hero' : 'scroll',
    build: (element) => {
      const sliders = element.querySelectorAll('[data-anm-list-slider]');
      const tl = gsap.timeline({ paused: true });

      if (sliders.length) {
        tl.from(sliders, {
          yPercent: 100,
          duration,
          stagger,
          delay,
          ease,
        });
      }

      return tl;
    },
    start,
    deps: [duration, stagger, delay, ease, trigger],
  });

  const validChildren = Children.toArray(children).filter(Boolean);

  return (
    <Tag ref={listRef} className={className}>
      {validChildren.map((child, index) => (
        <li key={index} className={`overflow-hidden ${itemClassName}`.trim()}>
          <span data-anm-list-slider={true} className="block">
            {child}
          </span>
        </li>
      ))}
    </Tag>
  );
}
