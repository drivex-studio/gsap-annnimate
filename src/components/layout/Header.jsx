'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'; // NOTE: module id: 271645
import { usePathname } from 'next/navigation'; // NOTE: module id: 618566
import { gsap } from 'gsap'; // NOTE: module id: 989970
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746
import { bunnyImageUrl } from '@/libs/utils/bunnyImageUrl'; // NOTE: module id: 632021
import { createClient } from '@/libs/supabase/client'; // NOTE: module id: 416983
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682
import Logo from '@/assets/logos/SiteLogo'; // NOTE: module id: 635566
import NavLink from '@/components/navigation/NavLink'; // NOTE: module id: 520237
import TransitionLink from '@/components/navigation/Link'; // NOTE: module id: 101836
import AnimatedButton from '@/animations/components/AnimatedButton'; // NOTE: module id: 687989
import { useCategories } from '@/providers/CategoryProvider'; // NOTE: module id: 87207
import NavTrigger from '@/components/layout/Header/NavTrigger';
import MobileNavAccordion from '@/components/layout/Header/MobileAccordionItem';
import HeaderMarquee from '@/components/layout/Header/HeaderMarquee';

const NAV_CONFIG = [
  {
    key: 'library',
    label: t('common.header.nav.library.label'),
    triggerHref: '/animations',
    mega: {
      intro: {
        heading: t('common.header.nav.library.intro.heading'),
        text: t('common.header.nav.library.intro.text'),
        cta: {
          label: t('common.header.nav.library.intro.ctaLabel'),
          href: '/animations',
        },
      },
      columns: [
        {
          label: t('common.header.nav.library.columns.byCategory'),
          dynamic: 'categories',
          links: [],
        },
        {
          label: t('common.header.nav.library.columns.collections'),
          links: [
            {
              label: t('common.header.nav.library.links.allComponents'),
              href: '/animations',
            },
            {
              label: t('common.header.nav.library.links.mostPopular'),
              href: '/animations?sort=hot',
            },
            {
              label: t('common.header.nav.library.links.saved'),
              href: '/animations/saved',
            },
            {
              label: t('common.header.nav.library.links.showcase'),
              href: '/showcase',
            },
          ],
        },
      ],
    },
  },
  {
    key: 'kits',
    label: t('common.header.nav.kits.label'),
    triggerHref: '/kits',
    badge: t('common.header.nav.kits.badge'),
    mega: {
      intro: {
        heading: t('common.header.nav.kits.intro.heading'),
        text: t('common.header.nav.kits.intro.text'),
        cta: {
          label: t('common.header.nav.kits.intro.ctaLabel'),
          href: '/kits/menu',
        },
      },
      columns: [
        {
          label: t('common.header.nav.kits.columns.theKits'),
          links: [
            {
              label: t('common.header.nav.kits.links.revealKit'),
              href: '/kits/reveal',
            },
            {
              label: t('common.header.nav.kits.links.menuKit'),
              href: '/kits/menu',
              badge: 'New',
            },
          ],
        },
        {
          label: t('common.header.nav.kits.columns.learn'),
          links: [
            {
              label: t('common.header.nav.kits.links.whatAKitIs'),
              href: '/kits',
            },
          ],
        },
        {
          label: t('common.header.nav.kits.columns.stayClose'),
          links: [
            {
              label: t('common.header.nav.kits.links.roadmap'),
              href: '/roadmap',
            },
            {
              label: t('common.header.nav.kits.links.pricing'),
              href: '/pricing',
            },
          ],
        },
      ],
      featured: {
        title: t('common.header.nav.kits.featured.title'),
        href: '/kits/menu',
        image: {
          jpg: 'https://annnimate.b-cdn.net/video-thumbnails/kits/menu/preview-index/preview-index.gif',
          alt: t('common.header.nav.kits.featured.imageAlt'),
        },
      },
    },
  },
  {
    key: 'learn',
    label: t('common.header.nav.learn.label'),
    triggerHref: '/learn',
    mega: {
      intro: {
        heading: t('common.header.nav.learn.intro.heading'),
        text: t('common.header.nav.learn.intro.text'),
        cta: {
          label: t('common.header.nav.learn.intro.ctaLabel'),
          href: '/learn',
        },
      },
      columns: [
        {
          label: t('common.header.nav.learn.columns.concepts'),
          links: [
            {
              label: t('common.header.nav.learn.links.easing'),
              href: '/learn/easing',
            },
            {
              label: t('common.header.nav.learn.links.scroll'),
              href: '/learn/scroll',
            },
            {
              label: t('common.header.nav.learn.links.timeline'),
              href: '/learn/timeline',
            },
            {
              label: t('common.header.nav.learn.links.text'),
              href: '/learn/text',
            },
            {
              label: t('common.header.nav.learn.links.react'),
              href: '/learn/react',
            },
            {
              label: t('common.header.nav.learn.links.performance'),
              href: '/learn/performance',
            },
            {
              label: t('common.header.nav.learn.links.plugins'),
              href: '/learn/plugins',
            },
          ],
        },
        {
          label: t('common.header.nav.learn.columns.explore'),
          links: [
            {
              label: t('common.header.nav.learn.links.patterns'),
              href: '/patterns',
            },
            {
              label: t('common.header.nav.learn.links.freeTools'),
              href: '/tools',
            },
            {
              label: t('common.header.nav.learn.links.comparisons'),
              href: '/compare',
            },
          ],
        },
      ],
    },
  },
  {
    key: 'docs',
    label: t('common.header.nav.docs.label'),
    href: '/docs',
  },
  {
    key: 'pricing',
    label: t('common.header.nav.pricing.label'),
    href: '/pricing',
  },
];

