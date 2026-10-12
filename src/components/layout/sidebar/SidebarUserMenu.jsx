"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/libs/utils/className';
import { useSidebar } from '@/providers/SidebarProvider';
import { useUser } from '@/providers/UserProvider';
import { useTransitionRouter } from '@/providers/TransitionRouterProvider';
import Avatar from '@/components/ui/Avatar'; 
import { InlineLoader } from '@/components/ui/InlineLoader'; 
import { CaretUp, GearSix, CreditCard, SignOut, ShieldCheck } from '@phosphor-icons/react'; 

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/DropdownMenu';

const menuItemClass = "text-body-sm gap-10 px-10 py-8 cursor-pointer !rounded-none !text-foreground hover:!bg-foreground/10 focus:!bg-foreground/10 data-[highlighted]:!bg-foreground/10 data-[highlighted]:!text-foreground"; 

export default function SidebarUserMenu({ user, extraItems = [] }) {
  let { isCollapsed, isMobile } = useSidebar();
  let isIconOnly = isCollapsed && !isMobile;
  let { profile } = useUser();
  
  let router = useTransitionRouter();

  let handleNav = (href) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
    e.preventDefault();
    router.push(href);
  };

  let [isBillingLoading, setIsBillingLoading] = useState(false);

  let handleLogout = async () => {
    try {
      let { createClient } = await import('@/libs/supabase/client');
      let supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  let handleBilling = async () => {
    if (!isBillingLoading) {
      setIsBillingLoading(true);
      try {
        let response = await fetch("/api/stripe/create-portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ returnUrl: window.location.href })
        });
        let data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          console.error("No portal URL returned:", data.error);
          setIsBillingLoading(false);
        }
      } catch (err) {
        console.error("Billing portal error:", err);
        setIsBillingLoading(false);
      }
    }
  };

  let displayName = user.name || user.email;
  let planName = profile?.plan_name ? `${profile.plan_name} Plan` : "Free Plan";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex w-full items-center gap-12 text-left",
            "transition-colors duration-(--duration-fast) ease-(--ease-power3-out)",
            "hover:bg-foreground/[0.04] data-[state=open]:bg-surface",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
            isIconOnly ? "h-48 justify-center px-0" : "h-56 px-12"
          )}
        >
          <Avatar
            name={displayName}
            src={user.avatar}
            avatarIndex={profile?.avatar_index}
            alt={displayName}
            size={32}
            className="size-32 shrink-0"
          />
          {!isIconOnly && (
            <React.Fragment>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-body-sm truncate text-foreground">{displayName}</span>
                <span className="text-accent-xs truncate text-foreground-muted">{planName}</span>
              </span>
              <CaretUp
                className="size-14 shrink-0 text-foreground-muted transition-colors group-hover:text-foreground group-data-[state=open]:text-foreground"
                aria-hidden="true"
              />
            </React.Fragment>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={isIconOnly ? "right" : "top"}
        align={isIconOnly ? "end" : "start"}
        sideOffset={16}
        className={cn(
          "!rounded-none !border-foreground/10 !bg-surface !text-foreground !shadow-lg !p-0",
          isIconOnly && "min-w-[220px]"
        )}
        style={isIconOnly ? undefined : { width: "var(--radix-dropdown-menu-trigger-width)" }}
      >
        <DropdownMenuLabel className="!p-0">
          <div className="flex items-start gap-10 border-b border-foreground/10 px-12 py-12">
            <Avatar
              name={displayName}
              src={user.avatar}
              avatarIndex={profile?.avatar_index}
              alt={displayName}
              size={32}
              className="size-32 shrink-0"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-body-sm truncate font-medium leading-tight text-foreground">{displayName}</span>
              <span className="text-body-sm truncate font-normal leading-tight text-foreground-muted">{user.email}</span>
              <span className="text-accent-xs mt-6 truncate text-foreground-muted">
                {planName}
                {profile?.is_legacy_user && (
                  <span className="ml-8 inline-flex items-center gap-4 text-brand">
                    <span aria-hidden="true" className="inline-block size-6 bg-brand" />
                    Founding member
                  </span>
                )}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuGroup className="!p-4">
          <DropdownMenuItem asChild className={menuItemClass}>
            <Link href="/settings" onClick={handleNav("/settings")}>
              <GearSix className="size-16 shrink-0 text-foreground-muted" aria-hidden="true" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); handleBilling(); }}
            disabled={isBillingLoading}
            className={menuItemClass}
          >
            {isBillingLoading ? (
              <InlineLoader size="16" color="currentColor" className="shrink-0" />
            ) : (
              <CreditCard className="size-16 shrink-0 text-foreground-muted" aria-hidden="true" />
            )}
            <span>Billing</span>
          </DropdownMenuItem>

          {extraItems.map((item) => {
            let Icon = item.icon;
            return (
              <DropdownMenuItem asChild key={item.href || item.label} className={menuItemClass}>
                <Link href={item.href} onClick={handleNav(item.href)}>
                  {Icon && <Icon className="size-16 shrink-0 text-foreground-muted" aria-hidden="true" />}
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}

          {profile?.is_super_admin && (
            <React.Fragment>
              <DropdownMenuSeparator className="!my-4 !-mx-0 !bg-foreground/10" />
              <DropdownMenuItem asChild className={cn(menuItemClass, "!text-brand hover:!text-brand focus:!text-brand data-[highlighted]:!text-brand")}>
                <Link href="/admin" onClick={handleNav("/admin")}>
                  <ShieldCheck className="size-16 shrink-0 text-brand" aria-hidden="true" />
                  <span>Admin dashboard</span>
                </Link>
              </DropdownMenuItem>
            </React.Fragment>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="!my-0 !-mx-0 !bg-foreground/10" />
        
        <div className="!p-4">
          <DropdownMenuItem onClick={handleLogout} className={menuItemClass}>
            <SignOut className="size-16 shrink-0 text-foreground-muted" aria-hidden="true" />
            <span>Log out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
