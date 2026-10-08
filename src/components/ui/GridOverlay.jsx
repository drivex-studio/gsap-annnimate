'use client';
import React, { useState, useEffect } from 'react';

export function GridOverlay() {
  let [isVisible, setIsVisible] = useState(false);
  let [animState, setAnimState] = useState(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        setIsVisible(prev => {
          setAnimState(prev ? 'out' : 'in');
          return !prev;
        });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (animState !== 'out') return;
    let timeoutId = setTimeout(() => setAnimState(null), 1830);
    return () => clearTimeout(timeoutId);
  }, [animState]);

  let isHidden = !isVisible && animState !== 'out';

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ visibility: isHidden ? 'hidden' : 'visible' }}
      aria-hidden="true"
    >
      <div className="v2-container h-full">
        <div className="grid grid-cols-12 gap-16 h-full">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="h-full origin-top"
              style={{
                background: 'color-mix(in srgb, var(--brand) 10%, transparent)',
                transform: isVisible ? 'scaleY(1)' : 'scaleY(0)',
                transitionProperty: 'transform',
                transitionDuration: '1500ms',
                transitionTimingFunction: 'var(--ease-power3-in-out)',
                transitionDelay: `${30 * index}ms`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
