import React, { useRef } from 'react';
import gsap from 'gsap'; // module id: 989970

import { translate as t } from '@/libs/utils/i18n';
import { useReveal } from '@/hooks/useReveal'; // module id: 228414

import Button from '@/components/ui/Button'; 
import RevealHeadline from '@/animations/shared/RevealHeadline'; // module id: 963160
import AnimatedSubtext from '@/animations/components/AnimatedSubtext'; // module id: 218091


import RingBackground, { RING_SECTION_MIN_VH } from '@/components/landing/RingBackground'; // module id: 809214

const DEFAULT_HEADLINE = t("common.endCta.headline"); // original mangled: c
const DEFAULT_SUBTEXT = t("common.endCta.subtext"); // original mangled: h

const DEFAULT_PRIMARY_CTA = { // original mangled: d
  label: t("common.endCta.primaryLabel"),
  href: "/pricing"
};

const DEFAULT_SECONDARY_CTA = { // original mangled: m
  label: t("common.endCta.secondaryLabel"),
  href: "/animations"
};

// module id: 482232
export default function BottomCTA({
  headline = DEFAULT_HEADLINE, // original mangled: e
  subtext = DEFAULT_SUBTEXT, // original mangled: u
  primaryCta = DEFAULT_PRIMARY_CTA, // original mangled: f
  secondaryCta = DEFAULT_SECONDARY_CTA, // original mangled: g
  images = [], // original mangled: p
  bleed = false, // original mangled: v
  eyebrow, // original mangled: x
  minimal = false, // original mangled: E
  children = null // original mangled: y
}) {
  let sectionRef = useRef(null); // original mangled: A
  let headlineRef = useRef(null); // original mangled: H
  let subtextRevealFn = useRef(null); // original mangled: M

  useReveal(sectionRef, {
    mode: "scroll",
    build: () => {
      let tl = gsap.timeline({ paused: true });
      tl.call(() => headlineRef.current?.reveal?.(), [], 0);
      tl.call(() => subtextRevealFn.current?.(), [], 0.2);
      return tl;
    }
  });

  let midpoint = Math.ceil(images.length / 2); // original mangled: w
  let leftImages = images.slice(0, midpoint); // original mangled: b
  let rightImages = images.slice(midpoint); // original mangled: V
  
  let shouldBleed = bleed && !minimal; // original mangled: C
  let minHeight = minimal ? 50 : RING_SECTION_MIN_VH; // original mangled: Z
  let buttonSize = minimal ? "sm" : "default"; // original mangled: L

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
