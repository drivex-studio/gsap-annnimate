"use client";
import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  GithubLogo,
  InstagramLogo,
  LinkedinLogo,
  XLogo
} from '@phosphor-icons/react';

import { translate as t } from '@/libs/utils/i18n';
import { isRouteActive } from '@/libs/config/isRouteActive';

import SiteLogo from '@/assets/logos/SiteLogo';
import TransitionLink from '@/components/ui/TransitionLink';
import CustomLink from '@/components/ui/CustomLink';
import NewsletterForm, { NewsletterEyebrow } from '@/components/ui/NewsletterEyebrow';

import { useCategories } from '@/providers/CategoryProvider';
import { LandingDivider } from '@/components/layout/Footer/LandingDivider';
import { AskAiSection } from '@/components/layout/Footer/AskAiSection';
import { FooterAccordion } from '@/components/layout/Footer/FooterAccordion';
import { StudioClock } from '@/components/layout/Footer/StudioClock';
import { LatestAnimationStatus } from '@/components/layout/Footer/LatestAnimationStatus';
import { FooterWordmark } from '@/components/layout/Footer/FooterWordmark';

const platformLinks = {
  label: t('common.footer.columns.platform'),
  links: [
    { label: t('common.footer.platformLinks.howItWorks'), href: '/platform' },
    { label: t('common.footer.platformLinks.documentation'), href: '/docs' },
    { label: t('common.footer.platformLinks.mcpServer'), href: '/docs/guides/mcp' },
    { label: t('common.footer.platformLinks.learnGsap'), href: '/learn' },
    { label: t('common.footer.platformLinks.freeTools'), href: '/tools' },
    { label: t('common.footer.platformLinks.compare'), href: '/compare' },
    { label: t('common.footer.platformLinks.stateOfWebAnimation'), href: '/state-of-web-animation' },
    { label: t('common.footer.platformLinks.changelog'), href: '/changelog' },
    { label: t('common.footer.platformLinks.roadmap'), href: '/roadmap' },
    { label: t('common.footer.platformLinks.pricing'), href: '/pricing' },
    { label: t('common.footer.platformLinks.faqs'), href: '/faq' },
    { label: t('common.footer.platformLinks.affiliates'), href: '/affiliate' },
  ],
};

const kitsLinks = {
  label: t('common.footer.columns.kits'),
  links: [
    { label: t('common.footer.kitsLinks.seeTheKits'), href: '/kits' },
    { label: t('common.footer.kitsLinks.whatAKitIs'), href: '/kits' },
    { label: t('common.footer.kitsLinks.kitVsLibrary'), href: '/kits' },
    { label: t('common.footer.kitsLinks.foundingOffer'), href: '/whats-new' },
  ],
};

const socialLinks = [
  { label: 'X', href: 'https://x.com/juli_fella', Icon: XLogo },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/julianfella/', Icon: LinkedinLogo },
  { label: 'Instagram', href: 'https://www.instagram.com/goodfelladesign/', Icon: InstagramLogo },
  { label: 'GitHub', href: 'https://github.com/GoodFellaStudio', Icon: GithubLogo },
];

const legalLinks = [
  { label: t('common.footer.legalLinks.privacy'), href: '/privacy' },
  { label: t('common.footer.legalLinks.terms'), href: '/terms' },
  { label: t('common.footer.legalLinks.cookies'), href: '/cookies' },
  { label: t('common.footer.legalLinks.refund'), href: '/refund' },
];

