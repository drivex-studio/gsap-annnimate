import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic'; // module id: 770703

import gsap from 'gsap'; // module id: 989970
import { useGSAP } from '@gsap/react'; // module id: 365747
import { ScrollTrigger } from 'gsap/ScrollTrigger'; // module id: 883495

import { translate as t } from '@/libs/utils/i18n';
import { useBreakpoint } from '@/hooks/useBreakpoint'; // module id: 400701
import AnimatedSubtext from '@/animations/components/AnimatedSubtext'; // module id: 218091

gsap.registerPlugin(useGSAP, ScrollTrigger);

// 3D Globe Component Lazy Load
const Globe = dynamic(() => import('@/components/globe/Globe'), { // original mangled: u, 307589
  ssr: false
});

// module id: 650542
export function TestimonialCard({
  body, // original mangled: e
  name, // original mangled: n
  role, // original mangled: r
  avatarSrc, // original mangled: i
  avatarBg = "#3a3a3a", // original mangled: s
  wantsPlay = false, // original mangled: c
  className = "", // original mangled: d
  revealTrigger = "manual" // original mangled: u
}) {
  let initials = name?.trim()?.[0]?.toUpperCase() || "?"; // original mangled: m
  let revealFn = useRef(null); // original mangled: f
  let hasRevealed = useRef(false); // original mangled: h

  useEffect(() => {
    if (wantsPlay && !hasRevealed.current && revealFn.current) {
      hasRevealed.current = true;
      revealFn.current();
    }
  }, [wantsPlay]);

  return (
    <article
      className={`testimonial-card bg-foreground text-background p-24 lg:p-32 flex flex-col gap-24 ${className}`}
      style={{
        transform: "translateZ(0)",
        willChange: "transform"
      }}
    >
      <AnimatedSubtext
        tag="p"
        className="text-body leading-relaxed"
        type="lines"
        mask="lines"
        duration={0.6}
        stagger={0.04}
        ease="power2.out"
        animationProps={{ yPercent: 100 }}
        triggerMode={revealTrigger === "scroll" ? "scroll" : "manual"}
        onReady={revealTrigger === "scroll" ? undefined : (playFn) => {
          revealFn.current = playFn;
          if (wantsPlay && !hasRevealed.current) {
            hasRevealed.current = true;
            playFn();
          }
        }}
      >
        {body}
      </AnimatedSubtext>
      <div className="flex items-center gap-16">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt=""
            className="block rounded-full object-cover shrink-0"
            style={{ width: 44, height: 44 }}
          />
        ) : (
          <span
            className="flex items-center justify-center rounded-full shrink-0 text-background/80 text-mono-sm"
            style={{ width: 44, height: 44, background: avatarBg }}
            aria-hidden="true"
          >
            {initials}
          </span>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-body">{name}</span>
          <span className="text-body text-background/55">{role}</span>
        </div>
      </div>
    </article>
  );
}

// Data Setup
const AVATARS = [ // original mangled: m
  "/imgs/lukas_avatar.avif", 
  "/imgs/edoardo_avatar.avif", 
  "/imgs/matthew_avatar.avif"
];

export const TESTIMONIALS = t("common.testimonials.items").map((item, index) => ({ // original mangled: f
  ...item,
  avatarSrc: AVATARS[index]
}));

const PARALLAX_OFFSETS = [80, 56, 120]; // original mangled: h

// module id: 967791
export default function Testimonials({ images = [], globe = true }) {
  let sectionRef = useRef(null); // original mangled: s
  let globeWrapperRef = useRef(null); // original mangled: l
  let cardsRef = useRef([]); // original mangled: m
  let isDesktop = useBreakpoint("lg"); // original mangled: p

  useGSAP(() => {
    if (!isDesktop) return;
    
    let globeEl = globeWrapperRef.current;
    let cardElements = cardsRef.current.filter(Boolean);
    
    if (!globeEl && cardElements.length === 0) return;
    
    let tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true
      }
    });
    
    if (globeEl) {
      tl.fromTo(globeEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 0);
      tl.to(globeEl, { autoAlpha: 0, duration: 0.25 }, 0.65);
    }
    
    cardElements.forEach((cardEl, index) => {
      let offset = PARALLAX_OFFSETS[index] ?? 24;
      tl.fromTo(cardEl, { y: offset }, { y: -offset, duration: 1, force3D: true }, 0);
    });
  }, {
    scope: sectionRef,
    dependencies: [isDesktop]
  });

  let [wantsPlay, setWantsPlay] = useState(false); // original mangled: x, g
  let [isActive, setIsActive] = useState(false); // original mangled: v, b

  useEffect(() => {
    let sectionEl = sectionRef.current;
    if (!sectionEl) return;
    
    let playObserver = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setWantsPlay(true);
        playObserver.disconnect();
      }
    }, { rootMargin: "0px 0px -40% 0px" });
    
    let activeObserver = new IntersectionObserver(([entry]) => {
      setIsActive(entry?.isIntersecting ?? false);
    }, { rootMargin: "300px 0px 300px 0px" });
    
    playObserver.observe(sectionEl);
    activeObserver.observe(sectionEl);
    
    return () => {
      playObserver.disconnect();
      activeObserver.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      data-theme="light"
      className="testimonials relative bg-background text-foreground overflow-hidden"
    >
      {isDesktop && globe ? (
        <div
          ref={globeWrapperRef}
          className="testimonials-globe absolute inset-0 opacity-0"
          aria-hidden="true"
        >
          <Globe images={images} wantsPlay={wantsPlay} active={isActive} />
        </div>
      ) : null}
      
      <div className="v2-container relative py-128 lg:py-192 pointer-events-none">
        <div className="pointer-events-auto mb-48 max-w-[34ch] lg:mb-80 lg:px-64">
          <h2 className="text-h2 font-medium">
            {t("common.testimonials.heading")}
          </h2>
          <p className="mt-12 text-body-lg text-foreground-muted">
            {t("common.testimonials.sub")}
          </p>
        </div>
        
        <div className="relative grid grid-cols-12 grid-rows-[repeat(3,min-content)] gap-x-24 gap-y-16 lg:gap-y-24 lg:px-64">
          <div
            ref={(el) => { cardsRef.current[0] = el; }}
            className="col-span-12 lg:col-span-4 lg:col-start-2 lg:row-start-1 pointer-events-auto"
          >
            <TestimonialCard {...TESTIMONIALS[0]} wantsPlay={wantsPlay} />
          </div>
          <div
            ref={(el) => { cardsRef.current[1] = el; }}
            className="col-span-12 lg:col-span-4 lg:col-start-8 lg:row-start-2 pointer-events-auto"
          >
            <TestimonialCard {...TESTIMONIALS[1]} wantsPlay={wantsPlay} />
          </div>
          <div
            ref={(el) => { cardsRef.current[2] = el; }}
            className="col-span-12 lg:col-span-4 lg:col-start-3 lg:row-start-3 pointer-events-auto"
          >
            <TestimonialCard {...TESTIMONIALS[2]} wantsPlay={wantsPlay} />
          </div>
        </div>
      </div>
    </section>
  );
}
