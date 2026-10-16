"use client";

import React, { useState, useRef, useEffect, forwardRef, Fragment } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

import IconBase from '@/assets/icons/IconBase';
import { CaretDown, Play } from '@phosphor-icons/react';
import Link from '@/components/navigation/Link';
import AnimatedButton from '@/animations/components/AnimatedButton';
import { cn } from '@/libs/utils/className';
import { analytics } from '@/libs/utils/analytics';
import ServerData, { effectiveCyclePrice } from '@/libs/auth/data/ServerData';

const pauseWeights = new Map([
  [
    'bold',
    <Fragment>
      <path d="M200,28H160a20,20,0,0,0-20,20V208a20,20,0,0,0,20,20h40a20,20,0,0,0,20-20V48A20,20,0,0,0,200,28Zm-4,176H164V52h32ZM96,28H56A20,20,0,0,0,36,48V208a20,20,0,0,0,20,20H96a20,20,0,0,0,20-20V48A20,20,0,0,0,96,28ZM92,204H60V52H92Z" />
    </Fragment>
  ],
  [
    'duotone',
    <Fragment>
      <path d="M208,48V208a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V48a8,8,0,0,1,8-8h40A8,8,0,0,1,208,48ZM96,40H56a8,8,0,0,0-8,8V208a8,8,0,0,0,8,8H96a8,8,0,0,0,8-8V48A8,8,0,0,0,96,40Z" opacity="0.2" />
      <path d="M200,32H160a16,16,0,0,0-16,16V208a16,16,0,0,0,16,16h40a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm0,176H160V48h40ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Zm0,176H56V48H96Z" />
    </Fragment>
  ],
  [
    'fill',
    <Fragment>
      <path d="M216,48V208a16,16,0,0,1-16,16H160a16,16,0,0,1-16-16V48a16,16,0,0,1,16-16h40A16,16,0,0,1,216,48ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Z" />
    </Fragment>
  ],
  [
    'light',
    <Fragment>
      <path d="M200,34H160a14,14,0,0,0-14,14V208a14,14,0,0,0,14,14h40a14,14,0,0,0,14-14V48A14,14,0,0,0,200,34Zm2,174a2,2,0,0,1-2,2H160a2,2,0,0,1-2-2V48a2,2,0,0,1,2-2h40a2,2,0,0,1,2,2ZM96,34H56A14,14,0,0,0,42,48V208a14,14,0,0,0,14,14H96a14,14,0,0,0,14-14V48A14,14,0,0,0,96,34Zm2,174a2,2,0,0,1-2,2H56a2,2,0,0,1-2-2V48a2,2,0,0,1,2-2H96a2,2,0,0,1,2,2Z" />
    </Fragment>
  ],
  [
    'regular',
    <Fragment>
      <path d="M200,32H160a16,16,0,0,0-16,16V208a16,16,0,0,0,16,16h40a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm0,176H160V48h40ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Zm0,176H56V48H96Z" />
    </Fragment>
  ],
  [
    'thin',
    <Fragment>
      <path d="M200,36H160a12,12,0,0,0-12,12V208a12,12,0,0,0,12,12h40a12,12,0,0,0,12-12V48A12,12,0,0,0,200,36Zm4,172a4,4,0,0,1-4,4H160a4,4,0,0,1-4-4V48a4,4,0,0,1,4-4h40a4,4,0,0,1,4,4ZM96,36H56A12,12,0,0,0,44,48V208a12,12,0,0,0,12,12H96a12,12,0,0,0,12-12V48A12,12,0,0,0,96,36Zm4,172a4,4,0,0,1-4,4H56a4,4,0,0,1-4-4V48a4,4,0,0,1,4-4H96a4,4,0,0,1,4,4Z" />
    </Fragment>
  ]
]);

export const PauseIcon = forwardRef((props, ref) => (
  <IconBase ref={ref} {...props} weights={pauseWeights} />
));
PauseIcon.displayName = 'PauseIcon';

