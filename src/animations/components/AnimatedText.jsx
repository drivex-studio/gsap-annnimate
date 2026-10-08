"use client";
import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useReveal } from '@/hooks/useReveal';

export default function AnimatedText({
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
  ...rest
}) {
  let containerRef = useRef(null);

  let { play } = useReveal(containerRef, {
    mode: trigger === 'pageEnter' ? 'hero' : trigger === 'manual' ? 'manual' : 'scroll',
    build: enabled ? (element) => {
      let targets = stagger > 0 ? Array.from(element.children) : [element];
      return gsap.timeline({ paused: true }).fromTo(
        targets,
        { autoAlpha: 0, y },
        { autoAlpha: 1, y: 0, duration, ease, delay, stagger }
      );
    } : null,
    start,
    deps: [enabled, y, duration, ease, delay, stagger]
  });

  useEffect(() => {
    if (trigger === 'manual' && enabled && onReady) {
      onReady(play);
    }
  }, [trigger, enabled, onReady, play]);

  return (
    <Component ref={containerRef} className={className} {...rest}>
      {children}
    </Component>
  );
}
