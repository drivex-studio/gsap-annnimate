'use client'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useAnimation, usePageEnterAnimation } from '@/providers/AnimationProvider';

const AnimatedHeadline = forwardRef(function AnimatedHeadline({
  children,
  className = '',
  tag: Tag = 'h2',
  size = 'h2',
  delay = 0,
  rectangleDuration = 0.8,
  textDuration = 0.8,
  rectangleColor = 'var(--secondary)',
  start = 'top 95%',
  stagger = 0.05,
  triggerMode = 'scroll',
  onReady,
  ...props
}, ref) {
  const containerRef = useRef(null);
  const splitTextRef = useRef(null);
  const timelineRef = useRef(null);
  const shouldRestartOnPageEnterRef = useRef(false);

  const [fontsReady, setFontsReady] = useState(false);
  const { getHasTriggered } = useAnimation();

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  usePageEnterAnimation(
    () => {
      if (timelineRef.current) {
        timelineRef.current.restart();
      } else {
        shouldRestartOnPageEnterRef.current = true;
      }
    },
    [],
    'AnimatedHeadline',
    triggerMode === 'pageEnter',
  );

  useEffect(() => {
    if (
      triggerMode === 'pageEnter' &&
      fontsReady &&
      timelineRef.current &&
      getHasTriggered() &&
      shouldRestartOnPageEnterRef.current
    ) {
      const timeoutId = setTimeout(() => {
        if (timelineRef.current) {
          timelineRef.current.restart();
          shouldRestartOnPageEnterRef.current = false;
        }
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [triggerMode, fontsReady, getHasTriggered]);

  useGSAP(() => {
    if (!containerRef.current || !fontsReady) return;

    const media = gsap.matchMedia();
    let splitTextContexts = [];
    let lineWrappers = [];
    let rectangles = [];

    media.add('(max-width: 767px)', () => {
      const split = SplitText.create(containerRef.current, {
        type: 'lines',
        linesClass: 'split-line',
        mask: 'lines',
        aria: 'none',
      });

      splitTextRef.current = split;

      if (!split.lines || split.lines.length === 0) return;

      gsap.set(split.lines, {
        yPercent: 100,
        force3D: true,
      });

      const timelineOptions = {};

      if (triggerMode === 'scroll') {
        timelineOptions.scrollTrigger = {
          trigger: containerRef.current,
          start,
          toggleActions: 'play none none none',
          invalidateOnRefresh: true,
        };
      } else if (triggerMode === 'immediate') {
        timelineOptions.paused = false;
      } else {
        timelineOptions.paused = true;
      }

      const timeline = gsap.timeline(timelineOptions);
      timelineRef.current = timeline;

      timeline.to(split.lines, {
        yPercent: 0,
        duration: textDuration,
        delay,
        ease: 'expo.out',
        stagger,
        force3D: true,
      });

      if (
        (triggerMode === 'manual' || triggerMode === 'pageEnter') &&
        onReady
      ) {
        onReady(() => timelineRef.current?.restart());
      }

      if (
        shouldRestartOnPageEnterRef.current &&
        triggerMode === 'pageEnter'
      ) {
        shouldRestartOnPageEnterRef.current = false;
        timeline.restart();
      }

      return () => {
        timeline.kill();
        split.revert();
      };
    });

    media.add('(min-width: 768px)', () => {
      const split = SplitText.create(containerRef.current, {
        type: 'lines',
        linesClass: 'split-line',
        aria: 'none',
      });

      splitTextRef.current = split;

      if (!split.lines || split.lines.length === 0) return;

      lineWrappers = [];
      rectangles = [];

      split.lines.forEach(() => {
        const wrapper = document.createElement('div');

        wrapper.className = 'line-wrapper';

        Object.assign(wrapper.style, {
          position: 'relative',
          overflow: 'visible',
          display: 'inline-block',
          width: 'fit-content',
          lineHeight: '0.9',
        });

        const rectangle = document.createElement('div');

        rectangle.className = 'line-rectangle';

        Object.assign(rectangle.style, {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          background: rectangleColor,
          transformOrigin: 'left center',
          zIndex: '2',
          pointerEvents: 'none',
        });

        lineWrappers.push(wrapper);
        rectangles.push(rectangle);
      });

      split.lines.forEach((line, index) => {
        line.style.lineHeight = '0.9';

        line.parentNode.insertBefore(lineWrappers[index], line);
        lineWrappers[index].appendChild(line);
        lineWrappers[index].appendChild(rectangles[index]);
      });

      gsap.set(split.lines, {
        opacity: 0,
        x: '5rem',
        force3D: true,
      });

      gsap.set(rectangles, {
        scaleX: 1,
        force3D: true,
        willChange: 'transform',
      });

      const timelineOptions = {};

      if (triggerMode === 'scroll') {
        timelineOptions.scrollTrigger = {
          trigger: containerRef.current,
          start,
          toggleActions: 'play none none none',
          invalidateOnRefresh: true,
        };
      } else if (triggerMode === 'immediate') {
        timelineOptions.paused = false;
      } else {
        timelineOptions.paused = true;
      }

      const timeline = gsap.timeline(timelineOptions);
      timelineRef.current = timeline;

      timeline.to(rectangles, {
        scaleX: 0,
        duration: rectangleDuration,
        delay,
        ease: 'expo.inOut',
        stagger,
        force3D: true,
      });

      timeline.to(
        split.lines,
        {
          opacity: 1,
          x: 0,
          duration: textDuration,
          ease: 'expo.out',
          stagger,
          force3D: true,
          onComplete: () => {
            gsap.set(rectangles, {
              clearProps: 'willChange',
            });
          },
        },
        '<+60%',
      );

      if (
        (triggerMode === 'manual' || triggerMode === 'pageEnter') &&
        onReady
      ) {
        onReady(() => timelineRef.current?.restart());
      }

      if (
        shouldRestartOnPageEnterRef.current &&
        triggerMode === 'pageEnter'
      ) {
        shouldRestartOnPageEnterRef.current = false;
        timeline.restart();
      }

      return () => {
        timeline.kill();
        split.revert();

        lineWrappers.forEach((wrapper) => {
          if (!wrapper?.parentNode) return;

          while (wrapper.firstChild) {
            wrapper.parentNode.insertBefore(
              wrapper.firstChild,
              wrapper,
            );
          }

          wrapper.remove();
        });
      };
    });

    return () => {
      media.revert();
      timelineRef.current = null;
      shouldRestartOnPageEnterRef.current = false;
      splitTextRef.current = null;
    };
  }, {
    scope: containerRef,
    dependencies: [triggerMode, fontsReady],
  });

  useImperativeHandle(ref, () => ({
    play: () => {
      timelineRef.current?.restart();
    },
    reset: () => {
      timelineRef.current?.progress(0).pause();
    },
  }));

  return (
    <Tag
      ref={containerRef}
      className={`${size} ${className} tracking-tight`}
      {...(triggerMode === 'pageEnter' && {
        'data-page-enter-animation': 'true',
      })}
      {...props}
    >
      {children}
    </Tag>
  );
});

export default AnimatedHeadline;
