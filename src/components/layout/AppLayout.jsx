"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { useUser } from '@/providers/UserProvider';
import { useAnimation } from '@/providers/AnimationProvider';
import { getDiscordLinkForUser } from '@/libs/utils/discord';
import { cn } from '@/libs/utils/className';
import { getAppChrome } from '@/libs/config/GetLayoutType';

import InlineLoader from '@/components/ui/InlineLoader';
import { ScrambleLoadingLabel } from '@/animations/shared/ScrambleLoadingLabel';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LenisProvider from '@/providers/LenisProvider';

import { AppSidebar } from '@/components/layout/sidebar/AppSidebar';
import { MobileSidebarTrigger } from '@/components/layout/sidebar/MobileSidebarTrigger';
import { SidebarNavItem } from '@/components/layout/sidebar/SidebarNavItem';
import { SidebarSection } from '@/components/layout/sidebar/SidebarSection';
import SidebarUserMenu from '@/components/layout/sidebar/SidebarUserMenu';
import { SidebarProvider, useSidebar } from '@/providers/SidebarProvider';

import { OnboardingProvider } from '@/providers/OnboardingProvider';
import OnboardingDiscordNudge from '@/components/layout/onboarding/OnboardingDiscordNudge';
import NotificationsTrigger from '@/components/layout/notifications/NotificationsTrigger';
import { 
  SquaresFour, BookOpen, BookmarkSimple, Lightbulb, 
  Question, GearSix, GraduationCap, PlugsConnected, 
  Package, DiscordLogo, Wrench 
} from '@phosphor-icons/react';

let hasInitializedWatchdog = false;
setTimeout(() => {
  if (!hasInitializedWatchdog) {
    try {
      if (!sessionStorage.getItem("anm-auth-watchdog")) {
        sessionStorage.setItem("anm-auth-watchdog", "1");
        window.location.reload();
      }
    } catch {}
  }
}, 10000);

const PRIMARY_NAV_ITEMS = [
  { title: "Animations", url: "/animations", icon: SquaresFour, exact: true },
  { title: "Saved", url: "/animations/saved", icon: BookmarkSimple, exact: true },
  { title: "Kits", url: "/account/kits", icon: Package },
  { title: "Roadmap", url: "/roadmap", icon: Lightbulb }
];

const SUPPORT_NAV_ITEMS = [
  { title: "Documentation", url: "/docs", icon: BookOpen },
  { title: "MCP server", url: "/docs/guides/mcp", icon: PlugsConnected, exact: true },
  { title: "Learn", url: "/learn", icon: GraduationCap },
  { title: "Tools", url: "/tools", icon: Wrench }, 
  { title: "Help & Support", url: "/help", icon: Question },
  { title: "Settings", url: "/settings", icon: GearSix }
];

function isNavActive(currentPath, item) {
  return item.exact ? currentPath === item.url : currentPath === item.url || currentPath.startsWith(`${item.url}/`);
}

function AppLoading({ type = "app" }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-16 bg-background">
      <InlineLoader size="45" />
      <ScrambleLoadingLabel className="text-mono-sm text-foreground-muted" />
    </div>
  );
}

function SidebarNavMenu() {
  let pathname = usePathname();
  let { profile } = useUser();
  let { isCollapsed, isMobile } = useSidebar();
  let discordLink = getDiscordLinkForUser(profile);

  return (
    <React.Fragment>
      <SidebarSection label="Platform">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.url}
            href={item.url}
            icon={item.icon}
            label={item.title}
            active={isNavActive(pathname, item)}
            badge={item.badge}
          />
        ))}
      </SidebarSection>
      <SidebarSection label="Support">
        {SUPPORT_NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.url}
            href={item.url}
            icon={item.icon}
            label={item.title}
            active={isNavActive(pathname, item)}
          />
        ))}
        <SidebarNavItem href={discordLink} icon={DiscordLogo} label="Discord" external={true} />
      </SidebarSection>
      <div className={cn("mt-auto", isCollapsed && !isMobile ? "px-0 py-8" : "px-8 py-8")}>
        <NotificationsTrigger />
      </div>
    </React.Fragment>
  );
}

function ScrollTriggerProxy({ scrollerRef, onReady }) {
  useEffect(() => {
    let scroller = scrollerRef.current;
    if (!scroller) return;

    ScrollTrigger.scrollerProxy(scroller, {
      scrollTop(value) {
        if (arguments.length) {
          scroller.scrollTop = value;
        }
        return scroller.scrollTop;
      },
      getBoundingClientRect: () => ({ top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }),
      pinType: "fixed"
    });

    ScrollTrigger.defaults({ scroller: scroller });

    let handleScrollUpdate = () => ScrollTrigger.update();
    scroller.addEventListener("scroll", handleScrollUpdate, { passive: true });

    let resizeObserver = null;
    let rafId = null;
    let firstChild = scroller.firstElementChild;

    if (firstChild && typeof ResizeObserver !== "undefined") {
      let currentHeight = firstChild.getBoundingClientRect().height;
      resizeObserver = new ResizeObserver((entries) => {
        if (rafId != null) return;
        let newHeight = entries[0]?.contentRect?.height ?? currentHeight;
        if (Math.abs(newHeight - currentHeight) >= 1) {
          currentHeight = newHeight;
          rafId = requestAnimationFrame(() => {
            rafId = null;
            ScrollTrigger.refresh();
          });
        }
      });
      resizeObserver.observe(firstChild);
    }

    ScrollTrigger.refresh();
    onReady?.();

    return () => {
      scroller.removeEventListener("scroll", handleScrollUpdate);
      if (resizeObserver) resizeObserver.disconnect();
      if (rafId != null) cancelAnimationFrame(rafId);

      ScrollTrigger.getAll().forEach((st) => {
        if (st.scroller === scroller) st.kill();
      });
      ScrollTrigger.defaults({ scroller: window });
    };
  }, []);

  return null;
}

