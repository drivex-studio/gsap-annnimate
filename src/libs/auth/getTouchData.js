import {
  FIRST_TOUCH_COOKIE,
  FIRST_TOUCH_MAX_AGE_S,
  KIT_TOUCH_COOKIE,
  serializeFirstTouch,
  parseFirstTouch,
  buildKitTouch
} from '@/libs/auth/serialize';

const SESSION_KEY = 'anm_ft';

function getTouchData() {
  let searchParams = new URLSearchParams(window.location.search);
  return {
    utm_source: searchParams.get('utm_source') || null,
    utm_medium: searchParams.get('utm_medium') || null,
    utm_campaign: searchParams.get('utm_campaign') || null,
    utm_term: searchParams.get('utm_term') || null,
    utm_content: searchParams.get('utm_content') || null,
    referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : null,
    landing_path: window.location.pathname || null
  };
}

export function captureFirstTouch() {
  let touchData = {
    ...getTouchData(),
    at: new Date().toISOString()
  };

  try {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(touchData));
    }
  } catch (err) {}

  try {
    let cookieName = FIRST_TOUCH_COOKIE;
    let hasCookie = typeof document !== 'undefined' && document.cookie.split('; ').some(c => c.startsWith(cookieName + '='));
    
    if (!hasCookie) {
      let serialized = serializeFirstTouch(touchData);
      if (serialized) {
        document.cookie = `${FIRST_TOUCH_COOKIE}=${serialized}; Max-Age=${FIRST_TOUCH_MAX_AGE_S}; Path=/; SameSite=Lax`;
      }
    }
  } catch (err) {}

  try {
    let kitTouch = buildKitTouch({
      getParam: key => new URLSearchParams(window.location.search).get(key),
      at: touchData.at
    });

    if (kitTouch) {
      let existingCookieValue = (function(name) {
        if (typeof document === 'undefined') return null;
        let match = document.cookie.split('; ').find(c => c.startsWith(name + '='));
        return match ? match.slice(name.length + 1) : null;
      })(KIT_TOUCH_COOKIE);

      let parsedExisting = parseFirstTouch(existingCookieValue);
      let isDuplicate = parsedExisting && 
                        parsedExisting.id === kitTouch.id && 
                        (parsedExisting.campaign || null) === kitTouch.campaign;
      
      let serializedKitTouch = isDuplicate ? null : serializeFirstTouch(kitTouch);

      if (serializedKitTouch) {
        document.cookie = `${KIT_TOUCH_COOKIE}=${serializedKitTouch}; Max-Age=${FIRST_TOUCH_MAX_AGE_S}; Path=/; SameSite=Lax`;
      }
    }
  } catch (err) {}
}

export function collectAttribution() {
  try {
    let stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {}
  
  return getTouchData();
}
