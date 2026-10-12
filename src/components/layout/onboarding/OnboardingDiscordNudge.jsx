"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from '@phosphor-icons/react';
import { ArrowRight, DiscordLogo } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import Link from '@/components/navigation/Link';
import { analytics } from '@/libs/utils/analytics';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { useUser } from '@/providers/UserProvider';
import { useSidebar } from '@/providers/SidebarProvider';
import { getDiscordLinkForUser } from '@/libs/utils/discord';
import { useDualLayerScramble } from '@/hooks/useDualLayerScramble';

const DISCORD_DISMISSED_KEY = "anm_onboarding_discord_dismissed";

function OnboardingSuccessModal({ onClose }) {
  let { ref, scramble, kill } = useDualLayerScramble();
  let [showPop, setShowPop] = useState(false);

  useEffect(() => {
    let rafId = requestAnimationFrame(() => setShowPop(true));
    scramble({ duration: 0.7 });
    return () => {
      cancelAnimationFrame(rafId);
      kill();
    };
  }, [scramble, kill]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="absolute right-0 top-0 flex size-24 items-center justify-center text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground"
      >
        <X size={14} />
      </button>
      <span className={`mb-16 block size-12 bg-brand transition-transform duration-(--duration-snap) ease-(--ease-back-out) ${showPop ? "scale-100" : "scale-0"}`} />
      <h3 ref={ref} className="text-h5 m-0 text-foreground">You're shipping.</h3>
      <p className="text-body-sm mt-12 text-foreground-muted">
        Copy, tune, paste - the whole library works exactly like this.
      </p>
      <div className="mt-20">
        <Button href="/animations" onClick={onClose} theme="brand" size="xs" className="w-full">
          Explore the library
        </Button>
      </div>
    </div>
  );
}

export default function OnboardingDiscordNudge() {
  let { active, steps, allDone, starterSlug, dismiss } = useOnboarding();
  let { profile } = useUser();
  let { isCollapsed, isMobile } = useSidebar();
  
  let [isVisible, setIsVisible] = useState(false);
  let [showSuccess, setShowSuccess] = useState(false);
  let [isDiscordDismissed, setIsDiscordDismissed] = useState(true);

  useEffect(() => {
    try {
      setIsDiscordDismissed(localStorage.getItem(DISCORD_DISMISSED_KEY) === "1");
    } catch {}
  }, []);

  let shouldShowNudge = steps.copy && !isDiscordDismissed && !allDone && !showSuccess;
  let hasTrackedShown = useRef(false);

  useEffect(() => {
    if (shouldShowNudge && !hasTrackedShown.current) {
      hasTrackedShown.current = true;
      analytics.track("onboarding_discord_nudge_shown");
    }
  }, [shouldShowNudge]);

  useEffect(() => {
    if (active) {
      let rafId = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(rafId);
    }
    setIsVisible(false);
  }, [active]);

  useEffect(() => {
    if (allDone && !showSuccess) {
      let timeoutId = setTimeout(() => setShowSuccess(true), 850);
      return () => clearTimeout(timeoutId);
    }
  }, [allDone, showSuccess]);

  if (!active) return null;

  let completedCount = [steps.stack, steps.copy, steps.tune].filter(Boolean).length;
  
  let tasks = [
    { key: "stack", label: "Pick your stack", done: steps.stack },
    { key: "copy", label: "Copy your first component", done: steps.copy, href: `/animations/${starterSlug}` },
    { key: "tune", label: "Tune it - edit the code, watch it update", done: steps.tune }
  ];
  
  let nextTaskKey = tasks.find((t) => !t.done && t.href)?.key;

  let sidebarOffset = (isMobile ? 0 : isCollapsed ? 64 : 256) + 24;

  return (
    <div
      data-theme="dark"
      style={{ left: `${sidebarOffset}px` }}
      className={`fixed bottom-24 z-[60] hidden w-[320px] border border-foreground/10 bg-background p-16 shadow-[0_8px_40px_rgba(0,0,0,0.45)] transition-[opacity,transform,left] duration-(--duration-snap) ease-(--ease-expo-out) md:block ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
    >
      {showSuccess ? (
        <OnboardingSuccessModal onClose={dismiss} />
      ) : (
        <React.Fragment>
          <div className="mb-16 flex items-center justify-between">
            <p className="text-accent-xs flex items-center gap-8 text-foreground">
              <span className="size-8 shrink-0 bg-brand" />
              {allDone ? "You're all set" : "Getting started"}
            </p>
            <div className="flex items-center gap-10">
              {!allDone && (
                <span className="text-accent-xs text-foreground-muted">{completedCount}/3</span>
              )}
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                className="flex size-24 items-center justify-center text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          
          <ul className="flex flex-col gap-10">
            {tasks.map((task) => {
              let isNextTask = task.key === nextTaskKey;
              let content = (
                <React.Fragment>
                  <span className={`mt-1 flex size-18 shrink-0 items-center justify-center transition-colors duration-(--duration-quick) ${task.done ? "bg-brand text-[#141314]" : "border border-foreground/20 text-foreground-muted"}`}>
                    {task.done ? <Check size={15} /> : null}
                  </span>
                  <span className={`text-body-sm ${task.done ? "text-foreground-muted line-through" : "text-foreground"}`}>
                    {task.label}
                  </span>
                  {isNextTask && task.href ? (
                    <ArrowRight size={13} className="ml-auto mt-1 shrink-0 text-foreground-muted" />
                  ) : null}
                </React.Fragment>
              );
              
              if (isNextTask && task.href) {
                return (
                  <li key={task.key}>
                    <Link href={task.href} className="flex items-start gap-10 transition-opacity duration-(--duration-quick) hover:opacity-80">
                      {content}
                    </Link>
                  </li>
                );
              }
              return <li key={task.key} className="flex items-start gap-10">{content}</li>;
            })}
          </ul>
          
          {shouldShowNudge && (
            <div className="mt-16 border-t border-foreground/10 pt-16">
              <div className="mb-8 flex items-start justify-between gap-10">
                <div className="flex items-center gap-8">
                  <DiscordLogo size={14} className="shrink-0 text-brand" />
                  <p className="text-accent-xs text-foreground">Devs hang out here</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    try { localStorage.setItem(DISCORD_DISMISSED_KEY, "1"); } catch {}
                    setIsDiscordDismissed(true);
                    analytics.track("onboarding_discord_nudge_dismissed");
                  }}
                  aria-label="Dismiss Discord tip"
                  className="flex size-20 shrink-0 items-center justify-center text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground"
                >
                  <X size={12} />
                </button>
              </div>
              <p className="text-body-sm mb-12 text-foreground-muted">
                Drop in. Share what you build, see what others ship, get help when something breaks.
              </p>
              <Button
                href={getDiscordLinkForUser(profile)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  try { localStorage.setItem(DISCORD_DISMISSED_KEY, "1"); } catch {}
                  setIsDiscordDismissed(true);
                  analytics.track("onboarding_discord_nudge_clicked");
                }}
                theme="surface"
                size="xs"
                className="w-full"
              >
                Join the Discord
              </Button>
            </div>
          )}
        </React.Fragment>
      )}
    </div>
  );
}
