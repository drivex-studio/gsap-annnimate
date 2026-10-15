'use client';
import { useEffect } from 'react';
import { useDualLayerScramble } from '@/animations/hooks/useDualLayerScramble';

export function ScrambleLoadingLabel({
  text = 'Loading',
  className = '',
  duration = 0.65,
  holdMs = 950,
}) {
  const { ref, scramble, kill } = useDualLayerScramble();

  useEffect(() => {
    let timeoutId = null;
    let isCancelled = false;

    const triggerScramble = () => {
      if (isCancelled) return;

      scramble({
        duration,
        onComplete: () => {
          if (isCancelled) return;
          timeoutId = setTimeout(triggerScramble, holdMs);
        },
      });
    };

    timeoutId = setTimeout(triggerScramble, 150);

    return function cleanup() {
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
