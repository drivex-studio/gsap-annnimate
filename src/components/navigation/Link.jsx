import { forwardRef } from 'react'; 5
import Link from 'next/link'; 
import { useTransitionClick } from '@/hooks/useTransitionClick'; 


const Link = forwardRef(function ({
  href,
  onClick,
  children,
  ...props
}, ref) {
  const handleClick = useTransitionClick(href, { onClick });

  return (
    <Link
      ref={ref}
      href={href}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
});

export default Link;

