import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/useUser'; // module id: 201220
import { analytics } from '@/libs/analytics'; // module id: 943348
import { STARTER_SLUG, ONBOARDING_EVENTS } from '@/libs/constants/onboarding'; // module id: 734601 (Mapped)

const COPIED_STORAGE_KEY = "anm_onboarding_copied"; // original mangled: i
const TUNED_STORAGE_KEY = "anm_onboarding_tuned"; // original mangled: s

const initialState = { // original mangled: o
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

const OnboardingContext = createContext(initialState); // original mangled: c

// module id: 92451 (OnboardingProvider)
export function OnboardingProvider({ children }) { // original mangled: e
  let { profile, updateProfile } = useUser(); // original mangled: o, u
  let [hasCopied, setHasCopied] = useState(false); // original mangled: d, f
  let [hasTuned, setHasTuned] = useState(false); // original mangled: h, m

  useEffect(() => {
    try {
      setHasCopied(localStorage.getItem(COPIED_STORAGE_KEY) === "1");
      setHasTuned(localStorage.getItem(TUNED_STORAGE_KEY) === "1");
    } catch {}
  }, []);

  useEffect(() => {
    let handleCopied = () => { // original mangled: e
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

    let handleTuned = () => { // original mangled: t
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

  let isStackPicked = !!profile?.preferred_platform; // original mangled: p
  let createdAtTime = profile?.created_at ? new Date(profile.created_at).getTime() : null; // original mangled: g
  
  // 2592e6 = 30 days in milliseconds
  let isWithin30Days = createdAtTime != null && (Date.now() - createdAtTime) < 2592e6; // original mangled: A
  let isActive = profile?.onboarding_completed === false && isWithin30Days; // original mangled: y
  let isAllDone = isStackPicked && hasCopied && hasTuned; // original mangled: v

  let completeOnboarding = useCallback(() => { // original mangled: x
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

// module id: 92451 (useOnboarding)
export function useOnboarding() {
  return useContext(OnboardingContext);
}
