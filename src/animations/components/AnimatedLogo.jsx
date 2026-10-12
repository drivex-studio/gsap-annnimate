"use client";
import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/libs/utils/className';
import LogoIcon from '@/assets/logos/LogoIcon';

const AnimatedLogo = forwardRef(function AnimatedLogo({ className, strokeWidth = 26, ...props }, ref) {
  let containerRef = useRef(null);
  let timelineRef = useRef(null);

  let getPaths = () => {
    let el = containerRef.current;
    return {
      brand: Array.from(el?.querySelectorAll('[data-pass="brand"] path') || []),
      fg: Array.from(el?.querySelectorAll('[data-pass="fg"] path') || [])
    };
  };

  let resetDashes = (pathsArray) => {
    pathsArray.forEach(path => {
      let length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });
  };

  let playAnimation = () => {
    let { brand, fg } = getPaths();
    if (!brand.length) return;
    
    if (timelineRef.current) timelineRef.current.kill();
    
    resetDashes(brand);
    resetDashes(fg);
    
    let staggerConfig = { each: 0.1 };
    let tl = gsap.timeline();
    
    tl.to(brand, { strokeDashoffset: 0, duration: 0.9, ease: "expo.inOut", stagger: staggerConfig }, 0);
    tl.to(fg, { strokeDashoffset: 0, duration: 0.9, ease: "expo.inOut", stagger: staggerConfig }, 0.12);
    
    timelineRef.current = tl;
  };

  useImperativeHandle(ref, () => ({
    play: playAnimation
  }), []);

  useGSAP(() => {
    let { brand, fg } = getPaths();
    
    [...brand, ...fg].forEach(path => {
      let length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: 0 });
    });
    
    return () => {
      if (timelineRef.current) timelineRef.current.kill();
    };
  }, { scope: containerRef });

  let sharedClasses = "col-start-1 row-start-1 h-full w-auto";

  return (
    <span ref={containerRef} className={cn("grid place-items-center", className)} {...props}>
      <LogoIcon data-pass="brand" strokeWidth={strokeWidth} className={`${sharedClasses} text-brand`} />
      <LogoIcon data-pass="fg" strokeWidth={strokeWidth} className={`${sharedClasses} text-foreground`} />
    </span>
  );
});

export default AnimatedLogo;
