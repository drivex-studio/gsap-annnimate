import React, { useState, useCallback } from 'react';
import { translate as t } from '@/libs/utils/i18n';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import Button from '@/components/ui/Button';
import RevealHeadline from '@/animations/shared/RevealHeadline'; 
import AnimatedSubtext from '@/animations/components/AnimatedSubtext';
import AnimatedText from '@/animations/components/AnimatedText';
import FAQItem from '@/components/ui/FAQItem';

export default function FAQ({
  faqs = t("common.faq.items"),
  eyebrow,
  headline = t("common.faq.headline"),
  subtext = t("common.faq.subtext"),
  ctaLink = { label: t("common.faq.ctaLabel"), href: "/faq" },
  sectionId,
  inset = false
}) {
  let [openIndex, setOpenIndex] = useState(null);
  let isDesktop = useBreakpoint("lg");

  let handleToggle = useCallback((index) => {
    setOpenIndex((prevIndex) => (prevIndex === index ? null : index));
  }, []);

  let schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a
      }
    }))
  };

  return (
    <section id={sectionId} data-theme="light" className="faq relative bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      
      <div className="v2-container py-96 lg:py-128">
        <div className={inset ? "grid grid-cols-12 gap-x-24" : "contents"}>
          <div className={inset ? "col-span-12 lg:col-span-10 lg:col-start-2" : "contents"}>
            
            <div className="grid grid-cols-12 gap-x-24 gap-y-64">
              
              <div className="col-span-12 lg:col-span-4 lg:col-start-1 lg:sticky lg:top-96 lg:self-start">
                {eyebrow ? (
                  <AnimatedSubtext
                    tag="p"
                    className="text-mono-sm mb-24 text-foreground-muted"
                    type="lines"
                    mask="lines"
                    duration={0.6}
                    stagger={0.03}
                    ease="power2.out"
                    animationProps={{ yPercent: 100 }}
                    triggerMode="scroll"
                  >
                    {eyebrow}
                  </AnimatedSubtext>
                ) : null}
                
                <RevealHeadline as="h2" trigger="scroll" className="max-w-[14ch]">
                  {headline}
                </RevealHeadline>
                
                <div className="mt-24">
                  <AnimatedSubtext
                    tag="p"
                    className="text-body max-w-[34ch] text-foreground-muted"
                    type="lines"
                    mask="lines"
                    duration={0.6}
                    stagger={0.03}
                    ease="power2.out"
                    animationProps={{ yPercent: 100 }}
                    triggerMode="scroll"
                  >
                    {subtext}
                  </AnimatedSubtext>
                </div>
                
                {ctaLink ? (
                  <div className="mt-32 hidden lg:flex">
                    <Button href={ctaLink.href} theme="brand" size="sm">
                      {ctaLink.label}
                    </Button>
                  </div>
                ) : null}
              </div>
              
              <div className="col-span-12 lg:col-span-7 lg:col-start-7">
                <AnimatedText trigger="scroll" stagger={0.06} y={20} className="w-full">
                  {faqs.map((faq, index) => (
                    <FAQItem
                      key={faq.q}
                      q={faq.q}
                      a={faq.a}
                      isOpen={openIndex === index}
                      onToggle={() => handleToggle(index)}
                      isDesktop={isDesktop}
                    />
                  ))}
                </AnimatedText>
                
                {ctaLink ? (
                  <div className="mt-32 flex lg:hidden">
                    <Button href={ctaLink.href} theme="brand" size="sm">
                      {ctaLink.label}
                    </Button>
                  </div>
                ) : null}
              </div>
              
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
