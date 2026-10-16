'use client';

import { useEffect } from 'react';

export function usePauseOffscreen(targetRef) {
  useEffect(() => {
    const element = targetRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      element.getAnimations({ subtree: true }).forEach((animation) => {
        if (entry.isIntersecting) {
          animation.play();
        } else {
          animation.pause();
        }
      });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [targetRef]);
}
