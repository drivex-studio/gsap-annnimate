import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useAnimation, usePageEnterAnimation } from '@/providers/AnimationProvider';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export default function AnimatedSubtext({
  children,
  type,
  duration = 0.8,
  delay = 0,
  ease = 'power4.out',
  mask,
  stagger = 0.05,
  from,
  animationProps,
  triggerMode = 'scroll',
  start,
  toggleActions,
  scrollTrigger,
  autoSplit = true,
  deepSlice = true,
  linesClass,
  wordsClass,
  charsClass,
  aria = 'none',
  propIndex = false,
  onComplete,
  onSplitCallback,
  onReady,
  className = '',
  tag: Tag = 'div',
  revertOnComplete = false,
  ...rest
}) {
  let containerRef = useRef(null);
  let splitInstanceRef = useRef(null);
  let timelineRef = useRef(null);
  let shouldPlay = useRef(false);
  
  let [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  let resolvedTypeTemp = type;
  let resolvedMask = mask;
  
  if (resolvedTypeTemp === undefined && resolvedMask === undefined) {
    resolvedTypeTemp = 'lines';
    resolvedMask = 'lines';
  }
  
  let resolvedType = resolvedTypeTemp || (resolvedMask ? `${resolvedMask},words` : 'lines,words,chars');
  let animProps = animationProps || from || { opacity: 0, y: 30 };
  
  let { getHasTriggered } = useAnimation();
  
  let markStarted = () => {
    if (containerRef.current) {
      containerRef.current.setAttribute('data-animation-started', 'true');
    }
  };

  usePageEnterAnimation(() => {
    shouldPlay.current = true;
    markStarted();
    if (timelineRef.current) {
      timelineRef.current.restart(true);
    }
  }, [], 'AnimatedText', triggerMode === 'pageEnter');

  useEffect(() => {
    if (triggerMode === 'pageEnter' && fontsReady && timelineRef.current && getHasTriggered() && shouldPlay.current) {
      let timeoutId = setTimeout(() => {
        if (timelineRef.current) {
          markStarted();
          timelineRef.current.restart(true);
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [triggerMode, fontsReady, getHasTriggered]);

  useGSAP(() => {
    if (!containerRef.current || !fontsReady) return;

    let splitConfig = {
      type: resolvedType,
      aria,
      deepSlice,
      propIndex,
      autoSplit,
      ...(resolvedMask && { mask: resolvedMask }),
      ...(linesClass && { linesClass }),
      ...(wordsClass && { wordsClass }),
      ...(charsClass && { charsClass }),
      onSplit(splitResult) {
        splitInstanceRef.current = splitResult;
        if (onSplitCallback) onSplitCallback(splitResult);

        let types = resolvedType.split(',').map(s => s.trim());
        let targets = types.includes('chars') && splitResult.chars?.length > 0 ? splitResult.chars 
          : types.includes('words') && splitResult.words?.length > 0 ? splitResult.words 
          : types.includes('lines') && splitResult.lines?.length > 0 ? splitResult.lines 
          : [];

        if (targets.length === 0) return;

        let gsapConfig = {
          ...animProps,
          duration,
          delay,
          ease,
          stagger,
          ...(onComplete && {
            onComplete: () => {
              onComplete();
              if (revertOnComplete && splitResult) splitResult.revert();
            }
          })
        };

        if (triggerMode === 'scroll') {
          let stConfig = {
            trigger: containerRef.current,
            start: start || 'top 80%',
            ...(typeof scrollTrigger === 'object' && scrollTrigger)
          };
          if (toggleActions) stConfig.toggleActions = toggleActions;
          
          gsapConfig.scrollTrigger = stConfig;
          timelineRef.current = gsap.from(targets, gsapConfig);
        } else if (triggerMode === 'immediate') {
          timelineRef.current = gsap.from(targets, gsapConfig);
        } else {
          timelineRef.current = gsap.from(targets, {
            ...gsapConfig,
            paused: true
          });
          
          if (triggerMode === 'pageEnter' && shouldPlay.current) {
            markStarted();
            timelineRef.current.restart(true);
          }
          if (triggerMode === 'manual' && onReady) {
            onReady(() => {
              if (timelineRef.current) timelineRef.current.restart(true);
            });
          }
        }
        return timelineRef.current;
      }
    };

    splitInstanceRef.current = SplitText.create(containerRef.current, splitConfig);

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
      if (splitInstanceRef.current) {
        splitInstanceRef.current.revert();
        splitInstanceRef.current = null;
      }
    };
  }, {
    scope: containerRef,
    dependencies: [triggerMode, fontsReady]
  });

  return (
    <Tag
      ref={containerRef}
      className={className}
      data-page-enter-animation={triggerMode === 'pageEnter' ? 'true' : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
