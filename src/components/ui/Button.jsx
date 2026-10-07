import Link from "next/link"; 
import { cn } from "@/libs/utils/className"; 
import { useTransitionClick } from "@/hooks/useTransitionClick"; 
import { InlineLoader } from "@/components/ui/InlineLoader"; 

const SIZE_STYLES = {
  xs: {
    content: "h-24 px-8 lg:h-28 lg:px-10",
    text: "text-[13px] font-medium normal-case tracking-normal font-sans",
  },
  sm: {
    content: "h-32 px-10 lg:h-40 lg:px-14",
    text: "text-body-sm font-medium normal-case tracking-normal font-sans",
  },
  default: {
    content: "h-40 px-14 lg:h-48 lg:px-18",
    text: "text-body-sm lg:text-body font-medium normal-case tracking-normal font-sans",
  },
};

const THEME_STYLES = {
  light:
    "bg-foreground text-background group-hover:bg-[color-mix(in_srgb,var(--foreground),#000_10%)] group-data-[active=true]:bg-[color-mix(in_srgb,var(--foreground),#000_10%)]",
  dark:
    "bg-foreground text-background group-hover:bg-[color-mix(in_srgb,var(--foreground),#000_10%)] group-data-[active=true]:bg-[color-mix(in_srgb,var(--foreground),#000_10%)]",
  brand:
    "bg-brand text-[#141314] group-hover:bg-[color-mix(in_srgb,var(--brand),#000_10%)] group-data-[active=true]:bg-[color-mix(in_srgb,var(--brand),#000_10%)]",
  surface:
    "bg-surface text-foreground group-hover:bg-[color-mix(in_srgb,var(--surface),#000_10%)] group-data-[active=true]:bg-[color-mix(in_srgb,var(--surface),#000_10%)]",
};

export default function Button({
  children,
  className,
  href,
  size = "default",
  theme = "light",
  icon = null,
  active = false,
  loading = false,
  disabled = false,
  onClick,
  ...rest
}) {
  const sizeStyle = SIZE_STYLES[size] ?? SIZE_STYLES.default;
  const themeStyle = THEME_STYLES[theme] ?? THEME_STYLES.light;
  const isDisabled = loading || disabled;

  const handleClick = useTransitionClick(href, { onClick });

  const slideClass =
    "block transition-transform duration-(--duration-snap) ease-(--ease-expo-out) group-hover:-translate-y-full group-data-[active=true]:-translate-y-full";

  const content = (
    <span
      className={cn(
        "pointer-events-none flex w-full items-center justify-center",
        "transition-colors duration-(--duration-quick) ease-(--ease-expo-out)",
        sizeStyle.content,
        themeStyle
      )}
    >
      {icon && !loading ? (
        <span className="pointer-events-none mr-6 flex items-center">
          {icon}
        </span>
      ) : null}

      {loading ? (
        <InlineLoader
          size={size === "xs" ? "14" : "18"}
          color="currentColor"
        />
      ) : (
        <span className="relative block overflow-hidden">
          <span className={slideClass}>{children}</span>
          <span
            aria-hidden="true"
            className={cn("absolute left-0 top-full w-full", slideClass)}
          >
            {children}
          </span>
        </span>
      )}
    </span>
  );

  const rootClass = cn(
    sizeStyle.text,
    "group inline-flex min-w-0 shrink-0 cursor-pointer items-center justify-center",
    "whitespace-nowrap outline-none",
    "transition-transform duration-(--duration-quick) ease-(--ease-back-out)",
    "hover:scale-[0.95] data-[active=true]:scale-[0.95] disabled:hover:scale-100",
    "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2",
    "disabled:cursor-default",
    className
  );

  const dataActive = active ? "true" : undefined;

  if (href) {
    return (
      <Link
        href={href}
        className={rootClass}
        data-active={dataActive}
        aria-busy={loading || undefined}
        onClick={handleClick}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={rootClass}
      data-active={dataActive}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...rest}
    >
      {content}
    </button>
  );
}
