import Link from 'next/link';
import { cn } from '@/libs/utils/className';
import { useTransitionClick } from '@/hooks/useTransitionClick';

export default function ({
  href,
  children,
  className,
  onMouseEnter,
  onClick,
  active = false,
  icon,
  as: d_as,
  inline = false,
  showIndicator = false,
  ...rest
}) {
  const h_handleClick = useTransitionClick(href, { onClick });
  const G_Tag = d_as || Link;
  const x_isNextLink = G_Tag === Link;
  const v_rootClass = inline
    ? cn(
        'group relative inline-flex items-baseline align-baseline',
        'transition-[padding-left,color] duration-500 ease-power3-out',
        showIndicator ? 'pl-[1.4em]' : 'pl-0',
        'hover:pl-[1.4em] data-[active=true]:pl-[1.4em]',
        className
      )
    : cn('group relative inline-flex w-fit items-center', className);
  const A_labelClass = inline
    ? 'pointer-events-none inline-flex items-center'
    : cn(
        'pointer-events-none inline-flex items-center transition-transform duration-500 ease-power3-out',
        showIndicator && 'translate-x-[1.5em]',
        'group-hover:translate-x-[1.5em]',
        'group-data-[active=true]:translate-x-[1.5em]'
      );

  return (
    <G_Tag
      {...(x_isNextLink ? { href, onClick: h_handleClick } : {})}
      onMouseEnter={onMouseEnter}
      data-active={active ? 'true' : undefined}
      className={v_rootClass}
      {...rest}
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
      <span className={A_labelClass}>
        <span>{children}</span>
        {icon ? (
          <span aria-hidden="true" className="ml-[0.5em] inline-flex shrink-0 items-center">
            {icon}
          </span>
        ) : null}
      </span>
    </G_Tag>
  );
}
