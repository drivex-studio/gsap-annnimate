import { t } from '@/libs/utils/i18n';

import RevealHeadline from '@/animations/shared/RevealHeadline';
import AnimatedText from '@/animations/components/AnimatedText';
import NewsletterFrom from '@/components/ui/NewsletterEyebrow';

export function StarterPackSection({
  source = 'homepage',
  idPrefix = 'homepage',
  theme = 'light',
  illustration = null,
  alignToForm = false,
  background = null,
  panel = false,
  body = null,
  after = null,
}) {
  let containerWidthClass = 'max-w-[640px]';
  if (panel) {
    containerWidthClass = 'max-w-[calc(36rem+112px)] border border-foreground/15 bg-background px-24 py-40 lg:px-56 lg:py-56';
  } else if (alignToForm) {
    containerWidthClass = 'max-w-[36rem]';
  }

  return (
    <section data-theme={theme} className="relative overflow-hidden bg-background text-foreground">
      {background}

      <div className="v2-container relative py-96 lg:py-160">
        <div className={`mx-auto flex flex-col items-center gap-16 text-center ${containerWidthClass}`}>
          {illustration ? <div className="mb-16 w-full">{illustration}</div> : null}

          <RevealHeadline as="h2" sizeClass="text-h2" trigger="scroll" className="font-medium">
            {t('common.starterPack.headline')}
          </RevealHeadline>

          <AnimatedText
            triggerMode="scroll"
            className={`text-body leading-relaxed text-foreground-muted ${alignToForm ? 'w-full' : 'max-w-[44ch]'}`}
          >
            {body ?? t('common.starterPack.body')}
          </AnimatedText>

          <div className="mt-16 w-full max-w-[36rem] text-left">
            <NewsletterFrom
              source={source}
              idPrefix={idPrefix}
              buttonLabel={t('common.starterPack.buttonLabel')}
              inputSize="lg"
            />
          </div>

          {after}
        </div>
      </div>
    </section>
  );
}
