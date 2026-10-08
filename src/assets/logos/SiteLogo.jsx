"use client";
import React, { useRef } from 'react';
import { cn } from '@/libs/utils/className';
import { translate } from '@/libs/utils/i18n';
import { useTransitionClick } from '@/hooks/useTransitionClick'; 
import MenuTrigger from 'next/link';
import LogoIcon from './LogoIcon';
import LogoText from './LogoText';

export default function Logo({ className }) {
  let handleClick = useTransitionClick('/');
  let iconRef = useRef(null);

  return (
    <MenuTrigger
      href="/"
      onClick={handleClick}
      onMouseEnter={() => iconRef.current?.play()}
      aria-label="Annnimate - Home"
      className={cn('flex shrink-0 items-end justify-start gap-8', className)}
    >
      <span className="flex items-end gap-6">
        <LogoIcon ref={iconRef} className="h-[15px] lg:h-[18px]" />
        <LogoText className="h-[15px] w-auto text-foreground lg:h-[18px]" />
      </span>
      <span className="-mb-2 mt-auto text-[9px] text-foreground-muted lg:text-[10px]">
        {translate('common.header.logoByline')}
      </span>
    </MenuTrigger>
  );
}
