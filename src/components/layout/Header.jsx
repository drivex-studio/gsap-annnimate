'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { cn } from '@/libs/utils/className';
import { bunnyImageUrl } from '@/libs/utils/bunnyImageUrl';
import { createClient } from '@/libs/supabase/client';
import Logo from '@/assets/logos/SiteLogo';
import NavLink from '@/components/navigation/NavLink';
import Link from '@/components/navigation/Link';
import Button from '@/components/ui/Button';
import { translate } from '@/libs/utils/i18n';
import { isRouteActive } from '@/libs/config/isRouteActive';
import { useCategories } from '@/providers/CategoryProvider';
import { themes, navItemsData } from '@/libs/config/navConfig';
import { DesktopMegaMenuItem } from './Header/DesktopMegaMenuItem';
import { MobileAccordionItem } from './Header/MobileAccordionItem';
import { HeaderMarquee } from './Header/HeaderMarquee';

function useHeaderAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createClient();

    async function fetchUser() {
      try {
        const {
          data: { user },
          error,
        } = await client.auth.getUser();

        if (error || !user) {
          setUser(null);
          return;
        }

        const { data } = await client.from('users').select('*').eq('id', user.id).single();

        setUser({
          id: user.id,
          email: user.email,
          name: data?.name || data?.display_name || user.email?.split('@')[0] || 'User',
          avatarUrl: data?.avatar_url,
          avatarIndex: data?.avatar_index || 0,
          subscriptionStatus: data?.subscription_status || 'free',
          hasAccess: data?.has_access || false,
        });
      } catch (err) {
        console.error('Error fetching user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser();
        return;
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    hasAccess: !loading && (user?.hasAccess || false),
    isAuthenticated: !loading && !!user,
  };
}

function useHeaderTheme(ref) {
  const pathname = usePathname();
  const [scrollState, setScrollState] = useState('top');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerTheme, setHeaderTheme] = useState('dark');
  const isScrollLocked = useRef(false);

  const updateTheme = useCallback((offset) => {
    const elements = document.querySelectorAll('main [data-theme]');

    if (elements.length === 0) return;

    const target = Array.from(elements).find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top <= offset && rect.bottom > offset;
    });

    const theme = (target ?? elements[0])?.dataset.theme;

    if (theme && themes.includes(theme)) setHeaderTheme(theme);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollState(window.scrollY > 50 ? 'scrolled' : 'top');

      if (ref.current) updateTheme(ref.current.offsetTop);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [updateTheme, ref]);

  useEffect(() => {
    let isUnmounted = false;

    const update = () => {
      if (!isUnmounted && ref.current) {
        setScrollState(window.scrollY > 50 ? 'scrolled' : 'top');
        updateTheme(ref.current.offsetTop);
      }
    };

    const header = ref.current?.closest('.v2-header');

    header?.classList.add('no-transition');
    update();

    const frame = requestAnimationFrame(() => {
      update();

      requestAnimationFrame(() => header?.classList.remove('no-transition'));
    });

    const observer = new MutationObserver(update);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const timeout = setTimeout(() => observer.disconnect(), 800);

    return () => {
      isUnmounted = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      clearTimeout(timeout);
      header?.classList.remove('no-transition');
    };
  }, [updateTheme, ref]);

  const headerState = useMemo(
    () => (isMenuOpen ? 'menuOpen' : scrollState),
    [isMenuOpen, scrollState],
  );

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeydown = (e) => {
      if (e.key === 'Escape') closeMenu();
    };

    window.addEventListener('keydown', handleKeydown);

    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isMenuOpen, closeMenu]);

  useEffect(() => {
    if (isMenuOpen) {
      document.documentElement.classList.add('v2-scroll-locked');
      window.lenis?.stop?.();
      isScrollLocked.current = true;
      return;
    }

    if (isScrollLocked.current) {
      document.documentElement.classList.remove('v2-scroll-locked');
      window.lenis?.start?.();
      isScrollLocked.current = false;
    }
  }, [isMenuOpen]);

  return {
    scrollState,
    isMenuOpen,
    headerState,
    headerTheme,
    toggleMenu,
    closeMenu,
    pathname,
  };
}

