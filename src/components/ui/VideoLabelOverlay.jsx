'use client';
import React, { useRef, useState, useEffect } from 'react';
import { SHOWREEL_SRC, SHOWREEL_POSTER } from '@/libs/config/constants'; // module id: 846057

// module id: 233230
export default function VideoLabelOverlay({ className = "", label = "Menu Kit showreel" }) { // original mangled: e, a
  let videoRef = useRef(null); // original mangled: r
  let [reducedMotion, setReducedMotion] = useState(false); // original mangled: l, n

  useEffect(() => {
    let mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) return;
    
    setReducedMotion(mediaQuery.matches);
    
    let handleChange = (e) => setReducedMotion(e.matches); // original mangled: t
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  useEffect(() => {
    let videoEl = videoRef.current;
    if (videoEl && reducedMotion) {
      videoEl.pause();
    }
  }, [reducedMotion]);

  return (
    <div className={`relative overflow-hidden bg-foreground/[0.06] ${className}`}>
      <video
        ref={videoRef}
        className="block object-cover"
        style={{ width: "100%", height: "100%" }}
        src={SHOWREEL_SRC}
        poster={SHOWREEL_POSTER || undefined}
        autoPlay={!reducedMotion}
        muted={true}
        loop={true}
        playsInline={true}
        preload="metadata"
        aria-label={label}
      />
    </div>
  );
}
