export const FIRST_TOUCH_COOKIE = 'anm_ftp';
export const FIRST_TOUCH_MAX_AGE_S = 34560000;
export const KIT_TOUCH_COOKIE = 'anm_kit';

export function buildKitTouch({ getParam, at = null }) {
  let sid = getParam('sid');
  let subscriberId = sid && /^[0-9a-f]{16}$/.test(sid) ? sid : getParam('ck_subscriber_id');
  
  if (subscriberId && /^(\d{1,20}|[0-9a-f]{16})$/.test(subscriberId)) {
    return {
      id: subscriberId,
      campaign: getParam('utm_campaign') || null,
      at: at || null
    };
  }
  
  return null;
}

export function parseFirstTouch(value) {
  if (!value || typeof value !== 'string') return null;
  
  try {
    let parsed = JSON.parse(decodeURIComponent(value));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function serializeFirstTouch(data) {
  try {
    let encoded = encodeURIComponent(JSON.stringify(data));
    return encoded.length <= 800 ? encoded : null;
  } catch {
    return null;
  }
}
