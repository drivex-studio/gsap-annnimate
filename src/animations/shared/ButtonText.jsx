import { cn } from '@/libs/utils/className';

const SLIDE_TEXT_CLASS =
  'block transition-transform duration-(--duration-snap) ease-(--ease-expo-out) group-hover:-translate-y-full group-data-[active=true]:-translate-y-full';

export default function ButtonText({ children, className }) {
  return (
    <span className={cn('relative block overflow-hidden', className)}>
      <span className={SLIDE_TEXT_CLASS}>{children}</span>
      <span
        aria-hidden="true"
        className={cn('absolute left-0 top-full w-full', SLIDE_TEXT_CLASS)}
      >
        {children}
      </span>
    </span>
  );
}
