"use client";
import React, { useRef, useMemo } from 'react';
import gsap from 'gsap';
import { translate,  translate as t } from '@/libs/utils/i18n';
import { useReveal } from '@/hooks/useReveal';
import AnimatedSubtext from '@/animations/components/AnimatedSubtext';
import AnimatedHeadline from '@/animations/components/AnimatedHeadline';

import { Columns } from '@phosphor-icons/react'; 
import { GridFour } from '@phosphor-icons/react'; 
import { List } from '@phosphor-icons/react'; 
import { MagnifyingGlass } from '@phosphor-icons/react'; 
import { Funnel } from '@phosphor-icons/react'; 
import { Copy } from '@phosphor-icons/react'; 
import { Check } from '@phosphor-icons/react'; 

const HOW_IT_WORKS_STEPS = translate('landing.howItWorks.steps');
const COPY_TABS = t('landing.howItWorks.scenes.copyTabs');

const ANIMATION_PROPS = {
  type: 'lines',
  mask: 'lines',
  duration: 0.5,
  stagger: 0.03,
  ease: 'power2.out',
  animationProps: { yPercent: 100 },
  triggerMode: 'manual'
};

const CODE_SNIPPETS = {
  React: `import { useGSAP } from "@gsap/react"
import gsap from "gsap"

function Box() {
  const box = useRef(null)
  useGSAP(() => {
    gsap.to(box.current, {
      x: 200,
      duration: 1,
      ease: "expo.out",
    })
  })
  return <div ref={box} className="box" />
}`,
  Vue: `<script setup>
import { ref, onMounted } from "vue"
import gsap from "gsap"

const box = ref(null)
onMounted(() => {
  gsap.to(box.value, {
    x: 200,
    duration: 1,
    ease: "expo.out",
  })
})
</script>`,
  HTML: `<div class="box"></div>

<script>
  gsap.to(".box", {
    x: 200,
    duration: 1,
    ease: "expo.out",
  })
</script>`
};

