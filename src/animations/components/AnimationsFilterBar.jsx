"use client";
import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReveal } from '@/hooks/useReveal';
import { useUser } from '@/providers/UserProvider';
import { getDiscordLinkForUser } from '@/libs/utils/discord';
import { translate as t } from '@/libs/utils/i18n';
import {
  SquaresFour,
  BookmarkSimple,
  Package,
  Lightbulb,
  BookOpen,
  PlugsConnected,
  GraduationCap,
  Question,
  GearSix,
  DiscordLogo,
  Funnel,
  CaretDown,
  List,
} from '@phosphor-icons/react';

import LogoText from '@/assets/logos/LogoText';
import LogoIcon from '@/assets/logos/LogoIcon';
import Link from '@/components/navigation/Link';
import AnimatedNumber from '@/animations/components/AnimatedNumber';
import AnimationCard from '@/animations/components/AnimationCard';

const CATEGORY_LABELS = {
  button: 'Buttons',
  scroll: 'Scroll',
  'ui-component': 'UI Components',
  experimental: 'Experimental',
  shader: 'Shaders',
  menu: 'Menus',
  section: 'Sections',
};

function SectionTitle() {
  return (
    <div className="mb-24 flex items-center gap-8 px-8 py-4 text-foreground">
      <LogoIcon height={16} />
      <LogoText height={14} className="text-foreground" />
    </div>
  );
}

function NavSectionHeader({ children }) {
  return (
    <div className="mb-4 px-12 pt-4 text-mono-sm text-foreground-muted/60">
      {children}
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, href, external = false }) {
  const className = `group relative flex w-full items-center gap-8 rounded-sm px-12 py-8 text-left text-sm transition-colors duration-(--duration-quick) ${
    active ? 'bg-foreground/10 text-foreground' : 'bg-transparent text-foreground-muted hover:bg-foreground/[0.06] hover:text-foreground'
  }`;

  const content = (
    <Fragment>
      {active && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-8 left-0 w-2 bg-brand" />
      )}
      <span className="inline-flex size-16 items-center justify-center">
        <Icon className="size-16" />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Fragment>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function DropdownCategoryItem({ cat, activeCategory, setActiveCategory, setIsDropdownOpen }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => {
          setActiveCategory(cat.slug);
          setIsDropdownOpen(false);
        }}
        className="flex w-full cursor-pointer items-center justify-between gap-12 border-0 bg-transparent px-12 py-8 text-left text-sm text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
      >
        <span>{cat.label}</span>
        <span className="flex items-center gap-8">
          <span className="text-accent-2xs text-foreground-muted">{cat.count}</span>
          {activeCategory === cat.slug && <span className="size-6 bg-brand" aria-hidden="true" />}
        </span>
      </button>
    </li>
  );
}

function DropdownList({ activeCategory, setActiveCategory, setIsDropdownOpen, categoryCounts }) {
  return (
    <ul
      role="listbox"
      className="absolute left-0 top-full z-[30] mt-4 max-h-[300px] min-w-[190px] overflow-auto border border-foreground/12 bg-surface py-4 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]"
    >
      <li>
        <button
          type="button"
          onClick={() => {
            setActiveCategory(null);
            setIsDropdownOpen(false);
          }}
          className="flex w-full cursor-pointer items-center justify-between gap-12 border-0 bg-transparent px-12 py-8 text-left text-sm text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
        >
          <span>All categories</span>
          {!activeCategory && <span className="size-6 bg-brand" aria-hidden="true" />}
        </button>
      </li>
      {categoryCounts.map((cat) => (
        <DropdownCategoryItem
          key={cat.slug}
          cat={cat}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          setIsDropdownOpen={setIsDropdownOpen}
        />
      ))}
    </ul>
  );
}

