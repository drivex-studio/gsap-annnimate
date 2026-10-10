import { getPppKitEffectivePrice, PPP_KIT_PRICING } from './ppp'; 

import { usePppTier } from '@/hooks/usePppGeo'; 
export default function KitPrice({ kitSlug, fallback = null, struckClassName = '' }) {
  const pppTier = usePppTier();
  const effectivePrice = pppTier ? getPppKitEffectivePrice(kitSlug, pppTier) : null;

  if (effectivePrice == null) {
    return fallback;
  }

  const listPrice = PPP_KIT_PRICING[kitSlug]?.list;

  return (
    <span aria-label={`€${effectivePrice}, regularly €${listPrice}`}>
      €{effectivePrice}{' '}
      <s aria-hidden="true" className={struckClassName}>
        €{listPrice}
      </s>
    </span>
  );
}