const TOKEN_REGEX = /("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)/g;

function tokenizeCode(codeStr) {
  let match, result = [], lastIndex = 0;
  TOKEN_REGEX.lastIndex = 0;
  while ((match = TOKEN_REGEX.exec(codeStr))) {
    if (match.index > lastIndex) {
      result.push({ t: codeStr.slice(lastIndex, match.index), c: 'text-foreground/65' });
    }
    result.push({ t: match[0], c: match[1] ? 'text-brand/80' : 'text-brand' });
    lastIndex = TOKEN_REGEX.lastIndex;
  }
  if (lastIndex < codeStr.length) {
    result.push({ t: codeStr.slice(lastIndex), c: 'text-foreground/65' });
  }
  return result;
}

function SceneFind({ thumbs, count }) {
  let LayoutIcons = [Columns, GridFour, List];
  return (
    <div className="relative h-full">
      <div className="grid h-full grid-cols-2 grid-rows-2 gap-4 p-4">
        {thumbs.map((thumb, index) => (
          <div key={thumb.slug || index} className="relative overflow-hidden border border-foreground/10 bg-surface">
            <img src={thumb.preview_image_url} alt="" loading="lazy" className="block object-cover" style={{ width: '100%', height: '100%' }} />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-8">
        <div className="flex items-stretch border border-foreground/12 bg-surface text-foreground">
          <span className="text-accent-2xs flex items-center gap-4 px-10 text-foreground-muted">
            <span className="text-foreground">{count}</span> matching
          </span>
          <span aria-hidden="true" className="w-px self-stretch bg-foreground/10" />
          <span className="text-accent-2xs flex items-center gap-4 px-10 py-8 text-foreground">
            <Funnel className="size-11 text-foreground-muted" aria-hidden="true" /> All
          </span>
          <span aria-hidden="true" className="w-px self-stretch bg-foreground/10" />
          <span className="text-accent-2xs flex items-center gap-4 px-10 text-foreground-muted">
            <MagnifyingGlass className="size-11" aria-hidden="true" /> Search
            <kbd className="text-accent-2xs ml-2 flex h-14 min-w-14 items-center justify-center bg-foreground/10 px-2 text-foreground-muted">K</kbd>
          </span>
          <span aria-hidden="true" className="w-px self-stretch bg-foreground/10" />
          <span className="flex items-center gap-8 px-10">
            {LayoutIcons.map((Icon, idx) => (
              <Icon key={idx} className={`size-11 ${idx === 1 ? 'text-foreground' : 'text-foreground-muted'}`} aria-hidden="true" />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

function SceneCopy({ tabs }) {
  let [activeTab, setActiveTab] = React.useState(tabs[0]);
  let [isCopied, setIsCopied] = React.useState(false);
  let codeRef = useRef(null);
  let codeStr = CODE_SNIPPETS[activeTab] || '';

  React.useEffect(() => {
    let container = codeRef.current;
    if (!container) return;
    
    let ctx = gsap.context(() => {
      let lines = gsap.utils.toArray('[data-code-line]', container);
      if (!lines.length) return;
      
      gsap.matchMedia().add({
        motion: '(prefers-reduced-motion: no-preference)',
        reduce: '(prefers-reduced-motion: reduce)'
      }, (context) => {
        if (context.conditions.reduce) {
          gsap.set(lines, { opacity: 1, x: 0 });
          return;
        }
        let tl = gsap.timeline({ repeat: -1, repeatDelay: 0.3 });
        tl.set(lines, { opacity: 0, x: -6 })
          .to(lines, { opacity: 1, x: 0, duration: 0.2, stagger: 0.06, ease: 'power1.out' })
          .to(lines, { opacity: 0, duration: 0.2, stagger: 0.02, ease: 'power1.in' }, '+=1.8');
        return () => tl.kill();
      });
    }, codeRef);
    return () => ctx.revert();
  }, [codeStr]);

  let handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeStr);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {}
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-8 border-b border-foreground/12 px-8 py-6">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`text-accent-2xs px-8 py-4 transition-colors duration-(--duration-fast) ease-(--ease-expo-out) ${tab === activeTab ? 'bg-foreground/10 text-foreground' : 'text-foreground-muted hover:text-foreground'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy to clipboard"
          className={`text-accent-2xs flex items-center gap-4 px-8 py-4 transition-opacity duration-(--duration-quick) ease-(--ease-expo-out) ${isCopied ? 'bg-brand text-[#141314]' : 'bg-foreground text-background hover:opacity-90'}`}
        >
          {isCopied ? <Check size={11} /> : <Copy size={11} />}
          <span>{isCopied ? t('landing.howItWorks.scenes.copiedLabel') : t('landing.howItWorks.scenes.copyLabel')}</span>
        </button>
      </div>
      <div ref={codeRef} className="flex-1 overflow-hidden px-12 py-10 font-mono text-[10px] leading-[15px]">
        {codeStr.split('\n').map((line, idx) => (
          <div key={idx} data-code-line="" className="whitespace-pre">
            {line === '' ? ' ' : tokenizeCode(line).map((token, tIdx) => (
              <span key={tIdx} className={token.c}>{token.t}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneShip({ item }) {
  let containerRef = useRef(null);
  let [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    let container = containerRef.current;
    if (!container || isVisible) return;
    let observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px 0px' });
    observer.observe(container);
    return () => observer.disconnect();
  }, [isVisible]);

  let hasVideo = !!item?.preview_video_url;
  let imageUrl = item?.preview_image_url;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-8 border-b border-foreground/12 px-10 py-8">
        <span className="flex gap-4" aria-hidden="true">
          <span className="size-6 rounded-full bg-foreground/20" />
          <span className="size-6 rounded-full bg-foreground/20" />
          <span className="size-6 rounded-full bg-foreground/20" />
        </span>
        <span className="text-accent-2xs ml-2 flex-1 truncate border border-foreground/12 bg-surface px-8 py-2 lowercase tracking-wider text-foreground-muted">
          yoursite.com
        </span>
      </div>
      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-background">
        {hasVideo && isVisible ? (
          <video src={item.preview_video_url} poster={imageUrl} autoPlay={true} muted={true} loop={true} playsInline={true} preload="none" className="block object-cover" style={{ width: '100%', height: '100%' }} />
        ) : imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" className="block object-cover" style={{ width: '100%', height: '100%' }} />
        ) : null}
      </div>
    </div>
  );
}

function StepArticle({ num, label, body, visual, labelOnReady, bodyOnReady }) {
  return (
    <article className="flex flex-col">
      <div data-theme="dark" className="aspect-[16/10] w-full overflow-hidden border border-foreground/12 bg-background">
        {visual}
      </div>
      <div className="mt-20 flex flex-col gap-8">
        <span className="text-mono text-brand">
          {translate('landing.howItWorks.stepWord')} {num}
        </span>
        <AnimatedSubtext tag="h3" className="text-h4 text-foreground" {...ANIMATION_PROPS} onReady={labelOnReady}>
          {label}
        </AnimatedSubtext>
        <AnimatedSubtext tag="p" className="text-body-sm text-foreground-muted" {...ANIMATION_PROPS} onReady={bodyOnReady}>
          {body}
        </AnimatedSubtext>
      </div>
    </article>
  );
}

export default function HowItWorksSection({ animations = [] }) {
  let sectionRef = useRef(null);
  let headlineRef = useRef(null);
  let revealCallbacks = useRef([]);

  let animationsWithImages = useMemo(() => animations.filter(a => a.preview_image_url), [animations]);
  let thumbSelection = animationsWithImages.length >= 8 ? animationsWithImages.slice(4, 8) : animationsWithImages.slice(0, 4);
  let shipItem = animationsWithImages.find(a => a.preview_video_url) || animationsWithImages[6] || animationsWithImages[0];

  let registerCallback = index => callback => { revealCallbacks.current[index] = callback; };

  useReveal(sectionRef, {
    mode: 'scroll',
    build: () => {
      let tl = gsap.timeline({ paused: true });
      tl.call(() => headlineRef.current?.reveal?.(), [], 0);
      for (let i = 0; i < 7; i++) {
        tl.call(() => revealCallbacks.current[i]?.(), [], 0.12 + 0.02 * i);
      }
      return tl;
    }
  });

  let scenes = [
    <SceneFind key="find" thumbs={thumbSelection} count={animationsWithImages.length} />,
    <SceneCopy key="copy" tabs={COPY_TABS} />,
    <SceneShip key="ship" item={shipItem} />
  ];

  return (
    <section ref={sectionRef} data-theme="light" className="bg-background py-64 text-foreground lg:py-96">
      <div className="v2-container">
        <header className="mb-24 max-w-[42rem] lg:mb-32">
          <AnimatedHeadline ref={headlineRef} as="h2" sizeClass="text-h2" className="max-w-[28ch]" trigger="manual">
            {translate('landing.howItWorks.headline')}
          </AnimatedHeadline>
          <AnimatedSubtext tag="p" className="text-body-lg mt-16 max-w-[40ch] text-foreground-muted" {...ANIMATION_PROPS} onReady={registerCallback(0)}>
            {translate('landing.howItWorks.answer')}
          </AnimatedSubtext>
        </header>
        <div className="grid grid-cols-1 gap-24 md:grid-cols-3 lg:gap-32">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <StepArticle
              key={index}
              num={index + 1}
              label={step.label}
              body={step.body}
              visual={scenes[index]}
              labelOnReady={registerCallback(1 + 2 * index)}
              bodyOnReady={registerCallback(2 + 2 * index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
