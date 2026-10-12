import React from 'react';
import AnimatedHeadline from '@/animations/shared/RevealHeadline'; 
import AnimatedText from '@/components/animations/AnimatedText';
import FadeIn from '@/animations/shared/FadeIn'; 

const SUBTEXT_ANIMATION_PROPS = {
  type: "lines",
  mask: "lines",
  duration: 0.6,
  stagger: 0.03,
  ease: "power2.out",
  animationProps: {
    yPercent: 100
  },
  triggerMode: "pageEnter"
};

export default function HeroSection({
  headline = "Every component, every framework.",
  subtext = "Production-grade GSAP animations for React, Vue, and HTML. Copy what you need, ship in minutes.",
  cta = null
}) {
  return (
    <section className="v2-container pt-128 pb-32 lg:pt-160 lg:pb-64">
      <div className="grid grid-cols-12 gap-x-24">
        <div className="col-span-12 lg:col-span-10 lg:col-start-2 lg:text-center">
          <AnimatedHeadline
            as="h1"
            sizeClass="text-h1"
            className="mx-auto max-w-[16ch]"
            trigger="pageEnter"
          >
            {headline}
          </AnimatedHeadline>
          
          <AnimatedText
            tag="p"
            className="text-body-lg mx-auto mt-32 max-w-[48ch] text-foreground-muted"
            {...SUBTEXT_ANIMATION_PROPS}
            delay={0.2}
          >
            {subtext}
          </AnimatedText>

          {cta ? (
            <FadeIn className="mt-32 flex lg:justify-center" delay={0.4}>
              {cta}
            </FadeIn>
          ) : null}
        </div>
      </div>
    </section>
  );
}