function MegaMenuIntro({ intro, onClose }) {
  return (
    <div data-mm-reveal className="col-span-3 col-start-1 flex flex-col gap-16">
      <p className="text-mono-sm text-foreground-muted">{intro.eyebrow}</p>
      <p className="text-h4 text-foreground">{intro.heading}</p>
      <p className="text-body-sm text-foreground-muted">{intro.text}</p>
      <Link
        href={intro.cta.href}
        onClick={() => {}}
        className="text-mono-sm w-fit text-foreground underline underline-offset-4 hover:text-foreground-muted"
      >
        {intro.cta.label}
      </Link>
    </div>
  );
}

function MegaMenuColumn({ column }) {
  return (
    <div
      data-mm-reveal
      className="flex flex-1 flex-col gap-8"
    >
      <span className="text-mono-sm mb-4 text-foreground-muted">{column.label}</span>
      {column.links.map((link) => (
        <NavLink
          key={link.label}
          href={link.href}
          className="text-body-sm py-4 text-foreground-muted transition-colors duration-200 hover:text-foreground"
        >
          {link.label}
          {link.badge ? (
            <span className="text-accent-2xs ml-8 inline-block bg-brand px-6 py-2 align-middle text-black">
              {link.badge}
            </span>
          ) : null}
        </NavLink>
      ))}
    </div>
  );
}

function MegaMenuColumns({ columns }) {
  return (
    <div className="col-span-4 col-start-5 flex gap-48">
      {columns.map((column) => (
        <MegaMenuColumn key={column.label} column={column} />
      ))}
    </div>
  );
}

function FeaturedMegaMenu({ featured, onClose }) {
  return (
    <div data-mm-reveal className="col-span-3 col-start-10">
      <Link
        href={featured.href}
        onClick={onClose}
        className="flex flex-col gap-12"
      >
        <div className="aspect-[16/10] w-full overflow-hidden bg-background-muted">
          <picture>
            {featured.image.avif ? (
              <source srcSet={featured.image.avif} type="image/avif" />
            ) : null}
            <img
              src={featured.image.jpg}
              alt={featured.image.alt}
              className="block object-cover"
              style={{ width: '100%', height: '100%' }}
            />
          </picture>
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-mono-sm text-foreground-muted">{featured.eyebrow}</p>
          <p className="text-body-sm text-foreground">{featured.title}</p>
        </div>
      </Link>
    </div>
  );
}

