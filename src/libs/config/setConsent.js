const COOKIE_NAME = 'annnimate_consent';

export const defaultConsent = {
  version: 1,
  timestamp: null,
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
  method: null
};

export function setConsent(consentData) {
  if (typeof document === 'undefined') return;

  const payload = btoa(JSON.stringify({
    ...consentData,
    version: 1,
    timestamp: new Date().toISOString(),
    essential: true
  }));

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 365);

  let cookieString = `${COOKIE_NAME}=${encodeURIComponent(payload)}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Lax`;

  if (window.location.protocol === 'https:') {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;
}

export function dispatchConsentChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('annnimate:consent-changed'));
  }
}

export function acceptAll() {
  setConsent({
    essential: true,
    analytics: true,
    functional: true,
    marketing: false,
    method: 'explicit'
  });
  dispatchConsentChanged();
}

export function getConsent() {
  if (typeof document === 'undefined') return null;

  const consentCookie = document.cookie.split('; ').find(cookie => cookie.startsWith(`${COOKIE_NAME}=`));

  if (!consentCookie) return null;

  try {
    const encodedValue = consentCookie.split('=')[1];
    const decodedPayload = atob(decodeURIComponent(encodedValue));
    const parsedData = JSON.parse(decodedPayload);

    if (parsedData.version !== 1) return null;

    return parsedData;
  } catch {
    return null;
  }
}
