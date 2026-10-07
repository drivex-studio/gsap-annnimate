const COOKIE_NAME = "annnimate_consent";
export const defaultConsent = {
  version: 1,
  timestamp: null,
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
  method: null
};

export function setConsent(preferences) {
  if (typeof document === 'undefined') return;

  const payload = btoa(JSON.stringify({
    ...preferences,
    version: 1,
    timestamp: new Date().toISOString(),
    essential: true
  }));

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 365);

  let cookieString = `${COOKIE_NAME}=${encodeURIComponent(payload)}`;
  cookieString += `; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;

  if (window.location.protocol === "https:") {
    cookieString += "; Secure";
  }

  document.cookie = cookieString;
}

export function dispatchConsentChanged() {
  window.dispatchEvent(new CustomEvent("annnimate:consent-changed"));
}

export function acceptAll() {
  setConsent({
    essential: true,
    analytics: true,
    functional: true,
    marketing: false,
    method: "explicit"
  });
  dispatchConsentChanged();
}

export function getConsent() {
  if (typeof document === 'undefined') return null;

  const cookieEntry = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));

  if (!cookieEntry) return null;

  try {
    const cookieValue = cookieEntry.split("=")[1];
    const decodedPayload = atob(decodeURIComponent(cookieValue));
    const parsedConsent = JSON.parse(decodedPayload);

    if (parsedConsent.version !== 1) return null;
    
    return parsedConsent;
  } catch {
    return null;
  }
}
