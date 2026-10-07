"use client";

import React, { useState, useEffect } from 'react';
import { getConsent } from '@/libs/config/setConsent'
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { ConsentListener } from '@/components/analytics/ConsentListener';
import { CrispChat } from '@/components/analytics/CrispChat';
import { GlobalErrorTracker } from '@/components/analytics/GlobalErrorTracker';

export default function ConsentAwareAnalytics() {
  const [consent, setConsent] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setConsent(getConsent());
    const handleConsentChanged = () => setConsent(getConsent());
    
window.addEventListener('annnimate:consent-changed', handleConsentChanged);
    return () => window.removeEventListener('annnimate:consent-changed', handleConsentChanged);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <PostHogProvider />
      <GlobalErrorTracker />
      {consent?.functional && <CrispChat />}
    </>
  );
}