const repeatWeights = new Map([
  [
    'bold',
    <Fragment>
      <path d="M20,128A76.08,76.08,0,0,1,96,52h99l-3.52-3.51a12,12,0,1,1,17-17l24,24a12,12,0,0,1,0,17l-24,24a12,12,0,0,1-17-17L195,76H96a52.06,52.06,0,0,0-52,52,12,12,0,0,1-24,0Zm204-12a12,12,0,0,0-12,12,52.06,52.06,0,0,1-52,52H61l3.52-3.51a12,12,0,1,0-17-17l-24,24a12,12,0,0,0,0,17l24,24a12,12,0,1,0,17-17L61,204h99a76.08,76.08,0,0,0,76-76A12,12,0,0,0,224,116Z" />
    </Fragment>
  ],
  [
    'duotone',
    <Fragment>
      <path d="M224,64v64a64,64,0,0,1-64,64H32V128A64,64,0,0,1,96,64Z" opacity="0.2" />
      <path d="M24,128A72.08,72.08,0,0,1,96,56H204.69L194.34,45.66a8,8,0,0,1,11.32-11.32l24,24a8,8,0,0,1,0,11.32l-24,24a8,8,0,0,1-11.32-11.32L204.69,72H96a56.06,56.06,0,0,0-56,56,8,8,0,0,1-16,0Zm200-8a8,8,0,0,0-8,8,56.06,56.06,0,0,1-56,56H51.31l10.35-10.34a8,8,0,0,0-11.32-11.32l-24,24a8,8,0,0,0,0,11.32l24,24a8,8,0,0,0,11.32-11.32L51.31,200H160a72.08,72.08,0,0,0,72-72A8,8,0,0,0,224,120Z" />
    </Fragment>
  ],
  [
    'fill',
    <Fragment>
      <path d="M24,128A72.08,72.08,0,0,1,96,56h96V40a8,8,0,0,1,13.66-5.66l24,24a8,8,0,0,1,0,11.32l-24,24A8,8,0,0,1,192,88V72H96a56.06,56.06,0,0,0-56,56,8,8,0,0,1-16,0Zm200-8a8,8,0,0,0-8,8,56.06,56.06,0,0,1-56,56H64V168a8,8,0,0,0-13.66-5.66l-24,24a8,8,0,0,0,0,11.32l24,24A8,8,0,0,0,64,216V200h96a72.08,72.08,0,0,0,72-72A8,8,0,0,0,224,120Z" />
    </Fragment>
  ],
  [
    'light',
    <Fragment>
      <path d="M26,128A70.08,70.08,0,0,1,96,58H209.51L195.76,44.24a6,6,0,0,1,8.48-8.48l24,24a6,6,0,0,1,0,8.48l-24,24a6,6,0,0,1-8.48-8.48L209.51,70H96a58.07,58.07,0,0,0-58,58,6,6,0,0,1-12,0Zm198-6a6,6,0,0,0-6,6,58.07,58.07,0,0,1-58,58H46.49l13.75-13.76a6,6,0,0,0-8.48-8.48l-24,24a6,6,0,0,0,0,8.48l24,24a6,6,0,0,0,8.48-8.48L46.49,198H160a70.08,70.08,0,0,0,70-70A6,6,0,0,0,224,122Z" />
    </Fragment>
  ],
  [
    'regular',
    <Fragment>
      <path d="M24,128A72.08,72.08,0,0,1,96,56H204.69L194.34,45.66a8,8,0,0,1,11.32-11.32l24,24a8,8,0,0,1,0,11.32l-24,24a8,8,0,0,1-11.32-11.32L204.69,72H96a56.06,56.06,0,0,0-56,56,8,8,0,0,1-16,0Zm200-8a8,8,0,0,0-8,8,56.06,56.06,0,0,1-56,56H51.31l10.35-10.34a8,8,0,0,0-11.32-11.32l-24,24a8,8,0,0,0,0,11.32l24,24a8,8,0,0,0,11.32-11.32L51.31,200H160a72.08,72.08,0,0,0,72-72A8,8,0,0,0,224,120Z" />
    </Fragment>
  ],
  [
    'thin',
    <Fragment>
      <path d="M28,128A68.07,68.07,0,0,1,96,60H214.34L197.17,42.83a4,4,0,0,1,5.66-5.66l24,24a4,4,0,0,1,0,5.66l-24,24a4,4,0,0,1-5.66-5.66L214.34,68H96a60.07,60.07,0,0,0-60,60,4,4,0,0,1-8,0Zm196-4a4,4,0,0,0-4,4,60.07,60.07,0,0,1-60,60H41.66l17.17-17.17a4,4,0,0,0-5.66-5.66l-24,24a4,4,0,0,0,0,5.66l24,24a4,4,0,1,0,5.66-5.66L41.66,196H160a68.07,68.07,0,0,0,68-68A4,4,0,0,0,224,124Z" />
    </Fragment>
  ]
]);

