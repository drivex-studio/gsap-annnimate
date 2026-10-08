import React from 'react';

import { cn } from '@/libs/utils/className';
import { useTransitionClick } from '@/hooks/useTransitionClick';
import MenuTrigger from 'next/link';

export default function NavLink({
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
  ...rest
}) {
  let handleClick = useTransitionClick(href, {
    onClick
  });

  let Component = as || MenuTrigger;
  let isMenuTrigger = Component === MenuTrigger;

  let wrapperClassName = inline
    ? cn(
        'NavLink NavLink--inline',
        showIndicator ? 'is-indicatorVisible' : '',
        className
      )
    : cn('NavLink', className);

  let innerClassName = inline
    ? 'NavLink-label'
    : cn(
        'NavLink-label NavLink-label--slide',
        showIndicator && 'is-indicatorVisible'
      );

  return (
    <Component
      {...(isMenuTrigger ? { href, onClick: handleClick } : {})}
      onMouseEnter={onMouseEnter}
      data-active={active ? 'true' : undefined}
      className={wrapperClassName}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          'NavLink-indicator',
          inline ? 'NavLink-indicator--inline' : '',
          showIndicator ? 'is-indicatorVisible' : ''
        )}
      />
      <span className={innerClassName}>
        <span>{children}</span>
        {icon ? (
          <span aria-hidden="true" className="NavLink-icon">
            {icon}
          </span>
        ) : null}
      </span>
    </Component>
  );
}
