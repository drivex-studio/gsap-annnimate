'use client';

import React, { useMemo } from 'react';

import { cx } from '@/libs/utils/className';
import { t } from '@/libs/utils/i18n';

import { XLogo } from '@phosphor-icons/react';
import { LinkedinLogo } from '@phosphor-icons/react';
import { InstagramLogo } from '@phosphor-icons/react';
import { GithubLogo } from '@phosphor-icons/react';
import BrandLogo from '@/components/ui/BrandLogo'; // module id: 843028
import BrandWordmark from '@/components/common/BrandWordmark'; // module id: 503433
import FooterLink from '@/components/navigation/NavLink'; // module id: 520237
import BaseLink from '@/components/navigation/Link'; // module id: 101836
import NewsletterForm, { NewsletterEyebrow } from '@/components/ui/NewsletterEyebrow'; // module id: 42242
import { LandingDivider } from '@/components/layout/Footer/LandingDivider';

import { useCategories } from '@/providers/CategoryProvider'; // module id: 87207

import { AskAiLinks } from '@/components/layout/Footer/AskAiLinks';
import { FooterAccordion } from '@/components/layout/Footer/FooterAccordion';
import { FooterStatus } from '@/components/layout/Footer/FooterStatus';
import { StudioClock } from '@/components/layout/Footer/StudioClock';

const PLATFORM_COLUMN = {
  label: t('common.footer.columns.platform'),
  links: [
    {
      label: t('common.footer.platformLinks.howItWorks'),
      href: '/platform',
    },
    {
      label: t('common.footer.platformLinks.documentation'),
      href: '/docs',
    },
    {
      label: t('common.footer.platformLinks.mcpServer'),
      href: '/docs/guides/mcp',
    },
    {
      label: t('common.footer.platformLinks.learnGsap'),
      href: '/learn',
    },
    {
      label: t('common.footer.platformLinks.freeTools'),
      href: '/tools',
    },
    {
      label: t('common.footer.platformLinks.compare'),
      href: '/compare',
    },
    {
      label: t('common.footer.platformLinks.stateOfWebAnimation'),
      href: '/state-of-web-animation',
    },
    {
      label: t('common.footer.platformLinks.changelog'),
      href: '/changelog',
    },
    {
      label: t('common.footer.platformLinks.roadmap'),
      href: '/roadmap',
    },
    {
      label: t('common.footer.platformLinks.pricing'),
      href: '/pricing',
    },
    {
      label: t('common.footer.platformLinks.faqs'),
      href: '/faq',
    },
    {
      label: t('common.footer.platformLinks.affiliates'),
      href: '/affiliate',
    },
  ],
};

const KITS_COLUMN = {
  label: t('common.footer.columns.kits'),
  links: [
    {
      label: t('common.footer.kitsLinks.seeTheKits'),
      href: '/kits',
    },
    {
      label: t('common.footer.kitsLinks.whatAKitIs'),
      href: '/kits',
    },
    {
      label: t('common.footer.kitsLinks.kitVsLibrary'),
      href: '/kits',
    },
  ],
};

const SOCIAL_LINKS = [
  {
    label: 'X',
    href: 'https://x.com/juli_fella',
    Icon: XLogo,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/julianfella/',
    Icon: LinkedinLogo,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/goodfelladesign/',
    Icon: InstagramLogo,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/GoodFellaStudio',
    Icon: GithubLogo,
  },
];

const LEGAL_LINKS = [
  {
    label: t('common.footer.legalLinks.privacy'),
    href: '/privacy',
  },
  {
    label: t('common.footer.legalLinks.terms'),
    href: '/terms',
  },
  {
    label: t('common.footer.legalLinks.cookies'),
    href: '/cookies',
  },
  {
    label: t('common.footer.legalLinks.refund'),
    href: '/refund',
  },
];

