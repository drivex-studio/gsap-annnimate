import Provider from '@/app/provider';
import SiteLayout from '@/components/SiteLayout';
import localFont from 'next/font/local';
import Script from 'next/script';
import { getLatestAnimation, getCategories } from '@/libs/supabase/latestAnimation';
import '@/styles/style.css';

export const metadata = {
  metadataBase: new URL("https://anm.drivexstore.shop"),
  title: {
    default: "Annnimate | Production-grade GSAP components",
    template: "%s | Annnimate",
  },
  description:
    "Production-grade GSAP components for React, Vue and HTML. Browse, preview live, copy the code, and ship motion that holds up on real client work.",
  keywords: ["GSAP", "React", "Vue", "HTML", "Animation", "Components", "Tailwind CSS"],
  authors: [{ name: "DriveX Studio" }],
  creator: "DriveX Studio",
  openGraph: {
    title: "Annnimate | Production-grade GSAP components",
    description:
      "Production-grade GSAP components for React, Vue and HTML. Browse, preview live, copy the code, and ship motion that holds up on real client work.",
    url: "https://anm.drivexstore.shop",
    siteName: "Annnimate",
    images: [
      {
        url: "/imgs/og-image.jpg", 
        width: 1200,
        height: 630,
        alt: "Annnimate - Production-grade GSAP components",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Annnimate | Production-grade GSAP components",
    description:
      "Production-grade GSAP components for React, Vue and HTML. Browse, preview live, copy the code, and ship motion that holds up on real client work.",
    images: ["/imgs/og-image.jpg"], 
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

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
    { path: '../../public/fonts/AktivGroteskCorp-Light.woff2', weight: '300', style: 'normal' },
    { path: '../../public/fonts/AktivGroteskCorp-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/AktivGroteskCorp-Italic.woff2', weight: '400', style: 'italic' },
    { path: '../../public/fonts/AktivGroteskCorp-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/AktivGroteskCorp-MediumItalic.woff2', weight: '500', style: 'italic' },
    { path: '../../public/fonts/AktivGroteskCorp-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../../public/fonts/AktivGroteskCorp-BoldItalic.woff2', weight: '700', style: 'italic' },
  ],
  variable: '--font-aktiv',
});

const shadowsIntoLight = localFont({
  src: '../../public/fonts/ShadowsIntoLight_Regular.woff2',
  variable: '--font-handwritten',
  weight: '400',
});

const themeScript = `
(function(){try{const theme=localStorage.getItem('theme')||'dark';const systemTheme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';const resolvedTheme=theme==='system'?systemTheme:theme;if(resolvedTheme==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`;

export default async function RootLayout({ children }) {
  const [latestAnimation, categories] = await Promise.all([
    getLatestAnimation(),
    getCategories(),
  ]);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Annnimate",
    url: "https://anm.drivexstore.shop/",
    description: "Production-grade GSAP components for React, Vue and HTML.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://anm.drivexstore.shop/animations?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DriveX Studio",
    url: "https://anm.drivexstore.shop/",
    logo: "https://anm.drivexstore.shop/imgs/logo.png",
    sameAs: [
      "https://github.com/drivex-studio",
    ],
  };

  const navigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "SiteNavigationElement",
        position: 1,
        name: "Component Library",
        url: "https://anm.drivexstore.shop/animations",
      },
      {
        "@type": "SiteNavigationElement",
        position: 2,
        name: "Documentation",
        url: "https://anm.drivexstore.shop/docs",
      },
      {
        "@type": "SiteNavigationElement",
        position: 3,
        name: "Roadmap",
        url: "https://anm.drivexstore.shop/roadmap",
      },
    ],
  };

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
      <meta charSet="utf-8" /> 
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {}
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          id="navigation-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationSchema) }}
        />
      </head>
      <body
        className="bg-background text-foreground font-sans"
        data-preloader-ready="true"
      >
        <Provider categories={categories}>
          <SiteLayout latestAnimation={latestAnimation}>
            {children}
          </SiteLayout>
        </Provider>
      </body>
    </html>
  );
}
