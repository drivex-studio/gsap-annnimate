import React, { useMemo, useEffect, useRef } from 'react';

import { t } from '@/libs/i18n';
import { preloadSharedImages } from '@/libs/utils/preload';
import { perfLog } from '@/libs/utils/perf';
import { useAnimation } from '@/hooks/usePageEnterAnimation';

import HeroSection from './HeroSection';
import ProblemSection from './ProblemSection';
import HowItWorksSection from './HowItWorksSection';
import OneComponentSection from './OneComponentSection';
import TwoWaysSection from './TwoWaysSection';
import PricingSection from './PricingSection';
import CustomCursor from './CustomCursor';

import LibraryPreview from '@/components/landing/LibraryPreview';
import LogoWall from '@/components/landing/LogoWall';
import Testimonials from '@/components/landing/Testimonials';
import ValueMath from '@/components/landing/ValueMath';
import FAQ from '@/components/landing/FAQ';
import BottomCTA from '@/components/landing/BottomCTA';

const PREFERRED_SLUGS = [
  'circular-slider', 'image-fly-in', 'card-fan', 'step-wipe',
  'wipe-slider', 'multi-flip', 'mega-menu', 'dual-scramble', 'radial-gallery'
];

export default function LandingClient({ animations = [], shippedRecently = 0 }) {
  let imagesOnly = useMemo(() => animations.filter(a => a.preview_image_url), [animations]);
  let imageUrls = useMemo(() => imagesOnly.map(a => a.preview_image_url), [imagesOnly]);
  
  let heroAnimations = useMemo(() => {
    let map = new Map(imagesOnly.map(a => [a.slug, a]));
    let preferred = PREFERRED_SLUGS.map(slug => map.get(slug)).filter(Boolean);
    let usedSlugs = new Set(preferred.map(a => a.slug));
    
    for (let anim of imagesOnly) {
      if (preferred.length >= 9) break;
      if (!usedSlugs.has(anim.slug)) {
        preferred.push(anim);
      }
    }
    return preferred.slice(0, 9);
  }, [imagesOnly]);

  useEffect(() => {
    if (imageUrls.length === 0) return;
    let handle = typeof requestIdleCallback === 'function'
      ? requestIdleCallback(() => preloadSharedImages(imageUrls, { maxWidth: 384 }), { timeout: 2000 })
      : setTimeout(() => preloadSharedImages(imageUrls, { maxWidth: 384 }), 1000);
    return () => {
      if (typeof cancelIdleCallback === 'function') {
        try { cancelIdleCallback(handle); } catch (e) { clearTimeout(handle); }
      } else {
        clearTimeout(handle);
      }
    };
  }, [imageUrls]);

  let cursorRef = useRef(null);
  let { addReadyGate } = useAnimation();

  useEffect(() => {
    perfLog('LandingClient mounted; holding cover on landing-fonts gate');
    let releaseGate = addReadyGate('landing-fonts');
    
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        perfLog('fonts ready -> releasing landing-fonts gate');
        releaseGate();
      });
    } else {
      releaseGate();
    }
    
    return () => releaseGate();
  }, [addReadyGate]);

  return (
    <CustomCursor ref={cursorRef}>
      <div className="landing">
        <HeroSection animations={heroAnimations} count={animations.length} pool={animations} />
        <ProblemSection />
        {}
        {}
        {}
        {}
        <LibraryPreview items={animations} count={animations.length} />
        <LogoWall images={imageUrls} />
        <Testimonials theme="dark" />
        {}
        <ValueMath cta={{ label: t('common.valueMath.ctaLanding'), href: '/pricing' }} />
        <FAQ />
        <BottomCTA images={imageUrls} bleed={true} />
      </div>
    </CustomCursor>
  );
}
