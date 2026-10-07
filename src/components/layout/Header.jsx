"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { cn } from '@/libs/utils/className';
import { bunnyImageUrl } from '@/libs/utils/bunnyImageUrl';
import { createClient } from '@/libs/supabase/client';
import BrandLogo from '@/components/ui/BrandLogo';
import AnimatedLink from '@/animations/components/AnimatedLink';
import TransitionLink from '@/components/ui/TransitionLink';
import Button from '@/components/ui/Button';
import DesktopNavItem from '@/components/layout/header/DesktopNavItem';
import MobileNavItem from '@/components/layout/header/MobileNavItem';
import MarqueeOffer from '@/components/layout/header/MarqueeOffer';

import { getNavLinks } from '@/libs/config/navConfig'; 
import { isRouteActive } from '@/libs/config/isRouteActive';
import { useCategories } from '@/providers/CategoryProvider';
import { translate } from '@/libs/utils/i18n';

const THEMES = ["light", "dark", "brand"];

export default function Header({ latestAnimation }) {
  const pathname = usePathname();
  const isStarterPack = pathname === "/starter-pack";

  const { hasAccess, isAuthenticated, loading: authLoading } = (function useHeaderAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const supabase = createClient();
      async function fetchUser() {
        try {
          const { data: { user: authUser }, error } = await supabase.auth.getUser();
          if (error || !authUser) return void setUser(null);

          const { data: profile } = await supabase.from("users").select("*").eq("id", authUser.id).single();
          setUser({
            id: authUser.id,
            email: authUser.email,
            name: profile?.name || profile?.display_name || authUser.email?.split("@")[0] || "User",
            avatarUrl: profile?.avatar_url,
            avatarIndex: profile?.avatar_index || 0,
            subscriptionStatus: profile?.subscription_status || "free",
            hasAccess: profile?.has_access || false
          });
        } catch (err) {
          console.error("Error fetching user:", err);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }

      fetchUser();
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") fetchUser();
        else if (event === "SIGNED_OUT") setUser(null);
      });

      return () => subscription.unsubscribe();
    }, []);

    return { user, loading, hasAccess: !loading && (user?.hasAccess || false), isAuthenticated: !loading && !!user };
  })();

  const headerRef = useRef(null);
  const headerInnerRef = useRef(null);
  const activeIndicatorRef = useRef(null);
  const dropdownWrapperRef = useRef(null);
  const dropdownInnerRef = useRef(null);
  const scrimRef = useRef(null);
  const itemRefs = useRef({});
  const groupsRef = useRef({});
  const openTimer = useRef(null);
  const closeTimer = useRef(null);
  const scrollYRef = useRef(0);
  const prevMenuRef = useRef(null);

  const [activeDesktopMenu, setActiveDesktopMenu] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMobileMenu, setActiveMobileMenu] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [marqueeShiftY, setMarqueeShiftY] = useState(0);

  const { headerTheme, scrollState } = (function useHeaderScroll(headerElRef) {
    const [scrollState, setScrollState] = useState("top");
    const [headerTheme, setHeaderTheme] = useState("dark");

    const checkTheme = useCallback((topOffset) => {
      const sections = document.querySelectorAll("main [data-theme]");
      if (sections.length === 0) return;
      const activeSection = Array.from(sections).find(section => {
        const rect = section.getBoundingClientRect();
        return rect.top <= topOffset && rect.bottom > topOffset;
      });
      const theme = (activeSection ?? sections[0])?.dataset.theme;
      if (theme && THEMES.includes(theme)) setHeaderTheme(theme);
    }, []);

    useEffect(() => {
      const handleScroll = () => {
        setScrollState(window.scrollY > 50 ? "scrolled" : "top");
        if (headerElRef.current) checkTheme(headerElRef.current.offsetTop);
      };
      handleScroll();
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, [checkTheme, headerElRef]);

    useEffect(() => {
      let unmounted = false;
      const updateTheme = () => {
        if (!unmounted && headerElRef.current) {
          setScrollState(window.scrollY > 50 ? "scrolled" : "top");
          checkTheme(headerElRef.current.offsetTop);
        }
      };

      const headerContainer = headerElRef.current?.closest(".v2-header");
      headerContainer?.classList.add("no-transition");
      updateTheme();

      const frame = requestAnimationFrame(() => {
        updateTheme();
        requestAnimationFrame(() => headerContainer?.classList.remove("no-transition"));
      });

      const observer = new MutationObserver(updateTheme);
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-theme"] });
      const timeoutId = setTimeout(() => observer.disconnect(), 800);

      return () => {
        unmounted = true;
        cancelAnimationFrame(frame);
        observer.disconnect();
        clearTimeout(timeoutId);
        headerContainer?.classList.remove("no-transition");
      };
    }, [checkTheme, headerElRef]);

    return { scrollState, headerTheme };
  })(headerInnerRef);

  const padState = isAnimating || isMobileMenuOpen ? "open" : scrollState === "scrolled" ? "scrolled" : "top";
  const isSolidBg = scrollState === "scrolled" || isMobileMenuOpen || isAnimating;

  const categories = useCategories();
  const rawNavLinks = useMemo(() => getNavLinks(), []);
  
  const processedNavLinks = useMemo(() => {
    const categoryLinks = categories.map(cat => ({
      label: cat.name,
      href: `/animations?category=${cat.slug}`
    }));

    return rawNavLinks.map(link => {
      if (link.mega && link.mega.columns) {
        return {
          ...link,
          mega: {
            ...link.mega,
            columns: link.mega.columns.map(col => {
              const updatedCol = col.dynamic === "categories" ? { ...col, links: categoryLinks } : col;
              return isAuthenticated ? updatedCol : {
                ...updatedCol,
                links: updatedCol.links.filter(l => l.href !== "/animations/saved")
              };
            })
          }
        };
      }
      return link;
    });
  }, [categories, isAuthenticated, rawNavLinks]);

  const megaMenuItems = useMemo(() => processedNavLinks.filter(link => link.mega), [processedNavLinks]);

  const updateIndicator = useCallback((menuKey, { instant = false } = {}) => {
    const targetItem = itemRefs.current[menuKey];
    const indicator = activeIndicatorRef.current;
    
    if (targetItem && indicator) {
      if (instant) {
        gsap.set(indicator, { x: targetItem.offsetLeft, scaleX: targetItem.offsetWidth, autoAlpha: 0 });
        gsap.to(indicator, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
        return;
      }
      gsap.to(indicator, { x: targetItem.offsetLeft, scaleX: targetItem.offsetWidth, autoAlpha: 1, duration: 0.4, ease: "expo.out" });
    }
  }, []);

  useEffect(() => {
    const prevMenu = prevMenuRef.current;
    if (prevMenu === activeDesktopMenu) return;
    prevMenuRef.current = activeDesktopMenu;

    const inner = dropdownInnerRef.current;
    const wrapper = dropdownWrapperRef.current;
    const scrim = scrimRef.current;

    if (!inner || !wrapper) return;

    const revealItems = [];
    megaMenuItems.forEach(item => {
      const el = groupsRef.current[item.key];
      if (el) {
        gsap.killTweensOf(el);
        revealItems.push(...el.querySelectorAll("[data-mm-reveal]"));
      }
    });

    gsap.killTweensOf([inner, scrim, activeIndicatorRef.current, ...revealItems]);

    if (activeDesktopMenu === null) {
      let done = false;
      gsap.to(inner, {
        height: 0,
        duration: 0.3,
        ease: "power3.out",
        onUpdate: function () {
          if (!done && this.ratio >= 0.9) {
            done = true;
            setIsAnimating(false);
          }
        },
        onComplete: () => {
          gsap.set(wrapper, { visibility: "hidden", pointerEvents: "none" });
          megaMenuItems.forEach(item => {
            const el = groupsRef.current[item.key];
            if (el) gsap.set(el, { visibility: "hidden", opacity: 0, pointerEvents: "none" });
          });
          if (!done) setIsAnimating(false);
        }
      });
      gsap.to(scrim, { autoAlpha: 0, duration: 0.3, ease: "power3.out" });
      gsap.to(activeIndicatorRef.current, { autoAlpha: 0, duration: 0.2 });
      return;
    }

    const activeGroupEl = groupsRef.current[activeDesktopMenu];
    if (!activeGroupEl) return;

    const wasClosed = prevMenu === null;
    setIsAnimating(true);

    megaMenuItems.forEach(item => {
      const el = groupsRef.current[item.key];
      if (!el) return;
      const isActive = item.key === activeDesktopMenu;
      gsap.set(el, {
        visibility: isActive ? "visible" : "hidden",
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? "auto" : "none"
      });
    });

    gsap.set(wrapper, { visibility: "visible", pointerEvents: "auto" });

    gsap.to(inner, {
      height: activeGroupEl.offsetHeight,
      duration: wasClosed ? 0.5 : 0.4,
      ease: wasClosed ? "expo.out" : "expo.inOut"
    });

    gsap.to(scrim, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });

    if (wasClosed) {
      gsap.set(activeIndicatorRef.current, { autoAlpha: 0 });
      setTimeout(() => {
        if (prevMenuRef.current === activeDesktopMenu) updateIndicator(activeDesktopMenu, { instant: true });
      }, 320);
    } else {
      updateIndicator(activeDesktopMenu);
    }

    const activeReveals = activeGroupEl.querySelectorAll("[data-mm-reveal]");
    if (wasClosed) {
      gsap.fromTo(activeReveals,
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out", stagger: 0.05 }
      );
    } else {
      const dir = megaMenuItems.findIndex(i => i.key === activeDesktopMenu) >= megaMenuItems.findIndex(i => i.key === prevMenu) ? 1 : -1;
      gsap.fromTo(activeReveals,
        { x: 48 * dir, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.45, ease: "expo.out", stagger: 0.04 }
      );
    }
  }, [activeDesktopMenu, megaMenuItems, updateIndicator]);

  useEffect(() => {
    if (!activeDesktopMenu) return void setMarqueeShiftY(0);
    const frame = requestAnimationFrame(() => {
      const activeEl = groupsRef.current[activeDesktopMenu];
      setMarqueeShiftY(activeEl ? activeEl.offsetHeight : 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [activeDesktopMenu]);

  const clearMenuTimers = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  };

  const handleMenuLeave = () => {
    clearMenuTimers();
    closeTimer.current = setTimeout(() => setActiveDesktopMenu(null), 200);
  };

  const handleMenuEnter = (item) => {
    clearMenuTimers();
    if (item.mega) {
      if (activeDesktopMenu) setActiveDesktopMenu(item.key);
      else openTimer.current = setTimeout(() => setActiveDesktopMenu(item.key), 150);
    } else if (activeDesktopMenu) {
      handleMenuLeave();
    }
  };

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && setActiveDesktopMenu(null);
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    setActiveDesktopMenu(null);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScrollDir = () => {
      const el = headerRef.current;
      if (!el) return;
      const y = window.scrollY;
      if (activeDesktopMenu) setActiveDesktopMenu(null);
      
      let isHidden = false;
      if (!isMobileMenuOpen && y > 120) {
        isHidden = y > scrollYRef.current;
        el.classList.toggle("is-hidden", isHidden);
      } else {
        el.classList.remove("is-hidden");
      }
      
      document.documentElement.classList.toggle("v2-header-hidden", isHidden);
      scrollYRef.current = y;
    };
    
    window.addEventListener("scroll", handleScrollDir, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollDir);
  }, [activeDesktopMenu, isMobileMenuOpen]);

  useEffect(() => () => document.documentElement.classList.remove("v2-header-hidden"), []);
  useEffect(() => () => clearMenuTimers(), []);

  useEffect(() => {
    document.documentElement.classList.toggle("v2-scroll-locked", isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        ref={headerRef}
        data-v2
        data-theme={headerTheme}
        data-pad-state={isStarterPack ? "top" : padState}
        style={{ top: "var(--anm-ppp-offset, 0px)" }}
        className={cn("v2-header inset-x-0 top-0 z-[300] pt-[var(--v2-header-gap)]", isStarterPack ? "absolute" : "fixed")}
      >
        <div ref={headerInnerRef} className="v2-mm-bar">
          <div className={cn("v2-bar-padx v2-container flex h-full items-center justify-between transition-colors duration-300 ease-power3-out lg:grid lg:grid-cols-12 lg:gap-16", isSolidBg ? "bg-surface" : "bg-transparent")}>
            <BrandLogo className="lg:col-span-3" />
            
            {}
            {!isStarterPack && (
              <nav
                onMouseEnter={clearMenuTimers}
                onMouseLeave={handleMenuLeave}
                className="relative hidden h-full items-center justify-center gap-x-32 lg:col-span-4 lg:col-start-5 lg:flex"
              >
                {processedNavLinks.map(item => item.mega ? (
                  <DesktopNavItem
                    key={item.key}
                    item={item}
                    href={item.triggerHref}
                    badge={item.badge}
                    active={activeDesktopMenu === item.key || (item.triggerHref && isRouteActive(pathname, item.triggerHref))}
                    expanded={activeDesktopMenu === item.key}
                    setRef={el => itemRefs.current[item.key] = el}
                    onMouseEnter={() => handleMenuEnter(item)}
                    onClick={() => { clearMenuTimers(); setActiveDesktopMenu(null); }}
                  />
                ) : (
                  <AnimatedLink
                    key={item.key}
                    href={item.href}
                    inline
                    active={isRouteActive(pathname, item.href)}
                    onMouseEnter={() => handleMenuEnter(item)}
                    className={cn("text-mono h-full items-center", isRouteActive(pathname, item.href) ? "text-foreground" : "text-foreground-muted hover:text-foreground")}
                  >
                    {item.label}
                  </AnimatedLink>
                ))}
                <span ref={activeIndicatorRef} className="v2-mm-indicator" aria-hidden="true" />
              </nav>
            )}

            {}
            {!isStarterPack && (
              <div className="hidden items-center justify-end gap-20 lg:col-span-3 lg:col-start-10 lg:flex">
                {!authLoading && (
                  <TransitionLink href={hasAccess ? "/animations" : "/login"} className="text-mono text-foreground-muted transition-colors duration-200 hover:text-foreground">
                    {hasAccess ? translate("common.header.actions.account") : translate("common.header.actions.login")}
                  </TransitionLink>
                )}
                <Button href="/checkout?plan=solo&cycle=quarterly" size="sm" theme="light">
                  {translate("common.header.actions.getAnnnimate")}
                </Button>
              </div>
            )}

            {}
            {!isStarterPack && (
              <button
                type="button"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                className="relative size-32 lg:hidden"
              >
                <span className={cn("absolute left-1/2 h-[1.5px] w-20 -translate-x-1/2 bg-foreground transition-transform duration-300", isMobileMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[calc(50%-4px)]")} />
                <span className={cn("absolute left-1/2 h-[1.5px] w-20 -translate-x-1/2 bg-foreground transition-transform duration-300", isMobileMenuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "top-[calc(50%+4px)]")} />
              </button>
            )}
          </div>
        </div>

        {}
        <div ref={dropdownWrapperRef} className="v2-mm-dropdown" onMouseEnter={clearMenuTimers} onMouseLeave={handleMenuLeave}>
          <div ref={dropdownInnerRef} className="v2-mm-dropdown-inner">
            {megaMenuItems.map(item => (
              <div key={item.key} ref={el => groupsRef.current[item.key] = el} className="v2-mm-group">
                <div className="grid grid-cols-12 gap-16 py-32">
                  <div data-mm-reveal className="col-span-3 col-start-1 flex flex-col gap-16">
                    <p className="text-mono-sm text-foreground-muted">{item.mega.intro.eyebrow}</p>
                    <p className="text-h4 text-foreground">{item.mega.intro.heading}</p>
                    <p className="text-body-sm text-foreground-muted">{item.mega.intro.text}</p>
                    <TransitionLink href={item.mega.intro.cta.href} onClick={() => setActiveDesktopMenu(null)} className="text-mono-sm w-fit text-foreground underline underline-offset-4 hover:text-foreground-muted">
                      {item.mega.intro.cta.label}
                    </TransitionLink>
                  </div>
                  <div className="col-span-4 col-start-5 flex gap-48">
                    {item.mega.columns.map(col => (
                      <div key={col.label} data-mm-reveal className="flex flex-1 flex-col gap-8">
                        <span className="text-mono-sm mb-4 text-foreground-muted">{col.label}</span>
                        {col.links.map(link => (
                          <AnimatedLink key={link.label} href={link.href} className="text-body-sm py-4 text-foreground-muted transition-colors duration-200 hover:text-foreground">
                            {link.label}
                            {link.badge && <span className="text-accent-2xs ml-8 inline-block bg-brand px-6 py-2 align-middle text-black">{link.badge}</span>}
                          </AnimatedLink>
                        ))}
                      </div>
                    ))}
                  </div>

                  {}
                  {item.mega.featured ? (
                    <div data-mm-reveal className="col-span-3 col-start-10">
                      <TransitionLink href={item.mega.featured.href} onClick={() => setActiveDesktopMenu(null)} className="flex flex-col gap-12">
                        <div className="aspect-[16/10] w-full overflow-hidden bg-background-muted">
                          <picture>
                            {item.mega.featured.image.avif && <source srcSet={item.mega.featured.image.avif} type="image/avif" />}
                            <img src={item.mega.featured.image.jpg} alt={item.mega.featured.image.alt} className="block object-cover" style={{ width: "100%", height: "100%" }} />
                          </picture>
                        </div>
                        <div className="flex flex-col gap-4">
                          <p className="text-mono-sm text-foreground-muted">{item.mega.featured.eyebrow}</p>
                          <p className="text-body-sm text-foreground">{item.mega.featured.title}</p>
                        </div>
                      </TransitionLink>
                    </div>
                  ) : latestAnimation ? (
                    <div data-mm-reveal className="col-span-3 col-start-10">
                      <TransitionLink href={`/animations/${latestAnimation.slug}`} onClick={() => setActiveDesktopMenu(null)} className="flex flex-col gap-12">
                        <div className="aspect-[16/10] w-full overflow-hidden bg-background-muted">
                          {latestAnimation.preview_video_url ? (
                            <video src={latestAnimation.preview_video_url} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                          ) : latestAnimation.preview_image_url ? (
                            <img src={bunnyImageUrl(latestAnimation.preview_image_url, { width: 480 })} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-4">
                          <p className="text-mono-sm text-foreground-muted">{translate("common.header.latestComponentLabel")}</p>
                          <p className="text-body-sm text-foreground">{latestAnimation.title}</p>
                        </div>
                      </TransitionLink>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isStarterPack && <MarqueeOffer scrolled={scrollState === "scrolled"} shiftY={marqueeShiftY} />}

        {}
        <div className="v2-mm-collapse v2-container absolute inset-x-0 top-full lg:hidden" data-open={isMobileMenuOpen} inert={!isMobileMenuOpen}>
          <div>
            <div className="max-h-[calc(100vh-var(--v2-header-h)-var(--v2-header-gap))] overflow-y-auto border-b border-border bg-surface">
              <div className="flex flex-col px-32 py-16">
                {processedNavLinks.map(item => item.mega ? (
                  <MobileNavItem key={item.key} item={item} expanded={activeMobileMenu === item.key} onToggle={() => setActiveMobileMenu(prev => prev === item.key ? null : item.key)} />
                ) : (
                  <TransitionLink key={item.key} href={item.href} className="text-mono border-b border-border-muted py-12 text-foreground">
                    {item.label}
                  </TransitionLink>
                ))}
                <div className="flex items-center gap-20 pt-16">
                  {!authLoading && (
                    <TransitionLink href={hasAccess ? "/animations" : "/login"} className="text-mono text-foreground-muted">
                      {hasAccess ? translate("common.header.actions.account") : translate("common.header.actions.login")}
                    </TransitionLink>
                  )}
                  <Button href="/checkout?plan=solo&cycle=quarterly" size="sm" theme="light">
                    {translate("common.header.actions.getAnnnimate")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {}
      <div ref={scrimRef} className="v2-mm-scrim" onClick={() => setActiveDesktopMenu(null)} aria-hidden="true" />
    </>
  );
}
