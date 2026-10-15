'use client';
import { useRef, Children } from 'react';
import gsap from 'gsap';
import { useReveal } from '@/animations/hooks/useReveal';

function SliderItem({ child, itemClassName }) {
  return (
    <li className={`overflow-hidden ${itemClassName}`.trim()}>
      <span data-anm-list-slider className="block">
        {child}
      </span>
    </li>
  );
}

export default function ListSlider({
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
  const containerRef = useRef(null);

  useReveal(containerRef, {
    mode: trigger === 'pageEnter' ? 'hero' : 'scroll',
    build: (element) => {
      const targets = element.querySelectorAll('[data-anm-list-slider]');
      const tl = gsap.timeline({ paused: true });

      if (targets.length) {
        tl.from(targets, { yPercent: 100, duration, stagger, delay, ease });
      }

      return tl;
    },
    start,
    deps: [duration, stagger, delay, ease, trigger],
  });

  const validChildren = Children.toArray(children).filter(Boolean);

  return (
    <Tag ref={containerRef} className={className}>
      {validChildren.map((child, index) => (
        <SliderItem key={index} child={child} itemClassName={itemClassName} />
      ))}
    </Tag>
  );
}
