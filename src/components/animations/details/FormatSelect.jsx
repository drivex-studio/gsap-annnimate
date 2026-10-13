// module id: 367649
import React from 'react';
import Link from '@/components/navigation/Link';
import { cn } from '@/libs/utils/className';
import { SmartTooltipGroup, SmartTooltip } from '@/components/ui/SmartTooltip';
import { useTransitionClick } from '@/hooks/useTransitionClick'; // TODO: derived from module id 995289

import { HtmlCssIcon } from '@/assets/icons/HtmlCssIcon'; // TODO: derived from module id 732633
import { ReactIcon } from '@/assets/icons/ReactIcon'; // TODO: derived from module id 408125
import { VueIcon } from '@/assets/icons/VueIcon'; // TODO: derived from module id 900128


const FRAMEWORK_LABELS = {
  react: 'React',
  vue: 'Vue',
  html: 'HTML/CSS/JS'
};

const FRAMEWORK_ICONS = {
  react: ReactIcon,
  vue: VueIcon,
  html: HtmlCssIcon
};

const FRAMEWORK_KEYS = {
  react: 'react_code',
  vue: 'vue_code',
  html: 'html_code'
};

function FormatVariant({ slug, framework, compact = false }) {
  const Icon = FRAMEWORK_ICONS[framework];
  const label = FRAMEWORK_LABELS[framework];
  const href = `/animations/${slug}/${framework}`;
  const handleTransitionClick = useTransitionClick(href);

  return (
    <SmartTooltip 
      id={`framework-variant-${framework}`} 
      content={compact ? `${label} guide` : label}
    >
      <Link
        href={href}
        onClick={handleTransitionClick}
        aria-label={label}
        role="listitem"
        className={cn(
          "group relative flex items-center justify-center",
          compact ? "h-28 w-36" : "h-44 flex-1 lg:h-64",
          "transition-colors duration-(--duration-fast) ease-(--ease-expo-out)",
          "text-foreground-muted hover:bg-foreground/[0.04] hover:text-foreground"
        )}
      >
        {Icon && (
          <span className={compact ? "flex size-14 shrink-0 items-center justify-center" : "flex size-18 shrink-0 items-center justify-center lg:size-24"}>
            <Icon />
          </span>
        )}
      </Link>
    </SmartTooltip>
  );
}

export default function FormatSelect({ animation, availableFormats = null, compact = false }) {
  if (!animation?.slug) return null;

  const animationSlug = animation.slug;
  
  const formatsToRender = availableFormats
    ? Object.keys(FRAMEWORK_KEYS)
        .filter(key => availableFormats.includes(key))
        .map(key => [key])
    : Object.entries(FRAMEWORK_KEYS).filter(([, codeKey]) => !!animation[codeKey]);

  if (!formatsToRender.length) return null;

  const tooltipGroup = (
    <SmartTooltipGroup 
      delayDuration={250} 
      flipDuration={0.2} 
      flipEase="power3.out" 
      side={compact ? "bottom" : "top"} 
      sideOffset={8}
    >
      <div className="flex items-stretch divide-x divide-foreground/10 border border-foreground/10 bg-foreground/[0.06]" role="list">
        {formatsToRender.map(([framework]) => (
          <FormatVariant 
            key={framework} 
            slug={animationSlug} 
            framework={framework} 
            compact={compact} 
          />
        ))}
      </div>
    </SmartTooltipGroup>
  );

  return compact ? (
    <div className="flex flex-col items-start gap-6">
      <span className="text-accent-2xs text-foreground-muted">Guides</span>
      {tooltipGroup}
    </div>
  ) : (
    <section>
      <p className="text-mono-sm text-foreground-muted mb-12">Framework guides</p>
      {tooltipGroup}
    </section>
  );
}
