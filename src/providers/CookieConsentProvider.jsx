'use client';
import { useState, useEffect } from 'react';
import CookiePreferencesModal from '@/components/cookies/CookiePreferencesModal';

export function CookieConsentProvider() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('annnimate:open-cookie-preferences', handleOpen);
    return () => window.removeEventListener('annnimate:open-cookie-preferences', handleOpen);
  }, []);

  return <CookiePreferencesModal open={open} onOpenChange={setOpen} />;
}

export default CookieConsentProvider;
