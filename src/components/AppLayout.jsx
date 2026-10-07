'use client'

import PreloaderWrapper from '@/components/ui/PageLoader';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieBanner from '@/components/cookies/CookieBanner';

const openCookiePreferences = () =>
  window.dispatchEvent(new CustomEvent('annnimate:open-cookie-preferences'));

export default function AppLayout({ children, latestAnimation }) {
  return (
    <>
      <PreloaderWrapper />
      <Header latestAnimation={latestAnimation} />
      <main className="flex-1 relative z-[2] bg-background" data-transition-content="true">
        {children}
      </main>
      <Footer latestAnimation={latestAnimation} />
      <CookieBanner onOpenPreferences={openCookiePreferences} />
    </>
  );
}
