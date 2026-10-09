
import React, { useRef, useState, useMemo } from 'react';

import gsap from 'gsap'; // module id: 989970
import { useGSAP } from '@gsap/react'; // module id: 365747
import { useReveal } from '@/hooks/useReveal'; // module id: 228414
import { translate as t } from '@/libs/utils/i18n'; // module id: 398682

import RevealHeadline from '@/animations/shared/RevealHeadline'; // module id: 963160
import AnimatedSubtext from '@/animations/components/AnimatedSubtext'; // module id: 218091
import Button from '@/components/ui/Button'; // module id: 687989
import SegmentedControl from '@/components/ui/SegmentedControl'; // module id: 512922
import BulletPoints from '@/components/ui/BulletPoints'; // module id: 702954

import ServerData, { effectiveCyclePrice } from '@/libs/auth/data/ServerData'; // module id: 516799

import { Hand, Robot } from '@phosphor-icons/react';

const USE_CASES = [ // original mangled: b
  { id: "site", components: 4 },
  { id: "projects", components: 12 },
  { id: "client", components: 30 }
];

const ESTIMATES = [ // original mangled: v
  { id: "design", hand: 2, ai: 1.5 },
  { id: "build", hand: 3, ai: 0.5 },
  { id: "responsive", hand: 1.5, ai: 0.5 },
  { id: "qa", hand: 1.5, ai: 0.5 }
];

