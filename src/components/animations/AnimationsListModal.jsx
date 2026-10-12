'use client';
import React, { useState, useRef, useEffect } from 'react'; // module id: 271645
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from '@/components/ui/Dialog'; // module id: 753145
import NewsletterForm from '@/components/ui/NewsletterEyebrow'; // module id: NewsletterForm
import CloseIcon from '@/assets/icons/Icons'; // module id: 137410
import { STARTER_PROMPT_KEY, readSubscriberId } from '@/components/ui/NewsletterEyebrow'; 
/* --- Helpers --- */
function isRecentlyPrompted(key) {
  try {
    let timestampStr = window.localStorage.getItem(key);
    if (!timestampStr) return false;
    
    let timestamp = parseInt(timestampStr, 10);
    if (Number.isNaN(timestamp)) return false;
    
    // 2592000000 ms = 30 days
    return Date.now() - timestamp < 2592000000;
  } catch {
    return false;
  }
}

function shouldSkipPrompt(key) {
  return isRecentlyPrompted(STARTER_PROMPT_KEY) || isRecentlyPrompted(key) || !!readSubscriberId();
}

function markAsDismissed(key) {
  try {
    let now = String(Date.now());
    window.localStorage.setItem(STARTER_PROMPT_KEY, now);
    if (key !== STARTER_PROMPT_KEY) {
      window.localStorage.setItem(key, now);
    }
  } catch {}
}

/* --- AnimationsListModal --- */
// module id: 573564
export default function AnimationsListModal({
  isAuthenticated = false,
  source = 'animations-detail',
  idPrefix = 'animations-detail',
  delayMs = 30000,
  storageKey = STARTER_PROMPT_KEY,
  eyebrow = 'Free starter pack',
  title = 'Get the Starter Pack: free components, on the house.',
  description = 'Production-grade GSAP for React, Vue, and HTML/CSS/JS. A new free component every week. No attribution, no expiration. Delivered to your inbox the moment you subscribe.',
  buttonLabel = 'Send it to me'
}) {
  let [isOpen, setIsOpen] = useState(false);
  let timeoutRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated || shouldSkipPrompt(storageKey)) return;

    let triggerPrompt = () => {
      if (!shouldSkipPrompt(storageKey)) {
        let isBandVisible = (() => {
          let band = document.querySelector('[data-starter-pack-band]');
          if (!band) return false;
          let rect = band.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight;
        })();

        if (isBandVisible) {
          // If the starter pack band is in view, delay the modal to avoid annoying the user
          timeoutRef.current = window.setTimeout(triggerPrompt, 15000);
          return;
        }
        
        setIsOpen(true);
      }
    };

    timeoutRef.current = window.setTimeout(triggerPrompt, delayMs);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [isAuthenticated, delayMs, storageKey]);

  if (isAuthenticated) return null;

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          markAsDismissed(storageKey);
        }
      }}
    >
      <DialogContent 
        showCloseButton={false} 
        className="!rounded-none !border-foreground/15 !bg-background !p-32 sm:!max-w-[560px] lg:!p-40 max-h-[90vh] overflow-y-auto"
      >
        <DialogClose 
          aria-label="Close" 
          className="group/close absolute right-16 top-16 inline-flex size-40 items-center justify-center border border-foreground/15 bg-background text-foreground/70 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:border-foreground/40 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <CloseIcon className="size-18 transition-transform duration-(--duration-quick) ease-(--ease-back-out) group-hover/close:rotate-90" />
        </DialogClose>
        
        <div className="flex flex-col gap-12 pr-48">
          <p className="text-mono-sm text-foreground/55">{eyebrow}</p>
          <DialogTitle className="h3 font-medium leading-tight text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-body text-foreground-muted">{description}</DialogDescription>
        </div>
        
        <div className="mt-24 lg:mt-32">
          <NewsletterForm 
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
