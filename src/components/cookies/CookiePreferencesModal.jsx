'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CloseIcon from '@/assets/icons/Icons';
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from '@/components/ui/Dialog'; 
import Button from '@/components/ui/Button'; 
import Toggle from '@/components/ui/Toggle';
import { getConsent, defaultConsent, setConsent, dispatchConsentChanged } from '@/libs/utils/cookieConsent'; 

const COOKIE_CATEGORIES = [{
  id: "essential",
  name: "Essential",
  description: "Authentication, payments, and your own preferences. Always on.",
  cookies: "Supabase Auth · Stripe · annnimate_consent",
  required: true
}, {
  id: "analytics",
  name: "Analytics",
  description: "Off: anonymous pageviews only (no cookies, no recording). On: persistent visitor ID, session recording with inputs masked, click and form capture.",
  cookies: "PostHog (EU)",
  required: false
}, {
  id: "functional",
  name: "Functional",
  description: "Live chat support so you can ask a question without leaving the page.",
  cookies: "Crisp",
  required: false
}];

export function CookiePreferencesModal({ open, onOpenChange }) {
  const [preferences, setPreferences] = useState(() => getConsent() || defaultConsent);

  useEffect(() => {
    if (open) {
      setPreferences(getConsent() || defaultConsent);
    }
  }, [open]);

  const handleSave = (newPreferences) => {
    setConsent({
      ...newPreferences,
      essential: true,
      method: "explicit"
    });
    dispatchConsentChanged();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="!rounded-none !border-foreground/15 !bg-background !p-32 sm:!max-w-[560px] lg:!p-40">
        <DialogClose
          aria-label="Close"
          className="group/close absolute right-16 top-16 inline-flex size-40 items-center justify-center border border-foreground/15 text-foreground/70 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:border-foreground/40 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <CloseIcon className="size-18 transition-transform duration-(--duration-quick) ease-(--ease-back-out) group-hover/close:rotate-90" />
        </DialogClose>
        
        <div className="flex flex-col gap-12">
          <p className="text-mono-sm text-foreground/55">Cookie preferences</p>
          <DialogTitle className="text-h3 font-medium leading-tight text-foreground">
            What you let us store.
          </DialogTitle>
          <DialogDescription className="text-body text-foreground-muted">
            Nothing non-essential is stored on your device until you toggle it on here. Read the{" "}
            <Link
              href="/cookies"
              className="underline decoration-foreground/30 underline-offset-4 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:decoration-foreground hover:text-foreground"
            >
              cookie policy
            </Link>{" "}
            for the full breakdown.
          </DialogDescription>
        </div>

        <ul className="mt-24 flex flex-col divide-y divide-foreground/10 border-y border-foreground/10">
          {COOKIE_CATEGORIES.map((category) => (
            <li key={category.id} className="flex items-start gap-24 py-20">
              <div className="flex flex-1 flex-col gap-6">
                <div className="flex items-baseline gap-12">
                  <span className="text-accent-xs text-foreground">{category.name}</span>
                  {category.required && (
                    <span className="text-accent-xs text-foreground/45">Required</span>
                  )}
                </div>
                <p className="text-body-sm text-foreground-muted">{category.description}</p>
                <p className="text-accent-xs text-foreground/45">{category.cookies}</p>
              </div>
              <Toggle
                checked={!!preferences[category.id]}
                disabled={category.required}
                onChange={(value) => {
                  setPreferences((prev) => ({
                    ...prev,
                    [category.id]: value
                  }));
                }}
                label={`Toggle ${category.name}`}
              />
            </li>
          ))}
        </ul>

        <div className="mt-24 flex flex-col gap-8">
          <div className="flex gap-8">
            <Button
              type="button"
              theme="light"
              size="xs"
              onClick={() => handleSave({
                essential: true,
                analytics: true,
                functional: true,
                marketing: false
              })}
              className="flex-1"
            >
              Accept all
            </Button>
            <Button
              type="button"
              theme="surface"
              size="xs"
              onClick={() => handleSave({
                essential: true,
                analytics: false,
                functional: false,
                marketing: false
              })}
              className="flex-1"
            >
              Decline all
            </Button>
          </div>
          <Button
            type="button"
            theme="brand"
            size="xs"
            onClick={() => handleSave(preferences)}
            className="w-full"
          >
            Save preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CookiePreferencesModal;
