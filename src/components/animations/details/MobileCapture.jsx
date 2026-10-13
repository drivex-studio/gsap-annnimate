// module id: 573564
import React, { useState, useRef, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import CaptureForm, { STARTER_PROMPT_KEY, readSubscriberId } from '@/components/ui/NewsletterEyebrow';

function hasRecentPromptStorage(storageKey) {
  try {
    const storedTime = window.localStorage.getItem(storageKey);
    if (!storedTime) return false;
    
    const timestamp = parseInt(storedTime, 10);
    if (Number.isNaN(timestamp)) return false;
    
    // Check if prompted within the last 30 days (2592000000 ms)
    return Date.now() - timestamp < 2592000000;
  } catch {
    return false;
  }
}

function shouldSkipPrompt(customStorageKey) {
  return (
    hasRecentPromptStorage(STARTER_PROMPT_KEY) || 
    hasRecentPromptStorage(customStorageKey) || 
    !!readSubscriberId()
  );
}

export default function MobileCapture({
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
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated || shouldSkipPrompt(storageKey)) return;

    const checkAndShowPrompt = () => {
      if (!shouldSkipPrompt(storageKey)) {
        // Check if the starter pack band is currently visible on screen
        const isBandVisible = (() => {
          const bandElement = document.querySelector('[data-starter-pack-band]');
          if (!bandElement) return false;
          
          const rect = bandElement.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight;
        })();

        if (isBandVisible) {
          // Retry after 15 seconds if the band is already visible
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

  if (isAuthenticated) return null;

  const handleOpenChange = (open) => {
    setIsOpen(open);
    
    if (!open) {
      // Mark as prompted in local storage when closed
      (function markPrompted(key) {
        try {
          const nowString = String(Date.now());
          window.localStorage.setItem(STARTER_PROMPT_KEY, nowString);
          if (key !== STARTER_PROMPT_KEY) {
            window.localStorage.setItem(key, nowString);
          }
        } catch {}
      })(storageKey);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        showCloseButton={false} 
        className="!rounded-none !border-foreground/15 !bg-background !p-32 sm:!max-w-[560px] lg:!p-40 max-h-[90vh] overflow-y-auto"
      >
        <DialogClose 
          aria-label="Close" 
          className="group/close absolute right-16 top-16 inline-flex size-40 items-center justify-center border border-foreground/15 bg-background text-foreground/70 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:border-foreground/40 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <X className="size-18 transition-transform duration-(--duration-quick) ease-(--ease-back-out) group-hover/close:rotate-90" />
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
          <CaptureForm 
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
