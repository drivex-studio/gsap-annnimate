"use client";
import React, { forwardRef, useRef, useState, useLayoutEffect, useImperativeHandle } from 'react';
import gsap from 'gsap';
import { useReveal } from '@/hooks/useReveal';

const RevealHeadline = forwardRef(function RevealHeadline({
  children,
  as: Tag = 'h2',
  sizeClass = 'text-h2',
  className = '',
  trigger = 'scroll',
  start = 'top 80%',
  skip = false
}, ref) {
  let containerRef = useRef(null);
  let [lines, setLines] = useState(null);

  let extractText = (node) => {
    if (node == null || node === false) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractText).join('');
    return '';
  };
  let textContent = extractText(children);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    let wordNodes = containerRef.current.querySelectorAll('[data-rh-word]');
    if (wordNodes.length === 0) return;
    
    let computedLines = [];
    let currentLineWords = [];
    let prevTop = -Infinity;
    let prevExplicitIndex = -1;
    
    for (let node of wordNodes) {
      let top = node.getBoundingClientRect().top;
      let explicitIndex = Number(node.dataset.rhExplicit ?? -1);
      let hasExplicitBreak = explicitIndex !== prevExplicitIndex && prevExplicitIndex !== -1;
      
      if ((prevTop > -Infinity && top - prevTop > 2) || hasExplicitBreak) {
        computedLines.push(currentLineWords.join(' '));
        currentLineWords = [];
      }
      
      currentLineWords.push(node.textContent || '');
      prevTop = top;
      prevExplicitIndex = explicitIndex;
    }
    
    if (currentLineWords.length > 0) {
      computedLines.push(currentLineWords.join(' '));
    }
    
    setLines(computedLines);
  }, [textContent]);

  let { reveal } = useReveal(containerRef, {
    mode: trigger === 'pageEnter' ? 'hero' : trigger === 'manual' ? 'manual' : 'scroll',
    build: skip || !lines ? null : (element) => {
      let tl = gsap.timeline({ paused: true });
      let lineNodes = element.querySelectorAll('[data-rh-line]');
      
      for (let i = 0; i < lineNodes.length; i++) {
        let brandOverlay = lineNodes[i].querySelector('[data-rh-brand]');
        let fgOverlay = lineNodes[i].querySelector('[data-rh-fg]');
        
        if (!brandOverlay || !fgOverlay) continue;
        
        gsap.set([brandOverlay, fgOverlay], {
          scaleX: 1,
          transformOrigin: 'right'
        });
        
        let delayOffset = 0.12 * i;
        
        tl.to(fgOverlay, {
          scaleX: 0,
          duration: 0.5,
          ease: 'power3.inOut'
        }, delayOffset);
        
        tl.to(brandOverlay, {
          scaleX: 0,
          duration: 0.5,
          ease: 'power3.inOut'
        }, delayOffset + 0.1);
      }
      
      return tl;
    },
    start,
    deps: [lines, skip]
  });

  useImperativeHandle(ref, () => ({
    reveal
  }), [reveal]);

  let combinedClassName = `${sizeClass} ${className}`.trim();

  if (!lines) {
    let explicitLines = textContent.split('\n');
    return (
      <Tag ref={containerRef} className={combinedClassName} style={{ visibility: 'hidden' }}>
        {explicitLines.map((lineText, lineIdx) => (
          <React.Fragment key={lineIdx}>
            {lineIdx > 0 && <br />}
            {lineText.split(/\s+/).filter(Boolean).map((word, wordIdx) => (
              <React.Fragment key={wordIdx}>
                {wordIdx > 0 && ' '}
                <span data-rh-word={true} data-rh-explicit={lineIdx}>
                  {word}
                </span>
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </Tag>
    );
  }

  return (
    <Tag ref={containerRef} className={combinedClassName}>
      {lines.map((lineText, lineIdx) => (
        <React.Fragment key={lineIdx}>
          {lineIdx > 0 && <br />}
          <span data-rh-line={true} className="relative inline-block">
            <span className="block whitespace-nowrap">{lineText}</span>
            {!skip && (
              <React.Fragment>
                <span
                  data-rh-brand={true}
                  aria-hidden="true"
                  className="absolute -inset-x-[0.1em] -inset-y-[0.1em] block bg-brand"
                />
                <span
                  data-rh-fg={true}
                  aria-hidden="true"
                  className="absolute -inset-x-[0.1em] -inset-y-[0.1em] block bg-foreground"
                />
              </React.Fragment>
            )}
          </span>
        </React.Fragment>
      ))}
    </Tag>
  );
});

export default RevealHeadline;
