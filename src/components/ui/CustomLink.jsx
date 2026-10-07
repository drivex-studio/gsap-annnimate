// CustomLink.jsx
import React from 'react'; // module id: 843476
import Link from 'next/link'; // module id: 522016

import { cn } from '@/libs/utils/className'; // module id: 103746
import { useTransitionClick } from '@/hooks/useTransitionClick'; // module id: 995289

/* --- CustomLink --- */
// module id: 520237
export default function CustomLink({
  href,
  children,
  className,
  onMouseEnter,
  onClick,
  active = false,
  icon,
  as,
  inline = false,
  showIndicator = false,
  ...restProps
}) {
  const handleTransitionClick = useTransitionClick(href, { onClick });
  const Component = as || Link;
  const isDefaultLink = Component === Link;

  const wrapperClassName = inline
    ? cn(
        'group relative inline-flex items-baseline align-baseline',
        'transition-[padding-left,color] duration-500 ease-power3-out',
        showIndicator ? 'pl-[1.4em]' : 'pl-0',
        'hover:pl-[1.4em] data-[active=true]:pl-[1.4em]',
        className
      )
    : cn('group relative inline-flex w-fit items-center', className);

  const contentClassName = inline
    ? 'pointer-events-none inline-flex items-center'
    : cn(
        'pointer-events-none inline-flex items-center transition-transform duration-500 ease-power3-out',
        showIndicator && 'translate-x-[1.5em]',
        'group-hover:translate-x-[1.5em]',
        'group-data-[active=true]:translate-x-[1.5em]'
      );

  return (
    <Component
      {...(isDefaultLink ? { href, onClick: handleTransitionClick } : {})}
      onMouseEnter={onMouseEnter}
      data-active={active ? 'true' : undefined}
      className={wrapperClassName}
      {...restProps}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 my-auto size-[0.75em] -translate-y-[0.05em] bg-brand',
          inline ? 'left-[0.25em]' : 'left-0',
          showIndicator ? 'rotate-0 scale-100' : '-rotate-90 scale-0',
          'transition-transform duration-500 ease-out-back',
          'group-hover:rotate-0 group-hover:scale-100',
          'group-data-[active=true]:rotate-0 group-data-[active=true]:scale-100'
        )}
      />
      <span className={contentClassName}>
        <span>{children}</span>
        {icon ? (
          <span aria-hidden="true" className="ml-[0.5em] inline-flex shrink-0 items-center">
            {icon}
          </span>
        ) : null}
      </span>
    </Component>
  );
}