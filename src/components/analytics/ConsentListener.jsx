"use client";
import { useEffect } from 'react';

export function ConsentListener() {
  useEffect(() => {
    const handleConsentChanged = () => {
      const posthog = window.posthog;
      if (!posthog || typeof posthog.set_config !== 'function') return;

      let isAnalyticsAllowed = false;
      try {
        const match = document.cookie.match(/(?:^|; )annnimate_consent=([^;]+)/);
        if (match) {
          const data = JSON.parse(atob(decodeURIComponent(match[1])));
          isAnalyticsAllowed = data && data.analytics === true;
        }
      } catch (error) {
        isAnalyticsAllowed = false;
      }

      if (isAnalyticsAllowed) {
        posthog.set_config({
          persistence: 'localStorage+cookie',
          autocapture: true,
          disable_session_recording: false
        });
        if (typeof posthog.startSessionRecording === 'function') {
          posthog.startSessionRecording();
        }
      } else {
        if (typeof posthog.stopSessionRecording === 'function') {
          posthog.stopSessionRecording();
        }
        posthog.set_config({
          persistence: 'memory',
          autocapture: false,
          disable_session_recording: true
        });

        document.cookie.split('; ').forEach((cookieStr) => {
          const cookieName = cookieStr.split('=')[0];
          if (cookieName.startsWith('ph_')) {
            document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        });
      }
    };

    window.addEventListener('annnimate:consent-changed', handleConsentChanged);
    return () => window.removeEventListener('annnimate:consent-changed', handleConsentChanged);
  }, []);

  return null;
}
