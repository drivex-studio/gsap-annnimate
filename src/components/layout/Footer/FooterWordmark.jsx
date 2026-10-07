"use client";
import React, { useRef, useState, useEffect } from 'react';
import FooterWordmarkSvg from '@/assets/logos/FooterWordmar';

export function FooterWordmark() {
  const containerRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsRevealed(true);
      return;
    }

    const target = containerRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsRevealed(entry.isIntersecting);
      },
      { rootMargin: '0px 0px -5% 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="footer-wordmark w-full max-w-[1920px] mx-auto py-48 lg:py-80"
      data-revealed={isRevealed ? 'true' : 'false'}
    >
      <div className="overflow-hidden">
        <FooterWordmarkSvg
          width="100%"
          style={{ height: 'auto' }}
          className="footer-wordmark-svg block text-foreground/10"
        />
      </div>
    </div>
  );
}
