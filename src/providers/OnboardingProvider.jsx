'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@/providers/UserProvider';
import analytics from '@/libs/utils/analytics';
import { STARTER_SLUG, ONBOARDING_EVENTS } from '@/libs/config/onboarding';

const COPIED_STORAGE_KEY = "anm_onboarding_copied";
const TUNED_STORAGE_KEY = "anm_onboarding_tuned";

const initialState = {
  active: false,
  starterSlug: STARTER_SLUG,
  steps: {
    stack: false,
    copy: false,
    tune: false
  },
  allDone: false,
  completeOnboarding: () => {},
  dismiss: () => {}
};

const OnboardingContext = createContext(initialState);

export function OnboardingProvider({ children }) {
  let { profile, updateProfile } = useUser();
  let [hasCopied, setHasCopied] = useState(false);
  let [hasTuned, setHasTuned] = useState(false);

  useEffect(() => {
    try {
      setHasCopied(localStorage.getItem(COPIED_STORAGE_KEY) === "1");
      setHasTuned(localStorage.getItem(TUNED_STORAGE_KEY) === "1");
    } catch {}
  }, []);

  useEffect(() => {
    let handleCopied = () => {
      let alreadyCopied = (() => {
        try {
          return localStorage.getItem(COPIED_STORAGE_KEY) === "1";
        } catch {
          return false;
        }
      })();
      
      try {
        localStorage.setItem(COPIED_STORAGE_KEY, "1");
      } catch {}
      
      setHasCopied(true);
      if (!alreadyCopied) {
        analytics.track("onboarding_step_completed", { step: "copy" });
      }
    };

    let handleTuned = () => {
      let alreadyTuned = (() => {
        try {
          return localStorage.getItem(TUNED_STORAGE_KEY) === "1";
        } catch {
          return false;
        }
      })();
      
      try {
        localStorage.setItem(TUNED_STORAGE_KEY, "1");
      } catch {}
      
      setHasTuned(true);
      if (!alreadyTuned) {
        analytics.track("onboarding_step_completed", { step: "tune" });
      }
    };

    window.addEventListener(ONBOARDING_EVENTS.copied, handleCopied);
    window.addEventListener(ONBOARDING_EVENTS.tuned, handleTuned);

    return () => {
      window.removeEventListener(ONBOARDING_EVENTS.copied, handleCopied);
      window.removeEventListener(ONBOARDING_EVENTS.tuned, handleTuned);
    };
  }, []);

  let isStackPicked = !!profile?.preferred_platform;
  let createdAtTime = profile?.created_at ? new Date(profile.created_at).getTime() : null;
  
  let isWithin30Days = createdAtTime != null && (Date.now() - createdAtTime) < 2592e6;
  let isActive = profile?.onboarding_completed === false && isWithin30Days;
  let isAllDone = isStackPicked && hasCopied && hasTuned;

  let completeOnboarding = useCallback(() => {
    if (profile && profile.onboarding_completed === false) {
      analytics.activation.onboardingCompleted(null, [
        ...(profile?.preferred_platform ? ["stack"] : []),
        ...(hasCopied ? ["copy"] : []),
        ...(hasTuned ? ["tune"] : [])
      ]);
      updateProfile({ onboarding_completed: true });
    }
  }, [profile, updateProfile, hasCopied, hasTuned]);

  return (
    <OnboardingContext.Provider
      value={{
        active: isActive,
        starterSlug: STARTER_SLUG,
        steps: {
          stack: isStackPicked,
          copy: hasCopied,
          tune: hasTuned
        },
        allDone: isAllDone,
        completeOnboarding: completeOnboarding,
        dismiss: completeOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
