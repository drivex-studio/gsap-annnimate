import React, { useRef } from 'react';
import gsap from 'gsap';

import { translate as t } from '@/libs/utils/i18n';
import { useReveal } from '@/hooks/useReveal';

import Button from '@/components/ui/Button'; 
import RevealHeadline from '@/animations/shared/RevealHeadline';
import AnimatedSubtext from '@/animations/components/AnimatedSubtext';

import RingBackground, { RING_SECTION_MIN_VH } from '@/components/landing/RingBackground';

const DEFAULT_HEADLINE = t("common.endCta.headline");
const DEFAULT_SUBTEXT = t("common.endCta.subtext");

const DEFAULT_PRIMARY_CTA = {
  label: t("common.endCta.primaryLabel"),
  href: "/pricing"
};

const DEFAULT_SECONDARY_CTA = {
  label: t("common.endCta.secondaryLabel"),
  href: "/animations"
};

export default function BottomCTA({
  headline = DEFAULT_HEADLINE,
  subtext = DEFAULT_SUBTEXT,
  primaryCta = DEFAULT_PRIMARY_CTA,
  secondaryCta = DEFAULT_SECONDARY_CTA,
  images = [],
  bleed = false,
  eyebrow,
  minimal = false,
  children = null
}) {
  let sectionRef = useRef(null);
  let headlineRef = useRef(null);
  let subtextRevealFn = useRef(null);

  useReveal(sectionRef, {
    mode: "scroll",
    build: () => {
      let tl = gsap.timeline({ paused: true });
      tl.call(() => headlineRef.current?.reveal?.(), [], 0);
      tl.call(() => subtextRevealFn.current?.(), [], 0.2);
      return tl;
    }
  });

  let midpoint = Math.ceil(images.length / 2);
  let leftImages = images.slice(0, midpoint);
  let rightImages = images.slice(midpoint);
  
  let shouldBleed = bleed && !minimal;
  let minHeight = minimal ? 50 : RING_SECTION_MIN_VH;
  let buttonSize = minimal ? "sm" : "default";

  return (
    <section
      ref={sectionRef}
      data-theme="dark"
      className={`end-cta relative flex items-center bg-background text-foreground ${shouldBleed ? "" : "overflow-hidden"}`}
      style={{
        minHeight: `${minHeight}vh`,
        ...(shouldBleed ? { clipPath: "inset(0 0 -100vh 0)" } : null)
      }}
    >
      <RingBackground side="left" images={leftImages.length ? leftImages : images} />
      <RingBackground side="right" images={rightImages.length ? rightImages : images} />
      <RingBackground side="center" images={images} />
      
      <div className={`v2-container relative ${minimal ? "py-96 lg:py-128" : "py-128 lg:py-200"}`}>
        <div className="grid grid-cols-12 gap-x-24">
          <div className="col-span-12 flex flex-col items-center gap-32 text-center lg:col-span-6 lg:col-start-4">
            
            {eyebrow && (
              <p className="text-mono-sm text-foreground-muted">
                {eyebrow}
              </p>
            )}
            
            <RevealHeadline
              ref={headlineRef}
              as="h2"
              trigger="manual"
              className="max-w-[18ch]"
            >
              {headline}
            </RevealHeadline>
            
            <AnimatedSubtext
              tag="p"
              className="text-body max-w-[44ch] text-foreground-muted"
              type="lines"
              mask="lines"
              duration={0.6}
              stagger={0.03}
              ease="power2.out"
              animationProps={{ yPercent: 100 }}
              triggerMode="manual"
              onReady={(playFn) => {
                subtextRevealFn.current = playFn;
              }}
            >
              {subtext}
            </AnimatedSubtext>
            
            {children ? (
              <div className="mt-8 w-full max-w-[560px] text-left">
                {children}
              </div>
            ) : (
              <div className="mt-8 flex flex-col items-center gap-16 sm:flex-row sm:gap-12">
                {primaryCta && (
                  <Button href={primaryCta.href} theme="brand" size={buttonSize}>
                    {primaryCta.label}
                  </Button>
                )}
                {secondaryCta && (
                  <Button href={secondaryCta.href} theme="surface" size={buttonSize}>
                    {secondaryCta.label}
                  </Button>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </section>
  );
}
