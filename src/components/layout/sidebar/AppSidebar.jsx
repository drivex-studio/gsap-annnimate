"use client";
import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/libs/utils/className';
import { useSidebar } from '@/providers/SidebarProvider';
import AnimatedLogo from '@/animations/components/AnimatedLogo';
import LogoText from '@/assets/logos/LogoText';

function SidebarCollapseButton({ className }) {
  let { isCollapsed, isMobile, toggleCollapse, closeMobile } = useSidebar();
  let isIconOnly = isCollapsed && !isMobile;
  let label = isMobile ? "Close menu" : isIconOnly ? "Expand sidebar" : "Collapse sidebar";

  return (
    <button
      type="button"
      onClick={() => {
        if (isMobile) closeMobile();
        else toggleCollapse();
      }}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-28 shrink-0 items-center justify-center",
        "border border-foreground/10 text-foreground-muted",
        "transition-colors duration-(--duration-fast) ease-(--ease-power3-out)",
        "hover:border-foreground/30 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
        className
      )}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className={cn(
          "size-14 transition-transform duration-(--duration-snap) ease-(--ease-power3-out)",
          isIconOnly ? "rotate-180" : "rotate-0"
        )}
      >
        <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" strokeLinejoin="miter" />
      </svg>
    </button>
  );
}

function SidebarContainer({ collapsed, footer, children }) {
  let logoRef = useRef(null);

  return (
    <div className="flex h-full flex-col">
      <header className={cn("flex h-56 items-center border-b border-foreground/10", collapsed ? "justify-center px-0" : "px-16")}>
        <Link
          href="/"
          aria-label="Annnimate home"
          onMouseEnter={() => logoRef.current?.play()}
          className="inline-flex items-center gap-8 text-foreground"
        >
          <AnimatedLogo ref={logoRef} className="h-16" />
          {collapsed ? null : <LogoText height={14} className="text-foreground" />}
        </Link>
      </header>
      <nav className="flex flex-1 flex-col overflow-y-auto py-12">
        {children}
      </nav>
      {footer ? (
        <div className={cn("border-t border-foreground/10", collapsed ? "px-0 py-8" : "px-8 py-8")}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function AppSidebar({ children, footer }) {
  let { isCollapsed, isMobile, isMobileOpen, closeMobile } = useSidebar();
  let isIconOnly = isCollapsed && !isMobile;

  useEffect(() => {
    if (!isMobile || !isMobileOpen) return;
    
    let originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    let handleKey = (e) => {
      if (e.key === "Escape") closeMobile();
    };
    
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [isMobile, isMobileOpen, closeMobile]);

  let widthClass = isMobile ? "w-0" : isIconOnly ? "w-64" : "w-256";

  return (
    <React.Fragment>
      <aside
        aria-label="Main"
        className={cn(
          "relative h-screen shrink-0 border-r border-foreground/10 bg-background",
          "transition-[width] duration-(--duration-snap) ease-(--ease-power3-out)",
          widthClass,
          isMobile && "hidden"
        )}
      >
        <SidebarContainer collapsed={isIconOnly} footer={footer}>
          {children}
        </SidebarContainer>
        <div className="absolute left-full top-14 z-20 ml-16" aria-hidden="false">
          <SidebarCollapseButton />
        </div>
      </aside>

      {isMobile ? (
        <React.Fragment>
          <div
            onClick={closeMobile}
            aria-hidden="true"
            className={cn(
              "fixed inset-0 z-40 bg-background/60 backdrop-blur-sm",
              "transition-opacity duration-(--duration-fast) ease-(--ease-power3-out)",
              isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
          />
          <aside
            aria-label="Main"
            aria-hidden={isMobileOpen ? undefined : "true"}
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-256 border-r border-foreground/10 bg-background",
              "transition-transform duration-(--duration-snap) ease-(--ease-power3-out)",
              isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <SidebarContainer collapsed={false} footer={footer}>
              {children}
            </SidebarContainer>
          </aside>
        </React.Fragment>
      ) : null}
    </React.Fragment>
  );
}
