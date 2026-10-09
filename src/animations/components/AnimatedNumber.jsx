import React, { useRef, useState, useEffect, useMemo } from 'react';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { usePageEnterAnimation } from '@/providers/AnimationProvider';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function AnimatedNumber({
  value,
  className = '',
  suffix = '',
  minDigits = 2,
  triggerMode = 'immediate',
  delay = 0,
  duration = 2,
  valueChangeDuration = 1.5,
  ease = 'expo.inOut',
  onReady
}) {
  let containerRef = useRef(null);
  let previousValue = useRef(0);
  let prevDigitsLength = useRef(0);
  let hasInitialized = useRef(false);
  
  let [shouldAnimate, setShouldAnimate] = useState(triggerMode === 'immediate');
  let pageEnterTriggered = useRef(false);
  let currentValue = useRef(value);
  let timelineRef = useRef(null);

  useEffect(() => {
    currentValue.current = value;
  }, [value]);

  let targetDigits = useMemo(() => {
    let digits = Math.round(value).toString().split('').map(Number);
    while (digits.length < minDigits) {
      digits.unshift(0);
    }
    return digits;
  }, [value, minDigits]);

  useMemo(() => {
    let prevDigits = Math.round(previousValue.current).toString().split('').map(Number);
    while (prevDigits.length < targetDigits.length) {
      prevDigits.unshift(0);
    }
    return prevDigits;
  }, [targetDigits.length]);

  
  usePageEnterAnimation(() => {
    let curr = currentValue.current;
    pageEnterTriggered.current = true;
    if (curr > 0) {
      requestAnimationFrame(() => {
        setShouldAnimate(true);
      });
    }
  }, [], 'RollerNumber', triggerMode === 'pageEnter');

  useEffect(() => {
    if (triggerMode === 'pageEnter' && pageEnterTriggered.current && value > 0 && !shouldAnimate) {
      setShouldAnimate(true);
    }
  }, [value, triggerMode, shouldAnimate]);

  useGSAP(() => {
    if (triggerMode === 'scroll' && containerRef.current) {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top bottom',
        once: true,
        onEnter: () => {
          setShouldAnimate(true);
        }
      });
    }
  }, {
    scope: containerRef,
    dependencies: [triggerMode]
  });

  useEffect(() => {
    if (triggerMode === 'manual' && onReady) {
      onReady(() => setShouldAnimate(true));
    }
  }, [triggerMode, onReady]);

  useGSAP(() => {
    if (!shouldAnimate) return;
    
    let rollers = containerRef.current?.querySelectorAll('[data-roller]');
    if (!rollers || rollers.length === 0) return;
    
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
    
    let isFirstAnimation = previousValue.current === 0 && value > 0;
    
    if (!hasInitialized.current && isFirstAnimation) {
      hasInitialized.current = true;
      prevDigitsLength.current = targetDigits.length;
      
      let tl = gsap.timeline({
        onComplete: () => {
          prevDigitsLength.current = targetDigits.length;
          previousValue.current = value;
          timelineRef.current = null;
        }
      });
      timelineRef.current = tl;
      
      rollers.forEach((roller, index) => {
        let digit = targetDigits[index];
        let inner = roller.querySelector('.roller-inner');
        if (inner) {
          gsap.set(inner, { y: '-10em' });
          tl.to(inner, {
            y: `${-20 - digit}em`,
            duration,
            delay,
            ease
          }, (targetDigits.length - 1 - index) * 0.08);
        }
      });
    } else if (hasInitialized.current && previousValue.current !== value) {
      previousValue.current = value;
      prevDigitsLength.current = targetDigits.length;
      
      rollers.forEach((roller, index) => {
        let digit = targetDigits[index];
        let inner = roller.querySelector('.roller-inner');
        if (inner) {
          gsap.to(inner, {
            y: `${-20 - digit}em`,
            duration: valueChangeDuration,
            ease,
            overwrite: 'auto',
            delay: (targetDigits.length - 1 - index) * 0.05
          });
        }
      });
    }
  }, {
    scope: containerRef,
    dependencies: [value, targetDigits.length, shouldAnimate]
  });

  let renderDigitStrip = (keyPrefix) => {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
      <div
        key={`${keyPrefix}-${num}`}
        className="flex justify-center items-center leading-none"
        style={{ height: '1em', fontVariantNumeric: 'tabular-nums' }}
      >
        {num}
      </div>
    ));
  };

  return (
    <div
      ref={containerRef}
      className={`flex justify-start items-start overflow-hidden leading-none ${className}`}
      style={{ height: '0.9em' }}
    >
      {targetDigits.map((digit, index) => (
        <div
          key={`${index}-${targetDigits.length}`}
          data-roller={true}
          className="flex flex-col justify-start items-center overflow-hidden relative"
          style={{ width: '1ch' }}
        >
          <div className="roller-inner flex flex-col will-change-transform">
            {renderDigitStrip('a')}
            {renderDigitStrip('b')}
            {renderDigitStrip('c')}
          </div>
        </div>
      ))}
      
      {suffix && (
        <div className="flex items-center ml-[0.1em]">
          <div
            className="flex justify-center items-center leading-none"
            style={{ height: '1em', fontVariantNumeric: 'tabular-nums' }}
          >
            {suffix}
          </div>
        </div>
      )}
    </div>
  );
}
