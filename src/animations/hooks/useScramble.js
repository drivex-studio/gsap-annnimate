'use client'
import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';

export const ASCII_CHARS = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

export function useScramble({
  duration = 0.5,
  speed = 1,
  chars = ASCII_CHARS,
  firstColorClass = "scramble-brand",
  secondColorClass = "scramble-inherit"
} = {}) {
  const elementRef = useRef(null);
  const timelineRef = useRef(null);
  const originalTextRef = useRef("");
  const isScramblingRef = useRef(false);

  useEffect(() => {
    if (elementRef.current) {
      originalTextRef.current = elementRef.current.innerText ?? "";
    }
  }, []);

  const resetStyles = useCallback(() => {
    const element = elementRef.current;
    if (element) {
      gsap.set(element, {
        clearProps: "width,height,display,overflow,whiteSpace"
      });
    }
  }, []);

  const killScramble = useCallback(() => {
    timelineRef.current?.kill();
    timelineRef.current = null;
    isScramblingRef.current = false;
    resetStyles();
  }, [resetStyles]);

  const scrambleAction = useCallback((eventOrString) => {
    const element = elementRef.current;
    if (!element || isScramblingRef.current) return;

    const newText = typeof eventOrString === "string" ? eventOrString : null;
    const targetText = newText ?? (originalTextRef.current || element.innerText || "");
    
    if (targetText.trim().length === 0) return;

    originalTextRef.current = targetText;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (newText != null) {
        element.innerText = newText;
      }
      return;
    }

    killScramble();
    isScramblingRef.current = true;

    gsap.set(element, {
      width: "auto",
      height: "auto",
      display: "inline-block",
      whiteSpace: "nowrap"
    });
    
    gsap.set(element, {
      width: element.offsetWidth,
      height: element.offsetHeight,
      display: "inline-block",
      overflow: "hidden",
      whiteSpace: "nowrap"
    });

    const scrambledStr = ((text, charSet) => {
      let result = "";
      for (let i = 0; i < text.length; i++) {
        result += text[i] === " " ? " " : charSet[Math.floor(Math.random() * charSet.length)];
      }
      return result;
    })(targetText, chars);

    const charCount = targetText.replace(/\s/g, "").length;
    const delayPerChar = charCount > 0 ? duration / charCount : 0;

    timelineRef.current = gsap.timeline({
      onComplete: () => {
        isScramblingRef.current = false;
        timelineRef.current = null;
        resetStyles();
      }
    });

    timelineRef.current.to(element, {
      duration: duration,
      scrambleText: {
        text: scrambledStr,
        chars: chars,
        speed: speed,
        revealDelay: 0.1,
        oldClass: firstColorClass,
        newClass: firstColorClass
      },
      ease: "none"
    }).to(element, {
      duration: duration,
      scrambleText: {
        text: targetText,
        chars: chars,
        speed: speed,
        revealDelay: 0.1,
        oldClass: firstColorClass,
        newClass: secondColorClass
      },
      ease: "none"
    }, delayPerChar);
  }, [duration, speed, chars, firstColorClass, secondColorClass, killScramble]);
  useEffect(() => killScramble, [killScramble]);
  return {
    ref: elementRef,
    scramble: scrambleAction,
    kill: killScramble
  };
}
