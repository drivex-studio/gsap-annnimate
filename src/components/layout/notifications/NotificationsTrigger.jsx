"use client";

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cva } from 'class-variance-authority';
import { cn } from '@/libs/utils/className';
import { useNotificationFeed } from '@/providers/NotificationProvider';
import { useSidebar } from '@/providers/SidebarProvider';
import { useScrollLockContext } from '@/providers/ScrollLockProvider';
import { Bell, Close } from '@phosphor-icons/react'; 

const badgeVariants = cva("inline-flex items-center rounded-full border px-10 py-2 text-xs font-medium", {
  variants: {
    variant: {
      default: "border-transparent bg-foreground/10 text-foreground",
      outline: "border-border text-muted-foreground",
      success: "border-brand/30 bg-brand/20 text-brand",
      info: "border-brand-muted/30 bg-brand-muted/20 text-brand-muted",
      new: "border-brand/30 bg-brand/20 text-brand"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

function NotificationBadge({ className, variant, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

const NOTIFICATION_TYPES = {
  animation: { label: "Animation", variant: "info" },
  blog: { label: "Blog", variant: "default" },
  feature: { label: "Feature", variant: "success" }
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  let date = new Date(dateStr);
  let minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  let hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  let days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  let weeks = Math.round(days / 7);
  return weeks < 5 ? `${weeks}w` : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function NotificationItem({ item, isUnread, onNavigate }) {
  let typeConfig = NOTIFICATION_TYPES[item.type] || NOTIFICATION_TYPES.feature;
  let hasThumbnail = !!item.thumbnail;

  return (
    <Link href={item.href} onClick={onNavigate} className="group relative flex gap-12 rounded-md p-12 microinteraction hover:bg-secondary">
      {isUnread && (
        <span aria-hidden="true" className="absolute left-4 top-20 h-6 w-6 rounded-full bg-brand" />
      )}
      {hasThumbnail && (
        <div className="relative h-56 w-80 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
          <Image
            src={item.thumbnail}
            alt=""
            fill={true}
            sizes="80px"
            className="object-cover"
            unoptimized={true}
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-8">
          <NotificationBadge variant={typeConfig.variant} className="px-8 py-0 text-[10px]">
            {typeConfig.label}
          </NotificationBadge>
          <span className="text-xs color-faded tabular-nums">
            {formatTimeAgo(item.date)}
          </span>
        </div>
        <h4 className="h6 mt-6 font-medium leading-snug line-clamp-2 group-hover:opacity-80">
          {item.title}
        </h4>
        {item.description && (
          <p className="mt-4 text-xs color-faded line-clamp-2">
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
}

gsap.registerPlugin(useGSAP);

function NotificationsModal({ open, onClose, items, lastSeenAt }) {
  let overlayRef = useRef(null);
  let dialogRef = useRef(null);
  let closeBtnRef = useRef(null);
  let tlRef = useRef(null);

  let { lockScroll, unlockScroll } = useScrollLockContext();
  let [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  let { thisWeek, earlier } = useMemo(() => {
    let now = Date.now();
    let recent = [];
    let past = [];
    for (let item of (items || [])) {
      if (now - new Date(item.date).getTime() <= 604800000) {
        recent.push(item);
      } else {
        past.push(item);
      }
    }
    return { thisWeek: recent, earlier: past };
  }, [items]);

  let lastSeenTime = lastSeenAt ? new Date(lastSeenAt).getTime() : 0;
  let isItemUnread = (item) => new Date(item.date).getTime() > lastSeenTime;

  useEffect(() => {
    if (open) {
      lockScroll();
    } else {
      unlockScroll();
    }
  }, [open, lockScroll, unlockScroll]);

  useEffect(() => {
    if (!open) return;
    let handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useGSAP(() => {
    if (!overlayRef.current || !dialogRef.current) return;
    
    if (!tlRef.current) {
      let prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      
      tlRef.current = gsap.timeline({
        paused: true,
        onComplete: () => closeBtnRef.current?.focus()
      })
      .fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power3.inOut", easeReverse: true }, 0)
      .fromTo(dialogRef.current, { x: "100%" }, { x: "0%", duration: 0.7, ease: "power3.inOut", easeReverse: true }, 0);
      
      if (prefersReducedMotion) {
        tlRef.current.timeScale(20);
      }
    }
    
    let tl = tlRef.current;
    if (open) {
      tl.play();
    } else {
      tl.reverse();
    }
  }, { dependencies: [open] });

  useEffect(() => {
    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
    };
  }, []);

  let isEmpty = (items || []).length === 0;

  if (!mounted) return null;

  return createPortal(
    <div className={cn("fixed inset-0 z-[70]", !open && "pointer-events-none")} aria-hidden={!open}>
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-background/40 backdrop-blur-sm opacity-0"
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="What's new"
        className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] translate-x-full bg-background border-l border-border flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-border px-20 py-16">
          <h2 className="h4 font-medium tracking-tight">What's new</h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-32 w-32 items-center justify-center rounded-md microinteraction hover:bg-secondary"
          >
            <Close className="h-16 w-16" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto overscroll-contain px-8 py-12" data-lenis-prevent={true}>
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center px-24 text-center">
              <p className="h5 font-medium">You're all caught up.</p>
              <p className="mt-8 text-sm color-faded">New animations and posts show up here.</p>
            </div>
          ) : (
            <React.Fragment>
              {thisWeek.length > 0 && (
                <section className="mb-8">
                  <p className="px-12 pb-8 pt-12 text-xs color-faded">This week</p>
                  <div className="flex flex-col gap-4">
                    {thisWeek.map((item) => (
                      <NotificationItem key={item.id} item={item} isUnread={isItemUnread(item)} onNavigate={onClose} />
                    ))}
                  </div>
                </section>
              )}
              {earlier.length > 0 && (
                <section>
                  <p className="px-12 pb-8 pt-12 text-xs color-faded">Earlier</p>
                  <div className="flex flex-col gap-4">
                    {earlier.map((item) => (
                      <NotificationItem key={item.id} item={item} isUnread={isItemUnread(item)} onNavigate={onClose} />
                    ))}
                  </div>
                </section>
              )}
            </React.Fragment>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const LAST_SEEN_KEY = "annnimate_notifications_last_seen_at";

export default function NotificationsTrigger({ className }) {
  let { items, latestDate } = useNotificationFeed();
  let { isCollapsed, isMobile } = useSidebar();
  
  let isIconOnly = isCollapsed && !isMobile;
  let [isOpen, setIsOpen] = useState(false);
  let [lastSeen, setLastSeen] = useState(null);
  let [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setLastSeen(localStorage.getItem(LAST_SEEN_KEY));
    } catch (err) {}
    setMounted(true);
  }, []);

  let hasUnread = mounted && latestDate && (!lastSeen || new Date(latestDate).getTime() > new Date(lastSeen).getTime());

  return (
    <React.Fragment>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          if (latestDate) {
            let nowIso = new Date().toISOString();
            try {
              localStorage.setItem(LAST_SEEN_KEY, nowIso);
            } catch (err) {}
            setLastSeen(nowIso);
          }
        }}
        aria-label={hasUnread ? "What's new (unread)" : "What's new"}
        title={isIconOnly ? "What's new" : undefined}
        className={cn(
          "group relative flex h-40 w-full items-center rounded-[2px] text-foreground-muted",
          "transition-colors duration-(--duration-fast) ease-(--ease-power3-out)",
          "hover:text-foreground",
          isIconOnly ? "justify-center px-0" : "gap-12 px-12",
          className
        )}
      >
        <span aria-hidden="true" className="pointer-events-none relative inline-flex shrink-0 items-center justify-center">
          <Bell className="size-18" aria-hidden="true" />
          {isIconOnly && hasUnread ? (
            <span className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-brand" />
          ) : null}
        </span>
        
        {!isIconOnly && (
          <span className="pointer-events-none min-w-0 flex-1 truncate text-left text-body-sm">
            What's new
          </span>
        )}
        
        {!isIconOnly && hasUnread ? (
          <span aria-hidden="true" className="pointer-events-none h-6 w-6 rounded-full bg-brand" />
        ) : null}
      </button>

      <NotificationsModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        items={items}
        lastSeenAt={lastSeen}
      />
    </React.Fragment>
  );
}
