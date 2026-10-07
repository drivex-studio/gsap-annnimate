"use client";
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const SENSITIVE_PARAMS = ['token_hash', 'token', 'code', 'access_token', 'refresh_token'];

export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !window.posthog || typeof window.posthog.capture !== 'function') return;

    const safeParamsString = (function(params) {
      if (!params || !params.toString()) return '';
      const urlParams = new URLSearchParams(params.toString());
      for (const param of SENSITIVE_PARAMS) {
        urlParams.delete(param);
      }
      return urlParams.toString();
    })(searchParams);

    let currentUrl = window.origin + pathname;
    if (safeParamsString) {
      currentUrl = currentUrl + '?' + safeParamsString;
    }

    window.posthog.capture('$pageview', {$current_url: currentUrl,
      $pathname: pathname,$search_params: safeParamsString
    });
  }, [pathname, searchParams]);

  return null;
}
