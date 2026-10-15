'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP, ScrollTrigger, SplitText } from '@/libs/utils/vendor';
import { useAnimation, usePageEnterAnimation } from '@/providers/AnimationProvider';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

function getSplitTargets(splitInstance, splitType) {
  const typesList = splitType.split(',').map((item) => item.trim());

  if (typesList.includes('chars') && splitInstance.chars?.length > 0) {
    return splitInstance.chars;
  }
  if (typesList.includes('words') && splitInstance.words?.length > 0) {
    return splitInstance.words;
  }
  if (typesList.includes('lines') && splitInstance.lines?.length > 0) {
    return splitInstance.lines;
  }
  return [];
}

export default function AnimatedText({
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
  ...restProps
}) {
  const containerRef = useRef(null);
  const splitRef = useRef(null);
  const tweenRef = useRef(null);
  const hasPageEnteredRef = useRef(false);
  const [isFontsLoaded, setIsFontsLoaded] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => setIsFontsLoaded(true));
  }, []);

  let resolvedType = type;
  let resolvedMask = mask;

  if (resolvedType === undefined && resolvedMask === undefined) {
    resolvedType = 'lines';
    resolvedMask = 'lines';
  }

  const splitType = resolvedType || (resolvedMask ? `${resolvedMask},words` : 'lines,words,chars');
  const fromVars = animationProps || from || { opacity: 0, y: 30 };

  const { getHasTriggered } = useAnimation();

  const markAnimationStarted = () => {
    if (containerRef.current) {
      containerRef.current.setAttribute('data-animation-started', 'true');
    }
  };

  usePageEnterAnimation(
    () => {
      hasPageEnteredRef.current = true;
      markAnimationStarted();
      if (tweenRef.current) {
        tweenRef.current.restart(true);
      }
    },
    [],
    'AnimatedText',
    triggerMode === 'pageEnter',
  );

  useEffect(() => {
    if (
      triggerMode === 'pageEnter' &&
      isFontsLoaded &&
      tweenRef.current &&
      getHasTriggered() &&
      hasPageEnteredRef.current
    ) {
      const timerId = setTimeout(() => {
        if (tweenRef.current) {
          markAnimationStarted();
          tweenRef.current.restart(true);
        }
      }, 50);

      return () => clearTimeout(timerId);
    }
  }, [triggerMode, isFontsLoaded, getHasTriggered]);

  useGSAP(
    () => {
      if (!containerRef.current || !isFontsLoaded) {
        return;
      }

      function handleTweenComplete(splitInstance) {
        onComplete();
        if (revertOnComplete && splitInstance) {
          splitInstance.revert();
        }
      }

      function handleSplit(splitInstance) {
        splitRef.current = splitInstance;

        if (onSplitCallback) {
          onSplitCallback(splitInstance);
        }

        const targets = getSplitTargets(splitInstance, splitType);
        if (targets.length === 0) {
          return;
        }

        function restartTween() {
          if (tweenRef.current) {
            tweenRef.current.restart(true);
          }
        }

        const tweenVars = {
          ...fromVars,
          duration,
          delay,
          ease,
          stagger,
          ...(onComplete && { onComplete: () => handleTweenComplete(splitInstance) }),
        };

        const scrollTriggerConfig = {
          trigger: containerRef.current,
          start: start || 'top 80%',
          ...(typeof scrollTrigger === 'object' && scrollTrigger),
        };
        if (toggleActions) {
          scrollTriggerConfig.toggleActions = toggleActions;
        }

        if (triggerMode === 'scroll') {
          tweenVars.scrollTrigger = scrollTriggerConfig;
          tweenRef.current = gsap.from(targets, tweenVars);
        } else if (triggerMode === 'immediate') {
          tweenRef.current = gsap.from(targets, tweenVars);
        } else {
          tweenRef.current = gsap.from(targets, { ...tweenVars, paused: true });

          if (triggerMode === 'pageEnter' && hasPageEnteredRef.current) {
            markAnimationStarted();
            tweenRef.current.restart(true);
          }

          if (triggerMode === 'manual' && onReady) {
            onReady(restartTween);
          }
        }

        return tweenRef.current;
      }

      const splitConfig = {
        type: splitType,
        aria,
        deepSlice,
        propIndex,
        autoSplit,
        ...(resolvedMask && { mask: resolvedMask }),
        ...(linesClass && { linesClass }),
        ...(wordsClass && { wordsClass }),
        ...(charsClass && { charsClass }),
        onSplit: handleSplit,
      };

      splitRef.current = SplitText.create(containerRef.current, splitConfig);

      return function cleanup() {
        if (tweenRef.current) {
          tweenRef.current.kill();
          tweenRef.current = null;
        }
        if (splitRef.current) {
          splitRef.current.revert();
          splitRef.current = null;
        }
      };
    },
    { scope: containerRef, dependencies: [triggerMode, isFontsLoaded] },
  );

  return (
    <Tag
      ref={containerRef}
      className={className}
      data-page-enter-animation={triggerMode === 'pageEnter' ? 'true' : undefined}
      {...restProps}
    >
      {children}
    </Tag>
  );
}
