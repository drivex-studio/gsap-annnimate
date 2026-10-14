"use client";
import { forwardRef, Fragment, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useReveal } from '@/animations/hooks/useReveal';

function normalizeText(value) {
  if (value == null || value === false) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(normalizeText).join('');
  }
  return '';
}

const RevealHeadline = forwardRef(function RevealHeadline(
  {
    children,
    as: Tag = 'h2',
    sizeClass = 'text-h2',
    className = '',
    trigger = 'scroll',
    start = 'top 80%',
    skip = false,
  },
  ref,
) {
  const containerRef = useRef(null);
  const [lines, setLines] = useState(null);

  const text = normalizeText(children);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const words = containerRef.current.querySelectorAll('[data-rh-word]');
    if (words.length === 0) return;

    const nextLines = [];
    let currentWords = [];
    let previousTop = -Infinity;
    let previousExplicitLine = -1;

    for (const word of words) {
      const top = word.getBoundingClientRect().top;
      const explicitLine = Number(word.dataset.rhExplicit ?? -1);
      const isExplicitBreak =
        explicitLine !== previousExplicitLine &&
        previousExplicitLine !== -1;

      if (
        (previousTop > -Infinity && top - previousTop > 2) ||
        isExplicitBreak
      ) {
        nextLines.push(currentWords.join(' '));
        currentWords = [];
      }

      currentWords.push(word.textContent || '');
      previousTop = top;
      previousExplicitLine = explicitLine;
    }

    if (currentWords.length > 0) {
      nextLines.push(currentWords.join(' '));
    }

    setLines(nextLines);
  }, [text]);

  const { reveal } = useReveal(containerRef, {
    mode:
      trigger === 'pageEnter'
        ? 'hero'
        : trigger === 'manual'
          ? 'manual'
          : 'scroll',
    build:
      skip || !lines
        ? null
        : (element) => {
            const timeline = gsap.timeline({ paused: true });
            const lineElements = element.querySelectorAll('[data-rh-line]');

            for (let index = 0; index < lineElements.length; index++) {
              const line = lineElements[index];
              const brand = line.querySelector('[data-rh-brand]');
              const foreground = line.querySelector('[data-rh-fg]');

              if (!brand || !foreground) continue;

              gsap.set([brand, foreground], {
                scaleX: 1,
                transformOrigin: 'right',
              });

              const position = 0.12 * index;

              timeline.to(
                foreground,
                {
                  scaleX: 0,
                  duration: 0.5,
                  ease: 'power3.inOut',
                },
                position,
              );

              timeline.to(
                brand,
                {
                  scaleX: 0,
                  duration: 0.5,
                  ease: 'power3.inOut',
                },
                position + 0.1,
              );
            }

            return timeline;
          },
    start,
    deps: [lines, skip],
  });

  useImperativeHandle(ref, () => ({ reveal }), [reveal]);

  const headingClassName = `${sizeClass} ${className}`.trim();

  if (!lines) {
    const explicitLines = text.split('\n');

    return (
      <Tag
        ref={containerRef}
        className={headingClassName}
        style={{ visibility: 'hidden' }}
      >
        {explicitLines.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            {line
              .split(/\s+/)
              .filter(Boolean)
              .map((word, wordIndex) => (
                <Fragment key={wordIndex}>
                  {wordIndex > 0 && ' '}
                  <span
                    data-rh-word
                    data-rh-explicit={lineIndex}
                  >
                    {word}
                  </span>
                </Fragment>
              ))}
          </Fragment>
        ))}
      </Tag>
    );
  }

  return (
    <Tag ref={containerRef} className={headingClassName}>
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 && <br />}

          <span
            data-rh-line
            className="relative inline-block"
          >
            <span className="block whitespace-nowrap">
              {line}
            </span>

            {!skip && (
              <>
                <span
                  data-rh-brand
                  aria-hidden="true"
                  className="absolute -inset-x-[0.1em] -inset-y-[0.1em] block bg-brand"
                />

                <span
                  data-rh-fg
                  aria-hidden="true"
                  className="absolute -inset-x-[0.1em] -inset-y-[0.1em] block bg-foreground"
                />
              </>
            )}
          </span>
        </Fragment>
      ))}
    </Tag>
  );
});

export default RevealHeadline;
