"use client"; 
import { useState, useEffect } from 'react'; 

let cachedPppData;
let fetchPromise = null;

const debugLog = (...args) => {
  try {
    if (/[?&]pppdebug=1/.test(window.location.search)) {
      console.log('[ppp]', ...args);
    }
  } catch {}
};

const fetchPppData = () => {
  if (cachedPppData !== undefined) {
    debugLog('cached answer', cachedPppData);
    return Promise.resolve(cachedPppData);
  }
  
  if (fetchPromise) return fetchPromise;

  let url = '/api/geo/ppp';
  try {
    const country = new URLSearchParams(window.location.search).get('pppcountry');
    if (country) {
      url += `?country=${encodeURIComponent(country)}`;
    }
  } catch {}

  debugLog('fetching', url);
  
  fetchPromise = fetch(url, { cache: 'no-store' })
    .then((res) => {
      debugLog(
        'response',
        res.status,
        'x-vercel-cache:',
        res.headers.get('x-vercel-cache'),
        'x-vercel-id:',
        res.headers.get('x-vercel-id')
      );
      return res.ok ? res.json() : null;
    })
    .then((data) => {
      debugLog('parsed', data);
      
      cachedPppData = data?.tier === 'T2' || data?.tier === 'T3'
        ? { tier: data.tier, country: data.country || null }
        : null;
        
      debugLog('decided', cachedPppData);
      return cachedPppData;
    })
    .catch((err) => {
      debugLog('fetch failed', err?.message);
      cachedPppData = null;
      return null;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
};

export function usePppGeo() {
  const [pppData, setPppData] = useState(cachedPppData === undefined ? null : cachedPppData);

  useEffect(() => {
    let isMounted = true;

    fetchPppData().then((data) => {
      debugLog('hook resolved', data, 'mounted:', isMounted);
      if (isMounted && data) {
        setPppData(data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return pppData;
}

export function usePppTier() {
  const geoData = usePppGeo();
  return geoData?.tier ?? null;
} 
