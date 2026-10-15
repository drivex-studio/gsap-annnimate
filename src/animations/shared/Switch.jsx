import { cn } from '@/libs/utils/className';

function getTrackClass(disabled, checked) {
  if (disabled) return 'cursor-not-allowed border-foreground/15 bg-foreground/10';
  if (checked) return 'cursor-pointer border-brand bg-brand';
  return 'cursor-pointer border-foreground/25 bg-transparent hover:border-foreground/45';
}

function getKnobClass(disabled, checked) {
  if (disabled) return 'translate-x-[22px] bg-foreground/40';
  if (checked) return 'translate-x-[22px] bg-background';
  return 'translate-x-[2px] bg-foreground/70 group-hover/switch:bg-foreground';
}

export default function Switch({
  checked,
  disabled = false,
  onChange,
  label,
  className,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      data-state={checked ? 'on' : 'off'}
      className={cn(
        'group/switch relative inline-flex h-24 w-44 shrink-0 items-center border transition-colors duration-(--duration-quick) ease-(--ease-expo-out)',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
        getTrackClass(disabled, checked),
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'block size-16 transition-transform duration-(--duration-quick) ease-(--ease-expo-out)',
          getKnobClass(disabled, checked),
        )}
      />
    </button>
  );
}
