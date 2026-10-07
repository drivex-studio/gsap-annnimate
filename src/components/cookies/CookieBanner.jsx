'use client'

import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Link from '@/components/ui/TransitionLink';
import { getConsent, acceptAll } from '@/libs/config/setConsent';
import Button from '@/components/ui/Button'; 

export function CookieBanner({ onOpenPreferences }) {
  const [isOpen, setIsOpen] = useState(false);
  const bannerRef = useRef(null);

  useEffect(() => {
    const consent = getConsent();
    if (consent && consent.method !== null) return;
    
    const timer = setTimeout(() => setIsOpen(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleConsentChange = () => closeBanner();
    window.addEventListener('annnimate:consent-changed', handleConsentChange);
    return () => window.removeEventListener('annnimate:consent-changed', handleConsentChange);
  }, []);

  useGSAP(() => {
    if (isOpen && bannerRef.current) {
      gsap.fromTo(
        bannerRef.current,
        { y: 32, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out' }
      );
    }
  }, { dependencies: [isOpen] });

  const closeBanner = (callback) => {
    if (!bannerRef.current) {
      setIsOpen(false);
      callback?.();
      return;
    }
    
    gsap.to(bannerRef.current, {
      y: 32,
      autoAlpha: 0,
      duration: 0.4,
      ease: 'expo.in',
      onComplete: () => {
        setIsOpen(false);
        callback?.();
      }
    });
  };

  return isOpen ? (
    <div
      ref={bannerRef}
      role="dialog"
      aria-label="Cookie preferences"
      aria-describedby="cookie-banner-body"
      className="fixed bottom-16 left-16 z-40 w-[calc(100vw-32px)] max-w-[320px] opacity-0"
      data-theme="dark"
    >
      <div className="flex flex-col gap-16 border border-foreground/15 bg-background p-16 text-foreground lg:p-20">
        <p id="cookie-banner-body" className="text-body-sm text-foreground-muted">
          Anonymous pageviews by default. Accept all for session recording and live chat.{' '}
          <Link
            href="/cookies"
            className="text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:decoration-foreground"
          >
            Learn more
          </Link>
        </p>
        <div className="flex gap-8">
          <Button
            type="button"
            theme="light"
            size="xs"
            onClick={() => closeBanner(acceptAll)}
            className="flex-1"
          >
            Accept all
          </Button>
          <Button
            type="button"
            theme="surface"
            size="xs"
            onClick={() => closeBanner(onOpenPreferences)}
            className="flex-1"
          >
            Preferences
          </Button>
        </div>
      </div>
    </div>
  ) : null;
}

export default CookieBanner;
