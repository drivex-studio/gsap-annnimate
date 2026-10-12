'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const SIDEBAR_COOKIE_KEY = "anm:sidebar-collapsed";
const SidebarContext = createContext(null);

export function useSidebar() {
  let context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used inside <SidebarProvider>");
  }
  return context;
}

export function SidebarProvider({ children, defaultCollapsed = false }) {
  let isLg = useBreakpoint("lg");
  let isMobile = !isLg;
  
  let [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  let [isMobileOpen, setIsMobileOpen] = useState(false);
  let [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      let stored = window.localStorage.getItem(SIDEBAR_COOKIE_KEY);
      if (stored === "1") setIsCollapsed(true);
      else if (stored === "0") setIsCollapsed(false);
    } catch {}
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        window.localStorage.setItem(SIDEBAR_COOKIE_KEY, isCollapsed ? "1" : "0");
      } catch {}
    }
  }, [isCollapsed, isMounted]);

  let toggleCollapse = useCallback(() => setIsCollapsed(prev => !prev), []);
  let openMobile = useCallback(() => setIsMobileOpen(true), []);
  let closeMobile = useCallback(() => setIsMobileOpen(false), []);
  let toggleMobile = useCallback(() => setIsMobileOpen(prev => !prev), []);

  useEffect(() => {
    if (isLg && isMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [isLg, isMobileOpen]);

  useEffect(() => {
    let handleKeyDown = (e) => {
      if ((e.key === "b" || e.key === "B") && (e.metaKey || e.ctrlKey)) {
        let target = e.target;
        let tagName = target?.tagName;
        if (tagName === "INPUT" || tagName === "TEXTAREA" || target?.isContentEditable) return;
        
        e.preventDefault();
        if (isMobile) {
          setIsMobileOpen(prev => !prev);
        } else {
          setIsCollapsed(prev => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile]);

  let value = useMemo(() => ({
    isCollapsed,
    isMobile,
    isMobileOpen,
    toggleCollapse,
    openMobile,
    closeMobile,
    toggleMobile
  }), [isCollapsed, isMobile, isMobileOpen, toggleCollapse, openMobile, closeMobile, toggleMobile]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}
