import { t } from '@/libs/utils/i18n';

import RevealHeadline from '@/animations/shared/RevealHeadline';
import AnimatedText from '@/animations/components/AnimatedText';
import { ShippedCascade } from '@/components/common/ShippedCascade';

const SUBTEXT_ANIMATION_PROPS = {
  type: 'lines',
  mask: 'lines',
  duration: 0.6,
  stagger: 0.03,
  ease: 'power2.out',
  animationProps: { yPercent: 100 },
};

export default function HomeV3Shipped({
  items = [],
  count = 0,
  headline,
  line,
  theme = 'dark',
}) {
  return (
    <section data-theme={theme} className="overflow-hidden bg-background py-96 text-foreground lg:py-160">
      <div className="v2-container flex flex-col gap-16">
        <RevealHeadline as="h2" sizeClass="text-h2" className="font-medium" trigger="scroll">
          {headline ?? t('home-v3.shipped.headline')}
        </RevealHeadline>

        <AnimatedText
          tag="p"
          className="text-body-lg max-w-[40rem] text-foreground-muted"
          {...SUBTEXT_ANIMATION_PROPS}
          triggerMode="scroll"
          delay={0.25}
        >
          {line ?? t('home-v3.shipped.line', { count })}
        </AnimatedText>
      </div>

      <div className="v2-container">
        <ShippedCascade items={items} className="mt-96 lg:mt-176" />
      </div>
    </section>
  );
}

export { ShippedCascade };
