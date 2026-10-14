'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import 'next/link';
import gsap from 'gsap';

import siteConfig, { effectiveCyclePrice, effectiveCycleTotal } from '@/libs/config/siteConfig';
import { translate } from '@/libs/utils/i18n';
import { IsoFigure, PUNCH, useIsoLoop } from '@/components/common/iso';
import { getPppDisplayPrice } from '@/components/pricing/utils/ppp';
import { STUDIO_CYCLE_MONTHS, studioPppTotalCents } from '@/libs/auth/data/studioPricing';
import RevealHeadline from '@/animations/shared/RevealHeadline';
import AnimatedNumber from '@/animations/components/AnimatedNumber';
import RevealFade from '@/animations/shared/RevealFade';
import PricingToggle from '@/components/pricing/utils/PricingToggle';
import KitPrice from '@/components/pricing/utils/KitPrice';
import SeatSlider from '@/components/pricing/SeatSlider';
import Button from '@/components/ui/Button';
import { usePppTier } from '@/hooks/usePppGeo';
import { emptyFig, menuFig, revealFig, soloFig } from '@/components/home-v3/pricingFigures';
import { StudioSeatsFigure } from '@/components/home-v3/StudioSeatsFigure';

const DEFAULT_TOTAL_COUNT = siteConfig?.animationStats?.totalCount ?? 50;
const LANDING_PLANS = siteConfig.stripe.landingPlans;
const SOLO_PLAN = LANDING_PLANS.find((plan) => plan.key === 'solo');
const STUDIO_PLAN = LANDING_PLANS.find((plan) => plan.perSeat);

function CycleSwapTextranslate({ cycle, texts, align = 'start', className = '' }) {
  const spanRefs = useRef({});
  const prevCycleRef = useRef(cycle);

  useLayoutEffectranslate(() => {
    Object.entries(spanRefs.current).forEach(([key, spanEl]) => {
      gsap.setranslate(spanEl, { y: 0, yPercent: 110 * (key !== cycle) });
    });
  }, []);

  useEffectranslate(() => {
    const prevCycle = prevCycleRef.current;
    prevCycleRef.current = cycle;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prevCycle === cycle) {
      Object.entries(spanRefs.current).forEach(([key, spanEl]) => {
        gsap.setranslate(spanEl, { yPercent: 110 * (key !== cycle) });
      });
      return;
    }

    const dir = cycle === 'yearly' ? -1 : 1;
    const duration = 0.6 * !reducedMotion;

    gsap.to(spanRefs.current[prevCycle], {
      yPercent: 110 * dir,
      duration,
      ease: PUNCH,
      overwrite: true,
    });
    gsap.fromTo(
      spanRefs.current[cycle],
      { yPercent: -110 * dir },
      { yPercent: 0, duration, ease: PUNCH, overwrite: true }
    );
  }, [cycle]);

  return (
    <span className={`grid overflow-hidden ${className}`}>
      {Object.entries(texts).map(([key, text]) => (
        <span
          key={key}
          ref={(spanEl) => {
            spanRefs.current[key] = spanEl;
          }}
          className={`[grid-area:1/1] whitespace-nowrap ${align === 'end' ? 'justify-self-end' : 'justify-self-start'}`}
        >
          {text}
        </span>
      ))}
    </span>
  );
}

const roundCents = (val) => Math.round(100 * val) / 100;

function MonthsFreeBadge({ plan, cycle }) {
  const freeMonths = Math.floor((4 * plan.quarter - plan.year) / (plan.quarter / 3));
  if (freeMonths <= 0) return null;

  return (
    <CycleSwapText
      cycle={cycle}
      texts={{
        quarterly: '\u00A0',
        yearly: translate('home-v3.pricing.monthsFree', { months: freeMonths }),
      }}
      className="text-body-sm text-brand"
    />
  );
}

const formatEuro = (val) => `€${Number.isInteger(val) ? val : val.toFixed(2)}`;

