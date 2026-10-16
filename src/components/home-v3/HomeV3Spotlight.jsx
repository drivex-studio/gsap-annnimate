'use client'

import { useCallback, useMemo, useState } from 'react'; // module id: 271645

import { getAnmApiName, getPrimaryAttribute } from '@/libs/utils/CONFIGURABLES'; // module id: 726368
import { t } from '@/libs/utils/i18n'; // module id: 398682

import AnimationPreview from '@/components/common/AnimationPreview'; // module id: 113861
import AnimationControls from '@/components/common/AnimationControls'; // module id: 135178
import Button from '@/animations/components/AnimatedButton';

import Link from '@/components/navigation/NavLink';
import AnimatedHeadline from '@/animations/shared/RevealHeadline';
import AnimatedText from '@/animations/components/AnimatedText'; // module id: 218091

import { ReactIcon } from '@/assets/icons/ReactIcon'; // module id: 989080
import { VueIcon } from '@/assets/icons/VueIcon'; // module id: 667024
import { HtmlCssIcon } from '@/assets/icons/HtmlCssIcon'; // module id: 514162

// Original JSX runtime module id: 843476.
// JSX runtime import omitted because the source has been reconstructed as JSX.

// TODO: Restore the original side-effect import for module id 988051.
// Its source name and import path are not available in the supplied bundle.

// Identifier mapping: f -> spotlightTextAnimation, p -> formatOptions.
const spotlightTextAnimation = {
  type: 'lines',
  mask: 'lines',
  duration: 0.6,
  stagger: 0.03,
  ease: 'power2.out',
  animationProps: {
    yPercent: 100,
  },
};

const formatOptions = [
  {
    key: 'html',
    label: 'HTML',
    Icon: HtmlCssIcon,
  },
  {
    key: 'react',
    label: 'React',
    Icon: ReactIcon,
  },
  {
    key: 'vue',
    label: 'Vue',
    Icon: VueIcon,
  },
];

// module id: 790010
// Derived export name: SpotlightSection.
// The original bundle uses an anonymous default-exported function.
export default function SpotlightSection({
  animation,
  controls,
  formats = [],
  count = 0,
}) {
  // Identifier mapping:
  // g -> values, v -> setValues,
  // x -> committed, C -> setCommitted,
  // M -> primaryAttribute, w -> apiName,
  // b -> handleChange, y -> handleCommit,
  // H -> handleReset, E -> visibleFormats.

  const [values, setValues] = useState({});
  const [committed, setCommitted] = useState({});

  const primaryAttribute = useMemo(
    () => getPrimaryAttribute(animation),
    [animation]
  );

  const apiName = useMemo(
    () => getAnmApiName(animation.slug),
    [animation.slug]
  );

  const handleChange = useCallback((key, value) => {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  }, []);

  const handleCommit = useCallback((key, value) => {
    setCommitted((currentCommitted) => ({
      ...currentCommitted,
      [key]: value,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setValues({});
    setCommitted({});
  }, []);

  const visibleFormats = formatOptions.filter((format) =>
    formats.includes(format.key)
  );

  return (
    <section
      data-theme="dark"
      className="bg-background pt-128 pb-64 text-foreground lg:pt-192 lg:pb-96"
    >
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
            <AnimatedHeadline
              as="h2"
              sizeClass="text-h3"
              className="font-medium"
              trigger="scroll"
            >
              {t('home-v3.spotlight.headline')}
            </AnimatedHeadline>

            <AnimatedText
              tag="p"
              className="text-body text-foreground-muted"
              {...spotlightTextAnimation}
              triggerMode="scroll"
              delay={0.25}
            >
              {t('home-v3.spotlight.line', {
                title: animation.title,
              })}
            </AnimatedText>

            <Link
              href={`/animations/${animation.slug}`}
              inline
              className="text-body-sm self-start"
            >
              {t('home-v3.spotlight.open')}
            </Link>
          </div>

          <div className="col-span-12 bg-background p-24 lg:col-span-4 lg:p-32">
            <AnimationControls
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
              <p className="text-body-sm text-foreground-muted">
                {t('home-v3.spotlight.formats')}
              </p>

              <span
                aria-label={visibleFormats
                  .map((format) => format.label)
                  .join(', ')}
                className="flex items-center gap-12 text-foreground"
              >
                {visibleFormats.map(({ key, Icon }) => (
                  <span
                    key={key}
                    aria-hidden="true"
                    className="flex size-20 items-center justify-center"
                  >
                    <Icon />
                  </span>
                ))}
              </span>
            </div>

            <Button
              href="/animations"
              theme="brand"
              size="sm"
            >
              {t('home-v3.spotlight.browse', { count })}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
