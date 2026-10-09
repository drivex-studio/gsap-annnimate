import React from 'react';
import { translate } from '@/libs/utils/i18n';
import RevealHeadline from '@/animations/shared/RevealHeadline'; 
import AnimatedSubtext from '@/animations/components/AnimatedSubtext'; 
import NewsletterForm from '@/components/ui/NewsletterEyebrow'; 

export default function StarterPackSection({
  source = "homepage",
  idPrefix = "homepage",
  theme = "light"
}) {
  return (
    <section data-theme={theme} className="bg-background text-foreground">
      <div className="v2-container py-96 lg:py-160">
        <div className="mx-auto flex max-w-[640px] flex-col items-center gap-16 text-center">
          
          <RevealHeadline as="h2" sizeClass="text-h2" trigger="scroll" className="font-medium">
            {translate("common.starterPack.headline")}
          </RevealHeadline>
          
          <AnimatedSubtext triggerMode="scroll" className="text-body max-w-[44ch] leading-relaxed text-foreground-muted">
            {translate("common.starterPack.body")}
          </AnimatedSubtext>
          
          <div className="mt-16 w-full max-w-[36rem] text-left">
            <NewsletterForm
              source={source}
              idPrefix={idPrefix}
              buttonLabel={translate("common.starterPack.buttonLabel")}
              inputSize="lg"
            />
          </div>
          
        </div>
      </div>
    </section>
  );
}
