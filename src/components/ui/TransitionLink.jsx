import { forwardRef } from 'react';
import Link from 'next/link';
import { useTransitionClick } from '@/hooks/useTransitionClick';

const TransitionLink = forwardRef(function TransitionLink({
  href,
  onClick,
  children,
  ...props
}, ref) {

  const handleTransitionClick = useTransitionClick(href, {
    onClick: onClick
  });

  return (
    <Link 
      ref={ref} 
      href={href} 
      onClick={handleTransitionClick} 
      {...props}
    >
      {children}
    </Link>
  );
});

export default TransitionLink;