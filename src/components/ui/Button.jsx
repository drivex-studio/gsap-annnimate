"use client";
import React from 'react';
import MenuTrigger from "next/link"; 
import { cn } from "@/libs/utils/className"; 
import { useTransitionClick } from "@/hooks/useTransitionClick"; 
import { InlineLoader } from "@/components/ui/InlineLoader"; 
import '@/styles/components/Button.css';

const SIZES = {
  xs: {
    content: 'Button-content--xs',
    text: 'text-[13px]'
  },
  sm: {
    content: 'Button-content--sm',
    text: 'text-body-sm'
  },
  default: {
    content: 'Button-content--default',
    text: 'text-body-sm lg:text-body'
  }
};

const THEMES = {
  light: 'Button-content--light',
  dark: 'Button-content--dark',
  brand: 'Button-content--brand',
  surface: 'Button-content--surface'
};

export default function Button({
  children,
  className,
  href,
  size = 'default',
  theme = 'light',
  icon = null,
  active = false,
  loading = false,
  disabled = false,
  onClick,
  ...rest
}) {
  let currentSize = SIZES[size] ?? SIZES.default;
  let currentTheme = THEMES[theme] ?? THEMES.light;
  let isDisabled = loading || disabled;
  
  let handleClick = useTransitionClick(href, {
    onClick
  });
  
  let innerContent = (
    <span
      className={cn(
        'Button-content',
        currentSize.content,
        currentTheme
      )}
    >
      {icon && !loading ? (
        <span className="Button-icon">
          {icon}
        </span>
      ) : null}
      
      {loading ? (
        <InlineLoader size={size === 'xs' ? '14' : '18'} color="currentColor" />
      ) : (
        <span className="Button-label">
          <span className="Button-slide">{children}</span>
          <span aria-hidden="true" className="Button-slide Button-slide--clone">
            {children}
          </span>
        </span>
      )}
    </span>
  );

  let wrapperClass = cn(
    'Button',
    currentSize.text,
    className
  );

  let dataActive = active ? 'true' : undefined;

  if (href) {
    return (
      <MenuTrigger
        href={href}
        className={wrapperClass}
        data-active={dataActive}
        aria-busy={loading || undefined}
        onClick={handleClick}
        {...rest}
      >
        {innerContent}
      </MenuTrigger>
    );
  }

  return (
    <button
      type="button"
      className={wrapperClass}
      data-active={dataActive}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...rest}
    >
      {innerContent}
    </button>
  );
}
