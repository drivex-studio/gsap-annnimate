import { translate as t } from '@/libs/utils/i18n'; // module id: 398682
import { isOfferActive } from '@/libs/pricing'; // module id: 825740
import { getPppDisplayPrice, getPppEffectivePrice } from '@/libs/ppp'; // module id: 397242
import { relativeShipped } from '@/libs/utils/date'; // module id: 402646
import { analytics } from '@/libs/utils/analytics'; // module id: 943348
import siteConfig, { effectiveCyclePrice, effectiveCycleTotal } from '@/libs/auth/data/ServerData'; 

import Button from '@/components/ui/Button'; // module id: 687989
import Link from '@/components/navigation/NavLink'; // module id: 520237
import NumberRoller from '@/components/ui/NumberRoller'; // module id: 162387
import FeatureList from '@/components/pricing/FeatureList'; // module id: 702954
import PppLabel from '@/components/pricing/PppLabel'; // module id: 245647

import { usePppTier } from '@/hooks/usePppTier'; // module id: 12895

/* Data */
const SURFACE_STYLES = {
  dark: 'bg-foreground text-background',
  surface: 'bg-surface text-foreground',
  'surface-light': 'bg-foreground/[0.06] text-foreground'
};

const TOTAL_ANIMATIONS = siteConfig?.animationStats?.totalCount ?? 50;

function calculateSavings(plan, pppTier) {
  if (pppTier) {
    const quarterlyPpp = getPppEffectivePrice(plan.key, 'quarterly', pppTier);
    const yearlyPpp = getPppEffectivePrice(plan.key, 'yearly', pppTier);
    if (quarterlyPpp != null && yearlyPpp != null) {
      const savings = 4 * quarterlyPpp - yearlyPpp;
      return savings > 0 ? savings : 0;
    }
  }
  const savings = (effectiveCyclePrice(plan.quarterly) ?? 0) * 12 - (effectiveCyclePrice(plan.yearly) ?? 0);
  return savings > 0 ? savings : 0;
}