const VALID_THEMES = ['light', 'dark', 'brand'];

function isRouteActive(pathname, targetHref) {
  if (!pathname || !targetHref) return false;
  const basePath = targetHref.split(/[?#]/)[0];
  if (!basePath.startsWith('/')) return false;
  return basePath === '/'
    ? pathname === '/'
    : pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchUser() {
      try {
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();

        if (error || !authUser) {
          setUser(null);
          return;
        }

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setUser({
          id: authUser.id,
          email: authUser.email,
          name:
            profile?.name ||
            profile?.display_name ||
            authUser.email?.split('@')[0] ||
            'User',
          avatarUrl: profile?.avatar_url,
          avatarIndex: profile?.avatar_index || 0,
          subscriptionStatus: profile?.subscription_status || 'free',
          hasAccess: profile?.has_access || false,
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
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser();
      } else if (event === 'SIGNED_OUT') {
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

function useHeaderState(barRef) {
  const pathname = usePathname();
  const [scrollState, setScrollState] = useState('top');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerTheme, setHeaderTheme] = useState('dark');
  const isScrollLockedRef = useRef(false);

  const detectThemeAtOffset = useCallback((offsetY) => {
    const themedSections = document.querySelectorAll('main [data-theme]');
    if (themedSections.length === 0) return;

    const matchingSection = Array.from(themedSections).find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= offsetY && rect.bottom > offsetY;
    });

    const theme = (matchingSection ?? themedSections[0])?.dataset.theme;
    if (theme && VALID_THEMES.includes(theme)) {
      setHeaderTheme(theme);
    }
  }, []);

  const isTransitioningRef = useRef(false);

  useEffect(() => {
    let timeoutId = 0;
    const handleTransition = (event) => {
      isTransitioningRef.current = true;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        isTransitioningRef.current = false;
      }, 4000);
      setScrollState('top');

      const nextTheme = event.detail?.theme;
      if (nextTheme && VALID_THEMES.includes(nextTheme)) {
        setHeaderTheme(nextTheme);
      }
    };

    window.addEventListener('anm:transition', handleTransition);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('anm:transition', handleTransition);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!isTransitioningRef.current) {
        setScrollState(window.scrollY > 50 ? 'scrolled' : 'top');
        if (barRef.current) {
          detectThemeAtOffset(barRef.current.offsetTop);
        }
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [detectThemeAtOffset, barRef]);

  useEffect(() => {
    let isDisposed = false;
    isTransitioningRef.current = false;

    const syncHeader = () => {
      if (!isDisposed && barRef.current) {
        setScrollState(window.scrollY > 50 ? 'scrolled' : 'top');
        detectThemeAtOffset(barRef.current.offsetTop);
      }
    };

    const headerEl = barRef.current?.closest('.v2-header');
    headerEl?.classList.add('no-transition');
    syncHeader();

    const frameId = requestAnimationFrame(() => {
      syncHeader();
      requestAnimationFrame(() => headerEl?.classList.remove('no-transition'));
    });

    const mutationObserver = new MutationObserver(syncHeader);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const disconnectTimer = setTimeout(() => mutationObserver.disconnect(), 800);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      mutationObserver.disconnect();
      clearTimeout(disconnectTimer);
      headerEl?.classList.remove('no-transition');
    };
  }, [pathname, detectThemeAtOffset, barRef]);

  const headerState = useMemo(
    () => (isMenuOpen ? 'menuOpen' : scrollState),
    [isMenuOpen, scrollState]
  );

  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, closeMenu]);

  useEffect(() => {
    if (isMenuOpen) {
      document.documentElement.classList.add('v2-scroll-locked');
      window.lenis?.stop?.();
      isScrollLockedRef.current = true;
    } else if (isScrollLockedRef.current) {
      document.documentElement.classList.remove('v2-scroll-locked');
      window.lenis?.start?.();
      isScrollLockedRef.current = false;
    }
  }, [isMenuOpen]);

  return {
    scrollState,
    isMenuOpen,
    headerState,
    headerTheme,
    toggleMenu,
    closeMenu,
  };
}

