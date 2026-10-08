import '@/styles/style.css';
import Provider from '@/app/provider';
import AppLayout from '@/components/AppLayout';
import localFont from 'next/font/local';
import { getLatestAnimation } from '@/libs/supabase/latestAnimation';

const geistSans = localFont({
  src: '../../public/fonts/Geist-Variable.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: '../../public/fonts/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  preload: false,
});

const aktivGrotesk = localFont({
  src: [
    {
      path: '../../public/fonts/AktivGroteskCorp-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AktivGroteskCorp-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AktivGroteskCorp-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/AktivGroteskCorp-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AktivGroteskCorp-MediumItalic.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../../public/fonts/AktivGroteskCorp-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AktivGroteskCorp-BoldItalic.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-aktiv',
});

const shadowsIntoLight = localFont({
  src: '../../public/fonts/ShadowsIntoLight_Regular.woff2',
  variable: '--font-handwritten',
  weight: '400',
});

const themeScript = `
  (function() {
    try { 
    const theme = localStorage.getItem('theme') || 'dark';
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
     const resolvedTheme = theme === 'system' ? systemTheme : theme;
     if (resolvedTheme === 'dark') { 
     document.documentElement.classList.add('dark');
      } else { 
      document.documentElement.classList.remove('dark');
      }} catch (e) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default async function RootLayout({ children }) {
  const latestAnimation = await getLatestAnimation();

  return (
    <html
      lang="en"
      className={`
        ${aktivGrotesk.variable}
        ${geistSans.variable}
        ${geistMono.variable}
        ${shadowsIntoLight.variable}
      `}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className="bg-background text-foreground font-sans"
        data-preloader-ready="true"
      >
        <Provider>
          <AppLayout latestAnimation={latestAnimation}>
            {children}
          </AppLayout>
        </Provider>
      </body>
    </html>
  );
}
