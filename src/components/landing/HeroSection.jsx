import React from 'react';

import { translate as t } from '@/libs/utils/i18n';
import Button from '@/components/ui/Button'; // module id: 687989
import AnimatedSubtext from '@/animations/components/AnimatedSubtext'; // module id: 218091
import AnimatedText from '@/animations/components/AnimatedText'; // module id: 460391
import AnimationsFilterBar from '@/animations/components/AnimationsFilterBar'; // module id: 572332
import LandingLogos from './LandingLogos';

const ANIMATION_PROPS = {
  type: 'lines',
  mask: 'lines',
  duration: 0.6,
  stagger: 0.03,
  ease: 'power2.out',
  animationProps: { yPercent: 100 },
  triggerMode: 'pageEnter'
};

export default function HeroSection({ animations = [], count = 0, pool = [] }) {
  return (
    <section data-theme="dark" className="relative overflow-hidden bg-background pt-96 pb-0 text-foreground lg:pt-160">
      <div className="v2-container">
        <div className="grid grid-cols-12 items-end gap-x-24 gap-y-40 lg:gap-x-32">
          <div className="col-span-12 lg:col-span-7">
            <h1 className="text-h1 hero-headline font-medium">
              {t('landing.hero.headlineLine1')}
              <br />
              {t('landing.hero.headlineLine2')}
            </h1>
            <AnimatedSubtext
              tag="p"
              className="text-body-lg mt-24 max-w-[42rem] text-foreground-muted"
              {...ANIMATION_PROPS}
              delay={0.15}
            >
              {t('landing.hero.sub', { count })}
            </AnimatedSubtext>
            <AnimatedText className="mt-32" delay={0.3}>
              <div className="flex flex-wrap items-center gap-24">
                <Button href="/animations" theme="brand" size="sm">
                  {t('landing.hero.ctaPrimary', { count })}
                </Button>
                <Button href="/starter-pack" theme="surface" size="sm">
                  {t('landing.hero.ctaSecondary')}
                </Button>
              </div>
              <p className="text-body-sm mt-16 text-foreground-muted">
                {t('landing.hero.ctaNote')}
              </p>
            </AnimatedText>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:col-start-9">
            <AnimatedSubtext
              tag="p"
              className="text-body-lg max-w-[26ch] font-medium text-foreground"
              type="lines"
              mask="lines"
              duration={0.6}
              stagger={0.04}
              ease="power2.out"
              animationProps={{ yPercent: 100 }}
              triggerMode="pageEnter"
              delay={0.35}
            >
              {t('landing.provenance.line')}
            </AnimatedSubtext>
            <LandingLogos className="mt-24 lg:mt-32" trigger="pageEnter" delay={0.4} />
          </div>
        </div>
      </div>
      <div className="relative mt-40 mb-[-80px] lg:mt-80 lg:mb-[-120px]">
        <div className="v2-container">
          {animations.length > 0 && (
            <AnimationsFilterBar
              animations={animations}
              totalCount={count}
              revealOnPageEnter={true}
              filterBarDemo={true}
              filterPool={pool}
            />
          )}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[560px] lg:h-[820px]"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, var(--background) 90%)' }}
        />
      </div>
    </section>
  );
}
