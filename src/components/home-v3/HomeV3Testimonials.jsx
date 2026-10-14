'use client'

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { TESTIMONIALS } from '@/libs/auth/data/TestimonialsData';
import { t } from '@/libs/utils/i18n';
import RevealHeadline from '@/animations/shared/RevealHeadline';

gsap.registerPlugin(CustomEase, SplitText);
CustomEase.create('annnimateInOut', 'M0,0 C0.7,0 0.16,1 1,1');

const DEFAULT_TESTIMONIALS = [...TESTIMONIALS].sort(
  (itemA, itemB) => /Lunardi/.test(itemB.name) - /Lunardi/.test(itemA.name)
);

const NAV_BUTTONS = [
  { dir: -1, label: 'Previous testimonial', Icon: CaretLeft },
  { dir: 1, label: 'Next testimonial', Icon: CaretRight },
];

export default function HomeV3Testimonials({ items = DEFAULT_TESTIMONIALS }) {
  const sectionRef = useRef(null);
  const quoteRefs = useRef([]);
  const nameRefs = useRef([]);
  const roleRefs = useRef([]);
  const avatarRefs = useRef([]);
  const splitLinesRef = useRef([]);
  const stepRef = useRef(() => {});
  const [, setActiveIndex] = useState(0);
  const totalItems = items.length;

  useGSAP(
    () => {
      let activeIndex = 0;
      let activeTl = null;
      let isReady = false;

      splitLinesRef.current = [];

      quoteRefs.current.forEach((el, index) => {
        gsap.set(el, { autoAlpha: Number(index === 0) });
      });

      [nameRefs, roleRefs].forEach((refGroup) => {
        refGroup.current.forEach((el, index) => {
          gsap.set(el, { yPercent: 110 * (index !== 0) });
        });
      });

      avatarRefs.current.forEach((el, index) => {
        gsap.set(el, { autoAlpha: Number(index === 0) });
      });

      const splitInstances = quoteRefs.current.map((quoteEl, index) =>
        SplitText.create(quoteEl, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (splitSelf) => {
            splitLinesRef.current[index] = splitSelf.lines;
            gsap.set(splitSelf.lines, { yPercent: 110 * (index !== activeIndex) });
            gsap.set(quoteEl, { autoAlpha: 1 });

            if (splitLinesRef.current.filter(Boolean).length === quoteRefs.current.length) {
              isReady = true;
            }
          },
        })
      );

      stepRef.current = (dir) => {
        if (!isReady) return;
        if (activeTl) activeTl.progress(1);

        const prevIndex = activeIndex;
        const nextIndex = (activeIndex + dir + totalItems) % totalItems;
        activeIndex = nextIndex;
        setActiveIndex(nextIndex);

        const exitYPercent = dir > 0 ? -110 : 110;
        const motionScale = Number(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);

        activeTl = gsap.timeline({ defaults: { ease: 'annnimateInOut' } });
        activeTl
          .to(
            splitLinesRef.current[prevIndex],
            { yPercent: exitYPercent, duration: 0.6 * motionScale, stagger: 0.04 * motionScale },
            0
          )
          .fromTo(
            splitLinesRef.current[nextIndex],
            { yPercent: -exitYPercent },
            { yPercent: 0, duration: 0.8 * motionScale, stagger: 0.05 * motionScale },
            0.12 * motionScale
          )
          .to(
            [nameRefs.current[prevIndex], roleRefs.current[prevIndex]],
            { yPercent: exitYPercent, duration: 0.6 * motionScale, stagger: 0.04 * motionScale },
            0
          )
          .fromTo(
            [nameRefs.current[nextIndex], roleRefs.current[nextIndex]],
            { yPercent: -exitYPercent },
            { yPercent: 0, duration: 0.8 * motionScale, stagger: 0.05 * motionScale },
            0.12 * motionScale
          )
          .to(avatarRefs.current[prevIndex], { autoAlpha: 0, duration: 0.8 * motionScale }, 0)
          .to(avatarRefs.current[nextIndex], { autoAlpha: 1, duration: 0.8 * motionScale }, 0);
      };

      return () => {
        activeTl?.kill();
        splitInstances.forEach((instance) => instance.revert());
      };
    },
    { scope: sectionRef, dependencies: [totalItems] }
  );

  return (
    <section ref={sectionRef} data-theme="light" className="bg-background py-96 text-foreground lg:py-160">
      <div className="v2-container grid grid-cols-12 gap-x-24 gap-y-48">
        <div className="col-span-12 flex flex-col justify-between gap-48 lg:col-span-3">
          <RevealHeadline as="h2" sizeClass="text-h2" className="font-medium text-balance" trigger="scroll">
            {t('common.testimonials.heading')}
          </RevealHeadline>

          <div className="flex gap-8">
            {NAV_BUTTONS.map(({ dir, label, Icon }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => stepRef.current(dir)}
                className="inline-flex size-40 cursor-pointer items-center justify-center bg-surface text-foreground transition-[background-color,scale] duration-200 ease-(--ease-expo-out) hover:bg-surface/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/60 active:scale-90"
              >
                <Icon className="size-16" />
              </button>
            ))}
          </div>
        </div>

        <figure className="col-span-12 flex flex-col gap-32 lg:col-span-8 lg:col-start-5" aria-live="polite">
          <blockquote className="grid">
            {items.map((item, index) => (
              <p
                key={item.name}
                ref={(el) => {
                  quoteRefs.current[index] = el;
                }}
                className="text-h3 w-full !font-normal text-wrap [grid-area:1/1]"
              >
                <span aria-hidden="true" className="inline-block w-[4em]" />
                {item.body}
              </p>
            ))}
          </blockquote>

          <div className="flex items-center gap-16">
            <div className="relative size-56 shrink-0 overflow-hidden rounded-full">
              {items.map((item, index) => (
                <img
                  key={item.name}
                  ref={(el) => {
                    avatarRefs.current[index] = el;
                  }}
                  src={item.avatarSrc}
                  alt=""
                  className="absolute inset-0 object-cover"
                  style={{ width: '100%', height: '100%' }}
                />
              ))}
            </div>

            <div className="flex flex-col">
              <div className="grid overflow-hidden">
                {items.map((item, index) => (
                  <p
                    key={item.name}
                    ref={(el) => {
                      nameRefs.current[index] = el;
                    }}
                    className="text-body font-medium [grid-area:1/1]"
                  >
                    {item.name}
                  </p>
                ))}
              </div>

              <div className="grid overflow-hidden">
                {items.map((item, index) => (
                  <p
                    key={item.name}
                    ref={(el) => {
                      roleRefs.current[index] = el;
                    }}
                    className="text-body-sm text-foreground-muted [grid-area:1/1]"
                  >
                    {item.role}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