function PlanPriceDisplay({ amount, plan, cycle, muted, was }) {
  const wholeEuros = Math.floor(amount + 1e-6);
  const cents = Math.round((amount - wholeEuros) * 100);

  return (
    <div className="flex items-baseline justify-between gap-16">
      <div className="text-h2 inline-flex items-baseline font-medium">
        <span>€</span>
        <AnimatedNumber
          value={wholeEuros}
          minDigits={1}
          triggerMode="immediate"
          duration={1.2}
          valueChangeDuration={0.8}
          className="text-h2 font-medium leading-none"
        />
        {cents > 0 ? (
          <>
            <span>.</span>
            <AnimatedNumber
              value={cents}
              minDigits={2}
              triggerMode="immediate"
              duration={1.2}
              valueChangeDuration={0.8}
              className="text-h2 font-medium leading-none"
            />
          </>
        ) : null}
        {was ? (
          <span className={`text-body ml-8 font-normal tracking-normal line-through ${muted}`}>
            {formatEuro(was)}
          </span>
        ) : null}
        <span className={`text-body ml-4 font-normal tracking-normal ${muted}`}>
          {translate('home-v3.pricing.perMonth')}
        </span>
      </div>

      <CycleSwapText
        cycle={cycle}
        align="end"
        texts={{
          quarterly: translate('home-v3.pricing.billedQuarterly', { total: formatEuro(plan.quarter) }),
          yearly: translate('home-v3.pricing.billedYearly', { total: formatEuro(plan.year) }),
        }}
        className={`text-body-sm ${muted}`}
      />
    </div>
  );
}

function PlanCard({ fig = emptyFig, figure, featured = false, compact = false, label, children }) {
  const cardRef = useRef(null);
  const { rest, onEnter, onLeave } = useIsoLoop(cardRef, fig);
  const renderedFigure = figure ?? <IsoFigure boxes={rest} />;
  const figureColorClass = featured ? '[&_g]:fill-transparent [&_g]:text-white' : '';

  return (
    <article
      ref={cardRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`relative flex flex-col gap-24 overflow-hidden p-24 lg:p-32 ${
        featured ? 'bg-black text-white' : 'bg-background'
      }`}
    >
      <div className="relative flex items-start justify-between gap-16">
        <div className="flex flex-col items-start gap-8">
          <p className={`text-body-sm ${featured ? 'text-white/75' : 'text-foreground-muted'}`}>{label}</p>
          {featured && compact && (
            <span className="text-body-sm bg-white/15 px-8 py-4">{translate('home-v3.pricing.popular')}</span>
          )}
        </div>

        {featured && !compact && (
          <span className="text-body-sm bg-white/15 px-8 py-4">{translate('home-v3.pricing.popular')}</span>
        )}

        {compact && (
          <div
            aria-hidden="true"
            className={`flex h-[72px] w-[136px] shrink-0 items-center justify-center ${figureColorClass}`}
          >
            {renderedFigure}
          </div>
        )}
      </div>

      {!compact && (
        <div aria-hidden="true" className={`relative flex h-[120px] items-center justify-center ${figureColorClass}`}>
          {renderedFigure}
        </div>
      )}

      <div className="relative flex flex-1 flex-col gap-24">{children}</div>
    </article>
  );
}

function FeatureListranslate({ items, featured, strong = 0 }) {
  return (
    <ul className="flex flex-col gap-8">
      {items.map((item, index) => {
        const isStrong = typeof item !== 'string' || index < strong;
        const text = typeof item === 'string' ? item : item.label;
        return (
          <li
            key={text}
            className={`text-body-sm ${featured ? 'text-white' : 'text-foreground'} ${isStrong ? '' : 'opacity-50'}`}
          >
            {text}
          </li>
        );
      })}
    </ul>
  );
}

