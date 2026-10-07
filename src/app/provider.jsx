import LenisProvider from '@/providers/LenisProvider';
import AnimationProvider from '@/providers/AnimationProvider';
import ScrollLockProvider from '@/providers/ScrollLockProvider';
import CookieConsentProvider from '@/providers/CookieConsentProvider';
import ConsentAwareAnalytics from '@/components/analytics/AwareAnalytics';
import { UserProvider } from '@/providers/UserProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { CategoryProvider } from '@/providers/CategoryProvider';

const EMPTY_FEED = { banner: null, items: [], latestDate: null };

export default function AppProviders({
  children,
  categories = [],
  notifications = EMPTY_FEED,
}) {
  return (
    <LenisProvider>
      <AnimationProvider>
        <ScrollLockProvider>
          <UserProvider>
            <NotificationProvider value={notifications}>
              <ThemeProvider>
                <CategoryProvider value={categories}>
                  {children}
                </CategoryProvider>
              </ThemeProvider>
            </NotificationProvider>
          </UserProvider>
          <CookieConsentProvider />
        </ScrollLockProvider>
        <ConsentAwareAnalytics />
      </AnimationProvider>
    </LenisProvider>
  );
}
