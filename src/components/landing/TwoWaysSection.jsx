"use client";
import React, { useMemo } from 'react';
import { translate } from '@/libs/utils/i18n';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import Button from '@/components/ui/Button';
import AnimatedText from '@/animations/components/AnimatedText';
import AnimatedHeadline from '@/animations/components/AnimatedHeadline';
import ImageGrid from '@/components/ui/ImageCarousel';
import VideoLabelOverlay from '@/components/ui/VideoLabelOverlay';
import ServerData from '@/libs/auth/data/ServerData';

const FALLBACK_TOTAL_COUNT = ServerData?.animationStats?.totalCount ?? 50;

const LAYOUT_DESKTOP = { cardW: 320, cardH: 180, gap: 48, offsetX: 184 };
const LAYOUT_MOBILE = { cardW: 200, cardH: 112, gap: 24, offsetX: 112 };

const ANIMATION_PROPS = {
  type: 'lines',
  mask: 'lines',
  duration: 0.6,
  stagger: 0.03,
  ease: 'power2.out',
  animationProps: { yPercent: 100 },
  triggerMode: 'scroll'
};

export default function TwoWaysSection({ images = [], animations = [], cursorRef = null }) {
  let totalCount = animations.length || FALLBACK_TOTAL_COUNT;
  let isDesktop = useBreakpoint('lg');

  let shuffledImages = useMemo(() => {
    if (images.length === 0) return [];
    let result = [...images];
    for (let i = result.length - 1; i > 0; i--) {
      let j = (9301 * i + 49297) % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }, [images]);

  return (
    <section data-theme="light" className="two-ways relative bg-background py-96 text-foreground lg:py-128">
      <div className="v2-container">
        <header className="mb-64 max-w-[60ch] lg:mb-96">
          <AnimatedHeadline as="h2" className="max-w-[18ch]" trigger="scroll">
            {translate('landing.twoWays.headline')}
          </AnimatedHeadline>
          <AnimatedSubtext tag="p" className="text-body-lg mt-24 max-w-[52ch] text-foreground-muted" {...ANIMATION_PROPS}>
            {translate('landing.twoWays.body')}
          </AnimatedSubtext>
        </header>
        
        <div className="grid grid-cols-12 gap-24 lg:gap-32">
          <article className="col-span-12 flex flex-col overflow-hidden bg-surface text-foreground lg:col-span-7">
            <div className="relative h-[280px] w-full overflow-hidden bg-surface lg:h-[480px]">
              {shuffledImages.length > 0 ? (
                <ImageGrid images={shuffledImages} cursorRef={cursorRef} layout={isDesktop ? LAYOUT_DESKTOP : LAYOUT_MOBILE} />
              ) : (
                <div className="absolute inset-0 bg-background-muted" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-20 p-24 lg:p-32">
              <div className="flex flex-wrap items-baseline justify-between gap-16">
                <h3 className="text-h4 m-0">{translate('landing.twoWays.libraryTitle')}</h3>
                <span className="text-mono-sm text-foreground-muted">{translate('landing.twoWays.libraryMeta', { count: totalCount })}</span>
              </div>
              <p className="text-body m-0 max-w-[52ch] text-foreground-muted">{translate('landing.twoWays.libraryBody')}</p>
              <div className="mt-auto inline-flex pt-12">
                <Button href="/animations" theme="light" size="sm">{translate('landing.twoWays.libraryCta')}</Button>
              </div>
            </div>
          </article>
          
          <article className="col-span-12 flex flex-col overflow-hidden bg-surface text-foreground lg:col-span-5">
            <div className="relative h-[280px] w-full overflow-hidden lg:h-[480px]">
              <VideoLabelOverlay className="h-full w-full" label="The Menu Kit showreel" />
            </div>
            <div className="flex flex-1 flex-col gap-20 p-24 lg:p-32">
              <div className="flex flex-wrap items-baseline justify-between gap-16">
                <h3 className="text-h4 m-0">{translate('landing.twoWays.kitTitle')}</h3>
                <span className="text-mono-sm text-foreground-muted">{translate('landing.twoWays.kitMeta')}</span>
              </div>
              <p className="text-body m-0 max-w-[52ch] text-foreground-muted">{translate('landing.twoWays.kitBody')}</p>
              <div className="mt-auto inline-flex pt-12">
                <Button href="/kits/menu" theme="brand" size="sm">{translate('landing.twoWays.kitCta')}</Button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
