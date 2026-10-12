import React from 'react';
import { cn } from '@/libs/utils/className';
import { useSidebar } from '@/providers/SidebarProvider';

export function SidebarSection({ label, children, className }) {
  let { isCollapsed, isMobile } = useSidebar();
  let isIconOnly = isCollapsed && !isMobile;

  return (
    <div className={cn("flex flex-col", className)}>
      {label ? (
        isIconOnly ? (
          <div className="mx-12 mb-8 mt-12 h-px bg-foreground/10" aria-hidden="true" />
        ) : (
          <div className="text-mono-sm px-12 pt-12 pb-8 text-foreground-muted">
            {label}
          </div>
        )
      ) : null}
      <div className={cn("flex flex-col", isIconOnly ? "gap-4 px-12" : "gap-2 px-8")}>
        {children}
      </div>
    </div>
  );
}
