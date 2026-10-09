"use client";
import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';
import { useAnimation, usePageEnterAnimation } from '@/providers/AnimationProvider';

gsap.registerPlugin(useGSAP, SplitText);

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
  ...rest
}, ref) {
  let containerRef = useRef(null);
  let splitInstance = useRef(null);
  let timelineRef = useRef(null);
  let shouldPlay = useRef(false);
  let [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  let { getHasTriggered } = useAnimation();

  usePageEnterAnimation(() => {
    if (timelineRef.current) {
      timelineRef.current.restart();
    } else {
      shouldPlay.current = true;
    }
  }, [], 'AnimatedHeadline', triggerMode === 'pageEnter');

  useEffect(() => {
    if (triggerMode === 'pageEnter' && fontsReady && timelineRef.current && getHasTriggered() && shouldPlay.current) {
      let timeoutId = setTimeout(() => {
        if (timelineRef.current) {
          timelineRef.current.restart();
          shouldPlay.current = false;
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [triggerMode, fontsReady, getHasTriggered]);

  useGSAP(() => {
    if (!containerRef.current || !fontsReady) return;
    
    let mm = gsap.matchMedia();
    let wrappers = [];
    let rects = [];

    return mm.add('(max-width: 767px)', () => {
      let split = SplitText.create(containerRef.current, {
        type: 'lines',
        linesClass: 'split-line',
        mask: 'lines',
        aria: 'none'
      });
      splitInstance.current = split;
      
      if (!split.lines || split.lines.length === 0) return;
      gsap.set(split.lines, { yPercent: 100, force3D: true });
      
      let tlVars = {};
      if (triggerMode === 'scroll') {
        tlVars.scrollTrigger = { trigger: containerRef.current, start, toggleActions: 'play none none none', invalidateOnRefresh: true };
      } else if (triggerMode === 'immediate') {
        tlVars.paused = false;
      } else {
        tlVars.paused = true;
      }
      
      let tl = gsap.timeline(tlVars);
      timelineRef.current = tl;
      tl.to(split.lines, { yPercent: 0, duration: textDuration, delay, ease: 'expo.out', stagger, force3D: true });
      
      if ((triggerMode === 'manual' || triggerMode === 'pageEnter') && onReady) {
        onReady(() => timelineRef.current?.restart());
      }
      if (shouldPlay.current && triggerMode === 'pageEnter') {
        shouldPlay.current = false;
        tl.restart();
      }
      return () => {
        tl.kill();
        split.revert();
      };
    }), mm.add('(min-width: 768px)', () => {
      let split = SplitText.create(containerRef.current, { type: 'lines', linesClass: 'split-line', aria: 'none' });
      splitInstance.current = split;
      
      if (!split.lines || split.lines.length === 0) return;
      
      wrappers = [];
      rects = [];
      
      split.lines.forEach(() => {
        let wrapper = document.createElement('div');
        wrapper.className = 'line-wrapper';
        Object.assign(wrapper.style, { position: 'relative', overflow: 'visible', display: 'inline-block', width: 'fit-content', lineHeight: '0.9' });
        
        let rect = document.createElement('div');
        rect.className = 'line-rectangle';
        Object.assign(rect.style, { position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', background: rectangleColor, transformOrigin: 'left center', zIndex: '2', pointerEvents: 'none' });
        
        wrappers.push(wrapper);
        rects.push(rect);
      });
      
      split.lines.forEach((line, index) => {
        line.style.lineHeight = '0.9';
        line.parentNode.insertBefore(wrappers[index], line);
        wrappers[index].appendChild(line);
        wrappers[index].appendChild(rects[index]);
      });
      
      gsap.set(split.lines, { opacity: 0, x: '5rem', force3D: true });
      gsap.set(rects, { scaleX: 1, force3D: true, willChange: 'transform' });
      
      let tlVars = {};
      if (triggerMode === 'scroll') {
        tlVars.scrollTrigger = { trigger: containerRef.current, start, toggleActions: 'play none none none', invalidateOnRefresh: true };
      } else if (triggerMode === 'immediate') {
        tlVars.paused = false;
      } else {
        tlVars.paused = true;
      }
      
      let tl = gsap.timeline(tlVars);
      timelineRef.current = tl;
      
      tl.to(rects, { scaleX: 0, duration: rectangleDuration, delay, ease: 'expo.inOut', stagger, force3D: true });
      tl.to(split.lines, { opacity: 1, x: 0, duration: textDuration, ease: 'expo.out', stagger, force3D: true, onComplete: () => { gsap.set(rects, { clearProps: 'willChange' }); } }, '<+60%');
      
      if ((triggerMode === 'manual' || triggerMode === 'pageEnter') && onReady) {
        onReady(() => timelineRef.current?.restart());
      }
      if (shouldPlay.current && triggerMode === 'pageEnter') {
        shouldPlay.current = false;
        tl.restart();
      }
      return () => {
        tl.kill();
        split.revert();
        wrappers.forEach(w => {
          if (w?.parentNode) {
            while (w.firstChild) w.parentNode.insertBefore(w.firstChild, w);
            w.remove();
          }
        });
      };
    }), () => {
      mm.revert();
      timelineRef.current = null;
      shouldPlay.current = false;
      splitInstance.current = null;
    };
  }, { scope: containerRef, dependencies: [triggerMode, fontsReady] });

  useImperativeHandle(ref, () => ({
    play: () => {
      if (timelineRef.current) timelineRef.current.restart();
    },
    reset: () => {
      if (timelineRef.current) timelineRef.current.progress(0).pause();
    }
  }));

  return (
    <Tag
      ref={containerRef}
      className={`${size} ${className} tracking-tight`}
      {...(triggerMode === 'pageEnter' && { 'data-page-enter-animation': 'true' })}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export default AnimatedHeadline;
