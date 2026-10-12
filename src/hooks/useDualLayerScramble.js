"use client"; 
import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

import { ASCII_CHARS } from '@/hooks/useScramble';

gsap.registerPlugin(ScrambleTextPlugin);

export default function useDualLayerScramble(options = {}) {
  const elementRef = useRef(null);
  const timelineRef = useRef(null);
  const originalTextRef = useRef('');
  const originalHtmlRef = useRef('');
  const dimensionsRef = useRef(null);
  const lineDataRef = useRef([]);
  const spanElementsRef = useRef([]);
  const isAnimatingRef = useRef(false);
  const isSplitRef = useRef(false);

  useEffect(() => {
    if (!elementRef.current) return;
    const el = elementRef.current;
    const text = el.innerText ?? '';
    
    if (text.trim().length > 0) {
      originalTextRef.current = text;
      originalHtmlRef.current = el.innerHTML;
      dimensionsRef.current = {
        width: el.offsetWidth,
        height: el.offsetHeight
      };
    }
  }, []);

  const killTimeline = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
      isAnimatingRef.current = false;
    }
  }, []);

  const prepareSplit = useCallback(() => {
    if (!elementRef.current || isSplitRef.current) return;
    const el = elementRef.current;
    
    if ((originalTextRef.current || el.innerText || '').trim().length === 0) return;
    
    if (!dimensionsRef.current) {
      dimensionsRef.current = {
        width: el.offsetWidth,
        height: el.offsetHeight
      };
    }

    const extractLines = function(targetEl) {
      const text = targetEl.innerText || '';
      if (text.trim().length === 0) return [];
      if (text.includes('\n')) return text.split('\n').filter((line) => line.length > 0);
      
      const firstChild = targetEl.firstChild;
      if (!firstChild || firstChild.nodeType !== Node.TEXT_NODE) return [text];
      
      const range = document.createRange();
      const lines = [];
      let currentLine = '';
      let lastTop = null;
      const length = firstChild.length;
      
      for (let i = 0; i < text.length && i < length; i++) {
        range.setStart(firstChild, i);
        range.setEnd(firstChild, i + 1);
        const rect = range.getBoundingClientRect();
        
        if (lastTop !== null && Math.abs(rect.top - lastTop) > 2) {
          if (currentLine.length > 0) lines.push(currentLine);
          currentLine = '';
        }
        currentLine += text[i];
        lastTop = rect.top;
      }
      
      if (currentLine.length > 0) lines.push(currentLine);
      return lines.length > 0 ? lines : [text];
    };

    const extractedLines = extractLines(el);
    const measureDiv = document.createElement('div');
    measureDiv.style.cssText = 'position: absolute; visibility: hidden; pointer-events: none; white-space: nowrap;';
    
    const computedStyle = window.getComputedStyle(el);
    measureDiv.style.font = computedStyle.font;
    measureDiv.style.fontSize = computedStyle.fontSize;
    measureDiv.style.fontFamily = computedStyle.fontFamily;
    measureDiv.style.fontWeight = computedStyle.fontWeight;
    measureDiv.style.letterSpacing = computedStyle.letterSpacing;
    measureDiv.style.textTransform = computedStyle.textTransform;
    
    document.body.appendChild(measureDiv);
    
    lineDataRef.current = extractedLines.map((lineText) => {
      measureDiv.textContent = lineText;
      return {
        text: lineText,
        width: measureDiv.offsetWidth,
        height: measureDiv.offsetHeight
      };
    });
    
    document.body.removeChild(measureDiv);

    const maxWidth = Math.max(...lineDataRef.current.map((line) => line.width));
    const totalHeight = lineDataRef.current.reduce((acc, line) => acc + line.height, 0);
    const targetWidth = Math.max(dimensionsRef.current?.width ?? 0, maxWidth);
    const targetHeight = Math.max(dimensionsRef.current?.height ?? 0, totalHeight);

    isSplitRef.current = true;
    gsap.set(el, {
      width: targetWidth,
      height: targetHeight,
      display: 'inline-block',
      overflow: 'hidden'
    });
    
    el.innerHTML = '';
    spanElementsRef.current = [];
    
    lineDataRef.current.forEach((line) => {
      const span = document.createElement('span');
      span.style.cssText = `display: block; opacity: 0; width: ${line.width}px; height: ${line.height}px; overflow: hidden; white-space: nowrap;`;
      span.innerText = line.text;
      el.appendChild(span);
      spanElementsRef.current.push(span);
    });
    
    gsap.set(el, { opacity: 1 });
  }, []);

  const scramble = useCallback((callOptions = {}) => {
    if (!elementRef.current) return null;
    if (isAnimatingRef.current) return timelineRef.current;
    
    prepareSplit();
    
    const mergedOptions = { ...options, ...callOptions };
    const duration = mergedOptions.duration ?? 1;
    const speed = mergedOptions.speed ?? 1;
    const chars = mergedOptions.chars ?? ASCII_CHARS;
    const firstColorClass = mergedOptions.firstColorClass ?? 'scramble-brand';
    const secondColorClass = mergedOptions.secondColorClass ?? 'scramble-foreground';
    const stagger = mergedOptions.stagger ?? 0.08;
    const lines = lineDataRef.current;
    const spans = spanElementsRef.current;

    if (lines.length === 0 || spans.length === 0) return null;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      spans.forEach((span, index) => {
        const lineData = lines[index];
        if (lineData) {
          span.innerText = lineData.text;
        }
        span.style.opacity = '1';
        span.className = span.className.replace(/\bscramble-\w+\b/g, '');
      });
      mergedOptions.onComplete?.();
      return null;
    }

    killTimeline();
    isAnimatingRef.current = true;
    timelineRef.current = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
        timelineRef.current = null;
        mergedOptions.onComplete?.();
      }
    });

    spans.forEach((span, index) => {
      const lineData = lines[index];
      if (!lineData) return;
      
      const originalText = lineData.text;
      const delay = index * stagger;
      
      const generateScrambledString = function(text, charSet = ASCII_CHARS) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === ' ') {
            result += char;
          } else {
            result += charSet[Math.floor(Math.random() * charSet.length)];
          }
        }
        return result;
      };

      const scrambledText = generateScrambledString(originalText, chars);
      const charCount = originalText.replace(/\s/g, '').length;
      const emptySpaces = originalText.replace(/[^\s]/g, ' ');

      timelineRef.current?.add(() => {
        gsap.set(span, { opacity: 1 });
        span.innerText = emptySpaces;
      }, delay);

      timelineRef.current?.to(span, {
        duration: duration,
        scrambleText: {
          text: scrambledText,
          chars: chars,
          speed: speed,
          revealDelay: 0.1,
          oldClass: firstColorClass,
          newClass: firstColorClass
        },
        ease: 'none'
      }, delay);

      timelineRef.current?.to(span, {
        duration: duration,
        scrambleText: {
          text: originalText,
          chars: chars,
          speed: speed,
          revealDelay: 0.1,
          oldClass: firstColorClass,
          newClass: secondColorClass
        },
        ease: 'none'
      }, delay + (charCount > 0 ? duration / charCount : 0));
    });

    return timelineRef.current;
  }, [options, killTimeline, prepareSplit]);

  const kill = useCallback(() => {
    killTimeline();
    if (elementRef.current && isSplitRef.current) {
      elementRef.current.innerHTML = originalHtmlRef.current || originalTextRef.current;
      gsap.set(elementRef.current, {
        opacity: 1,
        width: 'auto',
        height: 'auto',
        overflow: 'visible'
      });
      spanElementsRef.current = [];
      lineDataRef.current = [];
      isSplitRef.current = false;
    }
  }, [killTimeline]);

  useEffect(() => {
    return () => {
      killTimeline();
      spanElementsRef.current = [];
      lineDataRef.current = [];
      isSplitRef.current = false;
    };
  }, [killTimeline]);

  return {
    ref: elementRef,
    scramble,
    kill
  };
}