export default function AppShell({ children, latestAnimation }) {
  let { user, profile, loading } = useUser();
  let [isMounted, setIsMounted] = useState(false);
  let [authTimeoutTriggered, setAuthTimeoutTriggered] = useState(false);

  useEffect(() => {
    if (!loading) {
      try {
        sessionStorage.removeItem("anm-auth-watchdog");
      } catch {}
      return;
    }
    
    let timeoutId = setTimeout(() => {
      try {
        if (!sessionStorage.getItem("anm-auth-watchdog")) {
          sessionStorage.setItem("anm-auth-watchdog", "1");
          window.location.reload();
          return;
        }
      } catch {}
      setAuthTimeoutTriggered(true);
    }, 8000);
    
    return () => clearTimeout(timeoutId);
  }, [loading]);

  let scrollerRef = useRef(null);
  let [isScrollReady, setIsScrollReady] = useState(false);
  let handleScrollReady = useCallback(() => setIsScrollReady(true), []);

  let pathname = usePathname();
  let appChrome = getAppChrome(pathname);
  let isEdgeToEdge = appChrome.edgeToEdge;
  let hasSidebar = appChrome.sidebar;
  let noTransitionContent = hasSidebar || appChrome.movesTransitionContent;

  let [e2eMode, setE2eMode] = useState(false);
  
  useEffect(() => {
    setE2eMode(localStorage.getItem("e2e-testing-mode") === "true");
  }, []);

  useEffect(() => {
    setIsMounted(true);
    hasInitializedWatchdog = true;
  }, []);

  let { addReadyGate } = useAnimation();
  let hasAddedGateRef = useRef(false);
  let releaseGateRef = useRef(null);

  if (!hasAddedGateRef.current) {
    hasAddedGateRef.current = true;
    releaseGateRef.current = addReadyGate("app-shell");
  }

  let releaseGate = useCallback(() => {
    releaseGateRef.current?.();
    releaseGateRef.current = null;
  }, []);

  useEffect(() => {
    return () => releaseGate();
  }, [releaseGate]);

  let isAuthResolved = !loading || authTimeoutTriggered;
  let isAppReady = (isMounted && isAuthResolved && !user && !e2eMode) || (isMounted && isAuthResolved && (user || e2eMode) && isScrollReady);

  useEffect(() => {
    if (isAppReady) {
      releaseGate();
    }
  }, [isAppReady, releaseGate]);

  if (!isAuthResolved) {
    return <AppLoading type="app" />;
  }

  if (user || e2eMode) {
    return (
      <SidebarProvider>
        <OnboardingProvider>
          <div className="flex h-screen bg-background relative">
            <AppSidebar
              footer={profile ? <SidebarUserMenu user={{ name: profile.name || profile.email, email: profile.email, avatar: profile.avatar_url }} /> : null}
            >
              <SidebarNavMenu />
            </AppSidebar>
            <MobileSidebarTrigger />
            <div
              ref={scrollerRef}
              className={isEdgeToEdge ? "flex-1 overflow-auto relative z-10 bg-secondary" : "flex-1 overflow-auto relative z-10 p-16"}
              data-transition-content={noTransitionContent ? undefined : ""}
            >
              <ScrollTriggerProxy scrollerRef={scrollerRef} onReady={handleScrollReady} />
              <div className="min-h-full has-[.ai-page-wrapper]:h-full has-[.ai-page-wrapper]:min-h-0">
                {children}
              </div>
            </div>
          </div>
          <OnboardingDiscordNudge />
        </OnboardingProvider>
      </SidebarProvider>
    );
  }

  if (appChrome.public) {
    return (
      <LenisProvider>
        <Header latestAnimation={latestAnimation} />
        <main
          className={hasSidebar ? "flex-1 relative z-[2] bg-background pt-[calc(var(--v2-header-h)+var(--v2-header-gap))]" : "flex-1 pt-0 relative z-[2] bg-background"}
          data-theme={hasSidebar ? "dark" : undefined}
          data-anon-app-shell=""
          data-anon-sidebar-chrome=""
          data-transition-content={noTransitionContent ? undefined : ""}
        >
          {children}
        </main>
        <Footer latestAnimation={latestAnimation} />
      </LenisProvider>
    );
  }

  window.location.href = "/";
  return <AppLoading type="app" />;
}
