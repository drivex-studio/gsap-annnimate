"use client";
import { useEffect } from 'react';
import analyticsModule from '@/libs/utils/analytics';

export function GlobalErrorTracker() {
  useEffect(() => {
    let errorCount = 0;
    const loggedErrors = new Set();

    const logError = (source, error, extras) => {
      const message = error?.message || String(error ?? '');
      if (!message || errorCount >= 25) return;

      const fingerprint = source + '|' + message.slice(0, 200);
      if (!loggedErrors.has(fingerprint)) {
        loggedErrors.add(fingerprint);
        errorCount += 1;
        try {
          analyticsModule.analytics.error.exception(
            error instanceof Error ? error : Error(message),
            { source, ...extras }
          );
        } catch (err) {}
      }
    };

    const handleWindowError = (event) => {
      logError('uncaught_error', event?.error || Error(event?.message || ''), {
        file: event?.filename,
        line: event?.lineno,
        path: window.location?.pathname
      });
    };

    const handleUnhandledRejection = (event) => {
      const reason = event?.reason;
      logError(
        'unhandled_rejection',
        reason instanceof Error ? reason : Error(String(reason ?? '')),
        { path: window.location?.pathname }
      );
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
