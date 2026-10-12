"use client";
import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReveal } from '@/hooks/useReveal';
import { useUser } from '@/providers/UserProvider';
import { getDiscordLinkForUser } from '@/libs/utils/discord';
import { translate } from '@/libs/utils/i18n';
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
    <div className="SectionTitle text-foreground">
      <LogoIcon height={16} />
      <LogoText height={14} className="text-foreground" />
    </div>
  );
}

function NavSectionHeader({ children }) {
  return (
    <div className="NavSectionHeader text-mono-sm text-foreground-muted/60">
      {children}
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, href, external = false }) {
  const className = `NavItem ${active ? 'is-active text-foreground' : 'text-foreground-muted hover:text-foreground'}`;

  const content = (
    <Fragment>
      {active && <span aria-hidden="true" className="NavItem-indicator" />}
      <span className="NavItem-iconWrapper">
        <Icon className="NavItem-icon" />
      </span>
      <span className="NavItem-label">{label}</span>
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
        className="DropdownCategoryItem text-left text-sm text-foreground"
      >
        <span>{cat.label}</span>
        <span className="DropdownCategoryItem-countWrapper">
          <span className="text-accent-2xs text-foreground-muted">{cat.count}</span>
          {activeCategory === cat.slug && <span className="DropdownCategoryItem-indicator" aria-hidden="true" />}
        </span>
      </button>
    </li>
  );
}