export default function Footer({ latestAnimation }) {
  const pathname = usePathname();
  const categories = useCategories();

  const footerColumns = useMemo(
    () => [
      platformLinks,
      {
        label: t('common.footer.columns.library'),
        links: [
          { label: t('common.footer.libraryLinks.allComponents'), href: '/animations' },
          ...categories.map((category) => ({
            label: category.name,
            href: `/animations?category=${category.slug}`,
          })),
          { label: t('common.footer.libraryLinks.showcase'), href: '/showcase' },
        ],
      },
      kitsLinks,
    ],
    [categories]
  );

  return (
    <footer
      data-theme="dark"
      className="annnimate-footer relative bg-background px-24 pb-24 lg:px-32 lg:pb-32"
    >
      <div
        data-theme="light"
        className="relative z-[20] p-24 lg:p-48 overflow-hidden bg-background text-foreground"
      >
        <div className="mx-auto w-full max-w-[1920px] py-24">
          <div className="grid grid-cols-12 items-center gap-16">
            <div className="col-span-12 md:col-span-7">
              <LatestAnimationStatus latest={latestAnimation} />
            </div>
            <div className="col-span-12 md:col-span-5 md:justify-self-end">
              <div className="flex flex-wrap items-center gap-x-24 gap-y-12">
                <AskAiSection />
                <StudioClock />
              </div>
            </div>
          </div>
        </div>

        <LandingDivider />

        <div className="mx-auto w-full max-w-[1920px] py-32 lg:py-64">
          <div className="grid grid-cols-12 gap-16 gap-y-64">
            <div className="col-span-12 flex flex-col gap-32 lg:col-span-5">
              <TransitionLink href="/" aria-label="Annnimate home" className="inline-block w-fit">
                <SiteLogo height={20} className="text-foreground" />
              </TransitionLink>

              <NewsletterForm
                source="footer"
                idPrefix="footer"
                eyebrow={<NewsletterEyebrow />}
                inputSize="lg"
              />

              <div className="flex flex-wrap items-center gap-x-12 gap-y-16">
                {socialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex size-32 items-center justify-center text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:text-foreground-muted"
                  >
                    <Icon className="size-20" aria-hidden="true" />
                  </a>
                ))}
                <CustomLink
                  href="/contact"
                  active={isRouteActive(pathname, '/contact')}
                  className="text-mono-sm text-foreground"
                >
                  {t('common.footer.contact')}
                </CustomLink>
              </div>
            </div>

            <div className="col-span-12 flex flex-col lg:hidden">
              {footerColumns.map((column) => (
                <FooterAccordion key={column.label} label={column.label} links={column.links} />
              ))}
            </div>

            {footerColumns.map((column, index) => (
              <nav
                key={column.label}
                aria-label={column.label}
                className={`hidden lg:col-span-2 lg:block ${
                  index === 0 ? 'lg:col-start-7' : ''
                }`}
              >
                <p className="mb-24 text-mono-sm text-foreground-muted">{column.label}</p>
                <ul className="flex flex-col gap-4">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <CustomLink
                        href={link.href}
                        active={!link.external && isRouteActive(pathname, link.href)}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className="text-body-sm text-foreground"
                      >
                        {link.label}
                      </CustomLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <LandingDivider />
        <FooterWordmark />

        <div className="mx-auto w-full max-w-[1920px] pb-24">
          <div className="flex flex-col items-start justify-between gap-12 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-mono-sm text-foreground-muted">
              <span>{t('common.footer.copyright', { year: new Date().getFullYear() })}</span>
              <span className="opacity-40">·</span>
              <span>{t('common.footer.builtBy')}</span>
              <CustomLink
                href="https://good-fella.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mono-sm text-foreground"
              >
                {t('common.footer.builtByName')}
              </CustomLink>
            </div>

            <div className="flex flex-wrap items-center gap-x-32 gap-y-12">
              {legalLinks.map((link) => (
                <CustomLink
                  key={link.href}
                  href={link.href}
                  active={isRouteActive(pathname, link.href)}
                  className="text-mono-sm text-foreground"
                >
                  {link.label}
                </CustomLink>
              ))}
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent('annnimate:open-cookie-preferences'))
                }
                className="inline-flex items-center text-mono-sm text-foreground-muted transition-colors duration-300 ease-out hover:text-foreground"
              >
                {t('common.footer.cookiePreferences')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
