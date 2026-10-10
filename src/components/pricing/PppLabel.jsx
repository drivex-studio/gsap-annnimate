"use client";
import { useRef, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Info } from 'lucide-react';
import { translate, translate as t } from '@/libs/utils/i18n';
import { getPppDiscountPercent } from '@/components/pricing/utils/ppp';
import { 
  Tooltip, 
  TooltipProvider,
  TooltipTrigger,
  TooltipContent 
} from '@/components/ui/Tooltip'; 
import { usePppGeo } from '@/hooks/usePppGeo';

function getCountryName(code) {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || null;
  } catch {
    return null;
  }
}

function FlagImage({ code, size = 20, className = '' }) {
  const normalizedCode = typeof code === 'string' && /^[A-Za-z]{2}$/.test(code) 
    ? code.toLowerCase() 
    : null;
    
  if (!normalizedCode) return null;
  
  const height = Math.round(0.75 * size);
  
  return (
    <img
      src={`https://flagcdn.com/w40/${normalizedCode}.png`}
      srcSet={`https://flagcdn.com/w80/${normalizedCode}.png 2x`}
      width={size}
      height={height}
      alt={getCountryName(normalizedCode.toUpperCase()) || normalizedCode.toUpperCase()}
      loading="lazy"
      decoding="async"
      style={{ width: size, height: height }}
      className={`inline-block shrink-0 border border-foreground/10 object-cover align-middle ${className}`}
    />
  );
}

function usePppNotice() {
  const geoData = usePppGeo();
  if (!geoData?.tier) return null;
  
  const countryName = getCountryName(geoData.country);
  return countryName 
    ? t('pricing.tiers.pppNotice', { country: countryName })
    : t('pricing.tiers.pppNoticeGeneric');
}

export function PppLabel({ className = '', tone = 'dark' }) {
  const notice = usePppNotice();
  const geoData = usePppGeo();

  if (!notice) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild={true}>
          <button
            type="button"
            className={`text-mono-sm inline-flex items-center gap-6 text-brand ${className}`}
          >
            <FlagImage code={geoData?.country} size={16} />
            {translate('pricing.tiers.pppName')}
            <Info size={13} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={10}
          className={
            tone === 'light'
              ? 'w-[320px] max-w-[90vw] border border-foreground/10 bg-background p-16 text-foreground'
              : 'w-[320px] max-w-[90vw] border-0 bg-foreground p-16 text-background'
          }
        >
          <p className={`text-mono-sm m-0 flex items-center gap-8 ${tone === 'light' ? 'text-foreground' : 'text-background'}`}>
            <FlagImage code={geoData?.country} size={16} />
            {getCountryName(geoData?.country)
              ? t('pricing.tiers.pppTipTitle', { country: getCountryName(geoData.country) })
              : t('pricing.tiers.pppName')}
            <span className="ml-auto whitespace-nowrap text-brand">
              {translate('pricing.tiers.pppTipPct', { pct: getPppDiscountPercent(geoData?.tier) })}
            </span>
          </p>
          <p className={`text-body-sm mt-8 font-sans normal-case leading-relaxed ${tone === 'light' ? 'text-foreground-muted' : 'text-background/75'}`}>
            {notice}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PppStrip() {
  const geoData = usePppGeo();
  const pathname = usePathname();
  const stripRef = useRef(null);
  const [theme, setTheme] = useState('dark');
  
  const showStrip = (pathname === '/' || pathname === '/pricing') && !!geoData?.tier;

  useEffect(() => {
    if (!showStrip) return;
    const themeElement = document.querySelector('main [data-theme]');
    setTheme(themeElement?.dataset.theme === 'dark' ? 'light' : 'dark');
  }, [showStrip, pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const strip = stripRef.current;
    
    if (!showStrip || !strip) {
      root.style.removeProperty('--anm-ppp-offset');
      return;
    }

    let frameId = 0;
    const updateOffset = () => {
      frameId = 0;
      const offset = Math.max(0, strip.offsetHeight - (window.scrollY || 0));
      root.style.setProperty('--anm-ppp-offset', `${offset}px`);
    };
    
    const requestUpdate = () => {
      if (!frameId) {
        frameId = requestAnimationFrame(updateOffset);
      }
    };

    updateOffset();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(requestUpdate) : null;
    observer?.observe(strip);

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      observer?.disconnect();
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      root.style.removeProperty('--anm-ppp-offset');
    };
  }, [showStrip]);

  if (!showStrip) return null;

  const countryName = getCountryName(geoData.country);
  const discountPct = getPppDiscountPercent(geoData.tier);

  return (
    <div
      ref={stripRef}
      data-testid="ppp-banner"
      data-theme={theme}
      className="relative z-[301] w-full bg-background text-foreground"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-4 px-16 py-10 text-center">
        <p className="text-mono-sm m-0 inline-flex items-center gap-10">
          <FlagImage code={geoData.country} size={20} />
          {countryName
            ? t('pricing.tiers.pppBanner', { country: countryName })
            : t('pricing.tiers.pppName')}
        </p>
        <p className="text-body-sm m-0 text-foreground-muted">
          {translate('pricing.tiers.pppBannerBody', { pct: discountPct })}
        </p>
        <button
          type="button"
          onClick={() => {
            const target = document.querySelector(pathname === '/pricing' ? '#pricing-tiers' : '#pricing');
            if (!target) return;
            
            const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--v2-header-h')) || 72;
            const offset = -(headerHeight) - 24;
            
            if (window.lenis?.scrollTo) {
              window.lenis.scrollTo(target, { offset });
            } else {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="text-mono-sm text-foreground underline underline-offset-4 transition-colors duration-(--duration-quick) hover:text-brand"
        >
          {translate('pricing.tiers.pppBannerCta')}
        </button>
      </div>
    </div>
  );
}

export default function PppNotice({ className = '', align = 'center' }) {
  const notice = usePppNotice();
  const geoData = usePppGeo();

  if (!notice) return null;

  return (
    <aside className={`flex ${align === 'start' ? 'justify-start' : 'justify-center'} ${className}`}>
      <div className="flex max-w-[560px] flex-col gap-8 border border-foreground/10 bg-surface px-20 py-16">
        <p className="text-mono-sm flex items-center gap-8 text-brand">
          <span aria-hidden="true" className="inline-block size-8 bg-brand" />
          {translate('pricing.tiers.pppName')}
          <FlagImage code={geoData?.country} size={16} />
        </p>
        <p className="text-body-sm text-foreground-muted">{notice}</p>
      </div>
    </aside>
  );
}
