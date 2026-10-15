import { Children, useRef } from 'react';
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

export function ListSlider({
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
    build: (containerEl) => {
      const sliderEls = containerEl.querySelectorAll('[data-anm-list-slider]');
      const tl = gsap.timeline({ paused: true });

      if (sliderEls.length) {
        tl.from(sliderEls, { yPercent: 100, duration, stagger, delay, ease });
      }

      return tl;
    },
    start,
    deps: [duration, stagger, delay, ease, trigger],
  });

  const childItems = Children.toArray(children).filter(Boolean);

  return (
    <Tag ref={listRef} className={className}>
      {childItems.map((child, index) => (
        <SliderItem key={index} child={child} itemClassName={itemClassName} />
      ))}
    </Tag>
  );
}
