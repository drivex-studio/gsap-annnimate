"use client";

import React, { Suspense } from 'react';
import Script from 'next/script';
import { ConsentListener } from '@/components/analytics/ConsentListener';
import { PageviewTracker } from '@/components/analytics/PageviewTracker';

const POSTHOG_API_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_API_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';
const POSTHOG_UI_HOST = process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://eu.posthog.com';

export function PostHogProvider() {
  if (!POSTHOG_API_KEY || POSTHOG_API_KEY.includes('YOUR_PROJECT_API_KEY')) {
    return null;
  }

  return (
    <>
      <Script
        id="posthog-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group setPersonProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags startSessionRecording stopSessionRecording captureException".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

            // Pick the init config based on the user's current consent cookie.
            // No cookie or analytics:false -> cookieless minimal mode. ePrivacy
            // 5(3) isn't triggered because nothing is stored on the device.
            (function () {
              var allowed = false;
              try {
                var match = document.cookie.match(/(?:^|; )annnimate_consent=([^;]+)/);
                if (match) {
                  var data = JSON.parse(atob(decodeURIComponent(match[1])));
                  allowed = data && data.analytics === true;
                }
              } catch (_) { allowed = false; }

              // Strip auth credentials (magic-link token hashes, OAuth codes)
              // from every URL-shaped property. The pageview tracker scrubs its
              // own capture, but autocapture/pageleave/referrer build URLs
              // internally - this catches those in both modes.
              var SENSITIVE_RE = /([?&])(token_hash|token|code|access_token|refresh_token)=[^&#]*/g;
              var sanitize = function (props) {
                for (var k in props) {
                  if (typeof props[k] === 'string' && props[k].indexOf('=') !== -1) {
                    props[k] = props[k].replace(SENSITIVE_RE, '$1$2=REDACTED');
                  }
                }
                return props;
              };

              // Auxiliary modules are EXPLICITLY OFF. Each one loads a separate
              // script (e.g. dead-clicks-autocapture.js, surveys.js, heatmaps.js)
              // which uBlock matches on the filename pattern even through the
              // proxy. We don't use these features in any dashboard tile, and
              // leaving them on produces a wall of net::ERR_BLOCKED_BY_CLIENT
              // console errors for every ad-blocker user. Re-enable individually
              // only if a dashboard tile depends on the event.
              var cookieless = {
                api_host: '${POSTHOG_API_HOST}',
                ui_host: '${POSTHOG_UI_HOST}',
                sanitize_properties: sanitize,
                persistence: 'memory',
                person_profiles: 'identified_only',
                capture_pageview: false,
                capture_pageleave: false,
                autocapture: false,
                capture_dead_clicks: false,
                capture_heatmaps: false,
                disable_surveys: true,
                disable_session_recording: true,
                disable_web_experiments: true
              };

              var full = {
                api_host: '${POSTHOG_API_HOST}',
                ui_host: '${POSTHOG_UI_HOST}',
                sanitize_properties: sanitize,
                persistence: 'localStorage+cookie',
                person_profiles: 'identified_only',
                capture_pageview: false,
                capture_pageleave: true,
                autocapture: true,
                capture_dead_clicks: false,
                capture_heatmaps: false,
                disable_surveys: true,
                disable_session_recording: false,
                disable_web_experiments: true,
                session_recording: { maskAllInputs: true, maskTextContent: false }
              };

              posthog.init('${POSTHOG_API_KEY}', allowed ? full : cookieless);
            })();
          `
        }}
      />
      <ConsentListener />
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
    </>
  );
}
