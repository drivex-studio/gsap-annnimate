import { analytics } from '@/libs/utils/analytics'; 
import Button from '@/components/ui/Button'; 
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
    <Button
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
    </Button>
  );
}