import React from 'react';

import { translate } from '@/libs/utils/i18n';
import { analytics } from '@/libs/utils/analytics';
import { cn } from '@/libs/utils/className';
import Switch from '@/animations/shared/Switch';
import AnimatedTabs from '@/animations/components/AnimatedTabs';
import ServerData, { effectiveCyclePrice } from '@/libs/auth/data/ServerData';

export default function PricingToggle({
  cycle,
  onChange,
  variant = "default"
}) {
  let isQuarterly = cycle === "quarterly";

  let maxSavings = (function() {
    let plans = ServerData.stripe?.landingPlans || [];
    let max = 0;
    
    for (let plan of plans) {
      let qPrice = effectiveCyclePrice(plan.quarterly);
      let yPrice = effectiveCyclePrice(plan.yearly);
      
      if (!qPrice || !yPrice) continue;
      
      let annualizedQuarterly = 12 * qPrice;
      if (annualizedQuarterly <= 0) continue;
      
      let savings = Math.round(((annualizedQuarterly - yPrice) / annualizedQuarterly) * 100);
      if (savings > max) {
        max = savings;
      }
    }
    return max > 0 ? max : null;
  })();

  let showSavingsHint = isQuarterly && !!maxSavings;

  let handleToggle = (newCycle) => {
    analytics.track("pricing_cycle_toggled", { cycle: newCycle });
    onChange(newCycle);
  };

  if (variant === "compact") {
    let getCompactBtnClass = (isActive) => cn(
      "text-mono-sm transition-colors duration-(--duration-quick) ease-(--ease-expo-out)",
      isActive ? "text-foreground" : "text-foreground-muted hover:text-foreground"
    );

    return (
      <div className="inline-flex items-center gap-12">
        <button
          type="button"
          onClick={() => handleToggle("quarterly")}
          className={getCompactBtnClass(isQuarterly)}
        >
          Quarterly
        </button>
        <Switch
          checked={!isQuarterly}
          onChange={(isChecked) => handleToggle(isChecked ? "yearly" : "quarterly")}
          label={translate("pricing.cycle.toggleAria")}
        />
        <button
          type="button"
          onClick={() => handleToggle("yearly")}
          className={getCompactBtnClass(!isQuarterly)}
        >
          Yearly
        </button>
        {isQuarterly && maxSavings ? (
          <span className="text-mono-sm text-brand">
            −{maxSavings}%
          </span>
        ) : null}
      </div>
    );
  }

  let getDefaultBtnClass = (isActive) => cn(
    "relative z-10 px-24 py-12 text-mono-sm transition-colors duration-(--duration-quick) ease-(--ease-expo-out)",
    isActive ? "text-background" : "text-foreground-muted hover:text-foreground"
  );

  return (
    <div className="inline-flex flex-col items-center">
      <AnimatedTabs
        activeId={cycle}
        pillClassName="bg-foreground"
        containerClassName="border border-foreground/15 p-4"
        role="radiogroup"
        aria-label={translate("pricing.cycle.toggleAria")}
      >
        <button
          type="button"
          role="radio"
          aria-checked={isQuarterly}
          data-flip-id="quarterly"
          onClick={() => handleToggle("quarterly")}
          className={getDefaultBtnClass(isQuarterly)}
        >
          Quarterly
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={!isQuarterly}
          data-flip-id="yearly"
          onClick={() => handleToggle("yearly")}
          className={getDefaultBtnClass(!isQuarterly)}
        >
          Yearly
        </button>
      </AnimatedTabs>
      
      <div
        className="grid w-full overflow-hidden transition-[grid-template-rows,opacity] duration-(--duration-snap) ease-(--ease-power3-out)"
        style={{
          gridTemplateRows: showSavingsHint ? "1fr" : "0fr",
          opacity: +!!showSavingsHint
        }}
        aria-hidden={!showSavingsHint}
      >
        <div className="min-h-0">
          <button
            type="button"
            onClick={() => handleToggle("yearly")}
            tabIndex={showSavingsHint ? 0 : -1}
            className="text-mono-sm mt-12 inline-flex items-center gap-8 text-brand transition-opacity duration-(--duration-fast) ease-(--ease-power3-out) hover:opacity-80"
          >
            <span aria-hidden="true" className="relative inline-flex size-8">
              <span className="absolute inset-0 animate-ping bg-brand opacity-60" />
              <span className="relative block size-8 bg-brand" />
            </span>
            {translate("pricing.cycle.savingsHint", { percent: maxSavings })}
          </button>
        </div>
      </div>
    </div>
  );
}
