'use client';

import { useEffect, useRef } from 'react';
import { jsx } from 'react/jsx-runtime';
import gsap from 'gsap';
import { useReveal } from '@/animations/hooks/useReveal';

export default function RevealFade({
  as: Component = 'div',
  children,
  className = '',
  y = 16,
  duration = 0.7,
  ease = 'power2.out',
  delay = 0,
  stagger = 0,
  trigger = 'pageEnter',
  start = 'top 85%',
  enabled = true,
  onReady,
  ...props
}) {
  const elementRef = useRef(null);

  const { play } = useReveal(elementRef, {
    mode:
      trigger === 'pageEnter'
        ? 'hero'
        : trigger === 'manual'
          ? 'manual'
          : 'scroll',

    build: enabled
      ? (element) => {
          const targets =
            stagger > 0 ? Array.from(element.children) : [element];

          return gsap.timeline({ paused: true }).fromTo(
            targets,
            {
              autoAlpha: 0,
              y,
            },
            {
              autoAlpha: 1,
              y: 0,
              duration,
              ease,
              delay,
              stagger,
            }
          );
        }
      : null,

    start,
    deps: [enabled, y, duration, ease, delay, stagger],
  });

  useEffect(() => {
    if (trigger === 'manual' && enabled && onReady) {
      onReady(play);
    }
  }, [trigger, enabled, onReady, play]);

  return jsx(Component, {
    ref: elementRef,
    className,
    ...props,
    children,
  });
}
