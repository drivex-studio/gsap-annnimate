import React, { forwardRef, useRef, useState, useLayoutEffect, useImperativeHandle } from 'react';

import gsap from 'gsap'; // module id: 989970
import { useReveal } from '@/hooks/useReveal'; // module id: 228414

// module id: 963160
const RevealHeadline = forwardRef(function RevealHeadline({
  children, // original mangled: e
  as: Tag = 'h2', // original mangled: l
  sizeClass = 'text-h2', // original mangled: s
  className = '', // original mangled: a
  trigger = 'scroll', // original mangled: o
  start = 'top 80%', // original mangled: u
  skip = false // original mangled: c
}, ref) { // original mangled: d
  let containerRef = useRef(null); // original mangled: h
  let [lines, setLines] = useState(null); // original mangled: p, f

  // Recursively extract text from children
  let extractText = (node) => { // original mangled: g
    if (node == null || node === false) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractText).join('');
    return '';
  };
  let textContent = extractText(children); // original mangled: m

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    let wordNodes = containerRef.current.querySelectorAll('[data-rh-word]');
    if (wordNodes.length === 0) return;
    
    let computedLines = []; // original mangled: t
    let currentLineWords = []; // original mangled: r
    let prevTop = -Infinity; // original mangled: n
    let prevExplicitIndex = -1; // original mangled: i
    
    for (let node of wordNodes) {
      let top = node.getBoundingClientRect().top;
      let explicitIndex = Number(node.dataset.rhExplicit ?? -1);
      let hasExplicitBreak = explicitIndex !== prevExplicitIndex && prevExplicitIndex !== -1;
      
      // If the word drops to a new line visually (top difference > 2px) or there is an explicit \n break
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

  let { reveal } = useReveal(containerRef, { // original mangled: x
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

  let combinedClassName = `${sizeClass} ${className}`.trim(); // original mangled: b

  // Phase 1: Pre-split (Hidden render to calculate wrapping)
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

  // Phase 2: Post-split (Visible render with overlays)
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