function Dropdown({ activeCategoryLabel, isDropdownOpen, setIsDropdownOpen, activeCategory, setActiveCategory, categoryCounts, dropdownRef }) {
  return (
    <div ref={dropdownRef} className="relative flex items-stretch">
      <button
        type="button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isDropdownOpen}
        className="text-accent-xs flex cursor-pointer items-center gap-8 border-0 bg-transparent px-12 text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
      >
        <Funnel className="size-14 text-foreground-muted" />
        <span className="min-w-[72px] truncate text-left">{activeCategoryLabel}</span>
        <CaretDown
          className={`size-14 text-foreground-muted transition-transform duration-(--duration-fast) ease-(--ease-expo-out) ${isDropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isDropdownOpen && (
        <DropdownList
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          setIsDropdownOpen={setIsDropdownOpen}
          categoryCounts={categoryCounts}
        />
      )}
    </div>
  );
}

function PlaceholderCard() {
  return (
    <div aria-hidden="true" className="invisible bg-surface p-12">
      <div className="aspect-[16/10] w-full" />
      <div className="mt-12 h-24" />
      <div className="mt-36 h-20" />
    </div>
  );
}

export default function AnimationsFilterBar({
  animations = [],
  revealOnPageEnter = false,
  filterBarDemo = false,
  filterPool = [],
  totalCount = null,
}) {
  const { user, profile } = useUser();
  const isAuthenticated = !!user;
  const discordLink = getDiscordLinkForUser(profile);
  const gridRef = useRef(null);
  const dropdownRef = useRef(null);
  const prevCategoryRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const poolWithImages = useMemo(() => (filterPool || []).filter((e) => e?.preview_image_url), [filterPool]);
  const animationsWithImages = useMemo(() => (animations || []).filter((e) => e?.preview_image_url), [animations]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    poolWithImages.forEach((anim) => {
      counts[anim.category] = (counts[anim.category] || 0) + 1;
    });
    return Object.keys(CATEGORY_LABELS)
      .filter((key) => counts[key])
      .map((key) => ({
        slug: key,
        label: CATEGORY_LABELS[key],
        count: counts[key],
      }));
  }, [poolWithImages]);

  const filteredItems = useMemo(() => {
    if (!activeCategory) return animationsWithImages;
    return poolWithImages.filter((e) => e.category === activeCategory);
  }, [activeCategory, animationsWithImages, poolWithImages]);

  const displayedItems = filteredItems.slice(0, 9);
  const matchCount = activeCategory ? filteredItems.length : (totalCount ?? animationsWithImages.length);
  const activeCategoryLabel = (activeCategory && CATEGORY_LABELS[activeCategory]) || 'All categories';

  useReveal(gridRef, {
    mode: 'hero',
    build: (el) => {
      const tl = gsap.timeline({ paused: true });
      if (revealOnPageEnter && el?.children?.length) {
        tl.from(el.children, {
          autoAlpha: 0,
          y: 32,
          duration: 0.8,
          stagger: 0.04,
          ease: 'expo.out',
          delay: 0.35,
        });
      }
      return tl;
    },
    deps: [revealOnPageEnter],
  });

  useEffect(() => {
    if (!isDropdownOpen) return;

    function handlePointerDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return function cleanup() {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  useGSAP(() => {
    if (!filterBarDemo) return;
    const currentCatStr = String(activeCategory);
    
    if (prevCategoryRef.current === null) {
      prevCategoryRef.current = currentCatStr;
      return;
    }
    
    if (currentCatStr === prevCategoryRef.current) return;
    prevCategoryRef.current = currentCatStr;
    const grid = gridRef.current;
    
    if (!grid || !grid.children.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const targets = Array.from(grid.children).slice(0, displayedItems.length);
    
    if (targets.length) {
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.035, ease: 'expo.out', overwrite: true }
      );
    }
  }, { dependencies: [activeCategory], scope: gridRef });

  return (
    <div className="relative overflow-hidden rounded-md border border-foreground/15 bg-background shadow-[0_24px_64px_-24px_rgba(0,0,0,0.5)]">
      <div className="flex h-full min-h-[520px] lg:min-h-[720px]">
        <aside className="m-8 hidden w-[220px] shrink-0 flex-col rounded-md border border-foreground/15 bg-surface p-12 md:flex">
          <SectionTitle />
          <nav className="flex flex-1 flex-col">
            <NavSectionHeader>{t('platform.mockup.sectionPlatform')}</NavSectionHeader>
            <NavItem icon={SquaresFour} label={t('platform.mockup.navAnimations')} href="/animations" active />
            <NavItem icon={BookmarkSimple} label={t('platform.mockup.navSaved')} href={isAuthenticated ? '/animations/saved' : '/animations'} />
            <NavItem icon={Package} label={t('platform.mockup.navKits')} href="/kits" />
            <NavItem icon={Lightbulb} label={t('platform.mockup.navRoadmap')} href="/roadmap" />
            <div className="mt-16">
              <NavSectionHeader>{t('platform.mockup.sectionSupport')}</NavSectionHeader>
            </div>
            <NavItem icon={BookOpen} label={t('platform.mockup.navDocumentation')} href="/docs" />
            <NavItem icon={PlugsConnected} label={t('platform.mockup.navMcp')} href="/docs/guides/mcp" />
            <NavItem icon={GraduationCap} label={t('platform.mockup.navLearn')} href="/learn" />
            <NavItem icon={Question} label={t('platform.mockup.navHelp')} href={isAuthenticated ? '/help' : '/contact'} />
            <NavItem icon={GearSix} label={t('platform.mockup.navSettings')} href={isAuthenticated ? '/settings' : '/login'} />
            <NavItem icon={DiscordLogo} label={t('platform.mockup.navDiscord')} href={discordLink} external />
            <div className="mt-auto border-t border-foreground/10 pt-12">
              <div className="flex items-center gap-8 px-4 py-4">
                <div className="flex size-28 items-center justify-center rounded-full bg-foreground/10 text-mono-sm text-foreground-muted">
                  {t('platform.mockup.userInitials')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-foreground">
                    {t('platform.mockup.userName')}
                  </div>
                  <div className="truncate text-mono-sm text-foreground-muted/60">
                    {t('platform.mockup.userPlan')}
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </aside>
        <main className="relative flex min-w-0 flex-1 flex-col bg-background">
          <header className="flex items-center justify-between gap-16 border-b border-foreground/15 px-16 py-12 lg:px-20">
            <div className="flex items-center gap-12">
              <p className="text-h6 m-0 text-foreground">
                {t('platform.mockup.headerTitle')}
              </p>
              {filterBarDemo ? (
                <span className="text-mono-sm flex items-center gap-4 text-foreground-muted/60">
                  <AnimatedNumber
                    value={matchCount}
                    minDigits={1}
                    triggerMode="immediate"
                    duration={0.6}
                    valueChangeDuration={0.9}
                    ease="power3.inOut"
                    className="text-mono-sm leading-none"
                  />
                  matching
                </span>
              ) : (
                <span className="text-mono-sm text-foreground-muted/60">
                  {totalCount
                    ? t('platform.mockup.headerShowingOfTotal', { shown: Math.min(9, animations.length), total: totalCount })
                    : t('platform.mockup.headerCount', { count: animations.length })}
                </span>
              )}
            </div>
            {filterBarDemo ? (
              <div className="hidden items-stretch lg:flex">
                <Dropdown
                  activeCategoryLabel={activeCategoryLabel}
                  isDropdownOpen={isDropdownOpen}
                  setIsDropdownOpen={setIsDropdownOpen}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  categoryCounts={categoryCounts}
                  dropdownRef={dropdownRef}
                />
                <span className="mx-4 w-px self-stretch bg-foreground/10" />
                <div className="flex items-center gap-4 pl-8">
                  <span className="flex size-24 items-center justify-center rounded-sm bg-foreground/10 text-foreground">
                    <SquaresFour className="size-14" />
                  </span>
                  <span className="flex size-24 items-center justify-center text-foreground-muted/40">
                    <List className="size-14" />
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-12 text-foreground-muted/70">
                <SquaresFour size={18} aria-hidden="true" />
                <Funnel size={18} aria-hidden="true" />
                <List size={18} aria-hidden="true" />
              </div>
            )}
          </header>
          <div className="flex-1 overflow-hidden p-16 lg:p-24">
            <div
              ref={gridRef}
              className="grid grid-cols-1 gap-x-16 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-24 lg:gap-y-24"
            >
              {(filterBarDemo ? displayedItems : animations).slice(0, 9).map((anim, index) => (
                <AnimationCard
                  key={anim.id}
                  animation={anim}
                  viewMode="grid"
                  isAuthenticated={false}
                  priority={index === 0}
                />
              ))}
              {filterBarDemo && displayedItems.length < 9
                ? Array.from({ length: 9 - displayedItems.length }).map((_, idx) => (
                    <PlaceholderCard key={`ph-${idx}`} />
                  ))
                : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}