export default function Footer({ latestAnimation }) {
  const categories = useCategories();

  const navigationColumns = useMemo(
    () => [
      PLATFORM_COLUMN,
      {
        label: t('common.footer.columns.library'),
        links: [
          {
            label: t('common.footer.libraryLinks.allComponents'),
            href: '/animations',
          },
          ...categories.map((category) => ({
            label: category.name,
            href: `/animations?category=${category.slug}`,
          })),
          {
            label: t('common.footer.libraryLinks.showcase'),
            href: '/showcase',
          },
        ],
      },
      KITS_COLUMN,
    ],
    [categories],
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
        <div className="w-full max-w-[calc(var(--v2-max,1920px)-64px)] mx-auto py-24">
          <div className="grid grid-cols-12 items-center gap-16">
            <div className="col-span-12 md:col-span-7">
              <FooterStatus latest={latestAnimation} />
            </div>
            <div className="col-span-12 md:col-span-5 md:justify-self-end">
              <div className="flex flex-wrap items-center gap-x-24 gap-y-12">
                <AskAiLinks />
                <StudioClock />
              </div>
            </div>
          </div>
        </div>

        <LandingDivider />

        <div className="w-full max-w-[calc(var(--v2-max,1920px)-64px)] mx-auto py-32 lg:py-64">
          <div className="grid grid-cols-12 gap-16 gap-y-64">
            <div className="col-span-12 flex flex-col gap-32 lg:col-span-5">
              <BaseLink
                href="/"
                aria-label="Annnimate home"
                className="inline-block w-fit"
              >
                <BrandLogo height={20} className="text-foreground" />
              </BaseLink>

              <NewsletterForm
                source="footer"
                idPrefix="footer"
                eyebrow={<NewsletterEyebrow />}
                inputSize="lg"
              />

              <div className="flex flex-wrap items-center gap-x-12 gap-y-16">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={cx(
                      'flex size-32 items-center justify-center text-foreground',
                      'transition-colors duration-(--duration-fast) ease-(--ease-expo-out)',
                      'hover:text-foreground-muted',
                    )}
                  >
                    <Icon className="size-20" aria-hidden="true" />
                  </a>
                ))}
                <FooterLink
                  href="/contact"
                  variant="nav"
                  className="text-mono-sm text-foreground"
                >
                  {t('common.footer.contact')}
                </FooterLink>
              </div>

              <BrandWordmark
                fit="width"
                tone="muted"
                playOnView={true}
                aria-hidden="true"
                className="mt-auto w-full pt-32"
              />
            </div>

            <div className="col-span-12 flex flex-col lg:hidden">
              {navigationColumns.map((column) => (
                <FooterAccordion
                  key={column.label}
                  label={column.label}
                  links={column.links}
                />
              ))}
            </div>

            {navigationColumns.map((column, columnIndex) => (
              <nav
                key={column.label}
                aria-label={column.label}
                className={`hidden lg:col-span-2 lg:block ${
                  columnIndex === 0 ? 'lg:col-start-7' : ''
                }`}
              >
                <p className="text-mono-sm mb-24 text-foreground-muted">
                  {column.label}
                </p>
                <ul className="flex flex-col">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <FooterLink
                        href={link.href}
                        variant="nav"
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className="text-body-sm -mx-12 text-foreground"
                      >
                        {link.label}
                      </FooterLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <LandingDivider />

        <div className="w-full max-w-[calc(var(--v2-max,1920px)-64px)] mx-auto pt-24">
          <div className="flex flex-col items-start justify-between gap-12 md:flex-row md:items-center">
            <div className="text-mono-sm flex flex-wrap items-center gap-x-8 gap-y-4 text-foreground-muted">
              <span>
                {t('common.footer.copyright', {
                  year: new Date().getFullYear(),
                })}
              </span>
              <span className="opacity-40">·</span>
              <span>{t('common.footer.builtBy')}</span>
              <FooterLink
                href="https://good-fella.com"
                variant="nav"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mono-sm -mx-12 -my-6 text-foreground"
              >
                {t('common.footer.builtByName')}
              </FooterLink>
            </div>

            <div className="flex flex-wrap items-center gap-x-32 gap-y-12">
              {LEGAL_LINKS.map((link) => (
                <FooterLink
                  key={link.href}
                  href={link.href}
                  variant="nav"
                  className="text-mono-sm -mx-12 -my-6 text-foreground"
                >
                  {link.label}
                </FooterLink>
              ))}
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('annnimate:open-cookie-preferences'),
                  )
                }
                className={cx(
                  'text-mono-sm inline-flex items-center text-foreground-muted',
                  'transition-colors duration-300 ease-out hover:text-foreground',
                )}
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
