'use client';
import { useRef, useImperativeHandle, forwardRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/libs/utils/className';
import LogoIcon from '@/assets/logos/LogoIcon';

const AnimatedLogo = forwardRef(function AnimatedLogo({ className, strokeWidth = 26, ...props }, ref) {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  const getPaths = () => {
    const el = containerRef.current;
    return {
      brand: Array.from(el?.querySelectorAll('[data-pass="brand"] path') || []),
      fg: Array.from(el?.querySelectorAll('[data-pass="fg"] path') || []),
    };
  };

  const resetDashes = (pathsArray) => {
    pathsArray.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });
  };

  const playAnimation = () => {
    const { brand, fg } = getPaths();
    if (!brand.length) return;

    if (timelineRef.current) timelineRef.current.kill();

    resetDashes(brand);
    resetDashes(fg);

    const staggerConfig = { each: 0.1 };
    const tl = gsap.timeline();

    tl.to(brand, { strokeDashoffset: 0, duration: 0.9, ease: 'expo.inOut', stagger: staggerConfig }, 0);
    tl.to(fg, { strokeDashoffset: 0, duration: 0.9, ease: 'expo.inOut', stagger: staggerConfig }, 0.12);

    timelineRef.current = tl;
  };

  useImperativeHandle(ref, () => ({ play: playAnimation }), []);

  useGSAP(() => {
    const { brand, fg } = getPaths();

    [...brand, ...fg].forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: 0 });
    });

    return function cleanup() {
      if (timelineRef.current) timelineRef.current.kill();
    };
  }, { scope: containerRef });

  const sharedClasses = 'col-start-1 row-start-1 h-full w-auto';

  return (
    <span ref={containerRef} className={cn('grid place-items-center', className)} {...props}>
      <LogoIcon data-pass="brand" strokeWidth={strokeWidth} className={`${sharedClasses} text-brand`} />
      <LogoIcon data-pass="fg" strokeWidth={strokeWidth} className={`${sharedClasses} text-foreground`} />
    </span>
  );
});

export default AnimatedLogo;
