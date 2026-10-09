"use client";
import React, { useState } from 'react';

import { translate } from '@/libs/utils/i18n';
import { useTransitionRouter } from '@/providers/TransitionRouterProvider'; // module id: 676040

import Button from '@/components/ui/Button'; // module id: 687989
import AnimatedSubtext from '@/animations/components/AnimatedSubtext'; // module id: 218091
import AnimatedHeadline from '@/animations/components/AnimatedHeadline'; // module id: 963160

import PricingToggle from '@/components/pricing/PricingToggle'; // module id: 821980
import PricingCard from '@/components/pricing/PricingCard'; // module id: 199155
import PricingFeatures from '@/components/pricing/PricingFeatures'; // module id: 468463

import ServerData from '@/libs/auth/data/ServerData'; // module id: 516799

const LANDING_PLANS = ServerData.stripe.landingPlans; // original mangled: eR

// module id: (exported implicitly as part of 377090)
export default function PricingSection({ shippedRecently = 0 }) { // original mangled: eM
  let [cycle, setCycle] = useState('quarterly'); // original mangled: s, l
  let router = useTransitionRouter(); // original mangled: i
  
  let handleCheckout = (planId) => { // original mangled: o
    router.push(`/checkout?plan=${planId}&cycle=${cycle}`);
  };

  return (
    <section id="pricing" data-theme="light" className="pricing relative bg-background text-foreground">
      <div className="v2-container py-96 lg:py-128">
        <div className="grid grid-cols-12 gap-x-24 gap-y-32">
          
          <div className="col-span-12 flex flex-col items-center gap-32 text-center lg:col-span-8 lg:col-start-3">
            <AnimatedHeadline as="h2" trigger="scroll">
              {t('landing.pricingSection.headline')}
            </AnimatedHeadline>
            <AnimatedSubtext
              tag="p"
              className="text-body max-w-[58ch] text-foreground-muted"
              type="lines"
              mask="lines"
              duration={0.6}
              stagger={0.03}
              ease="power2.out"
              animationProps={{ yPercent: 100 }}
              triggerMode="scroll"
            >
              {t('landing.pricingSection.subhead')}
            </AnimatedSubtext>
            <PricingToggle cycle={cycle} onChange={setCycle} />
          </div>
          
          <div className="col-span-12 grid grid-cols-1 gap-x-24 gap-y-24 lg:col-span-10 lg:col-start-2 lg:grid-cols-3">
            {LANDING_PLANS.map((plan) => (
              <PricingCard
                key={plan.key}
                plan={plan}
                cycle={cycle}
                onCheckout={handleCheckout}
                shippedRecently={shippedRecently}
              />
            ))}
            <PricingFeatures className="lg:col-span-3" />
          </div>
          
          <div className="col-span-12 mt-16 flex justify-center">
            <Button href="/pricing" theme="brand" size="sm">
              {t('landing.pricingSection.bottomCta')}
            </Button>
          </div>
          
        </div>
      </div>
    </section>
  );
}
