"use client";

import React, { useState, useEffect, useRef } from 'react';

import CloseIcon from '@/components/icons/CloseIcon';
import SubscribeForm from '@/components/forms/SubscribeForm';
import { 
  Dialog, 
  DialogContent, 
  DialogClose, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/Dialog';

import { STARTER_PROMPT_KEY, readSubscriberId } from '@/libs/utils/subscribe';

function isDismissedWithin30Days(key) {
  try {
    let val = window.localStorage.getItem(key);
    if (!val) return false;
    let parsedTimestamp = parseInt(val, 10);
    if (Number.isNaN(parsedTimestamp)) return false;
    return Date.now() - parsedTimestamp < 2592000000;
  } catch {
    return false;
  }
}

function shouldHidePrompt(key) {
  return isDismissedWithin30Days(STARTER_PROMPT_KEY) || isDismissedWithin30Days(key) || !!readSubscriberId();
}

export default function StarterPackModal({
  isAuthenticated = false,
  source = "animations-detail",
  idPrefix = "animations-detail",
  delayMs = 30000,
  storageKey = STARTER_PROMPT_KEY,
  eyebrow = "Free starter pack",
  title = "Get the Starter Pack: free components, on the house.",
  description = "Production-grade GSAP for React, Vue, and HTML/CSS/JS. A new free component every week. No attribution, no expiration. Delivered to your inbox the moment you subscribe.",
  buttonLabel = "Send it to me"
}) {
  let [isOpen, setIsOpen] = useState(false);
  let timerRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated || shouldHidePrompt(storageKey)) return;

    let checkAndShowPrompt = () => {
      if (!shouldHidePrompt(storageKey)) {
        let isBandVisible = (() => {
          let bandElement = document.querySelector("[data-starter-pack-band]");
          if (!bandElement) return false;
          let rect = bandElement.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight;
        })();

        if (isBandVisible) {
          timerRef.current = window.setTimeout(checkAndShowPrompt, 15000);
          return;
        }
        
        setIsOpen(true);
      }
    };

    timerRef.current = window.setTimeout(checkAndShowPrompt, delayMs);
    
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [isAuthenticated, delayMs, storageKey]);

  let handleOpenChange = (openState) => {
    setIsOpen(openState);
    if (!openState) {
      (function recordDismissal(key) {
        try {
          let nowStr = String(Date.now());
          window.localStorage.setItem(STARTER_PROMPT_KEY, nowStr);
          if (key !== STARTER_PROMPT_KEY) {
            window.localStorage.setItem(key, nowStr);
          }
        } catch {}
      })(storageKey);
    }
  };

  if (isAuthenticated) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="!rounded-none !border-foreground/15 !bg-background !p-32 sm:!max-w-[560px] lg:!p-40 max-h-[90vh] overflow-y-auto">
        <DialogClose
          aria-label="Close"
          className="group/close absolute right-16 top-16 inline-flex size-40 items-center justify-center border border-foreground/15 bg-background text-foreground/70 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:border-foreground/40 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <CloseIcon className="size-18 transition-transform duration-(--duration-quick) ease-(--ease-back-out) group-hover/close:rotate-90" />
        </DialogClose>
        <div className="flex flex-col gap-12 pr-48">
          <p className="text-mono-sm text-foreground/55">{eyebrow}</p>
          <DialogTitle className="h3 font-medium leading-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-body text-foreground-muted">
            {description}
          </DialogDescription>
        </div>
        <div className="mt-24 lg:mt-32">
          <SubscribeForm
            source={source}
            idPrefix={idPrefix}
            buttonLabel={buttonLabel}
            buttonSize="sm"
            inputSize="lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
