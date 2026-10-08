import LenisProvider from '@/providers/LenisProvider';
import AnimationProvider from '@/providers/AnimationProvider';
import ScrollLockProvider from '@/providers/ScrollLockProvider';
import CookieConsentProvider from '@/providers/CookieConsentProvider';
import ConsentAwareAnalytics from '@/components/analytics/AwareAnalytics';
import TransitionProviders from '@/providers/TransitionProviders';
import { UserProvider } from '@/providers/UserProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { CategoryProvider } from '@/providers/CategoryProvider';
import AppProviders from '@/providers/AppProviders';

const EMPTY_FEED = { banner: null, items: [], latestDate: null };

export default function Provider({
  children,
  categories = [],
  notifications = EMPTY_FEED,
}) {
  return (
    <LenisProvider>
      <AnimationProvider>
        <TransitionProviders>
          <ScrollLockProvider>
            <UserProvider>
              <NotificationProvider value={notifications}>
                <ThemeProvider>
                  <CategoryProvider value={categories}>
                  <AppProviders>
                    {children}
                    </AppProviders>
                  </CategoryProvider>
                </ThemeProvider>
              </NotificationProvider>
            </UserProvider>
            <CookieConsentProvider />
          </ScrollLockProvider>
        </TransitionProviders>
        <ConsentAwareAnalytics />
      </AnimationProvider>
    </LenisProvider>
  );
}
