"use client";
import React, { useState } from 'react';
import { translate } from '@/libs/utils/i18n';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import Button from '@/components/ui/Button';
import AnimatedSubtext from '@/animations/components/AnimatedSubtext';
import AnimatedHeadline from '@/animations/components/AnimatedHeadline';
import CircularSlider from '@/components/landing/CircularSlider';
import ServerData from '@/libs/auth/data/ServerData';

const TABS = t('landing.oneComponent.tabs');
const PRESET_LABELS = t('landing.oneComponent.presetLabels');

const PRESETS = [
  { label: PRESET_LABELS[0], duration: 0.7, ease: 'power3.out' },
  { label: PRESET_LABELS[1], duration: 0.9, ease: 'back.out(1.4)' },
  { label: PRESET_LABELS[2], duration: 1.1, ease: 'elastic.out(1, 0.6)' }
];

const CDN_BASE = 'https://annnimate.b-cdn.net/preview-assets/images/posters';
const BASE_IMAGES = [
  { src: `${CDN_BASE}/running-poster-neutral-3x4-1.avif`, alt: 'Running' },
  { src: `${CDN_BASE}/tennis-poster-orange-3x4.avif`, alt: 'Tennis' },
  { src: `${CDN_BASE}/cycling-poster-blue-3x4.avif`, alt: 'Cycling' },
  { src: `${CDN_BASE}/football-poster-orange-3x4.avif`, alt: 'Football' },
  { src: `${CDN_BASE}/snowboarding-poster-neutral-3x4-1.avif`, alt: 'Snowboarding' },
  { src: `${CDN_BASE}/skateboarding-poster-neutral-3x4.avif`, alt: 'Skateboarding' },
  { src: `${CDN_BASE}/running-poster-green-3x4.avif`, alt: 'Running' },
  { src: `${CDN_BASE}/universal-poster-green-3x4.avif`, alt: 'Universal' },
  { src: `${CDN_BASE}/running-poster-orange-3x4-1.avif`, alt: 'Running' },
  { src: `${CDN_BASE}/cycling-poster-blue-3x4.avif`, alt: 'Cycling' },
  { src: `${CDN_BASE}/running-poster-neutral-3x4-2.avif`, alt: 'Running' },
  { src: `${CDN_BASE}/tennis-poster-orange-3x4.avif`, alt: 'Tennis' },
  { src: `${CDN_BASE}/football-poster-orange-3x4.avif`, alt: 'Football' },
  { src: `${CDN_BASE}/snowboarding-poster-neutral-3x4-1.avif`, alt: 'Snowboarding' },
  { src: `${CDN_BASE}/skateboarding-poster-neutral-3x4.avif`, alt: 'Skateboarding' },
  { src: `${CDN_BASE}/running-poster-green-3x4.avif`, alt: 'Running' }
];

const CIRCULAR_IMAGES = [...BASE_IMAGES, ...BASE_IMAGES.slice(0, 8)].map(img => ({
  ...img,
  src: `${img.src}?width=600&format=auto`
}));

function ComponentDemo({ preset }) {
  return (
    <CircularSlider
      type="snap"
      showControls={true}
      duration={preset.duration}
      ease={preset.ease}
      images={CIRCULAR_IMAGES}
      className="one-component-carousel"
    />
  );
}

