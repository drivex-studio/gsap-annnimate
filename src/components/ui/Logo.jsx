'use client';

import { useRef } from "react";
import Link from 'next/link';
import LogoMark from "@/animations/components/AnimatedIcon"; 
import LogoWordmark from "@/assets/logos/LogoWordmark"; 
import { cn } from "@/libs/utils/className"; 
import { useTransitionClick } from "@/hooks/useTransitionClick"; 
import { translate } from "@/libs/utils/i18n"; 

export default function Logo({ className }) {
  const handleClick = useTransitionClick("/");
  const markRef = useRef(null);

  return (
    <Link
      href="/"
      onClick={handleClick}
      onMouseEnter={() => markRef.current?.play()}
      aria-label="Annnimate - Home"
      className={cn("flex shrink-0 items-end justify-start gap-8", className)}
    >
      <span className="flex items-end gap-6">
        <LogoMark ref={markRef} className="h-[15px] lg:h-[18px]" />
        <LogoWordmark className="h-[15px] w-auto text-foreground lg:h-[18px]" />
      </span>
      <span className="-mb-2 mt-auto text-[9px] text-foreground-muted lg:text-[10px]">
        {t("common.header.logoByline")}
      </span>
    </Link>
  );
}
