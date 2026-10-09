"use client";
import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';

import { translate as t } from '@/libs/utils/i18n';
import { isRouteActive } from '@/libs/config/isRouteActive';
import { useCategories } from '@/providers/CategoryProvider';
import { createClient } from '@/libs/supabase/client';
import LogoIcon from '@/assets/logos/LogoIcon';
import Link from '@/components/navigation/Link'; 
import NavLink from '@/components/navigation/NavLink';
import NewsletterForm, { NewsletterEyebrow } from '@/components/ui/NewsletterEyebrow';

import AnimatedDivider from '@/animations/components/AnimatedDivider';
import { platformData, kitsData, socialLinks, legalLinks } from './Footer/FooterData';
import { AskAi, MobileAccordionColumn, FooterClock, StatusIndicator, FooterWordmark } from './Footer/FooterHelpers';

export default function Footer({ latestAnimation }) {
  let pathname = usePathname();
  let categories = useCategories();
  
  let navColumns = useMemo(() => [
    platformData,
    {
      label: t('common.footer.columns.library'),
      links: [
        { label: t('common.footer.libraryLinks.allComponents'), href: '/animations' },
        ...categories.map(cat => ({ label: cat.name, href: `/animations?category=${cat.slug}` })),
        { label: t('common.footer.libraryLinks.showcase'), href: '/showcase' }
      ]
    },
    kitsData
  ], [categories]);

  return (
    <footer data-theme="dark" className="annnimate-footer relative bg-background px-24 pb-24 lg:px-32 lg:pb-32">
      <div data-theme="light" className="relative z-[20] p-24 lg:p-48 overflow-hidden bg-background text-foreground">
        
        <div className="w-full max-w-[1920px] mx-auto py-24">
          <div className="grid grid-cols-12 items-center gap-16">
            <div className="col-span-12 md:col-span-7">
              <StatusIndicator latest={latestAnimation} />
            </div>
            <div className="col-span-12 md:col-span-5 md:justify-self-end">
              <div className="flex flex-wrap items-center gap-x-24 gap-y-12">
                <AskAi />
                <FooterClock />
              </div>
            </div>
          </div>
        </div>
        
        <AnimatedDivider />
        
        <div className="w-full max-w-[1920px] mx-auto py-32 lg:py-64">
          <div className="grid grid-cols-12 gap-16 gap-y-64">
            
            <div className="col-span-12 flex flex-col gap-32 lg:col-span-5">
              <Link href="/" aria-label="Annnimate home" className="inline-block w-fit">
                <LogoIcon height={20} className="text-foreground" />
              </Link>
              <NewsletterForm source="footer" idPrefix="footer" eyebrow={<NewsletterEyebrow />} inputSize="lg" />
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
                <NavLink href="/contact" active={isRouteActive(pathname, '/contact')} className="text-mono-sm text-foreground">
                  {t('common.footer.contact')}
                </NavLink>
              </div>
            </div>
            
            <div className="col-span-12 flex flex-col lg:hidden">
              {navColumns.map(col => (
                <MobileAccordionColumn key={col.label} label={col.label} links={col.links} />
              ))}
            </div>
            
            {navColumns.map((col, index) => (
              <nav key={col.label} aria-label={col.label} className={`hidden lg:col-span-2 lg:block ${index === 0 ? 'lg:col-start-7' : ''}`}>
                <p className="text-mono-sm mb-24 text-foreground-muted">{col.label}</p>
                <ul className="flex flex-col gap-4">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <NavLink
                        href={link.href}
                        active={!link.external && isRouteActive(pathname, link.href)}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className="text-body-sm text-foreground"
                      >
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            
          </div>
        </div>
        
        <AnimatedDivider />
        <FooterWordmark />
        
        <div className="w-full max-w-[1920px] mx-auto pb-24">
          <div className="flex flex-col items-start justify-between gap-12 md:flex-row md:items-center">
            <div className="text-mono-sm flex flex-wrap items-center gap-x-8 gap-y-4 text-foreground-muted">
              <span>{t('common.footer.copyright', { year: new Date().getFullYear() })}</span>
              <span className="opacity-40">·</span>
              <span>{t('common.footer.builtBy')}</span>
              <NavLink href="https://good-fella.com" target="_blank" rel="noopener noreferrer" className="text-mono-sm text-foreground">
                {t('common.footer.builtByName')}
              </NavLink>
            </div>
            <div className="flex flex-wrap items-center gap-x-32 gap-y-12">
              {legalLinks.map(link => (
                <NavLink key={link.href} href={link.href} active={isRouteActive(pathname, link.href)} className="text-mono-sm text-foreground">
                  {link.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('annnimate:open-cookie-preferences'))}
                className="text-mono-sm inline-flex items-center text-foreground-muted transition-colors duration-300 ease-out hover:text-foreground"
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