function PresetControls({ preset, presetIdx, setPresetIdx }) {
  return (
    <div className="rounded-md border border-foreground/12 bg-background/80 p-14 text-foreground backdrop-blur-sm">
      <div className="mb-10 flex items-center justify-between gap-24">
        <p className="text-accent-xs m-0 text-foreground-muted">{t('landing.oneComponent.snapFeelLabel')}</p>
        <p className="text-accent-xs m-0 text-foreground-muted">{preset.duration}s</p>
      </div>
      <div role="radiogroup" aria-label={t('landing.oneComponent.snapGroupAria')} className="flex items-center gap-4">
        {PRESETS.map((p, index) => {
          let isActive = index === presetIdx;
          return (
            <button
              key={p.label}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setPresetIdx(index)}
              className={`text-accent-xs cursor-pointer rounded-sm border-0 px-12 py-8 transition-colors duration-300 ${isActive ? 'bg-foreground text-background' : 'bg-transparent text-foreground-muted hover:bg-foreground/10 hover:text-foreground'}`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CodePreview({ tab, setTab, preset }) {
  let codeStr = (function(mode, config) {
    let { duration, ease } = config;
    if (mode === 'HTML') return `<div data-anm-circular-slider
     data-anm-circular-slider-type="snap"
     data-anm-duration="${duration}"
     data-anm-ease="${ease}">
  <img class="circular_slider_image" src="card-1.jpg" alt="" />
  <!-- ...more cards... -->
</div>`;
    if (mode === 'React') return `<CircularSlider
  type="snap"
  duration={${duration}}
  ease="${ease}"
  showControls
  images={cards}
/>`;
    return `<CircularSlider
  type="snap"
  :duration="${duration}"
  ease="${ease}"
  show-controls
  :images="cards"
/>`;
  })(tab, preset);

  return (
    <div className="w-full rounded-md border border-foreground/12 bg-background/80 p-14 text-left backdrop-blur-sm lg:w-[300px]">
      <div className="mb-10 flex items-center gap-8 border-b border-foreground/10 pb-8">
        <div role="tablist" aria-label={t('landing.oneComponent.codeTablistAria')} className="flex items-center gap-8">
          {TABS.map(tOption => {
            let isActive = tOption === tab;
            return (
              <button
                key={tOption}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(tOption)}
                className={`text-accent-xs cursor-pointer rounded-sm border-0 bg-transparent px-4 py-2 transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-foreground-muted hover:text-foreground'}`}
              >
                {tOption}
              </button>
            );
          })}
        </div>
      </div>
      <pre className="one-component-code m-0 overflow-hidden whitespace-pre p-0 normal-case tracking-normal text-foreground">
        <code>{codeStr}</code>
      </pre>
    </div>
  );
}

export default function OneComponentSection() {
  let [activeTab, setActiveTab] = useState('HTML');
  let [presetIdx, setPresetIdx] = useState(1);
  let activePreset = PRESETS[presetIdx];
  let isDesktop = useBreakpoint('lg');

  let displayCount = ServerData?.animationStats?.displayCount ?? 50;

  return (
    <section data-theme="dark" className="one-component relative bg-background py-96 text-foreground lg:py-128">
      <div className="v2-container">
        {isDesktop ? (
          <div className="hidden grid-cols-12 items-center gap-0 lg:grid">
            <div className="col-span-5 col-start-1 flex flex-col gap-32">
              <header className="max-w-[44ch]">
                <AnimatedHeadline as="h2" trigger="scroll">
                  {t('landing.oneComponent.headline')}
                </AnimatedHeadline>
                <AnimatedSubtext
                  tag="p"
                  className="text-body-lg mt-24 max-w-[44ch] text-foreground-muted"
                  type="lines"
                  mask="lines"
                  duration={0.6}
                  stagger={0.03}
                  ease="power2.out"
                  animationProps={{ yPercent: 100 }}
                  triggerMode="scroll"
                >
                  {t('landing.oneComponent.body', { count: displayCount })}
                </AnimatedSubtext>
              </header>
              <div className="flex flex-wrap items-center gap-16">
                <Button href="/animations" theme="brand" size="sm">
                  {t('landing.oneComponent.cta')}
                </Button>
              </div>
            </div>
            <div className="col-span-6 col-start-7">
              <div className="relative">
                <div className="one-component-exhibit relative h-[64svh] min-h-[540px] w-full overflow-hidden bg-surface">
                  <div className="one-component-glow pointer-events-none absolute inset-0 z-[1]" aria-hidden="true" />
                  <span className="text-mono-sm absolute left-24 top-20 z-[3] text-foreground-muted" aria-hidden="true">
                    {t('landing.oneComponent.exhibitLabel')}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ComponentDemo preset={activePreset} />
                  </div>
                </div>
                <div className="absolute -bottom-32 left-24 z-[5]">
                  <PresetControls preset={activePreset} presetIdx={presetIdx} setPresetIdx={setPresetIdx} />
                </div>
                <div className="absolute -top-48 right-32 z-[5]">
                  <CodePreview tab={activeTab} setTab={setActiveTab} preset={activePreset} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-32 lg:hidden">
            <header className="max-w-[44ch]">
              <AnimatedHeadline as="h2" trigger="scroll">
                {t('landing.oneComponent.headline')}
              </AnimatedHeadline>
              <AnimatedSubtext
                tag="p"
                className="text-body-lg mt-24 max-w-[44ch] text-foreground-muted"
                type="lines"
                mask="lines"
                duration={0.6}
                stagger={0.03}
                ease="power2.out"
                animationProps={{ yPercent: 100 }}
                triggerMode="scroll"
              >
                {t('landing.oneComponent.body', { count: displayCount })}
              </AnimatedSubtext>
            </header>
            <div className="flex flex-col gap-16">
              <div className="relative h-[64svh] min-h-[540px] overflow-hidden bg-surface">
                <div className="one-component-glow pointer-events-none absolute inset-0 z-[1]" aria-hidden="true" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ComponentDemo preset={activePreset} />
                </div>
              </div>
              <PresetControls preset={activePreset} presetIdx={presetIdx} setPresetIdx={setPresetIdx} />
              <CodePreview tab={activeTab} setTab={setActiveTab} preset={activePreset} />
            </div>
            <div className="flex flex-wrap items-center gap-16">
              <Button href="/animations" theme="brand" size="sm">
                {t('landing.oneComponent.cta')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