function DropdownList({ activeCategory, setActiveCategory, setIsDropdownOpen, categoryCounts }) {
  return (
    <ul role="listbox" className="DropdownList">
      <li>
        <button
          type="button"
          onClick={() => {
            setActiveCategory(null);
            setIsDropdownOpen(false);
          }}
          className="DropdownList-allButton text-left text-sm text-foreground"
        >
          <span>All categories</span>
          {!activeCategory && <span className="DropdownList-indicator" aria-hidden="true" />}
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
    <div ref={dropdownRef} className="Dropdown">
      <button
        type="button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isDropdownOpen}
        className="Dropdown-button text-accent-xs text-foreground"
      >
        <Funnel className="Dropdown-icon text-foreground-muted" />
        <span className="Dropdown-label text-left">{activeCategoryLabel}</span>
        <CaretDown className={`Dropdown-caret text-foreground-muted ${isDropdownOpen ? 'is-open' : ''}`} />
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
    <div aria-hidden="true" className="PlaceholderCard">
      <div className="PlaceholderCard-image" />
      <div className="PlaceholderCard-title" />
      <div className="PlaceholderCard-subtitle" />
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
      .map((key) => ({ slug: key, label: CATEGORY_LABELS[key], count: counts[key] }));
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
        tl.from(el.children, { autoAlpha: 0, y: 32, duration: 0.8, stagger: 0.04, ease: 'expo.out', delay: 0.35 });
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
    <div className="AnimationsFilterBar">
      <div className="AnimationsFilterBar-layout">
        <aside className="AnimationsFilterBar-sidebar">
          <SectionTitle />
          <nav className="AnimationsFilterBar-nav">
            <NavSectionHeader>{translate('platform.mockup.sectionPlatform')}</NavSectionHeader>
            <NavItem icon={SquaresFour} label={translate('platform.mockup.navAnimations')} href="/animations" active />
            <NavItem icon={BookmarkSimple} label={translate('platform.mockup.navSaved')} href={isAuthenticated ? '/animations/saved' : '/animations'} />
            <NavItem icon={Package} label={translate('platform.mockup.navKits')} href="/kits" />
            <NavItem icon={Lightbulb} label={translate('platform.mockup.navRoadmap')} href="/roadmap" />
            <div className="AnimationsFilterBar-navSection">
              <NavSectionHeader>{translate('platform.mockup.sectionSupport')}</NavSectionHeader>
            </div>
            <NavItem icon={BookOpen} label={translate('platform.mockup.navDocumentation')} href="/docs" />
            <NavItem icon={PlugsConnected} label={translate('platform.mockup.navMcp')} href="/docs/guides/mcp" />
            <NavItem icon={GraduationCap} label={translate('platform.mockup.navLearn')} href="/learn" />
            <NavItem icon={Question} label={translate('platform.mockup.navHelp')} href={isAuthenticated ? '/help' : '/contact'} />
            <NavItem icon={GearSix} label={translate('platform.mockup.navSettings')} href={isAuthenticated ? '/settings' : '/login'} />
            <NavItem icon={DiscordLogo} label={translate('platform.mockup.navDiscord')} href={discordLink} external />
            <div className="AnimationsFilterBar-user">
              <div className="AnimationsFilterBar-userInfo">
                <div className="AnimationsFilterBar-userAvatar text-mono-sm text-foreground-muted">
                  {translate('platform.mockup.userInitials')}
                </div>
                <div className="AnimationsFilterBar-userDetails">
                  <div className="AnimationsFilterBar-userName text-sm text-foreground">
                    {translate('platform.mockup.userName')}
                  </div>
                  <div className="AnimationsFilterBar-userPlan text-mono-sm text-foreground-muted/60">
                    {translate('platform.mockup.userPlan')}
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </aside>
        <main className="AnimationsFilterBar-main">
          <header className="AnimationsFilterBar-header">
            <div className="AnimationsFilterBar-headerLeft">
              <p className="AnimationsFilterBar-title text-h6 text-foreground">
                {translate('platform.mockup.headerTitle')}
              </p>
              {filterBarDemo ? (
                <span className="AnimationsFilterBar-stats text-mono-sm text-foreground-muted/60">
                  <AnimatedNumber
                    value={matchCount}
                    minDigits={1}
                    triggerMode="immediate"
                    duration={0.6}
                    valueChangeDuration={0.9}
                    ease="power3.inOut"
                    className="AnimationsFilterBar-statsNumber text-mono-sm"
                  />
                  matching
                </span>
              ) : (
                <span className="text-mono-sm text-foreground-muted/60">
                  {totalCount
                    ? translate('platform.mockup.headerShowingOfTotal', { shown: Math.min(9, animations.length), total: totalCount })
                    : translate('platform.mockup.headerCount', { count: animations.length })}
                </span>
              )}
            </div>
            {filterBarDemo ? (
              <div className="AnimationsFilterBar-controls">
                <Dropdown
                  activeCategoryLabel={activeCategoryLabel}
                  isDropdownOpen={isDropdownOpen}
                  setIsDropdownOpen={setIsDropdownOpen}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  categoryCounts={categoryCounts}
                  dropdownRef={dropdownRef}
                />
                <span className="AnimationsFilterBar-divider" />
                <div className="AnimationsFilterBar-viewToggles">
                  <span className="AnimationsFilterBar-viewToggle is-active text-foreground">
                    <SquaresFour className="AnimationsFilterBar-viewToggleIcon" />
                  </span>
                  <span className="AnimationsFilterBar-viewToggle text-foreground-muted/40">
                    <List className="AnimationsFilterBar-viewToggleIcon" />
                  </span>
                </div>
              </div>
            ) : (
              <div className="AnimationsFilterBar-mobileIcons text-foreground-muted/70">
                <SquaresFour size={18} aria-hidden="true" />
                <Funnel size={18} aria-hidden="true" />
                <List size={18} aria-hidden="true" />
              </div>
            )}
          </header>
          <div className="AnimationsFilterBar-content">
            <div ref={gridRef} className="AnimationsFilterBar-grid">
              {(filterBarDemo ? displayedItems : animations).slice(0, 9).map((anim, index) => (
                <AnimationCard key={anim.id} animation={anim} viewMode="grid" isAuthenticated={false} priority={index === 0} />
              ))}
              {filterBarDemo && displayedItems.length < 9 && (
                Array.from({ length: 9 - displayedItems.length }).map((_, idx) => (
                  <PlaceholderCard key={`ph-${idx}`} />
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