function KitCard({ kit, fig, compact = false }) {
  const cardRef = useRef(null);
  const { rest, onEnter, onLeave } = useIsoLoop(cardRef, fig);
  const rawPriceDisplay = kit.priceDisplay;
  const fallbackPrice =
    typeof rawPriceDisplay === 'string' ? rawPriceDisplay.replace(/^EUR\s*/, '€') : rawPriceDisplay;

  return (
    <article
      ref={cardRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="flex flex-1 flex-col gap-16 bg-background p-24 lg:p-32"
    >
      <div className="flex items-start justify-between gap-16">
        <div className="flex flex-col gap-8">
          <p className="text-body-sm text-foreground-muted">
            {translate('home-v3.pricing.kitLabel', { title: kit.title })}
          </p>
          <p className="text-h3 font-medium">
            <KitPrice
              kitSlug={kit.slug}
              fallback={fallbackPrice}
              struckClassName="text-body tracking-normal text-foreground-muted"
            />
            <span className="text-body-sm font-normal tracking-normal text-foreground-muted">
              {' '}
              {translate('home-v3.pricing.oneTime')}
            </span>
          </p>
        </div>

        <div aria-hidden="true" className="flex h-[88px] w-[120px] shrink-0 items-center justify-center">
          <IsoFigure boxes={rest} />
        </div>
      </div>

      <div className="flex flex-col gap-12">
        <p className="text-body-sm">{kit.tagline}</p>
        {!compact && (
          <FeatureList
            strong={1}
            items={[
              translate('home-v3.pricing.kitComponents', { count: kit.componentCount }),
              translate('home-v3.pricing.kitFormats'),
              translate('home-v3.pricing.kitOwned'),
            ]}
          />
        )}
      </div>

      <div className="mt-auto">
        <Button href={`/checkout?kit=${kit.slug}`} theme="surface" className="w-full justify-center">
          {translate('home-v3.pricing.kitCta', { title: kit.title })}
        </Button>
      </div>
    </article>
  );
}

function buildSoloFeatures(features, { shippedRecently = 0, count = DEFAULT_TOTAL_COUNT } = {}) {
  return features
    .map((feature) => {
      if (typeof feature === 'string') return feature;
      if (feature?.componentCount) {
        return {
          label: translate('pricing.tiers.allComponents', { count }),
          highlight: true,
        };
      }
      if (feature?.shippedRecently) {
        return shippedRecently >= 2
          ? {
              label: translate('pricing.tiers.shippedRecently', { count: shippedRecently }),
              solid: true,
            }
          : null;
      }
      return feature?.label || '';
    })
    .filter(Boolean);
}

export default function HomeV3Pricing({
  kits = [],
  shippedRecently = 0,
  headingAs = 'h2',
  headline,
  sub,
  defaultCycle = 'quarterly',
  count,
  compact = false,
  className = 'py-96 lg:py-160',
  id = 'pricing',
}) {
  const [cycle, setCycle] = useState(defaultCycle);
  const triggerMode = headingAs === 'h1' ? 'pageEnter' : 'scroll';
  const [seats, setSeats] = useState(STUDIO_PLAN?.minSeats ?? 2);
  const pppTier = usePppTier();

  const soloQuarterlyPpp = pppTier ? getPppDisplayPrice('solo', 'quarterly', pppTier) : null;
  const soloYearlyPpp = pppTier ? getPppDisplayPrice('solo', 'yearly', pppTier) : null;

  const soloPricing = {
    quarterMonth: soloQuarterlyPpp ? soloQuarterlyPpp.price : effectiveCyclePrice(SOLO_PLAN.quarterly),
    quarter: soloQuarterlyPpp ? soloQuarterlyPpp.cycleTotal : effectiveCycleTotal(SOLO_PLAN.quarterly),
    year: soloYearlyPpp ? soloYearlyPpp.price : effectiveCyclePrice(SOLO_PLAN.yearly),
  };

  const getStudioCycleTotal = (cycleKey) =>
    STUDIO_PLAN
      ? studioPppTotalCents(seats, STUDIO_PLAN.soloCents[cycleKey], pppTier, STUDIO_CYCLE_MONTHS[cycleKey]) / 100
      : 0;

  const studioPricing = {
    quarter: getStudioCycleTotal('quarterly'),
    year: getStudioCycleTotal('yearly'),
  };
  studioPricing.quarterMonth = roundCents(studioPricing.quarter / 3);

  const getMonthlyDisplay = (planObj) =>
    cycle === 'quarterly' ? planObj.quarterMonth : roundCents(planObj.year / 12);

  return (
    <section id={id} data-theme="light" className={`scroll-mt-96 bg-background text-foreground ${className}`}>
      <div className={`v2-container flex flex-col ${compact ? 'gap-40' : 'gap-48 lg:gap-64'}`}>
        <div className="flex flex-wrap items-end justify-between gap-24">
          <div className="flex flex-col gap-16">
            <RevealHeadline
              as={headingAs}
              sizeClass="text-h2"
              className="max-w-[20ch] font-medium text-balance"
              trigger={triggerMode}
            >
              {headline ?? translate('home-v3.pricing.headline')}
            </RevealHeadline>

            {sub ? (
              <RevealFade
                as="p"
                trigger={triggerMode}
                delay={0.3}
                className="text-body-lg max-w-[46ch] text-foreground-muted"
              >
                {sub}
              </RevealFade>
            ) : null}
          </div>

          <PricingToggle cycle={cycle} onChange={setCycle} hint={false} />
        </div>

        <div className="grid grid-cols-1 gap-px border border-foreground/15 bg-foreground/15 md:grid-cols-2 xl:grid-cols-3">
          <PlanCard fig={soloFig} featured compact={compact} label={translate('home-v3.pricing.soloLabel')}>
            <div className="flex flex-col gap-8">
              <PlanPriceDisplay
                amount={getMonthlyDisplay(soloPricing)}
                plan={soloPricing}
                cycle={cycle}
                muted="text-white/75"
                was={cycle === 'yearly' ? soloPricing.quarterMonth : null}
              />
              <MonthsFreeBadge plan={soloPricing} cycle={cycle} />
            </div>

            <p className="text-body-sm text-white/85">{SOLO_PLAN.pitch}</p>

            <FeatureList
              items={buildSoloFeatures(SOLO_PLAN.features, {
                shippedRecently,
                ...(count ? { count } : {}),
              })}
              featured
            />

            <div className="mt-auto flex flex-col gap-12">
              <Button href={`/checkout?plan=solo&cycle=${cycle}`} theme="brand" className="w-full justify-center">
                {SOLO_PLAN.cta}
              </Button>
            </div>
          </PlanCard>

          {STUDIO_PLAN && (
            <PlanCard
              figure={<StudioSeatsFigure seats={seats} />}
              compact={compact}
              label={translate('home-v3.pricing.studioLabel')}
            >
              <div className="flex flex-col gap-12">
                <PlanPriceDisplay
                  amount={getMonthlyDisplay(studioPricing)}
                  plan={studioPricing}
                  cycle={cycle}
                  muted="text-foreground-muted"
                  was={cycle === 'yearly' ? studioPricing.quarterMonth : null}
                />
                <MonthsFreeBadge plan={studioPricing} cycle={cycle} />
                <SeatSlider
                  seats={seats}
                  onChange={setSeats}
                  min={STUDIO_PLAN.minSeats}
                  max={STUDIO_PLAN.maxSeats}
                />
              </div>

              <p className="text-body-sm text-foreground-muted">{STUDIO_PLAN.pitch}</p>

              <FeatureList items={STUDIO_PLAN.features} strong={2} />

              <div className="mt-auto flex flex-col gap-12">
                <p className="text-body-sm text-foreground-muted">
                  <a href={`mailto:${siteConfig.resend.supportEmail}`} className="underline underline-offset-2">
                    {translate('home-v3.pricing.moreSeats', { max: STUDIO_PLAN.maxSeats })}
                  </a>
                </p>
                <Button
                  href={`/checkout?plan=${STUDIO_PLAN.key}&cycle=${cycle}&seats=${seats}`}
                  theme="surface"
                  className="w-full justify-center"
                >
                  {STUDIO_PLAN.cta}
                </Button>
              </div>
            </PlanCard>
          )}

          <div className="flex flex-col gap-px md:col-span-2 xl:col-span-1">
            {kits.map((kit) => (
              <KitCard
                key={kit.slug}
                kit={kit}
                compact={compact}
                fig={kit.slug === 'menu' ? menuFig : revealFig}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export { revealFig };
