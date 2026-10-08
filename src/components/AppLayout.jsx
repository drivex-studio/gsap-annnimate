'use client'

import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import PreloaderWrapper from '@/components/ui/PageLoader';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieBanner from '@/components/cookies/CookieBanner';
import { getLayoutType } from '@/libs/config/GetLayoutType';

const openCookiePreferences = () =>
  window.dispatchEvent(new CustomEvent('annnimate:open-cookie-preferences'));

export default function AppLayout({ children, latestAnimation }) {
  const pathname = usePathname();
  const isAuthLayout = getLayoutType(pathname) === 'auth';

  return (
    <>
      <PreloaderWrapper />
      {isAuthLayout ? null : <Header latestAnimation={latestAnimation} />}
      <main className="flex-1 relative z-[2] bg-background" data-transition-content="true">
        {children}
      </main>
      {isAuthLayout ? null : <Footer latestAnimation={latestAnimation} />}
      <CookieBanner onOpenPreferences={openCookiePreferences} />
      <Toaster position="bottom-right" theme="dark" />
    </>
  );
}
