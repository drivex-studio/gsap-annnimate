import { analytics } from '@/libs/utils/analytics'; 
import AnimatedButton from '@/animations/components/AnimatedButton'; 
import { usePppTier } from '@/hooks/usePppGeo'; 

export default function CheckoutButton({
  priceId,
  kitSlug,
  kitTitle,
  size,
  theme = 'brand',
  className = '',
  label = 'Get the Kit'
}) {
  const canCheckout = !!priceId && !!kitSlug;
  const pppTier = usePppTier();

  return (
    <AnimatedButton
      href={canCheckout ? `/checkout?kit=${kitSlug}` : undefined}
      onClick={() => {
        analytics.track?.('kit_checkout_cta_clicked', {
          kit: kitTitle,
          ...(pppTier ? { ppp_tier: pppTier } : {})
        });
      }}
      theme={theme}
      size={size || 'default'}
      className={className}
      disabled={!canCheckout}
    >
      {label}
    </AnimatedButton>
  );
}
