"use client";
import React, { useEffect } from 'react';
import { useDualLayerScramble } from '@/hooks/useDualLayerScramble';

export function ScrambleLoadingLabel({
  text = "Loading",
  className = "",
  duration = 0.65,
  holdMs = 950
}) {
  let { ref, scramble, kill } = useDualLayerScramble();
  useEffect(() => {
    let timeoutId = null;
    let isCancelled = false;
    let triggerScramble = () => {
      if (!isCancelled) {
        scramble({
          duration: duration,
          onComplete: () => {
            if (!isCancelled) {
              timeoutId = setTimeout(triggerScramble, holdMs);
            }
          }
        });
      }
    };

    timeoutId = setTimeout(triggerScramble, 150);

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      kill();
    };
  }, [scramble, kill, duration, holdMs]);
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text}
    </span>
  );
}
