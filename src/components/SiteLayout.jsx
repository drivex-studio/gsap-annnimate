'use client'

import { usePathname } from 'next/navigation';
import PreloaderWrapper from '@/components/ui/PageLoader';
import PageReady from '@/providers/context/PageReady'; 
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppLayout from '@/components/layout/AppLayout';
import CookieBanner from '@/components/cookies/CookieBanner';
import { getLayoutType } from '@/libs/config/GetLayoutType';

const openCookiePreferences = () =>
  window.dispatchEvent(new CustomEvent('annnimate:open-cookie-preferences'));
  
export default function SiteLayout({ children, latestAnimation }) {
  const pathname = usePathname();
  const layoutType = getLayoutType(pathname);
  const isAuthLayout = layoutType === 'auth';

  return (
    <>
      <PageReady /> 
      <PreloaderWrapper />
      {layoutType === 'app' ? (
        <AppLayout latestAnimation={latestAnimation}>{children}</AppLayout>
      ) : (
        <>
          {isAuthLayout ? null : <Header latestAnimation={latestAnimation} />}
          <main className="flex-1 relative z-[2] bg-background" data-transition-content="true">
            {children}
          </main>
          {isAuthLayout ? null : <Footer latestAnimation={latestAnimation} />}
        </>
      )}
      <CookieBanner onOpenPreferences={openCookiePreferences} />
    </>
  );
}