function LatestAnimationMegaMenu({ animation, onClose }) {
  return (
    <div data-mm-reveal className="col-span-3 col-start-10">
      <Link
        href={`/animations/${animation.slug}`}
        onClick={onClose}
        className="flex flex-col gap-12"
      >
        <div className="aspect-[16/10] w-full overflow-hidden bg-background-muted">
          {animation.preview_video_url ? (
            <video
              src={animation.preview_video_url}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : animation.preview_image_url ? (
            <img
              src={bunnyImageUrl(animation.preview_image_url, { width: 480 })}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-mono-sm text-foreground-muted">
            {translate('common.header.latestComponentLabel')}
          </p>
          <p className="text-body-sm text-foreground">{animation.title}</p>
        </div>
      </Link>
    </div>
  );
}

function MegaMenuGroup({ item, latestAnimation, onClose, setGroupRef }) {
  return (
    <div
      key={item.key}
      ref={(el) => setGroupRef(item.key, el)}
      className="v2-mm-group"
    >
      <div className="grid grid-cols-12 gap-16 py-32">
        <MegaMenuIntro
          intro={item.mega.intro}
          onClose={onClose}
        />

        <MegaMenuColumns columns={item.mega.columns} />

        {item.mega.featured ? (
          <FeaturedMegaMenu featured={item.mega.featured} onClose={onClose} />
        ) : latestAnimation ? (
          <LatestAnimationMegaMenu animation={latestAnimation} onClose={onClose} />
        ) : null}
      </div>
    </div>
  );
}

function DesktopNavigation({
  pathname,
  navRef,
  navItems,
  activeMegaMenu,
  triggerRefs,
  indicatorRef,
  onMouseEnter,
  onMouseLeave,
  clearTimeouts,
  setActiveMegaMenu,
}) {
  return (
    <nav
      ref={navRef}
      onMouseEnter={clearTimeouts}
      onMouseLeave={onMouseLeave}
      className="relative hidden h-full items-center justify-center gap-x-32 lg:col-span-4 lg:col-start-5 lg:flex"
    >
      {navItems.map((item) =>
        item.mega ? (
          <DesktopMegaMenuItem
            key={item.key}
            item={item}
            href={item.triggerHref}
            badge={item.badge}
            active={
              activeMegaMenu === item.key ||
              (item.triggerHref && isRouteActive(pathname, item.triggerHref))
            }
            expanded={activeMegaMenu === item.key}
            setRef={(target) => {
              triggerRefs.current[item.key] = target;
            }}
            onMouseEnter={() => onMouseEnter(item)}
            onClick={() => {
              clearTimeouts();
              setActiveMegaMenu(null);
            }}
          />
        ) : (
          <NavLink
            key={item.key}
            href={item.href}
            inline
            active={isRouteActive(pathname, item.href)}
            onMouseEnter={() => onMouseEnter(item)}
            className={cn(
              'text-mono h-full items-center',
              isRouteActive(pathname, item.href)
                ? 'text-foreground'
                : 'text-foreground-muted hover:text-foreground',
            )}
          >
            {item.label}
          </NavLink>
        ),
      )}
      <span ref={indicatorRef} className="v2-mm-indicator" aria-hidden="true" />
    </nav>
  );
}

function MobileNavigation({
  navItems,
  mobileExpandedItem,
  setMobileExpandedItem,
}) {
  return (
    <>
      {navItems.map((item) =>
        item.mega ? (
          <MobileAccordionItem
            key={item.key}
            item={item}
            expanded={mobileExpandedItem === item.key}
            onToggle={() =>
              setMobileExpandedItem((prev) =>
                prev === item.key ? null : item.key,
              )
            }
          />
        ) : (
          <Link
            key={item.key}
            href={item.href}
            className="text-mono border-b border-border-muted py-12 text-foreground"
          >
            {item.label}
          </Link>
        ),
      )}
    </>
  );
}

function HeaderActions({ loading, hasAccess }) {
  return (
    <div className="hidden items-center justify-end gap-20 lg:col-span-3 lg:col-start-10 lg:flex">
      {!loading && (
        <Link
          href={hasAccess ? '/animations' : '/login'}
          className="text-mono text-foreground-muted transition-colors duration-200 hover:text-foreground"
        >
          {hasAccess
            ? translate('common.header.actions.account')
            : translate('common.header.actions.login')}
        </Link>
      )}
      <Button href="/checkout?plan=solo&cycle=quarterly" size="sm" theme="light">
        {translate('common.header.actions.getAnnnimate')}
      </Button>
    </div>
  );
}

function MobileMenuButton({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  return (
    <button
      type="button"
      aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isMobileMenuOpen}
      onClick={() => setIsMobileMenuOpen((prev) => !prev)}
      className="relative size-32 lg:hidden"
    >
      <span
        className={cn(
          'absolute left-1/2 h-[1.5px] w-20 -translate-x-1/2 bg-foreground transition-transform duration-300',
          isMobileMenuOpen
            ? 'top-1/2 -translate-y-1/2 rotate-45'
            : 'top-[calc(50%-4px)]',
        )}
      />
      <span
        className={cn(
          'absolute left-1/2 h-[1.5px] w-20 -translate-x-1/2 bg-foreground transition-transform duration-300',
          isMobileMenuOpen
            ? 'top-1/2 -translate-y-1/2 -rotate-45'
            : 'top-[calc(50%+4px)]',
        )}
      />
    </button>
  );
}

function MobileMenu({
  isMobileMenuOpen,
  navItems,
  mobileExpandedItem,
  setMobileExpandedItem,
  loading,
  hasAccess,
}) {
  return (
    <div
      className="v2-mm-collapse v2-container absolute inset-x-0 top-full lg:hidden"
      data-open={isMobileMenuOpen}
      inert={!isMobileMenuOpen}
    >
      <div>
        <div className="max-h-[calc(100vh-var(--v2-header-h)-var(--v2-header-gap))] overflow-y-auto border-b border-border bg-surface">
          <div className="flex flex-col px-32 py-16">
            <MobileNavigation
              navItems={navItems}
              mobileExpandedItem={mobileExpandedItem}
              setMobileExpandedItem={setMobileExpandedItem}
            />

            <div className="flex items-center gap-20 pt-16">
              {!loading && (
                <Link
                  href={hasAccess ? '/animations' : '/login'}
                  className="text-mono text-foreground-muted"
                >
                  {hasAccess
                    ? translate('common.header.actions.account')
                    : translate('common.header.actions.login')}
                </Link>
              )}
              <Button href="/checkout?plan=solo&cycle=quarterly" size="sm" theme="light">
                {translate('common.header.actions.getAnnnimate')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function useMegaMenuAnimation({
  activeMegaMenu,
  megaItems,
  updateIndicator,
  dropdownRef,
  dropdownInnerRef,
  scrimRef,
  groupRefs,
  indicatorRef,
  setIsAnimating,
}) {
  const prevActiveMegaMenu = useRef(null);

  useEffect(() => {
    const prevKey = prevActiveMegaMenu.current;

    if (prevKey === activeMegaMenu) return;

    prevActiveMegaMenu.current = activeMegaMenu;

    const dropdownInner = dropdownInnerRef.current;
    const dropdown = dropdownRef.current;
    const scrim = scrimRef.current;

    if (!dropdownInner || !dropdown) return;

    const activeElements = [];

    megaItems.forEach((item) => {
      const group = groupRefs.current[item.key];

      if (group) {
        gsap.killTweensOf(group);
        activeElements.push(...group.querySelectorAll('[data-mm-reveal]'));
      }
    });

    gsap.killTweensOf([
      dropdownInner,
      scrim,
      indicatorRef.current,
      ...activeElements,
    ]);

    if (activeMegaMenu === null) {
      let heightReached = false;

      gsap.to(dropdownInner, {
        height: 0,
        duration: 0.3,
        ease: 'power3.out',
        onUpdate: function () {
          if (!heightReached && this.ratio >= 0.9) {
            heightReached = true;
            setIsAnimating(false);
          }
        },
        onComplete: () => {
          gsap.set(dropdown, {
            visibility: 'hidden',
            pointerEvents: 'none',
          });

          megaItems.forEach((item) => {
            const group = groupRefs.current[item.key];

            if (group) {
              gsap.set(group, {
                visibility: 'hidden',
                opacity: 0,
                pointerEvents: 'none',
              });
            }
          });

          if (!heightReached) setIsAnimating(false);
        },
      });

      gsap.to(scrim, {
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power3.out',
      });
      gsap.to(indicatorRef.current, {
        autoAlpha: 0,
        duration: 0.2,
      });

      return;
    }

    const currentGroup = groupRefs.current[activeMegaMenu];

    if (!currentGroup) return;

    const isOpeningFromClosed = prevKey === null;

    setIsAnimating(true);

    megaItems.forEach((item) => {
      const group = groupRefs.current[item.key];

      if (!group) return;

      const isActive = item.key === activeMegaMenu;

      gsap.set(group, {
        visibility: isActive ? 'visible' : 'hidden',
        opacity: +!!isActive,
        pointerEvents: isActive ? 'auto' : 'none',
      });
    });

    gsap.set(dropdown, {
      visibility: 'visible',
      pointerEvents: 'auto',
    });

    gsap.to(dropdownInner, {
      height: currentGroup.offsetHeight,
      duration: isOpeningFromClosed ? 0.5 : 0.4,
      ease: isOpeningFromClosed ? 'expo.out' : 'expo.inOut',
    });

    gsap.to(scrim, {
      autoAlpha: 1,
      duration: 0.3,
      ease: 'power2.out',
    });

    if (isOpeningFromClosed) {
      gsap.set(indicatorRef.current, { autoAlpha: 0 });

      setTimeout(() => {
        if (prevActiveMegaMenu.current === activeMegaMenu) {
          updateIndicator(activeMegaMenu, { instant: true });
        }
      }, 320);
    } else {
      updateIndicator(activeMegaMenu);
    }

    const revealElements = currentGroup.querySelectorAll('[data-mm-reveal]');

    if (isOpeningFromClosed) {
      gsap.fromTo(
        revealElements,
        { y: 24, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.5,
          ease: 'expo.out',
          stagger: 0.05,
        },
      );

      return;
    }

    const dir =
      megaItems.findIndex((item) => item.key === activeMegaMenu) >=
      megaItems.findIndex((item) => item.key === prevKey)
        ? 1
        : -1;

    gsap.fromTo(
      revealElements,
      { x: 48 * dir, autoAlpha: 0 },
      {
        x: 0,
        autoAlpha: 1,
        duration: 0.45,
        ease: 'expo.out',
        stagger: 0.04,
      },
    );
  }, [activeMegaMenu, megaItems, updateIndicator]);

  return prevActiveMegaMenu;
}

export default function Header({ latestAnimation }) {
  const pathname = usePathname();
  const isStarterPack = pathname === '/starter-pack';
  const { hasAccess, isAuthenticated, loading } = useHeaderAuth();

  const headerRef = useRef(null);
  const mmBarRef = useRef(null);
  const mmBarInnerRef = useRef(null);
  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const dropdownRef = useRef(null);
  const dropdownInnerRef = useRef(null);
  const scrimRef = useRef(null);
  const triggerRefs = useRef({});
  const groupRefs = useRef({});
  const timeout1 = useRef(null);
  const timeout2 = useRef(null);
  const lastScrollY = useRef(0);

  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpandedItem, setMobileExpandedItem] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shiftY, setShiftY] = useState(0);

  const { scrollState, headerTheme } = useHeaderTheme(mmBarRef);

  const padState =
    isAnimating || isMobileMenuOpen
      ? 'open'
      : scrollState === 'scrolled'
        ? 'scrolled'
        : 'top';

  const isSurfaceBg = scrollState === 'scrolled' || isMobileMenuOpen || isAnimating;
  const categories = useCategories();

  const navItems = useMemo(() => {
    const catLinks = categories.map((cat) => ({
      label: cat.name,
      href: `/animations?category=${cat.slug}`,
    }));

    return navItemsData.map((item) => {
      if (!item.mega?.columns) return item;

      const columns = item.mega.columns.map((column) => {
        if (column.dynamic === 'categories') {
          return { ...column, links: catLinks };
        }

        return column;
      });

      const mega = { ...item.mega, columns };

      if (isAuthenticated) return { ...item, mega };

      const filteredColumns = columns.map((column) => ({
        ...column,
        links: column.links.filter((link) => link.href !== '/animations/saved'),
      }));

      return {
        ...item,
        mega: {
          ...mega,
          columns: filteredColumns,
        },
      };
    });
  }, [categories, isAuthenticated]);

  const megaItems = useMemo(
    () => navItems.filter((item) => item.mega),
    [navItems],
  );

  const updateIndicator = useCallback((key, { instant = false } = {}) => {
    const trigger = triggerRefs.current[key];
    const indicator = indicatorRef.current;

    if (!trigger || !indicator) return;

    if (instant) {
      gsap.set(indicator, {
        x: trigger.offsetLeft,
        scaleX: trigger.offsetWidth,
        autoAlpha: 0,
      });
      gsap.to(indicator, {
        autoAlpha: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
      return;
    }

    gsap.to(indicator, {
      x: trigger.offsetLeft,
      scaleX: trigger.offsetWidth,
      autoAlpha: 1,
      duration: 0.4,
      ease: 'expo.out',
    });
  }, []);

  useMegaMenuAnimation({
    activeMegaMenu,
    megaItems,
    updateIndicator,
    dropdownRef,
    dropdownInnerRef,
    scrimRef,
    groupRefs,
    indicatorRef,
    setIsAnimating,
  });

  useEffect(() => {
    if (!activeMegaMenu) {
      setShiftY(0);
      return;
    }

    const frame = requestAnimationFrame(() => {
      const group = groupRefs.current[activeMegaMenu];
      setShiftY(group ? group.offsetHeight : 0);
    });

    return () => cancelAnimationFrame(frame);
  }, [activeMegaMenu]);

  const clearTimeouts = () => {
    clearTimeout(timeout1.current);
    clearTimeout(timeout2.current);
  };

  const handleMouseLeave = () => {
    clearTimeouts();
    timeout2.current = setTimeout(() => setActiveMegaMenu(null), 200);
  };

  const handleMouseEnter = (item) => {
    clearTimeouts();

    if (!item.mega) {
      if (activeMegaMenu) handleMouseLeave();
      return;
    }

    if (activeMegaMenu) {
      setActiveMegaMenu(item.key);
      return;
    }

    timeout1.current = setTimeout(() => setActiveMegaMenu(item.key), 150);
  };

  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === 'Escape') setActiveMegaMenu(null);
    };

    window.addEventListener('keydown', handleKeydown);

    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  useEffect(() => {
    setActiveMegaMenu(null);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const header = headerRef.current;

      if (!header) return;

      const scrollY = window.scrollY;

      if (activeMegaMenu) setActiveMegaMenu(null);

      let isHidden = false;

      if (!isMobileMenuOpen && scrollY > 120) {
        isHidden = scrollY > lastScrollY.current;
        header.classList.toggle('is-hidden', isHidden);
      } else {
        header.classList.remove('is-hidden');
      }

      document.documentElement.classList.toggle('v2-header-hidden', isHidden);
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeMegaMenu, isMobileMenuOpen]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('v2-header-hidden');
    };
  }, []);

  useEffect(() => {
    return () => clearTimeouts();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(
      'v2-scroll-locked',
      isMobileMenuOpen,
    );
  }, [isMobileMenuOpen]);

  return (
    <Fragment>
      <header
        ref={headerRef}
        data-v2
        data-theme={headerTheme}
        data-pad-state={isStarterPack ? 'top' : padState}
        style={{ top: 'var(--anm-ppp-offset, 0px)' }}
        className={cn(
          'v2-header inset-x-0 top-0 z-[300] pt-[var(--v2-header-gap)]',
          isStarterPack ? 'absolute' : 'fixed',
        )}
      >
        <div ref={mmBarRef} className="v2-mm-bar">
          <div
            ref={mmBarInnerRef}
            className={cn(
              'v2-bar-padx v2-container flex h-full items-center justify-between transition-colors duration-300 ease-power3-out lg:grid lg:grid-cols-12 lg:gap-16',
              isSurfaceBg ? 'bg-surface' : 'bg-transparent',
            )}
          >
            <Logo className="lg:col-span-3" />

            {!isStarterPack && (
              <DesktopNavigation
                pathname={pathname}
                navRef={navRef}
                navItems={navItems}
                activeMegaMenu={activeMegaMenu}
                triggerRefs={triggerRefs}
                indicatorRef={indicatorRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                clearTimeouts={clearTimeouts}
                setActiveMegaMenu={setActiveMegaMenu}
              />
            )}

            {!isStarterPack && (
              <HeaderActions loading={loading} hasAccess={hasAccess} />
            )}

            {!isStarterPack && (
              <MobileMenuButton
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
              />
            )}
          </div>
        </div>

        <div
          ref={dropdownRef}
          className="v2-mm-dropdown"
          onMouseEnter={() => clearTimeouts()}
          onMouseLeave={handleMouseLeave}
        >
          <div ref={dropdownInnerRef} className="v2-mm-dropdown-inner">
            {megaItems.map((item) => (
              <MegaMenuGroup
                key={item.key}
                item={item}
                latestAnimation={latestAnimation}
                onClose={() => setActiveMegaMenu(null)}
                setGroupRef={(key, element) => {
                  groupRefs.current[key] = element;
                }}
              />
            ))}
          </div>
        </div>

        {!isStarterPack && (
          <HeaderMarquee
            scrolled={scrollState === 'scrolled'}
            shiftY={shiftY}
          />
        )}

        <MobileMenu
          isMobileMenuOpen={isMobileMenuOpen}
          navItems={navItems}
          mobileExpandedItem={mobileExpandedItem}
          setMobileExpandedItem={setMobileExpandedItem}
          loading={loading}
          hasAccess={hasAccess}
        />
      </header>

      <div
        ref={scrimRef}
        className="v2-mm-scrim"
        onClick={() => setActiveMegaMenu(null)}
        aria-hidden="true"
      />
    </Fragment>
  );
}