export const RepeatIcon = forwardRef((props, ref) => (
  <IconBase ref={ref} {...props} weights={repeatWeights} />
));
RepeatIcon.displayName = 'RepeatIcon';

export function Tag({ category, slug, children, className }) {
  return (
    <Link
      href={`/learn/${category}/${slug}`}
      className={cn(
        "inline-flex items-center gap-8 bg-foreground/[0.05] px-10 py-6",
        "text-accent-xs normal-case text-foreground-muted",
        "transition-colors duration-(--duration-quick) ease-(--ease-expo-out)",
        "hover:bg-foreground/[0.10] hover:text-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
}

const TIMELINE_COLORS = [
  '96 165 250',
  '167 139 250',
  '232 121 249',
  '45 212 191',
  '251 191 36',
  '74 222 128',
  '251 113 133',
  '34 211 238'
];

function StaggerSpread({ spread, count }) {
  const maxItems = Math.min(count, 24);
  const percentage = spread / maxItems;
  
  return (
    <Fragment>
      {Array.from({ length: maxItems }, (_, i) => (
        <span
          key={`in-${i}`}
          className="absolute inset-y-0 border-r border-[rgb(var(--bar-c)/0.45)] bg-[rgb(var(--bar-c)/0.35)]"
          style={{
            left: `${i * percentage * 100}%`,
            width: `${percentage * 100}%`,
            opacity: (i + 1) / maxItems
          }}
        />
      ))}
      
      {1 - 2 * spread > 0 && (
        <span
          className="absolute inset-y-0 bg-[rgb(var(--bar-c)/0.35)]"
          style={{
            left: `${spread * 100}%`,
            width: `${(1 - 2 * spread) * 100}%`
          }}
        />
      )}
      
      {Array.from({ length: maxItems }, (_, i) => (
        <span
          key={`out-${i}`}
          className="absolute inset-y-0 border-r border-[rgb(var(--bar-c)/0.45)] bg-[rgb(var(--bar-c)/0.35)]"
          style={{
            right: `${i * percentage * 100}%`,
            width: `${percentage * 100}%`,
            opacity: (i + 1) / maxItems
          }}
        />
      ))}
    </Fragment>
  );
}

function TimelineTooltip({ row, hasAccess }) {
  const details = [];
  
  if (row.full && hasAccess) {
    details.push(['Duration', `${row.full.durSec}s`]);
    if (row.full.ease) details.push(['Ease', row.full.ease]);
    if (row.full.staggerSec) details.push(['Stagger', `${row.full.staggerSec}s each`]);
    details.push(['Starts', `${row.full.startSec}s`]);
  }
  
  if (row.targetCount > 1) {
    details.push(['Targets', String(row.targetCount)]);
  }
  
  if (row.props?.length) {
    details.push(['Animates', row.props.slice(0, 4).join(', ')]);
  }
  
  if (details.length === 0) return null;
  
  return (
    <div className="pointer-events-none min-w-[200px] border border-foreground/10 bg-surface p-12">
      <dl className="grid grid-cols-[auto_1fr] gap-x-16 gap-y-4">
        {details.map(([term, definition]) => (
          <div key={term} className="contents">
            <dt className="text-accent-base normal-case text-foreground-muted">{term}</dt>
            <dd className="text-accent-base normal-case text-foreground">{definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TimelineRow({ row, index, barRef, inert, onEnter, onLeave, onBarEnter, onBarLeave }) {
  return (
    <div
      className="group relative"
      style={{ height: 28 }}
      onMouseEnter={inert ? undefined : onEnter}
      onMouseLeave={inert ? undefined : onLeave}
    >
      <div
        ref={barRef}
        onMouseEnter={inert ? undefined : onBarEnter}
        onMouseLeave={inert ? undefined : onBarLeave}
        className={cn(
          "absolute top-1/2 flex h-24 -translate-y-1/2 items-center border transition-colors duration-(--duration-quick)",
          "bg-[rgb(var(--bar-c)/0.10)] border-[rgb(var(--bar-c)/0.30)]",
          "data-[active=true]:bg-[rgb(var(--bar-c)/0.25)]",
          row.kind === 'nested' && "border-x-2",
          row.kind === 'marker' && "border-l-2"
        )}
        style={{
          "--bar-c": TIMELINE_COLORS[index % TIMELINE_COLORS.length],
          left: `${row.start * 100}%`,
          width: row.kind === 'marker' ? `max(4px, ${row.width * 100}%)` : `${row.width * 100}%`
        }}
      >
        {row.staggerSpread > 0 && row.targetCount > 1 && (
          <StaggerSpread spread={row.staggerSpread} count={row.targetCount} />
        )}
        <span className="relative z-10 whitespace-nowrap pl-8 text-accent-xs leading-none text-foreground/90 group-hover:text-foreground">
          {row.label}
        </span>
        {row.staggerSpread > 0.12 && row.targetCount > 1 && (
          <span className="relative z-10 ml-auto hidden whitespace-nowrap pr-8 text-accent-2xs leading-none text-foreground/50 sm:inline">
            Stagger
          </span>
        )}
      </div>
    </div>
  );
}

export default function TimelineStrip({ animation, hasAccess = false, className = '' }) {
  const [rows, setRows] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [axisType, setAxisType] = useState('time');
  const [cycleLength, setCycleLength] = useState(null);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  
  const playheadRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const rowRefs = useRef([]);
  const iframeRef = useRef(null);
  const rowsDataRef = useRef(null);
  const currentAxisRef = useRef('time');
  const isScrubbingRef = useRef(false);
  const lastScrubTimeRef = useRef(0);
  const hoverTimeoutRef = useRef(null);
  const lastHoverTimeRef = useRef(0);
  const isReducedMotionRef = useRef(false);
  const hasTrackedViewRef = useRef(false);
  
  const storageKey = animation?.slug ? `anm-tl-${animation.slug}` : null;

  const clearHoverState = () => {
    clearTimeout(hoverTimeoutRef.current);
    lastHoverTimeRef.current = Date.now();
    setHoveredRow(null);
  };

  const highlightRow = (index) => {
    try {
      iframeRef.current?.postMessage({ type: 'anm:timeline:highlight', index }, '*');
    } catch (e) {}
  };

  const togglePlayback = () => {
    setIsPlaying(prev => !prev);
    try {
      iframeRef.current?.postMessage({ type: 'anm:timeline:playpause' }, '*');
    } catch (e) {}
  };

  const scrubTimeline = (clientX, target) => {
    lastScrubTimeRef.current = Date.now();
    const rect = target.getBoundingClientRect();
    const progress = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));
    
    if (playheadRef.current) {
      playheadRef.current.style.setProperty('--tl-p', String(progress));
      playheadRef.current.style.opacity = '1';
    }
    
    try {
      iframeRef.current?.postMessage({ type: 'anm:timeline:scrub', progress }, '*');
    } catch (e) {}
  };

  useEffect(() => {
    if (storageKey && !rowsDataRef.current) {
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (stored && Array.isArray(stored.rows) && stored.rows.length >= 2) {
          rowsDataRef.current = stored.rows;
          currentAxisRef.current = stored.axis === 'scroll' ? 'scroll' : 'time';
          setRows(stored.rows);
          setAxisType(currentAxisRef.current);
        }
      } catch (e) {}
    }
  }, [storageKey]);

  useEffect(() => {
    function requestTimeline() {
      document.querySelectorAll('iframe').forEach(iframe => {
        try {
          iframe.contentWindow?.postMessage({ type: 'anm:timeline:resend' }, '*');
        } catch (e) {}
      });
    }
    requestTimeline();
    const timer = setTimeout(requestTimeline, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleMessage(event) {
      const data = event?.data;
      if (data && typeof data === 'object' && event.source !== window) {
        if (data.type === 'anm:timeline:idle') {
          iframeRef.current = event.source;
          if (!rowsDataRef.current) setIsActive(true);
          return;
        }
        
        if (data.type === 'anm:timeline:rows') {
          if (Array.isArray(data.rows) && data.rows.length >= 2) {
            iframeRef.current = event.source;
            setIsActive(false);
            rowsDataRef.current = data.rows;
            currentAxisRef.current = data.axis === 'scroll' ? 'scroll' : 'time';
            
            setRows(data.rows);
            setAxisType(currentAxisRef.current);
            setCycleLength(typeof data.cycle === 'number' && data.cycle > 0 ? data.cycle : null);
            
            clearTimeout(hoverTimeoutRef.current);
            setHoveredRow(null);
            
            if (storageKey) {
              try {
                localStorage.setItem(storageKey, JSON.stringify({
                  axis: data.axis,
                  rows: data.rows.map(({ full, ...rest }) => rest)
                }));
              } catch (e) {}
            }
            
            if (!hasTrackedViewRef.current) {
              hasTrackedViewRef.current = true;
              analytics.track('timeline_viewed', {
                animation_slug: animation?.slug,
                axis: data.axis,
                rows: data.rows.length
              });
            }
          }
          return;
        }
        
        if (data.type === 'anm:timeline:playhead') {
          iframeRef.current = event.source;
          
          if (isScrubbingRef.current || Date.now() - lastScrubTimeRef.current < 200) return;
          
          const playhead = playheadRef.current;
          if (!playhead) return;
          
          const progress = Math.max(0, Math.min(Number(data.progress) || 0, 1));
          playhead.style.setProperty('--tl-p', String(progress));
          
          setIsPlaying(prev => (!!data.active === prev ? prev : !!data.active));
          
          const isVisible = currentAxisRef.current === 'scroll' || data.active;
          playhead.style.opacity = isVisible ? '1' : '0';
          
          const currentRows = rowsDataRef.current || [];
          for (let i = 0; i < currentRows.length; i++) {
            const barEl = rowRefs.current[i];
            if (barEl) {
              if (isVisible && progress >= currentRows[i].start && progress <= currentRows[i].start + currentRows[i].width) {
                barEl.setAttribute('data-active', 'true');
              } else {
                barEl.removeAttribute('data-active');
              }
            }
          }
        }
      }
    }
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [animation?.slug, storageKey]);

  useGSAP(() => {
    if (!rows || isReducedMotionRef.current) return;
    isReducedMotionRef.current = true;
    
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    const elements = rowRefs.current.filter(Boolean);
    if (elements.length) {
      gsap.fromTo(
        elements,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.9, stagger: 0.07, ease: 'expo.out', force3D: true }
      );
    }
  }, { dependencies: [rows] });

  useEffect(() => () => clearTimeout(hoverTimeoutRef.current), []);

  useEffect(() => {
    if (!rows || axisType === 'scroll' || !hasAccess) return;
    
    function handleKeyDown(e) {
      if (e.code === 'Space' && !e.repeat && !e.target.closest?.('input, textarea, select, [contenteditable]')) {
        e.preventDefault();
        togglePlayback();
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rows, axisType, hasAccess]);

  if (!rows && !isActive) return null;

  const visibilityClass = isMobileExpanded ? 'block' : 'hidden lg:block';

  if (!rows) {
    return (
      <section className={cn("flex flex-col", className)} data-timeline-strip={true}>
        <button
          type="button"
          className="lg:hidden mt-12 flex items-center justify-between border border-foreground/10 px-16 py-12 text-body-sm text-foreground"
          onClick={() => setIsMobileExpanded(prev => !prev)}
          aria-expanded={isMobileExpanded}
        >
          <span>Timeline</span>
          <CaretDown className={cn("size-14 transition-transform duration-(--duration-quick) ease-(--ease-expo-out)", isMobileExpanded && "rotate-180")} />
        </button>
        <div className={cn(visibilityClass, "lg:mt-12")}>
          <div className="border border-foreground/10">
            <div className="relative h-24 border-b border-foreground/10">
              <span className="absolute left-0 top-0 flex h-full items-center pl-8">
                <span className="text-accent-2xs text-foreground-muted">Timeline</span>
              </span>
              {Array.from({ length: 11 }, (_, i) => (
                <span
                  key={i}
                  className="pointer-events-none absolute bottom-0 h-8 w-px bg-foreground/10"
                  style={{ left: `${i * 10}%` }}
                />
              ))}
            </div>
            <div className="flex items-center px-12" style={{ height: 56 }}>
              <p className="text-body-sm text-foreground-muted">
                Interact with the preview to capture its timeline.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const activeRowData = hoveredRow ? rows[hoveredRow.index] : null;
  const accessibleRows = hasAccess ? rows : rows.slice(0, 1);
  const gatedRows = hasAccess ? [] : rows.slice(1, 3);
  
  const soloPlan = ServerData.stripe?.landingPlans?.find(plan => plan.key === 'solo');
  const price = effectiveCyclePrice(soloPlan?.quarterly);

  const conceptTags = [{ category: 'timeline', slug: 'gsap-timeline', label: 'Timelines' }];
  if (rows.some(r => r.staggerSpread > 0)) {
    conceptTags.push({ category: 'timeline', slug: 'stagger', label: 'Stagger' });
  }
  if (rows.some(r => r.kind === 'nested')) {
    conceptTags.push({ category: 'timeline', slug: 'nested-timelines', label: 'Nested timelines' });
  }
  if (axisType === 'scroll') {
    conceptTags.push({ category: 'scroll', slug: 'scrolltrigger', label: 'ScrollTrigger' });
    if (rows.some(r => r.kind === 'scrub')) {
      conceptTags.push({ category: 'scroll', slug: 'scrub', label: 'Scrub' });
    }
  }

  return (
    <section className={cn("flex flex-col", className)} data-timeline-strip={true}>
      <button
        type="button"
        className="lg:hidden mt-12 flex items-center justify-between border border-foreground/10 px-16 py-12 text-body-sm text-foreground"
        onClick={() => setIsMobileExpanded(prev => !prev)}
        aria-expanded={isMobileExpanded}
      >
        <span>Timeline</span>
        <CaretDown className={cn("size-14 transition-transform duration-(--duration-quick) ease-(--ease-expo-out)", isMobileExpanded && "rotate-180")} />
      </button>
      
      <div className={cn(visibilityClass, "lg:mt-12")}>
        <div className="border border-foreground/10">
          <div className="relative">
            {activeRowData && (
              <div
                className="absolute z-30 -translate-y-full"
                style={{
                  left: `${Math.min(activeRowData.start * 100, 60)}%`,
                  top: 24 + 28 * hoveredRow.index - (scrollContainerRef.current?.scrollTop || 0) - 4
                }}
              >
                <TimelineTooltip row={activeRowData} hasAccess={hasAccess} />
              </div>
            )}
            
            <div
              className={cn("relative h-24 touch-none border-b border-foreground/10", hasAccess && "cursor-ew-resize")}
              onPointerDown={hasAccess ? e => {
                isScrubbingRef.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                scrubTimeline(e.clientX, e.currentTarget);
              } : undefined}
              onPointerMove={hasAccess ? e => {
                if (isScrubbingRef.current) scrubTimeline(e.clientX, e.currentTarget);
              } : undefined}
              onPointerUp={hasAccess ? () => (isScrubbingRef.current = false) : undefined}
              onPointerCancel={hasAccess ? () => (isScrubbingRef.current = false) : undefined}
            >
              <span className="absolute left-0 top-0 flex h-full items-center gap-8 pl-8">
                {hasAccess && axisType !== 'scroll' && (
                  <Fragment>
                    <button
                      type="button"
                      aria-label={isPlaying ? 'Pause the animation' : 'Play the animation'}
                      title="Play/pause (Space)"
                      className="pointer-events-auto flex size-18 cursor-pointer items-center justify-center text-foreground-muted transition-colors duration-(--duration-quick) hover:text-foreground"
                      onPointerDown={e => e.stopPropagation()}
                      onClick={togglePlayback}
                    >
                      {isPlaying ? <PauseIcon className="size-12" /> : <Play className="size-12" />}
                    </button>
                    <button
                      type="button"
                      aria-label={isLooping ? 'Stop looping' : 'Loop the animation'}
                      aria-pressed={isLooping}
                      title="Loop"
                      className={cn(
                        "pointer-events-auto flex size-18 cursor-pointer items-center justify-center transition-colors duration-(--duration-quick)",
                        isLooping ? "text-brand" : "text-foreground-muted hover:text-foreground"
                      )}
                      onPointerDown={e => e.stopPropagation()}
                      onClick={() => {
                        const newLoop = !isLooping;
                        setIsLooping(newLoop);
                        try {
                          iframeRef.current?.postMessage({ type: 'anm:timeline:loop', on: newLoop }, '*');
                        } catch (e) {}
                      }}
                    >
                      <RepeatIcon className="size-12" />
                    </button>
                  </Fragment>
                )}
                <span className="pointer-events-none text-accent-2xs text-foreground-muted">
                  Timeline
                </span>
              </span>
              
              {Array.from({ length: 11 }, (_, i) => (
                <span key={i} className="pointer-events-none">
                  <span
                    className="absolute bottom-0 h-8 w-px bg-foreground/10"
                    style={{ left: `${i * 10}%` }}
                  />
                  {i > 0 && i < 10 && hasAccess && (cycleLength || axisType === 'scroll') && (
                    <span
                      className="absolute bottom-6 -translate-x-1/2 text-accent-2xs text-foreground-muted/60"
                      style={{ left: `${i * 10}%` }}
                    >
                      {axisType === 'scroll' ? `${i * 10}%` : `${((cycleLength * i) / 10).toFixed(1)}s`}
                    </span>
                  )}
                </span>
              ))}
            </div>
            
            <div
              ref={scrollContainerRef}
              className={cn(!hasAccess && "overflow-hidden", hasAccess && "overflow-x-hidden overflow-y-auto")}
              style={hasAccess ? { maxHeight: 140 } : undefined}
            >
              {accessibleRows.map((row, index) => (
                <TimelineRow
                  key={`${row.label}-${index}`}
                  row={row}
                  index={index}
                  barRef={el => (rowRefs.current[index] = el)}
                  onEnter={() => highlightRow(index)}
                  onLeave={() => highlightRow(null)}
                  onBarEnter={() => {
                    clearTimeout(hoverTimeoutRef.current);
                    if (Date.now() - lastHoverTimeRef.current < 300) {
                      setHoveredRow({ index });
                    } else {
                      hoverTimeoutRef.current = setTimeout(() => setHoveredRow({ index }), 300);
                    }
                  }}
                  onBarLeave={clearHoverState}
                />
              ))}
              
              {gatedRows.length > 0 && (
                <div className="relative min-h-[132px]">
                  <div aria-hidden="true" className="pointer-events-none select-none">
                    {gatedRows.map((row, i) => (
                      <TimelineRow
                        key={`${row.label}-gated-${i}`}
                        row={row}
                        index={1 + i}
                        barRef={el => (rowRefs.current[1 + i] = el)}
                        inert={true}
                      />
                    ))}
                  </div>
                  <div
                    className="absolute inset-0 flex flex-col items-start justify-end gap-10 p-12"
                    style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--background) 45%, transparent) 0%, var(--background) 55%)' }}
                  >
                    <p className="text-body-sm text-foreground">
                      Members see every tween
                      {rows.length - 1 > 1 ? ` - ${rows.length - 1} more in this animation.` : '.'}
                    </p>
                    <AnimatedButton
                      href={`/checkout?plan=solo&cycle=quarterly${animation?.slug ? `&component=${animation.slug}` : ''}`}
                      onClick={() => analytics.track('timeline_unlock_clicked', { animation_slug: animation?.slug })}
                      theme="surface"
                      size="xs"
                    >
                      {price ? `Unlock everything - €${price}/mo` : 'Unlock everything'}
                    </AnimatedButton>
                    <p className="text-accent-xs text-foreground-muted">
                      Cancel anytime · 14-day money-back
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div
              ref={playheadRef}
              className="pointer-events-none absolute inset-0 transition-opacity duration-(--duration-quick)"
              style={{ '--tl-p': 0, opacity: 0 }}
            >
              <div
                className="absolute inset-y-0 w-px bg-brand"
                style={{ left: 'calc(var(--tl-p) * 100%)' }}
              >
                <span className="absolute -left-[2.5px] top-0 size-6 bg-brand" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-8 border-t border-foreground/10 px-12 py-8">
          <span className="mr-8 text-accent-2xs text-foreground-muted">Concepts</span>
          {conceptTags.map(tag => (
            <Tag key={`${tag.category}/${tag.slug}`} category={tag.category} slug={tag.slug}>
              {tag.label}
            </Tag>
          ))}
        </div>
      </div>
    </section>
  );
}