// NOTE: module id: 76624
export default function Header({ latestAnimation }) {
  const pathname = usePathname();
  const isStarterPackPage =
    pathname === '/starter-pack' || pathname === '/v3/starter-pack';
  const isV3HomePage = pathname === '/v3';

  const { hasAccess, isAuthenticated, loading } = useAuth();

  const headerRef = useRef(null);
  const barRef = useRef(null);
  const barInnerRef = useRef(null);
  const navRef = useRef(null);
  const dropdownRef = useRef(null);
  const dropdownInnerRef = useRef(null);
  const scrimRef = useRef(null);
  const megaGroupsRef = useRef({});
  const intentTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const lastScrollYRef = useRef(0);

  const [activeMegaKey, setActiveMegaKey] = useState(null);
  const activeMegaKeyRef = useRef(null);
  activeMegaKeyRef.current = activeMegaKey;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileKey, setExpandedMobileKey] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownHeight, setDropdownHeight] = useState(0);

  const { headerTheme, scrollState } = useHeaderState(barRef);

  const padState =
    isDropdownOpen || isMobileMenuOpen
      ? 'open'
      : scrollState === 'scrolled'
        ? 'scrolled'
        : 'top';

  const hasSolidBackground =
    scrollState === 'scrolled' || isMobileMenuOpen || isDropdownOpen;

  const categories = useCategories();

  const navItems = useMemo(() => {
    const categoryLinks = categories.map((category) => ({
      label: category.name,
      href: `/animations?category=${category.slug}`,
    }));

    return NAV_CONFIG.map((item) =>
      item.mega?.columns
        ? {
            ...item,
            mega: {
              ...item.mega,
              columns: item.mega.columns.map((column) => {
                const hydratedColumn =
                  column.dynamic === 'categories'
                    ? { ...column, links: categoryLinks }
                    : column;

                return isAuthenticated
                  ? hydratedColumn
                  : {
                      ...hydratedColumn,
                      links: hydratedColumn.links.filter(
                        (link) => link.href !== '/animations/saved'
                      ),
                    };
              }),
            },
          }
        : item
    );
  }, [categories, isAuthenticated]);

  const megaNavItems = useMemo(
    () => navItems.filter((item) => item.mega),
    [navItems]
  );

  const prevMegaKeyRef = useRef(null);

  useLayoutEffect(() => {
    const prevKey = prevMegaKeyRef.current;
    if (prevKey === activeMegaKey) return;
    prevMegaKeyRef.current = activeMegaKey;

    const dropdownInnerEl = dropdownInnerRef.current;
    const dropdownEl = dropdownRef.current;
    const scrimEl = scrimRef.current;
    if (!dropdownInnerEl || !dropdownEl) return;

    const revealElements = [];
    megaNavItems.forEach((item) => {
      const groupEl = megaGroupsRef.current[item.key];
      if (groupEl) {
        gsap.killTweensOf(groupEl);
        revealElements.push(...groupEl.querySelectorAll('[data-mm-reveal]'));
      }
    });
    gsap.killTweensOf([dropdownInnerEl, scrimEl, ...revealElements]);

    if (activeMegaKey === null) {
      let hasClosedStateTriggered = false;
      const prevGroupEl = prevKey ? megaGroupsRef.current[prevKey] : null;
      if (prevGroupEl) {
        gsap.to(prevGroupEl, {
          autoAlpha: 0,
          duration: 0.15,
          ease: 'power2.out',
        });
      }
      gsap.to(dropdownInnerEl, {
        height: 0,
        duration: 0.3,
        ease: 'expo.out',
        onUpdate: function () {
          if (!hasClosedStateTriggered && this.ratio >= 0.9) {
            hasClosedStateTriggered = true;
            setIsDropdownOpen(false);
          }
        },
        onComplete: () => {
          gsap.set(dropdownEl, {
            visibility: 'hidden',
            pointerEvents: 'none',
          });
          megaNavItems.forEach((item) => {
            const groupEl = megaGroupsRef.current[item.key];
            if (groupEl) {
              gsap.set(groupEl, {
                visibility: 'hidden',
                opacity: 0,
                x: 0,
                pointerEvents: 'none',
              });
            }
          });
          if (!hasClosedStateTriggered) {
            setIsDropdownOpen(false);
          }
        },
      });
      gsap.to(scrimEl, {
        autoAlpha: 0,
        duration: 0.3,
        ease: 'expo.out',
      });
      return;
    }

    const activeGroupEl = megaGroupsRef.current[activeMegaKey];
    if (!activeGroupEl) return;

    const isOpeningFromClosed = prevKey === null;
    const prevGroupEl = isOpeningFromClosed
      ? null
      : megaGroupsRef.current[prevKey];
    const direction =
      megaNavItems.findIndex((item) => item.key === activeMegaKey) >=
      megaNavItems.findIndex((item) => item.key === prevKey)
        ? 1
        : -1;

    setIsDropdownOpen(true);

    megaNavItems.forEach((item) => {
      const groupEl = megaGroupsRef.current[item.key];
      if (!groupEl || groupEl === prevGroupEl) return;
      const isCurrent = item.key === activeMegaKey;
      gsap.set(groupEl, {
        visibility: isCurrent ? 'visible' : 'hidden',
        opacity: isCurrent ? 1 : 0,
        x: 0,
        pointerEvents: isCurrent ? 'auto' : 'none',
      });
    });

    gsap.set(dropdownEl, {
      visibility: 'visible',
      pointerEvents: 'auto',
    });
    gsap.to(dropdownInnerEl, {
      height: activeGroupEl.offsetHeight,
      duration: isOpeningFromClosed ? 0.45 : 0.4,
      ease: 'expo.out',
    });
    gsap.to(scrimEl, {
      autoAlpha: 1,
      duration: 0.4,
      ease: 'expo.out',
    });

    const activeRevealTargets =
      activeGroupEl.querySelectorAll('[data-mm-reveal]');

    if (isOpeningFromClosed) {
      gsap.fromTo(
        activeRevealTargets,
        { y: 16, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.45,
          ease: 'expo.out',
          stagger: 0.04,
          delay: 0.04,
        }
      );
    } else {
      if (prevGroupEl) {
        gsap.set(prevGroupEl, { pointerEvents: 'none' });
        gsap.to(prevGroupEl, {
          autoAlpha: 0,
          x: -(16 * direction),
          duration: 0.2,
          ease: 'power2.out',
        });
      }
      gsap.fromTo(
        activeRevealTargets,
        { x: 24 * direction, autoAlpha: 0 },
        {
          x: 0,
          autoAlpha: 1,
          duration: 0.4,
          ease: 'expo.out',
          stagger: 0.03,
          delay: 0.06,
        }
      );
    }
  }, [activeMegaKey, megaNavItems]);

  useEffect(() => {
    if (!activeMegaKey) {
      setDropdownHeight(0);
      return;
    }
    const frameId = requestAnimationFrame(() => {
      const activeGroupEl = megaGroupsRef.current[activeMegaKey];
      setDropdownHeight(activeGroupEl ? activeGroupEl.offsetHeight : 0);
    });
    return () => cancelAnimationFrame(frameId);
  }, [activeMegaKey]);

  const clearMenuTimers = () => {
    clearTimeout(intentTimerRef.current);
    clearTimeout(closeTimerRef.current);
  };

  const scheduleCloseMenu = () => {
    clearMenuTimers();
    closeTimerRef.current = setTimeout(() => setActiveMegaKey(null), 100);
  };

  const pointerStateRef = useRef({ x: 0, y: 0, t: 0, v: 0 });

  useEffect(() => {
    const handlePointerMove = (event) => {
      const state = pointerStateRef.current;
      const now = performance.now();
      const dt = now - state.t;
      const velocity =
        dt > 0 && dt < 100
          ? Math.hypot(event.clientX - state.x, event.clientY - state.y) / dt
          : 0;
      state.v = 0.5 * state.v + 0.5 * velocity;
      state.x = event.clientX;
      state.y = event.clientY;
      state.t = now;
    };

    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  const runWithHoverIntent = (callback, startTime = performance.now()) => {
    const state = pointerStateRef.current;
    const now = performance.now();
    if (now - state.t >= 45 || state.v < 0.35 || now - startTime >= 150) {
      callback();
    } else {
      intentTimerRef.current = setTimeout(
        () => runWithHoverIntent(callback, startTime),
        45
      );
    }
  };

  const handleNavMouseEnter = (item) => {
    clearMenuTimers();
    if (item.mega) {
      if (activeMegaKey !== item.key) {
        runWithHoverIntent(() => setActiveMegaKey(item.key));
      }
    } else if (activeMegaKey) {
      runWithHoverIntent(() => setActiveMegaKey(null));
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) =>
      event.key === 'Escape' && setActiveMegaKey(null);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setActiveMegaKey(null);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleTransition = () => {
      clearTimeout(intentTimerRef.current);
      clearTimeout(closeTimerRef.current);
      setActiveMegaKey(null);
      setIsMobileMenuOpen(false);
      headerRef.current?.classList.remove('is-hidden');
      document.documentElement.classList.remove('v2-header-hidden');
      lastScrollYRef.current = 0;
    };

    window.addEventListener('anm:transition', handleTransition);
    return () => window.removeEventListener('anm:transition', handleTransition);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const headerEl = headerRef.current;
      if (!headerEl) return;

      const currentScrollY = window.scrollY;
      if (activeMegaKey) {
        setActiveMegaKey(null);
      }

      let shouldHide = false;
      if (!isMobileMenuOpen && currentScrollY > 120) {
        shouldHide = currentScrollY > lastScrollYRef.current;
        headerEl.classList.toggle('is-hidden', shouldHide);
      } else {
        headerEl.classList.remove('is-hidden');
      }

      document.documentElement.classList.toggle('v2-header-hidden', shouldHide);
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeMegaKey, isMobileMenuOpen]);

  useEffect(
    () => () => {
      document.documentElement.classList.remove('v2-header-hidden');
    },
    []
  );

  useEffect(() => () => clearMenuTimers(), []);

  const alignMegaColumns = useCallback(() => {
    const navEl = navRef.current;
    if (!navEl) return;

    const navItemElements = Array.from(navEl.children).filter(
      (child) => child.tagName !== 'SPAN'
    );

    Object.values(megaGroupsRef.current).forEach((groupEl) => {
      const columns = groupEl
        ? Array.from(groupEl.querySelectorAll('[data-mm-col]'))
        : [];
      if (!columns.length) return;

      const anchorIndices = columns.length === 2 ? [0, 3] : [0, 2, 4];
      columns.forEach((colEl) => {
        colEl.style.marginLeft = '0px';
      });

      let currentLeft = columns[0].parentElement.getBoundingClientRect().left;

      columns.forEach((colEl, colIndex) => {
        const targetNavEl = navItemElements[anchorIndices[colIndex]];
        const targetLeft = targetNavEl
          ? ((el) => {
              const textNode = document
                .createTreeWalker(el, NodeFilter.SHOW_TEXT, {
                  acceptNode: (node) =>
                    node.textContent.trim()
                      ? NodeFilter.FILTER_ACCEPT
                      : NodeFilter.FILTER_SKIP,
                })
                .nextNode();
              if (!textNode) return el.getBoundingClientRect().left;
              const range = document.createRange();
              range.selectNodeContents(textNode);
              return range.getBoundingClientRect().left;
            })(targetNavEl)
          : currentLeft + 48;

        const marginLeft = Math.max(
          colIndex ? 24 : 0,
          targetLeft - currentLeft
        );
        colEl.style.marginLeft = `${marginLeft}px`;
        currentLeft += marginLeft + colEl.getBoundingClientRect().width;
      });
    });
  }, []);

  useEffect(() => {
    alignMegaColumns();
    document.fonts?.ready.then(alignMegaColumns);
    window.addEventListener('resize', alignMegaColumns);

    const resizeObserver = new ResizeObserver(() => {
      if (activeMegaKeyRef.current) {
        alignMegaColumns();
      }
    });

    document.querySelectorAll('[data-mm-col]').forEach((colEl) => {
      resizeObserver.observe(colEl.parentElement);
    });

    return () => {
      window.removeEventListener('resize', alignMegaColumns);
      resizeObserver.disconnect();
    };
  }, [alignMegaColumns]);

  useEffect(() => {
    if (!activeMegaKey) return;
    alignMegaColumns();
    let frameId = requestAnimationFrame(() => {
      frameId = requestAnimationFrame(alignMegaColumns);
    });
    return () => cancelAnimationFrame(frameId);
  }, [activeMegaKey, alignMegaColumns]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      'v2-scroll-locked',
      isMobileMenuOpen
    );
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        ref={headerRef}
        data-v2={true}
        data-theme={headerTheme}
        data-pad-state={isStarterPackPage ? 'top' : padState}
        style={{ top: 'var(--anm-ppp-offset, 0px)' }}
        className={cn(
          'v2-header inset-x-0 top-0 z-[300] pt-[var(--v2-header-gap)]',
          isStarterPackPage ? 'absolute' : 'fixed'
        )}
      >
        <div ref={barRef} className="v2-mm-bar">
          <div
            ref={barInnerRef}
            className={cn(
              'v2-bar-padx v2-container flex h-full items-center justify-between transition-colors duration-300 ease-power3-out lg:grid lg:grid-cols-12 lg:gap-16',
              hasSolidBackground
                ? !isV3HomePage || isMobileMenuOpen || isDropdownOpen
                  ? 'bg-surface'
                  : 'bg-background-muted'
                : 'bg-transparent'
            )}
          >
            <Logo className="lg:col-span-3" />

            {isStarterPackPage ? null : (
              <nav
                ref={navRef}
                onMouseEnter={() => clearMenuTimers()}
                onMouseLeave={scheduleCloseMenu}
                className="relative hidden h-full items-center justify-center lg:col-span-4 lg:col-start-5 lg:flex"
              >
                {navItems.map((item) =>
                  item.mega ? (
                    <NavTrigger
                      key={item.key}
                      item={item}
                      href={item.triggerHref}
                      badge={item.badge}
                      active={
                        activeMegaKey === item.key ||
                        (item.triggerHref &&
                          isRouteActive(pathname, item.triggerHref))
                      }
                      expanded={activeMegaKey === item.key}
                      onMouseEnter={() => handleNavMouseEnter(item)}
                      onClick={() => {
                        clearMenuTimers();
                        setActiveMegaKey(null);
                      }}
                    />
                  ) : (
                    <NavLink
                      key={item.key}
                      href={item.href}
                      variant="nav"
                      onMouseEnter={() => handleNavMouseEnter(item)}
                      className={cn(
                        'text-mono h-full',
                        isRouteActive(pathname, item.href)
                          ? 'text-foreground'
                          : 'text-foreground-muted hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </NavLink>
                  )
                )}
              </nav>
            )}

            {isStarterPackPage ? null : (
              <div className="hidden items-center justify-end gap-20 lg:col-span-3 lg:col-start-10 lg:flex">
                {!loading && (
                  <NavLink
                    href={hasAccess ? '/animations' : '/login'}
                    variant="nav"
                    className="text-mono text-foreground-muted hover:text-foreground"
                  >
                    {hasAccess
                      ? t('common.header.actions.account')
                      : t('common.header.actions.login')}
                  </NavLink>
                )}
                <AnimatedButton
                  href="/checkout?plan=solo&cycle=quarterly"
                  size="sm"
                  theme="brand"
                >
                  {t('common.header.actions.getAccess')}
                </AnimatedButton>
              </div>
            )}

            {isStarterPackPage ? null : (
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
                      : 'top-[calc(50%-4px)]'
                  )}
                />
                <span
                  className={cn(
                    'absolute left-1/2 h-[1.5px] w-20 -translate-x-1/2 bg-foreground transition-transform duration-300',
                    isMobileMenuOpen
                      ? 'top-1/2 -translate-y-1/2 -rotate-45'
                      : 'top-[calc(50%+4px)]'
                  )}
                />
              </button>
            )}
          </div>
        </div>

        <div
          ref={dropdownRef}
          className="v2-mm-dropdown"
          onMouseEnter={() => clearMenuTimers()}
          onMouseLeave={scheduleCloseMenu}
        >
          <div ref={dropdownInnerRef} className="v2-mm-dropdown-inner">
            {megaNavItems.map((item) => (
              <div
                key={item.key}
                ref={(el) => {
                  megaGroupsRef.current[item.key] = el;
                }}
                className="v2-mm-group"
              >
                <div className="grid grid-cols-12 gap-16 py-32">
                  <div
                    data-mm-reveal={true}
                    className="col-span-3 col-start-1 flex flex-col gap-16"
                  >
                    <p className="text-h4 text-foreground">
                      {item.mega.intro.heading}
                    </p>
                    <p className="text-body-sm text-foreground-muted">
                      {item.mega.intro.text}
                    </p>
                    <NavLink
                      href={item.mega.intro.cta.href}
                      onClick={() => setActiveMegaKey(null)}
                      variant="nav"
                      className="text-mono-sm -mx-12 text-foreground"
                    >
                      {item.mega.intro.cta.label}
                    </NavLink>
                  </div>

                  <div className="col-span-5 col-start-4 flex">
                    {item.mega.columns.map((column) => (
                      <div
                        key={column.label}
                        data-mm-reveal={true}
                        data-mm-col={true}
                        className="flex shrink-0 flex-col"
                      >
                        <span className="text-mono-sm mb-8 text-foreground-muted">
                          {column.label}
                        </span>
                        {column.links.map((link) => (
                          <NavLink
                            key={link.label}
                            href={link.href}
                            variant="nav"
                            className="text-body-sm -mx-12 text-foreground"
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
                    ))}
                  </div>

                  {item.mega.featured ? (
                    <div
                      data-mm-reveal={true}
                      className="col-span-3 col-start-10"
                    >
                      <TransitionLink
                        href={item.mega.featured.href}
                        onClick={() => setActiveMegaKey(null)}
                        className="group flex flex-col gap-12"
                      >
                        <div className="aspect-[16/10] w-full overflow-hidden bg-background-muted">
                          <picture>
                            {item.mega.featured.image.avif ? (
                              <source
                                srcSet={item.mega.featured.image.avif}
                                type="image/avif"
                              />
                            ) : null}
                            <img
                              src={item.mega.featured.image.jpg}
                              alt={item.mega.featured.image.alt}
                              className="block object-cover transition-transform duration-300 ease-(--ease-expo-out) group-hover:scale-[1.04] motion-reduce:transition-none"
                              style={{ width: '100%', height: '100%' }}
                            />
                          </picture>
                        </div>
                        <div className="flex flex-col gap-4">
                          <p className="text-body-sm text-foreground underline decoration-transparent underline-offset-4 transition-colors duration-200 ease-(--ease-expo-out) group-hover:decoration-foreground/40">
                            {item.mega.featured.title}
                          </p>
                        </div>
                      </TransitionLink>
                    </div>
                  ) : latestAnimation ? (
                    <div
                      data-mm-reveal={true}
                      className="col-span-3 col-start-10"
                    >
                      <TransitionLink
                        href={`/animations/${latestAnimation.slug}`}
                        onClick={() => setActiveMegaKey(null)}
                        className="group flex flex-col gap-12"
                      >
                        <div className="aspect-[16/10] w-full overflow-hidden bg-background-muted">
                          {latestAnimation.preview_video_url ? (
                            <video
                              src={latestAnimation.preview_video_url}
                              autoPlay={true}
                              loop={true}
                              muted={true}
                              playsInline={true}
                              className="h-full w-full object-cover transition-transform duration-300 ease-(--ease-expo-out) group-hover:scale-[1.04] motion-reduce:transition-none"
                            />
                          ) : latestAnimation.preview_image_url ? (
                            <img
                              src={bunnyImageUrl(
                                latestAnimation.preview_image_url,
                                { width: 480 }
                              )}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-300 ease-(--ease-expo-out) group-hover:scale-[1.04] motion-reduce:transition-none"
                            />
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-4">
                          <p className="text-mono-sm text-foreground-muted">
                            {t('common.header.latestComponentLabel')}
                          </p>
                          <p className="text-body-sm text-foreground underline decoration-transparent underline-offset-4 transition-colors duration-200 ease-(--ease-expo-out) group-hover:decoration-foreground/40">
                            {latestAnimation.title}
                          </p>
                        </div>
                      </TransitionLink>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isStarterPackPage || isV3HomePage ? null : (
          <HeaderMarquee
            scrolled={scrollState === 'scrolled'}
            shiftY={dropdownHeight}
          />
        )}

        <div
          className="v2-mm-collapse v2-container absolute inset-x-0 top-full lg:hidden"
          data-open={isMobileMenuOpen}
          inert={!isMobileMenuOpen}
        >
          <div>
            <div className="max-h-[calc(100vh-var(--v2-header-h)-var(--v2-header-gap))] overflow-y-auto border-b border-border bg-surface">
              <div className="flex flex-col px-32 py-16">
                {navItems.map((item) =>
                  item.mega ? (
                    <MobileNavAccordion
                      key={item.key}
                      item={item}
                      expanded={expandedMobileKey === item.key}
                      onToggle={() =>
                        setExpandedMobileKey((prev) =>
                          prev === item.key ? null : item.key
                        )
                      }
                    />
                  ) : (
                    <TransitionLink
                      key={item.key}
                      href={item.href}
                      className="text-mono border-b border-border-muted py-12 text-foreground"
                    >
                      {item.label}
                    </TransitionLink>
                  )
                )}

                <div className="flex items-center gap-20 pt-16">
                  {!loading && (
                    <TransitionLink
                      href={hasAccess ? '/animations' : '/login'}
                      className="text-mono text-foreground-muted"
                    >
                      {hasAccess
                        ? t('common.header.actions.account')
                        : t('common.header.actions.login')}
                    </TransitionLink>
                  )}
                  <AnimatedButton
                    href="/checkout?plan=solo&cycle=quarterly"
                    size="sm"
                    theme="brand"
                  >
                    {t('common.header.actions.getAccess')}
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        ref={scrimRef}
        className="v2-mm-scrim"
        onClick={() => setActiveMegaKey(null)}
        aria-hidden="true"
      />
    </>
  );
}
