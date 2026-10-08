"use client";
import React, { useState, useEffect, useRef, Fragment } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { translate as t } from '@/libs/utils/i18n';
import { analytics } from '@/libs/utils/analytics';
import { isRouteActive } from '@/libs/config/isRouteActive';
import NavLink from '@/components/navigation/NavLink';
import LogoText from '@/assets/logos/LogoText';
import { AI_LINKS } from './FooterData';

export function AskAi() {
  return (
    <div className="flex flex-wrap items-center gap-x-12 gap-y-8">
      <span className="text-mono-sm text-foreground-muted">{t('common.footer.askAi')}</span>
      <div className="flex items-center gap-6">
        {AI_LINKS.map(({ name, href, Icon }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ask about Annnimate on ${name}`}
            onClick={() => analytics.askAi.clicked(name.toLowerCase())}
            className="inline-flex size-28 items-center justify-center border border-foreground/10 text-foreground-muted transition-colors duration-300 ease-out hover:border-foreground/30 hover:text-foreground"
          >
            <Icon />
          </a>
        ))}
      </div>
    </div>
  );
}

export function MobileAccordionColumn({ label, links }) {
  let pathname = usePathname();
  let [expanded, setExpanded] = useState(false);
  let contentRef = useRef(null);
  let iconRef = useRef(null);
  let minusRef = useRef(null);
  let timelineRef = useRef(null);

  useEffect(() => {
    let content = contentRef.current;
    if (!content) return;
    
    gsap.set(content, { height: 0, overflow: 'hidden', force3D: true });
    
    let tl = gsap.timeline({ paused: true, defaults: { duration: 0.5, ease: 'expo.inOut' } });
    tl.to(content, { height: 'auto' }, 0);
    
    if (iconRef.current) tl.to(iconRef.current, { rotation: -180 }, 0);
    if (minusRef.current) tl.to(minusRef.current, { opacity: 0, duration: 0.25, ease: 'power2.inOut' }, 0.1);
    
    timelineRef.current = tl;
    return () => tl.kill();
  }, []);

  useEffect(() => {
    if (timelineRef.current) {
      if (expanded) timelineRef.current.play();
      else timelineRef.current.reverse();
    }
  }, [expanded]);

  return (
    <div className="border-b border-foreground/10 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-16 py-20 text-left text-foreground transition-colors duration-300"
      >
        <span className="text-mono-sm">{label}</span>
        <svg ref={iconRef} className="h-12 w-12 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path ref={minusRef} d="M8 1V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M1 8H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      </button>
      <div ref={contentRef}>
        <ul className="flex flex-col gap-4 pb-20">
          {links.map(link => (
            <li key={link.label}>
              <NavLink
                href={link.href}
                active={!link.external && isRouteActive(pathname, link.href)}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="text-body-sm text-foreground"
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function FooterClock() {
  let [timeStr, setTimeStr] = useState(null);
  
  useEffect(() => {
    let formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Vienna'
    });
    
    let updateTime = () => setTimeStr(formatter.format(new Date()));
    updateTime();
    
    let intervalId = setInterval(updateTime, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <span className="text-mono-sm text-foreground-muted">
      {timeStr ? t('common.footer.studioClock', { time: timeStr }) : ''}
    </span>
  );
}

export function StatusIndicator({ latest }) {
  let relativeTimeStr = function(dateString) {
    if (!dateString) return null;
    let time = new Date(dateString).getTime();
    if (Number.isNaN(time)) return null;
    
    let daysAgo = Math.floor((Date.now() - time) / 86400000);
    if (daysAgo <= 0) return t('common.footer.relativeTime.today');
    if (daysAgo === 1) return t('common.footer.relativeTime.yesterday');
    if (daysAgo < 7) return t('common.footer.relativeTime.daysAgo', { n: daysAgo });
    if (daysAgo < 30) {
      let weeks = Math.floor(daysAgo / 7);
      return weeks === 1 ? t('common.footer.relativeTime.weekAgo') : t('common.footer.relativeTime.weeksAgo', { n: weeks });
    }
    
    let months = Math.floor(daysAgo / 30);
    return months === 1 ? t('common.footer.relativeTime.monthAgo') : t('common.footer.relativeTime.monthsAgo', { n: months });
  }(latest?.published_at);
  
  let title = latest?.title;
  let slug = latest?.slug;

  return (
    <div className="text-mono-sm flex flex-wrap items-center gap-x-12 gap-y-4 text-foreground-muted">
      <span className="relative inline-flex h-12 w-12" aria-hidden="true">
        <span className="absolute inset-0 animate-ping bg-brand opacity-60" />
        <span className="relative inline-block h-12 w-12 bg-brand" />
      </span>
      {title && slug ? (
        <Fragment>
          <span>{t('common.footer.status.justShipped')}</span>
          <NavLink href={`/animations/${slug}`} className="text-mono-sm text-foreground">
            {title}
          </NavLink>
          {relativeTimeStr ? (
            <Fragment>
              <span className="opacity-40">·</span>
              <span>{relativeTimeStr}</span>
            </Fragment>
          ) : null}
        </Fragment>
      ) : (
        <span>{t('common.footer.status.default')}</span>
      )}
    </div>
  );
}

export function FooterWordmark() {
  let containerRef = useRef(null);
  let [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true);
      return;
    }
    
    let observer = new IntersectionObserver(([entry]) => {
      setRevealed(entry.isIntersecting);
    }, { rootMargin: '0px 0px -5% 0px' });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="footer-wordmark w-full max-w-[1920px] mx-auto py-48 lg:py-80" data-revealed={revealed ? 'true' : 'false'}>
      <div className="overflow-hidden">
        <LogoText width="100%" style={{ height: 'auto' }} className="footer-wordmark-svg block text-foreground/10" />
      </div>
    </div>
  );
}
