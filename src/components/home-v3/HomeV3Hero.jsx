'use client'

import { useCallback, useRef } from 'react';
import gsap from 'gsap';

import { PUNCH } from '@/components/common/iso';
import { t } from '@/libs/utils/i18n';
import RevealHeadline from '@/animations/shared/RevealHeadline';
import AnimatedText from '@/animations/components/AnimatedText';
import RevealFade from '@/animations/shared/RevealFade';
import Button from '@/components/ui/Button';
import CascadeCarousel from '@/components/globe/CascadeCarousel';
import { useReveal } from '@/animations/hooks/useReveal';
import { BrandLogos } from '@/components/home-v3/BrandLogos';

const SUBTEXT_ANIMATION_PROPS = {
  type: 'lines',
  mask: 'lines',
  duration: 0.6,
  stagger: 0.03,
  ease: 'power2.out',
  animationProps: { yPercent: 100 },
  triggerMode: 'pageEnter',
};

export default function HomeV3Hero({ items = [], freeCount = 0 }) {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const headerGroupRef = useRef(null);
  const showcaseWrapRef = useRef(null);
  const introCallbackRef = useRef(null);

  const handleIntro = useCallback((introFn) => {
    introCallbackRef.current = introFn;
  }, []);

  useReveal(sectionRef, {
    mode: 'hero',
    build: () => {
      const contentEl = contentRef.current;

      const syncCenterOffset = () => {
        const sectionRect = sectionRef.current.getBoundingClientRect();
        const headerRect = headerGroupRef.current.getBoundingClientRect();
        const currentY = Number(gsap.getProperty(contentEl, 'y')) || 0;

        gsap.set(contentEl, {
          y: sectionRect.top + sectionRect.height / 2 - (headerRect.top - currentY + headerRect.height / 2),
        });
      };

      syncCenterOffset();

      return gsap
        .timeline({ paused: true })
        .call(syncCenterOffset, null, 0)
        .to(contentEl, { y: 0, duration: 1.1, ease: PUNCH }, 0.4)
        .fromTo(
          showcaseWrapRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.3, ease: 'power2.out' },
          0.4 + 0.55
        )
        .call(() => introCallbackRef.current?.(), null, 0.4 + 0.55);
    },
  });

  return (
    <section
      ref={sectionRef}
      data-theme="dark"
      className="relative flex h-svh min-h-[680px] flex-col overflow-hidden bg-background pt-112 text-foreground lg:pt-136"
    >
      <div ref={contentRef} className="v2-container relative z-10 shrink-0 text-center">
        <div ref={headerGroupRef}>
          <RevealHeadline
            as="h1"
            sizeClass="text-h1"
            className="hero-headline mx-auto max-w-[22ch] font-medium text-balance"
            trigger="pageEnter"
          >
            {t('home-v3.hero.headline')}
          </RevealHeadline>

          <AnimatedText
            tag="p"
            className="text-body-lg mx-auto mt-24 max-w-[46rem] text-foreground-muted"
            {...SUBTEXT_ANIMATION_PROPS}
            delay={0.4}
          >
            {t('home-v3.hero.sub')}
          </AnimatedText>

          <RevealFade className="mt-32 flex flex-wrap items-center justify-center gap-12" delay={0.55}>
            <Button href="/checkout?plan=solo&cycle=quarterly" theme="brand">
              {t('home-v3.hero.cta')}
            </Button>
            <Button href="/starter-pack" theme="surface">
              {t('home-v3.hero.ctaFree', { count: freeCount })}
            </Button>
          </RevealFade>
        </div>

        <div className="mt-32 flex flex-wrap items-center justify-center gap-x-24 gap-y-12 lg:mt-40">
          <RevealFade as="p" className="text-body-sm text-foreground-muted" delay={0.7}>
            {t('home-v3.hero.logosLabel')}
          </RevealFade>
          <BrandLogos className="justify-center" trigger="pageEnter" delay={0.73} />
        </div>
      </div>

      <div ref={showcaseWrapRef} className="invisible mt-16 min-h-0 flex-1 lg:mt-24">
        <CascadeCarousel items={items} onIntro={handleIntro} />
      </div>
    </section>
  );
}