// module id: 199155
export default function PricingCard({
  plan,
  cycle,
  isLoading = false,
  onCheckout,
  rollerDuration = 2,
  latestShip = null,
  shippedRecently = 0
}) {
  const cycleData = plan[cycle];
  const surfaceClass = SURFACE_STYLES[plan.surface] ?? SURFACE_STYLES.surface;
  const isDark = plan.surface === 'dark';
  const mutedText = isDark ? 'text-background/70' : 'text-foreground-muted';
  const baseText = isDark ? 'text-background/70' : 'text-foreground/70';

  const offerActive = isOfferActive();
  const pppTier = usePppTier();
  const pppDisplay = pppTier ? getPppDisplayPrice(plan.key, cycle, pppTier) : null;
  const effectivePrice = effectiveCyclePrice(cycleData);
  
  const displayPrice = pppDisplay ? pppDisplay.price : effectivePrice;
  const cycleTotal = pppDisplay ? pppDisplay.cycleTotal : effectiveCycleTotal(cycleData);
  const hasPpp = !!pppDisplay;
  
  const showOfferListPrice = !hasPpp && offerActive && typeof cycleData.listPrice === 'number' && cycleData.listPrice > displayPrice;
  const strikethroughPrice = hasPpp ? effectivePrice : (showOfferListPrice ? cycleData.listPrice : null);
  const priceId = cycleData.priceId;

  const savingsAmount = calculateSavings(plan, pppTier);
  const showSavings = cycle === 'yearly' && savingsAmount > 0;

  const rawFeatures = (plan.features || []).map((feature) => {
    if (typeof feature === 'string') return feature;
    if (feature?.componentCount) {
      return {
        label: t('pricing.tiers.allComponents', { count: TOTAL_ANIMATIONS }),
        highlight: true
      };
    }
    if (feature?.shippedRecently) {
      if (shippedRecently >= 2) {
        return {
          label: t('pricing.tiers.shippedRecently', { count: shippedRecently }),
          solid: true
        };
      }
      return null;
    }
    return feature?.label || '';
  }).filter(Boolean);

  const computedFeatures = rawFeatures.map((feature) => {
    if (typeof feature === 'string') return feature;
    if (feature.highlight) {
      return {
        label: feature.label,
        className: isDark ? '!text-background font-medium' : '!text-foreground font-medium'
      };
    }
    if (feature.solid) {
      return {
        label: feature.label,
        className: isDark ? '!text-background' : '!text-foreground'
      };
    }
    return feature;
  });

  return (
    <article
      className={`pricing-card relative flex h-full flex-col p-32 lg:p-40 ${surfaceClass}`}
      data-popular={plan.isPopular ? 'true' : undefined}
    >
      <header className="flex items-start justify-between gap-16">
        {plan.isPopular ? (
          <span className="text-mono-sm text-brand">{t('pricing.tiers.mostPopular')}</span>
        ) : (
          <span aria-hidden="true" />
        )}
        {plan.seatTag ? (
          <span className={`text-mono-sm ${baseText}`}>{plan.seatTag}</span>
        ) : null}
      </header>

      <div className="mt-32">
        <p className={`text-h4 font-normal ${baseText}`}>{plan.name}</p>
        
        {hasPpp ? (
          <div className="mt-4 flex justify-start">
            <PppLabel tone={isDark ? 'light' : 'dark'} />
          </div>
        ) : showOfferListPrice ? (
          <p className="mt-4 text-mono-sm text-brand">{t('pricing.tiers.offerName')}</p>
        ) : null}
        
        <div
          className="mt-8 flex items-baseline gap-6"
          aria-label={
            hasPpp
              ? t('pricing.tiers.pppAria', { price: effectivePrice, cycle: cycleData.cycleLabel })
              : showOfferListPrice
                ? t('pricing.tiers.offerAria', { price: cycleData.listPrice, cycle: cycleData.cycleLabel })
                : undefined
          }
        >
          <span className="text-h2 font-medium tracking-tight inline-flex items-baseline">
            <span>€</span>
            <NumberRoller
              value={displayPrice}
              triggerMode="immediate"
              duration={rollerDuration}
              valueChangeDuration={0.8}
              className="text-h2 font-medium leading-none"
            />
          </span>
          {strikethroughPrice != null ? (
            <span className={`text-body line-through ${mutedText}`}>
              €{strikethroughPrice}
            </span>
          ) : null}
          <span className={`text-body ${mutedText}`}>{cycleData.cycleLabel}</span>
        </div>

        {cycleTotal ? (
          <p className={`text-body-sm mt-6 ${mutedText}`}>
            {hasPpp
              ? t('pricing.tiers.billedQuarterlyExact', { total: cycleTotal })
              : t('pricing.tiers.billedQuarterly')}
          </p>
        ) : null}

        <div
          className="grid transition-all duration-500 ease-power4-in-out"
          style={{ gridTemplateRows: showSavings ? '1fr' : '0fr' }}
          aria-hidden={!showSavings}
        >
          <div className="overflow-hidden">
            <p className="text-mono-sm pt-12 text-brand">
              {t('pricing.tiers.savings', { amount: savingsAmount })}
            </p>
          </div>
        </div>
      </div>

      {plan.pitch ? (
        <p className={`text-body mt-24 max-w-[28ch] ${mutedText}`}>{plan.pitch}</p>
      ) : null}

      <div className="mb-auto mt-32">
        <FeatureList
          items={computedFeatures}
          itemClassName={`text-body leading-snug ${isDark ? 'text-background/90' : 'text-foreground/85'}`}
        />
        {latestShip ? (
          <p className={`text-body-sm mt-20 ${mutedText}`}>
            {t('pricing.tiers.latestShip')}:{' '}
            <Link
              href={`/animations/${latestShip.slug}`}
              inline={true}
              className={isDark ? 'text-background' : 'text-foreground'}
            >
              {latestShip.title}
            </Link>{' '}
            · {relativeShipped(latestShip.published_at || latestShip.created_at)}
          </p>
        ) : null}
      </div>

      <div className="mt-40 flex">
        <Button
          theme="brand"
          size="sm"
          className="w-full justify-center sm:w-auto"
          onClick={() => {
            analytics.track('pricing_plan_selected', {
              plan: plan.key,
              cycle: cycle,
              price: displayPrice,
              ...(pppTier ? { ppp_tier: pppTier } : {})
            });
            onCheckout?.(plan.key, priceId);
          }}
          aria-label={t('pricing.tiers.ctaAria', { cta: plan.cta, cycle: cycle })}
          loading={isLoading}
        >
          {plan.cta}
        </Button>
      </div>

      <p className={`text-body-sm mt-16 ${mutedText}`}>
        {t('pricing.tiers.cardFinePrint')}
      </p>
    </article>
  );
}