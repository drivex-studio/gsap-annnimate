'use client';

import { useRef, useCallback } from 'react';
import gsap from 'gsap';
import { PUNCH } from '@/components/common/iso';
import { t } from '@/libs/utils/i18n';
import { useReveal } from '@/animations/hooks/useReveal';
import AnimatedButton from '@/animations/components/AnimatedButton';
import AnimatedText from '@/animations/components/AnimatedText';
import RevealHeadline from '@/animations/shared/RevealHeadline';
import RevealFade from '@/animations/shared/RevealFade';
import CascadeCarousel from '@/components/globe/CascadeCarousel';
import BrandLogos from '@/components/ui/BrandLogos';

const SUBTEXT_ANIMATION_PROPS = {
  type: 'lines',
  mask: 'lines',
  duration: 0.6,
  stagger: 0.03,
  ease: 'power2.out',
  animationProps: {
    yPercent: 100,
  },
  triggerMode: 'pageEnter',
};

export default function HomeV3Hero({ items = [], freeCount = 0 }) {
  const sectionRef = useRef(null);
  const headerContainerRef = useRef(null);
  const heroCopyRef = useRef(null);
  const showcaseWrapperRef = useRef(null);
  const introCallbackRef = useRef(null);

  const handleIntroReady = useCallback((callback) => {
    introCallbackRef.current = callback;
  }, []);

  useReveal(sectionRef, {
    mode: 'hero',
    build: () => {
      const headerEl = headerContainerRef.current;

      const centerHeroCopy = () => {
        const sectionRect = sectionRef.current.getBoundingClientRect();
        const copyRect = heroCopyRef.current.getBoundingClientRect();
        const currentY = Number(gsap.getProperty(headerEl, 'y')) || 0;

        gsap.set(headerEl, {
          y:
            sectionRect.top +
            sectionRect.height / 2 -
            (copyRect.top - currentY + copyRect.height / 2),
        });
      };

      centerHeroCopy();

      return gsap
        .timeline({ paused: true })
        .call(centerHeroCopy, null, 0)
        .to(
          headerEl,
          {
            y: 0,
            duration: 1.1,
            ease: PUNCH,
          },
          0.4
        )
        .fromTo(
          showcaseWrapperRef.current,
          {
            autoAlpha: 0,
          },
          {
            autoAlpha: 1,
            duration: 0.3,
            ease: 'power2.out',
          },
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
      <div
        ref={headerContainerRef}
        className="v2-container relative z-10 shrink-0 text-center"
      >
        <div ref={heroCopyRef}>
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
          <RevealFade
            className="mt-32 flex flex-wrap items-center justify-center gap-12"
            delay={0.55}
          >
            <AnimatedButton
              href="/checkout?plan=solo&cycle=quarterly"
              theme="brand"
            >
              {t('home-v3.hero.cta')}
            </AnimatedButton>
            <AnimatedButton href="/starter-pack" theme="surface">
              {t('home-v3.hero.ctaFree', { count: freeCount })}
            </AnimatedButton>
          </RevealFade>
        </div>
        <div className="mt-32 flex flex-wrap items-center justify-center gap-x-24 gap-y-12 lg:mt-40">
          <RevealFade
            as="p"
            className="text-body-sm text-foreground-muted"
            delay={0.7}
          >
            {t('home-v3.hero.logosLabel')}
          </RevealFade>
          <BrandLogos
            className="justify-center"
            trigger="pageEnter"
            delay={0.73}
          />
        </div>
      </div>
      <div
        ref={showcaseWrapperRef}
        className="invisible mt-16 min-h-0 flex-1 lg:mt-24"
      >
        <CascadeCarousel items={items} onIntro={handleIntroReady} />
      </div>
    </section>
  );
}
