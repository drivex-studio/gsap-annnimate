import React from 'react';
import HtmlCssIcon from '@/assets/icons/HtmlCssIcon';
import ReactIcon from '@/assets/icons/ReactIcon';
import VueIcon from '@/assets/icons/VueIcon';
import WebflowIcon from '@/assets/icons/WebflowIcon';
import { SmartTooltipGroup, SmartTooltip } from '@/components/ui/SmartTooltip';
import AnimatedTabs from '@/animations/components/AnimatedTabs';
import { cn } from '@/libs/utils/className';

export const PLATFORM_LABEL = {
  html: 'HTML',
  react: 'React',
  vue: 'Vue',
  webflow: 'Webflow'
};

export const PLATFORM_ORDER = ['react', 'vue', 'html', 'webflow'];

const PLATFORM_ICONS = {
  html: HtmlCssIcon,
  react: ReactIcon,
  vue: VueIcon,
  webflow: WebflowIcon
};

export default function PlatformSelect({
  platforms,
  activePlatform,
  onChange,
  idPrefix = 'code-platform',
  className
}) {
  return (
    <SmartTooltipGroup 
      delayDuration={250} 
      flipDuration={0.2} 
      flipEase="power3.out" 
      side="top" 
      sideOffset={8}
    >
      <AnimatedTabs
        activeId={activePlatform}
        duration={0.3}
        containerClassName={cn("flex items-center bg-foreground/[0.06]", className)}
        role="tablist"
      >
        {platforms.map(platform => {
          const isActive = activePlatform === platform;
          const Icon = PLATFORM_ICONS[platform];
          
          return (
            <SmartTooltip 
              key={platform} 
              id={`${idPrefix}-${platform}`} 
              content={PLATFORM_LABEL[platform]}
            >
              <button
                type="button"
                data-flip-id={platform}
                onClick={() => onChange(platform)}
                aria-label={PLATFORM_LABEL[platform]}
                aria-pressed={isActive}
                role="tab"
                className={cn(
                  "relative z-10 flex h-40 w-full items-center justify-center transition-colors duration-(--duration-fast) ease-(--ease-expo-out)",
                  isActive ? "text-foreground" : "text-foreground-muted hover:text-foreground"
                )}
              >
                {Icon && (
                  <span className="flex size-16 shrink-0 items-center justify-center">
                    <Icon />
                  </span>
                )}
              </button>
            </SmartTooltip>
          );
        })}
      </AnimatedTabs>
    </SmartTooltipGroup>
  );
}
