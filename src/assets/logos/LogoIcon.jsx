"use client";
import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react'; 
import { cn } from '@/libs/utils/className';
import LogoSvg from './LogoSvg'; 

const LogoIcon = forwardRef(function LogoIcon({ className, strokeWidth = 26, ...rest }, ref) {
  let containerRef = useRef(null);
  let timelineRef = useRef(null);

  let getPaths = () => {
    let container = containerRef.current;
    return {
      brand: Array.from(container?.querySelectorAll('[data-pass="brand"] path') || []),
      fg: Array.from(container?.querySelectorAll('[data-pass="fg"] path') || [])
    };
  };

  let setupPaths = paths => paths.forEach(path => {
    let length = path.getTotalLength();
    gsap.set(path, {
      strokeDasharray: length,
      strokeDashoffset: length
    });
  });

  let play = () => {
    let { brand, fg } = getPaths();
    if (!brand.length) return;
    
    timelineRef.current?.kill();
    setupPaths(brand);
    setupPaths(fg);
    
    let staggerConfig = { each: 0.1 };
    let tl = gsap.timeline();
    
    tl.to(brand, {
      strokeDashoffset: 0,
      duration: 0.9,
      ease: 'expo.inOut',
      stagger: staggerConfig
    }, 0);
    
    tl.to(fg, {
      strokeDashoffset: 0,
      duration: 0.9,
      ease: 'expo.inOut',
      stagger: staggerConfig
    }, 0.12);
    
    timelineRef.current = tl;
  };

  useImperativeHandle(ref, () => ({
    play
  }), []);

  useGSAP(() => {
    let { brand, fg } = getPaths();
    [...brand, ...fg].forEach(path => {
      let length = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: 0
      });
    });
    
    return () => timelineRef.current?.kill();
  }, { scope: containerRef });

  let childClasses = 'col-start-1 row-start-1 h-full w-auto';

  return (
    <span
      ref={containerRef}
      className={cn('grid place-items-center', className)}
      {...rest}
    >
      <LogoSvg
        data-pass="brand"
        strokeWidth={strokeWidth}
        className={`${childClasses} text-brand`}
      />
      <LogoSvg
        data-pass="fg"
        strokeWidth={strokeWidth}
        className={`${childClasses} text-foreground`}
      />
    </span>
  );
});

export default LogoIcon;