function formatNumber(num) { // original mangled: y
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatHours(num) { // original mangled: j
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

// module id: 744230
export default function ValueMath({ cta, sectionId = "value-math" }) { // original mangled: e, l
  let sectionRef = useRef(null); // original mangled: n
  let headlineRef = useRef(null); // original mangled: i
  let subtextPlayFn = useRef(null); // original mangled: N

  let [activeCaseId, setActiveCaseId] = useState(USE_CASES[0].id); // original mangled: w, k
  let [activeMode, setActiveMode] = useState("hand"); // original mangled: M, V

  let activeCase = USE_CASES.find(c => c.id === activeCaseId) ?? USE_CASES[0]; // original mangled: C
  
  let hoursPerComponent = useMemo(() => ESTIMATES.reduce((acc, est) => acc + est[activeMode], 0), [activeMode]); // original mangled: A
  let totalHours = hoursPerComponent * activeCase.components; // original mangled: H
  let rawCost = 80 * totalHours; // original mangled: E

  let [animatedCost, setAnimatedCost] = useState(rawCost); // original mangled: Z, P
  let costRef = useRef(rawCost); // original mangled: S
  let isInitialized = useRef(false); // original mangled: R

  useGSAP(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      costRef.current = rawCost;
      return;
    }
    
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      costRef.current = rawCost;
      setAnimatedCost(rawCost);
      return;
    }
    
    let obj = { v: costRef.current };
    let tween = gsap.to(obj, {
      v: rawCost,
      duration: 0.9,
      ease: "expo.out",
      onUpdate: () => {
        costRef.current = obj.v;
        setAnimatedCost(obj.v);
      }
    });
    
    return () => tween.kill();
  }, { dependencies: [rawCost], scope: sectionRef });

  useReveal(sectionRef, {
    mode: "scroll",
    build: () => {
      let tl = gsap.timeline({ paused: true });
      tl.call(() => headlineRef.current?.reveal?.(), [], 0);
      tl.call(() => subtextPlayFn.current?.(), [], 0.2);
      return tl;
    }
  });

  let caseTabs = USE_CASES.map(c => ({ // original mangled: T
    id: c.id,
    label: t(`common.valueMath.usage.${c.id}`)
  }));

  let modeTabs = [
    { id: "hand", label: t("common.valueMath.mode.hand"), Icon: Hand },
    { id: "ai", label: t("common.valueMath.mode.ai"), Icon: Robot }
  ];
  let soloPlan = ServerData.stripe?.landingPlans?.find(p => p.key === "solo")?.yearly; // original mangled: _
  let soloPrice = effectiveCyclePrice(soloPlan); // original mangled: L

  return (
    <section ref={sectionRef} id={sectionId} data-theme="dark" className="value-math relative bg-background py-64 text-foreground lg:py-96">
      <div className="v2-container">
        <div className="grid grid-cols-12 gap-x-24">
          <div className="col-span-12 lg:col-span-10 lg:col-start-2">
            
            <div className="grid grid-cols-12 gap-x-24 gap-y-8">
              
              <header className="col-span-12 lg:col-span-6">
                <RevealHeadline ref={headlineRef} as="h2" className="max-w-[18ch]" trigger="manual">
                  {t("common.valueMath.headline")}
                </RevealHeadline>
                <AnimatedSubtext
                  tag="p"
                  className="text-body m-0 mt-12 max-w-[52ch] text-foreground-muted lg:mt-24"
                  type="lines"
                  mask="lines"
                  duration={0.6}
                  stagger={0.03}
                  ease="power2.out"
                  animationProps={{ yPercent: 100 }}
                  triggerMode="manual"
                  onReady={playFn => { subtextPlayFn.current = playFn; }}
                >
                  {t("common.valueMath.intro")}
                </AnimatedSubtext>
              </header>
              
              <div className="col-span-12 mt-16 flex items-end lg:col-span-6 lg:col-start-7 lg:mt-0">
                <SegmentedControl
                  tabs={caseTabs}
                  activeId={activeCaseId}
                  onChange={setActiveCaseId}
                  ariaLabel={t("common.valueMath.usageAria")}
                  fill={true}
                />
              </div>
              
              <div className="col-span-12 mt-16 lg:col-span-5 lg:mt-24">
                <p className="text-mono-sm m-0 text-foreground-muted">
                  {t("common.valueMath.savedLabel")}
                </p>
                <p className="text-h1 m-0 mt-12 leading-none tabular-nums text-foreground">
                  €{formatNumber(animatedCost)}
                </p>
                <p className="text-body m-0 mt-12 text-foreground-muted">
                  {t("common.valueMath.savedHours", { hours: totalHours })}
                </p>
                <BulletPoints
                  className="mt-32"
                  items={[
                    t("common.valueMath.points.components", { count: activeCase.components }),
                    t("common.valueMath.points.breakEven"),
                    t("common.valueMath.points.ownership")
                  ]}
                />
              </div>
              
              <div className="col-span-12 mt-16 lg:col-span-6 lg:col-start-7 lg:mt-0">
                <div className="bg-surface p-24 lg:p-32">
                  <div className="flex flex-wrap items-center justify-between gap-16">
                    <p className="text-mono-sm m-0 text-foreground-muted">
                      {t("common.valueMath.modeLabel")}
                    </p>
                    <SegmentedControl
                      tabs={modeTabs}
                      activeId={activeMode}
                      onChange={setActiveMode}
                      ariaLabel={t("common.valueMath.modeAria")}
                      iconSize="size-16"
                    />
                  </div>
                  <dl className="m-0 mt-16">
                    {ESTIMATES.map(est => (
                      <div key={est.id} className="flex items-baseline justify-between gap-16 border-t border-border py-8">
                        <dt className="text-body-sm m-0 text-foreground-muted">
                          {t(`common.valueMath.rows.${est.id}`)}
                          <span className="text-foreground/45">
                            , {formatHours(est[activeMode])}h
                          </span>
                        </dt>
                        <dd className="text-body-sm m-0 shrink-0 tabular-nums text-foreground">
                          €{formatNumber(80 * est[activeMode])}
                        </dd>
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between gap-16 border-t border-foreground/30 pt-12">
                      <dt className="text-body-sm m-0 font-medium text-foreground">
                        {t("common.valueMath.rowTotal")}
                        <span className="font-normal text-foreground/45">
                          , {formatHours(hoursPerComponent)}h
                        </span>
                      </dt>
                      <dd className="text-body-sm m-0 shrink-0 font-medium tabular-nums text-foreground">
                        €{formatNumber(80 * hoursPerComponent)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
            </div>
            
            <div className="col-span-12 mt-16 flex flex-col gap-24 border-t border-border pt-32 lg:mt-24 lg:flex-row lg:items-end lg:justify-between lg:pt-40">
              <div>
                <div className="flex flex-wrap items-end gap-x-40 gap-y-16">
                  <div>
                    <p className="text-mono-sm m-0 text-foreground-muted">
                      {t("common.valueMath.compareBuildLabel")}
                    </p>
                    <p className="text-h2 m-0 mt-8 leading-none tabular-nums text-foreground-muted line-through">
                      {t("common.valueMath.compareBuildValue", { money: formatNumber(animatedCost) })}
                    </p>
                  </div>
                  <div>
                    <p className="text-mono-sm m-0 text-brand">
                      {t("common.valueMath.compareUsLabel")}
                    </p>
                    <p className="text-h2 m-0 mt-8 leading-none text-foreground">
                      {t("common.valueMath.priceLine", { price: soloPrice })}
                    </p>
                  </div>
                </div>
                <p className="text-body-sm m-0 mt-16 max-w-[52ch] text-foreground-muted">
                  {t("common.valueMath.priceSupport")}
                </p>
              </div>
              <Button href={cta.href} theme="brand" size="sm">
                {cta.label}
              </Button>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
