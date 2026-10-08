import React, { forwardRef } from 'react';
import { useTransitionClick } from '@/hooks/useTransitionClick';
import MenuTrigger from 'next/link';

const Link = forwardRef(function Link({
  href,
  onClick,
  children,
  ...rest
}, ref) {
  let handleClick = useTransitionClick(href, {
    onClick
  });

  return (
    <MenuTrigger
      ref={ref}
      href={href}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </MenuTrigger>
  );
});

export default Link;
