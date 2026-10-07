// utils.js

/* --- Data & Helpers --- */
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeRedirect(url, defaultRedirect = '/animations') {
  if (
    typeof url !== 'string' ||
    !url.startsWith('/') ||
    url.startsWith('//') ||
    url.startsWith('/\\')
  ) {
    return defaultRedirect;
  }
  return url;
}

export function getRedirectTarget({ destination, redirectTo }) {
  const sanitized = sanitizeRedirect(redirectTo);
  if (sanitized.startsWith('/api/teams/invites/accept')) {
    return { href: sanitized, hard: true };
  }
  if (destination === '/welcome') {
    return { href: '/welcome', hard: false };
  }
  return { href: sanitized, hard: false };
}