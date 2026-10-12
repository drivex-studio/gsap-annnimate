import React, { useState, useEffect, useRef } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { analytics } from '@/libs/utils/analytics';

import { parseFirstTouch, KIT_TOUCH_COOKIE } from '@/libs/auth/serialize';
import ServerData, { effectiveCyclePrice } from '@/libs/auth/data/ServerData';
import { TESTIMONIALS } from '@/libs/auth/data/TestimonialsData';

import { Lock } from '@phosphor-icons/react'; 
import NewsletterForm from '@/components/ui/NewsletterEyebrow';
import ReturnSubscriberWall from '@/components/paywall/ReturnSubscriberWall';
import Button from '@/components/ui/Button';
import NavLink from '@/components/navigation/NavLink';
import FreeChip from '@/components/ui/FreeChip';
import StarterPackThumbs from '@/components/paywall/StarterPackThumbs';

function LockIcon() {
  return (
    <span className="flex size-32 items-center justify-center border border-foreground/15 bg-background">
      <Lock size={14} className="text-foreground-muted" />
    </span>
  );
}

export default function PaywallBlock({
  animation,
  isAuthenticated = false,
  starterPack = null,
  trackShown = true,
  showCheckout = true
}) {
  let isLg = useBreakpoint("lg");
  let animName = animation?.title || animation?.name || "this component";
  let animSlug = animation?.slug;
  let isFreePreview = !!animation?.is_free_preview;
  
  let displayCount = ServerData.animationStats?.displayCount || "100+";
  let soloPlan = ServerData.stripe?.landingPlans?.find(p => p.key === "solo");
  let soloPrice = effectiveCyclePrice(soloPlan?.quarterly);
  
  let checkoutUrl = `/checkout?plan=solo&cycle=quarterly${animSlug ? `&component=${animSlug}` : ""}`;
  let unlockLabel = soloPrice ? `Unlock everything - €${soloPrice}/mo` : "Unlock everything";
  
  let showNewsletterWall = isLg && !isAuthenticated;
  let [isReturnSubscriber, setIsReturnSubscriber] = useState(false);

  useEffect(() => {
    setIsReturnSubscriber(!!(function() {
      if (typeof document === "undefined") return null;
      let touchCookie = document.cookie.split("; ").find(c => c.startsWith(`${KIT_TOUCH_COOKIE}=`))?.slice(KIT_TOUCH_COOKIE.length + 1);
      return parseFirstTouch(touchCookie)?.id || null;
    })());
  }, []);

  let hasTrackedRef = useRef(false);
  
  useEffect(() => {
    if (trackShown && showNewsletterWall && !hasTrackedRef.current) {
      hasTrackedRef.current = true;
      analytics.track("paywall_capture_shown", {
        animation_slug: animSlug,
        animation_name: animName,
        in_starter_pack: isFreePreview,
        subscriber: isReturnSubscriber
      });
    }
  }, [trackShown, showNewsletterWall, animSlug, animName, isFreePreview, isReturnSubscriber]);

  let handleCheckoutClick = () => {
    analytics.track("paywall_checkout_clicked", {
      animation_slug: animSlug,
      animation_name: animName
    });
  };

  let primaryCheckoutBlock = (
    <div className="flex flex-col items-center gap-12">
      <Button href={checkoutUrl} onClick={handleCheckoutClick} theme="brand" size="sm">
        {unlockLabel}
      </Button>
      <p className="text-accent-xs text-foreground-muted">
        Cancel anytime · 14-day money-back guarantee
      </p>
      <NavLink href="/pricing" className="text-accent-xs text-foreground-muted hover:text-foreground">
        See all plans
      </NavLink>
    </div>
  );

  let testimonial = TESTIMONIALS[2] || null;

  if (showNewsletterWall) {
    if (isReturnSubscriber) {
      return <ReturnSubscriberWall title={animName} isInStarterPack={isFreePreview} checkoutBlock={showCheckout ? primaryCheckoutBlock : null} />;
    }
    
    return (
      <div className="flex w-full max-w-[26rem] flex-col gap-20">
        <div className="flex flex-col items-center gap-10 text-center">
          {isFreePreview ? (
            <React.Fragment>
              <FreeChip />
              <p className="text-body font-medium text-foreground">
                {animName} is in the free Starter Pack.
              </p>
              <p className="text-body-sm text-foreground-muted">
                Drop your email and this exact component lands in your inbox, in React, Vue and HTML. No card, no trial.
              </p>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <LockIcon />
              <p className="text-body font-medium text-foreground">
                The full code for {animName} is locked.
              </p>
              <p className="text-body-sm text-foreground-muted">
                Start with the free pack, in React, Vue and HTML. A new free component every week. The whole {displayCount} library unlocks anytime.
              </p>
            </React.Fragment>
          )}
        </div>
        
        {!isFreePreview && <StarterPackThumbs items={starterPack} />}
        
        <div className="flex flex-col gap-8">
          <NewsletterForm
            source="paywall-block"
            idPrefix="paywall"
            buttonLabel={isFreePreview ? "Send me this component" : "Send me the free pack"}
            buttonSize="sm"
            className="w-full"
            compact={true}
            wantedComponent={animSlug}
          />
        </div>
        
        {showCheckout && (
          <div className="mt-16 flex flex-col items-center gap-10 border-t border-foreground/10 pt-32">
            <Button href={checkoutUrl} onClick={handleCheckoutClick} theme="surface" size="xs">
              {soloPrice ? `Unlock everything - €${soloPrice}/mo` : "Unlock everything"}
            </Button>
            <p className="text-accent-xs text-foreground-muted">
              Cancel anytime · 14-day money-back
            </p>
            {testimonial ? (
              <blockquote className="mt-8 flex max-w-[34ch] flex-col gap-6 text-center">
                <p className="text-body-sm text-foreground-muted">
                  “Similar services are 2-3 times the cost and don't offer the level of polish that Annnimate does.”
                </p>
                <footer className="text-accent-xs text-foreground-muted">
                  {testimonial.name} · {testimonial.role}
                </footer>
              </blockquote>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-24">
      <div className="flex flex-col items-center gap-16 text-center">
        <LockIcon />
        <span className="text-accent-xs text-foreground-muted">Locked</span>
        <p className="text-body max-w-[26ch] font-medium text-foreground">
          Get the full code for {animName}.
        </p>
        <p className="text-body-sm max-w-[30ch] text-foreground-muted">
          Plus {displayCount} production components in React, Vue and HTML, each built to the standard we ship for real brands.
        </p>
      </div>
      {primaryCheckoutBlock}
    </div>
  );
}
