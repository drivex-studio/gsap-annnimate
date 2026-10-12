import React from 'react';
import NextLink from 'next/link';
import { useTransitionClick } from '@/hooks/useTransitionClick';
import { cn } from '@/libs/utils/className';
import { useSidebar } from '@/providers/SidebarProvider';

export function SidebarNavItem({
  href,
  icon: Icon,
  label,
  active = false,
  badge,
  external = false,
  className,
  ...rest
}) {
  let { isCollapsed, isMobile, closeMobile } = useSidebar();
  let isIconOnly = isCollapsed && !isMobile;
  
  let transitionClick = useTransitionClick(href, {
    onClick: () => {
      if (isMobile) closeMobile();
    }
  });

  let navClasses = cn(
    "group relative flex h-40 items-center rounded-[2px] text-foreground-muted",
    "transition-colors duration-(--duration-fast) ease-(--ease-power3-out)",
    "hover:text-foreground data-[active=true]:text-foreground",
    isIconOnly ? "justify-center px-0" : "gap-12 px-12",
    className
  );

  let Tag = external ? "a" : NextLink;

  return (
    <Tag
      href={href}
      onClick={external ? () => { if (isMobile) closeMobile(); } : transitionClick}
      data-active={active ? "true" : undefined}
      aria-current={active ? "page" : undefined}
      title={isIconOnly ? label : undefined}
      className={navClasses}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-0 inset-y-8 w-2 origin-left scale-x-0 bg-brand",
          "transition-transform duration-(--duration-snap) ease-(--ease-power3-out)",
          "group-data-[active=true]:scale-x-100"
        )}
      />
      {Icon ? (
        <span aria-hidden="true" className="pointer-events-none inline-flex shrink-0 items-center justify-center">
          <Icon className="size-18" aria-hidden="true" strokeWidth={1.5} />
        </span>
      ) : null}
      
      {!isIconOnly && (
        <span className="pointer-events-none text-body-sm min-w-0 flex-1 truncate">
          {label}
        </span>
      )}
      {!isIconOnly && badge ? (
        <span aria-hidden="true" className="pointer-events-none text-accent-2xs text-brand">
          {badge}
        </span>
      ) : null}
    </Tag>
  );
}
