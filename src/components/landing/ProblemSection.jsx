import React, { useRef, useMemo, useEffect } from 'react';
import gsap from 'gsap';

import { t } from '@/libs/i18n';
import { useReveal } from '@/hooks/useReveal';
import Button from '@/components/ui/Button';
import AnimatedHeadline from '@/components/ui/AnimatedHeadline';

const TOP_LEFT = { cx: 0, cy: 0.36, rx: 0.17, ry: 0.44 };
const TOP_RIGHT = { cx: 1, cy: 0.22, rx: 0.29, ry: 0.28 };
const BOTTOM_LEFT = { cx: 0.14, cy: 0.9, rx: 0.2, ry: 0.3 };
const BOTTOM_RIGHT = { cx: 0.82, cy: 0.82, rx: 0.3, ry: 0.24 };
const REGIONS = ['tl', 'tr', 'bl', 'br'];

function round(val) {
  return Math.round(1000000 * val) / 1000000;
}

function calculateDistance(x, y, center) {
  let dx = (x - center.cx) / center.rx;
  let dy = (y - center.cy) / center.ry;
  return Math.max(0, round(1 - Math.sqrt(dx * dx + dy * dy)));
}

function BackgroundDots() {
  let containerRef = useRef(null);
  
  let gridData = useMemo(() => {
    let cells = (function() {
      let seed = 91237;
      let random = () => {
        seed = (1664525 * seed + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      let result = [];
      for (let yIndex = 0; yIndex < 34; yIndex++) {
        for (let xIndex = 0; xIndex < 68; xIndex++) {
          let x = xIndex / 67;
          let y = yIndex / 33;
          if (y < 0.04 || y > 0.95) continue;
          
          let distances = {
            tl: calculateDistance(x, y, TOP_LEFT),
            tr: calculateDistance(x, y, TOP_RIGHT),
            bl: calculateDistance(x, y, BOTTOM_LEFT),
            br: calculateDistance(x, y, BOTTOM_RIGHT)
          };
          
          let maxRegion = 'tl';
          let maxDist = 0;
          for (let region of REGIONS) {
            if (distances[region] > maxDist) {
              maxRegion = region;
              maxDist = distances[region];
            }
          }
          if (maxDist <= 0.02) continue;
          
          let baseOpacity = round(Math.pow(maxDist, 1.1));
          let threshold = baseOpacity;
          
          if (maxRegion === 'bl' || maxRegion === 'br') {
            threshold *= Math.min(1, Math.max(0, (0.95 - y) / 0.22));
          } else {
            threshold *= Math.min(1, Math.max(0, (y - 0.04) / 0.26));
          }
          
          if (random() > round(threshold)) continue;
          
          let finalOpacity = round(0.65 * baseOpacity * (0.5 + 0.5 * random()));
          result.push({ x, y, maxOp: finalOpacity, region: maxRegion });
        }
      }
      return result;
    })();
    return REGIONS.map(region => ({ region, cells: cells.filter(c => c.region === region) }));
  }, []);

  useEffect(() => {
    let observer;
    let container = containerRef.current;
    if (!container) return;
    
    let ctx = gsap.context(() => {
      let rects = gsap.utils.toArray('[data-kf-rect]', container);
      let groups = gsap.utils.toArray('[data-kf-group]', container);
      
      if (rects.length) {
        gsap.matchMedia().add({
          motion: '(prefers-reduced-motion: no-preference)',
          reduce: '(prefers-reduced-motion: reduce)'
        }, (context) => {
          if (context.conditions.reduce) {
            gsap.set(groups, { opacity: 1 });
            rects.forEach(rect => gsap.set(rect, { opacity: Number(rect.dataset.max) }));
            return;
          }
          
          let tweens = [];
          tweens.push(gsap.to(rects, {
            opacity: (index, target) => gsap.utils.random(0.3, 1) * Number(target.dataset.max),
            duration: () => gsap.utils.random(0.6, 2),
            ease: 'power1.inOut',
            repeat: -1,
            yoyo: true,
            repeatRefresh: true,
            stagger: { each: 0.01, from: 'random' }
          }));
          
          observer = new IntersectionObserver(([entry]) => {
            tweens.forEach(tween => entry.isIntersecting ? tween.resume() : tween.pause());
          }, { rootMargin: '150px' });
          observer.observe(container);
          
          return () => tweens.forEach(tween => tween.kill());
        });
      }
    }, container);
    
    return () => {
      if (observer) observer.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {gridData.map(({ region, cells }) => (
        <div key={region} data-kf-group="" className="absolute inset-0">
          {cells.map((cell, idx) => (
            <span
              key={idx}
              data-kf-rect=""
              data-max={cell.maxOp}
              className="absolute block size-10 bg-brand"
              style={{
                left: `calc(${cell.x.toFixed(4)} * (100% - 10px))`,
                top: `calc(${cell.y.toFixed(4)} * (100% - 10px))`,
                opacity: 0
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ProblemSection() {
  let sectionRef = useRef(null);
  let headlineRef = useRef(null);
  let bodyRef = useRef(null);
  let ctaRef = useRef(null);

  useReveal(sectionRef, {
    mode: 'scroll',
    build: () => {
      let tl = gsap.timeline({ paused: true });
      tl.call(() => headlineRef.current?.play?.(), [], 0);
      tl.fromTo(bodyRef.current, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.4);
      tl.fromTo(ctaRef.current, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.6);
      return tl;
    }
  });

  return (
    <section ref={sectionRef} data-theme="dark" className="relative overflow-hidden bg-background py-96 text-foreground lg:py-160">
      <BackgroundDots />
      <div className="v2-container relative z-10">
        <div className="grid grid-cols-12">
          <div className="col-span-12 flex flex-col items-center text-center lg:col-span-10 lg:col-start-2">
            <AnimatedHeadline
              ref={headlineRef}
              tag="h2"
              size="text-h1"
              className="max-w-[22ch] font-medium"
              triggerMode="manual"
              rectangleColor="var(--brand)"
            >
              {t('landing.problem.headlineLine1')}
              <br />
              {t('landing.problem.headlineLine2')}
            </AnimatedHeadline>
            <p ref={bodyRef} className="mt-40 max-w-[46ch] text-body-lg text-foreground-muted">
              {t('landing.problem.resolve')}
            </p>
            <div ref={ctaRef} className="mt-48">
              <Button href="/animations" theme="brand" size="sm">
                {t('landing.problem.cta')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
