'use client';
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useAnimation, usePageEnterAnimation } from '@/providers/AnimationProvider';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

function getSplitTargets(splitResult, resolvedType) {
  const types = resolvedType.split(',').map((s) => s.trim());

  if (types.includes('chars') && splitResult.chars?.length > 0) {
    return splitResult.chars;
  }
  if (types.includes('words') && splitResult.words?.length > 0) {
    return splitResult.words;
  }
  if (types.includes('lines') && splitResult.lines?.length > 0) {
    return splitResult.lines;
  }
  return [];
}

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
  const containerRef = useRef(null);
  const splitInstanceRef = useRef(null);
  const timelineRef = useRef(null);
  const shouldPlay = useRef(false);

  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  let resolvedTypeTemp = type;
  let resolvedMask = mask;

  if (resolvedTypeTemp === undefined && resolvedMask === undefined) {
    resolvedTypeTemp = 'lines';
    resolvedMask = 'lines';
  }

  const resolvedType = resolvedTypeTemp || (resolvedMask ? `${resolvedMask},words` : 'lines,words,chars');
  const animProps = animationProps || from || { opacity: 0, y: 30 };

  const { getHasTriggered } = useAnimation();

  const markStarted = () => {
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
      const timeoutId = setTimeout(() => {
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

    const splitConfig = {
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

        const targets = getSplitTargets(splitResult, resolvedType);
        if (targets.length === 0) return;

        function handleTweenComplete() {
          onComplete();
          if (revertOnComplete && splitResult) splitResult.revert();
        }

        function restartTween() {
          if (timelineRef.current) timelineRef.current.restart(true);
        }

        const gsapConfig = {
          ...animProps,
          duration,
          delay,
          ease,
          stagger,
          ...(onComplete && { onComplete: handleTweenComplete }),
        };

        if (triggerMode === 'scroll') {
          const stConfig = {
            trigger: containerRef.current,
            start: start || 'top 80%',
            ...(typeof scrollTrigger === 'object' && scrollTrigger),
          };
          if (toggleActions) stConfig.toggleActions = toggleActions;

          gsapConfig.scrollTrigger = stConfig;
          timelineRef.current = gsap.from(targets, gsapConfig);
        } else if (triggerMode === 'immediate') {
          timelineRef.current = gsap.from(targets, gsapConfig);
        } else {
          timelineRef.current = gsap.from(targets, { ...gsapConfig, paused: true });

          if (triggerMode === 'pageEnter' && shouldPlay.current) {
            markStarted();
            timelineRef.current.restart(true);
          }
          if (triggerMode === 'manual' && onReady) {
            onReady(restartTween);
          }
        }
        return timelineRef.current;
      },
    };

    splitInstanceRef.current = SplitText.create(containerRef.current, splitConfig);

    return function cleanup() {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
      if (splitInstanceRef.current) {
        splitInstanceRef.current.revert();
        splitInstanceRef.current = null;
      }
    };
  }, { scope: containerRef, dependencies: [triggerMode, fontsReady] });

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
