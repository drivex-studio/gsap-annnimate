'use client'

import { useCallback, useMemo, useState } from 'react';
import { getAnmApiName, getPrimaryAttribute } from '@/libs/utils/CONFIGURABLES';
import { t } from '@/libs/utils/i18n';
import RevealHeadline from '@/animations/shared/RevealHeadline';
import AnimatedText from '@/animations/components/AnimatedText';
import AnimationPreview from '@/components/common/AnimationPreview';
import Customizer from '@/components/common/Customizer';
import { HtmlCssIcon } from '@/assets/icons/HtmlCssIcon';
import { ReactIcon } from '@/assets/icons/ReactIcon';
import { VueIcon } from '@/assets/icons/VueIcon';
import AnimatedButton from '@/animations/components/AnimatedButton';
import NavLink from '@/components/navigation/NavLink';

const SPOTLIGHT_TEXT_PROPS = {
  type: 'lines',
  mask: 'lines',
  duration: 0.6,
  stagger: 0.03,
  ease: 'power2.out',
  animationProps: { yPercent: 100 },
};

const FORMAT_OPTIONS = [
  { key: 'html', label: 'HTML', Icon: HtmlCssIcon },
  { key: 'react', label: 'React', Icon: ReactIcon },
  { key: 'vue', label: 'Vue', Icon: VueIcon },
];

export default function HomeV3Spotlight({ animation, controls, formats = [], count = 0 }) {
  const [values, setValues] = useState({});
  const [committed, setCommitted] = useState({});

  const primaryAttribute = useMemo(() => getPrimaryAttribute(animation), [animation]);
  const apiName = useMemo(() => getAnmApiName(animation.slug), [animation.slug]);

  const handleChange = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCommit = useCallback((key, value) => {
    setCommitted((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setValues({});
    setCommitted({});
  }, []);

  const activeFormats = FORMAT_OPTIONS.filter((formatItem) => formats.includes(formatItem.key));

  return (
    <section data-theme="dark" className="bg-background pt-128 pb-64 text-foreground lg:pt-192 lg:pb-96">
      <div className="v2-container">
        <div className="grid grid-cols-12 gap-x-24 gap-y-24">
          <div className="relative col-span-12 aspect-[16/10] bg-background lg:col-span-8 lg:row-span-3 lg:aspect-auto">
            <div className="absolute inset-0">
              <AnimationPreview
                animation={animation}
                bare
                fill
                customize={{
                  values,
                  committed,
                  selector: `[${primaryAttribute}]`,
                  api: apiName,
                }}
              />
            </div>
          </div>

          <div className="col-span-12 flex flex-col gap-12 bg-background p-24 lg:col-span-4 lg:p-32">
            <RevealHeadline as="h2" sizeClass="text-h3" className="font-medium" trigger="scroll">
              {animation.title}
            </RevealHeadline>

            <AnimatedText
              tag="p"
              className="text-body text-foreground-muted"
              {...SPOTLIGHT_TEXT_PROPS}
              triggerMode="scroll"
              delay={0.25}
            >
              {t('home-v3.spotlight.line')}
            </AnimatedText>

            <NavLink href={`/animations/${animation.slug}`} inline className="text-body-sm self-start">
              {t('home-v3.spotlight.open')}
            </NavLink>
          </div>

          <div className="col-span-12 bg-background p-24 lg:col-span-4 lg:p-32">
            <Customizer
              animation={animation}
              only={controls}
              values={values}
              onChange={handleChange}
              onCommit={handleCommit}
              onReset={handleReset}
            />
          </div>

          <div className="col-span-12 flex items-center justify-between gap-16 bg-background p-24 lg:col-span-4 lg:p-32">
            <div className="flex items-center gap-12">
              <p className="text-body-sm text-foreground-muted">{t('home-v3.spotlight.formats')}</p>

              <span
                aria-label={activeFormats.map((formatItem) => formatItem.label).join(', ')}
                className="flex items-center gap-12 text-foreground"
              >
                {activeFormats.map(({ key, Icon }) => (
                  <span key={key} aria-hidden="true" className="flex size-20 items-center justify-center">
                    <Icon />
                  </span>
                ))}
              </span>
            </div>

            <AnimatedButton href="/animations" theme="brand" size="sm">
              {t('home-v3.spotlight.browse', { count })}
            </AnimatedButton>
          </div>
        </div>
      </div>
    </section>
  );
}
